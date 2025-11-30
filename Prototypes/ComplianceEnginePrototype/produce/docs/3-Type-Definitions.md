# Type Definitions Reference

Complete TypeScript type system reference for the Trazo Compliance Engine.

**Source File**: `/types/index.ts`

---

## Table of Contents

1. [Core Types](#core-types)
2. [Compliance & Reports](#compliance--reports)
3. [Evidence & Documents](#evidence--documents)
4. [Audit & Traceability](#audit--traceability)
5. [Users & Permissions](#users--permissions)
6. [Incidents & Recalls](#incidents--recalls)
7. [Dashboard & UI](#dashboard--ui)

---

## Core Types

### Region

```typescript
export type Region = 'US' | 'Canada';
```

Primary system region selector determining compliance frameworks.

### ComplianceSystem

```typescript
export type ComplianceSystem = 
  | 'PrimusGFS'    // Both regions
  | 'CFIA'         // Canada only
  | 'FSMA'         // US only
  | 'USDA-GAP'     // US only
  | 'State-Ag';    // US only
```

### RegionConfig

```typescript
interface RegionConfig {
  region: Region;
  systems: ComplianceSystem[];
  reportingFrequency: 'Daily' | 'Weekly' | 'Monthly' | 'Annual';
}
```

### USState

```typescript
export type USState = 
  | 'CA'  // California - CDFA
  | 'FL'  // Florida - DOACS
  | 'NY'  // New York - DAM
  | 'TX'  // Texas
  | 'AZ'  // Arizona
  | 'GA'  // Georgia
  | 'WA'  // Washington
  | 'OR'; // Oregon
```

### StateAgRegistration

```typescript
interface StateAgRegistration {
  state: USState;
  agency: string;              // "CDFA", "DOACS", "DAM"
  license_number: string;
  issue_date: string;
  expiration_date: string;
  next_inspection_date?: string;
  status: 'active' | 'pending-renewal' | 'expired';
  reporting_format?: string;
}
```

### CommodityType

```typescript
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
```

### FSMA204Commodity

```typescript
export type FSMA204Commodity = 
  | 'Leafy Greens'
  | 'Tomatoes'
  | 'Cucumbers'
  | 'Peppers'
  | 'Melons';
```

**Note**: Subset of CommodityType requiring enhanced FSMA 204 traceability.

### Commodity

```typescript
interface Commodity {
  commodity_id: string;
  name: CommodityType;
  risk_level: 'high' | 'medium' | 'low';
  lot_prefix: string;
  traceability_requirements: string[];
  fsma_204_required?: boolean;
}
```

---

## Compliance & Reports

### ReportType

```typescript
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
```

### ReportStatus

```typescript
export type ReportStatus = 
  | 'draft'
  | 'pending-review'
  | 'approved'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'flagged';
```

### ProduceReport (Base Interface)

```typescript
interface ProduceReport {
  report_id: string;
  region: Region;
  commodity: CommodityType;
  audit_type: 'PrimusGFS' | 'CFIA' | 'FSMA' | 'USDA-GAP' | 'State' | 'Internal';
  filed_at: string;
  status: ReportStatus;
  evidence_link: string[];        // Array of evidence_ids
  export_url?: string;
  compliance_notes?: string;
  flagged_gaps?: string[];
  corrective_actions?: string[];
}
```

### PrimusGFSAudit

```typescript
interface PrimusGFSAudit extends ProduceReport {
  audit_version: 'v3.2';
  audit_categories: {
    gap: number;   // 0-100
    gmp: number;
    fsms: number;
  };
  readiness_percentage: number;
  scheduled_audit_date?: string;
  auditor_name?: string;
  certification_status?: 'certified' | 'pending' | 'expired' | 'none';
}
```

### CFIAReport

```typescript
interface CFIAReport extends ProduceReport {
  sfcr_license_number: string;
  reporting_period: string;       // "YYYY-MM"
  movement_type: 'import' | 'export' | 'interprovincial' | 'domestic';
  traceability_records_count: number;
  incidents_count: number;
  recalls_count: number;
  eform_submission_id?: string;
  regulatory_confirmation?: string;
}
```

### FSMAReport

```typescript
interface FSMAReport extends ProduceReport {
  cfr_compliance: {
    'part_112': number;  // Percentage
  };
  water_testing_current: boolean;
  worker_training_current: boolean;
  soil_amendments_verified: boolean;
  last_fda_inspection?: string;
  fda_inspection_ready: boolean;
}
```

### USDAGAPAudit

```typescript
interface USDAGAPAudit extends ProduceReport {
  audit_type: 'USDA-GAP' | 'USDA-HGAP';
  certification_number?: string;
  certification_expiry?: string;
  score?: number;
}
```

### AuditCategory

```typescript
export type AuditCategory = 'GAP' | 'GMP' | 'FSMS';
```

- **GAP**: Good Agricultural Practices
- **GMP**: Good Manufacturing Practices
- **FSMS**: Food Safety Management System

### AuditChecklist

```typescript
interface AuditChecklist {
  category: AuditCategory;
  section: string;
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'not-applicable' | 'pending';
  evidence_required: string[];
  evidence_uploaded: string[];
  notes?: string;
  last_reviewed?: string;
}
```

### AuditGap

```typescript
interface AuditGap {
  gap_id: string;
  category: AuditCategory | 'FSMA';
  description: string;
  severity: 'critical' | 'major' | 'minor';
  corrective_action?: string;
  target_completion_date?: string;
  status: 'open' | 'in-progress' | 'resolved';
  assigned_to?: string;
}
```

### ComplianceStatus

```typescript
interface ComplianceStatus {
  region: Region;
  area: 'PrimusGFS' | 'CFIA' | 'FSMA' | 'USDA-GAP' | 'State-Ag' | 'Traceability' | 'Food Safety';
  status: 'compliant' | 'warning' | 'critical';
  readiness_percentage: number;
  outstanding_corrective_actions: number;
  last_audit_date?: string;
  next_audit_date?: string;
  flagged_gaps: number;
}
```

---

## Evidence & Documents

### ProduceDocumentType

```typescript
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
  | 'FSMA 204 Record'    // US only
  | 'RFR Submission'     // US only
  | 'Other';
```

### RetentionPolicy

```typescript
export type RetentionPolicy = 
  | '2-years'   // FSMA minimum
  | '3-years'
  | '5-years'   // CFIA standard
  | '7-years'   // PrimusGFS/State audits
  | 'permanent';
```

### ProduceEvidence

```typescript
interface ProduceEvidence {
  evidence_id: string;
  doc_type: ProduceDocumentType;
  title: string;
  description?: string;
  region: Region;
  commodity?: CommodityType;
  lot_number?: string;
  uploaded_at: string;             // ISO 8601
  uploaded_by: string;
  owner_id: string;                // Department or user ID
  file_size: string;               // "1.2 MB"
  file_format: string;             // "PDF", "Excel"
  retention_policy: RetentionPolicy;
  retention_end: string;           // ISO 8601 or "N/A"
  linked_reports: string[];        // report_ids
  tags: string[];
  encrypted: boolean;
  access_log: AccessLogEntry[];
  status: 'active' | 'archived' | 'pending-deletion';
  fda_accessible?: boolean;        // US only
}
```

### AccessLogEntry

```typescript
interface AccessLogEntry {
  user_id: string;
  user_name: string;
  department: string;
  action: 'viewed' | 'downloaded' | 'uploaded' | 'modified' | 'deleted';
  timestamp: string;  // ISO 8601
  ip_address: string;
}
```

---

## Audit & Traceability

### AuditAction

```typescript
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
  | 'FSMA_LOG_CREATED'          // US only
  | 'FDA_INSPECTION_LOGGED'     // US only
  | 'STATE_LICENSE_RENEWED'     // US only
  | 'RFR_SUBMITTED';            // US only
```

### AuditEntry

```typescript
interface AuditEntry {
  audit_id: string;
  timestamp: string;                // ISO 8601
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
  hash: string;                     // SHA-256
}
```

### AuditExportFilter

```typescript
interface AuditExportFilter {
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
```

### FSMALogType

```typescript
export type FSMALogType = 
  | 'Worker Hygiene'
  | 'Agricultural Water Testing'
  | 'Soil Amendment'
  | 'Equipment Cleaning'
  | 'Facility Sanitizing'
  | 'Corrective Action';
```

### FSMALog

```typescript
interface FSMALog {
  log_id: string;
  date: string;
  lot_id?: string;
  event_type: FSMALogType;
  result: string;
  corrective_action?: string;
  responsible_employee: string;
  cfr_reference: string;         // "21 CFR 112.42"
  testing_results?: any;
  status: 'compliant' | 'corrective-action-needed' | 'non-compliant';
  evidence_ids: string[];
}
```

### FSMAProduceSafetyChecklist

```typescript
interface FSMAProduceSafetyChecklist {
  section: string;
  cfr_part: string;              // "112.3", "112.4"
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'not-applicable' | 'pending';
  evidence_required: string[];
  evidence_uploaded: string[];
  last_reviewed?: string;
}
```

### CriticalTrackingEvent

```typescript
export type CriticalTrackingEvent = 
  | 'Harvesting'
  | 'Cooling'
  | 'Packing'
  | 'Receiving'
  | 'Shipping'
  | 'Transformation';
```

### KeyDataElement

```typescript
interface KeyDataElement {
  kde_type: string;
  value: string;
  required_by_fsma: boolean;
}
```

### FSMA204Record

```typescript
interface FSMA204Record {
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
  linked_records: string[];      // Upstream/downstream
  barcode_scan?: string;
  recall_ready: boolean;
}
```

### TraceabilityRecord (General)

```typescript
interface TraceabilityRecord {
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
```

### MovementEntry

```typescript
interface MovementEntry {
  timestamp: string;
  from_location: string;
  to_location: string;
  quantity: string;
  user: string;
  notes?: string;
}
```

---

## Users & Permissions

### UserRole

```typescript
export type UserRole = 
  | 'admin'
  | 'qa-manager'
  | 'fsms-coordinator'
  | 'production-manager'
  | 'operator'
  | 'auditor'
  | 'viewer';
```

### Department

```typescript
export type Department = 
  | 'Quality Assurance'
  | 'Food Safety'
  | 'Production'
  | 'Compliance'
  | 'Management';
```

### Permission

```typescript
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
  | 'fda-inspector-access';    // US only
```

### User

```typescript
interface User {
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
```

---

## Incidents & Recalls

### IncidentType

```typescript
export type IncidentType = 
  | 'Food Safety'
  | 'Quality Issue'
  | 'Customer Complaint'
  | 'Supplier Non-Conformance'
  | 'Contamination'
  | 'Equipment Failure'
  | 'Other';
```

### Incident

```typescript
interface Incident {
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
  regulatory_notified: boolean;
  rfr_submitted?: boolean;      // US only
  evidence_ids: string[];
}
```

### Recall

```typescript
interface Recall {
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
  regulatory_notification_date?: string;
  rfr_submission_id?: string;   // US only
  status: 'active' | 'monitoring' | 'completed';
  effectiveness_check: boolean;
  consumer_notices_sent: number;
}
```

### RFRSubmission (US Only)

```typescript
interface RFRSubmission {
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
```

### CorrectiveAction

```typescript
interface CorrectiveAction {
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
  regulatory_requirement?: string;  // "21 CFR 112.12"
}
```

---

## Dashboard & UI

### RiskAssessment

```typescript
interface RiskAssessment {
  segment: 'commodity' | 'facility' | 'supply-chain';
  name: string;
  risk_level: 'high' | 'medium' | 'low';
  issues: string[];
  mitigation_status: 'complete' | 'in-progress' | 'pending';
}
```

### UpcomingDeadline

```typescript
interface UpcomingDeadline {
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
```

### ComplianceMetric

```typescript
interface ComplianceMetric {
  label: string;
  value: string | number;
  trend?: string;
  status: 'good' | 'warning' | 'critical';
  region?: Region;
  commodity?: CommodityType;
}
```

### ExportFormat

```typescript
export type ExportFormat = 'PDF' | 'CSV' | 'Excel' | 'ZIP';
```

### ExportRequest

```typescript
interface ExportRequest {
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
```

### Notification

```typescript
interface Notification {
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
```

---

## Usage Examples

### Creating Evidence

```typescript
const newEvidence: ProduceEvidence = {
  evidence_id: 'EV-2024-' + Date.now(),
  doc_type: 'Water Test',
  title: 'Q4 Water Quality Analysis',
  region: 'US',
  commodity: 'Leafy Greens',
  uploaded_at: new Date().toISOString(),
  uploaded_by: 'Sarah Chen',
  owner_id: 'QA Department',
  file_size: '2.1 MB',
  file_format: 'PDF',
  retention_policy: '7-years',
  retention_end: new Date(Date.now() + 7*365*24*60*60*1000).toISOString(),
  linked_reports: [],
  tags: ['water-quality', 'quarterly'],
  encrypted: true,
  access_log: [],
  status: 'active',
  fda_accessible: true
};
```

### Creating Audit Entry

```typescript
const auditEntry: AuditEntry = {
  audit_id: 'AUD-2024-' + Date.now(),
  timestamp: new Date().toISOString(),
  user_id: 'USR-001',
  user_name: 'Sarah Chen',
  action: 'EVIDENCE_UPLOADED',
  resource_type: 'evidence',
  resource_id: newEvidence.evidence_id,
  region: 'US',
  commodity: 'Leafy Greens',
  ip_address: '192.168.1.100',
  status: 'success',
  details: 'Uploaded water quality test results',
  hash: generateSHA256Hash()
};
```

### Creating PrimusGFS Report

```typescript
const primusReport: PrimusGFSAudit = {
  report_id: 'PRD-2024-PGS-001',
  region: 'Canada',
  commodity: 'Leafy Greens',
  audit_type: 'PrimusGFS',
  filed_at: new Date().toISOString(),
  status: 'draft',
  evidence_link: ['EV-001', 'EV-002'],
  audit_version: 'v3.2',
  audit_categories: {
    gap: 92,
    gmp: 85,
    fsms: 84
  },
  readiness_percentage: 87,
  scheduled_audit_date: '2025-02-15',
  certification_status: 'pending'
};
```

---

**Next**: See [4-Integration-Guide.md](./4-Integration-Guide.md) for implementation guides.
