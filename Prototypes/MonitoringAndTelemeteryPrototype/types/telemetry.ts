// Core telemetry types for monitoring & compliance

export type PointHealth = 'Healthy' | 'Stale' | 'Faulted' | 'CalDue';

export type TelemetryPointType = 
  | 'Temp' 
  | 'RH' 
  | 'CO2' 
  | 'LightPct' 
  | 'Fan' 
  | 'Cool' 
  | 'Dehum' 
  | 'CO2Enable';

export type OverlayEventType = 
  | 'setpoint_change' 
  | 'stage_change' 
  | 'override_event' 
  | 'alarm_event' 
  | 'irrigation_cycle';

export type UserRole = 
  | 'Operator' 
  | 'HeadGrower' 
  | 'SiteManager' 
  | 'ComplianceQA' 
  | 'ExecutiveViewer';

export interface Site {
  id: string;
  name: string;
  timezone: string;
}

export interface Room {
  id: string;
  site_id: string;
  name: string;
  stage: string;
  tz: string;
}

export interface Pod {
  id: string;
  room_id: string;
  name: string;
}

export interface TelemetryPoint {
  id: string;
  room_id: string;
  pod_id: string;
  type: TelemetryPointType;
  unit: string;
  calibration_due_at?: Date;
  last_calibration?: Date;
}

export interface TelemetryReading {
  id: string;
  point_id: string;
  ts_utc: Date;
  value_num?: number;
  value_bool?: boolean;
  validity: PointHealth;
}

export interface OverlayEvent {
  id: string;
  type: OverlayEventType;
  ts_utc: Date;
  room_id: string;
  pod_id?: string;
  attrs: Record<string, any>;
}

export interface ExportEvent {
  id: string;
  actor_id: string;
  room_id: string;
  ts_utc: Date;
  range_start_utc: Date;
  range_end_utc: Date;
  file_uri: string;
  checksum: string;
}

export interface PodSnapshot {
  pod: Pod;
  room: Room;
  last_update: Date;
  temp: { value: number; health: PointHealth; unit: string };
  rh: { value: number; health: PointHealth; unit: string };
  co2: { value: number; health: PointHealth; unit: string };
  light: { value: number; health: PointHealth; unit: string };
  vpd: { value: number; health: PointHealth; unit: string };
  devices: {
    fan: boolean;
    cooling: boolean;
    dehum: boolean;
    co2_enable: boolean;
  };
  setpoints: {
    temp: number;
    rh: number;
    co2: number;
    light: number;
  };
  drift: {
    temp: number;
    rh: number;
    co2: number;
  };
  alarm_count_24h: number;
}

export interface ChartDataPoint {
  timestamp: Date;
  temp?: number;
  rh?: number;
  co2?: number;
  light?: number;
  vpd?: number;
  setpoint_temp?: number;
  setpoint_rh?: number;
  setpoint_co2?: number;
  setpoint_light?: number;
}

export type AlarmSeverity = 'critical' | 'warning' | 'info';
export type AlarmStatus = 'active' | 'acknowledged' | 'resolved';
export type AlarmCategory = 'environmental' | 'equipment' | 'calibration' | 'communication' | 'system';

export interface Alarm {
  id: string;
  pod_id: string;
  pod_name: string;
  room_id: string;
  room_name: string;
  severity: AlarmSeverity;
  status: AlarmStatus;
  category: AlarmCategory;
  title: string;
  message: string;
  parameter?: string;
  value?: number;
  setpoint?: number;
  threshold?: number;
  triggered_at: Date;
  acknowledged_at?: Date;
  acknowledged_by?: string;
  resolved_at?: Date;
  resolved_by?: string;
}

export interface Notification {
  id: string;
  type: 'alarm' | 'system' | 'export' | 'maintenance';
  severity: AlarmSeverity;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  alarm_id?: string;
  pod_id?: string;
  room_id?: string;
}

export interface AlarmRule {
  id: string;
  parameter: string;
  severity: AlarmSeverity;
  condition: 'above' | 'below' | 'outside_range';
  threshold: number;
  threshold_high?: number;
  duration_seconds: number;
  enabled: boolean;
}
