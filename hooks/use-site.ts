/**
 * Site context hooks for accessing site state throughout the application
 *
 * Re-exports from SiteProvider for convenient imports
 */

export {
  useSite,
  useSiteId,
  useRequiredSiteId,
  useCurrentSite,
  useIsAllSitesMode,
} from '@/components/providers/site-provider';

// Re-export types for convenience
export type { SiteContextType, Site } from '@/lib/site/types';
