/**
 * Alarm Audit Logging Helper
 *
 * Provides immutable audit trail for all alarm-related actions
 * Required for compliance (Cannabis regulations, PRIMUS GFS)
 *
 * Created: 2025-11-17
 * Phase: Alarm System Enhancements
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export type AlarmAuditAction =
  | 'triggered'
  | 'acknowledged'
  | 'resolved'
  | 'escalated'
  | 'shelved'
  | 'unshelved'
  | 'suppressed'
  | 'policy_created'
  | 'policy_changed'
  | 'policy_deleted'
  | 'auto_resolved';

interface LogAlarmActionParams {
  alarmId?: string;
  policyId?: string;
  action: AlarmAuditAction;
  performedBy?: string;
  details?: Record<string, unknown>;
}

interface AuditLogResult {
  success: boolean;
  error?: string;
  auditLogId?: string;
}

/**
 * Log an alarm-related action to the audit trail
 *
 * @param params - Audit log parameters
 * @returns Result indicating success or failure
 */
export async function logAlarmAction(
  params: LogAlarmActionParams
): Promise<AuditLogResult> {
  try {
    const supabase = await createClient();

    // Get request metadata
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const userAgent = headersList.get('user-agent');

    // Determine IP address (prefer x-forwarded-for, fallback to x-real-ip)
    const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || null;

    // If performedBy not provided, try to get current user
    let performedBy = params.performedBy;
    if (!performedBy) {
      const { data: { user } } = await supabase.auth.getUser();
      performedBy = user?.id;
    }

    // Insert audit log entry
    const { data, error } = await supabase
      .from('alarm_audit_log')
      .insert({
        alarm_id: params.alarmId || null,
        policy_id: params.policyId || null,
        action: params.action,
        performed_by: performedBy || null,
        performed_at: new Date().toISOString(),
        details: params.details || null,
        ip_address: ipAddress,
        user_agent: userAgent || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Audit Logger] Error logging action:', error);
      return { success: false, error: error.message };
    }

    return { success: true, auditLogId: data.id };
  } catch (error) {
    console.error('[Audit Logger] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log alarm acknowledgment
 */
export async function logAlarmAcknowledgment(
  alarmId: string,
  userId: string,
  note?: string
): Promise<AuditLogResult> {
  return logAlarmAction({
    alarmId,
    action: 'acknowledged',
    performedBy: userId,
    details: note ? { note } : undefined,
  });
}

/**
 * Log alarm resolution
 */
export async function logAlarmResolution(
  alarmId: string,
  userId: string,
  resolutionNote?: string,
  rootCause?: string
): Promise<AuditLogResult> {
  return logAlarmAction({
    alarmId,
    action: 'resolved',
    performedBy: userId,
    details: {
      resolution_note: resolutionNote,
      root_cause: rootCause,
    },
  });
}

/**
 * Log alarm escalation
 */
export async function logAlarmEscalation(
  alarmId: string,
  fromLevel: number,
  toLevel: number,
  performedBy?: string
): Promise<AuditLogResult> {
  return logAlarmAction({
    alarmId,
    action: 'escalated',
    performedBy,
    details: {
      from_level: fromLevel,
      to_level: toLevel,
    },
  });
}

/**
 * Log alarm shelving
 */
export async function logAlarmShelving(
  alarmId: string,
  userId: string,
  reason: string,
  shelvedUntil?: string
): Promise<AuditLogResult> {
  return logAlarmAction({
    alarmId,
    action: 'shelved',
    performedBy: userId,
    details: {
      reason,
      shelved_until: shelvedUntil,
    },
  });
}

/**
 * Log alarm unshelving
 */
export async function logAlarmUnshelving(
  alarmId: string,
  userId?: string,
  automatic?: boolean
): Promise<AuditLogResult> {
  return logAlarmAction({
    alarmId,
    action: 'unshelved',
    performedBy: userId,
    details: {
      automatic: automatic || false,
    },
  });
}

/**
 * Log alarm auto-resolution
 */
export async function logAlarmAutoResolution(
  alarmId: string,
  details?: Record<string, unknown>
): Promise<AuditLogResult> {
  return logAlarmAction({
    alarmId,
    action: 'auto_resolved',
    performedBy: undefined, // System action
    details,
  });
}

/**
 * Log alarm policy creation
 */
export async function logPolicyCreation(
  policyId: string,
  userId: string,
  policyDetails?: Record<string, unknown>
): Promise<AuditLogResult> {
  return logAlarmAction({
    policyId,
    action: 'policy_created',
    performedBy: userId,
    details: policyDetails,
  });
}

/**
 * Log alarm policy modification
 */
export async function logPolicyChange(
  policyId: string,
  userId: string,
  changes?: Record<string, unknown>
): Promise<AuditLogResult> {
  return logAlarmAction({
    policyId,
    action: 'policy_changed',
    performedBy: userId,
    details: changes,
  });
}

/**
 * Log alarm policy deletion
 */
export async function logPolicyDeletion(
  policyId: string,
  userId: string
): Promise<AuditLogResult> {
  return logAlarmAction({
    policyId,
    action: 'policy_deleted',
    performedBy: userId,
  });
}

/**
 * Log alarm triggering (called from alarm evaluator)
 */
export async function logAlarmTriggering(
  alarmId: string,
  alarmType: string,
  severity: string,
  details?: Record<string, unknown>
): Promise<AuditLogResult> {
  return logAlarmAction({
    alarmId,
    action: 'triggered',
    performedBy: undefined, // System action
    details: {
      alarm_type: alarmType,
      severity,
      ...details,
    },
  });
}
