/**
 * Item Validation Rules
 *
 * Validation logic for Metrc item (product) operations.
 * Ensures products are properly configured before package creation.
 */

import type { ValidationResult } from '@/lib/compliance/types'
import type { MetrcItemCreate, MetrcItemUpdate, MetrcItemCategory } from '../types'
import {
  createValidationResult,
  validateRequired,
  addError,
  addWarning,
} from './validators'

// =====================================================
// ITEM CREATE VALIDATION
// =====================================================

/**
 * Validate item creation payload
 */
export function validateItemCreate(item: MetrcItemCreate): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'ItemCategory', item.ItemCategory)
  validateRequired(result, 'Name', item.Name)
  validateRequired(result, 'UnitOfMeasure', item.UnitOfMeasure)

  // Name validation
  if (item.Name) {
    if (item.Name.length < 1) {
      addError(result, 'Name', 'Item name cannot be empty', 'EMPTY_NAME')
    }
    if (item.Name.length > 150) {
      addError(
        result,
        'Name',
        'Item name must not exceed 150 characters',
        'NAME_TOO_LONG'
      )
    }
  }

  // Category validation
  const validCategories = [
    'Buds',
    'Shake/Trim',
    'Concentrate',
    'Infused (edible)',
    'Infused (non-edible)',
    'Pre-Roll',
    'Capsule',
    'Tincture',
    'Topical',
    'Transdermal',
    'Suppository',
    'Seeds',
    'Immature Plants',
    'Clone',
    'Plant',
    'Other',
  ]

  if (item.ItemCategory && !validCategories.includes(item.ItemCategory)) {
    addWarning(
      result,
      'ItemCategory',
      `Category "${item.ItemCategory}" may not be recognized. Common categories: ${validCategories.slice(0, 5).join(', ')}...`,
      'UNRECOGNIZED_CATEGORY'
    )
  }

  // Unit of measure validation
  const validUnits = [
    'Grams',
    'Ounces',
    'Pounds',
    'Kilograms',
    'Each',
    'Milligrams',
    'Milliliters',
  ]

  if (item.UnitOfMeasure && !validUnits.includes(item.UnitOfMeasure)) {
    addWarning(
      result,
      'UnitOfMeasure',
      `Unit "${item.UnitOfMeasure}" may not be recognized. Valid units: ${validUnits.join(', ')}`,
      'UNRECOGNIZED_UNIT'
    )
  }

  return result
}

/**
 * Validate item update payload
 */
export function validateItemUpdate(item: MetrcItemUpdate): ValidationResult {
  const result = validateItemCreate(item)

  // Additional validation for update
  validateRequired(result, 'Id', item.Id)

  if (item.Id !== undefined && item.Id <= 0) {
    addError(result, 'Id', 'Item ID must be a positive number', 'INVALID_ID')
  }

  return result
}

// =====================================================
// CATEGORY-BASED VALIDATION
// =====================================================

/**
 * Validate item against its category requirements
 */
export function validateItemAgainstCategory(
  item: MetrcItemCreate,
  categories: MetrcItemCategory[]
): ValidationResult {
  const result = createValidationResult()

  const category = categories.find((c) => c.Name === item.ItemCategory)

  if (!category) {
    addWarning(
      result,
      'ItemCategory',
      `Category "${item.ItemCategory}" not found in available categories`,
      'CATEGORY_NOT_FOUND'
    )
    return result
  }

  // Check if strain is required
  if (category.RequiresStrain && !item.Strain) {
    addError(
      result,
      'Strain',
      `Category "${item.ItemCategory}" requires a strain to be specified`,
      'STRAIN_REQUIRED'
    )
  }

  // Warn if strain provided for category that doesn't require it
  if (!category.RequiresStrain && item.Strain) {
    addWarning(
      result,
      'Strain',
      `Category "${item.ItemCategory}" does not require a strain. Strain "${item.Strain}" will be ignored.`,
      'STRAIN_NOT_REQUIRED'
    )
  }

  return result
}

/**
 * Get categories that require strain
 */
export function getCategoriesRequiringStrain(categories: MetrcItemCategory[]): string[] {
  return categories.filter((c) => c.RequiresStrain).map((c) => c.Name)
}

// =====================================================
// PACKAGE-ITEM VALIDATION
// =====================================================

/**
 * Validate that a product name has a matching Metrc item
 */
export function validateProductItemMatch(
  productName: string,
  metrcItems: Array<{ Name: string; Id: number; ProductCategoryName: string }>
): ValidationResult {
  const result = createValidationResult()

  if (!productName || productName.trim().length === 0) {
    addError(result, 'productName', 'Product name is required', 'EMPTY_NAME')
    return result
  }

  const normalizedName = productName.trim().toLowerCase()

  // Look for exact match
  const exactMatch = metrcItems.find(
    (i) => i.Name.trim().toLowerCase() === normalizedName
  )

  if (exactMatch) {
    return result // Valid - exact match found
  }

  // Look for close matches
  const closeMatches = metrcItems.filter((i) => {
    const itemName = i.Name.trim().toLowerCase()
    return (
      itemName.includes(normalizedName) ||
      normalizedName.includes(itemName)
    )
  })

  if (closeMatches.length > 0) {
    addWarning(
      result,
      'productName',
      `No exact match for "${productName}". Similar items found: ${closeMatches.slice(0, 3).map((i) => i.Name).join(', ')}`,
      'CLOSE_MATCH_FOUND'
    )
  } else {
    addError(
      result,
      'productName',
      `Item "${productName}" not found in Metrc. Create it first or use an existing item name.`,
      'ITEM_NOT_FOUND'
    )
  }

  return result
}

/**
 * Validate package product before creating in Metrc
 */
export function validatePackageProduct(packageData: {
  productName: string
  quantity: number
  unitOfMeasure: string
  strain?: string
}): ValidationResult {
  const result = createValidationResult()

  // Product name validation
  validateRequired(result, 'productName', packageData.productName)

  if (packageData.productName) {
    if (packageData.productName.length > 150) {
      addError(
        result,
        'productName',
        'Product name must not exceed 150 characters',
        'NAME_TOO_LONG'
      )
    }
  }

  // Quantity validation
  validateRequired(result, 'quantity', packageData.quantity)

  if (packageData.quantity !== undefined) {
    if (packageData.quantity <= 0) {
      addError(result, 'quantity', 'Quantity must be greater than 0', 'INVALID_QUANTITY')
    }

    // Warn on unusually large quantities
    if (packageData.quantity > 10000) {
      addWarning(
        result,
        'quantity',
        `Quantity ${packageData.quantity} is unusually large. Please verify.`,
        'LARGE_QUANTITY'
      )
    }
  }

  // Unit of measure validation
  validateRequired(result, 'unitOfMeasure', packageData.unitOfMeasure)

  const validUnits = [
    'Grams',
    'Ounces',
    'Pounds',
    'Kilograms',
    'Each',
    'Milligrams',
    'Milliliters',
  ]

  if (packageData.unitOfMeasure && !validUnits.includes(packageData.unitOfMeasure)) {
    addError(
      result,
      'unitOfMeasure',
      `Invalid unit of measure. Must be one of: ${validUnits.join(', ')}`,
      'INVALID_UNIT'
    )
  }

  return result
}

// =====================================================
// BATCH VALIDATION
// =====================================================

/**
 * Validate batch of item create operations
 */
export function validateItemCreateBatch(items: MetrcItemCreate[]): ValidationResult {
  const result = createValidationResult()

  if (!items || items.length === 0) {
    addError(result, 'items', 'At least one item is required', 'EMPTY_ARRAY')
    return result
  }

  if (items.length > 100) {
    addError(
      result,
      'items',
      'Batch creation is limited to 100 items per request',
      'BATCH_SIZE_EXCEEDED'
    )
  }

  // Validate each item
  items.forEach((item, index) => {
    const itemResult = validateItemCreate(item)
    if (!itemResult.isValid) {
      result.isValid = false
      itemResult.errors.forEach((error) => {
        result.errors.push({
          ...error,
          field: `items[${index}].${error.field}`,
        })
      })
    }
    itemResult.warnings.forEach((warning) => {
      result.warnings.push({
        ...warning,
        field: `items[${index}].${warning.field}`,
      })
    })
  })

  // Check for duplicate names
  const names = items.map((i) => i.Name.trim().toLowerCase())
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
  if (duplicates.length > 0) {
    addError(
      result,
      'items',
      `Duplicate item names found: ${[...new Set(duplicates)].join(', ')}`,
      'DUPLICATE_NAMES'
    )
  }

  return result
}

// =====================================================
// HARVEST PACKAGE ITEM VALIDATION
// =====================================================

/**
 * Validate harvest package item configuration
 */
export function validateHarvestPackageItem(packageData: {
  tag: string
  item: string
  quantity: number
  unitOfMeasure: string
  location: string
}): ValidationResult {
  const result = createValidationResult()

  // Tag validation
  validateRequired(result, 'tag', packageData.tag)

  if (packageData.tag) {
    // Metrc tags are typically 24 characters
    if (packageData.tag.length < 20) {
      addWarning(
        result,
        'tag',
        'Package tag appears shorter than expected. Metrc tags are typically 24 characters.',
        'SHORT_TAG'
      )
    }
  }

  // Item validation
  validateRequired(result, 'item', packageData.item)

  // Quantity validation
  validateRequired(result, 'quantity', packageData.quantity)
  if (packageData.quantity !== undefined && packageData.quantity <= 0) {
    addError(result, 'quantity', 'Quantity must be greater than 0', 'INVALID_QUANTITY')
  }

  // Unit validation
  validateRequired(result, 'unitOfMeasure', packageData.unitOfMeasure)

  // Location validation
  validateRequired(result, 'location', packageData.location)

  return result
}

/**
 * Suggest item name based on product type and strain
 */
export function suggestItemName(productType: string, strainName?: string): string {
  if (strainName) {
    return `${strainName} - ${productType}`
  }
  return productType
}

/**
 * Get default unit of measure for a category
 */
export function getDefaultUnitForCategory(categoryName: string): string {
  const categoryDefaults: Record<string, string> = {
    'Buds': 'Grams',
    'Shake/Trim': 'Grams',
    'Concentrate': 'Grams',
    'Pre-Roll': 'Each',
    'Infused (edible)': 'Each',
    'Infused (non-edible)': 'Each',
    'Capsule': 'Each',
    'Tincture': 'Milliliters',
    'Topical': 'Grams',
    'Seeds': 'Each',
    'Immature Plants': 'Each',
    'Clone': 'Each',
    'Plant': 'Each',
  }

  return categoryDefaults[categoryName] || 'Each'
}
