// ============================================================================
// JURISDICTION & CONFIGURATION
// ============================================================================

export type JurisdictionCode = 
  | 'OR'           // Oregon
  | 'MD'           // Maryland
  | 'CA'           // California
  | 'WA'           // Washington
  | 'CO'           // Colorado
  | 'CAN-CANNABIS' // Canada - Cannabis
  | 'CAN-PRODUCE'; // Canada - Produce

export interface Jurisdiction {
  code: JurisdictionCode;
  name: string;
  state?: string;
  country: string;
  category: 'Cannabis' | 'Produce' | 'Food Safety';
}

// ============================================================================
// AUDIT & COMPLIANCE
// ============================================================================

export type AuditAction = 
  | 'EVIDENCE_UPLOADED'
  | 'RECORD_LOCKED'
  | 'REPORT_GENERATED'
  | 'SIGNATURE_CAPTURED'
  | 'TEMPLATE_MODIFIED'
  | 'CALIBRATION_RECORDED';

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: AuditAction;
  resource: string;
  jurisdiction: string;
  ipAddress: string;
  status: 'success' | 'failure';
  hash: string;
  oldValue?: string;
  newValue?: string;
}

export interface ComplianceRule {
  id: string;
  state: string;
  category: string;
  rule: string;
  description: string;
  enabled: boolean;
  severity: 'critical' | 'warning' | 'info';
  examples?: string[];
}

export interface ComplianceStatus {
  jurisdiction: JurisdictionCode;
  name: string;
  status: 'compliant' | 'review' | 'action-required';
  progress: number;
  nextDue: string;
}

// ============================================================================
// EVIDENCE & RECORDS
// ============================================================================

export type EvidenceType = 'photo' | 'signature' | 'lab-result';

export interface Evidence {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  uploadDate: string;
  uploadedBy: string;
  jurisdiction: string;
  batchNumber?: string;
  fileSize: string;
  status: 'verified' | 'pending' | 'flagged';
}

export interface Record {
  id: string;
  type: string;
  title: string;
  batch?: string;
  createdDate: string;
  createdBy: string;
  locked: boolean;
  lockedDate?: string;
  lockedBy?: string;
  jurisdiction: string;
  evidenceCount: number;
}

// ============================================================================
// TEMPLATES & REPORTS
// ============================================================================

export interface Template {
  id: string;
  name: string;
  jurisdiction: string;
  category: string;
  frequency: string;
  fields: number;
  lastUpdated: string;
  status: 'active' | 'draft';
  description: string;
}

export interface Report {
  id: string;
  title: string;
  jurisdiction: string;
  generatedDate: string;
  format: 'PDF' | 'CSV' | 'PDF + CSV';
  size: string;
  status: 'completed' | 'generating' | 'failed';
}

// ============================================================================
// TRACEABILITY
// ============================================================================

export type TraceabilityNodeType = 
  | 'genetics'
  | 'plant'
  | 'batch'
  | 'package'
  | 'sale'
  | 'destruction';

export interface TraceabilityNode {
  id: string;
  type: TraceabilityNodeType;
  name: string;
  date: string;
  location?: string;
  user?: string;
  quantity?: string;
  status: 'active' | 'completed' | 'destroyed';
}

// ============================================================================
// INVENTORY & RECONCILIATION
// ============================================================================

export type ReconciliationStep = 
  | 'select-location'
  | 'physical-count'
  | 'review-variance'
  | 'complete';

export interface InventoryItem {
  sku: string;
  productName: string;
  systemCount: number;
  physicalCount: number;
  variance: number;
  variancePercent: number;
  status: 'match' | 'under' | 'over';
}

export interface InventoryLocation {
  id: string;
  name: string;
  type: 'vault' | 'retail' | 'processing' | 'cultivation';
  capacity?: string;
  currentOccupancy?: string;
}

// ============================================================================
// RECALLS
// ============================================================================

export type RecallStatus = 'pending' | 'notified' | 'returned' | 'destroyed';

export interface RecallPackage {
  packageId: string;
  product: string;
  distributor: string;
  quantity: string;
  dateSold: string;
  status: RecallStatus;
}

export interface Recall {
  id: string;
  batchId: string;
  product: string;
  reason: string;
  initiatedDate: string;
  status: 'active' | 'completed';
  affectedPackages: number;
  recoveredPackages: number;
  notificationsSent: number;
}

// ============================================================================
// INSPECTION
// ============================================================================

export interface EmployeePermit {
  name: string;
  role: string;
  permitId: string;
  expiration: string;
  status: 'valid' | 'expired' | 'expiring-soon';
}

export interface COAReport {
  batchId: string;
  product: string;
  testDate: string;
  lab: string;
  status: 'passed' | 'failed' | 'pending';
  results?: {
    potency?: { thc: number; cbd: number };
    microbial?: string;
    pesticides?: string;
    heavyMetals?: string;
  };
}

export interface InventoryByRoom {
  room: string;
  category: string;
  units: number;
  weight: string;
}

// ============================================================================
// USERS & PERMISSIONS
// ============================================================================

export type UserRole = 
  | 'admin'
  | 'manager'
  | 'operator'
  | 'auditor'
  | 'inspector';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  jurisdiction: JurisdictionCode;
  permitId?: string;
  permitExpiration?: string;
  active: boolean;
}

// ============================================================================
// BATCH & PRODUCT
// ============================================================================

export interface Batch {
  id: string;
  batchNumber: string;
  product: string;
  strain?: string;
  quantity: number;
  unit: string;
  startDate: string;
  harvestDate?: string;
  status: 'active' | 'completed' | 'quarantined' | 'destroyed';
  room?: string;
  assignedUser?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  strain?: string;
  thcContent?: number;
  cbdContent?: number;
  packageSize: string;
  price: number;
  status: 'active' | 'discontinued';
}

// ============================================================================
// STATISTICS & METRICS
// ============================================================================

export interface ComplianceMetric {
  label: string;
  value: string | number;
  trend?: string;
  status?: 'good' | 'warning' | 'critical';
}

export interface ActivityLogEntry {
  action: string;
  type: string;
  user: string;
  time: string;
  jurisdiction: JurisdictionCode;
}
