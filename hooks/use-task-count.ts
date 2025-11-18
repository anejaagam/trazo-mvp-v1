/**
 * Custom React Hook: useTaskCount
 * 
 * Provides real-time task count with subscriptions
 * 
 * Created: November 17, 2025
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseTaskCountOptions {
  /** UUID of the user */
  userId: string;
  /** Enable real-time subscriptions (default: true) */
  realtime?: boolean;
  /** Automatically fetch on mount (default: true) */
  autoFetch?: boolean;
}

interface UseTaskCountReturn {
  /** Count of incomplete tasks */
  count: number;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refresh count */
  refresh: () => Promise<void>;
}

export function useTaskCount(options: UseTaskCountOptions): UseTaskCountReturn {
  const { userId, realtime = true, autoFetch = true } = options;

  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  // Fetch task count from database
  const refresh = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { count: taskCount, error: queryError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .not('status', 'in', '(done,cancelled)');

      if (queryError) throw queryError;

      setCount(taskCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch task count'));
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  // Listen for custom taskUpdated event for instant updates
  useEffect(() => {
    const handleTaskUpdate = () => {
      console.log('Task update event received - refreshing count');
      refresh();
    };

    window.addEventListener('taskUpdated', handleTaskUpdate);
    return () => window.removeEventListener('taskUpdated', handleTaskUpdate);
  }, [refresh]);

  // Polling fallback - refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [refresh]);

  // Real-time subscription
  useEffect(() => {
    if (!realtime || !userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`task-count-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${userId}`,
        },
        () => {
          console.log('Task INSERT detected - refreshing count');
          refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${userId}`,
        },
        () => {
          console.log('Task UPDATE detected - refreshing count');
          refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${userId}`,
        },
        () => {
          console.log('Task DELETE detected - refreshing count');
          refresh();
        }
      )
      .subscribe((status) => {
        console.log('Task count subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, realtime, refresh]);

  return {
    count,
    loading,
    error,
    refresh,
  };
}
