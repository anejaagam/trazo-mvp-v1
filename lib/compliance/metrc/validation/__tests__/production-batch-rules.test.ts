/**
 * Production Batch Validation Rules Tests
 */

import {
  validateProductionBatchCreate,
  validateInputPackage,
  validateInputPackages,
  validateOutputProduct,
  validateOutputProducts,
  validateYieldPercentage,
  validateProductionComplete,
  validateProductionCancel,
  canPackageBeUsedInProduction,
  validateMetrcProductionBatchSync,
  generateProductionBatchName,
  PRODUCTION_TYPES,
  OUTPUT_PRODUCT_TYPES,
  EXPECTED_YIELD_RANGES,
} from '../production-batch-rules'

describe('validateProductionBatchCreate', () => {
  it('should validate a valid production batch', () => {
    const result = validateProductionBatchCreate({
      productionType: 'extraction',
      siteId: 'site-123',
      organizationId: 'org-456',
      startedAt: '2025-11-15',
      expectedYield: 500,
      expectedYieldUnit: 'Grams',
      sourceHarvestId: 'harvest-789',
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should require production type', () => {
    const result = validateProductionBatchCreate({
      productionType: '',
      siteId: 'site-123',
      organizationId: 'org-456',
      startedAt: '2025-11-15',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'productionType',
        code: 'REQUIRED',
      })
    )
  })

  it('should reject invalid production type', () => {
    const result = validateProductionBatchCreate({
      productionType: 'invalid_type',
      siteId: 'site-123',
      organizationId: 'org-456',
      startedAt: '2025-11-15',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'productionType',
        code: 'INVALID_PRODUCTION_TYPE',
      })
    )
  })

  it('should accept all valid production types', () => {
    PRODUCTION_TYPES.forEach((type) => {
      const result = validateProductionBatchCreate({
        productionType: type,
        siteId: 'site-123',
        organizationId: 'org-456',
        startedAt: '2025-11-15',
        sourceHarvestId: 'harvest-789',
      })
      expect(result.isValid).toBe(true)
    })
  })

  it('should warn if no source harvest linked', () => {
    const result = validateProductionBatchCreate({
      productionType: 'extraction',
      siteId: 'site-123',
      organizationId: 'org-456',
      startedAt: '2025-11-15',
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'sourceHarvestId',
        code: 'MISSING_SOURCE_HARVEST',
      })
    )
  })

  it('should reject future start date', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    const futureDateStr = futureDate.toISOString().split('T')[0]

    const result = validateProductionBatchCreate({
      productionType: 'extraction',
      siteId: 'site-123',
      organizationId: 'org-456',
      startedAt: futureDateStr,
      sourceHarvestId: 'harvest-789',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'startedAt',
        code: 'DATE_IN_FUTURE',
      })
    )
  })
})

describe('validateInputPackage', () => {
  it('should validate a valid input package', () => {
    const result = validateInputPackage({
      packageId: 'pkg-123',
      quantityUsed: 1000,
      unitOfMeasure: 'Grams',
      availableQuantity: 2000,
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should validate input package with valid tag', () => {
    const result = validateInputPackage({
      packageId: 'pkg-123',
      packageTag: '1A4FF0100000022000000123', // 24 chars
      quantityUsed: 1000,
      unitOfMeasure: 'Grams',
      availableQuantity: 2000,
    })

    expect(result.isValid).toBe(true)
  })

  it('should require package ID', () => {
    const result = validateInputPackage({
      packageId: '',
      quantityUsed: 1000,
      unitOfMeasure: 'Grams',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'packageId',
        code: 'REQUIRED',
      })
    )
  })

  it('should require positive quantity', () => {
    const result = validateInputPackage({
      packageId: 'pkg-123',
      quantityUsed: -100,
      unitOfMeasure: 'Grams',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'quantityUsed',
        code: 'NOT_POSITIVE',
      })
    )
  })

  it('should reject quantity exceeding available', () => {
    const result = validateInputPackage({
      packageId: 'pkg-123',
      quantityUsed: 1500,
      unitOfMeasure: 'Grams',
      availableQuantity: 1000,
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'quantityUsed',
        code: 'EXCEEDS_AVAILABLE_QUANTITY',
      })
    )
  })

  it('should validate package tag format', () => {
    const result = validateInputPackage({
      packageId: 'pkg-123',
      packageTag: 'INVALID_TAG',
      quantityUsed: 1000,
      unitOfMeasure: 'Grams',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'packageTag',
        code: 'INVALID_TAG_FORMAT',
      })
    )
  })
})

describe('validateInputPackages', () => {
  it('should validate batch of input packages', () => {
    const result = validateInputPackages([
      { packageId: 'pkg-1', quantityUsed: 500, unitOfMeasure: 'Grams' },
      { packageId: 'pkg-2', quantityUsed: 500, unitOfMeasure: 'Grams' },
    ])

    expect(result.isValid).toBe(true)
  })

  it('should reject empty inputs', () => {
    const result = validateInputPackages([])

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'inputs',
        code: 'EMPTY_ARRAY',
      })
    )
  })

  it('should detect duplicate package IDs', () => {
    const result = validateInputPackages([
      { packageId: 'pkg-1', quantityUsed: 500, unitOfMeasure: 'Grams' },
      { packageId: 'pkg-1', quantityUsed: 300, unitOfMeasure: 'Grams' },
    ])

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'DUPLICATE_INPUT_PACKAGE',
      })
    )
  })

  it('should warn on large number of inputs', () => {
    const inputs = Array(55)
      .fill(null)
      .map((_, i) => ({
        packageId: `pkg-${i}`,
        quantityUsed: 100,
        unitOfMeasure: 'Grams',
      }))

    const result = validateInputPackages(inputs)

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'inputs',
        code: 'LARGE_INPUT_BATCH',
      })
    )
  })

  it('should warn for pre-roll with multiple inputs', () => {
    const result = validateInputPackages(
      [
        { packageId: 'pkg-1', quantityUsed: 500, unitOfMeasure: 'Grams' },
        { packageId: 'pkg-2', quantityUsed: 500, unitOfMeasure: 'Grams' },
      ],
      'preroll'
    )

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'PREROLL_MULTIPLE_INPUTS',
      })
    )
  })
})

describe('validateOutputProduct', () => {
  it('should validate a valid output product', () => {
    const result = validateOutputProduct({
      productName: 'Blue Dream Concentrate',
      productType: 'concentrate',
      quantity: 200,
      unitOfMeasure: 'Grams',
      packageTag: '1A4FF0100000022000000456',
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should require all fields', () => {
    const result = validateOutputProduct({
      productName: '',
      productType: '',
      quantity: 0,
      unitOfMeasure: '',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should warn on missing package tag', () => {
    const result = validateOutputProduct({
      productName: 'Blue Dream Concentrate',
      productType: 'concentrate',
      quantity: 200,
      unitOfMeasure: 'Grams',
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'packageTag',
        code: 'MISSING_PACKAGE_TAG',
      })
    )
  })

  it('should warn on unknown product type', () => {
    const result = validateOutputProduct({
      productName: 'Custom Product',
      productType: 'unknown_type',
      quantity: 200,
      unitOfMeasure: 'Grams',
      packageTag: '1A4FF0100000022000000456',
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'productType',
        code: 'UNKNOWN_PRODUCT_TYPE',
      })
    )
  })

  it('should reject product name too long', () => {
    const result = validateOutputProduct({
      productName: 'A'.repeat(151),
      productType: 'concentrate',
      quantity: 200,
      unitOfMeasure: 'Grams',
      packageTag: '1A4FF0100000022000000456',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'productName',
        code: 'NAME_TOO_LONG',
      })
    )
  })

  it('should accept all valid product types', () => {
    OUTPUT_PRODUCT_TYPES.forEach((type) => {
      const result = validateOutputProduct({
        productName: 'Test Product',
        productType: type,
        quantity: 100,
        unitOfMeasure: 'Grams',
        packageTag: '1A4FF0100000022000000456',
      })
      expect(result.warnings.filter((w) => w.code === 'UNKNOWN_PRODUCT_TYPE')).toHaveLength(0)
    })
  })
})

describe('validateOutputProducts', () => {
  it('should validate batch of outputs', () => {
    const result = validateOutputProducts([
      {
        productName: 'Product A',
        productType: 'concentrate',
        quantity: 100,
        unitOfMeasure: 'Grams',
        packageTag: '1A4FF0100000022000000001',
      },
      {
        productName: 'Product B',
        productType: 'oil',
        quantity: 50,
        unitOfMeasure: 'Grams',
        packageTag: '1A4FF0100000022000000002',
      },
    ])

    expect(result.isValid).toBe(true)
  })

  it('should reject empty outputs', () => {
    const result = validateOutputProducts([])

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'outputs',
        code: 'EMPTY_ARRAY',
      })
    )
  })

  it('should detect duplicate output tags', () => {
    const result = validateOutputProducts([
      {
        productName: 'Product A',
        productType: 'concentrate',
        quantity: 100,
        unitOfMeasure: 'Grams',
        packageTag: '1A4FF0100000022000000001',
      },
      {
        productName: 'Product B',
        productType: 'oil',
        quantity: 50,
        unitOfMeasure: 'Grams',
        packageTag: '1A4FF0100000022000000001', // Duplicate
      },
    ])

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'DUPLICATE_OUTPUT_TAG',
      })
    )
  })
})

describe('validateYieldPercentage', () => {
  it('should accept typical extraction yield', () => {
    // 20% yield is typical for extraction
    const result = validateYieldPercentage('extraction', 1000, 200)

    expect(result.isValid).toBe(true)
    expect(result.warnings).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })

  it('should accept typical processing yield', () => {
    // 85% yield is typical for processing
    const result = validateYieldPercentage('processing', 1000, 850)

    expect(result.isValid).toBe(true)
  })

  it('should warn on low extraction yield', () => {
    // 5% yield is very low for extraction
    const result = validateYieldPercentage('extraction', 1000, 50)

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'yield',
        code: 'LOW_YIELD',
      })
    )
  })

  it('should error on impossibly high extraction yield', () => {
    // 50% yield exceeds max for extraction
    const result = validateYieldPercentage('extraction', 1000, 500)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'yield',
        code: 'YIELD_EXCEEDS_MAX',
      })
    )
  })

  it('should warn on significant deviation from typical', () => {
    // 'other' type has typical=80%, range 5-150%
    // 50% yield = 30 points below typical (80), which is > 20 deviation threshold
    const result = validateYieldPercentage('other', 1000, 500)

    // Should be valid but have deviation warning
    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'yield',
        code: 'YIELD_DEVIATION',
      })
    )
  })

  it('should reject zero input weight', () => {
    const result = validateYieldPercentage('extraction', 0, 100)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'inputWeight',
        code: 'INVALID_INPUT_WEIGHT',
      })
    )
  })

  it('should reject negative output weight', () => {
    const result = validateYieldPercentage('extraction', 1000, -100)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'outputWeight',
        code: 'INVALID_OUTPUT_WEIGHT',
      })
    )
  })

  it('should have expected yield ranges for all production types', () => {
    // Verify all production types have defined ranges
    PRODUCTION_TYPES.forEach((type) => {
      expect(EXPECTED_YIELD_RANGES[type]).toBeDefined()
      expect(EXPECTED_YIELD_RANGES[type].min).toBeLessThanOrEqual(EXPECTED_YIELD_RANGES[type].max)
      expect(EXPECTED_YIELD_RANGES[type].typical).toBeGreaterThanOrEqual(
        EXPECTED_YIELD_RANGES[type].min
      )
      expect(EXPECTED_YIELD_RANGES[type].typical).toBeLessThanOrEqual(
        EXPECTED_YIELD_RANGES[type].max
      )
    })
  })
})

describe('validateProductionComplete', () => {
  it('should validate valid completion', () => {
    const result = validateProductionComplete({
      productionBatchId: 'batch-123',
      completedAt: '2025-11-20',
      actualYield: 200,
      actualYieldUnit: 'Grams',
      outputs: [
        {
          productName: 'Concentrate',
          productType: 'concentrate',
          quantity: 200,
          unitOfMeasure: 'Grams',
          packageTag: '1A4FF0100000022000000001',
        },
      ],
    })

    expect(result.isValid).toBe(true)
  })

  it('should require outputs', () => {
    const result = validateProductionComplete({
      productionBatchId: 'batch-123',
      completedAt: '2025-11-20',
      actualYield: 200,
      actualYieldUnit: 'Grams',
      outputs: [],
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'outputs',
        code: 'NO_OUTPUTS',
      })
    )
  })

  it('should require yield variance reason for significant deviation', () => {
    // 5% yield when typical is 20% - should require explanation
    const result = validateProductionComplete(
      {
        productionBatchId: 'batch-123',
        completedAt: '2025-11-20',
        actualYield: 50,
        actualYieldUnit: 'Grams',
        outputs: [
          {
            productName: 'Concentrate',
            productType: 'concentrate',
            quantity: 50,
            unitOfMeasure: 'Grams',
            packageTag: '1A4FF0100000022000000001',
          },
        ],
      },
      'extraction',
      1000 // Input weight
    )

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'yieldVarianceReason',
        code: 'VARIANCE_REASON_REQUIRED',
      })
    )
  })

  it('should accept variance with explanation', () => {
    const result = validateProductionComplete(
      {
        productionBatchId: 'batch-123',
        completedAt: '2025-11-20',
        actualYield: 200, // Normal 20% yield
        actualYieldUnit: 'Grams',
        yieldVarianceReason: 'Within normal range',
        outputs: [
          {
            productName: 'Concentrate',
            productType: 'concentrate',
            quantity: 200,
            unitOfMeasure: 'Grams',
            packageTag: '1A4FF0100000022000000001',
          },
        ],
      },
      'extraction',
      1000
    )

    expect(result.isValid).toBe(true)
  })
})

describe('validateProductionCancel', () => {
  it('should validate valid cancellation', () => {
    const result = validateProductionCancel({
      productionBatchId: 'batch-123',
      cancellationReason: 'Equipment malfunction during production process',
      cancelledAt: '2025-11-20',
      currentStatus: 'in_progress',
    })

    expect(result.isValid).toBe(true)
  })

  it('should reject cancelling completed batch', () => {
    const result = validateProductionCancel({
      productionBatchId: 'batch-123',
      cancellationReason: 'Equipment malfunction',
      cancelledAt: '2025-11-20',
      currentStatus: 'completed',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'currentStatus',
        code: 'CANNOT_CANCEL_COMPLETED',
      })
    )
  })

  it('should reject already cancelled batch', () => {
    const result = validateProductionCancel({
      productionBatchId: 'batch-123',
      cancellationReason: 'Equipment malfunction',
      cancelledAt: '2025-11-20',
      currentStatus: 'cancelled',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'currentStatus',
        code: 'ALREADY_CANCELLED',
      })
    )
  })

  it('should require minimum reason length', () => {
    const result = validateProductionCancel({
      productionBatchId: 'batch-123',
      cancellationReason: 'Too short',
      cancelledAt: '2025-11-20',
      currentStatus: 'planned',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'cancellationReason',
        code: 'REASON_TOO_SHORT',
      })
    )
  })

  it('should allow cancelling planned batches', () => {
    const result = validateProductionCancel({
      productionBatchId: 'batch-123',
      cancellationReason: 'Raw materials not available for production',
      cancelledAt: '2025-11-20',
      currentStatus: 'planned',
    })

    expect(result.isValid).toBe(true)
  })
})

describe('canPackageBeUsedInProduction', () => {
  it('should allow valid package for production', () => {
    const result = canPackageBeUsedInProduction({
      id: 'pkg-123',
      status: 'active',
      quantity: 1000,
      labTestStatus: 'passed',
      productionStatus: undefined,
      holdStatus: undefined,
    })

    expect(result.isValid).toBe(true)
  })

  it('should reject package with no quantity', () => {
    const result = canPackageBeUsedInProduction({
      id: 'pkg-123',
      status: 'active',
      quantity: 0,
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'quantity',
        code: 'NO_AVAILABLE_QUANTITY',
      })
    )
  })

  it('should reject package already in production', () => {
    const result = canPackageBeUsedInProduction({
      id: 'pkg-123',
      status: 'active',
      quantity: 1000,
      productionStatus: 'in_production',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'productionStatus',
        code: 'ALREADY_IN_PRODUCTION',
      })
    )
  })

  it('should reject package on hold', () => {
    const result = canPackageBeUsedInProduction({
      id: 'pkg-123',
      status: 'active',
      quantity: 1000,
      holdStatus: 'on_hold',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'holdStatus',
        code: 'PACKAGE_ON_HOLD',
      })
    )
  })

  it('should reject quarantined package', () => {
    const result = canPackageBeUsedInProduction({
      id: 'pkg-123',
      status: 'active',
      quantity: 1000,
      holdStatus: 'quarantined',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'holdStatus',
        code: 'PACKAGE_ON_HOLD',
      })
    )
  })

  it('should reject package with failed lab test', () => {
    const result = canPackageBeUsedInProduction({
      id: 'pkg-123',
      status: 'active',
      quantity: 1000,
      labTestStatus: 'failed',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'labTestStatus',
        code: 'FAILED_LAB_TEST',
      })
    )
  })

  it('should warn on pending lab test', () => {
    const result = canPackageBeUsedInProduction({
      id: 'pkg-123',
      status: 'active',
      quantity: 1000,
      labTestStatus: 'pending',
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'labTestStatus',
        code: 'PENDING_LAB_TEST',
      })
    )
  })

  it('should warn on not tested package', () => {
    const result = canPackageBeUsedInProduction({
      id: 'pkg-123',
      status: 'active',
      quantity: 1000,
      labTestStatus: 'not_tested',
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'labTestStatus',
        code: 'NOT_LAB_TESTED',
      })
    )
  })

  it('should reject invalid package status', () => {
    const result = canPackageBeUsedInProduction({
      id: 'pkg-123',
      status: 'destroyed',
      quantity: 1000,
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'status',
        code: 'INVALID_PACKAGE_STATUS',
      })
    )
  })
})

describe('validateMetrcProductionBatchSync', () => {
  it('should validate valid sync data', () => {
    const result = validateMetrcProductionBatchSync({
      batchNumber: 'PROD-2025-11-00001',
      productionType: 'extraction',
      startedAt: '2025-11-15',
      inputPackageTags: ['1A4FF0100000022000000001', '1A4FF0100000022000000002'],
      facilityLicenseNumber: 'LIC-12345',
    })

    expect(result.isValid).toBe(true)
  })

  it('should require input package tags', () => {
    const result = validateMetrcProductionBatchSync({
      batchNumber: 'PROD-2025-11-00001',
      productionType: 'extraction',
      startedAt: '2025-11-15',
      inputPackageTags: [],
      facilityLicenseNumber: 'LIC-12345',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'inputPackageTags',
        code: 'EMPTY_ARRAY',
      })
    )
  })

  it('should validate individual input tags', () => {
    const result = validateMetrcProductionBatchSync({
      batchNumber: 'PROD-2025-11-00001',
      productionType: 'extraction',
      startedAt: '2025-11-15',
      inputPackageTags: ['INVALID_TAG', '1A4FF0100000022000000002'],
      facilityLicenseNumber: 'LIC-12345',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'inputPackageTags[0]',
        code: 'INVALID_TAG_FORMAT',
      })
    )
  })
})

describe('generateProductionBatchName', () => {
  it('should generate name with type prefix', () => {
    const name = generateProductionBatchName('extraction')
    expect(name).toMatch(/^EXT-\d{8}$/)
  })

  it('should include source info if provided', () => {
    const name = generateProductionBatchName('extraction', 'HARVEST-001')
    expect(name).toMatch(/^EXT-\d{8}-HARVEST-00$/)
  })

  it('should use correct prefixes for each type', () => {
    expect(generateProductionBatchName('processing')).toMatch(/^PROC-/)
    expect(generateProductionBatchName('extraction')).toMatch(/^EXT-/)
    expect(generateProductionBatchName('infusion')).toMatch(/^INF-/)
    expect(generateProductionBatchName('packaging')).toMatch(/^PKG-/)
    expect(generateProductionBatchName('preroll')).toMatch(/^PR-/)
    expect(generateProductionBatchName('other')).toMatch(/^PROD-/)
  })
})
