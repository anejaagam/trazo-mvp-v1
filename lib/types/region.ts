/**
 * Supported regions for data residency
 */
export type Region = 'US' | 'CA';

/**
 * Region display information
 */
export const REGION_INFO: Record<Region, {
  name: string;
  flag: string;
  timezone: string;
  supabaseRegion: string;
}> = {
  US: {
    name: 'United States',
    flag: '🇺🇸',
    timezone: 'America/New_York',
    supabaseRegion: 'us-east-1',
  },
  CA: {
    name: 'Canada',
    flag: '🇨🇦',
    timezone: 'America/Toronto',
    supabaseRegion: 'ca-central-1',
  },
};

/**
 * User metadata stored in Supabase auth
 */
export interface UserMetadata {
  region: Region;
  full_name?: string;
  company_name?: string;
}

/**
 * Organization data structure
 */
export interface Organization {
  id: string;
  name: string;
  region: Region;
  created_at: string;
  updated_at: string;
}