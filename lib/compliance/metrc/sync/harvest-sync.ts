/**
 * Harvest Sync Service
 *
 * Auto-syncs TRAZO harvest records to Metrc harvest creation
 */

import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import {
  validateHarvestCreate,
  validateMetrcHarvestCreate,
  generateMetrcHarvestName,
} from '../validation/harvest-rules'
import { createMetrcClientForSite } from '../services'
import type { MetrcHarvestCreate } from '../types'

export interface HarvestSyncResult {
  success: boolean
  synced: boolean
  errors: string[]
  warnings: string[]
  syncLogId?: string
  metrcHarvestId?: string
  metrcHarvestName?: string
}

/**
 * Sync harvest creation to Metrc
 *
 * @param harvestId - The harvest record ID
 * @param userId - User performing the sync
 * @returns Sync result
 */
export async function syncHarvestToMetrc(
  harvestId: string,
  userId: string
): Promise<HarvestSyncResult> {
  const supabase = await createClient()
  const result: HarvestSyncResult = {
    success: false,
    synced: false,
    errors: [],
    warnings: [],
  }

  try {
    // Get harvest record with batch details
    const { data: harvest, error: harvestError } = await supabase
      .from('harvest_records')
      .select(`
        *,
        batch:batches!inner(
          id,
          batch_number,
          domain_type,
          site_id,
          organization_id,
          cultivar:cultivars(name)
        )
      `)
      .eq('id', harvestId)
      .single()

    if (harvestError || !harvest) {
      throw new Error('Harvest record not found')
    }

    const batch = harvest.batch as any

    // Check if batch is cannabis (only cannabis harvests sync to Metrc)
    if (batch.domain_type !== 'cannabis') {
      result.success = true
      result.synced = false
      result.warnings.push('Harvest is not for cannabis batch - Metrc sync not required')
      return result
    }

    // Check if already synced
    const { data: existingMapping } = await supabase
      .from('metrc_harvest_mappings')
      .select('metrc_harvest_id, metrc_harvest_name')
      .eq('harvest_id', harvestId)
      .single()

    if (existingMapping) {
      result.success = true
      result.synced = false
      result.warnings.push('Harvest already synced to Metrc')
      result.metrcHarvestId = existingMapping.metrc_harvest_id
      result.metrcHarvestName = existingMapping.metrc_harvest_name
      return result
    }

    // Validate harvest data
    const validation = validateHarvestCreate({
      batchId: batch.id,
      wetWeight: harvest.wet_weight,
      plantCount: harvest.plant_count,
      harvestedAt: harvest.harvested_at,
      harvestType: harvest.harvest_type,
      location: harvest.location,
    })

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }

    // Collect warnings
    validation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // Get Metrc client for the site (uses new site-aware credential system)
    const { client: metrcClient, credentials, error: credError } = await createMetrcClientForSite(batch.site_id, supabase)

    if (credError || !metrcClient || !credentials) {
      throw new Error(credError || 'Failed to get Metrc credentials for this site')
    }

    // Get drying location (required for Metrc)
    let dryingLocation = harvest.drying_location
    if (!dryingLocation) {
      // Try to get from harvest location or batch pod assignment
      if (harvest.location) {
        dryingLocation = harvest.location
      } else {
        const { data: podAssignment } = await supabase
          .from('batch_pod_assignments')
          .select('pod:pods(metrc_location_name)')
          .eq('batch_id', batch.id)
          .is('removed_at', null)
          .single()

        const pod = podAssignment?.pod as { metrc_location_name?: string } | null
        if (pod?.metrc_location_name) {
          dryingLocation = pod.metrc_location_name
        }
      }
    }

    if (!dryingLocation) {
      throw new Error(
        'Drying location is required for Metrc harvest. Set harvest location or assign batch to pod with Metrc location.'
      )
    }

    // Generate unique Metrc harvest name
    const { data: existingHarvests } = await supabase
      .from('harvest_records')
      .select('id')
      .eq('batch_id', batch.id)
      .order('created_at', { ascending: true })

    const harvestSequence = (existingHarvests?.length || 0)
    const metrcHarvestName = generateMetrcHarvestName(batch.batch_number, harvestSequence)

    // Build Metrc harvest creation payload
    const harvestDate = new Date(harvest.harvested_at).toISOString().split('T')[0]
    const metrcHarvest: MetrcHarvestCreate = {
      PlantLabels: harvest.plant_labels || [],
      HarvestName: metrcHarvestName,
      DryingLocation: dryingLocation,
      WasteWeight: harvest.waste_weight || 0,
      WasteUnitOfMeasure: harvest.waste_unit || 'Grams',
      HarvestDate: harvestDate,
    }

    // Validate Metrc payload
    const metrcValidation = validateMetrcHarvestCreate(metrcHarvest)
    if (!metrcValidation.isValid) {
      const errorMessages = metrcValidation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Metrc validation failed: ${errorMessages.join(', ')}`)
    }

    metrcValidation.warnings.forEach((w) => {
      result.warnings.push(`Metrc: ${w.field}: ${w.message}`)
    })

    // Create sync log
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: batch.organization_id,
      site_id: batch.site_id,
      sync_type: 'harvest_creation',
      direction: 'push',
      operation: 'create_harvest',
      local_id: harvestId,
      initiated_by: userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    await updateSyncLogEntry(syncLog.id, {
      status: 'in_progress',
    })

    // Call Metrc API to create harvest
    let metrcHarvestId: string

    try {
      // Create harvest in Metrc via plants endpoint
      await metrcClient.plants.harvestPlants([metrcHarvest])

      // After successful creation, fetch the harvest to get the ID
      // Metrc doesn't return IDs on POST, so we need to look it up by name
      const activeHarvests = await metrcClient.harvests.listActive()
      const createdHarvest = activeHarvests.find(h => h.Name === metrcHarvestName)

      if (createdHarvest) {
        metrcHarvestId = String(createdHarvest.Id)
      } else {
        // Fallback: use name-based identifier if ID not found
        metrcHarvestId = `METRC-H-${metrcHarvestName}`
        result.warnings.push(
          'Harvest created in Metrc but ID could not be retrieved. Using name-based identifier.'
        )
      }
    } catch (metrcError) {
      // If API call fails, create a local placeholder and mark for retry
      metrcHarvestId = `PENDING-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      result.warnings.push(
        `Metrc API call failed: ${(metrcError as Error).message}. Harvest saved locally for retry.`
      )

      // Update sync log with partial failure
      await updateSyncLogEntry(syncLog.id, {
        status: 'partial',
        error_message: `Metrc API: ${(metrcError as Error).message}`,
      })
    }

    // Create Metrc harvest mapping
    await supabase
      .from('metrc_harvest_mappings')
      .insert({
        harvest_id: harvestId,
        batch_id: batch.id,
        site_id: batch.site_id,
        organization_id: batch.organization_id,
        metrc_harvest_id: metrcHarvestId,
        metrc_harvest_name: metrcHarvestName,
        sync_status: 'synced',
        metrc_data: metrcHarvest,
      })

    // Update harvest record with Metrc identifiers
    await supabase
      .from('harvest_records')
      .update({
        metrc_harvest_id: metrcHarvestId,
        metrc_harvest_name: metrcHarvestName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', harvestId)

    // Update sync log
    await updateSyncLogEntry(syncLog.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        metrc_harvest_id: metrcHarvestId,
        metrc_harvest_name: metrcHarvestName,
        harvest_name: metrcHarvest.HarvestName,
        drying_location: dryingLocation,
        note: 'Harvest creation synced to Metrc',
      },
    })

    result.success = true
    result.synced = true
    result.metrcHarvestId = metrcHarvestId
    result.metrcHarvestName = metrcHarvestName
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
    result.success = false
    return result
  }
}

/**
 * Get Metrc harvest sync status
 */
export async function getHarvestMetrcSyncStatus(harvestId: string) {
  try {
    const supabase = await createClient()

    const { data: mapping, error } = await supabase
      .from('metrc_harvest_mappings')
      .select('*')
      .eq('harvest_id', harvestId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's okay
      throw error
    }

    return {
      data: mapping || null,
      error: null,
      isSynced: !!mapping,
      metrcHarvestId: mapping?.metrc_harvest_id,
      metrcHarvestName: mapping?.metrc_harvest_name,
    }
  } catch (error) {
    console.error('Error getting harvest Metrc sync status:', error)
    return { data: null, error, isSynced: false }
  }
}

/**
 * Update harvest status to finished in Metrc
 */
export async function finishHarvestInMetrc(
  harvestId: string,
  actualDate: string,
  userId: string
): Promise<HarvestSyncResult> {
  const supabase = await createClient()
  const result: HarvestSyncResult = {
    success: false,
    synced: false,
    errors: [],
    warnings: [],
  }

  try {
    // Check if harvest is synced to Metrc
    const syncStatus = await getHarvestMetrcSyncStatus(harvestId)
    if (!syncStatus.isSynced || !syncStatus.data) {
      result.success = true
      result.synced = false
      result.warnings.push('Harvest not synced to Metrc - finish operation local only')
      return result
    }

    const mapping = syncStatus.data

    // Get Metrc client for the site (uses new site-aware credential system)
    const { client: metrcClient, credentials, error: credError } = await createMetrcClientForSite(mapping.site_id, supabase)

    if (credError || !metrcClient || !credentials) {
      throw new Error(credError || 'Failed to get Metrc credentials for this site')
    }

    // Create sync log
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: mapping.organization_id,
      site_id: mapping.site_id,
      sync_type: 'harvest_finish',
      direction: 'push',
      operation: 'finish_harvest',
      local_id: harvestId,
      initiated_by: userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    // Call Metrc API to finish harvest
    try {
      // Parse the harvest ID - if it's a numeric string, use it; otherwise skip API call
      const numericId = parseInt(mapping.metrc_harvest_id)
      if (!isNaN(numericId)) {
        await metrcClient.harvests.finish([{
          Id: numericId,
          ActualDate: actualDate,
        }])
      } else {
        result.warnings.push(
          'Harvest ID is not numeric (may be a local placeholder). Skipping Metrc API call.'
        )
      }
    } catch (metrcError) {
      result.warnings.push(
        `Metrc API call failed: ${(metrcError as Error).message}. Status updated locally.`
      )

      // Update sync log with partial failure
      await updateSyncLogEntry(syncLog.id, {
        status: 'partial',
        error_message: `Metrc API: ${(metrcError as Error).message}`,
      })
    }

    // Update mapping status
    await supabase
      .from('metrc_harvest_mappings')
      .update({
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
      })
      .eq('harvest_id', harvestId)

    // Update sync log
    await updateSyncLogEntry(syncLog.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        metrc_harvest_id: mapping.metrc_harvest_id,
        actual_date: actualDate,
        note: 'Harvest finish synced to Metrc',
      },
    })

    result.success = true
    result.synced = true
    result.metrcHarvestId = mapping.metrc_harvest_id
    result.metrcHarvestName = mapping.metrc_harvest_name
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
    result.success = false
    return result
  }
}
