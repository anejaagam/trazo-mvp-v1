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
  from_location?: string
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
        .select('id, quantity_remaining, storage_location')
        .eq('item_id', body.item_id)
        .eq('is_active', true)
        .gt('quantity_remaining', 0)

      // If a source location is specified, restrict to that location
      if (body.from_location && body.from_location.trim() !== '') {
        lotsQuery = lotsQuery.eq('storage_location', body.from_location)
      }

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
        // No lots found - check if item has legacy inventory (non-lot-tracked)
        const { data: item, error: itemError } = await supabase
          .from('inventory_items')
          .select('current_quantity')
          .eq('id', body.item_id)
          .single()

        if (itemError || !item) {
          return NextResponse.json(
            { error: 'Item not found' },
            { status: 404 }
          )
        }

        if (item.current_quantity < body.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock. Only ${item.current_quantity} units available.` },
            { status: 400 }
          )
        }

        // For legacy items, we'll create a movement without lot_id
        // The trigger will handle updating current_quantity
        // Skip lot allocation and go directly to movement creation
      } else {
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
    }

    // Determine movement type based on destination
    const isLocationTransfer = !!body.to_location && !body.batch_id && !body.task_id
    const movementType = isLocationTransfer ? 'transfer' : 'consume'

    // Process each lot allocation (or handle legacy items without lots)
    const updates = []
    
    if (lotAllocations.length > 0) {
      // Process lot-tracked items
      for (const allocation of lotAllocations) {
      // Get current lot
      const { data: lot, error: lotError } = await supabase
        .from('inventory_lots')
        .select('quantity_remaining, storage_location')
        .eq('id', allocation.lot_id)
        .single()

      if (lotError || !lot) {
        return NextResponse.json(
          { error: `Lot ${allocation.lot_id} not found` },
          { status: 400 }
        )
      }

      if (isLocationTransfer) {
        // For location transfers, check if partial or full lot transfer
        const isPartialTransfer = allocation.quantity < lot.quantity_remaining
        
        if (isPartialTransfer) {
          // Partial transfer: Split the lot
          // 1. Reduce quantity in original lot
          const reduceOriginalPromise = supabase
            .from('inventory_lots')
            .update({
              quantity_remaining: lot.quantity_remaining - allocation.quantity,
            })
            .eq('id', allocation.lot_id)

          updates.push(reduceOriginalPromise)

          // 2. Create new lot at destination with transferred quantity
          // Get full lot details first
          const { data: fullLot } = await supabase
            .from('inventory_lots')
            .select('*')
            .eq('id', allocation.lot_id)
            .single()

          if (fullLot) {
            const createNewLotPromise = supabase
              .from('inventory_lots')
              .insert({
                item_id: fullLot.item_id,
                lot_code: `${fullLot.lot_code}-SPLIT`,
                quantity_received: allocation.quantity,
                quantity_remaining: allocation.quantity,
                unit_of_measure: fullLot.unit_of_measure,
                storage_location: body.to_location,
                received_date: fullLot.received_date,
                expiry_date: fullLot.expiry_date,
                manufacture_date: fullLot.manufacture_date,
                supplier_lot_number: fullLot.supplier_lot_number,
                supplier_id: fullLot.supplier_id,
                cost_per_unit: fullLot.cost_per_unit,
                compliance_package_uid: fullLot.compliance_package_uid,
                is_active: true,
                created_by: user.id,
              })

            updates.push(createNewLotPromise)
          }
        } else {
          // Full lot transfer: Just update storage location
          const updatePromise = supabase
            .from('inventory_lots')
            .update({
              storage_location: body.to_location,
            })
            .eq('id', allocation.lot_id)

          updates.push(updatePromise)
        }
      } else {
        // For consume operations, reduce quantity
        const newQuantity = lot.quantity_remaining - allocation.quantity

        const updatePromise = supabase
          .from('inventory_lots')
          .update({
            quantity_remaining: newQuantity,
            is_active: newQuantity > 0,
          })
          .eq('id', allocation.lot_id)

        updates.push(updatePromise)
      }

      // Create movement record for this allocation
      const movementData: InsertInventoryMovement = {
        item_id: body.item_id,
        lot_id: allocation.lot_id,
        movement_type: movementType,
        quantity: allocation.quantity,
        // Always record the source location (where the lot currently is)
        from_location: lot.storage_location || undefined,
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
    } else {
      // Handle legacy items without lot tracking
      
      // If this is a transfer, update the item's storage_location
      if (isLocationTransfer && body.to_location) {
        console.log(`[Legacy Transfer] Updating storage_location for item ${body.item_id} to ${body.to_location}`)
        const updateItemLocationPromise = supabase
          .from('inventory_items')
          .update({
            storage_location: body.to_location,
          })
          .eq('id', body.item_id)
        
        updates.push(updateItemLocationPromise)
      }
      
      console.log(`[Legacy Item] Creating movement: type=${movementType}, qty=${body.quantity}, to=${body.to_location}`)
      const movementData: InsertInventoryMovement = {
        item_id: body.item_id,
        lot_id: undefined, // No lot for legacy items
        movement_type: movementType,
        quantity: body.quantity,
        from_location: body.from_location || undefined,
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
      console.error('Errors during updates:', errors)
      console.error('Full results:', JSON.stringify(results, null, 2))
      return NextResponse.json(
        { error: 'Failed to update inventory', details: errors.map(e => e.error?.message) },
        { status: 500 }
      )
    }

    console.log(`[Issue API] Successfully processed ${results.length} updates for item ${body.item_id}`)
    
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
