/**
 * Metrc Items Sync API Route
 *
 * POST /api/compliance/metrc/items/sync - Sync items from Metrc to local cache
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { syncItemsFromMetrc } from '@/lib/compliance/metrc/sync/items-sync'
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
    const { siteId }: { siteId: string } = body

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

    // Sync items from Metrc
    const result = await syncItemsFromMetrc(client, userData.organization_id, siteId)

    // Log the sync operation
    await supabase.from('metrc_sync_log').insert({
      organization_id: userData.organization_id,
      site_id: siteId,
      sync_type: 'items',
      sync_direction: 'metrc_to_trazo',
      status: result.success ? 'success' : 'failed',
      details: {
        synced: result.synced,
        created: result.created,
        updated: result.updated,
      },
      error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
      performed_by: user.id,
    })

    return NextResponse.json({
      success: result.success,
      data: {
        synced: result.synced,
        created: result.created,
        updated: result.updated,
        errors: result.errors,
        warnings: result.warnings,
      },
    })
  } catch (error) {
    console.error('Error in items sync API:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
