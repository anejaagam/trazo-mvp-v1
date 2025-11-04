# Database & Architecture Analysis for Monitoring Integration

**Date:** October 29, 2025  
**Updated:** October 29, 2025 (Phase 3 Complete)  
**Source:** Supabase MCP Servers (US & Canada Regions) ✅  
**Purpose:** Technical analysis to inform monitoring integration  
**Status:** Phase 3 Complete - Custom React Hooks Implemented

---

## ✅ Multi-Region Verification

**Status:** SYNCHRONIZED ✓

Both US and Canada Supabase regions have been verified and are running identical schemas:
- **US Region**: 32 tables, all monitoring tables present (0 rows - staging)
- **Canada Region**: 32 tables, all monitoring tables present (0 rows - staging)
- **Schema Consistency**: 100% match across regions
- **RLS Policies**: Identical across both regions
- **Indexes**: Matching performance indexes deployed

**Key Differences (Data Only)**:
- US: 8 organizations, 12 sites, 4 users, 3 inventory items, 9 movements, 7 lots, 101 audit logs
- Canada: 1 organization, 0 sites, 1 user, 0 inventory items, 0 movements, 0 lots, 1 audit log

Both regions are ready for monitoring integration with identical schema structure.

---

## 📊 Database Schema Analysis

### Current Tables (32 total)

#### Core Infrastructure
1. **organizations** (1 row) - Multi-tenant root
2. **sites** (0 rows) - Physical locations
3. **rooms** (0 rows) - Pod groupings
4. **pods** (0 rows) - Growing containers with `tagoio_device_id` field
5. **users** (1 row) - RBAC-enabled users

#### Telemetry & Monitoring (Already Deployed) ✅
6. **telemetry_readings** (0 rows) - Time-series environmental data
   - Columns: 28 total
   - Environmental: temperature_c, humidity_pct, co2_ppm, vpd_kpa, light_intensity_pct
   - Equipment: 8 boolean state fields (cooling_active, heating_active, etc.)
   - Sensor health: 4 fault indicators
   - **Key field**: `tagoio_device_id` links to pods table
   - **Raw data storage**: `raw_data JSONB` for debugging
   - **Data source tracking**: CHECK constraint (tagoio, manual, calculated, simulated)

7. **device_status** (0 rows) - Device health tracking
   - Tracks: GCU, sensors, actuators
   - Status: online, offline, error, maintenance
   - Firmware & hardware versions

8. **alarm_policies** (0 rows) - Configurable thresholds
   - Types: 13 alarm types (temp_high/low, humidity, CO2, VPD, sensor faults)
   - Severity: critical, warning, info
   - Threshold operators: >, <, >=, <=, =, !=
   - Time-in-state: Prevents false alarms
   - Stage-specific: Different rules for veg vs flower

9. **alarms** (0 rows) - Alarm instances
   - Lifecycle: triggered → acknowledged → resolved
   - Related entities: pod, batch, recipe, telemetry reading
   - Escalation support: escalated_at, escalated_to_level
   - Root cause tracking

10. **alarm_routes** (0 rows) - Notification routing
    - Channel: in_app, email, sms, push
    - Role-based routing
    - Escalation delays

11. **notifications** (0 rows) - Delivery tracking
    - Status: sent, delivered, failed, read
    - Tracks delivery timestamps

### Key Relationships

```
organizations
  └── sites
      └── rooms
          └── pods (has tagoio_device_id)
              ├── telemetry_readings
              ├── device_status
              ├── alarms
              └── control_overrides
```

---

## 🔍 Critical Field Analysis

### pods.tagoio_device_id
- **Type**: TEXT (nullable)
- **Purpose**: Links pod to TagoIO device
- **Current State**: 0 pods exist (staging environment)
- **Integration Impact**: CRITICAL - This is the mapping key

**Required Action**: 
- Populate this field with actual TagoIO device IDs before polling service works
- Create admin UI to manage device mappings
- Add validation that device ID exists in TagoIO before saving

### telemetry_readings.raw_data
- **Type**: JSONB
- **Purpose**: Store complete TagoIO response for debugging
- **Benefits**:
  - Can reprocess data if transformer logic changes
  - Audit trail of what device actually sent
  - Debug sensor issues
  - Validate data transformation accuracy

**Best Practice**:
```typescript
{
  pod_id: 'uuid',
  temperature_c: 23.5,
  // ... transformed fields
  raw_data: {
    // Complete TagoIO response
    device_id: 'tagoio-123',
    timestamp: '2025-10-29T12:00:00Z',
    variables: [
      { variable: 'temperature', value: 23.5, unit: 'C' },
      { variable: 'humidity', value: 65, unit: '%' }
    ]
  },
  data_source: 'tagoio'
}
```

### telemetry_readings.data_source
- **Type**: TEXT with CHECK constraint
- **Values**: tagoio, manual, calculated, simulated
- **Purpose**: Track data origin for compliance

**Usage**:
- `tagoio`: Production data from devices
- `manual`: Operator-entered data (calibration, backup readings)
- `calculated`: Derived metrics (VPD from temp + RH)
- `simulated`: Test/demo data (dev mode)

---

## 🔐 Row-Level Security (RLS) Analysis

### telemetry_readings Policies

1. **SELECT Policy**: "Users can view telemetry in their org"
   ```sql
   USING (
     pod_id IN (
       SELECT p.id FROM pods p
       JOIN rooms r ON p.room_id = r.id
       JOIN sites s ON r.site_id = s.id
       WHERE s.organization_id = public.user_organization_id()
     )
   )
   ```
   - ✅ Ensures multi-tenancy
   - ✅ No cross-org data leakage

2. **INSERT Policy**: "Service can create telemetry readings"
   ```sql
   WITH CHECK (TRUE)
   ```
   - ⚠️ Service role only (no user inserts)
   - ✅ Correct for polling service

3. **UPDATE Policy**: "No telemetry updates"
   ```sql
   USING (FALSE)
   ```
   - ✅ Time-series data is immutable
   - ✅ Prevents data tampering

4. **DELETE Policy**: "Org admins can delete telemetry"
   ```sql
   USING (
     pod_id IN (...)
     AND public.user_role() = 'org_admin'
   )
   ```
   - ✅ Only org_admin can delete
   - ✅ Use case: GDPR compliance, data cleanup

---

## 📈 Performance Considerations

### Indexes (Current)
```sql
CREATE INDEX idx_telemetry_pod_time 
ON telemetry_readings(pod_id, timestamp DESC);

CREATE INDEX idx_telemetry_timestamp 
ON telemetry_readings(timestamp DESC);
```

**Analysis**:
- ✅ Excellent for: `WHERE pod_id = ? ORDER BY timestamp DESC`
- ✅ Good for: Recent data queries across all pods
- ⚠️ May need additional indexes for:
  - Alarm threshold queries (filtering by temperature, humidity, etc.)
  - Aggregation queries (daily averages)

**Recommended Additional Indexes** (post-deployment):
```sql
-- For alarm evaluation (if becomes bottleneck)
CREATE INDEX idx_telemetry_temperature 
ON telemetry_readings(pod_id, temperature_c) 
WHERE temperature_c IS NOT NULL;

-- For analytics (if used frequently)
CREATE INDEX idx_telemetry_date 
ON telemetry_readings(DATE(timestamp), pod_id);
```

### Query Optimization

**Current Volume Estimate**:
- 48 pods/site × 1 reading/minute = 69,120 readings/day/site
- 90-day retention = 6,220,800 readings/site

**Optimization Strategies**:
1. **Partitioning** (if volume grows):
   ```sql
   -- Partition by month
   CREATE TABLE telemetry_readings_2025_11 
   PARTITION OF telemetry_readings 
   FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
   ```

2. **Materialized Views** (for dashboards):
   ```sql
   CREATE MATERIALIZED VIEW telemetry_latest AS
   SELECT DISTINCT ON (pod_id)
     pod_id, timestamp, temperature_c, humidity_pct, co2_ppm, vpd_kpa
   FROM telemetry_readings
   ORDER BY pod_id, timestamp DESC;
   
   CREATE UNIQUE INDEX ON telemetry_latest(pod_id);
   REFRESH MATERIALIZED VIEW CONCURRENTLY telemetry_latest;
   ```

3. **Archiving** (post-90 days):
   - Move to cold storage (S3)
   - Keep aggregated data (hourly/daily averages)
   - Maintain raw data for compliance period

---

## 🎯 RBAC Integration

### Existing Permissions
```typescript
// From lib/rbac/permissions.ts
'monitoring:view': {
  key: 'monitoring:view',
  name: 'View Monitoring Dashboard',
  description: 'View real-time telemetry and pod status',
  category: 'monitoring',
  roles: ['org_admin', 'site_manager', 'head_grower', 'operator', 'compliance_qa']
}

'monitoring:export': {
  key: 'monitoring:export',
  name: 'Export Telemetry Data',
  description: 'Export historical data to CSV/PDF',
  category: 'monitoring',
  roles: ['org_admin', 'site_manager', 'head_grower', 'compliance_qa']
}
```

**Analysis**:
- ✅ All operational roles can view monitoring
- ✅ Executive viewer excluded (read-only, no exports)
- ⚠️ May need additional permissions:
  - `monitoring:manual_entry` - For operators to enter manual readings
  - `monitoring:acknowledge_alarm` - For alarm workflow
  - `monitoring:configure_thresholds` - For org_admin to set alarm policies

**Recommended Additions**:
```typescript
'monitoring:manual_entry': {
  key: 'monitoring:manual_entry',
  name: 'Enter Manual Readings',
  description: 'Record manual telemetry data (backup/calibration)',
  category: 'monitoring',
  roles: ['org_admin', 'site_manager', 'head_grower', 'operator']
},

'monitoring:acknowledge_alarm': {
  key: 'monitoring:acknowledge_alarm',
  name: 'Acknowledge Alarms',
  description: 'Acknowledge and add notes to alarms',
  category: 'monitoring',
  roles: ['org_admin', 'site_manager', 'head_grower', 'operator']
},

'monitoring:configure_alarms': {
  key: 'monitoring:configure_alarms',
  name: 'Configure Alarm Policies',
  description: 'Create and modify alarm thresholds',
  category: 'monitoring',
  roles: ['org_admin', 'site_manager']
}
```

---

## 🔗 Integration Architecture

### Data Flow

```
TagoIO Device (Physical Pod)
    ↓ (HTTP Request via GCU)
TagoIO Cloud Platform
    ↓ (Polling Service - 60s interval)
TRAZO Backend (Supabase Edge Function or Vercel Cron)
    ↓ (Transform & Validate)
telemetry_readings table (INSERT with service role)
    ↓ (Supabase Realtime)
Client Components (useEffect + subscription)
    ↓ (React State Update)
Dashboard UI (Real-time update)
```

### Service Architecture Options

#### Option A: Vercel Cron (Recommended for MVP)
```typescript
// app/api/cron/telemetry-poll/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  // Poll TagoIO for all devices
  // Transform data
  // Batch insert to Supabase
}
```

**Pros**:
- Simple deployment
- Built-in scheduling
- Serverless (no infrastructure)

**Cons**:
- 10-second timeout (may need batching)
- Not truly real-time (60s intervals)

#### Option B: Supabase Edge Function (Better for Scale)
```typescript
// supabase/functions/telemetry-poller/index.ts
Deno.serve(async (req) => {
  // Long-running function
  // Polls TagoIO continuously
  // Streams updates to Supabase
})
```

**Pros**:
- No timeout limits
- Can run continuously
- Closer to database (lower latency)

**Cons**:
- Requires Supabase Pro plan
- More complex deployment

#### Option C: Separate Microservice (Production-grade)
```typescript
// Standalone Node.js/Deno service
// Deployed to Railway/Fly.io
// Persistent connections
// WebSocket support
```

**Pros**:
- Full control
- WebSocket support
- Can handle high volume

**Cons**:
- Additional infrastructure
- More maintenance

**Recommendation**: Start with Option A (Vercel Cron), migrate to Option B if we hit limits.

---

## 🧪 Testing Strategy

### Database Tests
```typescript
// Test RLS policies
describe('Telemetry RLS', () => {
  it('prevents cross-org data access', async () => {
    // Create 2 orgs
    // Try to read org B data from org A user
    // Should return empty
  })
  
  it('allows service role to insert', async () => {
    // Use service role client
    // Insert reading
    // Should succeed
  })
  
  it('prevents user inserts', async () => {
    // Use regular user client
    // Try to insert
    // Should fail with RLS error
  })
})
```

### Integration Tests
```typescript
// Test TagoIO → Trazo flow
describe('TagoIO Integration', () => {
  it('transforms TagoIO data correctly', () => {
    const tagoData = mockTagoIOReading()
    const result = transformTagoIOReading(tagoData, mapping)
    
    expect(result.temperature_c).toBe(23.5)
    expect(result.data_source).toBe('tagoio')
    expect(result.raw_data).toEqual(tagoData)
  })
  
  it('handles missing variables gracefully', () => {
    const incompleteData = { variables: [] }
    const result = transformTagoIOReading(incompleteData, mapping)
    
    expect(result.temperature_c).toBeNull()
    expect(result.humidity_pct).toBeNull()
  })
})
```

### Component Tests
```typescript
// Test real-time updates
describe('useTelemetry Hook', () => {
  it('subscribes to pod telemetry', async () => {
    const { result } = renderHook(() => useTelemetry('pod-id'))
    
    // Wait for subscription
    await waitFor(() => expect(result.current.reading).toBeTruthy())
    
    // Simulate new reading
    await insertTelemetryReading({ pod_id: 'pod-id', ... })
    
    // Hook should update
    await waitFor(() => 
      expect(result.current.reading?.timestamp).toBeTruthy()
    )
  })
})
```

---

## 📊 Data Migration Strategy

### Phase 1: Prototype Data (Week 1)
```typescript
// Use simulated data for UI development
data_source: 'simulated'
```

### Phase 2: TagoIO Test Devices (Week 2)
```typescript
// Connect 1-2 test pods
data_source: 'tagoio'
// Validate transformations
// Test alarm thresholds
```

### Phase 3: Production Rollout (Week 3)
```typescript
// Connect all pods gradually
// Monitor data quality
// Validate with operators
```

### Backfill Historical Data (Optional)
```typescript
// If TagoIO has historical data
async function backfillHistoricalData() {
  const devices = await getDeviceMappings()
  
  for (const device of devices) {
    const data = await tagoClient.getDeviceData(device.deviceId, {
      start: new Date('2025-01-01'),
      end: new Date()
    })
    
    const readings = data.map(d => transformTagoIOReading(d, device))
    await batchInsertReadings(readings)
  }
}
```

---

## 🚨 Critical Issues to Address

### 1. Pod-Device Mapping (BLOCKER)
**Problem**: `pods.tagoio_device_id` field is NULL for all pods

**Solution**: 
- Create admin UI: `/app/dashboard/admin/devices/page.tsx`
- Allow org_admin to map pods to TagoIO device IDs
- Validate device ID exists in TagoIO before saving
- Provide device discovery tool (list available TagoIO devices)

### 2. Alarm Policy Seeding
**Problem**: No default alarm policies exist

**Solution**:
```sql
-- Seed default policies
INSERT INTO alarm_policies (organization_id, name, alarm_type, severity, threshold_value, threshold_operator)
VALUES
  (org_id, 'High Temperature Warning', 'temperature_high', 'warning', 28, '>'),
  (org_id, 'Critical Temperature', 'temperature_high', 'critical', 32, '>'),
  (org_id, 'Low Temperature Warning', 'temperature_low', 'warning', 18, '<'),
  (org_id, 'High Humidity', 'humidity_high', 'warning', 75, '>'),
  (org_id, 'Low Humidity', 'humidity_low', 'warning', 40, '<');
```

### 3. Recipe Integration
**Problem**: `telemetry_readings.active_recipe_id` needs to be populated

**Solution**:
- Query `recipe_applications` table to find active recipe for pod
- Include in telemetry insert:
  ```typescript
  const activeRecipe = await getActiveRecipeForPod(podId)
  
  await createTelemetryReading({
    ...telemetryData,
    active_recipe_id: activeRecipe?.id || null
  })
  ```

---

## 🎯 Success Metrics

### Phase 1 (Week 1)
- [ ] Types created and passing typecheck
- [ ] 40+ query functions implemented
- [ ] RLS policies validated in tests
- [ ] Components migrated with mock data

### Phase 2 (Week 2)
- [ ] TagoIO client functional with test device
- [ ] Data transformer validated
- [ ] Real-time subscriptions working
- [ ] Alarm evaluation logic correct

### Phase 3 (Week 3)
- [ ] All pods connected to TagoIO
- [ ] 90%+ test coverage
- [ ] Alarm policies configured
- [ ] Operators trained
- [ ] Documentation complete

---

## 📚 Key Takeaways

### Database is Ready ✅
- Schema deployed to production
- RLS policies configured correctly
- Indexes optimized for time-series queries
- Multi-tenancy enforced

### Key Integration Points
1. **pods.tagoio_device_id** - Critical mapping field
2. **telemetry_readings.raw_data** - Debug/audit trail
3. **telemetry_readings.data_source** - Data origin tracking
4. **alarm_policies** - Configurable thresholds
5. **Supabase Realtime** - Live updates

### Architecture Recommendations
- **Polling Service**: Start with Vercel Cron
- **Realtime Updates**: Use Supabase Realtime subscriptions
- **Data Retention**: 90 days online, archive older
- **Testing**: Comprehensive test suite (>90% coverage)

### Risk Mitigation
- Validate TagoIO device IDs before connecting
- Seed default alarm policies during onboarding
- Monitor data quality with automated alerts
- Plan for data volume growth (partitioning strategy)

---

**Analysis Complete**: Ready to begin Phase 1 (Type Definitions)

**Next Action**: Review with team, obtain TagoIO credentials, begin implementation
