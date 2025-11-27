/**
 * Metrc API Client
 *
 * Core client for interacting with the Metrc cannabis tracking API.
 * Provides authentication, request handling, and endpoint access.
 */

import { getMetrcBaseUrl, DEFAULT_TIMEOUT, RATE_LIMIT, RETRYABLE_STATUS_CODES } from './config'
import { MetrcApiError, MetrcTimeoutError } from './errors'
import type { MetrcClientConfig, MetrcRequestOptions, MetrcPaginatedResponse, MetrcListResult, MetrcPaginationOptions } from './types'
import {
  FacilitiesEndpoint,
  LocationsEndpoint,
  PackagesEndpoint,
  PlantsEndpoint,
  PlantBatchesEndpoint,
  HarvestsEndpoint,
  TransfersEndpoint,
  SalesEndpoint,
  StrainsEndpoint,
  ItemsEndpoint,
  LabTestsEndpoint,
} from './endpoints'

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Create Basic Auth header from vendor and user API keys
 * Metrc uses Basic Auth: base64(vendorKey:userKey)
 */
function createBasicAuthHeader(vendorKey: string, userKey: string): string {
  // Use Buffer in Node.js, btoa in browser
  const credentials = `${vendorKey}:${userKey}`
  if (typeof Buffer !== 'undefined') {
    return `Basic ${Buffer.from(credentials).toString('base64')}`
  }
  return `Basic ${btoa(credentials)}`
}

/**
 * MetrcClient - Core API client for Metrc integration
 *
 * @example
 * ```typescript
 * const client = new MetrcClient({
 *   vendorApiKey: 'your-vendor-key',
 *   userApiKey: 'your-user-key',
 *   facilityLicenseNumber: '123-ABC',
 *   state: 'OR',
 *   isSandbox: true
 * })
 *
 * // Validate credentials
 * const isValid = await client.validateCredentials()
 *
 * // Access endpoints (to be implemented in Phase 2)
 * // const facilities = await client.facilities.list()
 * ```
 */
export class MetrcClient {
  private baseUrl: string
  private vendorApiKey: string
  private userApiKey: string
  private facilityLicenseNumber: string
  private state: string
  private timeout: number
  public readonly isSandbox: boolean

  // Endpoint groups
  public readonly facilities: FacilitiesEndpoint
  public readonly locations: LocationsEndpoint
  public readonly packages: PackagesEndpoint
  public readonly plants: PlantsEndpoint
  public readonly plantBatches: PlantBatchesEndpoint
  public readonly harvests: HarvestsEndpoint
  public readonly transfers: TransfersEndpoint
  public readonly sales: SalesEndpoint
  public readonly strains: StrainsEndpoint
  public readonly items: ItemsEndpoint
  public readonly labTests: LabTestsEndpoint

  constructor(config: MetrcClientConfig) {
    this.vendorApiKey = config.vendorApiKey
    this.userApiKey = config.userApiKey
    this.facilityLicenseNumber = config.facilityLicenseNumber
    this.state = config.state
    this.isSandbox = config.isSandbox || false
    this.timeout = config.timeout || DEFAULT_TIMEOUT

    // Determine base URL
    this.baseUrl = config.baseUrl || getMetrcBaseUrl(config.state, this.isSandbox)

    // Initialize endpoint groups
    this.facilities = new FacilitiesEndpoint(this)
    this.locations = new LocationsEndpoint(this)
    this.packages = new PackagesEndpoint(this)
    this.plants = new PlantsEndpoint(this)
    this.plantBatches = new PlantBatchesEndpoint(this)
    this.harvests = new HarvestsEndpoint(this)
    this.transfers = new TransfersEndpoint(this)
    this.sales = new SalesEndpoint(this)
    this.strains = new StrainsEndpoint(this)
    this.items = new ItemsEndpoint(this)
    this.labTests = new LabTestsEndpoint(this)
  }

  /**
   * Validate API credentials by attempting to fetch facilities
   *
   * @returns True if credentials are valid
   * @throws MetrcApiError if credentials are invalid
   */
  async validateCredentials(): Promise<boolean> {
    try {
      await this.request('/facilities/v2/', { method: 'GET' })
      return true
    } catch (error) {
      if (error instanceof MetrcApiError && error.statusCode === 401) {
        return false
      }
      throw error
    }
  }

  /**
   * Make an authenticated request to the Metrc API
   *
   * @param endpoint - API endpoint (e.g., '/facilities/v2/')
   * @param options - Request options
   * @returns Response data
   * @throws MetrcApiError for API errors
   * @throws MetrcTimeoutError for timeouts
   */
  async request<T>(endpoint: string, options: MetrcRequestOptions = {}): Promise<T> {
    return this.requestWithRetry<T>(endpoint, options, 1)
  }

  /**
   * Make a request with retry logic
   *
   * @private
   */
  private async requestWithRetry<T>(
    endpoint: string,
    options: MetrcRequestOptions,
    attempt: number
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': createBasicAuthHeader(this.vendorApiKey, this.userApiKey),
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text()
        const error = new MetrcApiError(response.status, errorText)

        // Retry if error is retryable and we haven't exceeded max retries
        if (
          error.isRetryable() &&
          attempt < RATE_LIMIT.maxRetries &&
          RETRYABLE_STATUS_CODES.includes(response.status as any)
        ) {
          const delay = RATE_LIMIT.initialDelay * Math.pow(RATE_LIMIT.backoffMultiplier, attempt - 1)
          await sleep(delay)
          return this.requestWithRetry<T>(endpoint, options, attempt + 1)
        }

        throw error
      }

      // Parse and return response
      const data = await response.json()
      return data as T
    } catch (error) {
      clearTimeout(timeoutId)

      // Handle abort/timeout
      if ((error as Error).name === 'AbortError') {
        throw new MetrcTimeoutError(endpoint, this.timeout)
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new MetrcApiError(0, 'Network error: Unable to reach Metrc API')
      }

      // Re-throw MetrcApiError and MetrcTimeoutError as-is
      if (error instanceof MetrcApiError || error instanceof MetrcTimeoutError) {
        throw error
      }

      // Wrap unknown errors
      throw new MetrcApiError(0, (error as Error).message || 'Unknown error occurred')
    }
  }

  /**
   * Make an authenticated list request that handles v2 paginated responses
   *
   * Metrc v2 API returns paginated responses: { Data: [], Total, TotalRecords, PageSize, RecordsOnPage }
   * This method automatically extracts the data and provides pagination info
   *
   * @param endpoint - API endpoint (e.g., '/locations/v2/active')
   * @param options - Request options including pagination
   * @returns Paginated list result with data and metadata
   */
  async requestList<T>(
    endpoint: string,
    options: MetrcRequestOptions & { pagination?: MetrcPaginationOptions } = {}
  ): Promise<MetrcListResult<T>> {
    const { pagination, ...requestOptions } = options

    // Build URL with pagination params
    let url = endpoint
    const params = new URLSearchParams()

    if (pagination?.page !== undefined) {
      params.set('page', String(pagination.page))
    }
    if (pagination?.pageSize !== undefined) {
      params.set('pageSize', String(pagination.pageSize))
    }

    const paramString = params.toString()
    if (paramString) {
      url += (url.includes('?') ? '&' : '?') + paramString
    }

    const response = await this.request<MetrcPaginatedResponse<T> | T[]>(url, requestOptions)

    // Handle paginated response (v2 API)
    if (response && typeof response === 'object' && 'Data' in response) {
      const paginated = response as MetrcPaginatedResponse<T>
      return {
        data: paginated.Data,
        total: paginated.TotalRecords,
        pageSize: paginated.PageSize,
        hasMore: paginated.RecordsOnPage < paginated.TotalRecords,
      }
    }

    // Handle direct array response (v1 API or some endpoints)
    if (Array.isArray(response)) {
      return {
        data: response,
        total: response.length,
        pageSize: response.length,
        hasMore: false,
      }
    }

    // Fallback
    return {
      data: [],
      total: 0,
      pageSize: 0,
      hasMore: false,
    }
  }

  /**
   * Get the current configuration
   */
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      state: this.state,
      facilityLicenseNumber: this.facilityLicenseNumber,
      isSandbox: this.isSandbox,
    }
  }

  /**
   * Get the facility license number
   */
  getFacilityLicenseNumber(): string {
    return this.facilityLicenseNumber
  }
}
