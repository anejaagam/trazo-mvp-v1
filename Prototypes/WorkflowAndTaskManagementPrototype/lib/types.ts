export type EvidenceType = 'photo' | 'numeric' | 'checkbox' | 'signature' | 'qr_scan' | 'text' | 'dual_signature';

export type ScheduleMode = 'recurring' | 'stage_driven' | 'event_driven' | 'manual';

export type UserRole = 'operator' | 'supervisor' | 'qa_manager' | 'compliance_officer' | 'admin';

export type TemplateCategory = 
  | 'Daily Operations'
  | 'Calibration & Maintenance'
  | 'Alarm Response'
  | 'Batch Operations'
  | 'Quality Control'
  | 'Compliance'
  | 'Exception Scenarios';

export interface ConditionalLogic {
  stepId: string;
  condition: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number | boolean;
  nextStepId: string; // which step to jump to if condition is met
}

export interface DualSignature {
  role1: UserRole;
  role2: UserRole;
  description: string;
  requiredRoles: UserRole[];
}

export interface SOPStep {
  id: string;
  order: number;
  title: string;
  description: string;
  evidenceRequired: boolean;
  evidenceType?: EvidenceType;
  evidenceConfig?: {
    minValue?: number;
    maxValue?: number;
    unit?: string;
    options?: string[];
    requiredText?: string;
    dualSignature?: DualSignature;
  };
  conditionalLogic?: ConditionalLogic[];
  isConditional?: boolean;
  isHighRisk?: boolean; // Requires dual sign-off
  requiresApproval?: boolean; // Batch release gating
  approvalRoles?: UserRole[];
}

export interface SOPTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  steps: SOPStep[];
  estimatedDuration: number; // minutes
  slaHours?: number;
  version: string;
  versionHistory: TemplateVersion[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  status: 'draft' | 'active' | 'archived';
  allowedRoles: UserRole[];
  isExceptionScenario?: boolean;
  requiresDualSignoff?: boolean;
}

export interface TemplateVersion {
  version: string;
  date: Date;
  author: string;
  changes: string;
  status: 'draft' | 'active' | 'archived';
}

export interface TaskEvidence {
  stepId: string;
  type: EvidenceType;
  value: string | number | boolean;
  timestamp: Date;
  photoUrl?: string;
  signatureUrl?: string;
  dualSignatures?: {
    signature1: { userId: string; userName: string; role: UserRole; signature: string; timestamp: Date };
    signature2: { userId: string; userName: string; role: UserRole; signature: string; timestamp: Date };
  };
  location?: { lat: number; lng: number };
  approvedBy?: { userId: string; userName: string; role: UserRole; timestamp: Date };
}

export interface Task {
  id: string;
  templateId: string;
  templateName: string;
  assignedTo?: string;
  assignedRole?: UserRole;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'awaiting_approval' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduleMode: ScheduleMode;
  createdAt: Date;
  dueAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  approvedAt?: Date;
  currentStepIndex: number;
  evidence: TaskEvidence[];
  notes?: string;
  batchId?: string; // For batch release gating
  requiresApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  rejectionReason?: string;
}

export interface RoleChecklist {
  id: string;
  role: UserRole;
  frequency: 'daily' | 'weekly' | 'monthly';
  tasks: string[]; // Template IDs
  name: string;
  description: string;
}

export interface BatchRelease {
  id: string;
  batchId: string;
  productName: string;
  harvestDate: Date;
  testResults: {
    name: string;
    value: string;
    passed: boolean;
  }[];
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
  attachments?: string[];
}
