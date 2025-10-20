/**
 * API Route: Update User Status
 * PATCH /api/admin/users/[id]/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { updateUserStatus } from '@/lib/supabase/queries/users';
import { isDevModeActive, logDevMode } from '@/lib/dev-mode';
import type { UserStatus } from '@/types/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check dev mode
    if (isDevModeActive()) {
      logDevMode('API: Update User Status');
      return NextResponse.json({
        success: true,
        message: 'User status update simulated in dev mode'
      });
    }

    // Get request body
    const body = await request.json();
    const { status } = body;

    // Validate inputs
    if (!status || !['invited', 'active', 'suspended', 'deactivated'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
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

    const hasPermission = canPerformAction(userData.role, 'user:update');
    if (!hasPermission.allowed) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update user status
    const result = await updateUserStatus(id, status as UserStatus);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user status' },
      { status: 500 }
    );
  }
}
