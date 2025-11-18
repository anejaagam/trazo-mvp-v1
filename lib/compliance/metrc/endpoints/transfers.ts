/**
 * Metrc Transfers Endpoint
 *
 * GET operations for transfer manifest tracking
 */

import type { MetrcClient } from '../client'
import type { MetrcTransfer } from '../types'

export class TransfersEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get incoming transfers
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of incoming transfers
   */
  async listIncoming(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcTransfer[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/transfers/v1/incoming?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    return this.client.request<MetrcTransfer[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get outgoing transfers
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of outgoing transfers
   */
  async listOutgoing(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcTransfer[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/transfers/v1/outgoing?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    return this.client.request<MetrcTransfer[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get rejected transfers
   *
   * @returns Array of rejected transfers
   */
  async listRejected(): Promise<MetrcTransfer[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcTransfer[]>(
      `/transfers/v1/rejected?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
  }

  /**
   * Get a specific transfer by ID
   *
   * @param transferId - The Metrc transfer ID
   * @returns Transfer details
   */
  async getById(transferId: number): Promise<MetrcTransfer> {
    return this.client.request<MetrcTransfer>(`/transfers/v1/${transferId}`, {
      method: 'GET',
    })
  }

  /**
   * Get transfer types
   *
   * @returns Array of transfer type names
   */
  async listTypes(): Promise<string[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<string[]>(
      `/transfers/v1/types?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
  }
}
