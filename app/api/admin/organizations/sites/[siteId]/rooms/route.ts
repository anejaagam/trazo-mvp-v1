import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { createMetrcClient } from '@/lib/compliance/metrc/services'

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

    // Verify site belongs to user's organization and get Metrc details
    const { data: site } = await supabase
      .from('sites')
      .select('id, metrc_license_number, metrc_credential_id')
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

    // Variables for Metrc location sync
    let metrcLocationId: number | null = null
    let metrcLocationName: string | null = null
    let metrcSyncStatus: string = 'not_synced'

    // If site is linked to Metrc, create location in Metrc first
    if (site.metrc_license_number && site.metrc_credential_id) {
      try {
        // Get credentials
        const { data: credential } = await supabase
          .from('metrc_org_credentials')
          .select('user_api_key, state_code, is_sandbox')
          .eq('id', site.metrc_credential_id)
          .single()

        if (credential) {
          const client = createMetrcClient(
            credential.state_code,
            credential.user_api_key,
            site.metrc_license_number,
            credential.is_sandbox
          )

          // Get location types to find an appropriate one
          const typesResult = await client.locations.listTypes()
          const defaultType = typesResult.data.find(t =>
            t.Name.toLowerCase().includes('default') ||
            t.Name.toLowerCase().includes('general')
          ) || typesResult.data[0]

          if (defaultType) {
            // Create location in Metrc
            await client.locations.create({
              Name: name,
              LocationTypeId: defaultType.Id,
              LocationTypeName: defaultType.Name,
            })

            // Fetch the newly created location to get its ID
            const createdLocation = await client.locations.findByName(name)
            if (createdLocation) {
              metrcLocationId = createdLocation.Id
              metrcLocationName = createdLocation.Name
              metrcSyncStatus = 'synced'
            }
          }
        }
      } catch (metrcError) {
        console.error('Error creating Metrc location:', metrcError)
        // Don't fail the room creation, just log the error
        // The room will be created without Metrc sync
        metrcSyncStatus = 'sync_error'
      }
    }

    // Create room in Trazo
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
        is_active: true,
        metrc_location_id: metrcLocationId,
        metrc_location_name: metrcLocationName,
        metrc_sync_status: metrcSyncStatus,
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
      },
      metrcSynced: metrcSyncStatus === 'synced',
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

    // Check for ANY pods (not just active ones)
    const { count: podCount } = await supabase
      .from('pods')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)

    if (podCount && podCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete room with existing pods',
          details: `This room has ${podCount} pod(s). Please delete all pods before deleting the room.`
        },
        { status: 400 }
      )
    }

    // Hard delete the room
    const { error } = await supabase
      .from('rooms')
      .delete()
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
