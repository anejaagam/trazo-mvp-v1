'use client'

import { Badge } from '@/components/ui/badge'
import { AlertCircle, AlertTriangle, Info, Clock, CheckCircle } from 'lucide-react'
import { useAlarms } from '@/hooks/use-alarms'
import { usePermissions } from '@/hooks/use-permissions'

interface AlarmSummaryWidgetProps {
  siteId: string
  realtime?: boolean
}

export function AlarmSummaryWidget({ siteId, realtime = true }: AlarmSummaryWidgetProps) {
  const { can } = usePermissions('org_admin')
  
  const { alarms, loading, error } = useAlarms({ siteId, realtime })
  
  const activeAlarms = alarms.filter(a => !a.acknowledged_at && !a.resolved_at)
  const acknowledgedAlarms = alarms.filter(a => a.acknowledged_at && !a.resolved_at)
  
  const summary = {
    critical: activeAlarms.filter(a => a.severity === 'critical').length,
    warning: activeAlarms.filter(a => a.severity === 'warning').length,
    info: activeAlarms.filter(a => a.severity === 'info').length,
    acknowledged: acknowledgedAlarms.length,
    total: activeAlarms.length
  }
  
  if (!can('monitoring:view')) return null
  if (loading) return <span className="text-xs text-muted-foreground">Loading...</span>
  if (error) return <span className="text-xs text-destructive">Error</span>
  if (!summary) return null
  
  // All clear - just a small badge
  if (summary.total === 0 && summary.acknowledged === 0) {
    return (
      <Badge variant="outline" className="gap-1 h-5 text-xs bg-green-500/10 text-green-600 border-green-500/30">
        <CheckCircle className="w-3 h-3" />
        All Clear
      </Badge>
    )
  }
  
  // Compact inline badges
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {summary.critical > 0 && (
        <Badge variant="destructive" className="gap-0.5 h-5 text-xs px-1.5">
          <AlertCircle className="w-3 h-3" />
          {summary.critical}
        </Badge>
      )}
      
      {summary.warning > 0 && (
        <Badge className="gap-0.5 h-5 text-xs px-1.5 bg-amber-500 hover:bg-amber-500 text-white">
          <AlertTriangle className="w-3 h-3" />
          {summary.warning}
        </Badge>
      )}
      
      {summary.info > 0 && (
        <Badge variant="secondary" className="gap-0.5 h-5 text-xs px-1.5 bg-blue-500/10 text-blue-600">
          <Info className="w-3 h-3" />
          {summary.info}
        </Badge>
      )}
      
      {summary.acknowledged > 0 && (
        <Badge variant="outline" className="gap-0.5 h-5 text-xs px-1.5">
          <Clock className="w-3 h-3" />
          {summary.acknowledged}
        </Badge>
      )}
    </div>
  )
}
