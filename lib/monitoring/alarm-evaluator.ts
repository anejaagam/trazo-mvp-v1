/**
 * Alarm Evaluation Engine
 * 
 * Evaluates telemetry readings against alarm policies to trigger alarms
 * Implements time-in-state debouncing and auto-resolution
 * 
 * Created: November 15, 2025
 * Phase: 14A - Core Alarms Implementation
 */

import { createClient } from '@/lib/supabase/server';
import type {
  TelemetryReading,
  AlarmPolicy,
  AlarmType,
  InsertAlarm,
  Alarm,
} from '@/types/telemetry';
import {
  logAlarmTriggering,
  logAlarmAutoResolution,
} from '@/lib/monitoring/audit-logger';

interface ThresholdViolation {
  policy: AlarmPolicy;
  violated: boolean;
  actualValue: number;
  thresholdValue: number;
}

interface EvaluationResult {
  alarmsCreated: number;
  alarmsResolved: number;
  errors: string[];
}

// =====================================================
// THRESHOLD EVALUATION
// =====================================================

/**
 * Evaluate a single reading value against a threshold policy
 */
function evaluateThreshold(
  actualValue: number,
  thresholdValue: number,
  operator: string
): boolean {
  switch (operator) {
    case '>':
      return actualValue > thresholdValue;
    case '<':
      return actualValue < thresholdValue;
    case '>=':
      return actualValue >= thresholdValue;
    case '<=':
      return actualValue <= thresholdValue;
    case '=':
      return actualValue === thresholdValue;
    case '!=':
      return actualValue !== thresholdValue;
    default:
      return false;
  }
}

/**
 * Evaluate threshold with deadband/hysteresis to prevent chattering
 * For auto-resolution, we check if value has returned to safe zone
 *
 * @param actualValue - Current reading value
 * @param thresholdValue - Alarm trigger threshold
 * @param operator - Comparison operator
 * @param deadband - Deadband value (optional)
 * @param checkingResolution - true if checking for auto-resolution (inverts logic)
 * @returns true if condition is met
 */
function evaluateThresholdWithDeadband(
  actualValue: number,
  thresholdValue: number,
  operator: string,
  deadband?: number | null,
  checkingResolution: boolean = false
): boolean {
  // If no deadband, use standard evaluation
  if (!deadband || deadband === 0) {
    const result = evaluateThreshold(actualValue, thresholdValue, operator);
    return checkingResolution ? !result : result;
  }

  // With deadband: For high thresholds, safe zone is below (threshold - deadband)
  // For low thresholds, safe zone is above (threshold + deadband)
  switch (operator) {
    case '>':
    case '>=':
      // High threshold: alarm triggers above threshold
      // Safe zone for resolution: below (threshold - deadband)
      if (checkingResolution) {
        return actualValue < (thresholdValue - deadband);
      }
      return actualValue > thresholdValue;

    case '<':
    case '<=':
      // Low threshold: alarm triggers below threshold
      // Safe zone for resolution: above (threshold + deadband)
      if (checkingResolution) {
        return actualValue > (thresholdValue + deadband);
      }
      return actualValue < thresholdValue;

    default:
      return evaluateThreshold(actualValue, thresholdValue, operator);
  }
}

/**
 * Extract the actual value from a telemetry reading based on alarm type
 */
function getActualValue(
  reading: TelemetryReading,
  alarmType: AlarmType
): number | null {
  switch (alarmType) {
    case 'temperature_high':
    case 'temperature_low':
      return reading.temperature_c;
    case 'humidity_high':
    case 'humidity_low':
      return reading.humidity_pct;
    case 'co2_high':
    case 'co2_low':
      return reading.co2_ppm;
    case 'vpd_out_of_range':
      return reading.vpd_kpa;
    default:
      return null;
  }
}

/**
 * Check if a telemetry reading violates any alarm policies
 */
function checkThresholdViolations(
  reading: TelemetryReading,
  policies: AlarmPolicy[]
): ThresholdViolation[] {
  const violations: ThresholdViolation[] = [];

  for (const policy of policies) {
    // Skip inactive policies
    if (!policy.is_active) continue;

    const actualValue = getActualValue(reading, policy.alarm_type);
    if (actualValue === null) continue;

    const thresholdValue = policy.threshold_value;
    if (thresholdValue === null) continue;
    
    const operator = policy.threshold_operator || '>';

    const violated = evaluateThreshold(
      actualValue,
      thresholdValue,
      operator as string
    );

    violations.push({
      policy,
      violated,
      actualValue,
      thresholdValue,
    });
  }

  return violations;
}

// =====================================================
// TIME-IN-STATE DEBOUNCING
// =====================================================

/**
 * Check if a violation has persisted long enough to trigger an alarm
 * 
 * @param podId - Pod ID to check
 * @param alarmType - Type of alarm
 * @param timeInStateSeconds - Required duration in seconds
 * @returns True if violation has persisted long enough
 */
async function hasPersistedLongEnough(
  podId: string,
  alarmType: AlarmType,
  timeInStateSeconds: number
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Get recent readings within the time window
    const cutoffTime = new Date(Date.now() - timeInStateSeconds * 1000).toISOString();
    
    const { data: recentReadings, error } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', podId)
      .gte('timestamp', cutoffTime)
      .order('timestamp', { ascending: true });
    
    if (error || !recentReadings || recentReadings.length === 0) {
      return false;
    }
    
    // Get the policy for this alarm type to check threshold
    const { data: policies } = await supabase
      .from('alarm_policies')
      .select('*')
      .eq('alarm_type', alarmType)
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (!policies) return false;
    
    // Check if ALL recent readings violate the threshold
    const allViolated = recentReadings.every((reading) => {
      const actualValue = getActualValue(reading, alarmType);
      if (actualValue === null) return false;
      
      const operator = policies.threshold_operator || '>';
      return evaluateThreshold(
        actualValue,
        policies.threshold_value || 0,
        operator as string
      );
    });
    
    return allViolated && recentReadings.length >= 2; // At least 2 consecutive readings
  } catch (error) {
    console.error('Error checking persistence:', error);
    return false;
  }
}

/**
 * Check if an alarm is in suppression period
 */
async function isInSuppressionPeriod(
  podId: string,
  alarmType: AlarmType,
  suppressionMinutes: number
): Promise<boolean> {
  if (suppressionMinutes === 0) return false;
  
  try {
    const supabase = await createClient();
    const cutoffTime = new Date(Date.now() - suppressionMinutes * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('alarms')
      .select('triggered_at')
      .eq('pod_id', podId)
      .eq('alarm_type', alarmType)
      .gte('triggered_at', cutoffTime)
      .limit(1);
    
    if (error) return false;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking suppression:', error);
    return false;
  }
}

// =====================================================
// ALARM CREATION
// =====================================================

/**
 * Generate alarm message based on type and values
 */
function generateAlarmMessage(
  alarmType: AlarmType,
  actualValue: number,
  thresholdValue: number,
  podName?: string
): string {
  const pod = podName ? `${podName}: ` : '';
  
  switch (alarmType) {
    case 'temperature_high':
      return `${pod}Temperature too high: ${actualValue.toFixed(1)}°C (threshold: ${thresholdValue.toFixed(1)}°C)`;
    case 'temperature_low':
      return `${pod}Temperature too low: ${actualValue.toFixed(1)}°C (threshold: ${thresholdValue.toFixed(1)}°C)`;
    case 'humidity_high':
      return `${pod}Humidity too high: ${actualValue.toFixed(1)}% (threshold: ${thresholdValue.toFixed(1)}%)`;
    case 'humidity_low':
      return `${pod}Humidity too low: ${actualValue.toFixed(1)}% (threshold: ${thresholdValue.toFixed(1)}%)`;
    case 'co2_high':
      return `${pod}CO₂ too high: ${actualValue.toFixed(0)} ppm (threshold: ${thresholdValue.toFixed(0)} ppm)`;
    case 'co2_low':
      return `${pod}CO₂ too low: ${actualValue.toFixed(0)} ppm (threshold: ${thresholdValue.toFixed(0)} ppm)`;
    case 'vpd_out_of_range':
      return `${pod}VPD out of range: ${actualValue.toFixed(2)} kPa (threshold: ${thresholdValue.toFixed(2)} kPa)`;
    default:
      return `${pod}Alarm: ${alarmType}`;
  }
}

/**
 * Create a new alarm record
 */
async function createAlarm(
  violation: ThresholdViolation,
  reading: TelemetryReading,
  podName?: string
): Promise<{ success: boolean; alarmId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    
    const newAlarm: InsertAlarm = {
      pod_id: reading.pod_id,
      policy_id: violation.policy.id,
      alarm_type: violation.policy.alarm_type,
      severity: violation.policy.severity,
      message: generateAlarmMessage(
        violation.policy.alarm_type,
        violation.actualValue,
        violation.thresholdValue,
        podName
      ),
      threshold_value: violation.thresholdValue,
      actual_value: violation.actualValue,
      telemetry_reading_id: reading.id,
      recipe_id: reading.active_recipe_id || null,
    };
    
    const { data, error } = await supabase
      .from('alarms')
      .insert(newAlarm)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating alarm:', error);
      return { success: false, error: error.message };
    }

    // Log alarm triggering to audit trail
    await logAlarmTriggering(data.id, newAlarm.alarm_type, newAlarm.severity, {
      pod_id: reading.pod_id,
      threshold_value: violation.thresholdValue,
      actual_value: violation.actualValue,
    });

    console.log(`✓ Created alarm: ${newAlarm.alarm_type} for pod ${reading.pod_id}`);
    return { success: true, alarmId: data.id };
  } catch (error) {
    console.error('Error creating alarm:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =====================================================
// AUTO-RESOLUTION
// =====================================================

/**
 * Check if acknowledged alarms should be auto-resolved
 * Resolves alarms when conditions return to normal for 15 minutes
 */
async function checkAutoResolution(
  podId: string,
  reading: TelemetryReading,
  policies: AlarmPolicy[]
): Promise<number> {
  try {
    const supabase = await createClient();
    
    // Get acknowledged but unresolved alarms for this pod
    const { data: acknowledgedAlarms, error: alarmError } = await supabase
      .from('alarms')
      .select('*')
      .eq('pod_id', podId)
      .is('resolved_at', null)
      .not('acknowledged_at', 'is', null);
    
    if (alarmError || !acknowledgedAlarms || acknowledgedAlarms.length === 0) {
      return 0;
    }
    
    let resolvedCount = 0;
    const autoResolutionMinutes = 15;
    
    for (const alarm of acknowledgedAlarms) {
      // Find the policy for this alarm
      const policy = policies.find(p => p.id === alarm.policy_id);
      if (!policy) continue;
      
      // Check if alarm has been acknowledged for at least 15 minutes
      const ackTime = new Date(alarm.acknowledged_at!).getTime();
      const now = Date.now();
      if (now - ackTime < autoResolutionMinutes * 60 * 1000) continue;
      
      // Check if current reading is within threshold
      const actualValue = getActualValue(reading, alarm.alarm_type);
      if (actualValue === null) continue;
      
      const operator = policy.threshold_operator || '>';
      const violated = evaluateThreshold(
        actualValue,
        policy.threshold_value || 0,
        operator as string
      );
      
      // If no longer violated, check if it's been normal for 15 minutes
      if (!violated) {
        const cutoffTime = new Date(Date.now() - autoResolutionMinutes * 60 * 1000).toISOString();
        
        const { data: recentReadings } = await supabase
          .from('telemetry_readings')
          .select('*')
          .eq('pod_id', podId)
          .gte('timestamp', cutoffTime)
          .order('timestamp', { ascending: true });
        
        if (!recentReadings || recentReadings.length === 0) continue;
        
        // Check if all recent readings are within safe zone (using deadband)
        const operator = policy.threshold_operator || '>';
        const deadband = policy.deadband_value;
        const allNormal = recentReadings.every((r) => {
          const value = getActualValue(r, alarm.alarm_type);
          if (value === null) return false;

          // Use deadband-aware evaluation for resolution
          return evaluateThresholdWithDeadband(
            value,
            policy.threshold_value || 0,
            operator as string,
            deadband,
            true // checkingResolution = true
          );
        });
        
        if (allNormal) {
          // Auto-resolve the alarm
          const { error: updateError } = await supabase
            .from('alarms')
            .update({
              resolved_at: new Date().toISOString(),
              resolution_note: 'Auto-resolved: Condition normalized for 15 minutes',
            })
            .eq('id', alarm.id);

          if (!updateError) {
            // Log auto-resolution to audit trail
            await logAlarmAutoResolution(alarm.id, {
              alarm_type: alarm.alarm_type,
              pod_id: alarm.pod_id,
              normalized_for_minutes: 15,
            });

            console.log(`✓ Auto-resolved alarm ${alarm.id}: ${alarm.alarm_type}`);
            resolvedCount++;
          }
        }
      }
    }
    
    return resolvedCount;
  } catch (error) {
    console.error('Error in auto-resolution:', error);
    return 0;
  }
}

// =====================================================
// MAIN EVALUATION FUNCTION
// =====================================================

/**
 * Evaluate a telemetry reading against all active alarm policies
 * 
 * @param reading - The telemetry reading to evaluate
 * @returns Evaluation result with counts of alarms created/resolved
 */
export async function evaluateTelemetryReading(
  reading: TelemetryReading
): Promise<EvaluationResult> {
  const result: EvaluationResult = {
    alarmsCreated: 0,
    alarmsResolved: 0,
    errors: [],
  };
  
  try {
    const supabase = await createClient();
    
    // Get active alarm policies for environmental monitoring
    const { data: policies, error: policyError } = await supabase
      .from('alarm_policies')
      .select('*')
      .eq('is_active', true)
      .in('alarm_type', [
        'temperature_high',
        'temperature_low',
        'humidity_high',
        'humidity_low',
        'co2_high',
        'co2_low',
        'vpd_out_of_range',
      ]);
    
    if (policyError) {
      result.errors.push(`Policy fetch error: ${policyError.message}`);
      return result;
    }
    
    if (!policies || policies.length === 0) {
      // No policies configured, skip evaluation
      return result;
    }
    
    // Get pod name and organization ID for better alarm messages and flood detection
    const { data: podData } = await supabase
      .from('pods')
      .select('name, room:rooms!inner(site:sites!inner(organization_id))')
      .eq('id', reading.pod_id)
      .single();

    const podName = podData?.name;
    const room = Array.isArray(podData?.room) ? podData.room[0] : podData?.room;
    const site = room && 'site' in room ? (Array.isArray(room.site) ? room.site[0] : room.site) : null;
    const organizationId = site && 'organization_id' in site ? site.organization_id : null;

    // Check for alarm flood condition BEFORE creating new alarms
    let floodDetected = false;
    if (organizationId) {
      floodDetected = await detectAlarmFlood(organizationId);
    }

    // If flood detected, skip creating new alarms (except flood alarm itself)
    if (floodDetected) {
      console.log('⚠️  Flood detected - suppressing new alarm creation');
      return result;
    }

    // Check threshold violations
    const violations = checkThresholdViolations(reading, policies);

    // Process each violation
    for (const violation of violations) {
      if (!violation.violated) continue;
      
      // Check time-in-state debouncing
      const timeInState = violation.policy.time_in_state_seconds || 300; // Default 5 minutes
      const persisted = await hasPersistedLongEnough(
        reading.pod_id,
        violation.policy.alarm_type,
        timeInState
      );
      
      if (!persisted) {
        // Violation hasn't persisted long enough
        continue;
      }
      
      // Check suppression period
      const suppressionMinutes = violation.policy.suppression_duration_minutes || 0;
      const suppressed = await isInSuppressionPeriod(
        reading.pod_id,
        violation.policy.alarm_type,
        suppressionMinutes
      );
      
      if (suppressed) {
        // Still in suppression period from previous alarm
        continue;
      }
      
      // Check if an active alarm already exists for this type
      const { data: existingAlarms } = await supabase
        .from('alarms')
        .select('id')
        .eq('pod_id', reading.pod_id)
        .eq('alarm_type', violation.policy.alarm_type)
        .is('resolved_at', null)
        .limit(1);
      
      if (existingAlarms && existingAlarms.length > 0) {
        // Alarm already active, don't create duplicate
        continue;
      }
      
      // Create new alarm
      const createResult = await createAlarm(violation, reading, podName);
      if (createResult.success) {
        result.alarmsCreated++;
      } else {
        result.errors.push(createResult.error || 'Unknown error creating alarm');
      }
    }
    
    // Check for auto-resolution opportunities
    result.alarmsResolved = await checkAutoResolution(reading.pod_id, reading, policies);
    
    return result;
  } catch (error) {
    console.error('Error in evaluateTelemetryReading:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

// =====================================================
// ALARM FLOOD DETECTION
// =====================================================

/**
 * Detect alarm flood condition (ISA-18.2 best practice)
 * Flood = >10 alarms triggered within 1 minute
 *
 * @param organizationId - Organization to check for floods
 * @returns true if flood detected, false otherwise
 */
async function detectAlarmFlood(organizationId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

    // Get pods for this organization
    const { data: sites } = await supabase
      .from('sites')
      .select('id')
      .eq('organization_id', organizationId);
    
    if (!sites || sites.length === 0) return false;
    const siteIds = sites.map(s => s.id);
    
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id')
      .in('site_id', siteIds);
    
    if (!rooms || rooms.length === 0) return false;
    const roomIds = rooms.map(r => r.id);
    
    const { data: pods } = await supabase
      .from('pods')
      .select('id')
      .in('room_id', roomIds);
    
    if (!pods || pods.length === 0) return false;
    const podIds = pods.map(p => p.id);

    // Count alarms created in the last minute for this organization
    const { count, error } = await supabase
      .from('alarms')
      .select('*', { count: 'exact', head: true })
      .gte('triggered_at', oneMinuteAgo)
      .in('pod_id', podIds);

    if (error) {
      console.error('Error detecting alarm flood:', error);
      return false;
    }

    // ISA-18.2 standard: >10 alarms per minute indicates flood
    if (count && count > 10) {
      console.warn(`🚨 ALARM FLOOD DETECTED: ${count} alarms in last minute for org ${organizationId}`);

      // Check if flood alarm already exists and is still active
      const { data: existingFloodAlarm } = await supabase
        .from('alarms')
        .select('id')
        .eq('alarm_type', 'alarm_flood')
        .is('resolved_at', null)
        .gte('triggered_at', oneMinuteAgo)
        .limit(1);

      // Create flood alarm if one doesn't exist
      if (!existingFloodAlarm || existingFloodAlarm.length === 0) {
        // Use first pod from the pods we already queried
        if (podIds.length > 0) {
          const anyPodId = podIds[0];
          await supabase.from('alarms').insert({
            pod_id: anyPodId,
            alarm_type: 'alarm_flood',
            severity: 'critical',
            message: `Alarm flood detected: ${count} alarms triggered in 1 minute. System may be overwhelmed.`,
            actual_value: count,
            threshold_value: 10,
          });

          console.log(`✅ Flood alarm created for organization ${organizationId}`);
        }
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error in detectAlarmFlood:', error);
    return false;
  }
}

/**
 * Evaluate all pods with recent telemetry readings
 * Used by cron job to batch-evaluate alarms
 *
 * @param lookbackMinutes - How far back to look for readings (default: 5)
 * @returns Summary of evaluation results
 */
export async function evaluateAllPods(
  lookbackMinutes: number = 5
): Promise<{
  podsEvaluated: number;
  alarmsCreated: number;
  alarmsResolved: number;
  errors: string[];
}> {
  try {
    const supabase = await createClient();
    const cutoffTime = new Date(Date.now() - lookbackMinutes * 60 * 1000).toISOString();
    
    // Get latest reading for each pod within the lookback window
    const { data: recentReadings, error } = await supabase
      .from('telemetry_readings')
      .select('*')
      .gte('timestamp', cutoffTime)
      .order('timestamp', { ascending: false });
    
    if (error || !recentReadings || recentReadings.length === 0) {
      return { podsEvaluated: 0, alarmsCreated: 0, alarmsResolved: 0, errors: [] };
    }
    
    // Get the most recent reading per pod
    const latestReadingsByPod = new Map<string, TelemetryReading>();
    for (const reading of recentReadings) {
      if (!latestReadingsByPod.has(reading.pod_id)) {
        latestReadingsByPod.set(reading.pod_id, reading);
      }
    }
    
    // Evaluate each pod's latest reading
    let totalCreated = 0;
    let totalResolved = 0;
    const allErrors: string[] = [];
    
    for (const [, reading] of latestReadingsByPod) {
      const result = await evaluateTelemetryReading(reading);
      totalCreated += result.alarmsCreated;
      totalResolved += result.alarmsResolved;
      allErrors.push(...result.errors);
    }
    
    return {
      podsEvaluated: latestReadingsByPod.size,
      alarmsCreated: totalCreated,
      alarmsResolved: totalResolved,
      errors: allErrors,
    };
  } catch (error) {
    console.error('Error in evaluateAllPods:', error);
    return {
      podsEvaluated: 0,
      alarmsCreated: 0,
      alarmsResolved: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
