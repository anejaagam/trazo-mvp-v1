/**
 * Metrc Locations Endpoint
 *
 * Manages facility locations/rooms for plant batches, plants, harvests, and packages
 */

import type { MetrcClient } from '../client'
import type { MetrcLocation, MetrcLocationType, MetrcLocationCreate, MetrcLocationUpdate } from '../types'

export class LocationsEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get all location types available in the facility's state
   *
   * Location types define what kind of inventory can be stored in a location:
   * - Plant Batches (immature plants)
   * - Plants (individual tracked plants)
   * - Harvests (drying/curing product)
   * - Packages (finished goods)
   *
   * @returns Array of location types
   */
  async listTypes(): Promise<MetrcLocationType[]> {
    return this.client.request<MetrcLocationType[]>('/locations/v2/types', {
      method: 'GET',
    })
  }

  /**
   * Get all active locations for the facility
   *
   * @returns Array of active locations
   */
  async listActive(): Promise<MetrcLocation[]> {
    return this.client.request<MetrcLocation[]>('/locations/v2/active', {
      method: 'GET',
    })
  }

  /**
   * Get all inactive locations for the facility
   *
   * @returns Array of inactive locations
   */
  async listInactive(): Promise<MetrcLocation[]> {
    return this.client.request<MetrcLocation[]>('/locations/v2/inactive', {
      method: 'GET',
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
    return this.client.request<void>('/locations/v2/', {
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
    return this.client.request<void>('/locations/v2/', {
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
    return this.client.request<void>('/locations/v2/', {
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
    return this.client.request<void>('/locations/v2/', {
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
    return this.client.request<void>(`/locations/v2/${locationId}`, {
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
    const locations = await this.listActive()
    const normalizedName = name.trim().toLowerCase()
    const found = locations.find(
      (loc) => loc.Name.trim().toLowerCase() === normalizedName
    )
    return found || null
  }
}
