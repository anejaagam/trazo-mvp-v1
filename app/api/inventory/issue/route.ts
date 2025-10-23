/**
 * API Route: Issue Inventory (Consume from Lots)
 * POST /api/inventory/issue
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import type { InsertInventoryMovement } from '@/types/inventory'

interface IssueInventoryRequest {
  item_id: string
  quantity: number
  allocation_method: 'FIFO' | 'LIFO' | 'FEFO' | 'manual'
  lot_allocations?: Array<{
    lot_id: string
    quantity: number
  }>
  to_location?: string
  batch_id?: string
  task_id?: string
  reason?: string
  notes?: string
  organization_id: string
  site_id: string
}

export async function POST(request: NextRequest) {
  try {
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
    const body: IssueInventoryRequest = await request.json()

    // Validate required fields
    if (!body.item_id || !body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields: item_id, quantity' },
        { status: 400 }
      )
    }

    // Get lot allocations
    const lotAllocations = body.lot_allocations || []

    // If manual allocations not provided, use allocation method
    if (lotAllocations.length === 0) {
      // Get available lots based on allocation method
      let orderBy: { column: string; ascending: boolean }[] = []
      
      switch (body.allocation_method) {
        case 'FIFO':
          orderBy = [
            { column: 'received_date', ascending: true },
            { column: 'created_at', ascending: true }
          ]
          break
        case 'LIFO':
          orderBy = [
            { column: 'received_date', ascending: false },
            { column: 'created_at', ascending: false }
          ]
          break
        case 'FEFO':
          orderBy = [
            { column: 'expiry_date', ascending: true },
            { column: 'received_date', ascending: true }
          ]
          break
        default:
          return NextResponse.json(
            { error: 'Invalid allocation method' },
            { status: 400 }
          )
      }

      // Fetch available lots
      let lotsQuery = supabase
        .from('inventory_lots')
        .select('id, quantity_remaining')
        .eq('item_id', body.item_id)
        .eq('is_active', true)
        .gt('quantity_remaining', 0)

      // Apply FEFO filter
      if (body.allocation_method === 'FEFO') {
        lotsQuery = lotsQuery.not('expiry_date', 'is', null)
      }

      // Apply ordering
      for (const order of orderBy) {
        lotsQuery = lotsQuery.order(order.column, { ascending: order.ascending })
      }

      const { data: lots, error: lotsError } = await lotsQuery

      if (lotsError) {
        console.error('Error fetching lots:', lotsError)
        return NextResponse.json(
          { error: 'Failed to fetch lots', details: lotsError.message },
          { status: 500 }
        )
      }

      if (!lots || lots.length === 0) {
        return NextResponse.json(
          { error: 'No available lots found for this item' },
          { status: 400 }
        )
      }

      // Allocate quantity across lots
      let remainingQuantity = body.quantity
      for (const lot of lots) {
        if (remainingQuantity <= 0) break

        const allocatedQty = Math.min(remainingQuantity, lot.quantity_remaining)
        lotAllocations.push({
          lot_id: lot.id,
          quantity: allocatedQty
        })
        remainingQuantity -= allocatedQty
      }

      if (remainingQuantity > 0) {
        return NextResponse.json(
          { error: `Insufficient quantity available. Short by ${remainingQuantity}` },
          { status: 400 }
        )
      }
    }

    // Process each lot allocation
    const updates = []
    for (const allocation of lotAllocations) {
      // Get current lot
      const { data: lot, error: lotError } = await supabase
        .from('inventory_lots')
        .select('quantity_remaining')
        .eq('id', allocation.lot_id)
        .single()

      if (lotError || !lot) {
        return NextResponse.json(
          { error: `Lot ${allocation.lot_id} not found` },
          { status: 400 }
        )
      }

      const newQuantity = lot.quantity_remaining - allocation.quantity

      // Update lot quantity
      const updatePromise = supabase
        .from('inventory_lots')
        .update({
          quantity_remaining: newQuantity,
          is_active: newQuantity > 0,
        })
        .eq('id', allocation.lot_id)

      updates.push(updatePromise)

      // Create movement record for this allocation
      const movementData: InsertInventoryMovement = {
        item_id: body.item_id,
        lot_id: allocation.lot_id,
        movement_type: 'consume',
        quantity: allocation.quantity,
        to_location: body.to_location || undefined,
        batch_id: body.batch_id || undefined,
        task_id: body.task_id || undefined,
        reason: body.reason || undefined,
        notes: body.notes || undefined,
        performed_by: user.id,
      }

      const movementPromise = supabase
        .from('inventory_movements')
        .insert(movementData)

      updates.push(movementPromise)
    }

    // Execute all updates
    const results = await Promise.all(updates)
    
    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Errors during lot updates:', errors)
      return NextResponse.json(
        { error: 'Failed to update some lots', details: errors },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        data: { 
          lot_allocations: lotAllocations,
          total_quantity: body.quantity 
        },
        message: 'Inventory issued successfully' 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/inventory/issue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
