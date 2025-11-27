// Centralized error logging for Trazo MVP
// Logs errors to Supabase error_logs table for real-time monitoring

import { createClient } from '@/lib/supabase/client'
import type { ErrorSeverity, LogErrorParams } from './types'

/**
 * Log an error to the centralized error_logs table
 * Errors are viewable in real-time by developers in the dev dashboard
 */
export async function logError(params: LogErrorParams): Promise<{ success: boolean; error?: string }> {
  const { message, stack, route, component, severity, metadata, userId } = params

  try {
    const supabase = createClient()

    // Try to get the current user if userId not provided
    let effectiveUserId = userId
    if (!effectiveUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      effectiveUserId = user?.id
    }

    const { error } = await supabase.from('error_logs').insert({
      message,
      stack: stack || null,
      user_id: effectiveUserId || null,
      route: route || (typeof window !== 'undefined' ? window.location.pathname : null),
      component: component || null,
      severity,
      metadata: metadata || {},
    })

    if (error) {
      // Fallback to console if DB insert fails
      console.error('[ErrorLogger] Failed to log error to database:', error)
      console.error('[ErrorLogger] Original error:', { message, stack, severity })
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    // Fallback to console if anything fails
    console.error('[ErrorLogger] Exception while logging error:', err)
    console.error('[ErrorLogger] Original error:', { message, stack, severity })
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Log a critical error (e.g., from ErrorBoundary)
 * Critical errors trigger notifications to developers
 */
export async function logCriticalError(
  error: Error,
  componentInfo?: { componentStack?: string; route?: string; component?: string }
): Promise<void> {
  await logError({
    message: error.message,
    stack: error.stack,
    route: componentInfo?.route,
    component: componentInfo?.component,
    severity: 'critical',
    metadata: {
      componentStack: componentInfo?.componentStack,
      name: error.name,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Log an API error
 */
export async function logApiError(
  endpoint: string,
  status: number,
  message: string,
  details?: Record<string, unknown>
): Promise<void> {
  const severity: ErrorSeverity = status >= 500 ? 'error' : 'warning'
  
  await logError({
    message: `API Error: ${message}`,
    route: endpoint,
    severity,
    metadata: {
      status,
      details,
      type: 'api_error',
    },
  })
}

/**
 * Log a client-side warning
 */
export async function logWarning(
  message: string,
  context?: { route?: string; component?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  await logError({
    message,
    route: context?.route,
    component: context?.component,
    severity: 'warning',
    metadata: context?.metadata,
  })
}

/**
 * Log an informational message
 */
export async function logInfo(
  message: string,
  context?: { route?: string; component?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  await logError({
    message,
    route: context?.route,
    component: context?.component,
    severity: 'info',
    metadata: context?.metadata,
  })
}
