/**
 * Metrc Packages Sync Service
 *
 * Handles pulling package data from Metrc and syncing with TRAZO inventory
 */

import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import { createMetrcClientForSite } from '../services'
import type { MetrcPackage } from '../types'

export interface PackageSyncResult {
  success: boolean
  packagesProcessed: number
  packagesCreated: number
  packagesUpdated: number
  errors: string[]
  syncLogId?: string
}

/**
 * Sync packages from Metrc to TRAZO
 *
 * @param siteId - The site ID to sync packages for
 * @param organizationId - The organization ID
 * @param userId - The user ID initiating the sync
 * @param lastModifiedStart - Optional date filter (YYYY-MM-DD)
 * @param lastModifiedEnd - Optional date filter (YYYY-MM-DD)
 * @returns Sync result with statistics
 */
export async function syncPackagesFromMetrc(
  siteId: string,
  organizationId: string,
  userId: string,
  lastModifiedStart?: string,
  lastModifiedEnd?: string
): Promise<PackageSyncResult> {
  const supabase = await createClient()
  const result: PackageSyncResult = {
    success: false,
    packagesProcessed: 0,
    packagesCreated: 0,
    packagesUpdated: 0,
    errors: [],
  }

  try {
    // Get Metrc client for the site (uses new site-aware credential system)
    const { client: metrcClient, credentials, error: credError } = await createMetrcClientForSite(siteId, supabase)

    if (credError || !metrcClient || !credentials) {
      throw new Error(credError || 'Failed to get Metrc credentials for this site')
    }

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: organizationId,
      site_id: siteId,
      sync_type: 'packages',
      direction: 'pull',
      operation: 'sync',
      initiated_by: userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    // Update sync log to in_progress
    await updateSyncLogEntry(syncLog.id, {
      status: 'in_progress',
    })

    // Fetch packages from Metrc
    const metrcPackages = await metrcClient.packages.listActive(
      lastModifiedStart,
      lastModifiedEnd
    )

    result.packagesProcessed = metrcPackages.length

    // Process each package
    for (const metrcPackage of metrcPackages) {
      try {
        await processPackage(supabase, siteId, organizationId, metrcPackage, result)
      } catch (error) {
        result.errors.push(
          `Failed to process package ${metrcPackage.Label}: ${(error as Error).message}`
        )
      }
    }

    // Update sync log to completed
    await updateSyncLogEntry(syncLog.id, {
      status: result.errors.length > 0 ? 'partial' : 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        packagesProcessed: result.packagesProcessed,
        packagesCreated: result.packagesCreated,
        packagesUpdated: result.packagesUpdated,
        errors: result.errors,
      },
    })

    result.success = result.errors.length === 0
    return result
  } catch (error) {
    const errorMessage = (error as Error).message

    // Update sync log to failed
    if (result.syncLogId) {
      await updateSyncLogEntry(result.syncLogId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
    }

    result.errors.push(errorMessage)
    return result
  }
}

/**
 * Process a single Metrc package
 *
 * @private
 */
async function processPackage(
  supabase: any,
  siteId: string,
  organizationId: string,
  metrcPackage: MetrcPackage,
  result: PackageSyncResult
): Promise<void> {
  // Check if mapping already exists
  const { data: existingMapping } = await supabase
    .from('metrc_package_mappings')
    .select('*, inventory_lots(*)')
    .eq('metrc_package_id', metrcPackage.Id.toString())
    .eq('site_id', siteId)
    .single()

  if (existingMapping) {
    // Update existing inventory lot
    await supabase
      .from('inventory_lots')
      .update({
        quantity: metrcPackage.Quantity,
        unit_of_measure: metrcPackage.UnitOfMeasure,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMapping.inventory_lot_id)

    // Update mapping
    await supabase
      .from('metrc_package_mappings')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
        metrc_package_label: metrcPackage.Label,
        metrc_package_type: metrcPackage.PackageType,
      })
      .eq('id', existingMapping.id)

    result.packagesUpdated++
  } else {
    // Create new inventory lot
    const { data: newLot, error: lotError } = await supabase
      .from('inventory_lots')
      .insert({
        organization_id: organizationId,
        site_id: siteId,
        product_name: metrcPackage.Item,
        quantity: metrcPackage.Quantity,
        unit_of_measure: metrcPackage.UnitOfMeasure,
        status: metrcPackage.IsInTransit
          ? 'in_transit'
          : metrcPackage.IsOnHold
            ? 'on_hold'
            : 'available',
        compliance_package_uid: metrcPackage.Label,
        created_at: metrcPackage.PackagedDate,
      })
      .select()
      .single()

    if (lotError || !newLot) {
      throw new Error(`Failed to create inventory lot: ${lotError?.message}`)
    }

    // Create mapping
    await supabase.from('metrc_package_mappings').insert({
      organization_id: organizationId,
      site_id: siteId,
      inventory_lot_id: newLot.id,
      metrc_package_id: metrcPackage.Id.toString(),
      metrc_package_label: metrcPackage.Label,
      metrc_package_type: metrcPackage.PackageType,
      last_synced_at: new Date().toISOString(),
      sync_status: 'synced',
    })

    result.packagesCreated++
  }
}
