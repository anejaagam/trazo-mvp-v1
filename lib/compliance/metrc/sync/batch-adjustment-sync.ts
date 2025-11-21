/**
 * Plant Count Adjustment Sync Service
 *
 * Auto-syncs plant count changes to Metrc
 */

import { MetrcClient } from '../client'
import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import { validatePlantCountAdjustment } from '../validation/batch-rules'
import type { MetrcPlantBatchAdjustment } from '../types'

export interface AdjustmentSyncResult {
  success: boolean
  synced: boolean
  errors: string[]
  warnings: string[]
  syncLogId?: string
}

/**
 * Map TRAZO adjustment reason to Metrc reason
 */
function mapAdjustmentReason(trazoReason: string): string {
  const reasonMap: Record<string, string> = {
    died: 'Died',
    destroyed_voluntary: 'Voluntary Destruction',
    destroyed_mandatory: 'Mandatory State Destruction',
    contamination: 'Contamination',
    pest_infestation: 'Infestation',
    unhealthy: 'Unhealthy or Infirm Plants',
    data_error: 'Error',
    other: 'Other',
  }

  return reasonMap[trazoReason] || 'Other'
}

/**
 * Sync plant count adjustment to Metrc
 *
 * @param batchId - The batch ID
 * @param oldCount - Previous plant count
 * @param newCount - New plant count
 * @param reason - Adjustment reason (TRAZO format)
 * @param userId - User making the adjustment
 * @param reasonNote - Optional detailed note
 * @returns Sync result
 */
export async function syncPlantCountAdjustmentToMetrc(
  batchId: string,
  oldCount: number,
  newCount: number,
  reason: string,
  userId: string,
  reasonNote?: string
): Promise<AdjustmentSyncResult> {
  const supabase = await createClient()
  const result: AdjustmentSyncResult = {
    success: false,
    synced: false,
    errors: [],
    warnings: [],
  }

  try {
    // Check if batch is synced to Metrc
    const { data: mapping, error: mappingError } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_batch_id, site_id, organization_id')
      .eq('batch_id', batchId)
      .single()

    if (mappingError || !mapping) {
      // Batch not synced to Metrc - skip adjustment sync
      result.success = true
      result.synced = false
      return result
    }

    // Get API keys
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('compliance_api_keys')
      .select('*')
      .eq('site_id', mapping.site_id)
      .eq('is_active', true)
      .single()

    if (apiKeyError || !apiKey) {
      throw new Error('No active Metrc API key found for this site')
    }

    // Map reason to Metrc format
    const metrcReason = mapAdjustmentReason(reason)
    const adjustmentDate = new Date().toISOString().split('T')[0]

    // Validate adjustment
    const validation = validatePlantCountAdjustment({
      batchId,
      oldCount,
      newCount,
      reason: metrcReason,
      adjustmentDate,
    })

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }

    // Collect warnings
    validation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // Create sync log
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: mapping.organization_id,
      site_id: mapping.site_id,
      sync_type: 'plant_batch_adjustments',
      direction: 'push',
      operation: 'adjust',
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

    // Initialize Metrc client
    const metrcClient = new MetrcClient({
      vendorApiKey: apiKey.vendor_api_key,
      userApiKey: apiKey.user_api_key,
      facilityLicenseNumber: apiKey.facility_license_number,
      state: apiKey.state_code,
      isSandbox: apiKey.is_sandbox,
    })

    // Build Metrc adjustment payload
    const countDifference = newCount - oldCount
    const adjustment: MetrcPlantBatchAdjustment = {
      Id: parseInt(mapping.metrc_batch_id),
      Count: countDifference, // Metrc uses delta, not absolute count
      AdjustmentReason: metrcReason,
      AdjustmentDate: adjustmentDate,
      ReasonNote: reasonNote,
    }

    // Push adjustment to Metrc
    await metrcClient.plantBatches.adjust([adjustment])

    // Update sync log
    await updateSyncLogEntry(syncLog.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        metrc_batch_id: mapping.metrc_batch_id,
        old_count: oldCount,
        new_count: newCount,
        adjustment_delta: countDifference,
      },
    })

    // Update mapping last synced timestamp
    await supabase
      .from('metrc_batch_mappings')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
      })
      .eq('batch_id', batchId)

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
