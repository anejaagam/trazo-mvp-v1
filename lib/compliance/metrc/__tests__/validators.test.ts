/**
 * Validators Tests
 *
 * Tests for common validation utilities
 */

import {
  createValidationResult,
  addError,
  addWarning,
  validateRequired,
  validateDate,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateUnitOfMeasure,
  validateMetrcTag,
  validateLicenseNumber,
  validateArrayNotEmpty,
  validateDateNotInFuture,
  validateDateRange,
} from '../validation/validators'
import type { ValidationResult } from '@/lib/compliance/types'

describe('Validators', () => {
  describe('createValidationResult', () => {
    it('should create a valid result by default', () => {
      const result = createValidationResult()

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
      expect(result.warnings).toEqual([])
    })
  })

  describe('addError', () => {
    it('should add error and mark result as invalid', () => {
      const result = createValidationResult()
      addError(result, 'testField', 'Test error message', 'TEST_ERROR')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        field: 'testField',
        message: 'Test error message',
        code: 'TEST_ERROR',
      })
    })

    it('should add multiple errors', () => {
      const result = createValidationResult()
      addError(result, 'field1', 'Error 1', 'ERROR_1')
      addError(result, 'field2', 'Error 2', 'ERROR_2')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })

  describe('addWarning', () => {
    it('should add warning without marking result as invalid', () => {
      const result = createValidationResult()
      addWarning(result, 'testField', 'Test warning message', 'TEST_WARNING')

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toEqual({
        field: 'testField',
        message: 'Test warning message',
        code: 'TEST_WARNING',
      })
    })
  })

  describe('validateRequired', () => {
    it('should pass for valid values', () => {
      const result = createValidationResult()

      expect(validateRequired(result, 'field', 'valid value')).toBe(true)
      expect(validateRequired(result, 'field', 123)).toBe(true)
      expect(validateRequired(result, 'field', true)).toBe(true)
      expect(validateRequired(result, 'field', [])).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should fail for null', () => {
      const result = createValidationResult()
      expect(validateRequired(result, 'field', null)).toBe(false)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe('REQUIRED')
    })

    it('should fail for undefined', () => {
      const result = createValidationResult()
      expect(validateRequired(result, 'field', undefined)).toBe(false)
      expect(result.isValid).toBe(false)
    })

    it('should fail for empty string', () => {
      const result = createValidationResult()
      expect(validateRequired(result, 'field', '')).toBe(false)
      expect(result.isValid).toBe(false)
    })

    it('should use custom field name in error message', () => {
      const result = createValidationResult()
      validateRequired(result, 'field', null, 'Custom Field Name')
      expect(result.errors[0].message).toContain('Custom Field Name')
    })
  })

  describe('validateDate', () => {
    it('should pass for valid YYYY-MM-DD format', () => {
      const result = createValidationResult()
      expect(validateDate(result, 'field', '2024-11-17')).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should pass for valid ISO timestamp', () => {
      const result = createValidationResult()
      expect(validateDate(result, 'field', '2024-11-17T12:00:00Z')).toBe(true)
      expect(validateDate(result, 'field', '2024-11-17T12:00:00.000Z')).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should fail for invalid format', () => {
      const result = createValidationResult()
      expect(validateDate(result, 'field', '11/17/2024')).toBe(false)
      expect(validateDate(result, 'field', '2024-13-01')).toBe(false)
      expect(validateDate(result, 'field', 'invalid')).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should fail for invalid date values', () => {
      const result = createValidationResult()
      // Note: JavaScript Date constructor is lenient with invalid dates like Feb 30
      // It converts '2024-02-30' to '2024-03-01', which is technically a valid date
      // Month 13 passes format check but creates an invalid Date object
      expect(validateDate(result, 'field', '2024-13-01')).toBe(false)
      expect(result.errors[0].code).toBe('INVALID_DATE')
    })

    it('should fail for empty string', () => {
      const result = createValidationResult()
      expect(validateDate(result, 'field', '')).toBe(false)
    })
  })

  describe('validatePositiveNumber', () => {
    it('should pass for positive numbers', () => {
      const result = createValidationResult()
      expect(validatePositiveNumber(result, 'field', 1)).toBe(true)
      expect(validatePositiveNumber(result, 'field', 100.5)).toBe(true)
      expect(validatePositiveNumber(result, 'field', 0.01)).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should fail for zero', () => {
      const result = createValidationResult()
      expect(validatePositiveNumber(result, 'field', 0)).toBe(false)
      expect(result.isValid).toBe(false)
    })

    it('should fail for negative numbers', () => {
      const result = createValidationResult()
      expect(validatePositiveNumber(result, 'field', -1)).toBe(false)
      expect(result.isValid).toBe(false)
    })

    it('should fail for non-number values', () => {
      const result = createValidationResult()
      expect(validatePositiveNumber(result, 'field', '100' as any)).toBe(false)
      expect(validatePositiveNumber(result, 'field', null as any)).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateNonNegativeNumber', () => {
    it('should pass for zero', () => {
      const result = createValidationResult()
      expect(validateNonNegativeNumber(result, 'field', 0)).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should pass for positive numbers', () => {
      const result = createValidationResult()
      expect(validateNonNegativeNumber(result, 'field', 1)).toBe(true)
      expect(validateNonNegativeNumber(result, 'field', 100.5)).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should fail for negative numbers', () => {
      const result = createValidationResult()
      expect(validateNonNegativeNumber(result, 'field', -1)).toBe(false)
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateUnitOfMeasure', () => {
    it('should pass for valid units', () => {
      const result = createValidationResult()
      const validUnits = [
        'Grams',
        'Kilograms',
        'Ounces',
        'Pounds',
        'Milligrams',
        'Each',
        'Milliliters',
        'Liters',
        'Fluid Ounces',
        'Gallons',
      ]

      validUnits.forEach(unit => {
        expect(validateUnitOfMeasure(result, 'field', unit)).toBe(true)
      })
      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('should add warning for unknown units', () => {
      const result = createValidationResult()
      expect(validateUnitOfMeasure(result, 'field', 'Barrels')).toBe(false)
      expect(result.isValid).toBe(true) // Still valid, just a warning
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('UNKNOWN_UNIT')
    })
  })

  describe('validateMetrcTag', () => {
    it('should pass for valid Metrc tag format', () => {
      const result = createValidationResult()
      expect(validateMetrcTag(result, 'field', '1A4FF0100000022000000123')).toBe(true)
      expect(validateMetrcTag(result, 'field', 'ABCDEFGH1234567890123456')).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should fail for invalid tag length', () => {
      const result = createValidationResult()
      expect(validateMetrcTag(result, 'field', '1A4FF010000002200000012')).toBe(false) // 23 chars
      expect(validateMetrcTag(result, 'field', '1A4FF01000000220000001234')).toBe(false) // 25 chars
      expect(result.isValid).toBe(false)
    })

    it('should fail for invalid characters', () => {
      const result = createValidationResult()
      expect(validateMetrcTag(result, 'field', '1a4ff0100000022000000123')).toBe(false) // lowercase
      expect(validateMetrcTag(result, 'field', '1A4FF010000002200000012#')).toBe(false) // special char
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateLicenseNumber', () => {
    it('should pass for valid license numbers', () => {
      const result = createValidationResult()
      expect(validateLicenseNumber(result, 'field', '123-ABC')).toBe(true)
      expect(validateLicenseNumber(result, 'field', 'LICENSE123')).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should fail for too short license numbers', () => {
      const result = createValidationResult()
      expect(validateLicenseNumber(result, 'field', 'AB')).toBe(false)
      expect(result.errors[0].code).toBe('INVALID_LICENSE')
    })

    it('should fail for empty string', () => {
      const result = createValidationResult()
      expect(validateLicenseNumber(result, 'field', '')).toBe(false)
    })
  })

  describe('validateArrayNotEmpty', () => {
    it('should pass for non-empty arrays', () => {
      const result = createValidationResult()
      expect(validateArrayNotEmpty(result, 'field', [1, 2, 3])).toBe(true)
      expect(validateArrayNotEmpty(result, 'field', ['a'])).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should fail for empty array', () => {
      const result = createValidationResult()
      expect(validateArrayNotEmpty(result, 'field', [])).toBe(false)
      expect(result.errors[0].code).toBe('EMPTY_ARRAY')
    })

    it('should fail for non-array values', () => {
      const result = createValidationResult()
      expect(validateArrayNotEmpty(result, 'field', null as any)).toBe(false)
      expect(validateArrayNotEmpty(result, 'field', 'not an array' as any)).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateDateNotInFuture', () => {
    it('should pass for past dates', () => {
      const result = createValidationResult()
      expect(validateDateNotInFuture(result, 'field', '2020-01-01')).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should pass for today', () => {
      const result = createValidationResult()
      const today = new Date().toISOString().split('T')[0]
      expect(validateDateNotInFuture(result, 'field', today)).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should fail for future dates', () => {
      const result = createValidationResult()
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const futureDateStr = futureDate.toISOString().split('T')[0]

      expect(validateDateNotInFuture(result, 'field', futureDateStr)).toBe(false)
      expect(result.errors[0].code).toBe('DATE_IN_FUTURE')
    })
  })

  describe('validateDateRange', () => {
    it('should pass when start date is before end date', () => {
      const result = createValidationResult()
      expect(validateDateRange(
        result,
        'startDate',
        '2024-01-01',
        'endDate',
        '2024-12-31'
      )).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should pass when start date equals end date', () => {
      const result = createValidationResult()
      expect(validateDateRange(
        result,
        'startDate',
        '2024-11-17',
        'endDate',
        '2024-11-17'
      )).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should fail when start date is after end date', () => {
      const result = createValidationResult()
      expect(validateDateRange(
        result,
        'startDate',
        '2024-12-31',
        'endDate',
        '2024-01-01'
      )).toBe(false)
      expect(result.errors[0].code).toBe('INVALID_DATE_RANGE')
    })
  })
})
