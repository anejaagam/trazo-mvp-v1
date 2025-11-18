/**
 * Package Validation Rules
 *
 * Validation logic for Metrc package operations
 */

import type { ValidationResult } from '@/lib/compliance/types'
import type {
  MetrcPackageCreate,
  MetrcPackageAdjustment,
  MetrcPackageLocationChange,
  MetrcPackageFinish,
} from '../types'
import {
  createValidationResult,
  validateRequired,
  validateDate,
  validatePositiveNumber,
  validateUnitOfMeasure,
  validateMetrcTag,
  validateArrayNotEmpty,
  validateDateNotInFuture,
  addError,
} from './validators'

/**
 * Validate package creation
 */
export function validatePackageCreate(pkg: MetrcPackageCreate): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'Tag', pkg.Tag)
  validateRequired(result, 'Item', pkg.Item)
  validateRequired(result, 'Quantity', pkg.Quantity)
  validateRequired(result, 'UnitOfMeasure', pkg.UnitOfMeasure)
  validateRequired(result, 'PackagedDate', pkg.PackagedDate)

  // Tag format
  if (pkg.Tag) {
    validateMetrcTag(result, 'Tag', pkg.Tag)
  }

  // Quantity validation
  if (pkg.Quantity !== undefined) {
    validatePositiveNumber(result, 'Quantity', pkg.Quantity)
  }

  // Unit of measure
  if (pkg.UnitOfMeasure) {
    validateUnitOfMeasure(result, 'UnitOfMeasure', pkg.UnitOfMeasure)
  }

  // Date validation
  if (pkg.PackagedDate) {
    validateDate(result, 'PackagedDate', pkg.PackagedDate)
    validateDateNotInFuture(result, 'PackagedDate', pkg.PackagedDate)
  }

  // Ingredients validation
  if (pkg.Ingredients && pkg.Ingredients.length > 0) {
    pkg.Ingredients.forEach((ingredient, index) => {
      if (!ingredient.Package) {
        addError(
          result,
          `Ingredients[${index}].Package`,
          'Package label is required for ingredient',
          'REQUIRED_FIELD_MISSING'
        )
      }
      if (ingredient.Quantity !== undefined) {
        validatePositiveNumber(
          result,
          `Ingredients[${index}].Quantity`,
          ingredient.Quantity
        )
      }
      if (ingredient.UnitOfMeasure) {
        validateUnitOfMeasure(
          result,
          `Ingredients[${index}].UnitOfMeasure`,
          ingredient.UnitOfMeasure
        )
      }
    })
  }

  return result
}

/**
 * Validate package adjustment
 */
export function validatePackageAdjustment(adjustment: MetrcPackageAdjustment): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'Label', adjustment.Label)
  validateRequired(result, 'Quantity', adjustment.Quantity)
  validateRequired(result, 'UnitOfMeasure', adjustment.UnitOfMeasure)
  validateRequired(result, 'AdjustmentReason', adjustment.AdjustmentReason)
  validateRequired(result, 'AdjustmentDate', adjustment.AdjustmentDate)

  // Label format
  if (adjustment.Label) {
    validateMetrcTag(result, 'Label', adjustment.Label)
  }

  // Quantity can be negative for adjustments
  if (adjustment.Quantity !== undefined && typeof adjustment.Quantity !== 'number') {
    addError(result, 'Quantity', 'Quantity must be a number', 'INVALID_NUMBER')
  }

  // Unit of measure
  if (adjustment.UnitOfMeasure) {
    validateUnitOfMeasure(result, 'UnitOfMeasure', adjustment.UnitOfMeasure)
  }

  // Date validation
  if (adjustment.AdjustmentDate) {
    validateDate(result, 'AdjustmentDate', adjustment.AdjustmentDate)
    validateDateNotInFuture(result, 'AdjustmentDate', adjustment.AdjustmentDate)
  }

  return result
}

/**
 * Validate package location change
 */
export function validatePackageLocationChange(
  locationChange: MetrcPackageLocationChange
): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'Label', locationChange.Label)
  validateRequired(result, 'Location', locationChange.Location)
  validateRequired(result, 'MoveDate', locationChange.MoveDate)

  // Label format
  if (locationChange.Label) {
    validateMetrcTag(result, 'Label', locationChange.Label)
  }

  // Date validation
  if (locationChange.MoveDate) {
    validateDate(result, 'MoveDate', locationChange.MoveDate)
    validateDateNotInFuture(result, 'MoveDate', locationChange.MoveDate)
  }

  return result
}

/**
 * Validate package finish
 */
export function validatePackageFinish(finish: MetrcPackageFinish): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'Label', finish.Label)
  validateRequired(result, 'ActualDate', finish.ActualDate)

  // Label format
  if (finish.Label) {
    validateMetrcTag(result, 'Label', finish.Label)
  }

  // Date validation
  if (finish.ActualDate) {
    validateDate(result, 'ActualDate', finish.ActualDate)
    validateDateNotInFuture(result, 'ActualDate', finish.ActualDate)
  }

  return result
}

/**
 * Validate batch of package operations
 */
export function validatePackageCreateBatch(packages: MetrcPackageCreate[]): ValidationResult {
  const result = createValidationResult()

  if (!validateArrayNotEmpty(result, 'packages', packages)) {
    return result
  }

  // Validate each package
  packages.forEach((pkg, index) => {
    const pkgResult = validatePackageCreate(pkg)
    if (!pkgResult.isValid) {
      result.isValid = false
      pkgResult.errors.forEach((error) => {
        result.errors.push({
          ...error,
          field: `packages[${index}].${error.field}`,
        })
      })
    }
    pkgResult.warnings.forEach((warning) => {
      result.warnings.push({
        ...warning,
        field: `packages[${index}].${warning.field}`,
      })
    })
  })

  return result
}
