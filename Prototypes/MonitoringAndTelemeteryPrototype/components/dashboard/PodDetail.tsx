import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { EnvironmentChart } from './EnvironmentChart';
import { ExportDialog } from './ExportDialog';
import { DataEntryDialog } from './DataEntryDialog';
import { QRCodeDialog } from './QRCodeDialog';
import { StatusBadge, SpecStatusBadge } from './StatusBadge';
import type { PodSnapshot, UserRole } from '../../types/telemetry';
import { generateChartData } from '../../lib/mock-data';
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react';

interface PodDetailProps {
  snapshot: PodSnapshot;
  userRole: UserRole;
  onBack: () => void;
}

export function PodDetail({ snapshot, userRole, onBack }: PodDetailProps) {
  const [timeWindow, setTimeWindow] = useState<'24h' | '7d' | '30d'>('24h');
  const [chartData, setChartData] = useState(() => {
    const hours = timeWindow === '24h' ? 24 : timeWindow === '7d' ? 168 : 720;
    return generateChartData(snapshot.pod, snapshot.room, hours);
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Simulate auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Regenerate chart data when time window changes
  useEffect(() => {
    const hours = timeWindow === '24h' ? 24 : timeWindow === '7d' ? 168 : 720;
    setChartData(generateChartData(snapshot.pod, snapshot.room, hours));
  }, [timeWindow, snapshot.pod.id, snapshot.room.id]);
  
  const handleRefresh = () => {
    const hours = timeWindow === '24h' ? 24 : timeWindow === '7d' ? 168 : 720;
    setChartData(generateChartData(snapshot.pod, snapshot.room, hours));
    setLastRefresh(new Date());
  };
  
  const { pod, room, temp, rh, co2, light, vpd, devices, setpoints, drift } = snapshot;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl">{pod.name}</h1>
            <p className="text-muted-foreground">
              {room.name} • {room.stage}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last update: {Math.floor((new Date().getTime() - lastRefresh.getTime()) / 1000)}s ago
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <QRCodeDialog podId={pod.id} podName={pod.name} />
          <DataEntryDialog podName={pod.name} />
          <ExportDialog
            podName={pod.name}
            roomName={room.name}
            data={chartData.data}
            timezone={room.tz}
            userRole={userRole}
          />
        </div>
      </div>
      
      {/* Current Readings - Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl">{temp.value.toFixed(1)}</span>
                <span className="text-muted-foreground">°C</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <StatusBadge health={temp.health} size="sm" />
                <SpecStatusBadge drift={drift.temp} tolerance={2.0} size="sm" />
              </div>
              <div className="text-xs text-muted-foreground">
                Setpoint: {setpoints.temp}°C
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Humidity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl">{rh.value.toFixed(1)}</span>
                <span className="text-muted-foreground">%</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <StatusBadge health={rh.health} size="sm" />
                <SpecStatusBadge drift={drift.rh} tolerance={5.0} size="sm" />
              </div>
              <div className="text-xs text-muted-foreground">
                Setpoint: {setpoints.rh}%
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">CO₂</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl">{co2.value.toFixed(0)}</span>
                <span className="text-muted-foreground text-sm">ppm</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <StatusBadge health={co2.health} size="sm" />
                <SpecStatusBadge drift={drift.co2} tolerance={150} size="sm" />
              </div>
              <div className="text-xs text-muted-foreground">
                Setpoint: {setpoints.co2} ppm
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lighting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl">{light.value.toFixed(0)}</span>
                <span className="text-muted-foreground">%</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <StatusBadge health={light.health} size="sm" />
              </div>
              <div className="text-xs text-muted-foreground">
                Setpoint: {setpoints.light}%
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">VPD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl">{vpd.value.toFixed(2)}</span>
                <span className="text-muted-foreground text-sm">kPa</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <StatusBadge health={vpd.health} size="sm" />
              </div>
              <div className="text-xs text-muted-foreground">
                Derived metric
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Equipment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Equipment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Fan</span>
              <span className={`text-sm ${devices.fan ? 'text-green-600' : 'text-muted-foreground'}`}>
                {devices.fan ? 'Running' : 'Off'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Cooling</span>
              <span className={`text-sm ${devices.cooling ? 'text-green-600' : 'text-muted-foreground'}`}>
                {devices.cooling ? 'Active' : 'Off'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Dehumidifier</span>
              <span className={`text-sm ${devices.dehum ? 'text-green-600' : 'text-muted-foreground'}`}>
                {devices.dehum ? 'Running' : 'Off'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">CO₂ Injection</span>
              <span className={`text-sm ${devices.co2_enable ? 'text-green-600' : 'text-muted-foreground'}`}>
                {devices.co2_enable ? 'Active' : 'Off'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Time Series Charts */}
      <Tabs value={timeWindow} onValueChange={(v) => setTimeWindow(v as typeof timeWindow)}>
        <TabsList>
          <TabsTrigger value="24h">Last 24 Hours</TabsTrigger>
          <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
          <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
        </TabsList>
        
        <TabsContent value={timeWindow} className="mt-4">
          <EnvironmentChart
            data={chartData.data}
            events={chartData.events}
            timezone={room.tz}
          />
        </TabsContent>
      </Tabs>
      
      {/* Compliance Notice */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Compliance Notice:</strong> All telemetry data is stored immutably with UTC timestamps.
            Sensor health transitions, alarms, and exports are logged for audit trails.
            This monitoring interface is read-only and does not issue control commands.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
