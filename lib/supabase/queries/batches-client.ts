/**
 * Client-Side Batch Database Queries
 * 
 * These functions use the browser Supabase client for use in client components
 * For server components, use the functions from batches.ts instead
 */

import { createClient } from '@/lib/supabase/client'
import { isDevModeActive } from '@/lib/dev-mode'
import type {
  DomainBatch,
  BatchFilters,
  InsertBatch,
  UpdateBatch,
} from '@/types/batch'

/**
 * Get all batches for an organization/site with optional filtering
 */
export async function getBatches(
  orgId: string,
  siteId: string,
  filters?: BatchFilters
) {
  try {
    const supabase = createClient()
    let query = supabase
      .from('batches')
      .select('*')
      .eq('organization_id', orgId)
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })

    // Apply domain filter
    if (filters?.domainType) {
      query = query.eq('domain_type', filters.domainType)
    }

    // Apply stage filter
    if (filters?.stage) {
      query = query.eq('stage', filters.stage)
    }

    // Apply status filter
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    // Apply search filter
    if (filters?.search) {
      query = query.or(
        `batch_number.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query

    if (error) throw error
    return { data: data as DomainBatch[], error: null }
  } catch (error) {
    console.error('Error in getBatches:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get a single batch by ID
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
    console.error('Error in getBatchById:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Create a new batch
 */
export async function createBatch(batchData: InsertBatch) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('batches')
      .insert(batchData)
      .select()
      .single()

    if (error) throw error
    return { data: data as DomainBatch, error: null }
  } catch (error) {
    console.error('Error in createBatch:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update a batch
 */
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
      .select()
      .single()

    if (error) throw error
    return { data: data as DomainBatch, error: null }
  } catch (error) {
    console.error('Error in updateBatch:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Delete a batch (soft delete)
 */
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
    console.error('Error in deleteBatch:', error)
    return { error: error as Error }
  }
}
