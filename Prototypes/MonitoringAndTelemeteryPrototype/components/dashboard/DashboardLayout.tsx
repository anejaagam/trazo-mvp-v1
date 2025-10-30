import { useState, useEffect, useMemo } from 'react';
import { PodCard } from './PodCard';
import { FleetView } from './FleetView';
import { PodDetail } from './PodDetail';
import { InfoPanel } from './InfoPanel';
import { NotificationsPanel } from './NotificationsPanel';
import { AlarmsPanel } from './AlarmsPanel';
import { AlarmSummaryWidget } from './AlarmSummaryWidget';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import type { Site, PodSnapshot, UserRole, Alarm, Notification } from '../../types/telemetry';
import { mockSites, getAllPodSnapshots, generateMockAlarms, generateMockNotifications } from '../../lib/mock-data';
import { LayoutGrid, Table2, User } from 'lucide-react';
import { Badge } from '../ui/badge';

export function DashboardLayout() {
  const [selectedSite, setSelectedSite] = useState<Site>(mockSites[0]);
  const [viewMode, setViewMode] = useState<'grid' | 'fleet'>('grid');
  const [selectedPod, setSelectedPod] = useState<PodSnapshot | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('Operator');
  const [snapshots, setSnapshots] = useState<PodSnapshot[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Load pod snapshots and alarms for selected site
  useEffect(() => {
    let previousAlarms: Alarm[] = [];
    
    const loadData = () => {
      const snapshotData = getAllPodSnapshots(selectedSite.id);
      const alarmData = generateMockAlarms(selectedSite.id);
      const notificationData = generateMockNotifications(alarmData);
      
      setSnapshots(snapshotData);
      
      // Check for new critical alarms and show toast
      const prevCriticalAlarms = previousAlarms.filter(a => a.severity === 'critical' && a.status === 'active');
      const newCriticalAlarms = alarmData.filter(a => 
        a.severity === 'critical' && 
        a.status === 'active' &&
        !prevCriticalAlarms.find(pa => pa.id === a.id)
      );
      
      // Only show toast if this isn't the initial load
      if (previousAlarms.length > 0 && newCriticalAlarms.length > 0) {
        import('sonner@2.0.3').then(({ toast }) => {
          toast.error(`New Critical Alarm: ${newCriticalAlarms[0].title}`, {
            description: newCriticalAlarms[0].message,
          });
        });
      }
      
      previousAlarms = alarmData;
      setAlarms(alarmData);
      setNotifications(notificationData);
      setLastUpdate(new Date());
    };
    
    loadData();
    
    // Simulate real-time updates every 10 seconds
    const interval = setInterval(loadData, 10000);
    
    return () => clearInterval(interval);
  }, [selectedSite]);
  
  const handlePodClick = (snapshot: PodSnapshot) => {
    setSelectedPod(snapshot);
  };
  
  const handleBack = () => {
    setSelectedPod(null);
  };
  
  const handleAcknowledgeAlarm = (alarmId: string, notes: string) => {
    setAlarms(prev => prev.map(alarm => 
      alarm.id === alarmId 
        ? { 
            ...alarm, 
            status: 'acknowledged' as const,
            acknowledged_at: new Date(),
            acknowledged_by: 'current-user',
          }
        : alarm
    ));
  };
  
  const handleResolveAlarm = (alarmId: string, notes: string) => {
    setAlarms(prev => prev.map(alarm => 
      alarm.id === alarmId 
        ? { 
            ...alarm, 
            status: 'resolved' as const,
            resolved_at: new Date(),
            resolved_by: 'current-user',
          }
        : alarm
    ));
  };
  
  const handleMarkNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };
  
  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };
  
  const handleNavigateToAlarmPod = (alarmId: string) => {
    const alarm = alarms.find(a => a.id === alarmId);
    if (alarm) {
      const snapshot = snapshots.find(s => s.pod.id === alarm.pod_id);
      if (snapshot) {
        setSelectedPod(snapshot);
      }
    }
  };
  
  // Calculate summary stats
  const stats = {
    total: snapshots.length,
    healthy: snapshots.filter(s => 
      s.temp.health === 'Healthy' && 
      s.rh.health === 'Healthy' && 
      s.co2.health === 'Healthy'
    ).length,
    warnings: snapshots.filter(s => 
      Math.abs(s.drift.temp) > 1.6 || 
      Math.abs(s.drift.rh) > 4 || 
      Math.abs(s.drift.co2) > 120
    ).length,
    faults: snapshots.filter(s => 
      s.temp.health === 'Faulted' || 
      s.rh.health === 'Faulted' || 
      s.co2.health === 'Faulted'
    ).length,
  };
  
  // Memoize pod grid/fleet view to prevent unnecessary re-renders
  const podView = useMemo(() => viewMode === 'grid' ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {snapshots.map(snapshot => (
        <PodCard
          key={snapshot.pod.id}
          snapshot={snapshot}
          onClick={() => handlePodClick(snapshot)}
        />
      ))}
    </div>
  ) : (
    <FleetView
      snapshots={snapshots}
      onPodClick={handlePodClick}
    />
  ), [snapshots, viewMode]);
  
  // Detail view
  if (selectedPod) {
    return (
      <div className="min-h-screen bg-background p-6">
        <PodDetail
          snapshot={selectedPod}
          userRole={userRole}
          onBack={handleBack}
        />
      </div>
    );
  }
  
  // Main dashboard view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl">Monitoring & Telemetry</h1>
              <p className="text-muted-foreground mt-1">
                Real-time environmental monitoring with compliance-grade data export
              </p>
            </div>
            
            {/* User Role Selector & Actions */}
            <div className="flex items-center gap-3">
              <NotificationsPanel
                notifications={notifications}
                timezone={selectedSite.timezone}
                onMarkAsRead={handleMarkNotificationAsRead}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                onNavigateToAlarm={handleNavigateToAlarmPod}
              />
              <InfoPanel />
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <Select value={userRole} onValueChange={(v) => setUserRole(v as UserRole)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operator">Operator</SelectItem>
                    <SelectItem value="HeadGrower">Head Grower</SelectItem>
                    <SelectItem value="SiteManager">Site Manager</SelectItem>
                    <SelectItem value="ComplianceQA">Compliance/QA</SelectItem>
                    <SelectItem value="ExecutiveViewer">Executive Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Site Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm">Site:</span>
                <Select 
                  value={selectedSite.id} 
                  onValueChange={(id) => {
                    const site = mockSites.find(s => s.id === id);
                    if (site) setSelectedSite(site);
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSites.map(site => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-2 ml-6">
                <Badge variant="default" className="bg-green-500 hover:bg-green-500">
                  {stats.healthy} Healthy
                </Badge>
                {stats.warnings > 0 && (
                  <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-500">
                    {stats.warnings} Approaching
                  </Badge>
                )}
                {stats.faults > 0 && (
                  <Badge variant="destructive">
                    {stats.faults} Faulted
                  </Badge>
                )}
              </div>
            </div>
            
            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'fleet')}>
              <TabsList>
                <TabsTrigger value="grid" className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Grid View
                </TabsTrigger>
                <TabsTrigger value="fleet" className="flex items-center gap-2">
                  <Table2 className="w-4 h-4" />
                  Fleet View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="text-xs text-muted-foreground mt-3">
            Last update: {lastUpdate.toLocaleTimeString()} • Auto-refresh: 10s • Timezone: {selectedSite.timezone}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Alarm Summary */}
        <AlarmSummaryWidget alarms={alarms} />
        
        {/* Pod Monitoring */}
        {podView}
        
        {/* Alarms Panel */}
        <AlarmsPanel
          alarms={alarms}
          timezone={selectedSite.timezone}
          onAcknowledge={handleAcknowledgeAlarm}
          onResolve={handleResolveAlarm}
          onNavigateToPod={(podId) => {
            const snapshot = snapshots.find(s => s.pod.id === podId);
            if (snapshot) handlePodClick(snapshot);
          }}
        />
      </div>
      
      {/* Footer Notice */}
      <div className="border-t bg-card mt-12">
        <div className="container mx-auto px-6 py-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>System Notice:</strong> This monitoring interface provides read-only visibility.
              No control commands are issued from this system.
            </p>
            <p>
              <strong>Safety Precedence:</strong> Safety &gt; E-stop &gt; Manual Override &gt; Recipe/Schedule &gt; Suggestions/DR
            </p>
            <p>
              <strong>Data Quality:</strong> All readings are validated and flagged for staleness, faults, or calibration requirements.
              VPD is auto-calculated from temperature and humidity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
