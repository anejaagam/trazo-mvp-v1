/**
 * Batch Growth Phase Sync Service
 *
 * Auto-syncs TRAZO batch stage transitions to Metrc growth phase changes
 */

import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import {
  validateStageTransitionForMetrc,
  mapStageToMetrcPhase,
  requiresMetrcPhaseChange,
  type MetrcGrowthPhase,
} from '../validation/phase-transition-rules'
import { createMetrcClientForSite } from '../services'
import type { BatchStage } from '@/types/batch'
import type { MetrcPlantGrowthPhaseChange } from '../types'

export interface PhaseTransitionSyncResult {
  success: boolean
  synced: boolean
  errors: string[]
  warnings: string[]
  syncLogId?: string
  newMetrcPhase?: MetrcGrowthPhase
}

/**
 * Sync batch stage transition to Metrc growth phase change
 *
 * @param batchId - The batch ID
 * @param currentStage - Current TRAZO stage
 * @param newStage - New TRAZO stage
 * @param userId - User making the transition
 * @param newLocation - Metrc location name (required for phase changes)
 * @param notes - Optional transition notes
 * @returns Sync result
 */
export async function syncBatchPhaseTransitionToMetrc(
  batchId: string,
  currentStage: BatchStage,
  newStage: BatchStage,
  userId: string,
  newLocation?: string,
  notes?: string
): Promise<PhaseTransitionSyncResult> {
  const supabase = await createClient()
  const result: PhaseTransitionSyncResult = {
    success: false,
    synced: false,
    errors: [],
    warnings: [],
  }

  try {
    // Check if this transition requires Metrc phase change
    if (!requiresMetrcPhaseChange(currentStage, newStage)) {
      // No sync needed - this is success, just not synced
      result.success = true
      result.synced = false
      result.warnings.push('Stage transition does not require Metrc phase change')
      return result
    }

    // Check if batch is synced to Metrc
    const { data: mapping, error: mappingError } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_batch_id, metrc_growth_phase, site_id, organization_id')
      .eq('batch_id', batchId)
      .single()

    if (mappingError || !mapping) {
      // Batch not synced to Metrc - skip phase sync
      result.success = true
      result.synced = false
      result.warnings.push('Batch is not synced to Metrc')
      return result
    }

    const transitionDate = new Date().toISOString().split('T')[0]

    // Get plant tags count and total plant count for validation
    const { data: batch } = await supabase
      .from('batches')
      .select('metrc_plant_labels, plant_count')
      .eq('id', batchId)
      .single()

    const plantTagsCount = batch?.metrc_plant_labels?.length || 0
    const totalPlantCount = batch?.plant_count || 0

    // Validate transition
    const validation = validateStageTransitionForMetrc({
      batchId,
      currentStage,
      newStage,
      currentMetrcPhase: mapping.metrc_growth_phase as MetrcGrowthPhase,
      transitionDate,
      plantTagsCount,
      totalPlantCount,
    })

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }

    // Collect warnings
    validation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    const newMetrcPhase = mapStageToMetrcPhase(newStage)
    if (!newMetrcPhase) {
      throw new Error(`Stage ${newStage} does not map to a Metrc growth phase`)
    }

    result.newMetrcPhase = newMetrcPhase

    // Get Metrc client for the site (uses new site-aware credential system)
    const { client: metrcClient, credentials, error: credError } = await createMetrcClientForSite(mapping.site_id, supabase)

    if (credError || !metrcClient || !credentials) {
      throw new Error(credError || 'Failed to get Metrc credentials for this site')
    }

    // Get pod location if not provided
    let metrcLocation = newLocation
    if (!metrcLocation) {
      // Try to get location from pod assignment
      const { data: podAssignment } = await supabase
        .from('batch_pod_assignments')
        .select('pod:pods(metrc_location_name)')
        .eq('batch_id', batchId)
        .is('removed_at', null)
        .single()

      const pod = podAssignment?.pod as { metrc_location_name?: string } | null
      if (pod?.metrc_location_name) {
        metrcLocation = pod.metrc_location_name
      }
    }

    if (!metrcLocation) {
      throw new Error(
        'Location is required for Metrc phase change. Ensure batch is assigned to a pod with Metrc location mapping.'
      )
    }

    // Create sync log
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: mapping.organization_id,
      site_id: mapping.site_id,
      sync_type: 'plant_growth_phase',
      direction: 'push',
      operation: 'change_growth_phase',
      local_id: batchId,
      initiated_by: userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    await updateSyncLogEntry(syncLog.id, {
      status: 'in_progress',
    })

    // Use plant labels from earlier batch query
    const plantLabels = batch?.metrc_plant_labels || []

    // If plants are tagged, use Metrc API to change individual plant phases
    if (plantLabels.length > 0) {
      // Build phase changes for each tagged plant
      const phaseChanges: MetrcPlantGrowthPhaseChange[] = plantLabels.map((label: string) => ({
        Label: label,
        NewLocation: metrcLocation,
        GrowthPhase: newMetrcPhase as 'Vegetative' | 'Flowering',
        GrowthDate: transitionDate,
      }))

      try {
        // Call Metrc API (batch operation, max 100 plants per request)
        // Process in batches of 100 if needed
        const batchSize = 100
        for (let i = 0; i < phaseChanges.length; i += batchSize) {
          const batch = phaseChanges.slice(i, i + batchSize)
          await metrcClient.plants.changeGrowthPhase(batch)
        }

        result.warnings.push(
          `${plantLabels.length} individual plants synced to Metrc for phase change.`
        )
      } catch (metrcApiError) {
        console.error('Metrc API phase change failed:', metrcApiError)
        result.warnings.push(
          `Metrc API call failed: ${(metrcApiError as Error).message}. Phase tracked locally.`
        )

        // Update sync log with partial failure
        await updateSyncLogEntry(syncLog.id, {
          status: 'partial',
          error_message: `Metrc API: ${(metrcApiError as Error).message}`,
        })
      }
    } else {
      // No tags assigned yet - just track phase locally
      result.warnings.push(
        'No plant tags assigned. Phase tracked locally. Assign tags to sync individual plants to Metrc.'
      )
    }

    // Update local metrc_growth_phase tracking
    await supabase
      .from('metrc_batch_mappings')
      .update({
        metrc_growth_phase: newMetrcPhase,
        last_synced_at: new Date().toISOString(),
      })
      .eq('batch_id', batchId)

    // Update sync log
    await updateSyncLogEntry(syncLog.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        metrc_batch_id: mapping.metrc_batch_id,
        old_phase: mapping.metrc_growth_phase,
        new_phase: newMetrcPhase,
        location: metrcLocation,
        plant_labels_count: plantLabels.length,
        note: notes || 'Phase transition synced from TRAZO stage change',
      },
    })

    result.success = true
    result.synced = true
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
 * Get the current Metrc growth phase for a batch
 */
export async function getBatchMetrcGrowthPhase(
  batchId: string
): Promise<MetrcGrowthPhase | null> {
  try {
    const supabase = await createClient()

    const { data: mapping } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_growth_phase')
      .eq('batch_id', batchId)
      .single()

    return (mapping?.metrc_growth_phase as MetrcGrowthPhase) || null
  } catch (error) {
    console.error('Error getting batch Metrc growth phase:', error)
    return null
  }
}

/**
 * Check if a batch stage transition will trigger Metrc phase sync
 */
export async function willTriggerMetrcPhaseSync(
  batchId: string,
  currentStage: BatchStage,
  newStage: BatchStage
): Promise<boolean> {
  try {
    // First check if transition requires phase change
    if (!requiresMetrcPhaseChange(currentStage, newStage)) {
      return false
    }

    // Check if batch is synced to Metrc
    const supabase = await createClient()
    const { data: mapping } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_batch_id')
      .eq('batch_id', batchId)
      .single()

    return !!mapping
  } catch (error) {
    return false
  }
}
