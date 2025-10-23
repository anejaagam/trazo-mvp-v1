/**
 * Client-Side Inventory Database Queries
 * 
 * These functions use the browser Supabase client for use in client components
 * For server components, use the functions from inventory.ts instead
 */

import { createClient } from '@/lib/supabase/client'
import type {
  InventoryItemFilters,
  InsertInventoryItem,
  UpdateInventoryItem,
} from '@/types/inventory'

/**
 * Get all inventory items with optional filters
 */
export async function getInventoryItems(
  siteId: string,
  filters?: InventoryItemFilters
) {
  try {
    const supabase = createClient()
    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    // Apply filters
    if (filters?.item_type) {
      query = query.eq('item_type', filters.item_type)
    }
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getInventoryItems:', error)
    return { data: null, error }
  }
}

/**
 * Get a single inventory item by ID
 */
export async function getInventoryItemById(itemId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getInventoryItemById:', error)
    return { data: null, error }
  }
}

/**
 * Create a new inventory item
 */
export async function createInventoryItem(item: InsertInventoryItem) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(item)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in createInventoryItem:', error)
    return { data: null, error }
  }
}

/**
 * Update an existing inventory item
 */
export async function updateInventoryItem(
  itemId: string,
  updates: UpdateInventoryItem
) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in updateInventoryItem:', error)
    return { data: null, error }
  }
}

/**
 * Get stock balances view
 */
export async function getStockBalances(siteId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_stock_balances')
      .select('*')
      .eq('site_id', siteId)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getStockBalances:', error)
    return { data: null, error }
  }
}

/**
 * Get items below minimum stock levels
 */
export async function getItemsBelowMinimum(siteId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_stock_balances')
      .select('*')
      .eq('site_id', siteId)
      .in('stock_status', ['below_par', 'reorder', 'out_of_stock'])

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getItemsBelowMinimum:', error)
    return { data: null, error }
  }
}
