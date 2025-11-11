/**
 * Admin Page Helpers
 * Reusable utilities for admin pages with dev mode support
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode';
import type { RoleKey, PermissionKey } from '@/lib/rbac/types';

interface AuthCheckResult {
  isDevMode: boolean;
  user: {
    id: string;
    email?: string;
  };
  userData: {
    role: RoleKey;
    organization_id: string;
  };
}

/**
 * Check authentication and permissions for admin pages
 * Respects dev mode - returns mock data if dev mode is active
 * Otherwise performs full auth check and redirects if needed
 */
export async function checkAdminAuth(
  requiredPermission: PermissionKey,
  pageName: string
): Promise<AuthCheckResult> {
  // Check for dev mode first
  if (isDevModeActive()) {
    logDevMode(`Admin ${pageName} Page`);
    
    return {
      isDevMode: true,
      user: {
        id: DEV_MOCK_USER.id,
        email: DEV_MOCK_USER.email,
      },
      userData: {
        role: DEV_MOCK_USER.role as RoleKey,
        organization_id: DEV_MOCK_USER.organization_id,
      },
    };
  }

  // Production auth check
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Check permissions
  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!userData) {
    redirect('/dashboard');
  }

  const hasPermission = canPerformAction(userData.role, requiredPermission);
  
  if (!hasPermission.allowed) {
    redirect('/dashboard');
  }

  return {
    isDevMode: false,
    user,
    userData: {
      role: userData.role as RoleKey,
      organization_id: userData.organization_id,
    },
  };
}
