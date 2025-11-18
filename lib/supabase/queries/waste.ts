/**
 * Waste Management Database Queries (Server-Side)
 * 
 * CRUD operations for waste_logs table with compliance tracking and Metrc integration
 * Server-side only - use waste-client.ts for client components
 */

import { createClient } from '@/lib/supabase/server'
import type {
  WasteLog,
  WasteLogWithRelations,
  CreateWasteLogInput,
  UpdateWasteLogInput,
  WasteLogFilters,
  WasteSummary,
  MonthlyWaste,
  QueryResult,
} from '@/types/waste'

// ============================================================================
// CORE CRUD OPERATIONS
// ============================================================================

/**
 * Get all waste logs for a site with optional filtering
 */
export async function getWasteLogs(
  siteId: string,
  filters?: WasteLogFilters
): Promise<QueryResult<WasteLogWithRelations[]>> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('waste_logs')
      .select(`
        *,
        performer:users!waste_logs_performed_by_fkey(id, full_name, email),
        witness:users!waste_logs_witnessed_by_fkey(id, full_name, email),
        batch:batches(id, batch_number, cultivar:cultivars(name)),
        inventory_item:inventory_items(id, name, sku),
        inventory_lot:inventory_lots(id, lot_code)
      `)
      .eq('site_id', siteId)
      .order('disposed_at', { ascending: false })

    // Apply filters
    if (filters?.waste_type && filters.waste_type.length > 0) {
      query = query.in('waste_type', filters.waste_type)
    }

    if (filters?.source_type && filters.source_type.length > 0) {
      query = query.in('source_type', filters.source_type)
    }

    if (filters?.disposal_method && filters.disposal_method.length > 0) {
      query = query.in('disposal_method', filters.disposal_method)
    }

    if (filters?.date_range) {
      query = query
        .gte('disposed_at', filters.date_range.start)
        .lte('disposed_at', filters.date_range.end)
    }

    if (filters?.batch_id) {
      query = query.eq('batch_id', filters.batch_id)
    }

    if (filters?.inventory_item_id) {
      query = query.eq('inventory_item_id', filters.inventory_item_id)
    }

    if (filters?.performed_by) {
      query = query.eq('performed_by', filters.performed_by)
    }

    if (filters?.witnessed_by) {
      query = query.eq('witnessed_by', filters.witnessed_by)
    }

    if (filters?.rendered_unusable !== undefined) {
      query = query.eq('rendered_unusable', filters.rendered_unusable)
    }

    if (filters?.has_photos) {
      query = query.not('photo_urls', 'is', null)
    }

    if (filters?.metrc_sync_status && filters.metrc_sync_status.length > 0) {
      query = query.in('metrc_sync_status', filters.metrc_sync_status)
    }

    if (filters?.search) {
      query = query.or(
        `notes.ilike.%${filters.search}%,reason.ilike.%${filters.search}%,witness_name.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query

    if (error) throw error
    return { data: data as WasteLogWithRelations[], error: null }
  } catch (error) {
    console.error('Error in getWasteLogs:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get a single waste log by ID with all relations
 */
export async function getWasteLogById(
  id: string
): Promise<QueryResult<WasteLogWithRelations>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('waste_logs')
      .select(`
        *,
        performer:users!waste_logs_performed_by_fkey(id, full_name, email),
        witness:users!waste_logs_witnessed_by_fkey(id, full_name, email),
        batch:batches(id, batch_number, cultivar:cultivars(name)),
        inventory_item:inventory_items(id, name, sku),
        inventory_lot:inventory_lots(id, lot_code)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: data as WasteLogWithRelations, error: null }
  } catch (error) {
    console.error('Error in getWasteLogById:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Create a new waste log
 */
export async function createWasteLog(
  input: CreateWasteLogInput
): Promise<QueryResult<WasteLog>> {
  try {
    const supabase = await createClient()
    
    // Set defaults
    const wasteLogData = {
      ...input,
      photo_urls: input.photo_urls || [],
      witness_id_verified: input.witness_id_verified || false,
      rendered_unusable: input.rendered_unusable || false,
      metrc_sync_status: 'pending' as const,
      disposed_at: input.disposed_at || new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('waste_logs')
      .insert(wasteLogData)
      .select()
      .single()

    if (error) throw error
    return { data: data as WasteLog, error: null }
  } catch (error) {
    console.error('Error in createWasteLog:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update an existing waste log (within 24 hour window)
 */
export async function updateWasteLog(
  id: string,
  updates: UpdateWasteLogInput
): Promise<QueryResult<WasteLog>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('waste_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: data as WasteLog, error: null }
  } catch (error) {
    console.error('Error in updateWasteLog:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Delete a waste log (org_admin only, within 1 hour)
 */
export async function deleteWasteLog(id: string): Promise<QueryResult<void>> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('waste_logs')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { data: null, error: null }
  } catch (error) {
    console.error('Error in deleteWasteLog:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// BATCH-SPECIFIC OPERATIONS
// ============================================================================

/**
 * Create waste log from a batch
 */
export async function createBatchWaste(
  batchId: string,
  input: Omit<CreateWasteLogInput, 'batch_id'>
): Promise<QueryResult<WasteLog>> {
  try {
    return await createWasteLog({
      ...input,
      batch_id: batchId,
      source_type: 'batch',
      source_id: batchId,
    })
  } catch (error) {
    console.error('Error in createBatchWaste:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get all waste logs for a specific batch
 */
export async function getBatchWasteLogs(
  batchId: string
): Promise<QueryResult<WasteLog[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('waste_logs')
      .select('*')
      .eq('batch_id', batchId)
      .order('disposed_at', { ascending: false })

    if (error) throw error
    return { data: data as WasteLog[], error: null }
  } catch (error) {
    console.error('Error in getBatchWasteLogs:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get total waste for a batch (for batch metrics)
 */
export async function getBatchWasteTotal(
  batchId: string
): Promise<QueryResult<{ total_kg: number; count: number }>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('waste_logs')
      .select('quantity, unit_of_measure')
      .eq('batch_id', batchId)

    if (error) throw error

    // Convert all to kg
    const total_kg = (data || []).reduce((sum, log) => {
      let kg = 0
      switch (log.unit_of_measure) {
        case 'kg':
          kg = log.quantity
          break
        case 'g':
          kg = log.quantity / 1000
          break
        case 'lb':
          kg = log.quantity * 0.453592
          break
        case 'oz':
          kg = log.quantity * 0.0283495
          break
        default:
          kg = 0
      }
      return sum + kg
    }, 0)

    return { data: { total_kg, count: data?.length || 0 }, error: null }
  } catch (error) {
    console.error('Error in getBatchWasteTotal:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// INVENTORY-SPECIFIC OPERATIONS
// ============================================================================

/**
 * Create waste log from inventory
 */
export async function createInventoryWaste(
  itemId: string,
  lotId: string | null,
  input: Omit<CreateWasteLogInput, 'inventory_item_id' | 'inventory_lot_id'>
): Promise<QueryResult<WasteLog>> {
  try {
    return await createWasteLog({
      ...input,
      inventory_item_id: itemId,
      inventory_lot_id: lotId || undefined,
      source_type: 'inventory',
      source_id: itemId,
    })
  } catch (error) {
    console.error('Error in createInventoryWaste:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get all waste logs for an inventory item
 */
export async function getInventoryWasteLogs(
  itemId: string
): Promise<QueryResult<WasteLog[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('waste_logs')
      .select('*')
      .eq('inventory_item_id', itemId)
      .order('disposed_at', { ascending: false })

    if (error) throw error
    return { data: data as WasteLog[], error: null }
  } catch (error) {
    console.error('Error in getInventoryWasteLogs:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

/**
 * Get waste summary for a site within date range
 */
export async function getWasteSummary(
  siteId: string,
  dateRange?: { start: string; end: string }
): Promise<QueryResult<WasteSummary>> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('waste_summary')
      .select('*')
      .eq('site_id', siteId)

    if (dateRange) {
      query = query
        .gte('month', dateRange.start)
        .lte('month', dateRange.end)
    } else {
      // Default to current month
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      query = query.eq('month', monthStart)
    }

    const { data, error } = await query.maybeSingle()

    if (error) throw error
    return { data: data as WasteSummary | null, error: null }
  } catch (error) {
    console.error('Error in getWasteSummary:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get monthly waste breakdown for a year
 */
export async function getWasteByMonth(
  siteId: string,
  year: number
): Promise<QueryResult<MonthlyWaste[]>> {
  try {
    const supabase = await createClient()
    
    const yearStart = `${year}-01-01T00:00:00Z`
    const yearEnd = `${year}-12-31T23:59:59Z`

    const { data, error } = await supabase
      .from('waste_summary')
      .select('*')
      .eq('site_id', siteId)
      .gte('month', yearStart)
      .lte('month', yearEnd)
      .order('month', { ascending: true })

    if (error) throw error

    // Transform to MonthlyWaste format
    const monthlyData: MonthlyWaste[] = (data || []).map((summary) => ({
      month: summary.month,
      total_waste_kg: summary.total_weight_kg,
      waste_count: summary.total_waste_count,
      by_type: {}, // Would need separate query to populate
      by_source: {}, // Would need separate query to populate
    }))

    return { data: monthlyData, error: null }
  } catch (error) {
    console.error('Error in getWasteByMonth:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get waste breakdown by type for a period
 */
export async function getWasteByType(
  siteId: string,
  dateRange: { start: string; end: string }
): Promise<QueryResult<Record<string, { count: number; total_kg: number }>>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('waste_logs')
      .select('waste_type, quantity, unit_of_measure')
      .eq('site_id', siteId)
      .gte('disposed_at', dateRange.start)
      .lte('disposed_at', dateRange.end)

    if (error) throw error

    // Aggregate by type
    const byType: Record<string, { count: number; total_kg: number }> = {}
    
    ;(data || []).forEach((log) => {
      if (!byType[log.waste_type]) {
        byType[log.waste_type] = { count: 0, total_kg: 0 }
      }
      
      byType[log.waste_type].count++
      
      // Convert to kg
      let kg = 0
      switch (log.unit_of_measure) {
        case 'kg':
          kg = log.quantity
          break
        case 'g':
          kg = log.quantity / 1000
          break
        case 'lb':
          kg = log.quantity * 0.453592
          break
        case 'oz':
          kg = log.quantity * 0.0283495
          break
      }
      
      byType[log.waste_type].total_kg += kg
    })

    return { data: byType, error: null }
  } catch (error) {
    console.error('Error in getWasteByType:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// COMPLIANCE HELPERS
// ============================================================================

/**
 * Get unrendered cannabis waste (compliance monitoring)
 */
export async function getUnrenderedWaste(
  siteId: string
): Promise<QueryResult<WasteLog[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .rpc('get_unrendered_waste', { p_site_id: siteId })

    if (error) throw error
    return { data: data as WasteLog[], error: null }
  } catch (error) {
    console.error('Error in getUnrenderedWaste:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get unwitnessed cannabis waste (compliance monitoring)
 */
export async function getUnwitnessedWaste(
  siteId: string
): Promise<QueryResult<WasteLog[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .rpc('get_unwitnessed_waste', { p_site_id: siteId })

    if (error) throw error
    return { data: data as WasteLog[], error: null }
  } catch (error) {
    console.error('Error in getUnwitnessedWaste:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get unsynced Metrc waste (for sync queue)
 */
export async function getUnsyncedMetrcWaste(
  siteId: string
): Promise<QueryResult<WasteLog[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .rpc('get_unsynced_metrc_waste', { p_site_id: siteId })

    if (error) throw error
    return { data: data as WasteLog[], error: null }
  } catch (error) {
    console.error('Error in getUnsyncedMetrcWaste:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// METRC SYNC OPERATIONS (Phase 14 - Placeholder)
// ============================================================================

/**
 * Mark waste log as successfully synced to Metrc
 * @param id Waste log ID
 * @param metrcDisposalId Metrc disposal ID from API response
 */
export async function markWasteAsSynced(
  id: string,
  metrcDisposalId: string
): Promise<QueryResult<void>> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('waste_logs')
      .update({
        metrc_sync_status: 'synced',
        metrc_disposal_id: metrcDisposalId,
        metrc_synced_at: new Date().toISOString(),
        metrc_sync_error: null,
      })
      .eq('id', id)

    if (error) throw error
    return { data: null, error: null }
  } catch (error) {
    console.error('Error in markWasteAsSynced:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Mark waste log sync as failed
 * @param id Waste log ID
 * @param errorMessage Error message from Metrc API
 */
export async function markWasteSyncFailed(
  id: string,
  errorMessage: string
): Promise<QueryResult<void>> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('waste_logs')
      .update({
        metrc_sync_status: 'failed',
        metrc_sync_error: errorMessage,
      })
      .eq('id', id)

    if (error) throw error
    return { data: null, error: null }
  } catch (error) {
    console.error('Error in markWasteSyncFailed:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Retry failed Metrc sync (resets status to pending)
 */
export async function retryMetrcSync(id: string): Promise<QueryResult<void>> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('waste_logs')
      .update({
        metrc_sync_status: 'pending',
        metrc_sync_error: null,
      })
      .eq('id', id)

    if (error) throw error
    return { data: null, error: null }
  } catch (error) {
    console.error('Error in retryMetrcSync:', error)
    return { data: null, error: error as Error }
  }
}
