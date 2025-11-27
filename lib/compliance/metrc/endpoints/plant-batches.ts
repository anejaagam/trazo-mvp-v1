/**
 * Metrc Plant Batches Endpoint
 *
 * GET and POST/PUT operations for plant batch tracking
 */

import type { MetrcClient } from '../client'
import type {
  MetrcPlantBatch,
  MetrcPlantBatchCreate,
  MetrcPlantBatchAdjustment,
  MetrcPlantBatchSplit,
} from '../types'

export class PlantBatchesEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get active plant batches
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of active plant batches
   */
  async listActive(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcPlantBatch[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/plantbatches/v2/active?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    // Use requestList to handle v2 paginated response { Data: [...], Total, ... }
    const result = await this.client.requestList<MetrcPlantBatch>(endpoint, {
      method: 'GET',
    })
    return result.data
  }

  /**
   * Get inactive plant batches
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of inactive plant batches
   */
  async listInactive(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcPlantBatch[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/plantbatches/v2/inactive?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    // Use requestList to handle v2 paginated response { Data: [...], Total, ... }
    const result = await this.client.requestList<MetrcPlantBatch>(endpoint, {
      method: 'GET',
    })
    return result.data
  }

  /**
   * Get a specific plant batch by ID
   *
   * @param batchId - The Metrc plant batch ID
   * @returns Plant batch details
   */
  async getById(batchId: number): Promise<MetrcPlantBatch> {
    return this.client.request<MetrcPlantBatch>(`/plantbatches/v2/${batchId}`, {
      method: 'GET',
    })
  }

  /**
   * Get plant batch types
   *
   * @returns Array of batch type names (e.g., "Seed", "Clone")
   */
  async listTypes(): Promise<string[]> {
    return this.client.request<string[]>('/plantbatches/v2/types', {
      method: 'GET',
    })
  }

  // ===== WRITE OPERATIONS (POST/PUT) =====

  /**
   * Create new plant batches
   *
   * Uses the v2 plantings endpoint which is the standard way to create plant batches
   * in Metrc v2 API (works for both seeds and clones)
   *
   * @param batches - Array of plant batches to create
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async create(batches: MetrcPlantBatchCreate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plantbatches/v2/plantings?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: batches,
      }
    )
  }

  /**
   * Create plant batches from plantings (alias for create)
   *
   * In Metrc v2 API, /plantbatches/v2/plantings is the standard endpoint
   * for creating plant batches regardless of source
   *
   * @param batches - Array of plant batches to create from plantings
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async createFromPlantings(batches: MetrcPlantBatchCreate[]): Promise<void> {
    // In v2, plantings endpoint is the standard create endpoint
    return this.create(batches)
  }

  /**
   * Split a plant batch into multiple smaller batches
   *
   * @param splits - Array of batch split operations
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async split(splits: MetrcPlantBatchSplit[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plantbatches/v2/split?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: splits,
      }
    )
  }

  /**
   * Adjust plant batch count
   *
   * @param adjustments - Array of batch adjustments
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async adjust(adjustments: MetrcPlantBatchAdjustment[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plantbatches/v2/adjust?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: adjustments,
      }
    )
  }

  /**
   * Destroy plant batches (waste)
   *
   * @param destroys - Array of plant batches to destroy
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async destroy(
    destroys: Array<{
      PlantBatch: string
      Count: number
      ReasonNote: string
      ActualDate: string
    }>
  ): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plantbatches/v2/destroy?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: destroys,
      }
    )
  }
}
