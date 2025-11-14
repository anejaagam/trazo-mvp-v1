/**
 * Monitoring Audit Logging Helper
 * 
 * Provides audit logging capabilities for monitoring-related actions including:
 * - Recipe removal from pods
 * - Equipment control changes
 * - Manual overrides
 * - System state changes
 */

import { createClient } from '@/lib/supabase/client'

export interface MonitoringAuditEvent {
  userId: string
  organizationId: string
  action: string
  entityType: 'pod' | 'equipment' | 'recipe' | 'control'
  entityId: string
  entityName?: string | null
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

/**
 * Logs a monitoring-related audit event
 * 
 * @param event The audit event details
 * @returns Promise that resolves when logging is complete
 * 
 * @example
 * await logMonitoringAudit({
 *   userId: user.id,
 *   organizationId: org.id,
 *   action: 'equipment.control.manual',
 *   entityType: 'equipment',
 *   entityId: equipmentId,
 *   entityName: 'HVAC Unit 1',
 *   oldValues: { state: 'OFF', power: 0 },
 *   newValues: { state: 'ON', power: 75 },
 *   metadata: { podId, podName, reason: 'Manual override' }
 * })
 */
export async function logMonitoringAudit(event: MonitoringAuditEvent): Promise<void> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.from('audit_log').insert({
      organization_id: event.organizationId,
      user_id: event.userId,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId,
      entity_name: event.entityName,
      old_values: event.oldValues,
      new_values: event.newValues,
      metadata: event.metadata,
      timestamp: new Date().toISOString(),
    })
    
    if (error) {
      console.error('Failed to log monitoring audit event:', error)
      // Don't throw - audit logging should be best-effort
    }
  } catch (error) {
    console.error('Error in logMonitoringAudit:', error)
    // Don't throw - never block operations due to audit logging failures
  }
}

/**
 * Predefined audit action types for monitoring
 */
export const MONITORING_AUDIT_ACTIONS = {
  // Recipe actions
  RECIPE_REMOVED: 'monitoring.recipe.removed',
  RECIPE_APPLIED: 'monitoring.recipe.applied',
  
  // Equipment control actions
  EQUIPMENT_MANUAL_CONTROL: 'monitoring.equipment.manual',
  EQUIPMENT_AUTO_ENABLED: 'monitoring.equipment.auto',
  EQUIPMENT_OVERRIDE: 'monitoring.equipment.override',
  
  // Pod actions
  POD_SETPOINT_CHANGED: 'monitoring.pod.setpoint',
  POD_CALIBRATION: 'monitoring.pod.calibration',
  
  // System actions
  ALARM_ACKNOWLEDGED: 'monitoring.alarm.acknowledged',
  ALARM_RESOLVED: 'monitoring.alarm.resolved',
} as const

export type MonitoringAuditAction = typeof MONITORING_AUDIT_ACTIONS[keyof typeof MONITORING_AUDIT_ACTIONS]
