/**
 * Waste Destruction Validation Rules
 *
 * Validates cannabis waste destruction operations for Metrc compliance
 * - 50:50 rendering method validation (Oregon/Maryland requirement)
 * - Plant batch destruction rules
 * - Package waste destruction rules
 * - Weight reasonableness checks
 */

import type { ValidationResult } from '@/lib/compliance/types'
import {
  createValidationResult,
  validateRequired,
  validatePositiveNumber,
  validateDate,
  validateDateNotInFuture,
  addError,
  addWarning,
} from './validators'

/**
 * Validate waste destruction creation
 */
export function validateWasteDestruction(waste: {
  wasteWeight: number
  wasteUnit: string
  destructionDate: string
  renderingMethod: string
  wasteCategory: string
  batchId?: string
  packageId?: string
  harvestId?: string
  inertMaterialWeight?: number
  inertMaterialUnit?: string
  witnessedBy?: string
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'wasteWeight', waste.wasteWeight)
  validateRequired(result, 'wasteUnit', waste.wasteUnit)
  validateRequired(result, 'destructionDate', waste.destructionDate)
  validateRequired(result, 'renderingMethod', waste.renderingMethod)
  validateRequired(result, 'wasteCategory', waste.wasteCategory)

  // Validate at least one source entity
  if (!waste.batchId && !waste.packageId && !waste.harvestId) {
    addError(
      result,
      'entityId',
      'Must specify at least one source: batchId, packageId, or harvestId',
      'MISSING_ENTITY_SOURCE'
    )
  }

  // Validate date
  if (waste.destructionDate) {
    validateDate(result, 'destructionDate', waste.destructionDate)
    validateDateNotInFuture(result, 'destructionDate', waste.destructionDate)
  }

  // Validate weight
  if (waste.wasteWeight !== undefined) {
    validatePositiveNumber(result, 'wasteWeight', waste.wasteWeight)

    // Warn for very large waste amounts
    if (waste.wasteWeight > 100 && waste.wasteUnit === 'Kilograms') {
      addWarning(
        result,
        'wasteWeight',
        'Waste weight is unusually high (>100kg). Verify measurement.',
        'HIGH_WASTE_WEIGHT'
      )
    }
  }

  // Validate rendering method
  const validMethods = [
    '50_50_sawdust',
    '50_50_kitty_litter',
    '50_50_soil',
    '50_50_other_inert',
    'composting',
    'grinding',
    'incineration',
    'other',
  ]

  if (waste.renderingMethod && !validMethods.includes(waste.renderingMethod)) {
    addError(
      result,
      'renderingMethod',
      `Invalid rendering method. Must be one of: ${validMethods.join(', ')}`,
      'INVALID_RENDERING_METHOD'
    )
  }

  // Validate 50:50 mix compliance (Oregon/Maryland requirement)
  if (waste.renderingMethod?.startsWith('50_50')) {
    if (!waste.inertMaterialWeight) {
      addError(
        result,
        'inertMaterialWeight',
        '50:50 rendering method requires inert material weight',
        'MISSING_INERT_MATERIAL_WEIGHT'
      )
    } else {
      // Check ratio (allow 10% tolerance)
      const minInert = waste.wasteWeight * 0.9
      const maxInert = waste.wasteWeight * 1.1

      if (waste.inertMaterialWeight < minInert) {
        addError(
          result,
          'inertMaterialWeight',
          `Inert material weight (${waste.inertMaterialWeight}) is too low for 50:50 mix. Minimum: ${minInert.toFixed(2)} ${waste.inertMaterialUnit}`,
          'INERT_MATERIAL_TOO_LOW'
        )
      }

      if (waste.inertMaterialWeight > maxInert) {
        addWarning(
          result,
          'inertMaterialWeight',
          `Inert material weight (${waste.inertMaterialWeight}) exceeds recommended 50:50 ratio. Maximum: ${maxInert.toFixed(2)} ${waste.inertMaterialUnit}`,
          'INERT_MATERIAL_EXCEEDS_RATIO'
        )
      }
    }

    // Recommend witness for 50:50 destruction
    if (!waste.witnessedBy) {
      addWarning(
        result,
        'witnessedBy',
        '50:50 waste destruction should have a witness for compliance documentation',
        'MISSING_WITNESS'
      )
    }
  }

  // Validate waste category
  const validCategories = [
    'plant_material',
    'package_waste',
    'harvest_trim',
    'spoiled_product',
    'batch_destruction',
    'other',
  ]

  if (waste.wasteCategory && !validCategories.includes(waste.wasteCategory)) {
    addError(
      result,
      'wasteCategory',
      `Invalid waste category. Must be one of: ${validCategories.join(', ')}`,
      'INVALID_WASTE_CATEGORY'
    )
  }

  return result
}

/**
 * Validate plant batch destruction
 */
export function validatePlantBatchDestruction(destruction: {
  batchId: string
  plantsDestroyed: number
  totalPlantsInBatch: number
  plantTags?: string[]
  wasteWeight: number
  wasteReason: string
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'batchId', destruction.batchId)
  validateRequired(result, 'plantsDestroyed', destruction.plantsDestroyed)
  validateRequired(result, 'wasteWeight', destruction.wasteWeight)
  validateRequired(result, 'wasteReason', destruction.wasteReason)

  // Validate plants destroyed count
  if (destruction.plantsDestroyed <= 0) {
    addError(
      result,
      'plantsDestroyed',
      'Must destroy at least 1 plant',
      'INVALID_PLANTS_DESTROYED'
    )
  }

  if (destruction.plantsDestroyed > destruction.totalPlantsInBatch) {
    addError(
      result,
      'plantsDestroyed',
      `Cannot destroy more plants (${destruction.plantsDestroyed}) than exist in batch (${destruction.totalPlantsInBatch})`,
      'EXCEEDS_BATCH_PLANT_COUNT'
    )
  }

  // Validate plant tags if provided
  if (destruction.plantTags && destruction.plantTags.length > 0) {
    if (destruction.plantTags.length !== destruction.plantsDestroyed) {
      addWarning(
        result,
        'plantTags',
        `Plant tags count (${destruction.plantTags.length}) does not match plants destroyed (${destruction.plantsDestroyed})`,
        'TAG_COUNT_MISMATCH'
      )
    }

    // Validate tag format (24-character Metrc format)
    const tagRegex = /^1A[A-Z0-9]{22}$/
    destruction.plantTags.forEach((tag, index) => {
      if (!tagRegex.test(tag)) {
        addError(
          result,
          `plantTags[${index}]`,
          `Invalid Metrc plant tag format: ${tag}. Expected format: 1A + 22 alphanumeric characters`,
          'INVALID_PLANT_TAG_FORMAT'
        )
      }
    })
  }

  // Validate weight reasonableness (warn if <50g or >2kg per plant)
  const avgWeightPerPlant = destruction.wasteWeight / destruction.plantsDestroyed

  if (avgWeightPerPlant < 0.05) {
    // Less than 50g per plant
    addWarning(
      result,
      'wasteWeight',
      `Average weight per plant is very low (${avgWeightPerPlant.toFixed(3)} kg). Verify measurement.`,
      'LOW_AVG_PLANT_WEIGHT'
    )
  }

  if (avgWeightPerPlant > 2) {
    // More than 2kg per plant
    addWarning(
      result,
      'wasteWeight',
      `Average weight per plant is very high (${avgWeightPerPlant.toFixed(3)} kg). Verify measurement.`,
      'HIGH_AVG_PLANT_WEIGHT'
    )
  }

  return result
}

/**
 * Validate package waste destruction
 */
export function validatePackageDestruction(destruction: {
  packageId: string
  packageWeight: number
  wasteWeight: number
  wasteReason: string
  adjustmentReason: string
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'packageId', destruction.packageId)
  validateRequired(result, 'wasteWeight', destruction.wasteWeight)
  validateRequired(result, 'wasteReason', destruction.wasteReason)
  validateRequired(result, 'adjustmentReason', destruction.adjustmentReason)

  // Validate waste weight doesn't exceed package weight
  if (destruction.wasteWeight > destruction.packageWeight) {
    addError(
      result,
      'wasteWeight',
      `Waste weight (${destruction.wasteWeight}) cannot exceed package weight (${destruction.packageWeight})`,
      'WASTE_EXCEEDS_PACKAGE_WEIGHT'
    )
  }

  // Validate adjustment reason (Metrc-specific)
  const validReasons = [
    'Drying',
    'Entry Error',
    'Inventory Audit',
    'Mandatory State Destruction',
    'Product Degradation',
    'Theft',
    'Vendor Returned Goods',
    'Other',
  ]

  if (destruction.adjustmentReason && !validReasons.includes(destruction.adjustmentReason)) {
    addWarning(
      result,
      'adjustmentReason',
      `Adjustment reason "${destruction.adjustmentReason}" may not be accepted by Metrc. Common reasons: ${validReasons.join(', ')}`,
      'UNKNOWN_ADJUSTMENT_REASON'
    )
  }

  return result
}

/**
 * Validate Metrc waste payload
 */
export function validateMetrcWastePayload(payload: {
  WasteType: string
  WasteWeight: number
  UnitOfWeight: string
  WasteDate: string
  WasteMethodName?: string
}): ValidationResult {
  const result = createValidationResult()

  // Validate Metrc waste type
  const validMetrcWasteTypes = [
    'Plant Material',
    'Harvest Waste',
    'Product Waste',
    'Other',
  ]

  if (!validMetrcWasteTypes.includes(payload.WasteType)) {
    addError(
      result,
      'WasteType',
      `Invalid Metrc waste type. Must be one of: ${validMetrcWasteTypes.join(', ')}`,
      'INVALID_METRC_WASTE_TYPE'
    )
  }

  // Validate unit of weight
  const validUnits = ['Grams', 'Kilograms', 'Ounces', 'Pounds']
  if (!validUnits.includes(payload.UnitOfWeight)) {
    addError(
      result,
      'UnitOfWeight',
      `Invalid unit of weight. Must be one of: ${validUnits.join(', ')}`,
      'INVALID_UNIT_OF_WEIGHT'
    )
  }

  validatePositiveNumber(result, 'WasteWeight', payload.WasteWeight)
  validateDate(result, 'WasteDate', payload.WasteDate)

  return result
}

/**
 * Map internal rendering method to Metrc format
 */
export function mapRenderingMethodToMetrc(renderingMethod: string): string {
  const mapping: Record<string, string> = {
    '50_50_sawdust': '50:50 Mix with Sawdust',
    '50_50_kitty_litter': '50:50 Mix with Kitty Litter',
    '50_50_soil': '50:50 Mix with Soil',
    '50_50_other_inert': '50:50 Mix with Other Inert Material',
    'composting': 'Composting',
    'grinding': 'Grinding and Incorporation',
    'incineration': 'Incineration',
    'other': 'Other',
  }

  return mapping[renderingMethod] || 'Other'
}
