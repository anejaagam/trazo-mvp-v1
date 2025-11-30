/**
 * Metrc Sync Orchestrator
 *
 * Coordinates all sync operations between TRAZO and Metrc
 */

import { createClient } from '@/lib/supabase/server'
import { syncPackagesFromMetrc, type PackageSyncResult } from './packages-sync'
import { syncStrainsFromMetrc } from './strains-sync'
import { syncItemsFromMetrc } from './items-sync'
import { syncTagsFromMetrc } from './tags-sync'
import { syncPlantBatchesFromMetrc } from './plant-batches-sync'
import { createMetrcClientForSite } from '../services'

export type SyncType = 'packages' | 'plants' | 'plant_batches' | 'harvests' | 'sales' | 'transfers' | 'strains' | 'items' | 'tags'

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

  // Get Metrc client for site (needed for most sync types)
  const supabase = await createClient()
  const { client: metrcClient, error: clientError } = await createMetrcClientForSite(siteId, supabase)

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

    case 'strains':
      if (!metrcClient) {
        throw new Error(clientError || 'Failed to create Metrc client')
      }
      // Pass userId to create cultivars from Metrc strains
      const strainsResult = await syncStrainsFromMetrc(metrcClient, organizationId, siteId, userId)
      result = {
        success: strainsResult.success,
        packagesProcessed: strainsResult.synced,
        packagesCreated: strainsResult.created,
        packagesUpdated: strainsResult.updated,
        errors: strainsResult.errors,
        warnings: strainsResult.warnings,
        synced: strainsResult.synced,
        created: strainsResult.created,
        updated: strainsResult.updated,
        cultivarsCreated: strainsResult.cultivarsCreated,
        cultivarsLinked: strainsResult.cultivarsLinked,
      }
      break

    case 'items':
      if (!metrcClient) {
        throw new Error(clientError || 'Failed to create Metrc client')
      }
      const itemsResult = await syncItemsFromMetrc(metrcClient, organizationId, siteId)
      result = {
        success: itemsResult.success,
        packagesProcessed: itemsResult.synced,
        packagesCreated: itemsResult.created,
        packagesUpdated: itemsResult.updated,
        errors: itemsResult.errors,
        synced: itemsResult.synced,
        created: itemsResult.created,
        updated: itemsResult.updated,
      }
      break

    case 'plants':
      // Plants sync - pull plant data from Metrc
      if (!metrcClient) {
        throw new Error(clientError || 'Failed to create Metrc client')
      }
      try {
        const [vegetativePlantsRaw, floweringPlantsRaw] = await Promise.all([
          metrcClient.plants.listVegetative(),
          metrcClient.plants.listFlowering(),
        ])
        // Metrc API returns null/undefined when no data exists, not an empty array
        const vegetativePlants = Array.isArray(vegetativePlantsRaw) ? vegetativePlantsRaw : []
        const floweringPlants = Array.isArray(floweringPlantsRaw) ? floweringPlantsRaw : []
        const totalPlants = vegetativePlants.length + floweringPlants.length
        result = {
          success: true,
          packagesProcessed: totalPlants,
          packagesCreated: 0,
          packagesUpdated: totalPlants,
          errors: [],
          synced: totalPlants,
          created: 0,
          updated: totalPlants,
        }
      } catch (error) {
        result = {
          success: false,
          packagesProcessed: 0,
          packagesCreated: 0,
          packagesUpdated: 0,
          errors: [(error as Error).message],
        }
      }
      break

    case 'plant_batches':
      // Plant batches sync - pull plant batch data from Metrc and store in cache
      if (!metrcClient) {
        throw new Error(clientError || 'Failed to create Metrc client')
      }
      const plantBatchesResult = await syncPlantBatchesFromMetrc(metrcClient, organizationId, siteId)
      result = {
        success: plantBatchesResult.success,
        packagesProcessed: plantBatchesResult.synced,
        packagesCreated: plantBatchesResult.created,
        packagesUpdated: plantBatchesResult.updated,
        errors: plantBatchesResult.errors,
        warnings: plantBatchesResult.warnings,
        synced: plantBatchesResult.synced,
        created: plantBatchesResult.created,
        updated: plantBatchesResult.updated,
        batchesLinked: plantBatchesResult.batchesLinked,
        deactivated: plantBatchesResult.deactivated,
      }
      break

    case 'harvests':
      // Harvests sync - pull harvest data from Metrc
      if (!metrcClient) {
        throw new Error(clientError || 'Failed to create Metrc client')
      }
      try {
        const [activeHarvestsRaw, inactiveHarvestsRaw] = await Promise.all([
          metrcClient.harvests.listActive(),
          metrcClient.harvests.listInactive(),
        ])
        // Metrc API returns null/undefined when no data exists, not an empty array
        const activeHarvests = Array.isArray(activeHarvestsRaw) ? activeHarvestsRaw : []
        const inactiveHarvests = Array.isArray(inactiveHarvestsRaw) ? inactiveHarvestsRaw : []
        const totalHarvests = activeHarvests.length + inactiveHarvests.length
        result = {
          success: true,
          packagesProcessed: totalHarvests,
          packagesCreated: 0,
          packagesUpdated: totalHarvests,
          errors: [],
          synced: totalHarvests,
          created: 0,
          updated: totalHarvests,
        }
      } catch (error) {
        result = {
          success: false,
          packagesProcessed: 0,
          packagesCreated: 0,
          packagesUpdated: 0,
          errors: [(error as Error).message],
        }
      }
      break

    case 'tags':
      // Tags sync - pull available tags from Metrc
      if (!metrcClient) {
        throw new Error(clientError || 'Failed to create Metrc client')
      }
      const tagsResult = await syncTagsFromMetrc(metrcClient, organizationId, siteId)
      result = {
        success: tagsResult.success,
        packagesProcessed: tagsResult.synced,
        packagesCreated: tagsResult.created,
        packagesUpdated: tagsResult.updated,
        errors: tagsResult.errors,
        synced: tagsResult.synced,
        created: tagsResult.created,
        updated: tagsResult.updated,
      }
      break

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
