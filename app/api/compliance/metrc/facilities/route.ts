/**
 * Metrc Facilities API
 *
 * GET - Get cached facilities for organization
 * POST - Refresh facilities from Metrc API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCredentialsAndFetchFacilities } from '@/lib/compliance/metrc/services'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const membership = { organization_id: userData.organization_id }

    const { searchParams } = new URL(request.url)
    const stateCode = searchParams.get('stateCode')
    const linkedOnly = searchParams.get('linkedOnly') === 'true'
    const unlinkedOnly = searchParams.get('unlinkedOnly') === 'true'

    // Build query
    let query = supabase
      .from('metrc_facilities_cache')
      .select(`
        id,
        license_number,
        facility_name,
        facility_type,
        state_code,
        metrc_facility_id,
        address,
        is_active,
        is_linked,
        linked_site_id,
        last_synced_at,
        raw_data,
        sites:linked_site_id (
          id,
          name
        )
      `)
      .eq('organization_id', membership.organization_id)
      .eq('is_active', true)

    if (stateCode) {
      query = query.eq('state_code', stateCode.toUpperCase())
    }

    if (linkedOnly) {
      query = query.eq('is_linked', true)
    } else if (unlinkedOnly) {
      query = query.eq('is_linked', false)
    }

    const { data: facilities, error: queryError } = await query.order('facility_name')

    if (queryError) {
      console.error('Error fetching facilities:', queryError)
      return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 })
    }

    return NextResponse.json({
      facilities: facilities || [],
      total: facilities?.length || 0,
    })
  } catch (error) {
    console.error('Facilities GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id || !['org_admin', 'site_manager'].includes(userData.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const membership = { organization_id: userData.organization_id, role: userData.role }

    const body = await request.json()
    const { stateCode } = body

    if (!stateCode) {
      return NextResponse.json({ error: 'stateCode is required' }, { status: 400 })
    }

    // Get credentials for this state
    const { data: credential, error: credError } = await supabase
      .from('metrc_org_credentials')
      .select('id, user_api_key, is_sandbox')
      .eq('organization_id', membership.organization_id)
      .eq('state_code', stateCode.toUpperCase())
      .single()

    if (credError || !credential) {
      return NextResponse.json({
        error: `No credentials found for state: ${stateCode}`,
      }, { status: 404 })
    }

    // Fetch facilities from Metrc
    const validationResult = await validateCredentialsAndFetchFacilities(
      stateCode,
      credential.user_api_key,
      credential.is_sandbox
    )

    if (!validationResult.isValid) {
      return NextResponse.json({
        error: 'Failed to fetch facilities',
        validationError: validationResult.error,
      }, { status: 400 })
    }

    const facilities = validationResult.facilities || []

    // Get existing facility links for this organization (by license_number)
    // This handles test mode where multiple states return the same AK sandbox facilities
    const { data: existingFacilities } = await supabase
      .from('metrc_facilities_cache')
      .select('license_number, is_linked, linked_site_id')
      .eq('organization_id', membership.organization_id)

    const existingLinks = new Map<string, { isLinked: boolean; linkedSiteId: string | null }>()
    existingFacilities?.forEach(f => {
      existingLinks.set(f.license_number, {
        isLinked: f.is_linked,
        linkedSiteId: f.linked_site_id,
      })
    })

    // Upsert facilities (handles test mode where all states return same AK facilities)
    // Using organization_id + license_number as the conflict key
    // Deduplicate by license_number to avoid "cannot affect row a second time" error
    const seenLicenses = new Set<string>()
    const facilitiesData = facilities
      .filter(f => {
        if (seenLicenses.has(f.licenseNumber)) {
          return false
        }
        seenLicenses.add(f.licenseNumber)
        return true
      })
      .map(f => {
        const existing = existingLinks.get(f.licenseNumber)
        return {
          organization_id: membership.organization_id,
          credential_id: credential.id,
          license_number: f.licenseNumber,
          facility_name: f.name,
          facility_type: f.licenseType,
          state_code: f.stateCode,
          metrc_facility_id: f.id,
          address: f.address || null,
          is_active: true,
          is_linked: existing?.isLinked || false,
          linked_site_id: existing?.linkedSiteId || null,
          raw_data: f.rawData,
        }
      })

    if (facilitiesData.length > 0) {
      const { error: upsertError } = await supabase
        .from('metrc_facilities_cache')
        .upsert(facilitiesData, {
          onConflict: 'organization_id,license_number',
        })

      if (upsertError) {
        console.error('Error upserting facilities:', upsertError)
        return NextResponse.json({ error: 'Failed to save facilities' }, { status: 500 })
      }
    }

    // Update credential sync timestamp
    await supabase
      .from('metrc_org_credentials')
      .update({ last_facilities_sync: new Date().toISOString() })
      .eq('id', credential.id)

    // Log the sync
    await supabase.from('metrc_sync_log').insert({
      organization_id: membership.organization_id,
      credential_id: credential.id,
      sync_type: 'facilities_sync',
      sync_direction: 'metrc_to_trazo',
      status: 'success',
      details: {
        facilitiesFound: facilities.length,
        stateCode,
      },
      performed_by: user.id,
    })

    return NextResponse.json({
      message: 'Facilities refreshed successfully',
      facilities: facilitiesData,
      total: facilitiesData.length,
    })
  } catch (error) {
    console.error('Facilities POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
