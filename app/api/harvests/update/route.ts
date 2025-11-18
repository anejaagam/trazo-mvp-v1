import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateHarvest } from '@/lib/supabase/queries/harvests'

export async function PUT(request: Request) {
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
      harvestId,
      dryWeight,
      wasteWeight,
      dryingLocation,
      status,
      finishedAt,
      notes,
    } = body

    // Validate required fields
    if (!harvestId) {
      return NextResponse.json(
        { error: 'Missing required field: harvestId' },
        { status: 400 }
      )
    }

    // Update harvest
    const { data, error } = await updateHarvest(
      harvestId,
      {
        dry_weight_g: dryWeight,
        waste_weight_g: wasteWeight,
        drying_location: dryingLocation,
        status,
        finished_at: finishedAt,
        notes,
      },
      user.id
    )

    if (error) {
      console.error('Harvest update error:', error)
      return NextResponse.json(
        { error: 'Failed to update harvest' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      harvest: data,
      message: 'Harvest updated successfully',
    })
  } catch (error) {
    console.error('Harvest update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
