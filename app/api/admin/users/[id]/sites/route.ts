import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { id: userId } = await context.params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !canPerformAction(userData.role, 'user:update')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    // Fetch user site assignments and default_site_id
    const [{ data: assignments, error: assignmentError }, { data: targetUser, error: userError }] = await Promise.all([
      supabase
        .from('user_site_assignments')
        .select('id, user_id, site_id')
        .eq('user_id', userId)
        .eq('is_active', true),
      supabase
        .from('users')
        .select('default_site_id')
        .eq('id', userId)
        .single()
    ])

    if (assignmentError) {
      console.error('Error fetching user site assignments:', assignmentError)
      return NextResponse.json(
        { error: 'Failed to fetch site assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      assignments: assignments || [],
      default_site_id: targetUser?.default_site_id || null
    })
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]/sites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { id: userId } = await context.params
    const body = await request.json()
    const { add_site_ids = [], remove_site_ids = [], default_site_id } = body

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !canPerformAction(userData.role, 'user:update')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    // Remove site assignments
    if (remove_site_ids.length > 0) {
      const { error: removeError } = await supabase
        .from('user_site_assignments')
        .update({ is_active: false })
        .eq('user_id', userId)
        .in('site_id', remove_site_ids)

      if (removeError) {
        console.error('Error removing site assignments:', removeError)
        return NextResponse.json(
          { error: 'Failed to remove site assignments' },
          { status: 500 }
        )
      }
    }

    // Add new site assignments
    if (add_site_ids.length > 0) {
      const newAssignments = add_site_ids.map((site_id: string) => ({
        user_id: userId,
        site_id,
        assigned_by: user.id,
        is_active: true
      }))

      const { error: addError } = await supabase
        .from('user_site_assignments')
        .upsert(newAssignments, {
          onConflict: 'user_id,site_id',
          ignoreDuplicates: false
        })

      if (addError) {
        console.error('Error adding site assignments:', addError)
        return NextResponse.json(
          { error: 'Failed to add site assignments' },
          { status: 500 }
        )
      }
    }

    // Update default_site_id if provided
    if (default_site_id !== undefined) {
      // Verify the default site is one of the user's assigned sites (or null to clear)
      if (default_site_id !== null) {
        const { data: hasAssignment } = await supabase
          .from('user_site_assignments')
          .select('id')
          .eq('user_id', userId)
          .eq('site_id', default_site_id)
          .eq('is_active', true)
          .single()

        if (!hasAssignment) {
          return NextResponse.json(
            { error: 'Default site must be one of the user\'s assigned sites' },
            { status: 400 }
          )
        }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ default_site_id })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating default site:', updateError)
        return NextResponse.json(
          { error: 'Failed to update default site' },
          { status: 500 }
        )
      }
    }

    // Fetch updated assignments and default site
    const [{ data: assignments, error: fetchError }, { data: updatedUser }] = await Promise.all([
      supabase
        .from('user_site_assignments')
        .select('id, user_id, site_id')
        .eq('user_id', userId)
        .eq('is_active', true),
      supabase
        .from('users')
        .select('default_site_id')
        .eq('id', userId)
        .single()
    ])

    if (fetchError) {
      console.error('Error fetching updated assignments:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch updated assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      assignments: assignments || [],
      default_site_id: updatedUser?.default_site_id || null
    })
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[id]/sites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
