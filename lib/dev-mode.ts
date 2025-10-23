/**
 * Development Mode Configuration
 * 
 * Centralized dev mode bypass for rapid UI development without authentication.
 * 
 * ⚠️ PRODUCTION SAFETY:
 * - Only works when NODE_ENV === 'development'
 * - Automatically disabled in production builds
 * - All checks include explicit environment validation
 * - Controlled by NEXT_PUBLIC_DEV_MODE environment variable
 */

/**
 * Check if dev mode is currently active
 * Only returns true when:
 * 1. NEXT_PUBLIC_DEV_MODE is explicitly set to 'true'
 * 2. AND NODE_ENV === 'development'
 */
export function isDevModeActive(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true' && process.env.NODE_ENV === 'development'
}

/**
 * Mock user data for development mode
 * Simulates an org_admin user with full permissions
 * Using valid UUIDs for database compatibility
 */
export const DEV_MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000001', // Valid UUID for dev user
  email: 'dev@trazo.ag',
  full_name: 'Dev User',
  phone: '+1234567890',
  role: 'org_admin',
  is_active: true,
  organization_id: '00000000-0000-0000-0000-000000000010', // Valid UUID for dev org
  organization: {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'Development Farm',
    jurisdiction: 'maryland_cannabis',
    plant_type: 'cannabis',
    data_region: 'us'
  },
  site_assignments: [
    {
      site_id: '00000000-0000-0000-0000-000000000020', // Valid UUID for dev site
      site_name: 'Main Facility'
    }
  ]
} as const

/**
 * Mock Supabase auth user for development mode
 */
export const DEV_MOCK_AUTH_USER = {
  id: '00000000-0000-0000-0000-000000000001', // Valid UUID for dev user
  email: 'dev@trazo.ag',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    full_name: 'Dev User'
  }
} as const

/**
 * Dev mode banner component properties
 */
export const DEV_MODE_BANNER = {
  text: '🚧 DEV MODE ACTIVE - Authentication Bypassed',
  className: 'fixed top-0 left-0 right-0 px-4 py-2 text-center text-sm font-bold shadow-lg border-b-2 z-50',
  style: {
    backgroundColor: '#FFD700',
    color: '#000000',
    borderBottomColor: '#FFA500'
  }
} as const

/**
 * Routes that should bypass authentication in dev mode
 * Empty array = all protected routes are bypassed
 */
export const DEV_BYPASS_ROUTES: string[] = [
  // '/dashboard',
  // '/protected',
  // Add specific routes here if you want selective bypass
  // Empty array means all routes are bypassed
]

/**
 * Check if a specific route should bypass auth in dev mode
 */
export function shouldBypassAuth(pathname: string): boolean {
  if (!isDevModeActive()) return false
  
  // If DEV_BYPASS_ROUTES is empty, bypass all protected routes
  if (DEV_BYPASS_ROUTES.length === 0) return true
  
  // Otherwise check if pathname matches any bypass routes
  return DEV_BYPASS_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Log dev mode status to console (only in development)
 */
export function logDevMode(location: string): void {
  if (isDevModeActive()) {
    console.log(`🚧 DEV MODE: ${location} - Authentication bypassed`)
  }
}
