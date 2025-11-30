/**
 * Alarm Database Queries
 * 
 * Server and client-side queries for alarm management system
 * Handles alarms, alarm policies, notifications, and thresholds
 * 
 * Created: October 29, 2025
 * Phase: 2 - Database Query Functions
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type {
  Alarm,
  AlarmWithDetails,
  AlarmPolicy,
  Notification,
  AlarmFilters,
  InsertAlarm,
  InsertAlarmPolicy,
  UpdateAlarmPolicy,
  QueryResult,
  AlarmSeverity,
} from '@/types/telemetry';

// =====================================================
// SERVER-SIDE QUERIES - ALARMS
// =====================================================

/**
 * Get alarms with optional filtering (server-side)
 * Returns alarms with pod and room details joined
 * 
 * @param filters - Optional filters for alarms
 * @returns Query result with alarms array
 */
export async function getAlarms(
  filters?: AlarmFilters
): Promise<QueryResult<AlarmWithDetails[]>> {
  try {
    const supabase = await createServerClient();
    
    let query = supabase
      .from('alarms')
      .select(`
        *,
        pod:pods!inner(id, name, room_id, room:rooms!inner(id, name, site_id)),
        acknowledged_by_user:users!alarms_acknowledged_by_fkey(id, email, full_name),
        resolved_by_user:users!alarms_resolved_by_fkey(id, email, full_name)
      `)
      .order('triggered_at', { ascending: false });
    
    // Apply filters
    if (filters?.pod_id) {
      query = query.eq('pod_id', filters.pod_id);
    }
    if (filters?.site_id) {
      query = query.eq('pod.room.site_id', filters.site_id);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.status) {
      // Map UI status values to database status values
      // UI: 'active' = database: 'triggered' or 'escalated' (unresolved alarms)
      // UI: 'acknowledged' = database: has acknowledged_at but no resolved_at
      // UI: 'resolved' = database: 'resolved' or has resolved_at
      if (filters.status === 'active') {
        query = query.in('status', ['triggered', 'escalated']);
      } else if (filters.status === 'acknowledged') {
        query = query.not('acknowledged_at', 'is', null).is('resolved_at', null);
      } else if (filters.status === 'resolved') {
        query = query.not('resolved_at', 'is', null);
      }
    }
    if (filters?.triggered_after) {
      query = query.gte('triggered_at', filters.triggered_after);
    }
    if (filters?.triggered_before) {
      query = query.lte('triggered_at', filters.triggered_before);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform nested data to match AlarmWithDetails type
    const transformedData = (data || []).map((alarm: Record<string, unknown>) => {
      const pod = alarm.pod as { id: string; name: string; room_id: string; room?: { id: string; name: string; site_id: string } } | null;
      const room = pod?.room || { id: '', name: 'Unknown', site_id: '' };
      
      return {
        ...alarm,
        pod: pod ? { id: pod.id, name: pod.name, room_id: pod.room_id } : { id: '', name: 'Unknown', room_id: '' },
        room: { id: room.id, name: room.name, site_id: room.site_id },
      };
    });
    
    return { data: transformedData as AlarmWithDetails[], error: null };
  } catch (error) {
    console.error('Error in getAlarms:', error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get active alarms for a pod (server-side)
 * Returns only unacknowledged alarms in triggered/escalated status
 * 
 * @param podId - UUID of the pod
 * @returns Query result with active alarms
 */
export async function getActiveAlarms(
  podId: string
): Promise<QueryResult<Alarm[]>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('alarms')
      .select('*')
      .eq('pod_id', podId)
      .in('status', ['triggered', 'escalated'])
      .eq('acknowledged', false)
      .order('severity', { ascending: false })
      .order('triggered_at', { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getActiveAlarms:', error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get alarm by ID with details (server-side)
 * 
 * @param alarmId - UUID of the alarm
 * @returns Query result with alarm details
 */
export async function getAlarmById(
  alarmId: string
): Promise<QueryResult<AlarmWithDetails | null>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('alarms')
      .select(`
        *,
        pod:pods!inner(id, name, room:rooms!inner(id, name, site_id))
      `)
      .eq('id', alarmId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      throw error;
    }
    
    return { data: data as AlarmWithDetails, error: null };
  } catch (error) {
    console.error('Error in getAlarmById:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Create a new alarm (server-side)
 * Typically called by evaluation system when threshold violated
 * 
 * @param alarm - Alarm data to insert
 * @returns Query result with created alarm
 */
export async function createAlarm(
  alarm: InsertAlarm
): Promise<QueryResult<Alarm>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('alarms')
      .insert(alarm)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from insert');
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in createAlarm:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Acknowledge an alarm (server-side)
 * Sets acknowledged flag and records who acknowledged it
 * 
 * @param alarmId - UUID of the alarm
 * @param userId - UUID of the user acknowledging
 * @returns Query result with updated alarm
 */
export async function acknowledgeAlarm(
  alarmId: string,
  userId: string
): Promise<QueryResult<Alarm>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('alarms')
      .update({
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
        status: 'acknowledged',
      })
      .eq('id', alarmId)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from update');
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in acknowledgeAlarm:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Resolve an alarm (server-side)
 * Sets status to resolved when condition returns to normal
 * 
 * @param alarmId - UUID of the alarm
 * @returns Query result with updated alarm
 */
export async function resolveAlarm(
  alarmId: string
): Promise<QueryResult<Alarm>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('alarms')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alarmId)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from update');
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in resolveAlarm:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get alarm count by severity for a site (server-side)
 * Used for dashboard summary widgets
 * 
 * @param siteId - UUID of the site
 * @returns Counts by severity level
 */
export async function getAlarmCountsBySeverity(
  siteId: string
): Promise<QueryResult<Record<AlarmSeverity, number>>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('alarms')
      .select('severity, pod:pods!inner(room:rooms!inner(site_id))')
      .eq('pod.room.site_id', siteId)
      .in('status', ['triggered', 'escalated'])
      .eq('acknowledged', false);
    
    if (error) throw error;
    
    // Count by severity
    const counts: Record<AlarmSeverity, number> = {
      critical: 0,
      warning: 0,
      info: 0,
    };
    
    data?.forEach((alarm) => {
      if (alarm.severity in counts) {
        counts[alarm.severity as AlarmSeverity]++;
      }
    });
    
    return { data: counts, error: null };
  } catch (error) {
    console.error('Error in getAlarmCountsBySeverity:', error);
    return {
      data: { critical: 0, warning: 0, info: 0 },
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

// =====================================================
// SERVER-SIDE QUERIES - ALARM POLICIES
// =====================================================

/**
 * Get alarm policies for a pod (server-side)
 * Returns active threshold configurations
 * 
 * @param podId - UUID of the pod
 * @returns Query result with alarm policies
 */
export async function getAlarmPolicies(
  podId: string
): Promise<QueryResult<AlarmPolicy[]>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('alarm_policies')
      .select('*')
      .eq('pod_id', podId)
      .eq('is_active', true)
      .order('severity', { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getAlarmPolicies:', error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get all active alarm policies for a site (server-side)
 * Used for batch evaluation across all pods
 * 
 * @param siteId - UUID of the site
 * @returns Query result with all active policies
 */
export async function getSiteAlarmPolicies(
  siteId: string
): Promise<QueryResult<AlarmPolicy[]>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('alarm_policies')
      .select('*, pod:pods!inner(room:rooms!inner(site_id))')
      .eq('pod.room.site_id', siteId)
      .eq('is_active', true)
      .order('severity', { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getSiteAlarmPolicies:', error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Create alarm policy (server-side)
 * 
 * @param policy - Policy data to insert
 * @returns Query result with created policy
 */
export async function createAlarmPolicy(
  policy: InsertAlarmPolicy
): Promise<QueryResult<AlarmPolicy>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('alarm_policies')
      .insert(policy)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from insert');
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in createAlarmPolicy:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Update alarm policy (server-side)
 * 
 * @param policyId - UUID of the policy
 * @param updates - Policy fields to update
 * @returns Query result with updated policy
 */
export async function updateAlarmPolicy(
  policyId: string,
  updates: UpdateAlarmPolicy
): Promise<QueryResult<AlarmPolicy>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('alarm_policies')
      .update(updates)
      .eq('id', policyId)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from update');
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in updateAlarmPolicy:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Delete alarm policy (server-side)
 * Soft delete by setting is_active to false
 * 
 * @param policyId - UUID of the policy
 * @returns Query result with success status
 */
export async function deleteAlarmPolicy(
  policyId: string
): Promise<QueryResult<boolean>> {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('alarm_policies')
      .update({ is_active: false })
      .eq('id', policyId);
    
    if (error) throw error;
    
    return { data: true, error: null };
  } catch (error) {
    console.error('Error in deleteAlarmPolicy:', error);
    return {
      data: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

// =====================================================
// SERVER-SIDE QUERIES - NOTIFICATIONS
// =====================================================

/**
 * Get alarm notifications for a user (server-side)
 * Returns recent notifications with alarm details
 * 
 * @param userId - UUID of the user
 * @param limit - Maximum notifications to return (default: 50)
 * @returns Query result with notifications
 */
export async function getNotifications(
  userId: string,
  limit: number = 50
): Promise<QueryResult<Notification[]>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        alarm:alarms!inner(
          id,
          severity,
          message,
          pod:pods!inner(id, name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return { data: data as Notification[] || [], error: null };
  } catch (error) {
    console.error('Error in getNotifications:', error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get unread notification count (server-side)
 * 
 * @param userId - UUID of the user
 * @returns Query result with count
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<QueryResult<number>> {
  try {
    const supabase = await createServerClient();
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    
    if (error) throw error;
    
    return { data: count || 0, error: null };
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error);
    return {
      data: 0,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Mark notification as read (server-side)
 * 
 * @param notificationId - UUID of the notification
 * @returns Query result with success status
 */
export async function markNotificationRead(
  notificationId: string
): Promise<QueryResult<boolean>> {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);
    
    if (error) throw error;
    
    return { data: true, error: null };
  } catch (error) {
    console.error('Error in markNotificationRead:', error);
    return {
      data: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Mark all notifications as read (server-side)
 * 
 * @param userId - UUID of the user
 * @returns Query result with success status
 */
export async function markAllNotificationsRead(
  userId: string
): Promise<QueryResult<boolean>> {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);
    
    if (error) throw error;
    
    return { data: true, error: null };
  } catch (error) {
    console.error('Error in markAllNotificationsRead:', error);
    return {
      data: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

// =====================================================
// CLIENT-SIDE QUERIES - REALTIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to alarm updates for a pod (client-side)
 * 
 * @param podId - UUID of the pod
 * @param onInsert - Callback for new alarms
 * @param onUpdate - Callback for alarm updates
 * @returns Cleanup function
 */
export function subscribeToAlarms(
  podId: string,
  onInsert?: (alarm: Alarm) => void,
  onUpdate?: (alarm: Alarm) => void
): () => void {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`alarms:${podId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'alarms',
        filter: `pod_id=eq.${podId}`,
      },
      (payload: RealtimePostgresChangesPayload<Alarm>) => {
        if (onInsert) {
          onInsert(payload.new as Alarm);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'alarms',
        filter: `pod_id=eq.${podId}`,
      },
      (payload: RealtimePostgresChangesPayload<Alarm>) => {
        if (onUpdate) {
          onUpdate(payload.new as Alarm);
        }
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to notifications for a user (client-side)
 * 
 * @param userId - UUID of the user
 * @param onInsert - Callback for new notifications
 * @returns Cleanup function
 */
export function subscribeToNotifications(
  userId: string,
  onInsert: (notification: Notification) => void
): () => void {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<Notification>) => {
        onInsert(payload.new as Notification);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Client-side: Acknowledge alarm
 * Wrapper around server function for use in client components
 * 
 * @param alarmId - UUID of the alarm
 * @param userId - UUID of the user
 * @returns Query result
 */
export async function acknowledgeAlarmClient(
  alarmId: string,
  userId: string
): Promise<QueryResult<Alarm>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('alarms')
      .update({
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
        status: 'acknowledged',
      })
      .eq('id', alarmId)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from update');
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in acknowledgeAlarmClient:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

// =====================================================
// RECIPE ADHERENCE CHECKING
// =====================================================

/**
 * Check if telemetry readings are within recipe setpoint ranges
 * Generates alarms for out-of-range values
 * 
 * @param podId - UUID of the pod
 * @param recipeActivationId - Active recipe activation ID
 * @returns Recipe adherence metrics and generated alarms
 */
export async function checkRecipeAdherence(
  podId: string,
  recipeActivationId: string
): Promise<QueryResult<{
  in_range_count: number
  out_of_range_count: number
  critical_deviations: Array<{
    parameter: string
    current_value: number
    target_value: number
    deviation_pct: number
  }>
  alarms_generated: number
}>> {
  try {
    const supabase = await createServerClient()
    
    // Get active recipe setpoints for current stage
    const { data: activation } = await supabase
      .from('recipe_activations')
      .select(`
        id,
        current_stage_index,
        recipe_version:recipe_versions!inner(
          id,
          recipe_stages!inner(
            id,
            order_index,
            environmental_setpoints(
              id,
              parameter_type,
              value,
              min_value,
              max_value,
              unit
            )
          )
        )
      `)
      .eq('id', recipeActivationId)
      .eq('status', 'active')
      .single()
    
    if (!activation) {
      return {
        data: {
          in_range_count: 0,
          out_of_range_count: 0,
          critical_deviations: [],
          alarms_generated: 0,
        },
        error: null,
      }
    }
    
    // Get latest telemetry reading
    const { data: reading } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', podId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()
    
    if (!reading) {
      return {
        data: {
          in_range_count: 0,
          out_of_range_count: 0,
          critical_deviations: [],
          alarms_generated: 0,
        },
        error: null,
      }
    }
    
    // Check each setpoint against current values
    let inRangeCount = 0
    let outOfRangeCount = 0
    const criticalDeviations: Array<{
      parameter: string
      current_value: number
      target_value: number
      deviation_pct: number
    }> = []
    let alarmsGenerated = 0
    
    // Type assertion for nested data structure
    const recipeVersion = activation.recipe_version as unknown as {
      recipe_stages: Array<{
        order_index: number
        environmental_setpoints: Array<{
          id: string
          parameter_type: string
          value: number | null
          min_value: number | null
          max_value: number | null
          unit: string | null
        }>
      }>
    }
    
    // Get setpoints for current stage
    const currentStage = recipeVersion.recipe_stages.find(
      (stage) => stage.order_index === activation.current_stage_index
    )
    
    if (!currentStage) {
      return {
        data: {
          in_range_count: 0,
          out_of_range_count: 0,
          critical_deviations: [],
          alarms_generated: 0,
        },
        error: null,
      }
    }
    
    // Check each environmental setpoint
    for (const setpoint of currentStage.environmental_setpoints) {
      let currentValue: number | null = null
      const targetValue: number | null = setpoint.value
      const minValue: number | null = setpoint.min_value
      const maxValue: number | null = setpoint.max_value
      
      // Map parameter to telemetry field
      switch (setpoint.parameter_type) {
        case 'temperature':
          currentValue = reading.temperature_c
          break
        case 'humidity':
          currentValue = reading.humidity_pct
          break
        case 'co2':
          currentValue = reading.co2_ppm
          break
        case 'vpd':
          currentValue = reading.vpd_kpa
          break
        case 'light_intensity':
          currentValue = reading.light_intensity_ppfd
          break
        default:
          continue
      }
      
      if (currentValue === null) continue
      
      // Determine if in range
      let isInRange = false
      let deviation = 0
      let deviationPct = 0
      
      if (minValue !== null && maxValue !== null) {
        isInRange = currentValue >= minValue && currentValue <= maxValue
        if (targetValue !== null) {
          deviation = currentValue - targetValue
          deviationPct = (deviation / targetValue) * 100
        }
      } else if (targetValue !== null) {
        // Use ±10% tolerance if no range specified
        const tolerance = targetValue * 0.1
        isInRange = Math.abs(currentValue - targetValue) <= tolerance
        deviation = currentValue - targetValue
        deviationPct = (deviation / targetValue) * 100
      }
      
      if (isInRange) {
        inRangeCount++
      } else {
        outOfRangeCount++
        
        // Track critical deviations (>20%)
        if (Math.abs(deviationPct) > 20 && targetValue !== null) {
          criticalDeviations.push({
            parameter: setpoint.parameter_type,
            current_value: currentValue,
            target_value: targetValue,
            deviation_pct: deviationPct,
          })
          
          // Generate alarm for critical deviation
          const severity: AlarmSeverity = Math.abs(deviationPct) > 30 ? 'critical' : 'warning'
          
          // Check if alarm already exists for this condition (within last 5 minutes)
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
          const { data: existingAlarms } = await supabase
            .from('alarms')
            .select('id')
            .eq('pod_id', podId)
            .eq('alarm_type', `recipe_deviation_${setpoint.parameter_type}`)
            .eq('status', 'triggered')
            .gte('triggered_at', fiveMinutesAgo)
            .limit(1)
          
          if (!existingAlarms || existingAlarms.length === 0) {
            // Create new alarm
            const { error: alarmError } = await supabase
              .from('alarms')
              .insert({
                pod_id: podId,
                alarm_type: `recipe_deviation_${setpoint.parameter_type}`,
                severity,
                message: `${setpoint.parameter_type} is ${deviationPct > 0 ? 'above' : 'below'} recipe target by ${Math.abs(deviationPct).toFixed(1)}%`,
                metadata: {
                  parameter: setpoint.parameter_type,
                  current_value: currentValue,
                  target_value: targetValue,
                  deviation_pct: deviationPct,
                  recipe_activation_id: recipeActivationId,
                  setpoint_id: setpoint.id,
                },
                status: 'triggered',
                triggered_at: new Date().toISOString(),
              })
            
            if (!alarmError) {
              alarmsGenerated++
            }
          }
        }
      }
    }
    
    return {
      data: {
        in_range_count: inRangeCount,
        out_of_range_count: outOfRangeCount,
        critical_deviations: criticalDeviations,
        alarms_generated: alarmsGenerated,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error checking recipe adherence:', error)
    return {
      data: {
        in_range_count: 0,
        out_of_range_count: 0,
        critical_deviations: [],
        alarms_generated: 0,
      },
      error: error instanceof Error ? error : new Error('Unknown error'),
    }
  }
}
