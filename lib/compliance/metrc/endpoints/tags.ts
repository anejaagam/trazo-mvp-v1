/**
 * Metrc Tags Endpoint
 *
 * GET operations for plant and package tag inventory
 */

import type { MetrcClient } from '../client'

export interface MetrcTag {
  TagNumber: string
  Status: string
  CommissionedDate: string
  TagTypeName: string
  TagTypeId: number
}

export class TagsEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get available plant tags
   *
   * @returns Array of available plant tags
   */
  async listAvailablePlantTags(): Promise<MetrcTag[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcTag[]>(
      `/planttags/v1/available?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
  }

  /**
   * Get available package tags
   *
   * @returns Array of available package tags
   */
  async listAvailablePackageTags(): Promise<MetrcTag[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcTag[]>(
      `/packagetags/v1/available?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
  }

  /**
   * Get all available tags (both plant and package)
   *
   * @returns Object with plant and package tags
   */
  async listAllAvailableTags(): Promise<{ plantTags: MetrcTag[]; packageTags: MetrcTag[] }> {
    const [plantTags, packageTags] = await Promise.all([
      this.listAvailablePlantTags(),
      this.listAvailablePackageTags(),
    ])

    return { plantTags, packageTags }
  }
}
