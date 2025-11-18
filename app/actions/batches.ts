'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { createWasteLog } from './waste'

interface DeleteBatchInput {
  batchId: string
  reason: string
  createWasteLog?: boolean // Optional flag to create waste log
  wasteDetails?: {
    disposal_method?: string
    rendering_method?: string
    witness_name?: string
  }
}

interface DeleteBatchResult {
  success: boolean
  error?: string
  wasteLogId?: string
}

/**
 * Server action to delete (soft delete) a batch
 * Requires batch:delete permission
 */
export async function deleteBatchAction(
  input: DeleteBatchInput
): Promise<DeleteBatchResult> {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: 'Failed to verify user permissions' }
    }

    // Check permission
    if (!canPerformAction(userData.role, 'batch:delete')) {
      return { success: false, error: 'You do not have permission to delete batches' }
    }

    // Verify batch belongs to user's organization and get details
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select(`
        id,
        organization_id,
        site_id,
        batch_number,
        plant_count,
        stage,
        cultivar:cultivars(name)
      `)
      .eq('id', input.batchId)
      .single()

    if (batchError || !batch) {
      return { success: false, error: 'Batch not found' }
    }

    if (batch.organization_id !== userData.organization_id) {
      return { success: false, error: 'Unauthorized access to batch' }
    }

    // Deactivate any active recipe activations for this batch
    const { data: batchActivations } = await supabase
      .from('recipe_activations')
      .select('id')
      .eq('scope_type', 'batch')
      .eq('scope_id', input.batchId)
      .eq('is_active', true)

    if (batchActivations && batchActivations.length > 0) {
      for (const activation of batchActivations) {
        await supabase.rpc('deactivate_recipe', {
          p_activation_id: activation.id,
          p_deactivated_by: user.id,
          p_reason: `Batch destroyed: ${input.reason}`,
        })
      }
    }

    // Remove all pod assignments from the batch
    const { error: removePodsError } = await supabase
      .from('batch_pod_assignments')
      .update({
        removed_at: new Date().toISOString(),
        removed_by: user.id,
        notes: `Batch destroyed: ${input.reason}`,
      })
      .eq('batch_id', input.batchId)
      .is('removed_at', null)

    if (removePodsError) {
      console.error('Error removing pod assignments:', removePodsError)
      // Don't fail the operation if this fails
    }

    // Perform soft delete - set status to 'destroyed'
    const { error: updateError } = await supabase
      .from('batches')
      .update({
        status: 'destroyed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.batchId)

    if (updateError) {
      console.error('Error deleting batch:', updateError)
      return { success: false, error: 'Failed to delete batch' }
    }

    // Log the deletion event with reason
    const { error: eventError } = await supabase
      .from('batch_events')
      .insert({
        batch_id: input.batchId,
        event_type: 'destruction',
        user_id: user.id,
        notes: `Batch destroyed. Reason: ${input.reason}`,
        metadata: {
          deletion_reason: input.reason,
          deleted_by: user.email,
          deleted_at: new Date().toISOString(),
        },
      })

    if (eventError) {
      console.error('Error logging batch deletion event:', eventError)
      // Don't fail the operation if logging fails
    }

    // Create waste log if requested (for compliance tracking)
    let wasteLogId: string | undefined
    if (input.createWasteLog && (batch.plant_count || 0) > 0) {
      const wasteResult = await createWasteLog({
        organization_id: batch.organization_id,
        site_id: batch.site_id,
        performed_by: user.id,

        // Source
        source_type: 'batch',
        source_id: batch.id,
        batch_id: batch.id,

        // Waste details
        waste_type: 'plant_material',
        reason: `Batch destruction: ${input.reason}`,
        quantity: batch.plant_count || 0,
        unit_of_measure: 'units',
        disposal_method: input.wasteDetails?.disposal_method as any || 'landfill',
        disposed_at: new Date().toISOString(),

        // Compliance (if provided)
        rendering_method: input.wasteDetails?.rendering_method as any,
        rendered_unusable: !!input.wasteDetails?.rendering_method,
        witness_name: input.wasteDetails?.witness_name || undefined,

        // Notes
        notes: `Automatic waste log created from batch ${batch.batch_number} destruction. ${Array.isArray(batch.cultivar) && batch.cultivar[0]?.name ? `Cultivar: ${batch.cultivar[0].name}` : ''}`,
      })

      if (wasteResult.success) {
        wasteLogId = wasteResult.wasteLogId
        console.log(`Created waste log ${wasteLogId} for batch ${batch.batch_number}`)
      } else {
        console.error('Failed to create waste log:', wasteResult.error)
        // Don't fail batch deletion if waste log creation fails
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/batches')
    revalidatePath('/dashboard/batches/active')
    revalidatePath('/dashboard/batches/all')
    revalidatePath('/dashboard/waste')

    return { success: true, wasteLogId }
  } catch (error) {
    console.error('Error in deleteBatchAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
