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
  subscribeToNotifications,
  acknowledgeAlarmClient,
} from '@/lib/supabase/queries/alarms-client';
import type {
  Alarm,
  AlarmSeverity,
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
  /** Filter by status */
  status?: 'active' | 'acknowledged' | 'resolved';
  /** Enable real-time subscriptions (default: true) */
  realtime?: boolean;
  /** Automatically fetch on mount (default: true) */
  autoFetch?: boolean;
}

interface UseAlarmsReturn {
  /** Array of alarms */
  alarms: Alarm[];
  /** Active (unacknowledged) alarms */
  activeAlarms: Alarm[];
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
    status,
    realtime = true,
    autoFetch = true,
  } = options;
  
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch alarms (requires server action - placeholder for now)
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Implement server action call or API route
      // For now, this is a placeholder
      console.warn('useAlarms: Server action integration needed', {
        podId,
        siteId,
        severity,
        status,
      });
      
      setAlarms([]);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch alarms'));
      setAlarms([]);
      setLoading(false);
    }
  }, [podId, siteId, severity, status]);

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
        setAlarms(prev => [newAlarm, ...prev]);
      },
      (updatedAlarm) => {
        // Update existing alarm
        setAlarms(prev => 
          prev.map(alarm => 
            alarm.id === updatedAlarm.id ? updatedAlarm : alarm
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
  /** Enable real-time subscriptions (default: true) */
  realtime?: boolean;
  /** Automatically fetch on mount (default: true) */
  autoFetch?: boolean;
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
  const { userId, realtime = true, autoFetch = true } = options;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch notifications (requires server action - placeholder for now)
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Implement server action call or API route
      console.warn('useNotifications: Server action integration needed', { userId });
      
      setNotifications([]);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
      setNotifications([]);
      setLoading(false);
    }
  }, [userId]);

  // Mark as read
  const markAsRead = useCallback(async (
    notificationId: string
  ): Promise<{ success: boolean; error?: Error }> => {
    try {
      // TODO: Implement markNotificationRead call
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, read: true, read_at: new Date().toISOString() }
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
      // TODO: Implement markAllNotificationsRead call
      
      // Update local state
      const now = new Date().toISOString();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true, read_at: now }))
      );
      
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to mark all notifications as read'),
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
    if (!realtime) return;

    setIsSubscribed(true);
    
    const unsubscribe = subscribeToNotifications(userId, (newNotification) => {
      // Add new notification to the beginning of the list
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
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
      // TODO: Implement getAlarmCountsBySeverity server action call
      console.warn('useAlarmSummary: Server action integration needed', { siteId });
      
      setCounts({ critical: 0, warning: 0, info: 0 });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch alarm summary'));
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
