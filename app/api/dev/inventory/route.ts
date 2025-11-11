import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDevModeActive } from '@/lib/dev-mode'

/**
 * Dev Mode Inventory API Route
 * 
 * Uses service role key to bypass RLS in development mode
 * ⚠️ ONLY AVAILABLE WHEN NEXT_PUBLIC_DEV_MODE=true
 * 
 * This is a temporary solution until dev users are properly seeded in Supabase Auth
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

export async function POST(request: NextRequest) {
  // Only allow in dev mode
  if (!isDevModeActive()) {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('inventory_items')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Dev mode inventory insert error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Dev mode inventory API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Only allow in dev mode
  if (!isDevModeActive()) {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Dev mode inventory fetch error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Dev mode inventory API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // Only allow in dev mode
  if (!isDevModeActive()) {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Dev mode inventory update error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Dev mode inventory API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
