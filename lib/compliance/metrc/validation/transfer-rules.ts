/**
 * Transfer Manifest Validation Rules
 *
 * Validates transfer manifest creation for Metrc compliance:
 * - License number verification
 * - Package availability
 * - Driver and vehicle information
 * - Timing validations
 */

import type { ValidationResult } from '@/lib/compliance/types'
import {
  createValidationResult,
  validateRequired,
  validateDate,
  addError,
  addWarning,
} from './validators'

/**
 * Validate transfer manifest creation
 */
export function validateTransferManifest(manifest: {
  recipientLicenseNumber: string
  recipientFacilityName: string
  transferType: string
  estimatedDeparture: string
  estimatedArrival: string
  driverName?: string
  driverLicense?: string
  vehiclePlate?: string
  packages: Array<{
    packageLabel: string
    quantity: number
    unitOfMeasure: string
  }>
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'recipientLicenseNumber', manifest.recipientLicenseNumber)
  validateRequired(result, 'recipientFacilityName', manifest.recipientFacilityName)
  validateRequired(result, 'transferType', manifest.transferType)
  validateRequired(result, 'estimatedDeparture', manifest.estimatedDeparture)
  validateRequired(result, 'estimatedArrival', manifest.estimatedArrival)

  // Validate license number format
  if (manifest.recipientLicenseNumber && manifest.recipientLicenseNumber.length < 3) {
    addError(
      result,
      'recipientLicenseNumber',
      'License number must be at least 3 characters',
      'INVALID_LICENSE_NUMBER'
    )
  }

  // Validate dates
  if (manifest.estimatedDeparture && manifest.estimatedArrival) {
    validateDate(result, 'estimatedDeparture', manifest.estimatedDeparture)
    validateDate(result, 'estimatedArrival', manifest.estimatedArrival)

    const departure = new Date(manifest.estimatedDeparture)
    const arrival = new Date(manifest.estimatedArrival)

    if (arrival < departure) {
      addError(
        result,
        'estimatedArrival',
        'Arrival time must be after departure time',
        'INVALID_ARRIVAL_TIME'
      )
    }

    // Warn if trip duration > 24 hours
    const hoursDiff = (arrival.getTime() - departure.getTime()) / (1000 * 60 * 60)
    if (hoursDiff > 24) {
      addWarning(
        result,
        'estimatedArrival',
        `Transfer duration is ${hoursDiff.toFixed(1)} hours. Verify timing is correct.`,
        'LONG_TRANSFER_DURATION'
      )
    }
  }

  // Validate packages
  if (!manifest.packages || manifest.packages.length === 0) {
    addError(
      result,
      'packages',
      'At least one package must be included in the transfer',
      'NO_PACKAGES'
    )
  }

  // Validate package labels
  manifest.packages.forEach((pkg, index) => {
    if (!pkg.packageLabel) {
      addError(
        result,
        `packages[${index}].packageLabel`,
        'Package label is required',
        'MISSING_PACKAGE_LABEL'
      )
    } else if (!validatePackageLabel(pkg.packageLabel)) {
      addError(
        result,
        `packages[${index}].packageLabel`,
        `Invalid Metrc package label: ${pkg.packageLabel}`,
        'INVALID_PACKAGE_LABEL'
      )
    }

    if (!pkg.quantity || pkg.quantity <= 0) {
      addError(
        result,
        `packages[${index}].quantity`,
        'Package quantity must be greater than 0',
        'INVALID_QUANTITY'
      )
    }
  })

  // Warn if driver/vehicle info missing (recommended but not always required)
  if (!manifest.driverName) {
    addWarning(
      result,
      'driverName',
      'Driver name is recommended for transfer documentation',
      'MISSING_DRIVER_NAME'
    )
  }

  if (!manifest.vehiclePlate) {
    addWarning(
      result,
      'vehiclePlate',
      'Vehicle license plate is recommended for transfer documentation',
      'MISSING_VEHICLE_PLATE'
    )
  }

  return result
}

/**
 * Validate transfer receipt
 */
export function validateTransferReceipt(receipt: {
  manifestNumber: string
  receivedDateTime: string
  packages: Array<{
    packageLabel: string
    accepted: boolean
    receivedQuantity?: number
    rejectionReason?: string
  }>
}): ValidationResult {
  const result = createValidationResult()

  validateRequired(result, 'manifestNumber', receipt.manifestNumber)
  validateRequired(result, 'receivedDateTime', receipt.receivedDateTime)
  validateDate(result, 'receivedDateTime', receipt.receivedDateTime)

  if (!receipt.packages || receipt.packages.length === 0) {
    addError(
      result,
      'packages',
      'At least one package must be acknowledged',
      'NO_PACKAGES'
    )
  }

  receipt.packages.forEach((pkg, index) => {
    if (pkg.accepted === false && !pkg.rejectionReason) {
      addError(
        result,
        `packages[${index}].rejectionReason`,
        'Rejection reason required for rejected packages',
        'MISSING_REJECTION_REASON'
      )
    }
  })

  return result
}

/**
 * Validate package label format (24-character Metrc format)
 */
export function validatePackageLabel(label: string): boolean {
  // Metrc package labels are 24 characters: 1A + StateCode + License + Sequence
  // Example: 1A4FF0100000022000000123
  const packageLabelRegex = /^1A[A-Z0-9]{7}\d{15}$/
  return packageLabelRegex.test(label)
}

/**
 * Validate transfer type
 */
export function validateTransferType(transferType: string): ValidationResult {
  const result = createValidationResult()

  const validTypes = [
    'Wholesale',
    'Transfer',
    'Sale',
    'Return',
    'Donation',
    'Disposal'
  ]

  if (!validTypes.includes(transferType)) {
    addWarning(
      result,
      'transferType',
      `Transfer type "${transferType}" may not be recognized by Metrc. Valid types: ${validTypes.join(', ')}`,
      'UNKNOWN_TRANSFER_TYPE'
    )
  }

  return result
}
