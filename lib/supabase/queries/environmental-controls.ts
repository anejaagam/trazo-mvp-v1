/**
 * Environmental Controls Database Queries
 * 
 * CRUD operations for control overrides, schedules, and batch groups
 * with precedence-based override management
 */

import { createClient } from '@/lib/supabase/server'
import type {
  ControlOverrideFilters,
  InsertControlOverride,
  UpdateControlOverride,
  ControlOverrideWithDetails,
  Schedule,
  BatchGroup,
  RecipeScopeType,
  SetpointParameterType,
  EnvironmentalSetpoint,
} from '@/types/recipe'

/**
 * Get control overrides with optional filtering
 */
export async function getControlOverrides(
  organizationId: string,
  filters?: ControlOverrideFilters
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('control_overrides')
      .select('*')
      .eq('organization_id', organizationId)
      .order('priority_level', { ascending: false })
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.scope_type) {
      query = query.eq('scope_type', filters.scope_type)
    }
    if (filters?.scope_id) {
      query = query.eq('scope_id', filters.scope_id)
    }
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }
    if (filters?.parameter_type) {
      query = query.eq('parameter_type', filters.parameter_type)
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters?.is_active) {
      query = query.eq('status', 'active')
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getControlOverrides:', error)
    return { data: null, error }
  }
}

/**
 * Get control override by ID with user details
 */
export async function getControlOverrideById(
  overrideId: string
): Promise<{ data: ControlOverrideWithDetails | null; error: unknown }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('control_overrides')
      .select(`
        *,
        created_by_user:users!created_by(email, full_name),
        cancelled_by_user:users!cancelled_by(email, full_name)
      `)
      .eq('id', overrideId)
      .single()

    if (error) throw error
    
    if (!data) return { data: null, error: null }

    const override: ControlOverrideWithDetails = {
      ...data,
      created_by_user: data.created_by_user?.[0] || undefined,
      cancelled_by_user: data.cancelled_by_user?.[0] || undefined,
    }

    return { data: override, error: null }
  } catch (error) {
    console.error('Error in getControlOverrideById:', error)
    return { data: null, error }
  }
}

/**
 * Get active overrides for a specific scope
 */
export async function getActiveOverridesForScope(
  scopeType: RecipeScopeType,
  scopeId: string
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('control_overrides')
      .select('*')
      .eq('scope_type', scopeType)
      .eq('scope_id', scopeId)
      .eq('status', 'active')
      .order('priority_level', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getActiveOverridesForScope:', error)
    return { data: null, error }
  }
}

/**
 * Create a control override
 */
export async function createControlOverride(
  overrideData: InsertControlOverride
) {
  try {
    const supabase = await createClient()
    
    // Calculate priority level based on priority type
    const priorityLevels = {
      emergency: 1000,
      manual: 500,
      scheduled: 300,
      recipe: 100,
      default: 50,
    }
    
    const priorityLevel = priorityLevels[overrideData.priority]
    
    // Calculate expires_at if TTL is provided
    const expiresAt = overrideData.ttl_minutes
      ? new Date(Date.now() + overrideData.ttl_minutes * 60000).toISOString()
      : null

    const { data, error } = await supabase
      .from('control_overrides')
      .insert({
        ...overrideData,
        priority_level: priorityLevel,
        status: 'active',
        start_time: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in createControlOverride:', error)
    return { data: null, error }
  }
}

/**
 * Update a control override
 */
export async function updateControlOverride(
  overrideId: string,
  updates: UpdateControlOverride
) {
  try {
    const supabase = await createClient()
    
    // Recalculate expires_at if TTL changed
    let expiresAt: string | null | undefined
    if (updates.ttl_minutes !== undefined) {
      expiresAt = updates.ttl_minutes
        ? new Date(Date.now() + updates.ttl_minutes * 60000).toISOString()
        : null
    }

    const { data, error } = await supabase
      .from('control_overrides')
      .update({
        ...updates,
        ...(expiresAt !== undefined && { expires_at: expiresAt }),
      })
      .eq('id', overrideId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in updateControlOverride:', error)
    return { data: null, error }
  }
}

/**
 * Cancel a control override
 */
export async function cancelControlOverride(
  overrideId: string,
  userId: string,
  reason?: string
) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('control_overrides')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
        cancellation_reason: reason,
      })
      .eq('id', overrideId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in cancelControlOverride:', error)
    return { data: null, error }
  }
}

/**
 * Expire old overrides (called by scheduled job or manually)
 */
export async function expireOldOverrides() {
  try {
    const supabase = await createClient()
    
    // Use database function
    const { error } = await supabase.rpc('auto_expire_overrides')

    if (error) throw error
    return { data: true, error: null }
  } catch (error) {
    console.error('Error in expireOldOverrides:', error)
    return { data: null, error }
  }
}

/**
 * Get control history (logs) for an override
 */
export async function getControlHistory(overrideId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('control_logs')
      .select('*')
      .eq('override_id', overrideId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getControlHistory:', error)
    return { data: null, error }
  }
}

/**
 * Get effective setpoint value for a parameter considering overrides
 * This returns the highest priority value from recipe or overrides
 */
export async function getEffectiveSetpoint(
  scopeType: RecipeScopeType,
  scopeId: string,
  parameterType: SetpointParameterType
) {
  try {
    const supabase = await createClient()
    
    // Get active overrides for this parameter
    const { data: overrides, error: overridesError } = await supabase
      .from('control_overrides')
      .select('*')
      .eq('scope_type', scopeType)
      .eq('scope_id', scopeId)
      .eq('parameter_type', parameterType)
      .eq('status', 'active')
      .order('priority_level', { ascending: false })
      .limit(1)

    if (overridesError) throw overridesError

    // If there's an active override, return it
    if (overrides && overrides.length > 0) {
      return {
        data: {
          value: overrides[0].override_value,
          unit: overrides[0].unit,
          source: 'override',
          priority: overrides[0].priority,
          override_id: overrides[0].id,
        },
        error: null,
      }
    }

    // Otherwise get from active recipe
    const { data: activation, error: activationError } = await supabase
      .from('recipe_activations')
      .select(`
        current_stage_id,
        current_stage:recipe_stages!current_stage_id(
          setpoints:environmental_setpoints(*)
        )
      `)
      .eq('scope_type', scopeType)
      .eq('scope_id', scopeId)
      .eq('is_active', true)
      .single()

    if (activationError) {
      if (activationError.code === 'PGRST116') {
        // No active recipe
        return { data: null, error: null }
      }
      throw activationError
    }

    if (!activation?.current_stage || !Array.isArray(activation.current_stage)) {
      return { data: null, error: null }
    }

    const stageData = activation.current_stage[0]
    if (!stageData?.setpoints) {
      return { data: null, error: null }
    }

    const setpoint = (stageData.setpoints as EnvironmentalSetpoint[]).find(
      (sp) => sp.parameter_type === parameterType
    )

    if (!setpoint) {
      return { data: null, error: null }
    }

    return {
      data: {
        value: setpoint.value || setpoint.day_value || setpoint.night_value,
        day_value: setpoint.day_value,
        night_value: setpoint.night_value,
        unit: setpoint.unit,
        source: 'recipe',
        priority: 'recipe',
        setpoint_id: setpoint.id,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error in getEffectiveSetpoint:', error)
    return { data: null, error }
  }
}

// =====================================================
// Schedule Management
// =====================================================

/**
 * Get schedules for an organization
 */
export async function getSchedules(organizationId: string, siteId?: string) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('schedules')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (siteId) {
      query = query.or(`site_id.is.null,site_id.eq.${siteId}`)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getSchedules:', error)
    return { data: null, error }
  }
}

/**
 * Get schedule by ID
 */
export async function getScheduleById(scheduleId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getScheduleById:', error)
    return { data: null, error }
  }
}

/**
 * Create a schedule
 */
export async function createSchedule(scheduleData: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('schedules')
      .insert(scheduleData)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in createSchedule:', error)
    return { data: null, error }
  }
}

/**
 * Update a schedule
 */
export async function updateSchedule(
  scheduleId: string,
  updates: Partial<Omit<Schedule, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('schedules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in updateSchedule:', error)
    return { data: null, error }
  }
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(scheduleId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) throw error
    return { data: true, error: null }
  } catch (error) {
    console.error('Error in deleteSchedule:', error)
    return { data: null, error }
  }
}

// =====================================================
// Batch Group Management
// =====================================================

/**
 * Get batch groups for a site
 */
export async function getBatchGroups(organizationId: string, siteId?: string) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('batch_groups')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getBatchGroups:', error)
    return { data: null, error }
  }
}

/**
 * Get batch group by ID
 */
export async function getBatchGroupById(groupId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('batch_groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getBatchGroupById:', error)
    return { data: null, error }
  }
}

/**
 * Create a batch group
 */
export async function createBatchGroup(groupData: Omit<BatchGroup, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('batch_groups')
      .insert(groupData)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in createBatchGroup:', error)
    return { data: null, error }
  }
}

/**
 * Update a batch group
 */
export async function updateBatchGroup(
  groupId: string,
  updates: Partial<Omit<BatchGroup, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('batch_groups')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in updateBatchGroup:', error)
    return { data: null, error }
  }
}

/**
 * Delete a batch group
 */
export async function deleteBatchGroup(groupId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('batch_groups')
      .delete()
      .eq('id', groupId)

    if (error) throw error
    return { data: true, error: null }
  } catch (error) {
    console.error('Error in deleteBatchGroup:', error)
    return { data: null, error }
  }
}
