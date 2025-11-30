// PrimusGFS Compliance Types

export interface FoodSafetyPolicy {
  id: string;
  version: string;
  effectiveDate: string;
  statement: string;
  objectives: string[];
  approvedBy: string;
  approvedAt: string;
  nextReviewDate: string;
}

export interface WaterTestRecord {
  id: string;
  testDate: string;
  waterSource: string;
  sourceType: 'well' | 'municipal' | 'surface' | 'irrigation';
  location: string;
  sampleId: string;
  testedBy: string;
  laboratory?: string;
  parameters: {
    ecoli?: { value: number; unit: string; limit: number; passed: boolean };
    totalColiform?: { value: number; unit: string; limit: number; passed: boolean };
    pH?: { value: number; passed: boolean };
    turbidity?: { value: number; unit: string; limit: number; passed: boolean };
    chlorine?: { value: number; unit: string; passed: boolean };
  };
  overallResult: 'pass' | 'fail' | 'pending';
  correctiveActions?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  nextTestDue: string;
  attachments?: string[];
}

export interface ChemicalApplicationRecord {
  id: string;
  applicationDate: string;
  batchId?: string;
  growingAreaId: string;
  productType: 'pesticide' | 'fertilizer' | 'fungicide' | 'herbicide' | 'other';
  productName: string;
  epaRegistration?: string;
  activeIngredients: string[];
  applicationRate: string;
  applicationMethod: 'spray' | 'drip' | 'granular' | 'injection' | 'other';
  targetPest?: string;
  totalArea: number; // sq ft
  totalAmount: number;
  unit: string;
  phi?: number; // Pre-Harvest Interval in days
  rei?: number; // Re-Entry Interval in hours
  applicatorName: string;
  applicatorLicense?: string;
  weatherConditions: string;
  temperature?: number;
  windSpeed?: number;
  preHarvestCompliance: boolean;
  supervisorApproval: string;
  approvedAt: string;
  attachments?: string[];
}

export interface WorkerHygieneLog {
  id: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'night';
  location: string;
  inspectorName: string;
  inspectionType: 'routine' | 'spot_check' | 'incident_based';
  checklistItems: {
    handwashingStationsStocked: boolean;
    toiletFacilitiesClean: boolean;
    workersWearingGloves: boolean;
    workersInCleanUniforms: boolean;
    noIllnessReported: boolean;
    noOpenWounds: boolean;
    personalItemsStored: boolean;
  };
  workersInspected: number;
  violations: string[];
  correctiveActions: string[];
  followUpRequired: boolean;
  followUpDate?: string;
  notes?: string;
}

export interface SanitationLog {
  id: string;
  date: string;
  facilityArea: string;
  equipmentType: string;
  cleaningType: 'pre_operational' | 'operational' | 'post_operational' | 'deep_clean';
  cleaningAgent: string;
  sanitizer?: string;
  sanitizerConcentration?: number; // ppm
  startTime: string;
  endTime: string;
  cleanedBy: string;
  verifiedBy: string;
  verificationMethod: 'visual' | 'atp_swab' | 'microbiological' | 'other';
  verificationResult: 'pass' | 'fail';
  correctiveActions?: string[];
  nextScheduledCleaning: string;
  attachments?: string[];
}

export interface PestControlLog {
  id: string;
  inspectionDate: string;
  inspectorName: string;
  company?: string;
  licenseNumber?: string;
  location: string;
  areaType: 'field' | 'greenhouse' | 'packing_facility' | 'storage' | 'perimeter';
  pestActivity: {
    rodents: 'none' | 'low' | 'medium' | 'high';
    insects: 'none' | 'low' | 'medium' | 'high';
    birds: 'none' | 'low' | 'medium' | 'high';
  };
  trapsChecked: number;
  newTrapsPlaced: number;
  baitStationsServiced: number;
  pesticidesApplied?: {
    product: string;
    epaNumber: string;
    amount: number;
    targetPest: string;
  }[];
  findings: string;
  correctiveActions: string[];
  followUpRequired: boolean;
  nextInspectionDate: string;
  attachments?: string[];
}

export interface SupplierApproval {
  id: string;
  supplierName: string;
  supplierType: 'seed' | 'transplant' | 'chemical' | 'packaging' | 'equipment' | 'other';
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    contactPerson: string;
  };
  approvalStatus: 'approved' | 'conditional' | 'suspended' | 'rejected';
  approvalDate: string;
  expiryDate: string;
  certifications: string[]; // e.g., "Organic Certified", "GMP Certified"
  auditScore?: number;
  lastAuditDate?: string;
  approvedProducts: string[];
  riskLevel: 'low' | 'medium' | 'high';
  correctiveActionsRequired?: string[];
  notes?: string;
  approvedBy: string;
  reviewedBy?: string;
  attachments?: string[];
}

export interface NonConformanceReport {
  id: string;
  reportDate: string;
  reportedBy: string;
  category: 'product_quality' | 'food_safety' | 'gmp' | 'gap' | 'traceability' | 'documentation' | 'other';
  severity: 'critical' | 'major' | 'minor';
  location: string;
  batchId?: string;
  description: string;
  rootCause?: string;
  immediateAction: string;
  correctiveAction: string;
  preventiveAction: string;
  responsiblePerson: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  status: 'open' | 'in_progress' | 'completed' | 'verified' | 'closed';
  verifiedBy?: string;
  verifiedAt?: string;
  effectiveness?: 'effective' | 'ineffective' | 'pending';
  followUpRequired: boolean;
  attachments?: string[];
}

export interface TraceabilityTest {
  id: string;
  testDate: string;
  testType: 'mock_recall' | 'forward_trace' | 'backward_trace' | 'internal_audit';
  lotNumber: string;
  batchId: string;
  productName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  targetTime: number; // minutes - typically < 4 hours for mock recalls
  result: 'pass' | 'fail';
  testedBy: string;
  recordsRetrieved: {
    supplierRecords: boolean;
    productionRecords: boolean;
    packagingRecords: boolean;
    shippingRecords: boolean;
    customerRecords: boolean;
  };
  traceabilityAccuracy: number; // percentage
  gaps: string[];
  correctiveActions: string[];
  verifiedBy: string;
  notes: string;
  attachments?: string[];
}

export interface InternalAudit {
  id: string;
  auditDate: string;
  auditType: 'food_safety' | 'gap' | 'gmp' | 'traceability' | 'comprehensive';
  auditor: string;
  scope: string[];
  checklistItems: {
    item: string;
    requirement: string;
    compliant: boolean;
    evidence?: string;
    findings?: string;
  }[];
  overallScore: number; // percentage
  criticalFindings: number;
  majorFindings: number;
  minorFindings: number;
  observations: string[];
  strengths: string[];
  correctiveActionsRequired: string[];
  followUpDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'closed';
  reportGeneratedAt?: string;
  attachments?: string[];
}

export interface CustomerComplaint {
  id: string;
  complaintDate: string;
  receivedDate: string;
  customerName: string;
  contactInfo: string;
  lotNumber?: string;
  batchId?: string;
  productName: string;
  complaintType: 'quality' | 'safety' | 'labeling' | 'contamination' | 'other';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  investigationStarted: string;
  investigatedBy: string;
  rootCause?: string;
  correctiveAction?: string;
  customerResponse: string;
  responseDate?: string;
  recallRequired: boolean;
  status: 'received' | 'investigating' | 'resolved' | 'closed';
  closedDate?: string;
  attachments?: string[];
}

export interface RecallRecord {
  id: string;
  recallDate: string;
  recallType: 'voluntary' | 'regulatory' | 'mock';
  classificationLevel: 'class_i' | 'class_ii' | 'class_iii' | 'mock'; // FDA classification
  productName: string;
  lotNumbers: string[];
  batchIds: string[];
  reason: string;
  quantityProduced: number;
  quantityDistributed: number;
  quantityRecovered: number;
  recoveryPercentage: number;
  customersNotified: number;
  notificationMethod: string[];
  regulatoryAgenciesNotified: string[];
  mediaAlertIssued: boolean;
  startTime: string;
  completionTime?: string;
  effectivenessCheckDate?: string;
  effectiveness: 'effective' | 'ineffective' | 'pending';
  coordinatedBy: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'closed';
  attachments?: string[];
}

export interface TrainingRecord {
  id: string;
  trainingDate: string;
  trainingType: 'food_safety' | 'gap' | 'gmp' | 'hygiene' | 'pesticide_application' | 'traceability' | 'other';
  topic: string;
  duration: number; // hours
  trainerName: string;
  trainerQualifications?: string;
  attendees: {
    employeeId: string;
    employeeName: string;
    position: string;
    signature?: string;
    score?: number;
    passed: boolean;
  }[];
  materials: string[];
  assessmentConducted: boolean;
  passingScore?: number;
  certificateIssued: boolean;
  expiryDate?: string;
  nextTrainingDue?: string;
  attachments?: string[];
}

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending_review' | 'corrective_action_required';

export interface ComplianceDashboardMetrics {
  waterTests: {
    total: number;
    passed: number;
    failed: number;
    overdue: number;
  };
  chemicalApplications: {
    total: number;
    compliant: number;
    violations: number;
  };
  sanitationLogs: {
    total: number;
    passed: number;
    failed: number;
  };
  nonConformances: {
    open: number;
    critical: number;
    major: number;
    minor: number;
  };
  traceability: {
    lastTestDate: string;
    lastTestResult: 'pass' | 'fail';
    averageTraceTime: number; // minutes
  };
  audits: {
    lastAuditDate: string;
    lastAuditScore: number;
    nextAuditDue: string;
  };
  training: {
    employeesCurrent: number;
    employeesOverdue: number;
    totalEmployees: number;
  };
  overallCompliance: ComplianceStatus;
}
