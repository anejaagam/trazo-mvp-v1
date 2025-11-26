/**
 * Item Validation Rules Tests
 *
 * Tests for Metrc item (product) validation logic
 */

import {
  validateItemCreate,
  validateItemUpdate,
  validateItemAgainstCategory,
  getCategoriesRequiringStrain,
  validateProductItemMatch,
  validatePackageProduct,
  validateItemCreateBatch,
  validateHarvestPackageItem,
  suggestItemName,
  getDefaultUnitForCategory,
} from '../item-rules'
import type { MetrcItemCategory } from '../../types'

describe('Item Validation Rules', () => {
  describe('validateItemCreate', () => {
    it('should pass for valid item creation', () => {
      const item = {
        ItemCategory: 'Buds',
        Name: 'Blue Dream - Flower',
        UnitOfMeasure: 'Grams',
      }

      const result = validateItemCreate(item)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when ItemCategory is missing', () => {
      const item = {
        ItemCategory: '',
        Name: 'Blue Dream - Flower',
        UnitOfMeasure: 'Grams',
      }

      const result = validateItemCreate(item)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'ItemCategory')).toBe(true)
    })

    it('should fail when Name is missing', () => {
      const item = {
        ItemCategory: 'Buds',
        Name: '',
        UnitOfMeasure: 'Grams',
      }

      const result = validateItemCreate(item)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'Name')).toBe(true)
    })

    it('should fail when Name exceeds 150 characters', () => {
      const item = {
        ItemCategory: 'Buds',
        Name: 'A'.repeat(151),
        UnitOfMeasure: 'Grams',
      }

      const result = validateItemCreate(item)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'NAME_TOO_LONG')).toBe(true)
    })

    it('should warn on unrecognized category', () => {
      const item = {
        ItemCategory: 'CustomCategory',
        Name: 'Custom Product',
        UnitOfMeasure: 'Grams',
      }

      const result = validateItemCreate(item)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some((w) => w.code === 'UNRECOGNIZED_CATEGORY')).toBe(true)
    })

    it('should warn on unrecognized unit of measure', () => {
      const item = {
        ItemCategory: 'Buds',
        Name: 'Blue Dream - Flower',
        UnitOfMeasure: 'Liters',
      }

      const result = validateItemCreate(item)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some((w) => w.code === 'UNRECOGNIZED_UNIT')).toBe(true)
    })

    it('should pass with strain for strain-required categories', () => {
      const item = {
        ItemCategory: 'Buds',
        Name: 'Blue Dream - Flower',
        UnitOfMeasure: 'Grams',
        Strain: 'Blue Dream',
      }

      const result = validateItemCreate(item)

      expect(result.isValid).toBe(true)
    })
  })

  describe('validateItemUpdate', () => {
    it('should require Id for update', () => {
      const item = {
        Id: 0,
        ItemCategory: 'Buds',
        Name: 'Blue Dream - Flower',
        UnitOfMeasure: 'Grams',
      }

      const result = validateItemUpdate(item)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'Id')).toBe(true)
    })

    it('should pass with valid Id', () => {
      const item = {
        Id: 123,
        ItemCategory: 'Buds',
        Name: 'Blue Dream - Flower',
        UnitOfMeasure: 'Grams',
      }

      const result = validateItemUpdate(item)

      expect(result.isValid).toBe(true)
    })
  })

  describe('validateItemAgainstCategory', () => {
    const categories: MetrcItemCategory[] = [
      {
        Name: 'Buds',
        ProductCategoryType: 'Flowers',
        QuantityType: 'WeightBased',
        RequiresStrain: true,
        RequiresUnitCbdPercent: false,
        RequiresUnitThcPercent: false,
      },
      {
        Name: 'Infused (edible)',
        ProductCategoryType: 'Edibles',
        QuantityType: 'CountBased',
        RequiresStrain: false,
        RequiresUnitCbdPercent: false,
        RequiresUnitThcPercent: false,
      },
    ]

    it('should fail when strain required but not provided', () => {
      const item = {
        ItemCategory: 'Buds',
        Name: 'Flower',
        UnitOfMeasure: 'Grams',
      }

      const result = validateItemAgainstCategory(item, categories)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'STRAIN_REQUIRED')).toBe(true)
    })

    it('should pass when strain provided for strain-required category', () => {
      const item = {
        ItemCategory: 'Buds',
        Name: 'Blue Dream - Flower',
        UnitOfMeasure: 'Grams',
        Strain: 'Blue Dream',
      }

      const result = validateItemAgainstCategory(item, categories)

      expect(result.isValid).toBe(true)
    })

    it('should warn when strain provided for non-strain category', () => {
      const item = {
        ItemCategory: 'Infused (edible)',
        Name: 'Gummy Bear',
        UnitOfMeasure: 'Each',
        Strain: 'Blue Dream',
      }

      const result = validateItemAgainstCategory(item, categories)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some((w) => w.code === 'STRAIN_NOT_REQUIRED')).toBe(true)
    })

    it('should warn when category not found', () => {
      const item = {
        ItemCategory: 'UnknownCategory',
        Name: 'Unknown Product',
        UnitOfMeasure: 'Each',
      }

      const result = validateItemAgainstCategory(item, categories)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some((w) => w.code === 'CATEGORY_NOT_FOUND')).toBe(true)
    })
  })

  describe('getCategoriesRequiringStrain', () => {
    it('should return categories that require strain', () => {
      const categories: MetrcItemCategory[] = [
        { Name: 'Buds', ProductCategoryType: 'Flowers', QuantityType: 'WeightBased', RequiresStrain: true, RequiresUnitCbdPercent: false, RequiresUnitThcPercent: false },
        { Name: 'Edibles', ProductCategoryType: 'Edibles', QuantityType: 'CountBased', RequiresStrain: false, RequiresUnitCbdPercent: false, RequiresUnitThcPercent: false },
        { Name: 'Pre-Roll', ProductCategoryType: 'Pre-Rolls', QuantityType: 'CountBased', RequiresStrain: true, RequiresUnitCbdPercent: false, RequiresUnitThcPercent: false },
      ]

      const result = getCategoriesRequiringStrain(categories)

      expect(result).toEqual(['Buds', 'Pre-Roll'])
    })
  })

  describe('validateProductItemMatch', () => {
    const metrcItems = [
      { Name: 'Blue Dream - Flower', Id: 1, ProductCategoryName: 'Buds' },
      { Name: 'Purple Haze - Pre-Roll', Id: 2, ProductCategoryName: 'Pre-Roll' },
      { Name: 'OG Kush - Trim', Id: 3, ProductCategoryName: 'Shake/Trim' },
    ]

    it('should pass for exact match', () => {
      const result = validateProductItemMatch('Blue Dream - Flower', metrcItems)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should be case insensitive', () => {
      const result = validateProductItemMatch('blue dream - flower', metrcItems)

      expect(result.isValid).toBe(true)
    })

    it('should warn on close matches', () => {
      const result = validateProductItemMatch('Blue Dream', metrcItems)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some((w) => w.code === 'CLOSE_MATCH_FOUND')).toBe(true)
    })

    it('should fail when no match found', () => {
      const result = validateProductItemMatch('Sour Diesel - Flower', metrcItems)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'ITEM_NOT_FOUND')).toBe(true)
    })

    it('should fail for empty product name', () => {
      const result = validateProductItemMatch('', metrcItems)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'EMPTY_NAME')).toBe(true)
    })
  })

  describe('validatePackageProduct', () => {
    it('should pass for valid package product', () => {
      const packageData = {
        productName: 'Blue Dream - Flower',
        quantity: 100,
        unitOfMeasure: 'Grams',
      }

      const result = validatePackageProduct(packageData)

      expect(result.isValid).toBe(true)
    })

    it('should fail when product name is missing', () => {
      const packageData = {
        productName: '',
        quantity: 100,
        unitOfMeasure: 'Grams',
      }

      const result = validatePackageProduct(packageData)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'productName')).toBe(true)
    })

    it('should fail when quantity is zero or negative', () => {
      const packageData = {
        productName: 'Blue Dream - Flower',
        quantity: 0,
        unitOfMeasure: 'Grams',
      }

      const result = validatePackageProduct(packageData)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'INVALID_QUANTITY')).toBe(true)
    })

    it('should warn on unusually large quantity', () => {
      const packageData = {
        productName: 'Blue Dream - Flower',
        quantity: 15000,
        unitOfMeasure: 'Grams',
      }

      const result = validatePackageProduct(packageData)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some((w) => w.code === 'LARGE_QUANTITY')).toBe(true)
    })

    it('should fail for invalid unit of measure', () => {
      const packageData = {
        productName: 'Blue Dream - Flower',
        quantity: 100,
        unitOfMeasure: 'InvalidUnit',
      }

      const result = validatePackageProduct(packageData)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'INVALID_UNIT')).toBe(true)
    })

    it('should fail when product name exceeds 150 characters', () => {
      const packageData = {
        productName: 'A'.repeat(151),
        quantity: 100,
        unitOfMeasure: 'Grams',
      }

      const result = validatePackageProduct(packageData)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'NAME_TOO_LONG')).toBe(true)
    })
  })

  describe('validateItemCreateBatch', () => {
    it('should pass for valid batch of items', () => {
      const items = [
        { ItemCategory: 'Buds', Name: 'Blue Dream - Flower', UnitOfMeasure: 'Grams' },
        { ItemCategory: 'Pre-Roll', Name: 'Purple Haze - Pre-Roll', UnitOfMeasure: 'Each' },
      ]

      const result = validateItemCreateBatch(items)

      expect(result.isValid).toBe(true)
    })

    it('should fail for empty array', () => {
      const result = validateItemCreateBatch([])

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'EMPTY_ARRAY')).toBe(true)
    })

    it('should fail when batch exceeds 100 items', () => {
      const items = Array.from({ length: 101 }, (_, i) => ({
        ItemCategory: 'Buds',
        Name: `Item ${i}`,
        UnitOfMeasure: 'Grams',
      }))

      const result = validateItemCreateBatch(items)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'BATCH_SIZE_EXCEEDED')).toBe(true)
    })

    it('should fail for duplicate item names', () => {
      const items = [
        { ItemCategory: 'Buds', Name: 'Blue Dream - Flower', UnitOfMeasure: 'Grams' },
        { ItemCategory: 'Buds', Name: 'Blue Dream - Flower', UnitOfMeasure: 'Grams' },
      ]

      const result = validateItemCreateBatch(items)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'DUPLICATE_NAMES')).toBe(true)
    })

    it('should aggregate errors from individual items', () => {
      const items = [
        { ItemCategory: '', Name: 'Blue Dream - Flower', UnitOfMeasure: 'Grams' },
        { ItemCategory: 'Buds', Name: '', UnitOfMeasure: 'Grams' },
      ]

      const result = validateItemCreateBatch(items)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('validateHarvestPackageItem', () => {
    it('should pass for valid harvest package item', () => {
      const packageData = {
        tag: '1A4000000000000000012345',
        item: 'Blue Dream - Flower',
        quantity: 100,
        unitOfMeasure: 'Grams',
        location: 'Room A',
      }

      const result = validateHarvestPackageItem(packageData)

      expect(result.isValid).toBe(true)
    })

    it('should fail when tag is missing', () => {
      const packageData = {
        tag: '',
        item: 'Blue Dream - Flower',
        quantity: 100,
        unitOfMeasure: 'Grams',
        location: 'Room A',
      }

      const result = validateHarvestPackageItem(packageData)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'tag')).toBe(true)
    })

    it('should warn on short tag', () => {
      const packageData = {
        tag: 'SHORT123',
        item: 'Blue Dream - Flower',
        quantity: 100,
        unitOfMeasure: 'Grams',
        location: 'Room A',
      }

      const result = validateHarvestPackageItem(packageData)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some((w) => w.code === 'SHORT_TAG')).toBe(true)
    })

    it('should fail when quantity is zero', () => {
      const packageData = {
        tag: '1A4000000000000000012345',
        item: 'Blue Dream - Flower',
        quantity: 0,
        unitOfMeasure: 'Grams',
        location: 'Room A',
      }

      const result = validateHarvestPackageItem(packageData)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'INVALID_QUANTITY')).toBe(true)
    })
  })

  describe('suggestItemName', () => {
    it('should combine strain and product type', () => {
      const result = suggestItemName('Flower', 'Blue Dream')

      expect(result).toBe('Blue Dream - Flower')
    })

    it('should return just product type when no strain', () => {
      const result = suggestItemName('Edible')

      expect(result).toBe('Edible')
    })
  })

  describe('getDefaultUnitForCategory', () => {
    it('should return Grams for Buds category', () => {
      expect(getDefaultUnitForCategory('Buds')).toBe('Grams')
    })

    it('should return Each for Pre-Roll category', () => {
      expect(getDefaultUnitForCategory('Pre-Roll')).toBe('Each')
    })

    it('should return Milliliters for Tincture category', () => {
      expect(getDefaultUnitForCategory('Tincture')).toBe('Milliliters')
    })

    it('should return Each for unknown category', () => {
      expect(getDefaultUnitForCategory('UnknownCategory')).toBe('Each')
    })
  })
})
