'use client'

import { useState } from 'react'
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
import { Activity, Thermometer, Droplets, Wind, AlertTriangle } from 'lucide-react'
import { subHours } from 'date-fns'

interface FleetMonitoringDashboardProps {
  siteId: string
  userRole: string
  userId: string
}

export function FleetMonitoringDashboard({
  siteId,
  userId,
}: FleetMonitoringDashboardProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: subHours(new Date(), 24),
    end: new Date(),
    preset: '24h',
  })

  // Real-time fleet monitoring
  const { snapshots, loading, error } = usePodSnapshots({ siteId, realtime: true, refreshInterval: 30 }) // Auto-refresh every 30s

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
      <AlarmSummaryWidget siteId={siteId} />

      {/* Fleet View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pod Fleet Status</CardTitle>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table')}>
              <TabsList>
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading pod data...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <p className="text-destructive">Failed to load pod data</p>
            </div>
          )}

          {!loading && !error && snapshots && (
            <>
              {viewMode === 'grid' ? (
                <FleetGridView
                  snapshots={snapshots}
                  onPodClick={handlePodClick}
                />
              ) : (
                <FleetView
                  siteId={siteId}
                  realtime={true}
                  refreshInterval={30}
                  onPodClick={handlePodClick}
                />
              )}
            </>
          )}

          {!loading && !error && (!snapshots || snapshots.length === 0) && (
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
