import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, Clock, FileText, Folder, TrendingUp, AlertTriangle, Calendar, Bell } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useJurisdiction } from '../App';
import type { ComplianceStatus, UpcomingDeadline, ComplianceMetric } from '../types';

export function Dashboard() {
  const { jurisdiction } = useJurisdiction();
  
  // Compliance status by jurisdiction
  const complianceStatuses: ComplianceStatus[] = [
    {
      jurisdiction: 'OR',
      status: 'compliant',
      last_report_date: '2024-10-31',
      next_deadline: '2024-11-30',
      unreported_data: 0,
      urgent_tasks: 0,
      pending_approvals: 1,
    },
    {
      jurisdiction: 'MD',
      status: 'warning',
      last_report_date: '2024-11-07',
      next_deadline: '2024-11-08',
      unreported_data: 3,
      urgent_tasks: 2,
      pending_approvals: 0,
    },
    {
      jurisdiction: 'CAN-CANNABIS',
      status: 'compliant',
      last_report_date: '2024-10-31',
      next_deadline: '2024-11-30',
      unreported_data: 0,
      urgent_tasks: 0,
      pending_approvals: 0,
    },
  ];

  const currentStatus = complianceStatuses.find(s => s.jurisdiction === jurisdiction.code) || complianceStatuses[0];

  // Upcoming deadlines
  const upcomingDeadlines: UpcomingDeadline[] = [
    {
      id: '1',
      title: 'Maryland Daily Metrc Upload',
      jurisdiction: 'MD',
      type: 'filing',
      due_date: '2024-11-08',
      days_until_due: 0,
      priority: 'critical',
      completed: false,
    },
    {
      id: '2',
      title: 'Oregon Monthly Metrc Report',
      jurisdiction: 'OR',
      type: 'filing',
      due_date: '2024-11-30',
      days_until_due: 22,
      priority: 'medium',
      completed: false,
    },
    {
      id: '3',
      title: 'Canada CTLS Monthly Submission',
      jurisdiction: 'CAN-CANNABIS',
      type: 'filing',
      due_date: '2024-11-30',
      days_until_due: 22,
      priority: 'medium',
      completed: false,
    },
    {
      id: '4',
      title: 'Oregon License Renewal',
      jurisdiction: 'OR',
      type: 'renewal',
      due_date: '2024-12-15',
      days_until_due: 37,
      priority: 'high',
      completed: false,
    },
    {
      id: '5',
      title: 'Quarterly Evidence Archive Review',
      jurisdiction: 'OR',
      type: 'system-task',
      due_date: '2024-12-31',
      days_until_due: 53,
      priority: 'low',
      completed: false,
    },
  ];

  const filteredDeadlines = upcomingDeadlines.filter(d => d.jurisdiction === jurisdiction.code);

  // Metrics
  const metrics: ComplianceMetric[] = [
    { label: 'Total Reports (30d)', value: '18', trend: '+3', status: 'good' },
    { label: 'Evidence Documents', value: '1,247', trend: '+52', status: 'good' },
    { label: 'Pending Approvals', value: currentStatus.pending_approvals, trend: '-', status: currentStatus.pending_approvals > 0 ? 'warning' : 'good' },
    { label: 'Compliance Rate', value: '98%', trend: '+2%', status: 'good' },
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

  return (
    <div className="space-y-6">
      {/* Header with jurisdiction status */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Compliance Dashboard</h2>
          <p className="text-slate-600">
            {jurisdiction.name} • {jurisdiction.system} Reporting
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentStatus.status === 'compliant' && (
            <Badge className="bg-green-100 text-green-800 px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              Compliant
            </Badge>
          )}
          {currentStatus.status === 'warning' && (
            <Badge className="bg-yellow-100 text-yellow-800 px-4 py-2">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Attention Needed
            </Badge>
          )}
          {currentStatus.status === 'critical' && (
            <Badge className="bg-red-100 text-red-800 px-4 py-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              Critical Issues
            </Badge>
          )}
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

      {/* Alerts & Urgent Tasks */}
      {currentStatus.unreported_data > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Unreported Data Detected</AlertTitle>
          <AlertDescription>
            {currentStatus.unreported_data} records require reporting. Review and submit before the next deadline.
          </AlertDescription>
        </Alert>
      )}

      {currentStatus.urgent_tasks > 0 && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Urgent Tasks</AlertTitle>
          <AlertDescription>
            You have {currentStatus.urgent_tasks} urgent tasks requiring immediate attention.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jurisdiction Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Multi-Jurisdiction Status</CardTitle>
            <CardDescription>Compliance across all operating regions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {complianceStatuses.map((status) => (
              <div key={status.jurisdiction} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>
                      {status.jurisdiction === 'OR' && 'Oregon (OLCC)'}
                      {status.jurisdiction === 'MD' && 'Maryland (MMCC)'}
                      {status.jurisdiction === 'CAN-CANNABIS' && 'Canada (Health Canada)'}
                    </span>
                    {status.status === 'compliant' && <CheckCircle className={`w-4 h-4 ${getStatusColor(status.status)}`} />}
                    {status.status === 'warning' && <AlertTriangle className={`w-4 h-4 ${getStatusColor(status.status)}`} />}
                    {status.status === 'critical' && <AlertCircle className={`w-4 h-4 ${getStatusColor(status.status)}`} />}
                  </div>
                  <Badge variant="outline">
                    {status.jurisdiction === 'OR' && 'Metrc'}
                    {status.jurisdiction === 'MD' && 'Metrc'}
                    {status.jurisdiction === 'CAN-CANNABIS' && 'CTLS'}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-slate-600">Last Report</p>
                    <p>{new Date(status.last_report_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Next Deadline</p>
                    <p>{new Date(status.next_deadline).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Pending</p>
                    <p>{status.pending_approvals + status.unreported_data}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Deadlines - {jurisdiction.name}
            </CardTitle>
            <CardDescription>
              Filings, renewals, and system tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredDeadlines.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No upcoming deadlines</p>
            ) : (
              filteredDeadlines.map((deadline) => (
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
                      <p className="text-slate-600">
                        Due: {new Date(deadline.due_date).toLocaleDateString()} 
                        {deadline.days_until_due === 0 && <span className="text-red-600 ml-2">(Today!)</span>}
                        {deadline.days_until_due === 1 && <span className="text-orange-600 ml-2">(Tomorrow)</span>}
                        {deadline.days_until_due > 1 && <span className="ml-2">({deadline.days_until_due} days)</span>}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-2">
                    View Details
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Integration Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {jurisdiction.system === 'Metrc' ? 'Metrc Integration' : 'CTLS Integration'}
            </CardTitle>
            <CardDescription>Real-time sync status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Connection Status</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Last Sync</span>
                <span>12 minutes ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Records Synced</span>
                <span>2,347</span>
              </div>
              {jurisdiction.code === 'OR' && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">OLCC Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Compliant
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Reports
            </CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <div>October Monthly Report</div>
                  <p className="text-slate-600">Submitted Oct 31</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Accepted
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <div>Q3 Production Report</div>
                  <p className="text-slate-600">Submitted Oct 15</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Accepted
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <div>Waste Disposal Log</div>
                  <p className="text-slate-600">Submitted Oct 8</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Accepted
                </Badge>
              </div>
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
                <span>1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Added This Month</span>
                <span className="text-green-600">+52</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Storage Used</span>
                <span>3.2 GB</span>
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest compliance actions across all jurisdictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Report Submitted</span>
                  <span className="text-slate-500">2 hours ago</span>
                </div>
                <p className="text-slate-600">Oregon October Monthly Metrc Report</p>
                <p className="text-slate-500">by Sarah Johnson</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Evidence Uploaded</span>
                  <span className="text-slate-500">5 hours ago</span>
                </div>
                <p className="text-slate-600">Lab Results - Batch #2045 COA</p>
                <p className="text-slate-500">by Mike Chen</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Metrc Sync Complete</span>
                  <span className="text-slate-500">12 hours ago</span>
                </div>
                <p className="text-slate-600">Maryland Daily Upload - 45 records</p>
                <p className="text-slate-500">by System</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
