import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getUserAccessibleSites, validateSiteAccess, getUserDefaultSite } from '@/lib/site/access';
import { SITE_COOKIE_NAME, ALL_SITES_ID } from '@/lib/site/types';

/**
 * GET /api/user/sites
 * Get all sites the current user has access to
 *
 * For org_admin: Returns all sites in the organization
 * For other roles: Returns only assigned sites
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id, default_site_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get accessible sites based on role
    const sites = await getUserAccessibleSites(
      supabase,
      user.id,
      userData.role,
      userData.organization_id
    );

    // Get default site
    const defaultSite = await getUserDefaultSite(
      supabase,
      user.id,
      userData.role,
      userData.organization_id
    );

    return NextResponse.json({
      sites,
      defaultSiteId: userData.default_site_id || defaultSite?.id || null,
      canViewAllSites: userData.role === 'org_admin',
    });
  } catch (error) {
    console.error('Error in GET /api/user/sites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/sites
 * Set the user's current working site
 *
 * Body: { siteId: string }
 *
 * Validates:
 * - User has access to the site (via assignment or org_admin role)
 * - Site belongs to user's organization
 * - Site is active
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { siteId } = body;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle "All Sites" mode
    if (siteId === ALL_SITES_ID) {
      if (userData.role !== 'org_admin') {
        return NextResponse.json(
          { error: 'Only organization administrators can view all sites' },
          { status: 403 }
        );
      }

      // Set cookie for "all" mode
      const cookieStore = await cookies();
      cookieStore.set(SITE_COOKIE_NAME, ALL_SITES_ID, {
        path: '/',
        maxAge: 31536000, // 1 year
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      return NextResponse.json({
        success: true,
        siteId: ALL_SITES_ID,
        message: 'Switched to All Sites view',
      });
    }

    // Validate site access
    const accessResult = await validateSiteAccess(
      supabase,
      user.id,
      siteId,
      userData.role,
      userData.organization_id
    );

    if (!accessResult.allowed) {
      return NextResponse.json(
        { error: accessResult.reason || 'Access denied to this site' },
        { status: 403 }
      );
    }

    // Set the site cookie
    const cookieStore = await cookies();
    cookieStore.set(SITE_COOKIE_NAME, siteId, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json({
      success: true,
      siteId,
      site: accessResult.site,
      message: `Switched to ${accessResult.site?.name || 'selected site'}`,
    });
  } catch (error) {
    console.error('Error in POST /api/user/sites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
