/**
 * Harvest Validation Rules
 *
 * Validates harvest operations and Metrc harvest creation
 */

import type { ValidationResult } from '@/lib/compliance/types'
import type { MetrcHarvestCreate, MetrcHarvestPackageCreate, MetrcHarvestFinish } from '../types'
import {
  createValidationResult,
  validateRequired,
  validateDate,
  validateDateNotInFuture,
  validatePositiveNumber,
  addError,
  addWarning,
} from './validators'

export type HarvestType = 'WholePlant' | 'Manicure' | 'Flower'

/**
 * Validate harvest creation data
 */
export function validateHarvestCreate(harvest: {
  batchId: string
  wetWeight: number
  plantCount: number
  harvestedAt: string
  harvestType?: HarvestType
  location?: string
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'batchId', harvest.batchId)
  validateRequired(result, 'wetWeight', harvest.wetWeight)
  validateRequired(result, 'plantCount', harvest.plantCount)
  validateRequired(result, 'harvestedAt', harvest.harvestedAt)

  // Weight validation
  validatePositiveNumber(result, 'wetWeight', harvest.wetWeight)

  // Plant count validation
  validatePositiveNumber(result, 'plantCount', harvest.plantCount)
  if (harvest.plantCount && harvest.plantCount > 1000) {
    addWarning(
      result,
      'plantCount',
      'Large plant count (>1000). Verify this is correct.',
      'LARGE_PLANT_COUNT'
    )
  }

  // Date validation
  if (harvest.harvestedAt) {
    validateDate(result, 'harvestedAt', harvest.harvestedAt)
    validateDateNotInFuture(result, 'harvestedAt', harvest.harvestedAt)
  }

  // Harvest type validation
  const validTypes: HarvestType[] = ['WholePlant', 'Manicure', 'Flower']
  if (harvest.harvestType && !validTypes.includes(harvest.harvestType)) {
    addError(
      result,
      'harvestType',
      `Invalid harvest type. Must be one of: ${validTypes.join(', ')}`,
      'INVALID_HARVEST_TYPE'
    )
  }

  // Weight reasonableness check
  if (harvest.wetWeight && harvest.plantCount) {
    const weightPerPlant = harvest.wetWeight / harvest.plantCount

    // Warn if weight per plant is unusually low (<10g) or high (>2000g)
    if (weightPerPlant < 10) {
      addWarning(
        result,
        'wetWeight',
        `Low weight per plant (${weightPerPlant.toFixed(1)}g/plant). Expected range: 10-2000g/plant.`,
        'LOW_WEIGHT_PER_PLANT'
      )
    } else if (weightPerPlant > 2000) {
      addWarning(
        result,
        'wetWeight',
        `High weight per plant (${weightPerPlant.toFixed(1)}g/plant). Expected range: 10-2000g/plant.`,
        'HIGH_WEIGHT_PER_PLANT'
      )
    }
  }

  return result
}

/**
 * Validate Metrc harvest creation payload
 */
export function validateMetrcHarvestCreate(
  harvestCreate: MetrcHarvestCreate
): ValidationResult {
  const result = createValidationResult()

  // Required fields per Metrc API
  validateRequired(result, 'Name', harvestCreate.Name)
  validateRequired(result, 'HarvestType', harvestCreate.HarvestType)
  validateRequired(result, 'DryingLocation', harvestCreate.DryingLocation)
  validateRequired(result, 'HarvestStartDate', harvestCreate.HarvestStartDate)
  validateRequired(result, 'PatientLicenseNumber', harvestCreate.PatientLicenseNumber)

  // Harvest type validation
  const validTypes = ['WholePlant', 'Manicure', 'Flower']
  if (harvestCreate.HarvestType && !validTypes.includes(harvestCreate.HarvestType)) {
    addError(
      result,
      'HarvestType',
      `Invalid harvest type. Must be one of: ${validTypes.join(', ')}`,
      'INVALID_HARVEST_TYPE'
    )
  }

  // Date validation
  if (harvestCreate.HarvestStartDate) {
    validateDate(result, 'HarvestStartDate', harvestCreate.HarvestStartDate)
    validateDateNotInFuture(result, 'HarvestStartDate', harvestCreate.HarvestStartDate)
  }

  // Name validation (Metrc harvest name must be unique)
  if (harvestCreate.Name && harvestCreate.Name.length > 100) {
    addError(
      result,
      'Name',
      'Harvest name must be 100 characters or less',
      'NAME_TOO_LONG'
    )
  }

  // Location validation
  if (harvestCreate.DryingLocation && harvestCreate.DryingLocation.length === 0) {
    addError(
      result,
      'DryingLocation',
      'Drying location cannot be empty',
      'EMPTY_LOCATION'
    )
  }

  return result
}

/**
 * Validate package creation from harvest
 */
export function validateHarvestPackageCreate(
  packageCreate: MetrcHarvestPackageCreate
): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'Tag', packageCreate.Tag)
  validateRequired(result, 'Location', packageCreate.Location)
  validateRequired(result, 'Item', packageCreate.Item)
  validateRequired(result, 'Quantity', packageCreate.Quantity)
  validateRequired(result, 'UnitOfMeasure', packageCreate.UnitOfMeasure)
  validateRequired(result, 'ActualDate', packageCreate.ActualDate)

  // Quantity validation
  validatePositiveNumber(result, 'Quantity', packageCreate.Quantity)

  // Date validation
  if (packageCreate.ActualDate) {
    validateDate(result, 'ActualDate', packageCreate.ActualDate)
    validateDateNotInFuture(result, 'ActualDate', packageCreate.ActualDate)
  }

  // Tag format validation (Metrc package tag)
  if (packageCreate.Tag) {
    const tagRegex = /^[A-Z0-9]{24}$/
    if (!tagRegex.test(packageCreate.Tag)) {
      addWarning(
        result,
        'Tag',
        'Tag should be a 24-character Metrc package tag (e.g., 1A4FF0100000022000000123)',
        'INVALID_TAG_FORMAT'
      )
    }
  }

  // Unit of measure validation
  const validUnits = [
    'Grams',
    'Kilograms',
    'Pounds',
    'Ounces',
    'Each',
    'Milligrams',
  ]
  if (packageCreate.UnitOfMeasure && !validUnits.includes(packageCreate.UnitOfMeasure)) {
    addWarning(
      result,
      'UnitOfMeasure',
      `Uncommon unit of measure: ${packageCreate.UnitOfMeasure}. Common units: ${validUnits.join(', ')}`,
      'UNCOMMON_UNIT'
    )
  }

  // Production batch number validation (optional but recommended)
  if (!packageCreate.ProductionBatchNumber) {
    addWarning(
      result,
      'ProductionBatchNumber',
      'Production batch number is recommended for traceability',
      'MISSING_PRODUCTION_BATCH'
    )
  }

  return result
}

/**
 * Validate batch of package creations
 */
export function validateHarvestPackageCreateBatch(
  packages: MetrcHarvestPackageCreate[]
): ValidationResult {
  const result = createValidationResult()

  if (!packages || packages.length === 0) {
    addError(
      result,
      'packages',
      'At least one package is required',
      'EMPTY_BATCH'
    )
    return result
  }

  // Metrc typically limits batch operations
  if (packages.length > 100) {
    addError(
      result,
      'packages',
      'Package creation batch is limited to 100 packages per request',
      'BATCH_SIZE_EXCEEDED'
    )
  }

  // Validate each package
  packages.forEach((pkg, index) => {
    const pkgResult = validateHarvestPackageCreate(pkg)
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

  // Check for duplicate tags
  const tags = packages.map((p) => p.Tag).filter(Boolean)
  const duplicates = tags.filter((tag, index) => tags.indexOf(tag) !== index)
  if (duplicates.length > 0) {
    addError(
      result,
      'packages',
      `Duplicate package tags found: ${[...new Set(duplicates)].join(', ')}`,
      'DUPLICATE_TAGS'
    )
  }

  return result
}

/**
 * Validate harvest finish operation
 */
export function validateHarvestFinish(
  finish: MetrcHarvestFinish
): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'Id', finish.Id)
  validateRequired(result, 'ActualDate', finish.ActualDate)

  // Date validation
  if (finish.ActualDate) {
    validateDate(result, 'ActualDate', finish.ActualDate)
    validateDateNotInFuture(result, 'ActualDate', finish.ActualDate)
  }

  return result
}

/**
 * Validate dry weight update
 */
export function validateDryWeightUpdate(dryWeight: {
  wetWeight: number
  dryWeight: number
}): ValidationResult {
  const result = createValidationResult()

  // Both weights must be positive
  validatePositiveNumber(result, 'wetWeight', dryWeight.wetWeight)
  validatePositiveNumber(result, 'dryWeight', dryWeight.dryWeight)

  // Dry weight should be less than wet weight
  if (dryWeight.dryWeight && dryWeight.wetWeight && dryWeight.dryWeight > dryWeight.wetWeight) {
    addError(
      result,
      'dryWeight',
      'Dry weight cannot exceed wet weight',
      'DRY_WEIGHT_EXCEEDS_WET'
    )
  }

  // Calculate moisture loss percentage
  if (dryWeight.dryWeight && dryWeight.wetWeight) {
    const moistureLoss = ((dryWeight.wetWeight - dryWeight.dryWeight) / dryWeight.wetWeight) * 100

    // Typical moisture loss is 65-85% for cannabis
    if (moistureLoss < 50) {
      addWarning(
        result,
        'dryWeight',
        `Low moisture loss (${moistureLoss.toFixed(1)}%). Expected range: 65-85%.`,
        'LOW_MOISTURE_LOSS'
      )
    } else if (moistureLoss > 90) {
      addWarning(
        result,
        'dryWeight',
        `High moisture loss (${moistureLoss.toFixed(1)}%). Expected range: 65-85%.`,
        'HIGH_MOISTURE_LOSS'
      )
    }
  }

  return result
}

/**
 * Validate waste removal from harvest
 */
export function validateWasteRemoval(waste: {
  wasteWeight: number
  wasteType: string
  actualDate: string
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'wasteWeight', waste.wasteWeight)
  validateRequired(result, 'wasteType', waste.wasteType)
  validateRequired(result, 'actualDate', waste.actualDate)

  // Weight validation
  validatePositiveNumber(result, 'wasteWeight', waste.wasteWeight)

  // Date validation
  if (waste.actualDate) {
    validateDate(result, 'actualDate', waste.actualDate)
    validateDateNotInFuture(result, 'actualDate', waste.actualDate)
  }

  // Waste type validation
  const validWasteTypes = [
    'Plant Material',
    'Stems',
    'Leaves',
    'Trim',
    'Damaged Material',
    'Other Waste',
  ]
  if (waste.wasteType && !validWasteTypes.includes(waste.wasteType)) {
    addWarning(
      result,
      'wasteType',
      `Uncommon waste type: ${waste.wasteType}. Common types: ${validWasteTypes.join(', ')}`,
      'UNCOMMON_WASTE_TYPE'
    )
  }

  return result
}

/**
 * Check if harvest is ready to be finished
 */
export function validateHarvestReadyToFinish(harvest: {
  status: string
  wetWeight: number
  dryWeight?: number | null
  packagedWeight?: number
}): ValidationResult {
  const result = createValidationResult()

  // Harvest must be in appropriate status
  const validStatuses = ['drying', 'curing', 'active']
  if (!validStatuses.includes(harvest.status)) {
    addError(
      result,
      'status',
      `Cannot finish harvest with status: ${harvest.status}`,
      'INVALID_STATUS'
    )
  }

  // Should have dry weight recorded
  if (!harvest.dryWeight) {
    addWarning(
      result,
      'dryWeight',
      'Dry weight not recorded. Recommended before finishing harvest.',
      'MISSING_DRY_WEIGHT'
    )
  }

  // If packages created, check if all weight is accounted for
  if (harvest.dryWeight && harvest.packagedWeight !== undefined) {
    const unpackagedWeight = harvest.dryWeight - harvest.packagedWeight

    if (unpackagedWeight > harvest.dryWeight * 0.1) {
      // More than 10% unpackaged
      addWarning(
        result,
        'packagedWeight',
        `${unpackagedWeight.toFixed(1)}g (${((unpackagedWeight / harvest.dryWeight) * 100).toFixed(1)}%) of harvest remains unpackaged`,
        'UNPACKAGED_WEIGHT'
      )
    }
  }

  return result
}

/**
 * Generate Metrc harvest name
 */
export function generateMetrcHarvestName(
  batchNumber: string,
  harvestSequence: number = 1
): string {
  return `${batchNumber}-H${harvestSequence}`
}
