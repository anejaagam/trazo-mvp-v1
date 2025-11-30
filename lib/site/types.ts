/**
 * Site-related types and interfaces for platform-wide site scoping
 */

/**
 * Core Site interface representing a physical location/facility
 */
export interface Site {
  id: string;
  name: string;
  organization_id: string;
  is_active: boolean;
  address?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  timezone?: string;
  metrc_license_number?: string | null;
  metrc_facility_id?: number | null;
  compliance_status?: 'compliant' | 'uncompliant' | 'pending' | 'not_required' | null;
}

/**
 * Minimal site info for dropdowns and selectors
 */
export interface SiteOption {
  id: string;
  name: string;
  is_active: boolean;
  metrc_license_number?: string | null;
}

/**
 * User's site assignment
 */
export interface SiteAssignment {
  id: string;
  user_id: string;
  site_id: string;
  is_active: boolean;
  assigned_at: string;
  assigned_by?: string | null;
  site?: Site;
}

/**
 * Site context type for the SiteProvider
 */
export interface SiteContextType {
  // Current state
  currentSite: Site | null;
  availableSites: Site[];
  siteId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  selectSite: (siteId: string) => Promise<void>;
  refreshSites: () => Promise<void>;

  // Computed helpers
  hasMultipleSites: boolean;
  isAllSitesMode: boolean;
  canViewAllSites: boolean; // true for org_admin
}

/**
 * Special site ID for "All Sites" mode (org_admin only)
 */
export const ALL_SITES_ID = 'all';

/**
 * Storage keys for site persistence
 */
export const SITE_STORAGE_KEY = 'trazo_selected_site_id';
export const SITE_COOKIE_NAME = 'trazo_site_id';

/**
 * Cookie configuration
 */
export const SITE_COOKIE_OPTIONS = {
  path: '/',
  maxAge: 31536000, // 1 year
  sameSite: 'Lax' as const,
};

/**
 * Check if a site ID represents "All Sites" mode
 */
export function isAllSitesMode(siteId: string | null): boolean {
  return siteId === ALL_SITES_ID;
}

/**
 * Site access validation result
 */
export interface SiteAccessResult {
  allowed: boolean;
  reason?: string;
  site?: Site;
}

/**
 * Props for components that need site context
 */
export interface WithSiteProps {
  siteId: string;
  siteName?: string;
}

/**
 * Server-side site context passed from layout to client
 */
export interface ServerSiteContext {
  currentSiteId: string | null;
  currentSite: Site | null;
  availableSites: Site[];
  defaultSiteId: string | null;
  userRole: string;
  canViewAllSites: boolean;
}
