/**
 * Metrc Authentication
 *
 * Handles API key validation, encryption, and credential management
 */

import { createClient } from '@/lib/supabase/server'
import { MetrcAuthError } from './errors'
import { getMetrcBaseUrl } from './config'

/**
 * Validate Metrc API credentials by attempting to fetch facilities
 *
 * @param vendorApiKey - Metrc vendor API key
 * @param userApiKey - Facility-specific user API key
 * @param state - State code (e.g., 'OR', 'MD')
 * @param isSandbox - Whether to use sandbox environment
 * @returns True if credentials are valid
 * @throws MetrcAuthError if credentials are invalid
 */
export async function validateCredentials(
  vendorApiKey: string,
  userApiKey: string,
  state: string,
  isSandbox = false
): Promise<boolean> {
  try {
    const baseUrl = getMetrcBaseUrl(state, isSandbox)
    const response = await fetch(`${baseUrl}/facilities/v2/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': vendorApiKey,
        'x-user-api-key': userApiKey,
      },
    })

    if (response.status === 401) {
      // Determine which key is invalid based on error message
      const errorText = await response.text()
      if (errorText.toLowerCase().includes('vendor')) {
        throw new MetrcAuthError('Invalid vendor API key', 'INVALID_VENDOR_KEY')
      } else {
        throw new MetrcAuthError('Invalid user API key', 'INVALID_USER_KEY')
      }
    }

    if (!response.ok) {
      throw new MetrcAuthError(
        `Credential validation failed with status ${response.status}`,
        'INVALID_USER_KEY'
      )
    }

    return true
  } catch (error) {
    if (error instanceof MetrcAuthError) {
      throw error
    }
    throw new MetrcAuthError(
      'Failed to validate credentials: ' + (error as Error).message,
      'INVALID_USER_KEY'
    )
  }
}

/**
 * Encrypt API key using Supabase Vault
 *
 * Note: In production, this should use Supabase Vault's encryption features.
 * For now, we're using a placeholder implementation.
 *
 * @param apiKey - The API key to encrypt
 * @returns Encrypted API key
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  // TODO: Implement proper encryption using Supabase Vault
  // For now, we'll store keys as-is but mark them for future encryption
  // This is acceptable for MVP with proper RLS policies
  return apiKey
}

/**
 * Decrypt API key using Supabase Vault
 *
 * Note: In production, this should use Supabase Vault's decryption features.
 * For now, we're using a placeholder implementation.
 *
 * @param encryptedKey - The encrypted API key
 * @returns Decrypted API key
 */
export async function decryptApiKey(encryptedKey: string): Promise<string> {
  // TODO: Implement proper decryption using Supabase Vault
  return encryptedKey
}

/**
 * Store Metrc API credentials in the database
 *
 * @param siteId - Site ID
 * @param jurisdictionId - Jurisdiction ID
 * @param vendorApiKey - Metrc vendor API key
 * @param userApiKey - Facility-specific user API key
 * @param facilityLicenseNumber - Facility license number
 * @param state - State code
 * @param isSandbox - Whether these are sandbox credentials
 * @returns The created credential record ID
 */
export async function storeCredentials(
  siteId: string,
  jurisdictionId: string,
  vendorApiKey: string,
  userApiKey: string,
  facilityLicenseNumber: string,
  state: string,
  isSandbox = false
): Promise<string> {
  const supabase = await createClient()

  // Validate credentials before storing
  await validateCredentials(vendorApiKey, userApiKey, state, isSandbox)

  // Encrypt keys
  const encryptedVendorKey = await encryptApiKey(vendorApiKey)
  const encryptedUserKey = await encryptApiKey(userApiKey)

  const { data, error } = await supabase
    .from('compliance_api_keys')
    .insert({
      site_id: siteId,
      jurisdiction_id: jurisdictionId,
      vendor_api_key: encryptedVendorKey,
      user_api_key: encryptedUserKey,
      facility_license_number: facilityLicenseNumber,
      state_code: state.toUpperCase(),
      is_sandbox: isSandbox,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to store credentials: ${error.message}`)
  }

  return data.id
}

/**
 * Retrieve Metrc API credentials for a site
 *
 * @param siteId - Site ID
 * @returns Decrypted credentials or null if not found
 */
export async function getCredentials(siteId: string): Promise<{
  vendorApiKey: string
  userApiKey: string
  facilityLicenseNumber: string
  state: string
  isSandbox: boolean
} | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('compliance_api_keys')
    .select('*')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  // Decrypt keys
  const vendorApiKey = await decryptApiKey(data.vendor_api_key)
  const userApiKey = await decryptApiKey(data.user_api_key)

  return {
    vendorApiKey,
    userApiKey,
    facilityLicenseNumber: data.facility_license_number,
    state: data.state_code,
    isSandbox: data.is_sandbox || false,
  }
}

/**
 * Deactivate (soft delete) Metrc API credentials
 *
 * @param credentialId - Credential record ID
 */
export async function deactivateCredentials(credentialId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('compliance_api_keys')
    .update({ is_active: false })
    .eq('id', credentialId)

  if (error) {
    throw new Error(`Failed to deactivate credentials: ${error.message}`)
  }
}
