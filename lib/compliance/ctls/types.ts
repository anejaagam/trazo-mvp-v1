/**
 * CTLS Types (Placeholder)
 *
 * Type definitions for Canadian Cannabis Tracking and Licensing System.
 * These are placeholders and will be refined when CTLS integration is implemented.
 */

/**
 * CTLS client configuration
 */
export interface CTLSConfig {
  licenseNumber: string
  apiKey: string
  province: string
  environment?: 'sandbox' | 'production'
}

/**
 * CTLS monthly report structure (placeholder)
 */
export interface CTLSMonthlyReport {
  reportingPeriod: string
  licenseNumber: string
  productionData: unknown
  destructionData: unknown
  inventorySnapshot: unknown
  salesData: unknown
}

/**
 * CTLS production data (placeholder)
 */
export interface CTLSProductionData {
  period: string
  totalProduced: number
  totalProcessed: number
  details: unknown[]
}

/**
 * CTLS inventory snapshot (placeholder)
 */
export interface CTLSInventorySnapshot {
  snapshotDate: string
  totalInventory: number
  byCategory: unknown[]
}
