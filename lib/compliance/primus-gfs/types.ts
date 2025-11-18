/**
 * PrimusGFS Types (Placeholder)
 *
 * Type definitions for PrimusGFS food safety compliance.
 * These are placeholders and will be refined when PrimusGFS integration is implemented.
 */

/**
 * PrimusGFS audit manager configuration
 */
export interface PrimusGFSConfig {
  certificationBody: string
  auditSchedule: 'annual' | 'semi-annual'
  operationType: 'greenhouse' | 'field' | 'mixed'
}

/**
 * PrimusGFS audit package (placeholder)
 */
export interface AuditPackage {
  auditType: 'PrimusGFS' | 'GlobalGAP'
  scheduledDate?: string
  readinessPercentage: number
  requiredDocuments: string[]
  completedDocuments: string[]
  evidenceLinks: string[]
  gaps: AuditGap[]
}

/**
 * Gap identified in audit preparation
 */
export interface AuditGap {
  category: string
  requirement: string
  currentStatus: string
  requiredAction: string
  priority: 'critical' | 'major' | 'minor'
  dueDate?: string
}

/**
 * GAP (Good Agricultural Practices) compliance status
 */
export interface GAPComplianceStatus {
  overallScore: number
  categories: GAPCategory[]
  lastAssessment: string
  nextAssessment: string
}

/**
 * GAP compliance category
 */
export interface GAPCategory {
  name: string
  score: number
  maxScore: number
  requirements: GAPRequirement[]
}

/**
 * Individual GAP requirement
 */
export interface GAPRequirement {
  id: string
  description: string
  status: 'compliant' | 'non-compliant' | 'not-applicable'
  evidence?: string[]
  notes?: string
}

/**
 * Food safety plan (placeholder)
 */
export interface FoodSafetyPlan {
  planVersion: string
  effectiveDate: string
  hazardAnalysis: unknown[]
  controlMeasures: unknown[]
  monitoringProcedures: unknown[]
  verificationProcedures: unknown[]
}
