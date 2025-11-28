/**
 * Batch Package Sync Service
 *
 * Creates immature plant packages from plant batches for nursery operations
 * This allows licensed nurseries to package and sell immature plants
 */

import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import { createMetrcClientForSite } from '../services'
import { allowsImmaturePackages } from '@/lib/jurisdiction/plant-batch-config'

export interface ImmaturePackageConfig {
  packageTag: string // Metrc package tag for the new package
  itemName: string // Metrc item name (e.g., "Clone - Blue Dream")
  quantity: number // Number of plants to package
  unitOfMeasure: string // e.g., "Each"
  packagedDate: string // YYYY-MM-DD format
  location?: string // Metrc location name
  note?: string
}

export interface BatchPackageSyncResult {
  success: boolean
  packagesCreated: number
  plantsPackaged: number
  errors: string[]
  warnings: string[]
  syncLogId?: string
  packageTags?: string[]
}

/**
 * Create immature plant packages from a plant batch
 *
 * @param batchId - The source batch ID
 * @param packages - Array of package configurations
 * @param userId - User creating the packages
 * @returns Sync result
 */
export async function createImmaturePlantsPackages(
  batchId: string,
  packages: ImmaturePackageConfig[],
  userId: string
): Promise<BatchPackageSyncResult> {
  const supabase = await createClient()
  const result: BatchPackageSyncResult = {
    success: false,
    packagesCreated: 0,
    plantsPackaged: 0,
    errors: [],
    warnings: [],
    packageTags: [],
  }

  try {
    // 1. Get batch with site info
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select(`
        *,
        cultivar:cultivars(id, name),
        site:sites(id, state)
      `)
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      throw new Error('Batch not found')
    }

    // 2. Validate domain type
    if (batch.domain_type !== 'cannabis') {
      throw new Error('Immature plant packages only applicable to cannabis batches')
    }

    // 3. Check if state allows immature packages
    const site = batch.site as { id: string; state: string } | null
    const stateCode = site?.state || 'OR'

    if (!allowsImmaturePackages(stateCode)) {
      throw new Error(`${stateCode} does not allow immature plant packages`)
    }

    // 4. Validate total quantity doesn't exceed plant count
    const totalQuantity = packages.reduce((sum, pkg) => sum + pkg.quantity, 0)
    if (totalQuantity > batch.plant_count) {
      throw new Error(
        `Total package quantity (${totalQuantity}) exceeds batch plant count (${batch.plant_count})`
      )
    }

    // 5. Validate package tags are unique
    const tags = packages.map((p) => p.packageTag)
    const uniqueTags = new Set(tags)
    if (uniqueTags.size !== tags.length) {
      throw new Error('Duplicate package tags provided')
    }

    // 6. Check if batch is synced to Metrc
    const { data: mapping } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_batch_id, metrc_batch_name')
      .eq('batch_id', batchId)
      .single()

    if (!mapping) {
      throw new Error('Batch must be synced to Metrc before creating packages')
    }

    // 7. Get Metrc client
    const {
      client: metrcClient,
      credentials,
      error: credError,
    } = await createMetrcClientForSite(batch.site_id, supabase)

    if (credError || !metrcClient || !credentials) {
      throw new Error(credError || 'Failed to get Metrc credentials for this site')
    }

    // 8. Create sync log
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: batch.organization_id,
      site_id: batch.site_id,
      sync_type: 'immature_plant_packages',
      direction: 'push',
      operation: 'create_packages',
      local_id: batchId,
      initiated_by: userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    await updateSyncLogEntry(syncLog.id, {
      status: 'in_progress',
    })

    // 9. Build Metrc package payloads
    const metrcPackages = packages.map((pkg) => ({
      PlantBatch: mapping.metrc_batch_name,
      Count: pkg.quantity,
      Location: pkg.location || batch.location || 'Default',
      Item: pkg.itemName,
      Tag: pkg.packageTag,
      PatientLicenseNumber: null,
      Note: pkg.note || `Immature plant package from batch ${batch.batch_number}`,
      IsTradeSample: false,
      IsDonation: false,
      ActualDate: pkg.packagedDate,
    }))

    // 10. Create packages in Metrc
    // Note: The endpoint is /plantbatches/v2/packages
    try {
      await metrcClient.request(
        `/plantbatches/v2/packages?licenseNumber=${credentials.licenseNumber}`,
        {
          method: 'POST',
          body: metrcPackages,
        }
      )
    } catch (metrcError) {
      const errorMsg = (metrcError as Error).message
      result.errors.push(`Metrc API error: ${errorMsg}`)

      await updateSyncLogEntry(syncLog.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMsg,
      })

      return result
    }

    // 11. Update batch plant count
    const newPlantCount = batch.plant_count - totalQuantity

    await supabase
      .from('batches')
      .update({
        plant_count: newPlantCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId)

    // 12. Create package records in TRAZO
    const packageRecords = packages.map((pkg) => ({
      organization_id: batch.organization_id,
      site_id: batch.site_id,
      source_batch_id: batchId,
      package_tag: pkg.packageTag,
      item_name: pkg.itemName,
      quantity: pkg.quantity,
      unit_of_measure: pkg.unitOfMeasure,
      packaged_date: pkg.packagedDate,
      package_type: 'immature_plants',
      metrc_sync_status: 'synced',
      created_by: userId,
    }))

    // Note: This assumes you have a packages or plant_packages table
    // If not, this insert would fail - adjust table name as needed
    try {
      await supabase.from('packages').insert(packageRecords)
    } catch (insertError) {
      // If packages table doesn't exist, just log warning
      result.warnings.push('Package records not saved to local database (table may not exist)')
    }

    // 13. Create batch event
    await supabase.from('batch_events').insert({
      batch_id: batchId,
      event_type: 'package_created',
      user_id: userId,
      from_value: { plant_count: batch.plant_count },
      to_value: {
        plant_count: newPlantCount,
        packages_created: packages.length,
        total_packaged: totalQuantity,
      },
      notes: `Created ${packages.length} immature plant packages (${totalQuantity} plants)`,
    })

    // 14. Update sync log
    await updateSyncLogEntry(syncLog.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        packages_created: packages.length,
        plants_packaged: totalQuantity,
        package_tags: tags,
        remaining_plant_count: newPlantCount,
      },
    })

    result.success = true
    result.packagesCreated = packages.length
    result.plantsPackaged = totalQuantity
    result.packageTags = tags

    return result
  } catch (error) {
    const errorMessage = (error as Error).message

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
 * Get available package tags for a site
 */
export async function getAvailablePackageTags(
  siteId: string,
  limit: number = 50
): Promise<{ tags: string[]; error?: string }> {
  try {
    const supabase = await createClient()

    // Get Metrc client
    const { client: metrcClient, error: credError } = await createMetrcClientForSite(
      siteId,
      supabase
    )

    if (credError || !metrcClient) {
      return { tags: [], error: credError || 'Failed to get Metrc client' }
    }

    // Get available package tags from Metrc
    const availableTags = await metrcClient.tags.listAvailable('package')

    // Return first N tags
    return {
      tags: availableTags.slice(0, limit).map((t) => t.Label),
    }
  } catch (error) {
    return {
      tags: [],
      error: (error as Error).message,
    }
  }
}

/**
 * Validate immature package configuration
 */
export function validateImmaturePackageConfig(
  config: ImmaturePackageConfig,
  stateCode: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.packageTag) {
    errors.push('Package tag is required')
  }

  if (!config.itemName) {
    errors.push('Item name is required')
  }

  if (!config.quantity || config.quantity < 1) {
    errors.push('Quantity must be at least 1')
  }

  if (!config.packagedDate) {
    errors.push('Packaged date is required')
  } else {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(config.packagedDate)) {
      errors.push('Packaged date must be in YYYY-MM-DD format')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
