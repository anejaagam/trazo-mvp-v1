/**
 * API Route for sending user invitations
 * Used by onboarding and admin user management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import type { Region } from '@/lib/supabase/region';

interface InviteRequest {
  email: string;
  role: string;
  organizationId: string;
  fullName?: string;
}

export async function POST(request: NextRequest) {
  try {
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

    // Check permission to invite users (org_admin, site_manager can invite)
    const canInvite = ['org_admin', 'site_manager'].includes(userData.role);
    if (!canInvite) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body: InviteRequest = await request.json();
    const { email, role, organizationId, fullName } = body;

    // Validate required fields
    if (!email || !role || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure user can only invite to their own organization
    if (organizationId !== userData.organization_id) {
      return NextResponse.json({ error: 'Cannot invite to different organization' }, { status: 403 });
    }

    // Determine organization's region
    let orgRegion: Region = 'US';
    const { data: org } = await supabase
      .from('organizations')
      .select('data_region')
      .eq('id', organizationId)
      .single();
    
    if (org?.data_region && typeof org.data_region === 'string') {
      const dr = org.data_region.toLowerCase();
      orgRegion = dr.startsWith('ca') ? 'CA' : 'US';
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    // Check if already invited (pending invitation exists)
    const { data: existingInvite } = await supabase
      .from('pending_invitations')
      .select('id')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: 'An invitation is already pending for this email' }, { status: 409 });
    }

    // Use service role client for Admin API
    const service = await createServiceClient(orgRegion);

    // Send invitation via Supabase Auth
    const { data: authData, error: inviteError } = await service.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: fullName || email.split('@')[0],
          role: role,
          organization_id: organizationId,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm/invite?region=${orgRegion}`,
      }
    );

    if (inviteError) {
      console.error('Supabase invite error:', inviteError);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    // Store in pending_invitations for tracking
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    await supabase
      .from('pending_invitations')
      .insert({
        email,
        role,
        organization_id: organizationId,
        invited_by: user.id,
        status: 'pending',
        invitation_token: authData.user?.id || null,
        expires_at: expiresAt.toISOString(),
      });

    return NextResponse.json({ 
      success: true, 
      message: `Invitation sent to ${email}`,
      userId: authData.user?.id 
    });

  } catch (error) {
    console.error('Invite API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
