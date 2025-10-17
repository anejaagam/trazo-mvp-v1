import { useState } from 'react';
import { Alarm, AlarmThreshold, EscalationPolicy, MaintenanceWindow } from './types/alarm';
import { mockAlarms, mockThresholds, mockEscalationPolicies, mockMaintenanceWindows } from './data/mockAlarms';
import { AlarmDashboard } from './components/alarm-dashboard';
import { AlarmInbox } from './components/alarm-inbox';
import { AlarmConfiguration } from './components/alarm-configuration';
import { EscalationPolicyComponent } from './components/escalation-policy';
import { MaintenanceWindowComponent } from './components/maintenance-window';
import { AlarmHistory } from './components/alarm-history';
import { ComplianceAlerts } from './components/compliance-alerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Bell, Settings, TrendingUp, Wrench, History, LayoutDashboard, FileX } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [alarms, setAlarms] = useState<Alarm[]>(mockAlarms);
  const [thresholds, setThresholds] = useState<AlarmThreshold[]>(mockThresholds);
  const [escalationPolicies, setEscalationPolicies] = useState<EscalationPolicy[]>(mockEscalationPolicies);
  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>(mockMaintenanceWindows);
  
  // Alarm actions
  const handleAcknowledge = (id: string) => {
    setAlarms(alarms.map(alarm => 
      alarm.id === id 
        ? { 
            ...alarm, 
            status: 'acknowledged' as const,
            acknowledgedAt: new Date(),
            acknowledgedBy: 'Current User',
          }
        : alarm
    ));
  };
  
  const handleResolve = (id: string) => {
    setAlarms(alarms.map(alarm => 
      alarm.id === id 
        ? { 
            ...alarm, 
            status: 'resolved' as const,
            resolvedAt: new Date(),
            resolvedBy: 'Current User',
          }
        : alarm
    ));
  };
  
  const handleSnooze = (id: string, minutes: number) => {
    setAlarms(alarms.map(alarm => 
      alarm.id === id 
        ? { 
            ...alarm, 
            status: 'snoozed' as const,
            snoozedUntil: new Date(Date.now() + minutes * 60 * 1000),
          }
        : alarm
    ));
  };
  
  // Configuration actions
  const handleUpdateThreshold = (threshold: AlarmThreshold) => {
    setThresholds(thresholds.map(t => 
      t.id === threshold.id ? threshold : t
    ));
  };
  
  const handleCreateThreshold = (threshold: AlarmThreshold) => {
    setThresholds([...thresholds, threshold]);
  };
  
  // Escalation policy actions
  const handleUpdatePolicy = (policy: EscalationPolicy) => {
    setEscalationPolicies(escalationPolicies.map(p => 
      p.id === policy.id ? policy : p
    ));
  };
  
  const handleCreatePolicy = (policy: EscalationPolicy) => {
    setEscalationPolicies([...escalationPolicies, policy]);
  };
  
  const handleDeletePolicy = (id: string) => {
    setEscalationPolicies(escalationPolicies.filter(p => p.id !== id));
  };
  
  // Maintenance window actions
  const handleCreateWindow = (window: MaintenanceWindow) => {
    setMaintenanceWindows([...maintenanceWindows, window]);
  };
  
  const handleDeleteWindow = (id: string) => {
    setMaintenanceWindows(maintenanceWindows.filter(w => w.id !== id));
  };
  
  // Calculate active alarm count
  const activeAlarmCount = alarms.filter(a => 
    a.status === 'active' || a.status === 'acknowledged'
  ).length;
  
  // Calculate compliance alarm count
  const complianceAlarmCount = alarms.filter(a => 
    (a.category === 'compliance' || a.category === 'security') &&
    a.status !== 'resolved'
  ).length;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900">Alarms & Notifications</h1>
                <p className="text-gray-600">Intelligent alarm system with routing and escalation</p>
              </div>
            </div>
            
            {activeAlarmCount > 0 && (
              <Badge className="bg-red-500">
                {activeAlarmCount} Active Alarms
              </Badge>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="inbox">
              <Bell className="w-4 h-4 mr-2" />
              Inbox
              {activeAlarmCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700">
                  {activeAlarmCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="compliance">
              <FileX className="w-4 h-4 mr-2" />
              Compliance
              {complianceAlarmCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700">
                  {complianceAlarmCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="configuration">
              <Settings className="w-4 h-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="escalation">
              <TrendingUp className="w-4 h-4 mr-2" />
              Escalation
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <Wrench className="w-4 h-4 mr-2" />
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <AlarmDashboard alarms={alarms} />
          </TabsContent>
          
          <TabsContent value="inbox">
            <AlarmInbox
              alarms={alarms}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              onSnooze={handleSnooze}
            />
          </TabsContent>
          
          <TabsContent value="compliance">
            <ComplianceAlerts alarms={alarms} />
          </TabsContent>
          
          <TabsContent value="configuration">
            <AlarmConfiguration
              thresholds={thresholds}
              onUpdateThreshold={handleUpdateThreshold}
              onCreateThreshold={handleCreateThreshold}
            />
          </TabsContent>
          
          <TabsContent value="escalation">
            <EscalationPolicyComponent
              policies={escalationPolicies}
              onUpdatePolicy={handleUpdatePolicy}
              onCreatePolicy={handleCreatePolicy}
              onDeletePolicy={handleDeletePolicy}
            />
          </TabsContent>
          
          <TabsContent value="maintenance">
            <MaintenanceWindowComponent
              windows={maintenanceWindows}
              onCreateWindow={handleCreateWindow}
              onDeleteWindow={handleDeleteWindow}
            />
          </TabsContent>
          
          <TabsContent value="history">
            <AlarmHistory alarms={alarms} />
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="mb-2">Core Features</h3>
              <ul className="space-y-1 text-gray-600">
                <li>✓ Custom threshold configuration</li>
                <li>✓ Push notification integration</li>
                <li>✓ Escalation policies (5/10/15/30 min)</li>
                <li>✓ Maintenance mode</li>
                <li>✓ Immutable audit log</li>
              </ul>
            </div>
            
            <div>
              <h3 className="mb-2">Operational Alarms</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Environmental (temp, humidity, CO₂)</li>
                <li>• Equipment (offline, faults)</li>
                <li>• Irrigation (flow, pressure, tanks)</li>
                <li>• System (calibration, connectivity)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="mb-2">Compliance Alarms</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Metrc Sync Errors (API failures)</li>
                <li>• Task Due Reminders (audits, permits)</li>
                <li>• 45-Day Harvest Deadline (OR)</li>
                <li>• Test Failures (microbial, pesticide)</li>
                <li>• Security Incidents (cameras, access)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="mb-2">Performance SLAs</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Detection → Raise: p95 ≤ 3s</li>
                <li>• Raise → Notify: p95 ≤ 5s (push)</li>
                <li>• Raise → Notify: p95 ≤ 20s (email)</li>
                <li>• Escalation accuracy: ±2s</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
