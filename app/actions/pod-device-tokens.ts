/**
 * Server Actions for Pod Device Token Management
 * 
 * Handles CRUD operations for pod TagoIO device tokens with RBAC
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { 
  getPodsByOrganization, 
  updatePodDeviceToken, 
  validatePodOwnership,
  checkDeviceIdAvailability,
  type PodWithSiteInfo 
} from '@/lib/supabase/queries/pods'
import { validateTagoIOCredentials } from '@/lib/supabase/queries/integration-settings'
import { initializeEquipmentControls } from '@/lib/supabase/queries/equipment-controls'

// ============================================================================
// Response Types
// ============================================================================

interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// Authorization Helper
// ============================================================================

/**
 * Get current user's organization ID and validate permissions
 * Only org_admin and site_manager can manage pod device tokens
 */
async function validateUserPermissions(): Promise<{
  userId: string
  organizationId: string
  role: string
} | null> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return null
    }
    
    // Get user's organization and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData?.organization_id || !userData?.role) {
      console.error('validateUserPermissions: Missing organization or role', { userError, organizationId: userData?.organization_id, role: userData?.role })
      return null
    }
    
    // Check permissions (org:integrations or user:create for admin roles)
    const hasOrgIntegrations = canPerformAction(userData.role, 'org:integrations')
    const hasUserCreate = canPerformAction(userData.role, 'user:create')
    
    if (!hasOrgIntegrations.allowed && !hasUserCreate.allowed) {
      console.error('validateUserPermissions: Insufficient permissions', { role: userData.role, hasOrgIntegrations, hasUserCreate })
      return null
    }
    
    return {
      userId: user.id,
      organizationId: userData.organization_id,
      role: userData.role,
    }
  } catch (error) {
    console.error('Error validating user permissions:', error)
    return null
  }
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get all active rooms for the current user's organization
 */
export async function getOrganizationRooms(): Promise<ActionResponse<Array<{
  id: string
  name: string
  site_id: string
  site_name: string
  room_type: string
  capacity_pods?: number
  pod_count?: number
}>>> {
  try {
    const userAuth = await validateUserPermissions()
    if (!userAuth) {
      console.error('getOrganizationRooms: User validation failed')
      return { success: false, error: 'Unauthorized' }
    }

    console.log('getOrganizationRooms: Fetching rooms for org:', userAuth.organizationId)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('rooms')
      .select(`
        id,
        name,
        site_id,
        room_type,
        capacity_pods,
        sites!inner (
          id,
          name,
          organization_id
        )
      `)
      .eq('sites.organization_id', userAuth.organizationId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('getOrganizationRooms: Query error:', error)
      return { success: false, error: error.message }
    }

    console.log('getOrganizationRooms: Found', data?.length || 0, 'rooms')

    // Get pod counts for each room
    const { data: podCounts } = await supabase
      .from('pods')
      .select('room_id')
      .eq('is_active', true)

    const podCountMap = new Map<string, number>()
    podCounts?.forEach(pod => {
      podCountMap.set(pod.room_id, (podCountMap.get(pod.room_id) || 0) + 1)
    })

    const rooms = data?.map(room => ({
      id: room.id,
      name: room.name,
      site_id: room.site_id,
      site_name: (room.sites as unknown as { name: string }).name,
      room_type: room.room_type,
      capacity_pods: room.capacity_pods,
      pod_count: podCountMap.get(room.id) || 0,
    })) || []

    // Sort by site name first, then room name (client-side since Supabase can't order by joined columns)
    rooms.sort((a, b) => {
      const siteCompare = a.site_name.localeCompare(b.site_name)
      if (siteCompare !== 0) return siteCompare
      return a.name.localeCompare(b.name)
    })

    return { success: true, data: rooms }
  } catch (error) {
    console.error('Error in getOrganizationRooms:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch rooms',
    }
  }
}

/**
 * Get all pods for the current user's organization
 */
export async function getOrganizationPods(): Promise<ActionResponse<PodWithSiteInfo[]>> {
  try {
    const userAuth = await validateUserPermissions()
    if (!userAuth) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const { data, error } = await getPodsByOrganization(userAuth.organizationId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getOrganizationPods:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch pods' 
    }
  }
}

/**
 * Update a pod's TagoIO device token
 * Validates device token with TagoIO API before saving
 */
export async function updatePodDeviceId(
  podId: string,
  deviceToken: string
): Promise<ActionResponse<{ podId: string; deviceId: string; deviceName: string }>> {
  try {
    const userAuth = await validateUserPermissions()
    if (!userAuth) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Validate pod ownership
    const { isValid: ownsPod } = await validatePodOwnership(podId, userAuth.organizationId)
    if (!ownsPod) {
      return { success: false, error: 'Pod not found or access denied' }
    }
    
    // Validate device token with TagoIO API
    const { data: validationResult, error: validationError } = await validateTagoIOCredentials(deviceToken)
    
    if (validationError || !validationResult?.isValid) {
      return { 
        success: false, 
        error: validationResult?.error || 'Invalid device token' 
      }
    }
    
    if (!validationResult.deviceId) {
      return { success: false, error: 'Device ID not returned from TagoIO' }
    }
    
    // Check if device ID is already in use
    const { isAvailable } = await checkDeviceIdAvailability(validationResult.deviceId, podId)
    if (!isAvailable) {
      return { 
        success: false, 
        error: 'This device ID is already in use by another pod' 
      }
    }
    
    // Update pod with device ID and token
    const { data: updatedPod, error: updateError } = await updatePodDeviceToken(
      podId, 
      validationResult.deviceId,
      deviceToken  // Store the actual device token
    )
    
    if (updateError || !updatedPod) {
      return { 
        success: false, 
        error: updateError?.message || 'Failed to update pod' 
      }
    }
    
    return { 
      success: true, 
      data: {
        podId: updatedPod.id,
        deviceId: validationResult.deviceId,
        deviceName: validationResult.deviceName || 'Unknown Device',
      }
    }
  } catch (error) {
    console.error('Error in updatePodDeviceId:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update pod device token' 
    }
  }
}

/**
 * Remove a pod's TagoIO device token
 */
export async function removePodDeviceId(podId: string): Promise<ActionResponse<{ podId: string }>> {
  try {
    const userAuth = await validateUserPermissions()
    if (!userAuth) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Validate pod ownership
    const { isValid: ownsPod } = await validatePodOwnership(podId, userAuth.organizationId)
    if (!ownsPod) {
      return { success: false, error: 'Pod not found or access denied' }
    }
    
    // Remove device ID (set to null)
    const { data: updatedPod, error: updateError } = await updatePodDeviceToken(podId, null)
    
    if (updateError || !updatedPod) {
      return { 
        success: false, 
        error: updateError?.message || 'Failed to remove device token' 
      }
    }
    
    return { success: true, data: { podId: updatedPod.id } }
  } catch (error) {
    console.error('Error in removePodDeviceId:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove device token' 
    }
  }
}

/**
 * Validate a device token without saving
 * Used for testing connection before committing
 */
export async function validateDeviceToken(
  deviceToken: string
): Promise<ActionResponse<{ deviceId: string; deviceName: string }>> {
  try {
    const userAuth = await validateUserPermissions()
    if (!userAuth) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const { data: validationResult, error: validationError } = await validateTagoIOCredentials(deviceToken)
    
    if (validationError || !validationResult?.isValid) {
      return { 
        success: false, 
        error: validationResult?.error || 'Invalid device token' 
      }
    }
    
    if (!validationResult.deviceId) {
      return { success: false, error: 'Device ID not returned from TagoIO' }
    }
    
    // Check if device ID is available
    const { isAvailable } = await checkDeviceIdAvailability(validationResult.deviceId)
    if (!isAvailable) {
      return { 
        success: false, 
        error: 'This device ID is already in use by another pod' 
      }
    }
    
    return { 
      success: true, 
      data: {
        deviceId: validationResult.deviceId,
        deviceName: validationResult.deviceName || 'Unknown Device',
      }
    }
  } catch (error) {
    console.error('Error in validateDeviceToken:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to validate device token' 
    }
  }
}

/**
 * Create a new pod with device token
 * Requires roomId - user must select a room before creating pod
 */
export async function createPodWithToken(
  podName: string,
  deviceToken: string,
  roomId: string
): Promise<ActionResponse<{ podId: string; podName: string }>> {
  try {
    const userAuth = await validateUserPermissions()
    if (!userAuth) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Validate device token first
    const validation = await validateDeviceToken(deviceToken)
    if (!validation.success || !validation.data) {
      return { success: false, error: validation.error || 'Invalid device token' }
    }

    // Validate room exists and belongs to user's organization
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('id, site_id, sites!inner(organization_id)')
      .eq('id', roomId)
      .eq('is_active', true)
      .single()

    if (roomError || !roomData) {
      return { success: false, error: 'Invalid room selection' }
    }

    const roomOrganizationId = (roomData.sites as unknown as { organization_id: string }).organization_id

    if (roomOrganizationId !== userAuth.organizationId) {
      return { success: false, error: 'Room does not belong to your organization' }
    }

    // Create the pod
    const { data: newPod, error: podError } = await supabase
      .from('pods')
      .insert({
        room_id: roomId,
        name: podName,
        tagoio_device_id: validation.data.deviceId,
        tagoio_device_token: deviceToken,
        is_active: true,
      })
      .select('id, name')
      .single()

    if (podError || !newPod) {
      return { success: false, error: 'Failed to create pod' }
    }

    // Initialize equipment controls automatically
    const equipmentResult = await initializeEquipmentControls(newPod.id)
    if (equipmentResult.error) {
      console.error('Warning: Failed to initialize equipment controls:', equipmentResult.error)
      // Don't fail pod creation if equipment init fails, just log it
    }

    return {
      success: true,
      data: {
        podId: newPod.id,
        podName: newPod.name,
      },
    }
  } catch (error) {
    console.error('Error in createPodWithToken:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create pod',
    }
  }
}
