import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { FileText, Download, Search, Filter, Shield } from 'lucide-react';
import type { AuditEntry, AuditAction, CommodityType } from '../types';

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<'all' | AuditAction>('all');
  const [selectedCommodity, setSelectedCommodity] = useState<'all' | CommodityType>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const auditEntries: AuditEntry[] = [
    {
      audit_id: 'AUD-2024-5623',
      timestamp: '2024-11-08T09:30:00Z',
      user_id: 'USR-001',
      user_name: 'Sarah Chen',
      action: 'EVIDENCE_UPLOADED',
      resource_type: 'evidence',
      resource_id: 'EV-2024-1247',
      commodity: 'Leafy Greens',
      ip_address: '192.168.1.100',
      status: 'success',
      details: 'Uploaded water quality test results for irrigation system',
      hash: 'a3f5d8c9e2b1f4a6d7c8e9f0a1b2c3d4',
    },
    {
      audit_id: 'AUD-2024-5622',
      timestamp: '2024-11-08T08:15:00Z',
      user_id: 'USR-002',
      user_name: 'Alex Kumar',
      action: 'REPORT_SUBMITTED',
      resource_type: 'report',
      resource_id: 'PRD-2024-11-001',
      ip_address: '192.168.1.101',
      status: 'success',
      details: 'Submitted CFIA monthly traceability report',
      hash: 'b4e6c9d0f3a2b5c7d8e9f0a1b2c3d4e5',
    },
    {
      audit_id: 'AUD-2024-5621',
      timestamp: '2024-11-07T16:45:00Z',
      user_id: 'USR-003',
      user_name: 'Mike Johnson',
      action: 'CORRECTIVE_ACTION_INITIATED',
      resource_type: 'audit',
      resource_id: 'CA-2024-10',
      commodity: 'Tomatoes',
      ip_address: '192.168.1.102',
      status: 'success',
      details: 'Initiated corrective action for pest control monitoring gap',
      hash: 'c5f7d1e0a3b4c6d8e9f0a1b2c3d4e5f6',
    },
    {
      audit_id: 'AUD-2024-5620',
      timestamp: '2024-11-07T14:20:00Z',
      user_id: 'USR-004',
      user_name: 'Jennifer Lee',
      action: 'EXPORT_GENERATED',
      resource_type: 'report',
      resource_id: 'PRD-2024-10-001',
      ip_address: '192.168.1.103',
      status: 'success',
      details: 'Generated PDF export of October compliance report',
      hash: 'd6e8f2a1b4c5d7e9f0a1b2c3d4e5f6a7',
    },
    {
      audit_id: 'AUD-2024-5619',
      timestamp: '2024-11-06T11:30:00Z',
      user_id: 'USR-005',
      user_name: 'David Martinez',
      action: 'AUDIT_SCHEDULED',
      resource_type: 'audit',
      resource_id: 'PGS-2025-001',
      ip_address: '192.168.1.104',
      status: 'success',
      details: 'Scheduled PrimusGFS v3.2 audit for February 2025',
      hash: 'e7f9a2b5c6d8e0f1a2b3c4d5e6f7a8b9',
    },
    {
      audit_id: 'AUD-2024-5618',
      timestamp: '2024-11-05T10:15:00Z',
      user_id: 'USR-001',
      user_name: 'Sarah Chen',
      action: 'GAP_IDENTIFIED',
      resource_type: 'audit',
      resource_id: 'GAP-001',
      ip_address: '192.168.1.100',
      status: 'success',
      details: 'Flagged gap in water testing protocol during internal audit',
      hash: 'f8a0b3c6d9e1f2a3b4c5d6e7f8a9b0c1',
    },
    {
      audit_id: 'AUD-2024-5617',
      timestamp: '2024-11-04T15:45:00Z',
      user_id: 'USR-002',
      user_name: 'Alex Kumar',
      action: 'EVIDENCE_ACCESSED',
      resource_type: 'evidence',
      resource_id: 'EV-2024-1242',
      ip_address: '192.168.1.101',
      status: 'success',
      details: 'Downloaded HACCP plan for audit preparation',
      hash: 'a9b1c4d7e0f3a2b5c6d8e9f0a1b2c3d4',
    },
    {
      audit_id: 'AUD-2024-5616',
      timestamp: '2024-11-03T09:00:00Z',
      user_id: 'USR-006',
      user_name: 'Admin User',
      action: 'PERMISSION_CHANGED',
      resource_type: 'user',
      resource_id: 'USR-007',
      ip_address: '192.168.1.105',
      status: 'success',
      details: 'Updated permissions for new QA team member',
      old_value: 'viewer',
      new_value: 'qa-manager',
      hash: 'b0c2d5e8f1a4b3c6d7e9f0a1b2c3d4e5',
    },
    {
      audit_id: 'AUD-2024-5615',
      timestamp: '2024-11-01T13:30:00Z',
      user_id: 'USR-003',
      user_name: 'Mike Johnson',
      action: 'REPORT_APPROVED',
      resource_type: 'report',
      resource_id: 'PRD-2024-10-001',
      ip_address: '192.168.1.102',
      status: 'success',
      details: 'Approved October monthly report for submission',
      hash: 'c1d3e6f9a2b5c4d7e8f0a1b2c3d4e5f6',
    },
    {
      audit_id: 'AUD-2024-5614',
      timestamp: '2024-10-31T16:00:00Z',
      user_id: 'USR-004',
      user_name: 'Jennifer Lee',
      action: 'INCIDENT_LOGGED',
      resource_type: 'incident',
      resource_id: 'INC-2024-10',
      commodity: 'Leafy Greens',
      ip_address: '192.168.1.103',
      status: 'success',
      details: 'Logged customer complaint regarding product quality',
      hash: 'd2e4f7a0b3c6d5e8f9a1b2c3d4e5f6a7',
    },
  ];

  const auditActions: AuditAction[] = [
    'REPORT_CREATED',
    'REPORT_SUBMITTED',
    'REPORT_APPROVED',
    'REPORT_FLAGGED',
    'EVIDENCE_UPLOADED',
    'EVIDENCE_ACCESSED',
    'EVIDENCE_DELETED',
    'EXPORT_GENERATED',
    'USER_LOGIN',
    'PERMISSION_CHANGED',
    'AUDIT_SCHEDULED',
    'GAP_IDENTIFIED',
    'CORRECTIVE_ACTION_INITIATED',
    'INCIDENT_LOGGED',
    'RECALL_INITIATED',
  ];

  const commodities: CommodityType[] = [
    'Leafy Greens',
    'Tomatoes',
    'Berries',
    'Root Vegetables',
    'Stone Fruit',
    'Citrus',
    'Herbs',
    'Mixed Vegetables',
  ];

  const filteredEntries = auditEntries.filter((entry) => {
    const matchesSearch = entry.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.resource_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === 'all' || entry.action === selectedAction;
    const matchesCommodity = selectedCommodity === 'all' || entry.commodity === selectedCommodity;
    const matchesDateFrom = !dateFrom || new Date(entry.timestamp) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(entry.timestamp) <= new Date(dateTo);
    return matchesSearch && matchesAction && matchesCommodity && matchesDateFrom && matchesDateTo;
  });

  const getStatusColor = (status: AuditEntry['status']) => {
    const colors = {
      'success': 'bg-green-100 text-green-800',
      'failure': 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getActionColor = (action: AuditAction) => {
    if (action.includes('EVIDENCE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('REPORT')) return 'bg-purple-100 text-purple-800';
    if (action.includes('GAP') || action.includes('CORRECTIVE')) return 'bg-orange-100 text-orange-800';
    if (action.includes('INCIDENT') || action.includes('RECALL')) return 'bg-red-100 text-red-800';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Audit Trail</h2>
          <p className="text-slate-600">
            Immutable audit log with tamper-proofing and regulator-ready exports
          </p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Audit Trail
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-600">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">5,623</div>
            <p className="text-green-600 mt-1">+47 today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-600">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">12</div>
            <p className="text-slate-600 mt-1">Across departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-600">Tamper-Proof</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl flex items-center gap-2">
              <Shield className="w-8 h-8 text-green-600" />
              100%
            </div>
            <p className="text-slate-600 mt-1">SHA-256 hashing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-600">Export Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-slate-600 mt-1">PDF & CSV formats</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filtering
          </CardTitle>
          <CardDescription>
            Filter by audit type, commodity, incident, corrective action, or keyword
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedAction} onValueChange={(v) => setSelectedAction(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {auditActions.map((action) => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCommodity} onValueChange={(v) => setSelectedCommodity(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Commodity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Commodities</SelectItem>
                {commodities.map((commodity) => (
                  <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="From"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <Input
                type="date"
                placeholder="To"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="pdf" defaultChecked />
                <Label htmlFor="pdf" className="cursor-pointer">
                  Regulator-ready PDF packet
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="csv" defaultChecked />
                <Label htmlFor="csv" className="cursor-pointer">
                  Spreadsheet export for compliance management
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries ({filteredEntries.length})</CardTitle>
          <CardDescription>
            Complete activity log with cryptographic verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.audit_id}>
                  <TableCell>
                    <div>
                      <div>{new Date(entry.timestamp).toLocaleString()}</div>
                      <p className="text-slate-500 text-xs">{entry.ip_address}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{entry.user_name}</div>
                      <p className="text-slate-500 text-xs">{entry.user_id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionColor(entry.action)} variant="outline">
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="outline" className="text-xs mb-1">
                        {entry.resource_type}
                      </Badge>
                      <p className="text-xs font-mono">{entry.resource_id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.commodity ? (
                      <Badge variant="outline">{entry.commodity}</Badge>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="text-sm">{entry.details}</p>
                      {entry.old_value && entry.new_value && (
                        <p className="text-xs text-slate-500 mt-1">
                          Changed from "{entry.old_value}" to "{entry.new_value}"
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(entry.status)}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded block truncate max-w-[100px]">
                      {entry.hash.substring(0, 16)}...
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Audit Trail</CardTitle>
          <CardDescription>
            Generate regulator- and auditor-ready documentation packages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                PDF Audit Packet
              </h4>
              <p className="text-slate-600 text-sm mb-3">
                Complete audit trail formatted for PrimusGFS and CFIA auditors. Includes chronological entries, hash verification, and supporting evidence references.
              </p>
              <Button className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Generate PDF Report
              </Button>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Spreadsheet Export
              </h4>
              <p className="text-slate-600 text-sm mb-3">
                Tabular format for internal compliance management. Supports filtering, analysis, and integration with compliance tracking systems.
              </p>
              <Button className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export to CSV/Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
