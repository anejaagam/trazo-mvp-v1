/**
 * Supabase query functions for roles and role bindings
 * These functions interact with roles and role assignment tables
 */

import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/rbac/roles';
import type { RoleKey } from '@/lib/rbac/types';
import type {
  RoleBinding,
  RoleBindingWithUser,
  ScopeType,
} from '@/types/admin';

/**
 * Role information combining RBAC definitions with usage data
 */
export interface RoleInfo {
  key: RoleKey;
  name: string;
  description: string;
  permissions: string[];
  user_count: number;
}

/**
 * Get all available roles with user counts
 */
export async function getRoles(): Promise<RoleInfo[]> {
  const supabase = await createClient();

  // Get user counts per role
  const { data: users, error } = await supabase
    .from('users')
    .select('role');

  if (error) {
    throw new Error(`Failed to fetch user role counts: ${error.message}`);
  }

  // Count users per role
  const roleCounts: Record<string, number> = {};
  users?.forEach((user: { role: string }) => {
    roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
  });

  // Combine with RBAC role definitions
  const roles: RoleInfo[] = Object.entries(ROLES).map(([key, role]) => ({
    key: key as RoleKey,
    name: role.name,
    description: role.description,
    permissions: role.permissions,
    user_count: roleCounts[key] || 0,
  }));

  return roles;
}

/**
 * Get a specific role by key
 */
export async function getRoleByKey(roleKey: RoleKey): Promise<RoleInfo | null> {
  const roles = await getRoles();
  return roles.find(r => r.key === roleKey) || null;
}

/**
 * Get role bindings for a specific user
 */
export async function getUserRoleBindings(userId: string): Promise<RoleBinding[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_site_assignments')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch role bindings: ${error.message}`);
  }

  // Transform site assignments into role bindings format
  // Note: In our simplified model, role is on the user record
  // Site assignments are separate from roles
  return (data as RoleBinding[]) || [];
}

/**
 * Get all role bindings with user details
 */
export async function getAllRoleBindings(): Promise<RoleBindingWithUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_site_assignments')
    .select(`
      *,
      user:users(id, full_name, email)
    `);

  if (error) {
    throw new Error(`Failed to fetch role bindings: ${error.message}`);
  }

  return (data as RoleBindingWithUser[]) || [];
}

/**
 * Get role bindings for a specific scope
 */
export async function getRoleBindingsByScope(
  scopeType: ScopeType,
  scopeId: string
): Promise<RoleBindingWithUser[]> {
  const supabase = await createClient();

  // For site scope, get site assignments
  if (scopeType === 'site') {
    const { data, error } = await supabase
      .from('user_site_assignments')
      .select(`
        *,
        user:users(id, full_name, email, role)
      `)
      .eq('site_id', scopeId);

    if (error) {
      throw new Error(`Failed to fetch role bindings by scope: ${error.message}`);
    }

    return (data as RoleBindingWithUser[]) || [];
  }

  // For org scope, get all users in the organization
  if (scopeType === 'org') {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, organization_id')
      .eq('organization_id', scopeId);

    if (error) {
      throw new Error(`Failed to fetch role bindings by scope: ${error.message}`);
    }

    // Transform to role binding format
    return data?.map(user => ({
      id: user.id,
      user_id: user.id,
      role_id: user.role,
      scope_type: 'org' as ScopeType,
      scope_id: scopeId,
      created_by: 'system',
      created_at: new Date().toISOString(),
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
      },
    })) || [];
  }

  return [];
}

/**
 * Create a role binding (assign user to site)
 */
export async function createRoleBinding(
  userId: string,
  siteId: string
): Promise<RoleBinding> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_site_assignments')
    .insert({
      user_id: userId,
      site_id: siteId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('User is already assigned to this site');
    }
    throw new Error(`Failed to create role binding: ${error.message}`);
  }

  return data as RoleBinding;
}

/**
 * Delete a role binding (remove user from site)
 */
export async function deleteRoleBinding(bindingId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('user_site_assignments')
    .delete()
    .eq('id', bindingId);

  if (error) {
    throw new Error(`Failed to delete role binding: ${error.message}`);
  }
}

/**
 * Delete all role bindings for a user
 */
export async function deleteUserRoleBindings(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('user_site_assignments')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete user role bindings: ${error.message}`);
  }
}

/**
 * Get users by role
 */
export async function getUsersByRole(roleKey: RoleKey): Promise<Array<{
  id: string;
  full_name: string;
  email: string;
  status: string;
}>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, status')
    .eq('role', roleKey);

  if (error) {
    throw new Error(`Failed to fetch users by role: ${error.message}`);
  }

  return data || [];
}

/**
 * Get role distribution statistics
 */
export async function getRoleDistribution(): Promise<Array<{
  role: RoleKey;
  role_name: string;
  count: number;
  percentage: number;
}>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('role');

  if (error) {
    throw new Error(`Failed to fetch role distribution: ${error.message}`);
  }

  // Count users per role
  const roleCounts: Record<string, number> = {};
  const total = data?.length || 0;

  data?.forEach((user: { role: string }) => {
    roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
  });

  // Build distribution array
  return Object.entries(roleCounts).map(([roleKey, count]) => {
    const role = ROLES[roleKey as RoleKey];
    return {
      role: roleKey as RoleKey,
      role_name: role?.name || roleKey,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    };
  });
}

/**
 * Check if a user has access to a specific site
 */
export async function hasUserSiteAccess(userId: string, siteId: string): Promise<boolean> {
  const supabase = await createClient();

  // First check if user is org_admin (has access to all sites)
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (user?.role === 'org_admin') {
    return true;
  }

  // Check site assignments
  const { data, error } = await supabase
    .from('user_site_assignments')
    .select('id')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to check site access: ${error.message}`);
  }

  return !!data;
}
