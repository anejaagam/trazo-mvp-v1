'use server'

import { getPodSnapshots, getTelemetryReadings } from '@/lib/supabase/queries/telemetry'
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
      cooling_active: readings.find(r => r.cooling_active !== null)?.cooling_active ?? null,
      heating_active: readings.find(r => r.heating_active !== null)?.heating_active ?? null,
      dehumidifier_active: readings.find(r => r.dehumidifier_active !== null)?.dehumidifier_active ?? null,
      humidifier_active: readings.find(r => r.humidifier_active !== null)?.humidifier_active ?? null,
      co2_injection_active: readings.find(r => r.co2_injection_active !== null)?.co2_injection_active ?? null,
      exhaust_fan_active: readings.find(r => r.exhaust_fan_active !== null)?.exhaust_fan_active ?? null,
      circulation_fan_active: readings.find(r => r.circulation_fan_active !== null)?.circulation_fan_active ?? null,
      irrigation_active: readings.find(r => r.irrigation_active !== null)?.irrigation_active ?? null,
      lighting_active: readings.find(r => r.lighting_active !== null)?.lighting_active ?? null,
      fogger_active: readings.find(r => r.fogger_active !== null)?.fogger_active ?? null,
      hepa_filter_active: readings.find(r => r.hepa_filter_active !== null)?.hepa_filter_active ?? null,
      uv_sterilization_active: readings.find(r => r.uv_sterilization_active !== null)?.uv_sterilization_active ?? null,
      lights_on: readings.find(r => r.lights_on !== null)?.lights_on ?? null,
      temp_sensor_fault: readings.find(r => r.temp_sensor_fault !== null)?.temp_sensor_fault ?? null,
      humidity_sensor_fault: readings.find(r => r.humidity_sensor_fault !== null)?.humidity_sensor_fault ?? null,
      co2_sensor_fault: readings.find(r => r.co2_sensor_fault !== null)?.co2_sensor_fault ?? null,
      pressure_sensor_fault: readings.find(r => r.pressure_sensor_fault !== null)?.pressure_sensor_fault ?? null,
      communication_fault: readings.find(r => r.communication_fault !== null)?.communication_fault ?? null,
      active_recipe_id: readings.find(r => r.active_recipe_id !== null)?.active_recipe_id ?? null,
      raw_data: readings[0].raw_data,
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
 * Server action to get historical telemetry readings for charts
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
    
    const { data, error } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', podId)
      .gte('timestamp', cutoffTime.toISOString())
      .order('timestamp', { ascending: true })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching historical readings:', error)
      return { data: null, error: error.message || 'Failed to fetch historical readings' }
    }
    
    return { data: data || [], error: null }
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
