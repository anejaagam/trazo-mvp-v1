/**
 * Alarms Dashboard Client Component
 *
 * Client-side dashboard with real-time alarm updates, filters, and statistics
 * Uses useAlarms and useNotifications hooks for data fetching and real-time subscriptions
 *
 * Enhanced: Phase 3 - Unified Notification Center
 * Created: November 15, 2025
 */

'use client';

import { useAlarms, useAlarmSummary } from '@/hooks/use-alarms';
import { AlarmCard } from './alarm-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  Filter,
  RefreshCw,
  Calendar,
  Thermometer,
} from 'lucide-react';
import { acknowledgeAlarm, resolveAlarm } from '@/app/actions/alarms';
import { useState } from 'react';
import type { AlarmSeverity } from '@/types/telemetry';

interface AlarmsDashboardProps {
  userId: string;
  userRole: string | null;
  siteId: string | null;
}

export function AlarmsDashboard({ siteId }: AlarmsDashboardProps) {
  const [severityFilter, setSeverityFilter] = useState<AlarmSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('active');
  
  // Fetch alarms with filters
  const {
    alarms,
    loading,
    error,
    refresh,
    isSubscribed,
  } = useAlarms({
    siteId: siteId ?? undefined,
    severity: severityFilter === 'all' ? undefined : severityFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    realtime: true,
  });
  
  // Fetch alarm summary statistics
  const {
    counts,
    totalActive,
    loading: summaryLoading,
    refresh: refreshSummary,
  } = useAlarmSummary({
    siteId: siteId || '',
    refreshInterval: 30000, // 30 seconds
  });
  
  const handleAcknowledge = async (alarmId: string, note?: string) => {
    const result = await acknowledgeAlarm(alarmId, note);
    if (result.success) {
      refresh();
      refreshSummary();
    } else {
      console.error('Failed to acknowledge alarm:', result.error);
      alert(`Failed to acknowledge alarm: ${result.error}`);
    }
  };
  
  const handleResolve = async (alarmId: string, note?: string, rootCause?: string) => {
    const result = await resolveAlarm(alarmId, note, rootCause);
    if (result.success) {
      refresh();
      refreshSummary();
    } else {
      console.error('Failed to resolve alarm:', result.error);
      alert(`Failed to resolve alarm: ${result.error}`);
    }
  };
  
  const handleRefresh = () => {
    refresh();
    refreshSummary();
  };
  
  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryLoading ? '...' : totalActive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unacknowledged & unresolved
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <div className="h-3 w-3 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summaryLoading ? '...' : counts.critical}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Immediate action required
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <div className="h-3 w-3 rounded-full bg-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {summaryLoading ? '...' : counts.warning}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Attention needed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
            <div className="h-3 w-3 rounded-full bg-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-600">
              {summaryLoading ? '...' : counts.info}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Informational
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle>Filters</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isSubscribed && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Bell className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'default' : 'ghost'}
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? '' : 'text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50'}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'active' ? 'default' : 'ghost'}
                  onClick={() => setStatusFilter('active')}
                  className={statusFilter === 'active' ? '' : 'text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50'}
                >
                  Active
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'acknowledged' ? 'default' : 'ghost'}
                  onClick={() => setStatusFilter('acknowledged')}
                  className={statusFilter === 'acknowledged' ? '' : 'text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50'}
                >
                  Acknowledged
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'resolved' ? 'default' : 'ghost'}
                  onClick={() => setStatusFilter('resolved')}
                  className={statusFilter === 'resolved' ? '' : 'text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50'}
                >
                  Resolved
                </Button>
              </div>
            </div>
            
            {/* Severity Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={severityFilter === 'all' ? 'default' : 'ghost'}
                  onClick={() => setSeverityFilter('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={severityFilter === 'critical' ? 'default' : 'ghost'}
                  onClick={() => setSeverityFilter('critical')}
                  className={severityFilter === 'critical' ? '' : 'text-red-700 hover:bg-red-50 hover:text-red-800'}
                >
                  Critical
                </Button>
                <Button
                  size="sm"
                  variant={severityFilter === 'warning' ? 'default' : 'ghost'}
                  onClick={() => setSeverityFilter('warning')}
                  className={severityFilter === 'warning' ? '' : 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'}
                >
                  Warning
                </Button>
                <Button
                  size="sm"
                  variant={severityFilter === 'info' ? 'default' : 'ghost'}
                  onClick={() => setSeverityFilter('info')}
                  className={severityFilter === 'info' ? '' : 'text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50'}
                >
                  Info
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Alarms List */}
      <div className="space-y-4">
        {loading && alarms.length === 0 && (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              Loading alarms...
            </div>
          </Card>
        )}
        
        {error && (
          <Card className="p-8 border-red-200 bg-red-50">
            <div className="text-center text-red-600">
              Error loading alarms: {error.message}
            </div>
          </Card>
        )}
        
        {!loading && !error && alarms.length === 0 && (
          <Card className="p-8">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Alarms</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'active' 
                  ? "All systems operating normally. No active alarms to display."
                  : `No ${statusFilter} alarms found.`}
              </p>
            </div>
          </Card>
        )}
        
        {alarms.map((alarm) => {
          // Get icon based on alarm type
          let typeIcon = <AlertTriangle className="h-5 w-5" />;
          if (alarm.alarm_type.includes('temperature')) {
            typeIcon = <Thermometer className="h-5 w-5 text-orange-600" />;
          } else if (alarm.alarm_type === 'task_overdue') {
            typeIcon = <Calendar className="h-5 w-5 text-amber-600" />;
          }

          return (
            <div key={alarm.id} className="flex items-start gap-3">
              <div className="mt-4">{typeIcon}</div>
              <div className="flex-1">
                <AlarmCard
                  alarm={alarm}
                  onAcknowledge={handleAcknowledge}
                  onResolve={handleResolve}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {alarms.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {alarms.length} alarm{alarms.length !== 1 ? 's' : ''}
          {severityFilter !== 'all' && ` (${severityFilter})`}
          {statusFilter !== 'all' && ` (${statusFilter})`}
        </div>
      )}
    </div>
  );
}
