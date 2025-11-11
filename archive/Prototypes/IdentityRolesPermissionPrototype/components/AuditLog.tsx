import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Download, Search, Filter, FileText, Shield } from 'lucide-react';
import { AuditEvent } from '../lib/supabase';
import { mockAuditEvents } from '../lib/mock-data';
import { toast } from 'sonner';

export function AuditLog() {
  const [events] = useState<AuditEvent[]>(mockAuditEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const actionTypes = [
    'all',
    'login_success',
    'login_failure',
    'mfa_asserted',
    'user_invited',
    'user_suspended',
    'role_bound',
    'api_token_created',
    'api_token_rotated',
    'recipe_published',
    'control_override',
    'evidence_locked',
    'jit_granted',
  ];

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.actor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.subject_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = actionFilter === 'all' || event.action === actionFilter;
    
    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    // Simulate export
    const csv = [
      ['Timestamp (UTC)', 'Actor', 'Action', 'Subject', 'Reason', 'IP', 'Attributes'].join(','),
      ...filteredEvents.map(e => [
        e.ts_utc,
        e.actor_name || e.actor_id,
        e.action,
        e.subject_name || e.subject_id || '',
        e.reason || '',
        e.ip || '',
        JSON.stringify(e.attrs || {}),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString()}.csv`;
    a.click();
    
    toast.success('Audit log exported');
  };

  const getActionBadge = (action: string) => {
    if (action.includes('login')) return { variant: 'default' as const, color: 'bg-blue-500' };
    if (action.includes('mfa')) return { variant: 'default' as const, color: 'bg-purple-500' };
    if (action.includes('suspended') || action.includes('revoked')) return { variant: 'destructive' as const };
    if (action.includes('created') || action.includes('granted')) return { variant: 'default' as const, color: 'bg-green-500' };
    return { variant: 'secondary' as const };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>
                Immutable record of all authentication, authorization, and sensitive actions
              </CardDescription>
            </div>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by actor, action, or subject..."
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
                {actionTypes.map(action => (
                  <SelectItem key={action} value={action}>
                    {action === 'all' ? 'All Actions' : action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Events Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp (UTC)</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const badgeConfig = getActionBadge(event.action);
                  
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="text-sm text-slate-500 font-mono">
                        {new Date(event.ts_utc).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{event.actor_name || 'System'}</div>
                          {event.ip && (
                            <div className="text-xs text-slate-500 font-mono">{event.ip}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge {...badgeConfig}>
                          {event.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {event.subject_name || event.subject_id || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                        {event.reason || '—'}
                      </TableCell>
                      <TableCell>
                        {event.attrs && Object.keys(event.attrs).length > 0 && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              <FileText className="inline h-3 w-3 mr-1" />
                              View
                            </summary>
                            <pre className="mt-2 p-2 bg-slate-50 rounded border text-xs overflow-auto">
                              {JSON.stringify(event.attrs, null, 2)}
                            </pre>
                          </details>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <div>
              Showing {filteredEvents.length} of {events.length} events
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Immutable audit trail · Retention: 7 years</span>
            </div>
          </div>

          {/* SLO indicators */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm">Performance SLOs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-slate-600">Audit Write Latency</div>
                  <div className="text-lg font-medium text-green-600">45ms</div>
                  <div className="text-xs text-slate-500">Target: p95 ≤ 100ms</div>
                </div>
                <div>
                  <div className="text-slate-600">Query Latency</div>
                  <div className="text-lg font-medium text-green-600">120ms</div>
                  <div className="text-xs text-slate-500">With filters</div>
                </div>
                <div>
                  <div className="text-slate-600">Storage</div>
                  <div className="text-lg font-medium">2.4 GB</div>
                  <div className="text-xs text-slate-500">Last 90 days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
