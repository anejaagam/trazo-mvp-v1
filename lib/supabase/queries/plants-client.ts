'use client'

import { createClient } from '@/lib/supabase/client'

export interface PlantListItem {
  id: string
  metrc_tag: string | null
  plant_batch_id: string
  site_id: string
  organization_id: string
  growth_phase: 'Clone' | 'Vegetative' | 'Flowering'
  metrc_plant_id: number | null
  strain_name: string
  cultivar_id: string | null
  location_name: string
  sublocation: string | null
  planted_date: string
  vegetative_date: string | null
  flowering_date: string | null
  phase_changed_at: string | null
  harvested_at: string | null
  destroyed_at: string | null
  status: 'active' | 'harvested' | 'destroyed'
  created_at: string
  updated_at: string
  // Joined data
  batch?: {
    id: string
    batch_number: string
    cultivar?: {
      id: string
      name: string
    }
  }
}

export interface PlantFilters {
  plant_batch_id?: string
  growth_phase?: 'Clone' | 'Vegetative' | 'Flowering'
  status?: 'active' | 'harvested' | 'destroyed'
  search?: string
}

/**
 * Get plants for a site with optional filters
 */
export async function getPlants(
  organizationId: string,
  siteId: string,
  filters?: PlantFilters
): Promise<{ data: PlantListItem[] | null; error: Error | null }> {
  const supabase = createClient()

  try {
    let query = supabase
      .from('plants')
      .select(`
        id,
        metrc_tag,
        plant_batch_id,
        site_id,
        organization_id,
        growth_phase,
        metrc_plant_id,
        strain_name,
        cultivar_id,
        location_name,
        sublocation,
        planted_date,
        vegetative_date,
        flowering_date,
        phase_changed_at,
        harvested_at,
        destroyed_at,
        status,
        created_at,
        updated_at,
        batch:batches!plants_plant_batch_id_fkey(
          id,
          batch_number,
          cultivar:cultivars(id, name)
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    // Apply site filter if not aggregate view
    if (siteId && siteId !== 'all') {
      query = query.eq('site_id', siteId)
    }

    // Apply filters
    if (filters?.plant_batch_id) {
      query = query.eq('plant_batch_id', filters.plant_batch_id)
    }
    if (filters?.growth_phase) {
      query = query.eq('growth_phase', filters.growth_phase)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.search) {
      query = query.or(`metrc_tag.ilike.%${filters.search}%,location_name.ilike.%${filters.search}%,strain_name.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform batch array to single object (Supabase returns arrays for joins)
    const transformed = data?.map((plant: Record<string, unknown>) => ({
      ...plant,
      batch: Array.isArray(plant.batch) ? plant.batch[0] : plant.batch,
    })) || []

    return { data: transformed as PlantListItem[], error: null }
  } catch (error) {
    console.error('Error fetching plants:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get a single plant by ID
 */
export async function getPlant(
  plantId: string
): Promise<{ data: PlantListItem | null; error: Error | null }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('plants')
      .select(`
        id,
        metrc_tag,
        plant_batch_id,
        site_id,
        organization_id,
        growth_phase,
        metrc_plant_id,
        strain_name,
        cultivar_id,
        location_name,
        sublocation,
        planted_date,
        vegetative_date,
        flowering_date,
        phase_changed_at,
        harvested_at,
        destroyed_at,
        status,
        created_at,
        updated_at,
        batch:batches!plants_plant_batch_id_fkey(
          id,
          batch_number,
          cultivar:cultivars(id, name)
        )
      `)
      .eq('id', plantId)
      .single()

    if (error) throw error

    // Transform batch array to single object (Supabase returns arrays for joins)
    const plant = data as Record<string, unknown>
    const transformed = {
      ...plant,
      batch: Array.isArray(plant?.batch) ? plant.batch[0] : plant?.batch,
    }

    return { data: transformed as PlantListItem, error: null }
  } catch (error) {
    console.error('Error fetching plant:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get plant counts by growth phase for a site
 */
export async function getPlantCountsByPhase(
  organizationId: string,
  siteId: string
): Promise<{ data: Record<string, number> | null; error: Error | null }> {
  const supabase = createClient()

  try {
    let query = supabase
      .from('plants')
      .select('growth_phase')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (siteId && siteId !== 'all') {
      query = query.eq('site_id', siteId)
    }

    const { data, error } = await query

    if (error) throw error

    // Count by phase
    const counts: Record<string, number> = {
      Clone: 0,
      Vegetative: 0,
      Flowering: 0,
    }

    data?.forEach((plant) => {
      if (plant.growth_phase && counts[plant.growth_phase] !== undefined) {
        counts[plant.growth_phase]++
      }
    })

    return { data: counts, error: null }
  } catch (error) {
    console.error('Error fetching plant counts:', error)
    return { data: null, error: error as Error }
  }
}
