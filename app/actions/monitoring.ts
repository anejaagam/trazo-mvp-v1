'use server'

import { getPodSnapshots, getPodSnapshotsByOrganization, getTelemetryReadings } from '@/lib/supabase/queries/telemetry'
import type { PodSnapshot, TelemetryReading } from '@/types/telemetry'

/**
 * Server action to get pod snapshots for fleet monitoring
 */
export async function getPodsSnapshot(siteId: string): Promise<{
  data: PodSnapshot[] | null
  error: string | null
}> {
  try {
    const { data, error } = await getPodSnapshots(siteId)
    
    if (error) {
      console.error('Error fetching pod snapshots:', error)
      return { data: null, error: error.message || 'Failed to fetch pod snapshots' }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getPodsSnapshot:', err)
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Server action to get pod snapshots across all sites in an organization
 * Used for org_admin users to see complete fleet status
 */
export async function getPodsSnapshotByOrganization(organizationId: string): Promise<{
  data: PodSnapshot[] | null
  error: string | null
}> {
  try {
    const { data, error } = await getPodSnapshotsByOrganization(organizationId)
    
    if (error) {
      console.error('Error fetching organization pod snapshots:', error)
      return { data: null, error: error.message || 'Failed to fetch organization pod snapshots' }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getPodsSnapshotByOrganization:', err)
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Server action to get telemetry readings for a specific pod
 */
export async function getPodTelemetry(
  podId: string,
  timeRange?: { start: Date; end: Date }
): Promise<{
  data: TelemetryReading[] | null
  error: string | null
}> {
  try {
    const dateRange = timeRange || {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h ago
      end: new Date(),
    }
    
    const { data, error } = await getTelemetryReadings(
      podId,
      dateRange,
      1000 // Last 1000 readings
    )
    
    if (error) {
      console.error('Error fetching telemetry:', error)
      return { data: null, error: error.message || 'Failed to fetch telemetry' }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getPodTelemetry:', err)
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Server action to get the latest telemetry reading for a pod
 * 
 * Note: TagoIO sends separate readings for each sensor, so we need to
 * get the latest non-null value for each metric from recent readings
 */
export async function getLatestReading(
  podId: string
): Promise<{
  data: TelemetryReading | null
  error: string | null
}> {
  try {
    // Use service client to bypass RLS
    const { createServiceClient } = await import('@/lib/supabase/service')
    const supabase = createServiceClient('US')
    
    // Get the last 50 readings to find latest non-null value for each sensor
    // (Need more because equipment and sensor data come in separate readings)
    const { data: readings, error } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', podId)
      .order('timestamp', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error('Error fetching latest reading:', error)
      return { data: null, error: error.message || 'Failed to fetch latest reading' }
    }
    
    if (!readings || readings.length === 0) {
      return { data: null, error: null }
    }
    
    // Combine the latest non-null values from recent readings
    const combined: TelemetryReading = {
      id: readings[0].id,
      pod_id: readings[0].pod_id,
      timestamp: readings[0].timestamp,
      temperature_c: readings.find(r => r.temperature_c !== null)?.temperature_c ?? null,
      humidity_pct: readings.find(r => r.humidity_pct !== null)?.humidity_pct ?? null,
      co2_ppm: readings.find(r => r.co2_ppm !== null)?.co2_ppm ?? null,
      vpd_kpa: readings.find(r => r.vpd_kpa !== null)?.vpd_kpa ?? null,
      light_intensity_pct: readings.find(r => r.light_intensity_pct !== null)?.light_intensity_pct ?? null,
      // Equipment boolean columns (only 8 that exist in DB schema)
      cooling_active: readings.find(r => r.cooling_active !== null)?.cooling_active ?? null,
      heating_active: readings.find(r => r.heating_active !== null)?.heating_active ?? null,
      dehumidifier_active: readings.find(r => r.dehumidifier_active !== null)?.dehumidifier_active ?? null,
      humidifier_active: readings.find(r => r.humidifier_active !== null)?.humidifier_active ?? null,
      co2_injection_active: readings.find(r => r.co2_injection_active !== null)?.co2_injection_active ?? null,
      exhaust_fan_active: readings.find(r => r.exhaust_fan_active !== null)?.exhaust_fan_active ?? null,
      circulation_fan_active: readings.find(r => r.circulation_fan_active !== null)?.circulation_fan_active ?? null,
      lights_on: readings.find(r => r.lights_on !== null)?.lights_on ?? null,
      // Note: irrigation, fogger, hepa_filter, uv_sterilization stored in equipment_states JSONB
      // Sensor faults
      temp_sensor_fault: readings.find(r => r.temp_sensor_fault !== null)?.temp_sensor_fault ?? null,
      humidity_sensor_fault: readings.find(r => r.humidity_sensor_fault !== null)?.humidity_sensor_fault ?? null,
      co2_sensor_fault: readings.find(r => r.co2_sensor_fault !== null)?.co2_sensor_fault ?? null,
      pressure_sensor_fault: readings.find(r => r.pressure_sensor_fault !== null)?.pressure_sensor_fault ?? null,
      communication_fault: readings.find(r => r.communication_fault !== null)?.communication_fault ?? null,
      active_recipe_id: readings.find(r => r.active_recipe_id !== null)?.active_recipe_id ?? null,
      raw_data: readings[0].raw_data,
      equipment_states: readings.find(r => r.equipment_states !== null)?.equipment_states ?? null,
      data_source: readings[0].data_source,
    }
    
    return { data: combined, error: null }
  } catch (err) {
    console.error('Unexpected error in getLatestReading:', err)
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Hourly aggregate reading from telemetry_readings_hourly table
 */
interface HourlyAggregateReading {
  pod_id: string;
  hour_start: string;
  temperature_c_avg: number | null;
  humidity_pct_avg: number | null;
  co2_ppm_avg: number | null;
  vpd_kpa_avg: number | null;
}

/**
 * Daily aggregate reading from telemetry_readings_daily table
 */
interface DailyAggregateReading {
  pod_id: string;
  day_start: string;
  temperature_c_avg: number | null;
  humidity_pct_avg: number | null;
  co2_ppm_avg: number | null;
  vpd_kpa_avg: number | null;
}

/**
 * Helper function to transform hourly aggregate to TelemetryReading format
 */
function transformHourlyToReading(
  aggregate: HourlyAggregateReading
): TelemetryReading {
  return {
    id: `hourly-${aggregate.hour_start}-${aggregate.pod_id}`,
    pod_id: aggregate.pod_id,
    timestamp: aggregate.hour_start,
    temperature_c: aggregate.temperature_c_avg,
    humidity_pct: aggregate.humidity_pct_avg,
    co2_ppm: aggregate.co2_ppm_avg,
    vpd_kpa: aggregate.vpd_kpa_avg,
    light_intensity_pct: null,
    cooling_active: null,
    heating_active: null,
    dehumidifier_active: null,
    humidifier_active: null,
    co2_injection_active: null,
    exhaust_fan_active: null,
    circulation_fan_active: null,
    lights_on: null,
    equipment_states: null,
    communication_fault: null,
    temp_sensor_fault: null,
    humidity_sensor_fault: null,
    co2_sensor_fault: null,
    pressure_sensor_fault: null,
    active_recipe_id: null,
    raw_data: null,
    data_source: 'calculated',
  };
}

/**
 * Helper function to transform daily aggregate to TelemetryReading format
 */
function transformDailyToReading(
  aggregate: DailyAggregateReading
): TelemetryReading {
  return {
    id: `daily-${aggregate.day_start}-${aggregate.pod_id}`,
    pod_id: aggregate.pod_id,
    timestamp: aggregate.day_start,
    temperature_c: aggregate.temperature_c_avg,
    humidity_pct: aggregate.humidity_pct_avg,
    co2_ppm: aggregate.co2_ppm_avg,
    vpd_kpa: aggregate.vpd_kpa_avg,
    light_intensity_pct: null,
    cooling_active: null,
    heating_active: null,
    dehumidifier_active: null,
    humidifier_active: null,
    co2_injection_active: null,
    exhaust_fan_active: null,
    circulation_fan_active: null,
    lights_on: null,
    equipment_states: null,
    communication_fault: null,
    temp_sensor_fault: null,
    humidity_sensor_fault: null,
    co2_sensor_fault: null,
    pressure_sensor_fault: null,
    active_recipe_id: null,
    raw_data: null,
    data_source: 'calculated',
  };
}

/**
 * Server action to get historical telemetry readings for charts
 * 
 * Uses smart table routing based on time range:
 * - <24h: Raw data from telemetry_readings (most recent, real-time)
 * - 24h-7d (168h): Hourly aggregates from telemetry_readings_hourly
 * - >7d: Daily aggregates from telemetry_readings_daily
 * 
 * This ensures data availability beyond the 48h raw retention period.
 */
export async function getHistoricalReadings(
  podId: string,
  hours: number = 24,
  limit: number = 1000
): Promise<{
  data: TelemetryReading[] | null
  error: string | null
}> {
  try {
    // Use service client to bypass RLS
    const { createServiceClient } = await import('@/lib/supabase/service')
    const supabase = createServiceClient('US')
    
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - hours)
    
    // Smart table routing based on time range
    let data: TelemetryReading[] = [];
    
    if (hours <= 24) {
      // Use raw data for recent readings (<24h) - most accurate and includes equipment states
      const { data: rawData, error } = await supabase
        .from('telemetry_readings')
        .select('*')
        .eq('pod_id', podId)
        .gte('timestamp', cutoffTime.toISOString())
        .order('timestamp', { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      data = (rawData as TelemetryReading[]) || [];
    } else if (hours <= 168) { // 7 days
      // Use hourly aggregates for 24h-7d range - data retained for 30 days
      const { data: hourlyData, error } = await supabase
        .from('telemetry_readings_hourly')
        .select('pod_id, hour_start, temperature_c_avg, humidity_pct_avg, co2_ppm_avg, vpd_kpa_avg')
        .eq('pod_id', podId)
        .gte('hour_start', cutoffTime.toISOString())
        .order('hour_start', { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      data = (hourlyData as HourlyAggregateReading[] || []).map(transformHourlyToReading);
    } else {
      // Use daily aggregates for >7d range - data retained for 1 year
      const { data: dailyData, error } = await supabase
        .from('telemetry_readings_daily')
        .select('pod_id, day_start, temperature_c_avg, humidity_pct_avg, co2_ppm_avg, vpd_kpa_avg')
        .eq('pod_id', podId)
        .gte('day_start', cutoffTime.toISOString())
        .order('day_start', { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      data = (dailyData as DailyAggregateReading[] || []).map(transformDailyToReading);
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getHistoricalReadings:', err)
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Server action to get custom date range readings directly from TagoIO
 * 
 * This bypasses Supabase storage and fetches data on-demand for custom date ranges.
 * Use this for historical data beyond the 7-day retention period.
 * 
 * @param podId - Pod ID to associate readings with
 * @param deviceToken - TagoIO device token for the pod
 * @param startDate - ISO 8601 start date
 * @param endDate - ISO 8601 end date
 * @returns Array of transformed telemetry readings (NOT stored in Supabase)
 */
export async function getCustomRangeReadings(
  podId: string,
  deviceToken: string,
  startDate: string,
  endDate: string
): Promise<{
  data: TelemetryReading[] | null
  error: string | null
}> {
  try {
    // Dynamically import to avoid issues with server-only code
    const { createTagoIOClient } = await import('@/lib/tagoio/client')
    const { transformTagoIOData } = await import('@/lib/tagoio/transformer')
    
    // Create client and fetch data
    const client = createTagoIOClient(deviceToken)
    const rawData = await client.fetchCustomRangeData(startDate, endDate)
    
    if (!rawData || rawData.length === 0) {
      return { data: [], error: null }
    }
    
    // Transform data but do NOT insert to database
    const transformResult = transformTagoIOData(rawData, podId)
    
    // Convert InsertTelemetryReading to TelemetryReading format and sort by timestamp ascending
    const readings: TelemetryReading[] = transformResult.successful
      .sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeA - timeB; // Ascending order (oldest to newest)
      })
      .map((reading, index) => ({
        id: `custom-${Date.now()}-${index}`, // Temporary ID since not stored
        pod_id: podId,
        timestamp: reading.timestamp || new Date().toISOString(),
      temperature_c: reading.temperature_c ?? null,
      humidity_pct: reading.humidity_pct ?? null,
      co2_ppm: reading.co2_ppm ?? null,
      vpd_kpa: reading.vpd_kpa ?? null,
      light_intensity_pct: null,
      cooling_active: reading.cooling_active ?? null,
      heating_active: null,
      dehumidifier_active: reading.dehumidifier_active ?? null,
      humidifier_active: null,
      co2_injection_active: reading.co2_injection_active ?? null,
      exhaust_fan_active: reading.exhaust_fan_active ?? null,
      circulation_fan_active: null,
      irrigation_active: null,
      lighting_active: null,
      fogger_active: null,
      hepa_filter_active: null,
      uv_sterilization_active: null,
      lights_on: reading.lights_on ?? null,
      temp_sensor_fault: null,
      humidity_sensor_fault: null,
      co2_sensor_fault: null,
      pressure_sensor_fault: null,
      communication_fault: null,
      active_recipe_id: null,
      raw_data: null,
      data_source: 'tagoio',
    }))
    
    return { data: readings, error: null }
  } catch (err) {
    console.error('Unexpected error in getCustomRangeReadings:', err)
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Server action to get active recipe for a scope (pod, room, batch, or batch_group)
 */
export async function getActiveRecipe(
  scopeType: 'pod' | 'room' | 'batch' | 'batch_group',
  scopeId: string
): Promise<{
  data: import('@/types/recipe').ActiveRecipeDetails | null
  error: string | null
}> {
  try {
    const { getActiveRecipeForScope } = await import('@/lib/supabase/queries/recipes')
    const { data, error } = await getActiveRecipeForScope(scopeType, scopeId)
    
    if (error) {
      console.error('Error fetching active recipe:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch active recipe' 
      }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getActiveRecipe:', err)
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    }
  }
}
