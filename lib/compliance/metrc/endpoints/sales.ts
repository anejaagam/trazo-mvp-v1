/**
 * Metrc Sales Endpoint
 *
 * GET and POST/PUT operations for sales transaction tracking
 */

import type { MetrcClient } from '../client'
import type { MetrcSalesReceipt, MetrcSalesReceiptCreate } from '../types'

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

  // ===== WRITE OPERATIONS (POST/PUT) =====

  /**
   * Create sales receipts
   *
   * @param receipts - Array of sales receipts to create
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async create(receipts: MetrcSalesReceiptCreate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/sales/v1/receipts?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: receipts,
      }
    )
  }

  /**
   * Update sales receipts
   *
   * @param updates - Array of sales receipt updates
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async update(updates: MetrcSalesReceiptCreate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/sales/v1/receipts?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'PUT',
        body: updates,
      }
    )
  }

  /**
   * Delete sales receipts
   *
   * @param receiptIds - Array of receipt IDs to delete
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async delete(receiptIds: number[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/sales/v1/receipts?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'DELETE',
        body: receiptIds.map((id) => ({ Id: id })),
      }
    )
  }
}
