/**
 * Metrc Configuration
 *
 * State-specific Metrc API configuration including sandbox and production URLs
 */

/**
 * Supported Metrc states
 */
export const METRC_STATES = [
  'OR', // Oregon
  'MD', // Maryland
  'CA', // California
  'CO', // Colorado
  'MI', // Michigan
  'NV', // Nevada
  'AK', // Alaska
  'MA', // Massachusetts
  'OK', // Oklahoma
] as const

export type MetrcState = (typeof METRC_STATES)[number]

/**
 * Production Metrc API base URLs by state
 */
const PRODUCTION_URLS: Record<MetrcState, string> = {
  OR: 'https://api-or.metrc.com',
  MD: 'https://api-md.metrc.com',
  CA: 'https://api-ca.metrc.com',
  CO: 'https://api-co.metrc.com',
  MI: 'https://api-mi.metrc.com',
  NV: 'https://api-nv.metrc.com',
  AK: 'https://api-ak.metrc.com',
  MA: 'https://api-ma.metrc.com',
  OK: 'https://api-ok.metrc.com',
}

/**
 * Sandbox Metrc API base URLs by state
 */
const SANDBOX_URLS: Record<MetrcState, string> = {
  OR: 'https://sandbox-api-or.metrc.com',
  MD: 'https://sandbox-api-md.metrc.com',
  CA: 'https://sandbox-api-ca.metrc.com',
  CO: 'https://sandbox-api-co.metrc.com',
  MI: 'https://sandbox-api-mi.metrc.com',
  NV: 'https://sandbox-api-nv.metrc.com',
  AK: 'https://sandbox-api-ak.metrc.com',
  MA: 'https://sandbox-api-ma.metrc.com',
  OK: 'https://sandbox-api-ok.metrc.com',
}

/**
 * Get the appropriate Metrc base URL for a given state
 *
 * @param state - State code (e.g., 'OR', 'MD', 'CA')
 * @param useSandbox - Whether to use sandbox environment (defaults to env var)
 * @returns Base URL for Metrc API
 * @throws Error if state is not supported
 */
export function getMetrcBaseUrl(state: string, useSandbox?: boolean): string {
  const stateCode = state.toUpperCase() as MetrcState

  if (!METRC_STATES.includes(stateCode)) {
    throw new Error(
      `Unsupported Metrc state: ${state}. Supported states: ${METRC_STATES.join(', ')}`
    )
  }

  // Determine if using sandbox from parameter or environment variable
  const isSandbox =
    useSandbox !== undefined
      ? useSandbox
      : process.env.NEXT_PUBLIC_METRC_USE_SANDBOX === 'true'

  const urlMap = isSandbox ? SANDBOX_URLS : PRODUCTION_URLS
  return urlMap[stateCode]
}

/**
 * Check if a state is supported by Metrc
 *
 * @param state - State code to check
 * @returns True if state is supported
 */
export function isMetrcStateSupported(state: string): boolean {
  return METRC_STATES.includes(state.toUpperCase() as MetrcState)
}

/**
 * Default API request timeout in milliseconds
 */
export const DEFAULT_TIMEOUT = 30000 // 30 seconds

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000, // 1 second
} as const

/**
 * Retryable HTTP status codes
 */
export const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504] as const
