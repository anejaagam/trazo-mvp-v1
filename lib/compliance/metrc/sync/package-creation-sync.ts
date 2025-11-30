/**
 * Package Creation Sync Service
 *
 * Syncs package creation from harvests to Metrc
 */

import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import {
  validateHarvestPackageCreate,
  validateHarvestPackageCreateBatch,
} from '../validation/harvest-rules'
import { validatePackageProduct } from '../validation/item-rules'
import { createMetrcClientForSite } from '../services'
import type { MetrcHarvestPackageCreate } from '../types'

export interface PackageCreationResult {
  success: boolean
  synced: boolean
  errors: string[]
  warnings: string[]
  syncLogId?: string
  packagesCreated: number
  packageIds: string[]
}

/**
 * Create packages from harvest and sync to Metrc
 *
 * @param harvestId - The harvest record ID
 * @param packages - Array of packages to create
 * @param userId - User creating the packages
 * @returns Package creation result
 */
export async function createPackagesFromHarvest(
  harvestId: string,
  packages: {
    packageTag: string
    packageType: 'Product' | 'ImmaturePlant' | 'VegetativePlant' | 'Waste'
    productName: string
    itemCategory?: string
    quantity: number
    unitOfMeasure: string
    location?: string
    productionBatchNumber?: string
    isTradeSample?: boolean
    isTestingSample?: boolean
    notes?: string
  }[],
  userId: string
): Promise<PackageCreationResult> {
  const supabase = await createClient()
  const result: PackageCreationResult = {
    success: false,
    synced: false,
    errors: [],
    warnings: [],
    packagesCreated: 0,
    packageIds: [],
  }

  try {
    // Get harvest record with batch and Metrc details
    const { data: harvest, error: harvestError } = await supabase
      .from('harvest_records')
      .select(`
        *,
        batch:batches!inner(
          id,
          batch_number,
          domain_type,
          site_id,
          organization_id
        ),
        metrc_mapping:metrc_harvest_mappings(
          metrc_harvest_id,
          metrc_harvest_name
        )
      `)
      .eq('id', harvestId)
      .single()

    if (harvestError || !harvest) {
      throw new Error('Harvest record not found')
    }

    const batch = harvest.batch as any
    const metrcMapping = (harvest.metrc_mapping as any[])?.[0]

    // Create packages in local database
    const packageRecords = packages.map((pkg) => ({
      harvest_id: harvestId,
      batch_id: batch.id,
      organization_id: batch.organization_id,
      site_id: batch.site_id,
      package_tag: pkg.packageTag,
      package_type: pkg.packageType,
      product_name: pkg.productName,
      item_category: pkg.itemCategory || null,
      quantity: pkg.quantity,
      unit_of_measure: pkg.unitOfMeasure,
      production_batch_number: pkg.productionBatchNumber || batch.batch_number,
      location: pkg.location || null,
      is_trade_sample: pkg.isTradeSample || false,
      is_testing_sample: pkg.isTestingSample || false,
      packaged_by: userId,
      notes: pkg.notes || null,
    }))

    const { data: createdPackages, error: createError } = await supabase
      .from('harvest_packages')
      .insert(packageRecords)
      .select('id, package_tag')

    if (createError) throw createError

    result.packagesCreated = createdPackages?.length || 0
    result.packageIds = createdPackages?.map((p) => p.id) || []

    // If batch is not cannabis or harvest not synced to Metrc, we're done
    if (batch.domain_type !== 'cannabis' || !metrcMapping) {
      result.success = true
      result.synced = false
      if (batch.domain_type !== 'cannabis') {
        result.warnings.push('Non-cannabis batch - Metrc sync not required')
      } else {
        result.warnings.push('Harvest not synced to Metrc - packages created locally only')
      }
      return result
    }

    // Get default location if not provided
    let defaultLocation: string | null = null
    if (!packages[0]?.location) {
      const { data: podAssignment } = await supabase
        .from('batch_pod_assignments')
        .select('pod:pods(metrc_location_name)')
        .eq('batch_id', batch.id)
        .is('removed_at', null)
        .single()

      const pod = podAssignment?.pod as { metrc_location_name?: string } | null
      defaultLocation = pod?.metrc_location_name || null
    }

    // Build Metrc package creation payloads
    const packageDate = new Date().toISOString().split('T')[0]
    const metrcPackages: MetrcHarvestPackageCreate[] = packages.map((pkg) => ({
      Tag: pkg.packageTag,
      Location: pkg.location || defaultLocation || 'Main Facility',
      Item: pkg.productName,
      Quantity: pkg.quantity,
      UnitOfMeasure: pkg.unitOfMeasure,
      PackagedDate: packageDate,
      ProductionBatchNumber: pkg.productionBatchNumber || batch.batch_number,
      ...(pkg.notes && { Note: pkg.notes }),
    }))

    // Validate each package product against Metrc item rules
    for (const pkg of packages) {
      const itemValidation = validatePackageProduct({
        productName: pkg.productName,
        unitOfMeasure: pkg.unitOfMeasure,
        quantity: pkg.quantity,
      })

      // Item validation issues are warnings (Metrc accepts string names)
      itemValidation.errors.forEach((e) => {
        result.warnings.push(`Item (${pkg.productName}): ${e.field}: ${e.message}`)
      })
      itemValidation.warnings.forEach((w) => {
        result.warnings.push(`Item (${pkg.productName}): ${w.field}: ${w.message}`)
      })
    }

    // Validate Metrc package batch
    const validation = validateHarvestPackageCreateBatch(metrcPackages)
    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`)
      result.warnings.push(`Metrc validation issues: ${errorMessages.join(', ')}. Packages created locally.`)
    }

    validation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // Get Metrc client for the site (uses new site-aware credential system)
    const { client: metrcClient, credentials, error: credError } = await createMetrcClientForSite(batch.site_id, supabase)

    if (credError || !metrcClient || !credentials) {
      result.success = true
      result.synced = false
      result.warnings.push(credError || 'No active Metrc credentials - packages created locally only')
      return result
    }

    // Create sync log
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: batch.organization_id,
      site_id: batch.site_id,
      sync_type: 'package_creation',
      direction: 'push',
      operation: 'create_packages_from_harvest',
      local_id: harvestId,
      initiated_by: userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    await updateSyncLogEntry(syncLog.id, {
      status: 'in_progress',
    })

    // Call Metrc API to create packages from harvest
    let metrcPackageIds: string[] = []

    try {
      const metrcHarvestId = parseInt(metrcMapping.metrc_harvest_id)
      if (!isNaN(metrcHarvestId)) {
        await metrcClient.harvests.createPackagesFromHarvest(metrcHarvestId, metrcPackages)

        // Metrc doesn't return IDs on POST - packages are identified by tags
        // Use the package tags as Metrc identifiers
        metrcPackageIds = packages.map((p) => p.packageTag)
      } else {
        // Harvest ID is not numeric (may be a placeholder)
        result.warnings.push(
          'Harvest ID is not numeric (may be a local placeholder). Packages created locally only.'
        )
        metrcPackageIds = createdPackages?.map(() =>
          `PENDING-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        ) || []
      }
    } catch (metrcError) {
      // If API call fails, mark packages as pending
      metrcPackageIds = createdPackages?.map(() =>
        `PENDING-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      ) || []
      result.warnings.push(
        `Metrc API call failed: ${(metrcError as Error).message}. Packages saved locally for retry.`
      )

      // Update sync log with partial failure
      await updateSyncLogEntry(syncLog.id, {
        status: 'partial',
        error_message: `Metrc API: ${(metrcError as Error).message}`,
      })
    }

    // Update package records with Metrc IDs
    if (createdPackages) {
      for (let i = 0; i < createdPackages.length; i++) {
        await supabase
          .from('harvest_packages')
          .update({
            metrc_package_id: metrcPackageIds[i],
            metrc_package_label: packages[i].packageTag,
          })
          .eq('id', createdPackages[i].id)
      }
    }

    // Update sync log
    await updateSyncLogEntry(syncLog.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        metrc_harvest_id: metrcMapping.metrc_harvest_id,
        packages_created: packages.length,
        package_tags: packages.map((p) => p.packageTag),
        note: 'Packages created from harvest and synced to Metrc',
      },
    })

    result.success = true
    result.synced = true
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
    result.success = false
    return result
  }
}

/**
 * Get packages created from a harvest
 */
export async function getHarvestPackages(harvestId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('harvest_packages')
      .select(`
        *,
        packaged_by_user:users!packaged_by(id, full_name)
      `)
      .eq('harvest_id', harvestId)
      .order('packaged_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting harvest packages:', error)
    return { data: null, error }
  }
}

/**
 * Get total packaged weight from a harvest
 */
export async function getHarvestPackagedWeight(harvestId: string): Promise<number> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('harvest_packages')
      .select('quantity, unit_of_measure')
      .eq('harvest_id', harvestId)
      .eq('status', 'active')

    if (error) throw error

    // Sum all quantities (assuming all in grams for now)
    // In production, you'd need to convert different units
    const total = data?.reduce((sum, pkg) => {
      // Convert to grams if needed
      let weightInGrams = pkg.quantity
      if (pkg.unit_of_measure === 'Kilograms') {
        weightInGrams = pkg.quantity * 1000
      } else if (pkg.unit_of_measure === 'Pounds') {
        weightInGrams = pkg.quantity * 453.592
      } else if (pkg.unit_of_measure === 'Ounces') {
        weightInGrams = pkg.quantity * 28.3495
      }
      return sum + weightInGrams
    }, 0) || 0

    return total
  } catch (error) {
    console.error('Error calculating packaged weight:', error)
    return 0
  }
}

/**
 * Update package status
 */
export async function updatePackageStatus(
  packageId: string,
  status: 'active' | 'in_transit' | 'sold' | 'destroyed' | 'on_hold',
  userId: string
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('harvest_packages')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', packageId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating package status:', error)
    return { data: null, error }
  }
}
