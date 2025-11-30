/**
 * Tests for cultivar query functions
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getCultivars,
  getCultivarById,
  createCultivar,
  updateCultivar,
  deleteCultivar,
  getCultivarUsageStats,
} from '../cultivars';
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

describe('Cultivar Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCultivars', () => {
    it('should fetch all active cultivars for an organization', async () => {
      const mockCultivars = [
        {
          id: '1',
          organization_id: 'org-1',
          name: 'Blue Dream',
          strain_type: 'hybrid',
          is_active: true,
        },
        {
          id: '2',
          organization_id: 'org-1',
          name: 'Tomato',
          category: 'vegetable',
          is_active: true,
        },
      ];

      const mockQuery = new MockQueryBuilder(mockCultivars);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getCultivars('org-1');

      expect(result.data).toEqual(mockCultivars);
      expect(result.error).toBeNull();
    });

    it('should filter by strain type', async () => {
      const mockCultivars = [
        {
          id: '1',
          name: 'Blue Dream',
          strain_type: 'hybrid',
        },
      ];

      const mockQuery = new MockQueryBuilder(mockCultivars);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getCultivars('org-1', { strain_type: 'hybrid' });

      expect(result.data).toEqual(mockCultivars);
      expect(result.error).toBeNull();
    });

    it('should filter by produce category', async () => {
      const mockCultivars = [
        {
          id: '2',
          name: 'Tomato',
          category: 'vegetable',
        },
      ];

      const mockQuery = new MockQueryBuilder(mockCultivars);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getCultivars('org-1', { category: 'vegetable' });

      expect(result.data).toEqual(mockCultivars);
      expect(result.error).toBeNull();
    });

    it('should handle search filter', async () => {
      const mockCultivars = [
        {
          id: '1',
          name: 'Blue Dream',
          genetics: 'Blueberry x Haze',
        },
      ];

      const mockQuery = new MockQueryBuilder(mockCultivars);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getCultivars('org-1', { search: 'Blue' });

      expect(result.data).toEqual(mockCultivars);
      expect(result.error).toBeNull();
    });

    it('should include inactive cultivars when specified', async () => {
      const mockCultivars = [
        { id: '1', name: 'Active Strain', is_active: true },
        { id: '2', name: 'Inactive Strain', is_active: false },
      ];

      const mockQuery = new MockQueryBuilder(mockCultivars);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getCultivars('org-1', { is_active: false });

      expect(result.data).toEqual(mockCultivars);
      expect(result.error).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Database error');
      const mockQuery = new MockQueryBuilder(null, mockError);
      
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getCultivars('org-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getCultivarById', () => {
    it('should fetch a single cultivar with details', async () => {
      const mockCultivar = {
        id: 'cultivar-1',
        name: 'Blue Dream',
        strain_type: 'hybrid',
        genetics: 'Blueberry x Haze',
        created_by_user: { id: 'user-1', full_name: 'John Doe', email: 'john@test.com' },
      };

      const mockQuery = new MockQueryBuilder(mockCultivar);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getCultivarById('cultivar-1');

      expect(result.data).toEqual(mockCultivar);
      expect(result.error).toBeNull();
    });

    it('should handle not found error', async () => {
      const mockError = new Error('Cultivar not found');
      const mockQuery = new MockQueryBuilder(null, mockError);
      
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await getCultivarById('nonexistent');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('createCultivar', () => {
    it('should create a new cannabis cultivar', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockCultivar = {
        id: 'cultivar-1',
        organization_id: 'org-1',
        name: 'Blue Dream',
        strain_type: 'hybrid',
        genetics: 'Blueberry x Haze',
        thc_range_min: 18,
        thc_range_max: 24,
        created_by: 'user-1',
      };

      const mockQuery = new MockQueryBuilder(mockCultivar);
      
      resolveClient({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
        } as any,
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await createCultivar({
        organization_id: 'org-1',
        name: 'Blue Dream',
        strain_type: 'hybrid',
        genetics: 'Blueberry x Haze',
        thc_range_min: 18,
        thc_range_max: 24,
        created_by: 'user-1',
      });

      expect(result.data).toEqual(mockCultivar);
      expect(result.error).toBeNull();
    });

    it('should create a new produce cultivar', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockCultivar = {
        id: 'cultivar-2',
        organization_id: 'org-1',
        name: 'Roma Tomato',
        category: 'vegetable',
        flavor_profile: 'Sweet and slightly acidic',
        storage_life_days: 14,
        created_by: 'user-1',
      };

      const mockQuery = new MockQueryBuilder(mockCultivar);
      
      resolveClient({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
        } as any,
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await createCultivar({
        organization_id: 'org-1',
        name: 'Roma Tomato',
        category: 'vegetable',
        flavor_profile: 'Sweet and slightly acidic',
        storage_life_days: 14,
        created_by: 'user-1',
      });

      expect(result.data).toEqual(mockCultivar);
      expect(result.error).toBeNull();
    });

    it('should handle unauthenticated user', async () => {
      resolveClient({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        } as any,
      });

      const result = await createCultivar({
        organization_id: 'org-1',
        name: 'Test Cultivar',
        created_by: 'user-1',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('updateCultivar', () => {
    it('should update cultivar fields', async () => {
      const mockUpdated = {
        id: 'cultivar-1',
        name: 'Blue Dream v2',
        thc_range_min: 20,
        thc_range_max: 26,
      };

      const mockQuery = new MockQueryBuilder(mockUpdated);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await updateCultivar('cultivar-1', {
        name: 'Blue Dream v2',
        thc_range_min: 20,
        thc_range_max: 26,
      });

      expect(result.data).toEqual(mockUpdated);
      expect(result.error).toBeNull();
    });
  });

  describe('deleteCultivar', () => {
    it('should soft delete a cultivar', async () => {
      const mockDeleted = {
        id: 'cultivar-1',
        is_active: false,
      };

      const mockQuery = new MockQueryBuilder(mockDeleted);
      resolveClient({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await deleteCultivar('cultivar-1');

      expect(result.data?.is_active).toBe(false);
      expect(result.error).toBeNull();
    });
  });

  describe('getCultivarUsageStats', () => {
    it('should return usage statistics for a cultivar', async () => {
      const mockRecentBatches = [
        { id: '1', batch_number: 'CB-001', stage: 'flowering', status: 'active', start_date: '2025-01-01' },
        { id: '2', batch_number: 'CB-002', stage: 'vegetative', status: 'active', start_date: '2025-01-10' },
      ];

      const mockTotalQuery = new MockQueryBuilder(null, null, 10);
      const mockActiveQuery = new MockQueryBuilder(null, null, 5);
      const mockCompletedQuery = new MockQueryBuilder(null, null, 5);
      const mockRecentQuery = new MockQueryBuilder(mockRecentBatches);

      resolveClient({
        from: jest.fn()
          .mockReturnValueOnce(mockTotalQuery) // total batches
          .mockReturnValueOnce(mockActiveQuery) // active batches
          .mockReturnValueOnce(mockCompletedQuery) // completed batches
          .mockReturnValueOnce(mockRecentQuery), // recent batches
      });

      const result = await getCultivarUsageStats('cultivar-1');

      expect(result.data).toEqual({
        total_batches: 10,
        active_batches: 5,
        completed_batches: 5,
        recent_batches: mockRecentBatches,
      });
      expect(result.error).toBeNull();
    });

    it('should handle cultivars with no batches', async () => {
      const mockEmptyQuery = new MockQueryBuilder(null, null, 0);
      const mockRecentQuery = new MockQueryBuilder([]);

      resolveClient({
        from: jest.fn()
          .mockReturnValueOnce(mockEmptyQuery) // total batches
          .mockReturnValueOnce(mockEmptyQuery) // active batches
          .mockReturnValueOnce(mockEmptyQuery) // completed batches
          .mockReturnValueOnce(mockRecentQuery), // recent batches
      });

      const result = await getCultivarUsageStats('cultivar-1');

      expect(result.data).toEqual({
        total_batches: 0,
        active_batches: 0,
        completed_batches: 0,
        recent_batches: [],
      });
      expect(result.error).toBeNull();
    });
  });
});
