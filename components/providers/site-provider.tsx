'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  type Site,
  type SiteContextType,
  SITE_STORAGE_KEY,
  SITE_COOKIE_NAME,
  ALL_SITES_ID,
  isAllSitesMode,
} from '@/lib/site/types';

const SiteContext = createContext<SiteContextType | undefined>(undefined);

interface SiteProviderProps {
  children: ReactNode;
  /** Initial site from server (cookie/default) */
  initialSite: Site | null;
  /** All sites the user can access */
  availableSites: Site[];
  /** User's role for permission checks */
  userRole: string;
  /** Whether user can view "All Sites" mode */
  canViewAllSites?: boolean;
}

/**
 * SiteProvider - Manages the current site context across the application
 *
 * Features:
 * - Persists selection in localStorage and cookie
 * - Cross-tab synchronization via StorageEvent
 * - Supports "All Sites" mode for org_admin
 * - Falls back to first available site if current becomes inaccessible
 */
export function SiteProvider({
  children,
  initialSite,
  availableSites,
  userRole,
  canViewAllSites: canViewAllSitesProp = false,
}: SiteProviderProps) {
  const [currentSite, setCurrentSite] = useState<Site | null>(initialSite);
  const [sites, setSites] = useState<Site[]>(availableSites);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const siteId = currentSite?.id || (canViewAllSitesProp && !currentSite ? ALL_SITES_ID : null);
  const hasMultipleSites = sites.length > 1;
  const isAllSites = isAllSitesMode(siteId);

  /**
   * Set the site cookie for server-side access
   */
  const setSiteCookie = useCallback((siteId: string) => {
    document.cookie = `${SITE_COOKIE_NAME}=${siteId}; path=/; max-age=31536000; SameSite=Lax${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }`;
  }, []);

  /**
   * Select a site by ID
   */
  const selectSite = useCallback(async (newSiteId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Handle "All Sites" mode
      if (newSiteId === ALL_SITES_ID) {
        if (!canViewAllSitesProp) {
          throw new Error('You do not have permission to view all sites');
        }
        setCurrentSite(null);
        localStorage.setItem(SITE_STORAGE_KEY, ALL_SITES_ID);
        setSiteCookie(ALL_SITES_ID);
        return;
      }

      // Find the site in available sites
      const site = sites.find((s) => s.id === newSiteId);
      if (!site) {
        throw new Error('Site not found or not accessible');
      }

      // Update state
      setCurrentSite(site);

      // Persist to localStorage
      localStorage.setItem(SITE_STORAGE_KEY, newSiteId);

      // Set cookie for server-side access
      setSiteCookie(newSiteId);

      // Call API to persist selection (optional, for audit trail)
      await fetch('/api/user/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: newSiteId }),
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select site');
      console.error('Error selecting site:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sites, canViewAllSitesProp, setSiteCookie]);

  /**
   * Refresh available sites from API
   */
  const refreshSites = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/sites');
      if (!response.ok) throw new Error('Failed to fetch sites');

      const data = await response.json();
      setSites(data.sites || []);

      // If current site is no longer accessible, switch to first available
      if (currentSite && !data.sites.find((s: Site) => s.id === currentSite.id)) {
        const firstSite = data.sites[0];
        if (firstSite) {
          setCurrentSite(firstSite);
          localStorage.setItem(SITE_STORAGE_KEY, firstSite.id);
          setSiteCookie(firstSite.id);
        }
      }
    } catch (err) {
      console.error('Error refreshing sites:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentSite, setSiteCookie]);

  /**
   * Cross-tab synchronization
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SITE_STORAGE_KEY && e.newValue) {
        if (e.newValue === ALL_SITES_ID) {
          if (canViewAllSitesProp) {
            setCurrentSite(null);
          }
        } else {
          const site = sites.find((s) => s.id === e.newValue);
          if (site) {
            setCurrentSite(site);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [sites, canViewAllSitesProp]);

  /**
   * Validate stored site on mount
   */
  useEffect(() => {
    const storedSiteId = localStorage.getItem(SITE_STORAGE_KEY);

    // If stored site differs from initial, validate it
    if (storedSiteId && storedSiteId !== initialSite?.id) {
      if (storedSiteId === ALL_SITES_ID) {
        if (canViewAllSitesProp) {
          setCurrentSite(null);
          setSiteCookie(ALL_SITES_ID);
        }
      } else {
        const site = sites.find((s) => s.id === storedSiteId);
        if (site) {
          setCurrentSite(site);
          setSiteCookie(storedSiteId);
        }
      }
    }
  }, [initialSite, sites, canViewAllSitesProp, setSiteCookie]);

  const contextValue: SiteContextType = {
    currentSite,
    availableSites: sites,
    siteId,
    isLoading,
    error,
    selectSite,
    refreshSites,
    hasMultipleSites,
    isAllSitesMode: isAllSites,
    canViewAllSites: canViewAllSitesProp,
  };

  return (
    <SiteContext.Provider value={contextValue}>
      {children}
    </SiteContext.Provider>
  );
}

/**
 * Hook to access the site context
 * @throws Error if used outside SiteProvider
 */
export function useSite(): SiteContextType {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within SiteProvider');
  }
  return context;
}

/**
 * Hook to get just the current site ID
 * Useful for data fetching hooks
 */
export function useSiteId(): string | null {
  const { siteId } = useSite();
  return siteId;
}

/**
 * Hook to require a site ID
 * Throws if no site is selected (use for pages that require a site)
 */
export function useRequiredSiteId(): string {
  const { siteId, isAllSitesMode } = useSite();
  if (!siteId && !isAllSitesMode) {
    throw new Error('No site selected');
  }
  return siteId || ALL_SITES_ID;
}

/**
 * Hook to get the current site object
 * Returns null in "All Sites" mode
 */
export function useCurrentSite(): Site | null {
  const { currentSite } = useSite();
  return currentSite;
}

/**
 * Hook to check if in "All Sites" mode
 */
export function useIsAllSitesMode(): boolean {
  const { isAllSitesMode } = useSite();
  return isAllSitesMode;
}
