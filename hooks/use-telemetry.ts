/**
 * Custom React Hook: useTelemetry
 * 
 * Provides real-time telemetry data with loading states and error handling
 * Automatically subscribes to Supabase Realtime updates
 * 
 * Created: October 29, 2025
 * Phase: 3 - Custom React Hooks
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToTelemetry,
  createManualReading,
} from '@/lib/supabase/queries/telemetry-client';
import type {
  TelemetryReading,
  InsertTelemetryReading,
  PodSnapshot,
  DeviceStatusRecord,
} from '@/types/telemetry';

// =====================================================
// HOOK: useTelemetry (Real-time single pod monitoring)
// =====================================================

interface UseTelemetryOptions {
  /** UUID of the pod to monitor */
  podId: string;
  /** Enable real-time subscriptions (default: true) */
  realtime?: boolean;
  /** Automatically fetch latest reading on mount (default: true) */
  autoFetch?: boolean;
}

interface UseTelemetryReturn {
  /** Latest telemetry reading */
  reading: TelemetryReading | null;
  /** Loading state for initial fetch */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refresh the latest reading */
  refresh: () => Promise<void>;
  /** Create a manual reading entry */
  createReading: (data: InsertTelemetryReading) => Promise<{ success: boolean; error?: Error }>;
  /** Whether real-time subscription is active */
  isSubscribed: boolean;
}

export function useTelemetry(options: UseTelemetryOptions): UseTelemetryReturn {
  const { podId, realtime = true, autoFetch = true } = options;
  
  const [reading, setReading] = useState<TelemetryReading | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch latest reading
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use server action to bypass RLS
      const { getLatestReading } = await import('@/app/actions/monitoring');
      const result = await getLatestReading(podId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReading(result.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch telemetry'));
    } finally {
      setLoading(false);
    }
  }, [podId]);

  // Create manual reading
  const createReading = useCallback(async (
    data: InsertTelemetryReading
  ): Promise<{ success: boolean; error?: Error }> => {
    try {
      const result = await createManualReading(data);
      
      if (result.error) {
        return { success: false, error: result.error };
      }
      
      // Update local state with new reading
      if (result.data) {
        setReading(result.data);
      }
      
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to create reading'),
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
    
    const unsubscribe = subscribeToTelemetry({
      podId,
      onInsert: (newReading) => {
        setReading(newReading);
      },
      onUpdate: (updatedReading) => {
        setReading(updatedReading);
      },
      onError: (err) => {
        console.error('Telemetry subscription error:', err);
        setError(err);
        setIsSubscribed(false);
      },
    });

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [podId, realtime]);

  return {
    reading,
    loading,
    error,
    refresh,
    createReading,
    isSubscribed,
  };
}

// =====================================================
// HOOK: useHistoricalTelemetry (Time-series data)
// =====================================================

interface UseHistoricalTelemetryOptions {
  /** UUID of the pod */
  podId: string;
  /** Number of hours to look back (default: 24) */
  hours?: number;
  /** Maximum number of readings (default: 100) */
  limit?: number;
  /** Automatically fetch on mount (default: true) */
  autoFetch?: boolean;
}

interface UseHistoricalTelemetryReturn {
  /** Array of telemetry readings */
  readings: TelemetryReading[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refresh the data */
  refresh: () => Promise<void>;
}

export function useHistoricalTelemetry(
  options: UseHistoricalTelemetryOptions
): UseHistoricalTelemetryReturn {
  const { podId, hours = 24, limit = 100, autoFetch = true } = options;
  
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use server action to bypass RLS
      const { getHistoricalReadings } = await import('@/app/actions/monitoring');
      const result = await getHistoricalReadings(podId, hours, limit);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReadings(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch historical data'));
      setReadings([]);
    } finally {
      setLoading(false);
    }
  }, [podId, hours, limit]);

  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  return {
    readings,
    loading,
    error,
    refresh,
  };
}

// =====================================================
// HOOK: usePodSnapshots (Fleet monitoring)
// =====================================================

interface UsePodSnapshotsOptions {
  /** UUID of the site (optional if organizationId provided) */
  siteId?: string;
  /** UUID of the organization (for org_admin users to see all sites) */
  organizationId?: string;
  /** Enable real-time subscriptions (default: true) */
  realtime?: boolean;
  /** Auto-refresh interval in seconds (0 = disabled) */
  refreshInterval?: number;
}

interface UsePodSnapshotsReturn {
  /** Array of pod snapshots with health status */
  snapshots: PodSnapshot[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refresh snapshots */
  refresh: () => Promise<void>;
  /** Whether real-time subscription is active */
  isSubscribed: boolean;
}

export function usePodSnapshots(
  options: UsePodSnapshotsOptions
): UsePodSnapshotsReturn {
  const { siteId, organizationId, realtime = true, refreshInterval = 0 } = options;
  
  const [snapshots, setSnapshots] = useState<PodSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Dynamically import server action to avoid bundling issues
      const { getPodsSnapshot, getPodsSnapshotByOrganization } = await import('@/app/actions/monitoring');
      
      // Use organization-level query if organizationId provided (for org_admin)
      // Otherwise use site-level query
      const result = organizationId 
        ? await getPodsSnapshotByOrganization(organizationId)
        : siteId 
          ? await getPodsSnapshot(siteId)
          : { data: null, error: 'Either siteId or organizationId must be provided' };
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setSnapshots(result.data || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pod snapshots'));
      setSnapshots([]);
      setLoading(false);
    }
  }, [siteId, organizationId]);

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

  // Real-time subscription (subscribe to all pods in site)
  // Note: For organization-level queries, we rely on auto-refresh instead of real-time subscriptions
  // as Supabase doesn't support filtering subscriptions across multiple sites efficiently
  useEffect(() => {
    if (!realtime || !siteId) return; // Skip subscription for org-level queries

    setIsSubscribed(true);
    
    // Subscribe to site-wide telemetry updates
    // This will trigger a refresh when any pod gets new data
    const unsubscribe = subscribeToTelemetry({
      podId: siteId, // Note: This needs adjustment for site-wide subscription
      onInsert: () => {
        refresh();
      },
      onError: (err) => {
        console.error('Pod snapshots subscription error:', err);
        setError(err);
        setIsSubscribed(false);
      },
    });

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [siteId, realtime, refresh]);

  return {
    snapshots,
    loading,
    error,
    refresh,
    isSubscribed,
  };
}

// =====================================================
// HOOK: useDeviceStatus (Hardware health monitoring)
// =====================================================

interface UseDeviceStatusOptions {
  /** UUID of the pod */
  podId: string;
  /** Enable real-time subscriptions (default: true) */
  realtime?: boolean;
}

interface UseDeviceStatusReturn {
  /** Device status record */
  status: DeviceStatusRecord | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refresh status */
  refresh: () => Promise<void>;
  /** Whether device is online */
  isOnline: boolean;
  /** Whether real-time subscription is active */
  isSubscribed: boolean;
}

export function useDeviceStatus(
  options: UseDeviceStatusOptions
): UseDeviceStatusReturn {
  const { podId, realtime = true } = options;
  
  const [status, setStatus] = useState<DeviceStatusRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Import dynamically to avoid circular dependencies
      const { getDeviceStatusClient } = await import('@/lib/supabase/queries/telemetry-client');
      const result = await getDeviceStatusClient(podId);
      
      if (result.error) {
        throw result.error;
      }
      
      setStatus(result.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch device status'));
    } finally {
      setLoading(false);
    }
  }, [podId]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Real-time subscription
  useEffect(() => {
    if (!realtime) return;

    const setupSubscription = async () => {
      const { subscribeToDeviceStatus } = await import('@/lib/supabase/queries/telemetry-client');
      
      setIsSubscribed(true);
      
      const unsubscribe = subscribeToDeviceStatus(podId, (updatedStatus) => {
        setStatus(updatedStatus);
      });

      return unsubscribe;
    };

    const subscription = setupSubscription();

    return () => {
      subscription.then(unsub => unsub());
      setIsSubscribed(false);
    };
  }, [podId, realtime]);

  const isOnline = status?.status === 'online';

  return {
    status,
    loading,
    error,
    refresh,
    isOnline,
    isSubscribed,
  };
}
