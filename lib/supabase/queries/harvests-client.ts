/**
 * Harvest Management Client-Side Queries
 *
 * Client-side CRUD operations for harvests
 */

import { createClient } from '@/lib/supabase/client'

export interface CreateHarvestParams {
  batchId: string
  organizationId: string
  wetWeight: number
  dryWeight?: number
  wasteWeight?: number
  plantCount: number
  harvestType?: 'WholePlant' | 'Manicure' | 'Flower'
  harvestedAt: string
  location?: string
  dryingLocation?: string
  notes?: string
}

/**
 * Get batches ready to harvest (stage = 'harvest', no harvest record yet)
 */
export async function getBatchesReadyToHarvest(orgId: string, siteId?: string) {
  try {
    const supabase = createClient()

    // Get batches at harvest stage
    let batchQuery = supabase
      .from('batches')
      .select(`
        id,
        batch_number,
        plant_count,
        stage,
        expected_harvest_date,
        cultivar:cultivars(id, name),
        pod_assignments:batch_pod_assignments!inner(
          pod:pods(id, name, metrc_location_name)
        )
      `)
      .eq('organization_id', orgId)
      .eq('stage', 'harvest')
      .eq('status', 'active')
      .order('expected_harvest_date', { ascending: true })

    if (siteId) {
      batchQuery = batchQuery.eq('site_id', siteId)
    }

    const { data: batches, error: batchError } = await batchQuery

    if (batchError) throw batchError

    if (!batches || batches.length === 0) {
      return { data: [], error: null }
    }

    // Get harvest records for these batches
    const batchIds = batches.map((b) => b.id)
    const { data: harvestRecords } = await supabase
      .from('harvest_records')
      .select('batch_id')
      .in('batch_id', batchIds)

    // Filter out batches that already have harvest records
    const harvestedBatchIds = new Set(harvestRecords?.map((hr) => hr.batch_id) || [])
    const readyBatches = batches.filter((b) => !harvestedBatchIds.has(b.id))

    return { data: readyBatches, error: null }
  } catch (error) {
    console.error('Error in getBatchesReadyToHarvest:', error)
    return { data: null, error }
  }
}

/**
 * Get all harvests for an organization
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
    const supabase = createClient()
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
        ),
        packages:harvest_packages(count)
      `)
      .eq('organization_id', orgId)
      .order('harvested_at', { ascending: false })

    // Apply filters
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
 * Get a single harvest by ID
 */
export async function getHarvestById(harvestId: string) {
  try {
    const supabase = createClient()
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
          synced_at
        ),
        packages:harvest_packages(count)
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
 * Create a new harvest
 */
export async function createHarvest(params: CreateHarvestParams) {
  try {
    const response = await fetch('/api/harvests/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create harvest')
    }

    const data = await response.json()
    return { data: data.harvest, error: null }
  } catch (error) {
    console.error('Error creating harvest:', error)
    return { data: null, error }
  }
}

/**
 * Update a harvest
 */
export async function updateHarvest(
  harvestId: string,
  updates: {
    dryWeight?: number
    wasteWeight?: number
    dryingLocation?: string
    status?: 'active' | 'drying' | 'curing' | 'finished' | 'on_hold'
    finishedAt?: string
    notes?: string
  }
) {
  try {
    const response = await fetch('/api/harvests/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ harvestId, ...updates }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update harvest')
    }

    const data = await response.json()
    return { data: data.harvest, error: null }
  } catch (error) {
    console.error('Error updating harvest:', error)
    return { data: null, error }
  }
}

/**
 * Create packages from harvest
 */
export async function createPackagesFromHarvest(
  harvestId: string,
  packages: {
    packageTag: string
    packageType: 'Product' | 'ImmaturePlant' | 'VegetativePlant' | 'Waste'
    productName: string
    itemCategory?: string
    quantity: number
    unitOfMeasure: string
    location?: string
    productionBatchNumber?: string
    isTradeSample?: boolean
    isTestingSample?: boolean
    notes?: string
  }[]
) {
  try {
    const response = await fetch('/api/harvests/create-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ harvestId, packages }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create packages')
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    console.error('Error creating packages:', error)
    return { data: null, error }
  }
}

/**
 * Get harvests ready for packaging
 */
export async function getHarvestsReadyForPackaging(orgId: string, siteId?: string) {
  try {
    const supabase = createClient()
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

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getHarvestsReadyForPackaging:', error)
    return { data: null, error }
  }
}
