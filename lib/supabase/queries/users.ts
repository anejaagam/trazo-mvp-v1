/**
 * Supabase query functions for user management
 * These functions interact with the users table and related entities
 */

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import type { Region } from '@/lib/supabase/region';
import type {
  User,
  UserWithOrg,
  UserInvite,
  UserUpdate,
  UserFilters,
  UserStatus,
  PaginationParams,
  PaginatedResponse,
  UserSiteAssignment,
} from '@/types/admin';
import type { RoleKey } from '@/lib/rbac/types';

/**
 * Get all users with optional filtering and pagination
 */
export async function getUsers(
  filters: UserFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResponse<UserWithOrg>> {
  const supabase = await createClient();
  
  const page = pagination.page || 1;
  const per_page = pagination.per_page || 20;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = supabase
    .from('users')
    .select(`
      *,
      organization:organizations(id, name)
    `, { count: 'exact' });

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.role) {
    query = query.eq('role', filters.role);
  }
  if (filters.organization_id) {
    query = query.eq('organization_id', filters.organization_id);
  }
  if (filters.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  // Apply pagination
  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return {
    data: (data as UserWithOrg[]) || [],
    total: count || 0,
    page,
    per_page,
    total_pages: Math.ceil((count || 0) / per_page),
  };
}

/**
 * Get a single user by ID with organization details
 */
export async function getUserById(userId: string): Promise<UserWithOrg | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      organization:organizations(id, name)
    `)
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // User not found
    }
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return data as UserWithOrg;
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch user by email: ${error.message}`);
  }

  return data as User;
}

/**
 * Invite a new user to the organization
 * This creates an auth user and sends an invitation email via Supabase Auth
 * The user profile will be automatically created by the database trigger
 */
export async function inviteUser(invite: UserInvite): Promise<User> {
  // Determine org region using service client (bypass RLS)
  let orgRegion: Region = 'US'
  const serviceForLookup = await createServiceClient('US')
  {
    const { data: org } = await serviceForLookup
      .from('organizations')
      .select('id, data_region')
      .eq('id', invite.organization_id)
      .single()
    if (org?.data_region && typeof org.data_region === 'string') {
      const dr = org.data_region.toLowerCase()
      orgRegion = dr.startsWith('ca') ? 'CA' : 'US'
    }
  }
  // Use service role client for Admin API in the target region
  const service = await createServiceClient(orgRegion)
  // Regular client (session-bound) not needed here

  // First, check if user already exists in auth.users
  // Note: Supabase doesn't have a direct getUserByEmail admin method
  // We'll check the profile table first, then let inviteUserByEmail handle duplicates
  const existingProfile = await getUserByEmail(invite.email);
  if (existingProfile) {
    throw new Error('A user with this email already exists');
  }

  // Invite user via Supabase Auth - this will send an email invitation
  const { data: authData, error: inviteError } = await service.auth.admin.inviteUserByEmail(
    invite.email,
    {
      data: {
        full_name: invite.full_name,
        role: invite.role,
        organization_id: invite.organization_id,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm/invite?region=${orgRegion}`,
    }
  );

  if (inviteError) {
    throw new Error(`Failed to invite user: ${inviteError.message}`);
  }

  if (!authData.user) {
    throw new Error('Failed to create auth user');
  }

  // Update the auto-created user profile with invited status
  // Try to update profile using service client (avoid RLS + trigger timing race)
  let user: User | null = null
  let updateError: unknown = null
  for (let attempt = 0; attempt < 3; attempt++) {
    // Small delay to allow trigger to create profile
    if (attempt > 0) await new Promise(r => setTimeout(r, 150 * attempt))
    const { data, error } = await service
      .from('users')
      .update({
        status: 'invited',
        role: invite.role,
        organization_id: invite.organization_id,
      })
      .eq('id', authData.user.id)
      .select()
      .single()
    if (!error && data) { user = data as unknown as User; break }
    updateError = error
  // If not found, retry; otherwise break
  // Narrow error type for code check without using 'any'
  if (error && typeof (error as { code?: string }).code !== 'undefined' && (error as { code?: string }).code !== 'PGRST116') break
  }

  if (updateError || !user) {
    // Log error but don't fail - the user was invited successfully
    console.error('Failed to update user profile after invite:', updateError);
    // Return a partial user object
    return {
      id: authData.user.id,
      email: invite.email,
      full_name: invite.full_name,
      role: invite.role,
      organization_id: invite.organization_id,
      status: 'invited',
    } as User;
  }

  // If site assignments are provided, create them (service client to avoid RLS headaches)
  if (invite.site_ids && invite.site_ids.length > 0) {
    const siteAssignments = invite.site_ids.map(siteId => ({
      user_id: authData.user.id,
      site_id: siteId,
      is_active: true,
    }));

    const { error: assignmentError } = await service
      .from('user_site_assignments')
      .insert(siteAssignments);

    if (assignmentError) {
      // Log error but don't fail the invitation
      console.error('Failed to create site assignments:', assignmentError);
    }

    // Set default_site_id: use provided default or first site
    const defaultSite = invite.default_site_id || invite.site_ids[0];
    if (defaultSite) {
      const { error: defaultSiteError } = await service
        .from('users')
        .update({ default_site_id: defaultSite })
        .eq('id', authData.user.id);

      if (defaultSiteError) {
        console.error('Failed to set default site:', defaultSiteError);
      }
    }
  }

  return user as User;
}

/**
 * Update user status (invited, activate, suspend, deactivate)
 */
export async function updateUserStatus(
  userId: string,
  status: UserStatus
): Promise<User> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user status: ${error.message}`);
  }

  // If suspending, revoke all active sessions
  if (status === 'suspended') {
    // TODO: Implement session revocation
    // This would require additional logic to invalidate JWT tokens
  }

  return data as User;
}

/**
 * Update user details
 */
export async function updateUser(userId: string, updates: UserUpdate): Promise<User> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return data as User;
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: RoleKey): Promise<User> {
  return updateUser(userId, { role });
}

/**
 * Get user's site assignments
 */
export async function getUserSiteAssignments(userId: string): Promise<UserSiteAssignment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_site_assignments')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch user site assignments: ${error.message}`);
  }

  return (data as UserSiteAssignment[]) || [];
}

/**
 * Add site assignment to a user
 */
export async function addUserSiteAssignment(
  userId: string,
  siteId: string
): Promise<UserSiteAssignment> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_site_assignments')
    .insert({ user_id: userId, site_id: siteId })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add site assignment: ${error.message}`);
  }

  return data as UserSiteAssignment;
}

/**
 * Remove site assignment from a user
 */
export async function removeUserSiteAssignment(
  userId: string,
  siteId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('user_site_assignments')
    .delete()
    .eq('user_id', userId)
    .eq('site_id', siteId);

  if (error) {
    throw new Error(`Failed to remove site assignment: ${error.message}`);
  }
}

/**
 * Delete a user (soft delete by setting status to deactivated)
 */
export async function deleteUser(userId: string): Promise<void> {
  await updateUserStatus(userId, 'deactivated');
}

/**
 * Resend invitation to a user
 */
export async function resendInvitation(userId: string): Promise<void> {
  const supabase = await createClient();
  const user = await getUserById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  if (user.status !== 'invited') {
    throw new Error('Can only resend invitations to users with invited status');
  }

  // Resend invitation email via Supabase Auth
  // Determine region from user's organization
  let orgRegion: Region = 'US'
  if (user.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('data_region')
      .eq('id', user.organization_id)
      .single()
    if (org?.data_region && typeof org.data_region === 'string') {
      const dr = org.data_region.toLowerCase()
      orgRegion = dr.startsWith('ca') ? 'CA' : 'US'
    }
  }
  // Use service role client for Admin API
  const service = await createServiceClient(orgRegion)
  const { error } = await service.auth.admin.inviteUserByEmail(
    user.email,
    {
      data: {
        full_name: user.full_name,
        role: user.role,
        organization_id: user.organization_id,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm/invite?region=${orgRegion}`,
    }
  );

  if (error) {
    throw new Error(`Failed to resend invitation: ${error.message}`);
  }
}

/**
 * Get users count by status
 */
export async function getUserCountsByStatus(): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('status');

  if (error) {
    throw new Error(`Failed to fetch user counts: ${error.message}`);
  }

  const counts: Record<string, number> = {
    invited: 0,
    active: 0,
    suspended: 0,
    deactivated: 0,
  };

  data?.forEach((user: { status: string }) => {
    counts[user.status] = (counts[user.status] || 0) + 1;
  });

  return counts;
}
