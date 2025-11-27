/**
 * Metrc Location Resolver (Pod-Based)
 *
 * Resolves TRAZO batch → pod → Metrc location
 */

import { createClient } from '@/lib/supabase/server'

export interface LocationResolutionResult {
  metrcLocation: string | null
  source: 'pod_mapping' | 'room_name' | 'site_default' | 'none'
  podName?: string
  roomName?: string
  requiresManualInput: boolean
}

/**
 * Resolve Metrc location for a batch
 *
 * Resolution order:
 * 1. Check if batch is assigned to a pod
 * 2. Use pod's metrc_location_name if configured
 * 3. Fall back to site's default_metrc_location
 * 4. Return null if no mapping exists (requires manual input)
 *
 * @param batchId - The batch ID to resolve location for
 * @returns Location resolution result
 */
export async function resolveMetrcLocationForBatch(
  batchId: string
): Promise<LocationResolutionResult> {
  try {
    const supabase = await createClient()

    // Get batch with current pod assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('batch_pod_assignments')
      .select(`
        pod_id,
        pod:pods!inner (
          id,
          name,
          metrc_location_name,
          room:rooms!inner (
            id,
            name,
            site:sites!inner (
              id,
              default_metrc_location
            )
          )
        )
      `)
      .eq('batch_id', batchId)
      .is('removed_at', null)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (assignmentError) {
      console.error('Error fetching batch assignment:', assignmentError)
      return await resolveSiteDefaultLocation(batchId)
    }

    if (!assignment) {
      // Batch not assigned to a pod, use site default
      return await resolveSiteDefaultLocation(batchId)
    }

    // Extract nested data (handle Supabase array responses)
    const pod = Array.isArray(assignment.pod) ? assignment.pod[0] : assignment.pod
    if (!pod) {
      return await resolveSiteDefaultLocation(batchId)
    }

    const room = Array.isArray(pod.room) ? pod.room[0] : pod.room
    if (!room) {
      return await resolveSiteDefaultLocation(batchId)
    }

    const site = Array.isArray(room.site) ? room.site[0] : room.site

    // Priority 1: Pod's explicit Metrc location mapping
    if (pod.metrc_location_name) {
      return {
        metrcLocation: pod.metrc_location_name,
        source: 'pod_mapping',
        podName: pod.name,
        roomName: room.name,
        requiresManualInput: false,
      }
    }

    // Priority 2: Use room name as Metrc location (rooms typically map to Metrc locations)
    if (room.name) {
      return {
        metrcLocation: room.name,
        source: 'room_name',
        podName: pod.name,
        roomName: room.name,
        requiresManualInput: false,
      }
    }

    // Priority 3: Site's default Metrc location
    if (site && site.default_metrc_location) {
      return {
        metrcLocation: site.default_metrc_location,
        source: 'site_default',
        podName: pod.name,
        roomName: room.name,
        requiresManualInput: false,
      }
    }

    // No mapping configured
    return {
      metrcLocation: null,
      source: 'none',
      podName: pod.name,
      roomName: room.name,
      requiresManualInput: true,
    }
  } catch (error) {
    console.error('Error resolving Metrc location:', error)
    return {
      metrcLocation: null,
      source: 'none',
      requiresManualInput: true,
    }
  }
}

/**
 * Resolve site default location for batches without pod assignment
 */
async function resolveSiteDefaultLocation(batchId: string): Promise<LocationResolutionResult> {
  try {
    const supabase = await createClient()

    const { data: batch, error } = await supabase
      .from('batches')
      .select(`
        site_id,
        site:sites!inner (
          default_metrc_location
        )
      `)
      .eq('id', batchId)
      .single()

    if (error || !batch) {
      return {
        metrcLocation: null,
        source: 'none',
        requiresManualInput: true,
      }
    }

    const site = Array.isArray(batch.site) ? batch.site[0] : batch.site

    if (site && site.default_metrc_location) {
      return {
        metrcLocation: site.default_metrc_location,
        source: 'site_default',
        requiresManualInput: false,
      }
    }

    return {
      metrcLocation: null,
      source: 'none',
      requiresManualInput: true,
    }
  } catch (error) {
    console.error('Error resolving site default location:', error)
    return {
      metrcLocation: null,
      source: 'none',
      requiresManualInput: true,
    }
  }
}

/**
 * Get all Metrc location mappings for a site
 *
 * @param siteId - The site ID
 * @returns Array of pod mappings
 */
export async function getMetrcLocationMappings(siteId: string): Promise<{
  data: Array<{
    podId: string
    podName: string
    roomName: string
    metrcLocationName: string | null
    activeBatches: number
  }> | null
  error: Error | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('metrc_location_mappings')
      .select('*')
      .eq('site_id', siteId)
      .order('room_name')
      .order('pod_name')

    if (error) throw error

    const mappings = (data || []).map((row: any) => ({
      podId: row.pod_id,
      podName: row.pod_name,
      roomName: row.room_name,
      metrcLocationName: row.metrc_location_name,
      activeBatches: row.active_batches || 0,
    }))

    return { data: mappings, error: null }
  } catch (error) {
    console.error('Error getting Metrc location mappings:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update pod's Metrc location mapping
 *
 * @param podId - The pod ID
 * @param metrcLocationName - The Metrc location name (or null to remove)
 * @returns Success status
 */
export async function updatePodMetrcLocation(
  podId: string,
  metrcLocationName: string | null
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('pods')
      .update({
        metrc_location_name: metrcLocationName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', podId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating pod Metrc location:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Update site's default Metrc location
 *
 * @param siteId - The site ID
 * @param defaultMetrcLocation - The default Metrc location name (or null to remove)
 * @returns Success status
 */
export async function updateSiteDefaultMetrcLocation(
  siteId: string,
  defaultMetrcLocation: string | null
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('sites')
      .update({
        default_metrc_location: defaultMetrcLocation,
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating site default Metrc location:', error)
    return { success: false, error: error as Error }
  }
}
