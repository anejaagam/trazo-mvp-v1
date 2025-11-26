/**
 * Production Batches Database Queries
 *
 * CRUD operations for production_batches, production_batch_inputs,
 * production_batch_outputs, and production_recipes tables
 */

import { createClient } from '@/lib/supabase/server'

export type ProductionType =
  | 'processing'
  | 'extraction'
  | 'infusion'
  | 'packaging'
  | 'preroll'
  | 'other'

export type ProductionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export interface ProductionBatch {
  id: string
  batch_number: string
  organization_id: string
  site_id: string
  production_type: ProductionType
  recipe_id?: string
  started_at: string
  completed_at?: string
  status: ProductionStatus
  expected_yield?: number
  expected_yield_unit?: string
  actual_yield?: number
  actual_yield_unit?: string
  yield_variance_reason?: string
  source_harvest_id?: string
  metrc_production_batch_id?: string
  metrc_sync_status: string
  metrc_sync_error?: string
  metrc_last_sync?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface ProductionBatchInput {
  id: string
  production_batch_id: string
  package_id: string
  quantity_used: number
  unit_of_measure: string
  original_package_quantity?: number
  added_at: string
  added_by?: string
}

export interface ProductionBatchOutput {
  id: string
  production_batch_id: string
  package_id?: string
  package_tag?: string
  product_name: string
  product_type: string
  quantity: number
  unit_of_measure: string
  metrc_package_id?: string
  created_at: string
}

export interface ProductionRecipe {
  id: string
  organization_id: string
  name: string
  description?: string
  production_type: ProductionType
  input_product_types?: string[]
  output_product_type: string
  expected_yield_percentage?: number
  process_parameters?: Record<string, unknown>
  active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

/**
 * Get all production batches for an organization with filters
 */
export async function getProductionBatches(
  orgId: string,
  siteId?: string,
  filters?: {
    status?: ProductionStatus | ProductionStatus[]
    productionType?: ProductionType | ProductionType[]
    sourceHarvestId?: string
    startDate?: string
    endDate?: string
  }
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('production_batches')
      .select(
        `
        *,
        recipe:production_recipes(id, name, output_product_type),
        source_harvest:harvest_records(
          id,
          batch:batches(batch_number, cultivar:cultivars(name))
        ),
        inputs:production_batch_inputs(
          id,
          quantity_used,
          unit_of_measure,
          package:harvest_packages(id, tag, product_name, product_type)
        ),
        outputs:production_batch_outputs(
          id,
          product_name,
          product_type,
          quantity,
          unit_of_measure,
          package_tag
        )
      `
      )
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }

    if (filters?.productionType) {
      if (Array.isArray(filters.productionType)) {
        query = query.in('production_type', filters.productionType)
      } else {
        query = query.eq('production_type', filters.productionType)
      }
    }

    if (filters?.sourceHarvestId) {
      query = query.eq('source_harvest_id', filters.sourceHarvestId)
    }

    if (filters?.startDate) {
      query = query.gte('started_at', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('started_at', filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getProductionBatches:', error)
    return { data: null, error }
  }
}

/**
 * Get a single production batch by ID with full details
 */
export async function getProductionBatchById(productionBatchId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('production_batches')
      .select(
        `
        *,
        recipe:production_recipes(
          id,
          name,
          description,
          production_type,
          output_product_type,
          expected_yield_percentage,
          process_parameters
        ),
        source_harvest:harvest_records(
          id,
          wet_weight,
          dry_weight,
          batch:batches(
            id,
            batch_number,
            cultivar:cultivars(id, name)
          )
        ),
        inputs:production_batch_inputs(
          id,
          package_id,
          quantity_used,
          unit_of_measure,
          original_package_quantity,
          added_at,
          package:harvest_packages(
            id,
            tag,
            product_name,
            product_type,
            current_quantity,
            lab_test_status
          )
        ),
        outputs:production_batch_outputs(
          id,
          package_id,
          package_tag,
          product_name,
          product_type,
          quantity,
          unit_of_measure,
          metrc_package_id,
          created_at
        ),
        created_by_user:users!created_by(id, full_name),
        updated_by_user:users!updated_by(id, full_name)
      `
      )
      .eq('id', productionBatchId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getProductionBatchById:', error)
    return { data: null, error }
  }
}

/**
 * Get production batches for a specific harvest
 */
export async function getProductionBatchesByHarvestId(harvestId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('production_batches')
      .select(
        `
        *,
        inputs:production_batch_inputs(count),
        outputs:production_batch_outputs(count)
      `
      )
      .eq('source_harvest_id', harvestId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getProductionBatchesByHarvestId:', error)
    return { data: null, error }
  }
}

/**
 * Get harvests ready for production (with passing lab tests)
 */
export async function getHarvestsReadyForProduction(orgId: string, siteId?: string) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('harvest_records')
      .select(
        `
        *,
        batch:batches!inner(
          id,
          batch_number,
          site_id,
          cultivar:cultivars(name)
        ),
        packages:harvest_packages(
          id,
          tag,
          product_name,
          product_type,
          current_quantity,
          unit_of_measure,
          lab_test_status,
          production_status
        )
      `
      )
      .eq('organization_id', orgId)
      .in('status', ['curing', 'ready_to_package', 'drying'])
      .order('harvested_at', { ascending: false })

    if (siteId) {
      query = query.eq('batches.site_id', siteId)
    }

    const { data, error } = await query

    if (error) throw error

    // Filter to only include harvests with packages that have passing lab tests
    // or are ready for production
    const harvestsWithAvailablePackages = data?.filter((harvest) => {
      const packages = (harvest.packages as any[]) || []
      return packages.some(
        (pkg) =>
          pkg.lab_test_status === 'passed' &&
          pkg.current_quantity > 0 &&
          (!pkg.production_status || pkg.production_status === 'available')
      )
    })

    return { data: harvestsWithAvailablePackages || [], error: null }
  } catch (error) {
    console.error('Error in getHarvestsReadyForProduction:', error)
    return { data: null, error }
  }
}

/**
 * Get packages available for production (not already in production)
 */
export async function getPackagesAvailableForProduction(
  orgId: string,
  siteId?: string,
  harvestId?: string
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('harvest_packages')
      .select(
        `
        *,
        harvest:harvest_records(
          id,
          batch:batches(
            batch_number,
            cultivar:cultivars(name)
          )
        )
      `
      )
      .eq('organization_id', orgId)
      .gt('current_quantity', 0)
      .in('status', ['active', 'available', 'packaged', 'curing'])
      .or('production_status.is.null,production_status.eq.available')
      .not('hold_status', 'in', '("on_hold","quarantined")')
      .order('created_at', { ascending: false })

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    if (harvestId) {
      query = query.eq('harvest_id', harvestId)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getPackagesAvailableForProduction:', error)
    return { data: null, error }
  }
}

/**
 * Get production recipes for an organization
 */
export async function getProductionRecipes(orgId: string, filters?: { active?: boolean }) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('production_recipes')
      .select('*')
      .eq('organization_id', orgId)
      .order('name', { ascending: true })

    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getProductionRecipes:', error)
    return { data: null, error }
  }
}

/**
 * Get a single production recipe by ID
 */
export async function getProductionRecipeById(recipeId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('production_recipes')
      .select('*')
      .eq('id', recipeId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getProductionRecipeById:', error)
    return { data: null, error }
  }
}

/**
 * Create a production recipe
 */
export async function createProductionRecipe(
  recipe: Omit<ProductionRecipe, 'id' | 'created_at' | 'updated_at'>,
  userId: string
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('production_recipes')
      .insert({
        ...recipe,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in createProductionRecipe:', error)
    return { data: null, error }
  }
}

/**
 * Update a production recipe
 */
export async function updateProductionRecipe(
  recipeId: string,
  updates: Partial<Omit<ProductionRecipe, 'id' | 'organization_id' | 'created_at' | 'created_by'>>
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('production_recipes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in updateProductionRecipe:', error)
    return { data: null, error }
  }
}

/**
 * Get production statistics for a site
 */
export async function getProductionStats(orgId: string, siteId?: string) {
  try {
    const supabase = await createClient()

    // Get counts by status
    let query = supabase
      .from('production_batches')
      .select('status, production_type')
      .eq('organization_id', orgId)

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    const { data, error } = await query

    if (error) throw error

    // Calculate statistics
    const stats = {
      total: data?.length || 0,
      planned: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      byType: {} as Record<string, number>,
    }

    data?.forEach((batch) => {
      // Count by status
      if (batch.status in stats) {
        stats[batch.status as keyof typeof stats]++
      }

      // Count by type
      if (batch.production_type) {
        stats.byType[batch.production_type] = (stats.byType[batch.production_type] || 0) + 1
      }
    })

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error in getProductionStats:', error)
    return { data: null, error }
  }
}

/**
 * Get recent production activity for dashboard
 */
export async function getRecentProductionActivity(orgId: string, siteId?: string, limit = 10) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('production_batches')
      .select(
        `
        id,
        batch_number,
        production_type,
        status,
        started_at,
        completed_at,
        actual_yield,
        actual_yield_unit,
        source_harvest:harvest_records(
          batch:batches(batch_number, cultivar:cultivars(name))
        )
      `
      )
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getRecentProductionActivity:', error)
    return { data: null, error }
  }
}
