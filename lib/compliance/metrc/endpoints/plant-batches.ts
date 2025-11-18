/**
 * Metrc Plant Batches Endpoint
 *
 * GET operations for plant batch tracking
 */

import type { MetrcClient } from '../client'
import type { MetrcPlantBatch } from '../types'

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

    return this.client.request<MetrcPlantBatch[]>(endpoint, {
      method: 'GET',
    })
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

    return this.client.request<MetrcPlantBatch[]>(endpoint, {
      method: 'GET',
    })
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
}
