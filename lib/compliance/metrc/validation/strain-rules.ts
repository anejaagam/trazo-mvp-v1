/**
 * Strain Validation Rules
 *
 * Validation logic for Metrc strain operations and cultivar-strain mapping.
 * Ensures cultivars are properly synced with Metrc strains before batch creation.
 */

import type { ValidationResult } from '@/lib/compliance/types'
import type { MetrcStrainCreate, MetrcStrainUpdate } from '../types'
import {
  createValidationResult,
  validateRequired,
  validatePositiveNumber,
  addError,
  addWarning,
} from './validators'

// =====================================================
// STRAIN CREATE VALIDATION
// =====================================================

/**
 * Validate strain creation payload
 */
export function validateStrainCreate(strain: MetrcStrainCreate): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'Name', strain.Name)
  validateRequired(result, 'TestingStatus', strain.TestingStatus)

  // Name validation
  if (strain.Name) {
    if (strain.Name.length < 1) {
      addError(result, 'Name', 'Strain name cannot be empty', 'EMPTY_NAME')
    }
    if (strain.Name.length > 100) {
      addError(
        result,
        'Name',
        'Strain name must not exceed 100 characters',
        'NAME_TOO_LONG'
      )
    }
    // Check for special characters
    if (!/^[a-zA-Z0-9\s\-_#]+$/.test(strain.Name)) {
      addWarning(
        result,
        'Name',
        'Strain name contains special characters that may not be accepted by Metrc',
        'SPECIAL_CHARACTERS_IN_NAME'
      )
    }
  }

  // Testing status validation
  const validTestingStatuses = ['None', 'NotSubmitted', 'AwaitingConfirmation', 'Confirmed']
  if (strain.TestingStatus && !validTestingStatuses.includes(strain.TestingStatus)) {
    addWarning(
      result,
      'TestingStatus',
      `Testing status "${strain.TestingStatus}" may not be recognized. Valid values: ${validTestingStatuses.join(', ')}`,
      'INVALID_TESTING_STATUS'
    )
  }

  // THC/CBD level validation
  if (strain.ThcLevel !== undefined) {
    if (strain.ThcLevel < 0 || strain.ThcLevel > 100) {
      addError(result, 'ThcLevel', 'THC level must be between 0 and 100', 'INVALID_THC_LEVEL')
    }
  }

  if (strain.CbdLevel !== undefined) {
    if (strain.CbdLevel < 0 || strain.CbdLevel > 100) {
      addError(result, 'CbdLevel', 'CBD level must be between 0 and 100', 'INVALID_CBD_LEVEL')
    }
  }

  // Indica/Sativa percentage validation
  if (strain.IndicaPercentage !== undefined) {
    if (strain.IndicaPercentage < 0 || strain.IndicaPercentage > 100) {
      addError(
        result,
        'IndicaPercentage',
        'Indica percentage must be between 0 and 100',
        'INVALID_INDICA_PERCENTAGE'
      )
    }
  }

  if (strain.SativaPercentage !== undefined) {
    if (strain.SativaPercentage < 0 || strain.SativaPercentage > 100) {
      addError(
        result,
        'SativaPercentage',
        'Sativa percentage must be between 0 and 100',
        'INVALID_SATIVA_PERCENTAGE'
      )
    }
  }

  // Check if indica + sativa adds up to 100
  if (strain.IndicaPercentage !== undefined && strain.SativaPercentage !== undefined) {
    const total = strain.IndicaPercentage + strain.SativaPercentage
    if (total !== 100) {
      addWarning(
        result,
        'IndicaPercentage',
        `Indica (${strain.IndicaPercentage}%) + Sativa (${strain.SativaPercentage}%) = ${total}%. Should equal 100%.`,
        'PERCENTAGE_SUM_MISMATCH'
      )
    }
  }

  return result
}

/**
 * Validate strain update payload
 */
export function validateStrainUpdate(strain: MetrcStrainUpdate): ValidationResult {
  const result = validateStrainCreate(strain)

  // Additional validation for update
  validateRequired(result, 'Id', strain.Id)

  if (strain.Id !== undefined && strain.Id <= 0) {
    addError(result, 'Id', 'Strain ID must be a positive number', 'INVALID_ID')
  }

  return result
}

// =====================================================
// CULTIVAR-STRAIN VALIDATION
// =====================================================

/**
 * Validate that a cultivar can be synced to Metrc
 */
export function validateCultivarForMetrcSync(cultivar: {
  id: string
  name: string
  strain_type?: string
  thc_range_min?: number
  thc_range_max?: number
  cbd_range_min?: number
  cbd_range_max?: number
  metrc_strain_id?: number | null
}): ValidationResult {
  const result = createValidationResult()

  // Name is required
  validateRequired(result, 'name', cultivar.name)

  if (cultivar.name) {
    if (cultivar.name.trim().length === 0) {
      addError(result, 'name', 'Cultivar name cannot be empty', 'EMPTY_NAME')
    }

    if (cultivar.name.length > 100) {
      addError(
        result,
        'name',
        'Cultivar name must not exceed 100 characters for Metrc compatibility',
        'NAME_TOO_LONG'
      )
    }
  }

  // THC range validation
  if (cultivar.thc_range_min !== undefined && cultivar.thc_range_max !== undefined) {
    if (cultivar.thc_range_min > cultivar.thc_range_max) {
      addError(
        result,
        'thc_range_min',
        'THC range minimum cannot exceed maximum',
        'INVALID_THC_RANGE'
      )
    }
  }

  // CBD range validation
  if (cultivar.cbd_range_min !== undefined && cultivar.cbd_range_max !== undefined) {
    if (cultivar.cbd_range_min > cultivar.cbd_range_max) {
      addError(
        result,
        'cbd_range_min',
        'CBD range minimum cannot exceed maximum',
        'INVALID_CBD_RANGE'
      )
    }
  }

  // Warn if already synced
  if (cultivar.metrc_strain_id) {
    addWarning(
      result,
      'metrc_strain_id',
      `Cultivar is already linked to Metrc strain ID ${cultivar.metrc_strain_id}`,
      'ALREADY_SYNCED'
    )
  }

  return result
}

/**
 * Validate strain name match between TRAZO and Metrc
 */
export function validateStrainNameMatch(
  trazoName: string,
  metrcStrains: Array<{ Name: string; Id: number }>
): ValidationResult {
  const result = createValidationResult()

  if (!trazoName || trazoName.trim().length === 0) {
    addError(result, 'name', 'Strain name is required', 'EMPTY_NAME')
    return result
  }

  const normalizedTrazoName = trazoName.trim().toLowerCase()

  // Look for exact match
  const exactMatch = metrcStrains.find(
    (s) => s.Name.trim().toLowerCase() === normalizedTrazoName
  )

  if (exactMatch) {
    return result // Valid - exact match found
  }

  // Look for close matches
  const closeMatches = metrcStrains.filter((s) => {
    const metrcName = s.Name.trim().toLowerCase()
    return (
      metrcName.includes(normalizedTrazoName) ||
      normalizedTrazoName.includes(metrcName)
    )
  })

  if (closeMatches.length > 0) {
    addWarning(
      result,
      'name',
      `No exact match for "${trazoName}". Similar strains found: ${closeMatches.map((s) => s.Name).join(', ')}`,
      'CLOSE_MATCH_FOUND'
    )
  } else {
    addError(
      result,
      'name',
      `Strain "${trazoName}" not found in Metrc. Create it first or use an existing strain name.`,
      'STRAIN_NOT_FOUND'
    )
  }

  return result
}

// =====================================================
// BATCH STRAIN VALIDATION
// =====================================================

/**
 * Validate that a batch has a valid strain before syncing to Metrc
 */
export function validateBatchStrainForMetrc(batch: {
  batch_number: string
  cultivar_name?: string
  cultivar?: { name?: string; metrc_strain_id?: number | null }
}): ValidationResult {
  const result = createValidationResult()

  // Get strain name from batch or cultivar
  const strainName = batch.cultivar_name || batch.cultivar?.name

  if (!strainName) {
    addError(
      result,
      'cultivar',
      'Batch must have a cultivar/strain assigned before syncing to Metrc',
      'MISSING_STRAIN'
    )
    return result
  }

  // Check if cultivar has Metrc strain ID
  if (batch.cultivar && !batch.cultivar.metrc_strain_id) {
    addWarning(
      result,
      'cultivar',
      `Cultivar "${strainName}" is not linked to a Metrc strain. Sync the cultivar first for better tracking.`,
      'STRAIN_NOT_LINKED'
    )
  }

  return result
}

/**
 * Validate batch of strain create operations
 */
export function validateStrainCreateBatch(strains: MetrcStrainCreate[]): ValidationResult {
  const result = createValidationResult()

  if (!strains || strains.length === 0) {
    addError(result, 'strains', 'At least one strain is required', 'EMPTY_ARRAY')
    return result
  }

  if (strains.length > 100) {
    addError(
      result,
      'strains',
      'Batch creation is limited to 100 strains per request',
      'BATCH_SIZE_EXCEEDED'
    )
  }

  // Validate each strain
  strains.forEach((strain, index) => {
    const strainResult = validateStrainCreate(strain)
    if (!strainResult.isValid) {
      result.isValid = false
      strainResult.errors.forEach((error) => {
        result.errors.push({
          ...error,
          field: `strains[${index}].${error.field}`,
        })
      })
    }
    strainResult.warnings.forEach((warning) => {
      result.warnings.push({
        ...warning,
        field: `strains[${index}].${warning.field}`,
      })
    })
  })

  // Check for duplicate names
  const names = strains.map((s) => s.Name.trim().toLowerCase())
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
  if (duplicates.length > 0) {
    addError(
      result,
      'strains',
      `Duplicate strain names found: ${[...new Set(duplicates)].join(', ')}`,
      'DUPLICATE_NAMES'
    )
  }

  return result
}
