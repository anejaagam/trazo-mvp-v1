/**
 * Waste Management Database Queries (Client-Side)
 * 
 * Client-safe queries and real-time subscriptions for waste_logs
 * Use this file in client components, use waste.ts for server components
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type {
  WasteLog,
  WasteLogWithRelations,
  CreateWasteLogInput,
  WasteLogFilters,
  WasteSummary,
  QueryResult,
} from '@/types/waste'

// ============================================================================
// CLIENT-SAFE CRUD OPERATIONS
// ============================================================================

/**
 * Create a waste log from client component
 */
export async function createWasteLogClient(
  input: CreateWasteLogInput
): Promise<QueryResult<WasteLog>> {
  try {
    const supabase = createClient()
    
    const wasteLogData = {
      ...input,
      photo_urls: input.photo_urls || [],
      witness_id_verified: input.witness_id_verified || false,
      rendered_unusable: input.rendered_unusable || false,
      metrc_sync_status: 'pending' as const,
      disposed_at: input.disposed_at || new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('waste_logs')
      .insert(wasteLogData)
      .select()
      .single()

    if (error) throw error
    return { data: data as WasteLog, error: null }
  } catch (error) {
    console.error('Error in createWasteLogClient:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update a waste log from client component
 */
export async function updateWasteLogClient(
  id: string,
  updates: Partial<WasteLog>
): Promise<QueryResult<WasteLog>> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('waste_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: data as WasteLog, error: null }
  } catch (error) {
    console.error('Error in updateWasteLogClient:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Mark cannabis waste as rendered unusable
 */
export async function markAsRendered(
  id: string,
  renderingMethod: string,
  wasteMaterialMixed?: string,
  mixRatio?: string
): Promise<QueryResult<WasteLog>> {
  try {
    const supabase = createClient()
    
    const updates: Partial<WasteLog> = {
      rendered_unusable: true,
      rendering_method: renderingMethod as any,
    }

    if (wasteMaterialMixed) updates.waste_material_mixed = wasteMaterialMixed
    if (mixRatio) updates.mix_ratio = mixRatio
    
    const { data, error } = await supabase
      .from('waste_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: data as WasteLog, error: null }
  } catch (error) {
    console.error('Error in markAsRendered:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Acknowledge/view a waste log (marks as seen by user)
 */
export async function acknowledgeWasteLog(id: string): Promise<QueryResult<void>> {
  try {
    // Could add an acknowledgment tracking field in future
    // For now, this is a placeholder
    console.log('Waste log acknowledged:', id)
    return { data: null, error: null }
  } catch (error) {
    console.error('Error in acknowledgeWasteLog:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// REACT HOOKS FOR CLIENT COMPONENTS
// ============================================================================

/**
 * Hook to fetch and subscribe to waste logs for a site
 */
export function useWasteLogs(siteId: string, filters?: WasteLogFilters) {
  const [data, setData] = useState<WasteLogWithRelations[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Initial fetch
    const fetchWasteLogs = async () => {
      try {
        setIsLoading(true)
        
        let query = supabase
          .from('waste_logs')
          .select(`
            *,
            performer:users!waste_logs_performed_by_fkey(id, full_name, email),
            witness:users!waste_logs_witnessed_by_fkey(id, full_name, email),
            batch:batches(id, batch_number, cultivar:cultivars(name)),
            inventory_item:inventory_items(id, name, sku)
          `)
          .eq('site_id', siteId)
          .order('disposed_at', { ascending: false })

        // Apply filters
        if (filters?.waste_type && filters.waste_type.length > 0) {
          query = query.in('waste_type', filters.waste_type)
        }

        if (filters?.date_range) {
          query = query
            .gte('disposed_at', filters.date_range.start)
            .lte('disposed_at', filters.date_range.end)
        }

        if (filters?.metrc_sync_status && filters.metrc_sync_status.length > 0) {
          query = query.in('metrc_sync_status', filters.metrc_sync_status)
        }

        const { data: wasteLogs, error: fetchError } = await query

        if (fetchError) throw fetchError
        setData(wasteLogs as WasteLogWithRelations[])
        setError(null)
      } catch (err) {
        console.error('Error fetching waste logs:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWasteLogs()

    // Set up real-time subscription
    const channel = supabase
      .channel(`waste_logs_${siteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waste_logs',
          filter: `site_id=eq.${siteId}`,
        },
        () => {
          // Refetch data when changes occur
          fetchWasteLogs()
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, filters?.waste_type, filters?.date_range?.start, filters?.date_range?.end, filters?.metrc_sync_status])

  return { data, isLoading, error }
}

/**
 * Hook to fetch and subscribe to a single waste log
 */
export function useWasteLog(id: string) {
  const [data, setData] = useState<WasteLogWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    // Initial fetch
    const fetchWasteLog = async () => {
      try {
        setIsLoading(true)
        
        const { data: wasteLog, error: fetchError } = await supabase
          .from('waste_logs')
          .select(`
            *,
            performer:users!waste_logs_performed_by_fkey(id, full_name, email),
            witness:users!waste_logs_witnessed_by_fkey(id, full_name, email),
            batch:batches(id, batch_number, cultivar:cultivars(name)),
            inventory_item:inventory_items(id, name, sku),
            inventory_lot:inventory_lots(id, lot_code)
          `)
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError
        setData(wasteLog as WasteLogWithRelations)
        setError(null)
      } catch (err) {
        console.error('Error fetching waste log:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWasteLog()

    // Set up real-time subscription
    const channel = supabase
      .channel(`waste_log_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waste_logs',
          filter: `id=eq.${id}`,
        },
        () => {
          // Refetch data when changes occur
          fetchWasteLog()
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  return { data, isLoading, error }
}

/**
 * Hook to fetch waste summary for analytics
 */
export function useWasteSummary(
  siteId: string,
  dateRange?: { start: string; end: string }
) {
  const [data, setData] = useState<WasteSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchSummary = async () => {
      try {
        setIsLoading(true)
        
        let query = supabase
          .from('waste_summary')
          .select('*')
          .eq('site_id', siteId)

        if (dateRange) {
          query = query
            .gte('month', dateRange.start)
            .lte('month', dateRange.end)
        } else {
          // Default to current month
          const now = new Date()
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          query = query.eq('month', monthStart)
        }

        const { data: summary, error: fetchError } = await query.maybeSingle()

        if (fetchError) throw fetchError
        setData(summary)
        setError(null)
      } catch (err) {
        console.error('Error fetching waste summary:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, dateRange?.start, dateRange?.end])

  return { data, isLoading, error }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS (Advanced)
// ============================================================================

/**
 * Subscribe to waste log changes with custom callback
 */
export function subscribeToWasteLogs(
  siteId: string,
  callback: (payload: RealtimePostgresChangesPayload<WasteLog>) => void
): RealtimeChannel {
  const supabase = createClient()
  
  const channel = supabase
    .channel('waste_logs_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'waste_logs',
        filter: `site_id=eq.${siteId}`,
      },
      callback
    )
    .subscribe()
  
  return channel
}

/**
 * Subscribe to a specific waste log
 */
export function subscribeToWasteLog(
  id: string,
  callback: (payload: RealtimePostgresChangesPayload<WasteLog>) => void
): RealtimeChannel {
  const supabase = createClient()
  
  const channel = supabase
    .channel(`waste_log_${id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'waste_logs',
        filter: `id=eq.${id}`,
      },
      callback
    )
    .subscribe()
  
  return channel
}

/**
 * Subscribe to compliance alerts (unrendered, unwitnessed)
 */
export function subscribeToComplianceAlerts(
  siteId: string,
  callback: (payload: RealtimePostgresChangesPayload<WasteLog>) => void
): RealtimeChannel {
  const supabase = createClient()
  
  // Subscribe to new waste logs that don't meet compliance
  const channel = supabase
    .channel('compliance_alerts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'waste_logs',
        filter: `site_id=eq.${siteId}`,
      },
      (payload) => {
        const wasteLog = payload.new as WasteLog
        
        // Check if cannabis waste is non-compliant
        if (
          (wasteLog.waste_type === 'plant_material' || wasteLog.waste_type === 'trim') &&
          (!wasteLog.rendered_unusable || !wasteLog.witnessed_by)
        ) {
          callback(payload as RealtimePostgresChangesPayload<WasteLog>)
        }
      }
    )
    .subscribe()
  
  return channel
}

// ============================================================================
// FILE UPLOAD HELPERS (Supabase Storage)
// ============================================================================

/**
 * Upload photo evidence to Supabase Storage
 */
export async function uploadWastePhoto(
  file: File,
  wasteLogId: string,
  label: 'before' | 'after' | 'process' | 'other' = 'other'
): Promise<QueryResult<string>> {
  try {
    const supabase = createClient()
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${wasteLogId}/${label}-${Date.now()}.${fileExt}`
    
    // Ensure we have a valid image MIME type
    let contentType = file.type
    
    if (!contentType || contentType === 'application/json' || !contentType.startsWith('image/')) {
      // Fallback to extension-based MIME type
      const mimeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp'
      }
      contentType = mimeMap[fileExt] || 'image/jpeg'
    }
    
    console.log('Uploading file:', file.name, 'Type:', contentType, 'Size:', file.size, 'bytes')
    
    // Get auth token and project URL
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('No active session')
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured')
    }
    
    // Use direct HTTP upload bypassing the Supabase client
    const uploadUrl = `${supabaseUrl}/storage/v1/object/waste-photos/${fileName}`
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': contentType,
        'x-upsert': 'false',
        'cache-control': 'max-age=3600'
      },
      body: file
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(errorData.message || `Upload failed with status ${response.status}`)
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('waste-photos')
      .getPublicUrl(fileName)

    return { data: urlData.publicUrl, error: null }
  } catch (error) {
    console.error('Error uploading waste photo:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Upload witness signature to Supabase Storage
 */
export async function uploadWitnessSignature(
  signatureDataUrl: string,
  wasteLogId: string
): Promise<QueryResult<string>> {
  try {
    const supabase = createClient()
    
    // Convert data URL to blob
    const response = await fetch(signatureDataUrl)
    const blob = await response.blob()
    
    const fileName = `${wasteLogId}/signature-${Date.now()}.png`
    
    // Get auth token and project URL
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('No active session')
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured')
    }
    
    // Use direct HTTP upload bypassing the Supabase client
    const uploadUrl = `${supabaseUrl}/storage/v1/object/waste-signatures/${fileName}`
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'image/png',
        'x-upsert': 'false',
        'cache-control': 'max-age=3600'
      },
      body: blob
    })
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({ message: uploadResponse.statusText }))
      throw new Error(errorData.message || `Upload failed with status ${uploadResponse.status}`)
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('waste-signatures')
      .getPublicUrl(fileName)

    return { data: urlData.publicUrl, error: null }
  } catch (error) {
    console.error('Error uploading witness signature:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Delete waste photo from storage
 */
export async function deleteWastePhoto(url: string): Promise<QueryResult<void>> {
  try {
    const supabase = createClient()
    
    // Extract file path from URL
    const urlParts = url.split('/waste-photos/')
    if (urlParts.length < 2) {
      throw new Error('Invalid photo URL')
    }
    
    const filePath = urlParts[1]
    
    const { error } = await supabase.storage
      .from('waste-photos')
      .remove([filePath])

    if (error) throw error
    return { data: null, error: null }
  } catch (error) {
    console.error('Error deleting waste photo:', error)
    return { data: null, error: error as Error }
  }
}
