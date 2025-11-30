/**
 * Metrc Harvests Endpoint
 *
 * GET and POST/PUT operations for harvest tracking
 */

import type { MetrcClient } from '../client'
import type {
  MetrcHarvest,
  MetrcHarvestPackageCreate,
  MetrcHarvestFinish,
} from '../types'

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

  // ===== WRITE OPERATIONS (POST/PUT) =====

  /**
   * Create packages from harvest
   *
   * @param harvestId - The Metrc harvest ID
   * @param packages - Array of packages to create from harvest
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async createPackagesFromHarvest(
    harvestId: number,
    packages: MetrcHarvestPackageCreate[]
  ): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/harvests/v1/${harvestId}/packages?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: packages,
      }
    )
  }

  /**
   * Remove waste from harvest
   *
   * @param harvestId - The Metrc harvest ID
   * @param waste - Waste removal details
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async removeWaste(
    harvestId: number,
    waste: {
      UnitOfWeight: string
      TotalWasteWeight: number
      ActualDate: string
    }
  ): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/harvests/v1/${harvestId}/removewaste?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: waste,
      }
    )
  }

  /**
   * Finish (close) harvests
   *
   * @param finishes - Array of harvests to finish
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async finish(finishes: MetrcHarvestFinish[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/harvests/v1/finish?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: finishes,
      }
    )
  }

  /**
   * Un-finish (reopen) harvests
   *
   * @param harvestIds - Array of harvest IDs to un-finish
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async unfinish(harvestIds: number[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/harvests/v1/unfinish?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: harvestIds.map((id) => ({ Id: id })),
      }
    )
  }
}
