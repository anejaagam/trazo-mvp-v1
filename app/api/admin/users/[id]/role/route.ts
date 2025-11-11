/**
 * API Route: Update User Role
 * PATCH /api/admin/users/[id]/role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { updateUserRole } from '@/lib/supabase/queries/users';
import { isDevModeActive, logDevMode } from '@/lib/dev-mode';
import { isValidRole } from '@/lib/rbac/roles';
import type { RoleKey } from '@/lib/rbac/types';
import { canAssignRole } from '@/lib/rbac/hierarchy';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }

    // Dev mode short-circuit
    if (isDevModeActive()) {
      logDevMode('API: Update User Role');
      return NextResponse.json({ success: true, message: 'Role update simulated in dev mode' });
    }

    const body = await request.json();
    const role = body?.role as string;

    if (!role || !isValidRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Permission check
    const { data: userData } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasPermission = canPerformAction(userData.role, 'role:assign');
    if (!hasPermission.allowed) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Ensure inviter and target user belong to same organization
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('id', id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (targetUser.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: 'Cannot modify users in other organizations' }, { status: 403 });
    }

    // Enforce role hierarchy: non-admins cannot assign equal or higher roles
    if (!canAssignRole(userData.role as RoleKey, role as RoleKey)) {
      return NextResponse.json(
        { error: 'You cannot assign equal or higher privileges than your own' },
        { status: 403 }
      );
    }

    // Update role
  const updated = await updateUserRole(id, role as RoleKey);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user role' },
      { status: 500 }
    );
  }
}
