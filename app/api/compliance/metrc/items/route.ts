/**
 * Metrc Items API Route
 *
 * GET /api/compliance/metrc/items - List cached items for a site
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

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

    // Get query params
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('site_id')
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const requiresStrain = searchParams.get('requires_strain')

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = siteId
      || (contextSiteId && contextSiteId !== ALL_SITES_ID ? contextSiteId : null)
      || userData.default_site_id

    if (!currentSiteId) {
      return NextResponse.json(
        { error: 'No site context available' },
        { status: 400 }
      )
    }

    // Verify site belongs to user's organization
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, organization_id')
      .eq('id', currentSiteId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found or access denied' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('metrc_items_cache')
      .select('*')
      .eq('site_id', currentSiteId)
      .order('name')

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (category) {
      query = query.ilike('product_category_name', `%${category}%`)
    }

    if (requiresStrain !== null && requiresStrain !== undefined) {
      query = query.eq('requires_strain', requiresStrain === 'true')
    }

    const { data: items, error: queryError } = await query

    if (queryError) {
      console.error('Error fetching items:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
      )
    }

    // Get linked inventory items count
    const { data: linkedItems } = await supabase
      .from('inventory_items')
      .select('metrc_item_id')
      .eq('site_id', currentSiteId)
      .not('metrc_item_id', 'is', null)

    const linkedItemIds = new Set(linkedItems?.map(i => i.metrc_item_id) || [])

    // Add linked status to items
    const itemsWithLinkStatus = items?.map(item => ({
      ...item,
      is_linked_to_inventory: linkedItemIds.has(item.metrc_item_id),
    })) || []

    // Get unique categories for filtering
    const categories = [...new Set(items?.map(i => i.product_category_name).filter(Boolean) || [])]

    return NextResponse.json({
      items: itemsWithLinkStatus,
      total: itemsWithLinkStatus.length,
      categories,
      site_id: currentSiteId,
    })
  } catch (error) {
    console.error('Error in items list API:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
