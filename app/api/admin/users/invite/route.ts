/**
 * API Route: Invite User
 * POST /api/admin/users/invite
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { inviteUser } from '@/lib/supabase/queries/users';
import { isDevModeActive, logDevMode } from '@/lib/dev-mode';
import type { RoleKey } from '@/lib/rbac/types';
import { canAssignRole } from '@/lib/rbac/hierarchy';

export async function POST(request: NextRequest) {
  try {
    // Check dev mode
    if (isDevModeActive()) {
      logDevMode('API: Invite User');
      return NextResponse.json({
        success: true,
        message: 'User invitation simulated in dev mode'
      });
    }

    // Get request body
    const body = await request.json();
    const { email, full_name, role, organization_id, site_ids } = body;

    // Validate inputs
    if (!email || !full_name || !role || !organization_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    if (userData.organization_id !== organization_id) {
      return NextResponse.json(
        { error: 'Cannot invite users to other organizations' },
        { status: 403 }
      );
    }

    const hasPermission = canPerformAction(userData.role, 'user:create');
    if (!hasPermission.allowed) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Enforce role hierarchy: non-admins cannot invite users with equal or higher privileges
    const targetRole = role as RoleKey;
    if (!canAssignRole(userData.role as RoleKey, targetRole)) {
      return NextResponse.json(
        { error: 'You cannot invite a user with equal or higher privileges' },
        { status: 403 }
      );
    }

    // Invite user
    const result = await inviteUser({
      email,
      full_name,
      role: role as RoleKey,
      organization_id,
      site_ids: site_ids || undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to invite user' },
      { status: 500 }
    );
  }
}
