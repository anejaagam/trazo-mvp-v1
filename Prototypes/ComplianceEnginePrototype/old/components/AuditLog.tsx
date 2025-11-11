import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, Download, Shield, Filter } from 'lucide-react';

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const auditEntries = [
    {
      id: 'AUD-2025-5623',
      timestamp: '2025-10-15 14:32:18 UTC',
      user: 'sarah.chen@trazo.com',
      action: 'EVIDENCE_UPLOADED',
      resource: 'Lab Result PDF - Batch #2045',
      jurisdiction: 'Canada-Cannabis',
      ipAddress: '192.168.1.45',
      status: 'success',
      hash: 'a7f5c3d9e2b8...',
    },
    {
      id: 'AUD-2025-5622',
      timestamp: '2025-10-15 09:15:42 UTC',
      user: 'mike.johnson@trazo.com',
      action: 'RECORD_LOCKED',
      resource: 'Batch Record #2045',
      jurisdiction: 'Canada-Cannabis',
      ipAddress: '192.168.1.23',
      status: 'success',
      hash: 'b8e6d4c1f3a9...',
    },
    {
      id: 'AUD-2025-5621',
      timestamp: '2025-10-14 16:20:33 UTC',
      user: 'system@trazo.com',
      action: 'REPORT_GENERATED',
      resource: 'CTLS Monthly Report - September',
      jurisdiction: 'Canada-Cannabis',
      ipAddress: '10.0.0.1',
      status: 'success',
      hash: 'c9f7e5d2a4b1...',
    },
    {
      id: 'AUD-2025-5620',
      timestamp: '2025-10-14 11:45:17 UTC',
      user: 'alex.kumar@trazo.com',
      action: 'SIGNATURE_CAPTURED',
      resource: 'SOP Training - HACCP Protocol',
      jurisdiction: 'PrimusGFS',
      ipAddress: '192.168.1.67',
      status: 'success',
      hash: 'd1a8f6e3b5c2...',
    },
    {
      id: 'AUD-2025-5619',
      timestamp: '2025-10-14 08:30:52 UTC',
      user: 'emma.rodriguez@trazo.com',
      action: 'TEMPLATE_MODIFIED',
      resource: 'California State Template',
      jurisdiction: 'US-California',
      ipAddress: '192.168.1.89',
      status: 'success',
      hash: 'e2b9a7f4c6d3...',
    },
    {
      id: 'AUD-2025-5618',
      timestamp: '2025-10-13 17:22:08 UTC',
      user: 'james.wilson@trazo.com',
      action: 'CALIBRATION_RECORDED',
      resource: 'pH Meter - Device #PM-104',
      jurisdiction: 'Canada-Produce',
      ipAddress: '192.168.1.34',
      status: 'success',
      hash: 'f3c1b8a5d7e4...',
    },
  ];

  const getActionBadge = (action: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      EVIDENCE_UPLOADED: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Evidence' },
      RECORD_LOCKED: { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Lock' },
      REPORT_GENERATED: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Report' },
      SIGNATURE_CAPTURED: { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Signature' },
      TEMPLATE_MODIFIED: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Template' },
      CALIBRATION_RECORDED: { color: 'bg-cyan-50 text-cyan-700 border-cyan-200', label: 'Calibration' },
    };

    const variant = variants[action] || { color: 'bg-slate-50 text-slate-700 border-slate-200', label: action };
    return (
      <Badge variant="outline" className={variant.color}>
        {variant.label}
      </Badge>
    );
  };

  const filteredEntries = auditEntries.filter((entry) => {
    const matchesSearch = searchTerm === '' || 
      entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || entry.action === filterType;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Immutable Audit Log
              </CardTitle>
              <CardDescription>
                Cryptographically secured audit trail with blockchain-style hash chaining
              </CardDescription>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Log
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by user, resource, or audit ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="EVIDENCE_UPLOADED">Evidence Uploaded</SelectItem>
                <SelectItem value="RECORD_LOCKED">Record Locked</SelectItem>
                <SelectItem value="REPORT_GENERATED">Report Generated</SelectItem>
                <SelectItem value="SIGNATURE_CAPTURED">Signature Captured</SelectItem>
                <SelectItem value="TEMPLATE_MODIFIED">Template Modified</SelectItem>
                <SelectItem value="CALIBRATION_RECORDED">Calibration Recorded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Audit ID</TableHead>
                  <TableHead>Timestamp (UTC)</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead>Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono">{entry.id}</TableCell>
                    <TableCell className="text-slate-600">{entry.timestamp}</TableCell>
                    <TableCell>{entry.user}</TableCell>
                    <TableCell>{getActionBadge(entry.action)}</TableCell>
                    <TableCell>{entry.resource}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.jurisdiction}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-slate-500">{entry.hash}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p>Immutable Audit Protection</p>
                <p className="text-slate-600">
                  All audit entries are cryptographically hashed and chained together, ensuring tamper-proof 
                  compliance records. Each entry references the previous hash, creating an immutable audit trail.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
