/**
 * Tests for Equipment Controls Query Functions
 * 
 * Tests the AUTO mode database operations including CRUD operations,
 * mode switching, override management, and utility functions.
 * 
 * Created: November 7, 2025
 * Phase: Week 2 Task 6 - Backend Testing
 */

import { createClient } from '../../server';
import {
  getEquipmentControls,
  getEquipmentControl,
  getAutoModeEquipment,
  getOverriddenEquipment,
  upsertEquipmentControl,
  batchUpsertEquipmentControls,
  updateEquipmentControl,
  setEquipmentToAutoMode,
  setEquipmentToManualMode,
  setEquipmentOverride,
  clearEquipmentOverride,
  deleteEquipmentControl,
  deleteAllEquipmentControls,
  initializeEquipmentControls,
  isEquipmentInAutoMode,
  isEquipmentOverridden,
} from '../equipment-controls';
import { MockQueryBuilder } from './test-helpers';
import { EquipmentType } from '@/types/equipment';

// Mock Supabase server client
jest.mock('../../server', () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Equipment Controls Query Functions', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  const mockPodId = 'pod-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create base mock structure
    mockSupabase = {
      from: jest.fn(),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  // ==========================================================
  // READ OPERATIONS
  // ==========================================================

  describe('getEquipmentControls', () => {
    it('should return all equipment controls for a pod', async () => {
      const mockControls = [
        {
          id: 'control-1',
          pod_id: mockPodId,
          equipment_type: EquipmentType.COOLING,
          state: 1,
          mode: 0,
          override: false,
          schedule_enabled: false,
          level: 100,
          auto_config: null,
        },
        {
          id: 'control-2',
          pod_id: mockPodId,
          equipment_type: EquipmentType.HEATING,
          state: 2,
          mode: 1,
          override: false,
          schedule_enabled: true,
          level: 75,
          auto_config: { temp_threshold: { min: 20, max: 26 } },
        },
      ];

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockControls, null));

      const result = await getEquipmentControls(mockPodId);

      expect(result.data).toHaveLength(2);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('equipment_controls');
    });

    it('should handle errors gracefully', async () => {
      mockSupabase.from.mockReturnValue(
        new MockQueryBuilder(null, { message: 'Database error' })
      );

      const result = await getEquipmentControls(mockPodId);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('getEquipmentControl', () => {
    it('should return specific equipment control by type', async () => {
      const mockControl = {
        id: 'control-1',
        pod_id: mockPodId,
        equipment_type: EquipmentType.COOLING,
        state: 2,
        mode: 1,
        override: false,
        schedule_enabled: true,
        level: 100,
        auto_config: { temp_threshold: { min: 18, max: 24 } },
      };

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockControl, null));

      const result = await getEquipmentControl(mockPodId, EquipmentType.COOLING);

      expect(result.data).toEqual(mockControl);
      expect(result.error).toBeNull();
    });
  });

  describe('getAutoModeEquipment', () => {
    it('should return all equipment in AUTO mode', async () => {
      const mockAutoEquipment = [
        {
          id: 'control-1',
          equipment_type: EquipmentType.COOLING,
          state: 2, // AUTO
          mode: 1, // AUTOMATIC
          auto_config: { temp_threshold: { min: 18, max: 24 } },
        },
        {
          id: 'control-2',
          equipment_type: EquipmentType.LIGHTING,
          state: 2, // AUTO
          mode: 1, // AUTOMATIC
          auto_config: { schedule: { on_time: '06:00', off_time: '22:00' } },
        },
      ];

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockAutoEquipment, null));

      const result = await getAutoModeEquipment();

      expect(result.data).toHaveLength(2);
      expect(result.error).toBeNull();
    });

    it('should filter by pod_id when provided', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder([], null));

      await getAutoModeEquipment(mockPodId);

      expect(mockSupabase.from).toHaveBeenCalledWith('equipment_controls');
    });
  });

  describe('getOverriddenEquipment', () => {
    it('should return equipment with overrides active', async () => {
      const mockOverriddenEquipment = [
        {
          id: 'control-1',
          equipment_type: EquipmentType.EXHAUST_FAN,
          state: 1,
          mode: 0,
          override: true,
        },
      ];

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockOverriddenEquipment, null));

      const result = await getOverriddenEquipment();

      expect(result.data).toHaveLength(1);
      expect(result.data![0].override).toBe(true);
    });
  });

  // ==========================================================
  // CREATE/UPDATE OPERATIONS
  // ==========================================================

  describe('upsertEquipmentControl', () => {
    it('should create or update equipment control', async () => {
      const newControl = {
        pod_id: mockPodId,
        equipment_type: EquipmentType.COOLING,
        state: 2,
        mode: 1,
        override: false,
        schedule_enabled: true,
        level: 100,
        auto_config: { temp_threshold: { min: 20, max: 26 } },
        changed_by: mockUserId,
      };

      const mockResponse = { id: 'control-1', ...newControl };
      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockResponse, null));

      const result = await upsertEquipmentControl(newControl);

      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeNull();
    });
  });

  describe('batchUpsertEquipmentControls', () => {
    it('should batch insert/update multiple equipment controls', async () => {
      const controls = [
        {
          pod_id: mockPodId,
          equipment_type: EquipmentType.COOLING,
          state: 1,
          mode: 0,
          level: 100,
        },
        {
          pod_id: mockPodId,
          equipment_type: EquipmentType.HEATING,
          state: 0,
          mode: 0,
          level: 0,
        },
      ];

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(controls, null));

      const result = await batchUpsertEquipmentControls(controls);

      expect(result.data).toHaveLength(2);
      expect(result.error).toBeNull();
    });
  });

  describe('updateEquipmentControl', () => {
    it('should update specific fields of equipment control', async () => {
      const updates = {
        state: 2,
        mode: 1,
        auto_config: { temp_threshold: { min: 18, max: 24 } },
      };

      mockSupabase.from.mockReturnValue(new MockQueryBuilder({ id: 'control-1', ...updates }, null));

      const result = await updateEquipmentControl(mockPodId, EquipmentType.COOLING, updates);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
  });

  describe('setEquipmentToAutoMode', () => {
    it('should switch equipment to AUTO mode with configuration', async () => {
      const autoConfig = {
        temp_threshold: { min: 20, max: 26 },
      };

      const mockResponse = {
        id: 'control-1',
        state: 2, // AUTO
        mode: 1, // AUTOMATIC
        auto_config: autoConfig,
      };

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockResponse, null));

      const result = await setEquipmentToAutoMode(mockPodId, EquipmentType.COOLING, autoConfig);

      expect(result.data?.state).toBe(2);
      expect(result.data?.mode).toBe(1);
      expect(result.error).toBeNull();
    });
  });

  describe('setEquipmentToManualMode', () => {
    it('should switch equipment to MANUAL mode', async () => {
      const mockResponse = {
        id: 'control-1',
        state: 1, // ON
        mode: 0, // MANUAL
        level: 75,
        auto_config: null,
      };

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockResponse, null));

      const result = await setEquipmentToManualMode(mockPodId, EquipmentType.COOLING, 1, 75);

      expect(result.data?.state).toBe(1);
      expect(result.data?.mode).toBe(0);
      expect(result.data?.level).toBe(75);
      expect(result.error).toBeNull();
    });
  });

  describe('setEquipmentOverride', () => {
    it('should enable override on equipment', async () => {
      const mockResponse = {
        id: 'control-1',
        override: true,
        state: 1,
      };

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockResponse, null));

      const result = await setEquipmentOverride(mockPodId, EquipmentType.EXHAUST_FAN, 1);

      expect(result.data?.override).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('clearEquipmentOverride', () => {
    it('should clear override on equipment', async () => {
      const mockResponse = {
        id: 'control-1',
        override: false,
      };

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockResponse, null));

      const result = await clearEquipmentOverride(mockPodId, EquipmentType.EXHAUST_FAN);

      expect(result.data?.override).toBe(false);
      expect(result.error).toBeNull();
    });
  });

  // ==========================================================
  // DELETE OPERATIONS
  // ==========================================================

  describe('deleteEquipmentControl', () => {
    it('should delete specific equipment control', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder(null, null));

      const result = await deleteEquipmentControl(mockPodId, EquipmentType.COOLING);

      expect(result.error).toBeNull();
    });
  });

  describe('deleteAllEquipmentControls', () => {
    it('should delete all equipment controls for a pod', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder(null, null));

      const result = await deleteAllEquipmentControls(mockPodId);

      expect(result.error).toBeNull();
    });
  });

  // ==========================================================
  // UTILITY FUNCTIONS
  // ==========================================================

  describe('initializeEquipmentControls', () => {
    it('should initialize default controls for new pod', async () => {
      const mockControls = new Array(12).fill(null).map((_, i) => ({
        id: `control-${i}`,
        pod_id: mockPodId,
        state: 0,
        mode: 0,
      }));

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockControls, null));

      const result = await initializeEquipmentControls(mockPodId);

      expect(result.data).toHaveLength(12);
      expect(result.error).toBeNull();
    });
  });

  describe('isEquipmentInAutoMode', () => {
    it('should return true if equipment is in AUTO mode', async () => {
      const mockControl = {
        id: 'control-1',
        mode: 1, // AUTOMATIC
      };

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockControl, null));

      const result = await isEquipmentInAutoMode(mockPodId, EquipmentType.COOLING);

      expect(result).toBe(true);
    });

    it('should return false if equipment is in MANUAL mode', async () => {
      const mockControl = {
        id: 'control-1',
        mode: 0, // MANUAL
      };

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockControl, null));

      const result = await isEquipmentInAutoMode(mockPodId, EquipmentType.COOLING);

      expect(result).toBe(false);
    });

    it('should return false if equipment not found', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder(null, null));

      const result = await isEquipmentInAutoMode(mockPodId, EquipmentType.COOLING);

      expect(result).toBe(false);
    });
  });

  describe('isEquipmentOverridden', () => {
    it('should return true if override is active', async () => {
      const mockControl = {
        id: 'control-1',
        override: true,
      };

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockControl, null));

      const result = await isEquipmentOverridden(mockPodId, EquipmentType.EXHAUST_FAN);

      expect(result).toBe(true);
    });

    it('should return false if override is not active', async () => {
      const mockControl = {
        id: 'control-1',
        override: false,
      };

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockControl, null));

      const result = await isEquipmentOverridden(mockPodId, EquipmentType.EXHAUST_FAN);

      expect(result).toBe(false);
    });
  });

  // ==========================================================
  // ERROR HANDLING
  // ==========================================================

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockCreateClient.mockRejectedValue(new Error('Connection failed'));

      const result = await getEquipmentControls(mockPodId);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should handle constraint violations', async () => {
      mockSupabase.from.mockReturnValue(
        new MockQueryBuilder(null, { message: 'Constraint violation' })
      );

      const result = await upsertEquipmentControl({
        pod_id: mockPodId,
        equipment_type: 'INVALID_TYPE' as EquipmentType,
        state: 999, // Invalid state
        mode: 0,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });
});
