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

    // Fetch user site assignments
    const { data: assignments, error } = await supabase
      .from('user_site_assignments')
      .select('id, user_id, site_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user site assignments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch site assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assignments: assignments || [] })
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
    const { add_site_ids = [], remove_site_ids = [] } = body

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
        .delete()
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
        assigned_at: new Date().toISOString()
      }))

      const { error: addError } = await supabase
        .from('user_site_assignments')
        .insert(newAssignments)

      if (addError) {
        console.error('Error adding site assignments:', addError)
        return NextResponse.json(
          { error: 'Failed to add site assignments' },
          { status: 500 }
        )
      }
    }

    // Fetch updated assignments
    const { data: assignments, error: fetchError } = await supabase
      .from('user_site_assignments')
      .select('id, user_id, site_id')
      .eq('user_id', userId)

    if (fetchError) {
      console.error('Error fetching updated assignments:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch updated assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      assignments: assignments || []
    })
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[id]/sites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
