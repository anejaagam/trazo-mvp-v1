/**
 * Tag Assignment Validation Rules
 *
 * Validates Metrc plant tag assignments for batch tracking
 */

import type { ValidationResult } from '@/lib/compliance/types'
import {
  createValidationResult,
  validateRequired,
  addError,
  addWarning,
} from './validators'

/**
 * Metrc tag format: 1A4FF01000000220000001
 * Format: [State Code][License][Sequence]
 * Example: 1A4FF01 (CA license) + 0000002 (facility) + 2000000 (sequence) + 1 (tag)
 * Total: 22 characters (1A + 5 alphanumeric + 15 digits)
 */
const METRC_TAG_REGEX = /^1A[A-Z0-9]{5}\d{15}$/

/**
 * Validate Metrc tag format
 */
export function validateMetrcTagFormat(tag: string): ValidationResult {
  const result = createValidationResult()

  if (!tag || tag.trim().length === 0) {
    addError(result, 'tag', 'Tag cannot be empty', 'EMPTY_TAG')
    return result
  }

  if (!METRC_TAG_REGEX.test(tag)) {
    addError(
      result,
      'tag',
      'Invalid Metrc tag format. Expected: 1A[StateCode][License][Sequence] (22 chars)',
      'INVALID_TAG_FORMAT'
    )
  }

  return result
}

/**
 * Validate tag assignment to batch
 */
export function validateTagAssignment(assignment: {
  batchId: string
  tags: string[]
  currentPlantCount?: number
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'batchId', assignment.batchId)

  // Validate tags array
  if (!assignment.tags || assignment.tags.length === 0) {
    addError(result, 'tags', 'At least one tag is required', 'EMPTY_TAGS')
    return result
  }

  // Check for duplicate tags first
  const uniqueTags = new Set(assignment.tags)
  if (uniqueTags.size !== assignment.tags.length) {
    addError(
      result,
      'tags',
      'Duplicate tags found. Each tag must be unique.',
      'DUPLICATE_TAGS'
    )
  }

  // Validate each tag format
  assignment.tags.forEach((tag, index) => {
    const tagValidation = validateMetrcTagFormat(tag)
    if (!tagValidation.isValid) {
      tagValidation.errors.forEach((error) => {
        result.errors.push({
          ...error,
          field: `tags[${index}]`,
        })
      })
      result.isValid = false
    }
  })

  // Warn if tag count doesn't match plant count
  if (assignment.currentPlantCount &&
      assignment.tags.length !== assignment.currentPlantCount) {
    addWarning(
      result,
      'tags',
      `Tag count (${assignment.tags.length}) does not match plant count (${assignment.currentPlantCount})`,
      'TAG_COUNT_MISMATCH'
    )
  }

  // Metrc typically limits batch size to 100 plants
  if (assignment.tags.length > 100) {
    addWarning(
      result,
      'tags',
      'Batch has more than 100 plants. Consider splitting for better tracking.',
      'LARGE_BATCH'
    )
  }

  return result
}

/**
 * Validate tag availability (not already used)
 */
export function validateTagAvailability(tags: string[]): ValidationResult {
  const result = createValidationResult()

  // This will be implemented with database checks in the sync service
  // For now, just validate format
  tags.forEach((tag, index) => {
    const tagValidation = validateMetrcTagFormat(tag)
    if (!tagValidation.isValid) {
      result.isValid = false
      result.errors.push(...tagValidation.errors.map((e) => ({
        ...e,
        field: `tags[${index}]`,
      })))
    }
  })

  return result
}
