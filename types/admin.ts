/**
 * Admin-related TypeScript types for Trazo MVP
 * These types align with the database schema in /lib/supabase/schema.sql
 */

import type { RoleKey } from '@/lib/rbac/types';

// User status types
export type UserStatus = 'invited' | 'active' | 'suspended' | 'deactivated';

// Identity provider types
export type IdpType = 'local' | 'oidc' | 'saml';

// Scope types for role bindings
export type ScopeType = 'org' | 'site' | 'room';

/**
 * User entity from the database
 */
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: RoleKey;
  organization_id: string;
  status: UserStatus;
  idp: IdpType;
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Extended user with organization details
 */
export interface UserWithOrg extends User {
  organization: {
    id: string;
    name: string;
  };
}

/**
 * User invitation payload
 */
export interface UserInvite {
  email: string;
  full_name: string;
  role: RoleKey;
  organization_id: string;
  site_ids?: string[];
}

/**
 * User-to-Site assignment for site-scoped roles
 */
export interface UserSiteAssignment {
  id: string;
  user_id: string;
  site_id: string;
  created_at: string;
}

/**
 * User permission override (for granular control)
 */
export interface UserPermission {
  id: string;
  user_id: string;
  permission_key: string;
  granted: boolean;
  granted_by: string;
  created_at: string;
}

/**
 * Role binding - assigns roles to users at different scopes
 */
export interface RoleBinding {
  id: string;
  user_id: string;
  role_id: string;
  scope_type: ScopeType;
  scope_id: string;
  scope_name?: string;
  created_by: string;
  created_at: string;
  expires_at?: string;
}

/**
 * Extended role binding with user details
 */
export interface RoleBindingWithUser extends RoleBinding {
  user: {
    id: string;
    full_name: string;
    email: string;
  };
}

/**
 * Audit log event
 */
export interface AuditEvent {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

/**
 * Extended audit event with user details
 */
export interface AuditEventWithUser extends AuditEvent {
  user: {
    id: string;
    full_name: string;
    email: string;
  };
}

/**
 * API token for programmatic access
 */
export interface ApiToken {
  id: string;
  name: string;
  token_hash: string;
  scope_type: 'site';
  scope_id: string;
  created_by: string;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
  revoked_at?: string;
}

/**
 * Extended API token with scope details
 */
export interface ApiTokenWithScope extends ApiToken {
  scope: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    full_name: string;
    email: string;
  };
}

/**
 * User update payload
 */
export interface UserUpdate {
  full_name?: string;
  phone?: string;
  role?: RoleKey;
  status?: UserStatus;
}

/**
 * User list filters
 */
export interface UserFilters {
  search?: string;
  status?: UserStatus;
  role?: RoleKey;
  organization_id?: string;
  site_id?: string;
}

/**
 * Audit log filters
 */
export interface AuditFilters {
  user_id?: string;
  entity_type?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  per_page?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
