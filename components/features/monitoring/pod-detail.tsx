'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { EnvironmentChart } from './environment-chart'
import { ArrowLeft, Clock, RefreshCw, Thermometer, Droplets, Wind, Sun } from 'lucide-react'
import { useTelemetry } from '@/hooks/use-telemetry'
import { usePermissions } from '@/hooks/use-permissions'

interface PodDetailProps {
  podId: string
  podName: string
  roomName: string
  deviceToken?: string | null
  stage?: string
  onBack: () => void
}

export function PodDetail({ podId, podName, roomName, deviceToken, stage, onBack }: PodDetailProps) {
  const [timeWindow, setTimeWindow] = useState<24 | 168 | 720>(24) // 24h, 7d, 30d
  const [lastRefresh, setLastRefresh] = useState(new Date())
  
  // Permission check
  const { can } = usePermissions('org_admin')
  
  // Fetch real-time telemetry
  const { reading, loading: telemetryLoading, error: telemetryError } = useTelemetry({
    podId,
    realtime: true,
    autoFetch: true
  })
  
  // Device status: extract from telemetry reading
  const deviceStatus = reading ? {
    circulation_fan_active: reading.circulation_fan_active ?? false,
    cooling_active: reading.cooling_active ?? false,
    dehumidifier_active: reading.dehumidifier_active ?? false,
    co2_injection_active: reading.co2_injection_active ?? false,
  } : null
  const deviceLoading = telemetryLoading
  
  // Auto-refresh timestamp every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date())
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Calculate VPD (Vapor Pressure Deficit)
  const calculateVPD = (temp: number, rh: number): number => {
    const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3))
    const vpd = svp * (1 - rh / 100)
    return vpd
  }
  
  // Calculate time ago
  const getTimeAgo = (timestamp: string): string => {
    const secondsAgo = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (secondsAgo < 60) return `${secondsAgo}s ago`
    const minutesAgo = Math.floor(secondsAgo / 60)
    if (minutesAgo < 60) return `${minutesAgo}m ago`
    const hoursAgo = Math.floor(minutesAgo / 60)
    return `${hoursAgo}h ago`
  }
  
  const handleRefresh = () => {
    setLastRefresh(new Date())
    // useTelemetry hook will auto-refetch if realtime is enabled
  }
  
  // Check permission
  if (!can('monitoring:view')) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">You do not have permission to view monitoring details.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-3xl font-bold">{podName}</h1>
            <p className="text-muted-foreground">
              {roomName}{stage ? ` • ${stage}` : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last update: {reading ? getTimeAgo(reading.timestamp) : '--'}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Loading State */}
      {telemetryLoading && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Loading telemetry data...</p>
        </div>
      )}
      
      {/* Error State */}
      {telemetryError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Error loading telemetry: {telemetryError.message}
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Current Readings - Summary Cards */}
      {reading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Temperature Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {reading.temperature_c?.toFixed(1) ?? '--'}
                    </span>
                    <span className="text-muted-foreground">°C</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {reading.temp_sensor_fault ? (
                      <Badge variant="destructive" className="text-xs">Fault</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">OK</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Humidity Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Droplets className="w-4 h-4" />
                  Humidity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {reading.humidity_pct?.toFixed(1) ?? '--'}
                    </span>
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {reading.humidity_sensor_fault ? (
                      <Badge variant="destructive" className="text-xs">Fault</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">OK</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* CO₂ Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wind className="w-4 h-4" />
                  CO₂
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {reading.co2_ppm?.toFixed(0) ?? '--'}
                    </span>
                    <span className="text-muted-foreground text-sm">ppm</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {reading.co2_sensor_fault ? (
                      <Badge variant="destructive" className="text-xs">Fault</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">OK</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Lighting Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  Lighting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {reading.light_intensity_pct?.toFixed(0) ?? '--'}
                    </span>
                    <span className="text-muted-foreground text-sm">%</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">OK</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* VPD Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">VPD</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {reading.temperature_c && reading.humidity_pct
                        ? calculateVPD(reading.temperature_c, reading.humidity_pct).toFixed(2)
                        : reading.vpd_kpa?.toFixed(2) ?? '--'}
                    </span>
                    <span className="text-muted-foreground text-sm">kPa</span>
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
              {deviceLoading ? (
                <p className="text-sm text-muted-foreground">Loading equipment status...</p>
              ) : deviceStatus ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Fan</span>
                    <span className={`text-sm font-medium ${deviceStatus.circulation_fan_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {deviceStatus.circulation_fan_active ? 'Running' : 'Off'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Cooling</span>
                    <span className={`text-sm font-medium ${deviceStatus.cooling_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {deviceStatus.cooling_active ? 'Active' : 'Off'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Dehumidifier</span>
                    <span className={`text-sm font-medium ${deviceStatus.dehumidifier_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {deviceStatus.dehumidifier_active ? 'Running' : 'Off'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">CO₂ Injection</span>
                    <span className={`text-sm font-medium ${deviceStatus.co2_injection_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {deviceStatus.co2_injection_active ? 'Active' : 'Off'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No equipment status available</p>
              )}
            </CardContent>
          </Card>
          
          {/* Time Series Charts */}
          <Tabs value={timeWindow.toString()} onValueChange={(v) => setTimeWindow(Number(v) as typeof timeWindow)}>
            <TabsList>
              <TabsTrigger value="24">Last 24 Hours</TabsTrigger>
              <TabsTrigger value="168">Last 7 Days</TabsTrigger>
              <TabsTrigger value="720">Last 30 Days</TabsTrigger>
            </TabsList>
            
            <TabsContent value={timeWindow.toString()} className="mt-4">
              <EnvironmentChart podId={podId} deviceToken={deviceToken || undefined} hours={timeWindow} />
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
        </>
      )}
      
      {/* No Data State */}
      {!telemetryLoading && !telemetryError && !reading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              No telemetry data available for this pod.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
