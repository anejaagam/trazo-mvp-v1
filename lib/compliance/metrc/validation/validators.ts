/**
 * Common Validation Utilities
 *
 * Reusable validators for Metrc data validation
 */

import type { ValidationResult, ValidationError, ValidationWarning } from '@/lib/compliance/types'

/**
 * Create a validation result
 */
export function createValidationResult(): ValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings: [],
  }
}

/**
 * Add error to validation result
 */
export function addError(
  result: ValidationResult,
  field: string,
  message: string,
  code: string
): void {
  result.isValid = false
  result.errors.push({ field, message, code })
}

/**
 * Add warning to validation result
 */
export function addWarning(
  result: ValidationResult,
  field: string,
  message: string,
  code: string
): void {
  result.warnings.push({ field, message, code })
}

/**
 * Validate required field
 */
export function validateRequired(
  result: ValidationResult,
  field: string,
  value: any,
  fieldName?: string
): boolean {
  if (value === null || value === undefined || value === '') {
    addError(
      result,
      field,
      `${fieldName || field} is required`,
      'REQUIRED'
    )
    return false
  }
  return true
}

/**
 * Validate date format (YYYY-MM-DD or ISO timestamp)
 */
export function validateDate(
  result: ValidationResult,
  field: string,
  value: string,
  fieldName?: string
): boolean {
  if (!value) return false

  // Accept ISO timestamp or YYYY-MM-DD format
  const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/
  if (!isoRegex.test(value)) {
    addError(
      result,
      field,
      `${fieldName || field} must be in YYYY-MM-DD or ISO format`,
      'INVALID_DATE_FORMAT'
    )
    return false
  }

  // Validate it's a real date
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    addError(
      result,
      field,
      `${fieldName || field} is not a valid date`,
      'INVALID_DATE'
    )
    return false
  }

  return true
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(
  result: ValidationResult,
  field: string,
  value: number,
  fieldName?: string
): boolean {
  if (typeof value !== 'number' || value <= 0) {
    addError(
      result,
      field,
      `${fieldName || field} must be a positive number`,
      'NOT_POSITIVE'
    )
    return false
  }
  return true
}

/**
 * Validate non-negative number
 */
export function validateNonNegativeNumber(
  result: ValidationResult,
  field: string,
  value: number,
  fieldName?: string
): boolean {
  if (typeof value !== 'number' || value < 0) {
    addError(
      result,
      field,
      `${fieldName || field} must be a non-negative number`,
      'INVALID_NUMBER'
    )
    return false
  }
  return true
}

/**
 * Validate unit of measure
 */
export function validateUnitOfMeasure(
  result: ValidationResult,
  field: string,
  value: string,
  fieldName?: string
): boolean {
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

  if (!validUnits.includes(value)) {
    addWarning(
      result,
      field,
      `${fieldName || field} "${value}" may not be a valid unit of measure. Common units: ${validUnits.join(', ')}`,
      'UNKNOWN_UNIT'
    )
    return false
  }
  return true
}

/**
 * Validate Metrc tag format (example: 1A4FF0100000022000000123)
 */
export function validateMetrcTag(
  result: ValidationResult,
  field: string,
  value: string,
  fieldName?: string
): boolean {
  // Metrc tags are typically 24 characters alphanumeric
  const tagRegex = /^[A-Z0-9]{24}$/
  if (!tagRegex.test(value)) {
    addError(
      result,
      field,
      `${fieldName || field} must be a valid Metrc tag (24 alphanumeric characters)`,
      'INVALID_TAG_FORMAT'
    )
    return false
  }
  return true
}

/**
 * Validate license number format
 */
export function validateLicenseNumber(
  result: ValidationResult,
  field: string,
  value: string,
  fieldName?: string
): boolean {
  // License numbers vary by state, but generally alphanumeric with dashes
  if (!value || value.length < 3) {
    addError(
      result,
      field,
      `${fieldName || field} must be at least 3 characters`,
      'INVALID_LICENSE'
    )
    return false
  }
  return true
}

/**
 * Validate array not empty
 */
export function validateArrayNotEmpty(
  result: ValidationResult,
  field: string,
  value: any[],
  fieldName?: string
): boolean {
  if (!Array.isArray(value) || value.length === 0) {
    addError(
      result,
      field,
      `${fieldName || field} must contain at least one item`,
      'EMPTY_ARRAY'
    )
    return false
  }
  return true
}

/**
 * Validate date not in future
 */
export function validateDateNotInFuture(
  result: ValidationResult,
  field: string,
  value: string,
  fieldName?: string
): boolean {
  const date = new Date(value)
  const now = new Date()

  if (date > now) {
    addError(
      result,
      field,
      `${fieldName || field} cannot be in the future`,
      'DATE_IN_FUTURE'
    )
    return false
  }
  return true
}

/**
 * Validate date range
 */
export function validateDateRange(
  result: ValidationResult,
  startField: string,
  startValue: string,
  endField: string,
  endValue: string
): boolean {
  const startDate = new Date(startValue)
  const endDate = new Date(endValue)

  if (startDate > endDate) {
    addError(
      result,
      startField,
      `Start date must be before or equal to end date`,
      'INVALID_DATE_RANGE'
    )
    return false
  }
  return true
}
