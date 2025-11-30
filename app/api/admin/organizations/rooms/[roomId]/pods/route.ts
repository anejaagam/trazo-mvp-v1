import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'

interface RouteContext {
  params: Promise<{
    roomId: string
  }>
}

/**
 * GET /api/admin/organizations/rooms/[roomId]/pods
 * Get all pods in a specific room
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { roomId } = await context.params
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const { data: userData } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData || !canPerformAction(userData.role, 'org:settings')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    // Get the room and verify it belongs to user's organization
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select(`
        id,
        name,
        sites!inner(
          organization_id
        )
      `)
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Verify room belongs to user's organization
    const roomSite = room.sites as unknown as { organization_id: string }
    if (roomSite.organization_id !== userData.organization_id) {
      return NextResponse.json(
        { error: 'Forbidden - room belongs to different organization' },
        { status: 403 }
      )
    }

    // Fetch all pods in this room
    const { data: pods, error: podsError } = await supabase
      .from('pods')
      .select(`
        id,
        name,
        room_id,
        status,
        pod_serial_number,
        metrc_location_name,
        is_active,
        created_at
      `)
      .eq('room_id', roomId)
      .eq('is_active', true)
      .order('name')

    if (podsError) {
      console.error('Error fetching pods:', podsError)
      return NextResponse.json(
        { error: 'Failed to fetch pods' },
        { status: 500 }
      )
    }

    return NextResponse.json({ pods: pods || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/organizations/rooms/[roomId]/pods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
