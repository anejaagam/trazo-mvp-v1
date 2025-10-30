/**
 * Integration Settings Database Queries
 * 
 * Manages API credentials and configuration for third-party integrations
 * like TagoIO, Metrc, CTLS, etc.
 */

import { createClient } from '@/lib/supabase/client'

// ============================================================================
// Types
// ============================================================================

export type IntegrationType = 'tagoio' | 'metrc' | 'ctls' | 'demegrow'

export interface IntegrationSetting {
  id: string
  organization_id: string
  integration_type: IntegrationType
  api_token: string | null
  api_secret: string | null
  config: Record<string, unknown>
  is_active: boolean
  is_valid: boolean
  last_validated_at: string | null
  validation_error: string | null
  created_at: string
  updated_at: string
}

export interface InsertIntegrationSetting {
  organization_id: string
  integration_type: IntegrationType
  api_token?: string | null
  api_secret?: string | null
  config?: Record<string, unknown>
  is_active?: boolean
}

export interface UpdateIntegrationSetting {
  api_token?: string | null
  api_secret?: string | null
  config?: Record<string, unknown>
  is_active?: boolean
  is_valid?: boolean
  last_validated_at?: string | null
  validation_error?: string | null
  updated_by?: string
}

export interface QueryResult<T> {
  data: T | null
  error: Error | null
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get integration settings for an organization
 * 
 * @param organizationId - Organization UUID
 * @param integrationType - Optional filter by integration type
 * @returns Query result with integration settings array
 */
export async function getIntegrationSettings(
  organizationId: string,
  integrationType?: IntegrationType
): Promise<QueryResult<IntegrationSetting[]>> {
  try {
    const supabase = createClient()

    let query = supabase
      .from('integration_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (integrationType) {
      query = query.eq('integration_type', integrationType)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return { data: data as IntegrationSetting[], error: null }
  } catch (error) {
    console.error('Error in getIntegrationSettings:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get a specific integration setting
 * 
 * @param organizationId - Organization UUID
 * @param integrationType - Integration type
 * @returns Query result with single integration setting
 */
export async function getIntegrationSetting(
  organizationId: string,
  integrationType: IntegrationType
): Promise<QueryResult<IntegrationSetting>> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('integration_type', integrationType)
      .eq('is_active', true)
      .single()

    if (error) throw error
    return { data: data as IntegrationSetting, error: null }
  } catch (error) {
    console.error('Error in getIntegrationSetting:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get TagoIO device token for an organization
 * 
 * @param organizationId - Organization UUID
 * @returns Query result with device token or null
 */
export async function getTagoIOToken(
  organizationId: string
): Promise<QueryResult<string>> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('integration_settings')
      .select('api_token')
      .eq('organization_id', organizationId)
      .eq('integration_type', 'tagoio')
      .eq('is_active', true)
      .single()

    if (error) throw error
    return { data: data?.api_token || null, error: null }
  } catch (error) {
    console.error('Error in getTagoIOToken:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

/**
 * Create or update integration settings
 * 
 * Uses upsert to handle both insert and update cases
 * 
 * @param settings - Integration settings to create/update
 * @returns Query result with created/updated setting
 */
export async function upsertIntegrationSetting(
  settings: InsertIntegrationSetting
): Promise<QueryResult<IntegrationSetting>> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('integration_settings')
      .upsert({
        ...settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id,integration_type',
      })
      .select()
      .single()

    if (error) throw error
    return { data: data as IntegrationSetting, error: null }
  } catch (error) {
    console.error('Error in upsertIntegrationSetting:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update integration settings
 * 
 * @param id - Integration setting UUID
 * @param updates - Fields to update
 * @returns Query result with updated setting
 */
export async function updateIntegrationSetting(
  id: string,
  updates: UpdateIntegrationSetting
): Promise<QueryResult<IntegrationSetting>> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('integration_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: data as IntegrationSetting, error: null }
  } catch (error) {
    console.error('Error in updateIntegrationSetting:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Mark integration credentials as validated
 * 
 * @param id - Integration setting UUID
 * @param isValid - Whether validation succeeded
 * @param validationError - Optional error message if validation failed
 * @returns Query result with updated setting
 */
export async function updateIntegrationValidation(
  id: string,
  isValid: boolean,
  validationError?: string | null
): Promise<QueryResult<IntegrationSetting>> {
  return updateIntegrationSetting(id, {
    is_valid: isValid,
    last_validated_at: new Date().toISOString(),
    validation_error: validationError || null,
  })
}

/**
 * Delete integration settings (soft delete by setting is_active = false)
 * 
 * @param id - Integration setting UUID
 * @returns Query result with success boolean
 */
export async function deleteIntegrationSetting(
  id: string
): Promise<QueryResult<boolean>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('integration_settings')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
    return { data: true, error: null }
  } catch (error) {
    console.error('Error in deleteIntegrationSetting:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// VALIDATION OPERATIONS
// ============================================================================

/**
 * Validate TagoIO credentials by testing API connection
 * Calls TagoIO API directly to work across multi-region deployments
 * 
 * @param token - TagoIO device token
 * @returns Query result with validation status
 */
export async function validateTagoIOCredentials(
  deviceToken: string
): Promise<QueryResult<{ isValid: boolean; deviceId?: string; deviceName?: string; error?: string }>> {
  try {
    // Call TagoIO API directly (works for both server-side and client-side)
    // Uses lowercase 'token' header as per TagoIO SDK implementation
    const response = await fetch('https://api.tago.io/info', {
      method: 'GET',
      headers: {
        'token': deviceToken,
        'Content-Type': 'application/json',
      },
    })

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = response.statusText
      
      try {
        const errorData = await response.json()
        errorMessage = errorData?.message || errorData?.error || errorMessage
      } catch {
        // If JSON parsing fails, use status text
      }

      if (response.status === 401) {
        return {
          data: { 
            isValid: false, 
            error: 'Invalid or expired device token. Please check your token and try again.' 
          },
          error: null,
        }
      }
      
      if (response.status === 400) {
        return {
          data: { 
            isValid: false, 
            error: 'Invalid token format. TagoIO device tokens should be in UUID format.' 
          },
          error: null,
        }
      }
      
      return {
        data: { 
          isValid: false, 
          error: `TagoIO API error: ${errorMessage}` 
        },
        error: null,
      }
    }

    const deviceInfo = await response.json()

    // Extract device info from the response
    // TagoIO wraps response in { status: true, result: {...} }
    const result = deviceInfo?.result || deviceInfo
    const deviceId = result?.id || 'unknown'
    const deviceName = result?.name || 'Unknown Device'

    return {
      data: {
        isValid: true,
        deviceId,
        deviceName,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error in validateTagoIOCredentials:', error)
    return {
      data: { isValid: false, error: 'Failed to validate credentials' },
      error: error as Error,
    }
  }
}
