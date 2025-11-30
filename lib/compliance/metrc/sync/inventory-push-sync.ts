/**
 * Inventory Push Sync Service
 *
 * Pushes TRAZO inventory lots to Metrc as packages
 */

import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import { validatePackageCreate, validatePackageCreateBatch } from '../validation'
import { createMetrcClientForSite } from '../services'
import type { MetrcPackageCreate } from '../types'

export interface InventoryPushResult {
  success: boolean
  lotsProcessed: number
  lotsCreated: number
  errors: string[]
  syncLogId?: string
}

/**
 * Push an inventory lot to Metrc as a package
 *
 * @param lotId - The inventory lot ID to push
 * @param siteId - The site ID
 * @param organizationId - The organization ID
 * @param userId - The user ID initiating the sync
 * @returns Push result with statistics
 */
export async function pushInventoryLotToMetrc(
  lotId: string,
  siteId: string,
  organizationId: string,
  userId: string
): Promise<InventoryPushResult> {
  const supabase = await createClient()
  const result: InventoryPushResult = {
    success: false,
    lotsProcessed: 0,
    lotsCreated: 0,
    errors: [],
  }

  try {
    // Get the inventory lot
    const { data: lot, error: lotError } = await supabase
      .from('inventory_lots')
      .select('*')
      .eq('id', lotId)
      .single()

    if (lotError || !lot) {
      throw new Error('Inventory lot not found')
    }

    // Check if already synced
    const { data: existingMapping } = await supabase
      .from('metrc_package_mappings')
      .select('*')
      .eq('inventory_lot_id', lotId)
      .single()

    if (existingMapping) {
      throw new Error('Inventory lot already synced to Metrc')
    }

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
      direction: 'push',
      operation: 'create',
      local_id: lotId,
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

    // Build Metrc package payload
    const metrcPackage: MetrcPackageCreate = {
      Tag: lot.compliance_package_uid || '', // Must have a tag assigned
      Item: lot.product_name,
      Quantity: lot.quantity,
      UnitOfMeasure: lot.unit_of_measure || 'Grams',
      PackagedDate: lot.created_at || new Date().toISOString(),
      Note: lot.notes || undefined,
    }

    // Validate package data
    const validationResult = validatePackageCreate(metrcPackage)
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }

    // Create package in Metrc
    await metrcClient.packages.create([metrcPackage])

    result.lotsProcessed = 1
    result.lotsCreated = 1

    // Fetch the created package from Metrc to get its ID
    const metrcPackages = await metrcClient.packages.listActive()
    const createdPackage = metrcPackages.find((p) => p.Label === metrcPackage.Tag)

    if (createdPackage) {
      // Create mapping
      await supabase.from('metrc_package_mappings').insert({
        organization_id: organizationId,
        site_id: siteId,
        inventory_lot_id: lotId,
        metrc_package_id: createdPackage.Id.toString(),
        metrc_package_label: createdPackage.Label,
        metrc_package_type: createdPackage.PackageType,
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
      })

      // Update sync log with Metrc ID
      await updateSyncLogEntry(syncLog.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        response_payload: {
          metrc_package_id: createdPackage.Id,
          metrc_package_label: createdPackage.Label,
        },
      })
    } else {
      // Package created but couldn't find it (rare edge case)
      await updateSyncLogEntry(syncLog.id, {
        status: 'partial',
        completed_at: new Date().toISOString(),
        error_message: 'Package created but not found in Metrc listing',
      })
      result.errors.push('Package created but verification failed')
    }

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
 * Push multiple inventory lots to Metrc
 *
 * @param lotIds - Array of inventory lot IDs to push
 * @param siteId - The site ID
 * @param organizationId - The organization ID
 * @param userId - The user ID initiating the sync
 * @returns Push result with statistics
 */
export async function pushInventoryLotsToMetrc(
  lotIds: string[],
  siteId: string,
  organizationId: string,
  userId: string
): Promise<InventoryPushResult> {
  const aggregateResult: InventoryPushResult = {
    success: true,
    lotsProcessed: 0,
    lotsCreated: 0,
    errors: [],
  }

  for (const lotId of lotIds) {
    const result = await pushInventoryLotToMetrc(lotId, siteId, organizationId, userId)
    aggregateResult.lotsProcessed += result.lotsProcessed
    aggregateResult.lotsCreated += result.lotsCreated
    aggregateResult.errors.push(...result.errors)
  }

  aggregateResult.success = aggregateResult.errors.length === 0
  return aggregateResult
}
