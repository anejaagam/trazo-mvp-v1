# Trazo Compliance Engine - Type Definitions

## Table of Contents
1. [Overview](#overview)
2. [Jurisdiction Types](#jurisdiction-types)
3. [Compliance Report Types](#compliance-report-types)
4. [Evidence Vault Types](#evidence-vault-types)
5. [Audit Trail Types](#audit-trail-types)
6. [Dashboard Types](#dashboard-types)
7. [User Management Types](#user-management-types)
8. [Integration Types](#integration-types)
9. [Utility Types](#utility-types)

---

## Overview

**Location**: `/types/index.ts`

All TypeScript type definitions for the Trazo Compliance Engine. This file provides:
- Strict type safety across the application
- IntelliSense support in IDEs
- Compile-time error detection
- Self-documenting code

### Import Pattern
```typescript
import type { 
  ComplianceReport, 
  EvidenceDocument, 
  AuditEntry,
  Jurisdiction 
} from '../types';
```

---

## Jurisdiction Types

### JurisdictionCode
```typescript
type JurisdictionCode = 
  | 'OR'           // Oregon (Metrc/OLCC)
  | 'MD'           // Maryland (Metrc/MMCC)
  | 'CAN-CANNABIS'; // Canada (CTLS/Health Canada)
```

**Usage**: Strict typing for jurisdiction selection, filtering, and display.

### Jurisdiction
```typescript
interface Jurisdiction {
  code: JurisdictionCode;
  name: string;
  state?: string;              // US states only
  country: string;
  system: 'Metrc' | 'CTLS';
  reportingFrequency: 'Daily' | 'Monthly' | 'Real-time';
}
```

**Example**:
```typescript
const oregon: Jurisdiction = {
  code: 'OR',
  name: 'Oregon',
  state: 'Oregon',
  country: 'USA',
  system: 'Metrc',
  reportingFrequency: 'Monthly'
};
```

---

## Compliance Report Types

### ReportType
```typescript
type ReportType = 
  | 'Metrc Monthly'
  | 'CTLS Monthly'
  | 'Seed-to-Sale Movement'
  | 'Waste Reporting'
  | 'Transaction Log'
  | 'Production Report'
  | 'Destruction Report'
  | 'Inventory Report'
  | 'Sales Report';
```

**Jurisdiction Mapping**:
- **OR/MD (Metrc)**: Metrc Monthly, Seed-to-Sale Movement, Waste Reporting, Transaction Log
- **CAN-CANNABIS (CTLS)**: CTLS Monthly, Production Report, Destruction Report, Inventory Report, Sales Report

### ReportStatus
```typescript
type ReportStatus = 
  | 'draft'
  | 'pending-review'
  | 'approved'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'error';
```

**Status Flow**:
```
draft → pending-review → approved → submitted → accepted
                                              ↘ rejected/error
```

### ComplianceReport
```typescript
interface ComplianceReport {
  report_id: string;          // Format: "REP-2024-10-001"
  jurisdiction: JurisdictionCode;
  type: ReportType;
  reporting_period: string;   // Format: "2024-10" or "2024-Q3"
  created_at: string;         // ISO date string
  submitted_at?: string;      // ISO date string
  status: ReportStatus;
  linked_evidence: string[];  // Array of evidence_ids
  export_url?: string;        // Download link for generated report
  errors?: string[];          // Validation/submission errors
  reviewed_by?: string;       // User ID of reviewer
  notes?: string;
}
```

**Example**:
```typescript
const report: ComplianceReport = {
  report_id: 'REP-2024-10-001',
  jurisdiction: 'OR',
  type: 'Metrc Monthly',
  reporting_period: '2024-10',
  created_at: '2024-10-28T10:00:00Z',
  submitted_at: '2024-10-31T14:30:00Z',
  status: 'accepted',
  linked_evidence: ['EV-001', 'EV-002', 'EV-003'],
  export_url: '/downloads/rep-2024-10-001.pdf',
};
```

### MetrcReport (Extended)
```typescript
interface MetrcReport extends ComplianceReport {
  metrc_upload_id?: string;
  reconciliation_status: 'pass' | 'fail' | 'pending';
  movement_count: number;
  waste_count: number;
  transaction_count: number;
  olcc_status?: 'compliant' | 'review-needed' | 'non-compliant';
}
```

### CTLSReport (Extended)
```typescript
interface CTLSReport extends ComplianceReport {
  ctls_submission_id?: string;
  production_data: boolean;
  destruction_data: boolean;
  inventory_data: boolean;
  sales_data: boolean;
  gpp_compliant: boolean;      // Good Production Practices
  qap_compliant: boolean;      // Quality Assurance Program
  health_canada_confirmation?: string;
}
```

---

## Evidence Vault Types

### DocumentType
```typescript
type DocumentType = 
  | 'Lab Result'
  | 'SOP'
  | 'Permit'
  | 'License'
  | 'Training Certificate'
  | 'Inspection Report'
  | 'COA'                     // Certificate of Analysis
  | 'Metrc Export'
  | 'CTLS Export'
  | 'Compliance Letter'
  | 'Other';
```

### RetentionPolicy
```typescript
type RetentionPolicy = 
  | '1-year'
  | '3-years'
  | '5-years'
  | '7-years'
  | 'permanent';
```

**Regulatory Guidance**:
- **Cannabis (most jurisdictions)**: 7 years minimum
- **Lab results**: 7 years
- **Permits/Licenses**: Permanent
- **Training records**: 3-5 years

### EvidenceDocument
```typescript
interface EvidenceDocument {
  evidence_id: string;        // Format: "EV-001"
  doc_type: DocumentType;
  title: string;
  description?: string;
  jurisdiction: JurisdictionCode;
  uploaded_at: string;        // ISO date string
  uploaded_by: string;        // User ID
  file_size: string;          // e.g., "2.4 MB"
  file_format: string;        // e.g., "PDF", "XLSX"
  retention_policy: RetentionPolicy;
  retention_end: string;      // ISO date string
  linked_reports: string[];   // Array of report_ids
  tags: string[];             // Custom tags for organization
  encrypted: boolean;
  access_log: AccessLogEntry[];
  status: 'active' | 'archived' | 'pending-deletion';
}
```

**Example**:
```typescript
const evidence: EvidenceDocument = {
  evidence_id: 'EV-001',
  doc_type: 'Lab Result',
  title: 'Batch #2045 COA - Potency & Microbial',
  description: 'Certificate of Analysis for October harvest',
  jurisdiction: 'OR',
  uploaded_at: '2024-10-15T09:30:00Z',
  uploaded_by: 'user-123',
  file_size: '1.2 MB',
  file_format: 'PDF',
  retention_policy: '7-years',
  retention_end: '2031-10-15',
  linked_reports: ['REP-2024-10-001'],
  tags: ['batch-2045', 'lab-results', 'october-2024'],
  encrypted: true,
  access_log: [],
  status: 'active',
};
```

### AccessLogEntry
```typescript
interface AccessLogEntry {
  user_id: string;
  user_name: string;
  action: 'viewed' | 'downloaded' | 'uploaded' | 'modified' | 'deleted';
  timestamp: string;
  ip_address: string;
}
```

---

## Audit Trail Types

### AuditAction
```typescript
type AuditAction = 
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
```

### AuditEntry
```typescript
interface AuditEntry {
  audit_id: string;           // Unique identifier
  timestamp: string;          // ISO date string
  user_id: string;
  user_name: string;
  action: AuditAction;
  resource_type: 'report' | 'evidence' | 'user' | 'system';
  resource_id: string;
  jurisdiction: JurisdictionCode;
  ip_address: string;
  status: 'success' | 'failure';
  details?: string;           // Additional context
  old_value?: string;         // For modifications
  new_value?: string;         // For modifications
  hash: string;               // Tamper-proof hash
}
```

**Example**:
```typescript
const auditEntry: AuditEntry = {
  audit_id: 'AUD-2024-10-001',
  timestamp: '2024-10-31T14:30:00Z',
  user_id: 'user-123',
  user_name: 'Sarah Johnson',
  action: 'REPORT_SUBMITTED',
  resource_type: 'report',
  resource_id: 'REP-2024-10-001',
  jurisdiction: 'OR',
  ip_address: '192.168.1.100',
  status: 'success',
  details: 'Oregon October Monthly Metrc Report submitted to OLCC',
  hash: 'sha256:abc123def456...',
};
```

### AuditExportFilter
```typescript
interface AuditExportFilter {
  jurisdiction?: JurisdictionCode[];
  action?: AuditAction[];
  start_date?: string;
  end_date?: string;
  user_id?: string;
  resource_type?: string;
  keyword?: string;
}
```

**Usage**:
```typescript
const filter: AuditExportFilter = {
  jurisdiction: ['OR', 'MD'],
  action: ['REPORT_SUBMITTED', 'REPORT_APPROVED'],
  start_date: '2024-10-01',
  end_date: '2024-10-31',
};
```

---

## Dashboard Types

### ComplianceStatus
```typescript
interface ComplianceStatus {
  jurisdiction: JurisdictionCode;
  status: 'compliant' | 'warning' | 'critical';
  last_report_date: string;
  next_deadline: string;
  unreported_data: number;
  urgent_tasks: number;
  pending_approvals: number;
}
```

**Status Criteria**:
- **compliant**: All tasks complete, no overdue items
- **warning**: Approaching deadline or minor issues
- **critical**: Overdue items or major compliance gaps

### UpcomingDeadline
```typescript
interface UpcomingDeadline {
  id: string;
  title: string;
  jurisdiction: JurisdictionCode;
  type: 'filing' | 'renewal' | 'system-task' | 'inspection';
  due_date: string;
  days_until_due: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  completed: boolean;
}
```

**Priority Rules**:
- **critical**: Due today or overdue
- **high**: Due within 7 days
- **medium**: Due within 30 days
- **low**: Due beyond 30 days

### ComplianceMetric
```typescript
interface ComplianceMetric {
  label: string;
  value: string | number;
  trend?: string;             // e.g., "+12%", "-3"
  status: 'good' | 'warning' | 'critical';
  jurisdiction?: JurisdictionCode;
}
```

**Example**:
```typescript
const metric: ComplianceMetric = {
  label: 'Total Reports (30d)',
  value: '18',
  trend: '+3',
  status: 'good',
};
```

---

## User Management Types

### UserRole
```typescript
type UserRole = 
  | 'admin'
  | 'compliance-manager'
  | 'data-entry'
  | 'viewer'
  | 'auditor';
```

**Role Hierarchy**:
1. **admin**: Full system access
2. **compliance-manager**: Approve reports, manage evidence
3. **data-entry**: Create reports, upload evidence
4. **viewer**: Read-only access
5. **auditor**: View audit logs, export data

### Permission
```typescript
type Permission = 
  | 'view-reports'
  | 'create-reports'
  | 'approve-reports'
  | 'submit-reports'
  | 'view-evidence'
  | 'upload-evidence'
  | 'delete-evidence'
  | 'export-audit'
  | 'manage-users';
```

### User
```typescript
interface User {
  user_id: string;
  email: string;
  name: string;
  role: UserRole;
  jurisdictions: JurisdictionCode[];
  permissions: Permission[];
  active: boolean;
  last_login?: string;
}
```

**Example**:
```typescript
const user: User = {
  user_id: 'user-123',
  email: 'sarah.johnson@example.com',
  name: 'Sarah Johnson',
  role: 'compliance-manager',
  jurisdictions: ['OR', 'MD'],
  permissions: ['view-reports', 'create-reports', 'approve-reports', 'view-evidence'],
  active: true,
  last_login: '2024-11-08T10:00:00Z',
};
```

---

## Integration Types

### MetrcSyncLog
```typescript
interface MetrcSyncLog {
  sync_id: string;
  jurisdiction: JurisdictionCode;
  timestamp: string;
  sync_type: 'manual' | 'scheduled' | 'real-time';
  records_synced: number;
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
  user_id: string;
}
```

### MetrcReconciliation
```typescript
interface MetrcReconciliation {
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
```

### CTLSSubmission
```typescript
interface CTLSSubmission {
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
```

---

## Utility Types

### ExportFormat
```typescript
type ExportFormat = 'PDF' | 'CSV' | 'Excel' | 'JSON';
```

### ExportRequest
```typescript
interface ExportRequest {
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
```

### Notification
```typescript
interface Notification {
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
```

**Example**:
```typescript
const notification: Notification = {
  notification_id: 'NOT-001',
  user_id: 'user-123',
  type: 'deadline',
  title: 'Report Due Tomorrow',
  message: 'Oregon Monthly Metrc Report is due November 30, 2024',
  jurisdiction: 'OR',
  created_at: '2024-11-29T09:00:00Z',
  read: false,
  action_url: '/reports?jurisdiction=OR',
};
```

---

## Type Guards and Utilities

### Type Guard Examples

```typescript
// Check if report is Metrc or CTLS
function isMetrcReport(report: ComplianceReport): report is MetrcReport {
  return report.jurisdiction === 'OR' || report.jurisdiction === 'MD';
}

function isCTLSReport(report: ComplianceReport): report is CTLSReport {
  return report.jurisdiction === 'CAN-CANNABIS';
}

// Usage
if (isMetrcReport(report)) {
  console.log(report.olcc_status); // TypeScript knows this exists
}
```

### Array Filtering

```typescript
// Filter reports by jurisdiction
const oregonReports = allReports.filter(
  (r): r is ComplianceReport => r.jurisdiction === 'OR'
);

// Filter evidence by type
const labResults = allEvidence.filter(
  (e): e is EvidenceDocument => e.doc_type === 'Lab Result'
);
```

---

## Database Schema Mapping

These types map to the following database tables:

| Type | Database Table | Primary Key |
|------|---------------|-------------|
| ComplianceReport | compliance_reports | report_id |
| EvidenceDocument | evidence_vault | evidence_id |
| AuditEntry | audit_log | audit_id |
| User | users | user_id |
| MetrcSyncLog | metrc_sync_logs | sync_id |
| CTLSSubmission | ctls_submissions | submission_id |

---

## Validation Patterns

### Report ID Format
```typescript
// Pattern: REP-YYYY-MM-XXX
const reportIdPattern = /^REP-\d{4}-\d{2}-\d{3}$/;

// Validation
function isValidReportId(id: string): boolean {
  return reportIdPattern.test(id);
}
```

### Evidence ID Format
```typescript
// Pattern: EV-XXX
const evidenceIdPattern = /^EV-\d{3}$/;
```

### Date Validation
```typescript
// ISO 8601 format
function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
```

---

## Type Usage Best Practices

### Import Types Only
```typescript
// Good - only imports types, no runtime code
import type { ComplianceReport, ReportStatus } from '../types';

// Also good - selective imports
import { type ComplianceReport, type ReportStatus } from '../types';
```

### Use Const Assertions
```typescript
const jurisdictions = [
  { code: 'OR', name: 'Oregon' },
  { code: 'MD', name: 'Maryland' },
] as const;

type JurisdictionCode = typeof jurisdictions[number]['code']; // 'OR' | 'MD'
```

### Avoid Type Assertion
```typescript
// Bad
const report = data as ComplianceReport;

// Good - use type guards
function isComplianceReport(data: unknown): data is ComplianceReport {
  return (
    typeof data === 'object' &&
    data !== null &&
    'report_id' in data &&
    'jurisdiction' in data
  );
}
```

---

**See Also**:
- `1-Platform-Overview.md` - Architecture overview
- `2-Component-Reference.md` - Component documentation
- `4-Integration-Guide.md` - Backend integration

**Last Updated**: November 8, 2024
