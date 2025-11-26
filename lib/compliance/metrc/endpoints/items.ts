/**
 * Metrc Items Endpoint
 *
 * Manages product catalog (items) for Metrc compliance.
 * Items are referenced when creating packages and sales transactions.
 */

import type { MetrcClient } from '../client'
import type {
  MetrcItem,
  MetrcItemCreate,
  MetrcItemUpdate,
  MetrcItemCategory,
  MetrcBrand,
} from '../types'

export class ItemsEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get all active items for the facility
   *
   * @param lastModifiedStart - Optional filter for items modified after this date
   * @param lastModifiedEnd - Optional filter for items modified before this date
   * @returns Array of active items
   */
  async listActive(lastModifiedStart?: string, lastModifiedEnd?: string): Promise<MetrcItem[]> {
    let endpoint = '/items/v2/active'
    const params: string[] = []

    if (lastModifiedStart) {
      params.push(`lastModifiedStart=${encodeURIComponent(lastModifiedStart)}`)
    }
    if (lastModifiedEnd) {
      params.push(`lastModifiedEnd=${encodeURIComponent(lastModifiedEnd)}`)
    }

    if (params.length > 0) {
      endpoint += `?${params.join('&')}`
    }

    return this.client.request<MetrcItem[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get all inactive items for the facility
   *
   * @param lastModifiedStart - Optional filter for items modified after this date
   * @param lastModifiedEnd - Optional filter for items modified before this date
   * @returns Array of inactive items
   */
  async listInactive(lastModifiedStart?: string, lastModifiedEnd?: string): Promise<MetrcItem[]> {
    let endpoint = '/items/v2/inactive'
    const params: string[] = []

    if (lastModifiedStart) {
      params.push(`lastModifiedStart=${encodeURIComponent(lastModifiedStart)}`)
    }
    if (lastModifiedEnd) {
      params.push(`lastModifiedEnd=${encodeURIComponent(lastModifiedEnd)}`)
    }

    if (params.length > 0) {
      endpoint += `?${params.join('&')}`
    }

    return this.client.request<MetrcItem[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get a specific item by ID
   *
   * @param itemId - The Metrc item ID
   * @returns Item details
   */
  async getById(itemId: number): Promise<MetrcItem> {
    return this.client.request<MetrcItem>(`/items/v2/${itemId}`, {
      method: 'GET',
    })
  }

  /**
   * Get all item categories available in the facility's state
   *
   * Item categories define what kind of products can be created:
   * - Buds (flower)
   * - Concentrate
   * - Infused Edible
   * - etc.
   *
   * @returns Array of item categories
   */
  async listCategories(): Promise<MetrcItemCategory[]> {
    return this.client.request<MetrcItemCategory[]>('/items/v2/categories', {
      method: 'GET',
    })
  }

  /**
   * Get all brands available in the facility
   *
   * @returns Array of brands
   */
  async listBrands(): Promise<MetrcBrand[]> {
    return this.client.request<MetrcBrand[]>('/items/v2/brands', {
      method: 'GET',
    })
  }

  /**
   * Create a new item
   *
   * @param payload - Item creation data
   * @returns void (successful creation)
   */
  async create(payload: MetrcItemCreate): Promise<void> {
    return this.client.request<void>('/items/v2/', {
      method: 'POST',
      body: [payload], // Metrc expects an array
    })
  }

  /**
   * Create multiple items in a single request
   *
   * @param payloads - Array of item creation data
   * @returns void (successful creation)
   */
  async createBatch(payloads: MetrcItemCreate[]): Promise<void> {
    return this.client.request<void>('/items/v2/', {
      method: 'POST',
      body: payloads,
    })
  }

  /**
   * Update an existing item
   *
   * @param payload - Item update data
   * @returns void (successful update)
   */
  async update(payload: MetrcItemUpdate): Promise<void> {
    return this.client.request<void>('/items/v2/', {
      method: 'PUT',
      body: [payload], // Metrc expects an array
    })
  }

  /**
   * Update multiple items in a single request
   *
   * @param payloads - Array of item update data
   * @returns void (successful update)
   */
  async updateBatch(payloads: MetrcItemUpdate[]): Promise<void> {
    return this.client.request<void>('/items/v2/', {
      method: 'PUT',
      body: payloads,
    })
  }

  /**
   * Find an item by name (case-insensitive)
   * Utility method to check if an item already exists
   *
   * @param name - Item name to search for
   * @returns Item if found, null otherwise
   */
  async findByName(name: string): Promise<MetrcItem | null> {
    const items = await this.listActive()
    const normalizedName = name.trim().toLowerCase()
    const found = items.find(
      (item) => item.Name.trim().toLowerCase() === normalizedName
    )
    return found || null
  }

  /**
   * Find items by category
   * Utility method to get all items of a specific category type
   *
   * @param categoryName - Category name to filter by
   * @returns Array of items in the specified category
   */
  async findByCategory(categoryName: string): Promise<MetrcItem[]> {
    const items = await this.listActive()
    const normalizedCategory = categoryName.trim().toLowerCase()
    return items.filter(
      (item) => item.ProductCategoryName.trim().toLowerCase() === normalizedCategory
    )
  }

  /**
   * Get items that require strain information
   * Utility method to identify items that need strain association
   *
   * @returns Array of items that require strain
   */
  async getItemsRequiringStrain(): Promise<MetrcItem[]> {
    const items = await this.listActive()
    const categories = await this.listCategories()

    // Build a set of category names that require strain
    const categoriesRequiringStrain = new Set(
      categories.filter((c) => c.RequiresStrain).map((c) => c.Name)
    )

    return items.filter((item) =>
      categoriesRequiringStrain.has(item.ProductCategoryName)
    )
  }

  /**
   * Ensure a default set of items exists in Metrc
   * Creates items if they don't already exist
   *
   * @param items - Array of items to ensure exist
   * @returns Object with created, existing, and failed items
   */
  async ensureItemsExist(items: MetrcItemCreate[]): Promise<{
    created: string[]
    existing: string[]
    failed: { name: string; error: string }[]
  }> {
    const result = {
      created: [] as string[],
      existing: [] as string[],
      failed: [] as { name: string; error: string }[],
    }

    // Get all existing items
    const existingItems = await this.listActive()
    const existingNames = new Set(
      existingItems.map((i) => i.Name.trim().toLowerCase())
    )

    for (const item of items) {
      const normalizedName = item.Name.trim().toLowerCase()

      if (existingNames.has(normalizedName)) {
        result.existing.push(item.Name)
        continue
      }

      try {
        await this.create(item)
        result.created.push(item.Name)
        existingNames.add(normalizedName)
      } catch (error) {
        result.failed.push({
          name: item.Name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return result
  }
}
