/**
 * API Route: Update/Delete Inventory Item
 * PATCH /api/inventory/items/[id]
 * DELETE /api/inventory/items/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import type { UpdateInventoryItem } from '@/types/inventory'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * Update an inventory item
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (!canPerformAction(userData.role, 'inventory:update')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: UpdateInventoryItem = await request.json()

    // Update inventory item
    const { data: item, error: updateError } = await supabase
      .from('inventory_items')
      .update({
        ...body,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating inventory item:', updateError)
      return NextResponse.json(
        { error: 'Failed to update inventory item', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data: item, message: 'Inventory item updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in PATCH /api/inventory/items/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Delete (soft delete) an inventory item
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (!canPerformAction(userData.role, 'inventory:delete')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Soft delete (set is_active to false)
    const { data: item, error: deleteError } = await supabase
      .from('inventory_items')
      .update({
        is_active: false,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (deleteError) {
      console.error('Error deleting inventory item:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete inventory item', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data: item, message: 'Inventory item deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in DELETE /api/inventory/items/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
