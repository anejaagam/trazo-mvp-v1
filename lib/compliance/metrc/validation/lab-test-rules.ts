/**
 * Lab Test Validation Rules
 * Phase 3.5 Week 8 Implementation
 *
 * Validates COA uploads and test results for compliance
 */

import {
  ValidationResult,
  createValidationResult,
  validateRequired,
  validateDate,
  validateDateNotInFuture,
  validatePositiveNumber,
  validateArrayNotEmpty,
  addError,
  addWarning
} from './validators'

export interface LabTestUploadData {
  labName: string
  labLicenseNumber?: string
  testDate: string
  coaFile: {
    name: string
    size: number // bytes
    type: string
  }
  packages?: string[]
  batches?: string[]
  sampleQuantity?: number
  sampleUnitOfMeasure?: string
  notes?: string
}

export interface TestResultsData {
  potency?: {
    tested: boolean
    passed?: boolean
    thc_percent?: number
    cbd_percent?: number
    total_cannabinoids?: number
    thc_mg_per_serving?: number
  }
  pesticides?: {
    tested: boolean
    passed?: boolean
    detected?: string[]
    notes?: string
  }
  heavy_metals?: {
    tested: boolean
    passed?: boolean
    lead_ppb?: number
    cadmium_ppb?: number
    mercury_ppb?: number
    arsenic_ppb?: number
  }
  microbials?: {
    tested: boolean
    passed?: boolean
    e_coli?: string
    salmonella?: string
    aspergillus?: string
    total_yeast_mold_cfu?: number
  }
  mycotoxins?: {
    tested: boolean
    passed?: boolean
    aflatoxin_ppb?: number
    ochratoxin_ppb?: number
  }
  foreign_matter?: {
    tested: boolean
    passed?: boolean
    detected?: boolean
  }
  moisture?: {
    tested: boolean
    passed?: boolean
    percentage?: number
  }
  water_activity?: {
    tested: boolean
    passed?: boolean
    value?: number
  }
}

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
]

// THC limits by product type (example - varies by state)
const THC_LIMITS = {
  flower: 30, // 30% max for flower
  concentrate: 90, // 90% max for concentrates
  edible: 100, // 100mg per package for edibles
  topical: null // No limit for topicals
}

// Required test types by product category (varies by state)
const REQUIRED_TESTS = {
  flower: ['potency', 'pesticides', 'microbials', 'mycotoxins', 'foreign_matter', 'moisture'],
  concentrate: ['potency', 'pesticides', 'microbials', 'heavy_metals', 'residual_solvents'],
  edible: ['potency', 'pesticides', 'microbials', 'heavy_metals'],
  topical: ['potency', 'pesticides', 'microbials']
}

/**
 * Validates lab test upload data
 */
export function validateLabTestUpload(data: LabTestUploadData): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'labName', data.labName, 'Lab name')
  validateRequired(result, 'testDate', data.testDate, 'Test date')
  validateRequired(result, 'coaFile', data.coaFile, 'COA file')

  // Validate test date
  if (data.testDate) {
    validateDate(result, 'testDate', data.testDate, 'Test date')
    validateDateNotInFuture(result, 'testDate', data.testDate, 'Test date')

    // Warn if test date is more than 30 days old
    const testDate = new Date(data.testDate)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    if (testDate < thirtyDaysAgo) {
      addWarning(result, 'testDate', 'Test date is more than 30 days old. Consider retesting for accuracy.', 'test_date_old')
    }
  }

  // Validate file
  if (data.coaFile) {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(data.coaFile.type)) {
      addError(result, 'coaFile', `File type must be PDF or image (PNG/JPG). Got: ${data.coaFile.type}`, 'invalid_file_type')
    }

    // Check file size
    if (data.coaFile.size > MAX_FILE_SIZE) {
      addError(result, 'coaFile', `File size must be less than 10MB. Got: ${(data.coaFile.size / 1024 / 1024).toFixed(2)}MB`, 'file_too_large')
    }

    // Warn about small files that might be corrupted
    if (data.coaFile.size < 1024) { // Less than 1KB
      addWarning(result, 'coaFile', 'File size is very small. Please verify the file is not corrupted.', 'file_too_small')
    }
  }

  // Validate associations
  if (!data.packages?.length && !data.batches?.length) {
    addError(result, 'associations', 'At least one package or batch must be selected for this test', 'no_associations')
  }

  // Validate packages array if provided
  if (data.packages && data.packages.length > 0) {
    validateArrayNotEmpty(result, 'packages', data.packages, 'Packages')

    // Warn if associating with many packages
    if (data.packages.length > 100) {
      addWarning(result, 'packages', `Associating test with ${data.packages.length} packages. Consider if all packages are from the same lot.`, 'many_packages')
    }

    // Check for duplicate packages
    const uniquePackages = new Set(data.packages)
    if (uniquePackages.size !== data.packages.length) {
      addError(result, 'packages', 'Duplicate packages found in selection', 'duplicate_packages')
    }
  }

  // Validate sample quantity if provided
  if (data.sampleQuantity !== undefined) {
    validatePositiveNumber(result, 'sampleQuantity', data.sampleQuantity, 'Sample quantity')

    // Warn about unusual sample sizes
    if (data.sampleQuantity > 1000) {
      addWarning(result, 'sampleQuantity', 'Sample quantity seems unusually large. Please verify.', 'large_sample')
    }
  }

  // Validate sample unit if quantity is provided
  if (data.sampleQuantity && !data.sampleUnitOfMeasure) {
    addError(result, 'sampleUnitOfMeasure', 'Sample unit of measure is required when sample quantity is provided', 'missing_unit')
  }

  // Validate lab license number format if provided (state-specific)
  if (data.labLicenseNumber) {
    // Basic format check - adjust based on state requirements
    const licensePattern = /^[A-Z0-9]{6,20}$/
    if (!licensePattern.test(data.labLicenseNumber)) {
      addWarning(result, 'labLicenseNumber', 'Lab license number format may be invalid', 'invalid_license_format')
    }
  }

  return result
}

/**
 * Validates test results data
 */
export function validateTestResults(
  results: TestResultsData,
  productType?: 'flower' | 'concentrate' | 'edible' | 'topical'
): ValidationResult {
  const result = createValidationResult()

  // Check if any tests were performed
  const hasAnyTests = Object.values(results).some(test => test?.tested === true)
  if (!hasAnyTests) {
    addError(result, 'tests', 'At least one test type must be performed', 'no_tests')
    return result
  }

  // Validate potency results
  if (results.potency?.tested) {
    if (results.potency.passed === undefined) {
      addError(result, 'potency.passed', 'Potency test status (pass/fail) is required', 'potency_status_missing')
    }

    // Validate THC percentage
    if (results.potency.thc_percent !== undefined) {
      if (results.potency.thc_percent < 0 || results.potency.thc_percent > 100) {
        addError(result, 'potency.thc_percent', 'THC percentage must be between 0 and 100', 'invalid_thc_percent')
      }

      // Check THC limits if product type is known
      if (productType && THC_LIMITS[productType] !== null) {
        if (results.potency.thc_percent > THC_LIMITS[productType]) {
          addWarning(result, 'potency.thc_percent', `THC percentage (${results.potency.thc_percent}%) exceeds typical limit for ${productType} (${THC_LIMITS[productType]}%)`, 'thc_exceeds_limit')
        }
      }
    }

    // Validate CBD percentage
    if (results.potency.cbd_percent !== undefined) {
      if (results.potency.cbd_percent < 0 || results.potency.cbd_percent > 100) {
        addError(result, 'potency.cbd_percent', 'CBD percentage must be between 0 and 100', 'invalid_cbd_percent')
      }
    }

    // Validate total cannabinoids
    if (results.potency.total_cannabinoids !== undefined) {
      if (results.potency.total_cannabinoids < 0 || results.potency.total_cannabinoids > 100) {
        addError(result, 'potency.total_cannabinoids', 'Total cannabinoids must be between 0 and 100%', 'invalid_total_cannabinoids')
      }

      // Check if total is reasonable given THC and CBD
      if (results.potency.thc_percent !== undefined && results.potency.cbd_percent !== undefined) {
        const minTotal = results.potency.thc_percent + results.potency.cbd_percent
        if (results.potency.total_cannabinoids < minTotal) {
          addError(result, 'potency.total_cannabinoids', 'Total cannabinoids cannot be less than THC + CBD', 'invalid_cannabinoid_total')
        }
      }
    }

    // Validate THC per serving for edibles
    if (results.potency.thc_mg_per_serving !== undefined) {
      if (results.potency.thc_mg_per_serving < 0) {
        addError(result, 'potency.thc_mg_per_serving', 'THC per serving cannot be negative', 'negative_thc_serving')
      }
      if (productType === 'edible' && results.potency.thc_mg_per_serving > 10) {
        addWarning(result, 'potency.thc_mg_per_serving', 'THC per serving exceeds 10mg limit for edibles in most states', 'high_thc_serving')
      }
    }
  }

  // Validate pesticides results
  if (results.pesticides?.tested) {
    if (results.pesticides.passed === undefined) {
      addError(result, 'pesticides.passed', 'Pesticides test status (pass/fail) is required', 'pesticides_status_missing')
    }

    if (results.pesticides.passed === false && (!results.pesticides.detected || results.pesticides.detected.length === 0)) {
      addWarning(result, 'pesticides.detected', 'Failed pesticides test should specify which pesticides were detected', 'pesticides_no_details')
    }
  }

  // Validate heavy metals results
  if (results.heavy_metals?.tested) {
    if (results.heavy_metals.passed === undefined) {
      addError(result, 'heavy_metals.passed', 'Heavy metals test status (pass/fail) is required', 'heavy_metals_status_missing')
    }

    // Validate individual metal values if provided
    const metals = ['lead_ppb', 'cadmium_ppb', 'mercury_ppb', 'arsenic_ppb'] as const
    for (const metal of metals) {
      const value = results.heavy_metals[metal]
      if (value !== undefined && value < 0) {
        addError(result, `heavy_metals.${metal}`, `${metal.replace('_ppb', '')} value cannot be negative`, `negative_${metal}`)
      }
    }
  }

  // Validate microbials results
  if (results.microbials?.tested) {
    if (results.microbials.passed === undefined) {
      addError(result, 'microbials.passed', 'Microbials test status (pass/fail) is required', 'microbials_status_missing')
    }

    // Validate pathogen results
    const pathogens = ['e_coli', 'salmonella', 'aspergillus'] as const
    for (const pathogen of pathogens) {
      const value = results.microbials[pathogen]
      if (value !== undefined && !['detected', 'not_detected'].includes(value)) {
        addError(result, `microbials.${pathogen}`, `${pathogen} result must be 'detected' or 'not_detected'`, `invalid_${pathogen}_result`)
      }
    }

    // Validate yeast/mold count
    if (results.microbials.total_yeast_mold_cfu !== undefined) {
      if (results.microbials.total_yeast_mold_cfu < 0) {
        addError(result, 'microbials.total_yeast_mold_cfu', 'Yeast/mold count cannot be negative', 'negative_yeast_mold')
      }
      if (results.microbials.total_yeast_mold_cfu > 10000) {
        addWarning(result, 'microbials.total_yeast_mold_cfu', 'Yeast/mold count exceeds typical action limit of 10,000 CFU', 'high_yeast_mold')
      }
    }
  }

  // Validate moisture results
  if (results.moisture?.tested) {
    if (results.moisture.passed === undefined) {
      addError(result, 'moisture.passed', 'Moisture test status (pass/fail) is required', 'moisture_status_missing')
    }

    if (results.moisture.percentage !== undefined) {
      if (results.moisture.percentage < 0 || results.moisture.percentage > 100) {
        addError(result, 'moisture.percentage', 'Moisture percentage must be between 0 and 100', 'invalid_moisture')
      }

      // Warn about high moisture for flower
      if (productType === 'flower' && results.moisture.percentage > 15) {
        addWarning(result, 'moisture.percentage', 'Moisture content above 15% may lead to mold growth in flower products', 'high_moisture')
      }
    }
  }

  // Validate water activity results
  if (results.water_activity?.tested) {
    if (results.water_activity.passed === undefined) {
      addError(result, 'water_activity.passed', 'Water activity test status (pass/fail) is required', 'water_activity_status_missing')
    }

    if (results.water_activity.value !== undefined) {
      if (results.water_activity.value < 0 || results.water_activity.value > 1) {
        addError(result, 'water_activity.value', 'Water activity must be between 0 and 1', 'invalid_water_activity')
      }

      // Warn about high water activity
      if (results.water_activity.value > 0.65) {
        addWarning(result, 'water_activity.value', 'Water activity above 0.65 may support microbial growth', 'high_water_activity')
      }
    }
  }

  // Check for required tests based on product type
  if (productType && REQUIRED_TESTS[productType]) {
    const requiredTests = REQUIRED_TESTS[productType]
    const missingTests = requiredTests.filter(testType => {
      const test = results[testType as keyof TestResultsData]
      return !test || !test.tested
    })

    if (missingTests.length > 0) {
      addWarning(result, 'requiredTests', `The following tests are typically required for ${productType}: ${missingTests.join(', ')}`, 'missing_required_tests')
    }
  }

  // Check overall test status consistency
  const failedTests = Object.entries(results).filter(([_, test]) => {
    return test?.tested && test?.passed === false
  }).map(([name]) => name)

  if (failedTests.length > 0) {
    addWarning(result, 'status', `The following tests failed: ${failedTests.join(', ')}. Product may not be suitable for sale.`, 'has_failed_tests')
  }

  return result
}

/**
 * Validates package test association
 */
export function validatePackageTestAssociation(
  packageId: string,
  testId: string,
  sampleTaken: boolean = false,
  sampleQuantity?: number
): ValidationResult {
  const result = createValidationResult()

  validateRequired(result, 'packageId', packageId, 'Package ID')
  validateRequired(result, 'testId', testId, 'Test ID')

  // If sample was taken, quantity should be provided
  if (sampleTaken && !sampleQuantity) {
    addWarning(result, 'sampleQuantity', 'Sample quantity should be recorded when sample is taken from package', 'missing_sample_quantity')
  }

  // Validate sample quantity if provided
  if (sampleQuantity !== undefined) {
    validatePositiveNumber(result, 'sampleQuantity', sampleQuantity, 'Sample quantity')
  }

  return result
}

/**
 * Validates test status update
 */
export function validateTestStatusUpdate(
  currentStatus: string,
  newStatus: string,
  testResults?: TestResultsData
): ValidationResult {
  const result = createValidationResult()

  const validStatuses = ['pending', 'in_progress', 'passed', 'failed', 'conditional', 'retesting']

  if (!validStatuses.includes(newStatus)) {
    addError(result, 'status', `Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`, 'invalid_status')
  }

  // Status transition rules
  const invalidTransitions: Record<string, string[]> = {
    'passed': ['pending', 'in_progress'], // Can't go back from passed
    'failed': ['pending', 'in_progress'], // Can't go back from failed
  }

  if (invalidTransitions[currentStatus]?.includes(newStatus)) {
    addError(result, 'status', `Cannot transition from ${currentStatus} to ${newStatus}`, 'invalid_transition')
  }

  // If setting to passed/failed, test results should be provided
  if (['passed', 'failed'].includes(newStatus) && !testResults) {
    addWarning(result, 'testResults', `Setting status to ${newStatus} without providing test results`, 'missing_results')
  }

  // If test results indicate failures but status is passed
  if (newStatus === 'passed' && testResults) {
    const hasFailures = Object.values(testResults).some(test =>
      test?.tested && test?.passed === false
    )
    if (hasFailures) {
      addError(result, 'status', 'Cannot set status to passed when test results contain failures', 'status_mismatch')
    }
  }

  return result
}