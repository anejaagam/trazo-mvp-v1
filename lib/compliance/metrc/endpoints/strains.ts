/**
 * Metrc Strains Endpoint
 *
 * Manages strain library for Metrc compliance.
 * Strains are referenced when creating plant batches and packages.
 */

import type { MetrcClient } from '../client'
import type { MetrcStrain, MetrcStrainCreate, MetrcStrainUpdate } from '../types'

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
    let endpoint = '/strains/v2/active'
    const params: string[] = []

    if (lastModifiedStart) {
      params.push(`lastModifiedStart=${encodeURIComponent(lastModifiedStart)}`)
    }
    if (lastModifiedEnd) {
      params.push(`lastModifiedEnd=${encodeURIComponent(lastModifiedEnd)}`)
    }

    if (params.length > 0) {
      endpoint += `?${params.join('&')}`
    }

    return this.client.request<MetrcStrain[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get all inactive strains for the facility
   *
   * @param lastModifiedStart - Optional filter for strains modified after this date
   * @param lastModifiedEnd - Optional filter for strains modified before this date
   * @returns Array of inactive strains
   */
  async listInactive(lastModifiedStart?: string, lastModifiedEnd?: string): Promise<MetrcStrain[]> {
    let endpoint = '/strains/v2/inactive'
    const params: string[] = []

    if (lastModifiedStart) {
      params.push(`lastModifiedStart=${encodeURIComponent(lastModifiedStart)}`)
    }
    if (lastModifiedEnd) {
      params.push(`lastModifiedEnd=${encodeURIComponent(lastModifiedEnd)}`)
    }

    if (params.length > 0) {
      endpoint += `?${params.join('&')}`
    }

    return this.client.request<MetrcStrain[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get a specific strain by ID
   *
   * @param strainId - The Metrc strain ID
   * @returns Strain details
   */
  async getById(strainId: number): Promise<MetrcStrain> {
    return this.client.request<MetrcStrain>(`/strains/v2/${strainId}`, {
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
    return this.client.request<void>('/strains/v2/', {
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
    return this.client.request<void>('/strains/v2/', {
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
    return this.client.request<void>('/strains/v2/', {
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
    return this.client.request<void>('/strains/v2/', {
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
    return this.client.request<void>(`/strains/v2/${strainId}`, {
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
