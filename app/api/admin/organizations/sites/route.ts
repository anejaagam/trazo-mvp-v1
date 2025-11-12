import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'

// GET /api/admin/organizations/sites - List all sites for the organization with pod counts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data with organization
    const { data: userData } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permission
    if (!canPerformAction(userData.role, 'org:settings')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    // Get organization_id from query params or use user's organization
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organization_id') || userData.organization_id

    // Fetch sites with pod counts
    const { data: sites, error } = await supabase
      .from('sites')
      .select(`
        id,
        name,
        address,
        city,
        state_province,
        postal_code,
        country,
        timezone,
        max_pods,
        site_license_number,
        is_active,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching sites:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sites' },
        { status: 500 }
      )
    }

    // For each site, count rooms and pods
    const sitesWithCounts = await Promise.all(
      (sites || []).map(async (site) => {
        // Count rooms
        const { count: roomCount } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', site.id)

        // Count pods by joining through rooms
        const { data: rooms } = await supabase
          .from('rooms')
          .select('id')
          .eq('site_id', site.id)
        
        const roomIds = rooms?.map(r => r.id) || []
        
        let podCount = 0
        if (roomIds.length > 0) {
          const { count } = await supabase
            .from('pods')
            .select('*', { count: 'exact', head: true })
            .in('room_id', roomIds)
          
          podCount = count || 0
        }

        // Count users assigned to this site
        const { count: userCount } = await supabase
          .from('user_site_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', site.id)
          .eq('is_active', true)

        return {
          ...site,
          room_count: roomCount || 0,
          pod_count: podCount,
          user_count: userCount || 0
        }
      })
    )

    return NextResponse.json({ sites: sitesWithCounts })
  } catch (error) {
    console.error('Error in GET /api/admin/organizations/sites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/organizations/sites - Create a new site
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permission
    if (!canPerformAction(userData.role, 'org:settings')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    const {
      name,
      address,
      city,
      state_province,
      postal_code,
      country,
      timezone,
      max_pods,
      site_license_number
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Site name is required' },
        { status: 400 }
      )
    }

    // Create site
    const { data: site, error } = await supabase
      .from('sites')
      .insert({
        organization_id: userData.organization_id,
        name,
        address,
        city,
        state_province,
        postal_code,
        country,
        timezone: timezone || 'America/Los_Angeles',
        max_pods: max_pods || 48,
        site_license_number,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating site:', error)
      return NextResponse.json(
        { error: 'Failed to create site' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      site: {
        ...site,
        room_count: 0,
        pod_count: 0
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/organizations/sites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/organizations/sites - Update a site
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { site_id, ...updates } = body
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permission
    if (!canPerformAction(userData.role, 'org:settings')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    if (!site_id) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      )
    }

    // Verify site belongs to user's organization
    const { data: existingSite } = await supabase
      .from('sites')
      .select('id')
      .eq('id', site_id)
      .eq('organization_id', userData.organization_id)
      .single()

    if (!existingSite) {
      return NextResponse.json(
        { error: 'Site not found or access denied' },
        { status: 404 }
      )
    }

    // Update site
    const { data: site, error } = await supabase
      .from('sites')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', site_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating site:', error)
      return NextResponse.json(
        { error: 'Failed to update site' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      site
    })
  } catch (error) {
    console.error('Error in PATCH /api/admin/organizations/sites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/organizations/sites - Soft delete a site
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('site_id')
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permission
    if (!canPerformAction(userData.role, 'org:settings')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      )
    }

    // Verify site belongs to user's organization
    const { data: existingSite } = await supabase
      .from('sites')
      .select('id')
      .eq('id', siteId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (!existingSite) {
      return NextResponse.json(
        { error: 'Site not found or access denied' },
        { status: 404 }
      )
    }

    // Check for assigned users via user_site_assignments
    const { count: userCount, error: usersError } = await supabase
      .from('user_site_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_active', true)

    if (usersError) {
      console.error('Error checking users:', usersError)
      return NextResponse.json(
        { error: 'Failed to check site dependencies', details: usersError.message },
        { status: 500 }
      )
    }

    if (userCount && userCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete site with assigned users',
          details: `This site has ${userCount} assigned user(s). Please reassign all users before deleting the site.`
        },
        { status: 400 }
      )
    }

    // Check for ANY rooms (active or inactive)
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .eq('site_id', siteId)

    if (roomsError) {
      console.error('Error checking rooms:', roomsError)
      return NextResponse.json(
        { error: 'Failed to check site dependencies', details: roomsError.message },
        { status: 500 }
      )
    }
    
    if (rooms && rooms.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete site with existing rooms',
          details: `This site has ${rooms.length} room(s). Please delete all rooms before deleting the site.`
        },
        { status: 400 }
      )
    }

    // All checks passed, proceed with actual deletion
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', siteId)

    if (error) {
      console.error('Error deleting site:', error)
      return NextResponse.json(
        { error: 'Failed to delete site' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/organizations/sites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
