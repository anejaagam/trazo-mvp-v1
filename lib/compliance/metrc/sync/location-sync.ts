/**
 * Metrc Location Sync Service
 *
 * Syncs TRAZO rooms and pods to Metrc as locations
 */

import { MetrcClient } from '../client'
import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import {
  validateLocationCreate,
  validateTrazoLocationForMetrcSync,
  checkDuplicateLocationName,
} from '../validation/location-rules'
import type { MetrcLocationCreate } from '../types'

export interface LocationSyncResult {
  success: boolean
  metrcLocationId?: number
  metrcLocationName?: string
  errors: string[]
  warnings: string[]
  syncLogId?: string
}

// =====================================================
// ROOM SYNC
// =====================================================

/**
 * Sync a TRAZO room to Metrc as a location
 *
 * @param roomId - The room ID to sync
 * @param siteId - The site ID
 * @param organizationId - The organization ID
 * @param userId - The user ID initiating the sync
 * @param locationTypeId - The Metrc location type ID selected by user
 * @returns Sync result
 */
export async function syncRoomToMetrc(
  roomId: string,
  siteId: string,
  organizationId: string,
  userId: string,
  locationTypeId: number
): Promise<LocationSyncResult> {
  const supabase = await createClient()
  const result: LocationSyncResult = {
    success: false,
    errors: [],
    warnings: [],
  }

  try {
    // Get the room with site information
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select(`
        *,
        site:sites(id, name, site_license_number, organization_id)
      `)
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      throw new Error('Room not found')
    }

    // Extract site data
    const site = Array.isArray(room.site) ? room.site[0] : room.site
    if (!site) {
      throw new Error('Site information not found for room')
    }

    // Check if already synced
    if (room.metrc_location_id) {
      throw new Error('Room is already synced to Metrc')
    }

    // Validate TRAZO data
    const trazoValidation = validateTrazoLocationForMetrcSync({
      name: room.name,
      metrc_location_type_id: locationTypeId,
      site_license_number: site.site_license_number,
    })

    if (!trazoValidation.isValid) {
      const errorMessages = trazoValidation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Room validation failed: ${errorMessages.join(', ')}`)
    }

    // Collect warnings
    trazoValidation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // Get API keys for the site
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('compliance_api_keys')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .single()

    if (apiKeyError || !apiKey) {
      throw new Error('No active Metrc API key found for this site')
    }

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: organizationId,
      site_id: siteId,
      sync_type: 'locations',
      direction: 'push',
      operation: 'create',
      local_id: roomId,
      initiated_by: userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    // Update sync log to in_progress and room status to syncing
    await Promise.all([
      updateSyncLogEntry(syncLog.id, { status: 'in_progress' }),
      supabase
        .from('rooms')
        .update({ metrc_sync_status: 'syncing' })
        .eq('id', roomId),
    ])

    // Initialize Metrc client
    const metrcClient = new MetrcClient({
      vendorApiKey: apiKey.vendor_api_key,
      userApiKey: apiKey.user_api_key,
      facilityLicenseNumber: apiKey.facility_license_number,
      state: apiKey.state_code,
      isSandbox: apiKey.is_sandbox,
    })

    // Check for duplicate location names in Metrc
    const existingLocations = await metrcClient.locations.listActive()
    const existingNames = existingLocations.map((loc) => loc.Name)
    const duplicateCheck = checkDuplicateLocationName(room.name, existingNames)
    duplicateCheck.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // Build Metrc location payload
    const metrcLocation: MetrcLocationCreate = {
      Name: room.name.trim(),
      LocationTypeId: locationTypeId,
    }

    // Validate Metrc payload
    const metrcValidation = validateLocationCreate(metrcLocation)
    if (!metrcValidation.isValid) {
      const errorMessages = metrcValidation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Metrc location validation failed: ${errorMessages.join(', ')}`)
    }

    // Collect Metrc warnings
    metrcValidation.warnings.forEach((w) => {
      result.warnings.push(`Metrc: ${w.field}: ${w.message}`)
    })

    // Create location in Metrc
    await metrcClient.locations.create(metrcLocation)

    // Fetch the created location to get its ID
    const updatedLocations = await metrcClient.locations.listActive()
    const createdLocation = updatedLocations.find(
      (loc) => loc.Name.trim().toLowerCase() === room.name.trim().toLowerCase()
    )

    if (createdLocation) {
      result.metrcLocationId = createdLocation.Id
      result.metrcLocationName = createdLocation.Name

      // Get location type name
      const locationTypes = await metrcClient.locations.listTypes()
      const locationType = locationTypes.find((type) => type.Id === locationTypeId)

      // Update room with Metrc details
      await supabase.from('rooms').update({
        metrc_location_id: createdLocation.Id,
        metrc_location_name: createdLocation.Name,
        metrc_location_type_id: locationTypeId,
        metrc_location_type_name: locationType?.Name || null,
        metrc_sync_status: 'synced',
        metrc_last_synced_at: new Date().toISOString(),
        metrc_sync_error: null,
        updated_at: new Date().toISOString(),
      }).eq('id', roomId)

      // Create mapping record
      await supabase.from('metrc_location_mappings').insert({
        organization_id: organizationId,
        site_id: siteId,
        trazo_location_type: 'room',
        trazo_room_id: roomId,
        metrc_location_id: createdLocation.Id,
        metrc_location_name: createdLocation.Name,
        metrc_location_type_id: locationTypeId,
        metrc_location_type_name: locationType?.Name || '',
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
      })

      // Create sync event
      await supabase.from('metrc_location_sync_events').insert({
        mapping_id: (await supabase
          .from('metrc_location_mappings')
          .select('id')
          .eq('trazo_room_id', roomId)
          .single()).data?.id,
        organization_id: organizationId,
        event_type: 'created',
        sync_direction: 'trazo_to_metrc',
        request_payload: metrcLocation,
        response_payload: createdLocation,
        performed_by: userId,
      })

      // Update sync log
      await updateSyncLogEntry(syncLog.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        response_payload: {
          metrc_location_id: createdLocation.Id,
          metrc_location_name: createdLocation.Name,
        },
      })
    } else {
      // Location created but couldn't find it
      await Promise.all([
        updateSyncLogEntry(syncLog.id, {
          status: 'partial',
          completed_at: new Date().toISOString(),
          error_message: 'Location created but not found in Metrc listing',
        }),
        supabase
          .from('rooms')
          .update({ metrc_sync_status: 'error', metrc_sync_error: 'Verification failed' })
          .eq('id', roomId),
      ])
      result.errors.push('Location created but verification failed')
    }

    result.success = result.errors.length === 0
    return result
  } catch (error) {
    const errorMessage = (error as Error).message

    // Update sync log to failed
    if (result.syncLogId) {
      await updateSyncLogEntry(result.syncLogId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
    }

    // Update room sync status to error
    await supabase
      .from('rooms')
      .update({
        metrc_sync_status: 'error',
        metrc_sync_error: errorMessage,
      })
      .eq('id', roomId)

    result.errors.push(errorMessage)
    return result
  }
}

// =====================================================
// POD SYNC
// =====================================================

/**
 * Sync a TRAZO pod to Metrc as a location
 *
 * @param podId - The pod ID to sync
 * @param siteId - The site ID
 * @param organizationId - The organization ID
 * @param userId - The user ID initiating the sync
 * @param locationTypeId - The Metrc location type ID selected by user
 * @returns Sync result
 */
export async function syncPodToMetrc(
  podId: string,
  siteId: string,
  organizationId: string,
  userId: string,
  locationTypeId: number
): Promise<LocationSyncResult> {
  const supabase = await createClient()
  const result: LocationSyncResult = {
    success: false,
    errors: [],
    warnings: [],
  }

  try {
    // Get the pod with site information
    const { data: pod, error: podError } = await supabase
      .from('pods')
      .select(`
        *,
        room:rooms!inner(
          id,
          name,
          site:sites!inner(
            id,
            name,
            site_license_number,
            organization_id
          )
        )
      `)
      .eq('id', podId)
      .single()

    if (podError || !pod) {
      throw new Error('Pod not found')
    }

    // Extract site data (handle array response from Supabase)
    const room = Array.isArray(pod.room) ? pod.room[0] : pod.room
    const site = room && Array.isArray(room.site) ? room.site[0] : room?.site

    if (!site) {
      throw new Error('Site information not found for pod')
    }

    // Check if already synced
    if (pod.metrc_location_id) {
      throw new Error('Pod is already synced to Metrc')
    }

    // Validate TRAZO data
    const trazoValidation = validateTrazoLocationForMetrcSync({
      name: pod.name,
      metrc_location_type_id: locationTypeId,
      site_license_number: site.site_license_number,
    })

    if (!trazoValidation.isValid) {
      const errorMessages = trazoValidation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Pod validation failed: ${errorMessages.join(', ')}`)
    }

    // Collect warnings
    trazoValidation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // Get API keys for the site
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('compliance_api_keys')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .single()

    if (apiKeyError || !apiKey) {
      throw new Error('No active Metrc API key found for this site')
    }

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: organizationId,
      site_id: siteId,
      sync_type: 'locations',
      direction: 'push',
      operation: 'create',
      local_id: podId,
      initiated_by: userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    // Update sync log to in_progress and pod status to syncing
    await Promise.all([
      updateSyncLogEntry(syncLog.id, { status: 'in_progress' }),
      supabase
        .from('pods')
        .update({ metrc_sync_status: 'syncing' })
        .eq('id', podId),
    ])

    // Initialize Metrc client
    const metrcClient = new MetrcClient({
      vendorApiKey: apiKey.vendor_api_key,
      userApiKey: apiKey.user_api_key,
      facilityLicenseNumber: apiKey.facility_license_number,
      state: apiKey.state_code,
      isSandbox: apiKey.is_sandbox,
    })

    // Check for duplicate location names in Metrc
    const existingLocations = await metrcClient.locations.listActive()
    const existingNames = existingLocations.map((loc) => loc.Name)
    const duplicateCheck = checkDuplicateLocationName(pod.name, existingNames)
    duplicateCheck.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // Build Metrc location payload
    const metrcLocation: MetrcLocationCreate = {
      Name: pod.name.trim(),
      LocationTypeId: locationTypeId,
    }

    // Validate Metrc payload
    const metrcValidation = validateLocationCreate(metrcLocation)
    if (!metrcValidation.isValid) {
      const errorMessages = metrcValidation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Metrc location validation failed: ${errorMessages.join(', ')}`)
    }

    // Collect Metrc warnings
    metrcValidation.warnings.forEach((w) => {
      result.warnings.push(`Metrc: ${w.field}: ${w.message}`)
    })

    // Create location in Metrc
    await metrcClient.locations.create(metrcLocation)

    // Fetch the created location to get its ID
    const updatedLocations = await metrcClient.locations.listActive()
    const createdLocation = updatedLocations.find(
      (loc) => loc.Name.trim().toLowerCase() === pod.name.trim().toLowerCase()
    )

    if (createdLocation) {
      result.metrcLocationId = createdLocation.Id
      result.metrcLocationName = createdLocation.Name

      // Get location type name
      const locationTypes = await metrcClient.locations.listTypes()
      const locationType = locationTypes.find((type) => type.Id === locationTypeId)

      // Update pod with Metrc details
      await supabase.from('pods').update({
        metrc_location_id: createdLocation.Id,
        metrc_location_name: pod.name,
        metrc_location_type_id: locationTypeId,
        metrc_location_type_name: locationType?.Name || null,
        metrc_sync_status: 'synced',
        metrc_last_synced_at: new Date().toISOString(),
        metrc_sync_error: null,
        updated_at: new Date().toISOString(),
      }).eq('id', podId)

      // Create mapping record
      const mappingData = {
        organization_id: organizationId,
        site_id: siteId,
        trazo_location_type: 'pod' as const,
        trazo_pod_id: podId,
        metrc_location_id: createdLocation.Id,
        metrc_location_name: createdLocation.Name,
        metrc_location_type_id: locationTypeId,
        metrc_location_type_name: locationType?.Name || '',
        sync_status: 'synced' as const,
        last_synced_at: new Date().toISOString(),
      }

      const { data: mapping } = await supabase
        .from('metrc_location_mappings')
        .insert(mappingData)
        .select('id')
        .single()

      // Create sync event
      if (mapping) {
        await supabase.from('metrc_location_sync_events').insert({
          mapping_id: mapping.id,
          organization_id: organizationId,
          event_type: 'created',
          sync_direction: 'trazo_to_metrc',
          request_payload: metrcLocation,
          response_payload: createdLocation,
          performed_by: userId,
        })
      }

      // Update sync log
      await updateSyncLogEntry(syncLog.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        response_payload: {
          metrc_location_id: createdLocation.Id,
          metrc_location_name: createdLocation.Name,
        },
      })
    } else {
      // Location created but couldn't find it
      await Promise.all([
        updateSyncLogEntry(syncLog.id, {
          status: 'partial',
          completed_at: new Date().toISOString(),
          error_message: 'Location created but not found in Metrc listing',
        }),
        supabase
          .from('pods')
          .update({ metrc_sync_status: 'error', metrc_sync_error: 'Verification failed' })
          .eq('id', podId),
      ])
      result.errors.push('Location created but verification failed')
    }

    result.success = result.errors.length === 0
    return result
  } catch (error) {
    const errorMessage = (error as Error).message

    // Update sync log to failed
    if (result.syncLogId) {
      await updateSyncLogEntry(result.syncLogId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
    }

    // Update pod sync status to error
    await supabase
      .from('pods')
      .update({
        metrc_sync_status: 'error',
        metrc_sync_error: errorMessage,
      })
      .eq('id', podId)

    result.errors.push(errorMessage)
    return result
  }
}

// =====================================================
// SYNC STATUS HELPERS
// =====================================================

/**
 * Get sync status for a room
 *
 * @param roomId - The room ID
 * @returns Sync status information
 */
export async function getRoomSyncStatus(roomId: string): Promise<{
  isSynced: boolean
  metrcLocationId?: number
  metrcLocationName?: string
  lastSyncedAt?: string
  syncStatus?: string
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data: room } = await supabase
      .from('rooms')
      .select('metrc_location_id, metrc_location_name, metrc_sync_status, metrc_last_synced_at, metrc_sync_error')
      .eq('id', roomId)
      .single()

    if (room && room.metrc_location_id) {
      return {
        isSynced: true,
        metrcLocationId: room.metrc_location_id,
        metrcLocationName: room.metrc_location_name || undefined,
        lastSyncedAt: room.metrc_last_synced_at || undefined,
        syncStatus: room.metrc_sync_status || undefined,
        error: room.metrc_sync_error || undefined,
      }
    }

    return { isSynced: false }
  } catch (error) {
    return {
      isSynced: false,
      error: (error as Error).message,
    }
  }
}

/**
 * Get sync status for a pod
 *
 * @param podId - The pod ID
 * @returns Sync status information
 */
export async function getPodSyncStatus(podId: string): Promise<{
  isSynced: boolean
  metrcLocationId?: number
  metrcLocationName?: string
  lastSyncedAt?: string
  syncStatus?: string
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data: pod } = await supabase
      .from('pods')
      .select('metrc_location_id, metrc_location_name, metrc_sync_status, metrc_last_synced_at, metrc_sync_error')
      .eq('id', podId)
      .single()

    if (pod && pod.metrc_location_id) {
      return {
        isSynced: true,
        metrcLocationId: pod.metrc_location_id,
        metrcLocationName: pod.metrc_location_name || undefined,
        lastSyncedAt: pod.metrc_last_synced_at || undefined,
        syncStatus: pod.metrc_sync_status || undefined,
        error: pod.metrc_sync_error || undefined,
      }
    }

    return { isSynced: false }
  } catch (error) {
    return {
      isSynced: false,
      error: (error as Error).message,
    }
  }
}
