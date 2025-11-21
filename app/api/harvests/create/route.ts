import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHarvest } from '@/lib/supabase/queries/harvests'

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

    const body = await request.json()
    const {
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

    // Validate required fields
    if (!batchId || !organizationId || !wetWeight || !plantCount || !harvestedAt) {
      return NextResponse.json(
        { error: 'Missing required fields: batchId, organizationId, wetWeight, plantCount, harvestedAt' },
        { status: 400 }
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
