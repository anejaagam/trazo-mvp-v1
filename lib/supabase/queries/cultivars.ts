/**
 * Cultivar Database Queries
 * 
 * CRUD operations for cultivars table with domain-specific support
 * Cultivars represent strains (cannabis) or varieties (produce)
 */

import { createClient } from '@/lib/supabase/server'
import type { DomainType, StrainType, ProduceCategory } from '@/types/batch'

/**
 * Filters for cultivar queries
 */
export interface CultivarFilters {
  domain_type?: DomainType;
  strain_type?: StrainType; // Cannabis
  category?: ProduceCategory; // Produce
  is_active?: boolean;
  search?: string;
}

/**
 * Data for creating a new cultivar
 */
export interface InsertCultivar {
  organization_id: string;
  name: string;
  // Cannabis fields
  strain_type?: string | null;
  genetics?: string | null;
  breeder?: string | null;
  thc_range_min?: number | null;
  thc_range_max?: number | null;
  cbd_range_min?: number | null;
  cbd_range_max?: number | null;
  flowering_days?: number | null;
  // Produce fields
  category?: ProduceCategory | null;
  flavor_profile?: string | null;
  storage_life_days?: number | null;
  optimal_temp_c_min?: number | null;
  optimal_temp_c_max?: number | null;
  optimal_humidity_min?: number | null;
  optimal_humidity_max?: number | null;
  // Common fields
  harvest_notes?: string | null;
  grow_characteristics?: string | null;
  created_by: string;
}

/**
 * Data for updating a cultivar
 */
export interface UpdateCultivar {
  name?: string;
  strain_type?: string | null;
  genetics?: string | null;
  breeder?: string | null;
  thc_range_min?: number | null;
  thc_range_max?: number | null;
  cbd_range_min?: number | null;
  cbd_range_max?: number | null;
  flowering_days?: number | null;
  category?: ProduceCategory | null;
  flavor_profile?: string | null;
  storage_life_days?: number | null;
  optimal_temp_c_min?: number | null;
  optimal_temp_c_max?: number | null;
  optimal_humidity_min?: number | null;
  optimal_humidity_max?: number | null;
  harvest_notes?: string | null;
  grow_characteristics?: string | null;
  is_active?: boolean;
}

/**
 * Get all cultivars for an organization with optional filtering
 */
export async function getCultivars(
  orgId: string,
  filters?: CultivarFilters
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('cultivars')
      .select('*')
      .eq('organization_id', orgId)
      .order('name', { ascending: true })

    // Apply active filter (default to active only)
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    } else {
      query = query.eq('is_active', true)
    }

    // Apply domain-specific filters
    if (filters?.strain_type) {
      query = query.eq('strain_type', filters.strain_type)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    // Apply search filter
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,genetics.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getCultivars:', error)
    return { data: null, error }
  }
}

/**
 * Get a single cultivar by ID
 */
export async function getCultivarById(cultivarId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('cultivars')
      .select(`
        *,
        created_by_user:users!created_by(id, full_name, email)
      `)
      .eq('id', cultivarId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getCultivarById:', error)
    return { data: null, error }
  }
}

/**
 * Create a new cultivar
 */
export async function createCultivar(cultivar: InsertCultivar) {
  try {
    const supabase = await createClient()
    
    // Get current user for created_by
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('cultivars')
      .insert({
        ...cultivar,
        created_by: cultivar.created_by || user.id,
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in createCultivar:', error)
    return { data: null, error }
  }
}

/**
 * Update a cultivar
 */
export async function updateCultivar(
  cultivarId: string,
  updates: UpdateCultivar
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cultivars')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cultivarId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in updateCultivar:', error)
    return { data: null, error }
  }
}

/**
 * Delete a cultivar (soft delete by setting is_active to false)
 */
export async function deleteCultivar(cultivarId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cultivars')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cultivarId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in deleteCultivar:', error)
    return { data: null, error }
  }
}

/**
 * Get usage statistics for a cultivar (number of batches using it)
 */
export async function getCultivarUsageStats(cultivarId: string) {
  try {
    const supabase = await createClient()

    // Count total batches
    const { count: totalBatches, error: totalError } = await supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })
      .eq('cultivar_id', cultivarId)

    if (totalError) throw totalError

    // Count active batches
    const { count: activeBatches, error: activeError } = await supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })
      .eq('cultivar_id', cultivarId)
      .in('status', ['active', 'quarantined'])

    if (activeError) throw activeError

    // Count completed batches
    const { count: completedBatches, error: completedError } = await supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })
      .eq('cultivar_id', cultivarId)
      .eq('status', 'completed')

    if (completedError) throw completedError

    // Get recent batches
    const { data: recentBatches, error: recentError } = await supabase
      .from('batches')
      .select('id, batch_number, stage, status, start_date')
      .eq('cultivar_id', cultivarId)
      .order('start_date', { ascending: false })
      .limit(5)

    if (recentError) throw recentError

    const stats = {
      total_batches: totalBatches || 0,
      active_batches: activeBatches || 0,
      completed_batches: completedBatches || 0,
      recent_batches: recentBatches || [],
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error in getCultivarUsageStats:', error)
    return { data: null, error }
  }
}
