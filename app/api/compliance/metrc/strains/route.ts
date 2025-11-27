/**
 * Metrc Strains API Route
 *
 * GET /api/compliance/metrc/strains - List cached strains for a site
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
    const search = searchParams.get('search')
    const isUsed = searchParams.get('is_used')

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
      .from('metrc_strains_cache')
      .select('*')
      .eq('site_id', currentSiteId)
      .order('name')

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (isUsed !== null && isUsed !== undefined) {
      query = query.eq('is_used', isUsed === 'true')
    }

    const { data: strains, error: queryError } = await query

    if (queryError) {
      console.error('Error fetching strains:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch strains' },
        { status: 500 }
      )
    }

    // Get linked cultivars count for each strain
    const { data: linkedCultivars } = await supabase
      .from('cultivars')
      .select('metrc_strain_id')
      .eq('organization_id', userData.organization_id)
      .not('metrc_strain_id', 'is', null)

    const linkedStrainIds = new Set(linkedCultivars?.map(c => c.metrc_strain_id) || [])

    // Add linked status to strains
    const strainsWithLinkStatus = strains?.map(strain => ({
      ...strain,
      is_linked_to_cultivar: linkedStrainIds.has(strain.metrc_strain_id),
    })) || []

    return NextResponse.json({
      strains: strainsWithLinkStatus,
      total: strainsWithLinkStatus.length,
      site_id: currentSiteId,
    })
  } catch (error) {
    console.error('Error in strains list API:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
