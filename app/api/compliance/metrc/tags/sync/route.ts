/**
 * Metrc Tags Sync API Route
 *
 * POST /api/compliance/metrc/tags/sync - Sync available tags from Metrc to local inventory
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { syncTagsFromMetrc, syncPlantTagsFromMetrc, syncPackageTagsFromMetrc } from '@/lib/compliance/metrc/sync/tags-sync'
import { createMetrcClientForSite } from '@/lib/compliance/metrc/services'
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

    // Check permissions
    if (!canPerformAction(userData.role, 'compliance:sync')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { siteId, tagType }: { siteId: string; tagType?: 'Plant' | 'Package' | 'all' } = body

    if (!siteId) {
      return NextResponse.json(
        { error: 'Missing required field: siteId' },
        { status: 400 }
      )
    }

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

    // Validate siteId matches current site context
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

    // Get Metrc client for site
    const { client, error: clientError } = await createMetrcClientForSite(siteId, supabase)

    if (clientError || !client) {
      return NextResponse.json(
        { error: clientError || 'Failed to create Metrc client' },
        { status: 400 }
      )
    }

    // Sync tags from Metrc based on tagType
    let result
    if (tagType === 'Plant') {
      result = await syncPlantTagsFromMetrc(client, userData.organization_id, siteId)
    } else if (tagType === 'Package') {
      result = await syncPackageTagsFromMetrc(client, userData.organization_id, siteId)
    } else {
      // Default: sync all tags
      result = await syncTagsFromMetrc(client, userData.organization_id, siteId)
    }

    // Log the sync operation
    const { error: logError } = await supabase.from('metrc_sync_log').insert({
      organization_id: userData.organization_id,
      site_id: siteId,
      sync_type: 'tags',
      direction: 'metrc_to_trazo',
      operation: 'sync',
      status: result.success ? 'completed' : 'failed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      response_payload: {
        synced: result.synced,
        created: result.created,
        updated: result.updated,
        plantTagsSynced: result.plantTagsSynced,
        packageTagsSynced: result.packageTagsSynced,
        tagType: tagType || 'all',
      },
      error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
      initiated_by: user.id,
    })

    if (logError) {
      console.error('Failed to log tags sync operation:', logError)
    }

    return NextResponse.json({
      success: result.success,
      data: {
        synced: result.synced,
        created: result.created,
        updated: result.updated,
        plantTagsSynced: result.plantTagsSynced,
        packageTagsSynced: result.packageTagsSynced,
        errors: result.errors,
        warnings: result.warnings,
      },
    })
  } catch (error) {
    console.error('Error in tags sync API:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
