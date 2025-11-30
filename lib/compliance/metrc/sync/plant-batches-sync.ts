/**
 * Plant Batches Sync Service
 *
 * Manages synchronization between TRAZO batches and Metrc plant batches.
 * Provides functions to sync plant batches from Metrc to local cache and
 * link TRAZO batches to Metrc plant batches.
 */

import { createClient } from '@/lib/supabase/server'
import { MetrcClient } from '../client'
import type { MetrcPlantBatch } from '../types'

// =====================================================
// TYPES
// =====================================================

export interface SyncPlantBatchesResult {
  success: boolean
  synced: number
  created: number
  updated: number
  deactivated: number
  batchesLinked: number
  errors: string[]
  warnings: string[]
}

export interface CachedPlantBatch {
  id: string
  organization_id: string
  site_id: string
  metrc_batch_id: number
  name: string
  type: 'Seed' | 'Clone'
  count: number
  strain_name: string
  planted_date: string
  facility_license_number: string | null
  facility_name: string | null
  room_name: string | null
  destroyed_date: string | null
  untracked_count: number
  tracked_count: number
  is_active: boolean
  trazo_batch_id: string | null
  last_synced_at: string
}

export interface PlantBatchLinkResult {
  success: boolean
  metrcBatchId: number | null
  metrcBatchName: string | null
  action: 'linked' | 'already_linked' | 'not_found' | 'failed'
  error: string | null
}

// =====================================================
// SYNC PLANT BATCHES FROM METRC
// =====================================================

/**
 * Sync plant batches from Metrc to local cache
 * Fetches all active and inactive plant batches from Metrc and:
 * 1. Updates the local plant batches cache
 * 2. Marks destroyed batches as inactive
 * 3. Attempts to auto-link to TRAZO batches by name
 */
export async function syncPlantBatchesFromMetrc(
  client: MetrcClient,
  organizationId: string,
  siteId: string
): Promise<SyncPlantBatchesResult> {
  const result: SyncPlantBatchesResult = {
    success: false,
    synced: 0,
    created: 0,
    updated: 0,
    deactivated: 0,
    batchesLinked: 0,
    errors: [],
    warnings: [],
  }

  const supabase = await createClient()

  try {
    // Fetch active and inactive plant batches from Metrc
    // Note: Metrc API may return null/undefined if no batches exist
    const [activeBatchesRaw, inactiveBatchesRaw] = await Promise.all([
      client.plantBatches.listActive(),
      client.plantBatches.listInactive(),
    ])

    // Ensure arrays (Metrc may return null/undefined for empty results)
    const activeBatches = Array.isArray(activeBatchesRaw) ? activeBatchesRaw : []
    const inactiveBatches = Array.isArray(inactiveBatchesRaw) ? inactiveBatchesRaw : []

    const allMetrcBatches = [...activeBatches, ...inactiveBatches]
    result.synced = allMetrcBatches.length

    // Get existing cached plant batches
    const { data: existingCache } = await supabase
      .from('metrc_plant_batches_cache')
      .select('metrc_batch_id, is_active')
      .eq('site_id', siteId)

    const existingCacheMap = new Map<number, { is_active: boolean }>()
    existingCache?.forEach((c) => {
      existingCacheMap.set(c.metrc_batch_id, { is_active: c.is_active })
    })

    // Get existing TRAZO batches for auto-linking
    const { data: trazoBatches } = await supabase
      .from('batches')
      .select('id, batch_number, metrc_batch_id')
      .eq('organization_id', organizationId)
      .eq('site_id', siteId)

    // Build lookup map for TRAZO batches by batch_number (normalized)
    const trazoBatchByNumber = new Map<string, { id: string; metrc_batch_id: string | null }>()
    trazoBatches?.forEach((b) => {
      trazoBatchByNumber.set(b.batch_number.trim().toLowerCase(), {
        id: b.id,
        metrc_batch_id: b.metrc_batch_id,
      })
    })

    // Track which Metrc batch IDs we've seen (for deactivation)
    const seenMetrcIds = new Set<number>()

    // Process each plant batch from Metrc
    for (const metrcBatch of allMetrcBatches) {
      seenMetrcIds.add(metrcBatch.Id)

      const isActive = !metrcBatch.DestroyedDate
      const existingEntry = existingCacheMap.get(metrcBatch.Id)

      // Try to find matching TRAZO batch for auto-linking
      const normalizedName = metrcBatch.Name.trim().toLowerCase()
      const matchingTrazoBatch = trazoBatchByNumber.get(normalizedName)
      let trazoBatchId: string | null = null

      if (matchingTrazoBatch && !matchingTrazoBatch.metrc_batch_id) {
        trazoBatchId = matchingTrazoBatch.id
      }

      // Build cache data
      // Note: Metrc API v2 field names differ from v1:
      // - PlantBatchTypeName instead of Type
      // - LocationName instead of RoomName
      // - No direct Count field, use UntrackedCount + TrackedCount
      const cacheData = {
        organization_id: organizationId,
        site_id: siteId,
        metrc_batch_id: metrcBatch.Id,
        name: metrcBatch.Name,
        type: metrcBatch.PlantBatchTypeName || metrcBatch.Type || 'Clone',
        count: (metrcBatch.UntrackedCount || 0) + (metrcBatch.TrackedCount || 0),
        strain_name: metrcBatch.StrainName,
        planted_date: metrcBatch.PlantedDate,
        facility_license_number: null, // Not in v2 response
        facility_name: null, // Not in v2 response
        room_name: metrcBatch.LocationName || null,
        destroyed_date: null, // DestroyedDate not in active batches response
        untracked_count: metrcBatch.UntrackedCount || 0,
        tracked_count: metrcBatch.TrackedCount || 0,
        is_active: isActive,
        trazo_batch_id: trazoBatchId,
        last_synced_at: new Date().toISOString(),
      }

      // Upsert to cache
      const { error: cacheError } = await supabase
        .from('metrc_plant_batches_cache')
        .upsert(cacheData, {
          onConflict: 'site_id,metrc_batch_id',
        })

      if (cacheError) {
        result.errors.push(`Failed to cache plant batch ${metrcBatch.Name}: ${cacheError.message}`)
        continue
      }

      // Track create/update stats
      if (existingEntry) {
        result.updated++
        if (existingEntry.is_active && !isActive) {
          result.deactivated++
        }
      } else {
        result.created++
      }

      // Auto-link TRAZO batch if we found a match
      if (trazoBatchId) {
        const { error: linkError } = await supabase
          .from('batches')
          .update({
            metrc_batch_id: metrcBatch.Id.toString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', trazoBatchId)

        if (linkError) {
          result.warnings.push(`Failed to auto-link TRAZO batch to ${metrcBatch.Name}: ${linkError.message}`)
        } else {
          result.batchesLinked++

          // Also update/create the mapping table
          await supabase.from('metrc_batch_mappings').upsert({
            organization_id: organizationId,
            site_id: siteId,
            batch_id: trazoBatchId,
            metrc_batch_id: metrcBatch.Id.toString(),
            metrc_batch_name: metrcBatch.Name,
            metrc_batch_type: metrcBatch.Type,
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
          }, {
            onConflict: 'batch_id',
          })
        }
      }
    }

    // Mark any cached batches not in Metrc response as inactive (if they were previously active)
    const cachedIdsToDeactivate = Array.from(existingCacheMap.keys()).filter(
      (id) => !seenMetrcIds.has(id) && existingCacheMap.get(id)?.is_active
    )

    if (cachedIdsToDeactivate.length > 0) {
      const { error: deactivateError } = await supabase
        .from('metrc_plant_batches_cache')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('site_id', siteId)
        .in('metrc_batch_id', cachedIdsToDeactivate)

      if (deactivateError) {
        result.warnings.push(`Failed to deactivate stale cache entries: ${deactivateError.message}`)
      } else {
        result.deactivated += cachedIdsToDeactivate.length
      }
    }

    result.success = result.errors.length === 0
  } catch (error) {
    result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

// =====================================================
// GET CACHED PLANT BATCHES
// =====================================================

/**
 * Get all cached plant batches for a site
 */
export async function getCachedPlantBatches(
  siteId: string,
  options?: {
    activeOnly?: boolean
    linkedOnly?: boolean
    unlinkedOnly?: boolean
  }
): Promise<CachedPlantBatch[]> {
  const supabase = await createClient()

  let query = supabase
    .from('metrc_plant_batches_cache')
    .select('*')
    .eq('site_id', siteId)
    .order('planted_date', { ascending: false })

  if (options?.activeOnly) {
    query = query.eq('is_active', true)
  }

  if (options?.linkedOnly) {
    query = query.not('trazo_batch_id', 'is', null)
  }

  if (options?.unlinkedOnly) {
    query = query.is('trazo_batch_id', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching cached plant batches:', error)
    return []
  }

  return data || []
}

/**
 * Get a cached plant batch by Metrc ID
 */
export async function getCachedPlantBatchByMetrcId(
  siteId: string,
  metrcBatchId: number
): Promise<CachedPlantBatch | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metrc_plant_batches_cache')
    .select('*')
    .eq('site_id', siteId)
    .eq('metrc_batch_id', metrcBatchId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Get a cached plant batch by name
 */
export async function getCachedPlantBatchByName(
  siteId: string,
  name: string
): Promise<CachedPlantBatch | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metrc_plant_batches_cache')
    .select('*')
    .eq('site_id', siteId)
    .ilike('name', name)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

// =====================================================
// LINK TRAZO BATCH TO METRC
// =====================================================

/**
 * Link a TRAZO batch to a Metrc plant batch
 * First checks cache, then checks Metrc directly if not found
 */
export async function linkTrazoBatchToMetrc(
  client: MetrcClient,
  trazoBatchId: string,
  trazoBatchNumber: string,
  organizationId: string,
  siteId: string
): Promise<PlantBatchLinkResult> {
  const supabase = await createClient()

  const result: PlantBatchLinkResult = {
    success: false,
    metrcBatchId: null,
    metrcBatchName: null,
    action: 'failed',
    error: null,
  }

  try {
    // Check if already linked
    const { data: existingBatch } = await supabase
      .from('batches')
      .select('metrc_batch_id')
      .eq('id', trazoBatchId)
      .single()

    if (existingBatch?.metrc_batch_id) {
      result.success = true
      result.metrcBatchId = parseInt(existingBatch.metrc_batch_id, 10)
      result.action = 'already_linked'
      return result
    }

    // First check local cache
    const cachedBatch = await getCachedPlantBatchByName(siteId, trazoBatchNumber)

    if (cachedBatch) {
      // Found in cache - link it
      const { error: linkError } = await supabase
        .from('batches')
        .update({
          metrc_batch_id: cachedBatch.metrc_batch_id.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', trazoBatchId)

      if (linkError) {
        result.error = `Failed to link batch: ${linkError.message}`
        return result
      }

      // Update cache with TRAZO batch reference
      await supabase
        .from('metrc_plant_batches_cache')
        .update({ trazo_batch_id: trazoBatchId })
        .eq('id', cachedBatch.id)

      // Update/create mapping
      await supabase.from('metrc_batch_mappings').upsert({
        organization_id: organizationId,
        site_id: siteId,
        batch_id: trazoBatchId,
        metrc_batch_id: cachedBatch.metrc_batch_id.toString(),
        metrc_batch_name: cachedBatch.name,
        metrc_batch_type: cachedBatch.type,
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
      }, {
        onConflict: 'batch_id',
      })

      result.success = true
      result.metrcBatchId = cachedBatch.metrc_batch_id
      result.metrcBatchName = cachedBatch.name
      result.action = 'linked'
      return result
    }

    // Not in cache - try to find in Metrc directly
    const activeBatchesRaw = await client.plantBatches.listActive()
    const activeBatches = Array.isArray(activeBatchesRaw) ? activeBatchesRaw : []
    const matchingBatch = activeBatches.find(
      (b) => b.Name.trim().toLowerCase() === trazoBatchNumber.trim().toLowerCase()
    )

    if (matchingBatch) {
      // Found in Metrc - add to cache and link
      // Note: Metrc API v2 field names differ from v1
      const batchType = matchingBatch.PlantBatchTypeName || matchingBatch.Type || 'Clone'
      const batchCount = (matchingBatch.UntrackedCount || 0) + (matchingBatch.TrackedCount || 0)

      await supabase.from('metrc_plant_batches_cache').upsert({
        organization_id: organizationId,
        site_id: siteId,
        metrc_batch_id: matchingBatch.Id,
        name: matchingBatch.Name,
        type: batchType,
        count: batchCount,
        strain_name: matchingBatch.StrainName,
        planted_date: matchingBatch.PlantedDate,
        facility_license_number: null, // Not in v2 response
        facility_name: null, // Not in v2 response
        room_name: matchingBatch.LocationName || null,
        destroyed_date: matchingBatch.DestroyedDate || null,
        untracked_count: matchingBatch.UntrackedCount || 0,
        tracked_count: matchingBatch.TrackedCount || 0,
        is_active: !matchingBatch.DestroyedDate,
        trazo_batch_id: trazoBatchId,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'site_id,metrc_batch_id',
      })

      // Link TRAZO batch
      await supabase
        .from('batches')
        .update({
          metrc_batch_id: matchingBatch.Id.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', trazoBatchId)

      // Create mapping
      await supabase.from('metrc_batch_mappings').upsert({
        organization_id: organizationId,
        site_id: siteId,
        batch_id: trazoBatchId,
        metrc_batch_id: matchingBatch.Id.toString(),
        metrc_batch_name: matchingBatch.Name,
        metrc_batch_type: batchType,
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
      }, {
        onConflict: 'batch_id',
      })

      result.success = true
      result.metrcBatchId = matchingBatch.Id
      result.metrcBatchName = matchingBatch.Name
      result.action = 'linked'
      return result
    }

    // Not found anywhere
    result.action = 'not_found'
    result.error = `Plant batch "${trazoBatchNumber}" not found in Metrc`
    return result
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error'
    return result
  }
}

// =====================================================
// COMPLIANCE STATS
// =====================================================

export interface PlantBatchComplianceStats {
  totalCached: number
  activeCached: number
  inactiveCached: number
  linkedToTrazo: number
  unlinkedFromTrazo: number
  lastSyncedAt: string | null
}

/**
 * Get plant batch compliance statistics for a site
 */
export async function getPlantBatchComplianceStats(siteId: string): Promise<PlantBatchComplianceStats> {
  const supabase = await createClient()

  const [
    { count: totalCached },
    { count: activeCached },
    { count: inactiveCached },
    { count: linkedToTrazo },
    { data: lastSync },
  ] = await Promise.all([
    supabase
      .from('metrc_plant_batches_cache')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId),
    supabase
      .from('metrc_plant_batches_cache')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_active', true),
    supabase
      .from('metrc_plant_batches_cache')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_active', false),
    supabase
      .from('metrc_plant_batches_cache')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .not('trazo_batch_id', 'is', null),
    supabase
      .from('metrc_plant_batches_cache')
      .select('last_synced_at')
      .eq('site_id', siteId)
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  return {
    totalCached: totalCached || 0,
    activeCached: activeCached || 0,
    inactiveCached: inactiveCached || 0,
    linkedToTrazo: linkedToTrazo || 0,
    unlinkedFromTrazo: (totalCached || 0) - (linkedToTrazo || 0),
    lastSyncedAt: lastSync?.last_synced_at || null,
  }
}

// =====================================================
// IMPORT FROM METRC CACHE TO INVENTORY
// =====================================================

export interface ImportFromMetrcResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
  importedItems: Array<{
    metrcName: string
    itemId: string
    lotId: string
    strainName: string
    quantity: number
  }>
}

/**
 * Import plant batches from Metrc cache into TRAZO inventory
 *
 * This creates inventory items and lots from cached Metrc plant batches.
 * Used for Closed Loop Environment where Metrc already has starting inventory.
 *
 * Plant batches (clones/seeds) become inventory lots that can then be used
 * to create growing batches via the "Create Batch from Inventory" workflow.
 *
 * @param organizationId - Organization UUID
 * @param siteId - Site UUID
 * @param userId - User UUID performing the import
 * @returns Import result with counts and created inventory info
 */
export async function importBatchesFromMetrcCache(
  organizationId: string,
  siteId: string,
  userId: string
): Promise<ImportFromMetrcResult> {
  const supabase = await createClient()

  const result: ImportFromMetrcResult = {
    success: false,
    imported: 0,
    skipped: 0,
    errors: [],
    importedItems: [],
  }

  try {
    // Get all unlinked active batches from cache
    const { data: cachedBatches, error: fetchError } = await supabase
      .from('metrc_plant_batches_cache')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('site_id', siteId)
      .eq('is_active', true)
      .is('trazo_batch_id', null)

    if (fetchError) {
      result.errors.push(`Failed to fetch cached batches: ${fetchError.message}`)
      return result
    }

    if (!cachedBatches || cachedBatches.length === 0) {
      result.success = true
      result.errors.push('No unlinked plant batches found in Metrc cache')
      return result
    }

    for (const cachedBatch of cachedBatches) {
      try {
        // Determine item type based on batch type
        const itemType = cachedBatch.type === 'Seed' ? 'seeds' : 'clones'
        const itemName = `${cachedBatch.strain_name} (${cachedBatch.type})`

        // Find or create inventory item for this strain/type
        let itemId: string

        const { data: existingItem } = await supabase
          .from('inventory_items')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('site_id', siteId)
          .eq('item_type', itemType)
          .ilike('name', itemName)
          .limit(1)
          .maybeSingle()

        if (existingItem) {
          itemId = existingItem.id
        } else {
          // Create new inventory item
          const { data: newItem, error: itemError } = await supabase
            .from('inventory_items')
            .insert({
              organization_id: organizationId,
              site_id: siteId,
              item_type: itemType,
              name: itemName,
              unit_of_measure: 'each',
              current_quantity: 0, // Will be updated by lot
              is_active: true,
              created_by: userId,
              notes: `Auto-created from Metrc import - ${cachedBatch.strain_name}`,
            })
            .select('id')
            .single()

          if (itemError) {
            result.errors.push(`Failed to create item for ${itemName}: ${itemError.message}`)
            result.skipped++
            continue
          }
          itemId = newItem.id
        }

        // Check if lot already exists (by compliance_package_uid)
        const { data: existingLot } = await supabase
          .from('inventory_lots')
          .select('id')
          .eq('item_id', itemId)
          .eq('compliance_package_uid', cachedBatch.name)
          .limit(1)
          .maybeSingle()

        if (existingLot) {
          result.errors.push(`Lot ${cachedBatch.name} already exists in inventory`)
          result.skipped++
          continue
        }

        // Create inventory lot
        const { data: newLot, error: lotError } = await supabase
          .from('inventory_lots')
          .insert({
            item_id: itemId,
            lot_code: cachedBatch.name,
            quantity_received: cachedBatch.count,
            quantity_remaining: cachedBatch.count,
            unit_of_measure: 'each',
            received_date: cachedBatch.planted_date || new Date().toISOString(),
            compliance_package_uid: cachedBatch.name,
            compliance_package_type: 'plant_batch',
            is_active: true,
            created_by: userId,
            notes: `Imported from Metrc plant batch. Strain: ${cachedBatch.strain_name}. Metrc ID: ${cachedBatch.metrc_batch_id}`,
          })
          .select('id')
          .single()

        if (lotError) {
          result.errors.push(`Failed to create lot for ${cachedBatch.name}: ${lotError.message}`)
          result.skipped++
          continue
        }

        // Update inventory item quantity by summing all active lots
        const { data: lotsSum } = await supabase
          .from('inventory_lots')
          .select('quantity_remaining')
          .eq('item_id', itemId)
          .eq('is_active', true)

        const totalQuantity = lotsSum?.reduce((sum, lot) => sum + Number(lot.quantity_remaining), 0) || 0

        await supabase
          .from('inventory_items')
          .update({
            current_quantity: totalQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId)

        // Create inventory movement record
        await supabase.from('inventory_movements').insert({
          item_id: itemId,
          lot_id: newLot.id,
          movement_type: 'receive',
          quantity: cachedBatch.count,
          to_location: 'Metrc Import',
          reason: 'Imported from Metrc Closed Loop Environment',
          notes: `Plant batch: ${cachedBatch.name}, Strain: ${cachedBatch.strain_name}`,
          performed_by: userId,
          metrc_sync_status: 'synced',
        })

        // Also create a cultivar if it doesn't exist (for future batch creation)
        const { data: existingCultivar } = await supabase
          .from('cultivars')
          .select('id')
          .eq('organization_id', organizationId)
          .ilike('name', cachedBatch.strain_name)
          .limit(1)
          .maybeSingle()

        if (!existingCultivar) {
          await supabase
            .from('cultivars')
            .insert({
              organization_id: organizationId,
              name: cachedBatch.strain_name,
              strain_type: 'hybrid',
              is_active: true,
              created_by: userId,
            })
        }

        // Mark the cache record as processed (link to lot instead of batch)
        // Using a note since trazo_batch_id is for batches not inventory
        await supabase
          .from('metrc_plant_batches_cache')
          .update({
            last_synced_at: new Date().toISOString(),
            // We can't set trazo_batch_id since this is inventory, not a batch
            // The lot's compliance_package_uid links back to this
          })
          .eq('id', cachedBatch.id)

        result.imported++
        result.importedItems.push({
          metrcName: cachedBatch.name,
          itemId: itemId,
          lotId: newLot.id,
          strainName: cachedBatch.strain_name,
          quantity: cachedBatch.count,
        })

      } catch (err) {
        result.errors.push(`Error processing ${cachedBatch.name}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        result.skipped++
      }
    }

    result.success = result.imported > 0 || result.skipped === cachedBatches.length

  } catch (err) {
    result.errors.push(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  return result
}
