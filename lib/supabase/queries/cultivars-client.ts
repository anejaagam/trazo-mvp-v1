import { createClient } from '@/lib/supabase/client'
import type { Cultivar } from '@/types/batch'
import type {
  CultivarFilters,
  InsertCultivar,
  UpdateCultivar,
} from './cultivars'

export interface CultivarUsageStats {
  total_batches: number
  active_batches: number
  completed_batches: number
  recent_batches: Array<{
    id: string
    batch_number: string
    stage: string
    status: string
    start_date: string
  }>
}

export async function getCultivarsClient(
  orgId: string,
  filters?: CultivarFilters
): Promise<{ data: Cultivar[] | null; error: unknown }> {
  try {
    const supabase = createClient()
    let query = supabase
      .from('cultivars')
      .select('*')
      .eq('organization_id', orgId)
      .order('name', { ascending: true })

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    } else {
      query = query.eq('is_active', true)
    }

    if (filters?.strain_type) {
      query = query.eq('strain_type', filters.strain_type)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.domain_type) {
      if (filters.domain_type === 'cannabis') {
        query = query.neq('strain_type', null)
      } else {
        query = query.neq('category', null)
      }
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,genetics.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query
    if (error) throw error
    return { data: data as Cultivar[], error: null }
  } catch (error) {
    console.error('Error in getCultivarsClient:', error)
    return { data: null, error }
  }
}

export async function createCultivarClient(cultivar: InsertCultivar) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('cultivars')
      .insert(cultivar)
      .select('*')
      .single()

    if (error) throw error
    return { data: data as Cultivar, error: null }
  } catch (error) {
    console.error('Error in createCultivarClient:', error)
    return { data: null, error }
  }
}

export async function updateCultivarClient(
  cultivarId: string,
  updates: UpdateCultivar
) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('cultivars')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cultivarId)
      .select('*')
      .single()

    if (error) throw error
    return { data: data as Cultivar, error: null }
  } catch (error) {
    console.error('Error in updateCultivarClient:', error)
    return { data: null, error }
  }
}

export async function deleteCultivarClient(cultivarId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('cultivars')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cultivarId)
      .select('*')
      .single()

    if (error) throw error
    return { data: data as Cultivar, error: null }
  } catch (error) {
    console.error('Error in deleteCultivarClient:', error)
    return { data: null, error }
  }
}

export async function getCultivarUsageStatsClient(cultivarId: string) {
  try {
    const supabase = createClient()

    const { count: totalBatches, error: totalError } = await supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })
      .eq('cultivar_id', cultivarId)

    if (totalError) throw totalError

    const { count: activeBatches, error: activeError } = await supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })
      .eq('cultivar_id', cultivarId)
      .in('status', ['active', 'quarantined'])

    if (activeError) throw activeError

    const { count: completedBatches, error: completedError } = await supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })
      .eq('cultivar_id', cultivarId)
      .eq('status', 'completed')

    if (completedError) throw completedError

    const { data: recentBatches, error: recentError } = await supabase
      .from('batches')
      .select('id, batch_number, stage, status, start_date')
      .eq('cultivar_id', cultivarId)
      .order('start_date', { ascending: false })
      .limit(5)

    if (recentError) throw recentError

    const stats: CultivarUsageStats = {
      total_batches: totalBatches || 0,
      active_batches: activeBatches || 0,
      completed_batches: completedBatches || 0,
      recent_batches: recentBatches || [],
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error in getCultivarUsageStatsClient:', error)
    return { data: null, error }
  }
}
