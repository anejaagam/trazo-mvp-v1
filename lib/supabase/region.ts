/**
 * Region-aware Supabase configuration
 * US = default env vars (no prefix)
 * CA = CAN_ prefix
 */

export type Region = 'US' | 'CA';

interface RegionConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/**
 * Get region configuration from environment variables
 * Falls back to US config if Canada config is not available
 */
export function getRegionConfig(region: Region): RegionConfig {
  if (region === 'US') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }

  // Canada (Next.js requires NEXT_PUBLIC_ prefix for browser access)
  // Try both naming conventions for compatibility
  const canUrl = process.env.NEXT_PUBLIC_CAN_SUPABASE_URL || process.env.CAN_NEXT_PUBLIC_CASUPABASE_URL;
  const canAnonKey = process.env.NEXT_PUBLIC_CAN_SUPABASE_ANON_KEY || process.env.CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY;

  if (!canUrl || !canAnonKey) {
    // Fallback to US config if Canada config is not available
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }

  return {
    url: canUrl,
    anonKey: canAnonKey,
    serviceRoleKey: process.env.CAN_SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * Validates that all required environment variables are present
 */
export function validateRegionConfig() {
  const errors: string[] = [];

  // Validate US (default) config
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('Missing NEXT_PUBLIC_SUPABASE_URL (US region)');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (US region)');
  }

  // Validate Canada (CAN_ prefix) config - using your naming convention
  if (!process.env.CAN_NEXT_PUBLIC_CASUPABASE_URL) {
    errors.push('Missing CAN_NEXT_PUBLIC_CASUPABASE_URL (Canada region)');
  }
  if (!process.env.CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY) {
    errors.push('Missing CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY (Canada region)');
  }

  if (errors.length > 0) {
    throw new Error(
      `❌ Region configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }

  console.log('✅ Region configuration validated (US + CA)');
}

/**
 * Determine user's region from various sources
 * Priority: user.region > cookie > localStorage > default to US
 */
export function getUserRegion(
  userRegion?: Region,
  cookieRegion?: Region,
  storageRegion?: Region
): Region {
  return userRegion || cookieRegion || storageRegion || 'US';
}

/**
 * Get all postgres config for a region
 * Useful for direct database access if needed
 */
export function getPostgresConfig(region: Region) {
  if (region === 'US') {
    return {
      url: process.env.POSTGRES_URL,
      prismaUrl: process.env.POSTGRES_PRISMA_URL,
      urlNonPooling: process.env.POSTGRES_URL_NON_POOLING,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    };
  }

  return {
    url: process.env.CAN_POSTGRES_URL,
    prismaUrl: process.env.CAN_POSTGRES_PRISMA_URL,
    urlNonPooling: process.env.CAN_POSTGRES_URL_NON_POOLING,
    host: process.env.CAN_POSTGRES_HOST,
    database: process.env.CAN_POSTGRES_DATABASE,
    user: process.env.CAN_POSTGRES_USER,
    password: process.env.CAN_POSTGRES_PASSWORD,
  };
}