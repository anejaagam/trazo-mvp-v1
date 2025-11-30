/**
 * Import Plant Batches from Metrc to Inventory API Route
 *
 * POST /api/compliance/import-batches - Import plant batches from Metrc cache into TRAZO inventory
 *
 * This endpoint is used for Closed Loop Environment setups where Metrc already
 * has starting inventory. It creates TRAZO inventory items and lots from cached
 * Metrc plant batches (clones/seeds) that can then be used to create growing batches.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { importBatchesFromMetrcCache } from '@/lib/compliance/metrc/sync/plant-batches-sync'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

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

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

    // Parse request body
    const body = await request.json()
    const { siteId }: { siteId: string } = body

    if (!siteId) {
      return NextResponse.json(
        { error: 'Missing required field: siteId' },
        { status: 400 }
      )
    }

    // Validate siteId matches current site context (unless in "all sites" mode)
    if (currentSiteId && siteId !== currentSiteId) {
      return NextResponse.json(
        { error: 'Requested site does not match current site context' },
        { status: 403 }
      )
    }

    // Verify site belongs to user's organization
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, organization_id')
      .eq('id', siteId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found or access denied' }, { status: 404 })
    }

    // Run import
    const startedAt = new Date().toISOString()
    const result = await importBatchesFromMetrcCache(
      userData.organization_id,
      siteId,
      user.id
    )
    const completedAt = new Date().toISOString()

    // Log the import operation
    await supabase.from('metrc_sync_log').insert({
      organization_id: userData.organization_id,
      site_id: siteId,
      sync_type: 'plant_batches',
      direction: 'metrc_to_trazo',
      operation: 'import_to_inventory',
      status: result.success ? 'completed' : 'failed',
      started_at: startedAt,
      completed_at: completedAt,
      response_payload: {
        imported: result.imported,
        skipped: result.skipped,
        importedItems: result.importedItems,
      },
      error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
      initiated_by: user.id,
    })

    return NextResponse.json({
      success: result.success,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
      importedItems: result.importedItems,
      startedAt,
      completedAt,
    }, { status: 200 })

  } catch (error) {
    console.error('Error in import batches API:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
