/**
 * Site-to-Metrc License Linking API
 *
 * POST - Link a site to a Metrc facility license
 * DELETE - Unlink a site from Metrc
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ siteId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { siteId } = await params
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
    const { licenseNumber } = body

    if (!licenseNumber) {
      return NextResponse.json({ error: 'licenseNumber is required' }, { status: 400 })
    }

    // Verify site belongs to organization
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, organization_id, metrc_license_number')
      .eq('id', siteId)
      .eq('organization_id', membership.organization_id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Get facility from cache
    const { data: facility, error: facilityError } = await supabase
      .from('metrc_facilities_cache')
      .select('id, metrc_facility_id, license_number, facility_name, facility_type, state_code, credential_id, is_linked, linked_site_id')
      .eq('organization_id', membership.organization_id)
      .eq('license_number', licenseNumber)
      .single()

    if (facilityError || !facility) {
      return NextResponse.json({
        error: `Facility with license ${licenseNumber} not found. Please sync facilities first.`,
      }, { status: 404 })
    }

    // Check if facility is already linked to another site
    if (facility.is_linked && facility.linked_site_id && facility.linked_site_id !== siteId) {
      return NextResponse.json({
        error: `This facility is already linked to another site`,
      }, { status: 400 })
    }

    // Unlink previous facility if site was linked to a different one
    if (site.metrc_license_number && site.metrc_license_number !== licenseNumber) {
      await supabase
        .from('metrc_facilities_cache')
        .update({
          is_linked: false,
          linked_site_id: null,
        })
        .eq('organization_id', membership.organization_id)
        .eq('license_number', site.metrc_license_number)
    }

    // Link the site to the facility
    const { error: updateSiteError } = await supabase
      .from('sites')
      .update({
        metrc_license_number: licenseNumber,
        metrc_facility_id: facility.metrc_facility_id,
        metrc_credential_id: facility.credential_id,
        compliance_status: 'compliant',
        compliance_last_checked: new Date().toISOString(),
      })
      .eq('id', siteId)

    if (updateSiteError) {
      console.error('Error updating site:', updateSiteError)
      return NextResponse.json({ error: 'Failed to link site' }, { status: 500 })
    }

    // Update facility link status
    const { error: updateFacilityError } = await supabase
      .from('metrc_facilities_cache')
      .update({
        is_linked: true,
        linked_site_id: siteId,
      })
      .eq('id', facility.id)

    if (updateFacilityError) {
      console.error('Error updating facility:', updateFacilityError)
      // Don't fail the request, the trigger should handle this
    }

    // Log the link
    await supabase.from('metrc_sync_log').insert({
      organization_id: membership.organization_id,
      site_id: siteId,
      credential_id: facility.credential_id,
      sync_type: 'site_link',
      sync_direction: 'trazo_to_metrc',
      status: 'success',
      details: {
        licenseNumber,
        facilityName: facility.facility_name,
        facilityType: facility.facility_type,
      },
      performed_by: user.id,
    })

    return NextResponse.json({
      message: 'Site linked to Metrc facility successfully',
      site: {
        id: siteId,
        name: site.name,
        metrcLicenseNumber: licenseNumber,
        complianceStatus: 'compliant',
      },
      facility: {
        licenseNumber: facility.license_number,
        name: facility.facility_name,
        type: facility.facility_type,
        stateCode: facility.state_code,
      },
    })
  } catch (error) {
    console.error('Site link POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { siteId } = await params
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

    // Get current site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, organization_id, metrc_license_number')
      .eq('id', siteId)
      .eq('organization_id', membership.organization_id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    if (!site.metrc_license_number) {
      return NextResponse.json({ error: 'Site is not linked to Metrc' }, { status: 400 })
    }

    // Unlink the site
    const { error: updateError } = await supabase
      .from('sites')
      .update({
        metrc_license_number: null,
        metrc_facility_id: null,
        metrc_credential_id: null,
        compliance_status: 'uncompliant',
        compliance_last_checked: new Date().toISOString(),
      })
      .eq('id', siteId)

    if (updateError) {
      console.error('Error unlinking site:', updateError)
      return NextResponse.json({ error: 'Failed to unlink site' }, { status: 500 })
    }

    // Update facility link status
    await supabase
      .from('metrc_facilities_cache')
      .update({
        is_linked: false,
        linked_site_id: null,
      })
      .eq('organization_id', membership.organization_id)
      .eq('license_number', site.metrc_license_number)

    // Log the unlink
    await supabase.from('metrc_sync_log').insert({
      organization_id: membership.organization_id,
      site_id: siteId,
      sync_type: 'site_unlink',
      sync_direction: 'trazo_to_metrc',
      status: 'success',
      details: {
        previousLicenseNumber: site.metrc_license_number,
      },
      performed_by: user.id,
    })

    return NextResponse.json({
      message: 'Site unlinked from Metrc successfully',
      site: {
        id: siteId,
        name: site.name,
        complianceStatus: 'uncompliant',
      },
    })
  } catch (error) {
    console.error('Site link DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
