/**
 * Batch Push Sync Service
 *
 * Pushes TRAZO batches to Metrc as plant batches
 */

import { MetrcClient } from '../client'
import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import {
  validatePlantBatchCreate,
  validatePlantBatchCreateBatch,
  validateTrazoToMetrcBatchConversion,
} from '../validation/batch-rules'
import { validateBatchStrainForMetrc } from '../validation/strain-rules'
import type { MetrcPlantBatchCreate } from '../types'

export interface BatchPushResult {
  success: boolean
  batchesProcessed: number
  batchesCreated: number
  errors: string[]
  warnings: string[]
  syncLogId?: string
}

/**
 * Convert TRAZO batch to Metrc plant batch format
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
  location: string
): MetrcPlantBatchCreate {
  // Determine batch type based on source_type or stage
  let batchType: 'Seed' | 'Clone' = 'Clone'
  if (trazoBatch.source_type === 'seed' || trazoBatch.stage === 'germination') {
    batchType = 'Seed'
  }

  return {
    Name: trazoBatch.batch_number,
    Type: batchType,
    Count: trazoBatch.plant_count,
    Strain: trazoBatch.cultivar_name,
    Location: location,
    PlantedDate: formatDateForMetrc(trazoBatch.start_date),
  }
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
 * @returns Push result with statistics
 */
export async function pushBatchToMetrc(
  batchId: string,
  siteId: string,
  organizationId: string,
  userId: string,
  location: string
): Promise<BatchPushResult> {
  const supabase = await createClient()
  const result: BatchPushResult = {
    success: false,
    batchesProcessed: 0,
    batchesCreated: 0,
    errors: [],
    warnings: [],
  }

  try {
    // Get the batch with cultivar information
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select(`
        *,
        cultivar:cultivars(id, name, common_name)
      `)
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      throw new Error('Batch not found')
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

    // Validate TRAZO batch data
    const trazoBatch = {
      batch_number: batch.batch_number,
      plant_count: batch.plant_count,
      cultivar_name: batch.cultivar?.name || batch.cultivar?.common_name || '',
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

    // Validate strain is properly configured for Metrc
    const strainValidation = validateBatchStrainForMetrc({
      batch_number: trazoBatch.batch_number,
      cultivar_name: trazoBatch.cultivar_name,
      cultivar: batch.cultivar ? {
        name: batch.cultivar.name || batch.cultivar.common_name,
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

    // Get API keys for the site
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('compliance_api_keys')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .single()

    if (apiKeyError || !apiKey) {
      throw new Error('No active Metrc API key found for this site')
    }

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

    // Initialize Metrc client
    const metrcClient = new MetrcClient({
      vendorApiKey: apiKey.vendor_api_key,
      userApiKey: apiKey.user_api_key,
      facilityLicenseNumber: apiKey.facility_license_number,
      state: apiKey.state_code,
      isSandbox: apiKey.is_sandbox,
    })

    // Build Metrc plant batch payload
    const metrcBatch = convertTrazoToMetrcBatch(trazoBatch, location)

    // Validate Metrc batch data
    const metrcValidation = validatePlantBatchCreate(metrcBatch)
    if (!metrcValidation.isValid) {
      const errorMessages = metrcValidation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Metrc batch validation failed: ${errorMessages.join(', ')}`)
    }

    // Collect Metrc warnings
    metrcValidation.warnings.forEach((w) => {
      result.warnings.push(`Metrc: ${w.field}: ${w.message}`)
    })

    // Create plant batch in Metrc
    await metrcClient.plantBatches.create([metrcBatch])

    result.batchesProcessed = 1
    result.batchesCreated = 1

    // Fetch the created plant batch from Metrc to get its ID
    const metrcBatches = await metrcClient.plantBatches.listActive()
    const createdBatch = metrcBatches.find((b) => b.Name === metrcBatch.Name)

    if (createdBatch) {
      // Create mapping
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

      // Update batch with Metrc ID
      await supabase
        .from('batches')
        .update({
          metrc_batch_id: createdBatch.Id.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', batchId)

      // Update sync log with Metrc ID
      await updateSyncLogEntry(syncLog.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        response_payload: {
          metrc_batch_id: createdBatch.Id,
          metrc_batch_name: createdBatch.Name,
          metrc_batch_type: createdBatch.Type,
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
    return result
  } catch (error) {
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
