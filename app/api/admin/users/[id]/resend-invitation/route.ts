/**
 * API Route: Resend User Invitation
 * POST /api/admin/users/[id]/resend-invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { resendInvitation } from '@/lib/supabase/queries/users';
import { isDevModeActive, logDevMode } from '@/lib/dev-mode';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check dev mode
    if (isDevModeActive()) {
      logDevMode('API: Resend Invitation');
      return NextResponse.json({
        success: true,
        message: 'Invitation resend simulated in dev mode'
      });
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

    const hasPermission = canPerformAction(userData.role, 'user:create');
    if (!hasPermission.allowed) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Resend invitation
    const result = await resendInvitation(id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resend invitation' },
      { status: 500 }
    );
  }
}
