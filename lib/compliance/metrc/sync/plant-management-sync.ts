/**
 * Plant Management Sync Service
 *
 * Handles Metrc evaluation Steps 2-4:
 * - Step 2: Create packages from mother plant (no count reduction)
 * - Step 3: Create packages from plant batch (reduces count)
 * - Step 4: Change growth phase (creates individual plants)
 *
 * Respects Open Loop vs Closed Loop state configurations for tracking modes.
 */

import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import { createMetrcClientForSite } from '../services'
import {
  getStatePlantBatchConfig,
  checkTaggingRequirement,
  isOpenLoopState,
} from '@/lib/jurisdiction/plant-batch-config'
import type { MetrcPlantBatchPackage, MetrcPlantBatchGrowthPhaseChange } from '../types'

// ===== RESULT TYPES =====

export interface PackageCreationResult {
  success: boolean
  packageId?: string
  metrcPackageTag?: string
  plantCount: number
  errors: string[]
  warnings: string[]
  syncLogId?: string
}

export interface GrowthPhaseChangeResult {
  success: boolean
  plantsCreated: number
  tagsAssigned: string[]
  errors: string[]
  warnings: string[]
  syncLogId?: string
}

// ===== HELPER FUNCTIONS =====

/**
 * Format date for Metrc API (YYYY-MM-DD)
 */
function formatDateForMetrc(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toISOString().split('T')[0]
}

// ===== STEP 3: CREATE PACKAGES FROM BATCH (REDUCES COUNT) =====

/**
 * Create clone packages from a plant batch (reduces batch count)
 *
 * Metrc Step 3: POST /plantbatches/v2/packages
 */
export async function createPackagesFromBatch(params: {
  batchId: string
  packageTag: string
  plantCount: number
  itemName: string
  location?: string | null
  sublocation?: string | null
  packageDate: string
  isTradeSample?: boolean
  isDonation?: boolean
  patientLicenseNumber?: string | null
  note?: string
  userId: string
}): Promise<PackageCreationResult> {
  const supabase = await createClient()
  const result: PackageCreationResult = {
    success: false,
    plantCount: params.plantCount,
    errors: [],
    warnings: [],
  }

  try {
    // Get batch with site info
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select(`
        id,
        batch_number,
        plant_count,
        organization_id,
        site_id,
        site:sites(metrc_license_number)
      `)
      .eq('id', params.batchId)
      .single()

    if (batchError || !batch) {
      throw new Error(`Batch not found: ${batchError?.message || 'Unknown error'}`)
    }

    // Validate plant count
    if (params.plantCount > (batch.plant_count || 0)) {
      throw new Error(`Cannot package ${params.plantCount} plants - batch only has ${batch.plant_count}`)
    }

    // Get Metrc batch mapping
    const { data: mapping } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_batch_id, metrc_batch_name')
      .eq('batch_id', params.batchId)
      .single()

    if (!mapping?.metrc_batch_name) {
      throw new Error('Batch is not synced to Metrc. Push batch to Metrc first.')
    }

    // Create sync log
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: batch.organization_id,
      site_id: batch.site_id,
      sync_type: 'plant_package',
      direction: 'push',
      operation: 'create_package_from_batch',
      local_id: params.batchId,
      initiated_by: params.userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    await updateSyncLogEntry(syncLog.id, { status: 'in_progress' })

    // Get Metrc client
    const { client: metrcClient, error: credError } = await createMetrcClientForSite(batch.site_id, supabase)

    if (credError || !metrcClient) {
      throw new Error(credError || 'Failed to get Metrc credentials')
    }

    // Build Metrc payload
    const packagePayload: MetrcPlantBatchPackage = {
      PlantBatch: mapping.metrc_batch_name,
      Count: params.plantCount,
      Location: params.location || null,
      Sublocation: params.sublocation || null,
      Item: params.itemName,
      Tag: params.packageTag,
      PatientLicenseNumber: params.patientLicenseNumber || null,
      Note: params.note,
      IsTradeSample: params.isTradeSample || false,
      IsDonation: params.isDonation || false,
      ActualDate: formatDateForMetrc(params.packageDate),
    }

    // Call Metrc API
    await metrcClient.plantBatches.createPackages([packagePayload])

    // Create local plant_packages record
    const { data: plantPackage, error: insertError } = await supabase
      .from('plant_packages')
      .insert({
        organization_id: batch.organization_id,
        site_id: batch.site_id,
        source_plant_batch_id: params.batchId,
        metrc_package_tag: params.packageTag,
        item_name: params.itemName,
        plant_count: params.plantCount,
        location_name: params.location,
        sublocation: params.sublocation,
        is_from_mother: false,
        is_trade_sample: params.isTradeSample || false,
        is_donation: params.isDonation || false,
        packaged_date: params.packageDate,
        notes: params.note,
        patient_license_number: params.patientLicenseNumber,
        metrc_sync_status: 'synced',
        metrc_synced_at: new Date().toISOString(),
        created_by: params.userId,
      })
      .select()
      .single()

    if (insertError) {
      result.warnings.push(`Metrc sync succeeded but local record failed: ${insertError.message}`)
    } else {
      result.packageId = plantPackage.id
    }

    result.metrcPackageTag = params.packageTag

    // Update batch plant count (reduce by packaged amount)
    await supabase
      .from('batches')
      .update({
        plant_count: (batch.plant_count || 0) - params.plantCount,
        untracked_plant_count: (batch.plant_count || 0) - params.plantCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.batchId)

    // Update sync log
    await updateSyncLogEntry(syncLog.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        package_tag: params.packageTag,
        plant_count: params.plantCount,
        item_name: params.itemName,
      },
    })

    result.success = true
    return result
  } catch (error) {
    const errorMessage = (error as Error).message

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

// ===== STEP 2: CREATE PACKAGES FROM MOTHER (NO COUNT REDUCTION) =====

/**
 * Create clone packages from mother plant (does NOT reduce batch count)
 *
 * Metrc Step 2: POST /plantbatches/v2/packages/frommotherplant
 */
export async function createPackagesFromMother(params: {
  batchId: string
  packageTag: string
  plantCount: number
  itemName: string
  location?: string | null
  sublocation?: string | null
  packageDate: string
  isTradeSample?: boolean
  isDonation?: boolean
  patientLicenseNumber?: string | null
  note?: string
  userId: string
}): Promise<PackageCreationResult> {
  const supabase = await createClient()
  const result: PackageCreationResult = {
    success: false,
    plantCount: params.plantCount,
    errors: [],
    warnings: [],
  }

  try {
    // Get batch with site info
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select(`
        id,
        batch_number,
        plant_count,
        organization_id,
        site_id
      `)
      .eq('id', params.batchId)
      .single()

    if (batchError || !batch) {
      throw new Error(`Batch not found: ${batchError?.message || 'Unknown error'}`)
    }

    // Get Metrc batch mapping
    const { data: mapping } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_batch_id, metrc_batch_name')
      .eq('batch_id', params.batchId)
      .single()

    if (!mapping?.metrc_batch_name) {
      throw new Error('Batch is not synced to Metrc. Push batch to Metrc first.')
    }

    // Create sync log
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: batch.organization_id,
      site_id: batch.site_id,
      sync_type: 'plant_package',
      direction: 'push',
      operation: 'create_package_from_mother',
      local_id: params.batchId,
      initiated_by: params.userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    await updateSyncLogEntry(syncLog.id, { status: 'in_progress' })

    // Get Metrc client
    const { client: metrcClient, error: credError } = await createMetrcClientForSite(batch.site_id, supabase)

    if (credError || !metrcClient) {
      throw new Error(credError || 'Failed to get Metrc credentials')
    }

    // Build Metrc payload
    const packagePayload: MetrcPlantBatchPackage = {
      PlantBatch: mapping.metrc_batch_name,
      Count: params.plantCount,
      Location: params.location || null,
      Sublocation: params.sublocation || null,
      Item: params.itemName,
      Tag: params.packageTag,
      PatientLicenseNumber: params.patientLicenseNumber || null,
      Note: params.note,
      IsTradeSample: params.isTradeSample || false,
      IsDonation: params.isDonation || false,
      ActualDate: formatDateForMetrc(params.packageDate),
    }

    // Call Metrc API - frommotherplant endpoint (does NOT reduce count)
    await metrcClient.plantBatches.createPackagesFromMother([packagePayload])

    // Create local plant_packages record
    const { data: plantPackage, error: insertError } = await supabase
      .from('plant_packages')
      .insert({
        organization_id: batch.organization_id,
        site_id: batch.site_id,
        source_plant_batch_id: params.batchId,
        metrc_package_tag: params.packageTag,
        item_name: params.itemName,
        plant_count: params.plantCount,
        location_name: params.location,
        sublocation: params.sublocation,
        is_from_mother: true, // Key difference - marks as from mother
        is_trade_sample: params.isTradeSample || false,
        is_donation: params.isDonation || false,
        packaged_date: params.packageDate,
        notes: params.note,
        patient_license_number: params.patientLicenseNumber,
        metrc_sync_status: 'synced',
        metrc_synced_at: new Date().toISOString(),
        created_by: params.userId,
      })
      .select()
      .single()

    if (insertError) {
      result.warnings.push(`Metrc sync succeeded but local record failed: ${insertError.message}`)
    } else {
      result.packageId = plantPackage.id
    }

    result.metrcPackageTag = params.packageTag

    // NOTE: Do NOT reduce batch plant count for mother plant packages

    // Update sync log
    await updateSyncLogEntry(syncLog.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        package_tag: params.packageTag,
        plant_count: params.plantCount,
        item_name: params.itemName,
        is_from_mother: true,
      },
    })

    result.success = true
    return result
  } catch (error) {
    const errorMessage = (error as Error).message

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

// ===== STEP 4: CHANGE GROWTH PHASE (CREATES INDIVIDUAL PLANTS) =====

/**
 * Change growth phase for plants in batch (creates individual plants)
 *
 * Metrc Step 4: POST /plantbatches/v2/growthphase
 * This converts batch-level tracking to individual plant tracking
 */
export async function changeBatchGrowthPhase(params: {
  batchId: string
  plantCount: number
  startingTag: string
  newPhase: 'Vegetative' | 'Flowering'
  location: string
  sublocation?: string
  phaseDate: string
  userId: string
}): Promise<GrowthPhaseChangeResult> {
  const supabase = await createClient()
  const result: GrowthPhaseChangeResult = {
    success: false,
    plantsCreated: 0,
    tagsAssigned: [],
    errors: [],
    warnings: [],
  }

  try {
    // Get batch with cultivar info
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select(`
        id,
        batch_number,
        plant_count,
        untracked_plant_count,
        organization_id,
        site_id,
        cultivar:cultivars(id, name)
      `)
      .eq('id', params.batchId)
      .single()

    if (batchError || !batch) {
      throw new Error(`Batch not found: ${batchError?.message || 'Unknown error'}`)
    }

    const untrackedCount = batch.untracked_plant_count ?? batch.plant_count ?? 0

    // Validate plant count
    if (params.plantCount > untrackedCount) {
      throw new Error(
        `Cannot transition ${params.plantCount} plants - only ${untrackedCount} untracked plants available`
      )
    }

    // Get Metrc batch mapping
    const { data: mapping } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_batch_id, metrc_batch_name')
      .eq('batch_id', params.batchId)
      .single()

    if (!mapping?.metrc_batch_name) {
      throw new Error('Batch is not synced to Metrc. Push batch to Metrc first.')
    }

    // Get site state configuration for tracking mode rules
    const { data: site } = await supabase
      .from('sites')
      .select('state_province')
      .eq('id', batch.site_id)
      .single()

    const stateCode = site?.state_province || 'OR' // Default to Oregon if not set
    const stateConfig = getStatePlantBatchConfig(stateCode)

    // Check if this phase change requires tagging based on state rules
    const taggingCheck = checkTaggingRequirement(stateCode, {
      stage: params.newPhase.toLowerCase(),
    })

    if (taggingCheck.requiresTags && taggingCheck.reason) {
      result.warnings.push(`${stateCode} state rule: ${taggingCheck.reason}`)
    }

    // For Closed Loop states, growth phase changes always create individual tracked plants
    const isClosedLoop = !isOpenLoopState(stateCode)
    if (isClosedLoop) {
      result.warnings.push(
        `${stateCode} is a Closed Loop state. Growth phase changes create individually tracked plants.`
      )
    }

    // Create sync log
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: batch.organization_id,
      site_id: batch.site_id,
      sync_type: 'plant_growth_phase',
      direction: 'push',
      operation: 'batch_growth_phase_change',
      local_id: params.batchId,
      initiated_by: params.userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    await updateSyncLogEntry(syncLog.id, { status: 'in_progress' })

    // Get Metrc client
    const { client: metrcClient, error: credError } = await createMetrcClientForSite(batch.site_id, supabase)

    if (credError || !metrcClient) {
      throw new Error(credError || 'Failed to get Metrc credentials')
    }

    // Build Metrc payload
    const phaseChangePayload: MetrcPlantBatchGrowthPhaseChange = {
      Name: mapping.metrc_batch_name,
      Count: params.plantCount,
      StartingTag: params.startingTag,
      GrowthPhase: params.newPhase,
      NewLocation: params.location,
      NewSubLocation: params.sublocation,
      GrowthDate: formatDateForMetrc(params.phaseDate),
    }

    // Call Metrc API
    await metrcClient.plantBatches.changeGrowthPhase([phaseChangePayload])

    // Generate expected tag assignments (Metrc assigns sequentially)
    // Note: This is an approximation - Metrc may skip unavailable tags
    const assignedTags: string[] = []
    const tagPrefix = params.startingTag.slice(0, -4) // Assuming 4-digit suffix
    const startNum = parseInt(params.startingTag.slice(-4), 10)

    for (let i = 0; i < params.plantCount; i++) {
      const tagNum = (startNum + i).toString().padStart(4, '0')
      assignedTags.push(tagPrefix + tagNum)
    }

    result.tagsAssigned = assignedTags

    // Create local plants records
    // Handle cultivar data - Supabase may return as array or single object
    const cultivarRaw = batch.cultivar as unknown
    const cultivarData = Array.isArray(cultivarRaw)
      ? (cultivarRaw[0] as { id: string; name: string } | undefined)
      : (cultivarRaw as { id: string; name: string } | null)
    const plantsToInsert = assignedTags.map((tag, index) => ({
      organization_id: batch.organization_id,
      site_id: batch.site_id,
      plant_batch_id: params.batchId,
      metrc_tag: tag,
      strain_name: cultivarData?.name || 'Unknown',
      cultivar_id: cultivarData?.id || null,
      growth_phase: params.newPhase,
      location_name: params.location,
      sublocation: params.sublocation || null,
      planted_date: params.phaseDate,
      vegetative_date: params.newPhase === 'Vegetative' ? params.phaseDate : null,
      flowering_date: params.newPhase === 'Flowering' ? params.phaseDate : null,
      phase_changed_at: new Date().toISOString(),
      status: 'active',
      created_by: params.userId,
    }))

    const { error: insertError } = await supabase.from('plants').insert(plantsToInsert)

    if (insertError) {
      result.warnings.push(`Metrc sync succeeded but local plant records failed: ${insertError.message}`)
    } else {
      result.plantsCreated = params.plantCount
    }

    // Update batch tracking counts
    const newTrackedCount = (batch.plant_count || 0) - untrackedCount + params.plantCount
    const newUntrackedCount = untrackedCount - params.plantCount

    // Determine tracking mode based on state config and plant counts
    // For closed loop states, once plants are individually tagged, tracking mode becomes closed_loop
    // For open loop states, the same logic applies - closed_loop when all plants are tracked
    const newTrackingMode = newUntrackedCount === 0 ? 'closed_loop' : 'open_loop'

    // Check if state allows mode switching
    if (stateConfig && !stateConfig.allowModeSwitch && newTrackingMode !== stateConfig.defaultTrackingMode) {
      result.warnings.push(
        `${stateCode} does not typically allow tracking mode changes. Current mode: ${newTrackingMode}`
      )
    }

    await supabase
      .from('batches')
      .update({
        tracked_plant_count: newTrackedCount,
        untracked_plant_count: newUntrackedCount,
        tracking_mode: newTrackingMode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.batchId)

    // Update Metrc batch mapping with new growth phase
    await supabase
      .from('metrc_batch_mappings')
      .update({
        metrc_growth_phase: params.newPhase,
        last_synced_at: new Date().toISOString(),
      })
      .eq('batch_id', params.batchId)

    // Update sync log
    await updateSyncLogEntry(syncLog.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        plants_created: params.plantCount,
        starting_tag: params.startingTag,
        new_phase: params.newPhase,
        location: params.location,
        tags_assigned: assignedTags,
        state_code: stateCode,
        is_closed_loop_state: isClosedLoop,
        new_tracking_mode: newTrackingMode,
        tracked_count: newTrackedCount,
        untracked_count: newUntrackedCount,
      },
    })

    result.success = true
    return result
  } catch (error) {
    const errorMessage = (error as Error).message

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
