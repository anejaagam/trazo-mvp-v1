/**
 * Batch Validation Rules
 *
 * Validation logic for Metrc plant batch operations
 * Includes source traceability validation for Open/Closed Loop tracking
 */

import type { ValidationResult } from '@/lib/compliance/types'
import type {
  MetrcPlantBatchCreate,
  MetrcPlantBatchAdjustment,
  MetrcPlantBatchSplit,
} from '../types'
import {
  createValidationResult,
  validateRequired,
  validateDate,
  validatePositiveNumber,
  validateArrayNotEmpty,
  validateDateNotInFuture,
  addError,
  addWarning,
} from './validators'
import {
  requiresSourceTracking,
  getStatePlantBatchConfig,
  validateTagFormat,
} from '@/lib/jurisdiction/plant-batch-config'
import type { TrackingMode } from '@/types/batch'

/**
 * Validate plant batch creation
 */
export function validatePlantBatchCreate(batch: MetrcPlantBatchCreate): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'Name', batch.Name)
  validateRequired(result, 'Type', batch.Type)
  validateRequired(result, 'Count', batch.Count)
  validateRequired(result, 'Strain', batch.Strain)
  validateRequired(result, 'Location', batch.Location)
  // Accept either ActualDate (v2) or PlantedDate (legacy)
  const hasDate = batch.ActualDate || batch.PlantedDate
  if (!hasDate) {
    validateRequired(result, 'ActualDate/PlantedDate', undefined)
  }

  // Type validation
  if (batch.Type && !['Seed', 'Clone'].includes(batch.Type)) {
    addError(
      result,
      'Type',
      'Type must be either "Seed" or "Clone"',
      'INVALID_BATCH_TYPE'
    )
  }

  // Count validation
  if (batch.Count !== undefined) {
    validatePositiveNumber(result, 'Count', batch.Count)

    // Warn if count is unusually high
    if (batch.Count > 10000) {
      addWarning(
        result,
        'Count',
        'Plant count is unusually high (>10,000). Please verify.',
        'HIGH_PLANT_COUNT'
      )
    }
  }

  // Name validation - Metrc batch names have constraints
  if (batch.Name) {
    if (batch.Name.length < 3) {
      addError(
        result,
        'Name',
        'Batch name must be at least 3 characters',
        'INVALID_NAME_LENGTH'
      )
    }
    if (batch.Name.length > 50) {
      addError(
        result,
        'Name',
        'Batch name must not exceed 50 characters',
        'INVALID_NAME_LENGTH'
      )
    }
    // Check for special characters that Metrc might not accept
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(batch.Name)) {
      addWarning(
        result,
        'Name',
        'Batch name contains special characters that may not be accepted by Metrc',
        'SPECIAL_CHARACTERS_IN_NAME'
      )
    }
  }

  // Strain validation
  if (batch.Strain && batch.Strain.length === 0) {
    addError(
      result,
      'Strain',
      'Strain name cannot be empty',
      'EMPTY_STRAIN_NAME'
    )
  }

  // Location validation
  if (batch.Location && batch.Location.length === 0) {
    addError(
      result,
      'Location',
      'Location cannot be empty',
      'EMPTY_LOCATION'
    )
  }

  // Date validation - check either ActualDate or PlantedDate
  const dateToValidate = batch.ActualDate || batch.PlantedDate
  const dateFieldName = batch.ActualDate ? 'ActualDate' : 'PlantedDate'
  if (dateToValidate) {
    validateDate(result, dateFieldName, dateToValidate)
    validateDateNotInFuture(result, dateFieldName, dateToValidate)

    // Warn if planted date is more than 1 year ago
    const plantedDate = new Date(dateToValidate)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    if (plantedDate < oneYearAgo) {
      addWarning(
        result,
        dateFieldName,
        'Planted date is more than 1 year ago',
        'OLD_PLANTED_DATE'
      )
    }
  }

  return result
}

/**
 * Validate plant batch adjustment
 */
export function validatePlantBatchAdjustment(
  adjustment: MetrcPlantBatchAdjustment
): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'Id', adjustment.Id)
  validateRequired(result, 'Count', adjustment.Count)
  validateRequired(result, 'AdjustmentReason', adjustment.AdjustmentReason)
  validateRequired(result, 'AdjustmentDate', adjustment.AdjustmentDate)

  // Count validation (can be negative for decreases)
  if (adjustment.Count !== undefined && typeof adjustment.Count !== 'number') {
    addError(result, 'Count', 'Count must be a number', 'INVALID_NUMBER')
  }

  // Adjustment reason validation
  const validReasons = [
    'Mandatory State Destruction',
    'Voluntary Destruction',
    'Contamination',
    'Infestation',
    'Died',
    'Unhealthy or Infirm Plants',
    'Error',
    'Other',
  ]

  if (adjustment.AdjustmentReason && !validReasons.includes(adjustment.AdjustmentReason)) {
    addWarning(
      result,
      'AdjustmentReason',
      `Adjustment reason may not be recognized by Metrc. Valid reasons: ${validReasons.join(', ')}`,
      'UNRECOGNIZED_ADJUSTMENT_REASON'
    )
  }

  // Date validation
  if (adjustment.AdjustmentDate) {
    validateDate(result, 'AdjustmentDate', adjustment.AdjustmentDate)
    validateDateNotInFuture(result, 'AdjustmentDate', adjustment.AdjustmentDate)
  }

  return result
}

/**
 * Validate plant batch split
 */
export function validatePlantBatchSplit(split: MetrcPlantBatchSplit): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'PlantBatch', split.PlantBatch)
  validateRequired(result, 'GroupName', split.GroupName)
  validateRequired(result, 'Count', split.Count)
  validateRequired(result, 'Location', split.Location)
  validateRequired(result, 'Strain', split.Strain)
  validateRequired(result, 'SplitDate', split.SplitDate)

  // Count validation
  if (split.Count !== undefined) {
    validatePositiveNumber(result, 'Count', split.Count)
  }

  // Group name validation
  if (split.GroupName) {
    if (split.GroupName.length < 3) {
      addError(
        result,
        'GroupName',
        'Group name must be at least 3 characters',
        'INVALID_NAME_LENGTH'
      )
    }
  }

  // Date validation
  if (split.SplitDate) {
    validateDate(result, 'SplitDate', split.SplitDate)
    validateDateNotInFuture(result, 'SplitDate', split.SplitDate)
  }

  return result
}

/**
 * Validate batch of plant batch create operations
 */
export function validatePlantBatchCreateBatch(
  batches: MetrcPlantBatchCreate[]
): ValidationResult {
  const result = createValidationResult()

  if (!validateArrayNotEmpty(result, 'batches', batches)) {
    return result
  }

  // Metrc typically limits batch operations to 100 items
  if (batches.length > 100) {
    addError(
      result,
      'batches',
      'Batch creation is limited to 100 batches per request',
      'BATCH_SIZE_EXCEEDED'
    )
  }

  // Validate each batch
  batches.forEach((batch, index) => {
    const batchResult = validatePlantBatchCreate(batch)
    if (!batchResult.isValid) {
      result.isValid = false
      batchResult.errors.forEach((error) => {
        result.errors.push({
          ...error,
          field: `batches[${index}].${error.field}`,
        })
      })
    }
    batchResult.warnings.forEach((warning) => {
      result.warnings.push({
        ...warning,
        field: `batches[${index}].${warning.field}`,
      })
    })
  })

  // Check for duplicate batch names
  const names = batches.map((b) => b.Name)
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
  if (duplicates.length > 0) {
    addWarning(
      result,
      'batches',
      `Duplicate batch names found: ${[...new Set(duplicates)].join(', ')}`,
      'DUPLICATE_BATCH_NAMES'
    )
  }

  return result
}

/**
 * Validate TRAZO batch data before converting to Metrc format
 */
export function validateTrazoToMetrcBatchConversion(trazoBatch: {
  batch_number: string
  plant_count: number
  cultivar_name?: string
  start_date: string
  stage: string
  domain_type?: string
}): ValidationResult {
  const result = createValidationResult()

  // Check domain type
  if (trazoBatch.domain_type && trazoBatch.domain_type !== 'cannabis') {
    addError(
      result,
      'domain_type',
      'Only cannabis batches can be synced to Metrc',
      'INVALID_DOMAIN_TYPE'
    )
  }

  // Check plant count
  if (trazoBatch.plant_count <= 0) {
    addError(
      result,
      'plant_count',
      'Plant count must be greater than 0',
      'INVALID_PLANT_COUNT'
    )
  }

  // Check cultivar
  if (!trazoBatch.cultivar_name || trazoBatch.cultivar_name.trim().length === 0) {
    addError(
      result,
      'cultivar_name',
      'Cultivar/strain name is required for Metrc sync',
      'MISSING_CULTIVAR'
    )
  }

  // Check stage compatibility
  const validStages = ['germination', 'clone', 'vegetative', 'flowering']
  if (!validStages.includes(trazoBatch.stage)) {
    addWarning(
      result,
      'stage',
      `Batch stage "${trazoBatch.stage}" may not map to a valid Metrc plant batch stage`,
      'INVALID_STAGE_FOR_SYNC'
    )
  }

  return result
}

/**
 * Validate plant count adjustment before syncing to Metrc
 */
export function validatePlantCountAdjustment(adjustment: {
  batchId: string
  oldCount: number
  newCount: number
  reason: string
  adjustmentDate: string
}): ValidationResult {
  const result = createValidationResult()

  // Validate batch ID
  validateRequired(result, 'batchId', adjustment.batchId)

  // Validate counts
  if (adjustment.newCount < 0) {
    addError(result, 'newCount', 'Plant count cannot be negative', 'INVALID_COUNT')
  }

  if (adjustment.oldCount < 0) {
    addError(result, 'oldCount', 'Old plant count cannot be negative', 'INVALID_COUNT')
  }

  const difference = adjustment.newCount - adjustment.oldCount

  // Warn on large decreases (>20%)
  if (difference < 0 && adjustment.oldCount > 0) {
    const percentDecrease = Math.abs(difference) / adjustment.oldCount
    if (percentDecrease > 0.2) {
      addWarning(
        result,
        'newCount',
        `Large decrease (${Math.abs(difference)} plants, ${Math.round(percentDecrease * 100)}%). Please verify.`,
        'LARGE_DECREASE'
      )
    }
  }

  // Warn on increases (unusual for plant batches)
  if (difference > 0) {
    addWarning(
      result,
      'newCount',
      'Plant count increase is unusual. Verify this is not a data error.',
      'COUNT_INCREASE'
    )
  }

  // Validate reason
  const validReasons = [
    'Died',
    'Voluntary Destruction',
    'Mandatory State Destruction',
    'Contamination',
    'Infestation',
    'Unhealthy or Infirm Plants',
    'Error',
    'Other',
  ]

  if (!validReasons.includes(adjustment.reason)) {
    addError(
      result,
      'reason',
      `Invalid adjustment reason. Must be one of: ${validReasons.join(', ')}`,
      'INVALID_REASON'
    )
  }

  // Validate date
  validateDate(result, 'adjustmentDate', adjustment.adjustmentDate)
  validateDateNotInFuture(result, 'adjustmentDate', adjustment.adjustmentDate)

  return result
}

// =====================================================
// SOURCE TRACEABILITY VALIDATION
// =====================================================

/**
 * Input type for source validation
 */
export interface BatchSourceInput {
  stateCode: string
  sourcePackageTag?: string
  sourceMotherPlantTag?: string
  sourceMotherPlantTags?: string[]
  trackingMode?: TrackingMode
}

/**
 * Validate batch source traceability based on state requirements
 */
export function validateBatchSource(input: BatchSourceInput): ValidationResult {
  const result = createValidationResult()
  const { stateCode, sourcePackageTag, sourceMotherPlantTag, sourceMotherPlantTags } = input

  // Check if state requires source tracking
  if (requiresSourceTracking(stateCode)) {
    const hasPackageSource = sourcePackageTag && sourcePackageTag.trim().length > 0
    const hasMotherSource =
      (sourceMotherPlantTag && sourceMotherPlantTag.trim().length > 0) ||
      (sourceMotherPlantTags && sourceMotherPlantTags.length > 0)

    if (!hasPackageSource && !hasMotherSource) {
      addError(
        result,
        'source',
        `${stateCode} requires source traceability. Provide either a source package tag or mother plant tag(s).`,
        'SOURCE_REQUIRED'
      )
    }

    // Can't have both source types
    if (hasPackageSource && hasMotherSource) {
      addWarning(
        result,
        'source',
        'Both package and mother plant sources provided. Only one will be used.',
        'MULTIPLE_SOURCES'
      )
    }
  }

  // Validate package tag format if provided
  if (sourcePackageTag && sourcePackageTag.trim().length > 0) {
    if (!validateTagFormat(stateCode, sourcePackageTag)) {
      addWarning(
        result,
        'sourcePackageTag',
        `Package tag format may not match ${stateCode} requirements`,
        'INVALID_TAG_FORMAT'
      )
    }
  }

  // Validate mother plant tag format if provided
  const allMotherTags = [
    ...(sourceMotherPlantTag ? [sourceMotherPlantTag] : []),
    ...(sourceMotherPlantTags || []),
  ]

  for (const tag of allMotherTags) {
    if (tag && tag.trim().length > 0 && !validateTagFormat(stateCode, tag)) {
      addWarning(
        result,
        'sourceMotherPlantTag',
        `Mother plant tag "${tag}" format may not match ${stateCode} requirements`,
        'INVALID_TAG_FORMAT'
      )
    }
  }

  return result
}

/**
 * Validate tracking mode for a batch based on state requirements
 */
export function validateTrackingMode(
  stateCode: string,
  trackingMode: TrackingMode | undefined,
  hasIndividualTags: boolean
): ValidationResult {
  const result = createValidationResult()
  const config = getStatePlantBatchConfig(stateCode)

  if (!config) {
    addWarning(result, 'stateCode', `Unknown state code: ${stateCode}`, 'UNKNOWN_STATE')
    return result
  }

  // If state defaults to closed_loop, tracking mode should be closed_loop
  if (config.defaultTrackingMode === 'closed_loop' && trackingMode !== 'closed_loop') {
    addWarning(
      result,
      'trackingMode',
      `${stateCode} typically requires closed loop tracking from the start`,
      'TRACKING_MODE_MISMATCH'
    )
  }

  // If batch has individual tags but tracking mode is open_loop, warn
  if (hasIndividualTags && trackingMode === 'open_loop') {
    addWarning(
      result,
      'trackingMode',
      'Batch has individual plant tags but tracking mode is still open_loop',
      'INCONSISTENT_TRACKING'
    )
  }

  // If state doesn't allow mode switch but we're trying to change, error
  if (!config.allowModeSwitch && trackingMode !== config.defaultTrackingMode) {
    addError(
      result,
      'trackingMode',
      `${stateCode} does not allow switching tracking modes. Must use ${config.defaultTrackingMode}.`,
      'MODE_SWITCH_NOT_ALLOWED'
    )
  }

  return result
}

/**
 * Validate batch creation with full source and tracking mode validation
 */
export function validateBatchCreateWithSource(input: {
  stateCode: string
  batchNumber: string
  plantCount: number
  cultivarName?: string
  startDate: string
  sourcePackageTag?: string
  sourceMotherPlantTag?: string
  trackingMode?: TrackingMode
}): ValidationResult {
  const result = createValidationResult()

  // Basic validation
  validateRequired(result, 'batchNumber', input.batchNumber)
  validatePositiveNumber(result, 'plantCount', input.plantCount)
  validateDate(result, 'startDate', input.startDate)

  if (!input.cultivarName || input.cultivarName.trim().length === 0) {
    addError(result, 'cultivarName', 'Cultivar/strain name is required', 'MISSING_CULTIVAR')
  }

  // Source validation
  const sourceResult = validateBatchSource({
    stateCode: input.stateCode,
    sourcePackageTag: input.sourcePackageTag,
    sourceMotherPlantTag: input.sourceMotherPlantTag,
    trackingMode: input.trackingMode,
  })

  // Merge source validation results
  result.isValid = result.isValid && sourceResult.isValid
  result.errors.push(...sourceResult.errors)
  result.warnings.push(...sourceResult.warnings)

  // Plant count limit validation
  const config = getStatePlantBatchConfig(input.stateCode)
  if (config && input.plantCount > config.maxPlantsPerBatch) {
    addWarning(
      result,
      'plantCount',
      `Plant count (${input.plantCount}) exceeds typical batch limit for ${input.stateCode} (${config.maxPlantsPerBatch}). Consider splitting into multiple batches.`,
      'EXCEEDS_BATCH_LIMIT'
    )
  }

  return result
}
