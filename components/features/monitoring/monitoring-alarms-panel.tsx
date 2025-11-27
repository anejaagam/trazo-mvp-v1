'use client'

import { useState } from 'react'
import { Bell, BellOff, Check, AlertCircle, AlertTriangle, Info, Clock, CheckCircle2 } from 'lucide-react'
import { useAlarms } from '@/hooks/use-alarms'
import { usePermissions } from '@/hooks/use-permissions'
import { acknowledgeAlarm, resolveAlarm } from '@/app/actions/alarms'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'

interface MonitoringAlarmsPanelProps {
  siteId: string | null
}

export function MonitoringAlarmsPanel({ siteId }: MonitoringAlarmsPanelProps) {
  const [open, setOpen] = useState(false)
  const { can } = usePermissions('org_admin')

  const { alarms, loading, error, refresh } = useAlarms({ 
    siteId: siteId || undefined, 
    realtime: true 
  })

  const activeAlarms = alarms.filter(a => !a.resolved_at)
  const criticalCount = activeAlarms.filter(a => a.severity === 'critical' && !a.acknowledged_at).length
  const warningCount = activeAlarms.filter(a => a.severity === 'warning' && !a.acknowledged_at).length
  const infoCount = activeAlarms.filter(a => a.severity === 'info' && !a.acknowledged_at).length

  if (!can('monitoring:view')) {
    return null
  }

  const handleAcknowledge = async (alarmId: string) => {
    const result = await acknowledgeAlarm(alarmId)
    if (result.success) refresh()
  }

  const handleResolve = async (alarmId: string) => {
    const result = await resolveAlarm(alarmId)
    if (result.success) refresh()
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bg: 'bg-red-500',
          lightBg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-800',
          label: 'Critical'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-500',
          bg: 'bg-amber-500',
          lightBg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-800',
          label: 'Warning'
        }
      default:
        return {
          icon: Info,
          color: 'text-blue-500',
          bg: 'bg-blue-500',
          lightBg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          label: 'Info'
        }
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant={activeAlarms.length > 0 ? "destructive" : "outline"} 
          size="sm" 
          className="gap-2"
        >
          {activeAlarms.length > 0 ? (
            <>
              <Bell className="h-4 w-4" />
              <span>{activeAlarms.length} Alarm{activeAlarms.length > 1 ? 's' : ''}</span>
            </>
          ) : (
            <>
              <BellOff className="h-4 w-4" />
              <span>No Alarms</span>
            </>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[420px] sm:w-[480px] p-0">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-muted/30">
          <SheetTitle className="text-xl">Active Alarms</SheetTitle>
          {activeAlarms.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="h-6 gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {criticalCount}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge className="h-6 gap-1 bg-amber-500 hover:bg-amber-500 text-white">
                  <AlertTriangle className="h-3 w-3" />
                  {warningCount}
                </Badge>
              )}
              {infoCount > 0 && (
                <Badge variant="secondary" className="h-6 gap-1">
                  <Info className="h-3 w-3" />
                  {infoCount}
                </Badge>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Content */}
        <div className="flex-1">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <p className="text-destructive">Failed to load alarms</p>
            </div>
          )}

          {!loading && !error && activeAlarms.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-green-600 dark:text-green-400">All Clear</p>
                <p className="text-sm text-muted-foreground mt-1">No active alarms</p>
              </div>
            </div>
          )}

          {!loading && !error && activeAlarms.length > 0 && (
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="p-4 space-y-3">
                {activeAlarms.map((alarm) => {
                  const config = getSeverityConfig(alarm.severity)
                  const Icon = config.icon
                  const isAcknowledged = !!alarm.acknowledged_at
                  
                  return (
                    <div
                      key={alarm.id}
                      className={`rounded-xl border ${config.border} ${config.lightBg} overflow-hidden transition-all hover:shadow-md`}
                    >
                      {/* Severity indicator line */}
                      <div className={`h-1 ${config.bg}`} />
                      
                      <div className="p-4">
                        {/* Top row: Icon + Message + Badge */}
                        <div className="flex items-start gap-3">
                          <div className={`shrink-0 h-9 w-9 rounded-lg ${config.lightBg} border ${config.border} flex items-center justify-center`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm leading-tight">{alarm.message}</p>
                              <Badge 
                                variant="outline" 
                                className={`shrink-0 text-xs ${config.color} border-current`}
                              >
                                {config.label}
                              </Badge>
                            </div>
                            
                            {/* Pod & Time */}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span className="font-medium">{alarm.pod?.name || 'Unknown Pod'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(alarm.triggered_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-current/10">
                          <div className="flex items-center gap-1.5">
                            {isAcknowledged ? (
                              <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                                <Check className="h-3 w-3" />
                                Acknowledged
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                                <AlertTriangle className="h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!isAcknowledged && can('alarm:ack') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => handleAcknowledge(alarm.id)}
                              >
                                Acknowledge
                              </Button>
                            )}
                            {can('alarm:resolve') && (
                              <Button
                                size="sm"
                                className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleResolve(alarm.id)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
