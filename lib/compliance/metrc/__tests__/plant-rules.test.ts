/**
 * Plant Validation Rules Tests
 *
 * Tests for Metrc plant and plant batch validation logic
 */

import {
  validatePlantingCreate,
  validatePlantGrowthPhaseChange,
  validatePlantMove,
  validatePlantDestroy,
  validatePlantBatchCreate,
  validatePlantBatchAdjustment,
} from '../validation/plant-rules'
import type {
  MetrcPlantingCreate,
  MetrcPlantGrowthPhaseChange,
  MetrcPlantMove,
  MetrcPlantDestroy,
  MetrcPlantBatchCreate,
  MetrcPlantBatchAdjustment,
} from '../types'

describe('Plant Validation Rules', () => {
  describe('validatePlantingCreate', () => {
    const validPlanting: MetrcPlantingCreate = {
      PlantBatch: 'BATCH-001',
      PlantCount: 100,
      Location: 'Vegetative Room A',
      Strain: 'Blue Dream',
      PlantedDate: '2024-11-01',
    }

    it('should pass for valid planting', () => {
      const result = validatePlantingCreate(validPlanting)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when PlantBatch is missing', () => {
      const planting = { ...validPlanting, PlantBatch: undefined as any }
      const result = validatePlantingCreate(planting)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'PlantBatch')).toBe(true)
    })

    it('should fail when PlantCount is missing', () => {
      const planting = { ...validPlanting, PlantCount: undefined as any }
      const result = validatePlantingCreate(planting)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'PlantCount')).toBe(true)
    })

    it('should fail when PlantCount is not positive', () => {
      const planting = { ...validPlanting, PlantCount: 0 }
      const result = validatePlantingCreate(planting)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'PlantCount')).toBe(true)
    })

    it('should fail when Location is missing', () => {
      const planting = { ...validPlanting, Location: undefined as any }
      const result = validatePlantingCreate(planting)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Location')).toBe(true)
    })

    it('should fail when Strain is missing', () => {
      const planting = { ...validPlanting, Strain: undefined as any }
      const result = validatePlantingCreate(planting)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Strain')).toBe(true)
    })

    it('should fail when PlantedDate is missing', () => {
      const planting = { ...validPlanting, PlantedDate: undefined as any }
      const result = validatePlantingCreate(planting)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'PlantedDate')).toBe(true)
    })

    it('should fail when PlantedDate is in the future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const planting = {
        ...validPlanting,
        PlantedDate: futureDate.toISOString().split('T')[0],
      }
      const result = validatePlantingCreate(planting)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'DATE_IN_FUTURE')).toBe(true)
    })
  })

  describe('validatePlantGrowthPhaseChange', () => {
    const validPhaseChange: MetrcPlantGrowthPhaseChange = {
      Label: '1A4FF0100000022000000123',
      NewLocation: 'Flowering Room A',
      GrowthPhase: 'Flowering',
      GrowthDate: '2024-11-01',
    }

    it('should pass for valid phase change to Flowering', () => {
      const result = validatePlantGrowthPhaseChange(validPhaseChange)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass for valid phase change to Vegetative', () => {
      const change = { ...validPhaseChange, GrowthPhase: 'Vegetative' as const }
      const result = validatePlantGrowthPhaseChange(change)
      expect(result.isValid).toBe(true)
    })

    it('should fail when Label is missing', () => {
      const change = { ...validPhaseChange, Label: undefined as any }
      const result = validatePlantGrowthPhaseChange(change)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Label')).toBe(true)
    })

    it('should fail when Label format is invalid', () => {
      const change = { ...validPhaseChange, Label: 'INVALID' }
      const result = validatePlantGrowthPhaseChange(change)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_TAG_FORMAT')).toBe(true)
    })

    it('should fail when NewLocation is missing', () => {
      const change = { ...validPhaseChange, NewLocation: undefined as any }
      const result = validatePlantGrowthPhaseChange(change)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'NewLocation')).toBe(true)
    })

    it('should fail when GrowthPhase is invalid', () => {
      const change = { ...validPhaseChange, GrowthPhase: 'InvalidPhase' as any }
      const result = validatePlantGrowthPhaseChange(change)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_GROWTH_PHASE')).toBe(true)
    })

    it('should fail when GrowthDate is in the future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const change = {
        ...validPhaseChange,
        GrowthDate: futureDate.toISOString().split('T')[0],
      }
      const result = validatePlantGrowthPhaseChange(change)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'DATE_IN_FUTURE')).toBe(true)
    })
  })

  describe('validatePlantMove', () => {
    const validMove: MetrcPlantMove = {
      Label: '1A4FF0100000022000000123',
      Location: 'Vegetative Room B',
      MoveDate: '2024-11-01',
    }

    it('should pass for valid move', () => {
      const result = validatePlantMove(validMove)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when Label is missing', () => {
      const move = { ...validMove, Label: undefined as any }
      const result = validatePlantMove(move)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Label')).toBe(true)
    })

    it('should fail when Location is missing', () => {
      const move = { ...validMove, Location: undefined as any }
      const result = validatePlantMove(move)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Location')).toBe(true)
    })

    it('should fail when MoveDate is missing', () => {
      const move = { ...validMove, MoveDate: undefined as any }
      const result = validatePlantMove(move)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'MoveDate')).toBe(true)
    })

    it('should fail when MoveDate is in the future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const move = {
        ...validMove,
        MoveDate: futureDate.toISOString().split('T')[0],
      }
      const result = validatePlantMove(move)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'DATE_IN_FUTURE')).toBe(true)
    })
  })

  describe('validatePlantDestroy', () => {
    const validDestroy: MetrcPlantDestroy = {
      Label: '1A4FF0100000022000000123',
      ReasonNote: 'Plant disease detected',
      ActualDate: '2024-11-01',
    }

    it('should pass for valid destroy', () => {
      const result = validatePlantDestroy(validDestroy)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when Label is missing', () => {
      const destroy = { ...validDestroy, Label: undefined as any }
      const result = validatePlantDestroy(destroy)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Label')).toBe(true)
    })

    it('should fail when ReasonNote is missing', () => {
      const destroy = { ...validDestroy, ReasonNote: undefined as any }
      const result = validatePlantDestroy(destroy)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'ReasonNote')).toBe(true)
    })

    it('should fail when ActualDate is missing', () => {
      const destroy = { ...validDestroy, ActualDate: undefined as any }
      const result = validatePlantDestroy(destroy)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'ActualDate')).toBe(true)
    })

    it('should fail when ActualDate is in the future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const destroy = {
        ...validDestroy,
        ActualDate: futureDate.toISOString().split('T')[0],
      }
      const result = validatePlantDestroy(destroy)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'DATE_IN_FUTURE')).toBe(true)
    })
  })

  describe('validatePlantBatchCreate', () => {
    const validBatch: MetrcPlantBatchCreate = {
      Name: 'BATCH-001',
      Type: 'Clone',
      Count: 100,
      Strain: 'Blue Dream',
      Location: 'Clone Room A',
      PlantedDate: '2024-11-01',
    }

    it('should pass for valid batch with Clone type', () => {
      const result = validatePlantBatchCreate(validBatch)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass for valid batch with Seed type', () => {
      const batch = { ...validBatch, Type: 'Seed' as const }
      const result = validatePlantBatchCreate(batch)
      expect(result.isValid).toBe(true)
    })

    it('should fail when Name is missing', () => {
      const batch = { ...validBatch, Name: undefined as any }
      const result = validatePlantBatchCreate(batch)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Name')).toBe(true)
    })

    it('should fail when Type is invalid', () => {
      const batch = { ...validBatch, Type: 'InvalidType' as any }
      const result = validatePlantBatchCreate(batch)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_BATCH_TYPE')).toBe(true)
    })

    it('should fail when Count is missing', () => {
      const batch = { ...validBatch, Count: undefined as any }
      const result = validatePlantBatchCreate(batch)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Count')).toBe(true)
    })

    it('should fail when Count is not positive', () => {
      const batch = { ...validBatch, Count: 0 }
      const result = validatePlantBatchCreate(batch)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Count')).toBe(true)
    })

    it('should fail when Strain is missing', () => {
      const batch = { ...validBatch, Strain: undefined as any }
      const result = validatePlantBatchCreate(batch)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Strain')).toBe(true)
    })

    it('should fail when Location is missing', () => {
      const batch = { ...validBatch, Location: undefined as any }
      const result = validatePlantBatchCreate(batch)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Location')).toBe(true)
    })

    it('should fail when PlantedDate is in the future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const batch = {
        ...validBatch,
        PlantedDate: futureDate.toISOString().split('T')[0],
      }
      const result = validatePlantBatchCreate(batch)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'DATE_IN_FUTURE')).toBe(true)
    })
  })

  describe('validatePlantBatchAdjustment', () => {
    const validAdjustment: MetrcPlantBatchAdjustment = {
      Id: 12345,
      Count: -10,
      AdjustmentReason: 'Plant death',
      AdjustmentDate: '2024-11-01',
    }

    it('should pass for valid adjustment', () => {
      const result = validatePlantBatchAdjustment(validAdjustment)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow negative counts', () => {
      const adjustment = { ...validAdjustment, Count: -50 }
      const result = validatePlantBatchAdjustment(adjustment)
      expect(result.isValid).toBe(true)
    })

    it('should allow positive counts', () => {
      const adjustment = { ...validAdjustment, Count: 50 }
      const result = validatePlantBatchAdjustment(adjustment)
      expect(result.isValid).toBe(true)
    })

    it('should fail when Id is missing', () => {
      const adjustment = { ...validAdjustment, Id: undefined as any }
      const result = validatePlantBatchAdjustment(adjustment)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'Id')).toBe(true)
    })

    it('should fail when Count is not a number', () => {
      const adjustment = { ...validAdjustment, Count: '10' as any }
      const result = validatePlantBatchAdjustment(adjustment)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_NUMBER')).toBe(true)
    })

    it('should fail when AdjustmentReason is missing', () => {
      const adjustment = { ...validAdjustment, AdjustmentReason: undefined as any }
      const result = validatePlantBatchAdjustment(adjustment)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'AdjustmentReason')).toBe(true)
    })

    it('should fail when AdjustmentDate is missing', () => {
      const adjustment = { ...validAdjustment, AdjustmentDate: undefined as any }
      const result = validatePlantBatchAdjustment(adjustment)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'AdjustmentDate')).toBe(true)
    })

    it('should fail when AdjustmentDate is in the future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const adjustment = {
        ...validAdjustment,
        AdjustmentDate: futureDate.toISOString().split('T')[0],
      }
      const result = validatePlantBatchAdjustment(adjustment)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'DATE_IN_FUTURE')).toBe(true)
    })
  })
})
