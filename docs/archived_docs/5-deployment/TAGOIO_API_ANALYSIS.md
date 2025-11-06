# TagoIO API Analysis

**Date**: October 29, 2025  
**Device Token**: ed51659f-6870-454f-8755-52815755c5bb  
**Device Name**: POD-006-NW [E01C]  
**Device ID**: 65c265fcaef5e1000f67898b

---

## API Endpoint Summary

### Base URL
```
https://api.tago.io
```

### Authentication
- Header: `Device-Token: <token>`
- Content-Type: `application/json`

---

## Device Information Endpoint

### GET /info
Returns device metadata and configuration.

**Response Structure**:
```json
{
  "status": true,
  "result": {
    "id": "65c265fcaef5e1000f67898b",
    "name": "POD-006-NW [E01C]",
    "active": true,
    "visible": true,
    "type": "immutable",
    "last_input": "2025-10-30T03:04:48.795Z",
    "created_at": "2024-02-06T17:01:48.291Z",
    "bucket": {
      "id": "65c265fcaef5e1000f67898b",
      "name": "POD-006-NW [E01C]"
    },
    "tags": [
      { "key": "customer", "value": "trazo" },
      { "key": "type", "value": "mib" },
      { "key": "area", "value": "nw_ll" }
    ]
  }
}
```

---

## Telemetry Data Endpoint

### GET /data
Returns telemetry readings as an array of data points.

### GET /data?qty=N
Limits result to last N readings.

**Response Structure**:
```json
{
  "status": true,
  "result": [
    {
      "id": "6902d0fd94138e000a244d00",
      "variable": "temp",
      "value": 76,
      "unit": "°F",
      "time": "2025-10-30T02:44:13.496Z",
      "device": "65c265fcaef5e1000f67898b",
      "group": "ffc442a000e83149df0d2096",
      "metadata": {
        "sim": false,
        "raw": 80,
        "status": "ku8MBSuccess",
        "failed": 0,
        "tempB": 0,
        "cooling": 0,
        "vpd": 0.620754361,
        "gcu_temp": 131,
        "w_temp": 52.68000031
      }
    }
  ]
}
```

---

## Available Variables (Sensor Data)

### Environmental Sensors (Core Data)

| Variable | Unit | Description | Metadata Fields |
|----------|------|-------------|-----------------|
| `temp` | °F | Temperature | `raw`, `tempB`, `cooling`, `vpd`, `gcu_temp`, `w_temp` |
| `hum` | % | Humidity | `raw`, `humB`, `dehum` |
| `co2` | ppm | CO2 Level | `raw`, `co2B`, `co2_valve`, `exfan`, `alarm` |

### Control/Actuator States

| Variable | Value | Description | Metadata Fields |
|----------|-------|-------------|-----------------|
| `light_state` | 0/1 | Lights on/off | `level`, `mode`, `schedule`, `temp` |
| `cooling_valve` | 0/1 | Cooling valve open/closed | `level`, `mode`, `schedule`, `temp` |
| `dehum` | 0/1 | Dehumidifier on/off | `level`, `mode`, `schedule`, `hum` |
| `co2_valve` | 0/1 | CO2 valve open/closed | `level`, `mode`, `schedule`, `co2` |
| `ex_fan` | 0/1 | Exhaust fan on/off | `level`, `mode`, `schedule`, `co2` |
| `siren` | 0/1 | Alarm siren state | `level`, `mode`, `schedule`, `co2` |

### System/Operational Data

| Variable | Description |
|----------|-------------|
| `op_code` | Operational status code (e.g., "001000000000000") |

---

## Data Mapping: TagoIO → Trazo Schema

### Environmental Readings

```typescript
// TagoIO structure
{
  "variable": "temp",
  "value": 76,
  "unit": "°F",
  "time": "2025-10-30T02:44:13.496Z",
  "metadata": {
    "vpd": 0.620754361
  }
}

// Maps to Trazo telemetry_readings table
{
  "temperature_c": fahrenheitToCelsius(76),  // 24.44°C
  "humidity_pct": 55,                        // from "hum" variable
  "co2_ppm": 610,                           // from "co2" variable
  "vpd_kpa": 0.620754361,                   // from metadata.vpd
  "light_level_umol": null,                 // Not provided by TagoIO
  "timestamp": "2025-10-30T02:44:13.496Z",
  "data_source": "tagoio",
  "raw_data": { /* full TagoIO response */ }
}
```

### Transformation Functions Needed

```typescript
/**
 * Convert Fahrenheit to Celsius
 */
function fahrenheitToCelsius(f: number): number {
  return (f - 32) * 5 / 9
}

/**
 * Group TagoIO data points by timestamp
 * (multiple variables come in separate records)
 */
function groupByTimestamp(dataPoints: TagoIODataPoint[]): Record<string, Record<string, TagoIODataPoint>> {
  const grouped: Record<string, Record<string, TagoIODataPoint>> = {}
  
  for (const point of dataPoints) {
    const key = point.time
    if (!grouped[key]) {
      grouped[key] = {}
    }
    grouped[key][point.variable] = point
  }
  
  return grouped
}

/**
 * Transform grouped TagoIO data to Trazo telemetry reading
 */
function transformToTelemetryReading(
  grouped: Record<string, TagoIODataPoint>,
  podId: string,
  timestamp: string
): InsertTelemetryReading {
  const temp = grouped['temp']
  const hum = grouped['hum']
  const co2 = grouped['co2']
  
  return {
    pod_id: podId,
    timestamp: timestamp,
    temperature_c: temp ? fahrenheitToCelsius(temp.value as number) : null,
    humidity_pct: hum ? hum.value as number : null,
    co2_ppm: co2 ? co2.value as number : null,
    vpd_kpa: temp?.metadata?.vpd as number || null,
    light_level_umol: null, // Not available from TagoIO
    data_source: 'tagoio',
    raw_data: grouped,
  }
}
```

---

## Data Flow Architecture

### Polling Strategy (Implemented)

```
┌──────────────────────────────────────────────────────────────┐
│                    Vercel Cron (60s)                          │
│                  /api/cron/telemetry-poll                     │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              Polling Service                                   │
│  - Get all active pods with tagoio_device_id                  │
│  - For each pod: fetch latest data from TagoIO                │
│  - Transform data to Trazo schema                             │
│  - Batch insert to telemetry_readings table                   │
└───────────────────────────┬──────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
  ┌───────────────┐  ┌─────────────┐  ┌──────────────┐
  │ TagoIO Client │  │ Transformer │  │  Database    │
  │  - GET /data  │  │  - Group by │  │ - Batch      │
  │  - Auth       │  │    timestamp│  │   Insert     │
  │  - Retry      │  │  - Convert  │  │ - Update     │
  └───────────────┘  └─────────────┘  └──────────────┘
```

### Error Handling Strategy

1. **Network Failures**: Retry with exponential backoff (3 attempts)
2. **Invalid Data**: Log error, skip record, continue processing
3. **Database Errors**: Log error, halt batch, report via monitoring
4. **Rate Limits**: Implement queue with delay between requests
5. **Missing Device Mapping**: Skip pod, log warning

---

## Implementation Checklist

### Phase 6.1: TagoIO Client (4 hours)
- [x] ✅ Test API endpoints and document structure
- [ ] Create `/lib/tagoio/client.ts`
  - `fetchDeviceInfo(token)` - GET /info
  - `fetchLatestData(token, qty?)` - GET /data?qty=N
  - `fetchDataInTimeRange(token, start, end)` - Filter by time
  - Error handling with retry logic
  - Type-safe responses

### Phase 6.2: Data Transformer (3 hours)
- [ ] Create `/lib/tagoio/transformer.ts`
  - `groupByTimestamp()` - Group variables
  - `fahrenheitToCelsius()` - Temperature conversion
  - `transformToTelemetryReading()` - Main transformer
  - `extractVPD()` - Extract from metadata
  - Validation functions

### Phase 6.3: Polling Service (5 hours)
- [ ] Create `/lib/tagoio/polling-service.ts`
  - `pollAllDevices()` - Main orchestrator
  - `pollSingleDevice(podId)` - Per-pod processing
  - Batch insert to database (500 records/batch)
  - Error aggregation and reporting
  - Duplicate detection (check existing timestamps)

### Phase 6.4: Cron Endpoint (2 hours)
- [ ] Create `/app/api/cron/telemetry-poll/route.ts`
  - Vercel Cron handler (60s interval)
  - Authentication check (cron secret)
  - Call polling service
  - Return status summary
  - Logging and monitoring

### Phase 6.5: Device Mapping (2 hours)
- [ ] Update `pods` table
  - Add `tagoio_device_id` column (if not exists)
  - Map POD-006-NW to existing pod
  - Create migration script
  - Seed with device token

### Phase 6.6: Testing (2 hours)
- [ ] Unit tests for transformer
- [ ] Integration test for TagoIO client
- [ ] End-to-end test: Poll → Transform → Insert → Display
- [ ] Verify dashboard shows real TagoIO data

---

## Known Limitations

1. **Light Level**: TagoIO doesn't provide PAR/PPFD data (light_level_umol will be NULL)
2. **Grouped Data**: Variables come as separate records with same timestamp - need grouping
3. **Polling Frequency**: 60s interval may miss rapid changes (TagoIO updates more frequently)
4. **Device Limits**: Currently testing with single device (POD-006-NW), need to scale
5. **Historical Data**: `/data` endpoint returns recent data - may need different strategy for backfill

---

## Sample Data for Testing

### Temperature Reading
```json
{
  "id": "6902d0fd94138e000a244d00",
  "variable": "temp",
  "value": 76,
  "unit": "°F",
  "time": "2025-10-30T02:44:13.496Z",
  "metadata": {
    "vpd": 0.620754361,
    "cooling": 0
  }
}
```

### Humidity Reading
```json
{
  "id": "6902d0fd94138e000a244d01",
  "variable": "hum",
  "value": 55,
  "unit": "%",
  "time": "2025-10-30T02:44:13.496Z",
  "metadata": {
    "dehum": 0
  }
}
```

### CO2 Reading
```json
{
  "id": "6902d0fd94138e000a244d02",
  "variable": "co2",
  "value": 610,
  "unit": "ppm",
  "time": "2025-10-30T02:44:13.497Z",
  "metadata": {
    "co2_valve": 1,
    "exfan": 0,
    "alarm": 0
  }
}
```

---

## Next Steps

1. ✅ **COMPLETE**: API structure documented
2. **NOW**: Implement TagoIO client library
3. **THEN**: Build data transformer
4. **THEN**: Create polling service
5. **THEN**: Set up Vercel Cron job
6. **FINALLY**: Test end-to-end data flow
