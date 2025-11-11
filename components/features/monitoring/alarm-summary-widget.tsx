'use client'

import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react'
import { useAlarms } from '@/hooks/use-alarms'
import { usePermissions } from '@/hooks/use-permissions'

interface AlarmSummaryWidgetProps {
  siteId: string
  realtime?: boolean
}

export function AlarmSummaryWidget({ siteId, realtime = true }: AlarmSummaryWidgetProps) {
  // Permission check
  const { can } = usePermissions('org_admin')
  
  // Fetch alarms
  const {
    alarms,
    loading,
    error
  } = useAlarms({
    siteId,
    realtime
  })
  
  // Calculate summary from alarms
  const activeAlarms = alarms.filter(a => !a.acknowledged_at && !a.resolved_at)
  const acknowledgedAlarms = alarms.filter(a => a.acknowledged_at && !a.resolved_at)
  
  const summary = {
    critical: activeAlarms.filter(a => a.severity === 'critical').length,
    warning: activeAlarms.filter(a => a.severity === 'warning').length,
    info: activeAlarms.filter(a => a.severity === 'info').length,
    acknowledged: acknowledgedAlarms.length,
    total: activeAlarms.length
  }
  
  // Check permission
  if (!can('monitoring:view')) {
    return null
  }
  
  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading alarms...</p>
        </CardContent>
      </Card>
    )
  }
  
  // Error state
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Error loading alarms: {error.message}</p>
        </CardContent>
      </Card>
    )
  }
  
  // No summary data
  if (!summary) {
    return null
  }
  
  const stats = [
    {
      label: 'Critical',
      count: summary.critical,
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      show: true,
    },
    {
      label: 'Warning',
      count: summary.warning,
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      show: true,
    },
    {
      label: 'Info',
      count: summary.info,
      icon: Info,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      show: true,
    },
    {
      label: 'Acknowledged',
      count: summary.acknowledged,
      icon: Clock,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      show: summary.acknowledged > 0,
    },
  ]
  
  // All clear state
  if (summary.total === 0) {
    return (
      <Card className="bg-green-500/10 border-green-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-700">All Systems Operational</p>
              <p className="text-xs text-green-600/80">No active alarms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.filter(s => s.show).map((stat) => (
        <Card key={stat.label} className={stat.bgColor}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stat.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
