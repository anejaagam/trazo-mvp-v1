/**
 * Create Site from Metrc Facility API
 *
 * POST - Creates a new site from a Metrc facility and links them
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (
      !userData?.organization_id ||
      !['org_admin', 'site_manager'].includes(userData.role)
    ) {
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
      .select('*')
      .eq('id', facilityId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (facilityError || !facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    // Check if facility is already linked
    if (facility.is_linked) {
      return NextResponse.json(
        { error: 'This facility is already linked to a site' },
        { status: 400 }
      )
    }

    // Parse address if available
    const address = facility.address as { street1?: string; city?: string; state?: string; postalCode?: string } | null

    // Create the site
    const { data: newSite, error: siteError } = await supabase
      .from('sites')
      .insert({
        organization_id: userData.organization_id,
        name: facility.facility_name,
        address: address?.street1 || null,
        city: address?.city || null,
        state_province: address?.state || facility.state_code,
        postal_code: address?.postalCode || null,
        country: 'USA',
        timezone: getTimezoneForState(facility.state_code),
        max_pods: 48,
        site_license_number: facility.license_number,
        is_active: true,
        // Metrc linking
        metrc_license_number: facility.license_number,
        metrc_facility_id: facility.metrc_facility_id,
        metrc_credential_id: facility.credential_id,
        compliance_status: 'compliant',
        compliance_last_checked: new Date().toISOString(),
      })
      .select()
      .single()

    if (siteError) {
      console.error('Error creating site:', siteError)
      return NextResponse.json({ error: 'Failed to create site' }, { status: 500 })
    }

    // Update facility to mark as linked
    const { error: linkError } = await supabase
      .from('metrc_facilities_cache')
      .update({
        is_linked: true,
        linked_site_id: newSite.id,
      })
      .eq('id', facilityId)

    if (linkError) {
      console.error('Error linking facility:', linkError)
      // Don't fail - the site was created successfully
    }

    // Log the creation
    await supabase.from('metrc_sync_log').insert({
      organization_id: userData.organization_id,
      site_id: newSite.id,
      credential_id: facility.credential_id,
      sync_type: 'site_created_from_facility',
      sync_direction: 'metrc_to_trazo',
      status: 'success',
      details: {
        facilityId: facility.id,
        licenseNumber: facility.license_number,
        facilityName: facility.facility_name,
      },
      performed_by: user.id,
    })

    return NextResponse.json({
      message: 'Site created successfully',
      site: newSite,
    })
  } catch (error) {
    console.error('Create site from facility error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Get default timezone for a US state
 */
function getTimezoneForState(stateCode: string): string {
  const timezones: Record<string, string> = {
    // Pacific
    AK: 'America/Anchorage',
    CA: 'America/Los_Angeles',
    NV: 'America/Los_Angeles',
    OR: 'America/Los_Angeles',
    WA: 'America/Los_Angeles',
    // Mountain
    AZ: 'America/Phoenix',
    CO: 'America/Denver',
    MT: 'America/Denver',
    NM: 'America/Denver',
    UT: 'America/Denver',
    WY: 'America/Denver',
    // Central
    IL: 'America/Chicago',
    LA: 'America/Chicago',
    MO: 'America/Chicago',
    OK: 'America/Chicago',
    TX: 'America/Chicago',
    // Eastern
    DC: 'America/New_York',
    FL: 'America/New_York',
    MA: 'America/New_York',
    MD: 'America/New_York',
    ME: 'America/New_York',
    MI: 'America/New_York',
    NJ: 'America/New_York',
    NY: 'America/New_York',
    OH: 'America/New_York',
    PA: 'America/New_York',
  }

  return timezones[stateCode.toUpperCase()] || 'America/Los_Angeles'
}
