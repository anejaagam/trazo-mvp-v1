/**
 * Production Batch Validation Rules
 *
 * Validates production batch operations for Metrc compliance
 * Covers: extraction, infusion, pre-rolls, packaging, and other transformations
 */

import type { ValidationResult } from '@/lib/compliance/types'
import {
  createValidationResult,
  validateRequired,
  validateDate,
  validateDateNotInFuture,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateUnitOfMeasure,
  validateMetrcTag,
  validateArrayNotEmpty,
  addError,
  addWarning,
} from './validators'

/**
 * Valid production types for Metrc
 */
export const PRODUCTION_TYPES = [
  'processing',
  'extraction',
  'infusion',
  'packaging',
  'preroll',
  'other',
] as const

export type ProductionType = (typeof PRODUCTION_TYPES)[number]

/**
 * Valid production statuses
 */
export const PRODUCTION_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled'] as const
export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number]

/**
 * Valid output product types
 */
export const OUTPUT_PRODUCT_TYPES = [
  'flower',
  'concentrate',
  'oil',
  'edible',
  'topical',
  'tincture',
  'preroll',
  'capsule',
  'vape_cartridge',
  'kief',
  'hash',
  'wax',
  'shatter',
  'distillate',
  'rosin',
  'other',
] as const

export type OutputProductType = (typeof OUTPUT_PRODUCT_TYPES)[number]

/**
 * Expected yield ranges by production type (percentage)
 */
export const EXPECTED_YIELD_RANGES: Record<
  ProductionType,
  { min: number; max: number; typical: number }
> = {
  processing: { min: 60, max: 100, typical: 85 }, // Trimming, processing - minimal loss
  extraction: { min: 10, max: 35, typical: 20 }, // CO2, hydrocarbon extraction
  infusion: { min: 80, max: 120, typical: 100 }, // May add carrier oils
  packaging: { min: 95, max: 100, typical: 98 }, // Minimal loss in repackaging
  preroll: { min: 85, max: 100, typical: 95 }, // Some loss in grinding/rolling
  other: { min: 5, max: 150, typical: 80 }, // Wide range for custom processes
}

/**
 * Input package for production
 */
export interface ProductionInputPackage {
  packageId: string
  packageTag?: string
  quantityUsed: number
  unitOfMeasure: string
  availableQuantity?: number
  productType?: string
  status?: string
}

/**
 * Output product from production
 */
export interface ProductionOutputProduct {
  productName: string
  productType: OutputProductType | string
  quantity: number
  unitOfMeasure: string
  packageTag?: string
}

/**
 * Production batch creation parameters
 */
export interface ProductionBatchCreateParams {
  productionType: ProductionType | string
  siteId: string
  organizationId: string
  startedAt: string
  expectedYield?: number
  expectedYieldUnit?: string
  sourceHarvestId?: string
  recipeId?: string
  notes?: string
}

/**
 * Production batch completion parameters
 */
export interface ProductionBatchCompleteParams {
  productionBatchId: string
  completedAt: string
  actualYield: number
  actualYieldUnit: string
  yieldVarianceReason?: string
  outputs: ProductionOutputProduct[]
}

/**
 * Validate production batch creation
 */
export function validateProductionBatchCreate(
  params: ProductionBatchCreateParams
): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'productionType', params.productionType, 'Production type')
  validateRequired(result, 'siteId', params.siteId, 'Site')
  validateRequired(result, 'organizationId', params.organizationId, 'Organization')
  validateRequired(result, 'startedAt', params.startedAt, 'Start date')

  // Production type validation
  if (params.productionType && !PRODUCTION_TYPES.includes(params.productionType as ProductionType)) {
    addError(
      result,
      'productionType',
      `Invalid production type. Must be one of: ${PRODUCTION_TYPES.join(', ')}`,
      'INVALID_PRODUCTION_TYPE'
    )
  }

  // Date validation
  if (params.startedAt) {
    validateDate(result, 'startedAt', params.startedAt, 'Start date')
    validateDateNotInFuture(result, 'startedAt', params.startedAt, 'Start date')
  }

  // Expected yield validation
  if (params.expectedYield !== undefined) {
    validateNonNegativeNumber(result, 'expectedYield', params.expectedYield, 'Expected yield')
  }

  // Warn if no harvest source for traceability
  if (!params.sourceHarvestId) {
    addWarning(
      result,
      'sourceHarvestId',
      'No source harvest linked. Recommended for full traceability.',
      'MISSING_SOURCE_HARVEST'
    )
  }

  return result
}

/**
 * Validate individual input package
 */
export function validateInputPackage(input: ProductionInputPackage): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'packageId', input.packageId, 'Package ID')
  validateRequired(result, 'quantityUsed', input.quantityUsed, 'Quantity used')
  validateRequired(result, 'unitOfMeasure', input.unitOfMeasure, 'Unit of measure')

  // Quantity validation
  if (input.quantityUsed !== undefined) {
    validatePositiveNumber(result, 'quantityUsed', input.quantityUsed, 'Quantity used')
  }

  // Unit of measure validation
  if (input.unitOfMeasure) {
    validateUnitOfMeasure(result, 'unitOfMeasure', input.unitOfMeasure)
  }

  // Check available quantity
  if (
    input.availableQuantity !== undefined &&
    input.quantityUsed > input.availableQuantity
  ) {
    addError(
      result,
      'quantityUsed',
      `Quantity used (${input.quantityUsed}) exceeds available quantity (${input.availableQuantity})`,
      'EXCEEDS_AVAILABLE_QUANTITY'
    )
  }

  // Validate package tag format if provided
  if (input.packageTag) {
    validateMetrcTag(result, 'packageTag', input.packageTag, 'Package tag')
  }

  return result
}

/**
 * Validate batch of input packages
 */
export function validateInputPackages(
  inputs: ProductionInputPackage[],
  productionType?: ProductionType
): ValidationResult {
  const result = createValidationResult()

  // Must have at least one input
  validateArrayNotEmpty(result, 'inputs', inputs, 'Input packages')

  if (!inputs || inputs.length === 0) {
    return result
  }

  // Validate each input
  const packageIds = new Set<string>()
  let totalInputWeight = 0

  inputs.forEach((input, index) => {
    const inputResult = validateInputPackage(input)

    // Check for duplicate package IDs
    if (packageIds.has(input.packageId)) {
      addError(
        result,
        `inputs[${index}].packageId`,
        'Duplicate package in inputs',
        'DUPLICATE_INPUT_PACKAGE'
      )
    }
    packageIds.add(input.packageId)

    // Aggregate errors and warnings
    if (!inputResult.isValid) {
      result.isValid = false
      inputResult.errors.forEach((error) => {
        result.errors.push({
          ...error,
          field: `inputs[${index}].${error.field}`,
        })
      })
    }
    inputResult.warnings.forEach((warning) => {
      result.warnings.push({
        ...warning,
        field: `inputs[${index}].${warning.field}`,
      })
    })

    // Track total weight for yield calculations
    if (input.quantityUsed && input.unitOfMeasure?.toLowerCase().includes('gram')) {
      totalInputWeight += input.quantityUsed
    }
  })

  // Warn on very large batches
  if (inputs.length > 50) {
    addWarning(
      result,
      'inputs',
      `Large number of input packages (${inputs.length}). Verify this is correct.`,
      'LARGE_INPUT_BATCH'
    )
  }

  // Production type specific validations
  if (productionType === 'preroll' && inputs.length > 1) {
    addWarning(
      result,
      'inputs',
      'Pre-roll production typically uses single strain/package. Multiple inputs detected.',
      'PREROLL_MULTIPLE_INPUTS'
    )
  }

  return result
}

/**
 * Validate output product
 */
export function validateOutputProduct(output: ProductionOutputProduct): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'productName', output.productName, 'Product name')
  validateRequired(result, 'productType', output.productType, 'Product type')
  validateRequired(result, 'quantity', output.quantity, 'Quantity')
  validateRequired(result, 'unitOfMeasure', output.unitOfMeasure, 'Unit of measure')

  // Quantity validation
  if (output.quantity !== undefined) {
    validatePositiveNumber(result, 'quantity', output.quantity, 'Quantity')
  }

  // Product type validation
  if (output.productType && !OUTPUT_PRODUCT_TYPES.includes(output.productType as OutputProductType)) {
    addWarning(
      result,
      'productType',
      `Unknown product type: ${output.productType}. Common types: ${OUTPUT_PRODUCT_TYPES.slice(0, 8).join(', ')}`,
      'UNKNOWN_PRODUCT_TYPE'
    )
  }

  // Unit of measure validation
  if (output.unitOfMeasure) {
    validateUnitOfMeasure(result, 'unitOfMeasure', output.unitOfMeasure)
  }

  // Package tag validation
  if (output.packageTag) {
    validateMetrcTag(result, 'packageTag', output.packageTag, 'Package tag')
  } else {
    addWarning(
      result,
      'packageTag',
      'No package tag assigned. Tag required before Metrc sync.',
      'MISSING_PACKAGE_TAG'
    )
  }

  // Product name length
  if (output.productName && output.productName.length > 150) {
    addError(
      result,
      'productName',
      'Product name must be 150 characters or less',
      'NAME_TOO_LONG'
    )
  }

  return result
}

/**
 * Validate output products batch
 */
export function validateOutputProducts(outputs: ProductionOutputProduct[]): ValidationResult {
  const result = createValidationResult()

  // Must have at least one output
  validateArrayNotEmpty(result, 'outputs', outputs, 'Output products')

  if (!outputs || outputs.length === 0) {
    return result
  }

  // Validate each output
  const tags = new Set<string>()

  outputs.forEach((output, index) => {
    const outputResult = validateOutputProduct(output)

    // Check for duplicate tags
    if (output.packageTag) {
      if (tags.has(output.packageTag)) {
        addError(
          result,
          `outputs[${index}].packageTag`,
          'Duplicate package tag in outputs',
          'DUPLICATE_OUTPUT_TAG'
        )
      }
      tags.add(output.packageTag)
    }

    // Aggregate errors and warnings
    if (!outputResult.isValid) {
      result.isValid = false
      outputResult.errors.forEach((error) => {
        result.errors.push({
          ...error,
          field: `outputs[${index}].${error.field}`,
        })
      })
    }
    outputResult.warnings.forEach((warning) => {
      result.warnings.push({
        ...warning,
        field: `outputs[${index}].${warning.field}`,
      })
    })
  })

  return result
}

/**
 * Validate yield percentage against expected ranges
 */
export function validateYieldPercentage(
  productionType: ProductionType,
  inputWeight: number,
  outputWeight: number
): ValidationResult {
  const result = createValidationResult()

  if (inputWeight <= 0) {
    addError(result, 'inputWeight', 'Input weight must be positive', 'INVALID_INPUT_WEIGHT')
    return result
  }

  if (outputWeight < 0) {
    addError(result, 'outputWeight', 'Output weight cannot be negative', 'INVALID_OUTPUT_WEIGHT')
    return result
  }

  const yieldPercentage = (outputWeight / inputWeight) * 100
  const expectedRange = EXPECTED_YIELD_RANGES[productionType]

  if (yieldPercentage < expectedRange.min) {
    addWarning(
      result,
      'yield',
      `Low yield (${yieldPercentage.toFixed(1)}%) for ${productionType}. Expected: ${expectedRange.min}-${expectedRange.max}%. Typical: ${expectedRange.typical}%`,
      'LOW_YIELD'
    )
  } else if (yieldPercentage > expectedRange.max) {
    addError(
      result,
      'yield',
      `Yield (${yieldPercentage.toFixed(1)}%) exceeds expected maximum (${expectedRange.max}%) for ${productionType}. Please verify weights.`,
      'YIELD_EXCEEDS_MAX'
    )
  }

  // Additional warning for significant deviation from typical
  const deviationFromTypical = Math.abs(yieldPercentage - expectedRange.typical)
  if (deviationFromTypical > 20) {
    addWarning(
      result,
      'yield',
      `Yield (${yieldPercentage.toFixed(1)}%) deviates significantly from typical (${expectedRange.typical}%) for ${productionType}`,
      'YIELD_DEVIATION'
    )
  }

  return result
}

/**
 * Validate production batch completion
 */
export function validateProductionComplete(
  params: ProductionBatchCompleteParams,
  productionType?: ProductionType,
  totalInputWeight?: number
): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'productionBatchId', params.productionBatchId, 'Production batch ID')
  validateRequired(result, 'completedAt', params.completedAt, 'Completion date')
  validateRequired(result, 'actualYield', params.actualYield, 'Actual yield')
  validateRequired(result, 'actualYieldUnit', params.actualYieldUnit, 'Yield unit')

  // Date validation
  if (params.completedAt) {
    validateDate(result, 'completedAt', params.completedAt, 'Completion date')
    validateDateNotInFuture(result, 'completedAt', params.completedAt, 'Completion date')
  }

  // Yield validation
  if (params.actualYield !== undefined) {
    validateNonNegativeNumber(result, 'actualYield', params.actualYield, 'Actual yield')
  }

  // Validate outputs
  if (!params.outputs || params.outputs.length === 0) {
    addError(
      result,
      'outputs',
      'At least one output product is required to complete production',
      'NO_OUTPUTS'
    )
  } else {
    const outputsResult = validateOutputProducts(params.outputs)
    if (!outputsResult.isValid) {
      result.isValid = false
      result.errors.push(...outputsResult.errors)
    }
    result.warnings.push(...outputsResult.warnings)
  }

  // Validate yield percentage if we have the data
  if (productionType && totalInputWeight && params.actualYield) {
    const yieldResult = validateYieldPercentage(productionType, totalInputWeight, params.actualYield)
    if (!yieldResult.isValid) {
      result.isValid = false
      result.errors.push(...yieldResult.errors)
    }
    result.warnings.push(...yieldResult.warnings)

    // Require variance reason for significant deviations
    const yieldPercentage = (params.actualYield / totalInputWeight) * 100
    const expectedRange = EXPECTED_YIELD_RANGES[productionType]
    const significantDeviation =
      yieldPercentage < expectedRange.min * 0.8 || yieldPercentage > expectedRange.max * 1.2

    if (significantDeviation && !params.yieldVarianceReason) {
      addError(
        result,
        'yieldVarianceReason',
        'Significant yield variance requires explanation',
        'VARIANCE_REASON_REQUIRED'
      )
    }
  }

  return result
}

/**
 * Validate production batch cancellation
 */
export function validateProductionCancel(params: {
  productionBatchId: string
  cancellationReason: string
  cancelledAt: string
  currentStatus: ProductionStatus
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'productionBatchId', params.productionBatchId, 'Production batch ID')
  validateRequired(result, 'cancellationReason', params.cancellationReason, 'Cancellation reason')
  validateRequired(result, 'cancelledAt', params.cancelledAt, 'Cancellation date')

  // Date validation
  if (params.cancelledAt) {
    validateDate(result, 'cancelledAt', params.cancelledAt, 'Cancellation date')
    validateDateNotInFuture(result, 'cancelledAt', params.cancelledAt, 'Cancellation date')
  }

  // Can only cancel planned or in_progress batches
  if (params.currentStatus === 'completed') {
    addError(
      result,
      'currentStatus',
      'Cannot cancel a completed production batch',
      'CANNOT_CANCEL_COMPLETED'
    )
  } else if (params.currentStatus === 'cancelled') {
    addError(
      result,
      'currentStatus',
      'Production batch is already cancelled',
      'ALREADY_CANCELLED'
    )
  }

  // Minimum reason length
  if (params.cancellationReason && params.cancellationReason.length < 10) {
    addError(
      result,
      'cancellationReason',
      'Cancellation reason must be at least 10 characters',
      'REASON_TOO_SHORT'
    )
  }

  return result
}

/**
 * Check if a package can be used in production
 */
export function canPackageBeUsedInProduction(packageData: {
  id: string
  status: string
  quantity: number
  labTestStatus?: string
  productionStatus?: string
  holdStatus?: string
}): ValidationResult {
  const result = createValidationResult()

  // Must have available quantity
  if (packageData.quantity <= 0) {
    addError(
      result,
      'quantity',
      'Package has no available quantity',
      'NO_AVAILABLE_QUANTITY'
    )
  }

  // Check package status
  const validStatuses = ['active', 'available', 'packaged', 'curing', 'ready_to_package']
  if (!validStatuses.includes(packageData.status?.toLowerCase())) {
    addError(
      result,
      'status',
      `Package status "${packageData.status}" is not valid for production`,
      'INVALID_PACKAGE_STATUS'
    )
  }

  // Check if already in production
  if (packageData.productionStatus === 'in_production') {
    addError(
      result,
      'productionStatus',
      'Package is already being used in another production batch',
      'ALREADY_IN_PRODUCTION'
    )
  }

  // Check hold status
  if (packageData.holdStatus === 'on_hold' || packageData.holdStatus === 'quarantined') {
    addError(
      result,
      'holdStatus',
      `Package is ${packageData.holdStatus} and cannot be used in production`,
      'PACKAGE_ON_HOLD'
    )
  }

  // Lab test status warnings
  if (packageData.labTestStatus) {
    if (packageData.labTestStatus === 'failed') {
      addError(
        result,
        'labTestStatus',
        'Package failed lab testing and cannot be used in production',
        'FAILED_LAB_TEST'
      )
    } else if (packageData.labTestStatus === 'pending') {
      addWarning(
        result,
        'labTestStatus',
        'Package lab test results are pending. Production may proceed but final product may require testing.',
        'PENDING_LAB_TEST'
      )
    } else if (!packageData.labTestStatus || packageData.labTestStatus === 'not_tested') {
      addWarning(
        result,
        'labTestStatus',
        'Package has not been lab tested. Depending on state regulations, final product will require testing.',
        'NOT_LAB_TESTED'
      )
    }
  }

  return result
}

/**
 * Validate Metrc production batch sync data
 */
export function validateMetrcProductionBatchSync(data: {
  batchNumber: string
  productionType: string
  startedAt: string
  inputPackageTags: string[]
  facilityLicenseNumber: string
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'batchNumber', data.batchNumber, 'Batch number')
  validateRequired(result, 'productionType', data.productionType, 'Production type')
  validateRequired(result, 'startedAt', data.startedAt, 'Start date')
  validateRequired(result, 'facilityLicenseNumber', data.facilityLicenseNumber, 'Facility license')

  // Must have input packages
  validateArrayNotEmpty(result, 'inputPackageTags', data.inputPackageTags, 'Input package tags')

  // Validate each input tag
  if (data.inputPackageTags) {
    data.inputPackageTags.forEach((tag, index) => {
      if (tag) {
        validateMetrcTag(result, `inputPackageTags[${index}]`, tag, 'Input package tag')
      }
    })
  }

  // Date validation
  if (data.startedAt) {
    validateDate(result, 'startedAt', data.startedAt, 'Start date')
  }

  return result
}

/**
 * Generate suggested production batch name
 */
export function generateProductionBatchName(
  productionType: ProductionType,
  sourceInfo?: string
): string {
  const typePrefix: Record<ProductionType, string> = {
    processing: 'PROC',
    extraction: 'EXT',
    infusion: 'INF',
    packaging: 'PKG',
    preroll: 'PR',
    other: 'PROD',
  }

  const prefix = typePrefix[productionType] || 'PROD'
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const suffix = sourceInfo ? `-${sourceInfo.substring(0, 10)}` : ''

  return `${prefix}-${date}${suffix}`
}
