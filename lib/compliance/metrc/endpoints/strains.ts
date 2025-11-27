/**
 * Metrc Strains Endpoint
 *
 * Manages strain library for Metrc compliance.
 * Strains are referenced when creating plant batches and packages.
 */

import type { MetrcClient } from '../client'
import type { MetrcStrain, MetrcStrainCreate, MetrcStrainUpdate, MetrcPaginatedResponse } from '../types'

/**
 * Extract strains array from API response
 * Handles both paginated (v2) and array (v1) responses
 */
function extractStrainsFromResponse(response: unknown): MetrcStrain[] {
  if (!response) return []
  if (Array.isArray(response)) return response as MetrcStrain[]
  if (typeof response === 'object' && 'Data' in (response as object)) {
    const paginated = response as MetrcPaginatedResponse<MetrcStrain>
    return paginated.Data || []
  }
  console.warn('Unknown strains API response format:', typeof response)
  return []
}

export class StrainsEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get all active strains for the facility
   *
   * @param lastModifiedStart - Optional filter for strains modified after this date
   * @param lastModifiedEnd - Optional filter for strains modified before this date
   * @returns Array of active strains
   */
  async listActive(lastModifiedStart?: string, lastModifiedEnd?: string): Promise<MetrcStrain[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/strains/v2/active?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${encodeURIComponent(lastModifiedStart)}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${encodeURIComponent(lastModifiedEnd)}`
    }

    const response = await this.client.request<MetrcPaginatedResponse<MetrcStrain> | MetrcStrain[]>(endpoint, {
      method: 'GET',
    })
    return extractStrainsFromResponse(response)
  }

  /**
   * Get all inactive strains for the facility
   * Note: Some Metrc implementations may not support this endpoint
   *
   * @param lastModifiedStart - Optional filter for strains modified after this date
   * @param lastModifiedEnd - Optional filter for strains modified before this date
   * @returns Array of inactive strains (empty array if endpoint not supported)
   */
  async listInactive(lastModifiedStart?: string, lastModifiedEnd?: string): Promise<MetrcStrain[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/strains/v2/inactive?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${encodeURIComponent(lastModifiedStart)}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${encodeURIComponent(lastModifiedEnd)}`
    }

    try {
      const response = await this.client.request<MetrcPaginatedResponse<MetrcStrain> | MetrcStrain[]>(endpoint, {
        method: 'GET',
      })
      return extractStrainsFromResponse(response)
    } catch (error) {
      // Some Metrc implementations don't have an inactive strains endpoint
      // Return empty array instead of failing
      if ((error as { statusCode?: number })?.statusCode === 404) {
        return []
      }
      throw error
    }
  }

  /**
   * Get a specific strain by ID
   *
   * @param strainId - The Metrc strain ID
   * @returns Strain details
   */
  async getById(strainId: number): Promise<MetrcStrain> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcStrain>(`/strains/v2/${strainId}?licenseNumber=${facilityLicenseNumber}`, {
      method: 'GET',
    })
  }

  /**
   * Create a new strain
   *
   * @param payload - Strain creation data
   * @returns void (successful creation)
   */
  async create(payload: MetrcStrainCreate): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<void>(`/strains/v2/?licenseNumber=${facilityLicenseNumber}`, {
      method: 'POST',
      body: [payload], // Metrc expects an array
    })
  }

  /**
   * Create multiple strains in a single request
   *
   * @param payloads - Array of strain creation data
   * @returns void (successful creation)
   */
  async createBatch(payloads: MetrcStrainCreate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<void>(`/strains/v2/?licenseNumber=${facilityLicenseNumber}`, {
      method: 'POST',
      body: payloads,
    })
  }

  /**
   * Update an existing strain
   *
   * @param payload - Strain update data
   * @returns void (successful update)
   */
  async update(payload: MetrcStrainUpdate): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<void>(`/strains/v2/?licenseNumber=${facilityLicenseNumber}`, {
      method: 'PUT',
      body: [payload], // Metrc expects an array
    })
  }

  /**
   * Update multiple strains in a single request
   *
   * @param payloads - Array of strain update data
   * @returns void (successful update)
   */
  async updateBatch(payloads: MetrcStrainUpdate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<void>(`/strains/v2/?licenseNumber=${facilityLicenseNumber}`, {
      method: 'PUT',
      body: payloads,
    })
  }

  /**
   * Delete a strain by ID
   *
   * Note: Strains can only be deleted if they have no associated inventory
   *
   * @param strainId - The Metrc strain ID to delete
   * @returns void (successful deletion)
   */
  async delete(strainId: number): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<void>(`/strains/v2/${strainId}?licenseNumber=${facilityLicenseNumber}`, {
      method: 'DELETE',
    })
  }

  /**
   * Find a strain by name (case-insensitive)
   * Utility method to check if a strain already exists
   *
   * @param name - Strain name to search for
   * @returns Strain if found, null otherwise
   */
  async findByName(name: string): Promise<MetrcStrain | null> {
    const strains = await this.listActive()
    const normalizedName = name.trim().toLowerCase()
    const found = strains.find(
      (strain) => strain.Name.trim().toLowerCase() === normalizedName
    )
    return found || null
  }

  /**
   * Sync strains from TRAZO cultivars
   * Utility method to ensure all TRAZO cultivars have corresponding Metrc strains
   *
   * @param cultivarNames - Array of cultivar names to sync
   * @returns Object with created, existing, and failed strain names
   */
  async syncFromCultivars(cultivarNames: string[]): Promise<{
    created: string[]
    existing: string[]
    failed: { name: string; error: string }[]
  }> {
    const result = {
      created: [] as string[],
      existing: [] as string[],
      failed: [] as { name: string; error: string }[],
    }

    // Get all existing strains
    const existingStrains = await this.listActive()
    const existingNames = new Set(
      existingStrains.map((s) => s.Name.trim().toLowerCase())
    )

    for (const name of cultivarNames) {
      const normalizedName = name.trim().toLowerCase()

      if (existingNames.has(normalizedName)) {
        result.existing.push(name)
        continue
      }

      try {
        await this.create({
          Name: name,
          TestingStatus: 'None',
          ThcLevel: 0,
          CbdLevel: 0,
        })
        result.created.push(name)
        existingNames.add(normalizedName)
      } catch (error) {
        result.failed.push({
          name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return result
  }
}
