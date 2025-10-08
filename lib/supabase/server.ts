import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getRegionConfig, type Region } from './region';

/**
 * Creates a Supabase client for server components/actions
 * @param region - 'US' or 'CA' (defaults to cookie or 'US')
 */
export async function createClient(region?: Region) {
  const cookieStore = await cookies();
  const selectedRegion = region || await getRegionFromCookies();
  const config = getRegionConfig(selectedRegion);

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component, can ignore
        }
      },
    },
  });
}

/**
 * Get user's region from cookies
 */
export async function getRegionFromCookies(): Promise<Region> {
  const cookieStore = await cookies();
  const regionCookie = cookieStore.get('user_region');
  return (regionCookie?.value === 'CA' ? 'CA' : 'US') as Region;
}

/**
 * Set user's region in cookies
 */
export async function setRegionCookie(region: Region) {
  const cookieStore = await cookies();
  cookieStore.set('user_region', region, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}