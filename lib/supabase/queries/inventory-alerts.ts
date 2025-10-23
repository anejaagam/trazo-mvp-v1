/**
 * Inventory Alerts Database Queries
 * 
 * Alert management for low stock, expiring items, and out-of-stock conditions
 */

import { createClient } from '@/lib/supabase/server'
import type {
  AlertType,
} from '@/types/inventory'

/**
 * Get all alerts for a site
 */
export async function getAlerts(siteId: string, onlyUnacknowledged: boolean = true) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('inventory_alerts')
      .select(`
        *,
        inventory_items!inner(site_id, name, sku, current_quantity, minimum_quantity)
      `)
      .eq('inventory_items.site_id', siteId)
      .order('created_at', { ascending: false })

    if (onlyUnacknowledged) {
      query = query.eq('is_acknowledged', false)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getAlerts:', error)
    return { data: null, error }
  }
}

/**
 * Get alerts by type
 */
export async function getAlertsByType(
  siteId: string,
  alertType: AlertType,
  onlyUnacknowledged: boolean = true
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('inventory_alerts')
      .select(`
        *,
        inventory_items!inner(site_id, name, sku)
      `)
      .eq('inventory_items.site_id', siteId)
      .eq('alert_type', alertType)
      .order('created_at', { ascending: false })

    if (onlyUnacknowledged) {
      query = query.eq('is_acknowledged', false)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getAlertsByType:', error)
    return { data: null, error }
  }
}

/**
 * Get alerts for a specific item
 */
export async function getAlertsByItem(
  itemId: string,
  onlyUnacknowledged: boolean = true
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('inventory_alerts')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })

    if (onlyUnacknowledged) {
      query = query.eq('is_acknowledged', false)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getAlertsByItem:', error)
    return { data: null, error }
  }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string,
  notes?: string
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: acknowledgedBy,
        notes,
      })
      .eq('id', alertId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in acknowledgeAlert:', error)
    return { data: null, error }
  }
}

/**
 * Acknowledge all alerts for an item
 */
export async function acknowledgeAllAlertsForItem(
  itemId: string,
  acknowledgedBy: string
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: acknowledgedBy,
      })
      .eq('item_id', itemId)
      .eq('is_acknowledged', false)
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in acknowledgeAllAlertsForItem:', error)
    return { data: null, error }
  }
}

/**
 * Create a manual alert
 */
export async function createAlert(
  itemId: string,
  alertType: AlertType,
  thresholdValue?: number
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_alerts')
      .insert({
        item_id: itemId,
        alert_type: alertType,
        threshold_value: thresholdValue,
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in createAlert:', error)
    return { data: null, error }
  }
}

/**
 * Get alert statistics (for dashboard summary)
 */
export async function getAlertStatistics(siteId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_alerts')
      .select(`
        alert_type,
        inventory_items!inner(site_id)
      `)
      .eq('inventory_items.site_id', siteId)
      .eq('is_acknowledged', false)

    if (error) throw error

    // Aggregate counts by type
    const stats = {
      low_stock: 0,
      expiring: 0,
      expired: 0,
      out_of_stock: 0,
      total: data?.length || 0,
    }

    data?.forEach((alert: { alert_type: string }) => {
      if (alert.alert_type in stats) {
        stats[alert.alert_type as keyof typeof stats]++
      }
    })

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error in getAlertStatistics:', error)
    return { data: null, error }
  }
}

/**
 * Delete acknowledged alerts older than specified days (cleanup)
 */
export async function deleteOldAcknowledgedAlerts(daysOld: number = 90) {
  try {
    const supabase = await createClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { data, error } = await supabase
      .from('inventory_alerts')
      .delete()
      .eq('is_acknowledged', true)
      .lt('acknowledged_at', cutoffDate.toISOString())
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in deleteOldAcknowledgedAlerts:', error)
    return { data: null, error }
  }
}
