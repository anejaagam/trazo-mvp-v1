/**
 * Location Sync API
 *
 * POST - Sync rooms from Metrc locations (Metrc → Trazo)
 * GET - Get sync status for site
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchMetrcLocations,
  calculateLocationSync,
  metrcLocationToRoom,
  findRoomsToPushToMetrc,
  type TrazoRoom,
  type LocationPushItem,
} from '@/lib/compliance/metrc/services'
import { createMetrcClient } from '@/lib/compliance/metrc/services'

interface RouteParams {
  params: Promise<{ siteId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { siteId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const membership = { organization_id: userData.organization_id }

    // Get site with Metrc info
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select(`
        id,
        name,
        metrc_license_number,
        metrc_locations_synced_at,
        compliance_status,
        metrc_org_credentials:metrc_credential_id (
          id,
          state_code,
          user_api_key,
          is_sandbox
        )
      `)
      .eq('id', siteId)
      .eq('organization_id', membership.organization_id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Get rooms with sync status
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select(`
        id,
        name,
        room_type,
        capacity_pods,
        is_active,
        metrc_location_id,
        metrc_location_name,
        metrc_sync_status
      `)
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('name')

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError)
      return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
    }

    // Calculate sync stats
    const syncedCount = rooms?.filter(r => r.metrc_sync_status === 'synced').length || 0
    const pendingCount = rooms?.filter(r => r.metrc_sync_status === 'pending_sync').length || 0
    const errorCount = rooms?.filter(r => r.metrc_sync_status === 'sync_error').length || 0

    return NextResponse.json({
      site: {
        id: site.id,
        name: site.name,
        metrcLicenseNumber: site.metrc_license_number,
        lastSyncedAt: site.metrc_locations_synced_at,
        complianceStatus: site.compliance_status,
      },
      rooms: rooms || [],
      syncStatus: {
        total: rooms?.length || 0,
        synced: syncedCount,
        pending: pendingCount,
        errors: errorCount,
        notSynced: (rooms?.length || 0) - syncedCount - pendingCount - errorCount,
      },
    })
  } catch (error) {
    console.error('Location sync GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { siteId } = await params
    const supabase = await createClient()
    const startTime = Date.now()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id || !['org_admin', 'site_manager'].includes(userData.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const membership = { organization_id: userData.organization_id, role: userData.role }

    // Get site with Metrc credentials
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select(`
        id,
        name,
        organization_id,
        metrc_license_number,
        metrc_credential_id
      `)
      .eq('id', siteId)
      .eq('organization_id', membership.organization_id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    if (!site.metrc_license_number || !site.metrc_credential_id) {
      return NextResponse.json({
        error: 'Site is not linked to a Metrc facility. Please link the site first.',
      }, { status: 400 })
    }

    // Get credentials
    const { data: credential, error: credError } = await supabase
      .from('metrc_org_credentials')
      .select('id, state_code, user_api_key, is_sandbox')
      .eq('id', site.metrc_credential_id)
      .single()

    if (credError || !credential) {
      return NextResponse.json({
        error: 'Metrc credentials not found for this site',
      }, { status: 400 })
    }

    // Fetch locations from Metrc
    const { locations, error: metrcError } = await fetchMetrcLocations(
      credential.state_code,
      credential.user_api_key,
      site.metrc_license_number,
      credential.is_sandbox
    )

    if (metrcError) {
      // Log the error
      await supabase.from('metrc_sync_log').insert({
        organization_id: membership.organization_id,
        site_id: siteId,
        credential_id: credential.id,
        sync_type: 'locations_sync',
        sync_direction: 'metrc_to_trazo',
        status: 'failed',
        error_message: metrcError,
        duration_ms: Date.now() - startTime,
        performed_by: user.id,
      })

      return NextResponse.json({
        error: 'Failed to fetch locations from Metrc',
        details: metrcError,
      }, { status: 500 })
    }

    // Get existing rooms
    const { data: existingRooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, site_id, name, room_type, capacity_pods, is_active, metrc_location_id, metrc_location_name, metrc_sync_status')
      .eq('site_id', siteId)
      .eq('is_active', true)

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError)
      return NextResponse.json({ error: 'Failed to fetch existing rooms' }, { status: 500 })
    }

    // Calculate sync actions
    const trazoRooms: TrazoRoom[] = (existingRooms || []).map(r => ({
      id: r.id,
      siteId: r.site_id,
      name: r.name,
      roomType: r.room_type,
      capacityPods: r.capacity_pods,
      isActive: r.is_active,
      metrcLocationId: r.metrc_location_id,
      metrcLocationName: r.metrc_location_name,
      metrcSyncStatus: r.metrc_sync_status,
    }))

    const syncResult = calculateLocationSync(locations, trazoRooms)

    // Apply sync actions
    const errors: string[] = []
    let created = 0
    let updated = 0

    for (const item of syncResult.items) {
      try {
        if (item.action === 'created') {
          // Create new room from Metrc location
          const metrcLoc = locations.find(l => l.Id === item.metrcLocationId)
          if (metrcLoc) {
            const newRoom = metrcLocationToRoom(metrcLoc, siteId)
            const { error: insertError } = await supabase
              .from('rooms')
              .insert({
                site_id: newRoom.siteId,
                name: newRoom.name,
                room_type: newRoom.roomType,
                capacity_pods: newRoom.capacityPods,
                is_active: newRoom.isActive,
                metrc_location_id: newRoom.metrcLocationId,
                metrc_location_name: newRoom.metrcLocationName,
                metrc_sync_status: newRoom.metrcSyncStatus,
                metrc_last_synced_at: new Date().toISOString(),
                metrc_created_by_trazo: false,
              })

            if (insertError) {
              errors.push(`Failed to create room "${newRoom.name}": ${insertError.message}`)
            } else {
              created++
            }
          }
        } else if (item.action === 'updated' && item.trazoRoomId) {
          // Update existing room
          const { error: updateError } = await supabase
            .from('rooms')
            .update({
              metrc_location_id: item.metrcLocationId,
              metrc_location_name: item.metrcLocationName,
              metrc_sync_status: 'synced',
              metrc_last_synced_at: new Date().toISOString(),
              name: item.metrcLocationName,  // Update name to match Metrc
            })
            .eq('id', item.trazoRoomId)

          if (updateError) {
            errors.push(`Failed to update room: ${updateError.message}`)
          } else {
            updated++
          }
        } else if (item.action === 'orphaned' && item.trazoRoomId) {
          // Mark orphaned room
          const { error: orphanError } = await supabase
            .from('rooms')
            .update({
              metrc_sync_status: 'out_of_sync',
              metrc_sync_error: 'Location no longer exists in Metrc',
            })
            .eq('id', item.trazoRoomId)

          if (orphanError) {
            errors.push(`Failed to mark orphaned room: ${orphanError.message}`)
          }
        }
      } catch (err) {
        errors.push(`Error processing location ${item.metrcLocationName}: ${(err as Error).message}`)
      }
    }

    // ============================================
    // PHASE 2: Push unsynced Trazo rooms to Metrc
    // ============================================
    const pushItems: LocationPushItem[] = []
    let pushed = 0

    // Re-fetch rooms to get current state after pull sync updates
    const { data: currentRooms } = await supabase
      .from('rooms')
      .select('id, site_id, name, room_type, capacity_pods, is_active, metrc_location_id, metrc_location_name, metrc_sync_status')
      .eq('site_id', siteId)
      .eq('is_active', true)

    const currentTrazoRooms: TrazoRoom[] = (currentRooms || []).map(r => ({
      id: r.id,
      siteId: r.site_id,
      name: r.name,
      roomType: r.room_type,
      capacityPods: r.capacity_pods,
      isActive: r.is_active,
      metrcLocationId: r.metrc_location_id,
      metrcLocationName: r.metrc_location_name,
      metrcSyncStatus: r.metrc_sync_status,
    }))

    // Re-fetch Metrc locations to include any that were just linked
    const { locations: updatedLocations } = await fetchMetrcLocations(
      credential.state_code,
      credential.user_api_key,
      site.metrc_license_number,
      credential.is_sandbox
    )

    // Find rooms that need to be pushed to Metrc
    const roomsToPush = findRoomsToPushToMetrc(updatedLocations, currentTrazoRooms)

    if (roomsToPush.length > 0) {
      // Get location types to use for creating locations
      const client = createMetrcClient(
        credential.state_code,
        credential.user_api_key,
        site.metrc_license_number,
        credential.is_sandbox
      )

      let defaultLocationTypeId: number | null = null
      let defaultLocationTypeName: string | null = null
      try {
        const typesResult = await client.locations.listTypes()
        const defaultType = typesResult.data.find(t =>
          t.Name.toLowerCase().includes('default') ||
          t.Name.toLowerCase().includes('general')
        ) || typesResult.data[0]
        defaultLocationTypeId = defaultType?.Id || null
        defaultLocationTypeName = defaultType?.Name || null
      } catch {
        errors.push('Failed to fetch location types from Metrc')
      }

      if (defaultLocationTypeId && defaultLocationTypeName) {
        for (const room of roomsToPush) {
          try {
            // Create location in Metrc
            await client.locations.create({
              Name: room.name,
              LocationTypeId: defaultLocationTypeId,
              LocationTypeName: defaultLocationTypeName,
            })

            // Fetch the newly created location to get its ID
            const createdLocation = await client.locations.findByName(room.name)

            if (createdLocation) {
              // Update the room with Metrc location info
              const { error: updateError } = await supabase
                .from('rooms')
                .update({
                  metrc_location_id: createdLocation.Id,
                  metrc_location_name: createdLocation.Name,
                  metrc_sync_status: 'synced',
                  metrc_last_synced_at: new Date().toISOString(),
                  metrc_created_by_trazo: true,
                })
                .eq('id', room.id)

              if (updateError) {
                pushItems.push({
                  trazoRoomId: room.id,
                  trazoRoomName: room.name,
                  metrcLocationId: createdLocation.Id,
                  metrcLocationName: createdLocation.Name,
                  action: 'push_error',
                  details: `Location created in Metrc but failed to update room: ${updateError.message}`,
                })
                errors.push(`Failed to update room "${room.name}" after Metrc push: ${updateError.message}`)
              } else {
                pushItems.push({
                  trazoRoomId: room.id,
                  trazoRoomName: room.name,
                  metrcLocationId: createdLocation.Id,
                  metrcLocationName: createdLocation.Name,
                  action: 'pushed',
                  details: 'Created new location in Metrc',
                })
                pushed++
              }
            } else {
              pushItems.push({
                trazoRoomId: room.id,
                trazoRoomName: room.name,
                action: 'push_error',
                details: 'Location created but could not be retrieved from Metrc',
              })
              errors.push(`Failed to verify created location for room "${room.name}"`)
            }
          } catch (pushError) {
            pushItems.push({
              trazoRoomId: room.id,
              trazoRoomName: room.name,
              action: 'push_error',
              details: `Failed to create location in Metrc: ${(pushError as Error).message}`,
            })
            errors.push(`Failed to push room "${room.name}" to Metrc: ${(pushError as Error).message}`)
          }
        }
      }
    }

    // Update site sync timestamp
    await supabase
      .from('sites')
      .update({
        metrc_locations_synced_at: new Date().toISOString(),
      })
      .eq('id', siteId)

    // Log the sync
    const durationMs = Date.now() - startTime
    await supabase.from('metrc_sync_log').insert({
      organization_id: membership.organization_id,
      site_id: siteId,
      credential_id: credential.id,
      sync_type: 'locations_sync',
      sync_direction: 'bidirectional',
      status: errors.length > 0 ? 'partial' : 'success',
      details: {
        metrcLocationsFound: locations.length,
        roomsCreated: created,
        roomsUpdated: updated,
        roomsMatched: syncResult.matched,
        roomsOrphaned: syncResult.orphaned,
        roomsPushedToMetrc: pushed,
      },
      error_message: errors.length > 0 ? errors.join('; ') : null,
      duration_ms: durationMs,
      performed_by: user.id,
    })

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0
        ? 'Locations synced successfully'
        : 'Locations synced with some errors',
      syncResult: {
        metrcLocationsFound: locations.length,
        roomsCreated: created,
        roomsUpdated: updated,
        roomsMatched: syncResult.matched,
        roomsOrphaned: syncResult.orphaned,
        roomsPushedToMetrc: pushed,
        errors,
      },
      items: syncResult.items,
      pushItems,
      durationMs,
    })
  } catch (error) {
    console.error('Location sync POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
