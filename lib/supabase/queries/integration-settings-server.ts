/**
 * Integration Settings Server-Side Queries
 * 
 * Server-only version for API routes and server components
 * Uses server-side Supabase client with service role key
 */

import { createClient } from '@/lib/supabase/server'
import type { QueryResult } from './integration-settings'

/**
 * Get TagoIO token for organization (Server-side)
 * Used by polling service in API routes
 * 
 * @param organizationId - Organization UUID
 * @returns Query result with device token string or null
 */
export async function getTagoIOTokenServer(
  organizationId: string
): Promise<QueryResult<string>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('integration_settings')
      .select('api_token')
      .eq('organization_id', organizationId)
      .eq('integration_type', 'tagoio')
      .eq('is_active', true)
      .single()

    if (error) throw error
    
    if (!data || !data.api_token) {
      return { data: null, error: new Error('TagoIO token not configured') }
    }

    return { data: data.api_token, error: null }
  } catch (error) {
    console.error(`Error getting TagoIO token for org ${organizationId}:`, error)
    return { data: null, error: error as Error }
  }
}
