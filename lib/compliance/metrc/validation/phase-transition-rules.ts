/**
 * Phase Transition Validation Rules
 *
 * Validates Metrc growth phase transitions when TRAZO batch stages change
 */

import type { ValidationResult } from '@/lib/compliance/types'
import type { BatchStage } from '@/types/batch'
import type { MetrcPlantGrowthPhaseChange } from '../types'
import {
  createValidationResult,
  validateRequired,
  validateDate,
  validateDateNotInFuture,
  addError,
  addWarning,
} from './validators'

export type MetrcGrowthPhase = 'Clone' | 'Vegetative' | 'Flowering'

/**
 * Map TRAZO batch stage to Metrc growth phase
 */
export function mapStageToMetrcPhase(stage: BatchStage): MetrcGrowthPhase | null {
  const stageMap: Record<string, MetrcGrowthPhase> = {
    germination: 'Clone',
    clone: 'Clone',
    vegetative: 'Vegetative',
    flowering: 'Flowering',
  }

  return stageMap[stage] || null
}

/**
 * Check if stage transition requires Metrc phase change
 */
export function requiresMetrcPhaseChange(
  currentStage: BatchStage,
  newStage: BatchStage
): boolean {
  const currentPhase = mapStageToMetrcPhase(currentStage)
  const newPhase = mapStageToMetrcPhase(newStage)

  // Only sync if:
  // 1. Both stages map to Metrc phases (non-null)
  // 2. The phases are different
  return currentPhase !== null && newPhase !== null && currentPhase !== newPhase
}

/**
 * Get valid Metrc phase transitions
 */
export function getValidMetrcPhaseTransitions(
  currentPhase: MetrcGrowthPhase
): MetrcGrowthPhase[] {
  const transitionRules: Record<MetrcGrowthPhase, MetrcGrowthPhase[]> = {
    Clone: ['Vegetative'],
    Vegetative: ['Flowering'],
    Flowering: [], // Flowering plants transition to harvest, not another phase
  }

  return transitionRules[currentPhase] || []
}

/**
 * Validate phase transition is allowed by Metrc
 */
export function validatePhaseTransitionAllowed(
  currentPhase: MetrcGrowthPhase,
  newPhase: MetrcGrowthPhase
): ValidationResult {
  const result = createValidationResult()

  const allowedTransitions = getValidMetrcPhaseTransitions(currentPhase)

  if (!allowedTransitions.includes(newPhase)) {
    addError(
      result,
      'newPhase',
      `Invalid Metrc phase transition from ${currentPhase} to ${newPhase}. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
      'INVALID_PHASE_TRANSITION'
    )
  }

  // Warn about irreversible transition
  if (currentPhase === 'Clone' && newPhase === 'Vegetative') {
    addWarning(
      result,
      'newPhase',
      'Transitioning from Clone to Vegetative is irreversible in Metrc',
      'IRREVERSIBLE_TRANSITION'
    )
  }

  if (currentPhase === 'Vegetative' && newPhase === 'Flowering') {
    addWarning(
      result,
      'newPhase',
      'Transitioning from Vegetative to Flowering is irreversible in Metrc',
      'IRREVERSIBLE_TRANSITION'
    )
  }

  return result
}

/**
 * Validate Metrc plant growth phase change payload
 */
export function validatePlantGrowthPhaseChange(
  change: MetrcPlantGrowthPhaseChange
): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'Label', change.Label)
  validateRequired(result, 'NewLocation', change.NewLocation)
  validateRequired(result, 'GrowthPhase', change.GrowthPhase)
  validateRequired(result, 'GrowthDate', change.GrowthDate)

  // Validate growth phase value
  const validPhases: MetrcGrowthPhase[] = ['Vegetative', 'Flowering']
  if (change.GrowthPhase && !validPhases.includes(change.GrowthPhase)) {
    addError(
      result,
      'GrowthPhase',
      `Invalid growth phase. Must be one of: ${validPhases.join(', ')}`,
      'INVALID_GROWTH_PHASE'
    )
  }

  // Label validation (Metrc tag format)
  if (change.Label) {
    const tagRegex = /^[A-Z0-9]{24}$/
    if (!tagRegex.test(change.Label)) {
      addWarning(
        result,
        'Label',
        'Label should be a 24-character Metrc tag (e.g., 1A4FF0100000022000000123)',
        'INVALID_TAG_FORMAT'
      )
    }
  }

  // Location validation
  if (change.NewLocation !== undefined && change.NewLocation.length === 0) {
    addError(
      result,
      'NewLocation',
      'Location cannot be empty',
      'EMPTY_LOCATION'
    )
  }

  // Date validation
  if (change.GrowthDate) {
    validateDate(result, 'GrowthDate', change.GrowthDate)
    validateDateNotInFuture(result, 'GrowthDate', change.GrowthDate)
  }

  return result
}

/**
 * Validate TRAZO stage transition before syncing to Metrc
 */
export function validateStageTransitionForMetrc(transition: {
  batchId: string
  currentStage: BatchStage
  newStage: BatchStage
  currentMetrcPhase?: MetrcGrowthPhase | null
  transitionDate: string
  plantTagsCount?: number
  totalPlantCount?: number
}): ValidationResult {
  const result = createValidationResult()

  // Validate batch ID
  validateRequired(result, 'batchId', transition.batchId)

  // Validate stages
  validateRequired(result, 'currentStage', transition.currentStage)
  validateRequired(result, 'newStage', transition.newStage)

  // Check if this transition requires Metrc sync
  if (!requiresMetrcPhaseChange(transition.currentStage, transition.newStage)) {
    // This is not an error, just informational
    addWarning(
      result,
      'newStage',
      'Stage transition does not require Metrc phase change sync',
      'NO_METRC_SYNC_REQUIRED'
    )
    return result
  }

  // Get the Metrc phases for validation
  const currentPhase = transition.currentMetrcPhase || mapStageToMetrcPhase(transition.currentStage)
  const newPhase = mapStageToMetrcPhase(transition.newStage)

  if (!currentPhase) {
    addError(
      result,
      'currentStage',
      `Current stage "${transition.currentStage}" does not map to a Metrc growth phase`,
      'INVALID_CURRENT_STAGE'
    )
  }

  if (!newPhase) {
    addError(
      result,
      'newStage',
      `New stage "${transition.newStage}" does not map to a Metrc growth phase`,
      'INVALID_NEW_STAGE'
    )
  }

  // If we have both phases, validate the transition
  if (currentPhase && newPhase) {
    const phaseValidation = validatePhaseTransitionAllowed(currentPhase, newPhase)
    if (!phaseValidation.isValid) {
      result.isValid = false
      result.errors.push(...phaseValidation.errors)
    }
    result.warnings.push(...phaseValidation.warnings)
  }

  // CRITICAL: Validate plant tags for Vegetative → Flowering transition
  if (currentPhase === 'Vegetative' && newPhase === 'Flowering') {
    const plantTagsCount = transition.plantTagsCount || 0
    const totalPlantCount = transition.totalPlantCount || 0

    if (plantTagsCount === 0) {
      addError(
        result,
        'plantTags',
        'Individual plant tags are REQUIRED for Vegetative to Flowering transition. Metrc requires tracking each plant individually in the flowering phase. Please assign Metrc plant tags before transitioning.',
        'PLANT_TAGS_REQUIRED'
      )
    } else if (plantTagsCount < totalPlantCount) {
      addWarning(
        result,
        'plantTags',
        `Only ${plantTagsCount} of ${totalPlantCount} plants are tagged. For full Metrc compliance, all plants should have individual tags before flowering.`,
        'INCOMPLETE_PLANT_TAGS'
      )
    }
  }

  // Validate date
  validateDate(result, 'transitionDate', transition.transitionDate)
  validateDateNotInFuture(result, 'transitionDate', transition.transitionDate)

  // Warn if transitioning too quickly (within 7 days of planting)
  const transitionDate = new Date(transition.transitionDate)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  if (
    currentPhase === 'Clone' &&
    newPhase === 'Vegetative' &&
    transitionDate > sevenDaysAgo
  ) {
    addWarning(
      result,
      'transitionDate',
      'Transitioning from Clone to Vegetative within 7 days of planting is unusual. Verify plant maturity.',
      'EARLY_PHASE_TRANSITION'
    )
  }

  return result
}

/**
 * Validate batch of plant growth phase changes
 */
export function validatePlantGrowthPhaseChangeBatch(
  changes: MetrcPlantGrowthPhaseChange[]
): ValidationResult {
  const result = createValidationResult()

  if (!changes || changes.length === 0) {
    addError(
      result,
      'changes',
      'At least one phase change is required',
      'EMPTY_BATCH'
    )
    return result
  }

  // Metrc typically limits batch operations to 100 items
  if (changes.length > 100) {
    addError(
      result,
      'changes',
      'Phase change batch is limited to 100 plants per request',
      'BATCH_SIZE_EXCEEDED'
    )
  }

  // Validate each change
  changes.forEach((change, index) => {
    const changeResult = validatePlantGrowthPhaseChange(change)
    if (!changeResult.isValid) {
      result.isValid = false
      changeResult.errors.forEach((error) => {
        result.errors.push({
          ...error,
          field: `changes[${index}].${error.field}`,
        })
      })
    }
    changeResult.warnings.forEach((warning) => {
      result.warnings.push({
        ...warning,
        field: `changes[${index}].${warning.field}`,
      })
    })
  })

  // Check for duplicate labels
  const labels = changes.map((c) => c.Label)
  const duplicates = labels.filter((label, index) => labels.indexOf(label) !== index)
  if (duplicates.length > 0) {
    addWarning(
      result,
      'changes',
      `Duplicate plant labels found: ${[...new Set(duplicates)].join(', ')}`,
      'DUPLICATE_LABELS'
    )
  }

  return result
}
