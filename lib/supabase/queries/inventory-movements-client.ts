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
    let query = supabase
      .from('inventory_movements')
      .select('*')
      .eq('site_id', siteId)
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
      .select('*')
      .eq('site_id', siteId)
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
    // In dev mode, use dev API to bypass RLS
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      const response = await fetch('/api/dev/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movement)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create movement')
      }
      
      const { data } = await response.json()
      return { data, error: null }
    }

    // Production mode
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert(movement)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in createMovement:', error)
    return { data: null, error }
  }
}
