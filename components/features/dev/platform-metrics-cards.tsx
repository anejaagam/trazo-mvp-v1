'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Users, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlatformMetricsCardsProps {
  metrics: {
    pendingApprovals: number
    approvedOrgs: number
    rejectedOrgs: number
    totalUsers: number
    errorsLast24h: number
    criticalErrors: number
  }
}

export function PlatformMetricsCards({ metrics }: PlatformMetricsCardsProps) {
  const cards = [
    {
      title: 'Pending Approvals',
      value: metrics.pendingApprovals,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      description: 'Organizations awaiting review',
    },
    {
      title: 'Approved Orgs',
      value: metrics.approvedOrgs,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: 'Active organizations',
    },
    {
      title: 'Rejected Orgs',
      value: metrics.rejectedOrgs,
      icon: XCircle,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800/30',
      description: 'Denied applications',
    },
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      description: 'Across all organizations',
    },
    {
      title: 'Errors (24h)',
      value: metrics.errorsLast24h,
      icon: AlertTriangle,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      description: 'Errors in last 24 hours',
    },
    {
      title: 'Critical Errors',
      value: metrics.criticalErrors,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      description: 'Requiring immediate attention',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="border-purple-100 dark:border-purple-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={cn('rounded-full p-2', card.bgColor)}>
                <Icon className={cn('h-4 w-4', card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
