'use client'

import { DevAuditTable } from '@/components/features/dev/dev-audit-table'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { logDevActionClient, getDevAuditLogsClient, DEV_AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/dev-audit/dev-audit-logger.client'
import type { DevAuditLog } from '@/lib/dev-audit/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, UserCheck, Building2, AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function LogsPage() {
  const [logs, setLogs] = useState<DevAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [limit, setLimit] = useState<number>(100)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    
    const { data, error } = await getDevAuditLogsClient({
      limit,
      action: actionFilter !== 'all' ? actionFilter : undefined,
    })

    if (error) {
      console.error('Failed to fetch logs:', error)
    } else {
      // Cast to DevAuditLog since the query returns full records
      setLogs((data as unknown as DevAuditLog[]) || [])
    }

    setLoading(false)
  }, [limit, actionFilter])

  // Fetch logs when filters change
  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Log page view only once on mount
  useEffect(() => {
    let mounted = true
    
    async function logView() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user && mounted) {
        await logDevActionClient({
          developerId: user.id,
          action: DEV_AUDIT_ACTIONS.LOGS_VIEWED,
          targetType: TARGET_TYPES.LOGS,
          metadata: { page: 'audit_logs' },
        })
      }
    }
    logView()
    
    return () => {
      mounted = false
    }
  }, []) // Empty dependency array - only runs once

  // Get stats from logs
  const stats = {
    total: logs.length,
    approvals: logs.filter(l => 
      l.action === DEV_AUDIT_ACTIONS.ORG_APPROVED || 
      l.action === DEV_AUDIT_ACTIONS.ORG_REJECTED
    ).length,
    userActions: logs.filter(l => 
      l.action === DEV_AUDIT_ACTIONS.USER_VIEWED || 
      l.action === DEV_AUDIT_ACTIONS.USER_LIST_VIEWED
    ).length,
    errorActions: logs.filter(l => 
      l.action === DEV_AUDIT_ACTIONS.ERROR_VIEWED || 
      l.action === DEV_AUDIT_ACTIONS.ERROR_CLEARED
    ).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Developer Audit Logs
        </h1>
        <p className="text-muted-foreground">
          Complete audit trail of all developer actions on the platform.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <ClipboardList className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">In current view</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Actions</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvals}</div>
            <p className="text-xs text-muted-foreground">Approvals & rejections</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Actions</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userActions}</div>
            <p className="text-xs text-muted-foreground">User views & updates</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Actions</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errorActions}</div>
            <p className="text-xs text-muted-foreground">Error views & resolutions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value={DEV_AUDIT_ACTIONS.ORG_APPROVED}>Org Approved</SelectItem>
            <SelectItem value={DEV_AUDIT_ACTIONS.ORG_REJECTED}>Org Rejected</SelectItem>
            <SelectItem value={DEV_AUDIT_ACTIONS.ORG_VIEWED}>Org Viewed</SelectItem>
            <SelectItem value={DEV_AUDIT_ACTIONS.USER_VIEWED}>User Viewed</SelectItem>
            <SelectItem value={DEV_AUDIT_ACTIONS.USER_LIST_VIEWED}>User List Viewed</SelectItem>
            <SelectItem value={DEV_AUDIT_ACTIONS.ERROR_VIEWED}>Error Viewed</SelectItem>
            <SelectItem value={DEV_AUDIT_ACTIONS.ERROR_CLEARED}>Error Cleared</SelectItem>
            <SelectItem value={DEV_AUDIT_ACTIONS.DASHBOARD_VIEWED}>Dashboard Viewed</SelectItem>
            <SelectItem value={DEV_AUDIT_ACTIONS.LOGS_VIEWED}>Logs Viewed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Results limit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">Last 50</SelectItem>
            <SelectItem value="100">Last 100</SelectItem>
            <SelectItem value="250">Last 250</SelectItem>
            <SelectItem value="500">Last 500</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Logs Table */}
      <div className="rounded-lg border border-purple-200 bg-white p-6 dark:border-purple-800 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <DevAuditTable logs={logs} />
        )}
      </div>
    </div>
  )
}
