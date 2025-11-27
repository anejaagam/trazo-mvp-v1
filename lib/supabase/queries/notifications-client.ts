/**
 * Client-side Notification Queries
 *
 * Provides functions to query and manage notifications from client components
 * Supports filtering by category, urgency, and read status
 *
 * Created: Phase 2 - Alarms & Notifications v2
 */

'use client';

import { createClient } from '@/lib/supabase/client';
import type { Notification, NotificationFilters } from '@/types/telemetry';

/**
 * Get notifications for a user with optional filtering
 */
export async function getNotificationsClient(filters: NotificationFilters = {}) {
  const supabase = createClient();

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('sent_at', { ascending: false });

    // Apply filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.urgency) {
      query = query.eq('urgency', filters.urgency);
    }

    if (filters.alarm_id) {
      query = query.eq('alarm_id', filters.alarm_id);
    }

    if (filters.channel) {
      query = query.eq('channel', filters.channel);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.unread_only) {
      query = query.is('read_at', null);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return { data: null, error };
    }

    return { data: data as Notification[], error: null };

  } catch (err) {
    console.error('Unexpected error fetching notifications:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationReadClient(notificationId: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        read_at: new Date().toISOString(),
        status: 'read',
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return { data: null, error };
    }

    return { data: data as Notification, error: null };

  } catch (err) {
    console.error('Unexpected error marking notification as read:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsReadClient(userId: string) {
  const supabase = createClient();

  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .update({
        read_at: now,
        status: 'read',
      })
      .eq('user_id', userId)
      .is('read_at', null)
      .select();

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { data: null, error, count: 0 };
    }

    return { data: data as Notification[], error: null, count: data.length };

  } catch (err) {
    console.error('Unexpected error marking all notifications as read:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
      count: 0
    };
  }
}

/**
 * Subscribe to real-time notification updates for a user
 */
export function subscribeToNotificationsClient(
  userId: string,
  onInsert?: (notification: Notification) => void,
  onUpdate?: (notification: Notification) => void
) {
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
      (payload) => {
        if (onInsert) {
          onInsert(payload.new as Notification);
        }
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
        if (onUpdate) {
          onUpdate(payload.new as Notification);
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get notification count by category
 */
export async function getNotificationCountsClient(userId: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('category, urgency')
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('Error fetching notification counts:', error);
      return {
        data: null,
        error,
      };
    }

    // Aggregate counts
    const counts = {
      total: data.length,
      byCategory: {
        inventory: 0,
        batch: 0,
        task: 0,
        system: 0,
      },
      byUrgency: {
        low: 0,
        medium: 0,
        high: 0,
      },
    };

    data.forEach((notif) => {
      counts.byCategory[notif.category as keyof typeof counts.byCategory]++;
      counts.byUrgency[notif.urgency as keyof typeof counts.byUrgency]++;
    });

    return { data: counts, error: null };

  } catch (err) {
    console.error('Unexpected error fetching notification counts:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}

/**
 * Delete completed task notifications for a user
 * Removes notifications where category is 'task' and task_status is 'approved', 'completed', or 'done'
 */
export async function clearCompletedTaskNotificationsClient(userId: string) {
  const supabase = createClient();

  try {
    // Delete task notifications that are completed/approved
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('category', 'task')
      .not('read_at', 'is', null)
      .select();

    if (error) {
      console.error('Error clearing completed task notifications:', error);
      return { data: null, error, count: 0 };
    }

    return { data: data as Notification[], error: null, count: data?.length || 0 };

  } catch (err) {
    console.error('Unexpected error clearing completed task notifications:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
      count: 0
    };
  }
}

/**
 * Delete a single notification
 */
export async function deleteNotificationClient(notificationId: string) {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error };
    }

    return { success: true, error: null };

  } catch (err) {
    console.error('Unexpected error deleting notification:', err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}
