/**
 * API Authentication & Site Enforcement Utilities
 *
 * Provides standardized authentication and site validation for API routes.
 * Ensures users can only access data from sites they're assigned to.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSiteAccess } from '@/lib/site/access'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID, isAllSitesMode } from '@/lib/site/types'
import { canPerformAction } from '@/lib/rbac/guards'
import type { PermissionKey } from '@/lib/rbac/types'

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  organizationId: string
  defaultSiteId: string | null
}

export interface SiteContext {
  siteId: string
  isAllSites: boolean
}

export interface AuthResult {
  user: AuthenticatedUser
  siteContext: SiteContext
}

export interface AuthError {
  error: string
  status: number
}

/**
 * Authenticate user and validate site access for API routes
 *
 * This is the main function for API route authentication. It:
 * 1. Authenticates the user via Supabase
 * 2. Gets user role and organization
 * 3. Resolves site context from body/query/cookie
 * 4. Validates user has access to the site
 *
 * @param options - Configuration options
 * @returns AuthResult on success, or AuthError on failure
 */
export async function authenticateWithSite(options: {
  /** Site ID from request body or query params (optional) */
  requestSiteId?: string | null
  /** Permission required (optional) */
  permission?: PermissionKey
  /** Whether to allow "all sites" mode (default: false for mutations) */
  allowAllSites?: boolean
}): Promise<AuthResult | AuthError> {
  const { requestSiteId, permission, allowAllSites = false } = options

  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 }
  }

  // 2. Get user data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, organization_id, default_site_id')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return { error: 'User not found', status: 404 }
  }

  // 3. Check permission if specified
  if (permission && !canPerformAction(userData.role, permission)) {
    return { error: 'Insufficient permissions', status: 403 }
  }

  // 4. Resolve site context
  let siteId = requestSiteId

  // If no site in request, try cookie context
  if (!siteId) {
    const contextSiteId = await getServerSiteId()
    siteId = contextSiteId
  }

  // Handle "all sites" mode
  const allSitesMode = isAllSitesMode(siteId || '')

  if (allSitesMode) {
    if (!allowAllSites) {
      return {
        error: 'Please select a specific site to perform this action',
        status: 400
      }
    }

    // Only org_admin can use all sites mode
    if (userData.role !== 'org_admin') {
      return {
        error: 'Only organization admins can view all sites',
        status: 403
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
        role: userData.role,
        organizationId: userData.organization_id,
        defaultSiteId: userData.default_site_id,
      },
      siteContext: {
        siteId: ALL_SITES_ID,
        isAllSites: true,
      },
    }
  }

  // Fall back to default site if still no context
  if (!siteId) {
    siteId = userData.default_site_id
  }

  if (!siteId) {
    return {
      error: 'No site context available. Please select a site.',
      status: 400
    }
  }

  // 5. Validate site access
  const accessResult = await validateSiteAccess(
    supabase,
    user.id,
    siteId,
    userData.role,
    userData.organization_id
  )

  if (!accessResult.allowed) {
    return {
      error: accessResult.reason || 'Access denied to this site',
      status: 403
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email || '',
      role: userData.role,
      organizationId: userData.organization_id,
      defaultSiteId: userData.default_site_id,
    },
    siteContext: {
      siteId,
      isAllSites: false,
    },
  }
}

/**
 * Type guard to check if result is an error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'error' in result
}

/**
 * Convert auth error to NextResponse
 */
export function authErrorResponse(error: AuthError): NextResponse {
  return NextResponse.json({ error: error.error }, { status: error.status })
}

/**
 * Simple authentication without site validation
 * Use this for routes that don't need site context (e.g., user profile)
 */
export async function authenticateUser(permission?: PermissionKey): Promise<
  { user: AuthenticatedUser } | AuthError
> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, organization_id, default_site_id')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return { error: 'User not found', status: 404 }
  }

  if (permission && !canPerformAction(userData.role, permission)) {
    return { error: 'Insufficient permissions', status: 403 }
  }

  return {
    user: {
      id: user.id,
      email: user.email || '',
      role: userData.role,
      organizationId: userData.organization_id,
      defaultSiteId: userData.default_site_id,
    },
  }
}

/**
 * Validate that a resource belongs to the user's current site
 * Use this after authenticateWithSite to verify specific resource access
 */
export function validateResourceSite(
  resourceSiteId: string,
  siteContext: SiteContext
): { valid: true } | { valid: false; error: string } {
  // In "all sites" mode, allow any resource from the org
  if (siteContext.isAllSites) {
    return { valid: true }
  }

  // Otherwise, resource must belong to current site
  if (resourceSiteId !== siteContext.siteId) {
    return {
      valid: false,
      error: 'Resource does not belong to the selected site'
    }
  }

  return { valid: true }
}
