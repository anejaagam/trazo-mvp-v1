/**
 * Supabase query functions for audit logging
 * These functions interact with the audit_log table
 */

import { createClient } from '@/lib/supabase/server';
import type {
  AuditEvent,
  AuditEventWithUser,
  AuditFilters,
  PaginationParams,
  PaginatedResponse,
} from '@/types/admin';

/**
 * Get audit logs with optional filtering and pagination
 */
export async function getAuditLogs(
  filters: AuditFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResponse<AuditEventWithUser>> {
  const supabase = await createClient();
  
  const page = pagination.page || 1;
  const per_page = pagination.per_page || 50;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = supabase
    .from('audit_log')
    .select(`
      *,
      user:users(id, full_name, email)
    `, { count: 'exact' });

  // Apply filters
  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }
  if (filters.entity_type) {
    query = query.eq('entity_type', filters.entity_type);
  }
  if (filters.action) {
    query = query.eq('action', filters.action);
  }
  if (filters.start_date) {
    query = query.gte('timestamp', filters.start_date);
  }
  if (filters.end_date) {
    query = query.lte('timestamp', filters.end_date);
  }

  // Apply pagination and ordering
  query = query
    .range(from, to)
    .order('timestamp', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return {
    data: (data as AuditEventWithUser[]) || [],
    total: count || 0,
    page,
    per_page,
    total_pages: Math.ceil((count || 0) / per_page),
  };
}

/**
 * Get a single audit event by ID
 */
export async function getAuditEventById(eventId: string): Promise<AuditEventWithUser | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_log')
    .select(`
      *,
      user:users(id, full_name, email)
    `)
    .eq('id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch audit event: ${error.message}`);
  }

  return data as AuditEventWithUser;
}

/**
 * Log an audit event
 * This is the primary function for creating audit trail entries
 */
export async function logAuditEvent(
  userId: string,
  entityType: string,
  entityId: string,
  action: string,
  changes?: Record<string, unknown>,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<AuditEvent> {
  const supabase = await createClient();

  // Get user's organization_id
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (!userData?.organization_id) {
    throw new Error('User organization not found');
  }

  const { data, error } = await supabase
    .from('audit_log')
    .insert({
      organization_id: userData.organization_id,
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_values: changes || null,
      new_values: metadata || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to log audit event: ${error.message}`);
  }

  return data as AuditEvent;
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLog(
  entityType: string,
  entityId: string,
  limit = 50
): Promise<AuditEventWithUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_log')
    .select(`
      *,
      user:users(id, full_name, email)
    `)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch entity audit log: ${error.message}`);
  }

  return (data as AuditEventWithUser[]) || [];
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLog(
  userId: string,
  limit = 50
): Promise<AuditEventWithUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_log')
    .select(`
      *,
      user:users(id, full_name, email)
    `)
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch user audit log: ${error.message}`);
  }

  return (data as AuditEventWithUser[]) || [];
}

/**
 * Get recent audit activity (last 24 hours by default)
 */
export async function getRecentActivity(hours = 24, limit = 100): Promise<AuditEventWithUser[]> {
  const supabase = await createClient();
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('audit_log')
    .select(`
      *,
      user:users(id, full_name, email)
    `)
    .gte('timestamp', startDate)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recent activity: ${error.message}`);
  }

  return (data as AuditEventWithUser[]) || [];
}

/**
 * Get audit activity grouped by action type
 */
export async function getAuditActivityByAction(
  startDate?: string,
  endDate?: string
): Promise<Array<{ action: string; count: number }>> {
  const supabase = await createClient();

  let query = supabase
    .from('audit_log')
    .select('action');

  if (startDate) {
    query = query.gte('timestamp', startDate);
  }
  if (endDate) {
    query = query.lte('timestamp', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch audit activity by action: ${error.message}`);
  }

  // Group and count by action
  const actionCounts: Record<string, number> = {};
  data?.forEach((event: { action: string }) => {
    actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
  });

  return Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get audit activity grouped by entity type
 */
export async function getAuditActivityByEntityType(
  startDate?: string,
  endDate?: string
): Promise<Array<{ entity_type: string; count: number }>> {
  const supabase = await createClient();

  let query = supabase
    .from('audit_log')
    .select('entity_type');

  if (startDate) {
    query = query.gte('timestamp', startDate);
  }
  if (endDate) {
    query = query.lte('timestamp', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch audit activity by entity type: ${error.message}`);
  }

  // Group and count by entity type
  const entityCounts: Record<string, number> = {};
  data?.forEach((event: { entity_type: string }) => {
    entityCounts[event.entity_type] = (entityCounts[event.entity_type] || 0) + 1;
  });

  return Object.entries(entityCounts)
    .map(([entity_type, count]) => ({ entity_type, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get audit log count for a date range
 */
export async function getAuditLogCount(
  startDate?: string,
  endDate?: string
): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from('audit_log')
    .select('id', { count: 'exact', head: true });

  if (startDate) {
    query = query.gte('timestamp', startDate);
  }
  if (endDate) {
    query = query.lte('timestamp', endDate);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch audit log count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Search audit logs by text (searches in action, entity_type, and metadata)
 */
export async function searchAuditLogs(
  searchTerm: string,
  limit = 50
): Promise<AuditEventWithUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_log')
    .select(`
      *,
      user:users(id, full_name, email)
    `)
    .or(`action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%`)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search audit logs: ${error.message}`);
  }

  return (data as AuditEventWithUser[]) || [];
}
