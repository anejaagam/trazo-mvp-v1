/**
 * Metrc Tags Endpoint
 *
 * GET operations for plant and package tag inventory
 */

import type { MetrcClient } from '../client'
import type { MetrcPaginatedResponse } from '../types'

/**
 * Metrc tag structure returned from tags API
 * Note: Metrc v2 uses 'Label' for the tag identifier
 */
export interface MetrcTag {
  Label: string
  Status: string
  CommissionedDateTime: string
  TagTypeName: string
  TagTypeId: number
}

/**
 * Extract tags array from API response
 * Handles both paginated (v2) and array (v1) responses
 */
function extractTagsFromResponse(response: unknown): MetrcTag[] {
  // Handle null/undefined
  if (!response) {
    return []
  }

  // Handle direct array response
  if (Array.isArray(response)) {
    return response as MetrcTag[]
  }

  // Handle paginated response with Data array
  if (typeof response === 'object' && 'Data' in (response as object)) {
    const paginated = response as MetrcPaginatedResponse<MetrcTag>
    return paginated.Data || []
  }

  // Unknown format - return empty
  console.warn('Unknown tags API response format:', typeof response)
  return []
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
    const response = await this.client.request<MetrcPaginatedResponse<MetrcTag> | MetrcTag[]>(
      `/tags/v2/plant/available?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
    return extractTagsFromResponse(response)
  }

  /**
   * Get available package tags
   *
   * @returns Array of available package tags
   */
  async listAvailablePackageTags(): Promise<MetrcTag[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    const response = await this.client.request<MetrcPaginatedResponse<MetrcTag> | MetrcTag[]>(
      `/tags/v2/package/available?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
    return extractTagsFromResponse(response)
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
