/**
 * API Route: Create Inventory Item
 * POST /api/inventory/items
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'
import type { InsertInventoryItem } from '@/types/inventory'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role and default site
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, default_site_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (!canPerformAction(userData.role, 'inventory:create')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: InsertInventoryItem = await request.json()

    // Validate required fields
    if (!body.name || !body.item_type || !body.unit_of_measure) {
      return NextResponse.json(
        { error: 'Missing required fields: name, item_type, unit_of_measure' },
        { status: 400 }
      )
    }

    // Determine site_id: use body.site_id if provided, otherwise use cookie context or default
    let siteId = body.site_id
    if (!siteId) {
      const contextSiteId = await getServerSiteId()
      if (contextSiteId && contextSiteId !== ALL_SITES_ID) {
        siteId = contextSiteId
      } else {
        // Fall back to user's default site
        siteId = userData.default_site_id
      }
    }

    if (!siteId) {
      return NextResponse.json(
        { error: 'No site context available. Please select a site.' },
        { status: 400 }
      )
    }

    // Create inventory item
    const { data: item, error: createError } = await supabase
      .from('inventory_items')
      .insert({
        ...body,
        site_id: siteId,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating inventory item:', createError)
      return NextResponse.json(
        { error: 'Failed to create inventory item', details: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data: item, message: 'Inventory item created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/inventory/items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * API Route: Get Inventory Items
 * GET /api/inventory/items?site_id=xxx&item_type=xxx
 *
 * Site context: Uses cookie-based site context if site_id not provided.
 * For org_admin in "all sites" mode, returns items across all organization sites.
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role, organization, and default site
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id, default_site_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (!canPerformAction(userData.role, 'inventory:view')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    let siteId = searchParams.get('site_id')
    const itemType = searchParams.get('item_type')
    const search = searchParams.get('search')

    // If no site_id in query, use cookie context
    if (!siteId) {
      const contextSiteId = await getServerSiteId()
      siteId = contextSiteId
    }

    // Determine if this is "all sites" mode
    const isAllSitesMode = siteId === ALL_SITES_ID || siteId === 'all'

    // Only org_admin can use "all sites" mode
    if (isAllSitesMode && userData.role !== 'org_admin') {
      return NextResponse.json(
        { error: 'Only organization admins can view all sites' },
        { status: 403 }
      )
    }

    // Fall back to default site if no context
    if (!siteId && !isAllSitesMode) {
      siteId = userData.default_site_id
    }

    if (!siteId && !isAllSitesMode) {
      return NextResponse.json(
        { error: 'No site context available. Please select a site.' },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('inventory_items')
      .select('*, sites!inner(organization_id)')
      .eq('is_active', true)
      .order('name', { ascending: true })

    // Apply site filter
    if (isAllSitesMode) {
      // Filter by organization for "all sites" mode
      query = query.eq('sites.organization_id', userData.organization_id)
    } else {
      query = query.eq('site_id', siteId)
    }

    // Apply additional filters
    if (itemType && itemType !== 'all') {
      query = query.eq('item_type', itemType)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    const { data: items, error: queryError } = await query

    if (queryError) {
      console.error('Error fetching inventory items:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch inventory items', details: queryError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data: items },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in GET /api/inventory/items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
