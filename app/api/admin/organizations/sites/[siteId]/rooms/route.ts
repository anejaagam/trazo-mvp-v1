import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'

interface RouteContext {
  params: Promise<{
    siteId: string
  }>
}

// GET /api/admin/organizations/sites/[siteId]/rooms - List rooms for a site with pod counts
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { siteId } = await context.params
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permission
    if (!canPerformAction(userData.role, 'org:settings')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    // Verify site belongs to user's organization
    const { data: site } = await supabase
      .from('sites')
      .select('id, organization_id')
      .eq('id', siteId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch rooms with pod counts
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select(`
        id,
        site_id,
        name,
        capacity_pods,
        room_type,
        dimensions_length_ft,
        dimensions_width_ft,
        dimensions_height_ft,
        environmental_zone,
        is_active,
        created_at,
        updated_at
      `)
      .eq('site_id', siteId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching rooms:', error)
      return NextResponse.json(
        { error: 'Failed to fetch rooms' },
        { status: 500 }
      )
    }

    // Count pods for each room
    const roomsWithPods = await Promise.all(
      (rooms || []).map(async (room) => {
        const { count: podCount } = await supabase
          .from('pods')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id)

        return {
          ...room,
          pod_count: podCount || 0
        }
      })
    )

    return NextResponse.json({ rooms: roomsWithPods })
  } catch (error) {
    console.error('Error in GET /api/admin/organizations/sites/[siteId]/rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/organizations/sites/[siteId]/rooms - Create a new room
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { siteId } = await context.params
    const body = await request.json()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permission
    if (!canPerformAction(userData.role, 'org:settings')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    // Verify site belongs to user's organization
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('id', siteId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found or access denied' },
        { status: 404 }
      )
    }

    const {
      name,
      capacity_pods,
      room_type,
      dimensions_length_ft,
      dimensions_width_ft,
      dimensions_height_ft,
      environmental_zone
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      )
    }

    // Create room
    const { data: room, error } = await supabase
      .from('rooms')
      .insert({
        site_id: siteId,
        name,
        capacity_pods: capacity_pods || 8,
        room_type,
        dimensions_length_ft,
        dimensions_width_ft,
        dimensions_height_ft,
        environmental_zone,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating room:', error)
      return NextResponse.json(
        { error: 'Failed to create room' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      room: {
        ...room,
        pod_count: 0
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/organizations/sites/[siteId]/rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/organizations/sites/[siteId]/rooms - Update a room
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { siteId } = await context.params
    const body = await request.json()
    const { room_id, ...updates } = body
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permission
    if (!canPerformAction(userData.role, 'org:settings')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    if (!room_id) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    // Verify room belongs to the site and site belongs to organization
    const { data: room } = await supabase
      .from('rooms')
      .select('id, site_id, sites!inner(organization_id)')
      .eq('id', room_id)
      .eq('site_id', siteId)
      .single()

    const roomSite = room?.sites as unknown as { organization_id: string } | undefined
    if (!room || !roomSite || roomSite.organization_id !== userData.organization_id) {
      return NextResponse.json(
        { error: 'Room not found or access denied' },
        { status: 404 }
      )
    }

    // Update room
    const { data: updatedRoom, error } = await supabase
      .from('rooms')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', room_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating room:', error)
      return NextResponse.json(
        { error: 'Failed to update room' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      room: updatedRoom
    })
  } catch (error) {
    console.error('Error in PATCH /api/admin/organizations/sites/[siteId]/rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/organizations/sites/[siteId]/rooms - Soft delete a room
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { siteId } = await context.params
    const searchParams = request.nextUrl.searchParams
    const roomId = searchParams.get('room_id')
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permission
    if (!canPerformAction(userData.role, 'org:settings')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    // Verify room belongs to the site and site belongs to organization
    const { data: room } = await supabase
      .from('rooms')
      .select('id, site_id, sites!inner(organization_id)')
      .eq('id', roomId)
      .eq('site_id', siteId)
      .single()

    const roomSiteForDelete = room?.sites as unknown as { organization_id: string } | undefined
    if (!room || !roomSiteForDelete || roomSiteForDelete.organization_id !== userData.organization_id) {
      return NextResponse.json(
        { error: 'Room not found or access denied' },
        { status: 404 }
      )
    }

    // Check for active pods
    const { count: activePodCount } = await supabase
      .from('pods')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('is_active', true)

    if (activePodCount && activePodCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot deactivate room with active pods',
          details: `This room has ${activePodCount} active pod(s). Please decommission all pods before deactivating the room.`
        },
        { status: 400 }
      )
    }

    // Soft delete (mark as inactive)
    const { error } = await supabase
      .from('rooms')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)

    if (error) {
      console.error('Error deleting room:', error)
      return NextResponse.json(
        { error: 'Failed to delete room' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/organizations/sites/[siteId]/rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
