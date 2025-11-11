/**
 * Telemetry Aggregation Service
 * 
 * Handles automatic aggregation of raw telemetry data into hourly and daily statistics.
 * Runs on a schedule to convert high-frequency data into optimized time-series aggregates.
 * 
 * Created: November 10, 2025
 */

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Types
// ============================================================================

export interface AggregationResult {
  timestamp: string
  hourlyAggregated: number
  dailyAggregated: number
  podsProcessed: number
  errors: string[]
  duration: number
}

export interface HourlyAggregationResult {
  podId: string
  podName: string
  hourStart: string
  samplesAggregated: number
  success: boolean
  error?: string
}

export interface DailyAggregationResult {
  podId: string
  podName: string
  dayStart: string
  hoursAggregated: number
  success: boolean
  error?: string
}

// ============================================================================
// Aggregation Service Class
// ============================================================================

export class TelemetryAggregationService {
  private supabaseClient?: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabaseClient = supabaseClient
  }

  /**
   * Get Supabase client (server or provided)
   */
  private async getClient(): Promise<SupabaseClient> {
    if (this.supabaseClient) {
      return this.supabaseClient
    }
    return await createClient()
  }

  // --------------------------------------------------------------------------
  // Hourly Aggregation
  // --------------------------------------------------------------------------

  /**
   * Aggregate raw telemetry data into hourly statistics for all pods
   * 
   * This should run every hour to process the previous hour's data.
   * Only aggregates data that hasn't been aggregated yet (aggregated_to_hourly = false)
   * 
   * @param hoursToProcess - Number of hours to look back (default: 2 for safety)
   * @returns Aggregation result summary
   */
  async aggregateHourly(hoursToProcess: number = 2): Promise<AggregationResult> {
    const startTime = Date.now()
    const result: AggregationResult = {
      timestamp: new Date().toISOString(),
      hourlyAggregated: 0,
      dailyAggregated: 0,
      podsProcessed: 0,
      errors: [],
      duration: 0,
    }

    try {
      const supabase = await this.getClient()

      // Get all active pods
      const { data: pods, error: podsError } = await supabase
        .from('pods')
        .select('id, name')
        .eq('is_active', true)

      if (podsError) {
        result.errors.push(`Failed to fetch pods: ${podsError.message}`)
        return result
      }

      if (!pods || pods.length === 0) {
        result.errors.push('No active pods found')
        return result
      }

      console.log(`Aggregating hourly data for ${pods.length} pods...`)
      result.podsProcessed = pods.length

      // Process each hour for each pod
      const now = new Date()
      const hoursToAggregate: Date[] = []
      
      for (let i = 1; i <= hoursToProcess; i++) {
        const hourStart = new Date(now)
        hourStart.setHours(now.getHours() - i, 0, 0, 0)
        hoursToAggregate.push(hourStart)
      }

      // Aggregate for each pod and each hour
      for (const pod of pods) {
        for (const hourStart of hoursToAggregate) {
          try {
            const { data, error } = await supabase
              .rpc('aggregate_telemetry_to_hourly', {
                p_pod_id: pod.id,
                p_hour_start: hourStart.toISOString(),
              })

            if (error) {
              result.errors.push(
                `Failed to aggregate ${pod.name} for ${hourStart.toISOString()}: ${error.message}`
              )
            } else if (data && data > 0) {
              result.hourlyAggregated += 1
              console.log(
                `✓ Aggregated ${pod.name} for hour ${hourStart.toISOString()}`
              )
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            result.errors.push(
              `Error aggregating ${pod.name} for ${hourStart.toISOString()}: ${errorMsg}`
            )
          }
        }
      }

      console.log(
        `Hourly aggregation complete: ${result.hourlyAggregated} hours aggregated`
      )

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      result.errors.push(`Aggregation service error: ${errorMsg}`)
      console.error(errorMsg)
    }

    result.duration = Date.now() - startTime
    return result
  }

  // --------------------------------------------------------------------------
  // Daily Aggregation
  // --------------------------------------------------------------------------

  /**
   * Aggregate hourly data into daily statistics for all pods
   * 
   * This should run once per day to process the previous day's data.
   * 
   * @param daysToProcess - Number of days to look back (default: 2 for safety)
   * @returns Aggregation result summary
   */
  async aggregateDaily(daysToProcess: number = 2): Promise<AggregationResult> {
    const startTime = Date.now()
    const result: AggregationResult = {
      timestamp: new Date().toISOString(),
      hourlyAggregated: 0,
      dailyAggregated: 0,
      podsProcessed: 0,
      errors: [],
      duration: 0,
    }

    try {
      const supabase = await this.getClient()

      // Get all active pods
      const { data: pods, error: podsError } = await supabase
        .from('pods')
        .select('id, name')
        .eq('is_active', true)

      if (podsError) {
        result.errors.push(`Failed to fetch pods: ${podsError.message}`)
        return result
      }

      if (!pods || pods.length === 0) {
        result.errors.push('No active pods found')
        return result
      }

      console.log(`Aggregating daily data for ${pods.length} pods...`)
      result.podsProcessed = pods.length

      // Process each day for each pod
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const daysToAggregate: Date[] = []
      for (let i = 1; i <= daysToProcess; i++) {
        const dayStart = new Date(today)
        dayStart.setDate(today.getDate() - i)
        daysToAggregate.push(dayStart)
      }

      // Aggregate for each pod and each day
      for (const pod of pods) {
        for (const dayStart of daysToAggregate) {
          try {
            const { data, error } = await supabase
              .rpc('aggregate_telemetry_to_daily', {
                p_pod_id: pod.id,
                p_day_start: dayStart.toISOString().split('T')[0], // YYYY-MM-DD format
              })

            if (error) {
              result.errors.push(
                `Failed to aggregate ${pod.name} for ${dayStart.toDateString()}: ${error.message}`
              )
            } else if (data && data > 0) {
              result.dailyAggregated += 1
              console.log(
                `✓ Aggregated ${pod.name} for day ${dayStart.toDateString()}`
              )
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            result.errors.push(
              `Error aggregating ${pod.name} for ${dayStart.toDateString()}: ${errorMsg}`
            )
          }
        }
      }

      console.log(
        `Daily aggregation complete: ${result.dailyAggregated} days aggregated`
      )

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      result.errors.push(`Aggregation service error: ${errorMsg}`)
      console.error(errorMsg)
    }

    result.duration = Date.now() - startTime
    return result
  }

  // --------------------------------------------------------------------------
  // Data Cleanup
  // --------------------------------------------------------------------------

  /**
   * Clean up old raw telemetry data that has been aggregated
   * 
   * This removes raw data older than the retention period to save storage.
   * Only deletes data that has been successfully aggregated.
   * 
   * @param retentionHours - How many hours of raw data to keep (default: 48)
   * @returns Number of rows deleted
   */
  async cleanupOldRawData(retentionHours: number = 48): Promise<number> {
    try {
      const supabase = await this.getClient()

      const { data, error } = await supabase
        .rpc('cleanup_old_telemetry_raw', {
          p_retention_hours: retentionHours,
        })

      if (error) {
        console.error('Cleanup error:', error.message)
        throw error
      }

      const deletedCount = data || 0
      console.log(`Cleaned up ${deletedCount} old raw telemetry readings`)
      return deletedCount

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`Cleanup failed: ${errorMsg}`)
      throw error
    }
  }

  // --------------------------------------------------------------------------
  // Gap Detection
  // --------------------------------------------------------------------------

  /**
   * Detect gaps in telemetry data for a specific pod
   * 
   * Useful for monitoring data quality and identifying polling issues.
   * 
   * @param podId - Pod ID to check
   * @param hoursBack - How many hours to look back (default: 24)
   * @returns Array of hours with data gaps
   */
  async detectDataGaps(
    podId: string,
    hoursBack: number = 24
  ): Promise<Array<{
    hour_start: string
    sample_count: number
    expected_samples: number
    completeness_pct: number
    has_gap: boolean
  }>> {
    try {
      const supabase = await this.getClient()

      const { data, error } = await supabase
        .rpc('detect_telemetry_gaps', {
          p_pod_id: podId,
          p_hours_back: hoursBack,
        })

      if (error) {
        console.error('Gap detection error:', error.message)
        throw error
      }

      return data || []

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`Gap detection failed: ${errorMsg}`)
      throw error
    }
  }

  // --------------------------------------------------------------------------
  // Full Aggregation Process
  // --------------------------------------------------------------------------

  /**
   * Run complete aggregation process: hourly + daily + cleanup
   * 
   * This is the main entry point for scheduled jobs.
   * 
   * @returns Combined result of all operations
   */
  async runFullAggregation(): Promise<{
    hourly: AggregationResult
    daily: AggregationResult
    cleanupDeleted: number
    totalDuration: number
  }> {
    const startTime = Date.now()

    console.log('🚀 Starting full telemetry aggregation process...')

    // Step 1: Hourly aggregation
    console.log('\n📊 Step 1: Hourly aggregation')
    const hourly = await this.aggregateHourly(2)

    // Step 2: Daily aggregation
    console.log('\n📊 Step 2: Daily aggregation')
    const daily = await this.aggregateDaily(2)

    // Step 3: Cleanup old raw data
    console.log('\n🧹 Step 3: Cleanup old raw data')
    const cleanupDeleted = await this.cleanupOldRawData(48)

    const totalDuration = Date.now() - startTime

    console.log(`\n✅ Full aggregation complete in ${totalDuration}ms`)
    console.log(`   - Hourly: ${hourly.hourlyAggregated} hours`)
    console.log(`   - Daily: ${daily.dailyAggregated} days`)
    console.log(`   - Cleaned: ${cleanupDeleted} rows`)

    return {
      hourly,
      daily,
      cleanupDeleted,
      totalDuration,
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Run hourly aggregation (for Vercel cron)
 */
export async function runHourlyAggregation(
  supabaseClient?: SupabaseClient
): Promise<AggregationResult> {
  const service = new TelemetryAggregationService(supabaseClient)
  return await service.aggregateHourly()
}

/**
 * Run daily aggregation (for Vercel cron)
 */
export async function runDailyAggregation(
  supabaseClient?: SupabaseClient
): Promise<AggregationResult> {
  const service = new TelemetryAggregationService(supabaseClient)
  return await service.aggregateDaily()
}

/**
 * Run full aggregation process (for Vercel cron)
 */
export async function runFullAggregation(
  supabaseClient?: SupabaseClient
): Promise<ReturnType<TelemetryAggregationService['runFullAggregation']>> {
  const service = new TelemetryAggregationService(supabaseClient)
  return await service.runFullAggregation()
}
