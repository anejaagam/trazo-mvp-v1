'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollText } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ACTION_LABELS, type DevAuditLog } from '@/lib/dev-audit/actions'

interface DevAuditTableProps {
  logs: DevAuditLog[]
}

export function DevAuditTable({ logs }: DevAuditTableProps) {
  if (logs.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center border-dashed py-12">
        <ScrollText className="mb-3 h-10 w-10 text-purple-400" />
        <p className="text-sm text-muted-foreground">No audit logs yet</p>
        <p className="text-xs text-muted-foreground">Developer actions will appear here</p>
      </Card>
    )
  }

  const getActionBadgeColor = (action: string) => {
    if (action.includes('approved')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (action.includes('rejected')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    if (action.includes('login')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    if (action.includes('logout')) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    if (action.includes('viewed')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    if (action.includes('cleared') || action.includes('exported')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }

  return (
    <div className="rounded-lg border border-purple-200 dark:border-purple-800">
      <Table>
        <TableHeader>
          <TableRow className="bg-purple-50 dark:bg-purple-900/20">
            <TableHead>Developer</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const developer = (log as any).developer as { email: string; full_name: string } | null
            const actionLabel = ACTION_LABELS[log.action as keyof typeof ACTION_LABELS] || log.action

            return (
              <TableRow key={log.id}>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">
                      {developer?.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {developer?.email || log.developer_id.slice(0, 8) + '...'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={getActionBadgeColor(log.action)}
                  >
                    {actionLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.target_type && log.target_id ? (
                    <div>
                      <p className="text-xs font-medium capitalize">{log.target_type}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {log.target_id.slice(0, 8)}...
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-xs">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
