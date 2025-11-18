/**
 * Custom React Hook: useAlarms
 * 
 * Provides alarm management with real-time updates
 * Handles alarm acknowledgment, notifications, and filtering
 * 
 * Created: October 29, 2025
 * Phase: 3 - Custom React Hooks
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToAlarms,
  acknowledgeAlarmClient,
  getAlarmsClient,
  getAlarmCountsBySeverityClient,
} from '@/lib/supabase/queries/alarms-client';
import type {
  Alarm,
  AlarmWithDetails,
  AlarmSeverity,
  AlarmType,
  Notification,
} from '@/types/telemetry';

// =====================================================
// HOOK: useAlarms (Alarm management)
// =====================================================

interface UseAlarmsOptions {
  /** UUID of the pod to monitor */
  podId?: string;
  /** UUID of the site for multi-pod monitoring */
  siteId?: string;
  /** Filter by severity */
  severity?: AlarmSeverity;
  /** Filter by alarm type */
  type?: AlarmType;
  /** Filter by status */
  status?: 'active' | 'acknowledged' | 'resolved';
  /** Enable real-time subscriptions (default: true) */
  realtime?: boolean;
  /** Automatically fetch on mount (default: true) */
  autoFetch?: boolean;
}

interface UseAlarmsReturn {
  /** Array of alarms */
  alarms: AlarmWithDetails[];
  /** Active (unacknowledged) alarms */
  activeAlarms: AlarmWithDetails[];
  /** Count of active alarms */
  activeCount: number;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refresh alarms */
  refresh: () => Promise<void>;
  /** Acknowledge an alarm */
  acknowledge: (alarmId: string, userId: string) => Promise<{ success: boolean; error?: Error }>;
  /** Whether real-time subscription is active */
  isSubscribed: boolean;
}

export function useAlarms(options: UseAlarmsOptions = {}): UseAlarmsReturn {
  const {
    podId,
    siteId,
    severity,
    type,
    status,
    realtime = true,
    autoFetch = true,
  } = options;

  const [alarms, setAlarms] = useState<AlarmWithDetails[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch alarms from database
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAlarmsClient({
        pod_id: podId,
        site_id: siteId,
        severity,
        alarm_type: type,
        status,
      });

      if (result.error) throw result.error;

      // Use AlarmWithDetails data directly
      setAlarms(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch alarms'));
      setAlarms([]);
    } finally {
      setLoading(false);
    }
  }, [podId, siteId, severity, type, status]);

  // Acknowledge alarm
  const acknowledge = useCallback(async (
    alarmId: string,
    userId: string
  ): Promise<{ success: boolean; error?: Error }> => {
    try {
      const result = await acknowledgeAlarmClient(alarmId, userId);
      
      if (result.error) {
        return { success: false, error: result.error };
      }
      
      // Update local state
      setAlarms(prev => 
        prev.map(alarm => 
          alarm.id === alarmId
            ? { ...alarm, acknowledged: true, acknowledged_by: userId, acknowledged_at: new Date().toISOString() }
            : alarm
        )
      );
      
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to acknowledge alarm'),
      };
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  // Real-time subscription
  useEffect(() => {
    if (!realtime || !podId) return;

    setIsSubscribed(true);
    
    const unsubscribe = subscribeToAlarms(
      podId,
      (newAlarm) => {
        // Add new alarm to the list
        setAlarms(prev => [newAlarm as AlarmWithDetails, ...prev]);
      },
      (updatedAlarm) => {
        // Update existing alarm
        setAlarms(prev => 
          prev.map(alarm => 
            alarm.id === updatedAlarm.id ? (updatedAlarm as AlarmWithDetails) : alarm
          )
        );
      }
    );

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [podId, realtime]);

  // Calculate derived values
  const activeAlarms = alarms.filter(
    alarm => !alarm.acknowledged_at && !alarm.resolved_at
  );
  const activeCount = activeAlarms.length;

  return {
    alarms,
    activeAlarms,
    activeCount,
    loading,
    error,
    refresh,
    acknowledge,
    isSubscribed,
  };
}

// =====================================================
// HOOK: useNotifications (User notifications)
// =====================================================

interface UseNotificationsOptions {
  /** UUID of the user */
  userId: string;
  /** UUID of the organization (optional) */
  organizationId?: string;
  /** Filter by category (optional) */
  category?: 'inventory' | 'batch' | 'task' | 'system';
  /** Filter by urgency (optional) */
  urgency?: 'low' | 'medium' | 'high';
  /** Show only unread notifications (default: false) */
  unreadOnly?: boolean;
  /** Enable real-time subscriptions (default: true) */
  realtime?: boolean;
  /** Automatically fetch on mount (default: true) */
  autoFetch?: boolean;
  /** Maximum number of notifications to fetch (default: 50) */
  limit?: number;
}

interface UseNotificationsReturn {
  /** Array of notifications */
  notifications: Notification[];
  /** Unread notifications */
  unreadNotifications: Notification[];
  /** Count of unread notifications */
  unreadCount: number;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refresh notifications */
  refresh: () => Promise<void>;
  /** Mark notification as read */
  markAsRead: (notificationId: string) => Promise<{ success: boolean; error?: Error }>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<{ success: boolean; error?: Error }>;
  /** Whether real-time subscription is active */
  isSubscribed: boolean;
}

export function useNotifications(
  options: UseNotificationsOptions
): UseNotificationsReturn {
  const {
    userId,
    organizationId,
    category,
    urgency,
    unreadOnly = false,
    realtime = true,
    autoFetch = true,
    limit = 50,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch notifications from database
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { getNotificationsClient } = await import('@/lib/supabase/queries/notifications-client');

      const result = await getNotificationsClient({
        user_id: userId,
        organization_id: organizationId,
        category,
        urgency,
        unread_only: unreadOnly,
        limit,
      });

      if (result.error) throw result.error;

      setNotifications(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [userId, organizationId, category, urgency, unreadOnly, limit]);

  // Mark as read
  const markAsRead = useCallback(async (
    notificationId: string
  ): Promise<{ success: boolean; error?: Error }> => {
    try {
      const { markNotificationReadClient } = await import('@/lib/supabase/queries/notifications-client');

      const result = await markNotificationReadClient(notificationId);

      if (result.error) {
        return { success: false, error: result.error };
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, read_at: new Date().toISOString(), status: 'read' }
            : notif
        )
      );

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to mark notification as read'),
      };
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async (): Promise<{
    success: boolean;
    error?: Error;
  }> => {
    try {
      const { markAllNotificationsReadClient } = await import('@/lib/supabase/queries/notifications-client');

      const result = await markAllNotificationsReadClient(userId);

      if (result.error) {
        return { success: false, error: result.error };
      }

      // Update local state
      const now = new Date().toISOString();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read_at: now, status: 'read' as const }))
      );

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to mark all notifications as read'),
      };
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  // Real-time subscription
  useEffect(() => {
    if (!realtime || !userId) return;

    setIsSubscribed(true);

    // Lazy load subscription function
    import('@/lib/supabase/queries/notifications-client').then(({ subscribeToNotificationsClient }) => {
      const unsubscribe = subscribeToNotificationsClient(
        userId,
        (newNotification) => {
          // Add new notification to the beginning of the list
          setNotifications(prev => [newNotification, ...prev]);
        },
        (updatedNotification) => {
          // Update existing notification
          setNotifications(prev =>
            prev.map(notif =>
              notif.id === updatedNotification.id ? updatedNotification : notif
            )
          );
        }
      );

      return () => {
        unsubscribe();
        setIsSubscribed(false);
      };
    });
  }, [userId, realtime]);

  // Calculate derived values
  const unreadNotifications = notifications.filter(notif => !notif.read_at);
  const unreadCount = unreadNotifications.length;

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    isSubscribed,
  };
}

// =====================================================
// HOOK: useAlarmSummary (Dashboard summary widget)
// =====================================================

interface UseAlarmSummaryOptions {
  /** UUID of the site */
  siteId: string;
  /** Refresh interval in seconds (default: 30) */
  refreshInterval?: number;
}

interface UseAlarmSummaryReturn {
  /** Count by severity */
  counts: Record<AlarmSeverity, number>;
  /** Total active alarms */
  totalActive: number;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refresh counts */
  refresh: () => Promise<void>;
}

export function useAlarmSummary(
  options: UseAlarmSummaryOptions
): UseAlarmSummaryReturn {
  const { siteId, refreshInterval = 30 } = options;
  
  const [counts, setCounts] = useState<Record<AlarmSeverity, number>>({
    critical: 0,
    warning: 0,
    info: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAlarmCountsBySeverityClient(siteId);
      
      if (result.error) throw result.error;
      
      setCounts(result.data || { critical: 0, warning: 0, info: 0 });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch alarm summary'));
      setCounts({ critical: 0, warning: 0, info: 0 });
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  const totalActive = counts.critical + counts.warning + counts.info;

  return {
    counts,
    totalActive,
    loading,
    error,
    refresh,
  };
}
