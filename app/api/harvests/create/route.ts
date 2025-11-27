import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHarvest } from '@/lib/supabase/queries/harvests'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization and default site
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, default_site_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    let {
      batchId,
      organizationId,
      wetWeight,
      dryWeight,
      wasteWeight,
      plantCount,
      harvestType,
      harvestedAt,
      location,
      dryingLocation,
      notes,
    } = body

    // Use user's organization if not provided
    if (!organizationId) {
      organizationId = userData.organization_id
    }

    // Validate required fields
    if (!batchId || !organizationId || !wetWeight || !plantCount || !harvestedAt) {
      return NextResponse.json(
        { error: 'Missing required fields: batchId, wetWeight, plantCount, harvestedAt' },
        { status: 400 }
      )
    }

    // Get site context and verify batch belongs to current site
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

    // Verify the batch belongs to the current site context
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('site_id')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    // Ensure batch belongs to current site (unless org_admin in "all sites" mode)
    if (currentSiteId && batch.site_id !== currentSiteId) {
      return NextResponse.json(
        { error: 'Batch does not belong to the selected site' },
        { status: 403 }
      )
    }

    // Create harvest
    const { data, error } = await createHarvest(
      {
        batch_id: batchId,
        organization_id: organizationId,
        wet_weight_g: wetWeight,
        dry_weight_g: dryWeight,
        waste_weight_g: wasteWeight,
        plant_count: plantCount,
        harvest_type: harvestType,
        harvested_at: harvestedAt,
        location,
        drying_location: dryingLocation,
        notes,
      },
      user.id
    )

    if (error) {
      console.error('Harvest creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create harvest' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      harvest: data,
      message: 'Harvest created successfully',
    })
  } catch (error) {
    console.error('Harvest creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
