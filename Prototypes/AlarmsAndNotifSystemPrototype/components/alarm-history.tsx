import { useState } from 'react';
import { Alarm, AlarmCategory, AlarmSeverity } from '../types/alarm';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Search, Download, Filter, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface AlarmHistoryProps {
  alarms: Alarm[];
}

export function AlarmHistory({ alarms }: AlarmHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<AlarmCategory | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<AlarmSeverity | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7days');
  
  // Get unique sites
  const sites = Array.from(new Set(alarms.map(a => a.site)));
  
  // Filter alarms
  const filteredAlarms = alarms.filter(alarm => {
    const matchesSearch = searchQuery === '' || 
      alarm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alarm.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alarm.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alarm.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSite = selectedSite === 'all' || alarm.site === selectedSite;
    const matchesCategory = selectedCategory === 'all' || alarm.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || alarm.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || alarm.status === selectedStatus;
    
    // Date range filter
    let matchesDateRange = true;
    const now = Date.now();
    if (dateRange === '24hours') {
      matchesDateRange = alarm.raisedAt.getTime() > now - 24 * 60 * 60 * 1000;
    } else if (dateRange === '7days') {
      matchesDateRange = alarm.raisedAt.getTime() > now - 7 * 24 * 60 * 60 * 1000;
    } else if (dateRange === '30days') {
      matchesDateRange = alarm.raisedAt.getTime() > now - 30 * 24 * 60 * 60 * 1000;
    }
    
    return matchesSearch && matchesSite && matchesCategory && matchesSeverity && matchesStatus && matchesDateRange;
  });
  
  // Sort by most recent
  const sortedAlarms = [...filteredAlarms].sort((a, b) => b.raisedAt.getTime() - a.raisedAt.getTime());
  
  const handleExport = () => {
    // In a real app, this would export to CSV or PDF
    alert('Exporting alarm history...');
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'acknowledged':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'snoozed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const calculateDuration = (alarm: Alarm) => {
    if (alarm.resolvedAt) {
      const duration = alarm.resolvedAt.getTime() - alarm.raisedAt.getTime();
      const hours = Math.floor(duration / (1000 * 60 * 60));
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    return '-';
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Alarm History</h1>
          <p className="text-gray-600">Immutable audit log for compliance and analysis</p>
        </div>
        
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
      
      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24hours">Last 24 Hours</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger>
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map(site => (
                <SelectItem key={site} value={site}>{site}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="environmental">Environmental</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="irrigation">Irrigation</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedSeverity} onValueChange={(value) => setSelectedSeverity(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="snoozed">Snoozed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-gray-600 mb-1">Total Alarms</p>
          <h2>{filteredAlarms.length}</h2>
        </Card>
        
        <Card className="p-4">
          <p className="text-gray-600 mb-1">Resolved</p>
          <h2 className="text-green-600">
            {filteredAlarms.filter(a => a.status === 'resolved').length}
          </h2>
        </Card>
        
        <Card className="p-4">
          <p className="text-gray-600 mb-1">Avg. Response Time</p>
          <h2>
            {(() => {
              const acknowledged = filteredAlarms.filter(a => a.acknowledgedAt);
              if (acknowledged.length === 0) return '-';
              const avgTime = acknowledged.reduce((sum, a) => {
                return sum + (a.acknowledgedAt!.getTime() - a.raisedAt.getTime());
              }, 0) / acknowledged.length;
              const minutes = Math.floor(avgTime / (1000 * 60));
              return `${minutes}m`;
            })()}
          </h2>
        </Card>
        
        <Card className="p-4">
          <p className="text-gray-600 mb-1">Avg. Resolution Time</p>
          <h2>
            {(() => {
              const resolved = filteredAlarms.filter(a => a.resolvedAt);
              if (resolved.length === 0) return '-';
              const avgTime = resolved.reduce((sum, a) => {
                return sum + (a.resolvedAt!.getTime() - a.raisedAt.getTime());
              }, 0) / resolved.length;
              const hours = Math.floor(avgTime / (1000 * 60 * 60));
              const minutes = Math.floor((avgTime % (1000 * 60 * 60)) / (1000 * 60));
              if (hours > 0) return `${hours}h ${minutes}m`;
              return `${minutes}m`;
            })()}
          </h2>
        </Card>
      </div>
      
      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alarm ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Site / Room</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Raised At</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Resolved By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAlarms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No alarms found matching the selected filters
                </TableCell>
              </TableRow>
            ) : (
              sortedAlarms.map(alarm => (
                <TableRow key={alarm.id}>
                  <TableCell>
                    <code className="text-purple-600">{alarm.id}</code>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{alarm.title}</div>
                      {alarm.device && (
                        <div className="text-gray-500">{alarm.device}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{alarm.site}</div>
                      {alarm.room && (
                        <div className="text-gray-500">{alarm.room}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{alarm.category}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getSeverityColor(alarm.severity)}>
                      {alarm.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(alarm.status)}>
                      {alarm.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{format(alarm.raisedAt, 'MMM dd, h:mm a')}</span>
                    </div>
                  </TableCell>
                  <TableCell>{calculateDuration(alarm)}</TableCell>
                  <TableCell>
                    {alarm.resolvedBy ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span>{alarm.resolvedBy}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
