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
        pod:pods!inner(id, name, room:rooms!inner(id, name, site_id))
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
      query = query.eq('status', filters.status);
    }
    if (filters?.triggered_after) {
      query = query.gte('triggered_at', filters.triggered_after);
    }
    if (filters?.triggered_before) {
      query = query.lte('triggered_at', filters.triggered_before);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data: data as AlarmWithDetails[] || [], error: null };
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
