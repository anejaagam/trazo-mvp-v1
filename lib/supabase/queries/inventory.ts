/**
 * Inventory Items Database Queries
 * 
 * CRUD operations for inventory_items table with RBAC and jurisdiction awareness
 */

import { createClient } from '@/lib/supabase/server'
import type {
  InsertInventoryItem,
  UpdateInventoryItem,
  InventoryItemFilters,
  ItemType,
} from '@/types/inventory'

/**
 * Get all inventory items for a site with optional filtering
 */
export async function getInventoryItems(
  siteId: string,
  filters?: InventoryItemFilters
) {
  try {
    const supabase = await createClient()
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
    if (filters?.stock_status) {
      // This will be applied at view level, skip for base table
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
    const supabase = await createClient()
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
 * Get stock balances view for real-time inventory status
 */
export async function getStockBalances(siteId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_stock_balances')
      .select('*')
      .eq('site_id', siteId)
      .order('stock_status', { ascending: false }) // Show critical items first
      .order('item_name', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getStockBalances:', error)
    return { data: null, error }
  }
}

/**
 * Get items below minimum quantity (for reordering)
 */
export async function getItemsBelowMinimum(siteId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_stock_balances')
      .select('*')
      .eq('site_id', siteId)
      .in('stock_status', ['below_par', 'reorder', 'out_of_stock'])
      .order('stock_status', { ascending: false })
      .order('item_name', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getItemsBelowMinimum:', error)
    return { data: null, error }
  }
}

/**
 * Create a new inventory item
 */
export async function createInventoryItem(item: InsertInventoryItem) {
  try {
    const supabase = await createClient()
    
    // Get current user for created_by
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        ...item,
        created_by: user.id,
      })
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
    const supabase = await createClient()
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
 * Soft delete an inventory item (set is_active to false)
 */
export async function deleteInventoryItem(itemId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_items')
      .update({ is_active: false })
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in deleteInventoryItem:', error)
    return { data: null, error }
  }
}

/**
 * Get inventory items by type (for filtering)
 */
export async function getInventoryItemsByType(
  siteId: string,
  itemType: ItemType
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
      .eq('item_type', itemType)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getInventoryItemsByType:', error)
    return { data: null, error }
  }
}

/**
 * Get inventory items by category
 */
export async function getInventoryItemsByCategory(
  siteId: string,
  categoryId: string
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getInventoryItemsByCategory:', error)
    return { data: null, error }
  }
}

/**
 * Search inventory items by name or SKU
 */
export async function searchInventoryItems(
  siteId: string,
  searchQuery: string
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
      .order('name', { ascending: true })
      .limit(50) // Limit search results

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in searchInventoryItems:', error)
    return { data: null, error }
  }
}

/**
 * Update item quantity manually (use movements for tracked changes)
 */
export async function updateItemQuantity(
  itemId: string,
  newQuantity: number
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_items')
      .update({ current_quantity: newQuantity })
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in updateItemQuantity:', error)
    return { data: null, error }
  }
}

/**
 * Reserve quantity for a batch or task
 */
export async function reserveInventoryQuantity(
  itemId: string,
  quantity: number
) {
  try {
    const supabase = await createClient()
    
    // Get current item
    const { data: item, error: fetchError } = await supabase
      .from('inventory_items')
      .select('current_quantity, reserved_quantity')
      .eq('id', itemId)
      .single()

    if (fetchError) throw fetchError
    if (!item) throw new Error('Item not found')

    // Check if enough quantity available
    const available = (item.current_quantity || 0) - (item.reserved_quantity || 0)
    if (available < quantity) {
      throw new Error('Insufficient quantity available to reserve')
    }

    // Update reserved quantity
    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        reserved_quantity: (item.reserved_quantity || 0) + quantity,
      })
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in reserveInventoryQuantity:', error)
    return { data: null, error }
  }
}

/**
 * Unreserve quantity (when batch is completed or cancelled)
 */
export async function unreserveInventoryQuantity(
  itemId: string,
  quantity: number
) {
  try {
    const supabase = await createClient()
    
    // Get current item
    const { data: item, error: fetchError } = await supabase
      .from('inventory_items')
      .select('reserved_quantity')
      .eq('id', itemId)
      .single()

    if (fetchError) throw fetchError
    if (!item) throw new Error('Item not found')

    // Update reserved quantity (ensure it doesn't go negative)
    const newReserved = Math.max(0, (item.reserved_quantity || 0) - quantity)
    
    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        reserved_quantity: newReserved,
      })
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in unreserveInventoryQuantity:', error)
    return { data: null, error }
  }
}
