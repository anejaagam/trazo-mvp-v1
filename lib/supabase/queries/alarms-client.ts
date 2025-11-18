/**
 * Alarm Client-Side Queries
 * 
 * Client-side only queries for alarm management
 * Use this file for hooks and client components
 * 
 * Created: October 29, 2025
 * Phase: 2 - Database Query Functions (Client Split)
 */

'use client';

import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type {
  Alarm,
  AlarmFilters,
  AlarmSeverity,
  AlarmWithDetails,
  Notification,
  QueryResult,
} from '@/types/telemetry';

// =====================================================
// CLIENT-SIDE QUERIES - FETCH HELPERS
// =====================================================

/**
 * Fetch alarms with optional filtering (client-side)
 * Mirrors the server-side getAlarms query for use in hooks/components
 */
export async function getAlarmsClient(
  filters?: AlarmFilters
): Promise<QueryResult<AlarmWithDetails[]>> {
  try {
    const supabase = createClient();

    let query = supabase
      .from('alarms')
      .select(`
        *,
        pod:pods!inner(id, name, room:rooms!inner(id, name, site_id))
      `)
      .order('triggered_at', { ascending: false });

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

    return {
      data: (data as AlarmWithDetails[]) || [],
      error: null,
    };
  } catch (error) {
    console.error('Error in getAlarmsClient:', error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get alarm counts by severity for a site (client-side)
 * Used by dashboard summaries without server-module imports
 */
export async function getAlarmCountsBySeverityClient(
  siteId: string
): Promise<QueryResult<Record<AlarmSeverity, number>>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('alarms')
      .select('severity, pod:pods!inner(room:rooms!inner(site_id))')
      .eq('pod.room.site_id', siteId)
      .in('status', ['triggered', 'escalated']);

    if (error) throw error;

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
    console.error('Error in getAlarmCountsBySeverityClient:', error);
    return {
      data: { critical: 0, warning: 0, info: 0 },
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
 * For use in client components
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

/**
 * Client-side: Resolve alarm
 * Sets status to resolved when condition returns to normal
 * For use in client components
 * 
 * @param alarmId - UUID of the alarm
 * @returns Query result
 */
export async function resolveAlarm(
  alarmId: string
): Promise<QueryResult<Alarm>> {
  try {
    const supabase = createClient();
    
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
