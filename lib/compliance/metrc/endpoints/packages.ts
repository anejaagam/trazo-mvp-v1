/**
 * Metrc Packages Endpoint
 *
 * GET and POST/PUT operations for package tracking (inventory)
 */

import type { MetrcClient } from '../client'
import type {
  MetrcPackage,
  MetrcPackageCreate,
  MetrcPackageAdjustment,
  MetrcPackageLocationChange,
  MetrcPackageFinish,
} from '../types'

export class PackagesEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get active packages
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of active packages
   */
  async listActive(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcPackage[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/packages/v2/active?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    // Use requestList to handle v2 paginated response { Data: [...], Total, ... }
    const result = await this.client.requestList<MetrcPackage>(endpoint, {
      method: 'GET',
    })
    return result.data
  }

  /**
   * Get inactive packages
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of inactive packages
   */
  async listInactive(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcPackage[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/packages/v2/inactive?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    // Use requestList to handle v2 paginated response { Data: [...], Total, ... }
    const result = await this.client.requestList<MetrcPackage>(endpoint, {
      method: 'GET',
    })
    return result.data
  }

  /**
   * Get on-hold packages
   *
   * @returns Array of packages on hold
   */
  async listOnHold(): Promise<MetrcPackage[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    // Use requestList to handle v2 paginated response { Data: [...], Total, ... }
    const result = await this.client.requestList<MetrcPackage>(
      `/packages/v2/onhold?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
    return result.data
  }

  /**
   * Get packages in transit
   *
   * @returns Array of packages in transit
   */
  async listInTransit(): Promise<MetrcPackage[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    // Use requestList to handle v2 paginated response { Data: [...], Total, ... }
    const result = await this.client.requestList<MetrcPackage>(
      `/packages/v2/intransit?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
    return result.data
  }

  /**
   * Get a specific package by ID
   *
   * @param packageId - The Metrc package ID
   * @returns Package details
   */
  async getById(packageId: number): Promise<MetrcPackage> {
    return this.client.request<MetrcPackage>(`/packages/v2/${packageId}`, {
      method: 'GET',
    })
  }

  /**
   * Get a specific package by label
   *
   * @param label - The Metrc package label (e.g., "1A4FF0100000022000000123")
   * @returns Package details
   */
  async getByLabel(label: string): Promise<MetrcPackage> {
    return this.client.request<MetrcPackage>(`/packages/v2/label/${label}`, {
      method: 'GET',
    })
  }

  /**
   * Get package types available in the system
   *
   * @returns Array of package type names
   */
  async listTypes(): Promise<string[]> {
    return this.client.request<string[]>('/packages/v2/types', {
      method: 'GET',
    })
  }

  /**
   * Get adjust reasons available in the system
   *
   * @returns Array of adjust reason objects
   */
  async listAdjustReasons(): Promise<Array<{ Name: string; RequiresNote: boolean }>> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<Array<{ Name: string; RequiresNote: boolean }>>(
      `/packages/v2/adjust/reasons?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
  }

  // ===== WRITE OPERATIONS (POST/PUT) =====

  /**
   * Create new packages in Metrc
   *
   * @param packages - Array of packages to create
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async create(packages: MetrcPackageCreate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/packages/v2/create?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: packages,
      }
    )
  }

  /**
   * Adjust package quantity (inventory adjustment)
   *
   * @param adjustments - Array of package adjustments
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async adjust(adjustments: MetrcPackageAdjustment[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/packages/v2/adjust?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: adjustments,
      }
    )
  }

  /**
   * Change package location
   *
   * @param locationChanges - Array of location changes
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async changeLocation(locationChanges: MetrcPackageLocationChange[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/packages/v2/change/locations?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'PUT',
        body: locationChanges,
      }
    )
  }

  /**
   * Finish (close/archive) packages
   *
   * @param finishes - Array of packages to finish
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async finish(finishes: MetrcPackageFinish[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/packages/v2/finish?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: finishes,
      }
    )
  }

  /**
   * Un-finish (reopen) packages
   *
   * @param labels - Array of package labels to un-finish
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async unfinish(labels: string[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/packages/v2/unfinish?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: labels.map((label) => ({ Label: label })),
      }
    )
  }
}
