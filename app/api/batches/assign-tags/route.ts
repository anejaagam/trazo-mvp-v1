import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assignMetrcTagsToBatch } from '@/lib/compliance/metrc/sync/tag-assignment-sync'

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
