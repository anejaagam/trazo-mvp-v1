/**
 * Tests for batch validation utilities
 */

import {
  validateBatchCreation,
  validateStageTransition,
  validatePlantCount,
  validateHarvestData,
} from '../batch-validation';
import type { InsertBatch } from '@/types/batch';

describe('Batch Validation Utilities', () => {
  describe('validateBatchCreation', () => {
    it('should validate required fields', () => {
      const data = {} as InsertBatch;
      
      const result = validateBatchCreation(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Organization ID is required');
      expect(result.errors).toContain('Site ID is required');
      expect(result.errors).toContain('Batch number is required');
      expect(result.errors).toContain('Initial stage is required');
      expect(result.errors).toContain('Start date is required');
    });

    it('should validate batch number format', () => {
      const data: InsertBatch = {
        organization_id: 'org-1',
        site_id: 'site-1',
        batch_number: 'Invalid Batch!',
        stage: 'planning',
        start_date: '2025-01-01',
        created_by: 'user-1',
      };
      
      const result = validateBatchCreation(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Batch number must contain only letters, numbers, and hyphens');
    });

    it('should warn for non-standard lighting schedules', () => {
      const data: InsertBatch = {
        organization_id: 'org-1',
        site_id: 'site-1',
        batch_number: 'CB-001',
        stage: 'vegetative',
        start_date: '2025-01-01',
        domain_type: 'cannabis',
        lighting_schedule: '22/2',
        created_by: 'user-1',
      };
      
      const result = validateBatchCreation(data);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('Non-standard lighting schedule');
    });
  });

  describe('validateStageTransition', () => {
    it('should validate cannabis vegetative to flowering transition', () => {
      const result = validateStageTransition('vegetative', 'flowering', 'cannabis');
      
      expect(result.isValid).toBe(true);
      expect(result.allowedNextStages).toContain('flowering');
      expect(result.requiredFields).toContain('lighting_schedule');
    });

    it('should reject invalid cannabis transition', () => {
      const result = validateStageTransition('vegetative', 'drying', 'cannabis');
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Cannot transition from vegetative to drying');
    });
  });

  describe('validatePlantCount', () => {
    it('should reject negative plant counts', () => {
      const result = validatePlantCount(-5, 'cannabis');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Plant count cannot be negative');
    });
  });

  describe('validateHarvestData', () => {
    it('should validate positive weights', () => {
      const data = {
        wet_weight: 0,
        plant_count: 10,
        harvested_at: '2025-01-15',
      };
      
      const result = validateHarvestData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Harvest weight must be greater than 0');
    });
  });
});
