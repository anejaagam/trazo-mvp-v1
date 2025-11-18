/**
 * Alarm Card Component
 * 
 * Display individual alarm with actions (acknowledge, resolve)
 * Adapted from prototype to work with production types and RBAC
 * 
 * Created: November 15, 2025
 * Phase: 14A - Core Alarms Implementation
 */

'use client';

import { AlarmWithDetails } from '@/types/telemetry';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Clock, Thermometer, Droplet, Wind, Zap, WrenchIcon, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface AlarmCardProps {
  alarm: AlarmWithDetails;
  onAcknowledge?: (alarmId: string, note?: string) => Promise<void>;
  onResolve?: (alarmId: string, note?: string, rootCause?: string) => Promise<void>;
}

const alarmTypeIcons = {
  temperature_high: Thermometer,
  temperature_low: Thermometer,
  humidity_high: Droplet,
  humidity_low: Droplet,
  co2_high: Wind,
  co2_low: Wind,
  vpd_out_of_range: Droplet,
  device_offline: AlertCircle,
  sensor_fault: WrenchIcon,
  power_failure: Zap,
  water_leak: Droplet,
  security_breach: AlertTriangle,
  door_open: AlertTriangle,
  task_overdue: Clock,
  alarm_flood: AlertTriangle,
};

const severityColors = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

const severityTextColors = {
  critical: 'text-red-700 bg-red-50 border-red-200',
  warning: 'text-amber-700 bg-amber-50 border-amber-200',
  info: 'text-blue-700 bg-blue-50 border-blue-200',
};

export function AlarmCard({ alarm, onAcknowledge, onResolve }: AlarmCardProps) {
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  
  const Icon = alarmTypeIcons[alarm.alarm_type] || AlertTriangle;
  
  const isActive = !alarm.acknowledged_at && !alarm.resolved_at;
  const isAcknowledged = alarm.acknowledged_at && !alarm.resolved_at;
  const isResolved = alarm.resolved_at;
  
  const handleAcknowledge = async () => {
    if (!onAcknowledge) return;
    setIsAcknowledging(true);
    try {
      await onAcknowledge(alarm.id);
    } finally {
      setIsAcknowledging(false);
    }
  };
  
  const handleResolve = async () => {
    if (!onResolve) return;
    setIsResolving(true);
    try {
      await onResolve(alarm.id);
    } finally {
      setIsResolving(false);
    }
  };
  
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Severity Indicator */}
        <div className={`w-1 h-full rounded ${severityColors[alarm.severity]}`} />
        
        {/* Icon */}
        <div className={`p-2 rounded-lg ${
          isActive ? 'bg-red-50' : 
          isAcknowledged ? 'bg-amber-50' : 
          'bg-green-50'
        }`}>
          <Icon className={`w-5 h-5 ${
            isActive ? 'text-red-600' : 
            isAcknowledged ? 'text-amber-600' : 
            'text-green-600'
          }`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-gray-900">{alarm.message}</h3>
                <Badge 
                  variant="outline" 
                  className={severityTextColors[alarm.severity]}
                >
                  {alarm.severity}
                </Badge>
                {isResolved && (
                  <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Resolved
                  </Badge>
                )}
                {isAcknowledged && !isResolved && (
                  <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">
                    Acknowledged
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Details */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <span className="font-medium">Pod:</span>
              <span>{alarm.pod.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Room:</span>
              <span>{alarm.room.name}</span>
            </div>
            {alarm.actual_value !== null && alarm.threshold_value !== null && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Value:</span>
                <span className="font-mono">
                  {alarm.actual_value.toFixed(1)} (threshold: {alarm.threshold_value.toFixed(1)})
                </span>
              </div>
            )}
            {alarm.duration_seconds && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Duration:</span>
                <span>{Math.floor(alarm.duration_seconds / 60)}m</span>
              </div>
            )}
          </div>
          
          {/* Timestamps */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Raised {formatDistanceToNow(new Date(alarm.triggered_at), { addSuffix: true })}</span>
            </div>
            {alarm.acknowledged_at && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Ack&apos;d {formatDistanceToNow(new Date(alarm.acknowledged_at), { addSuffix: true })}
                  {alarm.acknowledged_by_user && ` by ${alarm.acknowledged_by_user.full_name || alarm.acknowledged_by_user.email}`}
                </span>
              </div>
            )}
            {alarm.resolved_at && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>
                  Resolved {formatDistanceToNow(new Date(alarm.resolved_at), { addSuffix: true })}
                  {alarm.resolved_by_user && ` by ${alarm.resolved_by_user.full_name || alarm.resolved_by_user.email}`}
                </span>
              </div>
            )}
          </div>
          
          {/* Notes */}
          {alarm.ack_note && (
            <div className="mb-3 p-2 bg-amber-50 rounded text-sm">
              <span className="font-medium text-amber-900">Acknowledgment Note:</span>
              <p className="text-amber-800 mt-1">{alarm.ack_note}</p>
            </div>
          )}
          {alarm.resolution_note && (
            <div className="mb-3 p-2 bg-green-50 rounded text-sm">
              <span className="font-medium text-green-900">Resolution Note:</span>
              <p className="text-green-800 mt-1">{alarm.resolution_note}</p>
            </div>
          )}
          {alarm.root_cause && (
            <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
              <span className="font-medium text-blue-900">Root Cause:</span>
              <p className="text-blue-800 mt-1">{alarm.root_cause}</p>
            </div>
          )}
          
          {/* Actions */}
          {!isResolved && (
            <div className="flex gap-2">
              {isActive && onAcknowledge && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAcknowledge}
                  disabled={isAcknowledging}
                >
                  {isAcknowledging ? 'Acknowledging...' : 'Acknowledge'}
                </Button>
              )}
              {onResolve && (
                <Button
                  size="sm"
                  variant={isAcknowledged ? 'default' : 'outline'}
                  onClick={handleResolve}
                  disabled={isResolving}
                >
                  {isResolving ? 'Resolving...' : 'Resolve'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
