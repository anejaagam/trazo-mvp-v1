/**
 * Package Validation Rules Tests
 *
 * Tests for Metrc package validation logic
 */

import {
  validatePackageCreate,
  validatePackageAdjustment,
  validatePackageLocationChange,
  validatePackageFinish,
  validatePackageCreateBatch,
} from '../validation/package-rules'
import type {
  MetrcPackageCreate,
  MetrcPackageAdjustment,
  MetrcPackageLocationChange,
  MetrcPackageFinish,
} from '../types'

describe('Package Validation Rules', () => {
  describe('validatePackageCreate', () => {
    const validPackage: MetrcPackageCreate = {
      Tag: '1A4FF0100000022000000123',
      Item: 'Blue Dream - Flower',
      Quantity: 100.5,
      UnitOfMeasure: 'Grams',
      PackagedDate: '2024-11-01',
    }

    it('should pass for valid package', () => {
      const result = validatePackageCreate(validPackage)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when Tag is missing', () => {
      const pkg = { ...validPackage, Tag: undefined as any }
      const result = validatePackageCreate(pkg)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Tag')).toBe(true)
    })

    it('should fail when Tag format is invalid', () => {
      const pkg = { ...validPackage, Tag: 'INVALID-TAG' }
      const result = validatePackageCreate(pkg)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_TAG_FORMAT')).toBe(true)
    })

    it('should fail when Item is missing', () => {
      const pkg = { ...validPackage, Item: undefined as any }
      const result = validatePackageCreate(pkg)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Item')).toBe(true)
    })

    it('should fail when Quantity is missing', () => {
      const pkg = { ...validPackage, Quantity: undefined as any }
      const result = validatePackageCreate(pkg)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Quantity')).toBe(true)
    })

    it('should fail when Quantity is not positive', () => {
      const pkg = { ...validPackage, Quantity: 0 }
      const result = validatePackageCreate(pkg)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Quantity')).toBe(true)
    })

    it('should fail when UnitOfMeasure is missing', () => {
      const pkg = { ...validPackage, UnitOfMeasure: undefined as any }
      const result = validatePackageCreate(pkg)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'UnitOfMeasure')).toBe(true)
    })

    it('should warn for unknown UnitOfMeasure', () => {
      const pkg = { ...validPackage, UnitOfMeasure: 'Barrels' }
      const result = validatePackageCreate(pkg)
      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.code === 'UNKNOWN_UNIT')).toBe(true)
    })

    it('should fail when PackagedDate is missing', () => {
      const pkg = { ...validPackage, PackagedDate: undefined as any }
      const result = validatePackageCreate(pkg)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'PackagedDate')).toBe(true)
    })

    it('should fail when PackagedDate is in the future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const pkg = { ...validPackage, PackagedDate: futureDate.toISOString().split('T')[0] }
      const result = validatePackageCreate(pkg)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'DATE_IN_FUTURE')).toBe(true)
    })

    it('should fail when PackagedDate format is invalid', () => {
      const pkg = { ...validPackage, PackagedDate: '11/01/2024' }
      const result = validatePackageCreate(pkg)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_DATE_FORMAT')).toBe(true)
    })

    it('should validate ingredients when provided', () => {
      const pkg: MetrcPackageCreate = {
        ...validPackage,
        Ingredients: [
          {
            Package: '1A4FF0100000022000000111',
            Quantity: 50,
            UnitOfMeasure: 'Grams',
          },
        ],
      }
      const result = validatePackageCreate(pkg)
      expect(result.isValid).toBe(true)
    })

    it('should fail when ingredient Package is missing', () => {
      const pkg: MetrcPackageCreate = {
        ...validPackage,
        Ingredients: [
          {
            Package: undefined as any,
            Quantity: 50,
            UnitOfMeasure: 'Grams',
          },
        ],
      }
      const result = validatePackageCreate(pkg)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field.includes('Ingredients[0].Package'))).toBe(true)
    })

    it('should fail when ingredient Quantity is invalid', () => {
      const pkg: MetrcPackageCreate = {
        ...validPackage,
        Ingredients: [
          {
            Package: '1A4FF0100000022000000111',
            Quantity: -10,
            UnitOfMeasure: 'Grams',
          },
        ],
      }
      const result = validatePackageCreate(pkg)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field.includes('Ingredients[0].Quantity'))).toBe(true)
    })
  })

  describe('validatePackageAdjustment', () => {
    const validAdjustment: MetrcPackageAdjustment = {
      Label: '1A4FF0100000022000000123',
      Quantity: -10.5,
      UnitOfMeasure: 'Grams',
      AdjustmentReason: 'Drying',
      AdjustmentDate: '2024-11-01',
    }

    it('should pass for valid adjustment', () => {
      const result = validatePackageAdjustment(validAdjustment)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow negative quantities', () => {
      const adjustment = { ...validAdjustment, Quantity: -100 }
      const result = validatePackageAdjustment(adjustment)
      expect(result.isValid).toBe(true)
    })

    it('should allow positive quantities', () => {
      const adjustment = { ...validAdjustment, Quantity: 100 }
      const result = validatePackageAdjustment(adjustment)
      expect(result.isValid).toBe(true)
    })

    it('should fail when Label is missing', () => {
      const adjustment = { ...validAdjustment, Label: undefined as any }
      const result = validatePackageAdjustment(adjustment)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Label')).toBe(true)
    })

    it('should fail when Label format is invalid', () => {
      const adjustment = { ...validAdjustment, Label: 'INVALID' }
      const result = validatePackageAdjustment(adjustment)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_TAG_FORMAT')).toBe(true)
    })

    it('should fail when Quantity is not a number', () => {
      const adjustment = { ...validAdjustment, Quantity: '100' as any }
      const result = validatePackageAdjustment(adjustment)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_NUMBER')).toBe(true)
    })

    it('should fail when AdjustmentReason is missing', () => {
      const adjustment = { ...validAdjustment, AdjustmentReason: undefined as any }
      const result = validatePackageAdjustment(adjustment)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'AdjustmentReason')).toBe(true)
    })

    it('should fail when AdjustmentDate is in the future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const adjustment = {
        ...validAdjustment,
        AdjustmentDate: futureDate.toISOString().split('T')[0],
      }
      const result = validatePackageAdjustment(adjustment)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'DATE_IN_FUTURE')).toBe(true)
    })
  })

  describe('validatePackageLocationChange', () => {
    const validLocationChange: MetrcPackageLocationChange = {
      Label: '1A4FF0100000022000000123',
      Location: 'Flowering Room A',
      MoveDate: '2024-11-01',
    }

    it('should pass for valid location change', () => {
      const result = validatePackageLocationChange(validLocationChange)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when Label is missing', () => {
      const change = { ...validLocationChange, Label: undefined as any }
      const result = validatePackageLocationChange(change)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Label')).toBe(true)
    })

    it('should fail when Location is missing', () => {
      const change = { ...validLocationChange, Location: undefined as any }
      const result = validatePackageLocationChange(change)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Location')).toBe(true)
    })

    it('should fail when MoveDate is missing', () => {
      const change = { ...validLocationChange, MoveDate: undefined as any }
      const result = validatePackageLocationChange(change)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'MoveDate')).toBe(true)
    })

    it('should fail when MoveDate is in the future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const change = {
        ...validLocationChange,
        MoveDate: futureDate.toISOString().split('T')[0],
      }
      const result = validatePackageLocationChange(change)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'DATE_IN_FUTURE')).toBe(true)
    })
  })

  describe('validatePackageFinish', () => {
    const validFinish: MetrcPackageFinish = {
      Label: '1A4FF0100000022000000123',
      ActualDate: '2024-11-01',
    }

    it('should pass for valid finish', () => {
      const result = validatePackageFinish(validFinish)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when Label is missing', () => {
      const finish = { ...validFinish, Label: undefined as any }
      const result = validatePackageFinish(finish)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Label')).toBe(true)
    })

    it('should fail when ActualDate is missing', () => {
      const finish = { ...validFinish, ActualDate: undefined as any }
      const result = validatePackageFinish(finish)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'ActualDate')).toBe(true)
    })

    it('should fail when ActualDate is in the future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const finish = {
        ...validFinish,
        ActualDate: futureDate.toISOString().split('T')[0],
      }
      const result = validatePackageFinish(finish)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'DATE_IN_FUTURE')).toBe(true)
    })
  })

  describe('validatePackageCreateBatch', () => {
    const validPackage: MetrcPackageCreate = {
      Tag: '1A4FF0100000022000000123',
      Item: 'Blue Dream - Flower',
      Quantity: 100.5,
      UnitOfMeasure: 'Grams',
      PackagedDate: '2024-11-01',
    }

    it('should pass for valid batch of packages', () => {
      const packages = [
        validPackage,
        { ...validPackage, Tag: 'ABCDEFGH1234567890123456' },
      ]
      const result = validatePackageCreateBatch(packages)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when batch is empty', () => {
      const result = validatePackageCreateBatch([])
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'EMPTY_ARRAY')).toBe(true)
    })

    it('should collect errors from all packages', () => {
      const packages = [
        { ...validPackage, Tag: undefined as any }, // Invalid
        validPackage, // Valid
        { ...validPackage, Quantity: 0 }, // Invalid
      ]
      const result = validatePackageCreateBatch(packages)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors.some(e => e.field.includes('packages[0]'))).toBe(true)
      expect(result.errors.some(e => e.field.includes('packages[2]'))).toBe(true)
    })

    it('should collect warnings from all packages', () => {
      const packages = [
        { ...validPackage, UnitOfMeasure: 'Barrels' }, // Warning
        { ...validPackage, Tag: 'ABCDEFGH1234567890123456', UnitOfMeasure: 'Barrels' }, // Warning
      ]
      const result = validatePackageCreateBatch(packages)
      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBe(2)
      expect(result.warnings.some(w => w.field.includes('packages[0]'))).toBe(true)
      expect(result.warnings.some(w => w.field.includes('packages[1]'))).toBe(true)
    })
  })
})
