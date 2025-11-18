/**
 * Compliance Engine - Public API
 *
 * Provides integration with state-mandated cannabis tracking systems
 * and food safety compliance standards.
 *
 * Supported Systems:
 * - Metrc (Oregon/Maryland/California cannabis tracking)
 * - CTLS (Canadian cannabis tracking) - Placeholder
 * - PrimusGFS (Produce food safety) - Placeholder
 */

// Re-export Metrc client and types
export { MetrcClient } from './metrc/client'
export type { MetrcConfig, MetrcClientConfig } from './metrc/types'

// Re-export CTLS placeholder
export { CTLSClient } from './ctls/client'
export type { CTLSConfig } from './ctls/types'

// Re-export PrimusGFS placeholder
export { PrimusGFSAuditManager } from './primus-gfs/audit-manager'
export type { PrimusGFSConfig } from './primus-gfs/types'

// Re-export shared types
export * from './types'
