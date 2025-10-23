import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDevModeActive } from '@/lib/dev-mode'

/**
 * Dev Mode Inventory Movements API
 * 
 * GET: Fetch recent movements for a site (bypasses RLS)
 * POST: Create a new movement (bypasses RLS)
 */

function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function GET(request: NextRequest) {
  if (!isDevModeActive()) {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const limit = searchParams.get('limit') || '10'

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get movements by joining with inventory_items to filter by site
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        inventory_items!inner(site_id, name, sku)
      `)
      .eq('inventory_items.site_id', siteId)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit))

    if (error) {
      console.error('Dev mode movements fetch error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Dev mode movements API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!isDevModeActive()) {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const supabase = createServiceClient()

    // Get the current quantity from the related inventory item
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('current_quantity')
      .eq('id', body.item_id)
      .single()
    
    if (itemError) {
      console.error('Dev mode item fetch error:', itemError)
      return NextResponse.json(
        { error: 'Failed to fetch item: ' + itemError.message, details: itemError },
        { status: 400 }
      )
    }

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Create the movement (audit trigger now handles organization_id lookup)
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Dev mode movement insert error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      )
    }

    // Update the item's current_quantity based on movement type
    if (body.quantity) {
      const { movement_type, quantity } = body
      let newQuantity = item.current_quantity || 0

      // Adjust quantity based on movement type
      switch (movement_type) {
        case 'receive':
        case 'adjustment_increase':
          newQuantity += quantity
          break
        case 'issue':
        case 'adjustment_decrease':
        case 'waste':
          newQuantity -= quantity
          break
        case 'transfer':
          newQuantity -= quantity
          break
      }

      // Update the item
      await supabase
        .from('inventory_items')
        .update({ 
          current_quantity: Math.max(0, newQuantity),
          last_movement_date: new Date().toISOString()
        })
        .eq('id', body.item_id)
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Dev mode movement API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
