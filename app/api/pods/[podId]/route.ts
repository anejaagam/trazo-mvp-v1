import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'

interface RouteContext {
  params: Promise<{
    podId: string
  }>
}

/**
 * PATCH /api/pods/[podId]
 * Update pod details including room assignment
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { podId } = await context.params
    const body = await request.json()
    
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

    // Get the pod to verify it exists and belongs to user's organization
    const { data: pod, error: podError } = await supabase
      .from('pods')
      .select(`
        id,
        name,
        room_id,
        rooms!inner(
          id,
          name,
          site_id,
          sites!inner(
            id,
            organization_id
          )
        )
      `)
      .eq('id', podId)
      .single()

    if (podError || !pod) {
      return NextResponse.json(
        { error: 'Pod not found' },
        { status: 404 }
      )
    }

    // Verify pod belongs to user's organization
    const podRoom = pod.rooms as unknown as {
      id: string
      name: string
      site_id: string
      sites: { id: string; organization_id: string }
    }
    const podOrgId = podRoom?.sites?.organization_id

    if (podOrgId !== userData.organization_id) {
      return NextResponse.json(
        { error: 'Forbidden - pod belongs to different organization' },
        { status: 403 }
      )
    }

    // If room_id is being updated, validate the new room
    if (body.room_id && body.room_id !== pod.room_id) {
      const { data: newRoom, error: roomError } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          capacity_pods,
          is_active,
          sites!inner(
            organization_id
          )
        `)
        .eq('id', body.room_id)
        .single()

      if (roomError || !newRoom) {
        return NextResponse.json(
          { error: 'Target room not found' },
          { status: 404 }
        )
      }

      // Verify new room belongs to same organization
      const newRoomSite = newRoom.sites as unknown as { organization_id: string }
      if (newRoomSite.organization_id !== userData.organization_id) {
        return NextResponse.json(
          { error: 'Forbidden - target room belongs to different organization' },
          { status: 403 }
        )
      }

      // Check if room is active
      if (!newRoom.is_active) {
        return NextResponse.json(
          { error: 'Cannot assign pod to inactive room' },
          { status: 400 }
        )
      }

      // Check room capacity
      if (newRoom.capacity_pods) {
        const { count: currentPodCount } = await supabase
          .from('pods')
          .select('id', { count: 'exact', head: true })
          .eq('room_id', body.room_id)
          .eq('is_active', true)

        if (currentPodCount !== null && currentPodCount >= newRoom.capacity_pods) {
          return NextResponse.json(
            { 
              error: 'Room at capacity',
              details: `Room "${newRoom.name}" is at capacity (${currentPodCount}/${newRoom.capacity_pods} pods)` 
            },
            { status: 400 }
          )
        }
      }
    }

    // Update the pod
    const { room_id, ...otherUpdates } = body
    const updates: Record<string, string | number | boolean | null> = { 
      updated_at: new Date().toISOString() 
    }
    
    if (room_id !== undefined) {
      updates.room_id = room_id
    }
    
    // Add any other allowed updates (name, status, metrc_location_name, etc.)
    if (otherUpdates.name) updates.name = otherUpdates.name
    if (otherUpdates.status) updates.status = otherUpdates.status
    if (otherUpdates.pod_serial_number) updates.pod_serial_number = otherUpdates.pod_serial_number
    if (otherUpdates.metrc_location_name !== undefined) updates.metrc_location_name = otherUpdates.metrc_location_name

    const { data: updatedPod, error: updateError } = await supabase
      .from('pods')
      .update(updates)
      .eq('id', podId)
      .select(`
        id,
        name,
        room_id,
        status,
        pod_serial_number,
        metrc_location_name,
        rooms(
          id,
          name,
          room_type
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating pod:', updateError)
      return NextResponse.json(
        { error: 'Failed to update pod' },
        { status: 500 }
      )
    }

    return NextResponse.json({ pod: updatedPod })
  } catch (error) {
    console.error('Error in PATCH /api/pods/[podId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pods/[podId]
 * Get pod details with room and site information
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { podId } = await context.params
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the pod with room and site info
    const { data: pod, error } = await supabase
      .from('pods')
      .select(`
        id,
        name,
        room_id,
        status,
        pod_serial_number,
        tagoio_device_id,
        is_active,
        created_at,
        updated_at,
        rooms!inner(
          id,
          name,
          room_type,
          capacity_pods,
          sites!inner(
            id,
            name,
            organization_id
          )
        )
      `)
      .eq('id', podId)
      .single()

    if (error || !pod) {
      return NextResponse.json(
        { error: 'Pod not found' },
        { status: 404 }
      )
    }

    // Verify pod belongs to user's organization
    const podRoom = pod.rooms as unknown as {
      id: string
      name: string
      room_type: string
      capacity_pods: number
      sites: { id: string; name: string; organization_id: string }
    }
    if (podRoom?.sites?.organization_id !== userData.organization_id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({ pod })
  } catch (error) {
    console.error('Error in GET /api/pods/[podId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
