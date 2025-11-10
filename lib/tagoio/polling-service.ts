/**
 * TagoIO Polling Service
 * 
 * Orchestrates polling TagoIO devices, transforming data, and inserting to database.
 * Includes error handling, retry logic, and batch processing.
 * 
 * Used by Vercel Cron job to fetch telemetry data on a schedule.
 */

import { createTagoIOClient, type TagoIODataPoint } from './client'
import { 
  transformTagoIOData, 
  deduplicateReadings,
  sortReadingsByTimestamp,
  calculateTransformStats,
} from './transformer'
import { batchUpsertReadings } from '@/lib/supabase/queries/telemetry'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { InsertTelemetryReading } from '@/types/telemetry'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Types
// ============================================================================

/**
 * Pod configuration for polling
 */
interface PodConfig {
  id: string
  name: string
  tagoio_device_id: string
  site_id: string
}

/**
 * Result of polling a single device
 */
interface DevicePollingResult {
  podId: string
  podName: string
  deviceId: string
  success: boolean
  dataPointsReceived: number
  readingsTransformed: number
  readingsInserted: number
  errors: string[]
  duration: number
}

/**
 * Summary of entire polling operation
 */
export interface PollingServiceResult {
  timestamp: string
  podsPolled: number
  successfulPolls: number
  failedPolls: number
  totalDataPoints: number
  totalReadings: number
  totalInserted: number
  devices: DevicePollingResult[]
  errors: string[]
  duration: number
}

// ============================================================================
// Configuration
// ============================================================================

const BATCH_SIZE = 500 // Maximum records per batch insert
const MAX_RETRIES = 3   // Maximum retry attempts for transient failures
const RETRY_DELAY = 1000 // Delay between retries (ms)

// ============================================================================
// Main Polling Service Class
// ============================================================================

export class TagoIOPollingService {
  private supabaseClient?: SupabaseClient

  /**
   * Create a new polling service instance
   * @param supabaseClient - Optional Supabase client (for standalone scripts). If not provided, will use Next.js server client.
   */
  constructor(supabaseClient?: SupabaseClient) {
    this.supabaseClient = supabaseClient
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Poll all active pods with TagoIO device IDs
   * 
   * Main entry point for scheduled polling.
   * Fetches TagoIO tokens from database for each organization.
   * 
   * @param siteId - Optional site ID to filter pods (if not provided, polls all active pods)
   * @returns Summary of polling operation
   */
  async pollAllDevices(siteId?: string): Promise<PollingServiceResult> {
    const startTime = Date.now()
    const result: PollingServiceResult = {
      timestamp: new Date().toISOString(),
      podsPolled: 0,
      successfulPolls: 0,
      failedPolls: 0,
      totalDataPoints: 0,
      totalReadings: 0,
      totalInserted: 0,
      devices: [],
      errors: [],
      duration: 0,
    }

    try {
      // Get active pods with TagoIO device IDs and their organization tokens
      const podsWithTokens = await this.getActivePodsWithTokens(siteId)

      if (podsWithTokens.length === 0) {
        const msg = siteId 
          ? `No active pods with TagoIO device IDs found for site ${siteId}`
          : 'No active pods with TagoIO device IDs found'
        result.errors.push(msg)
        console.warn(msg)
        result.duration = Date.now() - startTime
        return result
      }

      console.log(`Polling ${podsWithTokens.length} pods...`)
      result.podsPolled = podsWithTokens.length

      // Poll each device sequentially to avoid rate limits
      for (const { pod, token} of podsWithTokens) {
        try {
          const deviceResult = await this.pollSingleDevice(pod, token)
          result.devices.push(deviceResult)

          if (deviceResult.success) {
            result.successfulPolls++
            result.totalDataPoints += deviceResult.dataPointsReceived
            result.totalReadings += deviceResult.readingsTransformed
            result.totalInserted += deviceResult.readingsInserted
          } else {
            result.failedPolls++
            result.errors.push(...deviceResult.errors)
          }
        } catch (error) {
          result.failedPolls++
          const errorMsg = `Failed to poll pod ${pod.name}: ${error instanceof Error ? error.message : String(error)}`
          result.errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

    } catch (error) {
      const errorMsg = `Polling service error: ${error instanceof Error ? error.message : String(error)}`
      result.errors.push(errorMsg)
      console.error(errorMsg)
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * Poll a single device and insert data
   * 
   * @param pod - Pod configuration with TagoIO device ID
   * @param token - TagoIO device token for this organization
   * @returns Result of polling operation
   */
  async pollSingleDevice(pod: PodConfig, token: string): Promise<DevicePollingResult> {
    const startTime = Date.now()
    const result: DevicePollingResult = {
      podId: pod.id,
      podName: pod.name,
      deviceId: pod.tagoio_device_id,
      success: false,
      dataPointsReceived: 0,
      readingsTransformed: 0,
      readingsInserted: 0,
      errors: [],
      duration: 0,
    }

    try {
      console.log(`Polling device ${pod.tagoio_device_id} for pod ${pod.name}...`)

      // Fetch data from TagoIO
      const dataPoints = await this.fetchDeviceData(pod.tagoio_device_id, token)
      result.dataPointsReceived = dataPoints.length

      if (dataPoints.length === 0) {
        console.log(`No new data for pod ${pod.name}`)
        result.success = true // Not an error, just no data
        result.duration = Date.now() - startTime
        return result
      }

      // Transform data to Trazo schema
      const transformation = transformTagoIOData(dataPoints, pod.id)
      result.readingsTransformed = transformation.successful.length

      if (transformation.errors.length > 0) {
        const stats = calculateTransformStats(transformation)
        console.warn(
          `Transformation had ${transformation.errors.length} errors for pod ${pod.name}`,
          stats.errorsByType
        )
        result.errors.push(
          ...transformation.errors.map((e) => `${e.timestamp}: ${e.error}`)
        )
      }

      if (transformation.successful.length === 0) {
        result.errors.push('No valid readings after transformation')
        result.duration = Date.now() - startTime
        return result
      }

      // Deduplicate and sort readings
      const deduplicated = deduplicateReadings(transformation.successful)
      const sorted = sortReadingsByTimestamp(deduplicated)

      // Insert to database in batches
      const inserted = await this.insertReadings(sorted, pod.id)
      result.readingsInserted = inserted
      result.success = true

      console.log(
        `Successfully polled pod ${pod.name}: ` +
        `${dataPoints.length} data points → ` +
        `${transformation.successful.length} readings → ` +
        `${inserted} inserted`
      )

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      result.errors.push(errorMsg)
      console.error(`Error polling pod ${pod.name}:`, error)
    }

    result.duration = Date.now() - startTime
    return result
  }

  // --------------------------------------------------------------------------
  // Private Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Get active pods with TagoIO device tokens
   * Each pod has its own device token (device tokens are device-specific in TagoIO)
   */
  private async getActivePodsWithTokens(
    siteId?: string
  ): Promise<Array<{ pod: PodConfig; token: string }>> {
    const supabase = this.supabaseClient || await createClient()

    // Get pods with device tokens, joining through rooms to get site_id
    let query = supabase
      .from('pods')
      .select(`
        id, 
        name, 
        tagoio_device_id,
        tagoio_device_token,
        rooms!inner(site_id)
      `)
      .eq('is_active', true)
      .not('tagoio_device_token', 'is', null)  // Must have device token

    if (siteId) {
      query = query.eq('rooms.site_id', siteId)
    }

    const { data: podsData, error: podsError } = await query

    if (podsError) {
      throw new Error(`Failed to fetch pods: ${podsError.message}`)
    }

    if (!podsData || podsData.length === 0) {
      return []
    }

    // Map pods to their tokens (stored directly on pod)
    interface PodWithToken {
      id: string
      name: string
      tagoio_device_id: string | null
      tagoio_device_token: string
      rooms: Array<{ site_id: string }>
    }

    const typedPodsData = podsData as PodWithToken[]
    const result: Array<{ pod: PodConfig; token: string }> = []
    
    for (const podData of typedPodsData) {
      result.push({
        pod: {
          id: podData.id,
          name: podData.name,
          tagoio_device_id: podData.tagoio_device_id || podData.id,  // Fallback to pod ID if device_id not set
          site_id: podData.rooms[0]?.site_id || '',
        },
        token: podData.tagoio_device_token,
      })
    }

    return result
  }

  /**
   * Fetch latest data from TagoIO device
   */
  private async fetchDeviceData(
    deviceId: string,
    token: string,
    retryCount = 0
  ): Promise<TagoIODataPoint[]> {
    try {
      const client = createTagoIOClient(token)

      // Get data from last 5 minutes to avoid re-processing old data
      // Adjust this based on polling frequency
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      const dataPoints = await client.fetchDataSince(
        fiveMinutesAgo,
        ['temp', 'hum', 'co2', 'light_state', 'co2_valve', 'cooling_valve', 'ex_fan', 'dehum'] // Sensors + equipment status
      )

      return dataPoints

    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.warn(
          `Fetch failed for device ${deviceId} (attempt ${retryCount + 1}/${MAX_RETRIES + 1}), retrying...`
        )

        // Exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, retryCount)
        await new Promise((resolve) => setTimeout(resolve, delay))

        return this.fetchDeviceData(deviceId, token, retryCount + 1)
      }

      throw error
    }
  }

  /**
   * Insert readings to database in batches
   * Uses UPSERT to handle potential partial data conflicts from TagoIO
   */
  private async insertReadings(
    readings: InsertTelemetryReading[],
    podId: string
  ): Promise<number> {
    if (readings.length === 0) return 0

    let totalInserted = 0

    try {
      // Process in batches to avoid hitting database limits
      for (let i = 0; i < readings.length; i += BATCH_SIZE) {
        const batch = readings.slice(i, i + BATCH_SIZE)

        console.log(
          `Upserting batch ${Math.floor(i / BATCH_SIZE) + 1} ` +
          `(${batch.length} readings) for pod ${podId}...`
        )

        // Use custom Supabase client if provided (for scripts), otherwise use Next.js server client
        if (this.supabaseClient) {
          // For standalone scripts, try insert first, fall back to merge upsert on conflict
          const { error: insertError } = await this.supabaseClient
            .from('telemetry_readings')
            .insert(batch)

          if (insertError) {
            // If duplicate key error, use merge upsert instead
            if (insertError.code === '23505') { // PostgreSQL unique violation
              console.log(`Duplicate detected, using merge upsert for batch...`)
              
              // Call merge function for each reading in batch
              for (const reading of batch) {
                const { error: upsertError } = await this.supabaseClient.rpc(
                  'merge_upsert_telemetry_reading',
                  { reading: reading as unknown as Record<string, unknown> }
                )
                
                if (!upsertError) {
                  totalInserted++
                }
              }
            } else {
              console.error(`Batch insert error:`, insertError)
              throw insertError
            }
          } else {
            totalInserted += batch.length
          }
        } else {
          // For Next.js server, use batchUpsertReadings which handles merging
          const { data, error } = await batchUpsertReadings(batch)

          if (error) {
            console.error(`Batch upsert error:`, error)
            throw error
          }
          
          totalInserted += data?.count || 0
        }
      }

      return totalInserted

    } catch (error) {
      console.error('Failed to insert readings:', error)
      throw error
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a polling service instance
 * 
 * When called outside of Next.js request context (e.g., standalone scripts),
 * automatically creates a service role client.
 * 
 * @returns Configured polling service
 * 
 * @example
 * const service = createPollingService()
 * const result = await service.pollAllDevices()
 * console.log(`Polled ${result.podsPolled} pods, inserted ${result.totalInserted} readings`)
 */
export function createPollingService(): TagoIOPollingService {
  // Check if we're in standalone mode (outside Next.js request context)
  const isStandalone = !process.env.NEXT_RUNTIME
  
  if (isStandalone) {
    // Create service role client for standalone scripts
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
    }
    
    const supabase = createServiceClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    return new TagoIOPollingService(supabase)
  }
  
  // In Next.js context, use default (will call createClient from server)
  return new TagoIOPollingService()
}

// ============================================================================
// Standalone Polling Function (For Cron Jobs)
// ============================================================================

/**
 * Poll all devices and return result
 * 
 * Simplified interface for Vercel Cron jobs.
 * Fetches TagoIO tokens from database for each organization.
 * 
 * @param siteId - Optional site ID to filter pods
 * @returns Polling result summary
 * 
 * @example
 * // In Vercel Cron handler
 * export async function GET() {
 *   const result = await pollDevices()
 *   return Response.json(result)
 * }
 */
export async function pollDevices(
  siteId?: string
): Promise<PollingServiceResult> {
  const service = createPollingService()
  return service.pollAllDevices(siteId)
}
