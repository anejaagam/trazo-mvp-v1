/**
 * Plant Validation Rules
 *
 * Validation logic for Metrc plant and plant batch operations
 */

import type { ValidationResult } from '@/lib/compliance/types'
import type {
  MetrcPlantingCreate,
  MetrcPlantGrowthPhaseChange,
  MetrcPlantMove,
  MetrcPlantDestroy,
  MetrcPlantBatchCreate,
  MetrcPlantBatchAdjustment,
} from '../types'
import {
  createValidationResult,
  validateRequired,
  validateDate,
  validatePositiveNumber,
  validateDateNotInFuture,
  validateMetrcTag,
  addError,
} from './validators'

/**
 * Validate planting creation
 */
export function validatePlantingCreate(planting: MetrcPlantingCreate): ValidationResult {
  const result = createValidationResult()

  validateRequired(result, 'PlantBatch', planting.PlantBatch)
  validateRequired(result, 'PlantCount', planting.PlantCount)
  validateRequired(result, 'Location', planting.Location)
  validateRequired(result, 'Strain', planting.Strain)
  validateRequired(result, 'PlantedDate', planting.PlantedDate)

  if (planting.PlantCount !== undefined) {
    validatePositiveNumber(result, 'PlantCount', planting.PlantCount)
  }

  if (planting.PlantedDate) {
    validateDate(result, 'PlantedDate', planting.PlantedDate)
    validateDateNotInFuture(result, 'PlantedDate', planting.PlantedDate)
  }

  return result
}

/**
 * Validate plant growth phase change
 */
export function validatePlantGrowthPhaseChange(
  change: MetrcPlantGrowthPhaseChange
): ValidationResult {
  const result = createValidationResult()

  validateRequired(result, 'Label', change.Label)
  validateRequired(result, 'NewLocation', change.NewLocation)
  validateRequired(result, 'GrowthPhase', change.GrowthPhase)
  validateRequired(result, 'GrowthDate', change.GrowthDate)

  if (change.Label) {
    validateMetrcTag(result, 'Label', change.Label)
  }

  if (change.GrowthPhase && !['Vegetative', 'Flowering'].includes(change.GrowthPhase)) {
    addError(
      result,
      'GrowthPhase',
      'GrowthPhase must be either "Vegetative" or "Flowering"',
      'INVALID_GROWTH_PHASE'
    )
  }

  if (change.GrowthDate) {
    validateDate(result, 'GrowthDate', change.GrowthDate)
    validateDateNotInFuture(result, 'GrowthDate', change.GrowthDate)
  }

  return result
}

/**
 * Validate plant move
 */
export function validatePlantMove(move: MetrcPlantMove): ValidationResult {
  const result = createValidationResult()

  validateRequired(result, 'Label', move.Label)
  validateRequired(result, 'Location', move.Location)
  validateRequired(result, 'MoveDate', move.MoveDate)

  if (move.Label) {
    validateMetrcTag(result, 'Label', move.Label)
  }

  if (move.MoveDate) {
    validateDate(result, 'MoveDate', move.MoveDate)
    validateDateNotInFuture(result, 'MoveDate', move.MoveDate)
  }

  return result
}

/**
 * Validate plant destroy
 */
export function validatePlantDestroy(destroy: MetrcPlantDestroy): ValidationResult {
  const result = createValidationResult()

  validateRequired(result, 'Label', destroy.Label)
  validateRequired(result, 'ReasonNote', destroy.ReasonNote)
  validateRequired(result, 'ActualDate', destroy.ActualDate)

  if (destroy.Label) {
    validateMetrcTag(result, 'Label', destroy.Label)
  }

  if (destroy.ActualDate) {
    validateDate(result, 'ActualDate', destroy.ActualDate)
    validateDateNotInFuture(result, 'ActualDate', destroy.ActualDate)
  }

  return result
}

/**
 * Validate plant batch creation
 */
export function validatePlantBatchCreate(batch: MetrcPlantBatchCreate): ValidationResult {
  const result = createValidationResult()

  validateRequired(result, 'Name', batch.Name)
  validateRequired(result, 'Type', batch.Type)
  validateRequired(result, 'Count', batch.Count)
  validateRequired(result, 'Strain', batch.Strain)
  validateRequired(result, 'Location', batch.Location)
  validateRequired(result, 'PlantedDate', batch.PlantedDate)

  if (batch.Type && !['Seed', 'Clone'].includes(batch.Type)) {
    addError(
      result,
      'Type',
      'Type must be either "Seed" or "Clone"',
      'INVALID_BATCH_TYPE'
    )
  }

  if (batch.Count !== undefined) {
    validatePositiveNumber(result, 'Count', batch.Count)
  }

  if (batch.PlantedDate) {
    validateDate(result, 'PlantedDate', batch.PlantedDate)
    validateDateNotInFuture(result, 'PlantedDate', batch.PlantedDate)
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

  validateRequired(result, 'Id', adjustment.Id)
  validateRequired(result, 'Count', adjustment.Count)
  validateRequired(result, 'AdjustmentReason', adjustment.AdjustmentReason)
  validateRequired(result, 'AdjustmentDate', adjustment.AdjustmentDate)

  if (adjustment.Count !== undefined && typeof adjustment.Count !== 'number') {
    addError(result, 'Count', 'Count must be a number', 'INVALID_NUMBER')
  }

  if (adjustment.AdjustmentDate) {
    validateDate(result, 'AdjustmentDate', adjustment.AdjustmentDate)
    validateDateNotInFuture(result, 'AdjustmentDate', adjustment.AdjustmentDate)
  }

  return result
}
