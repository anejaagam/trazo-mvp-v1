/**
 * Batch Management Database Queries
 * 
 * CRUD operations for batches table with domain-specific support for cannabis and produce
 * Supports filtering by domain_type, stage, status, cultivar, and more
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { advanceRecipeStageForBatch, syncPodAndBatchRecipes } from '@/lib/recipes/recipe-sync'
import type {
  BatchInventoryUsage,
  InsertBatch,
  UpdateBatch,
  BatchFilters,
  BatchStage,
} from '@/types/batch'
import type { ItemType, MovementType } from '@/types/inventory'

/**
 * Get all batches for an organization/site with optional filtering
 */
export async function getBatches(
  orgId: string,
  siteId: string,
  filters?: BatchFilters
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('batches')
      .select(`
        *,
        cultivar:cultivars(id, name, common_name)
      `)
      .eq('organization_id', orgId)
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })

    // Apply domain filter
    if (filters?.domain_type) {
      if (Array.isArray(filters.domain_type)) {
        query = query.in('domain_type', filters.domain_type)
      } else {
        query = query.eq('domain_type', filters.domain_type)
      }
    }

    // Apply stage filter
    if (filters?.stage) {
      if (Array.isArray(filters.stage)) {
        query = query.in('stage', filters.stage)
      } else {
        query = query.eq('stage', filters.stage)
      }
    }

    // Apply status filter
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }

    // Apply cultivar filter
    if (filters?.cultivar_id) {
      if (Array.isArray(filters.cultivar_id)) {
        query = query.in('cultivar_id', filters.cultivar_id)
      } else {
        query = query.eq('cultivar_id', filters.cultivar_id)
      }
    }

    // Apply quarantine filter
    if (filters?.quarantine_status === 'quarantined') {
      query = query.eq('status', 'quarantined')
    } else if (filters?.quarantine_status === 'none') {
      query = query.neq('status', 'quarantined')
    }

    // Apply date range filters
    if (filters?.start_date_from) {
      query = query.gte('start_date', filters.start_date_from)
    }
    if (filters?.start_date_to) {
      query = query.lte('start_date', filters.start_date_to)
    }
    if (filters?.expected_harvest_from) {
      query = query.gte('expected_harvest_date', filters.expected_harvest_from)
    }
    if (filters?.expected_harvest_to) {
      query = query.lte('expected_harvest_date', filters.expected_harvest_to)
    }

    // Apply search filter
    if (filters?.search) {
      query = query.ilike('batch_number', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getBatches:', error)
    return { data: null, error }
  }
}

/**
 * Get a single batch by ID with full details
 */
export async function getBatchById(batchId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('batches')
      .select(`
        *,
        cultivar:cultivars(id, name, common_name, description),
        parent_batch:batches!parent_batch_id(id, batch_number, stage),
        created_by_user:users!created_by(id, full_name, email)
      `)
      .eq('id', batchId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getBatchById:', error)
    return { data: null, error }
  }
}

/**
 * Create a new batch
 */
export async function createBatch(batch: InsertBatch) {
  try {
    const supabase = await createClient()
    
    // Get current user for created_by
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('batches')
      .insert({
        ...batch,
        created_by: batch.created_by || user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Create initial batch event
    await createBatchEvent(data.id, 'created', user.id, {
      batch_number: data.batch_number,
      domain_type: data.domain_type,
      stage: data.stage,
    })

    // Create initial stage history
    await supabase
      .from('batch_stage_history')
      .insert({
        batch_id: data.id,
        stage: data.stage,
        started_at: new Date().toISOString(),
        transitioned_by: user.id,
        notes: 'Batch created',
      })

    return { data, error: null }
  } catch (error) {
    console.error('Error in createBatch:', error)
    return { data: null, error }
  }
}

/**
 * Update a batch (partial updates)
 */
export async function updateBatch(batchId: string, updates: UpdateBatch) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('batches')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in updateBatch:', error)
    return { data: null, error }
  }
}

/**
 * Delete a batch (soft delete by setting status to destroyed)
 */
export async function deleteBatch(batchId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('batches')
      .update({
        status: 'destroyed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId)
      .select()
      .single()

    if (error) throw error

    // Log deletion event
    await createBatchEvent(batchId, 'destruction', user.id)

    return { data, error: null }
  } catch (error) {
    console.error('Error in deleteBatch:', error)
    return { data: null, error }
  }
}

/**
 * Transition batch to a new stage
 */
export async function transitionBatchStage(
  batchId: string,
  newStage: BatchStage,
  userId: string,
  notes?: string
) {
  try {
    const supabase = await createClient()

    // Use the database function for proper validation and event logging
    const { error } = await supabase.rpc('transition_batch_stage', {
      p_batch_id: batchId,
      p_new_stage: newStage,
      p_user_id: userId,
      p_notes: notes,
    })

    if (error) throw error

    await advanceRecipeStageForBatch({
      supabase,
      batchId,
      userId,
    })

    // Get updated batch
    return await getBatchById(batchId)
  } catch (error) {
    console.error('Error in transitionBatchStage:', error)
    return { data: null, error }
  }
}

/**
 * Quarantine a batch
 */
export async function quarantineBatch(
  batchId: string,
  reason: string,
  userId: string
) {
  try {
    const supabase = await createClient()

    // Use the database function
    const { error } = await supabase.rpc('quarantine_batch', {
      p_batch_id: batchId,
      p_reason: reason,
      p_user_id: userId,
    })

    if (error) throw error

    // Get updated batch
    return await getBatchById(batchId)
  } catch (error) {
    console.error('Error in quarantineBatch:', error)
    return { data: null, error }
  }
}

/**
 * Release batch from quarantine
 */
export async function releaseFromQuarantine(
  batchId: string,
  userId: string,
  notes?: string
) {
  try {
    const supabase = await createClient()

    // Use the database function
    const { error } = await supabase.rpc('release_from_quarantine', {
      p_batch_id: batchId,
      p_user_id: userId,
      p_notes: notes,
    })

    if (error) throw error

    // Get updated batch
    return await getBatchById(batchId)
  } catch (error) {
    console.error('Error in releaseFromQuarantine:', error)
    return { data: null, error }
  }
}

/**
 * Record harvest data for a batch
 */
export async function recordHarvest(
  batchId: string,
  harvestData: {
    organization_id: string
    wet_weight: number
    plant_count: number
    harvested_at: string
    location?: string
    notes?: string
  },
  userId: string
) {
  try {
    const supabase = await createClient()

    // Update batch with harvest data
    const { error: updateError } = await supabase
      .from('batches')
      .update({
        actual_harvest_date: harvestData.harvested_at,
        yield_weight_g: harvestData.wet_weight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId)

    if (updateError) throw updateError

    // Create harvest record
    const { error: insertError } = await supabase
      .from('harvest_records')
      .insert({
        batch_id: batchId,
        organization_id: harvestData.organization_id,
        wet_weight: harvestData.wet_weight,
        plant_count: harvestData.plant_count,
        harvested_at: harvestData.harvested_at,
        harvested_by: userId,
        location: harvestData.location,
        notes: harvestData.notes,
      })

    if (insertError) throw insertError

    // Log harvest event
    await createBatchEvent(batchId, 'harvest', userId, {
      wet_weight: harvestData.wet_weight,
      plant_count: harvestData.plant_count,
    })

    // Get updated batch
    return await getBatchById(batchId)
  } catch (error) {
    console.error('Error in recordHarvest:', error)
    return { data: null, error }
  }
}

/**
 * Get aggregated inventory usage for a batch
 */
export async function getBatchInventoryUsage(batchId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(
        `
        id,
        movement_type,
        quantity,
        lot_id,
        timestamp,
        item:inventory_items!inner(
          id,
          name,
          item_type,
          unit_of_measure
        )
      `
      )
      .eq('batch_id', batchId)
      .order('timestamp', { ascending: false })

    if (error) throw error
    if (!data || data.length === 0) {
      return { data: null, error: null }
    }

    const movementRows = (data ?? []) as unknown as InventoryMovementRow[]
    const usage = buildInventoryUsageFromRows(movementRows)
    return { data: usage, error: null }
  } catch (error) {
    console.error('Error in getBatchInventoryUsage:', error)
    return { data: null, error }
  }
}

type InventoryMovementRow = {
  id: string
  movement_type: string
  quantity: number
  lot_id: string | null
  timestamp: string
  item:
    | {
        id: string
        name: string
        item_type: string
        unit_of_measure?: string | null
      }
    | null
}

function buildInventoryUsageFromRows(rows: InventoryMovementRow[]): BatchInventoryUsage {
  const entriesMap = new Map<string, BatchInventoryUsage['entries'][number]>()
  const consumedSummary: Record<string, number> = {}
  const receivedSummary: Record<string, number> = {}

  rows.forEach((row) => {
    if (!row.item?.id) {
      return
    }

    const movementType = row.movement_type as MovementType
    const key = `${row.item.id}-${movementType}`
    const quantity = Number(row.quantity) || 0
    const existing = entriesMap.get(key)

    if (existing) {
      existing.total_quantity += quantity
      if (new Date(row.timestamp) > new Date(existing.last_movement_at)) {
        existing.last_movement_at = row.timestamp
      }
      if (row.lot_id) {
        existing.lot_count += 1
      }
    } else {
      entriesMap.set(key, {
        item_id: row.item.id,
        item_name: row.item.name,
        item_type: row.item.item_type as ItemType,
        movement_type: movementType,
        total_quantity: quantity,
        unit_of_measure: row.item.unit_of_measure || null,
        last_movement_at: row.timestamp,
        lot_count: row.lot_id ? 1 : 0,
      })
    }

    const bucket = movementType === 'receive' ? receivedSummary : consumedSummary
    bucket[row.item.item_type] = (bucket[row.item.item_type] || 0) + quantity
  })

  return {
    entries: Array.from(entriesMap.values()).sort(
      (a, b) => new Date(b.last_movement_at).getTime() - new Date(a.last_movement_at).getTime()
    ),
    summary: {
      consumed_by_type: consumedSummary,
      received_by_type: receivedSummary,
    },
  }
}

/**
 * Update plant count for a batch
 */
export async function updatePlantCount(
  batchId: string,
  newCount: number,
  userId: string,
  reason?: string
) {
  try {
    const supabase = await createClient()

    // Get current count for event logging
    const { data: batch } = await getBatchById(batchId)
    const oldCount = batch?.plant_count || 0

    const { error } = await supabase
      .from('batches')
      .update({
        plant_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId)

    if (error) throw error

    // Log plant count update event
    await createBatchEvent(batchId, 'plant_count_update', userId, {
      from: oldCount,
      to: newCount,
      reason,
    })

    return await getBatchById(batchId)
  } catch (error) {
    console.error('Error in updatePlantCount:', error)
    return { data: null, error }
  }
}

/**
 * Assign batch to a pod/location
 */
export async function assignBatchToPod(
  batchId: string,
  podId: string,
  plantCount: number,
  userId: string,
  notes?: string
) {
  try {
    const supabase = await createClient()
    const timestamp = new Date().toISOString()

    const { data: insertedAssignment, error: insertError } = await supabase
      .from('batch_pod_assignments')
      .insert({
        batch_id: batchId,
        pod_id: podId,
        plant_count: plantCount,
        assigned_by: userId,
        notes: notes ?? null,
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    const { error: releaseError } = await supabase
      .from('batch_pod_assignments')
      .update({
        removed_at: timestamp,
        removed_by: userId,
      })
      .eq('batch_id', batchId)
      .is('removed_at', null)
      .neq('id', insertedAssignment.id)

    if (releaseError) throw releaseError

    // Log assignment event
    await createBatchEvent(batchId, 'pod_assignment', userId, {
      pod_id: podId,
      plant_count: plantCount,
    })

    await syncPodAndBatchRecipes({
      supabase,
      batchId,
      podId,
      userId,
    })

    return { data: { batch_id: batchId, pod_id: podId }, error: null }
  } catch (error) {
    console.error('Error in assignBatchToPod:', error)
    return { data: null, error }
  }
}

/**
 * Get batch genealogy (ancestry tree)
 */
export async function getBatchGenealogy(batchId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_batch_genealogy', {
      p_batch_id: batchId,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getBatchGenealogy:', error)
    return { data: null, error }
  }
}

/**
 * Get quality metrics history for a batch
 */
export async function getBatchQualityHistory(batchId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('batch_quality_metrics')
      .select(`
        *,
        recorded_by_user:users!recorded_by(id, full_name)
      `)
      .eq('batch_id', batchId)
      .order('recorded_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getBatchQualityHistory:', error)
    return { data: null, error }
  }
}

/**
 * Add a quality metric for a batch
 */
export async function addQualityMetric(
  batchId: string,
  metricData: {
    metric_type: string
    value: number
    unit: string
    test_method?: string
    lab_certified?: boolean
    certification_url?: string
    notes?: string
  },
  userId: string
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('batch_quality_metrics')
      .insert({
        batch_id: batchId,
        ...metricData,
        recorded_by: userId,
        lab_certified: metricData.lab_certified || false,
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in addQualityMetric:', error)
    return { data: null, error }
  }
}

/**
 * Get batches by stage
 */
export async function getBatchesByStage(
  stage: BatchStage | BatchStage[],
  orgId: string,
  siteId: string
) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('batches')
      .select('*')
      .eq('organization_id', orgId)
      .eq('site_id', siteId)

    if (Array.isArray(stage)) {
      query = query.in('stage', stage)
    } else {
      query = query.eq('stage', stage)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getBatchesByStage:', error)
    return { data: null, error }
  }
}

/**
 * Get batches by cultivar
 */
export async function getBatchesByCultivar(
  cultivarId: string,
  orgId: string
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('organization_id', orgId)
      .eq('cultivar_id', cultivarId)
      .order('start_date', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getBatchesByCultivar:', error)
    return { data: null, error }
  }
}

/**
 * Get active batches (not completed or destroyed)
 */
export async function getActiveBatches(
  orgId: string,
  siteId: string
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('batches')
      .select(`
        *,
        cultivar:cultivars(id, name, common_name)
      `)
      .eq('organization_id', orgId)
      .eq('site_id', siteId)
      .in('status', ['active', 'quarantined'])
      .order('start_date', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getActiveBatches:', error)
    return { data: null, error }
  }
}

/**
 * Helper: Create a batch event
 */
async function createBatchEvent(
  batchId: string,
  eventType: string,
  userId: string,
  data?: Record<string, unknown>
) {
  try {
    const supabase = await createClient()
    
    await supabase
      .from('batch_events')
      .insert({
        batch_id: batchId,
        event_type: eventType,
        to_value: data,
        user_id: userId,
      })
  } catch (error) {
    console.error('Error creating batch event:', error)
    // Don't throw - event logging failure shouldn't block main operation
  }
}
