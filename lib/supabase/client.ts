import { createBrowserClient } from '@supabase/ssr';
import { getRegionConfig, type Region } from './region';

/**
 * Creates a Supabase client for the browser
 * @param region - 'US' or 'CA' (defaults to stored region or 'US')
 */
export function createClient(region?: Region) {
  const selectedRegion = region || getStoredRegion();
  const config = getRegionConfig(selectedRegion);

  return createBrowserClient(config.url, config.anonKey, {
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    },
  });
}

/**
 * Get region from local storage (set during signup)
 */
export function getStoredRegion(): Region {
  if (typeof window === 'undefined') return 'US';
  
  const stored = localStorage.getItem('user_region');
  return (stored === 'CA' ? 'CA' : 'US') as Region;
}

/**
 * Store user's region in local storage
 */
export function setStoredRegion(region: Region) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_region', region);
}

/**
 * Clear stored region (useful for logout)
 */
export function clearStoredRegion() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user_region');
}