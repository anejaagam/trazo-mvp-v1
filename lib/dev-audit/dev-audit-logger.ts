// Dev audit logger for tracking developer actions in the dev dashboard
// All actions are persisted to dev_audit_logs table for accountability
// NOTE: This file is for SERVER-SIDE use only. For client components, use dev-audit-logger.client.ts

import { createClient } from '@/lib/supabase/server'
import type { LogDevActionParams } from './actions'

/**
 * Log a developer action to the dev_audit_logs table (server-side)
 */
export async function logDevAction(
  params: LogDevActionParams
): Promise<{ success: boolean; error?: string }> {
  const { developerId, action, targetType, targetId, metadata } = params

  try {
    const supabase = await createClient()

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

/**
 * Get recent dev audit logs
 */
export async function getDevAuditLogs(options?: {
  limit?: number
  developerId?: string
  action?: string
  targetType?: string
}): Promise<{ data: LogDevActionParams[] | null; error: string | null }> {
  const { limit = 100, developerId, action, targetType } = options || {}

  try {
    const supabase = await createClient()

    let query = supabase
      .from('dev_audit_logs')
      .select(`
        *,
        developer:users!developer_id(email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (developerId) {
      query = query.eq('developer_id', developerId)
    }
    if (action) {
      query = query.eq('action', action)
    }
    if (targetType) {
      query = query.eq('target_type', targetType)
    }

    const { data, error } = await query

    if (error) {
      console.error('[DevAuditLogger] Failed to fetch audit logs:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('[DevAuditLogger] Exception while fetching logs:', err)
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Get audit log statistics for a developer
 */
export async function getDevAuditStats(developerId: string): Promise<{
  data: { action: string; count: number }[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('dev_audit_logs')
      .select('action')
      .eq('developer_id', developerId)

    if (error) {
      return { data: null, error: error.message }
    }

    // Count actions
    const counts: Record<string, number> = {}
    data?.forEach((log) => {
      counts[log.action] = (counts[log.action] || 0) + 1
    })

    const stats = Object.entries(counts).map(([action, count]) => ({
      action,
      count,
    }))

    return { data: stats, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
