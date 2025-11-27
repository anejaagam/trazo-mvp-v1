import { createClient } from '@/lib/supabase/server'
import { OrgApprovalTable } from '@/components/features/dev/org-approval-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { logDevAction, DEV_AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/dev-audit'
import {
  getPendingOrganizations,
  getApprovalHistory,
} from '@/lib/supabase/queries/organization-approval'
import { Building2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'

export const metadata = {
  title: 'Approvals | Dev Dashboard',
  description: 'Approve or reject organization applications',
}

export default async function ApprovalsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Log page view
  if (user) {
    await logDevAction({
      developerId: user.id,
      action: DEV_AUDIT_ACTIONS.ORG_VIEWED,
      targetType: TARGET_TYPES.ORGANIZATION,
      metadata: { page: 'approvals_list' },
    })
  }

  // Fetch pending and history
  const [pendingResult, historyResult] = await Promise.all([
    getPendingOrganizations(),
    getApprovalHistory({ limit: 50 }),
  ])

  const pendingOrgs = pendingResult.data || []
  const historyOrgs = historyResult.data || []

  const getJurisdictionLabel = (jurisdiction: string) => {
    const labels: Record<string, string> = {
      'oregon_cannabis': 'Oregon Cannabis',
      'maryland_cannabis': 'Maryland Cannabis',
      'canada_cannabis': 'Canada Cannabis',
      'primus_gfs': 'PrimusGFS',
    }
    return labels[jurisdiction] || jurisdiction
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Organization Approvals
        </h1>
        <p className="text-muted-foreground">
          Review and approve organizations signing up for the TRAZO platform.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-purple-100 dark:bg-purple-900/30">
          <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-purple-800">
            <Clock className="h-4 w-4" />
            Pending
            {pendingOrgs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {pendingOrgs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-purple-800">
            <CheckCircle2 className="h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-purple-800">
            <XCircle className="h-4 w-4" />
            Rejected
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending">
          {user && (
            <OrgApprovalTable organizations={pendingOrgs} developerId={user.id} />
          )}
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved">
          {historyOrgs.filter(org => org.approval_status === 'approved').length > 0 ? (
            <div className="rounded-lg border border-purple-200 dark:border-purple-800">
              <Table>
                <TableHeader>
                  <TableRow className="bg-purple-50 dark:bg-purple-900/20">
                    <TableHead>Organization</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead>Approved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyOrgs
                    .filter(org => org.approval_status === 'approved')
                    .map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{org.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {org.contact_email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getJurisdictionLabel(org.jurisdiction)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {org.approver?.full_name || 'Unknown'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {org.approved_at
                              ? formatDistanceToNow(new Date(org.approved_at), { addSuffix: true })
                              : '—'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-purple-200 bg-purple-50/50 py-12 dark:border-purple-800 dark:bg-purple-900/10">
              <CheckCircle2 className="mb-3 h-10 w-10 text-green-400" />
              <p className="text-sm text-muted-foreground">No approved organizations yet</p>
            </div>
          )}
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected">
          {historyOrgs.filter(org => org.approval_status === 'rejected').length > 0 ? (
            <div className="rounded-lg border border-purple-200 dark:border-purple-800">
              <Table>
                <TableHeader>
                  <TableRow className="bg-purple-50 dark:bg-purple-900/20">
                    <TableHead>Organization</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Rejected By</TableHead>
                    <TableHead>Rejected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyOrgs
                    .filter(org => org.approval_status === 'rejected')
                    .map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{org.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {org.contact_email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getJurisdictionLabel(org.jurisdiction)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {org.approver?.full_name || 'Unknown'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {org.approved_at
                              ? formatDistanceToNow(new Date(org.approved_at), { addSuffix: true })
                              : '—'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-purple-200 bg-purple-50/50 py-12 dark:border-purple-800 dark:bg-purple-900/10">
              <XCircle className="mb-3 h-10 w-10 text-gray-400" />
              <p className="text-sm text-muted-foreground">No rejected organizations</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
