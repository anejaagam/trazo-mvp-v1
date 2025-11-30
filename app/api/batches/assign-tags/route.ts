import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assignMetrcTagsToBatch } from '@/lib/compliance/metrc/sync/tag-assignment-sync'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

/**
 * POST /api/batches/assign-tags
 *
 * Assign Metrc plant tags to a batch
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
    const { batchId, tags } = body

    // Validate required fields
    if (!batchId) {
      return NextResponse.json(
        { success: false, message: 'Batch ID is required' },
        { status: 400 }
      )
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one tag is required' },
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

    // Assign tags
    const result = await assignMetrcTagsToBatch(batchId, tags, user.id)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to assign tags',
          errors: result.errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${result.tagsAssigned} tags assigned successfully`,
      tagsAssigned: result.tagsAssigned,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Error in assign-tags API:', error)
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
