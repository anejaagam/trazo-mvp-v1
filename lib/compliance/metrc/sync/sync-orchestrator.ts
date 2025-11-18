/**
 * Metrc Sync Orchestrator
 *
 * Coordinates all sync operations between TRAZO and Metrc
 */

import { syncPackagesFromMetrc, type PackageSyncResult } from './packages-sync'

export type SyncType = 'packages' | 'plants' | 'plant_batches' | 'harvests' | 'sales' | 'transfers'

export interface OrchestratedSyncResult {
  success: boolean
  syncType: SyncType
  result: PackageSyncResult
  startedAt: string
  completedAt: string
  duration: number
}

/**
 * Run a single sync operation
 *
 * @param syncType - Type of sync to perform
 * @param siteId - Site ID
 * @param organizationId - Organization ID
 * @param userId - User ID initiating sync
 * @param options - Optional sync options
 * @returns Sync result
 */
export async function runSync(
  syncType: SyncType,
  siteId: string,
  organizationId: string,
  userId: string,
  options?: {
    lastModifiedStart?: string
    lastModifiedEnd?: string
  }
): Promise<OrchestratedSyncResult> {
  const startedAt = new Date().toISOString()
  const startTime = Date.now()

  let result: PackageSyncResult

  switch (syncType) {
    case 'packages':
      result = await syncPackagesFromMetrc(
        siteId,
        organizationId,
        userId,
        options?.lastModifiedStart,
        options?.lastModifiedEnd
      )
      break

    // Future implementations:
    // case 'plants':
    //   result = await syncPlantsFromMetrc(...)
    //   break
    // case 'plant_batches':
    //   result = await syncPlantBatchesFromMetrc(...)
    //   break
    // case 'harvests':
    //   result = await syncHarvestsFromMetrc(...)
    //   break

    default:
      throw new Error(`Sync type "${syncType}" not yet implemented`)
  }

  const completedAt = new Date().toISOString()
  const duration = Date.now() - startTime

  return {
    success: result.success,
    syncType,
    result,
    startedAt,
    completedAt,
    duration,
  }
}

/**
 * Run multiple sync operations in sequence
 *
 * @param syncTypes - Array of sync types to run
 * @param siteId - Site ID
 * @param organizationId - Organization ID
 * @param userId - User ID initiating sync
 * @param options - Optional sync options
 * @returns Array of sync results
 */
export async function runMultipleSync(
  syncTypes: SyncType[],
  siteId: string,
  organizationId: string,
  userId: string,
  options?: {
    lastModifiedStart?: string
    lastModifiedEnd?: string
  }
): Promise<OrchestratedSyncResult[]> {
  const results: OrchestratedSyncResult[] = []

  for (const syncType of syncTypes) {
    try {
      const result = await runSync(syncType, siteId, organizationId, userId, options)
      results.push(result)
    } catch (error) {
      console.error(`Failed to run sync for ${syncType}:`, error)
      // Continue with other sync types even if one fails
      results.push({
        success: false,
        syncType,
        result: {
          success: false,
          packagesProcessed: 0,
          packagesCreated: 0,
          packagesUpdated: 0,
          errors: [(error as Error).message],
        },
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        duration: 0,
      })
    }
  }

  return results
}

/**
 * Get default date range for sync (last 7 days)
 *
 * @returns Object with lastModifiedStart and lastModifiedEnd in YYYY-MM-DD format
 */
export function getDefaultSyncDateRange(): {
  lastModifiedStart: string
  lastModifiedEnd: string
} {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)

  return {
    lastModifiedStart: start.toISOString().split('T')[0],
    lastModifiedEnd: end.toISOString().split('T')[0],
  }
}
