import { Alarm } from '../types/alarm';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, CheckCircle2, Clock, Bell, BellOff, Thermometer, Droplet, Sprout, Settings, FileX, Shield, Calendar, Beaker } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface AlarmCardProps {
  alarm: Alarm;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
}

const categoryIcons = {
  environmental: Thermometer,
  equipment: Settings,
  irrigation: Droplet,
  system: Bell,
  compliance: FileX,
  security: Shield,
};

const severityColors = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

const statusColors = {
  active: 'bg-red-100 text-red-800 border-red-200',
  acknowledged: 'bg-amber-100 text-amber-800 border-amber-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  snoozed: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function AlarmCard({ alarm, onAcknowledge, onResolve, onSnooze }: AlarmCardProps) {
  const Icon = categoryIcons[alarm.category];
  
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {/* Severity Indicator */}
        <div className={`w-1 h-full rounded ${severityColors[alarm.severity]}`} />
        
        {/* Icon */}
        <div className={`p-2 rounded-lg ${alarm.status === 'active' ? 'bg-red-50' : 'bg-gray-50'}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3>{alarm.title}</h3>
                <Badge variant="outline" className={statusColors[alarm.status]}>
                  {alarm.status}
                </Badge>
                <Badge variant="outline">
                  {alarm.severity}
                </Badge>
              </div>
              <p className="text-gray-600">{alarm.description}</p>
            </div>
          </div>
          
          {/* Details */}
          <div className="flex flex-wrap gap-4 text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <span>Site:</span>
              <span>{alarm.site}</span>
            </div>
            {alarm.room && (
              <div className="flex items-center gap-1">
                <span>Room:</span>
                <span>{alarm.room}</span>
              </div>
            )}
            {alarm.device && (
              <div className="flex items-center gap-1">
                <span>Device:</span>
                <span>{alarm.device}</span>
              </div>
            )}
            {alarm.value !== undefined && alarm.threshold !== undefined && (
              <div className="flex items-center gap-1">
                <span>Value:</span>
                <span>{alarm.value}{alarm.unit} (Threshold: {alarm.threshold}{alarm.unit})</span>
              </div>
            )}
          </div>
          
          {/* Timestamps */}
          <div className="flex flex-wrap gap-4 text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Raised {formatDistanceToNow(alarm.raisedAt, { addSuffix: true })}</span>
            </div>
            {alarm.acknowledgedAt && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ack by {alarm.acknowledgedBy}</span>
              </div>
            )}
            {alarm.snoozedUntil && alarm.snoozedUntil > new Date() && (
              <div className="flex items-center gap-1">
                <BellOff className="w-4 h-4" />
                <span>Snoozed until {formatDistanceToNow(alarm.snoozedUntil, { addSuffix: true })}</span>
              </div>
            )}
          </div>
          
          {/* Compliance-Specific Details */}
          {alarm.metrcError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
              <div className="flex items-start gap-2 mb-2">
                <FileX className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-red-900 mb-1">Metrc API Error</h4>
                  <p className="text-red-800">Code: {alarm.metrcError.errorCode}</p>
                  <p className="text-red-800">{alarm.metrcError.errorMessage}</p>
                  {alarm.metrcError.tagNumber && (
                    <p className="text-red-700 mt-1">Tag: <code>{alarm.metrcError.tagNumber}</code></p>
                  )}
                  {alarm.metrcError.submissionId && (
                    <p className="text-red-700">Submission ID: <code>{alarm.metrcError.submissionId}</code></p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {alarm.taskDetails && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-amber-900 mb-1">Compliance Task</h4>
                  <p className="text-amber-800">Task: {alarm.taskDetails.taskType}</p>
                  <p className="text-amber-800">Due: {format(alarm.taskDetails.dueDate, 'MMM dd, yyyy')}</p>
                  {alarm.taskDetails.assignedTo && (
                    <p className="text-amber-700">Assigned to: {alarm.taskDetails.assignedTo}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {alarm.harvestDetails && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-red-900 mb-1">Oregon 45-Day Harvest Deadline</h4>
                  <p className="text-red-800">Batch ID: <code>{alarm.harvestDetails.batchId}</code></p>
                  <p className="text-red-800">Days Since Harvest: {alarm.harvestDetails.daysSinceHarvest}</p>
                  <p className="text-red-800">Days Remaining: <span>{alarm.harvestDetails.daysRemaining} days</span></p>
                </div>
              </div>
            </div>
          )}
          
          {alarm.testFailureDetails && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
              <div className="flex items-start gap-2">
                <Beaker className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-red-900 mb-1">Laboratory Test Failure</h4>
                  <p className="text-red-800">Lab: {alarm.testFailureDetails.labName}</p>
                  <p className="text-red-800">Test Type: {alarm.testFailureDetails.testType}</p>
                  <p className="text-red-800">Failure: {alarm.testFailureDetails.failureReason}</p>
                  <p className="text-red-700 mt-1">Batch: <code>{alarm.testFailureDetails.batchId}</code></p>
                  <p className="text-red-700">Sample: <code>{alarm.testFailureDetails.sampleId}</code></p>
                </div>
              </div>
            </div>
          )}
          
          {alarm.securityDetails && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-red-900 mb-1">Security Incident</h4>
                  <p className="text-red-800">Type: {alarm.securityDetails.incidentType}</p>
                  <p className="text-red-800">Location: {alarm.securityDetails.location}</p>
                  {alarm.securityDetails.deviceId && (
                    <p className="text-red-700">Device: <code>{alarm.securityDetails.deviceId}</code></p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Escalation Info */}
          {alarm.escalationLevel > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Escalation Level {alarm.escalationLevel}
              </Badge>
              <span className="text-gray-500">{alarm.notificationsSent} notifications sent</span>
            </div>
          )}
          
          {/* Actions */}
          {alarm.status === 'active' && (
            <div className="flex gap-2">
              <Button onClick={() => onAcknowledge(alarm.id)} variant="outline" size="sm">
                Acknowledge
              </Button>
              <Button onClick={() => onResolve(alarm.id)} variant="default" size="sm">
                Resolve
              </Button>
              <Button onClick={() => onSnooze(alarm.id, 15)} variant="outline" size="sm">
                <BellOff className="w-4 h-4 mr-1" />
                Snooze 15m
              </Button>
              <Button onClick={() => onSnooze(alarm.id, 30)} variant="outline" size="sm">
                <BellOff className="w-4 h-4 mr-1" />
                Snooze 30m
              </Button>
            </div>
          )}
          
          {alarm.status === 'acknowledged' && (
            <div className="flex gap-2">
              <Button onClick={() => onResolve(alarm.id)} variant="default" size="sm">
                Resolve
              </Button>
            </div>
          )}
          
          {alarm.status === 'snoozed' && alarm.snoozedUntil && alarm.snoozedUntil > new Date() && (
            <div className="flex gap-2">
              <Button onClick={() => onAcknowledge(alarm.id)} variant="outline" size="sm">
                Un-snooze
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
