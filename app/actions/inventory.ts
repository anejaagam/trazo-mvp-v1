'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import type { InsertInventoryItem } from '@/types/inventory'

/**
 * Server action to create an inventory item
 * Uses service role to bypass RLS (temporary workaround)
 */
export async function createInventoryItemAction(item: InsertInventoryItem) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        data: null, 
        error: { message: 'User not authenticated' } 
      }
    }

    // Use service role client to bypass RLS
    // TODO: Fix RLS helper functions to work properly with server-side auth
    const serviceSupabase = createServiceClient('US')
    
    const { data, error } = await serviceSupabase
      .from('inventory_items')
      .insert(item)
      .select()
      .single()

    if (error) {
      console.error('Server action - Error creating item:', error)
      return { data: null, error }
    }

    // Revalidate the inventory pages
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/inventory/items')

    return { data, error: null }
  } catch (error) {
    console.error('Server action - Exception:', error)
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    }
  }
}

/**
 * Server action to update an inventory item
 */
export async function updateInventoryItemAction(itemId: string, updates: Partial<InsertInventoryItem>) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        data: null, 
        error: { message: 'User not authenticated' } 
      }
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createServiceClient('US')
    
    const { data, error } = await serviceSupabase
      .from('inventory_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      console.error('Server action - Error updating item:', error)
      return { data: null, error }
    }

    // Revalidate the inventory pages
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/inventory/items')

    return { data, error: null }
  } catch (error) {
    console.error('Server action - Exception:', error)
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    }
  }
}

/**
 * Server action to delete an inventory item
 * Uses soft delete (marks as inactive) if item has related records
 */
export async function deleteInventoryItemAction(itemId: string) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: { message: 'User not authenticated' } 
      }
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createServiceClient('US')
    
    // Check for dependencies
    const { count: lotsCount } = await serviceSupabase
      .from('inventory_lots')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', itemId)
    
    const { count: movementsCount } = await serviceSupabase
      .from('inventory_movements')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', itemId)

    // If item has related records, do soft delete instead
    if ((lotsCount && lotsCount > 0) || (movementsCount && movementsCount > 0)) {
      const { error } = await serviceSupabase
        .from('inventory_items')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)

      if (error) {
        console.error('Server action - Error soft deleting item:', error)
        return { 
          success: false, 
          error: { message: 'Failed to deactivate item: ' + error.message } 
        }
      }

      // Revalidate the inventory pages
      revalidatePath('/dashboard/inventory')
      revalidatePath('/dashboard/inventory/items')

      return { 
        success: true, 
        error: null,
        softDeleted: true,
        message: 'Item has transaction history and was deactivated instead of deleted.'
      }
    }

    // No dependencies, safe to hard delete
    const { error } = await serviceSupabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Server action - Error deleting item:', error)
      // Handle foreign key constraint errors gracefully
      if (error.code === '23503') {
        return { 
          success: false, 
          error: { message: 'Cannot delete item with existing transaction history. Please deactivate it instead.' } 
        }
      }
      return { 
        success: false, 
        error: { message: error.message || 'Failed to delete item' } 
      }
    }

    // Revalidate the inventory pages
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/inventory/items')

    return { success: true, error: null, softDeleted: false }
  } catch (error) {
    console.error('Server action - Exception:', error)
    return { 
      success: false, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    }
  }
}

/**
 * Server action to delete multiple inventory items
 * Uses soft delete (marks as inactive) for items with related records
 */
export async function batchDeleteInventoryItemsAction(itemIds: string[]) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: { message: 'User not authenticated' } 
      }
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createServiceClient('US')
    
    // Check each item for dependencies
    const itemsToSoftDelete: string[] = []
    const itemsToHardDelete: string[] = []

    for (const itemId of itemIds) {
      const { count: lotsCount } = await serviceSupabase
        .from('inventory_lots')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', itemId)
      
      const { count: movementsCount } = await serviceSupabase
        .from('inventory_movements')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', itemId)

      if ((lotsCount && lotsCount > 0) || (movementsCount && movementsCount > 0)) {
        itemsToSoftDelete.push(itemId)
      } else {
        itemsToHardDelete.push(itemId)
      }
    }

    // Soft delete items with dependencies
    if (itemsToSoftDelete.length > 0) {
      const { error: softDeleteError } = await serviceSupabase
        .from('inventory_items')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .in('id', itemsToSoftDelete)

      if (softDeleteError) {
        console.error('Server action - Error soft deleting items:', softDeleteError)
        return { 
          success: false, 
          error: { message: 'Failed to deactivate some items: ' + softDeleteError.message } 
        }
      }
    }

    // Hard delete items without dependencies
    if (itemsToHardDelete.length > 0) {
      const { error: hardDeleteError } = await serviceSupabase
        .from('inventory_items')
        .delete()
        .in('id', itemsToHardDelete)

      if (hardDeleteError) {
        console.error('Server action - Error hard deleting items:', hardDeleteError)
        // If we get a foreign key error here, fall back to soft delete
        if (hardDeleteError.code === '23503') {
          const { error: fallbackError } = await serviceSupabase
            .from('inventory_items')
            .update({ 
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .in('id', itemsToHardDelete)
          
          if (fallbackError) {
            return { 
              success: false, 
              error: { message: 'Failed to delete or deactivate items: ' + fallbackError.message } 
            }
          }
          
          itemsToSoftDelete.push(...itemsToHardDelete)
        } else {
          return { 
            success: false, 
            error: { message: hardDeleteError.message || 'Failed to delete items' } 
          }
        }
      }
    }

    // Revalidate the inventory pages
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/inventory/items')

    const message = itemsToSoftDelete.length > 0
      ? `${itemsToSoftDelete.length} item(s) with transaction history were deactivated. ${itemsToHardDelete.length} item(s) were permanently deleted.`
      : `${itemsToHardDelete.length} item(s) permanently deleted.`

    return { 
      success: true, 
      error: null,
      softDeletedCount: itemsToSoftDelete.length,
      hardDeletedCount: itemsToHardDelete.length,
      message
    }
  } catch (error) {
    console.error('Server action - Exception:', error)
    return { 
      success: false, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    }
  }
}
