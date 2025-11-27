// Organization approval queries for Dev Dashboard
// Used by developers to approve/reject organizations signing up for the platform

import { createClient } from '@/lib/supabase/client'
import { logDevActionClient, DEV_AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/dev-audit/dev-audit-logger.client'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface OrganizationWithApproval {
  id: string
  name: string
  data_region: 'us' | 'canada'
  jurisdiction: string
  plant_type: 'cannabis' | 'produce'
  license_number: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  timezone: string
  is_active: boolean
  approval_status: ApprovalStatus
  approved_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  approver?: {
    email: string
    full_name: string
  } | null
  user_count?: number
}

/**
 * Get all pending organizations awaiting approval
 */
export async function getPendingOrganizations(): Promise<{
  data: OrganizationWithApproval[] | null
  error: string | null
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        approver:users!approved_by(email, full_name)
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[OrgApproval] Failed to fetch pending orgs:', error)
      return { data: null, error: error.message }
    }

    return { data: data as OrganizationWithApproval[], error: null }
  } catch (err) {
    console.error('[OrgApproval] Exception fetching pending orgs:', err)
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Get approval history (approved and rejected organizations)
 */
export async function getApprovalHistory(options?: {
  limit?: number
  status?: 'approved' | 'rejected'
}): Promise<{
  data: OrganizationWithApproval[] | null
  error: string | null
}> {
  const { limit = 50, status } = options || {}

  try {
    const supabase = createClient()

    let query = supabase
      .from('organizations')
      .select(`
        *,
        approver:users!approved_by(email, full_name)
      `)
      .neq('approval_status', 'pending')
      .order('approved_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('approval_status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[OrgApproval] Failed to fetch approval history:', error)
      return { data: null, error: error.message }
    }

    return { data: data as OrganizationWithApproval[], error: null }
  } catch (err) {
    console.error('[OrgApproval] Exception fetching approval history:', err)
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Approve an organization
 */
export async function approveOrganization(
  orgId: string,
  developerId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('organizations')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: developerId,
      })
      .eq('id', orgId)

    if (error) {
      console.error('[OrgApproval] Failed to approve org:', error)
      return { success: false, error: error.message }
    }

    // Log the action
    await logDevActionClient({
      developerId,
      action: DEV_AUDIT_ACTIONS.ORG_APPROVED,
      targetType: TARGET_TYPES.ORGANIZATION,
      targetId: orgId,
      metadata: { approved_at: new Date().toISOString() },
    })

    return { success: true, error: null }
  } catch (err) {
    console.error('[OrgApproval] Exception approving org:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Reject an organization
 */
export async function rejectOrganization(
  orgId: string,
  developerId: string,
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('organizations')
      .update({
        approval_status: 'rejected',
        approved_at: new Date().toISOString(),
        approved_by: developerId,
      })
      .eq('id', orgId)

    if (error) {
      console.error('[OrgApproval] Failed to reject org:', error)
      return { success: false, error: error.message }
    }

    // Log the action
    await logDevActionClient({
      developerId,
      action: DEV_AUDIT_ACTIONS.ORG_REJECTED,
      targetType: TARGET_TYPES.ORGANIZATION,
      targetId: orgId,
      metadata: { 
        rejected_at: new Date().toISOString(),
        reason: reason || null,
      },
    })

    return { success: true, error: null }
  } catch (err) {
    console.error('[OrgApproval] Exception rejecting org:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Get organization by ID with approval status
 */
export async function getOrganizationById(
  orgId: string
): Promise<{ data: OrganizationWithApproval | null; error: string | null }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        approver:users!approved_by(email, full_name)
      `)
      .eq('id', orgId)
      .single()

    if (error) {
      console.error('[OrgApproval] Failed to fetch org:', error)
      return { data: null, error: error.message }
    }

    return { data: data as OrganizationWithApproval, error: null }
  } catch (err) {
    console.error('[OrgApproval] Exception fetching org:', err)
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Get approval statistics
 */
export async function getApprovalStats(): Promise<{
  data: {
    pending: number
    approved: number
    rejected: number
    total: number
  } | null
  error: string | null
}> {
  try {
    const supabase = createClient()

    const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
      supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('approval_status', 'pending'),
      supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('approval_status', 'approved'),
      supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('approval_status', 'rejected'),
    ])

    if (pendingResult.error || approvedResult.error || rejectedResult.error) {
      const error = pendingResult.error || approvedResult.error || rejectedResult.error
      return { data: null, error: error!.message }
    }

    const pending = pendingResult.count || 0
    const approved = approvedResult.count || 0
    const rejected = rejectedResult.count || 0

    return {
      data: {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected,
      },
      error: null,
    }
  } catch (err) {
    console.error('[OrgApproval] Exception fetching stats:', err)
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Get all organizations with approval info (for dev dashboard overview)
 */
export async function getAllOrganizations(options?: {
  limit?: number
  status?: ApprovalStatus
}): Promise<{
  data: OrganizationWithApproval[] | null
  error: string | null
}> {
  const { limit = 100, status } = options || {}

  try {
    const supabase = createClient()

    let query = supabase
      .from('organizations')
      .select(`
        *,
        approver:users!approved_by(email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('approval_status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[OrgApproval] Failed to fetch all orgs:', error)
      return { data: null, error: error.message }
    }

    return { data: data as OrganizationWithApproval[], error: null }
  } catch (err) {
    console.error('[OrgApproval] Exception fetching all orgs:', err)
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
