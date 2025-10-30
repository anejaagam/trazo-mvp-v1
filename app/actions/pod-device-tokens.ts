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
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'
import { getOrCreateDefaultRoom } from '@/lib/supabase/queries/default-room'

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
      return null
    }
    
    // Check permissions (org:integrations or user:create for admin roles)
    if (!canPerformAction(userData.role, 'org:integrations') && 
        !canPerformAction(userData.role, 'user:create')) {
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
 * Automatically assigns to default room/site
 */
export async function createPodWithToken(
  podName: string,
  deviceToken: string
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

    // Get or create default site for the organization
    const { data: siteData } = await supabase
      .from('sites')
      .select('id')
      .eq('organization_id', userAuth.organizationId)
      .limit(1)
      .single()

    let siteId: string

    if (!siteData) {
      // Create default site if none exists
      const { data: newSite, error: siteError } = await supabase
        .from('sites')
        .insert({
          organization_id: userAuth.organizationId,
          name: 'Main Facility',
          site_type: 'indoor',
          is_active: true,
        })
        .select('id')
        .single()

      if (siteError || !newSite) {
        return { success: false, error: 'Failed to create default site' }
      }
      
      siteId = newSite.id
    } else {
      siteId = siteData.id
    }

    // Get or create default room
    const roomId = await getOrCreateDefaultRoom(siteId)

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
