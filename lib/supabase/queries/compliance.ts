/**
 * Compliance Database Queries
 *
 * Functions for interacting with compliance-related tables
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Compliance API Key
 */
export interface ComplianceApiKey {
  id: string
  site_id: string
  vendor_api_key: string
  user_api_key: string
  facility_license_number: string
  state_code: string
  is_sandbox: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Get all compliance API keys for an organization
 */
export async function getComplianceApiKeys(organizationId: string): Promise<{
  data: (ComplianceApiKey & { site_name: string })[] | null
  error: Error | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('compliance_api_keys')
      .select(`
        *,
        sites!inner(
          id,
          name,
          organization_id
        )
      `)
      .eq('sites.organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform the data to flatten site information
    const transformedData = data?.map((item: any) => ({
      ...item,
      site_name: item.sites?.name || 'Unknown Site',
      sites: undefined, // Remove nested object
    }))

    return { data: transformedData || null, error: null }
  } catch (error) {
    console.error('Error in getComplianceApiKeys:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get compliance API key for a specific site
 */
export async function getComplianceApiKeyForSite(siteId: string): Promise<{
  data: ComplianceApiKey | null
  error: Error | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('compliance_api_keys')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .single()

    if (error) {
      // Return null if not found (not an error)
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in getComplianceApiKeyForSite:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Create or update compliance API key
 */
export async function upsertComplianceApiKey(apiKey: {
  id?: string
  site_id: string
  vendor_api_key: string
  user_api_key: string
  facility_license_number: string
  state_code: string
  is_sandbox?: boolean
}): Promise<{
  data: ComplianceApiKey | null
  error: Error | null
}> {
  try {
    const supabase = await createClient()

    // If updating, deactivate existing active keys first
    if (apiKey.id) {
      await supabase
        .from('compliance_api_keys')
        .update({ is_active: false })
        .eq('site_id', apiKey.site_id)
        .eq('is_active', true)
        .neq('id', apiKey.id)
    } else {
      // For new keys, deactivate all existing keys for this site
      await supabase
        .from('compliance_api_keys')
        .update({ is_active: false })
        .eq('site_id', apiKey.site_id)
        .eq('is_active', true)
    }

    const { data, error } = await supabase
      .from('compliance_api_keys')
      .upsert({
        id: apiKey.id,
        site_id: apiKey.site_id,
        vendor_api_key: apiKey.vendor_api_key,
        user_api_key: apiKey.user_api_key,
        facility_license_number: apiKey.facility_license_number,
        state_code: apiKey.state_code.toUpperCase(),
        is_sandbox: apiKey.is_sandbox || false,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error in upsertComplianceApiKey:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Delete (deactivate) compliance API key
 */
export async function deleteComplianceApiKey(id: string): Promise<{
  error: Error | null
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('compliance_api_keys')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error in deleteComplianceApiKey:', error)
    return { error: error as Error }
  }
}

/**
 * Metrc Sync Log Entry
 */
export interface MetrcSyncLogEntry {
  id: string
  organization_id: string
  site_id: string
  sync_type: string
  direction: 'push' | 'pull' | 'bidirectional'
  operation: string
  metrc_id?: string
  metrc_label?: string
  local_id?: string
  status: string
  started_at: string
  completed_at?: string
  error_message?: string
  error_code?: string
  initiated_by?: string
  retry_count: number
}

/**
 * Get sync logs for a site
 */
export async function getMetrcSyncLog(
  siteId: string,
  syncType?: string
): Promise<{
  data: MetrcSyncLogEntry[] | null
  error: Error | null
}> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('metrc_sync_log')
      .select('*')
      .eq('site_id', siteId)
      .order('started_at', { ascending: false })
      .limit(100)

    if (syncType) {
      query = query.eq('sync_type', syncType)
    }

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error in getMetrcSyncLog:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Create sync log entry
 */
export async function createSyncLogEntry(entry: {
  organization_id: string
  site_id: string
  sync_type: string
  direction: 'push' | 'pull' | 'bidirectional'
  operation: string
  metrc_id?: string
  metrc_label?: string
  local_id?: string
  initiated_by?: string
}): Promise<{
  data: MetrcSyncLogEntry | null
  error: Error | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('metrc_sync_log')
      .insert(entry)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error in createSyncLogEntry:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update sync log entry
 */
export async function updateSyncLogEntry(
  id: string,
  updates: {
    status?: string
    completed_at?: string
    error_message?: string
    error_code?: string
    response_payload?: any
  }
): Promise<{
  error: Error | null
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('metrc_sync_log')
      .update(updates)
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error in updateSyncLogEntry:', error)
    return { error: error as Error }
  }
}
