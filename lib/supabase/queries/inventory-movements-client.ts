/**
 * Client-Side Inventory Movements Database Queries
 * 
 * These functions use the browser Supabase client for use in client components
 * For server components, use the functions from inventory-movements.ts instead
 */

import { createClient } from '@/lib/supabase/client'
import type {
  InsertInventoryMovement,
  InventoryMovementFilters,
} from '@/types/inventory'

/**
 * Get all movements with optional filters
 */
export async function getMovements(
  siteId: string,
  filters?: InventoryMovementFilters
) {
  try {
    const supabase = createClient()
    
    // Need to join with inventory_items to filter by site_id
    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        item:inventory_items!inner(id, site_id, name, sku, unit_of_measure)
      `)
      .eq('item.site_id', siteId)
      .order('timestamp', { ascending: false })

    // Apply filters
    if (filters?.item_id) {
      query = query.eq('item_id', filters.item_id)
    }
    if (filters?.movement_type) {
      query = query.eq('movement_type', filters.movement_type)
    }
    if (filters?.start_date) {
      query = query.gte('timestamp', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('timestamp', filters.end_date)
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
 * Get recent movements (limited number)
 */
export async function getRecentMovements(siteId: string, limit: number = 10) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        item:inventory_items!inner(id, site_id, name, sku, unit_of_measure)
      `)
      .eq('item.site_id', siteId)
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
 * Get movements for a specific item
 */
export async function getMovementsByItem(itemId: string, limit?: number) {
  try {
    const supabase = createClient()
    let query = supabase
      .from('inventory_movements')
      .select('*')
      .eq('item_id', itemId)
      .order('timestamp', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getMovementsByItem:', error)
    return { data: null, error }
  }
}

/**
 * Create a new inventory movement
 */
export async function createMovement(movement: InsertInventoryMovement) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('You must be logged in to create inventory movements')
    }
    
    console.log('Creating movement as user:', user.email, 'User ID:', user.id)
    
    // Check if user has profile
    const { data: profile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()
    
    console.log('User profile:', profile)
    
    if (!profile) {
      throw new Error('Your user profile is not set up. Please contact an administrator.')
    }
    
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert(movement)
      .select('*')
      .single()

    if (error) {
      console.error('Movement insert error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        movement
      })
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error in createMovement:', error)
    return { data: null, error }
  }
}
