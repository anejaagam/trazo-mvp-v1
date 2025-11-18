/**
 * Inventory Lots Database Queries
 *
 * Lot/batch tracking with FIFO/LIFO logic and expiry management
 * Includes Metrc integration hooks for cannabis jurisdictions
 */

import { createClient } from '@/lib/supabase/server'
import type {
  InsertInventoryLot,
  UpdateInventoryLot,
} from '@/types/inventory'
import { pushInventoryLotToMetrc } from '@/lib/compliance/metrc/sync/inventory-push-sync'
import { getJurisdictionConfig } from '@/lib/jurisdiction/config'

/**
 * Get all lots for an inventory item
 */
export async function getLotsByItem(itemId: string) {
  try {
    const supabase = await createClient()
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
    const supabase = await createClient()
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
 * Get expiring lots (within specified days)
 */
export async function getExpiringLots(siteId: string, withinDays: number = 30) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_active_lots')
      .select('*')
      .eq('site_id', siteId)
      .in('expiry_status', ['expiring_soon', 'expiring'])
      .lte('days_until_expiry', withinDays)
      .order('days_until_expiry', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getExpiringLots:', error)
    return { data: null, error }
  }
}

/**
 * Get expired lots
 */
export async function getExpiredLots(siteId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_active_lots')
      .select('*')
      .eq('site_id', siteId)
      .eq('expiry_status', 'expired')
      .order('expiry_date', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getExpiredLots:', error)
    return { data: null, error }
  }
}

/**
 * Get a single lot by ID
 */
export async function getLotById(lotId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_lots')
      .select('*')
      .eq('id', lotId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getLotById:', error)
    return { data: null, error }
  }
}

/**
 * Get lot by compliance package UID (for Metrc/CTLS/PrimusGFS)
 */
export async function getLotByComplianceUid(complianceUid: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_lots')
      .select('*')
      .eq('compliance_package_uid', complianceUid)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getLotByComplianceUid:', error)
    return { data: null, error }
  }
}

/**
 * Create a new lot (when receiving inventory)
 * Automatically pushes to Metrc if cannabis jurisdiction with compliance requirement
 */
export async function createLot(lot: InsertInventoryLot, options?: { skipMetrcPush?: boolean }) {
  try {
    const supabase = await createClient()

    // Get current user for created_by
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('inventory_lots')
      .insert({
        ...lot,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Push to Metrc if cannabis jurisdiction (unless explicitly skipped)
    if (!options?.skipMetrcPush && data) {
      try {
        // Get site and organization to check jurisdiction
        const { data: siteData } = await supabase
          .from('sites')
          .select('id, jurisdiction_id, organization_id')
          .eq('id', data.site_id)
          .single()

        if (siteData?.jurisdiction_id) {
          const jurisdiction = getJurisdictionConfig(siteData.jurisdiction_id)

          // Only push if cannabis jurisdiction with Metrc requirement
          if (jurisdiction?.plant_type === 'cannabis' &&
              jurisdiction?.rules?.batch?.require_metrc_id) {
            // Push to Metrc asynchronously (don't block lot creation)
            pushInventoryLotToMetrc(
              data.id,
              siteData.id,
              siteData.organization_id,
              user.id
            ).catch((metrcError) => {
              console.error('Failed to push lot to Metrc (non-blocking):', metrcError)
            })
          }
        }
      } catch (metrcError) {
        // Log Metrc push error but don't fail the lot creation
        console.error('Metrc integration error (non-blocking):', metrcError)
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in createLot:', error)
    return { data: null, error }
  }
}

/**
 * Update a lot (e.g., after partial consumption)
 * Note: Metrc sync for quantity updates should be handled via inventory movements
 * for proper audit trail. This function only updates the lot record.
 */
export async function updateLot(lotId: string, updates: UpdateInventoryLot) {
  try {
    const supabase = await createClient()
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
 * Deactivate a lot (when depleted or expired)
 */
export async function deactivateLot(lotId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_lots')
      .update({ is_active: false })
      .eq('id', lotId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in deactivateLot:', error)
    return { data: null, error }
  }
}

/**
 * Get next lot to use (FIFO logic)
 * Returns the oldest lot with remaining quantity
 */
export async function getNextLotFIFO(itemId: string) {
  try {
    const supabase = await createClient()
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
    const supabase = await createClient()
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
    const supabase = await createClient()
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
    const supabase = await createClient()
    
    // Get current lot
    const { data: lot, error: fetchError } = await supabase
      .from('inventory_lots')
      .select('quantity_remaining')
      .eq('id', lotId)
      .single()

    if (fetchError) throw fetchError
    if (!lot) throw new Error('Lot not found')

    if (lot.quantity_remaining < quantity) {
      throw new Error('Insufficient quantity in lot')
    }

    const newRemaining = lot.quantity_remaining - quantity
    const { data, error } = await supabase
      .from('inventory_lots')
      .update({
        quantity_remaining: newRemaining,
        is_active: newRemaining > 0,
      })
      .eq('id', lotId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in consumeFromLot:', error)
    return { data: null, error }
  }
}

/**
 * Get lot summary by supplier (for vendor analysis)
 */
export async function getLotsBySupplier(siteId: string, supplierName: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_active_lots')
      .select('*')
      .eq('site_id', siteId)
      .eq('supplier_name', supplierName)
      .order('received_date', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getLotsBySupplier:', error)
    return { data: null, error }
  }
}

/**
 * Get lots by date range (for audit/compliance reporting)
 */
export async function getLotsByDateRange(
  siteId: string,
  startDate: string,
  endDate: string
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_active_lots')
      .select('*')
      .eq('site_id', siteId)
      .gte('received_date', startDate)
      .lte('received_date', endDate)
      .order('received_date', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getLotsByDateRange:', error)
    return { data: null, error }
  }
}
