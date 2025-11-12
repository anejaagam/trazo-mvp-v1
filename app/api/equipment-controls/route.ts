/**
 * Equipment Controls API
 * 
 * GET /api/equipment-controls?podId=xxx - Fetch equipment controls for a pod
 * PATCH /api/equipment-controls - Update equipment state/level/override
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getEquipmentControls,
} from '@/lib/supabase/queries/equipment-controls'

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

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, podId, equipmentType, state, level, override } = body

    // Require either id OR (podId + equipmentType)
    if (!id && (!podId || !equipmentType)) {
      return NextResponse.json(
        { error: 'Either id or (podId and equipmentType) is required' },
        { status: 400 }
      )
    }

    const updates: {
      state?: number
      level?: number
      override?: boolean
      changed_by?: string
      last_state_change?: string
    } = {
      changed_by: user.id,
    }

    if (state !== undefined) {
      updates.state = state as number
      updates.last_state_change = new Date().toISOString()
    }
    if (level !== undefined) {
      updates.level = level
    }
    if (override !== undefined) {
      updates.override = override
    }

    // Update using either id or pod_id + equipment_type
    let query = supabase
      .from('equipment_controls')
      .update(updates)

    if (id) {
      query = query.eq('id', id)
    } else {
      query = query.eq('pod_id', podId).eq('equipment_type', equipmentType)
    }

    const { error } = await query

    if (error) {
      console.error('Error updating equipment control:', error)
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to update equipment control' },
      { status: 500 }
    )
  }
}
