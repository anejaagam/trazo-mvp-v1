import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assignTag } from '@/lib/supabase/queries/harvest-plants'
import { validateTagAssignment } from '@/lib/compliance/metrc/validation/plant-harvest-rules'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
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
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

    const body = await request.json()
    const { tag_id, assigned_to_type, assigned_to_id } = body

    if (!tag_id || !assigned_to_type || !assigned_to_id) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify tag belongs to current site context (if site context is set)
    if (currentSiteId) {
      const { data: tag } = await supabase
        .from('tags')
        .select('site_id')
        .eq('id', tag_id)
        .single()

      if (tag && tag.site_id !== currentSiteId) {
        return NextResponse.json(
          { success: false, message: 'Tag does not belong to the selected site' },
          { status: 403 }
        )
      }
    }

    // Validate assignment
    const validation = validateTagAssignment({
      tag_id,
      assigned_to_type,
      assigned_to_id,
    })

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      )
    }

    const result = await assignTag(
      tag_id,
      assigned_to_type,
      assigned_to_id,
      user.id
    )

    if (result.error) {
      throw result.error
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Tag assignment failed. Tag may not be available.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tag assigned successfully',
    })
  } catch (error) {
    console.error('Error in assign tag API:', error)
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
