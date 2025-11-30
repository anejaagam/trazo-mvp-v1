import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHarvest } from '@/lib/supabase/queries/harvests'
import {
  authenticateWithSite,
  isAuthError,
  authErrorResponse,
  validateResourceSite,
} from '@/lib/api/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      batchId,
      organizationId: requestOrgId,
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

    // Validate required fields first
    if (!batchId || !wetWeight || !plantCount || !harvestedAt) {
      return NextResponse.json(
        { error: 'Missing required fields: batchId, wetWeight, plantCount, harvestedAt' },
        { status: 400 }
      )
    }

    // Authenticate and validate site access
    const authResult = await authenticateWithSite({
      permission: 'batch:update',
      allowAllSites: false, // Must select specific site for mutations
    })

    if (isAuthError(authResult)) {
      return authErrorResponse(authResult)
    }

    const { user, siteContext } = authResult
    const organizationId = requestOrgId || user.organizationId
    const supabase = await createClient()

    // Verify the batch exists and get its site
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

    // Validate batch belongs to user's current site
    const resourceCheck = validateResourceSite(batch.site_id, siteContext)
    if (!resourceCheck.valid) {
      return NextResponse.json(
        { error: resourceCheck.error },
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
