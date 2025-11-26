/**
 * Harvest Validation Rules Tests
 */

import {
  validateHarvestCreate,
  validateMetrcHarvestCreate,
  validateHarvestPackageCreate,
  validateHarvestPackageCreateBatch,
  validateDryWeightUpdate,
  validateWasteRemoval,
  validateHarvestReadyToFinish,
  generateMetrcHarvestName,
} from '../harvest-rules'

describe('validateHarvestCreate', () => {
  it('should validate a valid harvest', () => {
    const result = validateHarvestCreate({
      batchId: 'batch-123',
      wetWeight: 5000,
      plantCount: 10,
      harvestedAt: '2025-11-15',
      harvestType: 'WholePlant',
      location: 'Room A',
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should require batchId', () => {
    const result = validateHarvestCreate({
      batchId: '',
      wetWeight: 5000,
      plantCount: 10,
      harvestedAt: '2025-11-15',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'batchId',
        code: 'REQUIRED',
      })
    )
  })

  it('should require positive wet weight', () => {
    const result = validateHarvestCreate({
      batchId: 'batch-123',
      wetWeight: -100,
      plantCount: 10,
      harvestedAt: '2025-11-15',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'wetWeight',
        code: 'NOT_POSITIVE',
      })
    )
  })

  it('should warn on low weight per plant', () => {
    const result = validateHarvestCreate({
      batchId: 'batch-123',
      wetWeight: 50, // 5g per plant (very low)
      plantCount: 10,
      harvestedAt: '2025-11-15',
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'wetWeight',
        code: 'LOW_WEIGHT_PER_PLANT',
      })
    )
  })

  it('should warn on high weight per plant', () => {
    const result = validateHarvestCreate({
      batchId: 'batch-123',
      wetWeight: 25000, // 2500g per plant (very high)
      plantCount: 10,
      harvestedAt: '2025-11-15',
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'wetWeight',
        code: 'HIGH_WEIGHT_PER_PLANT',
      })
    )
  })

  it('should warn on large plant count', () => {
    const result = validateHarvestCreate({
      batchId: 'batch-123',
      wetWeight: 500000,
      plantCount: 1500,
      harvestedAt: '2025-11-15',
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'plantCount',
        code: 'LARGE_PLANT_COUNT',
      })
    )
  })

  it('should reject invalid harvest type', () => {
    const result = validateHarvestCreate({
      batchId: 'batch-123',
      wetWeight: 5000,
      plantCount: 10,
      harvestedAt: '2025-11-15',
      // @ts-expect-error - testing invalid type
      harvestType: 'InvalidType',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'harvestType',
        code: 'INVALID_HARVEST_TYPE',
      })
    )
  })

  it('should reject future harvest date', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    const futureDateStr = futureDate.toISOString().split('T')[0]

    const result = validateHarvestCreate({
      batchId: 'batch-123',
      wetWeight: 5000,
      plantCount: 10,
      harvestedAt: futureDateStr,
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'harvestedAt',
        code: 'DATE_IN_FUTURE',
      })
    )
  })
})

describe('validateMetrcHarvestCreate', () => {
  it('should validate a valid Metrc harvest', () => {
    const result = validateMetrcHarvestCreate({
      PlantLabels: ['1A4FF0100000022000000001', '1A4FF0100000022000000002'],
      HarvestName: 'BATCH-001-H1',
      DryingLocation: 'Drying Room A',
      WasteWeight: 10,
      WasteUnitOfMeasure: 'Grams',
      HarvestDate: '2025-11-15',
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should require all Metrc fields', () => {
    const result = validateMetrcHarvestCreate({
      PlantLabels: [],
      HarvestName: '',
      DryingLocation: '',
      WasteWeight: 0,
      WasteUnitOfMeasure: '',
      HarvestDate: '',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should reject harvest name too long', () => {
    const result = validateMetrcHarvestCreate({
      PlantLabels: ['1A4FF0100000022000000001'],
      HarvestName: 'A'.repeat(101),
      DryingLocation: 'Room A',
      WasteWeight: 10,
      WasteUnitOfMeasure: 'Grams',
      HarvestDate: '2025-11-15',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'HarvestName',
        code: 'NAME_TOO_LONG',
      })
    )
  })
})

describe('validateHarvestPackageCreate', () => {
  it('should validate a valid package', () => {
    const result = validateHarvestPackageCreate({
      Tag: '1A4FF0100000022000000123',
      Location: 'Main Facility',
      Item: 'Flower - Strain Name',
      Quantity: 100,
      UnitOfMeasure: 'Grams',
      PackagedDate: '2025-11-15',
      ProductionBatchNumber: 'BATCH-001',
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should require all package fields', () => {
    const result = validateHarvestPackageCreate({
      Tag: '',
      Location: '',
      Item: '',
      Quantity: 0,
      UnitOfMeasure: '',
      PackagedDate: '',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should warn on missing production batch number', () => {
    const result = validateHarvestPackageCreate({
      Tag: '1A4FF0100000022000000123',
      Location: 'Main Facility',
      Item: 'Flower',
      Quantity: 100,
      UnitOfMeasure: 'Grams',
      PackagedDate: '2025-11-15',
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'ProductionBatchNumber',
        code: 'MISSING_PRODUCTION_BATCH',
      })
    )
  })

  it('should warn on invalid tag format', () => {
    const result = validateHarvestPackageCreate({
      Tag: 'INVALID',
      Location: 'Main Facility',
      Item: 'Flower',
      Quantity: 100,
      UnitOfMeasure: 'Grams',
      PackagedDate: '2025-11-15',
      ProductionBatchNumber: 'BATCH-001',
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'Tag',
        code: 'INVALID_TAG_FORMAT',
      })
    )
  })
})

describe('validateHarvestPackageCreateBatch', () => {
  it('should validate batch of packages', () => {
    const result = validateHarvestPackageCreateBatch([
      {
        Tag: '1A4FF0100000022000000001',
        Location: 'Main Facility',
        Item: 'Flower',
        Quantity: 100,
        UnitOfMeasure: 'Grams',
        PackagedDate: '2025-11-15',
        ProductionBatchNumber: 'BATCH-001',
      },
      {
        Tag: '1A4FF0100000022000000002',
        Location: 'Main Facility',
        Item: 'Flower',
        Quantity: 100,
        UnitOfMeasure: 'Grams',
        PackagedDate: '2025-11-15',
        ProductionBatchNumber: 'BATCH-001',
      },
    ])

    expect(result.isValid).toBe(true)
  })

  it('should reject empty batch', () => {
    const result = validateHarvestPackageCreateBatch([])

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'packages',
        code: 'EMPTY_BATCH',
      })
    )
  })

  it('should reject batch size > 100', () => {
    const packages = Array(101).fill({
      Tag: '1A4FF0100000022000000001',
      Location: 'Main Facility',
      Item: 'Flower',
      Quantity: 100,
      UnitOfMeasure: 'Grams',
      PackagedDate: '2025-11-15',
    })

    const result = validateHarvestPackageCreateBatch(packages)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'packages',
        code: 'BATCH_SIZE_EXCEEDED',
      })
    )
  })

  it('should detect duplicate tags', () => {
    const result = validateHarvestPackageCreateBatch([
      {
        Tag: '1A4FF0100000022000000001',
        Location: 'Main Facility',
        Item: 'Flower',
        Quantity: 100,
        UnitOfMeasure: 'Grams',
        PackagedDate: '2025-11-15',
      },
      {
        Tag: '1A4FF0100000022000000001', // Duplicate
        Location: 'Main Facility',
        Item: 'Flower',
        Quantity: 100,
        UnitOfMeasure: 'Grams',
        PackagedDate: '2025-11-15',
      },
    ])

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'packages',
        code: 'DUPLICATE_TAGS',
      })
    )
  })
})

describe('validateDryWeightUpdate', () => {
  it('should validate correct dry weight', () => {
    const result = validateDryWeightUpdate({
      wetWeight: 5000,
      dryWeight: 1250, // 75% moisture loss (typical)
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('should reject dry weight exceeding wet weight', () => {
    const result = validateDryWeightUpdate({
      wetWeight: 1000,
      dryWeight: 1500,
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'dryWeight',
        code: 'DRY_WEIGHT_EXCEEDS_WET',
      })
    )
  })

  it('should warn on low moisture loss', () => {
    const result = validateDryWeightUpdate({
      wetWeight: 1000,
      dryWeight: 900, // 10% moisture loss (too low)
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'dryWeight',
        code: 'LOW_MOISTURE_LOSS',
      })
    )
  })

  it('should warn on high moisture loss', () => {
    const result = validateDryWeightUpdate({
      wetWeight: 1000,
      dryWeight: 50, // 95% moisture loss (too high)
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'dryWeight',
        code: 'HIGH_MOISTURE_LOSS',
      })
    )
  })
})

describe('validateWasteRemoval', () => {
  it('should validate waste removal', () => {
    const result = validateWasteRemoval({
      wasteWeight: 500,
      wasteType: 'Stems',
      actualDate: '2025-11-15',
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should require all fields', () => {
    const result = validateWasteRemoval({
      wasteWeight: 0,
      wasteType: '',
      actualDate: '',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should reject negative waste weight', () => {
    const result = validateWasteRemoval({
      wasteWeight: -100,
      wasteType: 'Stems',
      actualDate: '2025-11-15',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'wasteWeight',
        code: 'NOT_POSITIVE',
      })
    )
  })
})

describe('validateHarvestReadyToFinish', () => {
  it('should validate harvest ready to finish', () => {
    const result = validateHarvestReadyToFinish({
      status: 'curing',
      wetWeight: 5000,
      dryWeight: 1250,
      packagedWeight: 1200,
    })

    expect(result.isValid).toBe(true)
  })

  it('should warn if no dry weight recorded', () => {
    const result = validateHarvestReadyToFinish({
      status: 'drying',
      wetWeight: 5000,
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'dryWeight',
        code: 'MISSING_DRY_WEIGHT',
      })
    )
  })

  it('should warn if significant unpackaged weight', () => {
    const result = validateHarvestReadyToFinish({
      status: 'curing',
      wetWeight: 5000,
      dryWeight: 1250,
      packagedWeight: 500, // Only 40% packaged
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'packagedWeight',
        code: 'UNPACKAGED_WEIGHT',
      })
    )
  })

  it('should reject invalid status for finishing', () => {
    const result = validateHarvestReadyToFinish({
      status: 'finished', // Already finished
      wetWeight: 5000,
      dryWeight: 1250,
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'status',
        code: 'INVALID_STATUS',
      })
    )
  })
})

describe('generateMetrcHarvestName', () => {
  it('should generate default harvest name', () => {
    const name = generateMetrcHarvestName('BATCH-001')
    expect(name).toBe('BATCH-001-H1')
  })

  it('should generate sequential harvest names', () => {
    expect(generateMetrcHarvestName('BATCH-001', 1)).toBe('BATCH-001-H1')
    expect(generateMetrcHarvestName('BATCH-001', 2)).toBe('BATCH-001-H2')
    expect(generateMetrcHarvestName('BATCH-001', 3)).toBe('BATCH-001-H3')
  })
})
