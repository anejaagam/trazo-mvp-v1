'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FleetView } from './fleet-view'
import { FleetGridView } from './fleet-grid-view'
import { AlarmSummaryWidget } from './alarm-summary-widget'
import { NotificationsPanel } from './notifications-panel'
import { StatsGrid, StatItem } from './stats-grid'
import { TimeRangeSelector, TimeRange } from './time-range-selector'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePodSnapshots } from '@/hooks/use-telemetry'
import { Activity, Thermometer, Droplets, Wind, AlertTriangle, RefreshCw } from 'lucide-react'
import { subHours } from 'date-fns'

interface FleetMonitoringDashboardProps {
  siteId: string | null // null for org_admin viewing all sites
  organizationId?: string // optional - if provided, fetch all org pods
  userRole: string
  userId: string
}

export function FleetMonitoringDashboard({
  siteId,
  organizationId,
  userId,
}: FleetMonitoringDashboardProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: subHours(new Date(), 24),
    end: new Date(),
    preset: '24h',
  })
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('just now')

  // Real-time fleet monitoring
  // Use organizationId if provided (org_admin), otherwise use siteId
  const { snapshots, loading, error } = usePodSnapshots({ 
    siteId: siteId || undefined, 
    organizationId,
    realtime: true, 
    refreshInterval: 30 
  })

  // Update timestamp when snapshots change
  useEffect(() => {
    if (snapshots && !loading) {
      setLastUpdate(new Date())
    }
  }, [snapshots, loading])

  // Update time since last update every second
  useEffect(() => {
    const updateTimeSince = () => {
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
      if (seconds < 5) {
        setTimeSinceUpdate('just now')
      } else if (seconds < 60) {
        setTimeSinceUpdate(`${seconds}s ago`)
      } else {
        const minutes = Math.floor(seconds / 60)
        setTimeSinceUpdate(`${minutes}m ago`)
      }
    }

    updateTimeSince()
    const interval = setInterval(updateTimeSince, 1000)
    return () => clearInterval(interval)
  }, [lastUpdate])

  // Handle pod click - navigate to detail page
  const handlePodClick = (podId: string) => {
    router.push(`/dashboard/monitoring/${podId}`)
  }

  // Calculate fleet statistics
  const stats: StatItem[] = [
    {
      label: 'Total Pods',
      value: snapshots?.length || 0,
      icon: Activity,
      description: 'Active cultivation pods',
    },
    {
      label: 'Avg Temperature',
      value: snapshots?.length
        ? `${(
            snapshots.reduce((sum, s) => sum + (s.temperature_c || 0), 0) / snapshots.length
          ).toFixed(1)}°C`
        : 'N/A',
      icon: Thermometer,
      description: 'Across all pods',
    },
    {
      label: 'Avg Humidity',
      value: snapshots?.length
        ? `${(
            snapshots.reduce((sum, s) => sum + (s.humidity_pct || 0), 0) / snapshots.length
          ).toFixed(1)}%`
        : 'N/A',
      icon: Droplets,
      description: 'Relative humidity',
    },
    {
      label: 'Avg CO₂',
      value: snapshots?.length
        ? `${Math.round(
            snapshots.reduce((sum, s) => sum + (s.co2_ppm || 0), 0) / snapshots.length
          )} ppm`
        : 'N/A',
      icon: Wind,
      description: 'Carbon dioxide',
    },
  ]

  // TODO: Count equipment in AUTO mode across all pods
  // PodSnapshot doesn't expose equipment_states, so we need to enhance the query
  // to include equipment_states JSONB for accurate AUTO/override counts

  // Count pods with issues
  const podsWithIssues = snapshots?.filter(
    (s) => s.health_status === 'warning' || s.health_status === 'critical'
  ).length || 0

  if (podsWithIssues > 0) {
    stats.push({
      label: 'Pods with Issues',
      value: podsWithIssues,
      icon: AlertTriangle,
      description: 'Requires attention',
      color: 'error',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        <NotificationsPanel userId={userId} />
      </div>

      {/* Fleet Statistics */}
      <StatsGrid stats={stats} columns={4} />

      {/* Alarm Summary */}
      {siteId && <AlarmSummaryWidget siteId={siteId} />}

      {/* Fleet View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pod Fleet Status</CardTitle>
            <div className="flex items-center gap-3">
              {/* Last Update Indicator */}
              {snapshots && snapshots.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>{timeSinceUpdate}</span>
                </div>
              )}
              
              {/* Grid/Table Toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table')}>
                <TabsList>
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                  <TabsTrigger value="table">Table</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-[260px] relative">
          {/* Show loading ONLY on initial page load (no data yet) */}
          {loading && (!snapshots || snapshots.length === 0) && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">Loading pod data...</p>
            </div>
          )}

          {/* Show error state */}
          {error && (!snapshots || snapshots.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-destructive">Failed to load pod data</p>
            </div>
          )}

          {/* Show data (stays visible during background refreshes) */}
          {snapshots && snapshots.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <FleetGridView
                  snapshots={snapshots}
                  onPodClick={handlePodClick}
                />
              ) : (
                <FleetView
                  siteId={siteId || undefined}
                  snapshots={snapshots}
                  realtime={false}
                  onPodClick={handlePodClick}
                />
              )}
            </>
          )}

          {!loading && !error && snapshots && snapshots.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Activity className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No Pods Found</p>
                <p className="text-sm text-muted-foreground">
                  No cultivation pods are currently configured for this site
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
