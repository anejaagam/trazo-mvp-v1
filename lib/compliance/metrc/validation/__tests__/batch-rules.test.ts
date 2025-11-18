/**
 * Batch Validation Rules Tests
 */

import {
  validatePlantBatchCreate,
  validatePlantBatchAdjustment,
  validatePlantBatchSplit,
  validatePlantBatchCreateBatch,
  validateTrazoToMetrcBatchConversion,
} from '../batch-rules'
import type { MetrcPlantBatchCreate, MetrcPlantBatchAdjustment, MetrcPlantBatchSplit } from '../../types'

describe('validatePlantBatchCreate', () => {
  it('should validate a valid plant batch', () => {
    const batch: MetrcPlantBatchCreate = {
      Name: 'BATCH-001',
      Type: 'Clone',
      Count: 100,
      Strain: 'Blue Dream',
      Location: 'Propagation Room 1',
      PlantedDate: '2025-01-01',
    }

    const result = validatePlantBatchCreate(batch)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail validation when required fields are missing', () => {
    const batch = {
      Name: 'BATCH-001',
      // Missing required fields
    } as MetrcPlantBatchCreate

    const result = validatePlantBatchCreate(batch)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should fail validation for invalid batch type', () => {
    const batch: MetrcPlantBatchCreate = {
      Name: 'BATCH-001',
      Type: 'InvalidType' as any,
      Count: 100,
      Strain: 'Blue Dream',
      Location: 'Propagation Room 1',
      PlantedDate: '2025-01-01',
    }

    const result = validatePlantBatchCreate(batch)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.field === 'Type')).toBe(true)
  })

  it('should fail validation for negative plant count', () => {
    const batch: MetrcPlantBatchCreate = {
      Name: 'BATCH-001',
      Type: 'Clone',
      Count: -10,
      Strain: 'Blue Dream',
      Location: 'Propagation Room 1',
      PlantedDate: '2025-01-01',
    }

    const result = validatePlantBatchCreate(batch)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.field === 'Count')).toBe(true)
  })

  it('should warn for unusually high plant count', () => {
    const batch: MetrcPlantBatchCreate = {
      Name: 'BATCH-001',
      Type: 'Clone',
      Count: 15000,
      Strain: 'Blue Dream',
      Location: 'Propagation Room 1',
      PlantedDate: '2025-01-01',
    }

    const result = validatePlantBatchCreate(batch)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings.some((w) => w.code === 'HIGH_PLANT_COUNT')).toBe(true)
  })

  it('should fail validation for name that is too short', () => {
    const batch: MetrcPlantBatchCreate = {
      Name: 'AB',
      Type: 'Clone',
      Count: 100,
      Strain: 'Blue Dream',
      Location: 'Propagation Room 1',
      PlantedDate: '2025-01-01',
    }

    const result = validatePlantBatchCreate(batch)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.field === 'Name')).toBe(true)
  })

  it('should fail validation for future planted date', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)

    const batch: MetrcPlantBatchCreate = {
      Name: 'BATCH-001',
      Type: 'Clone',
      Count: 100,
      Strain: 'Blue Dream',
      Location: 'Propagation Room 1',
      PlantedDate: futureDate.toISOString().split('T')[0],
    }

    const result = validatePlantBatchCreate(batch)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.field === 'PlantedDate')).toBe(true)
  })

  it('should warn for special characters in name', () => {
    const batch: MetrcPlantBatchCreate = {
      Name: 'BATCH-001@#$',
      Type: 'Clone',
      Count: 100,
      Strain: 'Blue Dream',
      Location: 'Propagation Room 1',
      PlantedDate: '2025-01-01',
    }

    const result = validatePlantBatchCreate(batch)
    expect(result.warnings.some((w) => w.code === 'SPECIAL_CHARACTERS_IN_NAME')).toBe(true)
  })
})

describe('validatePlantBatchAdjustment', () => {
  it('should validate a valid adjustment', () => {
    const adjustment: MetrcPlantBatchAdjustment = {
      Id: 12345,
      Count: -5,
      AdjustmentReason: 'Died',
      AdjustmentDate: '2025-01-15',
    }

    const result = validatePlantBatchAdjustment(adjustment)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail validation when required fields are missing', () => {
    const adjustment = {
      Id: 12345,
    } as MetrcPlantBatchAdjustment

    const result = validatePlantBatchAdjustment(adjustment)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should accept negative count for adjustments', () => {
    const adjustment: MetrcPlantBatchAdjustment = {
      Id: 12345,
      Count: -10,
      AdjustmentReason: 'Contamination',
      AdjustmentDate: '2025-01-15',
    }

    const result = validatePlantBatchAdjustment(adjustment)
    expect(result.isValid).toBe(true)
  })

  it('should warn for unrecognized adjustment reason', () => {
    const adjustment: MetrcPlantBatchAdjustment = {
      Id: 12345,
      Count: -5,
      AdjustmentReason: 'Custom Reason',
      AdjustmentDate: '2025-01-15',
    }

    const result = validatePlantBatchAdjustment(adjustment)
    expect(result.warnings.some((w) => w.code === 'UNRECOGNIZED_ADJUSTMENT_REASON')).toBe(true)
  })
})

describe('validatePlantBatchSplit', () => {
  it('should validate a valid split', () => {
    const split: MetrcPlantBatchSplit = {
      PlantBatch: 'BATCH-001',
      GroupName: 'BATCH-001-A',
      Count: 50,
      Location: 'Veg Room 1',
      Strain: 'Blue Dream',
      SplitDate: '2025-01-15',
    }

    const result = validatePlantBatchSplit(split)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail validation for negative count', () => {
    const split: MetrcPlantBatchSplit = {
      PlantBatch: 'BATCH-001',
      GroupName: 'BATCH-001-A',
      Count: -10,
      Location: 'Veg Room 1',
      Strain: 'Blue Dream',
      SplitDate: '2025-01-15',
    }

    const result = validatePlantBatchSplit(split)
    expect(result.isValid).toBe(false)
  })
})

describe('validatePlantBatchCreateBatch', () => {
  it('should validate a batch of valid plant batches', () => {
    const batches: MetrcPlantBatchCreate[] = [
      {
        Name: 'BATCH-001',
        Type: 'Clone',
        Count: 100,
        Strain: 'Blue Dream',
        Location: 'Propagation Room 1',
        PlantedDate: '2025-01-01',
      },
      {
        Name: 'BATCH-002',
        Type: 'Seed',
        Count: 50,
        Strain: 'OG Kush',
        Location: 'Propagation Room 2',
        PlantedDate: '2025-01-02',
      },
    ]

    const result = validatePlantBatchCreateBatch(batches)
    expect(result.isValid).toBe(true)
  })

  it('should fail validation for empty batch array', () => {
    const result = validatePlantBatchCreateBatch([])
    expect(result.isValid).toBe(false)
  })

  it('should fail validation when batch size exceeds limit', () => {
    const batches = Array(101)
      .fill(null)
      .map((_, i) => ({
        Name: `BATCH-${i}`,
        Type: 'Clone' as const,
        Count: 10,
        Strain: 'Test',
        Location: 'Room 1',
        PlantedDate: '2025-01-01',
      }))

    const result = validatePlantBatchCreateBatch(batches)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'BATCH_SIZE_EXCEEDED')).toBe(true)
  })

  it('should warn for duplicate batch names', () => {
    const batches: MetrcPlantBatchCreate[] = [
      {
        Name: 'BATCH-001',
        Type: 'Clone',
        Count: 100,
        Strain: 'Blue Dream',
        Location: 'Propagation Room 1',
        PlantedDate: '2025-01-01',
      },
      {
        Name: 'BATCH-001',
        Type: 'Clone',
        Count: 50,
        Strain: 'Blue Dream',
        Location: 'Propagation Room 2',
        PlantedDate: '2025-01-02',
      },
    ]

    const result = validatePlantBatchCreateBatch(batches)
    expect(result.warnings.some((w) => w.code === 'DUPLICATE_BATCH_NAMES')).toBe(true)
  })
})

describe('validateTrazoToMetrcBatchConversion', () => {
  it('should validate a valid TRAZO cannabis batch', () => {
    const batch = {
      batch_number: 'TRAZO-001',
      plant_count: 100,
      cultivar_name: 'Blue Dream',
      start_date: '2025-01-01',
      stage: 'vegetative',
      domain_type: 'cannabis',
    }

    const result = validateTrazoToMetrcBatchConversion(batch)
    expect(result.isValid).toBe(true)
  })

  it('should fail validation for non-cannabis domain', () => {
    const batch = {
      batch_number: 'TRAZO-001',
      plant_count: 100,
      cultivar_name: 'Tomato',
      start_date: '2025-01-01',
      stage: 'growing',
      domain_type: 'produce',
    }

    const result = validateTrazoToMetrcBatchConversion(batch)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_DOMAIN_TYPE')).toBe(true)
  })

  it('should fail validation for zero plant count', () => {
    const batch = {
      batch_number: 'TRAZO-001',
      plant_count: 0,
      cultivar_name: 'Blue Dream',
      start_date: '2025-01-01',
      stage: 'vegetative',
      domain_type: 'cannabis',
    }

    const result = validateTrazoToMetrcBatchConversion(batch)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_PLANT_COUNT')).toBe(true)
  })

  it('should fail validation for missing cultivar', () => {
    const batch = {
      batch_number: 'TRAZO-001',
      plant_count: 100,
      cultivar_name: '',
      start_date: '2025-01-01',
      stage: 'vegetative',
      domain_type: 'cannabis',
    }

    const result = validateTrazoToMetrcBatchConversion(batch)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'MISSING_CULTIVAR')).toBe(true)
  })

  it('should warn for invalid stage for sync', () => {
    const batch = {
      batch_number: 'TRAZO-001',
      plant_count: 100,
      cultivar_name: 'Blue Dream',
      start_date: '2025-01-01',
      stage: 'harvesting',
      domain_type: 'cannabis',
    }

    const result = validateTrazoToMetrcBatchConversion(batch)
    expect(result.warnings.some((w) => w.code === 'INVALID_STAGE_FOR_SYNC')).toBe(true)
  })
})
