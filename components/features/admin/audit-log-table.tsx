/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * AuditLogTable Component
 * Display and filter audit log events
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { AuditEventWithUser } from '@/types/admin';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface AuditLogTableProps {
  events: AuditEventWithUser[];
  onExport?: () => void;
}

const ACTION_TYPES = [
  'all',
  'user.created',
  'user.updated',
  'user.suspended',
  'user.activated',
  'role.assigned',
  'role.removed',
  'batch.created',
  'batch.updated',
  'recipe.created',
  'recipe.version.created',
  'recipe.published',
  'recipe.deprecated',
  'recipe.undeprecated',
  'recipe.activation.created',
  'recipe.activation.deactivated',
  'recipe.activation.completed',
  'recipe.stage.advanced',
  'recipe.cloned',
  'evidence.captured',
  'monitoring.recipe.removed',
  'monitoring.recipe.applied',
  'monitoring.equipment.manual',
  'monitoring.equipment.auto',
  'monitoring.equipment.override',
  'monitoring.pod.setpoint',
  'monitoring.pod.calibration',
  'monitoring.alarm.acknowledged',
  'monitoring.alarm.resolved',
] as const;

export function AuditLogTable({ events }: AuditLogTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.entity_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = actionFilter === 'all' || event.action === actionFilter;

    return matchesSearch && matchesFilter;
  });

  // Removed CSV export per request

  const handleExportExcel = () => {
    // Build the same expanded dataset used for CSV
    const headers = [
      'Timestamp (UTC)',
      'User Name',
      'User Email',
      'User ID',
      'Action',
      'Entity Type',
      'Entity ID',
      'Changes',
      'Metadata',
      'User Agent',
    ];

    const toJsonCell = (obj: unknown): string => {
      if (!obj) return '';
      try {
        return JSON.stringify(obj);
      } catch {
        return String(obj);
      }
    };

    const rows = filteredEvents.map((e) => [
      e.timestamp,
      e.user?.full_name || '',
      e.user?.email || '',
      e.user_id || '',
      e.action,
      e.entity_type,
      e.entity_id,
      toJsonCell(e.changes),
      toJsonCell(e.metadata),
      e.user_agent || '',
    ]);

    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Auto-fit column widths based on max content length per column
    const colWidths = headers.map((_, colIdx) => {
      const maxLen = data.reduce((max, row) => {
        const cell = row[colIdx] ?? '';
        const len = String(cell).length;
        return Math.max(max, len);
      }, headers[colIdx].length);
      // Pad a bit for readability
      return { wch: Math.min(Math.max(maxLen + 2, 12), 120) };
    });
  (ws as any)['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Log');

    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Audit log exported (Excel)');
  };

  const getActionBadge = (action: string) => {
    if (action.includes('created') || action.includes('activated')) {
      return { variant: 'default' as const, className: 'bg-green-600' };
    }
    if (action.includes('suspended') || action.includes('deleted')) {
      return { variant: 'destructive' as const };
    }
    if (action.includes('updated') || action.includes('assigned')) {
      return { variant: 'default' as const, className: 'bg-blue-600' };
    }
    return { variant: 'secondary' as const };
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by user, action, or entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {ACTION_TYPES.filter((a) => a !== 'all').map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleExportExcel} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Events Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Entity ID</TableHead>
              {/** IP address column removed per request */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                  No audit events found
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => {
                const actionConfig = getActionBadge(event.action);

                return (
                  <TableRow key={event.id}>
                    <TableCell className="text-sm text-slate-600">
                      {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {event.user?.full_name || 'System'}
                        </div>
                        {event.user?.email && (
                          <div className="text-xs text-slate-500">{event.user.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge {...actionConfig}>{event.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono text-slate-600">
                        {event.entity_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono text-slate-500">
                        {event.entity_id.substring(0, 8)}...
                      </span>
                    </TableCell>
                    {/** IP address cell removed per request */}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-slate-500">
        Showing {filteredEvents.length} of {events.length} events
      </div>
    </div>
  );
}
