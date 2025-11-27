/**
 * Site module - Platform-wide site scoping utilities
 *
 * Usage:
 * - Server Components: import { getServerSiteContext, getServerSiteId } from '@/lib/site/server'
 * - Client Components: import { useSite, useSiteId } from '@/hooks/use-site'
 * - Types: import type { Site, SiteContextType } from '@/lib/site/types'
 * - Validation: import { validateSiteAccess } from '@/lib/site/access'
 */

// Types
export * from './types';

// Access validation (server-side)
export {
  validateSiteAccess,
  getUserAccessibleSites,
  getUserDefaultSite,
  canViewAllSites,
  getSiteById,
} from './access';

// Server utilities
export {
  getServerSiteId,
  requireServerSiteId,
  isServerAllSitesMode,
  getServerSiteContext,
  getSiteFilter,
  setServerSiteId,
  clearServerSiteId,
} from './server';
