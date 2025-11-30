// ============================================================================
// TRAZO COMPLIANCE ENGINE - REPORTING & DOCUMENTATION SYSTEM
// ============================================================================

// ============================================================================
// JURISDICTION & CONFIGURATION
// ============================================================================

export type JurisdictionCode = 
  | 'OR'           // Oregon (Metrc/OLCC)
  | 'MD'           // Maryland (Metrc)
  | 'CAN-CANNABIS'; // Canada (CTLS/Health Canada)

export interface Jurisdiction {
  code: JurisdictionCode;
  name: string;
  state?: string;
  country: string;
  system: 'Metrc' | 'CTLS';
  reportingFrequency: 'Daily' | 'Monthly' | 'Real-time';
}

// ============================================================================
// COMPLIANCE REPORTS
// ============================================================================

export type ReportType = 
  | 'Metrc Monthly'
  | 'CTLS Monthly'
  | 'Seed-to-Sale Movement'
  | 'Waste Reporting'
  | 'Transaction Log'
  | 'Production Report'
  | 'Destruction Report'
  | 'Inventory Report'
  | 'Sales Report';

export type ReportStatus = 
  | 'draft'
  | 'pending-review'
  | 'approved'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'error';

export interface ComplianceReport {
  report_id: string;
  jurisdiction: JurisdictionCode;
  type: ReportType;
  reporting_period: string;      // e.g., "2024-10" or "2024-Q3"
  created_at: string;
  submitted_at?: string;
  status: ReportStatus;
  linked_evidence: string[];     // Array of evidence_ids
  export_url?: string;
  errors?: string[];
  reviewed_by?: string;
  notes?: string;
}

export interface MetrcReport extends ComplianceReport {
  metrc_upload_id?: string;
  reconciliation_status: 'pass' | 'fail' | 'pending';
  movement_count: number;
  waste_count: number;
  transaction_count: number;
  olcc_status?: 'compliant' | 'review-needed' | 'non-compliant';
}

export interface CTLSReport extends ComplianceReport {
  ctls_submission_id?: string;
  production_data: boolean;
  destruction_data: boolean;
  inventory_data: boolean;
  sales_data: boolean;
  gpp_compliant: boolean;
  qap_compliant: boolean;
  health_canada_confirmation?: string;
}

// ============================================================================
// EVIDENCE VAULT
// ============================================================================

export type DocumentType = 
  | 'Lab Result'
  | 'SOP'
  | 'Permit'
  | 'License'
  | 'Training Certificate'
  | 'Inspection Report'
  | 'COA'
  | 'Metrc Export'
  | 'CTLS Export'
  | 'Compliance Letter'
  | 'Other';

export type RetentionPolicy = 
  | '1-year'
  | '3-years'
  | '5-years'
  | '7-years'
  | 'permanent';

export interface EvidenceDocument {
  evidence_id: string;
  doc_type: DocumentType;
  title: string;
  description?: string;
  jurisdiction: JurisdictionCode;
  uploaded_at: string;
  uploaded_by: string;
  file_size: string;
  file_format: string;
  retention_policy: RetentionPolicy;
  retention_end: string;
  linked_reports: string[];      // Array of report_ids
  tags: string[];
  encrypted: boolean;
  access_log: AccessLogEntry[];
  status: 'active' | 'archived' | 'pending-deletion';
}

export interface AccessLogEntry {
  user_id: string;
  user_name: string;
  action: 'viewed' | 'downloaded' | 'uploaded' | 'modified' | 'deleted';
  timestamp: string;
  ip_address: string;
}

// ============================================================================
// AUDIT TRAIL
// ============================================================================

export type AuditAction = 
  | 'REPORT_CREATED'
  | 'REPORT_SUBMITTED'
  | 'REPORT_APPROVED'
  | 'REPORT_REJECTED'
  | 'EVIDENCE_UPLOADED'
  | 'EVIDENCE_ACCESSED'
  | 'EVIDENCE_DELETED'
  | 'EXPORT_GENERATED'
  | 'USER_LOGIN'
  | 'USER_PERMISSION_CHANGED'
  | 'RECONCILIATION_RUN'
  | 'METRC_SYNC'
  | 'CTLS_SYNC';

export interface AuditEntry {
  audit_id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: AuditAction;
  resource_type: 'report' | 'evidence' | 'user' | 'system';
  resource_id: string;
  jurisdiction: JurisdictionCode;
  ip_address: string;
  status: 'success' | 'failure';
  details?: string;
  old_value?: string;
  new_value?: string;
  hash: string;                  // Tamper-proofing
}

export interface AuditExportFilter {
  jurisdiction?: JurisdictionCode[];
  action?: AuditAction[];
  start_date?: string;
  end_date?: string;
  user_id?: string;
  resource_type?: string;
  keyword?: string;
}

// ============================================================================
// COMPLIANCE DASHBOARD
// ============================================================================

export interface ComplianceStatus {
  jurisdiction: JurisdictionCode;
  status: 'compliant' | 'warning' | 'critical';
  last_report_date: string;
  next_deadline: string;
  unreported_data: number;
  urgent_tasks: number;
  pending_approvals: number;
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  jurisdiction: JurisdictionCode;
  type: 'filing' | 'renewal' | 'system-task' | 'inspection';
  due_date: string;
  days_until_due: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  completed: boolean;
}

export interface ComplianceMetric {
  label: string;
  value: string | number;
  trend?: string;
  status: 'good' | 'warning' | 'critical';
  jurisdiction?: JurisdictionCode;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export type UserRole = 
  | 'admin'
  | 'compliance-manager'
  | 'data-entry'
  | 'viewer'
  | 'auditor';

export type Permission = 
  | 'view-reports'
  | 'create-reports'
  | 'approve-reports'
  | 'submit-reports'
  | 'view-evidence'
  | 'upload-evidence'
  | 'delete-evidence'
  | 'export-audit'
  | 'manage-users';

export interface User {
  user_id: string;
  email: string;
  name: string;
  role: UserRole;
  jurisdictions: JurisdictionCode[];
  permissions: Permission[];
  active: boolean;
  last_login?: string;
}

// ============================================================================
// METRC INTEGRATION
// ============================================================================

export interface MetrcSyncLog {
  sync_id: string;
  jurisdiction: JurisdictionCode;
  timestamp: string;
  sync_type: 'manual' | 'scheduled' | 'real-time';
  records_synced: number;
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
  user_id: string;
}

export interface MetrcReconciliation {
  reconciliation_id: string;
  jurisdiction: JurisdictionCode;
  date: string;
  movement_matches: number;
  movement_discrepancies: number;
  waste_matches: number;
  waste_discrepancies: number;
  transaction_matches: number;
  transaction_discrepancies: number;
  status: 'pass' | 'fail';
  issues: string[];
}

// ============================================================================
// CTLS INTEGRATION
// ============================================================================

export interface CTLSSubmission {
  submission_id: string;
  reporting_period: string;
  submitted_at: string;
  production_kg: number;
  destruction_kg: number;
  inventory_kg: number;
  sales_kg: number;
  health_canada_confirmation?: string;
  gpp_attestation: boolean;
  qap_attestation: boolean;
  status: 'submitted' | 'accepted' | 'rejected';
  feedback?: string;
}

// ============================================================================
// EXPORT FORMATS
// ============================================================================

export type ExportFormat = 'PDF' | 'CSV' | 'Excel' | 'JSON';

export interface ExportRequest {
  export_id: string;
  export_type: 'report' | 'audit' | 'evidence-list';
  format: ExportFormat;
  filters?: any;
  requested_by: string;
  requested_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  expires_at?: string;
}

// ============================================================================
// NOTIFICATIONS & REMINDERS
// ============================================================================

export interface Notification {
  notification_id: string;
  user_id: string;
  type: 'deadline' | 'approval-needed' | 'error' | 'sync-complete';
  title: string;
  message: string;
  jurisdiction?: JurisdictionCode;
  created_at: string;
  read: boolean;
  action_url?: string;
}
