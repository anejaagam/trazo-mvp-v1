/**
 * Telemetry Database Queries (Server-Side)
 * 
 * Server-side queries for telemetry readings and device status
 * Uses server-side Supabase client for proper RLS enforcement
 * 
 * Created: October 29, 2025
 * Phase: 2 - Database Query Functions
 */

import { createClient } from '@/lib/supabase/server';
import type {
  TelemetryReading,
  TelemetryReadingWithPod,
  InsertTelemetryReading,
  TelemetryFilters,
  TelemetryDateRange,
  DeviceStatusRecord,
  InsertDeviceStatus,
  UpdateDeviceStatus,
  PodSnapshot,
  EnvironmentalStats,
  MetricStatistics,
  QueryResult,
} from '@/types/telemetry';

// =====================================================
// READ OPERATIONS - TELEMETRY READINGS
// =====================================================

/**
 * Get telemetry readings for a pod with date range filtering
 * Returns paginated time-series data ordered by timestamp (newest first)
 * 
 * @param podId - UUID of the pod
 * @param dateRange - Start and end dates for filtering
 * @param limit - Maximum number of readings to return (default: 1000)
 * @returns Query result with telemetry readings array
 */
export async function getTelemetryReadings(
  podId: string,
  dateRange: TelemetryDateRange,
  limit: number = 1000
): Promise<QueryResult<TelemetryReading[]>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', podId)
      .gte('timestamp', dateRange.start.toISOString())
      .lte('timestamp', dateRange.end.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data as TelemetryReading[], error: null };
  } catch (error) {
    console.error('Error in getTelemetryReadings:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get the most recent telemetry reading for a pod
 * 
 * @param podId - UUID of the pod
 * @returns Query result with single telemetry reading
 */
export async function getLatestReading(
  podId: string
): Promise<QueryResult<TelemetryReading>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', podId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return { data: data as TelemetryReading, error: null };
  } catch (error) {
    console.error('Error in getLatestReading:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get recent readings for a pod (last N readings)
 * 
 * @param podId - UUID of the pod
 * @param limit - Number of readings to return (default: 100)
 * @returns Query result with telemetry readings array
 */
export async function getRecentReadings(
  podId: string,
  limit: number = 100
): Promise<QueryResult<TelemetryReading[]>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', podId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data as TelemetryReading[], error: null };
  } catch (error) {
    console.error('Error in getRecentReadings:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get telemetry readings with pod and room information
 * Useful for displaying readings with context
 * 
 * @param filters - Filter criteria including pod_id, room_id, site_id, date_range
 * @returns Query result with enriched telemetry readings
 */
export async function getTelemetryWithPodInfo(
  filters: TelemetryFilters
): Promise<QueryResult<TelemetryReadingWithPod[]>> {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('telemetry_readings')
      .select(`
        *,
        pod:pods!inner (
          id,
          name,
          room_id,
          tagoio_device_id
        )
      `);

    // Apply filters
    if (filters.pod_id) {
      query = query.eq('pod_id', filters.pod_id);
    }
    
    if (filters.pod_ids && filters.pod_ids.length > 0) {
      query = query.in('pod_id', filters.pod_ids);
    }

    if (filters.date_range) {
      query = query
        .gte('timestamp', filters.date_range.start.toISOString())
        .lte('timestamp', filters.date_range.end.toISOString());
    }

    if (filters.data_source) {
      query = query.eq('data_source', filters.data_source);
    }

    if (filters.has_sensor_faults) {
      query = query.or(
        'temp_sensor_fault.eq.true,humidity_sensor_fault.eq.true,co2_sensor_fault.eq.true,pressure_sensor_fault.eq.true'
      );
    }

    // Apply limit and offset for pagination
    const limit = filters.limit || 1000;
    const offset = filters.offset || 0;
    
    query = query
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return { data: data as TelemetryReadingWithPod[], error: null };
  } catch (error) {
    console.error('Error in getTelemetryWithPodInfo:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get current snapshots for all pods at a site
 * Returns the latest reading for each pod with health status
 * 
 * @param siteId - UUID of the site
 * @returns Query result with pod snapshots array
 */
export async function getPodSnapshots(
  siteId: string
): Promise<QueryResult<PodSnapshot[]>> {
  try {
    // Use service client to bypass RLS for server-side queries
    const { createServiceClient } = await import('@/lib/supabase/service');
    const supabase = createServiceClient('US');
    
    // Get all pods for the site with their rooms
    const { data: pods, error: podsError } = await supabase
      .from('pods')
      .select(`
        id,
        name,
        room_id,
        tagoio_device_id,
        room:rooms!inner (
          id,
          name,
          site_id
        )
      `)
      .eq('room.site_id', siteId);

    console.log('[getPodSnapshots] Query result:', { siteId, podCount: pods?.length, error: podsError?.message });
    
    if (podsError) throw podsError;
    if (!pods || pods.length === 0) {
      console.log('[getPodSnapshots] No pods found for site:', siteId);
      return { data: [], error: null };
    }

    // Type assertion for room (Supabase returns array but it's actually single object)
    type PodWithRoom = {
      id: string;
      name: string;
      room_id: string;
      tagoio_device_id: string | null;
      room: { id: string; name: string; site_id: string };
    };
    
    // Get latest readings - fetch last 50 and aggregate to handle split sensor/equipment data
    const snapshotsPromises = (pods as unknown as PodWithRoom[]).map(async (pod) => {
      // Get last 50 readings to find latest non-null values (same logic as getLatestReading)
      const { data: readings } = await supabase
        .from('telemetry_readings')
        .select('*')
        .eq('pod_id', pod.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      // Combine latest non-null values
      const reading = readings && readings.length > 0 ? {
        timestamp: readings[0].timestamp,
        temperature_c: readings.find(r => r.temperature_c !== null)?.temperature_c ?? null,
        humidity_pct: readings.find(r => r.humidity_pct !== null)?.humidity_pct ?? null,
        co2_ppm: readings.find(r => r.co2_ppm !== null)?.co2_ppm ?? null,
        vpd_kpa: readings.find(r => r.vpd_kpa !== null)?.vpd_kpa ?? null,
        light_intensity_pct: readings.find(r => r.light_intensity_pct !== null)?.light_intensity_pct ?? null,
        cooling_active: readings.find(r => r.cooling_active !== null)?.cooling_active ?? null,
        heating_active: readings.find(r => r.heating_active !== null)?.heating_active ?? null,
        dehumidifier_active: readings.find(r => r.dehumidifier_active !== null)?.dehumidifier_active ?? null,
        humidifier_active: readings.find(r => r.humidifier_active !== null)?.humidifier_active ?? null,
        co2_injection_active: readings.find(r => r.co2_injection_active !== null)?.co2_injection_active ?? null,
        exhaust_fan_active: readings.find(r => r.exhaust_fan_active !== null)?.exhaust_fan_active ?? null,
        circulation_fan_active: readings.find(r => r.circulation_fan_active !== null)?.circulation_fan_active ?? null,
        lights_on: readings.find(r => r.lights_on !== null)?.lights_on ?? null,
        temp_sensor_fault: readings.find(r => r.temp_sensor_fault !== null)?.temp_sensor_fault ?? null,
        humidity_sensor_fault: readings.find(r => r.humidity_sensor_fault !== null)?.humidity_sensor_fault ?? null,
        co2_sensor_fault: readings.find(r => r.co2_sensor_fault !== null)?.co2_sensor_fault ?? null,
        pressure_sensor_fault: readings.find(r => r.pressure_sensor_fault !== null)?.pressure_sensor_fault ?? null,
        active_recipe_id: readings.find(r => r.active_recipe_id !== null)?.active_recipe_id ?? null,
      } : null;

      // Get alarm count for last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { count: alarmCount } = await supabase
        .from('alarms')
        .select('*', { count: 'exact', head: true })
        .eq('pod_id', pod.id)
        .gte('triggered_at', twentyFourHoursAgo.toISOString())
        .is('resolved_at', null);

      const { count: criticalCount } = await supabase
        .from('alarms')
        .select('*', { count: 'exact', head: true })
        .eq('pod_id', pod.id)
        .eq('severity', 'critical')
        .is('resolved_at', null);

      const { count: warningCount } = await supabase
        .from('alarms')
        .select('*', { count: 'exact', head: true })
        .eq('pod_id', pod.id)
        .eq('severity', 'warning')
        .is('resolved_at', null);

      // Determine health status
      let health_status: PodSnapshot['health_status'] = 'healthy';
      const now = Date.now();
      const lastUpdate = reading?.timestamp ? new Date(reading.timestamp).getTime() : 0;
      const minutesSinceUpdate = (now - lastUpdate) / (1000 * 60);

      if (minutesSinceUpdate > 10 || !reading) {
        health_status = 'offline';
      } else if (criticalCount && criticalCount > 0) {
        health_status = 'critical';
      } else if (warningCount && warningCount > 0) {
        health_status = 'warning';
      } else if (minutesSinceUpdate > 5) {
        health_status = 'stale';
      }

      // Get active recipe if available
      let active_recipe = null;
      if (reading?.active_recipe_id) {
        const { data: recipe } = await supabase
          .from('recipes')
          .select('id, name, temp_day_c, humidity_day_pct, co2_day_ppm')
          .eq('id', reading.active_recipe_id)
          .single();
        
        if (recipe) {
          active_recipe = {
            id: recipe.id,
            name: recipe.name,
            setpoints: {
              temp_day_c: recipe.temp_day_c,
              humidity_day_pct: recipe.humidity_day_pct,
              co2_day_ppm: recipe.co2_day_ppm,
            },
          };
        }
      }

      // Calculate drift if recipe active
      let drift = null;
      if (active_recipe && reading) {
        drift = {
          temperature: reading.temperature_c && active_recipe.setpoints.temp_day_c
            ? reading.temperature_c - active_recipe.setpoints.temp_day_c
            : null,
          humidity: reading.humidity_pct && active_recipe.setpoints.humidity_day_pct
            ? reading.humidity_pct - active_recipe.setpoints.humidity_day_pct
            : null,
          co2: reading.co2_ppm && active_recipe.setpoints.co2_day_ppm
            ? reading.co2_ppm - active_recipe.setpoints.co2_day_ppm
            : null,
        };
      }

      const snapshot: PodSnapshot = {
        pod: {
          id: pod.id,
          name: pod.name,
          room_id: pod.room_id,
          tagoio_device_id: pod.tagoio_device_id,
        },
        room: {
          id: pod.room.id,
          name: pod.room.name,
          site_id: pod.room.site_id,
        },
        last_update: reading?.timestamp || null,
        health_status,
        temperature_c: reading?.temperature_c || null,
        humidity_pct: reading?.humidity_pct || null,
        co2_ppm: reading?.co2_ppm || null,
        vpd_kpa: reading?.vpd_kpa || null,
        light_intensity_pct: reading?.light_intensity_pct || null,
        equipment: {
          cooling: reading?.cooling_active || false,
          heating: reading?.heating_active || false,
          dehumidifier: reading?.dehumidifier_active || false,
          humidifier: reading?.humidifier_active || false,
          co2_injection: reading?.co2_injection_active || false,
          exhaust_fan: reading?.exhaust_fan_active || false,
          circulation_fan: reading?.circulation_fan_active || false,
          irrigation: false, // Not stored in telemetry_readings (use equipment_states JSONB)
          lighting: reading?.lights_on || false,
        },
        sensor_faults: {
          temperature: reading?.temp_sensor_fault || false,
          humidity: reading?.humidity_sensor_fault || false,
          co2: reading?.co2_sensor_fault || false,
          pressure: reading?.pressure_sensor_fault || false,
        },
        active_recipe,
        alarm_count_24h: alarmCount || 0,
        critical_alarm_count: criticalCount || 0,
        warning_alarm_count: warningCount || 0,
        drift,
      };

      return snapshot;
    });

    const snapshots = await Promise.all(snapshotsPromises);
    return { data: snapshots, error: null };
  } catch (error) {
    console.error('Error in getPodSnapshots:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get environmental statistics for a pod over a date range
 * Calculates averages, min, max, and standard deviations
 * 
 * @param podId - UUID of the pod
 * @param dateRange - Start and end dates for analysis
 * @returns Query result with environmental statistics
 */
export async function getEnvironmentalStats(
  podId: string,
  dateRange: TelemetryDateRange
): Promise<QueryResult<EnvironmentalStats>> {
  try {
    const supabase = await createClient();
    
    const { data: readings, error } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', podId)
      .gte('timestamp', dateRange.start.toISOString())
      .lte('timestamp', dateRange.end.toISOString());

    if (error) throw error;
    if (!readings || readings.length === 0) {
      return {
        data: null,
        error: new Error('No readings found for the specified date range'),
      };
    }

    // Calculate statistics for each metric
    const calculateStats = (values: (number | null)[]): MetricStatistics => {
      const validValues = values.filter((v): v is number => v !== null);
      if (validValues.length === 0) {
        return { avg: null, min: null, max: null, std_dev: null };
      }

      const sum = validValues.reduce((a, b) => a + b, 0);
      const avg = sum / validValues.length;
      const min = Math.min(...validValues);
      const max = Math.max(...validValues);
      
      // Calculate standard deviation
      const squaredDiffs = validValues.map(v => Math.pow(v - avg, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / validValues.length;
      const std_dev = Math.sqrt(variance);

      return { avg, min, max, std_dev };
    };

    // Calculate equipment runtime (in minutes)
    const totalReadings = readings.length;
    const avgIntervalMinutes = totalReadings > 1 
      ? (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60) / totalReadings
      : 1;

    const coolingMinutes = readings.filter(r => r.cooling_active).length * avgIntervalMinutes;
    const heatingMinutes = readings.filter(r => r.heating_active).length * avgIntervalMinutes;
    const dehumidifierMinutes = readings.filter(r => r.dehumidifier_active).length * avgIntervalMinutes;
    const humidifierMinutes = readings.filter(r => r.humidifier_active).length * avgIntervalMinutes;

    const sensorFaultsCount = readings.filter(r =>
      r.temp_sensor_fault || r.humidity_sensor_fault || 
      r.co2_sensor_fault || r.pressure_sensor_fault
    ).length;

    const stats: EnvironmentalStats = {
      pod_id: podId,
      date_range: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
      temperature: calculateStats(readings.map(r => r.temperature_c)),
      humidity: calculateStats(readings.map(r => r.humidity_pct)),
      co2: calculateStats(readings.map(r => r.co2_ppm)),
      vpd: calculateStats(readings.map(r => r.vpd_kpa)),
      readings_count: totalReadings,
      sensor_faults_count: sensorFaultsCount,
      equipment_runtime: {
        cooling_minutes: Math.round(coolingMinutes),
        heating_minutes: Math.round(heatingMinutes),
        dehumidifier_minutes: Math.round(dehumidifierMinutes),
        humidifier_minutes: Math.round(humidifierMinutes),
      },
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error in getEnvironmentalStats:', error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// WRITE OPERATIONS - TELEMETRY READINGS
// =====================================================

/**
 * Create a single telemetry reading
 * Used for manual data entry or single API calls
 * 
 * @param reading - Telemetry reading data to insert
 * @returns Query result with created reading
 */
export async function createTelemetryReading(
  reading: InsertTelemetryReading
): Promise<QueryResult<TelemetryReading>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('telemetry_readings')
      .insert(reading)
      .select()
      .single();

    if (error) throw error;
    return { data: data as TelemetryReading, error: null };
  } catch (error) {
    console.error('Error in createTelemetryReading:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Batch insert multiple telemetry readings
 * Optimized for TagoIO polling service bulk imports
 * 
 * @param readings - Array of telemetry readings to insert
 * @returns Query result with created readings array
 */
export async function batchInsertReadings(
  readings: InsertTelemetryReading[]
): Promise<QueryResult<TelemetryReading[]>> {
  try {
    if (readings.length === 0) {
      return { data: [], error: null };
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('telemetry_readings')
      .insert(readings)
      .select();

    if (error) throw error;
    return { data: data as TelemetryReading[], error: null };
  } catch (error) {
    console.error('Error in batchInsertReadings:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Batch upsert multiple telemetry readings (INSERT or UPDATE on conflict)
 * Prevents duplicates by using unique constraint on (pod_id, timestamp)
 * Used for historical data imports where data may already exist
 * 
 * IMPORTANT: This function merges variables instead of overwriting.
 * When TagoIO returns partial data (only some variables), this ensures
 * we don't lose existing data by keeping non-null values from both old and new data.
 * 
 * Uses PostgreSQL function `merge_upsert_telemetry_reading` which handles COALESCE logic.
 * 
 * @param readings - Array of telemetry readings to upsert
 * @returns Query result with number of rows affected
 */
export async function batchUpsertReadings(
  readings: InsertTelemetryReading[]
): Promise<QueryResult<{ count: number }>> {
  try {
    if (readings.length === 0) {
      return { data: { count: 0 }, error: null };
    }

    const supabase = await createClient();
    
    // Call PostgreSQL function for each reading
    // The function handles COALESCE merge logic to preserve existing values
    let successCount = 0;
    const errors: Error[] = [];
    
    for (const reading of readings) {
      const { error } = await supabase.rpc('merge_upsert_telemetry_reading', {
        reading: reading as unknown as Record<string, unknown>
      });
      
      if (error) {
        console.error('Error upserting reading:', error);
        errors.push(error as Error);
      } else {
        successCount++;
      }
    }
    
    if (errors.length > 0 && errors.length === readings.length) {
      // All failed - throw the first error
      throw errors[0];
    }
    
    if (errors.length > 0) {
      console.warn(`Partial success: ${successCount}/${readings.length} readings upserted`);
    }

    return { data: { count: successCount }, error: null };
  } catch (error) {
    console.error('Error in batchUpsertReadings:', error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// DEVICE STATUS OPERATIONS
// =====================================================

/**
 * Get device status for a pod
 * Returns health status of GCU, sensors, and actuators
 * 
 * @param podId - UUID of the pod
 * @returns Query result with device status records
 */
export async function getDeviceStatus(
  podId: string
): Promise<QueryResult<DeviceStatusRecord[]>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('device_status')
      .select('*')
      .eq('pod_id', podId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { data: data as DeviceStatusRecord[], error: null };
  } catch (error) {
    console.error('Error in getDeviceStatus:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create or update device status
 * Upserts based on pod_id and device_name
 * 
 * @param status - Device status data
 * @returns Query result with device status record
 */
export async function upsertDeviceStatus(
  status: InsertDeviceStatus
): Promise<QueryResult<DeviceStatusRecord>> {
  try {
    const supabase = await createClient();
    
    // Check if device status exists
    const { data: existing } = await supabase
      .from('device_status')
      .select('id')
      .eq('pod_id', status.pod_id)
      .eq('device_name', status.device_name)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('device_status')
        .update({
          ...status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as DeviceStatusRecord, error: null };
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('device_status')
        .insert(status)
        .select()
        .single();

      if (error) throw error;
      return { data: data as DeviceStatusRecord, error: null };
    }
  } catch (error) {
    console.error('Error in upsertDeviceStatus:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update device status
 * 
 * @param deviceId - UUID of the device status record
 * @param updates - Fields to update
 * @returns Query result with updated device status
 */
export async function updateDeviceStatus(
  deviceId: string,
  updates: UpdateDeviceStatus
): Promise<QueryResult<DeviceStatusRecord>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('device_status')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deviceId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as DeviceStatusRecord, error: null };
  } catch (error) {
    console.error('Error in updateDeviceStatus:', error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// ANALYTICS & AGGREGATIONS
// =====================================================

/**
 * Get sensor health status summary for a pod
 * Checks recent readings for sensor faults
 * 
 * @param podId - UUID of the pod
 * @param hoursToCheck - Number of hours to look back (default: 24)
 * @returns Query result with sensor health summary
 */
export async function getSensorHealthStatus(
  podId: string,
  hoursToCheck: number = 24
): Promise<QueryResult<{
  temperature_fault_count: number;
  humidity_fault_count: number;
  co2_fault_count: number;
  pressure_fault_count: number;
  total_readings: number;
  fault_rate: number;
}>> {
  try {
    const supabase = await createClient();
    const hoursAgo = new Date(Date.now() - hoursToCheck * 60 * 60 * 1000);
    
    const { data: readings, error } = await supabase
      .from('telemetry_readings')
      .select('temp_sensor_fault, humidity_sensor_fault, co2_sensor_fault, pressure_sensor_fault')
      .eq('pod_id', podId)
      .gte('timestamp', hoursAgo.toISOString());

    if (error) throw error;
    if (!readings || readings.length === 0) {
      return {
        data: {
          temperature_fault_count: 0,
          humidity_fault_count: 0,
          co2_fault_count: 0,
          pressure_fault_count: 0,
          total_readings: 0,
          fault_rate: 0,
        },
        error: null,
      };
    }

    const totalReadings = readings.length;
    const tempFaults = readings.filter(r => r.temp_sensor_fault).length;
    const humidityFaults = readings.filter(r => r.humidity_sensor_fault).length;
    const co2Faults = readings.filter(r => r.co2_sensor_fault).length;
    const pressureFaults = readings.filter(r => r.pressure_sensor_fault).length;
    
    const totalFaults = tempFaults + humidityFaults + co2Faults + pressureFaults;
    const faultRate = (totalFaults / (totalReadings * 4)) * 100; // 4 sensor types

    return {
      data: {
        temperature_fault_count: tempFaults,
        humidity_fault_count: humidityFaults,
        co2_fault_count: co2Faults,
        pressure_fault_count: pressureFaults,
        total_readings: totalReadings,
        fault_rate: Math.round(faultRate * 100) / 100,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in getSensorHealthStatus:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get temperature extremes for a pod
 * Finds min/max temperatures over the specified period
 * 
 * @param podId - UUID of the pod
 * @param days - Number of days to look back (default: 7)
 * @returns Query result with temperature extremes
 */
export async function getTemperatureExtremes(
  podId: string,
  days: number = 7
): Promise<QueryResult<{
  min_temp: number | null;
  min_temp_at: string | null;
  max_temp: number | null;
  max_temp_at: string | null;
}>> {
  try {
    const supabase = await createClient();
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const { data: readings, error } = await supabase
      .from('telemetry_readings')
      .select('temperature_c, timestamp')
      .eq('pod_id', podId)
      .gte('timestamp', daysAgo.toISOString())
      .not('temperature_c', 'is', null)
      .order('temperature_c', { ascending: true });

    if (error) throw error;
    if (!readings || readings.length === 0) {
      return {
        data: {
          min_temp: null,
          min_temp_at: null,
          max_temp: null,
          max_temp_at: null,
        },
        error: null,
      };
    }

    const minReading = readings[0];
    const maxReading = readings[readings.length - 1];

    return {
      data: {
        min_temp: minReading.temperature_c,
        min_temp_at: minReading.timestamp,
        max_temp: maxReading.temperature_c,
        max_temp_at: maxReading.timestamp,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in getTemperatureExtremes:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get equipment runtime percentages over a date range
 * Calculates what percentage of time each equipment type was active
 * 
 * @param podId - UUID of the pod
 * @param dateRange - Start and end dates for analysis
 * @returns Query result with equipment runtime percentages
 */
export async function getEquipmentRuntime(
  podId: string,
  dateRange: TelemetryDateRange
): Promise<QueryResult<{
  cooling_pct: number;
  heating_pct: number;
  dehumidifier_pct: number;
  humidifier_pct: number;
  co2_injection_pct: number;
  lighting_pct: number;
}>> {
  try {
    const supabase = await createClient();
    
    const { data: readings, error } = await supabase
      .from('telemetry_readings')
      .select(`
        cooling_active,
        heating_active,
        dehumidifier_active,
        humidifier_active,
        co2_injection_active,
        lighting_active
      `)
      .eq('pod_id', podId)
      .gte('timestamp', dateRange.start.toISOString())
      .lte('timestamp', dateRange.end.toISOString());

    if (error) throw error;
    if (!readings || readings.length === 0) {
      return {
        data: {
          cooling_pct: 0,
          heating_pct: 0,
          dehumidifier_pct: 0,
          humidifier_pct: 0,
          co2_injection_pct: 0,
          lighting_pct: 0,
        },
        error: null,
      };
    }

    const total = readings.length;
    const calculate = (field: keyof typeof readings[0]) =>
      Math.round((readings.filter(r => r[field]).length / total) * 10000) / 100;

    return {
      data: {
        cooling_pct: calculate('cooling_active'),
        heating_pct: calculate('heating_active'),
        dehumidifier_pct: calculate('dehumidifier_active'),
        humidifier_pct: calculate('humidifier_active'),
        co2_injection_pct: calculate('co2_injection_active'),
        lighting_pct: calculate('lighting_active'),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in getEquipmentRuntime:', error);
    return { data: null, error: error as Error };
  }
}
