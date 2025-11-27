/**
 * Site access validation utilities
 * Used to check if a user has access to a specific site
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Site, SiteAccessResult, ALL_SITES_ID } from './types';

/**
 * Validate if a user has access to a specific site
 *
 * Logic:
 * - org_admin: Can access all sites in their organization (but must select one)
 * - Other roles: Must have an active entry in user_site_assignments
 *
 * @param supabase - Supabase client instance
 * @param userId - The user's ID
 * @param siteId - The site ID to check access for (or "all" for All Sites mode)
 * @param userRole - The user's role
 * @param organizationId - The user's organization ID
 */
export async function validateSiteAccess(
  supabase: SupabaseClient,
  userId: string,
  siteId: string,
  userRole: string,
  organizationId: string
): Promise<SiteAccessResult> {
  // Handle "all" sites mode - only org_admin can use this
  if (siteId === 'all') {
    if (userRole === 'org_admin') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Only organization administrators can view all sites'
    };
  }

  // Validate the site exists and belongs to the user's organization
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('id, name, organization_id, is_active')
    .eq('id', siteId)
    .single();

  if (siteError || !site) {
    return {
      allowed: false,
      reason: 'Site not found'
    };
  }

  // Verify site belongs to user's organization
  if (site.organization_id !== organizationId) {
    return {
      allowed: false,
      reason: 'Site does not belong to your organization'
    };
  }

  // Check if site is active
  if (!site.is_active) {
    return {
      allowed: false,
      reason: 'Site is not active'
    };
  }

  // org_admin has access to all sites in their organization
  if (userRole === 'org_admin') {
    return {
      allowed: true,
      site: site as Site
    };
  }

  // For other roles, check explicit site assignment
  const { data: assignment, error: assignmentError } = await supabase
    .from('user_site_assignments')
    .select('id, is_active')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .eq('is_active', true)
    .single();

  if (assignmentError || !assignment) {
    return {
      allowed: false,
      reason: 'You are not assigned to this site'
    };
  }

  return {
    allowed: true,
    site: site as Site
  };
}

/**
 * Get all sites a user can access
 *
 * @param supabase - Supabase client instance
 * @param userId - The user's ID
 * @param userRole - The user's role
 * @param organizationId - The user's organization ID
 */
export async function getUserAccessibleSites(
  supabase: SupabaseClient,
  userId: string,
  userRole: string,
  organizationId: string
): Promise<Site[]> {
  // org_admin can access all sites in their organization
  if (userRole === 'org_admin') {
    const { data: sites, error } = await supabase
      .from('sites')
      .select('id, name, organization_id, is_active, address, city, state_province, timezone, metrc_license_number, compliance_status')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching organization sites:', error);
      return [];
    }

    return sites as Site[];
  }

  // For other roles, get only assigned sites
  const { data: assignments, error } = await supabase
    .from('user_site_assignments')
    .select(`
      site_id,
      sites:site_id (
        id, name, organization_id, is_active, address, city,
        state_province, timezone, metrc_license_number, compliance_status
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching user site assignments:', error);
    return [];
  }

  // Extract and filter active sites
  const sites = assignments
    ?.map((a: any) => a.sites)
    .filter((site: any) => site && site.is_active) as Site[];

  return sites || [];
}

/**
 * Get the user's default site
 *
 * Priority:
 * 1. User's default_site_id (set by org_admin)
 * 2. First assigned site (by assignment date)
 * 3. First org site (for org_admin with no assignments)
 */
export async function getUserDefaultSite(
  supabase: SupabaseClient,
  userId: string,
  userRole: string,
  organizationId: string
): Promise<Site | null> {
  // First check for explicit default_site_id
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('default_site_id')
    .eq('id', userId)
    .single();

  if (user?.default_site_id) {
    // Validate the default site is still accessible
    const { data: defaultSite } = await supabase
      .from('sites')
      .select('id, name, organization_id, is_active, address, city, state_province, timezone, metrc_license_number, compliance_status')
      .eq('id', user.default_site_id)
      .eq('is_active', true)
      .single();

    if (defaultSite) {
      return defaultSite as Site;
    }
  }

  // Fall back to first assigned site
  const sites = await getUserAccessibleSites(supabase, userId, userRole, organizationId);
  return sites.length > 0 ? sites[0] : null;
}

/**
 * Check if user can view "All Sites" mode
 * Only org_admin role is allowed
 */
export function canViewAllSites(userRole: string): boolean {
  return userRole === 'org_admin';
}

/**
 * Get site by ID with validation
 */
export async function getSiteById(
  supabase: SupabaseClient,
  siteId: string,
  organizationId: string
): Promise<Site | null> {
  const { data: site, error } = await supabase
    .from('sites')
    .select('id, name, organization_id, is_active, address, city, state_province, timezone, metrc_license_number, metrc_facility_id, compliance_status')
    .eq('id', siteId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !site) {
    return null;
  }

  return site as Site;
}
