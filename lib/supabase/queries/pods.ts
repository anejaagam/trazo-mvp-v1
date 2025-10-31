/**
 * Pod Database Queries
 * 
 * Functions for managing pods (cultivation units) within sites
 */

import { createClient } from '@/lib/supabase/server'

export interface PodRecord {
  id: string
  room_id: string | null
  name: string
  tagoio_device_id: string | null
  tagoio_device_token: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PodWithSiteInfo extends PodRecord {
  room?: {
    name: string
    site: {
      id: string
      name: string
      organization_id: string
    } | {
      id: string
      name: string
      organization_id: string
    }[]
  } | {
    name: string
    site: {
      id: string
      name: string
      organization_id: string
    } | {
      id: string
      name: string
      organization_id: string
    }[]
  }[] | null
}

/**
 * Get all pods for an organization
 * Includes room and site information
 * 
 * @param organizationId - UUID of the organization
 * @returns Query result with array of pods
 */
export async function getPodsByOrganization(
  organizationId: string
): Promise<{ data: PodWithSiteInfo[] | null; error: Error | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('pods')
      .select(`
        id,
        room_id,
        name,
        tagoio_device_id,
        tagoio_device_token,
        is_active,
        created_at,
        updated_at,
        room:rooms(
          name,
          site:sites!inner(
            id,
            name,
            organization_id
          )
        )
      `)
      .eq('room.site.organization_id', organizationId)
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    
    return { data: data as PodWithSiteInfo[], error: null }
  } catch (error) {
    console.error('Error in getPodsByOrganization:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get all active pods for a site
 * 
 * @param siteId - UUID of the site
 * @returns Query result with array of pods
 */
export async function getPodsBySite(
  siteId: string
): Promise<{ data: PodRecord[] | null; error: Error | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('pods')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    
    return { data: data as PodRecord[], error: null }
  } catch (error) {
    console.error('Error in getPodsBySite:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get a single pod by ID
 * 
 * @param podId - UUID of the pod
 * @returns Query result with pod record
 */
export async function getPodById(
  podId: string
): Promise<{ data: PodWithSiteInfo | null; error: Error | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('pods')
      .select(`
        id,
        site_id,
        room_id,
        name,
        tagoio_device_id,
        tagoio_device_token,
        is_active,
        created_at,
        updated_at,
        room:rooms(
          name,
          site:sites(
            id,
            name,
            organization_id
          )
        )
      `)
      .eq('id', podId)
      .single()
    
    if (error) throw error
    
    return { data: data as PodWithSiteInfo, error: null }
  } catch (error) {
    console.error('Error in getPodById:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update pod device token (TagoIO device ID and token)
 * 
 * @param podId - UUID of the pod
 * @param deviceId - TagoIO device ID (can be null to remove)
 * @param deviceToken - TagoIO device authentication token (can be null to remove)
 * @returns Query result with updated pod record
 */
export async function updatePodDeviceToken(
  podId: string,
  deviceId: string | null,
  deviceToken: string | null = null
): Promise<{ data: PodRecord | null; error: Error | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('pods')
      .update({
        tagoio_device_id: deviceId,
        tagoio_device_token: deviceToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', podId)
      .select()
      .single()
    
    if (error) throw error
    
    return { data: data as PodRecord, error: null }
  } catch (error) {
    console.error('Error in updatePodDeviceToken:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Validate that a pod belongs to the specified organization
 * Used for authorization checks
 * 
 * @param podId - UUID of the pod
 * @param organizationId - UUID of the organization
 * @returns True if pod belongs to organization, false otherwise
 */
export async function validatePodOwnership(
  podId: string,
  organizationId: string
): Promise<{ isValid: boolean; error: Error | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('pods')
      .select(`
        id,
        room:rooms!inner(
          site:sites!inner(
            organization_id
          )
        )
      `)
      .eq('id', podId)
      .single()
    
    if (error) throw error
    
    // Type assertion for nested structure - handle array response from Supabase
    const pod = data as unknown as { room: { site: { organization_id: string }[] }[] }
    const orgId = pod.room?.[0]?.site?.[0]?.organization_id
    const isValid = orgId === organizationId
    
    return { isValid, error: null }
  } catch (error) {
    console.error('Error in validatePodOwnership:', error)
    return { isValid: false, error: error as Error }
  }
}

/**
 * Check if a TagoIO device ID is already in use by another pod
 * 
 * @param deviceId - TagoIO device ID to check
 * @param excludePodId - Optional pod ID to exclude from check (for updates)
 * @returns Query result indicating if device ID is available
 */
export async function checkDeviceIdAvailability(
  deviceId: string,
  excludePodId?: string
): Promise<{ isAvailable: boolean; error: Error | null }> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('pods')
      .select('id')
      .eq('tagoio_device_id', deviceId)
      .eq('is_active', true)
    
    if (excludePodId) {
      query = query.neq('id', excludePodId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return { isAvailable: !data || data.length === 0, error: null }
  } catch (error) {
    console.error('Error in checkDeviceIdAvailability:', error)
    return { isAvailable: false, error: error as Error }
  }
}
