import { Alarm } from '../types/alarm';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle2, Bell, BellOff, TrendingUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlarmDashboardProps {
  alarms: Alarm[];
}

export function AlarmDashboard({ alarms }: AlarmDashboardProps) {
  // Calculate statistics
  const activeAlarms = alarms.filter(a => a.status === 'active');
  const criticalAlarms = activeAlarms.filter(a => a.severity === 'critical');
  const warningAlarms = activeAlarms.filter(a => a.severity === 'warning');
  const acknowledgedAlarms = alarms.filter(a => a.status === 'acknowledged');
  const snoozedAlarms = alarms.filter(a => a.status === 'snoozed');
  const resolvedToday = alarms.filter(a => 
    a.status === 'resolved' && 
    a.resolvedAt && 
    a.resolvedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  
  // Group by category
  const byCategory = {
    environmental: alarms.filter(a => a.category === 'environmental' && a.status !== 'resolved').length,
    equipment: alarms.filter(a => a.category === 'equipment' && a.status !== 'resolved').length,
    irrigation: alarms.filter(a => a.category === 'irrigation' && a.status !== 'resolved').length,
    system: alarms.filter(a => a.category === 'system' && a.status !== 'resolved').length,
    compliance: alarms.filter(a => a.category === 'compliance' && a.status !== 'resolved').length,
    security: alarms.filter(a => a.category === 'security' && a.status !== 'resolved').length,
  };
  
  // Escalated alarms
  const escalatedAlarms = activeAlarms.filter(a => a.escalationLevel > 0);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Alarm Dashboard</h1>
        <p className="text-gray-600">Real-time overview of facility alarm status</p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Active Alarms</p>
              <h2 className="text-red-600">{activeAlarms.length}</h2>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Bell className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              {criticalAlarms.length} Critical
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {warningAlarms.length} Warning
            </Badge>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Acknowledged</p>
              <h2 className="text-amber-600">{acknowledgedAlarms.length}</h2>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="mt-4 text-gray-600">Awaiting resolution</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Escalated</p>
              <h2 className="text-orange-600">{escalatedAlarms.length}</h2>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="mt-4 text-gray-600">
            {escalatedAlarms.length > 0 
              ? `Highest: Level ${Math.max(...escalatedAlarms.map(a => a.escalationLevel))}`
              : 'No escalations'
            }
          </p>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Resolved (24h)</p>
              <h2 className="text-green-600">{resolvedToday.length}</h2>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="mt-4 text-gray-600">Issues addressed</p>
        </Card>
      </div>
      
      {/* Breakdown by Category */}
      <Card className="p-6">
        <h3 className="mb-4">Alarms by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">Environmental</span>
              <Badge variant="secondary">{byCategory.environmental}</Badge>
            </div>
            <p className="text-gray-600">Temp, humidity, CO₂</p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">Equipment</span>
              <Badge variant="secondary">{byCategory.equipment}</Badge>
            </div>
            <p className="text-gray-600">Devices, sensors</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">Irrigation</span>
              <Badge variant="secondary">{byCategory.irrigation}</Badge>
            </div>
            <p className="text-gray-600">Flow, pressure</p>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">System</span>
              <Badge variant="secondary">{byCategory.system}</Badge>
            </div>
            <p className="text-gray-600">Calibration, edge</p>
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">Compliance</span>
              <Badge variant="secondary">{byCategory.compliance}</Badge>
            </div>
            <p className="text-gray-600">Metrc, tasks, tests</p>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">Security</span>
              <Badge variant="secondary">{byCategory.security}</Badge>
            </div>
            <p className="text-gray-600">Cameras, access</p>
          </div>
        </div>
      </Card>
      
      {/* Critical Alarms Requiring Attention */}
      {criticalAlarms.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-red-900">Critical Alarms Requiring Immediate Attention</h3>
          </div>
          <div className="space-y-3">
            {criticalAlarms.slice(0, 3).map(alarm => (
              <div key={alarm.id} className="p-4 bg-white rounded-lg border border-red-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{alarm.title}</span>
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                        {alarm.severity}
                      </Badge>
                      {alarm.escalationLevel > 0 && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                          Level {alarm.escalationLevel}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600">{alarm.site} • {alarm.room || 'Multiple Rooms'}</p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatDistanceToNow(alarm.raisedAt, { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Snoozed Alarms */}
      {snoozedAlarms.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BellOff className="w-5 h-5 text-gray-600" />
            <h3>Snoozed Alarms</h3>
            <Badge variant="secondary">{snoozedAlarms.length}</Badge>
          </div>
          <div className="space-y-2">
            {snoozedAlarms.map(alarm => (
              <div key={alarm.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span>{alarm.title}</span>
                  <span className="text-gray-500"> • {alarm.site}</span>
                </div>
                {alarm.snoozedUntil && (
                  <span className="text-gray-500">
                    Until {formatDistanceToNow(alarm.snoozedUntil, { addSuffix: true })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
