/**
 * Metrc Location Sync Service
 *
 * Handles bidirectional sync between Trazo rooms and Metrc locations.
 * Metrc is the source of truth.
 */

import { createMetrcClient } from './credential-service'
import type { MetrcLocation, MetrcLocationCreate } from '../types'

/**
 * Room data from Trazo database
 */
export interface TrazoRoom {
  id: string
  siteId: string
  name: string
  roomType: string
  capacityPods: number
  isActive: boolean
  metrcLocationId?: number | null
  metrcLocationName?: string | null
  metrcSyncStatus?: string | null
}

/**
 * Location sync result for a single location (Metrc → Trazo)
 */
export interface LocationSyncItem {
  metrcLocationId: number
  metrcLocationName: string
  metrcLocationTypeName: string
  trazoRoomId?: string
  action: 'created' | 'updated' | 'matched' | 'orphaned'
  details?: string
}

/**
 * Push item for rooms being pushed to Metrc (Trazo → Metrc)
 */
export interface LocationPushItem {
  trazoRoomId: string
  trazoRoomName: string
  metrcLocationId?: number
  metrcLocationName?: string
  action: 'pushed' | 'push_error' | 'skipped'
  details?: string
}

/**
 * Full sync result
 */
export interface LocationSyncResult {
  success: boolean
  syncedAt: string
  totalMetrcLocations: number
  totalTrazoRooms: number
  created: number  // New rooms created in Trazo from Metrc
  updated: number  // Existing rooms updated
  matched: number  // Rooms that already matched
  orphaned: number  // Trazo rooms not in Metrc
  items: LocationSyncItem[]
  errors: string[]
}

/**
 * Fetch all active locations from Metrc for a facility
 */
export async function fetchMetrcLocations(
  stateCode: string,
  userApiKey: string,
  facilityLicenseNumber: string,
  isSandbox: boolean = false
): Promise<{ locations: MetrcLocation[]; error?: string }> {
  try {
    const client = createMetrcClient(stateCode, userApiKey, facilityLicenseNumber, isSandbox)
    const result = await client.locations.listActive()

    return { locations: result.data }
  } catch (error) {
    return {
      locations: [],
      error: `Failed to fetch locations: ${(error as Error).message}`,
    }
  }
}

/**
 * Create a location in Metrc
 */
export async function createMetrcLocation(
  stateCode: string,
  userApiKey: string,
  facilityLicenseNumber: string,
  locationName: string,
  locationTypeId: number,
  locationTypeName: string,
  isSandbox: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createMetrcClient(stateCode, userApiKey, facilityLicenseNumber, isSandbox)

    const payload: MetrcLocationCreate = {
      Name: locationName,
      LocationTypeId: locationTypeId,
      LocationTypeName: locationTypeName,
    }

    await client.locations.create(payload)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Failed to create location: ${(error as Error).message}`,
    }
  }
}

/**
 * Sync locations from Metrc to Trazo rooms
 * This is a comparison function - actual DB updates are done by the caller
 *
 * @param metrcLocations - Locations from Metrc
 * @param trazoRooms - Existing rooms in Trazo
 * @returns Sync actions to be performed
 */
export function calculateLocationSync(
  metrcLocations: MetrcLocation[],
  trazoRooms: TrazoRoom[]
): LocationSyncResult {
  const result: LocationSyncResult = {
    success: true,
    syncedAt: new Date().toISOString(),
    totalMetrcLocations: metrcLocations.length,
    totalTrazoRooms: trazoRooms.length,
    created: 0,
    updated: 0,
    matched: 0,
    orphaned: 0,
    items: [],
    errors: [],
  }

  // Build lookup maps
  const metrcByName = new Map<string, MetrcLocation>()
  const metrcById = new Map<number, MetrcLocation>()
  for (const loc of metrcLocations) {
    metrcByName.set(loc.Name.toLowerCase().trim(), loc)
    metrcById.set(loc.Id, loc)
  }

  const trazoByMetrcId = new Map<number, TrazoRoom>()
  const trazoByName = new Map<string, TrazoRoom>()
  for (const room of trazoRooms) {
    if (room.metrcLocationId) {
      trazoByMetrcId.set(room.metrcLocationId, room)
    }
    trazoByName.set(room.name.toLowerCase().trim(), room)
  }

  // Process Metrc locations
  for (const metrcLoc of metrcLocations) {
    // Check if linked by ID first
    const linkedRoom = trazoByMetrcId.get(metrcLoc.Id)
    if (linkedRoom) {
      // Already linked - check if needs update
      if (linkedRoom.name.toLowerCase().trim() !== metrcLoc.Name.toLowerCase().trim()) {
        result.items.push({
          metrcLocationId: metrcLoc.Id,
          metrcLocationName: metrcLoc.Name,
          metrcLocationTypeName: metrcLoc.LocationTypeName || 'Default',
          trazoRoomId: linkedRoom.id,
          action: 'updated',
          details: `Name changed from "${linkedRoom.name}" to "${metrcLoc.Name}"`,
        })
        result.updated++
      } else {
        result.items.push({
          metrcLocationId: metrcLoc.Id,
          metrcLocationName: metrcLoc.Name,
          metrcLocationTypeName: metrcLoc.LocationTypeName || 'Default',
          trazoRoomId: linkedRoom.id,
          action: 'matched',
        })
        result.matched++
      }
      continue
    }

    // Check if matches by name (for initial sync)
    const matchedByName = trazoByName.get(metrcLoc.Name.toLowerCase().trim())
    if (matchedByName && !matchedByName.metrcLocationId) {
      result.items.push({
        metrcLocationId: metrcLoc.Id,
        metrcLocationName: metrcLoc.Name,
        metrcLocationTypeName: metrcLoc.LocationTypeName || 'Default',
        trazoRoomId: matchedByName.id,
        action: 'updated',
        details: 'Linked existing room by name match',
      })
      result.updated++
      continue
    }

    // New location - needs to create room in Trazo
    result.items.push({
      metrcLocationId: metrcLoc.Id,
      metrcLocationName: metrcLoc.Name,
      metrcLocationTypeName: metrcLoc.LocationTypeName || 'Default',
      action: 'created',
      details: 'New room will be created from Metrc location',
    })
    result.created++
  }

  // Find orphaned Trazo rooms (not in Metrc)
  for (const room of trazoRooms) {
    if (room.metrcLocationId && !metrcById.has(room.metrcLocationId)) {
      result.items.push({
        metrcLocationId: room.metrcLocationId,
        metrcLocationName: room.metrcLocationName || room.name,
        metrcLocationTypeName: 'Unknown',
        trazoRoomId: room.id,
        action: 'orphaned',
        details: 'Room exists in Trazo but location was deleted in Metrc',
      })
      result.orphaned++
    }
  }

  return result
}

/**
 * Map Metrc location type to Trazo room type
 */
export function mapLocationTypeToRoomType(locationTypeName: string): string {
  const name = locationTypeName.toLowerCase()

  if (name.includes('veg') || name.includes('vegetative')) {
    return 'veg'
  }
  if (name.includes('flower') || name.includes('bloom')) {
    return 'flower'
  }
  if (name.includes('mother') || name.includes('stock')) {
    return 'mother'
  }
  if (name.includes('clone') || name.includes('propagation')) {
    return 'clone'
  }
  if (name.includes('dry') || name.includes('drying')) {
    return 'dry'
  }
  if (name.includes('cure') || name.includes('curing')) {
    return 'cure'
  }
  if (name.includes('harvest')) {
    return 'dry'
  }
  if (name.includes('processing') || name.includes('trim')) {
    return 'processing'
  }
  if (name.includes('storage') || name.includes('vault') || name.includes('inventory')) {
    return 'storage'
  }

  return 'mixed'  // Default fallback
}

/**
 * Generate room data from Metrc location for creation
 */
export function metrcLocationToRoom(
  location: MetrcLocation,
  siteId: string
): Omit<TrazoRoom, 'id'> & { metrcLocationId: number; metrcLocationName: string; metrcSyncStatus: string } {
  return {
    siteId,
    name: location.Name,
    roomType: mapLocationTypeToRoomType(location.LocationTypeName || 'Default'),
    capacityPods: 8,  // Default capacity
    isActive: true,
    metrcLocationId: location.Id,
    metrcLocationName: location.Name,
    metrcSyncStatus: 'synced',
  }
}

/**
 * Find Trazo rooms that need to be pushed to Metrc
 * These are rooms without a metrc_location_id that don't match any existing Metrc location by name
 *
 * @param metrcLocations - Locations from Metrc
 * @param trazoRooms - Existing rooms in Trazo
 * @returns Rooms that need to be created in Metrc
 */
export function findRoomsToPushToMetrc(
  metrcLocations: MetrcLocation[],
  trazoRooms: TrazoRoom[]
): TrazoRoom[] {
  // Build lookup of Metrc location names (case-insensitive)
  const metrcByName = new Map<string, MetrcLocation>()
  for (const loc of metrcLocations) {
    metrcByName.set(loc.Name.toLowerCase().trim(), loc)
  }

  // Find rooms without Metrc ID and without a matching name in Metrc
  return trazoRooms.filter(room => {
    // Skip if already has a Metrc location ID
    if (room.metrcLocationId) {
      return false
    }
    // Skip if inactive
    if (!room.isActive) {
      return false
    }
    // Skip if name matches an existing Metrc location (will be linked during pull sync)
    const normalizedName = room.name.toLowerCase().trim()
    if (metrcByName.has(normalizedName)) {
      return false
    }
    // This room needs to be pushed to Metrc
    return true
  })
}
