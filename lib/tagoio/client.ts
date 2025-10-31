/**
 * TagoIO Client Library
 * 
 * Handles HTTP communication with TagoIO API for telemetry data retrieval.
 * Includes authentication, error handling, retry logic, and type-safe responses.
 * 
 * @see TAGOIO_API_ANALYSIS.md for API structure documentation
 */

// ============================================================================
// Types
// ============================================================================

/**
 * TagoIO data point structure returned by the API
 */
export interface TagoIODataPoint {
  id: string
  variable: string           // "temp", "hum", "co2", "light_state", etc.
  value: number | string     // Sensor value
  unit?: string             // "°F", "%", "ppm", etc.
  time: string              // ISO 8601 timestamp
  device: string            // Device ID
  group: string             // Group ID
  metadata: Record<string, unknown>  // Variable-specific metadata
}

/**
 * Device information from TagoIO /info endpoint
 */
export interface TagoIODeviceInfo {
  id: string
  name: string
  active: boolean
  visible: boolean
  type: string
  last_input: string
  created_at: string
  bucket: {
    id: string
    name: string
  }
  tags: Array<{
    key: string
    value: string
  }>
}

/**
 * Standard TagoIO API response wrapper
 */
interface TagoIOResponse<T> {
  status: boolean
  result: T
}

/**
 * Query parameters for data endpoint
 */
export interface TagoIODataQuery {
  qty?: number              // Limit number of results
  start_date?: string       // ISO 8601 start date
  end_date?: string         // ISO 8601 end date
  variables?: string[]      // Filter by variable names
}

/**
 * Error details from TagoIO API
 */
export interface TagoIOError {
  message: string
  code?: string
  details?: unknown
}

// ============================================================================
// Configuration
// ============================================================================

const TAGOIO_BASE_URL = 'https://api.tago.io'
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// ============================================================================
// TagoIO Client Class
// ============================================================================

export class TagoIOClient {
  private deviceToken: string
  private baseUrl: string
  private timeout: number

  constructor(
    deviceToken: string,
    options: { baseUrl?: string; timeout?: number } = {}
  ) {
    if (!deviceToken) {
      throw new Error('TagoIO device token is required')
    }

    this.deviceToken = deviceToken
    this.baseUrl = options.baseUrl || TAGOIO_BASE_URL
    this.timeout = options.timeout || DEFAULT_TIMEOUT
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Fetch device information and metadata
   * 
   * @returns Device information including name, status, tags, etc.
   * @throws Error if request fails after retries
   */
  async fetchDeviceInfo(): Promise<TagoIODeviceInfo> {
    const response = await this.makeRequest<TagoIODeviceInfo>(
      '/info',
      { method: 'GET' }
    )
    return response
  }

  /**
   * Fetch latest telemetry data points
   * 
   * @param query - Optional query parameters (qty, date range, variables)
   * @returns Array of data points
   * @throws Error if request fails after retries
   * 
   * @example
   * // Get last 100 readings
   * const data = await client.fetchLatestData({ qty: 100 })
   * 
   * @example
   * // Get temperature readings in last hour
   * const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
   * const data = await client.fetchLatestData({
   *   start_date: oneHourAgo,
   *   variables: ['temp']
   * })
   */
  async fetchLatestData(query?: TagoIODataQuery): Promise<TagoIODataPoint[]> {
    const url = this.buildDataUrl(query)
    const response = await this.makeRequest<TagoIODataPoint[]>(
      url,
      { method: 'GET' }
    )
    return response
  }

  /**
   * Fetch data within a specific time range
   * 
   * @param startDate - Start of time range (ISO 8601)
   * @param endDate - End of time range (ISO 8601)
   * @param variables - Optional array of variable names to filter
   * @returns Array of data points
   * @throws Error if request fails after retries
   * 
   * @example
   * const data = await client.fetchDataInTimeRange(
   *   '2025-10-30T00:00:00Z',
   *   '2025-10-30T23:59:59Z',
   *   ['temp', 'hum', 'co2']
   * )
   */
  async fetchDataInTimeRange(
    startDate: string,
    endDate: string,
    variables?: string[]
  ): Promise<TagoIODataPoint[]> {
    return this.fetchLatestData({
      start_date: startDate,
      end_date: endDate,
      variables,
    })
  }

  /**
   * Fetch data since a specific timestamp
   * 
   * @param since - ISO 8601 timestamp
   * @param variables - Optional array of variable names to filter
   * @returns Array of data points
   * @throws Error if request fails after retries
   */
  async fetchDataSince(
    since: string,
    variables?: string[]
  ): Promise<TagoIODataPoint[]> {
    return this.fetchLatestData({
      start_date: since,
      variables,
    })
  }

  /**
   * Fetch custom date range data for on-demand queries
   * This is a convenience wrapper for fetchDataInTimeRange that enforces
   * the standard sensor + equipment variable set.
   * 
   * Used for custom date range queries that bypass Supabase storage.
   * 
   * @param startDate - Start of time range (ISO 8601)
   * @param endDate - End of time range (ISO 8601)
   * @returns Array of data points for all sensor + equipment variables
   * @throws Error if request fails after retries
   * 
   * @example
   * // Fetch data for a specific week
   * const data = await client.fetchCustomRangeData(
   *   '2025-10-01T00:00:00Z',
   *   '2025-10-07T23:59:59Z'
   * )
   */
  async fetchCustomRangeData(
    startDate: string,
    endDate: string
  ): Promise<TagoIODataPoint[]> {
    // Fetch all sensor + equipment variables
    const variables = [
      'temp',
      'hum',
      'co2',
      'light_state',
      'co2_valve',
      'cooling_valve',
      'ex_fan',
      'dehum'
    ]
    
    return this.fetchDataInTimeRange(startDate, endDate, variables)
  }

  // --------------------------------------------------------------------------
  // Private Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Build URL for data endpoint with query parameters
   */
  private buildDataUrl(query?: TagoIODataQuery): string {
    if (!query) return '/data'

    const params = new URLSearchParams()

    if (query.qty) {
      params.append('qty', query.qty.toString())
    }
    if (query.start_date) {
      params.append('start_date', query.start_date)
    }
    if (query.end_date) {
      params.append('end_date', query.end_date)
    }
    if (query.variables && query.variables.length > 0) {
      // TagoIO expects multiple variable params: ?variables=temp&variables=hum
      query.variables.forEach((v) => params.append('variables', v))
    }

    const queryString = params.toString()
    return queryString ? `/data?${queryString}` : '/data'
  }

  /**
   * Make HTTP request to TagoIO API with retry logic
   */
  private async makeRequest<T>(
    path: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...options,
        headers: {
          'Device-Token': this.deviceToken,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text()
        let errorData: TagoIOError

        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }

        throw new TagoIOApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      // Parse response
      const data: TagoIOResponse<T> = await response.json()

      if (!data.status) {
        throw new TagoIOApiError(
          'API returned status: false',
          response.status,
          data
        )
      }

      return data.result

    } catch (error) {
      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TagoIOApiError(
          `Request timeout after ${this.timeout}ms`,
          408,
          error
        )
      }

      // Retry logic for transient errors
      if (retryCount < MAX_RETRIES && this.shouldRetry(error)) {
        console.warn(
          `TagoIO request failed (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`,
          error
        )

        // Exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, retryCount)
        await new Promise((resolve) => setTimeout(resolve, delay))

        return this.makeRequest<T>(path, options, retryCount + 1)
      }

      // Re-throw if not retrying
      throw error
    }
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetry(error: unknown): boolean {
    if (!(error instanceof TagoIOApiError)) {
      // Network errors, timeouts, etc. should be retried
      return true
    }

    // Retry on server errors (5xx) and rate limits (429)
    return (
      error.statusCode >= 500 ||
      error.statusCode === 429 ||
      error.statusCode === 408 // Timeout
    )
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class TagoIOApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'TagoIOApiError'
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a TagoIO client instance
 * 
 * @param deviceToken - TagoIO device token
 * @returns Configured TagoIO client
 * 
 * @example
 * const client = createTagoIOClient(process.env.TAGOIO_DEVICE_TOKEN!)
 * const data = await client.fetchLatestData({ qty: 100 })
 */
export function createTagoIOClient(deviceToken: string): TagoIOClient {
  return new TagoIOClient(deviceToken)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Group data points by timestamp
 * Multiple variables arrive as separate records with the same timestamp
 * 
 * @param dataPoints - Array of TagoIO data points
 * @returns Map of timestamp -> variable name -> data point
 * 
 * @example
 * const grouped = groupByTimestamp(dataPoints)
 * const reading = grouped['2025-10-30T02:44:13.496Z']
 * console.log(reading.temp?.value, reading.hum?.value, reading.co2?.value)
 */
export function groupByTimestamp(
  dataPoints: TagoIODataPoint[]
): Record<string, Record<string, TagoIODataPoint>> {
  const grouped: Record<string, Record<string, TagoIODataPoint>> = {}

  for (const point of dataPoints) {
    if (!grouped[point.time]) {
      grouped[point.time] = {}
    }
    grouped[point.time][point.variable] = point
  }

  return grouped
}

/**
 * Filter data points by variable names
 * 
 * @param dataPoints - Array of TagoIO data points
 * @param variables - Variable names to include
 * @returns Filtered array
 * 
 * @example
 * const sensors = filterByVariable(dataPoints, ['temp', 'hum', 'co2'])
 */
export function filterByVariable(
  dataPoints: TagoIODataPoint[],
  variables: string[]
): TagoIODataPoint[] {
  const variableSet = new Set(variables)
  return dataPoints.filter((point) => variableSet.has(point.variable))
}

/**
 * Get the latest data point for each variable
 * 
 * @param dataPoints - Array of TagoIO data points
 * @returns Map of variable name -> latest data point
 * 
 * @example
 * const latest = getLatestByVariable(dataPoints)
 * console.log('Current temp:', latest.temp?.value)
 */
export function getLatestByVariable(
  dataPoints: TagoIODataPoint[]
): Record<string, TagoIODataPoint> {
  const latest: Record<string, TagoIODataPoint> = {}

  for (const point of dataPoints) {
    const existing = latest[point.variable]
    if (!existing || point.time > existing.time) {
      latest[point.variable] = point
    }
  }

  return latest
}
