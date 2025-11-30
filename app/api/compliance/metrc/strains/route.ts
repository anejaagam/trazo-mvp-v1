/**
 * Metrc Strains API Route
 *
 * GET /api/compliance/metrc/strains - List cached strains for a site
 * POST /api/compliance/metrc/strains - Push a cultivar to Metrc as a new strain
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'
import { createMetrcClientForSite } from '@/lib/compliance/metrc/services'
import type { MetrcStrainCreate } from '@/lib/compliance/metrc/types'

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

/**
 * POST /api/compliance/metrc/strains
 * Push a cultivar to Metrc as a new strain
 *
 * Request body:
 * - cultivarId: string - The cultivar ID to push to Metrc
 * - siteId: string - The site ID to push to (uses site context if not provided)
 *
 * Per Metrc API v2 documentation:
 * - Name (required): Cannot be edited after creation
 * - TestingStatus (required): "In-House", "None", or "Third-Party"
 * - ThcLevel (optional): THC content as decimal
 * - CbdLevel (optional): CBD content as decimal
 * - IndicaPercentage (optional): 0-100
 * - SativaPercentage (optional): 0-100
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

    // Check permissions
    if (!canPerformAction(userData.role, 'compliance:sync')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { cultivarId, siteId: requestedSiteId } = body

    if (!cultivarId) {
      return NextResponse.json(
        { error: 'Missing required field: cultivarId' },
        { status: 400 }
      )
    }

    // Determine site ID
    const contextSiteId = await getServerSiteId()
    const siteId = requestedSiteId
      || (contextSiteId && contextSiteId !== ALL_SITES_ID ? contextSiteId : null)
      || userData.default_site_id

    if (!siteId) {
      return NextResponse.json(
        { error: 'No site context available. Please select a site.' },
        { status: 400 }
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

    // Get the cultivar
    const { data: cultivar, error: cultivarError } = await supabase
      .from('cultivars')
      .select('*')
      .eq('id', cultivarId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (cultivarError || !cultivar) {
      return NextResponse.json({ error: 'Cultivar not found' }, { status: 404 })
    }

    // Check if already linked to Metrc
    if (cultivar.metrc_strain_id) {
      return NextResponse.json(
        { error: 'Cultivar is already linked to a Metrc strain', metrc_strain_id: cultivar.metrc_strain_id },
        { status: 400 }
      )
    }

    // Get Metrc client for site
    const { client: metrcClient, error: clientError } = await createMetrcClientForSite(siteId, supabase)

    if (clientError || !metrcClient) {
      return NextResponse.json(
        { error: clientError || 'Failed to create Metrc client. Please verify Metrc credentials are configured.' },
        { status: 400 }
      )
    }

    // Check if strain already exists in Metrc (by name)
    const existingStrain = await metrcClient.strains.findByName(cultivar.name)

    if (existingStrain) {
      // Strain already exists - link the cultivar to it
      const { error: updateError } = await supabase
        .from('cultivars')
        .update({
          metrc_strain_id: existingStrain.Id,
          metrc_sync_status: 'synced',
          metrc_last_synced_at: new Date().toISOString(),
          // Update with Metrc data
          thc_range_min: existingStrain.ThcLevel,
          thc_range_max: existingStrain.ThcLevel,
          cbd_range_min: existingStrain.CbdLevel,
          cbd_range_max: existingStrain.CbdLevel,
        })
        .eq('id', cultivarId)

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to link cultivar: ${updateError.message}` },
          { status: 500 }
        )
      }

      // Log the operation
      await supabase.from('metrc_sync_log').insert({
        organization_id: userData.organization_id,
        site_id: siteId,
        sync_type: 'strains',
        sync_direction: 'trazo_to_metrc',
        status: 'success',
        details: {
          action: 'linked',
          cultivar_id: cultivarId,
          cultivar_name: cultivar.name,
          metrc_strain_id: existingStrain.Id,
        },
        performed_by: user.id,
      })

      return NextResponse.json({
        success: true,
        action: 'linked',
        message: `Cultivar "${cultivar.name}" linked to existing Metrc strain`,
        metrc_strain_id: existingStrain.Id,
      })
    }

    // Create new strain in Metrc
    // Derive indica/sativa percentages from strain_type if not available
    let indicaPercentage: number | undefined
    let sativaPercentage: number | undefined

    if (cultivar.strain_type) {
      switch (cultivar.strain_type.toLowerCase()) {
        case 'indica':
          indicaPercentage = 100
          sativaPercentage = 0
          break
        case 'sativa':
          indicaPercentage = 0
          sativaPercentage = 100
          break
        case 'hybrid':
          indicaPercentage = 50
          sativaPercentage = 50
          break
        case 'indica_dominant':
          indicaPercentage = 70
          sativaPercentage = 30
          break
        case 'sativa_dominant':
          indicaPercentage = 30
          sativaPercentage = 70
          break
      }
    }

    const strainPayload: MetrcStrainCreate = {
      Name: cultivar.name,
      TestingStatus: 'None', // Default - can be updated later
      ThcLevel: cultivar.thc_range_max || cultivar.thc_range_min || 0,
      CbdLevel: cultivar.cbd_range_max || cultivar.cbd_range_min || 0,
      IndicaPercentage: indicaPercentage,
      SativaPercentage: sativaPercentage,
    }

    try {
      // Create the strain in Metrc
      await metrcClient.strains.create(strainPayload)

      // Fetch the created strain to get its ID
      const createdStrain = await metrcClient.strains.findByName(cultivar.name)

      if (!createdStrain) {
        // Update cultivar with failed status
        await supabase
          .from('cultivars')
          .update({ metrc_sync_status: 'sync_failed' })
          .eq('id', cultivarId)

        return NextResponse.json(
          { error: 'Strain created in Metrc but could not be retrieved' },
          { status: 500 }
        )
      }

      // Update cultivar with Metrc strain ID
      const { error: updateError } = await supabase
        .from('cultivars')
        .update({
          metrc_strain_id: createdStrain.Id,
          metrc_sync_status: 'synced',
          metrc_last_synced_at: new Date().toISOString(),
        })
        .eq('id', cultivarId)

      if (updateError) {
        return NextResponse.json(
          { error: `Strain created in Metrc but failed to update cultivar: ${updateError.message}` },
          { status: 500 }
        )
      }

      // Add to strains cache
      await supabase.from('metrc_strains_cache').upsert({
        organization_id: userData.organization_id,
        site_id: siteId,
        metrc_strain_id: createdStrain.Id,
        name: createdStrain.Name,
        testing_status: createdStrain.TestingStatus,
        thc_level: createdStrain.ThcLevel,
        cbd_level: createdStrain.CbdLevel,
        indica_percentage: createdStrain.IndicaPercentage || null,
        sativa_percentage: createdStrain.SativaPercentage || null,
        is_used: createdStrain.IsUsed,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'site_id,metrc_strain_id',
      })

      // Log the operation
      await supabase.from('metrc_sync_log').insert({
        organization_id: userData.organization_id,
        site_id: siteId,
        sync_type: 'strains',
        sync_direction: 'trazo_to_metrc',
        status: 'success',
        details: {
          action: 'created',
          cultivar_id: cultivarId,
          cultivar_name: cultivar.name,
          metrc_strain_id: createdStrain.Id,
        },
        performed_by: user.id,
      })

      return NextResponse.json({
        success: true,
        action: 'created',
        message: `Strain "${cultivar.name}" created in Metrc`,
        metrc_strain_id: createdStrain.Id,
      })
    } catch (metrcError) {
      // Update cultivar with failed status
      await supabase
        .from('cultivars')
        .update({ metrc_sync_status: 'sync_failed' })
        .eq('id', cultivarId)

      // Log the failure
      await supabase.from('metrc_sync_log').insert({
        organization_id: userData.organization_id,
        site_id: siteId,
        sync_type: 'strains',
        sync_direction: 'trazo_to_metrc',
        status: 'failed',
        details: {
          action: 'create_failed',
          cultivar_id: cultivarId,
          cultivar_name: cultivar.name,
        },
        error_message: (metrcError as Error).message,
        performed_by: user.id,
      })

      return NextResponse.json(
        { error: `Failed to create strain in Metrc: ${(metrcError as Error).message}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in strains push API:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
