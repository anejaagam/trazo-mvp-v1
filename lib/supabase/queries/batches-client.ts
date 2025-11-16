/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Client-Side Batch Database Queries
 *
 * These helpers wrap the browser Supabase client so UI components can hydrate
 * batch data (with cultivars, pods, recipes, telemetry, etc.) without having
 * to call server actions. Server components should continue to use
 * lib/supabase/queries/batches.ts instead.
 */

import { createClient } from '@/lib/supabase/client'
import type {
  DomainBatch,
  BatchFilters,
  InsertBatch,
  UpdateBatch,
  BatchStage,
  BatchPodAssignment,
  BatchQualityMetric,
  BatchStageHistory,
  BatchEvent,
  BatchInventoryUsage,
  BatchStatus,
} from '@/types/batch'
import type { ItemType, MovementType } from '@/types/inventory'
import type { ActiveRecipeDetails } from '@/types/recipe'
import type { TelemetryReading } from '@/types/telemetry'

type Nullable<T> = T | null | undefined

export interface CultivarSummary {
  id: string
  name: string
  common_name?: string | null
  strain_type?: string | null
}

export interface PodRoomSummary {
  id: string
  name: string
}

export interface PodSummary {
  id: string
  name: string
  max_plant_count: number | null
  status: string | null
  room?: PodRoomSummary | null
}

export type PodAssignmentWithPod = BatchPodAssignment & {
  pod?: PodSummary | null
}

export interface ActiveRecipeSummary {
  id: string
  name: string
  stage: string | null
  applied_at: string | null
}

export type BatchListItem = DomainBatch & {
  cultivar?: CultivarSummary | null
  pod_assignments?: PodAssignmentWithPod[]
  active_recipe?: ActiveRecipeSummary | null
}

export type BatchEventWithUser = BatchEvent & {
  user?: {
    id: string
    full_name: string | null
    email?: string | null
  } | null
}

export type BatchDetail = BatchListItem & {
  stage_history?: BatchStageHistory[]
  quality_metrics?: BatchQualityMetric[]
  events?: BatchEventWithUser[]
  genealogy?: Array<{
    id: string
    batch_number: string
    relationship: 'parent' | 'child' | 'sibling'
    stage: string | null
  }>
  telemetry_snapshots?: TelemetryReading[]
  inventory_usage?: BatchInventoryUsage | null
  active_recipe_detail?: ActiveRecipeDetails | null
}

export interface PodBatchSummary {
  id: string
  batch_number: string
  stage: BatchStage
  status: BatchStatus
  plant_count: number
  start_date: string
  organization_id: string
  site_id: string
}

// -----------------------------------------------------
// Core CRUD helpers
// -----------------------------------------------------

/**
 * Get batches plus cultivar + pod context for dashboards
 */
export async function getBatches(
  orgId: string,
  siteId: string,
  filters?: BatchFilters
): Promise<{ data: BatchListItem[] | null; error: unknown }> {
  try {
    const supabase = createClient()

    type BatchQueryOptions = {
      includeDomainFilter: boolean
      includeRoomJoin: boolean
      includePodNotes: boolean
      includePodAssignments: boolean
    }

    const defaultOptions: BatchQueryOptions = {
      includeDomainFilter: true,
      includeRoomJoin: true,
      includePodNotes: true,
      includePodAssignments: true,
    }

    const runQuery = (options: BatchQueryOptions) => {
      let query = supabase
        .from('batches')
        .select(buildBatchSelect(options))
        .eq('organization_id', orgId)
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })

      if (options.includeDomainFilter && filters?.domain_type) {
        if (Array.isArray(filters.domain_type)) {
          query = query.in('domain_type', filters.domain_type)
        } else {
          query = query.eq('domain_type', filters.domain_type)
        }
      }

      if (filters?.stage) {
        if (Array.isArray(filters.stage)) {
          query = query.in('stage', filters.stage)
        } else {
          query = query.eq('stage', filters.stage)
        }
      }

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }

      if (filters?.cultivar_id) {
        if (Array.isArray(filters.cultivar_id)) {
          query = query.in('cultivar_id', filters.cultivar_id)
        } else {
          query = query.eq('cultivar_id', filters.cultivar_id)
        }
      }

      if (filters?.quarantine_status === 'quarantined') {
        query = query.eq('status', 'quarantined')
      } else if (filters?.quarantine_status === 'none') {
        query = query.neq('status', 'quarantined')
      }

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

      if (filters?.search) {
        query = query.or(`batch_number.ilike.%${filters.search}%`)
      }

      return query
    }

    const fallbacks = [
      {
        test: (error: unknown) => supabaseErrorIncludes(error, 'domain_type'),
        adjust: (options: BatchQueryOptions) => ({
          ...options,
          includeDomainFilter: false,
        }),
        message:
          'batches.domain_type column missing - rerunning without domain filter. Apply migration 20251114010000_batch_domain_enhancement.sql to restore plant-type filtering.',
      },
      {
        test: (error: unknown) => supabaseErrorIncludes(error, 'rooms'),
        adjust: (options: BatchQueryOptions) => ({
          ...options,
          includeRoomJoin: false,
        }),
        message:
          'rooms table missing - rerunning without room metadata. Apply the facility layout migrations to enable pod room context.',
      },
      {
        test: (error: unknown) => supabaseErrorIncludes(error, 'notes'),
        adjust: (options: BatchQueryOptions) => ({
          ...options,
          includePodNotes: false,
        }),
        message:
          'batch_pod_assignments.notes column missing - rerunning without pod notes. Apply the batch domain enhancement migration to store notes on assignments.',
      },
      {
        test: (error: unknown) =>
          supabaseErrorIncludes(error, 'batch_pod_assignments') || supabaseErrorIncludes(error, 'pods'),
        adjust: (options: BatchQueryOptions) => ({
          ...options,
          includePodAssignments: false,
        }),
        message:
          'batch_pod_assignments or pods table missing - rerunning without pod assignment joins. Apply the batch management migrations to enable pod context.',
      },
    ]

    let options = defaultOptions
    let attemptError: unknown = null

    for (let i = 0; i <= fallbacks.length; i++) {
      const { data, error } = await runQuery(options)

      if (!error) {
        const rawData = (data ?? []) as unknown
        const batches = rawData as BatchListItem[]
        const enriched = await attachActiveRecipes(batches)
        return { data: enriched, error: null }
      }

      attemptError = error
      const fallback = fallbacks.find((strategy) => strategy.test(error))
      if (!fallback) break
      console.warn(fallback.message)
      options = fallback.adjust(options)
    }

    throw attemptError
  } catch (error) {
      logSupabaseError('Error in getBatches:', error)
    return { data: null, error }
  }
}

/**
 * Fetch a single batch record without heavy joins.
 */
export async function getBatchById(id: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: data as DomainBatch, error: null }
  } catch (error) {
     logSupabaseError('Error in getBatchById:', error)
    return { data: null, error }
  }
}

export async function createBatch(batchData: InsertBatch) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('batches')
      .insert(batchData)
      .select('*')
      .single()

    if (error) throw error
    return { data: data as DomainBatch, error: null }
  } catch (error) {
     logSupabaseError('Error in createBatch:', error)
    return { data: null, error }
  }
}

export async function updateBatch(id: string, updates: UpdateBatch) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('batches')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return { data: data as DomainBatch, error: null }
  } catch (error) {
     logSupabaseError('Error in updateBatch:', error)
    return { data: null, error }
  }
}

export async function deleteBatch(id: string) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('batches')
      .update({
        status: 'destroyed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
     logSupabaseError('Error in deleteBatch:', error)
    return { error }
  }
}

// -----------------------------------------------------
// Batch lifecycle helpers (stage transitions, quarantine, harvest)
// -----------------------------------------------------

export async function transitionBatchStage(
  batchId: string,
  newStage: BatchStage,
  userId: string,
  notes?: string
) {
  try {
    const supabase = createClient()
    const { error } = await supabase.rpc('transition_batch_stage', {
      p_batch_id: batchId,
      p_new_stage: newStage,
      p_user_id: userId,
      p_notes: notes || null,
    })

    if (error) throw error
    return getBatchById(batchId)
  } catch (error) {
     logSupabaseError('Error transitioning batch stage:', error)
    
    try {
      await fetch('/api/recipes/advance-stage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId, userId }),
      })
    } catch (syncError) {
      console.warn('Failed to advance recipe stage after transition', syncError)
    }
    return { data: null, error }
  }
}

export async function quarantineBatch(
  batchId: string,
  reason: string,
  userId: string
) {
  try {
    const supabase = createClient()
    const { error } = await supabase.rpc('quarantine_batch', {
      p_batch_id: batchId,
      p_reason: reason,
      p_user_id: userId,
    })

    if (error) throw error
    return getBatchById(batchId)
  } catch (error) {
     logSupabaseError('Error quarantining batch:', error)
    return { data: null, error }
  }
}

export async function releaseFromQuarantine(
  batchId: string,
  userId: string,
  notes?: string
) {
  try {
    const supabase = createClient()
    const { error } = await supabase.rpc('release_from_quarantine', {
      p_batch_id: batchId,
      p_user_id: userId,
      p_notes: notes || null,
    })

    if (error) throw error
    return getBatchById(batchId)
  } catch (error) {
     logSupabaseError('Error releasing batch from quarantine:', error)
    return { data: null, error }
  }
}

export interface HarvestRecordInput {
  wet_weight_g: number
  dry_weight_g?: number
  waste_weight_g?: number
  units_produced?: number
  waste_reason?: string
  notes?: string
}

export async function recordHarvest(
  batchId: string,
  harvestData: HarvestRecordInput,
  userId: string
) {
  try {
    const supabase = createClient()
    const { error } = await supabase.rpc('record_batch_harvest', {
      p_batch_id: batchId,
      p_wet_weight_g: harvestData.wet_weight_g,
      p_dry_weight_g: harvestData.dry_weight_g ?? null,
      p_units_produced: harvestData.units_produced ?? null,
      p_waste_weight_g: harvestData.waste_weight_g ?? null,
      p_waste_reason: harvestData.waste_reason ?? null,
      p_notes: harvestData.notes ?? null,
      p_user_id: userId,
    })

    if (error) throw error
    return getBatchById(batchId)
  } catch (error) {
     logSupabaseError('Error recording harvest:', error)
    return { data: null, error }
  }
}

export async function assignBatchToPod(
  batchId: string,
  podId: string,
  plantCount: number,
  userId: string,
  notes?: string
) {
  try {
    const response = await fetch('/api/batches/assign-pod', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        batchId,
        podId,
        plantCount,
        userId,
        notes: notes || null,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.error || 'Failed to assign batch to pod')
    }
    return { error: null }
  } catch (error) {
     logSupabaseError('Error assigning batch to pod:', error)
    return { error }
  }
}

export async function addQualityMetric(
  batchId: string,
  metricData: {
    metric_type: string
    value: number
    unit: string
    notes?: string
    lab_certified?: boolean
  },
  userId: string
) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('batch_quality_metrics')
      .insert({
        batch_id: batchId,
        recorded_by: userId,
        metric_type: metricData.metric_type,
        value: metricData.value,
        unit: metricData.unit,
        notes: metricData.notes ?? null,
        lab_certified: metricData.lab_certified ?? false,
      })
      .select('*')
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
     logSupabaseError('Error creating quality metric:', error)
    return { data: null, error }
  }
}

export async function getActiveBatchesForPod(
  podId: string
): Promise<{ data: PodBatchSummary[] | null; error: unknown }> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('batch_pod_assignments')
      .select(
        `
        batch_id,
        batch:batches(
          id,
          batch_number,
          stage,
          status,
          plant_count,
          start_date,
          organization_id,
          site_id
        )
      `
      )
      .eq('pod_id', podId)
      .is('removed_at', null)
      .order('assigned_at', { ascending: false })

    if (error) throw error

    const summaries =
      data
        ?.map((row: any) => row.batch)
        .filter(Boolean)
        .map(
          (batch: any): PodBatchSummary => ({
            id: batch.id,
            batch_number: batch.batch_number,
            stage: batch.stage,
            status: batch.status,
            plant_count: batch.plant_count,
            start_date: batch.start_date,
            organization_id: batch.organization_id,
            site_id: batch.site_id,
          })
        ) || []

    return { data: summaries, error: null }
  } catch (error) {
     logSupabaseError('Error fetching pod batches:', error)
    return { data: null, error }
  }
}

export async function getBatchStageHistorySummary(batchId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('batch_stage_history')
      .select('*')
      .eq('batch_id', batchId)
      .order('started_at', { ascending: false })

    if (error) throw error
    return { data: (data || []) as BatchStageHistory[], error: null }
  } catch (error) {
     logSupabaseError('Failed to load stage history', error)
    return { data: null, error }
  }
}

// -----------------------------------------------------
// Detail hydration
// -----------------------------------------------------

export async function getBatchDetail(batchId: string): Promise<{
  data: BatchDetail | null
  error: unknown
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('batches')
      .select(
        `
          *,
          cultivar:cultivars(id, name, common_name, strain_type),
          pod_assignments:batch_pod_assignments(
            id,
            batch_id,
            pod_id,
            plant_count,
            assigned_at,
            removed_at,
            notes,
            pod:pods(
              id,
              name,
              max_plant_count,
              status,
              room:rooms(id, name)
            )
          ),
          stage_history:batch_stage_history(
            id,
            stage,
            started_at,
            ended_at:completed_at,
            notes,
            transitioned_by_user:users!transitioned_by(id, full_name)
          ),
          quality_metrics:batch_quality_metrics(
            id,
            metric_type,
            value,
            unit,
            recorded_at,
            recorded_by,
            notes,
            lab_certified
          ),
          events:batch_events(
            id,
            event_type,
            to_value,
            timestamp,
            notes,
            user:users!user_id(id, full_name, email)
          )
        `
      )
      .eq('id', batchId)
      .single()

    if (error) throw error

    const batch = data as BatchDetail

    const genealogy = await fetchGenealogy(batchId)
    if (genealogy) {
      batch.genealogy = genealogy
    }

    const telemetry = await fetchTelemetrySnapshots(batch)
    if (telemetry) {
      batch.telemetry_snapshots = telemetry
    }

    const inventoryUsage = await fetchBatchInventoryUsage(batchId)
    if (inventoryUsage) {
      batch.inventory_usage = inventoryUsage
    }

    const activeRecipeDetail = await fetchActiveRecipeDetail(batchId)
    if (activeRecipeDetail) {
      batch.active_recipe_detail = activeRecipeDetail
      if (activeRecipeDetail.activation?.recipe) {
        batch.active_recipe = {
          id: activeRecipeDetail.activation.recipe.id,
          name: activeRecipeDetail.activation.recipe.name,
          stage: activeRecipeDetail.activation.current_stage?.name || null,
          applied_at: activeRecipeDetail.activation.activated_at || null,
        }
      }
    }

    return { data: batch, error: null }
  } catch (error) {
     logSupabaseError('Error in getBatchDetail:', error)
    return { data: null, error }
  }
}

// -----------------------------------------------------
// Private helpers
// -----------------------------------------------------

async function attachActiveRecipes(batches: BatchListItem[]): Promise<BatchListItem[]> {
  if (!batches.length) return batches
  const supabase = createClient()
  const batchIds = batches.map((batch) => batch.id)

  const { data, error } = await supabase
    .from('recipe_activations')
    .select(
      `
        id,
        scope_id,
        activated_at,
        recipe:recipes(id, name),
        current_stage:recipe_stages!recipe_activations_current_stage_id_fkey(id, name)
      `
    )
    .eq('scope_type', 'batch')
    .eq('is_active', true)
    .in('scope_id', batchIds)

  if (error) {
    console.warn('Unable to attach recipes to batch list:', error)
    return batches
  }

  const recipeByBatch = new Map<string, ActiveRecipeSummary>()
  const rows = (data ?? []) as Array<{
    scope_id: string | null
    activated_at: string | null
    recipe:
      | { id: string; name: string }
      | Array<{ id: string; name: string }>
      | null
    current_stage:
      | { id: string; name: string }
      | Array<{ id: string; name: string }>
      | null
  }>

  rows.forEach((row) => {
    if (!row?.scope_id || !row.recipe) return
    const recipe = Array.isArray(row.recipe) ? row.recipe[0] : row.recipe
    if (!recipe) return
    const stage = row.current_stage
    const stageName = Array.isArray(stage) ? stage[0]?.name : stage?.name
    recipeByBatch.set(row.scope_id, {
      id: recipe.id,
      name: recipe.name,
      stage: stageName || null,
      applied_at: row.activated_at,
    })
  })

  return batches.map((batch) => ({
    ...batch,
    active_recipe: recipeByBatch.get(batch.id) || null,
  }))
}

async function fetchGenealogy(batchId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_batch_genealogy', {
      p_batch_id: batchId,
    })

    if (error) throw error
    type GenealogyRow = {
      batch_id: string | null
      batch_number?: string | null
      relationship_type?: string | null
      stage?: string | null
    }

    const normalizeRelationship = (value?: string | null): 'parent' | 'child' | 'sibling' => {
      if (value === 'child' || value === 'sibling') return value
      return 'parent'
    }

    return (data || [])
      .filter((row: GenealogyRow): row is GenealogyRow & { batch_id: string } => Boolean(row?.batch_id))
      .map((row: GenealogyRow & { batch_id: string }) => ({
        id: row.batch_id,
        batch_number: row.batch_number || 'Unknown batch',
        relationship: normalizeRelationship(row.relationship_type),
        stage: row.stage ?? null,
      }))
  } catch (error) {
    console.warn('Failed to hydrate genealogy', error)
    return null
  }
}

async function fetchTelemetrySnapshots(batch: BatchListItem) {
  const activeAssignments = (batch.pod_assignments || []).filter(
    (assignment) => !assignment.removed_at
  )

  if (!activeAssignments.length) return null

  const podIds = activeAssignments
    .map((assignment) => assignment.pod_id)
    .filter(Boolean)

  if (!podIds.length) return null

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('telemetry_readings')
      .select('*')
      .in('pod_id', podIds)
      .order('timestamp', { ascending: false })
      .limit(podIds.length * 3)

    if (error) throw error

    const snapshots: Record<string, TelemetryReading> = {}
    ;(data || []).forEach((reading: any) => {
      if (snapshots[reading.pod_id]) return
      snapshots[reading.pod_id] = reading as TelemetryReading
    })

    return Object.values(snapshots)
  } catch (error) {
    console.warn('Unable to fetch telemetry snapshots for batch detail', error)
    return null
  }
}

function logSupabaseError(context: string, error: unknown) {
  if (!error || typeof error !== 'object') {
    console.error(context, error)
    return
  }

  const err = error as Record<string, unknown>
  const payload: Record<string, unknown> = {}
  const keys: Array<keyof typeof err> = ['message', 'details', 'hint', 'code', 'status']

  keys.forEach((key) => {
    const value = err[key]
    if (value !== undefined && value !== null && value !== '') {
      payload[key as string] = value
    }
  })

  console.error(context, Object.keys(payload).length ? payload : err)
}

function supabaseErrorIncludes(error: unknown, search: string): boolean {
  const haystack = getSupabaseErrorText(error)
  if (!haystack) return false
  return haystack.includes(search.toLowerCase())
}

async function fetchBatchInventoryUsage(batchId: string): Promise<BatchInventoryUsage | null> {
  try {
    const supabase = createClient()
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
    if (!data || data.length === 0) return null

    type MovementRow = {
      id: string
      movement_type: string
      quantity: number
      lot_id: string | null
      timestamp: string
      item: {
        id: string
        name: string
        item_type: string
        unit_of_measure?: string | null
      }
    }

    const entriesMap = new Map<string, BatchInventoryUsage['entries'][number]>()
    const consumedSummary: Record<string, number> = {}
    const receivedSummary: Record<string, number> = {}

    const movementRows = (data ?? []) as unknown as MovementRow[]

    movementRows.forEach((row) => {
      if (!row.item?.id) {
        return
      }
      const key = `${row.item.id}-${row.movement_type}`
      const existing = entriesMap.get(key)
      const quantity = Number(row.quantity) || 0

      if (existing) {
        existing.total_quantity += quantity
        existing.last_movement_at =
          new Date(row.timestamp) > new Date(existing.last_movement_at)
            ? row.timestamp
            : existing.last_movement_at
        if (row.lot_id) {
          existing.lot_count = existing.lot_count + 1
        }
      } else {
        entriesMap.set(key, {
          item_id: row.item.id,
          item_name: row.item.name,
          item_type: row.item.item_type as ItemType,
          movement_type: row.movement_type as MovementType,
          total_quantity: quantity,
          unit_of_measure: row.item.unit_of_measure || null,
          last_movement_at: row.timestamp,
          lot_count: row.lot_id ? 1 : 0,
        })
      }

      const targetSummary =
        row.movement_type === 'receive' ? receivedSummary : consumedSummary
      targetSummary[row.item.item_type] = (targetSummary[row.item.item_type] || 0) + quantity
    })

    return {
      entries: Array.from(entriesMap.values()).sort((a, b) =>
        new Date(b.last_movement_at).getTime() - new Date(a.last_movement_at).getTime()
      ),
      summary: {
        consumed_by_type: consumedSummary,
        received_by_type: receivedSummary,
      },
    }
  } catch (error) {
    console.warn('Unable to fetch batch inventory usage', error)
    return null
  }
}

function buildBatchSelect(options: {
  includeRoomJoin: boolean
  includePodNotes: boolean
  includePodAssignments: boolean
}) {
  const fields = ['*', 'cultivar:cultivars(id, name, common_name, strain_type)']

  if (options.includePodAssignments) {
    const podAssignmentFields = ['id', 'batch_id', 'pod_id', 'plant_count', 'assigned_at', 'removed_at']
    if (options.includePodNotes) {
      podAssignmentFields.push('notes')
    }
    podAssignmentFields.push(`pod:pods(${buildPodSelect(options.includeRoomJoin)})`)
    fields.push(`pod_assignments:batch_pod_assignments(${podAssignmentFields.join(', ')})`)
  }

  return fields.join(',\n')
}

function buildPodSelect(includeRoomJoin: boolean) {
  const fields = ['id', 'name', 'max_plant_count', 'status']
  if (includeRoomJoin) {
    fields.push('room:rooms(id, name)')
  }
  return fields.join(', ')
}

function getSupabaseErrorText(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return ''
  }
  const err = error as Record<string, unknown>
  const pieces = ['message', 'details', 'hint']
    .map((key) => {
      const value = err[key]
      return typeof value === 'string' ? value : ''
    })
    .filter(Boolean)
  return pieces.join(' ').toLowerCase()
}

async function fetchActiveRecipeDetail(batchId: string): Promise<ActiveRecipeDetails | null> {
  try {
    const response = await fetch(`/api/recipes/active?scopeType=batch&scopeId=${batchId}`)
    if (!response.ok) {
      return null
    }
    const payload = await response.json()
    return (payload?.data || null) as ActiveRecipeDetails | null
  } catch (error) {
    console.warn('Unable to fetch active recipe detail', error)
    return null
  }
}
