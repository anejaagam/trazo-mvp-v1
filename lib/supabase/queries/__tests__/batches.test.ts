/**
 * Tests for batch query functions
 */

import {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  updatePlantCount,
  getBatchQualityHistory,
  addQualityMetric,
  getBatchesByStage,
  getBatchesByCultivar,
  getActiveBatches,
  getBatchInventoryUsage,
} from '../batches';
import { createClient } from '@/lib/supabase/server';
import { MockQueryBuilder } from './test-helpers';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
const resolveClient = (client: Partial<SupabaseServerClient>) => {
  mockCreateClient.mockResolvedValue(client as SupabaseServerClient);
};

describe('Batch Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBatches', () => {
    it('should fetch batches with basic filters', async () => {
      const mockBatches = [
        {
          id: '1',
          batch_number: 'CB-001',
          domain_type: 'cannabis',
          stage: 'vegetative',
          status: 'active',
          cultivar: { id: 'c1', name: 'Strain A' },
        },
        {
          id: '2',
          batch_number: 'PB-001',
          domain_type: 'produce',
          stage: 'growing',
          status: 'active',
          cultivar: { id: 'c2', name: 'Tomato' },
        },
      ];

      const mockQuery = new MockQueryBuilder(mockBatches);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatches('org-1', 'site-1');

      expect(result.data).toEqual(mockBatches);
      expect(result.error).toBeNull();
    });

    it('should filter by domain_type', async () => {
      const mockBatches = [
        { id: '1', batch_number: 'CB-001', domain_type: 'cannabis' },
      ];

      const mockQuery = new MockQueryBuilder(mockBatches);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatches('org-1', 'site-1', { 
        domain_type: 'cannabis' 
      });

      expect(result.data).toEqual(mockBatches);
      expect(result.error).toBeNull();
    });

    it('should filter by stage array', async () => {
      const mockBatches = [
        { id: '1', stage: 'vegetative' },
        { id: '2', stage: 'flowering' },
      ];

      const mockQuery = new MockQueryBuilder(mockBatches);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatches('org-1', 'site-1', {
        stage: ['vegetative', 'flowering'],
      });

      expect(result.data).toEqual(mockBatches);
      expect(result.error).toBeNull();
    });

    it('should filter by quarantine status', async () => {
      const mockBatches = [
        { id: '1', status: 'quarantined' },
      ];

      const mockQuery = new MockQueryBuilder(mockBatches);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatches('org-1', 'site-1', {
        quarantine_status: 'quarantined',
      });

      expect(result.data).toEqual(mockBatches);
      expect(result.error).toBeNull();
    });

    it('should handle search filter', async () => {
      const mockBatches = [
        { id: '1', batch_number: 'CB-001' },
      ];

      const mockQuery = new MockQueryBuilder(mockBatches);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatches('org-1', 'site-1', {
        search: 'CB-001',
      });

      expect(result.data).toEqual(mockBatches);
      expect(result.error).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Database error');
      const mockQuery = new MockQueryBuilder(null, mockError);
      
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatches('org-1', 'site-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getBatchById', () => {
    it('should fetch a single batch with full details', async () => {
      const mockBatch = {
        id: 'batch-1',
        batch_number: 'CB-001',
        cultivar: { id: 'c1', name: 'Strain A', description: 'Test strain' },
        parent_batch: { id: 'parent-1', batch_number: 'CB-000', stage: 'completed' },
        created_by_user: { id: 'user-1', full_name: 'John Doe', email: 'john@test.com' },
      };

      const mockQuery = new MockQueryBuilder(mockBatch);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatchById('batch-1');

      expect(result.data).toEqual(mockBatch);
      expect(result.error).toBeNull();
    });

    it('should handle not found error', async () => {
      const mockError = new Error('Batch not found');
      const mockQuery = new MockQueryBuilder(null, mockError);
      
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatchById('nonexistent');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('createBatch', () => {
    it('should create a new batch', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockBatch = {
        id: 'batch-1',
        batch_number: 'CB-001',
        organization_id: 'org-1',
        site_id: 'site-1',
        domain_type: 'cannabis',
        stage: 'planning',
        plant_count: 0,
        start_date: '2025-01-01',
        status: 'active',
        created_by: 'user-1',
      };

      const mockQuery = new MockQueryBuilder(mockBatch);
      const mockEventQuery = new MockQueryBuilder({ success: true });
      const mockHistoryQuery = new MockQueryBuilder({ success: true });

      resolveClient({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: jest.fn()
          .mockReturnValueOnce(mockQuery) // For insert
          .mockReturnValueOnce(mockEventQuery) // For event
          .mockReturnValueOnce(mockHistoryQuery), // For stage history
      });

      const result = await createBatch({
        organization_id: 'org-1',
        site_id: 'site-1',
        batch_number: 'CB-001',
        domain_type: 'cannabis',
        stage: 'planning',
        start_date: '2025-01-01',
        created_by: 'user-1',
      });

      expect(result.data).toEqual(mockBatch);
      expect(result.error).toBeNull();
    });

    it('should handle unauthenticated user', async () => {
      resolveClient({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        },
      });

      const result = await createBatch({
        organization_id: 'org-1',
        site_id: 'site-1',
        batch_number: 'CB-001',
        domain_type: 'cannabis',
        stage: 'planning',
        start_date: '2025-01-01',
        created_by: 'user-1',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('updateBatch', () => {
    it('should update batch fields', async () => {
      const mockUpdated = {
        id: 'batch-1',
        batch_number: 'CB-001',
        plant_count: 100,
        stage: 'vegetative',
      };

      const mockQuery = new MockQueryBuilder(mockUpdated);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await updateBatch('batch-1', {
        plant_count: 100,
        stage: 'vegetative',
      });

      expect(result.data).toEqual(mockUpdated);
      expect(result.error).toBeNull();
    });
  });

  describe('deleteBatch', () => {
    it('should soft delete a batch', async () => {
      const mockUser = { id: 'user-1' };
      const mockDeleted = {
        id: 'batch-1',
        status: 'destroyed',
      };

      const mockQuery = new MockQueryBuilder(mockDeleted);
      const mockEventQuery = new MockQueryBuilder({ success: true });

      resolveClient({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: jest.fn()
          .mockReturnValueOnce(mockQuery) // For update
          .mockReturnValueOnce(mockEventQuery), // For event
      });

      const result = await deleteBatch('batch-1');

      expect(result.data?.status).toBe('destroyed');
      expect(result.error).toBeNull();
    });
  });

  describe('getBatchesByStage', () => {
    it('should filter batches by single stage', async () => {
      const mockBatches = [
        { id: '1', stage: 'vegetative' },
        { id: '2', stage: 'vegetative' },
      ];

      const mockQuery = new MockQueryBuilder(mockBatches);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatchesByStage('vegetative', 'org-1', 'site-1');

      expect(result.data).toEqual(mockBatches);
      expect(result.error).toBeNull();
    });

    it('should filter batches by multiple stages', async () => {
      const mockBatches = [
        { id: '1', stage: 'vegetative' },
        { id: '2', stage: 'flowering' },
      ];

      const mockQuery = new MockQueryBuilder(mockBatches);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatchesByStage(
        ['vegetative', 'flowering'],
        'org-1',
        'site-1'
      );

      expect(result.data).toEqual(mockBatches);
      expect(result.error).toBeNull();
    });
  });

  describe('getActiveBatches', () => {
    it('should fetch only active and quarantined batches', async () => {
      const mockBatches = [
        { id: '1', status: 'active', cultivar: { id: 'c1', name: 'Strain A' } },
        { id: '2', status: 'quarantined', cultivar: { id: 'c2', name: 'Strain B' } },
      ];

      const mockQuery = new MockQueryBuilder(mockBatches);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getActiveBatches('org-1', 'site-1');

      expect(result.data).toEqual(mockBatches);
      expect(result.error).toBeNull();
    });
  });

  describe('getBatchInventoryUsage', () => {
    it('returns aggregated inventory usage when movements exist', async () => {
      const mockMovements = [
        {
          id: 'move-1',
          movement_type: 'consume',
          quantity: 5,
          lot_id: 'lot-1',
          timestamp: '2025-11-14T10:00:00Z',
          item: {
            id: 'item-1',
            name: 'Propagation cubes',
            item_type: 'growing_medium',
            unit_of_measure: 'tray',
          },
        },
        {
          id: 'move-2',
          movement_type: 'receive',
          quantity: 20,
          lot_id: null,
          timestamp: '2025-11-14T11:00:00Z',
          item: {
            id: 'item-2',
            name: 'Harvest biomass',
            item_type: 'other',
            unit_of_measure: 'kg',
          },
        },
      ];

      const mockQuery = new MockQueryBuilder(mockMovements);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatchInventoryUsage('batch-1');

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.entries).toHaveLength(2);
      expect(result.data?.summary.consumed_by_type.growing_medium).toBe(5);
      expect(result.data?.summary.received_by_type.other).toBe(20);
    });

    it('returns null data when no movements found', async () => {
      const mockQuery = new MockQueryBuilder([]);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatchInventoryUsage('batch-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('getBatchesByCultivar', () => {
    it('should fetch batches for a specific cultivar', async () => {
      const mockBatches = [
        { id: '1', cultivar_id: 'cultivar-1', batch_number: 'CB-001' },
        { id: '2', cultivar_id: 'cultivar-1', batch_number: 'CB-002' },
      ];

      const mockQuery = new MockQueryBuilder(mockBatches);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatchesByCultivar('cultivar-1', 'org-1');

      expect(result.data).toEqual(mockBatches);
      expect(result.error).toBeNull();
    });
  });

  describe('addQualityMetric', () => {
    it('should add a quality metric to a batch', async () => {
      const mockMetric = {
        id: 'metric-1',
        batch_id: 'batch-1',
        metric_type: 'thc_pct',
        value: 22.5,
        unit: '%',
        recorded_by: 'user-1',
        lab_certified: true,
      };

      const mockQuery = new MockQueryBuilder(mockMetric);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await addQualityMetric(
        'batch-1',
        {
          metric_type: 'thc_pct',
          value: 22.5,
          unit: '%',
          lab_certified: true,
        },
        'user-1'
      );

      expect(result.data).toEqual(mockMetric);
      expect(result.error).toBeNull();
    });
  });

  describe('getBatchQualityHistory', () => {
    it('should fetch quality metrics history for a batch', async () => {
      const mockHistory = [
        {
          id: '1',
          batch_id: 'batch-1',
          metric_type: 'thc_pct',
          value: 22.5,
          recorded_at: '2025-01-15',
          recorded_by_user: { id: 'user-1', full_name: 'John Doe' },
        },
        {
          id: '2',
          batch_id: 'batch-1',
          metric_type: 'cbd_pct',
          value: 1.2,
          recorded_at: '2025-01-15',
          recorded_by_user: { id: 'user-1', full_name: 'John Doe' },
        },
      ];

      const mockQuery = new MockQueryBuilder(mockHistory);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getBatchQualityHistory('batch-1');

      expect(result.data).toEqual(mockHistory);
      expect(result.error).toBeNull();
    });
  });

  describe('updatePlantCount', () => {
    it('should update plant count and log event', async () => {
      const mockBatch = {
        id: 'batch-1',
        batch_number: 'CB-001',
        plant_count: 50,
      };

      const mockUpdated = {
        id: 'batch-1',
        batch_number: 'CB-001',
        plant_count: 45,
      };

      const mockQuery = new MockQueryBuilder(mockUpdated);
      const mockEventQuery = new MockQueryBuilder({ success: true });
      const mockDetailQuery = new MockQueryBuilder(mockBatch);
      const mockDetailQuery2 = new MockQueryBuilder(mockUpdated);

      resolveClient({
        from: jest.fn()
          .mockReturnValueOnce(mockDetailQuery) // For getBatchById (current count)
          .mockReturnValueOnce(mockQuery) // For update
          .mockReturnValueOnce(mockEventQuery) // For event
          .mockReturnValueOnce(mockDetailQuery2), // For final getBatchById
      });

      const result = await updatePlantCount('batch-1', 45, 'user-1', 'Plant loss');

      expect(result.data?.plant_count).toBe(45);
    });
  });
});
