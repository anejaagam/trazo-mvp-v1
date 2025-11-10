import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import type { Alarm, AlarmSeverity, AlarmStatus } from '../../types/telemetry';
import { AlertCircle, CheckCircle, Clock, User, MessageSquare } from 'lucide-react';
import { formatTimestamp } from '../../lib/telemetry';
import { toast } from 'sonner';

interface AlarmsPanelProps {
  alarms: Alarm[];
  timezone: string;
  onAcknowledge: (alarmId: string, notes: string) => void;
  onResolve: (alarmId: string, notes: string) => void;
  onNavigateToPod?: (podId: string) => void;
}

export function AlarmsPanel({ alarms, timezone, onAcknowledge, onResolve, onNavigateToPod }: AlarmsPanelProps) {
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [actionType, setActionType] = useState<'acknowledge' | 'resolve' | null>(null);
  const [notes, setNotes] = useState('');
  
  const activeAlarms = alarms.filter(a => a.status === 'active');
  const acknowledgedAlarms = alarms.filter(a => a.status === 'acknowledged');
  const resolvedAlarms = alarms.filter(a => a.status === 'resolved');
  
  const criticalCount = activeAlarms.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlarms.filter(a => a.severity === 'warning').length;
  
  const getSeverityBadge = (severity: AlarmSeverity) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-500">Warning</Badge>;
      case 'info':
        return <Badge variant="outline">Info</Badge>;
    }
  };
  
  const getStatusBadge = (status: AlarmStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive">Active</Badge>;
      case 'acknowledged':
        return <Badge variant="secondary">Acknowledged</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-600">Resolved</Badge>;
    }
  };
  
  const getCategoryIcon = (category: Alarm['category']) => {
    const iconClass = "w-4 h-4";
    switch (category) {
      case 'environmental':
        return <AlertCircle className={iconClass} />;
      case 'equipment':
        return <AlertCircle className={iconClass} />;
      case 'calibration':
        return <Clock className={iconClass} />;
      default:
        return <AlertCircle className={iconClass} />;
    }
  };
  
  const handleAction = () => {
    if (!selectedAlarm || !actionType) return;
    
    if (actionType === 'acknowledge') {
      onAcknowledge(selectedAlarm.id, notes);
      toast.success(`Alarm acknowledged: ${selectedAlarm.title}`);
    } else {
      onResolve(selectedAlarm.id, notes);
      toast.success(`Alarm resolved: ${selectedAlarm.title}`);
    }
    
    setSelectedAlarm(null);
    setActionType(null);
    setNotes('');
  };
  
  const openActionDialog = (alarm: Alarm, action: 'acknowledge' | 'resolve') => {
    setSelectedAlarm(alarm);
    setActionType(action);
  };
  
  const renderAlarmTable = (alarmList: Alarm[]) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Severity</TableHead>
            <TableHead>Pod / Room</TableHead>
            <TableHead>Alarm</TableHead>
            <TableHead>Triggered</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alarmList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No alarms in this category
              </TableCell>
            </TableRow>
          ) : (
            alarmList.map(alarm => (
              <TableRow key={alarm.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(alarm.category)}
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
                    <div>{alarm.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{alarm.message}</div>
                    {alarm.parameter && alarm.value !== undefined && (
                      <div className="text-xs mt-1">
                        <Badge variant="outline" className="text-xs">
                          {alarm.parameter}: {alarm.value}
                          {alarm.setpoint !== undefined && ` (SP: ${alarm.setpoint})`}
                        </Badge>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatTimestamp(alarm.triggered_at, timezone, true)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.floor((Date.now() - alarm.triggered_at.getTime()) / 60000)} min ago
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(alarm.status)}
                  {alarm.acknowledged_at && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {alarm.acknowledged_by}
                    </div>
                  )}
                </TableCell>
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
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
  
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
        </CardContent>
      </Card>
      
      {/* Action Dialog */}
      <Dialog open={!!selectedAlarm && !!actionType} onOpenChange={() => {
        setSelectedAlarm(null);
        setActionType(null);
        setNotes('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'acknowledge' ? 'Acknowledge Alarm' : 'Resolve Alarm'}
            </DialogTitle>
            <DialogDescription>
              {selectedAlarm?.title}
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
                <div>{selectedAlarm && formatTimestamp(selectedAlarm.triggered_at, timezone, true)}</div>
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
              setSelectedAlarm(null);
              setActionType(null);
              setNotes('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              disabled={actionType === 'resolve' && !notes.trim()}
            >
              {actionType === 'acknowledge' ? (
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
  );
}
