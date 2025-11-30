// Dev audit action types for tracking developer activities
// All actions performed in the dev dashboard are logged for accountability

export const DEV_AUDIT_ACTIONS = {
  // Organization approval actions
  ORG_APPROVED: 'org:approved',
  ORG_REJECTED: 'org:rejected',
  ORG_VIEWED: 'org:viewed',
  
  // User management actions
  USER_VIEWED: 'user:viewed',
  USER_LIST_VIEWED: 'user:list_viewed',
  
  // Error log actions
  ERROR_VIEWED: 'error:viewed',
  ERROR_CLEARED: 'error:cleared',
  ERRORS_LIST_VIEWED: 'errors:list_viewed',
  
  // Dashboard actions
  DASHBOARD_VIEWED: 'dashboard:viewed',
  
  // Audit log actions
  LOGS_VIEWED: 'logs:viewed',
  LOGS_EXPORTED: 'logs:exported',
  
  // Session actions
  DEV_LOGIN: 'session:login',
  DEV_LOGOUT: 'session:logout',
} as const

export type DevAuditAction = typeof DEV_AUDIT_ACTIONS[keyof typeof DEV_AUDIT_ACTIONS]

// Target types for audit logs
export const TARGET_TYPES = {
  ORGANIZATION: 'organization',
  USER: 'user',
  ERROR: 'error',
  DASHBOARD: 'dashboard',
  LOGS: 'logs',
} as const

export type TargetType = typeof TARGET_TYPES[keyof typeof TARGET_TYPES]

// Interface for dev audit log entries
export interface DevAuditLog {
  id: string
  developer_id: string
  action: DevAuditAction
  target_type?: TargetType | null
  target_id?: string | null
  metadata?: Record<string, unknown>
  created_at: string
}

// Interface for logging params
export interface LogDevActionParams {
  developerId: string
  action: DevAuditAction
  targetType?: TargetType
  targetId?: string
  metadata?: Record<string, unknown>
}

// Human-readable action labels
export const ACTION_LABELS: Record<DevAuditAction, string> = {
  'org:approved': 'Approved Organization',
  'org:rejected': 'Rejected Organization',
  'org:viewed': 'Viewed Organization Details',
  'user:viewed': 'Viewed User Details',
  'user:list_viewed': 'Viewed Users List',
  'error:viewed': 'Viewed Error Details',
  'error:cleared': 'Cleared Error Logs',
  'errors:list_viewed': 'Viewed Errors List',
  'dashboard:viewed': 'Viewed Dashboard',
  'logs:viewed': 'Viewed Audit Logs',
  'logs:exported': 'Exported Logs',
  'session:login': 'Logged In',
  'session:logout': 'Logged Out',
}
