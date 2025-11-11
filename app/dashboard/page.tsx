import { 
  Activity, 
  AlertTriangle, 
  Package, 
  Sprout, 
  Thermometer
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WelcomeBanner } from '@/components/features/onboarding/welcome-banner'
import { createClient } from '@/lib/supabase/server'

// Mock data - in real app this would come from database
const dashboardData = {
  stats: {
    activeBatches: 24,
    activeBatchesChange: +12,
    totalPlants: 2840,
    totalPlantsChange: +184,
    activeAlarms: 3,
    activeAlarmsChange: -2,
    lowStockItems: 7,
    lowStockItemsChange: +3
  },
  recentBatches: [
    { id: 'B-2024-001', strain: 'Blue Dream', stage: 'flowering', plants: 16, daysInStage: 45 },
    { id: 'B-2024-002', strain: 'OG Kush', stage: 'vegetative', plants: 12, daysInStage: 21 },
    { id: 'B-2024-003', strain: 'Gelato', stage: 'harvest', plants: 16, daysInStage: 2 }
  ],
  alerts: [
    { id: 1, type: 'temperature', message: 'Pod 12 temperature exceeds threshold', severity: 'high', time: '2 min ago' },
    { id: 2, type: 'inventory', message: 'CO2 tank inventory below minimum', severity: 'medium', time: '1 hour ago' },
    { id: 3, type: 'task', message: 'Weekly cleaning checklist overdue', severity: 'low', time: '3 hours ago' }
  ],
  environmentalStatus: {
    avgTemperature: 72.5,
    avgHumidity: 65.2,
    avgCO2: 1250,
    podsOnline: 47,
    totalPods: 48
  }
}

type UserRow = { role: string | null; organization: { jurisdiction: string | null } | null }

export default async function DashboardPage() {
  // Fetch current user's role and org jurisdiction for onboarding banner
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  let userRole: string | null = null
  let jurisdictionId: string | null = null
  if (auth?.user) {
    const { data: user } = await supabase
      .from('users')
      .select('role, organization:organizations(jurisdiction)')
      .eq('id', auth.user.id)
      .single<UserRow>()
    userRole = user?.role ?? null
    jurisdictionId = user?.organization?.jurisdiction ?? null
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your operations.
        </p>
      </div>

      {/* Onboarding banner (shows once per browser) */}
      <WelcomeBanner role={userRole} jurisdictionId={jurisdictionId ?? undefined} />

      {/* Key metrics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.activeBatches}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{dashboardData.stats.activeBatchesChange}</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plants</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalPlants.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{dashboardData.stats.totalPlantsChange}</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.activeAlarms}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{dashboardData.stats.activeAlarmsChange}</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-orange-600">+{dashboardData.stats.lowStockItemsChange}</span> from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Batches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5" />
              Recent Batches
            </CardTitle>
            <CardDescription>
              Latest batch activity and status updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{batch.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {batch.strain} • {batch.plants} plants
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">
                      {batch.stage}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Day {batch.daysInStage}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Batches
            </Button>
          </CardContent>
        </Card>

        {/* Environmental Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Environmental Status
            </CardTitle>
            <CardDescription>
              Current environmental conditions across all pods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Temperature</p>
                  <p className="text-2xl font-bold">{dashboardData.environmentalStatus.avgTemperature}°F</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Humidity</p>
                  <p className="text-2xl font-bold">{dashboardData.environmentalStatus.avgHumidity}%</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Avg CO2</p>
                  <p className="text-2xl font-bold">{dashboardData.environmentalStatus.avgCO2} ppm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pods Online</p>
                  <p className="text-2xl font-bold">
                    {dashboardData.environmentalStatus.podsOnline}/{dashboardData.environmentalStatus.totalPods}
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              View Environmental Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
          <CardDescription>
            System alerts and notifications requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-4 w-4 ${
                    alert.severity === 'high' ? 'text-red-500' :
                    alert.severity === 'medium' ? 'text-orange-500' :
                    'text-yellow-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
                <Badge variant={
                  alert.severity === 'high' ? 'destructive' :
                  alert.severity === 'medium' ? 'default' :
                  'secondary'
                }>
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View All Alerts
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}