# Alarm & Notification System - Feature Documentation

**Status:** ✅ Phase 14A Complete (Core Alarms Implementation)  
**Last Updated:** November 15, 2025  
**Phase:** 14A - Core Alarms Implementation

## Overview

The TRAZO Alarm & Notification System provides real-time monitoring of environmental conditions, equipment status, inventory levels, and compliance events across cultivation facilities. The system intelligently triggers alarms based on configurable thresholds, routes notifications through RBAC roles, and prevents alarm fatigue through debouncing, auto-resolution, and escalation management.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    ALARM SYSTEM FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. DATA SOURCES                                            │
│     ├─ TagoIO Telemetry (every 1 min)                      │
│     ├─ Inventory Updates                                    │
│     ├─ Batch Events                                         │
│     └─ Compliance Checks                                    │
│                                                              │
│  2. EVALUATION ENGINE                                        │
│     ├─ Threshold Checking                                   │
│     ├─ Time-in-State Debouncing (5 min default)            │
│     ├─ Suppression Period Check                             │
│     └─ Auto-Resolution Logic (15 min normal state)          │
│                                                              │
│  3. ALARM STORAGE                                            │
│     ├─ alarms table (active/acknowledged/resolved)          │
│     ├─ alarm_policies table (threshold configurations)      │
│     └─ inventory_alerts table (stock/expiration)            │
│                                                              │
│  4. NOTIFICATION ROUTING                                     │
│     ├─ alarm_routes table (role-based routing)              │
│     ├─ notifications table (delivery tracking)              │
│     └─ Escalation Ladder (multi-level)                      │
│                                                              │
│  5. USER INTERFACE                                           │
│     ├─ Dashboard (summary statistics)                       │
│     ├─ Alarm Inbox (filterable list)                        │
│     ├─ Alarm Cards (acknowledge/resolve actions)            │
│     └─ Real-time Updates (Supabase subscriptions)           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### 1. `alarms` Table (Active Alarms)
```sql
CREATE TABLE alarms (
  id UUID PRIMARY KEY,
  pod_id UUID NOT NULL REFERENCES pods(id),
  policy_id UUID REFERENCES alarm_policies(id),
  
  -- Alarm details
  alarm_type TEXT NOT NULL,
  severity TEXT CHECK ('critical', 'warning', 'info'),
  message TEXT NOT NULL,
  threshold_value DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  duration_seconds INTEGER,
  
  -- Context
  recipe_id UUID REFERENCES recipes(id),
  telemetry_reading_id UUID REFERENCES telemetry_readings(id),
  
  -- Lifecycle
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  
  -- Escalation
  escalated_at TIMESTAMPTZ,
  escalated_to_level INTEGER DEFAULT 1,
  
  -- Notes
  ack_note TEXT,
  resolution_note TEXT,
  root_cause TEXT
);
```

#### 2. `alarm_policies` Table (Threshold Configuration)
```sql
CREATE TABLE alarm_policies (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  alarm_type TEXT CHECK (...13 types...),
  severity TEXT CHECK ('critical', 'warning', 'info'),
  
  -- Threshold
  threshold_value DECIMAL(10,2),
  threshold_operator TEXT CHECK ('>', '<', '>=', '<=', '=', '!='),
  
  -- Debouncing
  time_in_state_seconds INTEGER DEFAULT 300, -- 5 min
  suppression_duration_minutes INTEGER DEFAULT 0,
  
  -- Filtering
  applies_to_stage TEXT[], -- Batch stages
  applies_to_pod_types TEXT[], -- Pod models
  
  is_active BOOLEAN DEFAULT TRUE
);
```

#### 3. `inventory_alerts` Table (Inventory-Specific)
```sql
CREATE TABLE inventory_alerts (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES inventory_items(id),
  alert_type TEXT CHECK ('low_stock', 'expiring', 'expired', 'out_of_stock'),
  threshold_value DECIMAL(10,2),
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ
);
```

**Automatic Trigger:** `trigger_check_inventory_alerts` fires on INSERT/UPDATE to `inventory_items`.

### Alarm Types

| Type | Description | Severity | Time-in-State |
|------|-------------|----------|---------------|
| `temperature_high` | Temperature exceeds max threshold | critical | 5 min |
| `temperature_low` | Temperature below min threshold | critical | 5 min |
| `humidity_high` | Humidity exceeds max threshold | warning | 10 min |
| `humidity_low` | Humidity below min threshold | warning | 10 min |
| `co2_high` | CO₂ exceeds max threshold | warning | 5 min |
| `co2_low` | CO₂ below min threshold | info | 15 min |
| `vpd_out_of_range` | VPD outside optimal range | warning | 10 min |
| `device_offline` | No telemetry for 5+ minutes | critical | immediate |
| `sensor_fault` | Sensor malfunction detected | critical | immediate |
| `power_failure` | Power interruption | critical | immediate |
| `water_leak` | Water leak detected | critical | immediate |
| `security_breach` | Security system alert | critical | immediate |
| `door_open` | Door left open | warning | immediate |

### Alarm Fatigue Prevention

The system implements multiple strategies to prevent alarm fatigue:

#### 1. **Time-in-State Debouncing**
Alarms only trigger if the condition persists for a minimum duration (default: 5 minutes).

```typescript
// Example: Temperature must be high for 5 consecutive minutes
time_in_state_seconds: 300
```

**Implementation:** `hasPersistedLongEnough()` in `/lib/monitoring/alarm-evaluator.ts` checks historical telemetry readings.

#### 2. **Suppression Duration**
After an alarm triggers, subsequent alarms of the same type are suppressed for N minutes.

```typescript
// Example: After first high temp alarm, suppress duplicates for 10 minutes
suppression_duration_minutes: 10
```

**Implementation:** `isInSuppressionPeriod()` checks recent alarm history before creating new alarm.

#### 3. **Auto-Resolution**
Acknowledged alarms are automatically resolved when conditions return to normal for 15 minutes.

```typescript
// After acknowledgment, if readings normal for 15 min → auto-resolve
autoResolutionMinutes: 15
```

**Implementation:** `checkAutoResolution()` runs with each evaluation cycle.

#### 4. **Duplicate Detection**
System checks for existing active alarms before creating new ones.

```typescript
// Only create alarm if no active alarm exists for this pod + type
const existingAlarms = await checkExistingAlarms(podId, alarmType);
if (existingAlarms.length > 0) return; // Skip duplicate
```

## Implementation Guide

### Phase 14A: Core Alarms (✅ COMPLETE)

#### 1. Alarm Evaluation Engine

**File:** `/lib/monitoring/alarm-evaluator.ts` (592 lines)

**Key Functions:**
```typescript
// Evaluate single telemetry reading against policies
evaluateTelemetryReading(reading: TelemetryReading): Promise<EvaluationResult>

// Batch-evaluate all pods (used by cron)
evaluateAllPods(lookbackMinutes: number): Promise<{
  podsEvaluated: number;
  alarmsCreated: number;
  alarmsResolved: number;
  errors: string[];
}>
```

**Features:**
- Threshold checking with 6 operators: `>`, `<`, `>=`, `<=`, `=`, `!=`
- Time-in-state debouncing (prevents flapping)
- Suppression period enforcement
- Auto-resolution for normalized conditions
- Context-aware alarm messages

#### 2. Server Actions

**File:** `/app/actions/alarms.ts` (400+ lines)

**Available Actions:**
```typescript
// Lifecycle actions
acknowledgeAlarm(alarmId, note?): Promise<AlarmActionResult>
resolveAlarm(alarmId, resolutionNote?, rootCause?): Promise<AlarmActionResult>
batchAcknowledgeAlarms(alarmIds, note?): Promise<{...}>

// Policy management (requires 'alarm:configure')
createAlarmPolicy(policy): Promise<PolicyActionResult>
updateAlarmPolicy(policyId, updates): Promise<PolicyActionResult>
deleteAlarmPolicy(policyId): Promise<{...}>
toggleAlarmPolicy(policyId, isActive): Promise<PolicyActionResult>
```

**RBAC Integration:**
- All actions check `auth.getUser()` before proceeding
- Future: Add explicit permission checks via `canPerformAction()`

#### 3. Cron Integration

**File:** `/app/api/cron/telemetry-poll/route.ts`

**Schedule:** Every 1 minute (Vercel Cron)

**Workflow:**
1. Poll TagoIO devices for telemetry
2. Insert readings into `telemetry_readings` table
3. Call `evaluateAllPods(2)` for pods with new data
4. Log results: `{alarmsCreated, alarmsResolved}`

**Example Log Output:**
```
✓ Polling complete: 12/12 successful, 48 readings inserted in 3421ms
Evaluating alarms for updated pods...
Alarm evaluation: 2 created, 1 resolved
```

#### 4. UI Components

**Created Components:**
- `/components/features/alarms/alarm-card.tsx` (220 lines)
  - Individual alarm display
  - Acknowledge/resolve actions
  - Lifecycle timestamps, notes, root cause
  - Severity badges, status indicators
  
- `/components/features/alarms/alarms-dashboard-client.tsx` (310 lines)
  - Summary statistics (active, critical, warning, info)
  - Real-time updates via Supabase subscriptions
  - Filters: severity, status
  - Bulk actions, refresh

**Page:**
- `/app/dashboard/alarms/page.tsx`
  - RBAC check: requires `alarm:view` permission
  - Server-side auth guard
  - Fetches user role and site for filtering

#### 5. Database Queries

**Existing (from Phase 2):**
- `/lib/supabase/queries/alarms.ts` (998 lines) - Server queries
- `/lib/supabase/queries/alarms-client.ts` - Client subscriptions
- `/lib/supabase/queries/inventory-alerts.ts` (252 lines) - Inventory alerts

**Key Queries:**
```typescript
// Server-side
getAlarms(filters?: AlarmFilters): Promise<QueryResult<AlarmWithDetails[]>>
getActiveAlarms(podId: string): Promise<QueryResult<Alarm[]>>
createAlarm(alarm: InsertAlarm): Promise<QueryResult<Alarm>>

// Client-side (real-time)
subscribeToAlarms(podId, onInsert, onUpdate): RealtimeChannel
```

### Phase 14B: Escalation & Routing (⏳ NOT STARTED)

**Planned Features:**
- Notification routing service (`/lib/notifications/router.ts`)
- Escalation processor cron job
- Email integration (SendGrid/AWS SES)
- Configuration UI for alarm policies

**Tables Ready:**
- `alarm_routes` - Role-based notification routing
- `notifications` - Delivery tracking

### Phase 14C: Compliance Alarms (⏳ NOT STARTED)

**Planned Integration Points:**
- Metrc sync error handler → `metrc_sync_error` alarms
- Task deadline monitor → `compliance_task_due` alarms
- Harvest deadline (Oregon 45-day) → `harvest_deadline` alarms
- Lab test results → `test_failure` alarms

### Phase 14D: Advanced Features (⏳ NOT STARTED)

**Planned Enhancements:**
- Push notifications (Firebase/OneSignal)
- Smart alarm grouping (related alarms → single notification)
- User notification preferences (quiet hours, channels)
- Alarm analytics & trend analysis

## Usage Examples

### 1. Create Alarm Policy (Temperature)

```typescript
import { createAlarmPolicy } from '@/app/actions/alarms';

const policy = await createAlarmPolicy({
  organization_id: 'org-uuid',
  name: 'High Temperature Alert - Flowering Stage',
  alarm_type: 'temperature_high',
  severity: 'critical',
  threshold_value: 28.0, // 28°C
  threshold_operator: '>',
  time_in_state_seconds: 300, // 5 minutes
  applies_to_stage: ['flowering'], // Only flowering batches
  suppression_duration_minutes: 15,
  is_active: true,
});
```

### 2. Acknowledge Alarm

```typescript
import { acknowledgeAlarm } from '@/app/actions/alarms';

const result = await acknowledgeAlarm(
  'alarm-uuid',
  'Acknowledged - HVAC technician dispatched'
);

if (result.success) {
  console.log('Alarm acknowledged by:', result.data.acknowledged_by);
}
```

### 3. Resolve Alarm with Root Cause

```typescript
import { resolveAlarm } from '@/app/actions/alarms';

const result = await resolveAlarm(
  'alarm-uuid',
  'Replaced faulty temperature sensor',
  'Sensor calibration drift after 6 months of operation'
);
```

### 4. Use Alarm Hook (Client Component)

```typescript
'use client';
import { useAlarms } from '@/hooks/use-alarms';

function MyComponent() {
  const { 
    alarms, 
    activeCount, 
    loading, 
    refresh 
  } = useAlarms({
    siteId: 'site-uuid',
    severity: 'critical',
    realtime: true, // Enable real-time updates
  });
  
  return (
    <div>
      <h2>Active Critical Alarms: {activeCount}</h2>
      {alarms.map(alarm => (
        <AlarmCard key={alarm.id} alarm={alarm} />
      ))}
    </div>
  );
}
```

## RBAC Permissions

| Permission | Description | Roles with Access |
|------------|-------------|-------------------|
| `alarm:view` | View alarms | org_admin, site_manager, head_grower, operator, compliance_qa, executive_viewer, installer_tech, support |
| `alarm:ack` | Acknowledge alarms | org_admin, site_manager, head_grower, operator, installer_tech, support |
| `alarm:resolve` | Resolve alarms | org_admin, site_manager, head_grower, operator, installer_tech, support |
| `alarm:configure` | Configure thresholds | org_admin, site_manager, head_grower, installer_tech, support |
| `alarm:policy_edit` | Edit/delete policies | org_admin, site_manager, head_grower, support |

**Read-Only Roles:**
- `compliance_qa` - View alarms for compliance tracking
- `executive_viewer` - Dashboard visibility only

## Testing

### Unit Tests (⏳ TODO)

**Files to Create:**
- `/lib/monitoring/__tests__/alarm-evaluator.test.ts`
  - Test threshold checking (6 operators)
  - Test time-in-state debouncing
  - Test suppression period logic
  - Test auto-resolution

- `/app/actions/__tests__/alarms.test.ts`
  - Test acknowledge/resolve with RBAC
  - Test batch operations
  - Test error handling

### Integration Tests (⏳ TODO)

- E2E test: Telemetry → Alarm → Notification
- Real-time subscription test
- Alarm fatigue prevention test

## Monitoring & Metrics

### Cron Job Logs

```typescript
// /api/cron/telemetry-poll response
{
  success: true,
  summary: {
    podsPolled: 12,
    readingsInserted: 48,
    alarmsCreated: 2,
    alarmsResolved: 1
  }
}
```

### Database Queries

```sql
-- Active alarms by severity
SELECT severity, COUNT(*) 
FROM alarms 
WHERE resolved_at IS NULL 
GROUP BY severity;

-- Top alarm sources
SELECT pod_id, COUNT(*) as alarm_count
FROM alarms
WHERE triggered_at > NOW() - INTERVAL '24 hours'
GROUP BY pod_id
ORDER BY alarm_count DESC
LIMIT 10;

-- Average time to acknowledge
SELECT AVG(EXTRACT(EPOCH FROM (acknowledged_at - triggered_at))) / 60 as avg_minutes
FROM alarms
WHERE acknowledged_at IS NOT NULL;
```

## Troubleshooting

### Issue: Alarms Not Creating

**Checklist:**
1. Check alarm policies exist and `is_active = true`
2. Verify telemetry data is flowing (check `telemetry_readings`)
3. Check cron job logs for evaluation errors
4. Confirm threshold operator matches alarm type

```sql
-- Check active policies
SELECT * FROM alarm_policies WHERE is_active = true;

-- Check recent telemetry
SELECT * FROM telemetry_readings 
WHERE timestamp > NOW() - INTERVAL '5 minutes'
ORDER BY timestamp DESC;
```

### Issue: Too Many Duplicate Alarms

**Solutions:**
1. Increase `time_in_state_seconds` (e.g., 300 → 600)
2. Add `suppression_duration_minutes` (e.g., 15-30 min)
3. Check for policy duplicates (multiple policies with same type)

```sql
-- Find duplicate policies
SELECT alarm_type, COUNT(*) 
FROM alarm_policies 
WHERE is_active = true
GROUP BY alarm_type
HAVING COUNT(*) > 1;
```

### Issue: Auto-Resolution Not Working

**Debug Steps:**
1. Check if alarms are acknowledged (auto-resolution only for ack'd alarms)
2. Verify 15 minutes have passed since acknowledgment
3. Confirm telemetry readings show normal values

```typescript
// Manual trigger auto-resolution check
import { evaluateAllPods } from '@/lib/monitoring/alarm-evaluator';
const result = await evaluateAllPods(30); // 30 min lookback
console.log(`Resolved: ${result.alarmsResolved}`);
```

## Future Enhancements

### Short-Term (Phase 14B-C)
- [ ] Notification routing service
- [ ] Email/SMS integration
- [ ] Escalation processor cron
- [ ] Compliance alarm generators
- [ ] Alarm configuration UI

### Long-Term (Phase 14D+)
- [ ] Push notifications (mobile app)
- [ ] Machine learning for anomaly detection
- [ ] Predictive alarms (forecast issues before they occur)
- [ ] Alarm correlation analysis
- [ ] Custom alarm templates by crop type

## References

- **Database Schema:** `/lib/supabase/schema.sql` (lines 650-740)
- **TypeScript Types:** `/types/telemetry.ts` (lines 330-530)
- **Prototype:** `/Prototypes/AlarmsAndNotifSystemPrototype/`
- **RBAC Permissions:** `/lib/rbac/permissions.ts` (lines 275-310)

---

**Last Updated:** November 15, 2025  
**Next Phase:** 14B - Escalation & Routing  
**Maintainers:** TRAZO Development Team
