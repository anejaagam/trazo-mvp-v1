'use client'

import { ErrorStreamViewer } from '@/components/features/dev/error-stream-viewer'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { logDevActionClient, DEV_AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/dev-audit/dev-audit-logger.client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, AlertCircle, AlertOctagon, Info } from 'lucide-react'
import type { ErrorLog } from '@/lib/errors'

export default function ErrorsPage() {
  const [metrics, setMetrics] = useState({
    critical: 0,
    error: 0,
    warning: 0,
    info: 0,
    total24h: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    const supabase = createClient()

    // Get counts for last 24 hours by severity
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('error_logs')
      .select('severity')
      .gte('created_at', oneDayAgo)

    if (error) {
      console.error('Failed to fetch error metrics:', error)
      return
    }

    const counts = {
      critical: 0,
      error: 0,
      warning: 0,
      info: 0,
      total24h: data?.length || 0,
    }

    data?.forEach((log: Pick<ErrorLog, 'severity'>) => {
      if (log.severity in counts) {
        counts[log.severity as keyof Omit<typeof counts, 'total24h'>]++
      }
    })

    setMetrics(counts)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMetrics()

    // Log page view
    async function logView() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await logDevActionClient({
          developerId: user.id,
          action: DEV_AUDIT_ACTIONS.ERROR_VIEWED,
          targetType: TARGET_TYPES.ERROR,
          metadata: { page: 'errors_list' },
        })
      }
    }
    logView()

    // Refresh metrics every minute
    const interval = setInterval(fetchMetrics, 60000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Error Monitoring
        </h1>
        <p className="text-muted-foreground">
          Real-time error tracking across the TRAZO platform. Critical errors trigger instant notifications.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">
              Critical (24h)
            </CardTitle>
            <AlertOctagon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {loading ? '—' : metrics.critical}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Errors (24h)
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {loading ? '—' : metrics.error}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Warnings (24h)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {loading ? '—' : metrics.warning}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Info (24h)
            </CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {loading ? '—' : metrics.info}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Error Stream */}
      <div className="rounded-lg border border-purple-200 bg-white p-6 dark:border-purple-800 dark:bg-gray-900">
        <ErrorStreamViewer />
      </div>
    </div>
  )
}
