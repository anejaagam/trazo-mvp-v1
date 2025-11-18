/**
 * Metrc Harvests Endpoint
 *
 * GET operations for harvest tracking
 */

import type { MetrcClient } from '../client'
import type { MetrcHarvest } from '../types'

export class HarvestsEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get active harvests
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of active harvests
   */
  async listActive(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcHarvest[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/harvests/v1/active?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    return this.client.request<MetrcHarvest[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get inactive harvests
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of inactive harvests
   */
  async listInactive(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcHarvest[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/harvests/v1/inactive?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    return this.client.request<MetrcHarvest[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get on-hold harvests
   *
   * @returns Array of harvests on hold
   */
  async listOnHold(): Promise<MetrcHarvest[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcHarvest[]>(
      `/harvests/v1/onhold?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
  }

  /**
   * Get a specific harvest by ID
   *
   * @param harvestId - The Metrc harvest ID
   * @returns Harvest details
   */
  async getById(harvestId: number): Promise<MetrcHarvest> {
    return this.client.request<MetrcHarvest>(`/harvests/v1/${harvestId}`, {
      method: 'GET',
    })
  }

  /**
   * Get waste types
   *
   * @returns Array of waste type names
   */
  async listWasteTypes(): Promise<string[]> {
    return this.client.request<string[]>('/harvests/v1/waste/types', {
      method: 'GET',
    })
  }
}
