import { createClient } from '@/lib/supabase/client'

export interface PodWithRoom {
  id: string
  name: string
  status: string
  room_id: string
  room?: {
    id: string
    name: string
  } | null
  max_plant_count: number | null
  canopy_area_sqft: number | null
}

export async function getPodsBySiteClient(siteId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('pods')
      .select('id, name, status, room_id, max_plant_count, canopy_area_sqft, room:rooms(id, name)')
      .eq('room.site_id', siteId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error

    type RawPodRow = {
      id: string
      name: string
      status: string
      room_id: string
      max_plant_count: number | null
      canopy_area_sqft: number | null
      room?: Array<{ id: string; name: string }> | { id: string; name: string } | null
    }

    const mapped = (data ?? []).map((row) => {
      const raw = row as RawPodRow
      const roomArray = Array.isArray(raw.room) ? raw.room : raw.room ? [raw.room] : []
      return {
        id: raw.id,
        name: raw.name,
        status: raw.status,
        room_id: raw.room_id,
        max_plant_count: raw.max_plant_count ?? null,
        canopy_area_sqft: raw.canopy_area_sqft ?? null,
        room: roomArray.length ? roomArray[0]! : null,
      }
    }) as PodWithRoom[]

    return { data: mapped, error: null }
  } catch (error) {
    console.error('Error in getPodsBySiteClient:', error)
    return { data: null, error }
  }
}
