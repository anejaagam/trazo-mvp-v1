/**
 * Unit tests for plant count adjustment validation
 */

import { validatePlantCountAdjustment } from '../batch-rules'

describe('validatePlantCountAdjustment', () => {
  it('should validate valid adjustment', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: 95,
      reason: 'Died',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail for negative new count', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: -5,
      reason: 'Died',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_COUNT')).toBe(true)
  })

  it('should fail for negative old count', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: -10,
      newCount: 95,
      reason: 'Died',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_COUNT')).toBe(true)
  })

  it('should warn for large decrease (>20%)', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: 70, // 30% decrease
      reason: 'Died',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(true)
    expect(result.warnings.some((w) => w.code === 'LARGE_DECREASE')).toBe(true)
  })

  it('should not warn for small decrease (<20%)', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: 85, // 15% decrease
      reason: 'Died',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(true)
    expect(result.warnings.some((w) => w.code === 'LARGE_DECREASE')).toBe(false)
  })

  it('should warn for count increase', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: 105,
      reason: 'Error',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(true)
    expect(result.warnings.some((w) => w.code === 'COUNT_INCREASE')).toBe(true)
  })

  it('should fail for invalid reason', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: 95,
      reason: 'InvalidReason',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_REASON')).toBe(true)
  })

  it('should accept all valid Metrc adjustment reasons', () => {
    const validReasons = [
      'Died',
      'Voluntary Destruction',
      'Mandatory State Destruction',
      'Contamination',
      'Infestation',
      'Unhealthy or Infirm Plants',
      'Error',
      'Other',
    ]

    validReasons.forEach((reason) => {
      const adjustment = {
        batchId: 'batch-1',
        oldCount: 100,
        newCount: 95,
        reason,
        adjustmentDate: '2025-11-18',
      }

      const result = validatePlantCountAdjustment(adjustment)
      expect(result.isValid).toBe(true)
    })
  })

  it('should fail for future adjustment date', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    const futureDateStr = futureDate.toISOString().split('T')[0]

    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: 95,
      reason: 'Died',
      adjustmentDate: futureDateStr,
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'DATE_IN_FUTURE')).toBe(true)
  })

  it('should accept today as adjustment date', () => {
    const today = new Date().toISOString().split('T')[0]

    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: 95,
      reason: 'Died',
      adjustmentDate: today,
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(true)
  })

  it('should accept past dates', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: 95,
      reason: 'Died',
      adjustmentDate: yesterdayStr,
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(true)
  })

  it('should fail for missing batch ID', () => {
    const adjustment = {
      batchId: '',
      oldCount: 100,
      newCount: 95,
      reason: 'Died',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.field === 'batchId')).toBe(true)
  })

  it('should handle zero old count without division by zero', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: 0,
      newCount: 5,
      reason: 'Error',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(true)
    // Should not throw error or calculate percentage
  })

  it('should handle no change in count', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: 100,
      reason: 'Error',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })
})
