import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { mockAuditEvents } from '../lib/mockData';
import { AuditEvent } from '../types';
import { Search, FileText, Download, Calendar, User, AlertCircle } from 'lucide-react';

export function AuditLog() {
  const [events] = useState<AuditEvent[]>(mockAuditEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEventType, setFilterEventType] = useState<string>('all');

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.scope.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterEventType === 'all' || event.eventType === filterEventType;
    return matchesSearch && matchesFilter;
  });

  const eventTypes = Array.from(new Set(events.map(e => e.eventType)));

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'recipe_change': return 'bg-emerald-100 text-emerald-800';
      case 'override_event': return 'bg-blue-100 text-blue-800';
      case 'schedule_activation': return 'bg-purple-100 text-purple-800';
      case 'setpoint_update': return 'bg-amber-100 text-amber-800';
      case 'irrigation_cycle': return 'bg-cyan-100 text-cyan-800';
      case 'dr_event': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const formatEventType = (type: string): string => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleExport = () => {
    const csvContent = [
      ['Timestamp (UTC)', 'Event Type', 'Actor', 'Scope', 'Action', 'Reason'].join(','),
      ...filteredEvents.map(event => [
        event.timestamp,
        event.eventType,
        event.actor,
        event.scope,
        event.action,
        event.reason || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900">Audit Log</h2>
          <p className="text-slate-600">Immutable record of all control-affecting events</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by actor, scope, or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterEventType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterEventType('all')}
                size="sm"
              >
                All Events
              </Button>
              {eventTypes.map(type => (
                <Button
                  key={type}
                  variant={filterEventType === type ? 'default' : 'outline'}
                  onClick={() => setFilterEventType(type)}
                  size="sm"
                >
                  {formatEventType(type)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event List */}
      <div className="space-y-3">
        {filteredEvents.map(event => (
          <Card key={event.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="bg-slate-100 p-2 rounded">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-slate-900">{event.action}</h4>
                      <Badge className={getEventTypeColor(event.eventType)}>
                        {formatEventType(event.eventType)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 flex-shrink-0">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Actor:</span>
                      <span className="text-slate-900">{event.actor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Scope:</span>
                      <span className="text-slate-900">{event.scope}</span>
                    </div>
                  </div>

                  {event.reason && (
                    <div className="p-3 bg-slate-50 rounded text-sm">
                      <span className="text-slate-600">Reason: </span>
                      <span className="text-slate-900">{event.reason}</span>
                    </div>
                  )}

                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-3 p-3 bg-slate-50 rounded">
                      <p className="text-xs text-slate-600 mb-2">Metadata</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-slate-600">{key}: </span>
                            <span className="text-slate-900">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No audit events found matching your criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Audit log statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded">
              <p className="text-2xl text-slate-900">{events.length}</p>
              <p className="text-sm text-slate-600">Total Events</p>
            </div>
            {eventTypes.slice(0, 3).map(type => (
              <div key={type} className="text-center p-4 bg-slate-50 rounded">
                <p className="text-2xl text-slate-900">
                  {events.filter(e => e.eventType === type).length}
                </p>
                <p className="text-sm text-slate-600">{formatEventType(type)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
