'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FleetView } from './fleet-view'
import { FleetGridView } from './fleet-grid-view'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePodSnapshots } from '@/hooks/use-telemetry'
import { useAlarms } from '@/hooks/use-alarms'
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  Wind, 
  AlertCircle, 
  AlertTriangle,
  Info,
  RefreshCw,
  CheckCircle2,
  LayoutGrid,
  List
} from 'lucide-react'

interface FleetMonitoringDashboardProps {
  siteId: string | null
  organizationId?: string
  userRole: string
  userId: string
}

export function FleetMonitoringDashboard({
  siteId,
  organizationId,
}: FleetMonitoringDashboardProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('just now')

  const { snapshots, loading, error, refresh } = usePodSnapshots({ 
    siteId: siteId || undefined, 
    organizationId,
    realtime: true, 
    refreshInterval: 30 
  })

  const { alarms } = useAlarms({ siteId: siteId || undefined, realtime: true })
  const activeAlarms = alarms.filter(a => !a.resolved_at)
  const criticalCount = activeAlarms.filter(a => a.severity === 'critical').length
  const warningCount = activeAlarms.filter(a => a.severity === 'warning').length
  const infoCount = activeAlarms.filter(a => a.severity === 'info').length

  useEffect(() => {
    if (snapshots && !loading) setLastUpdate(new Date())
  }, [snapshots, loading])

  useEffect(() => {
    const updateTimeSince = () => {
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
      if (seconds < 5) setTimeSinceUpdate('just now')
      else if (seconds < 60) setTimeSinceUpdate(`${seconds}s ago`)
      else setTimeSinceUpdate(`${Math.floor(seconds / 60)}m ago`)
    }
    updateTimeSince()
    const interval = setInterval(updateTimeSince, 1000)
    return () => clearInterval(interval)
  }, [lastUpdate])

  const handlePodClick = (podId: string) => {
    router.push(`/dashboard/monitoring/${podId}`)
  }

  // Calculate averages
  const avgTemp = snapshots?.length 
    ? (snapshots.reduce((sum, s) => sum + (s.temperature_c || 0), 0) / snapshots.length).toFixed(1)
    : null
  const avgHumidity = snapshots?.length
    ? (snapshots.reduce((sum, s) => sum + (s.humidity_pct || 0), 0) / snapshots.length).toFixed(1)
    : null
  const avgCO2 = snapshots?.length
    ? Math.round(snapshots.reduce((sum, s) => sum + (s.co2_ppm || 0), 0) / snapshots.length)
    : null

  return (
    <div className="space-y-6">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Pods */}
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pods</p>
                <p className="text-2xl font-bold mt-1">{snapshots?.length || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <Activity className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Temperature */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Temp</p>
                <p className="text-2xl font-bold mt-1">{avgTemp ? `${avgTemp}°C` : '--'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-200 dark:bg-orange-800 flex items-center justify-center">
                <Thermometer className="h-5 w-5 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Humidity */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Humidity</p>
                <p className="text-2xl font-bold mt-1">{avgHumidity ? `${avgHumidity}%` : '--'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CO2 */}
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg CO₂</p>
                <p className="text-2xl font-bold mt-1">{avgCO2 ? `${avgCO2}` : '--'}<span className="text-sm font-normal ml-1">ppm</span></p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
                <Wind className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alarms */}
        <Card className={`col-span-2 md:col-span-4 lg:col-span-1 ${
          activeAlarms.length > 0 
            ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border-red-200 dark:border-red-800' 
            : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alarms</p>
                {activeAlarms.length > 0 ? (
                  <div className="flex items-center gap-2 mt-1">
                    {criticalCount > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {criticalCount}
                      </Badge>
                    )}
                    {warningCount > 0 && (
                      <Badge className="gap-1 bg-amber-500 hover:bg-amber-500 text-white">
                        <AlertTriangle className="h-3 w-3" />
                        {warningCount}
                      </Badge>
                    )}
                    {infoCount > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Info className="h-3 w-3" />
                        {infoCount}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-lg font-semibold mt-1 text-green-600 dark:text-green-400">All Clear</p>
                )}
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                activeAlarms.length > 0 
                  ? 'bg-red-200 dark:bg-red-800' 
                  : 'bg-green-200 dark:bg-green-800'
              }`}>
                {activeAlarms.length > 0 ? (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-300" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet View Section */}
      <Card>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Pod Fleet</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{timeSinceUpdate}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refresh()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table')}>
              <TabsList className="h-8">
                <TabsTrigger value="grid" className="h-7 px-2">
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="table" className="h-7 px-2">
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <CardContent className="p-4">
          {loading && (!snapshots || snapshots.length === 0) && !error && (
            <div className="flex items-center justify-center h-40">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Loading pods...</span>
              </div>
            </div>
          )}

          {error && (!snapshots || snapshots.length === 0) && (
            <div className="flex items-center justify-center h-40">
              <p className="text-destructive">Failed to load pod data</p>
            </div>
          )}

          {snapshots && snapshots.length > 0 && (
            viewMode === 'grid' ? (
              <FleetGridView snapshots={snapshots} onPodClick={handlePodClick} />
            ) : (
              <FleetView
                siteId={siteId || undefined}
                snapshots={snapshots}
                realtime={false}
                onPodClick={handlePodClick}
              />
            )
          )}

          {!loading && !error && snapshots && snapshots.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
              <Activity className="h-10 w-10 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium">No Pods Found</p>
                <p className="text-sm text-muted-foreground">No pods configured for this site</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
