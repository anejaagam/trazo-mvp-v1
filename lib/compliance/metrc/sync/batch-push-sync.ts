/**
 * Batch Push Sync Service
 *
 * Pushes TRAZO batches to Metrc as plant batches
 * Supports source traceability for Open Loop and Closed Loop tracking
 */

import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  validatePlantBatchCreate,
  validatePlantBatchCreateBatch,
  validateTrazoToMetrcBatchConversion,
} from '../validation/batch-rules'
import { validateBatchStrainForMetrc } from '../validation/strain-rules'
import { createMetrcClientForSite } from '../services'
import {
  requiresSourceTracking,
  isOpenLoopState,
  getPlantBatchCreateEndpoint,
  getStatePlantBatchConfig,
} from '@/lib/jurisdiction/plant-batch-config'
import type { MetrcPlantBatchCreate } from '../types'

/**
 * Source type for plant batch creation
 * - from_package: Created from seed/clone package (inventory)
 * - from_mother: Created by cloning mother plant
 * - no_source: No source tracking (if allowed by state)
 */
export type PlantBatchSourceType = 'from_package' | 'from_mother' | 'no_source'

/**
 * Source information for batch creation
 */
export interface BatchSourceInfo {
  type: PlantBatchSourceType
  packageTag?: string // Metrc package tag for from_package
  motherPlantTags?: string[] // Metrc plant tags for from_mother (can clone from multiple)
}

export interface BatchPushResult {
  success: boolean
  batchesProcessed: number
  batchesCreated: number
  errors: string[]
  warnings: string[]
  syncLogId?: string
  sourceType?: PlantBatchSourceType
}

/**
 * Convert TRAZO batch to Metrc plant batch format
 *
 * Note: Uses both ActualDate (v2 preferred) and PlantedDate (legacy) for compatibility
 */
function convertTrazoToMetrcBatch(
  trazoBatch: {
    batch_number: string
    plant_count: number
    cultivar_name: string
    start_date: string
    stage: string
    source_type?: string
  },
  location: string,
  sourceInfo?: BatchSourceInfo
): MetrcPlantBatchCreate {
  // Determine batch type based on source_type or stage
  let batchType: 'Seed' | 'Clone' = 'Clone'
  if (trazoBatch.source_type === 'seed' || trazoBatch.stage === 'germination') {
    batchType = 'Seed'
  }

  const formattedDate = formatDateForMetrc(trazoBatch.start_date)

  const batch: MetrcPlantBatchCreate = {
    Name: trazoBatch.batch_number,
    Type: batchType,
    Count: trazoBatch.plant_count,
    Strain: trazoBatch.cultivar_name,
    Location: location,
    // Use both date field formats for maximum compatibility
    ActualDate: formattedDate,
    PlantedDate: formattedDate,
  }

  // Add source tracking if provided (required by some states)
  if (sourceInfo?.type === 'from_package' && sourceInfo.packageTag) {
    batch.SourcePackage = sourceInfo.packageTag
  } else if (sourceInfo?.type === 'from_mother' && sourceInfo.motherPlantTags?.length) {
    batch.SourcePlants = sourceInfo.motherPlantTags
  }

  return batch
}

/**
 * Format date for Metrc API (YYYY-MM-DD)
 */
function formatDateForMetrc(dateString: string): string {
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

/**
 * Push a batch to Metrc as a plant batch
 *
 * @param batchId - The batch ID to push
 * @param siteId - The site ID
 * @param organizationId - The organization ID
 * @param userId - The user ID initiating the sync
 * @param location - The Metrc location/room name
 * @param sourceInfo - Optional source traceability information
 * @param supabaseClient - Optional authenticated Supabase client (recommended to pass from caller)
 * @returns Push result with statistics
 */
export async function pushBatchToMetrc(
  batchId: string,
  siteId: string,
  organizationId: string,
  userId: string,
  location: string,
  sourceInfo?: BatchSourceInfo,
  supabaseClient?: SupabaseClient
): Promise<BatchPushResult> {
  // Use provided client or create a new one (new one may have RLS issues in some contexts)
  const supabase = supabaseClient || await createClient()
  const result: BatchPushResult = {
    success: false,
    batchesProcessed: 0,
    batchesCreated: 0,
    errors: [],
    warnings: [],
  }

  try {
    console.log('[pushBatchToMetrc] Starting push for batch:', batchId)

    // Get the batch with cultivar information
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select(`
        *,
        cultivar:cultivars(id, name)
      `)
      .eq('id', batchId)
      .single()

    console.log('[pushBatchToMetrc] Batch query result:', { found: !!batch, error: batchError?.message })

    if (batchError || !batch) {
      throw new Error(`Batch not found: ${batchError?.message || 'no data'}`)
    }

    // Validate batch is cannabis domain
    if (batch.domain_type !== 'cannabis') {
      throw new Error('Only cannabis batches can be synced to Metrc')
    }

    // Check if already synced
    const { data: existingMapping } = await supabase
      .from('metrc_batch_mappings')
      .select('*')
      .eq('batch_id', batchId)
      .single()

    if (existingMapping) {
      throw new Error('Batch already synced to Metrc')
    }

    // Get site info to determine state for source tracking requirements
    const { data: site } = await supabase
      .from('sites')
      .select('state_province')
      .eq('id', siteId)
      .single()

    const stateCode = site?.state_province || 'OR' // Default to Oregon if not set

    // Determine effective source info from parameter or batch data
    let effectiveSourceInfo: BatchSourceInfo | undefined = sourceInfo

    // If no source info provided, try to get from batch data
    if (!effectiveSourceInfo) {
      if (batch.source_package_tag) {
        effectiveSourceInfo = {
          type: 'from_package',
          packageTag: batch.source_package_tag,
        }
      } else if (batch.source_mother_plant_tag) {
        effectiveSourceInfo = {
          type: 'from_mother',
          motherPlantTags: [batch.source_mother_plant_tag],
        }
      }
    }

    // Check if state is a Closed Loop state (cannot create batches "from thin air")
    const isClosedLoop = !isOpenLoopState(stateCode)
    const stateConfig = getStatePlantBatchConfig(stateCode)

    console.log('[pushBatchToMetrc] State configuration:', {
      stateCode,
      isClosedLoop,
      requiresSourceTracking: stateConfig?.requiresSourceTracking,
      hasSourceInfo: !!effectiveSourceInfo,
      sourceType: effectiveSourceInfo?.type || 'no_source',
    })

    // Closed Loop states MUST have a source (package or mother plant)
    if (isClosedLoop && (!effectiveSourceInfo || effectiveSourceInfo.type === 'no_source')) {
      throw new Error(
        `${stateCode} is a CLOSED LOOP state in Metrc and cannot create plant batches without a source. ` +
        'You must provide either:\n' +
        '1. A source package tag (for creating from seed/clone packages), or\n' +
        '2. A mother plant tag (for creating clones from existing plants).\n\n' +
        'To proceed, please ensure your batch has a source_package_tag or source_mother_plant_tag set.'
      )
    }

    // Additional check for states that require source tracking regardless of open/closed loop
    if (requiresSourceTracking(stateCode)) {
      if (!effectiveSourceInfo || effectiveSourceInfo.type === 'no_source') {
        throw new Error(
          `${stateCode} requires source traceability for plant batches. ` +
            'Please provide source package tag or mother plant tag.'
        )
      }
    }

    // Validate TRAZO batch data
    const trazoBatch = {
      batch_number: batch.batch_number,
      plant_count: batch.plant_count,
      cultivar_name: batch.cultivar?.name || '',
      start_date: batch.start_date,
      stage: batch.stage,
      domain_type: batch.domain_type,
      source_type: batch.source_type,
    }

    const trazoValidation = validateTrazoToMetrcBatchConversion(trazoBatch)
    if (!trazoValidation.isValid) {
      const errorMessages = trazoValidation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`TRAZO batch validation failed: ${errorMessages.join(', ')}`)
    }

    // Collect warnings
    trazoValidation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // Store source type in result for caller
    result.sourceType = effectiveSourceInfo?.type || 'no_source'

    // Validate strain is properly configured for Metrc
    const strainValidation = validateBatchStrainForMetrc({
      batch_number: trazoBatch.batch_number,
      cultivar_name: trazoBatch.cultivar_name,
      cultivar: batch.cultivar ? {
        name: batch.cultivar.name,
        metrc_strain_id: (batch.cultivar as any).metrc_strain_id || null,
      } : undefined,
    })

    // Strain validation issues are warnings (Metrc accepts string names)
    strainValidation.errors.forEach((e) => {
      result.warnings.push(`Strain: ${e.field}: ${e.message}`)
    })
    strainValidation.warnings.forEach((w) => {
      result.warnings.push(`Strain: ${w.field}: ${w.message}`)
    })

    console.log('[pushBatchToMetrc] Getting Metrc client for site:', siteId)

    // Get Metrc client for the site (uses new site-aware credential system)
    const { client: metrcClient, credentials, error: credError } = await createMetrcClientForSite(siteId, supabase)

    console.log('[pushBatchToMetrc] Metrc client result:', { hasClient: !!metrcClient, hasCredentials: !!credentials, error: credError })

    if (credError || !metrcClient || !credentials) {
      throw new Error(credError || 'Failed to get Metrc credentials for this site')
    }

    // Debug: Log the Metrc config (without sensitive keys)
    const config = metrcClient.getConfig()
    console.log('[pushBatchToMetrc] Metrc config:', {
      baseUrl: config.baseUrl,
      state: config.state,
      facilityLicenseNumber: config.facilityLicenseNumber,
      isSandbox: config.isSandbox,
    })

    // Validate credentials by fetching facilities first (helps catch 401 early)
    console.log('[pushBatchToMetrc] Validating Metrc credentials...')
    try {
      const isValid = await metrcClient.validateCredentials()
      if (!isValid) {
        throw new Error('Metrc credentials are invalid. Please check your API keys in the organization settings.')
      }
      console.log('[pushBatchToMetrc] Metrc credentials validated successfully')
    } catch (validationError) {
      console.error('[pushBatchToMetrc] Credential validation failed:', validationError)
      throw new Error(`Metrc authentication failed: ${validationError instanceof Error ? validationError.message : 'Unknown error'}. Please verify your API keys are correct and not expired.`)
    }

    console.log('[pushBatchToMetrc] Creating sync log entry...')

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: organizationId,
      site_id: siteId,
      sync_type: 'plant_batches',
      direction: 'push',
      operation: 'create',
      local_id: batchId,
      initiated_by: userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    // Update sync log to in_progress
    await updateSyncLogEntry(syncLog.id, {
      status: 'in_progress',
    })

    // Build Metrc plant batch payload (include source info for states that require it)
    const metrcBatch = convertTrazoToMetrcBatch(trazoBatch, location, effectiveSourceInfo)

    console.log('[pushBatchToMetrc] Metrc batch payload:', JSON.stringify(metrcBatch, null, 2))

    // Validate Metrc batch data
    const metrcValidation = validatePlantBatchCreate(metrcBatch)
    if (!metrcValidation.isValid) {
      const errorMessages = metrcValidation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Metrc batch validation failed: ${errorMessages.join(', ')}`)
    }

    console.log('[pushBatchToMetrc] Validation passed, creating plant batch in Metrc...')

    // Collect Metrc warnings
    metrcValidation.warnings.forEach((w) => {
      result.warnings.push(`Metrc: ${w.field}: ${w.message}`)
    })

    // Determine the correct endpoint based on state and source type
    const sourceTypeForEndpoint = effectiveSourceInfo?.type || 'no_source'
    const endpointInfo = getPlantBatchCreateEndpoint(stateCode, sourceTypeForEndpoint)

    console.log('[pushBatchToMetrc] Endpoint selection:', {
      stateCode,
      sourceType: sourceTypeForEndpoint,
      endpoint: endpointInfo.endpoint,
      requiresSource: endpointInfo.requiresSource,
      description: endpointInfo.description,
    })

    // Create plant batch in Metrc using appropriate endpoint based on source
    try {
      if (effectiveSourceInfo?.type === 'from_mother' && effectiveSourceInfo.motherPlantTags?.length) {
        // Create from mother plants using POST /plants/v2/plantings
        console.log('[pushBatchToMetrc] Creating from mother plants using /plants/v2/plantings...')
        // Note: This endpoint requires the plant tag in a different format
        await metrcClient.plantBatches.createFromPlantings([metrcBatch])
        result.warnings.push(
          `Created from mother plant(s): ${effectiveSourceInfo.motherPlantTags.join(', ')}`
        )
      } else if (effectiveSourceInfo?.type === 'from_package' && effectiveSourceInfo.packageTag) {
        // Create from package using POST /packages/v2/plantings
        console.log('[pushBatchToMetrc] Creating from package using /packages/v2/plantings...')
        await metrcClient.plantBatches.create([metrcBatch])
        result.warnings.push(`Created from source package: ${effectiveSourceInfo.packageTag}`)
      } else {
        // No source - only works for Open Loop states
        if (isClosedLoop) {
          // This shouldn't happen due to earlier validation, but double-check
          throw new Error(
            `Cannot create plant batch without source in ${stateCode} (Closed Loop state). ` +
            'Please provide a source package tag or mother plant tag.'
          )
        }
        console.log('[pushBatchToMetrc] Creating plant batch directly (Open Loop state)...')
        await metrcClient.plantBatches.create([metrcBatch])
      }
      console.log('[pushBatchToMetrc] Plant batch created successfully in Metrc')
    } catch (metrcError) {
      console.error('[pushBatchToMetrc] Metrc API error:', metrcError)
      const errorMsg = metrcError instanceof Error ? metrcError.message : 'Unknown error'

      // Provide helpful context for common errors
      if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        throw new Error(
          `Metrc authentication failed (401). Please verify:\n` +
          `1. Your Metrc API keys are correct and not expired\n` +
          `2. Your user has sufficient permissions in Metrc\n` +
          `3. The facility license number matches your credentials`
        )
      }
      if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
        throw new Error(
          `Metrc endpoint not found (404). This may be because:\n` +
          `1. ${stateCode} is a Closed Loop state and requires a source package/plant\n` +
          `2. The endpoint ${endpointInfo.endpoint} is not available for this state\n` +
          `Original error: ${errorMsg}`
        )
      }

      throw new Error(`Metrc API error: ${errorMsg}`)
    }

    result.batchesProcessed = 1
    result.batchesCreated = 1

    // Fetch the created plant batch from Metrc to get its ID
    const metrcBatches = await metrcClient.plantBatches.listActive()
    const createdBatch = metrcBatches.find((b) => b.Name === metrcBatch.Name)

    if (createdBatch) {
      // Create mapping with source tracking info
      await supabase.from('metrc_batch_mappings').insert({
        organization_id: organizationId,
        site_id: siteId,
        batch_id: batchId,
        metrc_batch_id: createdBatch.Id.toString(),
        metrc_batch_name: createdBatch.Name,
        metrc_batch_type: createdBatch.Type,
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
      })

      // Update batch with Metrc ID and source tracking info
      const batchUpdate: Record<string, any> = {
        metrc_batch_id: createdBatch.Id.toString(),
        updated_at: new Date().toISOString(),
      }

      // Store source tracking info in batch if provided
      if (effectiveSourceInfo?.type === 'from_package' && effectiveSourceInfo.packageTag) {
        batchUpdate.source_package_tag = effectiveSourceInfo.packageTag
      } else if (effectiveSourceInfo?.type === 'from_mother' && effectiveSourceInfo.motherPlantTags?.length) {
        batchUpdate.source_mother_plant_tag = effectiveSourceInfo.motherPlantTags[0]
      }

      await supabase.from('batches').update(batchUpdate).eq('id', batchId)

      // Update sync log with Metrc ID and source info
      await updateSyncLogEntry(syncLog.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        response_payload: {
          metrc_batch_id: createdBatch.Id,
          metrc_batch_name: createdBatch.Name,
          metrc_batch_type: createdBatch.Type,
          source_type: effectiveSourceInfo?.type || 'no_source',
          source_package_tag: effectiveSourceInfo?.packageTag,
          source_mother_plant_tags: effectiveSourceInfo?.motherPlantTags,
        },
      })
    } else {
      // Batch created but couldn't find it (rare edge case)
      await updateSyncLogEntry(syncLog.id, {
        status: 'partial',
        completed_at: new Date().toISOString(),
        error_message: 'Plant batch created but not found in Metrc listing',
      })
      result.errors.push('Plant batch created but verification failed')
    }

    result.success = result.errors.length === 0
    console.log('[pushBatchToMetrc] Push completed successfully')
    return result
  } catch (error) {
    console.error('[pushBatchToMetrc] Error caught:', error)
    const errorMessage = (error as Error).message

    // Update sync log to failed
    if (result.syncLogId) {
      await updateSyncLogEntry(result.syncLogId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
    }

    result.errors.push(errorMessage)
    return result
  }
}

/**
 * Push multiple batches to Metrc
 *
 * @param batchIds - Array of batch IDs to push
 * @param siteId - The site ID
 * @param organizationId - The organization ID
 * @param userId - The user ID initiating the sync
 * @param location - The Metrc location/room name
 * @returns Push result with statistics
 */
export async function pushBatchesToMetrc(
  batchIds: string[],
  siteId: string,
  organizationId: string,
  userId: string,
  location: string
): Promise<BatchPushResult> {
  const aggregateResult: BatchPushResult = {
    success: true,
    batchesProcessed: 0,
    batchesCreated: 0,
    errors: [],
    warnings: [],
  }

  for (const batchId of batchIds) {
    const result = await pushBatchToMetrc(batchId, siteId, organizationId, userId, location)
    aggregateResult.batchesProcessed += result.batchesProcessed
    aggregateResult.batchesCreated += result.batchesCreated
    aggregateResult.errors.push(...result.errors)
    aggregateResult.warnings.push(...result.warnings)
  }

  aggregateResult.success = aggregateResult.errors.length === 0
  return aggregateResult
}

/**
 * Get sync status for a batch
 *
 * @param batchId - The batch ID
 * @returns Sync status information
 */
export async function getBatchSyncStatus(batchId: string): Promise<{
  isSynced: boolean
  metrcBatchId?: string
  metrcBatchName?: string
  lastSyncedAt?: string
  syncStatus?: string
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data: mapping } = await supabase
      .from('metrc_batch_mappings')
      .select('*')
      .eq('batch_id', batchId)
      .single()

    if (mapping) {
      return {
        isSynced: true,
        metrcBatchId: mapping.metrc_batch_id,
        metrcBatchName: mapping.metrc_batch_name,
        lastSyncedAt: mapping.last_synced_at,
        syncStatus: mapping.sync_status,
      }
    }

    return { isSynced: false }
  } catch (error) {
    return {
      isSynced: false,
      error: (error as Error).message,
    }
  }
}
