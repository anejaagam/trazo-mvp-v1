/**
 * Items Sync Service
 *
 * Manages synchronization between TRAZO products and Metrc items.
 * Provides functions to sync items from Metrc to local cache and
 * validate products against approved Metrc items.
 */

import { createClient } from '@/lib/supabase/server'
import { MetrcClient } from '../client'
import type { MetrcItem, MetrcItemCreate, MetrcItemCategory, MetrcBrand } from '../types'

// =====================================================
// TYPES
// =====================================================

export interface SyncItemsResult {
  success: boolean
  synced: number
  created: number
  updated: number
  errors: string[]
  warnings: string[]
}

export interface ValidateItemResult {
  isValid: boolean
  metrcItemId: number | null
  metrcItemName: string | null
  category: string | null
  error: string | null
}

export interface ItemSyncResult {
  itemName: string
  success: boolean
  metrcItemId: number | null
  action: 'matched' | 'created' | 'failed'
  error: string | null
}

interface CachedItem {
  id: string
  organization_id: string
  site_id: string
  metrc_item_id: number
  name: string
  product_category_name: string | null
  product_category_type: string | null
  quantity_type: string | null
  default_lab_testing_state: string | null
  unit_of_measure: string | null
  approval_status: string | null
  requires_strain: boolean
  strain_id: number | null
  strain_name: string | null
  last_synced_at: string
}

// =====================================================
// SYNC ITEMS FROM METRC
// =====================================================

/**
 * Sync items from Metrc to local cache
 * Fetches all active and inactive items and updates local cache
 */
export async function syncItemsFromMetrc(
  client: MetrcClient,
  organizationId: string,
  siteId: string
): Promise<SyncItemsResult> {
  const result: SyncItemsResult = {
    success: false,
    synced: 0,
    created: 0,
    updated: 0,
    errors: [],
    warnings: [],
  }

  const supabase = await createClient()

  try {
    // Fetch items and categories from Metrc
    const [activeItems, inactiveItems, categories] = await Promise.all([
      client.items.listActive(),
      client.items.listInactive(),
      client.items.listCategories(),
    ])

    const allItems = [...activeItems, ...inactiveItems]
    result.synced = allItems.length

    // Build category lookup for requires_strain
    const categoryRequiresStrain = new Map<string, boolean>(
      categories.map((c) => [c.Name, c.RequiresStrain])
    )

    // Get existing cached items
    const { data: existingCache } = await supabase
      .from('metrc_items_cache')
      .select('metrc_item_id')
      .eq('site_id', siteId)

    const existingIds = new Set(existingCache?.map((c) => c.metrc_item_id) || [])

    // Upsert items to cache
    for (const item of allItems) {
      const cacheData = {
        organization_id: organizationId,
        site_id: siteId,
        metrc_item_id: item.Id,
        name: item.Name,
        product_category_name: item.ProductCategoryName,
        product_category_type: item.ProductCategoryType,
        quantity_type: item.QuantityType,
        default_lab_testing_state: item.DefaultLabTestingState,
        unit_of_measure: item.UnitOfMeasureName,
        approval_status: item.ApprovalStatus,
        requires_strain: categoryRequiresStrain.get(item.ProductCategoryName) || false,
        strain_id: item.StrainId || null,
        strain_name: item.StrainName || null,
        last_synced_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('metrc_items_cache')
        .upsert(cacheData, {
          onConflict: 'site_id,metrc_item_id',
        })

      if (error) {
        result.errors.push(`Failed to cache item ${item.Name}: ${error.message}`)
      } else if (existingIds.has(item.Id)) {
        result.updated++
      } else {
        result.created++
      }
    }

    result.success = result.errors.length === 0
  } catch (error) {
    result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

// =====================================================
// VALIDATE ITEM AGAINST METRC
// =====================================================

/**
 * Validate an item name against Metrc approved items
 * Returns the matching Metrc item ID if found
 */
export async function validateItemAgainstMetrc(
  client: MetrcClient,
  itemName: string,
  siteId: string
): Promise<ValidateItemResult> {
  const supabase = await createClient()

  // First check local cache
  const { data: cachedItem } = await supabase
    .from('metrc_items_cache')
    .select('metrc_item_id, name, product_category_name')
    .eq('site_id', siteId)
    .ilike('name', itemName)
    .single()

  if (cachedItem) {
    return {
      isValid: true,
      metrcItemId: cachedItem.metrc_item_id,
      metrcItemName: cachedItem.name,
      category: cachedItem.product_category_name,
      error: null,
    }
  }

  // If not in cache, check Metrc directly
  try {
    const item = await client.items.findByName(itemName)
    if (item) {
      return {
        isValid: true,
        metrcItemId: item.Id,
        metrcItemName: item.Name,
        category: item.ProductCategoryName,
        error: null,
      }
    }
  } catch (error) {
    return {
      isValid: false,
      metrcItemId: null,
      metrcItemName: null,
      category: null,
      error: `Metrc lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }

  return {
    isValid: false,
    metrcItemId: null,
    metrcItemName: null,
    category: null,
    error: `Item "${itemName}" not found in Metrc approved items`,
  }
}

// =====================================================
// SYNC ITEMS TO METRC
// =====================================================

/**
 * Create or find an item in Metrc
 */
export async function ensureItemExistsInMetrc(
  client: MetrcClient,
  organizationId: string,
  siteId: string,
  item: MetrcItemCreate
): Promise<ItemSyncResult> {
  const supabase = await createClient()

  const result: ItemSyncResult = {
    itemName: item.Name,
    success: false,
    metrcItemId: null,
    action: 'failed',
    error: null,
  }

  try {
    // First try to find existing item
    const existingItem = await client.items.findByName(item.Name)

    if (existingItem) {
      result.success = true
      result.metrcItemId = existingItem.Id
      result.action = 'matched'

      // Update cache
      await supabase.from('metrc_items_cache').upsert({
        organization_id: organizationId,
        site_id: siteId,
        metrc_item_id: existingItem.Id,
        name: existingItem.Name,
        product_category_name: existingItem.ProductCategoryName,
        product_category_type: existingItem.ProductCategoryType,
        quantity_type: existingItem.QuantityType,
        default_lab_testing_state: existingItem.DefaultLabTestingState,
        unit_of_measure: existingItem.UnitOfMeasureName,
        approval_status: existingItem.ApprovalStatus,
        strain_id: existingItem.StrainId || null,
        strain_name: existingItem.StrainName || null,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'site_id,metrc_item_id',
      })

      return result
    }

    // Create new item in Metrc
    await client.items.create(item)

    // Fetch the created item to get its ID
    const createdItem = await client.items.findByName(item.Name)

    if (createdItem) {
      result.success = true
      result.metrcItemId = createdItem.Id
      result.action = 'created'

      // Add to cache
      await supabase.from('metrc_items_cache').upsert({
        organization_id: organizationId,
        site_id: siteId,
        metrc_item_id: createdItem.Id,
        name: createdItem.Name,
        product_category_name: createdItem.ProductCategoryName,
        product_category_type: createdItem.ProductCategoryType,
        quantity_type: createdItem.QuantityType,
        default_lab_testing_state: createdItem.DefaultLabTestingState,
        unit_of_measure: createdItem.UnitOfMeasureName,
        approval_status: createdItem.ApprovalStatus,
        strain_id: createdItem.StrainId || null,
        strain_name: createdItem.StrainName || null,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'site_id,metrc_item_id',
      })
    } else {
      result.error = 'Item created but could not be retrieved'
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error'
  }

  return result
}

/**
 * Ensure multiple items exist in Metrc
 */
export async function ensureItemsExistInMetrc(
  client: MetrcClient,
  organizationId: string,
  siteId: string,
  items: MetrcItemCreate[]
): Promise<ItemSyncResult[]> {
  const results: ItemSyncResult[] = []

  for (const item of items) {
    const result = await ensureItemExistsInMetrc(client, organizationId, siteId, item)
    results.push(result)
  }

  return results
}

// =====================================================
// GET CACHED ITEMS
// =====================================================

/**
 * Get all cached items for a site
 */
export async function getCachedItems(siteId: string): Promise<CachedItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metrc_items_cache')
    .select('*')
    .eq('site_id', siteId)
    .order('name')

  if (error) {
    console.error('Error fetching cached items:', error)
    return []
  }

  return data || []
}

/**
 * Get a cached item by name
 */
export async function getCachedItemByName(
  siteId: string,
  name: string
): Promise<CachedItem | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metrc_items_cache')
    .select('*')
    .eq('site_id', siteId)
    .ilike('name', name)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Get cached items by category
 */
export async function getCachedItemsByCategory(
  siteId: string,
  categoryName: string
): Promise<CachedItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metrc_items_cache')
    .select('*')
    .eq('site_id', siteId)
    .ilike('product_category_name', categoryName)
    .order('name')

  if (error) {
    console.error('Error fetching cached items by category:', error)
    return []
  }

  return data || []
}

// =====================================================
// GET ITEM CATEGORIES
// =====================================================

/**
 * Get all item categories from Metrc
 */
export async function getItemCategories(client: MetrcClient): Promise<MetrcItemCategory[]> {
  try {
    return await client.items.listCategories()
  } catch (error) {
    console.error('Error fetching item categories:', error)
    return []
  }
}

/**
 * Get all brands from Metrc
 */
export async function getBrands(client: MetrcClient): Promise<MetrcBrand[]> {
  try {
    return await client.items.listBrands()
  } catch (error) {
    console.error('Error fetching brands:', error)
    return []
  }
}

// =====================================================
// DEFAULT ITEMS FOR CANNABIS FACILITIES
// =====================================================

/**
 * Get default items that should exist for a cannabis facility
 * These are common product types used in most operations
 */
export function getDefaultCannabisItems(strainName?: string): MetrcItemCreate[] {
  const items: MetrcItemCreate[] = [
    {
      ItemCategory: 'Buds',
      Name: strainName ? `${strainName} - Flower` : 'Flower',
      UnitOfMeasure: 'Grams',
      Strain: strainName,
    },
    {
      ItemCategory: 'Buds',
      Name: strainName ? `${strainName} - Trim` : 'Trim',
      UnitOfMeasure: 'Grams',
      Strain: strainName,
    },
    {
      ItemCategory: 'Shake/Trim',
      Name: strainName ? `${strainName} - Shake` : 'Shake',
      UnitOfMeasure: 'Grams',
      Strain: strainName,
    },
    {
      ItemCategory: 'Concentrate',
      Name: strainName ? `${strainName} - Extract` : 'Cannabis Extract',
      UnitOfMeasure: 'Grams',
      Strain: strainName,
    },
    {
      ItemCategory: 'Infused (edible)',
      Name: 'Infused Edible',
      UnitOfMeasure: 'Each',
    },
    {
      ItemCategory: 'Pre-Roll',
      Name: strainName ? `${strainName} - Pre-Roll` : 'Pre-Roll',
      UnitOfMeasure: 'Each',
      Strain: strainName,
    },
  ]

  return items
}

/**
 * Ensure default cannabis items exist in Metrc
 */
export async function ensureDefaultItemsExist(
  client: MetrcClient,
  organizationId: string,
  siteId: string,
  strainName?: string
): Promise<ItemSyncResult[]> {
  const defaultItems = getDefaultCannabisItems(strainName)
  return ensureItemsExistInMetrc(client, organizationId, siteId, defaultItems)
}
