/**
 * Phase Transition Rules Tests
 */

import {
  mapStageToMetrcPhase,
  requiresMetrcPhaseChange,
  getValidMetrcPhaseTransitions,
  validatePhaseTransitionAllowed,
  validatePlantGrowthPhaseChange,
  validateStageTransitionForMetrc,
  validatePlantGrowthPhaseChangeBatch,
  type MetrcGrowthPhase,
} from '../phase-transition-rules'
import type { MetrcPlantGrowthPhaseChange } from '../../types'

describe('mapStageToMetrcPhase', () => {
  it('should map germination to Clone phase', () => {
    expect(mapStageToMetrcPhase('germination')).toBe('Clone')
  })

  it('should map clone to Clone phase', () => {
    expect(mapStageToMetrcPhase('clone')).toBe('Clone')
  })

  it('should map vegetative to Vegetative phase', () => {
    expect(mapStageToMetrcPhase('vegetative')).toBe('Vegetative')
  })

  it('should map flowering to Flowering phase', () => {
    expect(mapStageToMetrcPhase('flowering')).toBe('Flowering')
  })

  it('should return null for non-plant stages', () => {
    expect(mapStageToMetrcPhase('harvest')).toBeNull()
    expect(mapStageToMetrcPhase('drying')).toBeNull()
    expect(mapStageToMetrcPhase('planning')).toBeNull()
  })
})

describe('requiresMetrcPhaseChange', () => {
  it('should return true for clone to vegetative transition', () => {
    expect(requiresMetrcPhaseChange('clone', 'vegetative')).toBe(true)
  })

  it('should return true for vegetative to flowering transition', () => {
    expect(requiresMetrcPhaseChange('vegetative', 'flowering')).toBe(true)
  })

  it('should return false for transitions within same phase', () => {
    expect(requiresMetrcPhaseChange('clone', 'germination')).toBe(false)
    expect(requiresMetrcPhaseChange('germination', 'clone')).toBe(false)
  })

  it('should return false for transitions to non-Metrc stages', () => {
    expect(requiresMetrcPhaseChange('flowering', 'harvest')).toBe(false)
    expect(requiresMetrcPhaseChange('harvest', 'drying')).toBe(false)
  })

  it('should return false for transitions from non-Metrc stages', () => {
    expect(requiresMetrcPhaseChange('planning', 'germination')).toBe(false)
  })
})

describe('getValidMetrcPhaseTransitions', () => {
  it('should return Vegetative as valid transition from Clone', () => {
    const transitions = getValidMetrcPhaseTransitions('Clone')
    expect(transitions).toEqual(['Vegetative'])
  })

  it('should return Flowering as valid transition from Vegetative', () => {
    const transitions = getValidMetrcPhaseTransitions('Vegetative')
    expect(transitions).toEqual(['Flowering'])
  })

  it('should return empty array for Flowering (terminal phase)', () => {
    const transitions = getValidMetrcPhaseTransitions('Flowering')
    expect(transitions).toEqual([])
  })
})

describe('validatePhaseTransitionAllowed', () => {
  it('should validate Clone to Vegetative transition', () => {
    const result = validatePhaseTransitionAllowed('Clone', 'Vegetative')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings.length).toBeGreaterThan(0) // Should have irreversibility warning
  })

  it('should validate Vegetative to Flowering transition', () => {
    const result = validatePhaseTransitionAllowed('Vegetative', 'Flowering')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings.length).toBeGreaterThan(0) // Should have irreversibility warning
  })

  it('should fail Clone to Flowering (skips Vegetative)', () => {
    const result = validatePhaseTransitionAllowed('Clone', 'Flowering')
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].code).toBe('INVALID_PHASE_TRANSITION')
  })

  it('should fail Flowering to Vegetative (backwards)', () => {
    const result = validatePhaseTransitionAllowed('Flowering', 'Vegetative')
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should fail Flowering to any phase (terminal)', () => {
    const result = validatePhaseTransitionAllowed('Flowering', 'Clone')
    expect(result.isValid).toBe(false)
  })
})

describe('validatePlantGrowthPhaseChange', () => {
  it('should validate a valid growth phase change', () => {
    const change: MetrcPlantGrowthPhaseChange = {
      Label: '1A4FF0100000022000000123',
      NewLocation: 'Flowering Room 1',
      GrowthPhase: 'Flowering',
      GrowthDate: '2025-01-15',
    }

    const result = validatePlantGrowthPhaseChange(change)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail when required fields are missing', () => {
    const change = {
      Label: '1A4FF0100000022000000123',
      // Missing required fields
    } as MetrcPlantGrowthPhaseChange

    const result = validatePlantGrowthPhaseChange(change)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should fail for invalid growth phase', () => {
    const change: MetrcPlantGrowthPhaseChange = {
      Label: '1A4FF0100000022000000123',
      NewLocation: 'Room 1',
      GrowthPhase: 'InvalidPhase' as any,
      GrowthDate: '2025-01-15',
    }

    const result = validatePlantGrowthPhaseChange(change)
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('INVALID_GROWTH_PHASE')
  })

  it('should warn for invalid tag format', () => {
    const change: MetrcPlantGrowthPhaseChange = {
      Label: 'INVALID-TAG',
      NewLocation: 'Room 1',
      GrowthPhase: 'Flowering',
      GrowthDate: '2025-01-15',
    }

    const result = validatePlantGrowthPhaseChange(change)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0].code).toBe('INVALID_TAG_FORMAT')
  })

  it('should fail for future dates', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const futureDateStr = futureDate.toISOString().split('T')[0]

    const change: MetrcPlantGrowthPhaseChange = {
      Label: '1A4FF0100000022000000123',
      NewLocation: 'Room 1',
      GrowthPhase: 'Flowering',
      GrowthDate: futureDateStr,
    }

    const result = validatePlantGrowthPhaseChange(change)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'DATE_IN_FUTURE')).toBe(true)
  })

  it('should fail for empty location', () => {
    const change: MetrcPlantGrowthPhaseChange = {
      Label: '1A4FF0100000022000000123',
      NewLocation: '',
      GrowthPhase: 'Flowering',
      GrowthDate: '2025-01-15',
    }

    const result = validatePlantGrowthPhaseChange(change)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'EMPTY_LOCATION')).toBe(true)
  })
})

describe('validateStageTransitionForMetrc', () => {
  it('should validate a valid stage transition requiring Metrc sync', () => {
    const result = validateStageTransitionForMetrc({
      batchId: 'batch-123',
      currentStage: 'clone',
      newStage: 'vegetative',
      currentMetrcPhase: 'Clone',
      transitionDate: '2025-01-15',
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should warn when transition does not require Metrc sync', () => {
    const result = validateStageTransitionForMetrc({
      batchId: 'batch-123',
      currentStage: 'harvest',
      newStage: 'drying',
      transitionDate: '2025-01-15',
    })

    expect(result.isValid).toBe(true)
    expect(result.warnings.some((w) => w.code === 'NO_METRC_SYNC_REQUIRED')).toBe(true)
  })

  it('should warn when transition does not require sync (new stage not mappable)', () => {
    const result = validateStageTransitionForMetrc({
      batchId: 'batch-123',
      currentStage: 'vegetative',
      newStage: 'harvest',
      currentMetrcPhase: 'Vegetative',
      transitionDate: '2025-01-15',
    })

    // This is valid because harvest doesn't map to a Metrc phase, so no sync needed
    expect(result.isValid).toBe(true)
    expect(result.warnings.some((w) => w.code === 'NO_METRC_SYNC_REQUIRED')).toBe(true)
  })

  it('should fail for invalid phase transition', () => {
    const result = validateStageTransitionForMetrc({
      batchId: 'batch-123',
      currentStage: 'clone',
      newStage: 'flowering',
      currentMetrcPhase: 'Clone',
      transitionDate: '2025-01-15',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_PHASE_TRANSITION')).toBe(true)
  })

  it('should warn for early phase transitions', () => {
    const today = new Date().toISOString().split('T')[0]

    const result = validateStageTransitionForMetrc({
      batchId: 'batch-123',
      currentStage: 'clone',
      newStage: 'vegetative',
      currentMetrcPhase: 'Clone',
      transitionDate: today,
    })

    expect(result.warnings.some((w) => w.code === 'EARLY_PHASE_TRANSITION')).toBe(true)
  })

  it('should fail for future transition dates', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const futureDateStr = futureDate.toISOString().split('T')[0]

    const result = validateStageTransitionForMetrc({
      batchId: 'batch-123',
      currentStage: 'clone',
      newStage: 'vegetative',
      currentMetrcPhase: 'Clone',
      transitionDate: futureDateStr,
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'DATE_IN_FUTURE')).toBe(true)
  })

  it('should fail when required fields are missing', () => {
    const result = validateStageTransitionForMetrc({
      batchId: '',
      currentStage: 'clone',
      newStage: 'vegetative',
      transitionDate: '2025-01-15',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'REQUIRED')).toBe(true)
  })
})

describe('validatePlantGrowthPhaseChangeBatch', () => {
  it('should validate a batch of valid phase changes', () => {
    const changes: MetrcPlantGrowthPhaseChange[] = [
      {
        Label: '1A4FF0100000022000000001',
        NewLocation: 'Flowering Room 1',
        GrowthPhase: 'Flowering',
        GrowthDate: '2025-01-15',
      },
      {
        Label: '1A4FF0100000022000000002',
        NewLocation: 'Flowering Room 1',
        GrowthPhase: 'Flowering',
        GrowthDate: '2025-01-15',
      },
    ]

    const result = validatePlantGrowthPhaseChangeBatch(changes)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail for empty batch', () => {
    const result = validatePlantGrowthPhaseChangeBatch([])
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('EMPTY_BATCH')
  })

  it('should fail when batch size exceeds limit', () => {
    const changes: MetrcPlantGrowthPhaseChange[] = Array.from({ length: 101 }, (_, i) => ({
      Label: `1A4FF010000002200000${String(i).padStart(4, '0')}`,
      NewLocation: 'Flowering Room 1',
      GrowthPhase: 'Flowering' as const,
      GrowthDate: '2025-01-15',
    }))

    const result = validatePlantGrowthPhaseChangeBatch(changes)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'BATCH_SIZE_EXCEEDED')).toBe(true)
  })

  it('should fail when individual change is invalid', () => {
    const changes: MetrcPlantGrowthPhaseChange[] = [
      {
        Label: '1A4FF0100000022000000001',
        NewLocation: 'Flowering Room 1',
        GrowthPhase: 'Flowering',
        GrowthDate: '2025-01-15',
      },
      {
        Label: '',
        NewLocation: 'Flowering Room 1',
        GrowthPhase: 'Flowering',
        GrowthDate: '2025-01-15',
      },
    ]

    const result = validatePlantGrowthPhaseChangeBatch(changes)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.field.includes('changes[1]'))).toBe(true)
  })

  it('should warn about duplicate labels', () => {
    const changes: MetrcPlantGrowthPhaseChange[] = [
      {
        Label: '1A4FF0100000022000000001',
        NewLocation: 'Flowering Room 1',
        GrowthPhase: 'Flowering',
        GrowthDate: '2025-01-15',
      },
      {
        Label: '1A4FF0100000022000000001', // Duplicate
        NewLocation: 'Flowering Room 1',
        GrowthPhase: 'Flowering',
        GrowthDate: '2025-01-15',
      },
    ]

    const result = validatePlantGrowthPhaseChangeBatch(changes)
    expect(result.warnings.some((w) => w.code === 'DUPLICATE_LABELS')).toBe(true)
  })
})
