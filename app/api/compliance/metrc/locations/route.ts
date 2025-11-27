/**
 * API Route: Get Metrc Locations for Site
 *
 * Returns available Metrc locations for a site's facility
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createMetrcClientForSite } from '@/lib/compliance/metrc/services'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get siteId from query params
    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('siteId')

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
    }

    // Verify user has access to this site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, organization_id, name, default_metrc_location')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Verify user belongs to the same organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userData?.organization_id !== site.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get Metrc client for the site
    const { client: metrcClient, error: credError } = await createMetrcClientForSite(siteId, supabase)

    if (credError || !metrcClient) {
      // Return empty locations if no Metrc credentials configured
      return NextResponse.json({
        locations: [],
        defaultLocation: site.default_metrc_location || null,
        error: credError || 'Metrc not configured for this site',
      })
    }

    // Fetch active locations and location types from Metrc
    const [locationsResult, typesResult] = await Promise.all([
      metrcClient.locations.listActive(),
      metrcClient.locations.listTypes(),
    ])

    // Build a map of location type capabilities
    const typeCapabilities = new Map<string, {
      forPlantBatches: boolean
      forPlants: boolean
      forHarvests: boolean
      forPackages: boolean
    }>()

    typesResult.data.forEach((type) => {
      typeCapabilities.set(type.Name, {
        forPlantBatches: type.ForPlantBatches,
        forPlants: type.ForPlants,
        forHarvests: type.ForHarvests,
        forPackages: type.ForPackages,
      })
    })

    // Map locations with type capabilities
    const locations = locationsResult.data.map((loc) => {
      const capabilities = typeCapabilities.get(loc.LocationTypeName) || {
        forPlantBatches: false,
        forPlants: false,
        forHarvests: false,
        forPackages: false,
      }
      return {
        id: loc.Id,
        name: loc.Name,
        locationTypeName: loc.LocationTypeName,
        ...capabilities,
      }
    })

    // Filter to locations that support plant batches (for batch push)
    const plantBatchLocations = locations.filter((loc) => loc.forPlantBatches)

    return NextResponse.json({
      locations: plantBatchLocations.length > 0 ? plantBatchLocations : locations,
      allLocations: locations,
      defaultLocation: site.default_metrc_location || null,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Metrc locations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
