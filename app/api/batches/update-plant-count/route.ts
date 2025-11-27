import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updatePlantCount } from '@/lib/supabase/queries/batches'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

/**
 * POST /api/batches/update-plant-count
 *
 * Updates plant count for a batch with optional reason and note
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Get user's default site
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, default_site_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

    // Parse request body
    const body = await request.json()
    const { batchId, newCount, reason, reasonNote } = body

    // Validate required fields
    if (!batchId) {
      return NextResponse.json(
        { success: false, message: 'Batch ID is required' },
        { status: 400 }
      )
    }

    if (newCount === undefined || newCount === null) {
      return NextResponse.json(
        { success: false, message: 'New count is required' },
        { status: 400 }
      )
    }

    if (newCount < 0) {
      return NextResponse.json(
        { success: false, message: 'Plant count cannot be negative' },
        { status: 400 }
      )
    }

    // Validate batch belongs to current site context
    if (currentSiteId) {
      const { data: batch } = await supabase
        .from('batches')
        .select('site_id')
        .eq('id', batchId)
        .single()

      if (batch && batch.site_id !== currentSiteId) {
        return NextResponse.json(
          { success: false, message: 'Batch does not belong to the selected site' },
          { status: 403 }
        )
      }
    }

    // Update plant count
    const { data, error } = await updatePlantCount(
      batchId,
      newCount,
      user.id,
      reason,
      reasonNote
    )

    if (error) {
      console.error('Error updating plant count:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to update plant count', error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Plant count updated successfully',
      data,
    })
  } catch (error) {
    console.error('Error in update-plant-count API:', error)
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
