/**
 * Harvest Management Database Queries
 *
 * CRUD operations for harvest_records, harvest_packages, and related tables
 */

import { createClient } from '@/lib/supabase/server'

export interface CreateHarvestParams {
  batch_id: string
  organization_id: string
  wet_weight_g: number
  dry_weight_g?: number
  waste_weight_g?: number
  plant_count: number
  harvest_type?: 'WholePlant' | 'Manicure' | 'Flower'
  harvested_at: string
  harvested_by?: string
  location?: string
  drying_location?: string
  notes?: string
}

export interface UpdateHarvestParams {
  dry_weight_g?: number
  waste_weight_g?: number
  drying_location?: string
  status?: 'active' | 'drying' | 'curing' | 'finished' | 'on_hold'
  finished_at?: string
  notes?: string
}

/**
 * Get all harvests for an organization with filters
 */
export async function getHarvests(
  orgId: string,
  siteId?: string,
  filters?: {
    batchId?: string
    status?: string | string[]
    startDate?: string
    endDate?: string
  }
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('harvest_records')
      .select(`
        *,
        batch:batches!inner(
          id,
          batch_number,
          cultivar:cultivars(name)
        ),
        harvested_by_user:users!harvested_by(id, full_name),
        metrc_mapping:metrc_harvest_mappings(
          metrc_harvest_id,
          metrc_harvest_name,
          sync_status
        )
      `)
      .eq('organization_id', orgId)
      .order('harvested_at', { ascending: false })

    // Apply filters
    if (siteId) {
      // Filter via batch relationship
      query = query.eq('batches.site_id', siteId)
    }

    if (filters?.batchId) {
      query = query.eq('batch_id', filters.batchId)
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }

    if (filters?.startDate) {
      query = query.gte('harvested_at', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('harvested_at', filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getHarvests:', error)
    return { data: null, error }
  }
}

/**
 * Get a single harvest by ID with full details
 */
export async function getHarvestById(harvestId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('harvest_records')
      .select(`
        *,
        batch:batches!inner(
          id,
          batch_number,
          stage,
          plant_count,
          cultivar:cultivars(id, name)
        ),
        harvested_by_user:users!harvested_by(id, full_name, email),
        metrc_mapping:metrc_harvest_mappings(
          metrc_harvest_id,
          metrc_harvest_name,
          sync_status,
          synced_at,
          last_synced_at
        ),
        packages:harvest_packages(count),
        waste_logs:harvest_waste_logs(count)
      `)
      .eq('id', harvestId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getHarvestById:', error)
    return { data: null, error }
  }
}

/**
 * Create a new harvest record
 */
export async function createHarvest(params: CreateHarvestParams, userId: string) {
  try {
    const supabase = await createClient()

    // Get current user if harvested_by not provided
    const harvestedBy = params.harvested_by || userId

    const { data: harvest, error: harvestError } = await supabase
      .from('harvest_records')
      .insert({
        batch_id: params.batch_id,
        organization_id: params.organization_id,
        wet_weight: params.wet_weight_g,
        dry_weight_g: params.dry_weight_g || null,
        waste_weight_g: params.waste_weight_g || null,
        unit_of_weight: 'Grams',
        harvest_type: params.harvest_type || 'WholePlant',
        plant_count: params.plant_count,
        harvested_at: params.harvested_at,
        harvested_by: harvestedBy,
        location: params.location || null,
        drying_location: params.drying_location || null,
        notes: params.notes || null,
        status: 'active',
      })
      .select()
      .single()

    if (harvestError) throw harvestError

    // Create batch event
    await supabase.from('batch_events').insert({
      batch_id: params.batch_id,
      event_type: 'harvest_started',
      harvest_id: harvest.id,
      user_id: userId,
      to_value: {
        wet_weight: params.wet_weight_g,
        plant_count: params.plant_count,
        harvest_type: params.harvest_type || 'WholePlant',
      },
    })

    // Auto-sync to Metrc (non-blocking)
    // Import dynamically to avoid circular dependencies
    const { syncHarvestToMetrc } = await import(
      '@/lib/compliance/metrc/sync/harvest-sync'
    )
    syncHarvestToMetrc(harvest.id, userId).catch((error) => {
      console.error('Metrc harvest sync failed (non-blocking):', error)
    })

    return { data: harvest, error: null }
  } catch (error) {
    console.error('Error in createHarvest:', error)
    return { data: null, error }
  }
}

/**
 * Update a harvest record
 */
export async function updateHarvest(
  harvestId: string,
  updates: UpdateHarvestParams,
  userId: string
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('harvest_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', harvestId)
      .select()
      .single()

    if (error) throw error

    // If status changed to finished, create event
    if (updates.status === 'finished') {
      const { data: harvest } = await getHarvestById(harvestId)
      if (harvest) {
        await supabase.from('batch_events').insert({
          batch_id: harvest.batch.id,
          event_type: 'harvest_finished',
          harvest_id: harvestId,
          user_id: userId,
          to_value: {
            dry_weight: updates.dry_weight_g,
            finished_at: updates.finished_at,
          },
        })

        // Sync finish to Metrc (non-blocking)
        if (updates.finished_at) {
          const { finishHarvestInMetrc } = await import(
            '@/lib/compliance/metrc/sync/harvest-sync'
          )
          finishHarvestInMetrc(harvestId, updates.finished_at, userId).catch((error) => {
            console.error('Metrc harvest finish sync failed (non-blocking):', error)
          })
        }
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in updateHarvest:', error)
    return { data: null, error }
  }
}

/**
 * Get harvests for a specific batch
 */
export async function getBatchHarvests(batchId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('harvest_records')
      .select(`
        *,
        harvested_by_user:users!harvested_by(id, full_name),
        metrc_mapping:metrc_harvest_mappings(
          metrc_harvest_id,
          metrc_harvest_name,
          sync_status
        ),
        packages:harvest_packages(count)
      `)
      .eq('batch_id', batchId)
      .order('harvested_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getBatchHarvests:', error)
    return { data: null, error }
  }
}

/**
 * Get harvests ready for packaging (status: drying or curing)
 */
export async function getHarvestsReadyForPackaging(orgId: string, siteId?: string) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('harvest_records')
      .select(`
        *,
        batch:batches!inner(
          id,
          batch_number,
          cultivar:cultivars(name)
        ),
        metrc_mapping:metrc_harvest_mappings(
          metrc_harvest_id,
          metrc_harvest_name
        )
      `)
      .eq('organization_id', orgId)
      .in('status', ['drying', 'curing'])
      .order('harvested_at', { ascending: true })

    if (siteId) {
      query = query.eq('batches.site_id', siteId)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getHarvestsReadyForPackaging:', error)
    return { data: null, error }
  }
}

/**
 * Record waste removal from harvest
 */
export async function recordHarvestWaste(
  harvestId: string,
  wasteData: {
    batch_id: string
    organization_id: string
    waste_type: string
    waste_weight: number
    unit_of_weight?: string
    actual_date: string
    disposal_location?: string
    disposal_method?: string
    disposal_notes?: string
  },
  userId: string
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('harvest_waste_logs')
      .insert({
        harvest_id: harvestId,
        batch_id: wasteData.batch_id,
        organization_id: wasteData.organization_id,
        waste_type: wasteData.waste_type,
        waste_weight: wasteData.waste_weight,
        unit_of_weight: wasteData.unit_of_weight || 'Grams',
        actual_date: wasteData.actual_date,
        disposal_location: wasteData.disposal_location || null,
        disposal_method: wasteData.disposal_method || null,
        disposal_notes: wasteData.disposal_notes || null,
        recorded_by: userId,
      })
      .select()
      .single()

    if (error) throw error

    // Create batch event
    await supabase.from('batch_events').insert({
      batch_id: wasteData.batch_id,
      event_type: 'waste_removed',
      harvest_id: harvestId,
      user_id: userId,
      to_value: {
        waste_weight: wasteData.waste_weight,
        waste_type: wasteData.waste_type,
      },
    })

    return { data, error: null }
  } catch (error) {
    console.error('Error in recordHarvestWaste:', error)
    return { data: null, error }
  }
}

/**
 * Get harvest statistics for an organization
 */
export async function getHarvestStatistics(orgId: string, dateRange?: { start: string; end: string }) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('harvest_records')
      .select('wet_weight, dry_weight_g, waste_weight_g, plant_count, harvested_at, status')
      .eq('organization_id', orgId)

    if (dateRange) {
      query = query
        .gte('harvested_at', dateRange.start)
        .lte('harvested_at', dateRange.end)
    }

    const { data, error } = await query

    if (error) throw error

    const stats = {
      total_harvests: data?.length || 0,
      total_wet_weight: data?.reduce((sum, h) => sum + (h.wet_weight || 0), 0) || 0,
      total_dry_weight: data?.reduce((sum, h) => sum + (h.dry_weight_g || 0), 0) || 0,
      total_waste_weight: data?.reduce((sum, h) => sum + (h.waste_weight_g || 0), 0) || 0,
      total_plants_harvested: data?.reduce((sum, h) => sum + (h.plant_count || 0), 0) || 0,
      average_yield_per_plant: 0,
      average_moisture_loss: 0,
      status_breakdown: {} as Record<string, number>,
    }

    // Calculate averages
    if (stats.total_plants_harvested > 0) {
      stats.average_yield_per_plant = stats.total_dry_weight / stats.total_plants_harvested
    }

    // Calculate average moisture loss
    const harvestsWithDry = data?.filter((h) => h.dry_weight_g && h.wet_weight) || []
    if (harvestsWithDry.length > 0) {
      const totalMoistureLoss = harvestsWithDry.reduce((sum, h) => {
        const loss = ((h.wet_weight - (h.dry_weight_g || 0)) / h.wet_weight) * 100
        return sum + loss
      }, 0)
      stats.average_moisture_loss = totalMoistureLoss / harvestsWithDry.length
    }

    // Status breakdown
    data?.forEach((h) => {
      const status = h.status || 'unknown'
      stats.status_breakdown[status] = (stats.status_breakdown[status] || 0) + 1
    })

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error in getHarvestStatistics:', error)
    return { data: null, error }
  }
}
