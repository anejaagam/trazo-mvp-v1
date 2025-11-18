/**
 * Metrc Facilities Endpoint
 *
 * GET operations for facility management
 */

import type { MetrcClient } from '../client'
import type { MetrcFacility } from '../types'

export class FacilitiesEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get all facilities for the authenticated license
   *
   * @returns Array of facilities
   */
  async list(): Promise<MetrcFacility[]> {
    return this.client.request<MetrcFacility[]>('/facilities/v2/', {
      method: 'GET',
    })
  }

  /**
   * Get a specific facility by ID
   *
   * @param facilityId - The Metrc facility ID
   * @returns Facility details
   */
  async getById(facilityId: number): Promise<MetrcFacility> {
    return this.client.request<MetrcFacility>(`/facilities/v2/${facilityId}`, {
      method: 'GET',
    })
  }
}
