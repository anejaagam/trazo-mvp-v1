/**
 * Shared Compliance Types
 *
 * Common types used across all compliance providers (Metrc, CTLS, PrimusGFS)
 */

/**
 * Generic compliance report structure
 */
export interface ComplianceReport {
  id: string
  reportType: string
  periodStart: string
  periodEnd: string
  generatedAt: string
  status: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected'
  data: Record<string, unknown>
  evidenceIds: string[]
}

/**
 * Sync operation result
 */
export interface SyncResult {
  success: boolean
  syncId: string
  syncType: string
  direction: 'push' | 'pull' | 'bidirectional'
  itemsProcessed: number
  itemsFailed: number
  errors: SyncError[]
  startedAt: string
  completedAt: string
}

/**
 * Sync error details
 */
export interface SyncError {
  entityId?: string
  entityType?: string
  errorCode: string
  errorMessage: string
  timestamp: string
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string
  message: string
  code: string
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string
  message: string
  code: string
}

/**
 * Generic operation type for compliance actions
 */
export interface Operation {
  type: string
  data: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * Evidence file metadata
 */
export interface Evidence {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: string
  uploadedBy: string
  linkedEntities: EvidenceLink[]
  url: string
}

/**
 * Link between evidence and compliance entities
 */
export interface EvidenceLink {
  entityType: 'package' | 'plant' | 'harvest' | 'transfer' | 'waste' | 'report'
  entityId: string
}

/**
 * Audit log entry for compliance actions
 */
export interface ComplianceAuditEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: string
  entityType: string
  entityId: string
  changes: Record<string, unknown>
  metadata: Record<string, unknown>
}
