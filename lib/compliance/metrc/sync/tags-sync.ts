/**
 * Tags Sync Service
 *
 * Manages synchronization of available tags from Metrc to local inventory.
 * Fetches available plant and package tags and caches them locally.
 */

import { createClient } from '@/lib/supabase/server'
import { MetrcClient } from '../client'
import type { MetrcTag } from '../endpoints/tags'

// =====================================================
// TYPES
// =====================================================

export interface SyncTagsResult {
  success: boolean
  synced: number
  created: number
  updated: number
  plantTagsSynced: number
  packageTagsSynced: number
  errors: string[]
  warnings: string[]
}

interface TagInventoryRecord {
  organization_id: string
  site_id: string
  tag_number: string
  tag_type: 'Plant' | 'Package'
  status: string
  metrc_tag_id: string | null
  last_synced_at: string
  sync_status: 'synced' | 'pending' | 'error'
  metadata: {
    commissioned_date?: string
    tag_type_name?: string
    tag_type_id?: number
    metrc_status?: string
  }
}

// =====================================================
// SYNC TAGS FROM METRC
// =====================================================

/**
 * Sync available tags from Metrc to local inventory
 * Fetches plant and package tags and upserts them to metrc_tag_inventory
 * Uses batch upserts for performance
 *
 * @param client - Metrc API client
 * @param organizationId - Organization ID
 * @param siteId - Site ID
 * @returns Sync result with counts and any errors
 */
export async function syncTagsFromMetrc(
  client: MetrcClient,
  organizationId: string,
  siteId: string
): Promise<SyncTagsResult> {
  const result: SyncTagsResult = {
    success: false,
    synced: 0,
    created: 0,
    updated: 0,
    plantTagsSynced: 0,
    packageTagsSynced: 0,
    errors: [],
    warnings: [],
  }

  const supabase = await createClient()

  try {
    // Fetch available tags from Metrc (plant and package tags in parallel)
    const { plantTags, packageTags } = await client.tags.listAllAvailableTags()

    result.plantTagsSynced = plantTags.length
    result.packageTagsSynced = packageTags.length
    result.synced = plantTags.length + packageTags.length

    if (result.synced === 0) {
      result.success = true
      result.warnings.push('No available tags found in Metrc')
      return result
    }

    // Get existing tags for this site
    const { data: existingTags } = await supabase
      .from('metrc_tag_inventory')
      .select('tag_number')
      .eq('site_id', siteId)

    const existingTagNumbers = new Set(existingTags?.map((t) => t.tag_number) || [])

    // Prepare batch records for plant tags
    const plantRecords = plantTags
      .filter((tag) => tag.Label)
      .map((tag) => createTagRecord(tag, 'Plant', organizationId, siteId))

    // Prepare batch records for package tags
    const packageRecords = packageTags
      .filter((tag) => tag.Label)
      .map((tag) => createTagRecord(tag, 'Package', organizationId, siteId))

    // Batch upsert plant tags (in chunks of 500)
    const BATCH_SIZE = 500
    for (let i = 0; i < plantRecords.length; i += BATCH_SIZE) {
      const batch = plantRecords.slice(i, i + BATCH_SIZE)
      const { error } = await supabase
        .from('metrc_tag_inventory')
        .upsert(batch, { onConflict: 'site_id,tag_number' })

      if (error) {
        result.errors.push(`Plant tags batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
      } else {
        // Count created vs updated
        for (const record of batch) {
          if (existingTagNumbers.has(record.tag_number)) {
            result.updated++
          } else {
            result.created++
          }
        }
      }
    }

    // Batch upsert package tags (in chunks of 500)
    for (let i = 0; i < packageRecords.length; i += BATCH_SIZE) {
      const batch = packageRecords.slice(i, i + BATCH_SIZE)
      const { error } = await supabase
        .from('metrc_tag_inventory')
        .upsert(batch, { onConflict: 'site_id,tag_number' })

      if (error) {
        result.errors.push(`Package tags batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
      } else {
        // Count created vs updated
        for (const record of batch) {
          if (existingTagNumbers.has(record.tag_number)) {
            result.updated++
          } else {
            result.created++
          }
        }
      }
    }

    result.success = result.errors.length === 0
  } catch (error) {
    result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

/**
 * Create a tag inventory record from Metrc tag data
 */
function createTagRecord(
  tag: MetrcTag,
  tagType: 'Plant' | 'Package',
  organizationId: string,
  siteId: string
): TagInventoryRecord {
  const status = mapMetrcStatusToLocalStatus(tag.Status)

  return {
    organization_id: organizationId,
    site_id: siteId,
    tag_number: tag.Label,
    tag_type: tagType,
    status,
    metrc_tag_id: tag.Label,
    last_synced_at: new Date().toISOString(),
    sync_status: 'synced',
    metadata: {
      commissioned_date: tag.CommissionedDateTime || undefined,
      tag_type_name: tag.TagTypeName || undefined,
      tag_type_id: tag.TagTypeId || undefined,
      metrc_status: tag.Status || undefined,
    },
  }
}

/**
 * Map Metrc tag status to local status
 * Metrc statuses: Commissioned, Used, etc.
 * Local statuses: available, assigned, used, destroyed, lost, returned
 */
function mapMetrcStatusToLocalStatus(metrcStatus: string | null | undefined): string {
  // Handle null/undefined status - default to available
  if (!metrcStatus) {
    return 'available'
  }

  const statusLower = metrcStatus.toLowerCase()

  if (statusLower === 'commissioned') {
    return 'available'
  }
  if (statusLower === 'used') {
    return 'used'
  }
  if (statusLower === 'voided' || statusLower === 'destroyed') {
    return 'destroyed'
  }
  if (statusLower === 'returned') {
    return 'returned'
  }

  // Default to available for unknown statuses
  return 'available'
}

// =====================================================
// SYNC ONLY PLANT TAGS
// =====================================================

/**
 * Sync only plant tags from Metrc
 * Uses batch upserts for performance
 */
export async function syncPlantTagsFromMetrc(
  client: MetrcClient,
  organizationId: string,
  siteId: string
): Promise<SyncTagsResult> {
  const result: SyncTagsResult = {
    success: false,
    synced: 0,
    created: 0,
    updated: 0,
    plantTagsSynced: 0,
    packageTagsSynced: 0,
    errors: [],
    warnings: [],
  }

  const supabase = await createClient()

  try {
    const plantTags = await client.tags.listAvailablePlantTags()
    result.plantTagsSynced = plantTags.length
    result.synced = plantTags.length

    if (result.synced === 0) {
      result.success = true
      result.warnings.push('No available plant tags found in Metrc')
      return result
    }

    const { data: existingTags } = await supabase
      .from('metrc_tag_inventory')
      .select('tag_number')
      .eq('site_id', siteId)
      .eq('tag_type', 'Plant')

    const existingTagNumbers = new Set(existingTags?.map((t) => t.tag_number) || [])

    // Prepare batch records
    const records = plantTags
      .filter((tag) => tag.Label)
      .map((tag) => createTagRecord(tag, 'Plant', organizationId, siteId))

    // Batch upsert (in chunks of 500)
    const BATCH_SIZE = 500
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const { error } = await supabase
        .from('metrc_tag_inventory')
        .upsert(batch, { onConflict: 'site_id,tag_number' })

      if (error) {
        result.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
      } else {
        for (const record of batch) {
          if (existingTagNumbers.has(record.tag_number)) {
            result.updated++
          } else {
            result.created++
          }
        }
      }
    }

    result.success = result.errors.length === 0
  } catch (error) {
    result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

// =====================================================
// SYNC ONLY PACKAGE TAGS
// =====================================================

/**
 * Sync only package tags from Metrc
 * Uses batch upserts for performance
 */
export async function syncPackageTagsFromMetrc(
  client: MetrcClient,
  organizationId: string,
  siteId: string
): Promise<SyncTagsResult> {
  const result: SyncTagsResult = {
    success: false,
    synced: 0,
    created: 0,
    updated: 0,
    plantTagsSynced: 0,
    packageTagsSynced: 0,
    errors: [],
    warnings: [],
  }

  const supabase = await createClient()

  try {
    const packageTags = await client.tags.listAvailablePackageTags()
    result.packageTagsSynced = packageTags.length
    result.synced = packageTags.length

    if (result.synced === 0) {
      result.success = true
      result.warnings.push('No available package tags found in Metrc')
      return result
    }

    const { data: existingTags } = await supabase
      .from('metrc_tag_inventory')
      .select('tag_number')
      .eq('site_id', siteId)
      .eq('tag_type', 'Package')

    const existingTagNumbers = new Set(existingTags?.map((t) => t.tag_number) || [])

    // Prepare batch records
    const records = packageTags
      .filter((tag) => tag.Label)
      .map((tag) => createTagRecord(tag, 'Package', organizationId, siteId))

    // Batch upsert (in chunks of 500)
    const BATCH_SIZE = 500
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const { error } = await supabase
        .from('metrc_tag_inventory')
        .upsert(batch, { onConflict: 'site_id,tag_number' })

      if (error) {
        result.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
      } else {
        for (const record of batch) {
          if (existingTagNumbers.has(record.tag_number)) {
            result.updated++
          } else {
            result.created++
          }
        }
      }
    }

    result.success = result.errors.length === 0
  } catch (error) {
    result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

// =====================================================
// GET TAG COUNTS
// =====================================================

/**
 * Get current tag inventory counts for a site
 */
export async function getTagInventoryCounts(siteId: string): Promise<{
  plantTags: { available: number; assigned: number; used: number; total: number }
  packageTags: { available: number; assigned: number; used: number; total: number }
}> {
  const supabase = await createClient()

  const { data: tags } = await supabase
    .from('metrc_tag_inventory')
    .select('tag_type, status')
    .eq('site_id', siteId)

  const result = {
    plantTags: { available: 0, assigned: 0, used: 0, total: 0 },
    packageTags: { available: 0, assigned: 0, used: 0, total: 0 },
  }

  if (!tags) return result

  for (const tag of tags) {
    const category = tag.tag_type === 'Plant' ? 'plantTags' : 'packageTags'
    result[category].total++

    if (tag.status === 'available') {
      result[category].available++
    } else if (tag.status === 'assigned') {
      result[category].assigned++
    } else if (tag.status === 'used') {
      result[category].used++
    }
  }

  return result
}
