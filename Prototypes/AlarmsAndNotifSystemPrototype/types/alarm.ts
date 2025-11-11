export type AlarmCategory = 'environmental' | 'equipment' | 'irrigation' | 'system' | 'compliance' | 'security';
export type AlarmSeverity = 'critical' | 'warning' | 'info';
export type AlarmStatus = 'active' | 'acknowledged' | 'resolved' | 'snoozed';

export type ComplianceAlarmType = 
  | 'metrc_sync_error'
  | 'compliance_task_due'
  | 'harvest_deadline'
  | 'test_failure'
  | 'security_incident';

export interface Alarm {
  id: string;
  category: AlarmCategory;
  severity: AlarmSeverity;
  status: AlarmStatus;
  title: string;
  description: string;
  site: string;
  room?: string;
  device?: string;
  value?: number;
  threshold?: number;
  unit?: string;
  raisedAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  snoozedUntil?: Date;
  escalationLevel: number;
  notificationsSent: number;
  // Compliance-specific fields
  complianceType?: ComplianceAlarmType;
  metrcError?: {
    errorCode: string;
    errorMessage: string;
    tagNumber?: string;
    submissionId?: string;
  };
  taskDetails?: {
    taskType: string;
    dueDate: Date;
    assignedTo?: string;
  };
  harvestDetails?: {
    batchId: string;
    daysSinceHarvest: number;
    daysRemaining: number;
  };
  testFailureDetails?: {
    labName: string;
    testType: string;
    failureReason: string;
    batchId: string;
    sampleId: string;
  };
  securityDetails?: {
    incidentType: string;
    deviceId?: string;
    location: string;
  };
}

export interface AlarmThreshold {
  id: string;
  category: AlarmCategory;
  type: string;
  enabled: boolean;
  minValue?: number;
  maxValue?: number;
  unit: string;
  severity: AlarmSeverity;
  site?: string;
  room?: string;
  // Compliance-specific threshold settings
  complianceType?: ComplianceAlarmType;
  advanceNoticeDays?: number; // For compliance tasks
}

export interface EscalationPolicy {
  id: string;
  name: string;
  site: string;
  intervals: number[]; // minutes: [5, 10, 15, 30]
  recipients: {
    level: number;
    email: string;
    pushEnabled: boolean;
  }[];
}

export interface MaintenanceWindow {
  id: string;
  site: string;
  startTime: Date;
  endTime: Date;
  reason: string;
  suppressCritical: boolean;
  createdBy: string;
}
