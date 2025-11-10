/**
 * Equipment Controls Database Queries (Server-Side)
 * 
 * Server-side queries for equipment control states with AUTO mode support
 * Uses server-side Supabase client for proper RLS enforcement
 * 
 * Created: November 7, 2025
 * Phase: Week 2 - AUTO Mode Backend Integration
 */

import { createClient } from '@/lib/supabase/server';
import type { EquipmentType } from '@/types/equipment';
import type { QueryResult } from '@/types/telemetry';

// =====================================================
// TYPES
// =====================================================

/**
 * Equipment control record from database
 */
export interface EquipmentControlRecord {
  id: string;
  pod_id: string;
  equipment_type: string;
  state: number; // 0=OFF, 1=ON, 2=AUTO
  mode: number; // 0=MANUAL, 1=AUTOMATIC
  override: boolean;
  schedule_enabled: boolean;
  level: number; // 0-100%
  auto_config: Record<string, unknown> | null;
  last_state_change: string;
  last_mode_change: string;
  changed_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Insert type for equipment controls
 */
export interface InsertEquipmentControl {
  pod_id: string;
  equipment_type: string | EquipmentType;
  state: number;
  mode: number;
  override?: boolean;
  schedule_enabled?: boolean;
  level?: number;
  auto_config?: Record<string, unknown> | null;
  changed_by?: string;
}

/**
 * Update type for equipment controls
 */
export interface UpdateEquipmentControl {
  state?: number;
  mode?: number;
  override?: boolean;
  schedule_enabled?: boolean;
  level?: number;
  auto_config?: Record<string, unknown> | null;
  changed_by?: string;
}

// =====================================================
// READ OPERATIONS
// =====================================================

/**
 * Get all equipment controls for a pod
 * 
 * @param podId - UUID of the pod
 * @returns Query result with array of equipment controls
 */
export async function getEquipmentControls(
  podId: string
): Promise<QueryResult<EquipmentControlRecord[]>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('equipment_controls')
      .select('*')
      .eq('pod_id', podId)
      .order('equipment_type', { ascending: true });

    if (error) throw error;
    return { data: data as EquipmentControlRecord[], error: null };
  } catch (error) {
    console.error('Error in getEquipmentControls:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get specific equipment control by type
 * 
 * @param podId - UUID of the pod
 * @param equipmentType - Type of equipment
 * @returns Query result with single equipment control
 */
export async function getEquipmentControl(
  podId: string,
  equipmentType: string | EquipmentType
): Promise<QueryResult<EquipmentControlRecord>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('equipment_controls')
      .select('*')
      .eq('pod_id', podId)
      .eq('equipment_type', equipmentType)
      .single();

    if (error) throw error;
    return { data: data as EquipmentControlRecord, error: null };
  } catch (error) {
    console.error('Error in getEquipmentControl:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all equipment in AUTO mode
 * 
 * @param podId - UUID of the pod (optional - if not provided, returns all AUTO equipment)
 * @returns Query result with array of equipment controls in AUTO mode
 */
export async function getAutoModeEquipment(
  podId?: string
): Promise<QueryResult<EquipmentControlRecord[]>> {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('equipment_controls')
      .select('*')
      .eq('mode', 1); // AUTOMATIC mode

    if (podId) {
      query = query.eq('pod_id', podId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;
    return { data: data as EquipmentControlRecord[], error: null };
  } catch (error) {
    console.error('Error in getAutoModeEquipment:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all equipment with active overrides
 * 
 * @param podId - UUID of the pod (optional)
 * @returns Query result with array of equipment controls with overrides
 */
export async function getOverriddenEquipment(
  podId?: string
): Promise<QueryResult<EquipmentControlRecord[]>> {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('equipment_controls')
      .select('*')
      .eq('override', true);

    if (podId) {
      query = query.eq('pod_id', podId);
    }

    const { data, error } = await query.order('last_state_change', { ascending: false });

    if (error) throw error;
    return { data: data as EquipmentControlRecord[], error: null };
  } catch (error) {
    console.error('Error in getOverriddenEquipment:', error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// CREATE OPERATIONS
// =====================================================

/**
 * Create or upsert equipment control
 * 
 * Creates a new equipment control or updates if it already exists
 * (unique constraint on pod_id + equipment_type)
 * 
 * @param control - Equipment control data to insert
 * @returns Query result with created equipment control
 */
export async function upsertEquipmentControl(
  control: InsertEquipmentControl
): Promise<QueryResult<EquipmentControlRecord>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('equipment_controls')
      .upsert(control, {
        onConflict: 'pod_id,equipment_type',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as EquipmentControlRecord, error: null };
  } catch (error) {
    console.error('Error in upsertEquipmentControl:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Batch upsert multiple equipment controls
 * 
 * @param controls - Array of equipment control data to insert
 * @returns Query result with array of created equipment controls
 */
export async function batchUpsertEquipmentControls(
  controls: InsertEquipmentControl[]
): Promise<QueryResult<EquipmentControlRecord[]>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('equipment_controls')
      .upsert(controls, {
        onConflict: 'pod_id,equipment_type',
        ignoreDuplicates: false,
      })
      .select();

    if (error) throw error;
    return { data: data as EquipmentControlRecord[], error: null };
  } catch (error) {
    console.error('Error in batchUpsertEquipmentControls:', error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// UPDATE OPERATIONS
// =====================================================

/**
 * Update equipment control state
 * 
 * @param podId - UUID of the pod
 * @param equipmentType - Type of equipment
 * @param updates - Fields to update
 * @returns Query result with updated equipment control
 */
export async function updateEquipmentControl(
  podId: string,
  equipmentType: string | EquipmentType,
  updates: UpdateEquipmentControl
): Promise<QueryResult<EquipmentControlRecord>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('equipment_controls')
      .update(updates)
      .eq('pod_id', podId)
      .eq('equipment_type', equipmentType)
      .select()
      .single();

    if (error) throw error;
    return { data: data as EquipmentControlRecord, error: null };
  } catch (error) {
    console.error('Error in updateEquipmentControl:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Set equipment to AUTO mode with configuration
 * 
 * @param podId - UUID of the pod
 * @param equipmentType - Type of equipment
 * @param autoConfig - AUTO mode configuration (thresholds, schedules)
 * @param changedBy - User ID making the change
 * @returns Query result with updated equipment control
 */
export async function setEquipmentToAutoMode(
  podId: string,
  equipmentType: string | EquipmentType,
  autoConfig: Record<string, unknown>,
  changedBy?: string
): Promise<QueryResult<EquipmentControlRecord>> {
  return updateEquipmentControl(podId, equipmentType, {
    state: 2, // AUTO
    mode: 1, // AUTOMATIC
    auto_config: autoConfig,
    override: false,
    changed_by: changedBy,
  });
}

/**
 * Set equipment to MANUAL mode
 * 
 * @param podId - UUID of the pod
 * @param equipmentType - Type of equipment
 * @param state - 0 (OFF) or 1 (ON)
 * @param level - Power level (0-100%)
 * @param changedBy - User ID making the change
 * @returns Query result with updated equipment control
 */
export async function setEquipmentToManualMode(
  podId: string,
  equipmentType: string | EquipmentType,
  state: 0 | 1,
  level: number = 100,
  changedBy?: string
): Promise<QueryResult<EquipmentControlRecord>> {
  return updateEquipmentControl(podId, equipmentType, {
    state,
    mode: 0, // MANUAL
    level,
    override: false,
    auto_config: null,
    changed_by: changedBy,
  });
}

/**
 * Set override on equipment (manual control while in AUTO mode)
 * 
 * @param podId - UUID of the pod
 * @param equipmentType - Type of equipment
 * @param overrideState - 0 (OFF) or 1 (ON)
 * @param changedBy - User ID making the change
 * @returns Query result with updated equipment control
 */
export async function setEquipmentOverride(
  podId: string,
  equipmentType: string | EquipmentType,
  overrideState: 0 | 1,
  changedBy?: string
): Promise<QueryResult<EquipmentControlRecord>> {
  return updateEquipmentControl(podId, equipmentType, {
    state: overrideState,
    override: true,
    changed_by: changedBy,
  });
}

/**
 * Clear override on equipment (return to AUTO mode behavior)
 * 
 * @param podId - UUID of the pod
 * @param equipmentType - Type of equipment
 * @param changedBy - User ID making the change
 * @returns Query result with updated equipment control
 */
export async function clearEquipmentOverride(
  podId: string,
  equipmentType: string | EquipmentType,
  changedBy?: string
): Promise<QueryResult<EquipmentControlRecord>> {
  return updateEquipmentControl(podId, equipmentType, {
    override: false,
    changed_by: changedBy,
  });
}

// =====================================================
// DELETE OPERATIONS
// =====================================================

/**
 * Delete equipment control
 * 
 * Note: This removes the equipment control record entirely.
 * Consider setting state to OFF instead of deleting.
 * 
 * @param podId - UUID of the pod
 * @param equipmentType - Type of equipment
 * @returns Query result
 */
export async function deleteEquipmentControl(
  podId: string,
  equipmentType: string | EquipmentType
): Promise<QueryResult<null>> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('equipment_controls')
      .delete()
      .eq('pod_id', podId)
      .eq('equipment_type', equipmentType);

    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    console.error('Error in deleteEquipmentControl:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete all equipment controls for a pod
 * 
 * @param podId - UUID of the pod
 * @returns Query result
 */
export async function deleteAllEquipmentControls(
  podId: string
): Promise<QueryResult<null>> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('equipment_controls')
      .delete()
      .eq('pod_id', podId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    console.error('Error in deleteAllEquipmentControls:', error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Initialize default equipment controls for a new pod
 * 
 * Creates equipment control records for all standard equipment types
 * in OFF/MANUAL state.
 * 
 * @param podId - UUID of the pod
 * @returns Query result with created equipment controls
 */
export async function initializeEquipmentControls(
  podId: string
): Promise<QueryResult<EquipmentControlRecord[]>> {
  const defaultEquipment: InsertEquipmentControl[] = [
    { pod_id: podId, equipment_type: 'cooling', state: 0, mode: 0, level: 100 },
    { pod_id: podId, equipment_type: 'heating', state: 0, mode: 0, level: 100 },
    { pod_id: podId, equipment_type: 'dehumidifier', state: 0, mode: 0, level: 100 },
    { pod_id: podId, equipment_type: 'humidifier', state: 0, mode: 0, level: 100 },
    { pod_id: podId, equipment_type: 'co2_injection', state: 0, mode: 0, level: 100 },
    { pod_id: podId, equipment_type: 'exhaust_fan', state: 0, mode: 0, level: 100 },
    { pod_id: podId, equipment_type: 'circulation_fan', state: 0, mode: 0, level: 100 },
    { pod_id: podId, equipment_type: 'lighting', state: 0, mode: 0, level: 0 },
  ];

  return batchUpsertEquipmentControls(defaultEquipment);
}

/**
 * Check if equipment is in AUTO mode
 * 
 * @param podId - UUID of the pod
 * @param equipmentType - Type of equipment
 * @returns True if equipment is in AUTO mode, false otherwise
 */
export async function isEquipmentInAutoMode(
  podId: string,
  equipmentType: string | EquipmentType
): Promise<boolean> {
  const result = await getEquipmentControl(podId, equipmentType);
  return result.data?.mode === 1; // AUTOMATIC mode
}

/**
 * Check if equipment has active override
 * 
 * @param podId - UUID of the pod
 * @param equipmentType - Type of equipment
 * @returns True if equipment has override active, false otherwise
 */
export async function isEquipmentOverridden(
  podId: string,
  equipmentType: string | EquipmentType
): Promise<boolean> {
  const result = await getEquipmentControl(podId, equipmentType);
  return result.data?.override === true;
}
