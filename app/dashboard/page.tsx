import { redirect } from 'next/navigation'
import { Boxes, Sprout, Bell, Package } from 'lucide-react'
import { WelcomeBanner } from '@/components/features/onboarding/welcome-banner'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

type UserRow = { 
  role: string | null
  organization: { 
    jurisdiction: string | null
    id: string
  } | null
  site_id: string | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user data
  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const userRole = userData?.role ?? null
  const organizationId = userData?.organization_id ?? ''
  const userId = user.id

  // Get site assignments
  const { data: siteAssignments } = await supabase
    .from('user_site_assignments')
    .select('site_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)

  const siteId = siteAssignments?.[0]?.site_id ?? ''

  // Get organization data
  const { data: org } = await supabase
    .from('organizations')
    .select('jurisdiction')
    .eq('id', organizationId)
    .single()

  const jurisdictionId = org?.jurisdiction ?? null

  // Get all batches for this site
  const { data: allBatches, error: batchError } = await supabase
    .from('batches')
    .select('id, batch_number, status, cultivar_id, created_at')
    .eq('site_id', siteId)
  
  // Filter active batches (use 'active' status instead of growth stages)
  const activeBatches = allBatches?.filter(b => 
    b.status === 'active'
  ).slice(0, 3) || []
  
  const activeBatchesCount = allBatches?.filter(b => 
    b.status === 'active'
  ).length || 0

  // Get cultivar names for active batches
  if (activeBatches.length > 0) {
    const cultivarIds = activeBatches.map(b => b.cultivar_id).filter(Boolean)
    if (cultivarIds.length > 0) {
      const { data: cultivars } = await supabase
        .from('cultivars')
        .select('id, name')
        .in('id', cultivarIds)
      
      // Add cultivar names to batches
      activeBatches.forEach((batch: any) => {
        const cultivar = cultivars?.find(c => c.id === batch.cultivar_id)
        batch.cultivar = cultivar ? { name: cultivar.name } : null
      })
    }
    
    // Get plant counts for active batches from batch_plants table
    const { data: batchPlants } = await supabase
      .from('batch_plants')
      .select('batch_id, id')
      .in('batch_id', activeBatches.map(b => b.id))
      .eq('status', 'active')
    
    // Count plants per batch
    activeBatches.forEach((batch: any) => {
      const plantsInBatch = batchPlants?.filter(p => p.batch_id === batch.id) || []
      batch.plants = [{ count: plantsInBatch.length }]
    })
  }

  const totalPlantsCount = activeBatches.reduce((sum, batch: any) => {
    return sum + (batch.plants?.[0]?.count || 0)
  }, 0)

  // Get active alarms - need to join through pods to satisfy RLS policy
  const { data: activeAlarms, error: alarmsError } = await supabase
    .from('alarms')
    .select(`
      *,
      pods!inner(
        id,
        rooms!inner(
          id,
          sites!inner(
            id
          )
        )
      )
    `)
    .eq('pods.rooms.sites.id', siteId)
    .eq('status', 'active')
    .order('triggered_at', { ascending: false })
    .limit(3)
  
  const activeAlarmsCount = activeAlarms?.length || 0

  // Get inventory items - filter by organization_id instead of site_id for RLS
  const { data: allInventory, error: inventoryError } = await supabase
    .from('inventory_items')
    .select('id, name, current_quantity, minimum_quantity, site_id')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
  
  // Filter to this site and low stock items
  const siteInventory = allInventory?.filter(item => item.site_id === siteId) || []
  const lowStockItems = siteInventory.filter(item => 
    item.minimum_quantity && item.current_quantity <= item.minimum_quantity
  ) || []
  const lowStockCount = lowStockItems.length

  // Get environmental data from latest telemetry readings
  const { data: pods } = await supabase
    .from('pods')
    .select(`
      id,
      rooms!inner(
        site_id
      )
    `)
    .eq('rooms.site_id', siteId)
    .eq('is_active', true)

  const podIds = pods?.map(p => p.id) || []
  
  let envData = {
    avgTemp: 0,
    avgHumidity: 0,
    avgCO2: 0,
    podsOnline: 0,
    totalPods: podIds.length
  }

  if (podIds.length > 0) {
    // Get latest telemetry for each pod (within last hour for relevance)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: telemetryData, error: telemetryError } = await supabase
      .from('telemetry_readings')
      .select('pod_id, temperature_c, humidity_pct, co2_ppm, timestamp')
      .in('pod_id', podIds)
      .gte('timestamp', oneHourAgo)
      .order('timestamp', { ascending: false })

    if (telemetryData && telemetryData.length > 0) {
      // Get most recent reading per pod that has actual values
      const latestByPod = new Map()
      telemetryData.forEach(reading => {
        if (!latestByPod.has(reading.pod_id)) {
          // Only use readings that have at least one non-null value
          if (reading.temperature_c != null || reading.humidity_pct != null || reading.co2_ppm != null) {
            latestByPod.set(reading.pod_id, reading)
          }
        }
      })

      const latestReadings = Array.from(latestByPod.values())
      
      if (latestReadings.length > 0) {
        const temps = latestReadings.filter(r => r.temperature_c != null).map(r => r.temperature_c!)
        const humids = latestReadings.filter(r => r.humidity_pct != null).map(r => r.humidity_pct!)
        const co2s = latestReadings.filter(r => r.co2_ppm != null).map(r => r.co2_ppm!)

        envData.avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0
        envData.avgHumidity = humids.length > 0 ? humids.reduce((a, b) => a + b, 0) / humids.length : 0
        envData.avgCO2 = co2s.length > 0 ? co2s.reduce((a, b) => a + b, 0) / co2s.length : 0
        envData.podsOnline = latestReadings.length
      }
    }
  }

  // Get growth metrics - track plant counts and batches over last 12 weeks
  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)
  
  // Get only active batches created in the last 12 weeks
  const { data: batchHistory } = await supabase
    .from('batches')
    .select('id, created_at, plant_count')
    .eq('site_id', siteId)
    .eq('status', 'active')
    .gte('created_at', twelveWeeksAgo.toISOString())
    .order('created_at', { ascending: true })

  // Get plant counts from batch_plants table for more accurate tracking
  const batchIds = batchHistory?.map(b => b.id) || []
  let plantsByBatch: Record<string, number> = {}
  
  if (batchIds.length > 0) {
    const { data: batchPlantCounts } = await supabase
      .from('batch_plants')
      .select('batch_id')
      .in('batch_id', batchIds)
    
    // Count plants per batch
    batchPlantCounts?.forEach(p => {
      plantsByBatch[p.batch_id] = (plantsByBatch[p.batch_id] || 0) + 1
    })
  }

  // Aggregate by week (12 weeks of data)
  // Each week spans 7 days, starting from the oldest week going to current
  const weeklyData = []
  const now = new Date()
  now.setHours(23, 59, 59, 999) // End of today
  
  for (let i = 11; i >= 0; i--) {
    // Calculate week boundaries going backwards from today
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() - (i * 7))
    weekEnd.setHours(23, 59, 59, 999)
    
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)
    
    const batchesThisWeek = batchHistory?.filter(b => {
      const created = new Date(b.created_at)
      return created >= weekStart && created <= weekEnd
    }) || []
    
    // Use plant count from batch_plants if available, otherwise fall back to batch.plant_count
    const plantsThisWeek = batchesThisWeek.reduce((sum, b) => {
      const plantCount = plantsByBatch[b.id] || b.plant_count || 0
      return sum + plantCount
    }, 0)
    
    weeklyData.push({
      name: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${12 - i} wks ago`,
      plants: plantsThisWeek,
      batches: batchesThisWeek.length
    })
  }

  // Pass raw weekly data to client (client will calculate cumulative based on selected weeks)
  // Calculate totals for default 4-week view
  const last4Weeks = weeklyData.slice(-4)
  let cumulativePlants = 0
  last4Weeks.forEach(week => {
    cumulativePlants += week.plants
  })

  // Calculate growth percentage for default view
  const growthPercent = '0.00' // Client will recalculate based on selection

  return (
    <div className="space-y-6">
      {/* Onboarding banner (shows once per browser) */}
      <WelcomeBanner role={userRole} jurisdictionId={jurisdictionId ?? undefined} />
      
      {/* Client-side dashboard content */}
      <DashboardClient 
        siteId={siteId}
        organizationId={organizationId}
        userId={userId}
        jurisdictionId={jurisdictionId}
        stats={{
          activeBatches: activeBatchesCount || 0,
          totalPlants: totalPlantsCount,
          activeAlarms: activeAlarmsCount || 0,
          lowStockItems: lowStockCount
        }}
        environmental={envData}
        batches={activeBatches || []}
        alarms={activeAlarms || []}
        growthData={weeklyData}
        totalPlants={cumulativePlants}
        growthPercent={growthPercent}
      />
    </div>
  )
}