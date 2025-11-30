/**
 * Server-side site utilities for Next.js server components
 * Uses cookies to read the current site selection
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SITE_COOKIE_NAME, ALL_SITES_ID, type Site, type ServerSiteContext } from './types';
import { getUserAccessibleSites, getUserDefaultSite, canViewAllSites, getSiteById } from './access';

/**
 * Get the current site ID from cookies
 * Returns null if no site is selected
 */
export async function getServerSiteId(): Promise<string | null> {
  const cookieStore = await cookies();
  const siteId = cookieStore.get(SITE_COOKIE_NAME)?.value;
  return siteId || null;
}

/**
 * Require a site ID to be set
 * Redirects to dashboard with error if no site is selected
 */
export async function requireServerSiteId(): Promise<string> {
  const siteId = await getServerSiteId();
  if (!siteId) {
    redirect('/dashboard?error=no_site_selected');
  }
  return siteId;
}

/**
 * Check if current site is "All Sites" mode
 */
export async function isServerAllSitesMode(): Promise<boolean> {
  const siteId = await getServerSiteId();
  return siteId === ALL_SITES_ID;
}

/**
 * Get the full site context for server components
 * This is the main function to use in dashboard layouts
 *
 * @param userId - The authenticated user's ID
 * @param userRole - The user's role
 * @param organizationId - The user's organization ID
 */
export async function getServerSiteContext(
  userId: string,
  userRole: string,
  organizationId: string
): Promise<ServerSiteContext> {
  const supabase = await createClient();

  // Get user's accessible sites
  const availableSites = await getUserAccessibleSites(supabase, userId, userRole, organizationId);

  // Get current site ID from cookie
  let currentSiteId = await getServerSiteId();
  let currentSite: Site | null = null;

  // Get user's default site ID
  const { data: userData } = await supabase
    .from('users')
    .select('default_site_id')
    .eq('id', userId)
    .single();

  const defaultSiteId = userData?.default_site_id || null;

  // Determine the current site
  if (currentSiteId === ALL_SITES_ID) {
    // All sites mode - only valid for org_admin
    if (!canViewAllSites(userRole)) {
      // Not allowed, reset to default
      currentSiteId = defaultSiteId || availableSites[0]?.id || null;
    }
  }

  if (currentSiteId && currentSiteId !== ALL_SITES_ID) {
    // Verify user has access to this site
    currentSite = await getSiteById(supabase, currentSiteId, organizationId);

    if (!currentSite) {
      // Site not accessible, fall back to default or first available
      const defaultSite = await getUserDefaultSite(supabase, userId, userRole, organizationId);
      currentSite = defaultSite;
      currentSiteId = defaultSite?.id || null;
    }
  }

  // If still no site selected, use default
  if (!currentSiteId || (!currentSite && currentSiteId !== ALL_SITES_ID)) {
    const defaultSite = await getUserDefaultSite(supabase, userId, userRole, organizationId);
    currentSite = defaultSite;
    currentSiteId = defaultSite?.id || null;
  }

  return {
    currentSiteId,
    currentSite,
    availableSites,
    defaultSiteId,
    userRole,
    canViewAllSites: canViewAllSites(userRole),
  };
}

/**
 * Get site-specific data query filter
 * Returns the site_id to filter by, or null for "all sites" mode
 */
export async function getSiteFilter(): Promise<string | null> {
  const siteId = await getServerSiteId();
  if (!siteId || siteId === ALL_SITES_ID) {
    return null; // No filter = all sites
  }
  return siteId;
}

/**
 * Set the site cookie (server action helper)
 * Note: This should be called from a Server Action or API route
 */
export async function setServerSiteId(siteId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SITE_COOKIE_NAME, siteId, {
    path: '/',
    maxAge: 31536000, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

/**
 * Clear the site cookie
 */
export async function clearServerSiteId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SITE_COOKIE_NAME);
}
