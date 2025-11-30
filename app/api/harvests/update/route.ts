import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateHarvest } from '@/lib/supabase/queries/harvests'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

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

    // Get user's default site
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

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

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

    // Validate harvest belongs to current site context via batch
    if (currentSiteId) {
      const { data: harvest } = await supabase
        .from('harvests')
        .select('batch_id, batches!inner(site_id)')
        .eq('id', harvestId)
        .single()

      if (harvest && (harvest.batches as any)?.site_id !== currentSiteId) {
        return NextResponse.json(
          { error: 'Harvest does not belong to the selected site' },
          { status: 403 }
        )
      }
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
