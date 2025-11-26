/**
 * Metrc Sync Services - Public API
 *
 * Re-exports all sync services
 */

// Pull sync (Metrc → TRAZO)
export { syncPackagesFromMetrc, type PackageSyncResult } from './packages-sync'

// Push sync (TRAZO → Metrc)
export {
  pushInventoryLotToMetrc,
  pushInventoryLotsToMetrc,
  type InventoryPushResult,
} from './inventory-push-sync'

// Production batch sync
export {
  createProductionBatch,
  addInputPackages,
  completeProduction,
  cancelProduction,
  syncProductionBatchToMetrc,
  getProductionBatchSyncStatus,
  type ProductionBatchSyncResult,
  type CreateProductionBatchParams,
  type AddInputPackagesParams,
  type CompleteProductionParams,
  type CancelProductionParams,
} from './production-batch-sync'

// Orchestration
export {
  runSync,
  runMultipleSync,
  getDefaultSyncDateRange,
  type SyncType,
  type OrchestratedSyncResult,
} from './sync-orchestrator'
