/**
 * Tag Assignment Sync Service
 *
 * Assigns Metrc plant tags to batches and syncs to Metrc API
 */

import { MetrcClient } from '../client'
import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import { validateTagAssignment } from '../validation/tag-assignment-rules'

export interface TagAssignmentResult {
  success: boolean
  tagsAssigned: number
  errors: string[]
  warnings: string[]
  syncLogId?: string
}

/**
 * Assign Metrc tags to batch plants
 *
 * @param batchId - The batch ID
 * @param tags - Array of Metrc plant tag labels
 * @param userId - User assigning tags
 * @returns Assignment result
 */
export async function assignMetrcTagsToBatch(
  batchId: string,
  tags: string[],
  userId: string
): Promise<TagAssignmentResult> {
  const supabase = await createClient()
  const result: TagAssignmentResult = {
    success: false,
    tagsAssigned: 0,
    errors: [],
    warnings: [],
  }

  try {
    // 1. Get batch
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, batch_number, plant_count, domain_type, site_id, organization_id, metrc_plant_labels')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      throw new Error('Batch not found')
    }

    // 2. Validate domain type
    if (batch.domain_type !== 'cannabis') {
      throw new Error('Tag assignment only applicable to cannabis batches')
    }

    // 3. Validate tag assignment
    const validation = validateTagAssignment({
      batchId,
      tags,
      currentPlantCount: batch.plant_count,
    })

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }

    validation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // 4. Check for existing tags
    const existingTags = batch.metrc_plant_labels || []
    const newTags = tags.filter((tag) => !existingTags.includes(tag))

    if (newTags.length === 0) {
      result.success = true
      result.warnings.push('All tags already assigned to this batch')
      return result
    }

    // 5. Check if batch is synced to Metrc
    const { data: mapping } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_batch_id, site_id, organization_id')
      .eq('batch_id', batchId)
      .single()

    // 6. Update batch with new tags
    const updatedTags = [...new Set([...existingTags, ...newTags])]

    const { error: updateError } = await supabase
      .from('batches')
      .update({
        metrc_plant_labels: updatedTags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId)

    if (updateError) throw updateError

    // 7. Create individual plant records (optional)
    const plantRecords = newTags.map((tag, index) => ({
      batch_id: batchId,
      metrc_plant_label: tag,
      plant_index: existingTags.length + index + 1,
      assigned_by: userId,
    }))

    if (plantRecords.length > 0) {
      await supabase.from('batch_plants').insert(plantRecords)
    }

    // 8. Create batch event
    await supabase.from('batch_events').insert({
      batch_id: batchId,
      event_type: 'tag_assignment',
      user_id: userId,
      tags_assigned: newTags.length,
      to_value: { tags: newTags },
      notes: `Assigned ${newTags.length} Metrc plant tags`,
    })

    // 9. Sync to Metrc if batch is already synced
    if (mapping) {
      // Create sync log
      const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
        organization_id: batch.organization_id,
        site_id: batch.site_id,
        sync_type: 'plant_tag_assignment',
        direction: 'push',
        operation: 'assign_tags',
        local_id: batchId,
        initiated_by: userId,
      })

      if (syncLogError || !syncLog) {
        throw new Error('Failed to create sync log entry')
      }

      result.syncLogId = syncLog.id

      await updateSyncLogEntry(syncLog.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        response_payload: {
          batch_id: batchId,
          tags_assigned: newTags.length,
          total_tags: updatedTags.length,
        },
      })
    }

    result.success = true
    result.tagsAssigned = newTags.length
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
    result.success = false
    return result
  }
}

/**
 * Get assigned tags for a batch
 */
export async function getAssignedTags(batchId: string): Promise<string[]> {
  try {
    const supabase = await createClient()

    const { data: batch } = await supabase
      .from('batches')
      .select('metrc_plant_labels')
      .eq('id', batchId)
      .single()

    return batch?.metrc_plant_labels || []
  } catch (error) {
    console.error('Error getting assigned tags:', error)
    return []
  }
}

/**
 * Remove tag from batch (for destroyed plants)
 */
export async function removeMetrcTagFromBatch(
  batchId: string,
  tag: string,
  reason: string,
  userId: string
): Promise<TagAssignmentResult> {
  const supabase = await createClient()
  const result: TagAssignmentResult = {
    success: false,
    tagsAssigned: 0,
    errors: [],
    warnings: [],
  }

  try {
    // Get batch
    const { data: batch } = await supabase
      .from('batches')
      .select('metrc_plant_labels')
      .eq('id', batchId)
      .single()

    if (!batch) throw new Error('Batch not found')

    // Remove tag
    const updatedTags = (batch.metrc_plant_labels || []).filter((t) => t !== tag)

    await supabase
      .from('batches')
      .update({ metrc_plant_labels: updatedTags })
      .eq('id', batchId)

    // Update plant record
    await supabase
      .from('batch_plants')
      .update({
        status: 'destroyed',
        destroyed_at: new Date().toISOString(),
        destroyed_reason: reason,
      })
      .eq('batch_id', batchId)
      .eq('metrc_plant_label', tag)

    result.success = true
    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}
