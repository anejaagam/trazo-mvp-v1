/**
 * Unit Tests for Waste Destruction Validation Rules
 *
 * Tests for 50:50 rendering compliance, plant batch destruction,
 * package destruction, and Metrc payload validation
 */

import {
  validateWasteDestruction,
  validatePlantBatchDestruction,
  validatePackageDestruction,
  validateMetrcWastePayload,
  mapRenderingMethodToMetrc,
} from '../waste-destruction-rules'

describe('validateWasteDestruction', () => {
  it('should validate valid waste destruction', () => {
    const result = validateWasteDestruction({
      wasteWeight: 5.5,
      wasteUnit: 'Kilograms',
      destructionDate: '2025-11-20',
      renderingMethod: '50_50_sawdust',
      wasteCategory: 'plant_material',
      batchId: 'batch-123',
      inertMaterialWeight: 5.5,
      inertMaterialUnit: 'Kilograms',
      witnessedBy: 'user-123',
    })
    expect(result.isValid).toBe(true)
  })

  it('should fail when 50:50 mix lacks inert material weight', () => {
    const result = validateWasteDestruction({
      wasteWeight: 5.5,
      wasteUnit: 'Kilograms',
      destructionDate: '2025-11-20',
      renderingMethod: '50_50_sawdust',
      wasteCategory: 'plant_material',
      batchId: 'batch-123',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'MISSING_INERT_MATERIAL_WEIGHT')).toBe(true)
  })

  it('should fail when inert material weight is too low', () => {
    const result = validateWasteDestruction({
      wasteWeight: 10.0,
      wasteUnit: 'Kilograms',
      destructionDate: '2025-11-20',
      renderingMethod: '50_50_sawdust',
      wasteCategory: 'plant_material',
      batchId: 'batch-123',
      inertMaterialWeight: 5.0, // Too low for 50:50
      inertMaterialUnit: 'Kilograms',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INERT_MATERIAL_TOO_LOW')).toBe(true)
  })

  it('should warn when 50:50 destruction lacks witness', () => {
    const result = validateWasteDestruction({
      wasteWeight: 5.5,
      wasteUnit: 'Kilograms',
      destructionDate: '2025-11-20',
      renderingMethod: '50_50_sawdust',
      wasteCategory: 'plant_material',
      batchId: 'batch-123',
      inertMaterialWeight: 5.5,
      inertMaterialUnit: 'Kilograms',
    })
    expect(result.warnings.some((w) => w.code === 'MISSING_WITNESS')).toBe(true)
  })

  it('should fail when no source entity is provided', () => {
    const result = validateWasteDestruction({
      wasteWeight: 5.5,
      wasteUnit: 'Kilograms',
      destructionDate: '2025-11-20',
      renderingMethod: '50_50_sawdust',
      wasteCategory: 'plant_material',
      inertMaterialWeight: 5.5,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'MISSING_ENTITY_SOURCE')).toBe(true)
  })

  it('should warn for unusually high waste weight', () => {
    const result = validateWasteDestruction({
      wasteWeight: 150,
      wasteUnit: 'Kilograms',
      destructionDate: '2025-11-20',
      renderingMethod: '50_50_sawdust',
      wasteCategory: 'plant_material',
      batchId: 'batch-123',
      inertMaterialWeight: 150,
    })
    expect(result.warnings.some((w) => w.code === 'HIGH_WASTE_WEIGHT')).toBe(true)
  })
})

describe('validatePlantBatchDestruction', () => {
  it('should validate valid plant batch destruction', () => {
    const result = validatePlantBatchDestruction({
      batchId: 'batch-123',
      plantsDestroyed: 10,
      totalPlantsInBatch: 100,
      plantTags: ['1A4FF0100000022000000001', '1A4FF0100000022000000002'],
      wasteWeight: 5.5,
      wasteReason: 'Male Plants',
    })
    expect(result.isValid).toBe(true)
  })

  it('should fail when destroying more plants than exist', () => {
    const result = validatePlantBatchDestruction({
      batchId: 'batch-123',
      plantsDestroyed: 150,
      totalPlantsInBatch: 100,
      wasteWeight: 5.5,
      wasteReason: 'Male Plants',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'EXCEEDS_BATCH_PLANT_COUNT')).toBe(true)
  })

  it('should fail when destroying zero or negative plants', () => {
    const result = validatePlantBatchDestruction({
      batchId: 'batch-123',
      plantsDestroyed: 0,
      totalPlantsInBatch: 100,
      wasteWeight: 5.5,
      wasteReason: 'Male Plants',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_PLANTS_DESTROYED')).toBe(true)
  })

  it('should warn for very low average plant weight', () => {
    const result = validatePlantBatchDestruction({
      batchId: 'batch-123',
      plantsDestroyed: 100,
      totalPlantsInBatch: 100,
      wasteWeight: 2.0, // 0.02 kg per plant = 20g
      wasteReason: 'Quality Issues',
    })
    expect(result.warnings.some((w) => w.code === 'LOW_AVG_PLANT_WEIGHT')).toBe(true)
  })

  it('should warn for very high average plant weight', () => {
    const result = validatePlantBatchDestruction({
      batchId: 'batch-123',
      plantsDestroyed: 10,
      totalPlantsInBatch: 100,
      wasteWeight: 25.0, // 2.5 kg per plant
      wasteReason: 'Male Plants',
    })
    expect(result.warnings.some((w) => w.code === 'HIGH_AVG_PLANT_WEIGHT')).toBe(true)
  })

  it('should fail for invalid plant tag format', () => {
    const result = validatePlantBatchDestruction({
      batchId: 'batch-123',
      plantsDestroyed: 2,
      totalPlantsInBatch: 100,
      plantTags: ['INVALID-TAG', '1A4FF0100000022000000002'],
      wasteWeight: 1.0,
      wasteReason: 'Male Plants',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_PLANT_TAG_FORMAT')).toBe(true)
  })

  it('should warn when tag count does not match plants destroyed', () => {
    const result = validatePlantBatchDestruction({
      batchId: 'batch-123',
      plantsDestroyed: 5,
      totalPlantsInBatch: 100,
      plantTags: ['1A4FF0100000022000000001', '1A4FF0100000022000000002'], // Only 2 tags
      wasteWeight: 2.5,
      wasteReason: 'Male Plants',
    })
    expect(result.warnings.some((w) => w.code === 'TAG_COUNT_MISMATCH')).toBe(true)
  })
})

describe('validatePackageDestruction', () => {
  it('should validate valid package destruction', () => {
    const result = validatePackageDestruction({
      packageId: 'pkg-123',
      packageWeight: 10.0,
      wasteWeight: 5.0,
      wasteReason: 'Product Degradation',
      adjustmentReason: 'Product Degradation',
    })
    expect(result.isValid).toBe(true)
  })

  it('should fail when waste exceeds package weight', () => {
    const result = validatePackageDestruction({
      packageId: 'pkg-123',
      packageWeight: 5.0,
      wasteWeight: 10.0,
      wasteReason: 'Product Degradation',
      adjustmentReason: 'Product Degradation',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'WASTE_EXCEEDS_PACKAGE_WEIGHT')).toBe(true)
  })

  it('should warn for unknown adjustment reason', () => {
    const result = validatePackageDestruction({
      packageId: 'pkg-123',
      packageWeight: 10.0,
      wasteWeight: 5.0,
      wasteReason: 'Failed Test',
      adjustmentReason: 'Custom Reason Not in Metrc List',
    })
    expect(result.warnings.some((w) => w.code === 'UNKNOWN_ADJUSTMENT_REASON')).toBe(true)
  })
})

describe('validateMetrcWastePayload', () => {
  it('should validate valid Metrc waste payload', () => {
    const result = validateMetrcWastePayload({
      WasteType: 'Plant Material',
      WasteWeight: 5.5,
      UnitOfWeight: 'Kilograms',
      WasteDate: '2025-11-20',
      WasteMethodName: '50:50 Mix with Sawdust',
    })
    expect(result.isValid).toBe(true)
  })

  it('should fail for invalid Metrc waste type', () => {
    const result = validateMetrcWastePayload({
      WasteType: 'Invalid Type',
      WasteWeight: 5.5,
      UnitOfWeight: 'Kilograms',
      WasteDate: '2025-11-20',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_METRC_WASTE_TYPE')).toBe(true)
  })

  it('should fail for invalid unit of weight', () => {
    const result = validateMetrcWastePayload({
      WasteType: 'Plant Material',
      WasteWeight: 5.5,
      UnitOfWeight: 'Tons',
      WasteDate: '2025-11-20',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_UNIT_OF_WEIGHT')).toBe(true)
  })
})

describe('mapRenderingMethodToMetrc', () => {
  it('should map internal rendering methods to Metrc format', () => {
    expect(mapRenderingMethodToMetrc('50_50_sawdust')).toBe('50:50 Mix with Sawdust')
    expect(mapRenderingMethodToMetrc('50_50_kitty_litter')).toBe('50:50 Mix with Kitty Litter')
    expect(mapRenderingMethodToMetrc('50_50_soil')).toBe('50:50 Mix with Soil')
    expect(mapRenderingMethodToMetrc('composting')).toBe('Composting')
    expect(mapRenderingMethodToMetrc('grinding')).toBe('Grinding and Incorporation')
    expect(mapRenderingMethodToMetrc('other')).toBe('Other')
  })

  it('should return "Other" for unknown rendering method', () => {
    expect(mapRenderingMethodToMetrc('unknown_method')).toBe('Other')
  })
})
