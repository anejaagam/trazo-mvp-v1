/**
 * Per-Plant Harvest Validation Rules
 *
 * Validates individual plant harvest data, package traceability,
 * and tag inventory operations
 */

import type { ValidationResult } from '@/lib/compliance/types'
import {
  createValidationResult,
  validateRequired,
  validatePositiveNumber,
  addError,
  addWarning,
} from './validators'

// =====================================================
// PER-PLANT HARVEST VALIDATION
// =====================================================

/**
 * Validate individual plant harvest record
 */
export function validatePlantHarvestCreate(plant: {
  plant_tag: string
  wet_weight_g: number
  quality_grade?: string
  harvest_id: string
  batch_id: string
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'plant_tag', plant.plant_tag)
  validateRequired(result, 'wet_weight_g', plant.wet_weight_g)
  validateRequired(result, 'harvest_id', plant.harvest_id)
  validateRequired(result, 'batch_id', plant.batch_id)

  // Validate plant tag format (Metrc format: 1A[StateCode][License][Sequence])
  if (plant.plant_tag) {
    const tagRegex = /^1A[A-Z0-9]{7}\d{12}$/
    if (!tagRegex.test(plant.plant_tag)) {
      addError(
        result,
        'plant_tag',
        'Invalid Metrc plant tag format (22 characters: 1A + 7 alphanumeric + 12 digits)',
        'INVALID_TAG_FORMAT'
      )
    }
  }

  // Validate wet weight
  if (plant.wet_weight_g !== undefined) {
    validatePositiveNumber(result, 'wet_weight_g', plant.wet_weight_g)

    // Warn for unusually low weight (<10g)
    if (plant.wet_weight_g < 10) {
      addWarning(
        result,
        'wet_weight_g',
        'Wet weight is very low (<10g). Verify measurement.',
        'LOW_PLANT_WEIGHT'
      )
    }

    // Warn for unusually high weight (>2000g = 2kg per plant)
    if (plant.wet_weight_g > 2000) {
      addWarning(
        result,
        'wet_weight_g',
        'Wet weight is unusually high (>2kg). Verify measurement.',
        'HIGH_PLANT_WEIGHT'
      )
    }
  }

  // Validate quality grade
  const validGrades = ['A', 'B', 'C', 'Waste']
  if (plant.quality_grade && !validGrades.includes(plant.quality_grade)) {
    addError(
      result,
      'quality_grade',
      `Invalid quality grade. Must be one of: ${validGrades.join(', ')}`,
      'INVALID_QUALITY_GRADE'
    )
  }

  return result
}

/**
 * Validate batch of plant harvest records
 */
export function validatePlantHarvestBatch(
  plants: Array<{
    plant_tag: string
    wet_weight_g: number
    quality_grade?: string
  }>
): ValidationResult {
  const result = createValidationResult()

  // Check batch size
  if (plants.length === 0) {
    addError(result, 'plants', 'At least one plant record is required', 'EMPTY_BATCH')
    return result
  }

  if (plants.length > 1000) {
    addError(
      result,
      'plants',
      'Cannot process more than 1000 plants at once',
      'BATCH_TOO_LARGE'
    )
    return result
  }

  // Check for duplicate plant tags
  const plantTags = plants.map((p) => p.plant_tag)
  const duplicates = plantTags.filter((tag, index) => plantTags.indexOf(tag) !== index)

  if (duplicates.length > 0) {
    addError(
      result,
      'plants',
      `Duplicate plant tags found: ${[...new Set(duplicates)].join(', ')}`,
      'DUPLICATE_PLANT_TAGS'
    )
  }

  // Validate each plant
  plants.forEach((plant, index) => {
    const plantValidation = validatePlantHarvestCreate({
      ...plant,
      harvest_id: '', // Will be set by caller
      batch_id: '', // Will be set by caller
    })

    // Add errors with plant index
    plantValidation.errors.forEach((error) => {
      addError(
        result,
        `plants[${index}].${error.field}`,
        error.message,
        error.code
      )
    })

    // Add warnings with plant index
    plantValidation.warnings.forEach((warning) => {
      addWarning(
        result,
        `plants[${index}].${warning.field}`,
        warning.message,
        warning.code
      )
    })
  })

  return result
}

/**
 * Validate dry weight update for plant
 */
export function validatePlantDryWeightUpdate(update: {
  wet_weight_g: number
  dry_weight_g: number
  flower_weight_g?: number
  trim_weight_g?: number
  shake_weight_g?: number
  waste_weight_g?: number
}): ValidationResult {
  const result = createValidationResult()

  validateRequired(result, 'wet_weight_g', update.wet_weight_g)
  validateRequired(result, 'dry_weight_g', update.dry_weight_g)

  if (update.wet_weight_g && update.dry_weight_g) {
    // Dry weight should be less than wet weight
    if (update.dry_weight_g > update.wet_weight_g) {
      addError(
        result,
        'dry_weight_g',
        'Dry weight cannot exceed wet weight',
        'DRY_EXCEEDS_WET'
      )
    }

    // Calculate moisture loss percentage
    const moistureLoss = ((update.wet_weight_g - update.dry_weight_g) / update.wet_weight_g) * 100

    // Typical cannabis moisture loss is 65-85%
    if (moistureLoss < 50) {
      addWarning(
        result,
        'dry_weight_g',
        `Moisture loss is only ${moistureLoss.toFixed(1)}% (expected 65-85%). Verify drying process.`,
        'LOW_MOISTURE_LOSS'
      )
    }

    if (moistureLoss > 90) {
      addWarning(
        result,
        'dry_weight_g',
        `Moisture loss is ${moistureLoss.toFixed(1)}% (expected 65-85%). May indicate over-drying.`,
        'HIGH_MOISTURE_LOSS'
      )
    }
  }

  // Validate component weights if provided
  const totalComponents =
    (update.flower_weight_g || 0) +
    (update.trim_weight_g || 0) +
    (update.shake_weight_g || 0) +
    (update.waste_weight_g || 0)

  if (
    totalComponents > 0 &&
    update.dry_weight_g &&
    Math.abs(totalComponents - update.dry_weight_g) > 1
  ) {
    addWarning(
      result,
      'dry_weight_g',
      `Component weights (${totalComponents}g) don't match dry weight (${update.dry_weight_g}g)`,
      'WEIGHT_MISMATCH'
    )
  }

  return result
}

// =====================================================
// PACKAGE-TO-PLANT TRACEABILITY VALIDATION
// =====================================================

/**
 * Validate package plant source linkage
 */
export function validatePackagePlantSource(source: {
  package_id: string
  plant_tag: string
  weight_contributed_g: number
  source_type: string
}): ValidationResult {
  const result = createValidationResult()

  validateRequired(result, 'package_id', source.package_id)
  validateRequired(result, 'plant_tag', source.plant_tag)
  validateRequired(result, 'weight_contributed_g', source.weight_contributed_g)
  validateRequired(result, 'source_type', source.source_type)

  // Validate plant tag format
  if (source.plant_tag) {
    const tagRegex = /^1A[A-Z0-9]{7}\d{12}$/
    if (!tagRegex.test(source.plant_tag)) {
      addError(
        result,
        'plant_tag',
        'Invalid Metrc plant tag format',
        'INVALID_TAG_FORMAT'
      )
    }
  }

  // Validate weight
  if (source.weight_contributed_g !== undefined) {
    validatePositiveNumber(result, 'weight_contributed_g', source.weight_contributed_g)

    if (source.weight_contributed_g < 0.1) {
      addWarning(
        result,
        'weight_contributed_g',
        'Very small contribution (<0.1g). Verify measurement.',
        'SMALL_CONTRIBUTION'
      )
    }
  }

  // Validate source type
  const validSourceTypes = ['flower', 'trim', 'shake', 'waste']
  if (source.source_type && !validSourceTypes.includes(source.source_type)) {
    addError(
      result,
      'source_type',
      `Invalid source type. Must be one of: ${validSourceTypes.join(', ')}`,
      'INVALID_SOURCE_TYPE'
    )
  }

  return result
}

/**
 * Validate package traceability (all sources for a package)
 */
export function validatePackageTraceability(
  packageWeight: number,
  plantSources: Array<{
    plant_tag: string
    weight_contributed_g: number
    source_type: string
  }>
): ValidationResult {
  const result = createValidationResult()

  if (plantSources.length === 0) {
    addError(
      result,
      'plant_sources',
      'At least one plant source is required for traceability',
      'NO_PLANT_SOURCES'
    )
    return result
  }

  // Validate each source
  plantSources.forEach((source, index) => {
    const sourceValidation = validatePackagePlantSource({
      ...source,
      package_id: '', // Will be set by caller
    })

    sourceValidation.errors.forEach((error) => {
      addError(
        result,
        `plant_sources[${index}].${error.field}`,
        error.message,
        error.code
      )
    })

    sourceValidation.warnings.forEach((warning) => {
      addWarning(
        result,
        `plant_sources[${index}].${warning.field}`,
        warning.message,
        warning.code
      )
    })
  })

  // Check total contributed weight matches package weight
  const totalContributed = plantSources.reduce(
    (sum, source) => sum + source.weight_contributed_g,
    0
  )

  // Allow 1% tolerance for rounding
  const tolerance = packageWeight * 0.01
  if (Math.abs(totalContributed - packageWeight) > tolerance) {
    addWarning(
      result,
      'plant_sources',
      `Total contributed weight (${totalContributed}g) doesn't match package weight (${packageWeight}g)`,
      'WEIGHT_MISMATCH'
    )
  }

  // Check for duplicate plant tags with same source type
  const sourceKeys = plantSources.map((s) => `${s.plant_tag}:${s.source_type}`)
  const duplicates = sourceKeys.filter((key, index) => sourceKeys.indexOf(key) !== index)

  if (duplicates.length > 0) {
    addError(
      result,
      'plant_sources',
      'Duplicate plant tag and source type combinations found',
      'DUPLICATE_SOURCES'
    )
  }

  return result
}

// =====================================================
// TAG INVENTORY VALIDATION
// =====================================================

/**
 * Validate tag receipt (bulk import)
 */
export function validateTagReceipt(tags: Array<{
  tag_number: string
  tag_type: string
  site_id: string
}>): ValidationResult {
  const result = createValidationResult()

  if (tags.length === 0) {
    addError(result, 'tags', 'At least one tag is required', 'EMPTY_BATCH')
    return result
  }

  if (tags.length > 10000) {
    addError(
      result,
      'tags',
      'Cannot receive more than 10,000 tags at once',
      'BATCH_TOO_LARGE'
    )
    return result
  }

  // Check for duplicate tag numbers
  const tagNumbers = tags.map((t) => t.tag_number)
  const duplicates = tagNumbers.filter((num, index) => tagNumbers.indexOf(num) !== index)

  if (duplicates.length > 0) {
    addError(
      result,
      'tags',
      `Duplicate tag numbers found: ${[...new Set(duplicates)].slice(0, 10).join(', ')}${duplicates.length > 10 ? '...' : ''}`,
      'DUPLICATE_TAG_NUMBERS'
    )
  }

  // Validate each tag
  tags.forEach((tag, index) => {
    validateRequired(result, `tags[${index}].tag_number`, tag.tag_number)
    validateRequired(result, `tags[${index}].tag_type`, tag.tag_type)
    validateRequired(result, `tags[${index}].site_id`, tag.site_id)

    // Validate tag type
    const validTypes = ['Plant', 'Package', 'Location']
    if (tag.tag_type && !validTypes.includes(tag.tag_type)) {
      addError(
        result,
        `tags[${index}].tag_type`,
        `Invalid tag type. Must be one of: ${validTypes.join(', ')}`,
        'INVALID_TAG_TYPE'
      )
    }

    // Validate tag number format (Metrc format)
    if (tag.tag_number) {
      const tagRegex = /^1A[A-Z0-9]{7}\d{12}$/
      if (!tagRegex.test(tag.tag_number)) {
        addError(
          result,
          `tags[${index}].tag_number`,
          'Invalid Metrc tag format (22 characters)',
          'INVALID_TAG_FORMAT'
        )
      }
    }
  })

  return result
}

/**
 * Validate tag assignment
 */
export function validateTagAssignment(assignment: {
  tag_id: string
  assigned_to_type: string
  assigned_to_id: string
}): ValidationResult {
  const result = createValidationResult()

  validateRequired(result, 'tag_id', assignment.tag_id)
  validateRequired(result, 'assigned_to_type', assignment.assigned_to_type)
  validateRequired(result, 'assigned_to_id', assignment.assigned_to_id)

  // Validate assigned_to_type
  const validTypes = ['batch', 'plant', 'package', 'location']
  if (assignment.assigned_to_type && !validTypes.includes(assignment.assigned_to_type)) {
    addError(
      result,
      'assigned_to_type',
      `Invalid assignment type. Must be one of: ${validTypes.join(', ')}`,
      'INVALID_ASSIGNMENT_TYPE'
    )
  }

  return result
}

/**
 * Validate tag deactivation
 */
export function validateTagDeactivation(deactivation: {
  tag_id: string
  reason: string
}): ValidationResult {
  const result = createValidationResult()

  validateRequired(result, 'tag_id', deactivation.tag_id)
  validateRequired(result, 'reason', deactivation.reason)

  if (deactivation.reason && deactivation.reason.length < 10) {
    addWarning(
      result,
      'reason',
      'Deactivation reason should be more descriptive (min 10 characters)',
      'SHORT_REASON'
    )
  }

  return result
}
