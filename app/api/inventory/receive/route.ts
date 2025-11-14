/**
 * API Route: Receive Inventory (Create Lot)
 * POST /api/inventory/receive
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import type { InsertInventoryLot, InsertInventoryMovement } from '@/types/inventory'

interface ReceiveInventoryRequest {
  item_id: string
  quantity_received: number
  unit_of_measure: string
  lot_code: string
  received_date: string
  expiry_date?: string | null
  manufacture_date?: string | null
  supplier_name?: string | null
  purchase_order_number?: string | null
  unit_cost?: number | null
  compliance_package_uid?: string | null
  storage_location?: string | null
  notes?: string | null
  organization_id: string
  site_id: string
  batch_id?: string | null
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
    const body: ReceiveInventoryRequest = await request.json()

    // Validate required fields
    if (!body.item_id || !body.quantity_received || !body.lot_code || !body.received_date) {
      return NextResponse.json(
        { error: 'Missing required fields: item_id, quantity_received, lot_code, received_date' },
        { status: 400 }
      )
    }

    // Create lot
    const lotData: InsertInventoryLot = {
      item_id: body.item_id,
      lot_code: body.lot_code,
      quantity_received: body.quantity_received,
      quantity_remaining: body.quantity_received,
      unit_of_measure: body.unit_of_measure,
      received_date: body.received_date,
      expiry_date: body.expiry_date || undefined,
      manufacture_date: body.manufacture_date || undefined,
      supplier_name: body.supplier_name || undefined,
      purchase_order_number: body.purchase_order_number || undefined,
      cost_per_unit: body.unit_cost || undefined,
      compliance_package_uid: body.compliance_package_uid || undefined,
      storage_location: body.storage_location || undefined,
      notes: body.notes || undefined,
      created_by: user.id,
    }

    const { data: lot, error: lotError } = await supabase
      .from('inventory_lots')
      .insert(lotData)
      .select()
      .single()

    if (lotError) {
      console.error('Error creating lot:', lotError)
      return NextResponse.json(
        { error: 'Failed to create lot', details: lotError.message },
        { status: 500 }
      )
    }

    // Create movement record
    const movementData: InsertInventoryMovement = {
      item_id: body.item_id,
      lot_id: lot.id,
      movement_type: 'receive',
      quantity: body.quantity_received,
      from_location: body.supplier_name || undefined,
      to_location: body.storage_location || undefined,
      notes: body.notes || undefined,
      performed_by: user.id,
      batch_id: body.batch_id || undefined,
    }

    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert(movementData)

    if (movementError) {
      console.error('Error creating movement:', movementError)
      // Don't fail the request if movement creation fails
      // The trigger will handle inventory updates
    }

    return NextResponse.json(
      { 
        data: lot, 
        message: 'Inventory received successfully' 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/inventory/receive:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
