'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Clock, User } from 'lucide-react'
import { useAlarms } from '@/hooks/use-alarms'
import { usePermissions } from '@/hooks/use-permissions'
import { acknowledgeAlarmClient, resolveAlarm } from '@/lib/supabase/queries/alarms-client'
import type { Alarm, AlarmSeverity } from '@/types/telemetry'

type AlarmStatus = 'active' | 'acknowledged' | 'resolved'

// Extended alarm type with display fields
type AlarmDisplay = Alarm & {
  pod_name: string
  room_name: string
  status: AlarmStatus
}

interface AlarmsPanelProps {
  siteId: string
  onNavigateToPod?: (podId: string) => void
  realtime?: boolean
}

export function AlarmsPanel({ siteId, onNavigateToPod, realtime = true }: AlarmsPanelProps) {
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmDisplay | null>(null)
  const [actionType, setActionType] = useState<'acknowledge' | 'resolve' | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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
  
  // Transform alarms to display format with derived fields
  const alarmsDisplay: AlarmDisplay[] = alarms.map(alarm => ({
    ...alarm,
    pod_name: 'Pod ' + alarm.pod_id.slice(0, 8),
    room_name: 'Room',
    status: alarm.resolved_at ? 'resolved' : alarm.acknowledged_at ? 'acknowledged' : 'active'
  }))
  
  const activeAlarms = alarmsDisplay.filter(a => a.status === 'active')
  const acknowledgedAlarms = alarmsDisplay.filter(a => a.status === 'acknowledged')
  const resolvedAlarms = alarmsDisplay.filter(a => a.status === 'resolved')
  
  const criticalCount = activeAlarms.filter(a => a.severity === 'critical').length
  const warningCount = activeAlarms.filter(a => a.severity === 'warning').length
  
  const getSeverityBadge = (severity: AlarmSeverity) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-500">Warning</Badge>
      case 'info':
        return <Badge variant="outline">Info</Badge>
    }
  }
  
  const getStatusBadge = (status: AlarmStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive">Active</Badge>
      case 'acknowledged':
        return <Badge variant="secondary">Acknowledged</Badge>
      case 'resolved':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-600">Resolved</Badge>
    }
  }
  
  const getAlarmIcon = (alarmType: string) => {
    const iconClass = "w-4 h-4"
    if (alarmType.includes('sensor') || alarmType.includes('device')) {
      return <Clock className={iconClass} />
    }
    return <AlertCircle className={iconClass} />
  }
  
  const formatTimeAgo = (timestamp: string): string => {
    const minutesAgo = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
    if (minutesAgo < 60) return `${minutesAgo} min ago`
    const hoursAgo = Math.floor(minutesAgo / 60)
    if (hoursAgo < 24) return `${hoursAgo}h ago`
    const daysAgo = Math.floor(hoursAgo / 24)
    return `${daysAgo}d ago`
  }
  
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString()
  }
  
  const handleAction = async () => {
    if (!selectedAlarm || !actionType || isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      if (actionType === 'acknowledge') {
        await acknowledgeAlarmClient(selectedAlarm.id, notes || '')
      } else {
        if (!notes.trim()) {
          alert('Notes are required to resolve an alarm')
          setIsSubmitting(false)
          return
        }
        await resolveAlarm(selectedAlarm.id)
      }
      
      // Close dialog
      setSelectedAlarm(null)
      setActionType(null)
      setNotes('')
    } catch (error) {
      console.error('Error performing action:', error)
      alert(`Failed to ${actionType} alarm`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const openActionDialog = (alarm: AlarmDisplay, action: 'acknowledge' | 'resolve') => {
    setSelectedAlarm(alarm)
    setActionType(action)
  }
  
  const renderAlarmTable = (alarmList: AlarmDisplay[]) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Severity</TableHead>
            <TableHead>Pod / Room</TableHead>
            <TableHead>Alarm</TableHead>
            <TableHead>Triggered</TableHead>
            <TableHead>Status</TableHead>
            {can('monitoring:view') && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {alarmList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={can('monitoring:view') ? 6 : 5} className="text-center text-muted-foreground py-8">
                No alarms in this category
              </TableCell>
            </TableRow>
          ) : (
            alarmList.map(alarm => (
              <TableRow key={alarm.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getAlarmIcon(alarm.alarm_type)}
                    {getSeverityBadge(alarm.severity)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div
                      className="hover:underline cursor-pointer"
                      onClick={() => onNavigateToPod && onNavigateToPod(alarm.pod_id)}
                    >
                      {alarm.pod_name}
                    </div>
                    <div className="text-xs text-muted-foreground">{alarm.room_name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{alarm.alarm_type.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground mt-1">{alarm.message}</div>
                    {alarm.actual_value !== undefined && alarm.actual_value !== null && (
                      <div className="text-xs mt-1">
                        <Badge variant="outline" className="text-xs">
                          Value: {alarm.actual_value}
                          {alarm.threshold_value !== undefined && alarm.threshold_value !== null && ` (Threshold: ${alarm.threshold_value})`}
                        </Badge>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatTimestamp(alarm.triggered_at)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimeAgo(alarm.triggered_at)}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(alarm.status)}
                  {alarm.acknowledged_at && alarm.acknowledged_by && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {alarm.acknowledged_by}
                    </div>
                  )}
                </TableCell>
                {can('monitoring:view') && (
                  <TableCell>
                    <div className="flex gap-1">
                      {alarm.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionDialog(alarm, 'acknowledge')}
                          >
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openActionDialog(alarm, 'resolve')}
                          >
                            Resolve
                          </Button>
                        </>
                      )}
                      {alarm.status === 'acknowledged' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openActionDialog(alarm, 'resolve')}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
  
  // Check permission
  if (!can('monitoring:view')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">You do not have permission to view alarms.</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Active Alarms & Events</CardTitle>
              <CardDescription>
                Monitor and manage system alarms and notifications
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="px-3">
                  {criticalCount} Critical
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-500 px-3">
                  {warningCount} Warning
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Loading State */}
          {loading && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Loading alarms...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="py-6 text-center">
              <p className="text-sm text-destructive">Error loading alarms: {error.message}</p>
            </div>
          )}
          
          {/* Alarms Tabs */}
          {!loading && !error && (
            <Tabs defaultValue="active">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="active">
                  Active ({activeAlarms.length})
                </TabsTrigger>
                <TabsTrigger value="acknowledged">
                  Acknowledged ({acknowledgedAlarms.length})
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  Resolved ({resolvedAlarms.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-4">
                {renderAlarmTable(activeAlarms)}
              </TabsContent>
              
              <TabsContent value="acknowledged" className="mt-4">
                {renderAlarmTable(acknowledgedAlarms)}
              </TabsContent>
              
              <TabsContent value="resolved" className="mt-4">
                {renderAlarmTable(resolvedAlarms.slice(0, 20))}
                {resolvedAlarms.length > 20 && (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Showing 20 most recent resolved alarms
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      
      {/* Action Dialog */}
      <Dialog open={!!selectedAlarm && !!actionType} onOpenChange={() => {
        setSelectedAlarm(null)
        setActionType(null)
        setNotes('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'acknowledge' ? 'Acknowledge Alarm' : 'Resolve Alarm'}
            </DialogTitle>
            <DialogDescription>
              {selectedAlarm && selectedAlarm.alarm_type.replace(/_/g, ' ').toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm">{selectedAlarm?.message}</p>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Pod:</div>
                <div>{selectedAlarm?.pod_name}</div>
                <div className="text-muted-foreground">Room:</div>
                <div>{selectedAlarm?.room_name}</div>
                <div className="text-muted-foreground">Triggered:</div>
                <div>{selectedAlarm && formatTimestamp(selectedAlarm.triggered_at)}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes {actionType === 'resolve' ? '(Required)' : '(Optional)'}
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  actionType === 'acknowledge' 
                    ? 'Add notes about acknowledgment...'
                    : 'Describe the resolution action taken...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedAlarm(null)
              setActionType(null)
              setNotes('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              disabled={isSubmitting || (actionType === 'resolve' && !notes.trim())}
            >
              {isSubmitting ? (
                'Processing...'
              ) : actionType === 'acknowledge' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Acknowledge
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
