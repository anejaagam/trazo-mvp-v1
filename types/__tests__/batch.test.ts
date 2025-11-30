/**
 * Tests for batch type definitions and type guards
 */

import {
  type Batch,
  type CannabisBatch,
  type ProduceBatch,
  type DomainBatch,
  type CannabisStage,
  type ProduceStage,
  isCannabisBatch,
  isProduceBatch,
  isCannabisStage,
  isProduceStage,
} from '../batch';

describe('Batch Type Guards', () => {
  describe('isCannabisBatch', () => {
    it('should return true for cannabis batch', () => {
      const batch: CannabisBatch = {
        id: '123',
        organization_id: 'org-1',
        site_id: 'site-1',
        batch_number: 'CB-001',
        domain_type: 'cannabis',
        stage: 'vegetative',
        plant_count: 50,
        start_date: '2025-01-01',
        status: 'active',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        lighting_schedule: '18/6',
      };

      expect(isCannabisBatch(batch)).toBe(true);
    });

    it('should return false for produce batch', () => {
      const batch: ProduceBatch = {
        id: '123',
        organization_id: 'org-1',
        site_id: 'site-1',
        batch_number: 'PB-001',
        domain_type: 'produce',
        stage: 'growing',
        plant_count: 100,
        start_date: '2025-01-01',
        status: 'active',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        grade: 'A',
      };

      expect(isCannabisBatch(batch)).toBe(false);
    });

    it('should return false for batch without domain_type', () => {
      const batch: Batch = {
        id: '123',
        organization_id: 'org-1',
        site_id: 'site-1',
        batch_number: 'B-001',
        stage: 'planning',
        plant_count: 0,
        start_date: '2025-01-01',
        status: 'active',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      expect(isCannabisBatch(batch)).toBe(false);
    });
  });

  describe('isProduceBatch', () => {
    it('should return true for produce batch', () => {
      const batch: ProduceBatch = {
        id: '123',
        organization_id: 'org-1',
        site_id: 'site-1',
        batch_number: 'PB-001',
        domain_type: 'produce',
        stage: 'growing',
        plant_count: 100,
        start_date: '2025-01-01',
        status: 'active',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        ripeness: 'ripe',
      };

      expect(isProduceBatch(batch)).toBe(true);
    });

    it('should return false for cannabis batch', () => {
      const batch: CannabisBatch = {
        id: '123',
        organization_id: 'org-1',
        site_id: 'site-1',
        batch_number: 'CB-001',
        domain_type: 'cannabis',
        stage: 'vegetative',
        plant_count: 50,
        start_date: '2025-01-01',
        status: 'active',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      expect(isProduceBatch(batch)).toBe(false);
    });
  });

  describe('Type narrowing with discriminated union', () => {
    it('should narrow type correctly for cannabis batch', () => {
      const batch: DomainBatch = {
        id: '123',
        organization_id: 'org-1',
        site_id: 'site-1',
        batch_number: 'CB-001',
        domain_type: 'cannabis',
        stage: 'flowering',
        plant_count: 50,
        start_date: '2025-01-01',
        status: 'active',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        lighting_schedule: '12/12',
        thc_content: 22.5,
      };

      if (isCannabisBatch(batch)) {
        // TypeScript should allow access to cannabis-specific fields
        expect(batch.lighting_schedule).toBe('12/12');
        expect(batch.thc_content).toBe(22.5);
        expect(batch.stage).toBe('flowering');
      } else {
        fail('Should have been identified as cannabis batch');
      }
    });

    it('should narrow type correctly for produce batch', () => {
      const batch: DomainBatch = {
        id: '123',
        organization_id: 'org-1',
        site_id: 'site-1',
        batch_number: 'PB-001',
        domain_type: 'produce',
        stage: 'grading',
        plant_count: 100,
        start_date: '2025-01-01',
        status: 'active',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        grade: 'A',
        brix_level: 12.5,
        ripeness: 'ripe',
      };

      if (isProduceBatch(batch)) {
        // TypeScript should allow access to produce-specific fields
        expect(batch.grade).toBe('A');
        expect(batch.brix_level).toBe(12.5);
        expect(batch.ripeness).toBe('ripe');
        expect(batch.stage).toBe('grading');
      } else {
        fail('Should have been identified as produce batch');
      }
    });
  });
});

describe('Stage Type Guards', () => {
  describe('isCannabisStage', () => {
    it('should return true for valid cannabis stages', () => {
      const cannabisStages: CannabisStage[] = [
        'planning',
        'germination',
        'clone',
        'vegetative',
        'flowering',
        'harvest',
        'drying',
        'curing',
        'packaging',
        'completed',
        'destroyed',
      ];

      cannabisStages.forEach((stage) => {
        expect(isCannabisStage(stage)).toBe(true);
      });
    });

    it('should return false for produce stages', () => {
      expect(isCannabisStage('seeding')).toBe(false);
      expect(isCannabisStage('transplant')).toBe(false);
      expect(isCannabisStage('washing')).toBe(false);
      expect(isCannabisStage('grading')).toBe(false);
    });

    it('should return false for invalid stages', () => {
      expect(isCannabisStage('invalid')).toBe(false);
      expect(isCannabisStage('')).toBe(false);
      expect(isCannabisStage('FLOWERING')).toBe(false); // Case sensitive
    });
  });

  describe('isProduceStage', () => {
    it('should return true for valid produce stages', () => {
      const produceStages: ProduceStage[] = [
        'planning',
        'seeding',
        'germination',
        'seedling',
        'transplant',
        'growing',
        'harvest_ready',
        'harvesting',
        'washing',
        'grading',
        'packing',
        'storage',
        'shipped',
        'completed',
        'destroyed',
      ];

      produceStages.forEach((stage) => {
        expect(isProduceStage(stage)).toBe(true);
      });
    });

    it('should return false for cannabis-specific stages', () => {
      expect(isProduceStage('clone')).toBe(false);
      expect(isProduceStage('vegetative')).toBe(false);
      expect(isProduceStage('flowering')).toBe(false);
      expect(isProduceStage('drying')).toBe(false);
      expect(isProduceStage('curing')).toBe(false);
    });

    it('should return false for invalid stages', () => {
      expect(isProduceStage('invalid')).toBe(false);
      expect(isProduceStage('')).toBe(false);
    });
  });

  describe('Shared stages', () => {
    it('should recognize shared stages in both domains', () => {
      const sharedStages = ['planning', 'germination', 'completed', 'destroyed'];

      sharedStages.forEach((stage) => {
        expect(isCannabisStage(stage)).toBe(true);
        expect(isProduceStage(stage)).toBe(true);
      });
    });
  });
});

describe('Batch Interface Compatibility', () => {
  it('should allow CannabisBatch to be used as Batch', () => {
    const cannabisBatch: CannabisBatch = {
      id: '123',
      organization_id: 'org-1',
      site_id: 'site-1',
      batch_number: 'CB-001',
      domain_type: 'cannabis',
      stage: 'vegetative',
      plant_count: 50,
      start_date: '2025-01-01',
      status: 'active',
      created_by: 'user-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    // Should be able to assign to Batch type
    const batch: Batch = cannabisBatch;
    expect(batch.batch_number).toBe('CB-001');
  });

  it('should allow ProduceBatch to be used as Batch', () => {
    const produceBatch: ProduceBatch = {
      id: '123',
      organization_id: 'org-1',
      site_id: 'site-1',
      batch_number: 'PB-001',
      domain_type: 'produce',
      stage: 'growing',
      plant_count: 100,
      start_date: '2025-01-01',
      status: 'active',
      created_by: 'user-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    // Should be able to assign to Batch type
    const batch: Batch = produceBatch;
    expect(batch.batch_number).toBe('PB-001');
  });
});

describe('DomainBatch Union Type', () => {
  it('should accept both cannabis and produce batches', () => {
    const batches: DomainBatch[] = [
      {
        id: '1',
        organization_id: 'org-1',
        site_id: 'site-1',
        batch_number: 'CB-001',
        domain_type: 'cannabis',
        stage: 'vegetative',
        plant_count: 50,
        start_date: '2025-01-01',
        status: 'active',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        organization_id: 'org-1',
        site_id: 'site-1',
        batch_number: 'PB-001',
        domain_type: 'produce',
        stage: 'growing',
        plant_count: 100,
        start_date: '2025-01-01',
        status: 'active',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    expect(batches.length).toBe(2);
    expect(isCannabisBatch(batches[0])).toBe(true);
    expect(isProduceBatch(batches[1])).toBe(true);
  });
});
