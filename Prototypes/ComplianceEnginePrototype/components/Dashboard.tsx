import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AlertCircle, CheckCircle, Clock, FileCheck, Shield, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useJurisdiction } from '../App';

export function Dashboard() {
  const { jurisdiction } = useJurisdiction();
  
  const complianceStatus = [
    { jurisdiction: 'OR', name: 'Monthly State Report', status: 'compliant', progress: 100, nextDue: 'Nov 15, 2025' },
    { jurisdiction: 'OR', name: 'Quarterly Compliance Audit', status: 'compliant', progress: 100, nextDue: 'Jan 1, 2026' },
    { jurisdiction: 'OR', name: 'Employee Permit Renewals', status: 'review', progress: 85, nextDue: 'Oct 30, 2025' },
    { jurisdiction: 'OR', name: 'Equipment Calibration', status: 'action-required', progress: 60, nextDue: 'Oct 20, 2025' },
    { jurisdiction: 'MD', name: 'MMCC Monthly Report', status: 'compliant', progress: 100, nextDue: 'Nov 1, 2025' },
    { jurisdiction: 'MD', name: 'Packaging Compliance', status: 'compliant', progress: 100, nextDue: 'Dec 31, 2025' },
    { jurisdiction: 'MD', name: 'Lab Testing Schedule', status: 'review', progress: 75, nextDue: 'Oct 25, 2025' },
    { jurisdiction: 'CA', name: 'Metrc Reporting Sync', status: 'compliant', progress: 100, nextDue: 'Daily' },
    { jurisdiction: 'CA', name: 'BCC License Renewal', status: 'action-required', progress: 40, nextDue: 'Oct 18, 2025' },
    { jurisdiction: 'CAN-CANNABIS', name: 'CTLS Monthly Report', status: 'compliant', progress: 100, nextDue: 'Nov 15, 2025' },
    { jurisdiction: 'CAN-CANNABIS', name: 'Health Canada Compliance', status: 'compliant', progress: 100, nextDue: 'Dec 1, 2025' },
    { jurisdiction: 'CAN-PRODUCE', name: 'HACCP Documentation', status: 'compliant', progress: 100, nextDue: 'Ongoing' },
    { jurisdiction: 'CAN-PRODUCE', name: 'Annual Safety Audit', status: 'review', progress: 80, nextDue: 'Nov 30, 2025' },
  ];

  const recentActivity = [
    { action: 'Evidence uploaded', type: 'Lab Result PDF', user: 'Sarah Chen', time: '2 hours ago', jurisdiction: jurisdiction.code },
    { action: 'Record locked', type: 'Batch #2045', user: 'Mike Johnson', time: '5 hours ago', jurisdiction: jurisdiction.code },
    { action: 'Report generated', type: `${jurisdiction.name} Report`, user: 'System', time: '1 day ago', jurisdiction: jurisdiction.code },
    { action: 'Signature captured', type: 'SOP Training', user: 'Alex Kumar', time: '1 day ago', jurisdiction: jurisdiction.code },
  ];
  
  // Filter compliance status by current jurisdiction
  const filteredCompliance = complianceStatus.filter(item => item.jurisdiction === jurisdiction.code);

  const stats = [
    { label: 'Total Records', value: '1,247', icon: FileCheck, trend: '+12%' },
    { label: 'Evidence Items', value: '3,891', icon: Shield, trend: '+8%' },
    { label: 'Audit Entries', value: '5,623', icon: Clock, trend: '+15%' },
    { label: 'Compliance Rate', value: '94%', icon: TrendingUp, trend: '+2%' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <p className="text-slate-600">{stat.label}</p>
                <Icon className="w-4 h-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span>{stat.value}</span>
                  <span className="text-green-600">{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Action Required</AlertTitle>
        <AlertDescription>
          PrimusGFS audit due in 5 days. Complete calibration records and upload evidence.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>Multi-jurisdiction compliance tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCompliance.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.status === 'compliant' && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Compliant
                        </Badge>
                      )}
                      {item.status === 'review' && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Clock className="w-3 h-3 mr-1" />
                          In Review
                        </Badge>
                      )}
                      {item.status === 'action-required' && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Action Required
                        </Badge>
                      )}
                    </div>
                    <span className="text-slate-600">Due: {item.nextDue}</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest compliance actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p>{activity.action}</p>
                    <p className="text-slate-600">{activity.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-600">{activity.user}</p>
                    <p className="text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
