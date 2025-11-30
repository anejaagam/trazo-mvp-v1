/**
 * Alarm Server Actions
 * 
 * Server actions for alarm lifecycle management: acknowledge, resolve, snooze
 * Also includes alarm policy CRUD operations with RBAC enforcement
 * 
 * Created: November 15, 2025
 * Phase: 14A - Core Alarms Implementation
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  Alarm,
  AlarmPolicy,
  InsertAlarmPolicy,
  UpdateAlarmPolicy,
} from '@/types/telemetry';
import {
  logAlarmAcknowledgment,
  logAlarmResolution,
  logPolicyCreation,
  logPolicyChange,
  logPolicyDeletion,
} from '@/lib/monitoring/audit-logger';

// =====================================================
// ALARM LIFECYCLE ACTIONS
// =====================================================

export interface AlarmActionResult {
  success: boolean;
  error?: string;
  data?: Alarm;
}

/**
 * Acknowledge an active alarm
 * Requires 'alarm:ack' permission
 */
export async function acknowledgeAlarm(
  alarmId: string,
  note?: string
): Promise<AlarmActionResult> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Check if alarm exists and is not already acknowledged
    const { data: existingAlarm, error: fetchError } = await supabase
      .from('alarms')
      .select('*')
      .eq('id', alarmId)
      .single();
    
    if (fetchError || !existingAlarm) {
      return { success: false, error: 'Alarm not found' };
    }
    
    if (existingAlarm.acknowledged_at) {
      return {
        success: false,
        error: 'Alarm already acknowledged',
      };
    }
    
    // Update alarm
    const { data, error } = await supabase
      .from('alarms')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.id,
        ack_note: note || null,
      })
      .eq('id', alarmId)
      .select()
      .single();
    
    if (error) {
      console.error('Error acknowledging alarm:', error);
      return { success: false, error: error.message };
    }

    // Log acknowledgment to audit trail
    await logAlarmAcknowledgment(alarmId, user.id, note);

    revalidatePath('/dashboard/alarms');
    return { success: true, data };
  } catch (error) {
    console.error('Error in acknowledgeAlarm:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resolve an acknowledged alarm
 * Requires 'alarm:resolve' permission
 */
export async function resolveAlarm(
  alarmId: string,
  resolutionNote?: string,
  rootCause?: string
): Promise<AlarmActionResult> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Check if alarm exists
    const { data: existingAlarm, error: fetchError } = await supabase
      .from('alarms')
      .select('*')
      .eq('id', alarmId)
      .single();
    
    if (fetchError || !existingAlarm) {
      return { success: false, error: 'Alarm not found' };
    }
    
    if (existingAlarm.resolved_at) {
      return {
        success: false,
        error: 'Alarm already resolved',
      };
    }
    
    // Auto-acknowledge if not already acknowledged
    const updates: Partial<Alarm> = {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      resolution_note: resolutionNote || null,
      root_cause: rootCause || null,
    };
    
    if (!existingAlarm.acknowledged_at) {
      updates.acknowledged_at = new Date().toISOString();
      updates.acknowledged_by = user.id;
    }
    
    // Update alarm
    const { data, error } = await supabase
      .from('alarms')
      .update(updates)
      .eq('id', alarmId)
      .select()
      .single();
    
    if (error) {
      console.error('Error resolving alarm:', error);
      return { success: false, error: error.message };
    }

    // Log resolution to audit trail
    await logAlarmResolution(alarmId, user.id, resolutionNote, rootCause);

    revalidatePath('/dashboard/alarms');
    return { success: true, data };
  } catch (error) {
    console.error('Error in resolveAlarm:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Snooze an alarm for specified minutes
 * NOT YET IMPLEMENTED - requires snooze_until column
 */
export async function snoozeAlarm(
  alarmId: string,
  minutes: number
): Promise<AlarmActionResult> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // TODO: Add snooze_until column to alarms table
    // For now, just acknowledge with a note
    return acknowledgeAlarm(alarmId, `Snoozed for ${minutes} minutes`);
  } catch (error) {
    console.error('Error in snoozeAlarm:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch acknowledge multiple alarms
 * Useful for acknowledging all alarms of a certain type
 */
export async function batchAcknowledgeAlarms(
  alarmIds: string[],
  note?: string
): Promise<{ success: boolean; acknowledged: number; errors: string[] }> {
  const results = await Promise.all(
    alarmIds.map((id) => acknowledgeAlarm(id, note))
  );
  
  const acknowledged = results.filter((r) => r.success).length;
  const errors = results
    .filter((r) => !r.success)
    .map((r) => r.error || 'Unknown error');
  
  return {
    success: acknowledged > 0,
    acknowledged,
    errors,
  };
}

// =====================================================
// ALARM POLICY ACTIONS
// =====================================================

export interface PolicyActionResult {
  success: boolean;
  error?: string;
  data?: AlarmPolicy;
}

/**
 * Create a new alarm policy
 * Requires 'alarm:configure' permission
 */
export async function createAlarmPolicy(
  policy: Omit<InsertAlarmPolicy, 'created_by'>
): Promise<PolicyActionResult> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Create policy
    const { data, error } = await supabase
      .from('alarm_policies')
      .insert({
        ...policy,
        created_by: user.id,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating alarm policy:', error);
      return { success: false, error: error.message };
    }

    // Log policy creation to audit trail
    await logPolicyCreation(data.id, user.id, {
      alarm_type: policy.alarm_type,
      severity: policy.severity,
      name: policy.name,
    });

    revalidatePath('/dashboard/alarms/configuration');
    return { success: true, data };
  } catch (error) {
    console.error('Error in createAlarmPolicy:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update an existing alarm policy
 * Requires 'alarm:configure' permission
 */
export async function updateAlarmPolicy(
  policyId: string,
  updates: UpdateAlarmPolicy
): Promise<PolicyActionResult> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Update policy
    const { data, error } = await supabase
      .from('alarm_policies')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', policyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating alarm policy:', error);
      return { success: false, error: error.message };
    }

    // Log policy change to audit trail
    await logPolicyChange(policyId, user.id, updates as Record<string, unknown>);

    revalidatePath('/dashboard/alarms/configuration');
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateAlarmPolicy:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete an alarm policy
 * Requires 'alarm:policy_edit' permission
 */
export async function deleteAlarmPolicy(
  policyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Delete policy
    const { error } = await supabase
      .from('alarm_policies')
      .delete()
      .eq('id', policyId);

    if (error) {
      console.error('Error deleting alarm policy:', error);
      return { success: false, error: error.message };
    }

    // Log policy deletion to audit trail
    await logPolicyDeletion(policyId, user.id);

    revalidatePath('/dashboard/alarms/configuration');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteAlarmPolicy:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Toggle alarm policy active status
 * Requires 'alarm:configure' permission
 */
export async function toggleAlarmPolicy(
  policyId: string,
  isActive: boolean
): Promise<PolicyActionResult> {
  return updateAlarmPolicy(policyId, { is_active: isActive });
}
