/**
 * Metrc Sales Endpoint
 *
 * GET operations for sales transaction tracking
 */

import type { MetrcClient } from '../client'
import type { MetrcSalesReceipt } from '../types'

export class SalesEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get active sales receipts
   *
   * @param salesDateStart - Filter by sales date (YYYY-MM-DD format)
   * @param salesDateEnd - Filter by sales date (YYYY-MM-DD format)
   * @returns Array of active sales receipts
   */
  async listActive(salesDateStart?: string, salesDateEnd?: string): Promise<MetrcSalesReceipt[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/sales/v1/receipts/active?licenseNumber=${facilityLicenseNumber}`

    if (salesDateStart) {
      endpoint += `&salesDateStart=${salesDateStart}`
    }
    if (salesDateEnd) {
      endpoint += `&salesDateEnd=${salesDateEnd}`
    }

    return this.client.request<MetrcSalesReceipt[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get inactive sales receipts
   *
   * @param salesDateStart - Filter by sales date (YYYY-MM-DD format)
   * @param salesDateEnd - Filter by sales date (YYYY-MM-DD format)
   * @returns Array of inactive sales receipts
   */
  async listInactive(
    salesDateStart?: string,
    salesDateEnd?: string
  ): Promise<MetrcSalesReceipt[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/sales/v1/receipts/inactive?licenseNumber=${facilityLicenseNumber}`

    if (salesDateStart) {
      endpoint += `&salesDateStart=${salesDateStart}`
    }
    if (salesDateEnd) {
      endpoint += `&salesDateEnd=${salesDateEnd}`
    }

    return this.client.request<MetrcSalesReceipt[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get a specific sales receipt by ID
   *
   * @param receiptId - The Metrc sales receipt ID
   * @returns Sales receipt details
   */
  async getById(receiptId: number): Promise<MetrcSalesReceipt> {
    return this.client.request<MetrcSalesReceipt>(`/sales/v1/receipts/${receiptId}`, {
      method: 'GET',
    })
  }
}
