/**
 * Equipment Controls API
 * 
 * GET /api/equipment-controls?podId=xxx - Fetch equipment controls for a pod
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEquipmentControls } from '@/lib/supabase/queries/equipment-controls'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const podId = searchParams.get('podId')

    if (!podId) {
      return NextResponse.json(
        { error: 'podId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data, error } = await getEquipmentControls(podId)

    if (error) {
      console.error('Error fetching equipment controls:', error)
      return NextResponse.json(
        { error: 'Failed to fetch equipment controls' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
