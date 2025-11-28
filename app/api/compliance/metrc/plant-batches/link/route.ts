/**
 * Link Metrc Plant Batches to Trazo Batches API Route
 *
 * POST /api/compliance/metrc/plant-batches/link - Create a Trazo batch from a cached Metrc plant batch
 * GET /api/compliance/metrc/plant-batches/link - Get unlinked Metrc plant batches available for linking
 *
 * This allows using Metrc sandbox plant batches as source batches for testing
 * without importing them through the inventory system.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

interface MetrcPlantBatchCache {
  id: string
  organization_id: string
  site_id: string
  metrc_batch_id: number
  name: string
  type: string
  count: number
  strain_name: string
  planted_date: string
  room_name: string | null
  untracked_count: number | null
  tracked_count: number | null
  is_active: boolean
  trazo_batch_id: string | null
}

/**
 * GET - Get unlinked Metrc plant batches available for linking
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id, default_site_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permissions
    if (!canPerformAction(userData.role, 'compliance:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

    // Build query for unlinked plant batches
    let query = supabase
      .from('metrc_plant_batches_cache')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .is('trazo_batch_id', null)
      .eq('is_active', true)
      .order('name')

    // Filter by site if specified
    if (currentSiteId) {
      query = query.eq('site_id', currentSiteId)
    }

    const { data: unlinkedBatches, error: queryError } = await query

    if (queryError) {
      console.error('Error fetching unlinked batches:', queryError)
      return NextResponse.json({ error: 'Failed to fetch unlinked batches' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      batches: unlinkedBatches || [],
    })
  } catch (error) {
    console.error('Error in GET plant-batches/link:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a Trazo batch from a cached Metrc plant batch
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id, default_site_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permissions - require compliance:sync permission
    if (!canPerformAction(userData.role, 'compliance:sync')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { metrcPlantBatchCacheId }: { metrcPlantBatchCacheId: string } = body

    if (!metrcPlantBatchCacheId) {
      return NextResponse.json(
        { error: 'Missing required field: metrcPlantBatchCacheId' },
        { status: 400 }
      )
    }

    // Get the cached Metrc plant batch
    const { data: cachedBatch, error: cacheError } = await supabase
      .from('metrc_plant_batches_cache')
      .select('*')
      .eq('id', metrcPlantBatchCacheId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (cacheError || !cachedBatch) {
      return NextResponse.json(
        { error: 'Metrc plant batch not found or access denied' },
        { status: 404 }
      )
    }

    const batch = cachedBatch as MetrcPlantBatchCache

    // Check if already linked
    if (batch.trazo_batch_id) {
      return NextResponse.json(
        { error: 'This Metrc plant batch is already linked to a Trazo batch' },
        { status: 400 }
      )
    }

    // Try to find a cultivar by strain name
    const { data: cultivar } = await supabase
      .from('cultivars')
      .select('id')
      .eq('organization_id', userData.organization_id)
      .ilike('name', batch.strain_name)
      .single()

    // Map Metrc type to Trazo stage
    const stageMap: Record<string, string> = {
      'Clone': 'clone',
      'Seed': 'germination',
    }
    const stage = stageMap[batch.type] || 'clone'

    // Create the Trazo batch
    const { data: newBatch, error: createError } = await supabase
      .from('batches')
      .insert({
        organization_id: batch.organization_id,
        site_id: batch.site_id,
        batch_number: batch.name,
        cultivar_id: cultivar?.id || null,
        stage: stage,
        plant_count: batch.count,
        start_date: batch.planted_date,
        status: 'active',
        metrc_batch_id: String(batch.metrc_batch_id),
        metrc_plant_batch_name: batch.name,
        tracked_plant_count: batch.tracked_count || 0,
        untracked_plant_count: batch.untracked_count || batch.count,
        source_type: 'metrc_import',
        tracking_mode: 'closed_loop',
        notes: `Linked from Metrc plant batch (ID: ${batch.metrc_batch_id}). Strain: ${batch.strain_name}`,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating Trazo batch:', createError)
      return NextResponse.json(
        { error: `Failed to create Trazo batch: ${createError.message}` },
        { status: 500 }
      )
    }

    // Update the cache entry to link to the new batch
    const { error: updateError } = await supabase
      .from('metrc_plant_batches_cache')
      .update({ trazo_batch_id: newBatch.id })
      .eq('id', metrcPlantBatchCacheId)

    if (updateError) {
      console.error('Error linking cache to batch:', updateError)
      // Don't fail - batch was created, just log the error
    }

    // Also create a metrc_batch_mapping entry for sync tracking
    await supabase.from('metrc_batch_mappings').insert({
      organization_id: batch.organization_id,
      site_id: batch.site_id,
      trazo_batch_id: newBatch.id,
      metrc_batch_id: String(batch.metrc_batch_id),
      metrc_batch_name: batch.name,
      sync_status: 'synced',
      last_synced_at: new Date().toISOString(),
    })

    // Log the operation
    await supabase.from('metrc_sync_log').insert({
      organization_id: userData.organization_id,
      site_id: batch.site_id,
      sync_type: 'plant_batches',
      direction: 'metrc_to_trazo',
      operation: 'link_batch',
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      response_payload: {
        metrcBatchId: batch.metrc_batch_id,
        trazoBatchId: newBatch.id,
        batchNumber: newBatch.batch_number,
      },
      initiated_by: user.id,
    })

    return NextResponse.json({
      success: true,
      batch: newBatch,
      message: `Successfully linked Metrc plant batch "${batch.name}" to Trazo batch`,
    })
  } catch (error) {
    console.error('Error in POST plant-batches/link:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
