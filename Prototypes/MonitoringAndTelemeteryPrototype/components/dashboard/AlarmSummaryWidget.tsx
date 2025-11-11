import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import type { Alarm } from '../../types/telemetry';
import { AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react';

interface AlarmSummaryWidgetProps {
  alarms: Alarm[];
}

export function AlarmSummaryWidget({ alarms }: AlarmSummaryWidgetProps) {
  const activeAlarms = alarms.filter(a => a.status === 'active');
  
  const criticalCount = activeAlarms.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlarms.filter(a => a.severity === 'warning').length;
  const infoCount = activeAlarms.filter(a => a.severity === 'info').length;
  const acknowledgedCount = alarms.filter(a => a.status === 'acknowledged').length;
  
  const stats = [
    {
      label: 'Critical',
      count: criticalCount,
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      show: true,
    },
    {
      label: 'Warning',
      count: warningCount,
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      show: true,
    },
    {
      label: 'Info',
      count: infoCount,
      icon: Info,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      show: true,
    },
    {
      label: 'Acknowledged',
      count: acknowledgedCount,
      icon: Clock,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      show: acknowledgedCount > 0,
    },
  ];
  
  if (activeAlarms.length === 0) {
    return (
      <Card className="bg-green-500/10 border-green-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-700">All Systems Operational</p>
              <p className="text-xs text-green-600/80">No active alarms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.filter(s => s.show).map((stat) => (
        <Card key={stat.label} className={stat.bgColor}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl">{stat.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
