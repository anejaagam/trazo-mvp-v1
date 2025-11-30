'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ErrorLog, ErrorSeverity } from '@/lib/errors/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseErrorStreamOptions {
  /** Filter errors by severity levels */
  severityFilter?: ErrorSeverity[]
  /** Maximum number of errors to keep in memory */
  maxErrors?: number
  /** Whether to show toast notifications for critical errors */
  showCriticalNotifications?: boolean
  /** Initial errors to load on mount */
  loadInitial?: boolean
  /** Number of initial errors to load */
  initialLimit?: number
}

interface UseErrorStreamReturn {
  /** Array of error logs */
  errors: ErrorLog[]
  /** Whether the realtime connection is active */
  isConnected: boolean
  /** Connection status: 'connecting' | 'connected' | 'disconnected' | 'error' */
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  /** Clear all errors from the local state */
  clearErrors: () => void
  /** Delete all errors from the database */
  deleteAllErrors: () => Promise<void>
  /** Loading state for initial fetch */
  isLoading: boolean
  /** Error message if connection failed */
  connectionError: string | null
}

/**
 * Hook for real-time error log streaming from Supabase
 * Subscribes to the error_logs table and receives live updates
 */
export function useErrorStream(options: UseErrorStreamOptions = {}): UseErrorStreamReturn {
  const {
    severityFilter,
    maxErrors = 500,
    showCriticalNotifications = true,
    loadInitial = true,
    initialLimit = 100,
  } = options

  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  const [isLoading, setIsLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  // Load initial errors
  const loadInitialErrors = useCallback(async () => {
    if (!loadInitial) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      let query = supabaseRef.current
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(initialLimit)

      if (severityFilter && severityFilter.length > 0) {
        query = query.in('severity', severityFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('[useErrorStream] Failed to load initial errors:', error)
        setConnectionError(error.message)
      } else if (data) {
        setErrors(data as ErrorLog[])
      }
    } catch (err) {
      console.error('[useErrorStream] Exception loading initial errors:', err)
      setConnectionError(err instanceof Error ? err.message : 'Failed to load errors')
    } finally {
      setIsLoading(false)
    }
  }, [loadInitial, initialLimit, severityFilter])

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = supabaseRef.current

    // Load initial errors
    loadInitialErrors()

    // Set up realtime subscription
    setConnectionStatus('connecting')
    
    const channel = supabase
      .channel('error_logs_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'error_logs',
        },
        (payload) => {
          const newError = payload.new as ErrorLog

          // Apply severity filter if specified
          if (severityFilter && severityFilter.length > 0) {
            if (!severityFilter.includes(newError.severity)) {
              return
            }
          }

          // Add new error to the beginning of the list
          setErrors((prev) => {
            const updated = [newError, ...prev]
            // Trim to max errors
            if (updated.length > maxErrors) {
              return updated.slice(0, maxErrors)
            }
            return updated
          })

          // Show toast for critical errors
          if (showCriticalNotifications && newError.severity === 'critical') {
            toast.error('Critical Error Detected', {
              description: newError.message.slice(0, 100) + (newError.message.length > 100 ? '...' : ''),
              duration: 10000,
              action: {
                label: 'View',
                onClick: () => {
                  // Scroll to top of error list or navigate
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                },
              },
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'error_logs',
        },
        (payload) => {
          const deletedId = payload.old?.id
          if (deletedId) {
            setErrors((prev) => prev.filter((e) => e.id !== deletedId))
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionStatus('connected')
          setConnectionError(null)
        } else if (status === 'CLOSED') {
          setIsConnected(false)
          setConnectionStatus('disconnected')
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setConnectionStatus('error')
          setConnectionError('Failed to connect to error stream')
        }
      })

    channelRef.current = channel

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [loadInitialErrors, severityFilter, maxErrors, showCriticalNotifications])

  // Clear errors from local state
  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  // Delete all errors from database
  const deleteAllErrors = useCallback(async () => {
    try {
      const { error } = await supabaseRef.current
        .from('error_logs')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (error) {
        console.error('[useErrorStream] Failed to delete errors:', error)
        toast.error('Failed to delete errors', { description: error.message })
      } else {
        setErrors([])
        toast.success('All errors cleared')
      }
    } catch (err) {
      console.error('[useErrorStream] Exception deleting errors:', err)
      toast.error('Failed to delete errors')
    }
  }, [])

  return {
    errors,
    isConnected,
    connectionStatus,
    clearErrors,
    deleteAllErrors,
    isLoading,
    connectionError,
  }
}
