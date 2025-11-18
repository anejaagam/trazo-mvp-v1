/**
 * Telemetry & Monitoring Types
 * 
 * Comprehensive type definitions for real-time environmental monitoring,
 * alarm management, and TagoIO integration.
 * 
 * Aligned with database schema in lib/supabase/schema.sql
 * 
 * Note: Equipment states are transitioning from boolean to EquipmentControl.
 * Both formats are supported for backward compatibility.
 */

import type { 
  EquipmentControl, 
  EquipmentControlMap,
} from './equipment';

import {
  EquipmentState,
  ControlMode,
  booleanToEquipmentControl,
  equipmentControlToBoolean,
} from './equipment';

// =====================================================
// CORE TELEMETRY TYPES
// =====================================================

/**
 * Telemetry reading from database (complete record)
 * 
 * Note: Equipment boolean columns match database schema exactly.
 * Additional equipment (irrigation, fogger, HEPA, UV) stored in equipment_states JSONB.
 */
export interface TelemetryReading {
  id: string;
  pod_id: string;
  timestamp: string; // ISO8601 timestamp
  
  // Environmental readings
  temperature_c: number | null;
  humidity_pct: number | null;
  co2_ppm: number | null;
  vpd_kpa: number | null;
  light_intensity_pct: number | null;
  
  // Equipment states (8 boolean columns that exist in DB schema)
  cooling_active: boolean | null;
  heating_active: boolean | null;
  dehumidifier_active: boolean | null;
  humidifier_active: boolean | null;
  co2_injection_active: boolean | null;
  exhaust_fan_active: boolean | null;
  circulation_fan_active: boolean | null;
  lights_on: boolean | null; // TagoIO light_state on/off status
  
  // Extended equipment states (JSONB field for additional equipment)
  equipment_states?: Record<string, unknown> | null;
  
  communication_fault: boolean | null; // General communication fault indicator
  
  // Sensor health indicators
  temp_sensor_fault: boolean | null;
  humidity_sensor_fault: boolean | null;
  co2_sensor_fault: boolean | null;
  pressure_sensor_fault: boolean | null;
  
  // Recipe tracking
  active_recipe_id: string | null;
  
  // Data provenance
  raw_data: Record<string, unknown> | null; // JSONB - stores original TagoIO response
  data_source: 'tagoio' | 'manual' | 'calculated' | 'simulated';
  
  // Metadata
  created_at?: string;
}

/**
 * Telemetry reading with pod information (for UI display)
 */
export interface TelemetryReadingWithPod extends TelemetryReading {
  pod: {
    id: string;
    name: string;
    room_id: string;
    tagoio_device_id: string | null;
  };
  room?: {
    id: string;
    name: string;
    site_id: string;
  };
}

/**
 * Insert type for new telemetry readings
 * 
 * Note: irrigation_active, lighting_active, fogger_active, hepa_filter_active, 
 * and uv_sterilization_active columns do NOT exist in telemetry_readings table.
 * These equipment states are stored in the equipment_states JSONB field instead.
 */
export interface InsertTelemetryReading {
  pod_id: string;
  timestamp?: string;
  temperature_c?: number | null;
  humidity_pct?: number | null;
  co2_ppm?: number | null;
  vpd_kpa?: number | null;
  light_intensity_pct?: number | null;
  // Equipment boolean columns (only columns that exist in DB schema)
  lights_on?: boolean | null; // TagoIO light_state on/off status
  cooling_active?: boolean | null;
  heating_active?: boolean | null;
  dehumidifier_active?: boolean | null;
  humidifier_active?: boolean | null;
  co2_injection_active?: boolean | null;
  exhaust_fan_active?: boolean | null;
  circulation_fan_active?: boolean | null;
  // Sensor faults
  temp_sensor_fault?: boolean | null;
  humidity_sensor_fault?: boolean | null;
  co2_sensor_fault?: boolean | null;
  pressure_sensor_fault?: boolean | null;
  // Recipe tracking
  active_recipe_id?: string | null;
  raw_data?: Record<string, unknown> | null;
  data_source: 'tagoio' | 'manual' | 'calculated' | 'simulated';
  equipment_states?: Record<string, unknown> | null; // JSONB - Enhanced equipment controls with AUTO mode support
}

/**
 * Update type for telemetry readings (limited - readings are mostly immutable)
 */
export interface UpdateTelemetryReading {
  active_recipe_id?: string | null;
  data_source?: 'tagoio' | 'manual' | 'calculated' | 'simulated';
}

// =====================================================
// ENHANCED TELEMETRY WITH EQUIPMENT CONTROLS (NEW)
// =====================================================

/**
 * Enhanced telemetry reading with full equipment control metadata
 * 
 * This extends the basic TelemetryReading with AUTO mode support.
 * Equipment states include mode, override, schedule, and power level.
 * 
 * @see EquipmentControl for detailed equipment state structure
 */
export interface EnhancedTelemetryReading extends Omit<TelemetryReading, 
  'cooling_active' | 'heating_active' | 'dehumidifier_active' | 
  'humidifier_active' | 'co2_injection_active' | 'exhaust_fan_active' | 
  'circulation_fan_active' | 'irrigation_active' | 'lighting_active' | 
  'fogger_active' | 'hepa_filter_active' | 'uv_sterilization_active' | 'lights_on'
> {
  // Equipment controls with full metadata (replaces boolean fields)
  equipment_controls: EquipmentControlMap;
  
  // Keep raw_data for backward compatibility with boolean equipment states
  // raw_data will contain both old boolean format and new control format
}

/**
 * Insert type for enhanced telemetry readings with equipment controls
 */
export interface InsertEnhancedTelemetryReading extends Omit<InsertTelemetryReading,
  'cooling_active' | 'heating_active' | 'dehumidifier_active' | 
  'humidifier_active' | 'co2_injection_active' | 'exhaust_fan_active' | 
  'circulation_fan_active' | 'irrigation_active' | 'lighting_active' | 
  'fogger_active' | 'hepa_filter_active' | 'uv_sterilization_active' | 'lights_on'
> {
  // Equipment controls with full metadata
  equipment_controls?: EquipmentControlMap;
}

// =====================================================
// DEVICE STATUS
// =====================================================

export type DeviceType = 'gcu' | 'sensor' | 'actuator';
export type DeviceStatus = 'online' | 'offline' | 'error' | 'maintenance';

export interface DeviceStatusRecord {
  id: string;
  pod_id: string;
  device_type: DeviceType;
  device_name: string;
  status: DeviceStatus;
  last_communication: string | null;
  error_message: string | null;
  firmware_version: string | null;
  hardware_version: string | null;
  updated_at: string;
}

export interface InsertDeviceStatus {
  pod_id: string;
  device_type: DeviceType;
  device_name: string;
  status: DeviceStatus;
  last_communication?: string | null;
  error_message?: string | null;
  firmware_version?: string | null;
  hardware_version?: string | null;
}

export interface UpdateDeviceStatus {
  status?: DeviceStatus;
  last_communication?: string | null;
  error_message?: string | null;
  firmware_version?: string | null;
  hardware_version?: string | null;
}

// =====================================================
// POD SNAPSHOT (Real-time Status)
// =====================================================

export type PodHealthStatus = 'healthy' | 'warning' | 'critical' | 'offline' | 'stale';

/**
 * Current snapshot of a pod's status
 * Derived from latest telemetry reading + alarm counts
 */
export interface PodSnapshot {
  pod: {
    id: string;
    name: string;
    room_id: string;
    tagoio_device_id: string | null;
  };
  room: {
    id: string;
    name: string;
    site_id: string;
  };
  last_update: string | null; // ISO8601 timestamp of latest reading
  health_status: PodHealthStatus;
  
  // Current readings
  temperature_c: number | null;
  humidity_pct: number | null;
  co2_ppm: number | null;
  vpd_kpa: number | null;
  light_intensity_pct: number | null;
  
  // Equipment states
  equipment: {
    cooling: boolean;
    heating: boolean;
    dehumidifier: boolean;
    humidifier: boolean;
    co2_injection: boolean;
    exhaust_fan: boolean;
    circulation_fan: boolean;
    irrigation: boolean;
    lighting: boolean;
  };
  
  // Sensor health
  sensor_faults: {
    temperature: boolean;
    humidity: boolean;
    co2: boolean;
    pressure: boolean;
  };
  
  // Active recipe info (if available)
  active_recipe: {
    id: string;
    name: string;
    setpoints: {
      temp_day_c: number | null;
      humidity_day_pct: number | null;
      co2_day_ppm: number | null;
    };
  } | null;
  
  // Alarm summary
  alarm_count_24h: number;
  critical_alarm_count: number;
  warning_alarm_count: number;
  
  // Drift from setpoints (if recipe active)
  drift: {
    temperature: number | null; // degrees C
    humidity: number | null; // percentage points
    co2: number | null; // ppm
  } | null;
}

/**
 * Enhanced Pod Snapshot with full equipment control metadata
 * 
 * Replaces boolean equipment states with EquipmentControl for AUTO mode support.
 * Use this for new features that require equipment mode information.
 */
export interface EnhancedPodSnapshot extends Omit<PodSnapshot, 'equipment'> {
  // Equipment controls with full metadata (replaces simple boolean equipment object)
  equipment_controls: EquipmentControlMap;
}

/**
 * Extended Pod Snapshot with additional fields for backwards compatibility
 * Used by existing query stubs
 */
export interface PodSnapshotExtended extends Omit<PodSnapshot, 'pod'> {
  pod: {
    id: string;
    name: string;
    room_id: string;
    room_name: string; // Additional field for display
    status: string; // Pod operational status
    tagoio_device_id: string | null;
  };
  data_freshness: 'fresh' | 'stale' | 'offline';
  health: 'healthy' | 'warning' | 'critical' | 'offline';
  metrics?: {
    temperature: MetricStatistics | null;
    humidity: MetricStatistics | null;
    co2: MetricStatistics | null;
    vpd: MetricStatistics | null;
    light: MetricStatistics | null;
  };
}

// =====================================================
// ALARMS
// =====================================================

export type AlarmType =
  | 'temperature_high'
  | 'temperature_low'
  | 'humidity_high'
  | 'humidity_low'
  | 'co2_high'
  | 'co2_low'
  | 'vpd_out_of_range'
  | 'device_offline'
  | 'sensor_fault'
  | 'power_failure'
  | 'water_leak'
  | 'security_breach'
  | 'door_open'
  | 'task_overdue'
  | 'alarm_flood';

export type AlarmSeverity = 'critical' | 'warning' | 'info';

export interface Alarm {
  id: string;
  pod_id: string;
  policy_id: string | null;
  alarm_type: AlarmType;
  severity: AlarmSeverity;
  message: string;
  threshold_value: number | null;
  actual_value: number | null;
  duration_seconds: number | null;
  
  // Related entities
  batch_id: string | null;
  recipe_id: string | null;
  telemetry_reading_id: string | null;
  
  // Lifecycle timestamps
  triggered_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  escalated_at: string | null;
  escalated_to_level: number;
  
  // Actions
  auto_action_taken: string | null;
  override_applied: boolean;
  
  // Notes
  ack_note: string | null;
  resolution_note: string | null;
  root_cause: string | null;

  // Shelving (ISA-18.2 Section 10.4)
  shelved_at: string | null;
  shelved_by: string | null;
  shelved_reason: string | null;
  shelved_until: string | null;
  auto_unshelve: boolean;
}

/**
 * Alarm with pod and user information
 */
export interface AlarmWithDetails extends Alarm {
  pod: {
    id: string;
    name: string;
    room_id: string;
  };
  room: {
    id: string;
    name: string;
    site_id: string;
  };
  acknowledged_by_user?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  resolved_by_user?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface InsertAlarm {
  pod_id: string;
  policy_id?: string | null;
  alarm_type: AlarmType;
  severity: AlarmSeverity;
  message: string;
  threshold_value?: number | null;
  actual_value?: number | null;
  duration_seconds?: number | null;
  batch_id?: string | null;
  recipe_id?: string | null;
  telemetry_reading_id?: string | null;
  auto_action_taken?: string | null;
  override_applied?: boolean;
}

export interface UpdateAlarm {
  acknowledged_at?: string;
  acknowledged_by?: string;
  ack_note?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_note?: string;
  root_cause?: string;
  escalated_at?: string;
  escalated_to_level?: number;
}

// =====================================================
// ALARM POLICIES
// =====================================================

export type ThresholdOperator = '>' | '<' | '>=' | '<=' | '=' | '!=';

export interface AlarmPolicy {
  id: string;
  organization_id: string;
  name: string;
  alarm_type: AlarmType;
  severity: AlarmSeverity;
  threshold_value: number | null;
  threshold_operator: ThresholdOperator | null;
  time_in_state_seconds: number; // Default 300 (5 minutes)
  applies_to_stage: string[] | null; // Array of batch stages
  applies_to_pod_types: string[] | null; // Array of pod types
  suppression_duration_minutes: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;

  // ISA-18.2 Enhancements
  priority: number | null; // 1=Emergency, 2=Abnormal, 3=Advisory, 4=Info
  expected_response_seconds: number; // Expected time to acknowledge/respond
  deadband_value: number | null; // Hysteresis to prevent chattering
  rationalization_status: 'pending' | 'documented' | 'approved' | 'under_review';
  rationalized_by: string | null;
  rationalized_at: string | null;
  consequence_if_ignored: string | null; // What happens if ignored
  corrective_action: string | null; // What operator should do
}

export interface InsertAlarmPolicy {
  organization_id: string;
  name: string;
  alarm_type: AlarmType;
  severity: AlarmSeverity;
  threshold_value?: number | null;
  threshold_operator?: ThresholdOperator | null;
  time_in_state_seconds?: number;
  applies_to_stage?: string[] | null;
  applies_to_pod_types?: string[] | null;
  suppression_duration_minutes?: number;
  is_active?: boolean;
  created_by: string;

  // ISA-18.2 Enhancements
  priority?: number | null;
  expected_response_seconds?: number;
  deadband_value?: number | null;
  rationalization_status?: 'pending' | 'documented' | 'approved' | 'under_review';
  consequence_if_ignored?: string | null;
  corrective_action?: string | null;
}

export interface UpdateAlarmPolicy {
  name?: string;
  threshold_value?: number | null;
  threshold_operator?: ThresholdOperator | null;
  time_in_state_seconds?: number;
  applies_to_stage?: string[] | null;
  applies_to_pod_types?: string[] | null;
  suppression_duration_minutes?: number;
  is_active?: boolean;

  // ISA-18.2 Enhancements
  priority?: number | null;
  expected_response_seconds?: number;
  deadband_value?: number | null;
  rationalization_status?: 'pending' | 'documented' | 'approved' | 'under_review';
  rationalized_by?: string | null;
  rationalized_at?: string | null;
  consequence_if_ignored?: string | null;
  corrective_action?: string | null;
}

// =====================================================
// NOTIFICATIONS
// =====================================================

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type NotificationStatus = 'sent' | 'delivered' | 'failed' | 'read';
export type NotificationCategory = 'inventory' | 'batch' | 'task' | 'system';
export type NotificationUrgency = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  alarm_id: string | null;
  user_id: string | null;
  organization_id: string | null;
  channel: NotificationChannel;
  message: string;
  category: NotificationCategory;
  urgency: NotificationUrgency;
  link_url: string | null;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
  status: NotificationStatus;
}

export interface InsertNotification {
  alarm_id?: string | null;
  user_id?: string | null;
  organization_id?: string | null;
  channel: NotificationChannel;
  message: string;
  category: NotificationCategory;
  urgency?: NotificationUrgency;
  link_url?: string | null;
  status?: NotificationStatus;
}

export interface UpdateNotification {
  delivered_at?: string;
  read_at?: string;
  status?: NotificationStatus;
}

// =====================================================
// ALARM ROUTES
// =====================================================

export interface AlarmRoute {
  id: string;
  organization_id: string;
  policy_id: string | null;
  severity: AlarmSeverity;
  notify_role: string;
  channel: NotificationChannel;
  escalation_delay_minutes: number;
  escalation_level: number;
  is_active: boolean;
  created_at: string;
}

export interface InsertAlarmRoute {
  organization_id: string;
  policy_id?: string | null;
  severity: AlarmSeverity;
  notify_role: string;
  channel: NotificationChannel;
  escalation_delay_minutes?: number;
  escalation_level?: number;
  is_active?: boolean;
}

// =====================================================
// CHART & VISUALIZATION TYPES
// =====================================================

/**
 * Data point for time-series charts
 */
export interface ChartDataPoint {
  timestamp: string; // ISO8601
  temperature_c?: number | null;
  humidity_pct?: number | null;
  co2_ppm?: number | null;
  vpd_kpa?: number | null;
  light_intensity_pct?: number | null;
  
  // Setpoints (if recipe active)
  setpoint_temp?: number | null;
  setpoint_humidity?: number | null;
  setpoint_co2?: number | null;
  
  // Equipment states (for event markers)
  cooling_active?: boolean;
  heating_active?: boolean;
  irrigation_active?: boolean;
}

/**
 * Aggregated environmental statistics
 */
export interface EnvironmentalStats {
  pod_id: string;
  date_range: {
    start: string;
    end: string;
  };
  temperature: MetricStatistics;
  humidity: MetricStatistics;
  co2: MetricStatistics;
  vpd: {
    avg: number | null;
    min: number | null;
    max: number | null;
  };
  readings_count: number;
  sensor_faults_count: number;
  equipment_runtime: {
    cooling_minutes: number;
    heating_minutes: number;
    dehumidifier_minutes: number;
    humidifier_minutes: number;
  };
}

/**
 * Individual metric statistics
 */
export interface MetricStatistics {
  avg: number | null;
  min: number | null;
  max: number | null;
  std_dev?: number | null;
  count?: number;
}

/**
 * Time-series data for charts
 */
export interface TimeSeriesData {
  pod_id: string;
  pod_name: string;
  data_points: ChartDataPoint[];
  setpoints: {
    temp_day_c: number | null;
    temp_night_c: number | null;
    humidity_day_pct: number | null;
    humidity_night_pct: number | null;
    co2_day_ppm: number | null;
    co2_night_ppm: number | null;
  } | null;
  alarm_events: Array<{
    timestamp: string;
    alarm_type: AlarmType;
    severity: AlarmSeverity;
    message: string;
  }>;
}

// =====================================================
// TAGOIO INTEGRATION TYPES
// =====================================================

/**
 * TagoIO device information
 */
export interface TagoIODevice {
  id: string;
  name: string;
  active: boolean;
  visible: boolean;
  last_input?: string;
  last_output?: string;
  tags?: string[];
  created_at?: string;
}

/**
 * TagoIO variable structure
 */
export interface TagoIOVariable {
  variable: string;
  value: number | string | boolean;
  unit?: string;
  time?: string; // ISO8601
  metadata?: Record<string, unknown>;
}

/**
 * TagoIO reading response
 */
export interface TagoIOReading {
  device: string;
  time: string; // ISO8601
  variables: TagoIOVariable[];
}

/**
 * TagoIO API response wrapper
 */
export interface TagoIOResponse<T = unknown> {
  result: T;
  status: boolean;
  message?: string;
}

/**
 * Device mapping configuration (pod_id -> TagoIO device_id)
 */
export interface DeviceMapping {
  podId: string;
  deviceId: string;
  deviceName?: string;
  variableMappings?: {
    temperature: string; // TagoIO variable name
    humidity: string;
    co2: string;
    light: string;
    cooling: string;
    heating: string;
    dehumidifier: string;
    humidifier: string;
    co2_injection: string;
    exhaust_fan: string;
    circulation_fan: string;
    irrigation: string;
    lighting: string;
  };
}

// =====================================================
// QUERY FILTERS & PAGINATION
// =====================================================

export interface TelemetryDateRange {
  start: Date;
  end: Date;
}

// Legacy alias for compatibility
export type DateRange = TelemetryDateRange;

export type AggregationPeriod = '1min' | '5min' | '15min' | '1hour' | '1day';

export interface TelemetryFilters {
  pod_id?: string;
  pod_ids?: string[];
  room_id?: string;
  site_id?: string;
  date_range?: TelemetryDateRange;
  data_source?: 'tagoio' | 'manual' | 'calculated' | 'simulated';
  has_sensor_faults?: boolean;
  has_communication_faults?: boolean; // For backwards compatibility with existing query stubs
  limit?: number;
  offset?: number;
}

export interface AlarmFilters {
  pod_id?: string;
  pod_ids?: string[];
  room_id?: string;
  site_id?: string;
  organization_id?: string;
  severity?: AlarmSeverity | AlarmSeverity[];
  alarm_type?: AlarmType | AlarmType[];
  status?: 'active' | 'acknowledged' | 'resolved';
  triggered_after?: string;
  triggered_before?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationFilters {
  user_id?: string;
  organization_id?: string;
  alarm_id?: string;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  category?: NotificationCategory;
  urgency?: NotificationUrgency;
  unread_only?: boolean;
  limit?: number;
  offset?: number;
}

// =====================================================
// EXPORT TYPES
// =====================================================

export type ExportFormat = 'csv' | 'pdf' | 'json';

export interface ExportRequest {
  pod_ids: string[];
  date_range: TelemetryDateRange;
  format: ExportFormat;
  include_alarms?: boolean;
  include_equipment_states?: boolean;
  include_setpoints?: boolean;
  aggregation_period?: AggregationPeriod;
}

export interface ExportMetadata {
  id: string;
  generated_by: string;
  generated_at: string;
  pod_count: number;
  readings_count: number;
  date_range: TelemetryDateRange;
  format: ExportFormat;
  file_url: string;
  checksum: string;
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Helper type for database query results
 */
export type QueryResult<T> = {
  data: T | null;
  error: Error | null;
};

/**
 * Helper type for paginated results
 */
export interface PaginatedResult<T> {
  data: T[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/**
 * Real-time subscription callback
 */
export type RealtimeCallback<T> = (payload: T) => void;

/**
 * Cleanup function for subscriptions
 */
export type UnsubscribeFn = () => void;

/**
 * Configuration for real-time telemetry subscriptions
 * Used by client-side hooks to subscribe to database changes
 */
export interface RealtimeSubscriptionConfig {
  /** UUID of the pod to monitor */
  podId: string;
  /** Callback when new reading is inserted */
  onInsert?: (reading: TelemetryReading) => void;
  /** Callback when existing reading is updated */
  onUpdate?: (reading: TelemetryReading) => void;
  /** Callback when reading is deleted */
  onDelete?: (id: string) => void;
  /** Optional error handler */
  onError?: (error: Error) => void;
}

// =====================================================
// MIGRATION HELPERS (Backward Compatibility)
// =====================================================

/**
 * Convert legacy TelemetryReading to EnhancedTelemetryReading
 * 
 * Converts boolean equipment states to EquipmentControl objects.
 * Used during transition period to support both formats.
 * 
 * @param reading - Legacy telemetry reading with boolean equipment states
 * @returns Enhanced reading with equipment control metadata
 */
/**
 * Convert legacy TelemetryReading to EnhancedTelemetryReading
 * 
 * Converts boolean equipment states to EquipmentControl objects.
 * Used during transition period to support both formats.
 * 
 * Note: Additional equipment (irrigation, fogger, HEPA, UV) read from equipment_states JSONB
 * if available, otherwise defaults to OFF state.
 * 
 * @param reading - Legacy telemetry reading with boolean equipment states
 * @returns Enhanced reading with equipment control metadata
 */
export function convertToEnhancedReading(reading: TelemetryReading): EnhancedTelemetryReading {
  const { 
    cooling_active, heating_active, dehumidifier_active, humidifier_active,
    co2_injection_active, exhaust_fan_active, circulation_fan_active, lights_on,
    ...rest 
  } = reading;
  
  // Additional equipment states from JSONB (if available)
  const equipment_states = reading.equipment_states as Record<string, EquipmentControl> || {};
  
  return {
    ...rest,
    equipment_controls: {
      cooling: booleanToEquipmentControl(cooling_active),
      heating: booleanToEquipmentControl(heating_active),
      dehumidifier: booleanToEquipmentControl(dehumidifier_active),
      humidifier: booleanToEquipmentControl(humidifier_active),
      co2_injection: booleanToEquipmentControl(co2_injection_active),
      exhaust_fan: booleanToEquipmentControl(exhaust_fan_active),
      circulation_fan: booleanToEquipmentControl(circulation_fan_active),
      lighting: booleanToEquipmentControl(lights_on),
      // Equipment stored in JSONB field (fallback to OFF state if not present)
      irrigation: equipment_states.irrigation || { 
        state: EquipmentState.OFF, 
        mode: ControlMode.MANUAL, 
        override: false,
        schedule_enabled: false,
        level: 0,
        last_updated: new Date(reading.timestamp)
      },
      fogger: equipment_states.fogger || { 
        state: EquipmentState.OFF, 
        mode: ControlMode.MANUAL, 
        override: false,
        schedule_enabled: false,
        level: 0,
        last_updated: new Date(reading.timestamp)
      },
      hepa_filter: equipment_states.hepa_filter || { 
        state: EquipmentState.OFF, 
        mode: ControlMode.MANUAL, 
        override: false,
        schedule_enabled: false,
        level: 0,
        last_updated: new Date(reading.timestamp)
      },
      uv_sterilization: equipment_states.uv_sterilization || { 
        state: EquipmentState.OFF, 
        mode: ControlMode.MANUAL, 
        override: false,
        schedule_enabled: false,
        level: 0,
        last_updated: new Date(reading.timestamp)
      },
    }
  };
}

/**
 * Convert EnhancedPodSnapshot to legacy PodSnapshot
 * 
 * Converts EquipmentControl objects back to simple booleans.
 * Used when old components need legacy format.
 * 
 * @param enhanced - Enhanced pod snapshot with equipment controls
 * @returns Legacy pod snapshot with boolean equipment states
 */
export function convertToLegacySnapshot(enhanced: EnhancedPodSnapshot): PodSnapshot {
  const { equipment_controls, ...rest } = enhanced;
  
  return {
    ...rest,
    equipment: {
      cooling: equipmentControlToBoolean(equipment_controls.cooling),
      heating: equipmentControlToBoolean(equipment_controls.heating),
      dehumidifier: equipmentControlToBoolean(equipment_controls.dehumidifier),
      humidifier: equipmentControlToBoolean(equipment_controls.humidifier),
      co2_injection: equipmentControlToBoolean(equipment_controls.co2_injection),
      exhaust_fan: equipmentControlToBoolean(equipment_controls.exhaust_fan),
      circulation_fan: equipmentControlToBoolean(equipment_controls.circulation_fan),
      irrigation: equipmentControlToBoolean(equipment_controls.irrigation),
      lighting: equipmentControlToBoolean(equipment_controls.lighting),
    }
  };
}
