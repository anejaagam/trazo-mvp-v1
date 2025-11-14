/**
 * Workflow & Task Management Types
 * 
 * Comprehensive type definitions for the workflow and task management system
 * including SOP templates, tasks, evidence capture, and visual test builder.
 * 
 * Key Features:
 * - 5-level task hierarchy (0-4)
 * - Draft/Published template states
 * - Visual test builder configuration
 * - Evidence compression
 * - Task prerequisites and dependencies
 */

import { Database } from './database.types';

// =====================================================
// ENUMS & CONSTANTS
// =====================================================

export type EvidenceType = 
  | 'photo' 
  | 'numeric' 
  | 'checkbox' 
  | 'signature' 
  | 'qr_scan' 
  | 'text' 
  | 'dual_signature';

export type ScheduleMode = 
  | 'recurring' 
  | 'stage_driven' 
  | 'event_driven' 
  | 'manual';

export type TemplateStatus = 
  | 'draft' 
  | 'published' 
  | 'archived';

export type TaskStatus = 
  | 'to_do'
  | 'in_progress' 
  | 'blocked' 
  | 'done' 
  | 'cancelled' 
  | 'approved'
  | 'awaiting_approval'
  | 'rejected';

export type TaskPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'critical';

export type DependencyType = 
  | 'blocking' 
  | 'suggested';

export type TemplateCategory = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'harvest'
  | 'maintenance'
  | 'calibration'
  | 'cleaning'
  | 'compliance'
  | 'emergency'
  | 'quality_control'
  | 'batch_operations'
  | 'alarm_response'
  | 'exception_scenarios';

export type CompressionType = 
  | 'gzip' 
  | 'brotli' 
  | 'image' 
  | 'none';

export type ConditionalOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'greater_than' 
  | 'less_than' 
  | 'contains';

// Maximum hierarchy depth (5 levels: 0-4)
export const MAX_TASK_HIERARCHY_LEVEL = 4;

// =====================================================
// VISUAL TEST BUILDER TYPES
// =====================================================

export interface DualSignature {
  role1: string;
  role2: string;
  description: string;
  requiredRoles: string[];
}

export interface EvidenceConfig {
  // For numeric evidence
  minValue?: number;
  maxValue?: number;
  unit?: string;
  
  // For checkbox/select evidence
  options?: string[];
  
  // For text evidence
  requiredText?: string;
  minLength?: number;
  maxLength?: number;
  
  // For dual signature
  dualSignature?: DualSignature;
  
  // Photo/image settings
  maxPhotos?: number;
  requireLocation?: boolean;
  
  // QR/barcode settings
  expectedFormat?: string;
}

export interface ConditionalLogic {
  stepId: string;
  condition: ConditionalOperator;
  value: string | number | boolean;
  nextStepId: string; // Step to jump to if condition is met
  description?: string;
}

export interface SOPStep {
  id: string;
  order: number;
  title: string;
  description: string;
  instructions?: string;
  
  // Evidence requirements
  evidenceRequired: boolean;
  evidenceType?: EvidenceType;
  evidenceConfig?: EvidenceConfig;
  
  // Conditional logic (visual branching)
  conditionalLogic?: ConditionalLogic[];
  isConditional?: boolean;
  
  // Risk and approval
  isHighRisk?: boolean;
  requiresApproval?: boolean;
  approvalRoles?: string[];
  
  // Safety
  safetyNotes?: string;
  estimatedDurationMinutes?: number;
}

// =====================================================
// TEMPLATE TYPES
// =====================================================

export interface TemplateVersion {
  version: string;
  publishedAt: string;
  publishedBy: string;
  status: TemplateStatus;
  changes?: string;
}

export interface SOPTemplate {
  id: string;
  organization_id: string;
  name: string;
  version: string;
  category: TemplateCategory;
  description?: string;
  steps: SOPStep[];
  
  // Metadata
  estimated_duration_minutes?: number;
  sla_hours?: number;
  required_role?: string[];
  requires_approval: boolean;
  approval_role?: string;
  requires_dual_signoff?: boolean;
  is_exception_scenario?: boolean;
  
  // Resources
  safety_notes?: string;
  equipment_required?: string[];
  materials_required?: Array<{
    item_id: string;
    quantity: number;
  }>;
  
  // Status and versioning
  status: TemplateStatus;
  published_at?: string;
  published_by?: string;
  version_history?: TemplateVersion[];
  parent_template_id?: string;
  is_latest_version: boolean;
  
  // Flags
  is_active: boolean;
  is_template: boolean;
  
  // Audit
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  description?: string;
  steps: SOPStep[];
  estimated_duration_minutes?: number;
  sla_hours?: number;
  required_role?: string[];
  requires_approval?: boolean;
  approval_role?: string;
  requires_dual_signoff?: boolean;
  is_exception_scenario?: boolean;
  safety_notes?: string;
  equipment_required?: string[];
  materials_required?: Array<{
    item_id: string;
    quantity: number;
  }>;
  created_by?: string;
  organization_id?: string;
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  id: string;
}

export interface PublishTemplateResult {
  success: boolean;
  published_template_id?: string;
  version?: string;
  error?: string;
}

// =====================================================
// TASK TYPES
// =====================================================

export interface TaskEvidence {
  stepId: string;
  type: EvidenceType;
  value: string | number | boolean;
  timestamp: string;
  
  // Media evidence
  photoUrl?: string;
  photoUrls?: string[];
  signatureUrl?: string;
  
  // Dual signatures
  dualSignatures?: {
    signature1: {
      userId: string;
      userName: string;
      role: string;
      signature: string;
      timestamp: string;
    };
    signature2: {
      userId: string;
      userName: string;
      role: string;
      signature: string;
      timestamp: string;
    };
  };
  
  // Location data
  location?: {
    lat: number;
    lng: number;
  };
  
  // Approval
  approvedBy?: {
    userId: string;
    userName: string;
    role: string;
    timestamp: string;
  };
  
  // Compression metadata
  compressed?: boolean;
  compressionType?: CompressionType;
  originalSize?: number;
  compressedSize?: number;
}

export interface Task {
  id: string;
  organization_id: string;
  site_id: string;
  
  // Template association
  sop_template_id?: string;
  template_name?: string;
  template_version?: string;
  
  // Basic info
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  
  // Hierarchy (5 levels: 0-4)
  parent_task_id?: string;
  hierarchy_level: number;
  sequence_order: number;
  is_prerequisite_of?: string[];
  prerequisite_completed: boolean;
  
  // Assignment
  assigned_to?: string;
  assigned_by?: string;
  assigned_at?: string;
  assigned_role?: string;
  
  // Scope
  related_to_type?: string;
  related_to_id?: string;
  
  // Scheduling
  due_date?: string;
  scheduled_start?: string;
  recurring_pattern?: string;
  recurring_config?: Record<string, any>;
  schedule_mode?: ScheduleMode;
  
  // Execution
  started_at?: string;
  completed_at?: string;
  completed_by?: string;
  completion_notes?: string;
  current_step_index: number;
  
  // Approval
  requires_approval?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  
  // Evidence
  evidence: TaskEvidence[];
  evidence_photos?: string[];
  evidence_documents?: string[];
  evidence_signatures?: Record<string, any>;
  evidence_compressed: boolean;
  evidence_metadata?: Record<string, any>;
  
  // Time tracking
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  
  // Batch association (for batch release gating)
  batch_id?: string;
  
  // Notes
  notes?: string;
  
  // Audit
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: DependencyType;
  created_at: string;
}

export interface TaskStep {
  id: string;
  task_id: string;
  step_number: number;
  description: string;
  instructions?: string;
  
  // Completion
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  
  // Evidence
  evidence_required: boolean;
  evidence_type?: EvidenceType;
  evidence_value?: string;
  expected_value?: string;
  tolerance_range?: string;
  
  // Compression
  evidence_compressed: boolean;
  evidence_compression_type?: CompressionType;
  original_evidence_size?: number;
  compressed_evidence_size?: number;
  
  // Notes
  notes?: string;
  skipped: boolean;
  skip_reason?: string;
}

export interface CreateTaskInput {
  site_id: string;
  sop_template_id?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  
  // Hierarchy
  parent_task_id?: string;
  sequence_order?: number;
  
  // Assignment
  assigned_to?: string;
  
  // Scope
  related_to_type?: string;
  related_to_id?: string;
  
  // Scheduling
  due_date?: string;
  scheduled_start?: string;
  recurring_pattern?: string;
  recurring_config?: Record<string, any>;
  
  // Batch
  batch_id?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
  status?: TaskStatus;
  current_step_index?: number;
  evidence?: TaskEvidence[];
  completion_notes?: string;
  actual_duration_minutes?: number;
}

// =====================================================
// TASK HIERARCHY TYPES
// =====================================================

export interface TaskHierarchyNode {
  task_id: string;
  parent_id?: string;
  title: string;
  status: TaskStatus;
  hierarchy_level: number;
  sequence_order: number;
  path: string[];
  children?: TaskHierarchyNode[];
}

export interface TaskHierarchyTree {
  root: TaskHierarchyNode;
  totalTasks: number;
  maxDepth: number;
  completedTasks: number;
  blockedTasks: number;
}

// =====================================================
// BATCH RELEASE TYPES
// =====================================================

export interface BatchRelease {
  id: string;
  batch_id: string;
  product_name: string;
  harvest_date: string;
  
  // Test results
  test_results: Array<{
    name: string;
    value: string;
    passed: boolean;
    unit?: string;
  }>;
  
  // Status
  status: 'pending' | 'approved' | 'rejected';
  
  // Submission
  submitted_by: string;
  submitted_at: string;
  
  // Review
  reviewed_by?: string;
  reviewed_at?: string;
  
  // Notes and attachments
  notes?: string;
  attachments?: string[];
}

// =====================================================
// ROLE CHECKLIST TYPES
// =====================================================

export interface RoleChecklist {
  id: string;
  role: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  tasks: string[]; // Template IDs
  name: string;
  description: string;
}

// =====================================================
// QUERY RESULT TYPES
// =====================================================

export interface TaskWithTemplate extends Task {
  template?: SOPTemplate;
  dependencies?: TaskDependency[];
  children?: Task[];
  parent?: Task;
}

export interface PrerequisiteCheck {
  task_id: string;
  all_completed: boolean;
  incomplete_prerequisites: Array<{
    id: string;
    title: string;
    status: TaskStatus;
  }>;
}

// =====================================================
// COMPRESSION TYPES
// =====================================================

export interface CompressionResult {
  success: boolean;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionType: CompressionType;
  data: string | Blob;
}

export interface DecompressionResult {
  success: boolean;
  data: string | Blob;
  originalSize: number;
}

// =====================================================
// FILTER & PAGINATION TYPES
// =====================================================

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigned_to?: string;
  site_id?: string;
  parent_task_id?: string | null; // null for root tasks only
  hierarchy_level?: number;
  due_before?: string;
  due_after?: string;
  search?: string;
}

export interface TemplateFilters {
  status?: TemplateStatus[];
  category?: TemplateCategory[];
  is_latest_version?: boolean;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =====================================================
// VALIDATION TYPES
// =====================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface TaskHierarchyValidation extends ValidationResult {
  maxDepthExceeded: boolean;
  currentDepth: number;
  maxDepth: number;
}
