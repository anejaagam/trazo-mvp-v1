/**
 * Custom React Hook: useNotifications
 * 
 * Provides notification management with real-time updates
 * Handles mark as read, unread count, and notification subscriptions
 * 
 * Created: October 29, 2025
 * Phase: 3 (補完) - Additional Hook for Notifications
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Extended Notification type with display fields
interface NotificationDisplay {
  id: string;
  alarm_id: string | null;
  user_id: string;
  title: string;
  message: string;
  category: 'alarm' | 'system' | 'export' | 'maintenance' | 'task' | 'inventory' | 'batch';
  severity?: 'critical' | 'warning' | 'info';
  urgency?: 'high' | 'medium' | 'low';
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  related_alarm_id: string | null;
  metadata?: any;
}

// =====================================================
// HOOK: useNotifications
// =====================================================

interface UseNotificationsOptions {
  /** UUID of the user */
  userId: string;
  /** Enable real-time subscriptions (default: true) */
  realtime?: boolean;
  /** Limit number of notifications (default: 50) */
  limit?: number;
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

interface UseNotificationsReturn {
  /** Array of notifications */
  notifications: NotificationDisplay[];
  /** Unread notifications */
  unreadNotifications: NotificationDisplay[];
  /** Count of unread notifications */
  unreadCount: number;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Mark single notification as read */
  markAsRead: (notificationId: string) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Manually refetch notifications */
  refetch: () => Promise<void>;
}

export function useNotifications({
  userId,
  realtime = true,
  limit = 50,
  autoFetch = true
}: UseNotificationsOptions): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationDisplay[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch notifications from notifications table
   * Note: Using simplified query - full implementation would join with alarms table
   */
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      
      // Query notifications table
      // NOTE: This is a simplified version - real implementation would need
      // proper joins with alarms table for full details
      const { data, error: queryError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (queryError) throw queryError;

      // Transform to display format
      const displayNotifications: NotificationDisplay[] = (data || []).map(notif => ({
        id: notif.id,
        alarm_id: notif.alarm_id,
        user_id: notif.user_id,
        title: notif.category === 'task' 
          ? (notif.message || '').split(':')[0] // Extract title from message for tasks
          : 'Alarm Notification',
        message: notif.message || '',
        category: notif.category || 'alarm',
        severity: notif.severity,
        urgency: notif.urgency,
        is_read: notif.read_at !== null || notif.status === 'read',
        created_at: notif.sent_at,
        read_at: notif.read_at,
        related_alarm_id: notif.alarm_id,
        metadata: notif.metadata
      }));

      setNotifications(displayNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ 
          status: 'read', 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (updateError) throw updateError;

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ 
          status: 'read', 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .neq('status', 'read');

      if (updateError) throw updateError;

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({
          ...notif,
          is_read: true,
          read_at: notif.is_read ? notif.read_at : new Date().toISOString()
        }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, [userId]);

  /**
   * Set up real-time subscription for new notifications
   */
  useEffect(() => {
    if (!realtime || !userId) return;

    const supabase = createClient();
    let channel: RealtimeChannel;

    const setupSubscription = () => {
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotif = payload.new as Record<string, unknown>;
            const displayNotif: NotificationDisplay = {
              id: String(newNotif.id || ''),
              alarm_id: newNotif.alarm_id ? String(newNotif.alarm_id) : null,
              user_id: String(newNotif.user_id || ''),
              title: newNotif.category === 'task'
                ? String(newNotif.message || '').split(':')[0]
                : String(newNotif.title || 'Notification'),
              message: String(newNotif.message || ''),
              category: (newNotif.category as NotificationDisplay['category']) || 'system',
              severity: newNotif.severity ? (newNotif.severity as NotificationDisplay['severity']) : undefined,
              urgency: newNotif.urgency ? (newNotif.urgency as NotificationDisplay['urgency']) : undefined,
              is_read: newNotif.read_at !== null || newNotif.status === 'read',
              created_at: String(newNotif.sent_at || ''),
              read_at: newNotif.read_at ? String(newNotif.read_at) : null,
              related_alarm_id: newNotif.alarm_id ? String(newNotif.alarm_id) : null,
              metadata: newNotif.metadata
            };
            
            setNotifications(prev => [displayNotif, ...prev]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const updatedNotif = payload.new as Record<string, unknown>;
            setNotifications(prev =>
              prev.map(notif =>
                notif.id === String(updatedNotif.id || '')
                  ? {
                      ...notif,
                      is_read: Boolean(updatedNotif.read),
                      read_at: updatedNotif.read_at ? String(updatedNotif.read_at) : null
                    }
                  : notif
              )
            );
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, realtime]);

  /**
   * Fetch notifications on mount
   */
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [autoFetch, fetchNotifications]);

  // Derived values
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const unreadCount = unreadNotifications.length;

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}
