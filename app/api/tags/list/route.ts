/**
 * Tag List API Route
 *
 * GET /api/tags/list - Get paginated list of tags for a site with filters
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
    const tagType = searchParams.get('tag_type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit

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
      .from('metrc_tag_inventory')
      .select('*', { count: 'exact' })
      .eq('site_id', currentSiteId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (tagType) {
      query = query.eq('tag_type', tagType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.ilike('tag_number', `%${search}%`)
    }

    const { data: tags, error: queryError, count } = await query

    if (queryError) {
      console.error('Error fetching tags:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      )
    }

    // If tags are assigned, get the linked entity names
    const assignedTags = tags?.filter(t => t.assigned_to_id) || []
    const entityNames: Record<string, string> = {}

    if (assignedTags.length > 0) {
      // Group by assigned_to_type
      const batchIds = assignedTags.filter(t => t.assigned_to_type === 'batch').map(t => t.assigned_to_id)
      const plantIds = assignedTags.filter(t => t.assigned_to_type === 'plant').map(t => t.assigned_to_id)

      // Fetch batch names
      if (batchIds.length > 0) {
        const { data: batches } = await supabase
          .from('batches')
          .select('id, name')
          .in('id', batchIds)

        batches?.forEach(b => {
          entityNames[b.id] = b.name
        })
      }

      // Fetch plant labels (from batch_plants table)
      if (plantIds.length > 0) {
        const { data: plants } = await supabase
          .from('batch_plants')
          .select('id, metrc_plant_label')
          .in('id', plantIds)

        plants?.forEach(p => {
          entityNames[p.id] = p.metrc_plant_label
        })
      }
    }

    // Enrich tags with entity names
    const enrichedTags = tags?.map(tag => ({
      ...tag,
      assigned_entity_name: tag.assigned_to_id ? entityNames[tag.assigned_to_id] || null : null,
    })) || []

    return NextResponse.json({
      tags: enrichedTags,
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
      site_id: currentSiteId,
    })
  } catch (error) {
    console.error('Error in tag list API:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
