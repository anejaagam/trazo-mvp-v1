// Client-side dev audit logger
// Uses browser Supabase client only - safe for use in client components

import { createClient } from '@/lib/supabase/client'
import type { LogDevActionParams } from './actions'

// Re-export constants for convenience
export { DEV_AUDIT_ACTIONS, TARGET_TYPES } from './actions'

/**
 * Log a developer action to the dev_audit_logs table (client-side)
 */
export async function logDevActionClient(
  params: LogDevActionParams
): Promise<{ success: boolean; error?: string }> {
  const { developerId, action, targetType, targetId, metadata } = params

  try {
    const supabase = createClient()

    const { error } = await supabase.from('dev_audit_logs').insert({
      developer_id: developerId,
      action,
      target_type: targetType || null,
      target_id: targetId || null,
      metadata: metadata || {},
    })

    if (error) {
      console.error('[DevAuditLogger] Failed to log action:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[DevAuditLogger] Exception while logging action:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

interface GetDevAuditLogsClientParams {
  limit?: number
  action?: string
  developerId?: string
}

/**
 * Get dev audit logs (client-side)
 */
export async function getDevAuditLogsClient(
  params: GetDevAuditLogsClientParams = {}
): Promise<{ data: unknown[] | null; error: unknown }> {
  const { limit = 100, action, developerId } = params

  try {
    const supabase = createClient()

    let query = supabase
      .from('dev_audit_logs')
      .select(`
        *,
        developer:users!dev_audit_logs_developer_id_users_fkey(email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (action) {
      query = query.eq('action', action)
    }

    if (developerId) {
      query = query.eq('developer_id', developerId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[DevAuditLogger] Failed to get logs:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error('[DevAuditLogger] Exception while getting logs:', err)
    return { data: null, error: err }
  }
}
