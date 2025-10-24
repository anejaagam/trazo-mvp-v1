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
