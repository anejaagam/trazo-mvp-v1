/**
 * Telemetry Database Queries (Client-Side)
 * 
 * Client-side queries for telemetry readings with real-time subscriptions
 * Uses client component Supabase client for browser-based queries
 * 
 * Created: October 29, 2025
 * Phase: 2 - Database Query Functions
 */

import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type {
  TelemetryReading,
  InsertTelemetryReading,
  DeviceStatusRecord,
  QueryResult,
  RealtimeSubscriptionConfig,
} from '@/types/telemetry';

// =====================================================
// REALTIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to real-time telemetry updates for a specific pod
 * Returns cleanup function to unsubscribe
 * 
 * @param config - Subscription configuration with podId and callback
 * @returns Cleanup function to call on unmount
 * 
 * @example
 * ```typescript
 * const unsubscribe = subscribeToTelemetry({
 *   podId: 'abc-123',
 *   onInsert: (reading) => setLatestReading(reading),
 *   onUpdate: (reading) => updateReading(reading),
 * });
 * 
 * // Later: cleanup on component unmount
 * useEffect(() => unsubscribe, []);
 * ```
 */
export function subscribeToTelemetry(
  config: RealtimeSubscriptionConfig
): () => void {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`telemetry:${config.podId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'telemetry_readings',
        filter: `pod_id=eq.${config.podId}`,
      },
      (payload: RealtimePostgresChangesPayload<TelemetryReading>) => {
        if (config.onInsert) {
          config.onInsert(payload.new as TelemetryReading);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'telemetry_readings',
        filter: `pod_id=eq.${config.podId}`,
      },
      (payload: RealtimePostgresChangesPayload<TelemetryReading>) => {
        if (config.onUpdate) {
          config.onUpdate(payload.new as TelemetryReading);
        }
      }
    )
    .subscribe();
  
  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to all telemetry updates for a site (multiple pods)
 * Useful for fleet monitoring dashboards
 * 
 * @param siteId - UUID of the site
 * @param onInsert - Callback for new readings
 * @param onUpdate - Callback for updated readings
 * @returns Cleanup function
 */
export function subscribeToSiteTelemetry(
  siteId: string,
  onInsert?: (reading: TelemetryReading) => void,
  onUpdate?: (reading: TelemetryReading) => void
): () => void {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`telemetry:site:${siteId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'telemetry_readings',
        // Note: RLS will filter to user's accessible sites
      },
      (payload: RealtimePostgresChangesPayload<TelemetryReading>) => {
        if (onInsert) {
          onInsert(payload.new as TelemetryReading);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'telemetry_readings',
      },
      (payload: RealtimePostgresChangesPayload<TelemetryReading>) => {
        if (onUpdate) {
          onUpdate(payload.new as TelemetryReading);
        }
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

// =====================================================
// READ OPERATIONS - CLIENT QUERIES
// =====================================================

/**
 * Get latest telemetry reading for a pod (client-side)
 * Use this in client components when you need the most recent reading
 * 
 * @param podId - UUID of the pod
 * @returns Query result with latest reading or null
 */
export async function getLatestReadingClient(
  podId: string
): Promise<QueryResult<TelemetryReading | null>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', podId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // No data is not an error for this query
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in getLatestReadingClient:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
}

/**
 * Get recent telemetry readings for a pod (client-side)
 * Returns last N readings ordered by timestamp
 * 
 * @param podId - UUID of the pod
 * @param limit - Number of readings to fetch (default: 20)
 * @returns Query result with readings array
 */
export async function getRecentReadingsClient(
  podId: string,
  limit: number = 20
): Promise<QueryResult<TelemetryReading[]>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', podId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getRecentReadingsClient:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
}

/**
 * Get telemetry readings for the last N hours (client-side)
 * Useful for recent history charts
 * 
 * @param podId - UUID of the pod
 * @param hours - Number of hours to look back (default: 24)
 * @returns Query result with readings array
 */
export async function getReadingsLastNHours(
  podId: string,
  hours: number = 24
): Promise<QueryResult<TelemetryReading[]>> {
  try {
    const supabase = createClient();
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    const { data, error } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', podId)
      .gte('timestamp', cutoffTime.toISOString())
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getReadingsLastNHours:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
}

// =====================================================
// WRITE OPERATIONS - CLIENT QUERIES
// =====================================================

/**
 * Create a manual telemetry reading (client-side)
 * Use this for user-entered readings or corrections
 * 
 * @param reading - Telemetry reading data without id/timestamps
 * @returns Query result with inserted reading
 * 
 * @example
 * ```typescript
 * const result = await createManualReading({
 *   pod_id: 'abc-123',
 *   temperature_f: 75.5,
 *   humidity_percent: 65,
 *   co2_ppm: 1000,
 *   is_manual_entry: true,
 * });
 * ```
 */
export async function createManualReading(
  reading: InsertTelemetryReading
): Promise<QueryResult<TelemetryReading>> {
  try {
    const supabase = createClient();
    
    // Ensure manual entry flag is set
    const readingWithFlag = {
      ...reading,
      is_manual_entry: true,
    };
    
    const { data, error } = await supabase
      .from('telemetry_readings')
      .insert(readingWithFlag)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from insert');
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in createManualReading:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
}

/**
 * Update a manual telemetry reading (client-side)
 * Only manual entries can be updated, TagoIO readings are immutable
 * 
 * @param id - UUID of the reading to update
 * @param updates - Partial reading data to update
 * @returns Query result with updated reading
 */
export async function updateManualReading(
  id: string,
  updates: Partial<InsertTelemetryReading>
): Promise<QueryResult<TelemetryReading>> {
  try {
    const supabase = createClient();
    
    // First verify this is a manual entry
    const { data: existing, error: fetchError } = await supabase
      .from('telemetry_readings')
      .select('is_manual_entry')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!existing) throw new Error('Reading not found');
    if (!existing.is_manual_entry) {
      throw new Error('Cannot update TagoIO readings, only manual entries');
    }
    
    const { data, error } = await supabase
      .from('telemetry_readings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from update');
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in updateManualReading:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
}

/**
 * Delete a manual telemetry reading (client-side)
 * Only manual entries can be deleted, TagoIO readings are immutable
 * 
 * @param id - UUID of the reading to delete
 * @returns Query result with success status
 */
export async function deleteManualReading(
  id: string
): Promise<QueryResult<boolean>> {
  try {
    const supabase = createClient();
    
    // First verify this is a manual entry
    const { data: existing, error: fetchError } = await supabase
      .from('telemetry_readings')
      .select('is_manual_entry')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!existing) throw new Error('Reading not found');
    if (!existing.is_manual_entry) {
      throw new Error('Cannot delete TagoIO readings, only manual entries');
    }
    
    const { error } = await supabase
      .from('telemetry_readings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { data: true, error: null };
  } catch (error) {
    console.error('Error in deleteManualReading:', error);
    return { 
      data: false, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
}

// =====================================================
// DEVICE STATUS - CLIENT QUERIES
// =====================================================

/**
 * Get device status for a pod (client-side)
 * Returns the current health status of the pod's monitoring device
 * 
 * @param podId - UUID of the pod
 * @returns Query result with device status or null
 */
export async function getDeviceStatusClient(
  podId: string
): Promise<QueryResult<DeviceStatusRecord | null>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('device_status')
      .select('*')
      .eq('pod_id', podId)
      .single();
    
    if (error) {
      // No device status is not an error
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in getDeviceStatusClient:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
}

/**
 * Subscribe to device status updates for a pod
 * 
 * @param podId - UUID of the pod
 * @param onUpdate - Callback for status updates
 * @returns Cleanup function
 */
export function subscribeToDeviceStatus(
  podId: string,
  onUpdate: (status: DeviceStatusRecord) => void
): () => void {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`device_status:${podId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'device_status',
        filter: `pod_id=eq.${podId}`,
      },
      (payload: RealtimePostgresChangesPayload<DeviceStatusRecord>) => {
        onUpdate(payload.new as DeviceStatusRecord);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}
