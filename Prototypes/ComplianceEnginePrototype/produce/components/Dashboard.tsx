import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, Clock, FileText, Folder, TrendingUp, AlertTriangle, Calendar, Activity, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useRegion } from '../App';
import type { ComplianceStatus, UpcomingDeadline, ComplianceMetric, RiskAssessment } from '../types';

export function Dashboard() {
  const { region } = useRegion();
  
  // Compliance status by area (region-specific)
  const allComplianceStatuses: ComplianceStatus[] = [
    // US Statuses
    {
      region: 'US',
      area: 'FSMA',
      status: 'compliant',
      readiness_percentage: 96,
      outstanding_corrective_actions: 1,
      last_audit_date: '2024-09-15',
      flagged_gaps: 0,
    },
    {
      region: 'US',
      area: 'USDA-GAP',
      status: 'compliant',
      readiness_percentage: 92,
      outstanding_corrective_actions: 0,
      last_audit_date: '2024-07-20',
      next_audit_date: '2025-07-20',
      flagged_gaps: 0,
    },
    {
      region: 'US',
      area: 'State-Ag',
      status: 'warning',
      readiness_percentage: 85,
      outstanding_corrective_actions: 2,
      flagged_gaps: 1,
    },
    {
      region: 'US',
      area: 'Traceability',
      status: 'compliant',
      readiness_percentage: 100,
      outstanding_corrective_actions: 0,
      flagged_gaps: 0,
    },
    // Canada Statuses
    {
      region: 'Canada',
      area: 'PrimusGFS',
      status: 'warning',
      readiness_percentage: 87,
      outstanding_corrective_actions: 3,
      last_audit_date: '2024-08-15',
      next_audit_date: '2025-02-15',
      flagged_gaps: 2,
    },
    {
      region: 'Canada',
      area: 'CFIA',
      status: 'compliant',
      readiness_percentage: 100,
      outstanding_corrective_actions: 0,
      last_audit_date: '2024-10-01',
      flagged_gaps: 0,
    },
    {
      region: 'Canada',
      area: 'Traceability',
      status: 'compliant',
      readiness_percentage: 98,
      outstanding_corrective_actions: 1,
      flagged_gaps: 0,
    },
    {
      region: 'Canada',
      area: 'Food Safety',
      status: 'compliant',
      readiness_percentage: 95,
      outstanding_corrective_actions: 0,
      flagged_gaps: 0,
    },
  ];

  const complianceStatuses = allComplianceStatuses.filter(s => s.region === region);

  // Risk assessments
  const riskAssessments: RiskAssessment[] = [
    {
      segment: 'commodity',
      name: 'Leafy Greens',
      risk_level: 'high',
      issues: region === 'US' 
        ? ['FSMA 204 traceability required', 'Enhanced water testing']
        : ['Enhanced sampling required', 'Water testing pending'],
      mitigation_status: 'in-progress',
    },
    {
      segment: 'facility',
      name: 'Packing House A',
      risk_level: 'medium',
      issues: ['Pest control log update needed'],
      mitigation_status: 'in-progress',
    },
    {
      segment: 'supply-chain',
      name: 'Supplier Network',
      risk_level: 'low',
      issues: [],
      mitigation_status: 'complete',
    },
  ];

  // Upcoming deadlines (region-specific)
  const allUpcomingDeadlines: UpcomingDeadline[] = [
    // US Deadlines
    {
      id: 'us-1',
      title: 'California CDFA License Renewal',
      region: 'US',
      type: 'permit-renewal',
      due_date: '2024-12-01',
      days_until_due: 23,
      priority: 'critical',
      completed: false,
      assigned_to: 'Compliance Manager',
    },
    {
      id: 'us-2',
      title: 'FSMA Water Testing - Quarterly',
      region: 'US',
      type: 'report-filing',
      due_date: '2024-11-30',
      days_until_due: 22,
      priority: 'high',
      completed: false,
      assigned_to: 'QA Team',
    },
    {
      id: 'us-3',
      title: 'USDA GAP Audit Scheduled',
      region: 'US',
      type: 'audit-window',
      due_date: '2025-07-20',
      days_until_due: 254,
      priority: 'medium',
      completed: false,
      assigned_to: 'QA Manager',
    },
    {
      id: 'us-4',
      title: 'Staff FSMA Training Recertification',
      region: 'US',
      type: 'staff-recertification',
      due_date: '2024-12-15',
      days_until_due: 37,
      priority: 'high',
      completed: false,
      assigned_to: 'HR Department',
    },
    // Canada Deadlines
    {
      id: 'ca-1',
      title: 'PrimusGFS Audit Window Opens',
      region: 'Canada',
      type: 'audit-window',
      due_date: '2025-02-15',
      days_until_due: 99,
      priority: 'high',
      completed: false,
      assigned_to: 'QA Team',
    },
    {
      id: 'ca-2',
      title: 'CFIA Monthly Traceability Report',
      region: 'Canada',
      type: 'report-filing',
      due_date: '2024-11-30',
      days_until_due: 22,
      priority: 'medium',
      completed: false,
      assigned_to: 'Compliance Manager',
    },
    {
      id: 'ca-3',
      title: 'Staff Food Safety Recertification',
      region: 'Canada',
      type: 'staff-recertification',
      due_date: '2024-12-15',
      days_until_due: 37,
      priority: 'high',
      completed: false,
      assigned_to: 'HR Department',
    },
    {
      id: 'ca-4',
      title: 'Corrective Action: Water Testing Protocol',
      region: 'Canada',
      type: 'corrective-action',
      due_date: '2024-11-20',
      days_until_due: 12,
      priority: 'critical',
      completed: false,
      assigned_to: 'FSMS Coordinator',
    },
  ];

  const upcomingDeadlines = allUpcomingDeadlines.filter(d => d.region === region);

  // Metrics
  const metrics: ComplianceMetric[] = region === 'US' 
    ? [
        { label: 'FSMA Readiness', value: '96%', trend: '+4%', status: 'good', region: 'US' },
        { label: 'Evidence Documents', value: '3,124', trend: '+187', status: 'good', region: 'US' },
        { label: 'Outstanding Actions', value: '3', trend: '-1', status: 'good', region: 'US' },
        { label: 'State Compliance', value: '85%', trend: '-2%', status: 'warning', region: 'US' },
      ]
    : [
        { label: 'Audit Readiness', value: '87%', trend: '+5%', status: 'warning', region: 'Canada' },
        { label: 'Evidence Documents', value: '2,347', trend: '+124', status: 'good', region: 'Canada' },
        { label: 'Outstanding Actions', value: '4', trend: '-2', status: 'good', region: 'Canada' },
        { label: 'Compliance Rate', value: '96%', trend: '+3%', status: 'good', region: 'Canada' },
      ];

  const getPriorityColor = (priority: UpcomingDeadline['priority']) => {
    const colors = {
      'low': 'bg-slate-100 text-slate-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const getStatusColor = (status: ComplianceStatus['status']) => {
    const colors = {
      'compliant': 'text-green-600',
      'warning': 'text-yellow-600',
      'critical': 'text-red-600',
    };
    return colors[status];
  };

  const getRiskColor = (level: RiskAssessment['risk_level']) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800',
    };
    return colors[level];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>
            {region === 'US' ? 'US Produce Compliance Dashboard' : 'Canada Produce Compliance Dashboard'}
          </h2>
          <p className="text-slate-600">
            {region === 'US' 
              ? 'Real-time overview of FSMA, USDA GAP, and state agriculture compliance'
              : 'Real-time overview of food safety compliance and audit readiness'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 px-4 py-2">
            <Activity className="w-4 h-4 mr-2" />
            Systems Active
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-600">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{metric.value}</div>
              <p className={`mt-1 ${metric.status === 'good' ? 'text-green-600' : 'text-yellow-600'}`}>
                {metric.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {region === 'US' && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            California CDFA license renewal due Dec 1, 2024. Florida DOACS inspection scheduled for Nov 25.
          </AlertDescription>
        </Alert>
      )}
      {region === 'Canada' && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Corrective Action Required</AlertTitle>
          <AlertDescription>
            Water testing protocol update due Nov 20, 2024. 2 PrimusGFS gaps flagged requiring evidence upload.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Status by Area */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status Overview</CardTitle>
            <CardDescription>
              {region === 'US' 
                ? 'Federal and state compliance readiness'
                : 'Real-time readiness across all compliance areas'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {complianceStatuses.map((status) => (
              <div key={status.area} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{status.area}</span>
                    {status.status === 'compliant' && <CheckCircle className={`w-4 h-4 ${getStatusColor(status.status)}`} />}
                    {status.status === 'warning' && <AlertTriangle className={`w-4 h-4 ${getStatusColor(status.status)}`} />}
                    {status.status === 'critical' && <AlertCircle className={`w-4 h-4 ${getStatusColor(status.status)}`} />}
                  </div>
                  <span>{status.readiness_percentage}%</span>
                </div>
                <Progress value={status.readiness_percentage} className="mb-2" />
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-slate-600">Outstanding</p>
                    <p>{status.outstanding_corrective_actions}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Flagged Gaps</p>
                    <p>{status.flagged_gaps}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Next Audit</p>
                    <p className="text-xs">
                      {status.next_audit_date ? new Date(status.next_audit_date).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Assessment
            </CardTitle>
            <CardDescription>
              Risk levels by commodity, facility, and supply chain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskAssessments.map((assessment, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{assessment.name}</span>
                      <Badge className={getRiskColor(assessment.risk_level)} variant="outline">
                        {assessment.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-slate-600 text-sm">
                      {assessment.segment === 'commodity' && 'Commodity Risk'}
                      {assessment.segment === 'facility' && 'Facility Risk'}
                      {assessment.segment === 'supply-chain' && 'Supply Chain Risk'}
                    </p>
                  </div>
                </div>
                {assessment.issues.length > 0 ? (
                  <div className="space-y-1">
                    {assessment.issues.map((issue, i) => (
                      <p key={i} className="text-sm text-slate-600">• {issue}</p>
                    ))}
                    <Badge variant="outline" className="mt-2">
                      {assessment.mitigation_status === 'complete' && 'Mitigation Complete'}
                      {assessment.mitigation_status === 'in-progress' && 'Mitigation In Progress'}
                      {assessment.mitigation_status === 'pending' && 'Mitigation Pending'}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-green-600">No issues identified</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Deadlines
          </CardTitle>
          <CardDescription>
            {region === 'US'
              ? 'State inspections, license renewals, and federal reporting'
              : 'Audit windows, report filings, and staff recertifications'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="p-3 bg-slate-50 rounded-lg border-l-4" style={{
                borderLeftColor: deadline.priority === 'critical' ? '#dc2626' : 
                                 deadline.priority === 'high' ? '#ea580c' :
                                 deadline.priority === 'medium' ? '#2563eb' : '#64748b'
              }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{deadline.title}</span>
                      <Badge className={getPriorityColor(deadline.priority)} variant="outline">
                        {deadline.priority}
                      </Badge>
                    </div>
                    <p className="text-slate-600 text-sm">
                      Due: {new Date(deadline.due_date).toLocaleDateString()} 
                      <span className="ml-2">({deadline.days_until_due} days)</span>
                    </p>
                    {deadline.assigned_to && (
                      <p className="text-slate-500 text-sm mt-1">
                        Assigned to: {deadline.assigned_to}
                      </p>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-2">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Integration Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {region === 'US' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>FSMA Compliance</CardTitle>
                <CardDescription>21 CFR Part 112 Monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-600">Worker Hygiene</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <Progress value={100} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-600">Water Testing</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <Progress value={100} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-600">Equipment Cleaning</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <Progress value={95} />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">FDA Inspection Ready</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <Shield className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>State Agriculture Licenses</CardTitle>
                <CardDescription>Multi-state registration status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <div>California CDFA</div>
                      <p className="text-slate-600 text-sm">Expires Dec 1, 2024</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      Renewing
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <div>Florida DOACS</div>
                      <p className="text-slate-600 text-sm">Expires Mar 15, 2025</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div>New York DAM</div>
                      <p className="text-slate-600 text-sm">Expires Jun 30, 2025</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {region === 'Canada' && (
          <Card>
            <CardHeader>
              <CardTitle>PrimusGFS Audit Prep</CardTitle>
              <CardDescription>v3.2 Certification Status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-600">GAP Compliance</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-600">GMP Compliance</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-600">FSMS Compliance</span>
                    <span>84%</span>
                  </div>
                  <Progress value={84} />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Overall Readiness</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      87%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest compliance actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {region === 'US' ? (
                <>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <div>FSMA Water Test</div>
                      <p className="text-slate-600">Uploaded 2h ago</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Compliant
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <div>State License Filed</div>
                      <p className="text-slate-600">Filed today</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Pending
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div>FSMA 204 Record</div>
                      <p className="text-slate-600">Logged today</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Verified
                    </Badge>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <div>CFIA Report Submitted</div>
                      <p className="text-slate-600">October Monthly</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Accepted
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <div>Water Test Results</div>
                      <p className="text-slate-600">Uploaded 2h ago</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Verified
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div>Corrective Action</div>
                      <p className="text-slate-600">Initiated today</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      In Progress
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Evidence Vault
            </CardTitle>
            <CardDescription>Secure document storage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Documents</span>
                <span>{region === 'US' ? '3,124' : '2,347'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Added This Month</span>
                <span className="text-green-600">{region === 'US' ? '+187' : '+124'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Storage Used</span>
                <span>{region === 'US' ? '7.2 GB' : '5.8 GB'}</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-600">Retention Compliance</span>
                  <span>100%</span>
                </div>
                <Progress value={100} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
