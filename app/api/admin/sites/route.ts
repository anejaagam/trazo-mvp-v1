/**
 * API Route: Get Sites
 * GET /api/admin/sites?organization_id=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { isDevModeActive, logDevMode } from '@/lib/dev-mode';

export async function GET(request: NextRequest) {
  try {
    // Check dev mode
    if (isDevModeActive()) {
      logDevMode('API: Get Sites');
      return NextResponse.json({
        sites: [
          { id: '1', name: 'Main Site' },
          { id: '2', name: 'Secondary Site' },
        ]
      });
    }

    // Get organization_id from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organization_id parameter' },
        { status: 400 }
      );
    }

    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify user is in same organization
    if (userData.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Cannot access sites from other organizations' },
        { status: 403 }
      );
    }

    const hasPermission = canPerformAction(userData.role, 'monitoring:view');
    if (!hasPermission.allowed) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch sites for the organization
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name');

    if (sitesError) {
      throw sitesError;
    }

    return NextResponse.json({ sites: sites || [] });
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}
