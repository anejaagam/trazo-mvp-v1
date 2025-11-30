import { createClient } from '@/lib/supabase/server'
import { PlatformMetricsCards } from '@/components/features/dev/platform-metrics-cards'
import { OrgApprovalTable } from '@/components/features/dev/org-approval-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { logDevAction, DEV_AUDIT_ACTIONS } from '@/lib/dev-audit'
import type { OrganizationWithApproval } from '@/lib/supabase/queries/organization-approval'
import Link from 'next/link'
import { ArrowRight, AlertTriangle } from 'lucide-react'

export default async function DevDashboardPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Log dashboard view
  if (user) {
    await logDevAction({
      developerId: user.id,
      action: DEV_AUDIT_ACTIONS.DASHBOARD_VIEWED,
    })
  }

  // Fetch metrics
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    pendingResult,
    approvedResult,
    rejectedResult,
    usersResult,
    errorsResult,
    criticalResult,
  ] = await Promise.all([
    supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved'),
    supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('approval_status', 'rejected'),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('error_logs').select('id', { count: 'exact', head: true }).gte('created_at', twentyFourHoursAgo),
    supabase.from('error_logs').select('id', { count: 'exact', head: true }).eq('severity', 'critical').gte('created_at', twentyFourHoursAgo),
  ])

  const metrics = {
    pendingApprovals: pendingResult.count || 0,
    approvedOrgs: approvedResult.count || 0,
    rejectedOrgs: rejectedResult.count || 0,
    totalUsers: usersResult.count || 0,
    errorsLast24h: errorsResult.count || 0,
    criticalErrors: criticalResult.count || 0,
  }

  // Get pending organizations for quick view (using server client directly)
  const { data: pendingOrgs, error: pendingOrgsError } = await supabase
    .from('organizations')
    .select(`
      *,
      approver:users!organizations_approved_by_users_fkey(email, full_name)
    `)
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false })

  if (pendingOrgsError) {
    console.error('Failed to fetch pending orgs:', pendingOrgsError)
  }

  const typedPendingOrgs = (pendingOrgs || []) as OrganizationWithApproval[]

  // Get recent critical errors
  const { data: recentCriticalErrors } = await supabase
    .from('error_logs')
    .select('id, message, route, created_at')
    .eq('severity', 'critical')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Developer Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor platform health, approve organizations, and track errors.
        </p>
      </div>

      {/* Metrics Grid */}
      <PlatformMetricsCards metrics={metrics} />

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approvals */}
        <Card className="border-purple-100 dark:border-purple-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pending Approvals</CardTitle>
              <CardDescription>
                Organizations waiting for review
              </CardDescription>
            </div>
            {(typedPendingOrgs.length || 0) > 0 && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                {typedPendingOrgs.length} pending
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {typedPendingOrgs.length > 0 && user ? (
              <div className="space-y-4">
                <OrgApprovalTable
                  organizations={typedPendingOrgs.slice(0, 3)}
                  developerId={user.id}
                />
                {typedPendingOrgs.length > 3 && (
                  <Link
                    href="/dev-dashboard/approvals"
                    className="flex items-center justify-center gap-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
                  >
                    View all {typedPendingOrgs.length} pending
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No pending approvals</p>
                <p className="text-xs text-muted-foreground">All caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Critical Errors */}
        <Card className="border-purple-100 dark:border-purple-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Critical Errors</CardTitle>
              <CardDescription>
                Errors requiring immediate attention
              </CardDescription>
            </div>
            {metrics.criticalErrors > 0 && (
              <Badge variant="destructive">
                {metrics.criticalErrors} critical
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {recentCriticalErrors && recentCriticalErrors.length > 0 ? (
              <div className="space-y-3">
                {recentCriticalErrors.map((error) => (
                  <div
                    key={error.id}
                    className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-red-800 dark:text-red-300">
                        {error.message}
                      </p>
                      {error.route && (
                        <p className="truncate text-xs text-red-600 dark:text-red-400">
                          {error.route}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <Link
                  href="/dev-dashboard/errors"
                  className="flex items-center justify-center gap-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  View all errors
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="mb-2 h-8 w-8 text-green-400" />
                <p className="text-sm text-muted-foreground">No critical errors</p>
                <p className="text-xs text-muted-foreground">Platform is healthy</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
