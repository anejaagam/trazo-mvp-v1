/**
 * Tag Inventory Summary API Route
 *
 * GET /api/tags/summary - Get tag counts by type and status for a site
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

    // Get site_id from query params
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('site_id')

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

    // Get tag counts grouped by tag_type and status
    const { data: tagCounts, error: queryError } = await supabase
      .from('metrc_tag_inventory')
      .select('tag_type, status')
      .eq('site_id', currentSiteId)

    if (queryError) {
      console.error('Error fetching tag counts:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch tag summary' },
        { status: 500 }
      )
    }

    // Aggregate counts by tag_type and status
    const countMap: Record<string, Record<string, number>> = {}

    for (const tag of tagCounts || []) {
      if (!countMap[tag.tag_type]) {
        countMap[tag.tag_type] = {}
      }
      if (!countMap[tag.tag_type][tag.status]) {
        countMap[tag.tag_type][tag.status] = 0
      }
      countMap[tag.tag_type][tag.status]++
    }

    // Convert to array format expected by the UI
    const summary: Array<{ tag_type: string; status: string; tag_count: number }> = []

    for (const [tagType, statuses] of Object.entries(countMap)) {
      for (const [status, count] of Object.entries(statuses)) {
        summary.push({
          tag_type: tagType,
          status: status,
          tag_count: count,
        })
      }
    }

    // Sort by tag_type then status
    summary.sort((a, b) => {
      if (a.tag_type !== b.tag_type) {
        return a.tag_type.localeCompare(b.tag_type)
      }
      return a.status.localeCompare(b.status)
    })

    // Calculate totals by type
    const totalsByType: Record<string, { total: number; available: number }> = {}
    for (const item of summary) {
      if (!totalsByType[item.tag_type]) {
        totalsByType[item.tag_type] = { total: 0, available: 0 }
      }
      totalsByType[item.tag_type].total += item.tag_count
      if (item.status === 'available') {
        totalsByType[item.tag_type].available += item.tag_count
      }
    }

    return NextResponse.json({
      summary,
      totals_by_type: totalsByType,
      site_id: currentSiteId,
      total_tags: tagCounts?.length || 0,
    })
  } catch (error) {
    console.error('Error in tag summary API:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
