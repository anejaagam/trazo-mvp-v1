# Monitoring & Telemetry Integration Plan

**Created:** October 29, 2025  
**Status:** Phase 10 - Ready to Begin  
**Estimated Duration:** 2-3 weeks  
**Priority:** 🔴 High (Next Major Feature)

---

## 🎯 Executive Summary

This document outlines the comprehensive plan to integrate the Monitoring & Telemetry prototype into the TRAZO MVP, establishing real-time environmental monitoring with TagoIO API integration. This follows the proven 7-phase pattern used for the successful Inventory feature integration (94.8% test pass rate, deployed to production).

### Goals
1. **Real-time pod monitoring** - Live environmental data (temp, humidity, CO2, VPD)
2. **Historical visualization** - Time-series charts (24h, 7d, 30d windows)
3. **Alarm management** - Threshold-based alerts with acknowledgment workflow
4. **TagoIO integration** - Production-ready API polling service
5. **Fleet management** - Multi-pod overview and health monitoring
6. **Compliance exports** - CSV/PDF exports with audit trails

---

## 📊 Current State Analysis

### Completed Infrastructure ✅
- **Database Schema**: `telemetry_readings` table deployed to US & Canada regions
- **Related Tables**: `device_status`, `alarms`, `alarm_policies`, `notifications`, `recipes`
- **RLS Policies**: Complete row-level security for telemetry data
- **RBAC Permissions**: `monitoring:view`, `monitoring:export` defined
- **Indexes**: Performance indexes on `pod_id` and `timestamp`

### Prototype Analysis
**Location**: `/Prototypes/MonitoringAndTelemeteryPrototype/`

**Key Components (13)**:
1. `DashboardLayout.tsx` - Main monitoring dashboard wrapper
2. `PodCard.tsx` - Individual pod status card with live metrics
3. `PodDetail.tsx` - Detailed pod view with charts
4. `EnvironmentChart.tsx` - Time-series visualization (Recharts)
5. `FleetView.tsx` - Multi-pod overview table
6. `AlarmsPanel.tsx` - Alarm list with severity indicators
7. `NotificationsPanel.tsx` - In-app notification center
8. `AlarmSummaryWidget.tsx` - Dashboard alarm summary
9. `StatusBadge.tsx` - Health status indicators
10. `InfoPanel.tsx` - Pod information display
11. `DataEntryDialog.tsx` - Manual data entry form
12. `ExportDialog.tsx` - Data export configuration
13. `QRCodeDialog.tsx` - Pod QR code generator

**Type System**:
- `types/telemetry.ts` - Comprehensive telemetry types
- Includes: `TelemetryReading`, `PodSnapshot`, `Alarm`, `Notification`, `ChartDataPoint`

**Mock Data**:
- `lib/mock-data.ts` - Realistic test data generation
- Simulates: stage-specific setpoints, drift patterns, equipment states

### Database Schema Details

```sql
-- Already deployed to production
CREATE TABLE telemetry_readings (
  id UUID PRIMARY KEY,
  pod_id UUID REFERENCES pods(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Environmental readings
  temperature_c DECIMAL(4,1),
  humidity_pct DECIMAL(4,1),
  co2_ppm INTEGER,
  vpd_kpa DECIMAL(3,2),
  light_intensity_pct INTEGER,
  
  -- Equipment states (12 boolean fields)
  cooling_active, heating_active, dehumidifier_active...
  
  -- Sensor health (4 fault indicators)
  temp_sensor_fault, humidity_sensor_fault...
  
  -- Recipe tracking
  active_recipe_id UUID REFERENCES recipes(id),
  
  -- Raw data storage for debugging
  raw_data JSONB,
  data_source TEXT CHECK (data_source IN ('tagoio', 'manual', 'calculated', 'simulated'))
);
```

**Indexes**:
- `idx_telemetry_pod_time` - Fast queries by pod + time
- `idx_telemetry_timestamp` - Recent data queries

---

## 🗺️ Integration Phases (Proven Pattern)

### Phase 1: Type Definitions (Day 1) ⏱️ 4 hours

**Deliverable**: `/types/telemetry.ts`

**Tasks**:
1. Port prototype types to main codebase
2. Align with database schema (column names, data types)
3. Add database operation types (Insert, Update, Select)
4. Create composite types for UI (WithPod, WithAlarms)
5. Add filter and pagination types
6. Define TagoIO-specific types

**Types to Create (25+)**:
```typescript
// Core entities
TelemetryReading
TelemetryReadingWithPod
DeviceStatus
PodSnapshot
PodHealth

// Alarms
Alarm
AlarmPolicy
AlarmRoute
Notification

// Charts & Visualization
ChartDataPoint
TimeSeriesData
EnvironmentalMetrics

// TagoIO Integration
TagoIODevice
TagoIOReading
TagoIOResponse

// Filters & Queries
TelemetryFilters
TelemetryDateRange
AggregationPeriod

// Database operations
InsertTelemetryReading
UpdateDeviceStatus
```

**Quality Gates**:
- [ ] All types exported from `/types/index.ts`
- [ ] No `any` types used
- [ ] JSDoc comments for complex types
- [ ] Aligns 100% with database schema

---

### Phase 2: Database Query Functions (Days 2-3) ⏱️ 12 hours ✅ COMPLETE

**Status**: ✅ COMPLETE (October 29, 2025)

**Deliverables**:
- `/lib/supabase/queries/telemetry.ts` (server-side) - ✅ 847 lines
- `/lib/supabase/queries/telemetry-client.ts` (client-side) - ✅ 470 lines
- `/lib/supabase/queries/alarms.ts` (alarm management) - ✅ 737 lines
- **Total**: 2,054 lines, 45+ functions, 100% type-safe

---

### Phase 3: Custom React Hooks (Day 4) ⏱️ 6 hours ✅ COMPLETE

**Status**: ✅ COMPLETE (October 29, 2025)

**Deliverables**:
- `/hooks/use-telemetry.ts` - ✅ 423 lines, 4 hooks
- `/hooks/use-alarms.ts` - ✅ 410 lines, 3 hooks
- **Total**: 833 lines, 7 custom hooks, 100% type-safe

#### use-telemetry.ts (4 hooks)

**Hooks Created**:
```typescript
// Real-time single pod monitoring
useTelemetry(podId, realtime?, autoFetch?)
// Returns: reading, loading, error, refresh(), createReading(), isSubscribed

// Time-series data for charts
useHistoricalTelemetry(podId, hours?, limit?)
// Returns: readings[], loading, error, refresh()

// Fleet monitoring for multiple pods
usePodSnapshots(siteId, realtime?, refreshInterval?)
// Returns: snapshots[], loading, error, refresh(), isSubscribed

// Hardware health tracking
useDeviceStatus(podId, realtime?)
// Returns: status, loading, error, refresh(), isOnline, isSubscribed
```

#### use-alarms.ts (3 hooks)

**Hooks Created**:
```typescript
// Alarm management with filtering
useAlarms(podId?, siteId?, severity?, status?, realtime?)
// Returns: alarms[], activeAlarms[], activeCount, loading, error, refresh(), acknowledge(), isSubscribed

// User notifications
useNotifications(userId, realtime?)
// Returns: notifications[], unreadNotifications[], unreadCount, loading, error, refresh(), markAsRead(), markAllAsRead(), isSubscribed

// Dashboard summary widget
useAlarmSummary(siteId, refreshInterval?)
// Returns: counts{critical, warning, info}, totalActive, loading, error, refresh()
```

**Features Implemented**:
- ✅ Real-time Supabase subscriptions with cleanup
- ✅ Loading/error states for all hooks
- ✅ Manual refresh capability
- ✅ Optional auto-fetch on mount
- ✅ Configurable refresh intervals
- ✅ Type-safe with proper TypeScript interfaces

#### Server-Side Queries (telemetry.ts)

**Functions to Create (15+)**:
```typescript
// Read operations
getTelemetryReadings(podId, dateRange) // Paginated history
getLatestReading(podId) // Most recent data point
getRecentReadings(podId, limit) // Last N readings
getPodSnapshots(siteId) // All pods current state
getAggregatedData(podId, period) // Hourly/daily averages

// Write operations
createTelemetryReading(data)
batchInsertReadings(readings[]) // For TagoIO bulk import
updateDeviceStatus(podId, status)

// Analytics
getEnvironmentalStats(podId, dateRange)
getEquipmentRuntime(podId, dateRange)
getTemperatureExtremes(podId, days)
getSensorHealthStatus(podId)

// Alarms
checkAlarmThresholds(reading) // Evaluate if alarms triggered
```

**Pattern**:
```typescript
export async function getTelemetryReadings(
  podId: string,
  dateRange: { start: Date; end: Date },
  limit: number = 1000
): Promise<{ data: TelemetryReading[] | null; error: Error | null }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', podId)
      .gte('timestamp', dateRange.start.toISOString())
      .lte('timestamp', dateRange.end.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching telemetry:', error)
    return { data: null, error: error as Error }
  }
}
```

#### Client-Side Queries (telemetry-client.ts)

**Functions to Create (8+)**:
```typescript
// Realtime subscriptions
subscribeToTelemetry(podId, callback)
subscribeToPodStatus(siteId, callback)
subscribeToAlarms(organizationId, callback)

// Quick reads (client auth)
getLatestReadingClient(podId)
getPodSnapshotClient(podId)
getActiveAlarmsClient(siteId)

// Manual data entry
createManualReading(podId, data)
acknowledgeAlarm(alarmId, note)
```

**Realtime Pattern**:
```typescript
export function subscribeToTelemetry(
  podId: string,
  callback: (reading: TelemetryReading) => void
) {
  const supabase = createClientComponentClient()
  
  const channel = supabase
    .channel(`telemetry:${podId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'telemetry_readings',
        filter: `pod_id=eq.${podId}`,
      },
      (payload) => {
        callback(payload.new as TelemetryReading)
      }
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}
```

#### Alarm Queries (alarms.ts)

**Functions to Create (12+)**:
```typescript
// Alarm management
getAlarms(filters)
getAlarmById(id)
getActiveAlarms(siteId)
acknowledgeAlarm(id, userId, note)
resolveAlarm(id, userId, resolution)
createAlarm(alarmData)

// Policies
getAlarmPolicies(organizationId)
createAlarmPolicy(policy)
updateAlarmPolicy(id, updates)
evaluateAlarmPolicies(reading) // Check if reading triggers alarms

// Notifications
getNotifications(userId, filters)
markNotificationRead(id)
getUnreadCount(userId)
```

**Quality Gates**:
- [ ] 40+ query functions total
- [ ] Error handling in all functions
- [ ] Type safety (no `any`)
- [ ] Proper RLS enforcement
- [ ] Server/client separation maintained

---

### Phase 3: Custom Hooks (Day 4) ⏱️ 6 hours

**Deliverable**: `/hooks/use-telemetry.ts`, `/hooks/use-alarms.ts`

**Hooks to Create**:

```typescript
// Real-time telemetry hook
export function useTelemetry(podId: string) {
  const [reading, setReading] = useState<TelemetryReading | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    // Fetch latest reading
    // Subscribe to updates
    // Cleanup on unmount
  }, [podId])
  
  return { reading, isLoading, error }
}

// Pod fleet status
export function usePodSnapshots(siteId: string) {
  // Return array of pod snapshots with health status
}

// Alarm monitoring
export function useAlarms(filters: AlarmFilters) {
  // Real-time alarm updates
  // Unread count
  // Acknowledge/resolve functions
}

// Historical data
export function useHistoricalData(podId: string, dateRange: DateRange) {
  // Fetch time-series data for charts
  // Handle pagination
  // Cache data
}
```

---

### Phase 4: UI Components Migration (Days 5-7) ⏱️ 18 hours

**Target Directory**: `/components/features/monitoring/`

**Component Migration Checklist**:
For each component:
1. Copy from prototype
2. Update imports (shadcn/ui paths)
3. Replace mock data with Supabase hooks
4. Add `usePermissions()` checks
5. Add `useJurisdiction()` for compliance
6. Update styling to brand colors
7. Add proper TypeScript types
8. Add loading states
9. Add error boundaries
10. Test with real data

**Components by Priority**:

#### Tier 1: Core Components (Days 5-6)
1. **pod-card.tsx** - Pod status card
   - Live metrics display
   - Health status badge
   - Equipment indicators
   - Alarm count
   - Navigation to detail view

2. **pod-detail.tsx** - Full pod view
   - Current readings
   - Time-series charts
   - Equipment status grid
   - Recipe information
   - Recent alarms

3. **environment-chart.tsx** - Time-series visualization
   - Multi-parameter charts (temp, RH, CO2, VPD)
   - Setpoint overlays
   - Equipment state markers
   - Zoom/pan controls
   - Export to CSV

4. **fleet-view.tsx** - Multi-pod table
   - Sortable columns
   - Filter by stage/status
   - Health indicators
   - Alarm counts
   - Quick actions

#### Tier 2: Alarm System (Day 6)
5. **alarms-panel.tsx** - Alarm list
   - Grouped by severity
   - Filter/search
   - Acknowledge action
   - Resolution notes

6. **notifications-panel.tsx** - Notification center
   - Unread badge
   - Mark as read
   - Navigate to source

7. **alarm-summary-widget.tsx** - Dashboard summary
   - Critical count
   - Warning count
   - Recent alarms

#### Tier 3: Utilities (Day 7)
8. **status-badge.tsx** - Health indicators
9. **info-panel.tsx** - Pod information
10. **export-dialog.tsx** - Data export
11. **data-entry-dialog.tsx** - Manual readings
12. **qrcode-dialog.tsx** - Pod QR codes

**RBAC Integration Example**:
```typescript
'use client'
import { usePermissions } from '@/hooks/use-permissions'
import { useJurisdiction } from '@/hooks/use-jurisdiction'

export function PodCard({ pod }: { pod: Pod }) {
  const { can } = usePermissions()
  const { jurisdiction } = useJurisdiction()
  
  if (!can('monitoring:view')) {
    return <div>Unauthorized</div>
  }
  
  // Jurisdiction-specific thresholds
  const tempThreshold = jurisdiction?.type === 'METRC' ? 85 : 90
  
  return (
    // Component JSX
  )
}
```

---

### Phase 5: Dashboard Pages (Day 8) ⏱️ 6 hours

**Pages to Create**:

#### 1. Main Monitoring Dashboard
**Path**: `/app/dashboard/monitoring/page.tsx`

**Features**:
- Fleet view (all pods)
- Filter by room/stage
- Sort by health/alarms
- Quick stats cards
- Recent alarms widget

**Server Component Pattern**:
```typescript
export default async function MonitoringPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/login')
  
  // Check permissions
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!canPerformAction(userData?.role || '', 'monitoring:view')) {
    redirect('/dashboard')
  }
  
  return <MonitoringDashboard />
}
```

#### 2. Pod Detail Page
**Path**: `/app/dashboard/monitoring/[podId]/page.tsx`

**Features**:
- Real-time metrics
- Environmental charts (24h, 7d, 30d)
- Equipment status
- Active recipe
- Alarm history
- Manual override status

#### 3. Export Page (Optional)
**Path**: `/app/dashboard/monitoring/export/page.tsx`

**Features**:
- Date range selection
- Pod selection
- Format (CSV/PDF)
- Compliance templates

**Metadata**:
```typescript
export const metadata: Metadata = {
  title: 'Monitoring Dashboard | TRAZO',
  description: 'Real-time environmental monitoring and telemetry'
}
```

---

### Phase 6: TagoIO Integration (Days 9-11) ⏱️ 18 hours

**CRITICAL**: This is the most complex phase requiring external API understanding.

#### Step 1: TagoIO API Research (Day 9) ⏱️ 4 hours

**Objectives**:
1. Understand TagoIO data structure
2. Document device token requirements
3. Test API rate limits
4. Map TagoIO fields to Trazo schema
5. Document error responses

**Research Plan**:
```typescript
// 1. Create test script
// scripts/test-tagoio-api.ts

import { TagoIOClient } from '@/lib/tagoio/client'

async function testTagoIOAPI() {
  const client = new TagoIOClient(process.env.TAGOIO_TOKEN!)
  
  // Test 1: Get device list
  const devices = await client.getDevices()
  console.log('Devices:', devices)
  
  // Test 2: Get device data
  const data = await client.getDeviceData('device-id', {
    start: new Date(Date.now() - 3600000), // Last hour
    end: new Date()
  })
  console.log('Data structure:', JSON.stringify(data, null, 2))
  
  // Test 3: Real-time data
  const latest = await client.getLatestReading('device-id')
  console.log('Latest reading:', latest)
  
  // Document findings in TAGOIO_API_ANALYSIS.md
}
```

**Documentation to Create**:
- `TAGOIO_API_ANALYSIS.md` - API structure, data formats, mappings

#### Step 2: Create TagoIO Client (Day 9-10) ⏱️ 8 hours

**File Structure**:
```
/lib/tagoio/
├── client.ts          # API client class
├── types.ts           # TagoIO-specific types
├── transformer.ts     # Data transformation
├── config.ts          # Device mappings
└── __tests__/
    ├── client.test.ts
    └── transformer.test.ts
```

**Client Implementation**:
```typescript
// lib/tagoio/client.ts

export class TagoIOClient {
  private baseUrl = 'https://api.tago.io'
  private token: string
  
  constructor(token: string) {
    this.token = token
  }
  
  async getDevices(): Promise<TagoIODevice[]> {
    const response = await fetch(`${this.baseUrl}/devices`, {
      headers: {
        'Device-Token': this.token,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`TagoIO API error: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async getDeviceData(
    deviceId: string,
    options: {
      start: Date
      end: Date
      variables?: string[]
    }
  ): Promise<TagoIOReading[]> {
    const params = new URLSearchParams({
      start_date: options.start.toISOString(),
      end_date: options.end.toISOString(),
      ...(options.variables && { variables: options.variables.join(',') })
    })
    
    const response = await fetch(
      `${this.baseUrl}/devices/${deviceId}/data?${params}`,
      {
        headers: { 'Device-Token': this.token }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async getLatestReading(deviceId: string): Promise<TagoIOReading | null> {
    const data = await this.getDeviceData(deviceId, {
      start: new Date(Date.now() - 300000), // Last 5 minutes
      end: new Date()
    })
    
    return data.length > 0 ? data[0] : null
  }
}
```

**Transformer Implementation**:
```typescript
// lib/tagoio/transformer.ts

export function transformTagoIOReading(
  tagoData: TagoIOReading,
  deviceMapping: DeviceMapping
): InsertTelemetryReading {
  return {
    pod_id: deviceMapping.podId,
    timestamp: new Date(tagoData.time),
    
    // Map TagoIO variables to Trazo fields
    temperature_c: getVariable(tagoData, 'temperature'),
    humidity_pct: getVariable(tagoData, 'humidity'),
    co2_ppm: getVariable(tagoData, 'co2'),
    vpd_kpa: calculateVPD(
      getVariable(tagoData, 'temperature'),
      getVariable(tagoData, 'humidity')
    ),
    
    // Equipment states
    cooling_active: getVariable(tagoData, 'cooling') === 1,
    heating_active: getVariable(tagoData, 'heating') === 1,
    // ... map other equipment states
    
    // Store raw data for debugging
    raw_data: tagoData,
    data_source: 'tagoio'
  }
}

function getVariable(reading: TagoIOReading, name: string): number | null {
  const variable = reading.variables?.find(v => v.variable === name)
  return variable?.value ?? null
}

function calculateVPD(tempC: number | null, rhPct: number | null): number | null {
  if (!tempC || !rhPct) return null
  
  // VPD calculation
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3))
  const avp = (rhPct / 100) * svp
  return svp - avp
}
```

#### Step 3: Polling Service (Day 10-11) ⏱️ 6 hours

**Service Implementation**:
```typescript
// lib/tagoio/polling-service.ts

export class TelemetryPollingService {
  private client: TagoIOClient
  private interval: NodeJS.Timeout | null = null
  private isRunning = false
  
  constructor(token: string) {
    this.client = new TagoIOClient(token)
  }
  
  async start(intervalMs: number = 60000) {
    if (this.isRunning) {
      console.warn('Polling service already running')
      return
    }
    
    this.isRunning = true
    console.log('Starting telemetry polling service')
    
    // Initial poll
    await this.poll()
    
    // Set up interval
    this.interval = setInterval(() => {
      this.poll().catch(console.error)
    }, intervalMs)
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.isRunning = false
    console.log('Stopped telemetry polling service')
  }
  
  private async poll() {
    try {
      // Get device mappings from config
      const mappings = await getDeviceMappings()
      
      // Poll each device
      const readings = await Promise.all(
        mappings.map(async (mapping) => {
          const data = await this.client.getLatestReading(mapping.deviceId)
          if (!data) return null
          
          return transformTagoIOReading(data, mapping)
        })
      )
      
      // Filter nulls and batch insert
      const validReadings = readings.filter(Boolean) as InsertTelemetryReading[]
      
      if (validReadings.length > 0) {
        const supabase = createServiceRoleClient()
        const { error } = await supabase
          .from('telemetry_readings')
          .insert(validReadings)
        
        if (error) {
          console.error('Failed to insert readings:', error)
        } else {
          console.log(`Inserted ${validReadings.length} telemetry readings`)
        }
      }
      
    } catch (error) {
      console.error('Polling error:', error)
      // Don't throw - keep polling
    }
  }
}

// Helper to get device mappings
async function getDeviceMappings(): Promise<DeviceMapping[]> {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .from('pods')
    .select('id, tagoio_device_id')
    .not('tagoio_device_id', 'is', null)
  
  if (error) throw error
  
  return data.map(pod => ({
    podId: pod.id,
    deviceId: pod.tagoio_device_id!
  }))
}
```

**Background Job**:
```typescript
// app/api/cron/telemetry-poll/route.ts

import { TelemetryPollingService } from '@/lib/tagoio/polling-service'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const service = new TelemetryPollingService(process.env.TAGOIO_TOKEN!)
  
  // Poll once (triggered by Vercel Cron or similar)
  await service['poll']()
  
  return Response.json({ success: true })
}
```

---

### Phase 7: Testing (Day 12) ⏱️ 8 hours

**Test Suites to Create**:

#### 1. Query Tests
```typescript
// lib/supabase/queries/__tests__/telemetry.test.ts

describe('Telemetry Queries', () => {
  it('fetches telemetry readings for pod', async () => {
    // Test getTelemetryReadings
  })
  
  it('handles date range filters', async () => {
    // Test date filtering
  })
  
  it('respects pagination limits', async () => {
    // Test limit parameter
  })
  
  it('calculates aggregated stats', async () => {
    // Test getEnvironmentalStats
  })
})
```

#### 2. Component Tests
```typescript
// components/features/monitoring/__tests__/pod-card.test.tsx

describe('PodCard', () => {
  it('displays current readings', () => {
    // Test rendering
  })
  
  it('shows health status correctly', () => {
    // Test health calculations
  })
  
  it('requires monitoring:view permission', () => {
    // Test RBAC
  })
})
```

#### 3. TagoIO Tests
```typescript
// lib/tagoio/__tests__/transformer.test.ts

describe('TagoIO Transformer', () => {
  it('transforms TagoIO reading to Trazo format', () => {
    const tagoData = mockTagoIOReading()
    const mapping = { podId: 'test-id', deviceId: 'device-1' }
    
    const result = transformTagoIOReading(tagoData, mapping)
    
    expect(result.pod_id).toBe('test-id')
    expect(result.temperature_c).toBe(23.5)
    expect(result.data_source).toBe('tagoio')
  })
  
  it('calculates VPD correctly', () => {
    // Test VPD calculation
  })
  
  it('handles missing variables gracefully', () => {
    // Test null handling
  })
})
```

**Test Coverage Target**: 90%+

---

## 🎯 Success Criteria

### Must-Have (MVP)
- [ ] Real-time pod status cards (all pods visible)
- [ ] Individual pod detail view with charts
- [ ] Environmental data visualization (temp, RH, CO2, VPD)
- [ ] Equipment status indicators
- [ ] Alarm list with severity levels
- [ ] RBAC enforcement (monitoring:view permission)
- [ ] 90%+ test coverage
- [ ] Type-safe (no `any` types)

### Should-Have
- [ ] TagoIO polling service (60s intervals)
- [ ] Data export (CSV format)
- [ ] Alarm acknowledgment workflow
- [ ] Notification center
- [ ] Fleet view with sorting/filtering

### Nice-to-Have (Post-MVP)
- [ ] PDF export with compliance templates
- [ ] Mobile-optimized views
- [ ] WebSocket for <1s updates
- [ ] Advanced analytics (weekly/monthly trends)
- [ ] Predictive alerts (ML-based)

---

## 📋 File Structure

```
/app/dashboard/monitoring/
├── page.tsx                          # Fleet overview page
├── [podId]/
│   └── page.tsx                      # Pod detail page
└── export/
    └── page.tsx                      # Data export page

/components/features/monitoring/
├── pod-card.tsx
├── pod-detail.tsx
├── environment-chart.tsx
├── fleet-view.tsx
├── alarms-panel.tsx
├── notifications-panel.tsx
├── alarm-summary-widget.tsx
├── status-badge.tsx
├── info-panel.tsx
├── export-dialog.tsx
├── data-entry-dialog.tsx
└── qrcode-dialog.tsx

/lib/supabase/queries/
├── telemetry.ts                      # Server-side queries
├── telemetry-client.ts               # Client-side queries
└── alarms.ts                         # Alarm management

/lib/tagoio/
├── client.ts                         # TagoIO API client
├── types.ts                          # TagoIO types
├── transformer.ts                    # Data transformation
├── config.ts                         # Device mappings
└── polling-service.ts                # Background polling

/hooks/
├── use-telemetry.ts
├── use-alarms.ts
└── use-pod-snapshots.ts

/types/
└── telemetry.ts                      # All telemetry types

/app/api/cron/
└── telemetry-poll/
    └── route.ts                      # Cron endpoint

/__tests__/
├── lib/supabase/queries/
│   ├── telemetry.test.ts
│   └── alarms.test.ts
├── lib/tagoio/
│   ├── client.test.ts
│   └── transformer.test.ts
└── components/features/monitoring/
    ├── pod-card.test.tsx
    └── environment-chart.test.tsx
```

**Estimated Files**: 40+ files  
**Estimated Lines of Code**: ~25,000 lines

---

## 🔧 Technical Considerations

### Performance
- **Telemetry Data Volume**: Assume 1 reading/pod/minute = 1,440 readings/pod/day
- **Retention**: Keep 90 days online, archive older data
- **Query Optimization**: Use materialized views for aggregations
- **Caching**: Cache latest readings for 30s to reduce DB load

### Scalability
- **48 pods/site**: ~70,000 readings/day/site
- **Multi-tenancy**: RLS policies ensure org isolation
- **Batch Inserts**: Use `batchInsertReadings()` for efficiency

### Reliability
- **Retry Logic**: Exponential backoff for TagoIO API failures
- **Stale Data Warnings**: Flag readings >5 minutes old
- **Sensor Fault Detection**: Automatic alarm triggers
- **Audit Trail**: Log all data exports

### Security
- **Service Role**: Use for polling service only
- **User Queries**: Always use client auth with RLS
- **API Tokens**: Store in environment variables
- **Audit Logging**: Track all manual overrides

---

## 🚀 Deployment Strategy

### Phase 1: Integration (Weeks 1-2)
1. Complete Phases 1-5 (Types, Queries, Components, Pages)
2. Deploy with mock data
3. User acceptance testing

### Phase 2: TagoIO Connection (Week 3)
1. Test API integration in development
2. Deploy polling service to staging
3. Monitor data quality for 48 hours
4. Deploy to production

### Post-Deployment
1. Monitor for 1 week
2. Collect user feedback
3. Optimize queries based on usage
4. Plan Phase 11 (Environmental Controls)

---

## 📊 Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| TagoIO API changes | High | Low | Version API calls, monitor changelog |
| Data volume exceeds expectations | Medium | Medium | Implement archiving, optimize indexes |
| Network latency affects UX | Medium | Medium | Add caching, show stale data indicators |
| Sensor faults cause bad data | High | Medium | Validate readings, auto-flag outliers |
| User overwhelm with alarms | Medium | High | Tunable thresholds, alarm suppression |

---

## 📖 Documentation Updates Required

1. **NextSteps.md** - Mark Phase 10 in progress
2. **CURRENT.md** - Add monitoring section
3. **TAGOIO_API_ANALYSIS.md** - NEW: API documentation
4. **MONITORING_INTEGRATION.md** - NEW: This file
5. **.github/copilot-instructions.md** - Add monitoring patterns

---

## 🎓 Key Learnings from Inventory

### Apply to Monitoring
1. ✅ **Use proven 7-phase pattern** - Worked perfectly
2. ✅ **Server/client query separation** - Maintains RLS
3. ✅ **Comprehensive type system** - Catches bugs early
4. ✅ **Test as you go** - Don't batch tests at end
5. ✅ **Document decisions** - Future you will thank you

### Avoid Pitfalls
1. ❌ **Don't skip RBAC checks** - Security critical
2. ❌ **Don't use mock data in production** - Replace before deploy
3. ❌ **Don't create duplicate components** - Check /components/ui/ first
4. ❌ **Don't hardcode org/site IDs** - Use auth context

---

## 📞 Next Steps

### Immediate Actions
1. ✅ Review this plan with team
2. ⏳ Set up TagoIO test account
3. ⏳ Obtain device tokens
4. ⏳ Schedule kickoff meeting
5. ⏳ Create GitHub issues for each phase

### Questions to Answer
- [ ] What are our TagoIO device IDs?
- [ ] What is the polling rate limit?
- [ ] Do we have test devices for staging?
- [ ] Who has access to TagoIO dashboard?
- [ ] What is the expected latency (device → Trazo)?

---

## 📈 Progress Tracking

| Phase | Status | Start Date | End Date | Notes |
|-------|--------|------------|----------|-------|
| 1. Types | Not Started | - | - | - |
| 2. Queries | Not Started | - | - | - |
| 3. Hooks | Not Started | - | - | - |
| 4. Components | Not Started | - | - | - |
| 5. Pages | Not Started | - | - | - |
| 6. TagoIO | Not Started | - | - | - |
| 7. Testing | Not Started | - | - | - |

---

**Document Version**: 1.0  
**Last Updated**: October 29, 2025  
**Next Review**: After Phase 3 completion
