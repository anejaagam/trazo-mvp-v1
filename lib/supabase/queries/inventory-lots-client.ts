/**
 * Client-Side Inventory Lots Database Queries
 * 
 * These functions use the browser Supabase client for use in client components
 * For server components, use the functions from inventory-lots.ts instead
 */

import { createClient } from '@/lib/supabase/client'
import type {
  InsertInventoryLot,
  UpdateInventoryLot,
} from '@/types/inventory'

/**
 * Get all lots for an inventory item
 */
export async function getLotsByItem(itemId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_lots')
      .select('*')
      .eq('item_id', itemId)
      .eq('is_active', true)
      .order('received_date', { ascending: true }) // FIFO order

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getLotsByItem:', error)
    return { data: null, error }
  }
}

/**
 * Get active lots view (includes expiry status)
 */
export async function getActiveLots(siteId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_active_lots')
      .select('*')
      .eq('site_id', siteId)
      .order('received_date', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getActiveLots:', error)
    return { data: null, error }
  }
}

/**
 * Get expiring lots (lots that are expired or expiring soon)
 */
export async function getExpiringLots(siteId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_active_lots')
      .select('*')
      .eq('site_id', siteId)
      .in('expiry_status', ['expired', 'expiring_soon'])
      .order('expiry_date', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getExpiringLots:', error)
    return { data: null, error }
  }
}

/**
 * Get available lots for FIFO/LIFO/FEFO selection
 */
export async function getAvailableLots(
  itemId: string,
  allocationMethod: 'FIFO' | 'LIFO' | 'FEFO'
) {
  try {
    const supabase = createClient()
    let query = supabase
      .from('inventory_active_lots')
      .select('*')
      .eq('item_id', itemId)
      .gt('quantity_remaining', 0)

    // Sort based on allocation method
    switch (allocationMethod) {
      case 'FIFO':
        query = query.order('received_date', { ascending: true })
        break
      case 'LIFO':
        query = query.order('received_date', { ascending: false })
        break
      case 'FEFO':
        query = query
          .not('expiry_date', 'is', null)
          .order('expiry_date', { ascending: true })
        break
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getAvailableLots:', error)
    return { data: null, error }
  }
}

/**
 * Create a new inventory lot
 */
export async function createLot(lot: InsertInventoryLot) {
  try {
    // In dev mode, skip lot creation for now (lots not fully supported)
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      console.warn('Dev mode: Skipping lot creation (not yet supported)')
      return { data: null, error: null }
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_lots')
      .insert(lot)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in createLot:', error)
    return { data: null, error }
  }
}

/**
 * Update an existing lot
 */
export async function updateLot(lotId: string, updates: UpdateInventoryLot) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_lots')
      .update(updates)
      .eq('id', lotId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in updateLot:', error)
    return { data: null, error }
  }
}

/**
 * Get next lot to use (FIFO logic)
 * Returns the oldest lot with remaining quantity
 */
export async function getNextLotFIFO(itemId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_lots')
      .select('*')
      .eq('item_id', itemId)
      .eq('is_active', true)
      .gt('quantity_remaining', 0)
      .order('received_date', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getNextLotFIFO:', error)
    return { data: null, error }
  }
}

/**
 * Get next lot to use (LIFO logic)
 * Returns the newest lot with remaining quantity
 */
export async function getNextLotLIFO(itemId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_lots')
      .select('*')
      .eq('item_id', itemId)
      .eq('is_active', true)
      .gt('quantity_remaining', 0)
      .order('received_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getNextLotLIFO:', error)
    return { data: null, error }
  }
}

/**
 * Get next lot to use (FEFO - First Expired First Out)
 * Returns the lot with earliest expiry date
 */
export async function getNextLotFEFO(itemId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_lots')
      .select('*')
      .eq('item_id', itemId)
      .eq('is_active', true)
      .gt('quantity_remaining', 0)
      .not('expiry_date', 'is', null)
      .order('expiry_date', { ascending: true })
      .order('received_date', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getNextLotFEFO:', error)
    return { data: null, error }
  }
}

/**
 * Consume quantity from a specific lot
 * This updates the lot's quantity_remaining
 */
export async function consumeFromLot(lotId: string, quantity: number) {
  try {
    const supabase = createClient()
    
    // Get current lot
    const { data: lot, error: fetchError } = await supabase
      .from('inventory_lots')
      .select('quantity_remaining')
      .eq('id', lotId)
      .single()

    if (fetchError) throw fetchError
    if (!lot) throw new Error('Lot not found')

    const newQuantity = lot.quantity_remaining - quantity

    // Update the lot
    const { data, error: updateError } = await supabase
      .from('inventory_lots')
      .update({
        quantity_remaining: newQuantity,
        is_active: newQuantity > 0,
      })
      .eq('id', lotId)
      .select()
      .single()

    if (updateError) throw updateError
    return { data, error: null }
  } catch (error) {
    console.error('Error in consumeFromLot:', error)
    return { data: null, error }
  }
}
