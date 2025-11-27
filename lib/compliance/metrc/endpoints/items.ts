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
  MetrcPaginatedResponse,
} from '../types'

/**
 * Extract items array from API response
 * Handles both paginated (v2) and array (v1) responses
 */
function extractItemsFromResponse<T>(response: unknown): T[] {
  // Handle null/undefined
  if (!response) {
    return []
  }

  // Handle direct array response
  if (Array.isArray(response)) {
    return response as T[]
  }

  // Handle paginated response with Data array
  if (typeof response === 'object' && 'Data' in (response as object)) {
    const paginated = response as MetrcPaginatedResponse<T>
    return paginated.Data || []
  }

  // Unknown format - return empty
  console.warn('Unknown items API response format:', typeof response)
  return []
}

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
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/items/v2/active?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${encodeURIComponent(lastModifiedStart)}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${encodeURIComponent(lastModifiedEnd)}`
    }

    const response = await this.client.request<MetrcPaginatedResponse<MetrcItem> | MetrcItem[]>(endpoint, {
      method: 'GET',
    })
    return extractItemsFromResponse<MetrcItem>(response)
  }

  /**
   * Get all inactive items for the facility
   * Note: Some Metrc implementations may not support this endpoint
   *
   * @param lastModifiedStart - Optional filter for items modified after this date
   * @param lastModifiedEnd - Optional filter for items modified before this date
   * @returns Array of inactive items (empty array if endpoint not supported)
   */
  async listInactive(lastModifiedStart?: string, lastModifiedEnd?: string): Promise<MetrcItem[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/items/v2/inactive?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${encodeURIComponent(lastModifiedStart)}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${encodeURIComponent(lastModifiedEnd)}`
    }

    try {
      const response = await this.client.request<MetrcPaginatedResponse<MetrcItem> | MetrcItem[]>(endpoint, {
        method: 'GET',
      })
      return extractItemsFromResponse<MetrcItem>(response)
    } catch (error) {
      // Some Metrc implementations don't have an inactive items endpoint
      // Return empty array instead of failing
      if ((error as { statusCode?: number })?.statusCode === 404) {
        return []
      }
      throw error
    }
  }

  /**
   * Get a specific item by ID
   *
   * @param itemId - The Metrc item ID
   * @returns Item details
   */
  async getById(itemId: number): Promise<MetrcItem> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcItem>(`/items/v2/${itemId}?licenseNumber=${facilityLicenseNumber}`, {
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
    const { facilityLicenseNumber } = this.client.getConfig()
    const response = await this.client.request<MetrcPaginatedResponse<MetrcItemCategory> | MetrcItemCategory[]>(
      `/items/v2/categories?licenseNumber=${facilityLicenseNumber}`,
      { method: 'GET' }
    )
    return extractItemsFromResponse<MetrcItemCategory>(response)
  }

  /**
   * Get all brands available in the facility
   *
   * @returns Array of brands
   */
  async listBrands(): Promise<MetrcBrand[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    const response = await this.client.request<MetrcPaginatedResponse<MetrcBrand> | MetrcBrand[]>(
      `/items/v2/brands?licenseNumber=${facilityLicenseNumber}`,
      { method: 'GET' }
    )
    return extractItemsFromResponse<MetrcBrand>(response)
  }

  /**
   * Create a new item
   *
   * @param payload - Item creation data
   * @returns void (successful creation)
   */
  async create(payload: MetrcItemCreate): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<void>(`/items/v2/?licenseNumber=${facilityLicenseNumber}`, {
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
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<void>(`/items/v2/?licenseNumber=${facilityLicenseNumber}`, {
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
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<void>(`/items/v2/?licenseNumber=${facilityLicenseNumber}`, {
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
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<void>(`/items/v2/?licenseNumber=${facilityLicenseNumber}`, {
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
