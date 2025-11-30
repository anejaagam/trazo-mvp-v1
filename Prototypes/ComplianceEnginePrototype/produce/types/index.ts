// ============================================================================
// TRAZO COMPLIANCE ENGINE - PRODUCE SAFETY & FOOD COMPLIANCE
// ============================================================================

// ============================================================================
// REGION & CONFIGURATION
// ============================================================================

export type Region = 'US' | 'Canada';

export type ComplianceSystem = 
  | 'PrimusGFS'
  | 'CFIA'
  | 'FSMA'
  | 'USDA-GAP'
  | 'State-Ag';

export interface RegionConfig {
  region: Region;
  systems: ComplianceSystem[];
  reportingFrequency: 'Daily' | 'Weekly' | 'Monthly' | 'Annual';
}

// US States
export type USState = 
  | 'CA'  // California
  | 'FL'  // Florida
  | 'NY'  // New York
  | 'TX'  // Texas
  | 'AZ'  // Arizona
  | 'GA'  // Georgia
  | 'WA'  // Washington
  | 'OR'; // Oregon

export interface StateAgRegistration {
  state: USState;
  agency: string;  // e.g., "CDFA", "DOACS", "DAM"
  license_number: string;
  issue_date: string;
  expiration_date: string;
  next_inspection_date?: string;
  status: 'active' | 'pending-renewal' | 'expired';
  reporting_format?: string;
}

// ============================================================================
// COMMODITIES
// ============================================================================

export type CommodityType = 
  | 'Leafy Greens'
  | 'Tomatoes'
  | 'Cucumbers'
  | 'Peppers'
  | 'Berries'
  | 'Root Vegetables'
  | 'Stone Fruit'
  | 'Citrus'
  | 'Herbs'
  | 'Melons'
  | 'Mixed Vegetables';

// FSMA 204 Food Traceability List commodities
export type FSMA204Commodity = 
  | 'Leafy Greens'
  | 'Tomatoes'
  | 'Cucumbers'
  | 'Peppers'
  | 'Melons';

export interface Commodity {
  commodity_id: string;
  name: CommodityType;
  risk_level: 'high' | 'medium' | 'low';
  lot_prefix: string;
  traceability_requirements: string[];
  fsma_204_required?: boolean;
}

// ============================================================================
// FSMA PRODUCE SAFETY MONITORING
// ============================================================================

export type FSMALogType = 
  | 'Worker Hygiene'
  | 'Agricultural Water Testing'
  | 'Soil Amendment'
  | 'Equipment Cleaning'
  | 'Facility Sanitizing'
  | 'Corrective Action';

export interface FSMALog {
  log_id: string;
  date: string;
  lot_id?: string;
  event_type: FSMALogType;
  result: string;
  corrective_action?: string;
  responsible_employee: string;
  cfr_reference: string;  // e.g., "21 CFR 112.42"
  testing_results?: any;
  status: 'compliant' | 'corrective-action-needed' | 'non-compliant';
  evidence_ids: string[];
}

export interface FSMAProduceSafetyChecklist {
  section: string;
  cfr_part: string;  // e.g., "112.3", "112.4"
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'not-applicable' | 'pending';
  evidence_required: string[];
  evidence_uploaded: string[];
  last_reviewed?: string;
}

// ============================================================================
// FSMA 204 TRACEABILITY
// ============================================================================

export type CriticalTrackingEvent = 
  | 'Harvesting'
  | 'Cooling'
  | 'Packing'
  | 'Receiving'
  | 'Shipping'
  | 'Transformation';

export interface KeyDataElement {
  kde_type: string;
  value: string;
  required_by_fsma: boolean;
}

export interface FSMA204Record {
  record_id: string;
  lot_number: string;
  commodity: FSMA204Commodity;
  cte: CriticalTrackingEvent;
  date_time: string;
  location: string;
  key_data_elements: KeyDataElement[];
  traceability_lot_code: string;
  quantity: string;
  unit: 'kg' | 'lbs' | 'cases' | 'units';
  linked_records: string[];  // Links to upstream/downstream CTEs
  barcode_scan?: string;
  recall_ready: boolean;
}

// ============================================================================
// PRODUCE REPORTS
// ============================================================================

export type ReportType = 
  | 'PrimusGFS Audit Prep'
  | 'CFIA Monthly Report'
  | 'FSMA Produce Safety'
  | 'FSMA 204 Traceability'
  | 'USDA GAP Audit'
  | 'State Registration'
  | 'Traceability Records'
  | 'Incident Report'
  | 'Recall Report'
  | 'RFR Submission'
  | 'FSMS Documentation'
  | 'GAP Compliance'
  | 'GMP Compliance'
  | 'Corrective Action Log';

export type ReportStatus = 
  | 'draft'
  | 'pending-review'
  | 'approved'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'flagged';

export interface ProduceReport {
  report_id: string;
  region: Region;
  commodity: CommodityType;
  audit_type: 'PrimusGFS' | 'CFIA' | 'FSMA' | 'USDA-GAP' | 'State' | 'Internal';
  filed_at: string;
  status: ReportStatus;
  evidence_link: string[];
  export_url?: string;
  compliance_notes?: string;
  flagged_gaps?: string[];
  corrective_actions?: string[];
}

export interface PrimusGFSAudit extends ProduceReport {
  audit_version: 'v3.2';
  audit_categories: {
    gap: number;
    gmp: number;
    fsms: number;
  };
  readiness_percentage: number;
  scheduled_audit_date?: string;
  auditor_name?: string;
  certification_status?: 'certified' | 'pending' | 'expired' | 'none';
}

export interface CFIAReport extends ProduceReport {
  sfcr_license_number: string;
  reporting_period: string;
  movement_type: 'import' | 'export' | 'interprovincial' | 'domestic';
  traceability_records_count: number;
  incidents_count: number;
  recalls_count: number;
  eform_submission_id?: string;
  regulatory_confirmation?: string;
}

export interface FSMAReport extends ProduceReport {
  cfr_compliance: {
    'part_112': number;  // Percentage complete
  };
  water_testing_current: boolean;
  worker_training_current: boolean;
  soil_amendments_verified: boolean;
  last_fda_inspection?: string;
  fda_inspection_ready: boolean;
}

export interface USDAGAPAudit extends ProduceReport {
  audit_type: 'USDA-GAP' | 'USDA-HGAP';
  certification_number?: string;
  certification_expiry?: string;
  score?: number;
}

// ============================================================================
// AUDIT CATEGORIES (PrimusGFS/GAP)
// ============================================================================

export type AuditCategory = 'GAP' | 'GMP' | 'FSMS';

export interface AuditChecklist {
  category: AuditCategory;
  section: string;
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'not-applicable' | 'pending';
  evidence_required: string[];
  evidence_uploaded: string[];
  notes?: string;
  last_reviewed?: string;
}

export interface AuditGap {
  gap_id: string;
  category: AuditCategory | 'FSMA';
  description: string;
  severity: 'critical' | 'major' | 'minor';
  corrective_action?: string;
  target_completion_date?: string;
  status: 'open' | 'in-progress' | 'resolved';
  assigned_to?: string;
}

// ============================================================================
// PRODUCE EVIDENCE
// ============================================================================

export type ProduceDocumentType = 
  | 'Test Result'
  | 'SOP'
  | 'Staff Training Log'
  | 'Corrective Action'
  | 'Traceability Log'
  | 'Sampling Result'
  | 'Food Safety Plan'
  | 'HACCP Documentation'
  | 'Supplier Approval'
  | 'Audit Certificate'
  | 'Incident Report'
  | 'Recall Documentation'
  | 'Water Test'
  | 'Pest Control Log'
  | 'Sanitation Record'
  | 'License/Registration'
  | 'FSMA 204 Record'
  | 'RFR Submission'
  | 'Other';

export type RetentionPolicy = 
  | '2-years'   // FSMA minimum
  | '3-years'
  | '5-years'   // CFIA standard
  | '7-years'   // PrimusGFS/State audits
  | 'permanent';

export interface ProduceEvidence {
  evidence_id: string;
  doc_type: ProduceDocumentType;
  title: string;
  description?: string;
  region: Region;
  commodity?: CommodityType;
  lot_number?: string;
  uploaded_at: string;
  uploaded_by: string;
  owner_id: string;
  file_size: string;
  file_format: string;
  retention_policy: RetentionPolicy;
  retention_end: string;
  linked_reports: string[];
  tags: string[];
  encrypted: boolean;
  access_log: AccessLogEntry[];
  status: 'active' | 'archived' | 'pending-deletion';
  fda_accessible?: boolean;  // For unannounced inspections
}

export interface AccessLogEntry {
  user_id: string;
  user_name: string;
  department: string;
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
  | 'REPORT_FLAGGED'
  | 'EVIDENCE_UPLOADED'
  | 'EVIDENCE_ACCESSED'
  | 'EVIDENCE_DELETED'
  | 'EXPORT_GENERATED'
  | 'USER_LOGIN'
  | 'PERMISSION_CHANGED'
  | 'AUDIT_SCHEDULED'
  | 'GAP_IDENTIFIED'
  | 'CORRECTIVE_ACTION_INITIATED'
  | 'INCIDENT_LOGGED'
  | 'RECALL_INITIATED'
  | 'FSMA_LOG_CREATED'
  | 'FDA_INSPECTION_LOGGED'
  | 'STATE_LICENSE_RENEWED'
  | 'RFR_SUBMITTED';

export interface AuditEntry {
  audit_id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: AuditAction;
  resource_type: 'report' | 'evidence' | 'user' | 'audit' | 'incident' | 'fsma-log' | 'recall';
  resource_id: string;
  region: Region;
  commodity?: CommodityType;
  ip_address: string;
  status: 'success' | 'failure';
  details?: string;
  old_value?: string;
  new_value?: string;
  hash: string;
}

export interface AuditExportFilter {
  region?: Region[];
  audit_type?: string[];
  commodity?: CommodityType[];
  incident_type?: string[];
  corrective_action_type?: string[];
  start_date?: string;
  end_date?: string;
  user_id?: string;
  keyword?: string;
}

// ============================================================================
// COMPLIANCE DASHBOARD
// ============================================================================

export interface ComplianceStatus {
  region: Region;
  area: 'PrimusGFS' | 'CFIA' | 'FSMA' | 'USDA-GAP' | 'State-Ag' | 'Traceability' | 'Food Safety';
  status: 'compliant' | 'warning' | 'critical';
  readiness_percentage: number;
  outstanding_corrective_actions: number;
  last_audit_date?: string;
  next_audit_date?: string;
  flagged_gaps: number;
}

export interface RiskAssessment {
  segment: 'commodity' | 'facility' | 'supply-chain';
  name: string;
  risk_level: 'high' | 'medium' | 'low';
  issues: string[];
  mitigation_status: 'complete' | 'in-progress' | 'pending';
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  region: Region;
  type: 'audit-window' | 'report-filing' | 'staff-recertification' | 'corrective-action' | 'permit-renewal' | 'state-inspection';
  due_date: string;
  days_until_due: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  completed: boolean;
  assigned_to?: string;
}

export interface ComplianceMetric {
  label: string;
  value: string | number;
  trend?: string;
  status: 'good' | 'warning' | 'critical';
  region?: Region;
  commodity?: CommodityType;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export type UserRole = 
  | 'admin'
  | 'qa-manager'
  | 'fsms-coordinator'
  | 'production-manager'
  | 'operator'
  | 'auditor'
  | 'viewer';

export type Department = 
  | 'Quality Assurance'
  | 'Food Safety'
  | 'Production'
  | 'Compliance'
  | 'Management';

export type Permission = 
  | 'view-reports'
  | 'create-reports'
  | 'approve-reports'
  | 'submit-reports'
  | 'view-evidence'
  | 'upload-evidence'
  | 'delete-evidence'
  | 'export-audit'
  | 'manage-users'
  | 'manage-corrective-actions'
  | 'schedule-audits'
  | 'fda-inspector-access';

export interface User {
  user_id: string;
  email: string;
  name: string;
  role: UserRole;
  department: Department;
  region: Region;
  permissions: Permission[];
  active: boolean;
  last_login?: string;
  certifications?: string[];
  certification_expiry?: string;
}

// ============================================================================
// TRACEABILITY
// ============================================================================

export interface TraceabilityRecord {
  record_id: string;
  lot_number: string;
  commodity: CommodityType;
  harvest_date: string;
  field_location: string;
  quantity: string;
  unit: 'kg' | 'lbs' | 'cases' | 'units';
  supplier?: string;
  distributor?: string;
  customer?: string;
  status: 'in-stock' | 'shipped' | 'sold' | 'destroyed';
  movement_history: MovementEntry[];
  fsma_204_compliant?: boolean;
}

export interface MovementEntry {
  timestamp: string;
  from_location: string;
  to_location: string;
  quantity: string;
  user: string;
  notes?: string;
}

// ============================================================================
// INCIDENTS & RECALLS
// ============================================================================

export type IncidentType = 
  | 'Food Safety'
  | 'Quality Issue'
  | 'Customer Complaint'
  | 'Supplier Non-Conformance'
  | 'Contamination'
  | 'Equipment Failure'
  | 'Other';

export interface Incident {
  incident_id: string;
  incident_type: IncidentType;
  region: Region;
  commodity?: CommodityType;
  lot_numbers: string[];
  reported_date: string;
  reported_by: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  root_cause?: string;
  corrective_action: string;
  preventive_action?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  regulatory_notified: boolean;  // FDA/CFIA
  rfr_submitted?: boolean;  // US only: Reportable Food Registry
  evidence_ids: string[];
}

export interface Recall {
  recall_id: string;
  region: Region;
  commodity: CommodityType;
  lot_numbers: string[];
  initiated_date: string;
  reason: string;
  scope: 'internal' | 'market' | 'public';
  affected_customers: number;
  quantity_affected: string;
  quantity_recovered: string;
  regulatory_notification_date?: string;  // FDA/CFIA
  rfr_submission_id?: string;  // US only
  status: 'active' | 'monitoring' | 'completed';
  effectiveness_check: boolean;
  consumer_notices_sent: number;
}

// ============================================================================
// REPORTABLE FOOD REGISTRY (US)
// ============================================================================

export interface RFRSubmission {
  rfr_id: string;
  incident_id: string;
  submission_date: string;
  reportable_food: string;
  commodity: CommodityType;
  lot_numbers: string[];
  reason_for_report: string;
  health_hazard_evaluation: string;
  distribution_pattern: string;
  firm_name: string;
  contact_info: string;
  status: 'submitted' | 'under-review' | 'accepted' | 'additional-info-needed';
  fda_confirmation_number?: string;
}

// ============================================================================
// EXPORT FORMATS
// ============================================================================

export type ExportFormat = 'PDF' | 'CSV' | 'Excel' | 'ZIP';

export interface ExportRequest {
  export_id: string;
  export_type: 'audit-packet' | 'compliance-report' | 'evidence-bundle' | 'audit-trail' | 'fsma-204-records';
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
  type: 'deadline' | 'audit-scheduled' | 'gap-flagged' | 'corrective-action-due' | 'certification-expiring' | 'fda-inspection' | 'state-renewal';
  title: string;
  message: string;
  region: Region;
  commodity?: CommodityType;
  created_at: string;
  read: boolean;
  action_url?: string;
}

// ============================================================================
// CORRECTIVE ACTIONS
// ============================================================================

export interface CorrectiveAction {
  action_id: string;
  incident_id?: string;
  gap_id?: string;
  region: Region;
  description: string;
  root_cause: string;
  action_taken: string;
  preventive_measures?: string;
  assigned_to: string;
  target_date: string;
  completion_date?: string;
  status: 'open' | 'in-progress' | 'completed' | 'verified';
  effectiveness_verified: boolean;
  evidence_ids: string[];
  regulatory_requirement?: string;  // e.g., "21 CFR 112.12"
}
