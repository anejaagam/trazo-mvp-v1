/**
 * Client-Side Inventory Database Queries
 * 
 * These functions use the browser Supabase client for use in client components
 * For server components, use the functions from inventory.ts instead
 */

import { createClient } from '@/lib/supabase/client'
import { isDevModeActive } from '@/lib/dev-mode'
import type {
  InventoryItemFilters,
  InsertInventoryItem,
  UpdateInventoryItem,
  InventoryItemWithStock,
} from '@/types/inventory'

/**
 * Get all inventory items with optional filters
 */
export async function getInventoryItems(
  siteId: string,
  filters?: InventoryItemFilters
) {
  try {
    // In dev mode, use the dev API which bypasses RLS with service role
    if (isDevModeActive()) {
      const params = new URLSearchParams({ siteId })
      const response = await fetch(`/api/dev/inventory?${params}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch inventory items')
      }
      const { data } = await response.json()
      
      // Apply client-side filters since API doesn't support them yet
      let filteredData: InventoryItemWithStock[] = data
      if (filters?.item_type) {
        filteredData = filteredData.filter((item: InventoryItemWithStock) => item.item_type === filters.item_type)
      }
      if (filters?.category_id) {
        filteredData = filteredData.filter((item: InventoryItemWithStock) => item.category_id === filters.category_id)
      }
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter((item: InventoryItemWithStock) => 
          item.name?.toLowerCase().includes(searchLower) || 
          item.sku?.toLowerCase().includes(searchLower)
        )
      }
      
      return { data: filteredData, error: null }
    }

    // Production path with RLS
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
    // In dev mode, use service role API to bypass RLS
    if (isDevModeActive()) {
      const response = await fetch('/api/dev/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create inventory item')
      }
      
      const { data } = await response.json()
      return { data, error: null }
    }

    // Production mode: Check user record first
    const supabase = createClient()
    
    // Debug: Check if user exists and has proper role
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: userRecord } = await supabase
        .from('users')
        .select('id, role, organization_id')
        .eq('id', user.id)
        .single()
      
      console.log('Current user record:', userRecord)
      console.log('Trying to insert item with org_id:', item.organization_id)
    }
    
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(item)
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating item:', error)
      throw error
    }
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
    // In dev mode, use service role API to bypass RLS
    if (isDevModeActive()) {
      const response = await fetch('/api/dev/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, ...updates })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update inventory item')
      }
      
      const { data } = await response.json()
      return { data, error: null }
    }

    // Production mode: use regular client
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
