/**
 * Metrc Plants Endpoint
 *
 * GET operations for individual plant tracking
 */

import type { MetrcClient } from '../client'
import type { MetrcPlant } from '../types'

export class PlantsEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get vegetative plants
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of vegetative plants
   */
  async listVegetative(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcPlant[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/plants/v2/vegetative?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    return this.client.request<MetrcPlant[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get flowering plants
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of flowering plants
   */
  async listFlowering(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcPlant[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/plants/v2/flowering?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    return this.client.request<MetrcPlant[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get on-hold plants
   *
   * @returns Array of plants on hold
   */
  async listOnHold(): Promise<MetrcPlant[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcPlant[]>(
      `/plants/v2/onhold?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
  }

  /**
   * Get inactive plants
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of inactive plants
   */
  async listInactive(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcPlant[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/plants/v2/inactive?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    return this.client.request<MetrcPlant[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get a specific plant by ID
   *
   * @param plantId - The Metrc plant ID
   * @returns Plant details
   */
  async getById(plantId: number): Promise<MetrcPlant> {
    return this.client.request<MetrcPlant>(`/plants/v2/${plantId}`, {
      method: 'GET',
    })
  }

  /**
   * Get a specific plant by label
   *
   * @param label - The Metrc plant label
   * @returns Plant details
   */
  async getByLabel(label: string): Promise<MetrcPlant> {
    return this.client.request<MetrcPlant>(`/plants/v2/label/${label}`, {
      method: 'GET',
    })
  }

  /**
   * Get available growth phases
   *
   * @returns Array of growth phase names
   */
  async listGrowthPhases(): Promise<string[]> {
    return this.client.request<string[]>('/plants/v2/growthphases', {
      method: 'GET',
    })
  }

  /**
   * Get available waste reasons
   *
   * @returns Array of waste reason objects
   */
  async listWasteReasons(): Promise<Array<{ Name: string }>> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<Array<{ Name: string }>>(
      `/plants/v2/waste/reasons?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
  }
}
