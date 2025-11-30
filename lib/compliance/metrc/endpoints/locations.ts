/**
 * Metrc Locations Endpoint
 *
 * Manages facility locations/rooms for plant batches, plants, harvests, and packages
 */

import type { MetrcClient } from '../client'
import type { MetrcLocation, MetrcLocationType, MetrcLocationCreate, MetrcLocationUpdate, MetrcListResult, MetrcPaginationOptions } from '../types'

export class LocationsEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get the license number query param
   */
  private getLicenseParam(): string {
    return `licenseNumber=${this.client.getFacilityLicenseNumber()}`
  }

  /**
   * Get all location types available in the facility's state
   *
   * Location types define what kind of inventory can be stored in a location:
   * - Plant Batches (immature plants)
   * - Plants (individual tracked plants)
   * - Harvests (drying/curing product)
   * - Packages (finished goods)
   *
   * @returns Paginated list of location types
   */
  async listTypes(pagination?: MetrcPaginationOptions): Promise<MetrcListResult<MetrcLocationType>> {
    return this.client.requestList<MetrcLocationType>(`/locations/v2/types?${this.getLicenseParam()}`, {
      method: 'GET',
      pagination,
    })
  }

  /**
   * Get all active locations for the facility
   *
   * @returns Paginated list of active locations
   */
  async listActive(pagination?: MetrcPaginationOptions): Promise<MetrcListResult<MetrcLocation>> {
    return this.client.requestList<MetrcLocation>(`/locations/v2/active?${this.getLicenseParam()}`, {
      method: 'GET',
      pagination,
    })
  }

  /**
   * Get all inactive locations for the facility
   *
   * @returns Paginated list of inactive locations
   */
  async listInactive(pagination?: MetrcPaginationOptions): Promise<MetrcListResult<MetrcLocation>> {
    return this.client.requestList<MetrcLocation>(`/locations/v2/inactive?${this.getLicenseParam()}`, {
      method: 'GET',
      pagination,
    })
  }

  /**
   * Get a specific location by ID
   *
   * @param locationId - The Metrc location ID
   * @returns Location details
   */
  async getById(locationId: number): Promise<MetrcLocation> {
    return this.client.request<MetrcLocation>(`/locations/v2/${locationId}`, {
      method: 'GET',
    })
  }

  /**
   * Create a new location
   *
   * @param payload - Location creation data
   * @returns Created location details (via subsequent fetch)
   */
  async create(payload: MetrcLocationCreate): Promise<void> {
    return this.client.request<void>(`/locations/v2/?${this.getLicenseParam()}`, {
      method: 'POST',
      body: [payload], // Metrc expects an array
    })
  }

  /**
   * Create multiple locations in a single request
   *
   * @param payloads - Array of location creation data
   * @returns void (successful creation)
   */
  async createBatch(payloads: MetrcLocationCreate[]): Promise<void> {
    return this.client.request<void>(`/locations/v2/?${this.getLicenseParam()}`, {
      method: 'POST',
      body: payloads,
    })
  }

  /**
   * Update an existing location
   *
   * @param payload - Location update data
   * @returns void (successful update)
   */
  async update(payload: MetrcLocationUpdate): Promise<void> {
    return this.client.request<void>(`/locations/v2/?${this.getLicenseParam()}`, {
      method: 'PUT',
      body: [payload], // Metrc expects an array
    })
  }

  /**
   * Update multiple locations in a single request
   *
   * @param payloads - Array of location update data
   * @returns void (successful update)
   */
  async updateBatch(payloads: MetrcLocationUpdate[]): Promise<void> {
    return this.client.request<void>(`/locations/v2/?${this.getLicenseParam()}`, {
      method: 'PUT',
      body: payloads,
    })
  }

  /**
   * Delete a location by ID
   *
   * Note: Locations can only be deleted if they have no associated inventory
   *
   * @param locationId - The Metrc location ID to delete
   * @returns void (successful deletion)
   */
  async delete(locationId: number): Promise<void> {
    return this.client.request<void>(`/locations/v2/${locationId}?${this.getLicenseParam()}`, {
      method: 'DELETE',
    })
  }

  /**
   * Find a location by name (case-insensitive)
   * Utility method to check if a location already exists
   *
   * @param name - Location name to search for
   * @returns Location if found, null otherwise
   */
  async findByName(name: string): Promise<MetrcLocation | null> {
    const result = await this.listActive()
    const normalizedName = name.trim().toLowerCase()
    const found = result.data.find(
      (loc: MetrcLocation) => loc.Name.trim().toLowerCase() === normalizedName
    )
    return found || null
  }
}
