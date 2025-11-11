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
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Download, FileText, CheckCircle, Clock, AlertTriangle, Upload, ClipboardCheck, Flag } from 'lucide-react';
import type { ProduceReport, ReportStatus, CommodityType, AuditChecklist, AuditGap } from '../types';

export function ReportGenerator() {
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityType>('Leafy Greens');
  const [reportingPeriod, setReportingPeriod] = useState('2024-11');

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

  const getStatusColor = (status: ReportStatus) => {
    const colors: Record<ReportStatus, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'pending-review': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'submitted': 'bg-blue-100 text-blue-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'flagged': 'bg-orange-100 text-orange-800',
    };
    return colors[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Audit & Compliance Reporting</h2>
        <p className="text-slate-600">
          PrimusGFS v3.2 audit preparation and CFIA SFCR compliance reporting
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-600">PrimusGFS Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">87%</div>
            <Progress value={87} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-600">Flagged Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-orange-600">2</div>
            <p className="text-slate-600 mt-1">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-600">Evidence Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">2,347</div>
            <p className="text-green-600 mt-1">+124 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-600">Next Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl">Feb 15, 2025</div>
            <p className="text-slate-600 mt-1">99 days remaining</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="primusgfs">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="primusgfs">PrimusGFS Audit Prep</TabsTrigger>
          <TabsTrigger value="cfia">CFIA Reporting</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="primusgfs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PrimusGFS v3.2 Audit Preparation</CardTitle>
              <CardDescription>
                Automated checklist for GAP, GMP, and FSMS compliance categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <ClipboardCheck className="w-4 h-4" />
                <AlertTitle>Audit Scheduled</AlertTitle>
                <AlertDescription>
                  Next PrimusGFS audit window: February 15 - March 15, 2025. Current readiness: 87%
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="commodity">Select Commodity</Label>
                  <Select value={selectedCommodity} onValueChange={(v) => setSelectedCommodity(v as CommodityType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {commodities.map((commodity) => (
                        <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Audit Categories */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span>GAP</span>
                      <Badge variant="outline">92%</Badge>
                    </div>
                    <p className="text-slate-600 text-sm mb-2">Good Agricultural Practices</p>
                    <Progress value={92} />
                    <p className="text-sm text-slate-600 mt-2">23/25 requirements met</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span>GMP</span>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">85%</Badge>
                    </div>
                    <p className="text-slate-600 text-sm mb-2">Good Manufacturing Practices</p>
                    <Progress value={85} />
                    <p className="text-sm text-slate-600 mt-2">17/20 requirements met</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span>FSMS</span>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">84%</Badge>
                    </div>
                    <p className="text-slate-600 text-sm mb-2">Food Safety Management System</p>
                    <Progress value={84} />
                    <p className="text-sm text-slate-600 mt-2">21/25 requirements met</p>
                  </div>
                </div>

                {/* Flagged Gaps */}
                <div className="mt-4">
                  <h3 className="mb-3 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-orange-600" />
                    Flagged Gaps for Auditor Review
                  </h3>
                  <div className="space-y-2">
                    {mockGaps.map((gap) => (
                      <div key={gap.gap_id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-orange-100 text-orange-800">
                                {gap.category}
                              </Badge>
                              <Badge variant="outline">
                                {gap.severity}
                              </Badge>
                            </div>
                            <p>{gap.description}</p>
                            <p className="text-slate-600 text-sm mt-1">
                              Assigned to: {gap.assigned_to} • Due: {gap.target_completion_date}
                            </p>
                          </div>
                          <Badge variant="outline" className={
                            gap.status === 'open' ? 'bg-red-50 text-red-700' :
                            gap.status === 'in-progress' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-green-50 text-green-700'
                          }>
                            {gap.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Document Upload Schedule */}
                <div className="mt-4">
                  <h3 className="mb-3">Scheduled Document Uploads</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="trace-logs" defaultChecked />
                      <Label htmlFor="trace-logs" className="cursor-pointer">
                        Traceability logs (Last 90 days)
                      </Label>
                      <Badge variant="outline" className="ml-auto bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="sampling" />
                      <Label htmlFor="sampling" className="cursor-pointer">
                        Sampling results and lab reports
                      </Label>
                      <Badge variant="outline" className="ml-auto bg-yellow-50 text-yellow-700">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="food-safety" defaultChecked />
                      <Label htmlFor="food-safety" className="cursor-pointer">
                        Food safety plans and HACCP documentation
                      </Label>
                      <Badge variant="outline" className="ml-auto bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="corrective" />
                      <Label htmlFor="corrective" className="cursor-pointer">
                        Corrective action evidence and verification
                      </Label>
                      <Badge variant="outline" className="ml-auto bg-yellow-50 text-yellow-700">
                        <Clock className="w-3 h-3 mr-1" />
                        In Progress
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="training" defaultChecked />
                      <Label htmlFor="training" className="cursor-pointer">
                        Staff training logs and certifications
                      </Label>
                      <Badge variant="outline" className="ml-auto bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline">
                    Save Progress
                  </Button>
                  <Button className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Generate Audit Packet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cfia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CFIA Monthly Reporting</CardTitle>
              <CardDescription>
                Safe Food for Canadians Regulations (SFCR) compliance reporting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>SFCR License Active</AlertTitle>
                <AlertDescription>
                  License #: SFCR-2024-001234 • Valid until: December 31, 2025
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period">Reporting Period</Label>
                  <Input 
                    id="period" 
                    type="month" 
                    value={reportingPeriod}
                    onChange={(e) => setReportingPeriod(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="commodity-cfia">Commodity</Label>
                  <Select value={selectedCommodity} onValueChange={(v) => setSelectedCommodity(v as CommodityType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {commodities.map((commodity) => (
                        <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Movement Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="import" defaultChecked />
                    <Label htmlFor="import" className="cursor-pointer">
                      Import
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="export" defaultChecked />
                    <Label htmlFor="export" className="cursor-pointer">
                      Export
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="interprovincial" defaultChecked />
                    <Label htmlFor="interprovincial" className="cursor-pointer">
                      Interprovincial
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="domestic" />
                    <Label htmlFor="domestic" className="cursor-pointer">
                      Domestic Only
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Include Data</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="traceability" defaultChecked />
                    <Label htmlFor="traceability" className="cursor-pointer">
                      Traceability records (lot tracking, movement logs)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="incidents" defaultChecked />
                    <Label htmlFor="incidents" className="cursor-pointer">
                      Incident reports and non-conformances
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="recalls" />
                    <Label htmlFor="recalls" className="cursor-pointer">
                      Recall documentation (if applicable)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="evidence-cfia" defaultChecked />
                    <Label htmlFor="evidence-cfia" className="cursor-pointer">
                      Link supporting evidence documents
                    </Label>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="mb-3">Reporting Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Traceability Records</p>
                    <p className="text-xl">1,247</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Incidents</p>
                    <p className="text-xl">2</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Recalls</p>
                    <p className="text-xl">0</p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  E-form will be automatically generated and formatted for CFIA portal submission. 
                  Regulatory confirmation will be tracked upon successful filing.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button className="flex-1" variant="outline">
                  Save as Draft
                </Button>
                <Button className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Submit to CFIA Portal
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>
                All audit preparations and compliance filings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Filed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReports.map((report) => (
                    <TableRow key={report.report_id}>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {report.report_id}
                        </code>
                      </TableCell>
                      <TableCell>{report.audit_type}</TableCell>
                      <TableCell>{report.commodity}</TableCell>
                      <TableCell>{new Date(report.filed_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status === 'submitted' && <Clock className="w-3 h-3 mr-1" />}
                          {report.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {report.status === 'flagged' && <AlertTriangle className="w-3 h-3 mr-1" />}
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

          {/* Audit History */}
          <Card>
            <CardHeader>
              <CardTitle>Audit History</CardTitle>
              <CardDescription>
                Past PrimusGFS certifications and CFIA inspections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span>PrimusGFS v3.2 Certification</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Certified
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Audit Date</p>
                      <p>August 15, 2024</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Score</p>
                      <p>94%</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Valid Until</p>
                      <p>August 14, 2025</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span>CFIA Inspection</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      Passed
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Inspection Date</p>
                      <p>October 1, 2024</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Findings</p>
                      <p>0 major</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Next Inspection</p>
                      <p>TBD</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Mock data
const mockReports: ProduceReport[] = [
  {
    report_id: 'PRD-2024-11-001',
    commodity: 'Leafy Greens',
    audit_type: 'CFIA',
    filed_at: '2024-11-01',
    status: 'accepted',
    evidence_link: ['EV-001', 'EV-002'],
    export_url: '/downloads/prd-2024-11-001.pdf',
  },
  {
    report_id: 'PRD-2024-10-001',
    commodity: 'Tomatoes',
    audit_type: 'CFIA',
    filed_at: '2024-10-31',
    status: 'accepted',
    evidence_link: ['EV-010'],
    export_url: '/downloads/prd-2024-10-001.pdf',
  },
  {
    report_id: 'PRD-2024-08-PGS',
    commodity: 'Leafy Greens',
    audit_type: 'PrimusGFS',
    filed_at: '2024-08-15',
    status: 'accepted',
    evidence_link: ['EV-020', 'EV-021', 'EV-022'],
    export_url: '/downloads/prd-2024-08-pgs.zip',
  },
];

const mockGaps: AuditGap[] = [
  {
    gap_id: 'GAP-001',
    category: 'GMP',
    description: 'Water testing protocol requires monthly sampling for irrigation water sources',
    severity: 'major',
    corrective_action: 'Implement monthly water sampling schedule and lab analysis',
    target_completion_date: '2024-11-20',
    status: 'in-progress',
    assigned_to: 'FSMS Coordinator',
  },
  {
    gap_id: 'GAP-002',
    category: 'FSMS',
    description: 'Pest control monitoring log missing entries for October',
    severity: 'minor',
    corrective_action: 'Update pest control log and implement daily checklist reminder',
    target_completion_date: '2024-11-15',
    status: 'in-progress',
    assigned_to: 'Production Manager',
  },
];
