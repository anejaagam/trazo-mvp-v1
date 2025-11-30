// Error tracking types for Trazo MVP Dev Dashboard
// Centralized error logging with severity levels

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info'

export interface ErrorLog {
  id: string
  message: string
  stack?: string | null
  user_id?: string | null
  route?: string | null
  component?: string | null
  severity: ErrorSeverity
  metadata?: Record<string, unknown>
  created_at: string
}

export interface LogErrorParams {
  message: string
  stack?: string
  route?: string
  component?: string
  severity: ErrorSeverity
  metadata?: Record<string, unknown>
  userId?: string
}

// Color mappings for severity badges
export const SEVERITY_COLORS: Record<ErrorSeverity, { bg: string; text: string; border: string }> = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  error: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
}

// Severity priority for sorting (lower = more severe)
export const SEVERITY_PRIORITY: Record<ErrorSeverity, number> = {
  critical: 0,
  error: 1,
  warning: 2,
  info: 3,
}

// Labels for display
export const SEVERITY_LABELS: Record<ErrorSeverity, string> = {
  critical: 'Critical',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
}

// Check if a severity level should trigger a notification
export function shouldNotify(severity: ErrorSeverity): boolean {
  return severity === 'critical'
}
