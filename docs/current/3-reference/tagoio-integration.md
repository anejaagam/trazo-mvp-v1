# TagoIO Integration Reference

**Navigation:** [← Back to Current Status](../index.md)

**Last Updated:** November 19, 2025  
**Status:** ✅ Active Integration

---

## Overview

TRAZO integrates with TagoIO for IoT device management, environmental monitoring, and automated growth stage control. This document covers the complete TagoIO architecture including telemetry polling, growth stage management, and Standard Operating Procedure (SOP) automation.

---

## Architecture Components

### 1. Device Structure

#### Pod Devices (Individual GCUs)
- **Type:** Immutable
- **Purpose:** Store real-time telemetry data from cultivation pods
- **Example:** POD-TRAZO [D4A4]
  - Device ID: `651f24b64dc46f0009c8920e`
  - Token: `f4d8a57d-ab92-439c-bc4f-acec1d2b0b5d`
  - Tags: `customer: trazo`, `type: mib`

**Available Variables (48 total):**

**Environmental Sensors:**
- `temp` (°F) - Temperature
- `humidity` (%) - Relative humidity
- `vpd` - Vapor Pressure Deficit
- `co2` (ppm) - CO2 concentration
- `light` (%) - Light intensity

**System Status:**
- `growth_stage` - Current growth stage (0-6)
- `device_health` - Device status
- `last_checkin` - Last communication timestamp

**Control Variables:**
- `temp_setpoint`, `humidity_setpoint`, `co2_setpoint`, `light_setpoint`
- `cooling`, `heating`, `humidify`, `dehumidify`
- `lights_on`, `lights_off` - Photoperiod schedule

**Calibration & Diagnostics:**
- `temp_offset`, `humidity_offset`, `co2_offset`
- `sensor_status`, `error_count`, `warning_flags`

#### Global Devices (Configuration Hubs)
- **Type:** Mutable
- **Purpose:** Centralized configuration storage for growth stages and SOPs
- **Example:** TRAZO_GLOBAL
  - Device ID: `691cd231e2cc9a000be451c0`
  - Created: November 18, 2025

**Stored Configuration:**
- `growth_stages` - Growth stage definitions (templates)
- `gs_sop` - SOP assignments (active policies)
- `power_group` - Equipment coordination
- `pod_list` - Registry of active pods

---

## Growth Stage System

### Architecture

The growth stage system uses a **two-tier architecture**:

1. **Growth Stages (Templates)** - Stored on GLOBAL device
   - Define environmental parameters for each cultivation stage
   - Reusable across multiple pods and grows
   - Include: temp ranges, RH ranges, VPD targets, light schedules

2. **SOP Assignments (Active Policies)** - Stored on GLOBAL device
   - Link growth stages to specific pods
   - Include scheduling (start date, duration, recurrence)
   - Control which pods receive which environmental settings

### Growth Stage Definitions

**Variable:** `growth_stages`  
**Location:** TRAZO_GLOBAL device  
**Format:** JSON object in metadata field

#### Current TRAZO Stages (7 stages)

```javascript
// 1. Seedling
{
  "variable": "growth_stages",
  "value": "seedling",
  "group": "seedling",
  "metadata": {
    "name": "Seedling",
    "description": "Initial growth stage for seedlings and clones",
    "temp_min": "72",
    "temp_max": "76",
    "rh_min": "65",
    "rh_max": "75",
    "vpd_min": "0.4",
    "vpd_max": "0.8",
    "light_min": "20",
    "light_max": "40",
    "lights_on": "06:00",
    "lights_off": "00:00"  // 18-hour photoperiod
  }
}

// 2. Vegetative
{
  "variable": "growth_stages",
  "value": "vegetative",
  "group": "vegetative",
  "metadata": {
    "name": "Vegetative",
    "description": "Active vegetative growth stage",
    "temp_min": "75",
    "temp_max": "80",
    "rh_min": "60",
    "rh_max": "70",
    "vpd_min": "0.8",
    "vpd_max": "1.2",
    "light_min": "50",
    "light_max": "75",
    "lights_on": "06:00",
    "lights_off": "00:00"  // 18-hour photoperiod
  }
}

// 3. Pre-Flower
{
  "variable": "growth_stages",
  "value": "pre_flower",
  "group": "pre_flower",
  "metadata": {
    "name": "Pre-Flower",
    "description": "Transition to flowering stage",
    "temp_min": "73",
    "temp_max": "78",
    "rh_min": "55",
    "rh_max": "65",
    "vpd_min": "0.9",
    "vpd_max": "1.3",
    "light_min": "60",
    "light_max": "85",
    "lights_on": "06:00",
    "lights_off": "18:00"  // 12-hour photoperiod
  }
}

// 4. Early Flower
{
  "variable": "growth_stages",
  "value": "early_flower",
  "group": "early_flower",
  "metadata": {
    "name": "Early Flower",
    "description": "Initial flowering and bud development",
    "temp_min": "70",
    "temp_max": "75",
    "rh_min": "50",
    "rh_max": "60",
    "vpd_min": "1.0",
    "vpd_max": "1.4",
    "light_min": "70",
    "light_max": "90",
    "lights_on": "06:00",
    "lights_off": "18:00"  // 12-hour photoperiod
  }
}

// 5. Mid Flower
{
  "variable": "growth_stages",
  "value": "mid_flower",
  "group": "mid_flower",
  "metadata": {
    "name": "Mid Flower",
    "description": "Peak flowering and bud bulking",
    "temp_min": "68",
    "temp_max": "73",
    "rh_min": "45",
    "rh_max": "55",
    "vpd_min": "1.2",
    "vpd_max": "1.6",
    "light_min": "75",
    "light_max": "95",
    "lights_on": "06:00",
    "lights_off": "18:00"  // 12-hour photoperiod
  }
}

// 6. Late Flower
{
  "variable": "growth_stages",
  "value": "late_flower",
  "group": "late_flower",
  "metadata": {
    "name": "Late Flower",
    "description": "Final flowering and ripening",
    "temp_min": "65",
    "temp_max": "70",
    "rh_min": "40",
    "rh_max": "50",
    "vpd_min": "1.4",
    "vpd_max": "1.8",
    "light_min": "70",
    "light_max": "90",
    "lights_on": "06:00",
    "lights_off": "18:00"  // 12-hour photoperiod
  }
}

// 7. Harvest Prep
{
  "variable": "growth_stages",
  "value": "harvest_prep",
  "group": "harvest_prep",
  "metadata": {
    "name": "Harvest Prep",
    "description": "Pre-harvest drying and conditioning",
    "temp_min": "62",
    "temp_max": "68",
    "rh_min": "35",
    "rh_max": "45",
    "vpd_min": "1.6",
    "vpd_max": "2.0",
    "light_min": "50",
    "light_max": "70",
    "lights_on": "06:00",
    "lights_off": "18:00"  // 12-hour photoperiod
  }
}
```

### SOP Assignment Structure

**Variable:** `gs_sop`  
**Location:** TRAZO_GLOBAL device  
**Purpose:** Assign growth stages to specific pods with scheduling

#### SOP Data Format

```javascript
{
  "variable": "gs_sop",
  "value": "trazo_veg_sop",           // SOP identifier
  "group": "trazo_veg_sop",           // Group identifier (same as value)
  "metadata": {
    // Pod Assignment
    "rooms": "POD-TRAZO [D4A4]",      // Comma-separated list of pod names
    
    // Status
    "status": "active",                // active, edit, paused, completed
    
    // Schedule Configuration
    "sm": "immediate",                 // Start mode: immediate, schedule
    "start": "2025-11-19T12:00",      // Start datetime (ISO format)
    "em": "duration",                  // End mode: duration, date
    "end": "30",                       // Duration in days or end date
    
    // Growth Stage Parameters (embedded from growth_stages definition)
    "pd_1": {
      "name": "Vegetative",
      "id": "vegetative",
      "temp_min": "75",
      "temp_max": "80",
      "rh_min": "60",
      "rh_max": "70",
      "vpd_min": "0.8",
      "vpd_max": "1.2",
      "light_min": "50",
      "light_max": "75",
      "lights_on": "06:00",
      "lights_off": "00:00"
    }
  }
}
```

#### Schedule Modes

**Start Modes (`sm`):**
- `immediate` - Start SOP immediately upon activation
- `schedule` - Start at specified date/time in `start` field

**End Modes (`em`):**
- `duration` - Run for specified number of days in `end` field
- `date` - Run until specific date in `end` field

**Status Values:**
- `active` - SOP is currently running
- `edit` - SOP is being edited (may still be active)
- `paused` - SOP is temporarily suspended
- `completed` - SOP has finished execution

### Reference Implementation (ARISE)

The ARISE customer uses the same architecture with their ARISE_GLOBAL device:

```javascript
// Example ARISE SOP Assignment
{
  "variable": "gs_sop",
  "value": "vegupdate",
  "group": "vegupdate",
  "metadata": {
    "rooms": "POD-033-NW [D4E0], POD-024-SW [DF98], POD-018-SW [4E78], POD-006-NW [E01C], POD-007-SW [D4A0]",
    "status": "edit",
    "sm": "schedule",
    "start": "2025-04-28T08:05",
    "em": "duration",
    "end": "365",
    "pd_1": {
      "name": "veg update",
      "id": "680f93884f9c59000a6f0283",
      "temp_min": "77",
      "temp_max": "79",
      "rh_min": "63",
      "rh_max": "68",
      "vpd_min": "0.9",
      "vpd_max": "1.0",
      "light_min": "50",
      "light_max": "70",
      "lights_on": "02:00",
      "lights_off": "22:00"
    }
  }
}
```

---

## Automation System

### Analysis Scripts (TagoIO Platform)

TagoIO uses serverless Analysis scripts to automate SOP execution and pod management.

#### TRAZO Analysis: `trazo_postHandler`

**ID:** `691cd460c0dc4f000a663c0b`  
**Created:** November 18, 2025  
**Runtime:** Node.js (legacy)  
**Status:** Active  
**Timeout:** 120 seconds

**Environment Variables:**
- `ACCOUNT_TOKEN`: `****`
- `GLOBAL_DEVICE_TOKEN`: `*****`
- `CUSTOMER`: `trazo`
- `TYPE`: `mib`

**Recent Activity:**
```
Nov 18, 2025 20:35:28 - "Rebuilt with 2 pods"
Nov 18, 2025 20:32:09 - "Rebuilt with 1 pods"
Nov 18, 2025 20:02:35 - "Rebuilt with 105 pods"
```

**Function:** Manages pod list synchronization between TRAZO_GLOBAL and individual pod devices.

#### ARISE Reference: `podList_handler`

**ID:** `***********`  
**Created:** March 29, 2024  
**Runtime:** Node.js (legacy)  
**Status:** Active  
**Versions:** 67 (actively maintained)

**Environment Variables:**
- `ACCOUNT_TOKEN`: `*******`
- `ARISE_GLOBAL_TOKEN_ID`: `********`
- `CUSTOMER`: `arise`
- `TYPE`: `mib`

**Console Output:**
```
Starting Analysis...
Updating pod_list from scope …
Analysis finished - Runtime: 1.5s | Billed: 2s
```

### Automation Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     TRAZO Growth Stage System                    │
└─────────────────────────────────────────────────────────────────┘

1. SOP Creation (Manual or API)
   │
   ├─> POST to TRAZO_GLOBAL device
   │   • Variable: "gs_sop"
   │   • Value: SOP identifier
   │   • Metadata: rooms, status, schedule, parameters
   │
   └─> Stored in TagoIO database

2. Analysis Trigger (trazo_postHandler)
   │
   ├─> Reads TRAZO_GLOBAL device
   │   • Fetch all active gs_sop records
   │   • Parse room assignments
   │   • Extract growth stage parameters
   │
   └─> Processes SOP assignments

3. Pod Update (Automated)
   │
   ├─> For each assigned pod:
   │   • Read current growth_stage value
   │   • Check SOP schedule (start/end)
   │   • Apply environmental setpoints
   │   └─> POST to pod device:
   │       - temp_setpoint
   │       - humidity_setpoint
   │       - co2_setpoint
   │       - light_setpoint
   │       - lights_on/lights_off
   │       - growth_stage (0-6)
   │
   └─> Update pod_list on TRAZO_GLOBAL

4. Pod Execution (Hardware)
   │
   ├─> GCU receives setpoints from TagoIO
   │   • Read device data every 60 seconds
   │   • Compare current vs setpoint
   │   • Activate HVAC/lighting controls
   │
   └─> Report telemetry back to TagoIO
       • Environmental readings every 1-5 minutes
       • Device status updates
       • Error/warning flags
```

### SOP Management Process

#### Creating an SOP

**Option 1: Direct API (Current Method)**
```bash
# Using TagoIO MCP or REST API
POST https://api.tago.io/data
Headers:
  Device-Token: 8eb8ee20-6ac6-4ba5-828e-9ab5689b47a9
  Content-Type: application/json

Body:
{
  "variable": "gs_sop",
  "value": "my_sop_name",
  "group": "my_sop_name",
  "metadata": {
    "rooms": "POD-001 [ABCD], POD-002 [EFGH]",
    "status": "active",
    "sm": "immediate",
    "start": "2025-11-20T00:00",
    "em": "duration",
    "end": "30",
    "pd_1": {
      "name": "Vegetative",
      "id": "vegetative",
      "temp_min": "75",
      "temp_max": "80",
      // ... other parameters
    }
  }
}
```

**Option 2: TRAZO Platform UI (Future Implementation)**
- Admin dashboard → Growth Stages
- Select growth stage template
- Assign to pods
- Configure schedule
- Activate SOP

#### Monitoring SOP Status

1. **Check TRAZO_GLOBAL device:**
   ```bash
   GET https://api.tago.io/data?variables=gs_sop
   ```

2. **Check individual pod:**
   ```bash
   GET https://api.tago.io/data?variables=growth_stage,temp_setpoint,humidity_setpoint
   ```

3. **Review analysis logs:**
   - TagoIO dashboard → Analyses → trazo_postHandler
   - Check console output for execution status

---

## TRAZO Platform Integration

### Current Implementation

#### Files Structure

```
lib/
├── tagoio/
│   ├── client.ts              (436 lines) - API client with retry logic
│   ├── transformer.ts         (496 lines) - Data transformation
│   ├── polling-service.ts     (374 lines) - Orchestration
│   └── config.ts              - TagoIO configuration
│
app/
├── api/
│   ├── cron/
│   │   └── telemetry-poll/
│   │       └── route.ts       (120 lines) - Vercel Cron endpoint
│   └── validate-tagoio/
│       └── route.ts           (67 lines) - Token validation
│
├── actions/
│   └── pod-device-tokens.ts   - Server actions for device management
│
components/
└── features/
    └── admin/
        └── pod-device-token-manager.tsx - UI for token management
```

#### TagoIO Client (`lib/tagoio/client.ts`)

**Key Features:**
- Device-Token authentication
- Exponential backoff retry (3 attempts)
- Error handling and logging
- Type-safe API methods

**Methods:**
```typescript
class TagoIOClient {
  // Fetch device metadata
  async fetchDeviceInfo(deviceToken: string): Promise<TagoIODevice>
  
  // Fetch telemetry data
  async fetchDeviceData(
    deviceToken: string,
    options?: { qty?: number, variables?: string[] }
  ): Promise<TagoIODataPoint[]>
  
  // Create data points
  async createDeviceData(
    deviceToken: string,
    data: TagoIODataPoint[]
  ): Promise<void>
}
```

#### Data Transformer (`lib/tagoio/transformer.ts`)

**Transformations:**
1. **Unit Conversion:** Fahrenheit → Celsius
2. **Schema Mapping:** TagoIO → TRAZO database schema
3. **Data Validation:** Type checking and range validation
4. **Deduplication:** Remove duplicate timestamps

**Variable Mapping:**
```typescript
const VARIABLE_MAPPING = {
  'temp': 'temperature',
  'humidity': 'humidity',
  'co2': 'co2',
  'light': 'light_intensity',
  'vpd': 'vpd'
}
```

#### Polling Service (`lib/tagoio/polling-service.ts`)

**Features:**
- Multi-device polling
- Batch insert (500 records/batch)
- Error recovery
- Status reporting

**Flow:**
```typescript
async function pollDevices() {
  // 1. Get active pods with device tokens
  const pods = await getPodsWithDeviceTokens()
  
  // 2. Poll each device
  for (const pod of pods) {
    const data = await tagoClient.fetchDeviceData(pod.device_token)
    const transformed = transformData(data)
    
    // 3. Batch insert to database
    await batchInsertReadings(transformed)
  }
}
```

### Database Integration

#### Pod Device Tokens

**Table:** `pod_device_tokens` (in integration_settings schema)

```sql
CREATE TABLE pod_device_tokens (
  id UUID PRIMARY KEY,
  pod_id UUID REFERENCES pods(id),
  device_token TEXT NOT NULL,
  device_id TEXT,
  device_name TEXT,
  active BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)
```

#### Telemetry Readings

**Table:** `telemetry_readings`

```sql
CREATE TABLE telemetry_readings (
  pod_id UUID REFERENCES pods(id),
  timestamp TIMESTAMP NOT NULL,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  co2 INTEGER,
  vpd DECIMAL(4,2),
  light_intensity DECIMAL(5,2),
  -- ... additional fields
  PRIMARY KEY (pod_id, timestamp)
)
```

### Future Enhancements

#### 1. Growth Stage UI Management

**Location:** `app/dashboard/admin/growth-stages/page.tsx`

**Features:**
- View all growth stage definitions
- Create/edit growth stage templates
- Visual parameter editor (sliders for temp, RH, VPD)
- Photoperiod scheduler

#### 2. SOP Assignment Interface

**Location:** `app/dashboard/admin/sop-assignments/page.tsx`

**Features:**
- Select growth stage template
- Multi-select pod assignment
- Visual schedule builder (calendar interface)
- Duration picker (days/weeks)
- Start time selector
- Status monitoring dashboard

#### 3. Real-time SOP Monitoring

**Location:** `app/dashboard/monitoring/sop-status/page.tsx`

**Features:**
- Active SOP list
- Pod assignment visualization
- Timeline view (start → current → end)
- Environmental compliance metrics
- Manual override controls

#### 4. Server Actions for SOP Management

**File:** `app/actions/growth-stages.ts`

```typescript
// Create new SOP assignment
export async function createSOPAssignment(params: {
  sopName: string
  growthStageId: string
  podIds: string[]
  startMode: 'immediate' | 'schedule'
  startDate?: string
  endMode: 'duration' | 'date'
  endValue: string
}): Promise<{ success: boolean, sopId?: string, error?: string }>

// Update existing SOP
export async function updateSOPAssignment(
  sopId: string,
  updates: Partial<SOPAssignment>
): Promise<{ success: boolean, error?: string }>

// Deactivate SOP
export async function deactivateSOPAssignment(
  sopId: string
): Promise<{ success: boolean, error?: string }>

// Get active SOPs for pod
export async function getActivePodSOPs(
  podId: string
): Promise<SOPAssignment[]>
```

---

## API Reference

### TagoIO REST API

**Base URL:** `https://api.tago.io`

#### Authentication

All requests require device token authentication:

```bash
curl -H "Device-Token: YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     https://api.tago.io/ENDPOINT
```

#### Endpoints

**1. Get Device Info**
```
GET /info
```

Response:
```json
{
  "status": true,
  "result": {
    "id": "device_id",
    "name": "Device Name",
    "type": "immutable",
    "active": true,
    "last_input": "2025-11-19T12:00:00Z",
    "tags": [...]
  }
}
```

**2. Get Device Data**
```
GET /data?qty=100&variables=temp,humidity
```

Parameters:
- `qty` (optional): Limit number of results
- `variables` (optional): Filter by variable names
- `start_date` (optional): ISO timestamp
- `end_date` (optional): ISO timestamp

**3. Create Device Data**
```
POST /data
```

Body:
```json
[
  {
    "variable": "temp_setpoint",
    "value": 75,
    "unit": "°F",
    "metadata": {
      "source": "sop_automation",
      "sop_id": "trazo_veg_sop"
    }
  }
]
```

**4. Update Device Data**
```
PUT /data
```

Body: Same as POST (TagoIO creates new data points)

### MCP Server Integration

TRAZO integrates with TagoIO via Model Context Protocol (MCP) server.

**Server:** `mcp__tago-io_mcp`

**Available Tools:**
- `device-operations` - CRUD for devices
- `device-data-operations` - CRUD for device data
- `analysis-lookup` - Query analysis scripts
- `action-operations` - Manage automation actions

**Example Usage:**
```typescript
// Fetch device data
const data = await mcp.invoke('device-data-operations', {
  deviceID: '691cd231e2cc9a000be451c0',
  operation: 'read',
  query: {
    variables: ['gs_sop'],
    qty: 10,
    ordination: 'descending'
  }
})

// Create SOP assignment
await mcp.invoke('device-data-operations', {
  deviceID: '691cd231e2cc9a000be451c0',
  operation: 'create',
  createData: [{
    variable: 'gs_sop',
    value: 'my_sop_name',
    group: 'my_sop_name',
    metadata: { /* SOP configuration */ }
  }]
})
```

---

## Testing & Validation

### Testing Checklist

- [x] Device token validation (POD-TRAZO)
- [x] Telemetry data retrieval (48 variables)
- [x] Growth stage definitions created (7 stages)
- [x] SOP assignment created (trazo_veg_sop)
- [x] TRAZO_GLOBAL device configured
- [x] trazo_postHandler analysis active
- [ ] End-to-end SOP execution test
- [ ] Pod receives setpoints from SOP
- [ ] Growth stage transition automation
- [ ] Multi-pod SOP assignment

### Known Issues

1. **Analysis Token Error:** `trazo_postHandler` has "Invalid Token" errors in console (needs TRAZO_GLOBAL token configuration update)

2. **SOP Execution:** SOPs created on TRAZO_GLOBAL but automation logic needs implementation/activation in `trazo_postHandler` analysis

3. **UI Management:** No UI currently exists for managing growth stages and SOPs (manual API/MCP operations only)

### Troubleshooting

**Issue: Pod not receiving setpoints from SOP**

1. Verify SOP exists on TRAZO_GLOBAL:
   ```bash
   curl -H "Device-Token: 8eb8ee20-6ac6-4ba5-828e-9ab5689b47a9" \
        https://api.tago.io/data?variables=gs_sop
   ```

2. Check SOP status is "active"

3. Verify pod name matches "rooms" field exactly

4. Check `trazo_postHandler` analysis logs for execution errors

**Issue: Growth stage not changing on pod**

1. Verify pod is polling TagoIO (check `last_input` timestamp)

2. Check pod device for `growth_stage` variable updates

3. Review analysis execution frequency (may need to trigger manually)

---

## Migration Notes

### From ARISE to TRAZO

TRAZO's growth stage system is modeled after ARISE's proven implementation:

**Similarities:**
- Two-tier architecture (templates + assignments)
- GLOBAL device for centralized configuration
- Analysis-based automation
- Pod-level execution

**Differences:**
- TRAZO uses 7 standard stages (vs ARISE's custom stages)
- More granular VPD control
- Standardized naming convention
- Built for multi-facility expansion

**Migration Path:**
1. ✅ Create TRAZO_GLOBAL device
2. ✅ Define 7 growth stages
3. ✅ Create initial SOP (vegetative)
4. ✅ Deploy `trazo_postHandler` analysis
5. ⏳ Implement SOP execution logic
6. ⏳ Build admin UI for management
7. ⏳ Test with live pods
8. ⏳ Scale to full facility

---

## Reference Links

- **TagoIO Documentation:** https://docs.tago.io
- **TagoIO API Reference:** https://api.tago.io/docs
- **TRAZO Monitoring Docs:** [feature-monitoring.md](../2-features/feature-monitoring.md)
- **TRAZO Alarms Docs:** [feature-alarms.md](../2-features/feature-alarms.md)

---

**Document Version:** 1.0  
**Author:** TRAZO Development Team  
**Review Date:** December 2025
