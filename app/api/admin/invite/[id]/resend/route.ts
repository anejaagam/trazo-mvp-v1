/**
 * API Route for resending a pending invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import type { Region } from '@/lib/supabase/region';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invitationId } = await params;
    const supabase = await createClient();
    
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role and organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permission
    const canInvite = ['org_admin', 'site_manager'].includes(userData.role);
    if (!canInvite) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get the pending invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('pending_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Ensure it's from the same organization
    if (invitation.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Determine organization's region
    let orgRegion: Region = 'US';
    const { data: org } = await supabase
      .from('organizations')
      .select('data_region')
      .eq('id', invitation.organization_id)
      .single();
    
    if (org?.data_region && typeof org.data_region === 'string') {
      const dr = org.data_region.toLowerCase();
      orgRegion = dr.startsWith('ca') ? 'CA' : 'US';
    }

    // Use service role client for Admin API
    const service = await createServiceClient(orgRegion);

    // Send invitation via Supabase Auth
    const { data: authData, error: resendError } = await service.auth.admin.inviteUserByEmail(
      invitation.email,
      {
        data: {
          full_name: invitation.email.split('@')[0],
          role: invitation.role,
          organization_id: invitation.organization_id,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm/invite?region=${orgRegion}`,
      }
    );

    if (resendError) {
      console.error('Supabase resend error:', resendError);
      return NextResponse.json({ error: resendError.message }, { status: 500 });
    }

    // Update expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase
      .from('pending_invitations')
      .update({
        expires_at: expiresAt.toISOString(),
        invitation_token: authData.user?.id || invitation.invitation_token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    return NextResponse.json({ 
      success: true, 
      message: `Invitation resent to ${invitation.email}` 
    });

  } catch (error) {
    console.error('Resend invite API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
