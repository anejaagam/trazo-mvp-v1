/**
 * Create Site from Metrc Facility API
 *
 * POST - Create a new Trazo site from an unlinked Metrc facility
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const body = await request.json()
    const { facilityId } = body

    if (!facilityId) {
      return NextResponse.json({ error: 'facilityId is required' }, { status: 400 })
    }

    // Get the facility from cache
    const { data: facility, error: facilityError } = await supabase
      .from('metrc_facilities_cache')
      .select(`
        id,
        license_number,
        facility_name,
        facility_type,
        state_code,
        metrc_facility_id,
        address,
        is_linked,
        credential_id
      `)
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (facilityError || !facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    if (facility.is_linked) {
      return NextResponse.json({
        error: 'This facility is already linked to a site',
      }, { status: 400 })
    }

    // Create the site using facility details
    const address = facility.address as { street1?: string; city?: string; state?: string; postalCode?: string } | null
    const siteAddress = address
      ? [address.street1, address.city, address.state, address.postalCode].filter(Boolean).join(', ')
      : null

    const { data: site, error: createError } = await supabase
      .from('sites')
      .insert({
        organization_id: userData.organization_id,
        name: facility.facility_name,
        address: siteAddress,
        is_active: true,
        metrc_license_number: facility.license_number,
        metrc_facility_id: facility.metrc_facility_id,
        metrc_credential_id: facility.credential_id,
        compliance_status: 'compliant',
        compliance_last_checked: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating site:', createError)
      return NextResponse.json({ error: 'Failed to create site' }, { status: 500 })
    }

    // Update facility to mark as linked
    const { error: updateError } = await supabase
      .from('metrc_facilities_cache')
      .update({
        is_linked: true,
        linked_site_id: site.id,
      })
      .eq('id', facilityId)

    if (updateError) {
      console.error('Error updating facility link:', updateError)
      // Don't fail - the site was created successfully
    }

    // Log the action
    await supabase.from('metrc_sync_log').insert({
      organization_id: userData.organization_id,
      site_id: site.id,
      credential_id: facility.credential_id,
      sync_type: 'site_link',
      sync_direction: 'metrc_to_trazo',
      status: 'success',
      details: {
        action: 'create_site_from_facility',
        licenseNumber: facility.license_number,
        facilityName: facility.facility_name,
        facilityType: facility.facility_type,
      },
      performed_by: user.id,
    })

    return NextResponse.json({
      message: 'Site created successfully from Metrc facility',
      site: {
        id: site.id,
        name: site.name,
        address: site.address,
        metrcLicenseNumber: site.metrc_license_number,
        complianceStatus: 'compliant',
      },
      facility: {
        id: facility.id,
        licenseNumber: facility.license_number,
        name: facility.facility_name,
        type: facility.facility_type,
        stateCode: facility.state_code,
      },
    })
  } catch (error) {
    console.error('Create site from facility error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
