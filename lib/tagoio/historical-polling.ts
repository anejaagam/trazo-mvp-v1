/**
 * Historical Data Polling Service
 * 
 * Fetches and stores historical telemetry data from TagoIO with smart aggregation.
 * Prevents duplicates and database flooding by using appropriate time intervals.
 * 
 * Created: November 7, 2025
 */

import { createTagoIOClient } from './client'
import { 
  aggregateDataPoints, 
  getRecommendedAggregation,
  convertAggregatedToTagoIO,
  deduplicateAggregatedPoints,
} from './aggregation'
import { transformTagoIOData } from './transformer'
import { batchUpsertReadings } from '@/lib/supabase/queries/telemetry'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { InsertTelemetryReading } from '@/types/telemetry'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Types
// ============================================================================

interface PodConfig {
  id: string
  name: string
  tagoio_device_id: string
  site_id: string
}

interface PodWithSite {
  id: string
  name: string
  tagoio_device_id: string | null
  site_id: string
  sites: {
    organization_id: string
  }
}

interface HistoricalPollResult {
  podId: string
  podName: string
  deviceId: string
  success: boolean
  dataPointsReceived: number
  dataPointsAggregated: number
  readingsInserted: number
  timeRange: {
    start: string
    end: string
  }
  errors: string[]
  duration: number
}

export interface HistoricalPollingResult {
  timestamp: string
  podsPolled: number
  successfulPolls: number
  failedPolls: number
  totalDataPoints: number
  totalAggregated: number
  totalInserted: number
  devices: HistoricalPollResult[]
  errors: string[]
  duration: number
}

// ============================================================================
// Configuration
// ============================================================================

const BATCH_SIZE = 500 // Maximum records per batch upsert

// ============================================================================
// Historical Polling Service
// ============================================================================

export class HistoricalPollingService {
  private supabaseClient?: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabaseClient = supabaseClient
  }

  /**
   * Poll historical data for all active pods
   * Fetches last 24 hours (1-min intervals) and last 7 days (15-min intervals)
   * 
   * @param siteId - Optional site ID to filter pods
   * @returns Summary of historical polling operation
   */
  async pollHistoricalData(siteId?: string): Promise<HistoricalPollingResult> {
    const startTime = Date.now()
    const result: HistoricalPollingResult = {
      timestamp: new Date().toISOString(),
      podsPolled: 0,
      successfulPolls: 0,
      failedPolls: 0,
      totalDataPoints: 0,
      totalAggregated: 0,
      totalInserted: 0,
      devices: [],
      errors: [],
      duration: 0,
    }

    try {
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

      console.log(`Polling historical data for ${podsWithTokens.length} pods...`)
      result.podsPolled = podsWithTokens.length

      // Poll each device sequentially
      for (const { pod, token } of podsWithTokens) {
        try {
          // Poll last 24 hours (1-min intervals)
          const last24hResult = await this.pollTimeRange(
            pod,
            token,
            new Date(Date.now() - 24 * 60 * 60 * 1000),
            new Date(),
            '24 hours'
          )

          // Poll last 7 days (15-min intervals)
          const last7dResult = await this.pollTimeRange(
            pod,
            token,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            new Date(Date.now() - 24 * 60 * 60 * 1000), // Start after 24h to avoid overlap
            '7 days'
          )

          // Combine results
          const combinedResult: HistoricalPollResult = {
            podId: pod.id,
            podName: pod.name,
            deviceId: pod.tagoio_device_id,
            success: last24hResult.success && last7dResult.success,
            dataPointsReceived: last24hResult.dataPointsReceived + last7dResult.dataPointsReceived,
            dataPointsAggregated: last24hResult.dataPointsAggregated + last7dResult.dataPointsAggregated,
            readingsInserted: last24hResult.readingsInserted + last7dResult.readingsInserted,
            timeRange: {
              start: last7dResult.timeRange.start,
              end: last24hResult.timeRange.end,
            },
            errors: [...last24hResult.errors, ...last7dResult.errors],
            duration: last24hResult.duration + last7dResult.duration,
          }

          result.devices.push(combinedResult)

          if (combinedResult.success) {
            result.successfulPolls++
            result.totalDataPoints += combinedResult.dataPointsReceived
            result.totalAggregated += combinedResult.dataPointsAggregated
            result.totalInserted += combinedResult.readingsInserted
          } else {
            result.failedPolls++
            result.errors.push(...combinedResult.errors)
          }

          console.log(
            `Completed historical poll for ${pod.name}: ` +
            `${combinedResult.dataPointsReceived} points → ` +
            `${combinedResult.dataPointsAggregated} aggregated → ` +
            `${combinedResult.readingsInserted} inserted`
          )

        } catch (error) {
          result.failedPolls++
          const errorMsg = `Failed to poll pod ${pod.name}: ${error instanceof Error ? error.message : String(error)}`
          result.errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

    } catch (error) {
      const errorMsg = `Historical polling service error: ${error instanceof Error ? error.message : String(error)}`
      result.errors.push(errorMsg)
      console.error(errorMsg)
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * Poll a specific time range for a single device
   * 
   * @param pod - Pod configuration
   * @param token - TagoIO device token
   * @param startDate - Start of time range
   * @param endDate - End of time range
   * @param label - Label for logging (e.g., "24 hours", "7 days")
   * @returns Result of polling operation
   */
  private async pollTimeRange(
    pod: PodConfig,
    token: string,
    startDate: Date,
    endDate: Date,
    label: string
  ): Promise<HistoricalPollResult> {
    const startTime = Date.now()
    const result: HistoricalPollResult = {
      podId: pod.id,
      podName: pod.name,
      deviceId: pod.tagoio_device_id,
      success: false,
      dataPointsReceived: 0,
      dataPointsAggregated: 0,
      readingsInserted: 0,
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      errors: [],
      duration: 0,
    }

    try {
      console.log(`Fetching ${label} data for ${pod.name}...`)

      // Create TagoIO client
      const client = createTagoIOClient(token)

      // Fetch data from TagoIO
      const dataPoints = await client.fetchDataInTimeRange(
        startDate.toISOString(),
        endDate.toISOString(),
        ['temp', 'hum', 'co2', 'light_state', 'co2_valve', 'cooling_valve', 'ex_fan', 'dehum']
      )

      result.dataPointsReceived = dataPoints.length

      if (dataPoints.length === 0) {
        console.log(`No ${label} data for ${pod.name}`)
        result.success = true
        result.duration = Date.now() - startTime
        return result
      }

      // Get recommended aggregation config based on time range
      const aggConfig = getRecommendedAggregation(startDate, endDate)
      console.log(`Using ${aggConfig.intervalMinutes}-minute intervals for ${label}`)

      // Aggregate data points
      const aggregated = aggregateDataPoints(dataPoints, aggConfig)
      const deduplicated = deduplicateAggregatedPoints(aggregated)
      result.dataPointsAggregated = deduplicated.length

      // Convert back to TagoIO format for transformer
      const tagoioFormatted = convertAggregatedToTagoIO(deduplicated)

      // Transform to Trazo schema
      const transformation = transformTagoIOData(tagoioFormatted, pod.id)

      if (transformation.errors.length > 0) {
        console.warn(`Transformation had ${transformation.errors.length} errors for ${pod.name} (${label})`)
        result.errors.push(
          ...transformation.errors.map((e) => `${e.timestamp}: ${e.error}`)
        )
      }

      if (transformation.successful.length === 0) {
        result.errors.push(`No valid readings after transformation for ${label}`)
        result.duration = Date.now() - startTime
        return result
      }

      // Upsert to database in batches
      const inserted = await this.upsertReadings(transformation.successful, pod.id)
      result.readingsInserted = inserted
      result.success = true

      console.log(
        `Successfully polled ${label} for ${pod.name}: ` +
        `${dataPoints.length} points → ${deduplicated.length} aggregated → ${inserted} upserted`
      )

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      result.errors.push(errorMsg)
      console.error(`Error polling ${label} for ${pod.name}:`, error)
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * Upsert readings to database in batches
   * 
   * @param readings - Transformed telemetry readings
   * @param podId - Pod ID for logging
   * @returns Total number of readings inserted/updated
   */
  private async upsertReadings(readings: InsertTelemetryReading[], podId: string): Promise<number> {
    let totalInserted = 0

    // Process in batches to avoid memory issues
    for (let i = 0; i < readings.length; i += BATCH_SIZE) {
      const batch = readings.slice(i, i + BATCH_SIZE)
      
      const result = await batchUpsertReadings(batch)
      
      if (result.error) {
        console.error(`Error upserting batch for pod ${podId}:`, result.error)
        throw result.error
      }

      totalInserted += result.data?.count || 0
    }

    return totalInserted
  }

  /**
   * Get active pods with TagoIO device IDs and their organization tokens
   * 
   * @param siteId - Optional site ID filter
   * @returns Array of pods with tokens
   */
  private async getActivePodsWithTokens(
    siteId?: string
  ): Promise<Array<{ pod: PodConfig; token: string }>> {
    const supabase = this.supabaseClient || (await createClient())

    // Get pods with TagoIO device IDs
    let podsQuery = supabase
      .from('pods')
      .select(`
        id,
        name,
        tagoio_device_id,
        site_id,
        sites!inner (
          organization_id
        )
      `)
      .eq('is_active', true)
      .not('tagoio_device_id', 'is', null)

    if (siteId) {
      podsQuery = podsQuery.eq('site_id', siteId)
    }

    const { data: pods, error: podsError } = await podsQuery

    if (podsError) {
      console.error('Error fetching pods:', podsError)
      return []
    }

    if (!pods || pods.length === 0) {
      return []
    }

    // Type-safe pod data
    const typedPods = pods as unknown as PodWithSite[]

    // Get unique organization IDs
    const orgIds = [...new Set(typedPods.map(p => p.sites.organization_id))]

    // Fetch TagoIO tokens for these organizations
    const { data: settings, error: settingsError } = await supabase
      .from('integration_settings')
      .select('organization_id, tagoio_device_token')
      .in('organization_id', orgIds)
      .not('tagoio_device_token', 'is', null)

    if (settingsError) {
      console.error('Error fetching integration settings:', settingsError)
      return []
    }

    if (!settings || settings.length === 0) {
      console.warn('No TagoIO tokens found for organizations')
      return []
    }

    // Create map of org_id -> token
    const tokenMap = new Map(
      settings.map(s => [s.organization_id, s.tagoio_device_token!])
    )

    // Match pods with tokens
    const podsWithTokens = typedPods
      .map(pod => {
        const orgId = pod.sites.organization_id
        const token = tokenMap.get(orgId)
        if (!token) return null

        return {
          pod: {
            id: pod.id,
            name: pod.name,
            tagoio_device_id: pod.tagoio_device_id!,
            site_id: pod.site_id,
          },
          token,
        }
      })
      .filter((p): p is { pod: PodConfig; token: string } => p !== null)

    return podsWithTokens
  }
}

/**
 * Convenience function to poll historical data
 * Creates a service instance and runs historical polling
 * 
 * @param siteId - Optional site ID to filter pods
 * @returns Historical polling result
 */
export async function pollHistoricalDevices(
  siteId?: string
): Promise<HistoricalPollingResult> {
  // Use service role key for standalone scripts
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const supabase = createServiceClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const service = new HistoricalPollingService(supabase)
  return service.pollHistoricalData(siteId)
}
