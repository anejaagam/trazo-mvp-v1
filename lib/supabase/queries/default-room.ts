/**
 * Default Room Auto-Provisioning
 * 
 * Ensures a default room exists for pod assignment
 * Simplifies pod creation by removing room/site management complexity
 */

import { createClient } from '@/lib/supabase/server'

const DEFAULT_ROOM_NAME = 'Main Cultivation Area'

/**
 * Get or create the default room for a site
 * Auto-creates if it doesn't exist
 */
export async function getOrCreateDefaultRoom(siteId: string): Promise<string> {
  const supabase = await createClient()

  // Try to find existing default room
  const { data: existingRoom } = await supabase
    .from('rooms')
    .select('id')
    .eq('site_id', siteId)
    .eq('name', DEFAULT_ROOM_NAME)
    .single()

  if (existingRoom) {
    return existingRoom.id
  }

  // Create default room
  const { data: newRoom, error } = await supabase
    .from('rooms')
    .insert({
      site_id: siteId,
      name: DEFAULT_ROOM_NAME,
      room_type: 'mixed', // Mixed-use room for general cultivation
      is_active: true,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating default room:', error)
    throw new Error(`Failed to create default room: ${error.message}`)
  }

  if (!newRoom) {
    throw new Error('Failed to create default room: No data returned')
  }

  return newRoom.id
}
