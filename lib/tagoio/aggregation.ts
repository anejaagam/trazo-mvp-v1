/**
 * TagoIO Data Aggregation Utilities
 * 
 * Provides smart interval aggregation for historical telemetry data.
 * Prevents database flooding by using appropriate time intervals:
 * - Last 24 hours: 1-minute intervals (max ~1,440 points)
 * - Last 7 days: 15-minute intervals (max ~672 points)
 * 
 * Created: November 7, 2025
 */

import type { TagoIODataPoint } from './client'

// ============================================================================
// Types
// ============================================================================

/**
 * Aggregated data point with min/max/avg values
 */
export interface AggregatedDataPoint {
  timestamp: string // ISO 8601 timestamp (rounded to interval)
  variable: string
  value: number // Average value
  min?: number
  max?: number
  count: number // Number of raw points in this interval
  device: string
  unit?: string
}

/**
 * Aggregation configuration
 */
export interface AggregationConfig {
  intervalMinutes: number // Time interval in minutes
  includeMinMax: boolean // Whether to include min/max in addition to average
}

// ============================================================================
// Aggregation Functions
// ============================================================================

/**
 * Aggregate data points by time interval
 * 
 * Groups data points into time buckets and calculates statistics.
 * For numeric values, computes average, min, max.
 * For boolean values (equipment states), uses majority vote.
 * 
 * @param dataPoints - Raw data points from TagoIO
 * @param config - Aggregation configuration
 * @returns Aggregated data points
 */
export function aggregateDataPoints(
  dataPoints: TagoIODataPoint[],
  config: AggregationConfig
): AggregatedDataPoint[] {
  if (dataPoints.length === 0) return []

  // Group by variable and time interval
  const buckets = new Map<string, Map<number, TagoIODataPoint[]>>()

  for (const point of dataPoints) {
    // Round timestamp to interval
    const timestamp = new Date(point.time).getTime()
    const intervalMs = config.intervalMinutes * 60 * 1000
    const bucketTime = Math.floor(timestamp / intervalMs) * intervalMs

    // Get or create variable bucket
    if (!buckets.has(point.variable)) {
      buckets.set(point.variable, new Map())
    }
    const variableBuckets = buckets.get(point.variable)!

    // Get or create time bucket
    if (!variableBuckets.has(bucketTime)) {
      variableBuckets.set(bucketTime, [])
    }
    variableBuckets.get(bucketTime)!.push(point)
  }

  // Aggregate each bucket
  const aggregated: AggregatedDataPoint[] = []

  buckets.forEach((timeBuckets) => {
    timeBuckets.forEach((points, bucketTime) => {
      const aggregatedPoint = aggregateBucket(
        points,
        new Date(bucketTime).toISOString(),
        config.includeMinMax
      )
      aggregated.push(aggregatedPoint)
    })
  })

  // Sort by timestamp (oldest first)
  return aggregated.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

/**
 * Aggregate a single time bucket of data points
 * 
 * @param points - Data points in this bucket (same variable, same time interval)
 * @param timestamp - Bucket timestamp (ISO 8601)
 * @param includeMinMax - Whether to calculate min/max
 * @returns Aggregated data point
 */
function aggregateBucket(
  points: TagoIODataPoint[],
  timestamp: string,
  includeMinMax: boolean
): AggregatedDataPoint {
  const firstPoint = points[0]
  const variable = firstPoint.variable
  const device = firstPoint.device
  const unit = firstPoint.unit

  // Check if values are numeric or boolean
  const firstValue = points[0].value
  const isBoolean = typeof firstValue === 'boolean' || 
                    (typeof firstValue === 'number' && (firstValue === 0 || firstValue === 1))

  if (isBoolean) {
    // For boolean/equipment states, use majority vote
    const trueCount = points.filter(p => {
      const val = p.value
      return val === 1 || val === '1' || String(val) === 'true'
    }).length
    const value = trueCount > points.length / 2 ? 1 : 0

    return {
      timestamp,
      variable,
      value,
      count: points.length,
      device,
      unit,
    }
  } else {
    // For numeric values, calculate statistics
    const numericValues = points
      .map(p => typeof p.value === 'number' ? p.value : parseFloat(String(p.value)))
      .filter(v => !isNaN(v))

    if (numericValues.length === 0) {
      // Fallback if no valid numeric values
      return {
        timestamp,
        variable,
        value: 0,
        count: points.length,
        device,
        unit,
      }
    }

    const avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
    
    const result: AggregatedDataPoint = {
      timestamp,
      variable,
      value: Math.round(avg * 100) / 100, // Round to 2 decimal places
      count: points.length,
      device,
      unit,
    }

    if (includeMinMax) {
      result.min = Math.min(...numericValues)
      result.max = Math.max(...numericValues)
    }

    return result
  }
}

/**
 * Get recommended aggregation config based on time range
 * 
 * @param startDate - Start of time range
 * @param endDate - End of time range
 * @returns Recommended aggregation configuration
 */
export function getRecommendedAggregation(
  startDate: Date,
  endDate: Date
): AggregationConfig {
  const durationMs = endDate.getTime() - startDate.getTime()
  const durationHours = durationMs / (1000 * 60 * 60)

  // Last 24 hours: 1-minute intervals
  if (durationHours <= 24) {
    return {
      intervalMinutes: 1,
      includeMinMax: false,
    }
  }
  
  // Last 7 days: 15-minute intervals
  if (durationHours <= 168) { // 7 days
    return {
      intervalMinutes: 15,
      includeMinMax: true,
    }
  }
  
  // Last 30 days: 1-hour intervals
  if (durationHours <= 720) { // 30 days
    return {
      intervalMinutes: 60,
      includeMinMax: true,
    }
  }
  
  // Longer ranges: 1-day intervals
  return {
    intervalMinutes: 1440, // 24 hours
    includeMinMax: true,
  }
}

/**
 * Deduplicate aggregated data points
 * Removes exact duplicates (same timestamp + variable + value)
 * 
 * @param points - Aggregated data points
 * @returns Deduplicated array
 */
export function deduplicateAggregatedPoints(
  points: AggregatedDataPoint[]
): AggregatedDataPoint[] {
  const seen = new Set<string>()
  const deduplicated: AggregatedDataPoint[] = []

  for (const point of points) {
    const key = `${point.timestamp}|${point.variable}`
    if (!seen.has(key)) {
      seen.add(key)
      deduplicated.push(point)
    }
  }

  return deduplicated
}

/**
 * Convert aggregated points back to TagoIO format
 * Useful for transformer compatibility
 * 
 * @param aggregated - Aggregated data points
 * @returns TagoIO-compatible data points
 */
export function convertAggregatedToTagoIO(
  aggregated: AggregatedDataPoint[]
): TagoIODataPoint[] {
  return aggregated.map(point => ({
    id: `${point.device}_${point.variable}_${point.timestamp}`,
    variable: point.variable,
    value: point.value,
    unit: point.unit,
    time: point.timestamp,
    device: point.device,
    group: '', // Not used in aggregation
    metadata: {
      aggregated: true,
      count: point.count,
      min: point.min,
      max: point.max,
    },
  }))
}
