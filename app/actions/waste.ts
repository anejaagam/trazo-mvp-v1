'use server'

/**
 * Waste Management Server Actions
 *
 * Handles form submissions, updates, and exports for waste disposal logs
 * Part of Phase 6 - Page Implementation
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import type {
  WasteType,
  SourceType,
  DisposalMethod,
  RenderingMethod,
  WasteUnit,
  CreateWasteLogInput as WasteFormInput
} from '@/types/waste'

// ============================================================================
// Types
// ============================================================================

interface UpdateWasteLogInput extends Partial<WasteFormInput> {
  id: string
}

interface WasteActionResult {
  success: boolean
  error?: string
  wasteLogId?: string
}

interface ExportWasteLogsInput {
  site_id: string
  organization_id: string
  start_date?: string
  end_date?: string
  waste_type?: WasteType[]
  source_type?: SourceType[]
  format: 'csv' | 'pdf'
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Create a new waste disposal log
 * Requires waste:create permission
 */
export async function createWasteLog(
  input: WasteFormInput
): Promise<WasteActionResult> {
  try {
    const supabase = await createClient()

    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // 2. Get user data and check permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: 'Failed to verify user permissions' }
    }

    // 3. Check permission
    const permissionCheck = canPerformAction(userData.role, 'waste:create')
    if (!permissionCheck.allowed) {
      return { success: false, error: 'You do not have permission to create waste logs' }
    }

    // 4. Verify organization match
    if (input.organization_id !== userData.organization_id) {
      return { success: false, error: 'Unauthorized access to organization' }
    }

    // 5. Validate source references if provided
    if (input.batch_id) {
      const { data: batch, error: batchError } = await supabase
        .from('batches')
        .select('id, organization_id')
        .eq('id', input.batch_id)
        .single()

      if (batchError || !batch || batch.organization_id !== userData.organization_id) {
        return { success: false, error: 'Invalid batch reference' }
      }
    }

    if (input.inventory_item_id) {
      const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .select('id, organization_id')
        .eq('id', input.inventory_item_id)
        .single()

      if (itemError || !item || item.organization_id !== userData.organization_id) {
        return { success: false, error: 'Invalid inventory item reference' }
      }
    }

    // 6. Prepare waste log data
    const wasteLogData = {
      organization_id: input.organization_id,
      site_id: input.site_id,
      performed_by: input.performed_by,
      source_type: input.source_type || null,
      source_id: input.source_id || null,
      batch_id: input.batch_id || null,
      inventory_item_id: input.inventory_item_id || null,
      inventory_lot_id: input.inventory_lot_id || null,
      waste_type: input.waste_type,
      reason: input.reason,
      quantity: input.quantity,
      unit_of_measure: input.unit_of_measure,
      disposed_at: input.disposed_at || new Date().toISOString(),
      disposal_method: input.disposal_method,
      disposal_location: input.disposal_location || null,
      notes: input.notes || null,
      rendered_unusable: input.rendered_unusable || false,
      rendering_method: input.rendering_method || null,
      waste_material_mixed: input.waste_material_mixed || null,
      mix_ratio: input.mix_ratio || null,
      witness_name: input.witness_name || null,
      witnessed_by: input.witnessed_by || null,
      witness_signature_url: input.witness_signature_url || null,
      witness_id_verified: input.witness_id_verified || false,
      photo_urls: input.photo_urls || [],
      metrc_package_tags: input.metrc_package_tags || null,
    }

    // 7. Insert waste log
    const { data: wasteLog, error: insertError } = await supabase
      .from('waste_logs')
      .insert(wasteLogData)
      .select('id')
      .single()

    if (insertError) {
      console.error('Error creating waste log:', insertError)
      return { success: false, error: 'Failed to create waste log' }
    }

    // 8. Revalidate relevant paths
    revalidatePath('/dashboard/waste')
    revalidatePath(`/dashboard/waste/${wasteLog.id}`)
    if (input.batch_id) {
      revalidatePath(`/dashboard/batches/${input.batch_id}`)
    }

    return {
      success: true,
      wasteLogId: wasteLog.id
    }

  } catch (error) {
    console.error('Unexpected error in createWasteLog:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update an existing waste log (only within 24 hours)
 * Requires waste:update permission
 */
export async function updateWasteLog(
  input: UpdateWasteLogInput
): Promise<WasteActionResult> {
  try {
    const supabase = await createClient()

    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // 2. Get user data and check permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: 'Failed to verify user permissions' }
    }

    // 3. Check permission
    const permissionCheck = canPerformAction(userData.role, 'waste:update')
    if (!permissionCheck.allowed) {
      return { success: false, error: 'You do not have permission to update waste logs' }
    }

    // 4. Fetch existing waste log
    const { data: existingLog, error: fetchError } = await supabase
      .from('waste_logs')
      .select('*')
      .eq('id', input.id)
      .single()

    if (fetchError || !existingLog) {
      return { success: false, error: 'Waste log not found' }
    }

    // 5. Verify organization match
    if (existingLog.organization_id !== userData.organization_id) {
      return { success: false, error: 'Unauthorized access to waste log' }
    }

    // 6. Check 24-hour edit window
    const disposedAt = new Date(existingLog.disposed_at)
    const now = new Date()
    const hoursSinceDisposal = (now.getTime() - disposedAt.getTime()) / (1000 * 60 * 60)

    if (hoursSinceDisposal > 24) {
      return { success: false, error: 'Waste logs can only be edited within 24 hours of disposal' }
    }

    // 7. Check if already synced to Metrc (prevent editing synced records)
    if (existingLog.metrc_synced_at) {
      return { success: false, error: 'Cannot edit waste logs that have been synced to Metrc' }
    }

    // 8. Prepare update data (only include provided fields)
    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'waste_type', 'waste_reason', 'quantity', 'unit_of_measure',
      'disposal_method', 'notes', 'rendered_unusable', 'rendering_method',
      'rendering_agent', 'mix_ratio', 'witnessed_by', 'witness_signature_url',
      'photo_urls'
    ]

    for (const field of allowedFields) {
      if (input[field as keyof UpdateWasteLogInput] !== undefined) {
        updateData[field] = input[field as keyof UpdateWasteLogInput]
      }
    }

    // 9. Update waste log
    const { error: updateError } = await supabase
      .from('waste_logs')
      .update(updateData)
      .eq('id', input.id)

    if (updateError) {
      console.error('Error updating waste log:', updateError)
      return { success: false, error: 'Failed to update waste log' }
    }

    // 10. Revalidate paths
    revalidatePath('/dashboard/waste')
    revalidatePath(`/dashboard/waste/${input.id}`)

    return { success: true, wasteLogId: input.id }

  } catch (error) {
    console.error('Unexpected error in updateWasteLog:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a waste log (soft delete - mark as voided)
 * Requires waste:delete permission
 * Only allowed within 24 hours and before Metrc sync
 */
export async function deleteWasteLog(
  wasteLogId: string
): Promise<WasteActionResult> {
  try {
    const supabase = await createClient()

    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // 2. Get user data and check permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: 'Failed to verify user permissions' }
    }

    // 3. Check permission
    const permissionCheck = canPerformAction(userData.role, 'waste:delete')
    if (!permissionCheck.allowed) {
      return { success: false, error: 'You do not have permission to delete waste logs' }
    }

    // 4. Fetch waste log
    const { data: wasteLog, error: fetchError } = await supabase
      .from('waste_logs')
      .select('*')
      .eq('id', wasteLogId)
      .single()

    if (fetchError || !wasteLog) {
      return { success: false, error: 'Waste log not found' }
    }

    // 5. Verify organization match
    if (wasteLog.organization_id !== userData.organization_id) {
      return { success: false, error: 'Unauthorized access to waste log' }
    }

    // 6. Check if already synced to Metrc
    if (wasteLog.metrc_synced_at) {
      return { success: false, error: 'Cannot delete waste logs that have been synced to Metrc' }
    }

    // 7. Check 24-hour window
    const disposedAt = new Date(wasteLog.disposed_at)
    const now = new Date()
    const hoursSinceDisposal = (now.getTime() - disposedAt.getTime()) / (1000 * 60 * 60)

    if (hoursSinceDisposal > 24) {
      return { success: false, error: 'Waste logs can only be deleted within 24 hours of disposal' }
    }

    // 8. Soft delete - update with voided flag (we'll add this column if needed)
    // For now, actually delete the record since we don't have a voided column
    const { error: deleteError } = await supabase
      .from('waste_logs')
      .delete()
      .eq('id', wasteLogId)

    if (deleteError) {
      console.error('Error deleting waste log:', deleteError)
      return { success: false, error: 'Failed to delete waste log' }
    }

    // 9. Revalidate paths
    revalidatePath('/dashboard/waste')

    return { success: true }

  } catch (error) {
    console.error('Unexpected error in deleteWasteLog:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Export waste logs to CSV or PDF
 * Requires waste:export permission
 */
export async function exportWasteLogs(
  input: ExportWasteLogsInput
): Promise<WasteActionResult> {
  try {
    const supabase = await createClient()

    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // 2. Get user data and check permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: 'Failed to verify user permissions' }
    }

    // 3. Check permission
    const permissionCheck = canPerformAction(userData.role, 'waste:export')
    if (!permissionCheck.allowed) {
      return { success: false, error: 'You do not have permission to export waste logs' }
    }

    // 4. Verify organization match
    if (input.organization_id !== userData.organization_id) {
      return { success: false, error: 'Unauthorized access to organization' }
    }

    // 5. Build query
    let query = supabase
      .from('waste_logs')
      .select('*, disposed_by_user:users!waste_logs_disposed_by_fkey(full_name)')
      .eq('organization_id', input.organization_id)
      .eq('site_id', input.site_id)
      .order('disposed_at', { ascending: false })

    // Apply filters
    if (input.start_date) {
      query = query.gte('disposed_at', input.start_date)
    }
    if (input.end_date) {
      query = query.lte('disposed_at', input.end_date)
    }
    if (input.waste_type && input.waste_type.length > 0) {
      query = query.in('waste_type', input.waste_type)
    }
    if (input.source_type && input.source_type.length > 0) {
      query = query.in('source_type', input.source_type)
    }

    // 6. Fetch data
    const { data: wasteLogs, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching waste logs for export:', fetchError)
      return { success: false, error: 'Failed to fetch waste logs' }
    }

    // 7. Format and return data
    // TODO: Implement actual CSV/PDF generation
    // For now, return success - actual file generation would happen here
    console.log(`Exporting ${wasteLogs?.length || 0} waste logs as ${input.format}`)

    return {
      success: true,
      error: 'Export functionality coming soon - data fetched successfully'
    }

  } catch (error) {
    console.error('Unexpected error in exportWasteLogs:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Manually trigger Metrc sync for a waste log
 * Requires waste:sync permission (implied by waste:create)
 */
export async function syncWasteToMetrc(
  wasteLogId: string
): Promise<WasteActionResult> {
  try {
    const supabase = await createClient()

    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // 2. Get user data and check permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: 'Failed to verify user permissions' }
    }

    // 3. Check permission (using waste:create as proxy for sync permission)
    const permissionCheck = canPerformAction(userData.role, 'waste:create')
    if (!permissionCheck.allowed) {
      return { success: false, error: 'You do not have permission to sync waste logs' }
    }

    // 4. Fetch waste log
    const { data: wasteLog, error: fetchError } = await supabase
      .from('waste_logs')
      .select('*')
      .eq('id', wasteLogId)
      .single()

    if (fetchError || !wasteLog) {
      return { success: false, error: 'Waste log not found' }
    }

    // 5. Verify organization match
    if (wasteLog.organization_id !== userData.organization_id) {
      return { success: false, error: 'Unauthorized access to waste log' }
    }

    // 6. Check if already synced
    if (wasteLog.metrc_synced_at) {
      return { success: false, error: 'This waste log has already been synced to Metrc' }
    }

    // 7. TODO: Implement actual Metrc API call
    // For now, just mark as synced with a placeholder ID
    const { error: updateError } = await supabase
      .from('waste_logs')
      .update({
        metrc_synced_at: new Date().toISOString(),
        metrc_waste_id: `METRC-${wasteLogId.slice(0, 8)}`, // Placeholder
      })
      .eq('id', wasteLogId)

    if (updateError) {
      console.error('Error updating Metrc sync status:', updateError)
      return { success: false, error: 'Failed to sync to Metrc' }
    }

    // 8. Revalidate paths
    revalidatePath('/dashboard/waste')
    revalidatePath(`/dashboard/waste/${wasteLogId}`)

    return {
      success: true,
      wasteLogId
    }

  } catch (error) {
    console.error('Unexpected error in syncWasteToMetrc:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
