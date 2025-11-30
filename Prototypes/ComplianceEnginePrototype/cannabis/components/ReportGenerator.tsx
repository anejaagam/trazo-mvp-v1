import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Download, FileText, CheckCircle, Clock, AlertTriangle, Upload, Database } from 'lucide-react';
import { useJurisdiction } from '../App';
import type { ComplianceReport, ReportType, ReportStatus } from '../types';

export function ReportGenerator() {
  const { jurisdiction } = useJurisdiction();
  const [reports, setReports] = useState<ComplianceReport[]>(mockReports);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('Metrc Monthly');
  const [reportingPeriod, setReportingPeriod] = useState('2024-11');

  const getReportTypeOptions = (): ReportType[] => {
    if (jurisdiction.code === 'CAN-CANNABIS') {
      return ['CTLS Monthly', 'Production Report', 'Destruction Report', 'Inventory Report', 'Sales Report'];
    }
    return ['Metrc Monthly', 'Seed-to-Sale Movement', 'Waste Reporting', 'Transaction Log'];
  };

  const filteredReports = reports.filter(r => r.jurisdiction === jurisdiction.code);

  const getStatusColor = (status: ReportStatus) => {
    const colors: Record<ReportStatus, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'pending-review': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'submitted': 'bg-blue-100 text-blue-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'error': 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>
          {jurisdiction.system === 'Metrc' ? 'Metrc Reporting' : 'CTLS Reporting'}
        </h2>
        <p className="text-slate-600">
          {jurisdiction.code === 'OR' && 'Automated monthly METRC upload for OLCC compliance'}
          {jurisdiction.code === 'MD' && 'State-specific Metrc data export and portal integration'}
          {jurisdiction.code === 'CAN-CANNABIS' && 'Automated Cannabis Tracking and Licensing System (CTLS) reporting'}
        </p>
      </div>

      {/* System Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>
            {jurisdiction.system === 'Metrc' ? 'Metrc Integration' : 'CTLS Integration'}
          </CardTitle>
          <CardDescription>
            {jurisdiction.reportingFrequency} reporting requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {jurisdiction.system === 'Metrc' && (
              <>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span>Seed-to-Sale Movement</span>
                  </div>
                  <p className="text-slate-600">All product movements tracked</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span>Waste Reporting</span>
                  </div>
                  <p className="text-slate-600">Disposal documentation</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Transaction Logs</span>
                  </div>
                  <p className="text-slate-600">RFID/tag data & compliance</p>
                </div>
              </>
            )}
            {jurisdiction.system === 'CTLS' && (
              <>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span>Production Tracking</span>
                  </div>
                  <p className="text-slate-600">GPP/QAP compliance</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span>Destruction Records</span>
                  </div>
                  <p className="text-slate-600">Health Canada requirements</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Inventory & Sales</span>
                  </div>
                  <p className="text-slate-600">Monthly submissions</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">Create Report</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>
                Create {jurisdiction.reportingFrequency.toLowerCase()} compliance report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={selectedReportType} onValueChange={(v) => setSelectedReportType(v as ReportType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getReportTypeOptions().map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="period">Reporting Period</Label>
                  <Input 
                    id="period" 
                    type="month" 
                    value={reportingPeriod}
                    onChange={(e) => setReportingPeriod(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Include Data</Label>
                <div className="space-y-2">
                  {jurisdiction.system === 'Metrc' && (
                    <>
                      <div className="flex items-center gap-2">
                        <Checkbox id="movement" defaultChecked />
                        <Label htmlFor="movement" className="cursor-pointer">
                          Seed-to-sale movement records
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="waste" defaultChecked />
                        <Label htmlFor="waste" className="cursor-pointer">
                          Waste disposal logs
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="transactions" defaultChecked />
                        <Label htmlFor="transactions" className="cursor-pointer">
                          Transaction and RFID/tag data
                        </Label>
                      </div>
                    </>
                  )}
                  {jurisdiction.system === 'CTLS' && (
                    <>
                      <div className="flex items-center gap-2">
                        <Checkbox id="production" defaultChecked />
                        <Label htmlFor="production" className="cursor-pointer">
                          Production data (GPP/QAP compliant)
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="destruction" defaultChecked />
                        <Label htmlFor="destruction" className="cursor-pointer">
                          Destruction records
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="inventory" defaultChecked />
                        <Label htmlFor="inventory" className="cursor-pointer">
                          Inventory levels
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="sales" defaultChecked />
                        <Label htmlFor="sales" className="cursor-pointer">
                          Sales data
                        </Label>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <Checkbox id="evidence" defaultChecked />
                    <Label htmlFor="evidence" className="cursor-pointer">
                      Link supporting evidence documents
                    </Label>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  {jurisdiction.system === 'Metrc' && (
                    <>
                      Data will be formatted for error-free {jurisdiction.name} portal upload. 
                      Reconciliation checks will run automatically before submission.
                    </>
                  )}
                  {jurisdiction.system === 'CTLS' && (
                    <>
                      Report will include data integrity checks and regulatory submission confirmation 
                      as required by Health Canada.
                    </>
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button className="flex-1" variant="outline">
                  Save as Draft
                </Button>
                <Button className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Generate & Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report History - {jurisdiction.name}</CardTitle>
              <CardDescription>
                All submitted compliance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.report_id}>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {report.report_id}
                        </code>
                      </TableCell>
                      <TableCell>{report.type}</TableCell>
                      <TableCell>{report.reporting_period}</TableCell>
                      <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {report.submitted_at ? new Date(report.submitted_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status === 'submitted' && <Clock className="w-3 h-3 mr-1" />}
                          {report.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {report.status === 'error' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          {report.export_url && (
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Checks</CardTitle>
              <CardDescription>
                Real-time {jurisdiction.system} compliance verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All reconciliation checks passed. System data matches {jurisdiction.system} records.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">Movement Records</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl">2,347</div>
                  <p className="text-slate-600">0 discrepancies</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">Waste Logs</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl">156</div>
                  <p className="text-slate-600">0 discrepancies</p>
                </div>
                {jurisdiction.system === 'Metrc' && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-600">Transactions</span>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-2xl">1,823</div>
                    <p className="text-slate-600">0 discrepancies</p>
                  </div>
                )}
                {jurisdiction.system === 'CTLS' && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-600">Inventory</span>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-2xl">4,521 kg</div>
                    <p className="text-slate-600">Verified</p>
                  </div>
                )}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">
                      {jurisdiction.system === 'Metrc' ? 'OLCC Status' : 'Health Canada Status'}
                    </span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-xl">Compliant</div>
                  <p className="text-slate-600">Last verified today</p>
                </div>
              </div>

              <Button className="w-full">
                Run Reconciliation Check
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Mock data
const mockReports: ComplianceReport[] = [
  {
    report_id: 'REP-2024-10-001',
    jurisdiction: 'OR',
    type: 'Metrc Monthly',
    reporting_period: '2024-10',
    created_at: '2024-10-28',
    submitted_at: '2024-10-31',
    status: 'accepted',
    linked_evidence: ['EV-001', 'EV-002', 'EV-003'],
    export_url: '/downloads/rep-2024-10-001.pdf',
  },
  {
    report_id: 'REP-2024-09-001',
    jurisdiction: 'OR',
    type: 'Metrc Monthly',
    reporting_period: '2024-09',
    created_at: '2024-09-28',
    submitted_at: '2024-09-30',
    status: 'accepted',
    linked_evidence: ['EV-010', 'EV-011'],
    export_url: '/downloads/rep-2024-09-001.pdf',
  },
  {
    report_id: 'REP-2024-10-MD-001',
    jurisdiction: 'MD',
    type: 'Seed-to-Sale Movement',
    reporting_period: '2024-10',
    created_at: '2024-10-30',
    submitted_at: '2024-10-31',
    status: 'accepted',
    linked_evidence: ['EV-020'],
    export_url: '/downloads/rep-2024-10-md-001.csv',
  },
  {
    report_id: 'REP-2024-10-CAN-001',
    jurisdiction: 'CAN-CANNABIS',
    type: 'CTLS Monthly',
    reporting_period: '2024-10',
    created_at: '2024-10-29',
    submitted_at: '2024-10-31',
    status: 'accepted',
    linked_evidence: ['EV-030', 'EV-031', 'EV-032'],
    export_url: '/downloads/rep-2024-10-can-001.pdf',
  },
];
