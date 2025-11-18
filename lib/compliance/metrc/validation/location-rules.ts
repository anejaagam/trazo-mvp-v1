/**
 * Metrc Location Validation Rules
 *
 * Validates location data before syncing to Metrc
 */

import { validateRequired } from './validators'
import type { ValidationResult, ValidationError, ValidationWarning } from './validators'
import type { MetrcLocationCreate, MetrcLocationUpdate } from '../types'

// =====================================================
// LOCATION NAME VALIDATION
// =====================================================

/**
 * Validate location name format and content
 *
 * Metrc location names must:
 * - Not be empty
 * - Be reasonable length (1-100 characters based on typical limits)
 * - Not contain special characters that might cause issues
 *
 * @param name - Location name to validate
 * @returns Validation result
 */
export function validateLocationName(name: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Required
  const requiredCheck = validateRequired(name, 'Name')
  if (!requiredCheck.isValid) {
    errors.push(...requiredCheck.errors)
    return { isValid: false, errors, warnings }
  }

  const trimmedName = name.trim()

  // Length check
  if (trimmedName.length < 1) {
    errors.push({
      field: 'Name',
      message: 'Location name cannot be empty',
      code: 'NAME_EMPTY',
    })
  }

  if (trimmedName.length > 100) {
    errors.push({
      field: 'Name',
      message: 'Location name cannot exceed 100 characters',
      code: 'NAME_TOO_LONG',
      value: trimmedName.length,
    })
  }

  // Warn about potential issues
  if (trimmedName.length < 3) {
    warnings.push({
      field: 'Name',
      message: 'Location name is very short. Consider a more descriptive name.',
      code: 'NAME_TOO_SHORT',
    })
  }

  // Check for leading/trailing whitespace
  if (name !== trimmedName) {
    warnings.push({
      field: 'Name',
      message: 'Location name has leading or trailing whitespace',
      code: 'NAME_WHITESPACE',
    })
  }

  // Check for special characters that might cause issues
  const specialCharsRegex = /[<>'"\\]/
  if (specialCharsRegex.test(trimmedName)) {
    warnings.push({
      field: 'Name',
      message: 'Location name contains special characters (<, >, \', ", \\) that may cause issues',
      code: 'NAME_SPECIAL_CHARS',
    })
  }

  // Check for duplicate spaces
  if (/\s{2,}/.test(trimmedName)) {
    warnings.push({
      field: 'Name',
      message: 'Location name contains multiple consecutive spaces',
      code: 'NAME_DUPLICATE_SPACES',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// =====================================================
// LOCATION TYPE VALIDATION
// =====================================================

/**
 * Validate location type ID
 *
 * LocationTypeId must be a positive integer corresponding to
 * a valid location type from /locations/v2/types endpoint
 *
 * @param locationTypeId - Location type ID to validate
 * @returns Validation result
 */
export function validateLocationTypeId(locationTypeId: number): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Must be a number
  if (typeof locationTypeId !== 'number') {
    errors.push({
      field: 'LocationTypeId',
      message: 'Location type ID must be a number',
      code: 'LOCATION_TYPE_INVALID_TYPE',
      value: typeof locationTypeId,
    })
    return { isValid: false, errors, warnings }
  }

  // Must be positive integer
  if (!Number.isInteger(locationTypeId) || locationTypeId <= 0) {
    errors.push({
      field: 'LocationTypeId',
      message: 'Location type ID must be a positive integer',
      code: 'LOCATION_TYPE_INVALID_VALUE',
      value: locationTypeId,
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// =====================================================
// LOCATION CREATE VALIDATION
// =====================================================

/**
 * Validate location creation payload
 *
 * @param payload - Location creation data
 * @returns Validation result
 */
export function validateLocationCreate(payload: MetrcLocationCreate): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Validate name
  const nameValidation = validateLocationName(payload.Name)
  errors.push(...nameValidation.errors)
  warnings.push(...nameValidation.warnings)

  // Validate location type ID
  const typeValidation = validateLocationTypeId(payload.LocationTypeId)
  errors.push(...typeValidation.errors)
  warnings.push(...typeValidation.warnings)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// =====================================================
// LOCATION UPDATE VALIDATION
// =====================================================

/**
 * Validate location update payload
 *
 * @param payload - Location update data
 * @returns Validation result
 */
export function validateLocationUpdate(payload: MetrcLocationUpdate): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Validate ID
  if (typeof payload.Id !== 'number' || !Number.isInteger(payload.Id) || payload.Id <= 0) {
    errors.push({
      field: 'Id',
      message: 'Location ID must be a positive integer',
      code: 'LOCATION_ID_INVALID',
      value: payload.Id,
    })
  }

  // Validate name
  const nameValidation = validateLocationName(payload.Name)
  errors.push(...nameValidation.errors)
  warnings.push(...nameValidation.warnings)

  // Validate location type ID
  const typeValidation = validateLocationTypeId(payload.LocationTypeId)
  errors.push(...typeValidation.errors)
  warnings.push(...typeValidation.warnings)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// =====================================================
// TRAZO TO METRC LOCATION CONVERSION VALIDATION
// =====================================================

/**
 * Validate TRAZO location data before converting to Metrc format
 *
 * Used to validate rooms and pods before sync
 *
 * @param trazoLocation - TRAZO location data
 * @returns Validation result
 */
export function validateTrazoLocationForMetrcSync(trazoLocation: {
  name: string
  metrc_location_type_id?: number | null
  site_license_number?: string | null
}): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Validate name
  const nameValidation = validateLocationName(trazoLocation.name)
  errors.push(...nameValidation.errors)
  warnings.push(...nameValidation.warnings)

  // Check if location type is provided
  if (!trazoLocation.metrc_location_type_id) {
    errors.push({
      field: 'metrc_location_type_id',
      message: 'Metrc location type ID is required for sync',
      code: 'LOCATION_TYPE_REQUIRED',
    })
  } else {
    // Validate location type ID
    const typeValidation = validateLocationTypeId(trazoLocation.metrc_location_type_id)
    errors.push(...typeValidation.errors)
    warnings.push(...typeValidation.warnings)
  }

  // Check if site has license number (required for Metrc API)
  if (!trazoLocation.site_license_number || trazoLocation.site_license_number.trim() === '') {
    errors.push({
      field: 'site_license_number',
      message: 'Site license number is required for Metrc sync',
      code: 'LICENSE_NUMBER_REQUIRED',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// =====================================================
// DUPLICATE LOCATION CHECK
// =====================================================

/**
 * Check if a location name might be a duplicate
 *
 * This is a client-side check - actual duplicate detection
 * happens by querying Metrc API
 *
 * @param name - Location name to check
 * @param existingNames - Array of existing location names
 * @returns Validation result with warning if potential duplicate found
 */
export function checkDuplicateLocationName(
  name: string,
  existingNames: string[]
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  const normalizedName = name.trim().toLowerCase()
  const duplicate = existingNames.find(
    (existing) => existing.trim().toLowerCase() === normalizedName
  )

  if (duplicate) {
    warnings.push({
      field: 'Name',
      message: `A location named "${duplicate}" already exists in Metrc`,
      code: 'DUPLICATE_NAME',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
