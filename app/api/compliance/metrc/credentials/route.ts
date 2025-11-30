/**
 * Metrc Credentials API
 *
 * POST - Save/update credentials for organization + state
 * GET - Get all credentials for organization
 * DELETE - Remove credentials for organization + state
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCredentialsAndFetchFacilities, getConfiguredStates, isInTestMode } from '@/lib/compliance/metrc/services'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user and org
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: userData, error: memberError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (memberError || !userData?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const membership = { organization_id: userData.organization_id, role: userData.role }

    // Get credentials for organization
    const { data: credentials, error: credError } = await supabase
      .from('metrc_org_credentials')
      .select(`
        id,
        state_code,
        is_sandbox,
        is_active,
        validated_at,
        validation_error,
        last_facilities_sync,
        created_at
      `)
      .eq('organization_id', membership.organization_id)
      .order('state_code')

    if (credError) {
      console.error('Error fetching credentials:', credError)
      return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 })
    }

    // Get configured states (states we have vendor keys for)
    const configuredStates = getConfiguredStates()

    // Check if we're in test mode (using AK sandbox for all states)
    const testMode = isInTestMode()

    return NextResponse.json({
      credentials: credentials || [],
      configuredStates,
      testMode,
    })
  } catch (error) {
    console.error('Credentials GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user and org
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization with admin check
    const { data: userData, error: memberError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (memberError || !userData?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    if (!['org_admin', 'site_manager'].includes(userData.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const membership = { organization_id: userData.organization_id, role: userData.role }

    const body = await request.json()
    const { stateCode, userApiKey, isSandbox = false, validateNow = true } = body

    if (!stateCode || !userApiKey) {
      return NextResponse.json({ error: 'stateCode and userApiKey are required' }, { status: 400 })
    }

    let validationResult: { isValid: boolean; error?: string; facilities?: any[] } | null = null
    let facilities: any[] | null = null

    // Validate credentials if requested
    if (validateNow) {
      validationResult = await validateCredentialsAndFetchFacilities(
        stateCode,
        userApiKey,
        isSandbox
      )

      if (!validationResult.isValid) {
        return NextResponse.json({
          error: 'Credential validation failed',
          validationError: validationResult.error,
        }, { status: 400 })
      }

      facilities = validationResult.facilities || null
    }

    // Upsert credentials
    const { data: credential, error: upsertError } = await supabase
      .from('metrc_org_credentials')
      .upsert({
        organization_id: membership.organization_id,
        state_code: stateCode.toUpperCase(),
        user_api_key: userApiKey,  // Should be encrypted in production
        is_sandbox: isSandbox,
        is_active: true,
        validated_at: validationResult?.isValid ? new Date().toISOString() : null,
        validation_error: validationResult?.error || null,
        last_facilities_sync: facilities ? new Date().toISOString() : null,
        created_by: user.id,
      }, {
        onConflict: 'organization_id,state_code',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error saving credentials:', upsertError)
      return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 })
    }

    // Cache facilities if we got them
    if (facilities && facilities.length > 0) {
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
            address: f.address ? f.address : null,
            is_active: true,
            is_linked: existing?.isLinked || false,
            linked_site_id: existing?.linkedSiteId || null,
            raw_data: f.rawData,
          }
        })

      const { error: facilityError } = await supabase
        .from('metrc_facilities_cache')
        .upsert(facilitiesData, {
          onConflict: 'organization_id,license_number',
        })

      if (facilityError) {
        console.error('Error caching facilities:', facilityError)
        // Don't fail the request, just log
      }
    }

    // Log the sync
    await supabase.from('metrc_sync_log').insert({
      organization_id: membership.organization_id,
      credential_id: credential.id,
      sync_type: 'credentials_validation',
      sync_direction: 'validation',
      status: validationResult?.isValid ? 'success' : 'failed',
      details: {
        facilitiesFound: facilities?.length || 0,
        stateCode,
        isSandbox,
      },
      error_message: validationResult?.error,
      performed_by: user.id,
    })

    return NextResponse.json({
      credential: {
        id: credential.id,
        stateCode: credential.state_code,
        isSandbox: credential.is_sandbox,
        isActive: credential.is_active,
        validatedAt: credential.validated_at,
      },
      facilities: facilities || [],
      message: 'Credentials saved and validated successfully',
    })
  } catch (error) {
    console.error('Credentials POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const stateCode = searchParams.get('stateCode')

    if (!stateCode) {
      return NextResponse.json({ error: 'stateCode is required' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('metrc_org_credentials')
      .delete()
      .eq('organization_id', membership.organization_id)
      .eq('state_code', stateCode.toUpperCase())

    if (deleteError) {
      console.error('Error deleting credentials:', deleteError)
      return NextResponse.json({ error: 'Failed to delete credentials' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Credentials deleted successfully' })
  } catch (error) {
    console.error('Credentials DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
