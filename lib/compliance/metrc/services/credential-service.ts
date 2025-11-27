/**
 * Metrc Credential Service
 *
 * Handles credential validation, facilities fetching, and credential storage.
 * Vendor keys are retrieved from environment variables per state.
 */

import { MetrcClient } from '../client'
import { MetrcApiError } from '../errors'
import type { MetrcState } from '../config'
import { METRC_STATES, isMetrcStateSupported } from '../config'
import type { MetrcFacility as MetrcFacilityApi } from '../types'

/**
 * Simplified facility for storage
 */
export interface MetrcFacility {
  id: number
  name: string
  licenseNumber: string
  licenseType: string
  stateCode: string
  address?: {
    street1?: string
    street2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  rawData: MetrcFacilityApi
}

/**
 * Validation result
 */
export interface CredentialValidationResult {
  isValid: boolean
  error?: string
  facilities?: MetrcFacility[]
}

/**
 * TEST MODE: Use Alaska vendor key AND sandbox for all states
 * Set METRC_TEST_MODE=true in environment to enable
 * This allows testing with any state using the AK sandbox credentials
 */
const isTestMode = process.env.METRC_TEST_MODE === 'true'

/**
 * Check if we're in test mode
 */
export function isInTestMode(): boolean {
  return isTestMode
}

/**
 * Get the effective sandbox setting (always true in test mode)
 */
function getEffectiveSandbox(requestedSandbox: boolean): boolean {
  if (isTestMode) {
    console.log('[TEST MODE] Forcing sandbox environment')
    return true
  }
  return requestedSandbox
}

/**
 * Get the vendor API key for a specific state from environment variables
 *
 * In TEST MODE (METRC_TEST_MODE=true), always uses the Alaska vendor key
 * for all states to enable sandbox testing across different jurisdictions.
 *
 * @param stateCode - State code (e.g., 'AK', 'OR')
 * @returns Vendor API key or null if not configured
 */
export function getVendorKeyForState(stateCode: string): string | null {
  const normalizedState = stateCode.toUpperCase()

  // TEST MODE: Always use Alaska vendor key for all states
  if (isTestMode) {
    const akKey = process.env.METRC_VENDOR_KEY_AK
    if (akKey) {
      console.log(`[TEST MODE] Using AK vendor key for state: ${normalizedState}`)
      return akKey
    }
  }

  // Check for state-specific key first
  const stateKey = process.env[`METRC_VENDOR_KEY_${normalizedState}`]
  if (stateKey) {
    return stateKey
  }

  // Fallback to generic key (for development)
  const genericKey = process.env.METRC_VENDOR_KEY
  if (genericKey) {
    return genericKey
  }

  return null
}

/**
 * Check if we have vendor credentials for a state
 */
export function hasVendorKeyForState(stateCode: string): boolean {
  return getVendorKeyForState(stateCode) !== null
}

/**
 * Get all states we have vendor keys for
 * In TEST MODE, returns all supported states (using AK key for all)
 */
export function getConfiguredStates(): MetrcState[] {
  // In test mode, all states are configured (using AK key)
  if (isTestMode && process.env.METRC_VENDOR_KEY_AK) {
    return [...METRC_STATES]
  }
  return METRC_STATES.filter((state) => hasVendorKeyForState(state))
}

/**
 * Validate user API key and fetch facilities
 *
 * @param stateCode - State code
 * @param userApiKey - User's API key
 * @param isSandbox - Whether to use sandbox environment
 * @returns Validation result with facilities if successful
 */
export async function validateCredentialsAndFetchFacilities(
  stateCode: string,
  userApiKey: string,
  isSandbox: boolean = false
): Promise<CredentialValidationResult> {
  // Validate state
  if (!isMetrcStateSupported(stateCode)) {
    return {
      isValid: false,
      error: `Unsupported state: ${stateCode}. Supported states: ${METRC_STATES.join(', ')}`,
    }
  }

  // Get vendor key
  const vendorKey = getVendorKeyForState(stateCode)
  if (!vendorKey) {
    return {
      isValid: false,
      error: `No vendor key configured for state: ${stateCode}. Please contact support.`,
    }
  }

  // In test mode, always use sandbox
  const effectiveSandbox = getEffectiveSandbox(isSandbox)

  try {
    // Create client with a dummy facility (we'll fetch real ones)
    const client = new MetrcClient({
      vendorApiKey: vendorKey,
      userApiKey: userApiKey,
      facilityLicenseNumber: 'VALIDATION', // Placeholder
      state: stateCode,
      isSandbox: effectiveSandbox,
    })

    // Fetch facilities - this validates credentials
    const facilitiesResult = await client.facilities.list()

    // Transform facilities (list() returns array directly, not paginated result)
    // Note: Metrc API v2 returns License as nested object with Number field
    const facilities: MetrcFacility[] = facilitiesResult.map((facility: any) => ({
      id: facility.FacilityId || facility.Id,
      name: facility.Name || facility.DisplayName || 'Unknown',
      licenseNumber: facility.License?.Number || facility.LicenseNumber || '',
      licenseType: facility.License?.LicenseType || (typeof facility.FacilityType === 'string' ? facility.FacilityType : 'Unknown'),
      stateCode: stateCode.toUpperCase(),
      address: {
        street1: facility.Address1,
        street2: facility.Address2,
        city: facility.City,
        state: facility.State,
        postalCode: facility.PostalCode,
        country: facility.Country,
      },
      rawData: facility,
    }))

    return {
      isValid: true,
      facilities,
    }
  } catch (error) {
    if (error instanceof MetrcApiError) {
      if (error.statusCode === 401) {
        return {
          isValid: false,
          error: 'Invalid API key. Please check your credentials.',
        }
      }
      return {
        isValid: false,
        error: `Metrc API error: ${error.message}`,
      }
    }

    return {
      isValid: false,
      error: `Failed to validate credentials: ${(error as Error).message}`,
    }
  }
}

/**
 * Create a Metrc client for a validated credential
 *
 * @param stateCode - State code
 * @param userApiKey - User's API key
 * @param facilityLicenseNumber - Facility license number
 * @param isSandbox - Whether to use sandbox environment
 * @returns Configured MetrcClient
 */
export function createMetrcClient(
  stateCode: string,
  userApiKey: string,
  facilityLicenseNumber: string,
  isSandbox: boolean = false
): MetrcClient {
  const vendorKey = getVendorKeyForState(stateCode)
  if (!vendorKey) {
    throw new Error(`No vendor key configured for state: ${stateCode}`)
  }

  // In test mode, always use sandbox
  const effectiveSandbox = getEffectiveSandbox(isSandbox)

  return new MetrcClient({
    vendorApiKey: vendorKey,
    userApiKey: userApiKey,
    facilityLicenseNumber: facilityLicenseNumber,
    state: stateCode,
    isSandbox: effectiveSandbox,
  })
}

/**
 * Get facility details for a specific license
 *
 * @param stateCode - State code
 * @param userApiKey - User's API key
 * @param licenseNumber - Facility license number
 * @param isSandbox - Whether to use sandbox environment
 * @returns Facility details or null if not found
 */
export async function getFacilityByLicense(
  stateCode: string,
  userApiKey: string,
  licenseNumber: string,
  isSandbox: boolean = false
): Promise<MetrcFacility | null> {
  const result = await validateCredentialsAndFetchFacilities(stateCode, userApiKey, isSandbox)

  if (!result.isValid || !result.facilities) {
    return null
  }

  return result.facilities.find((f) => f.licenseNumber === licenseNumber) || null
}

/**
 * Site Metrc credential information
 */
export interface SiteMetrcCredentials {
  stateCode: string
  userApiKey: string
  facilityLicenseNumber: string
  isSandbox: boolean
  credentialId: string
}

/**
 * Result of getting site credentials
 */
export interface GetSiteCredentialsResult {
  success: boolean
  credentials?: SiteMetrcCredentials
  error?: string
}

/**
 * Get Metrc credentials for a site
 * Uses the new architecture: site -> metrc_credential_id -> metrc_org_credentials
 *
 * @param siteId - The site ID to get credentials for
 * @param supabase - Optional Supabase client (will create one if not provided)
 * @returns Credentials needed to create a MetrcClient for this site
 */
export async function getSiteMetrcCredentials(
  siteId: string,
  supabase?: any
): Promise<GetSiteCredentialsResult> {
  // Use provided client or create a new one
  const client = supabase || (await import('@/lib/supabase/server').then(m => m.createClient()))

  try {
    // Get site with credential reference
    const { data: site, error: siteError } = await client
      .from('sites')
      .select('id, metrc_license_number, metrc_credential_id')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return {
        success: false,
        error: 'Site not found',
      }
    }

    if (!site.metrc_license_number) {
      return {
        success: false,
        error: 'Site is not linked to a Metrc facility. Please link the site first.',
      }
    }

    if (!site.metrc_credential_id) {
      return {
        success: false,
        error: 'Site has no Metrc credentials configured. Please set up credentials first.',
      }
    }

    // Get credentials from metrc_org_credentials
    const { data: credential, error: credError } = await client
      .from('metrc_org_credentials')
      .select('id, state_code, user_api_key, is_sandbox, is_active')
      .eq('id', site.metrc_credential_id)
      .single()

    if (credError || !credential) {
      return {
        success: false,
        error: 'Metrc credentials not found for this site',
      }
    }

    if (!credential.is_active) {
      return {
        success: false,
        error: 'Metrc credentials are inactive. Please reactivate them first.',
      }
    }

    return {
      success: true,
      credentials: {
        stateCode: credential.state_code,
        userApiKey: credential.user_api_key,
        facilityLicenseNumber: site.metrc_license_number,
        isSandbox: credential.is_sandbox,
        credentialId: credential.id,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to get credentials: ${(error as Error).message}`,
    }
  }
}

/**
 * Create a Metrc client for a site
 * This is a convenience function that combines getSiteMetrcCredentials and createMetrcClient
 *
 * @param siteId - The site ID to create a client for
 * @param supabase - Optional Supabase client
 * @returns Configured MetrcClient or error
 */
export async function createMetrcClientForSite(
  siteId: string,
  supabase?: any
): Promise<{ client?: MetrcClient; credentials?: SiteMetrcCredentials; error?: string }> {
  const result = await getSiteMetrcCredentials(siteId, supabase)

  if (!result.success || !result.credentials) {
    return { error: result.error }
  }

  const client = createMetrcClient(
    result.credentials.stateCode,
    result.credentials.userApiKey,
    result.credentials.facilityLicenseNumber,
    result.credentials.isSandbox
  )

  return { client, credentials: result.credentials }
}
