/**
 * Inventory Movements Database Queries
 * 
 * Movement tracking and transaction history for inventory items
 */

import { createClient } from '@/lib/supabase/server'
import type {
  InsertInventoryMovement,
  InventoryMovementFilters,
  MovementType,
} from '@/types/inventory'

/**
 * Get all movements for an item
 */
export async function getMovementsByItem(
  itemId: string,
  limit: number = 100
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('item_id', itemId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getMovementsByItem:', error)
    return { data: null, error }
  }
}

/**
 * Get movements for a site with filters
 */
export async function getMovements(
  siteId: string,
  filters?: InventoryMovementFilters,
  limit: number = 200
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        inventory_items!inner(site_id, name, sku)
      `)
      .eq('inventory_items.site_id', siteId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    // Apply filters
    if (filters?.item_id) {
      query = query.eq('item_id', filters.item_id)
    }
    if (filters?.lot_id) {
      query = query.eq('lot_id', filters.lot_id)
    }
    if (filters?.batch_id) {
      query = query.eq('batch_id', filters.batch_id)
    }
    if (filters?.movement_type) {
      if (Array.isArray(filters.movement_type)) {
        query = query.in('movement_type', filters.movement_type)
      } else {
        query = query.eq('movement_type', filters.movement_type)
      }
    }
    if (filters?.start_date) {
      query = query.gte('timestamp', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('timestamp', filters.end_date)
    }
    if (filters?.performed_by) {
      query = query.eq('performed_by', filters.performed_by)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getMovements:', error)
    return { data: null, error }
  }
}

/**
 * Get movement by ID
 */
export async function getMovementById(movementId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('id', movementId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getMovementById:', error)
    return { data: null, error }
  }
}

/**
 * Create a new movement (for manual tracking)
 * Note: For receive/consume/dispose, use dedicated functions that include lot logic
 */
export async function createMovement(movement: InsertInventoryMovement) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('inventory_movements')
      .insert({
        ...movement,
        performed_by: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in createMovement:', error)
    return { data: null, error }
  }
}

/**
 * Get movements by batch (for batch consumption tracking)
 */
export async function getMovementsByBatch(batchId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('batch_id', batchId)
      .order('timestamp', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getMovementsByBatch:', error)
    return { data: null, error }
  }
}

/**
 * Get movements by lot (for lot traceability)
 */
export async function getMovementsByLot(lotId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('lot_id', lotId)
      .order('timestamp', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getMovementsByLot:', error)
    return { data: null, error }
  }
}

/**
 * Get movement summary view (aggregated statistics)
 */
export async function getMovementSummary(siteId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_movement_summary')
      .select('*')
      .eq('site_id', siteId)
      .order('total_movements', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getMovementSummary:', error)
    return { data: null, error }
  }
}

/**
 * Get movements by type (for reporting)
 */
export async function getMovementsByType(
  siteId: string,
  movementType: MovementType,
  startDate?: string,
  endDate?: string
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        inventory_items!inner(site_id, name, sku)
      `)
      .eq('inventory_items.site_id', siteId)
      .eq('movement_type', movementType)
      .order('timestamp', { ascending: false })

    if (startDate) {
      query = query.gte('timestamp', startDate)
    }
    if (endDate) {
      query = query.lte('timestamp', endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getMovementsByType:', error)
    return { data: null, error }
  }
}

/**
 * Get recent movements (for dashboard activity feed)
 */
export async function getRecentMovements(siteId: string, limit: number = 20) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        inventory_items!inner(site_id, name, sku, unit_of_measure)
      `)
      .eq('inventory_items.site_id', siteId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getRecentMovements:', error)
    return { data: null, error }
  }
}

/**
 * Get movements by date range (for compliance reporting)
 */
export async function getMovementsByDateRange(
  siteId: string,
  startDate: string,
  endDate: string
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        inventory_items!inner(site_id, name, sku)
      `)
      .eq('inventory_items.site_id', siteId)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getMovementsByDateRange:', error)
    return { data: null, error }
  }
}
