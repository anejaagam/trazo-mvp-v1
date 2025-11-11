# Telemetry Aggregation System - Implementation Summary

## Overview

This document summarizes the complete implementation of the telemetry aggregation system that fixes the partial variable polling issue and implements intelligent data retention.

**Implementation Date**: November 10, 2025  
**Database**: US Supabase (trazo-mvp-us)  
**Status**: ✅ Complete - Ready for Testing

---

## Problem Statement

### Original Issues
1. **Partial Variable Polling**: TagoIO API sometimes returns only subset of variables in single poll
2. **Pseudo-Duplicates**: Millisecond-apart timestamps with different variable sets
3. **Database Flooding**: High-frequency raw data stored indefinitely without cleanup
4. **No Historical Management**: No automated system for 24-hour and weekly data retention

### Example of the Problem
```
Poll 1 (12:00:00.000): { temperature: 22, humidity: 65 }
Poll 2 (12:00:00.100): { co2: 850, vpd: 1.2, light: 450 }
```
Both readings have same "timestamp" (within 1 second) but different variables, causing confusion and potential data loss.

---

## Solution Architecture

### Three-Tier Data Retention Strategy

```
┌──────────────────────────┐
│   Raw Telemetry Data     │ ← TagoIO polling every 60s
│   5-second intervals     │    merge_upsert handles partials
│   48-hour retention      │
└────────────┬─────────────┘
             │
             │ Hourly Cron (every hour at :05)
             ↓
┌──────────────────────────┐
│  Hourly Aggregates       │ ← Min/Max/Avg/Stddev stats
│   1-hour intervals       │    Data completeness tracking
│   30-day retention       │    Gap detection
└────────────┬─────────────┘
             │
             │ Daily Cron (once per day at 2:00 AM)
             ↓
┌──────────────────────────┐
│   Daily Aggregates       │ ← Day-level statistics
│   1-day intervals        │    Weekly/monthly views
│   1-year retention       │    Long-term trends
└──────────────────────────┘
```

---

## Database Changes

### 1. Enhanced `merge_upsert_telemetry_reading` Function

**File**: `/lib/supabase/migrations/20251107_add_merge_upsert_function.sql`

**Key Features**:
- COALESCE pattern preserves existing non-null values
- Calculates `variable_count` (0-8 core variables)
- Marks `is_partial` when variable_count < 8
- Unique constraint `(pod_id, timestamp)` prevents true duplicates

**Core Variables Tracked**:
1. temperature_c
2. humidity_pct
3. vpd_kpa
4. co2_ppm
5. light_intensity_par
6. water_temp_c
7. ph
8. ec_ms_cm

**Example Usage**:
```sql
SELECT merge_upsert_telemetry_reading('{
  "pod_id": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-11-10T12:00:00Z",
  "temperature_c": 22.5,
  "humidity_pct": 65.0
}'::jsonb);
```

### 2. Metadata Columns Added to `telemetry_readings`

**Migration**: `20251110_add_telemetry_aggregation.sql` (Part 1)

```sql
ALTER TABLE telemetry_readings ADD COLUMN IF NOT EXISTS
  aggregated_to_hourly boolean DEFAULT false;
ALTER TABLE telemetry_readings ADD COLUMN IF NOT EXISTS
  is_partial boolean DEFAULT false;
ALTER TABLE telemetry_readings ADD COLUMN IF NOT EXISTS
  variable_count integer DEFAULT 0;
```

**Purpose**:
- `aggregated_to_hourly`: Flag for cleanup (delete after 48h if true)
- `is_partial`: Identifies incomplete readings
- `variable_count`: Track how many variables were present

### 3. Hourly Aggregation Table

**Table**: `telemetry_readings_hourly`  
**Retention**: 30 days  
**Sample Interval**: 1 hour

**Schema Highlights**:
```sql
CREATE TABLE telemetry_readings_hourly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id uuid NOT NULL REFERENCES pods(id),
  recipe_id uuid REFERENCES recipes(id),
  hour_start timestamp with time zone NOT NULL,
  
  -- Statistics for each variable (min, max, avg, stddev)
  min_temperature_c real,
  max_temperature_c real,
  avg_temperature_c real,
  stddev_temperature_c real,
  
  -- (same for all 8 core variables)
  
  -- Data quality metrics
  sample_count integer NOT NULL,
  expected_samples integer NOT NULL,
  data_completeness_pct real,
  has_gaps boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(pod_id, hour_start)
);
```

**Indexes**:
```sql
CREATE INDEX idx_telemetry_hourly_pod_hour 
  ON telemetry_readings_hourly(pod_id, hour_start DESC);
CREATE INDEX idx_telemetry_hourly_time 
  ON telemetry_readings_hourly(hour_start DESC);
```

### 4. Daily Aggregation Table

**Table**: `telemetry_readings_daily`  
**Retention**: 1 year  
**Sample Interval**: 1 day

**Schema**: Similar to hourly, but aggregates entire day
```sql
CREATE TABLE telemetry_readings_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id uuid NOT NULL REFERENCES pods(id),
  day_start timestamp with time zone NOT NULL,
  -- (same stats columns as hourly)
  UNIQUE(pod_id, day_start)
);
```

### 5. Aggregation Functions

#### `aggregate_telemetry_to_hourly(pod_id, hour_start)`
Aggregates raw 5-second data into 1-hour statistics.

**Logic**:
```sql
-- Calculate expected samples (720 samples per hour at 5-second intervals)
-- Calculate min/max/avg/stddev for each variable
-- Track completeness: sample_count / expected_samples * 100
-- Detect gaps using timestamp intervals
-- Mark raw data as aggregated_to_hourly = true
```

**Usage**:
```sql
SELECT aggregate_telemetry_to_hourly(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  '2025-11-10 12:00:00'::timestamp
);
```

#### `aggregate_telemetry_to_daily(pod_id, day_start)`
Aggregates hourly data into 1-day statistics.

**Logic**:
```sql
-- Aggregate 24 hours of hourly data
-- Calculate min/max/avg across all hours
-- Track completeness based on 24 expected hourly samples
-- Preserve gap detection from hourly level
```

**Usage**:
```sql
SELECT aggregate_telemetry_to_daily(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  '2025-11-10 00:00:00'::timestamp
);
```

#### `cleanup_old_telemetry_raw(retention_hours)`
Deletes aggregated raw data older than retention period.

**Logic**:
```sql
DELETE FROM telemetry_readings
WHERE aggregated_to_hourly = true
  AND timestamp < NOW() - (retention_hours || ' hours')::interval;
```

**Default**: 48 hours retention

#### `detect_telemetry_gaps(pod_id, hours_back)`
Identifies missing data periods.

**Returns**:
```sql
TABLE (
  gap_start timestamp,
  gap_end timestamp,
  gap_minutes integer
)
```

**Usage**:
```sql
SELECT * FROM detect_telemetry_gaps(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  24  -- Look back 24 hours
);
```

---

## Application Layer

### 1. Aggregation Service

**File**: `/lib/monitoring/aggregation-service.ts`  
**Class**: `TelemetryAggregationService`

**Key Methods**:

#### `aggregateHourly(hoursToProcess = 2)`
```typescript
const service = new TelemetryAggregationService(supabase)
const result = await service.aggregateHourly(2)

// Returns:
{
  timestamp: "2025-11-10T12:05:00.000Z",
  hourlyAggregated: 2,
  podsProcessed: 5,
  errors: [],
  duration: 1234
}
```

#### `aggregateDaily(daysToProcess = 2)`
```typescript
const result = await service.aggregateDaily(2)

// Returns:
{
  timestamp: "2025-11-10T02:00:00.000Z",
  dailyAggregated: 2,
  podsProcessed: 5,
  errors: [],
  duration: 2345
}
```

#### `cleanupOldRawData(retentionHours = 48)`
```typescript
const deletedCount = await service.cleanupOldRawData(48)
// Returns number of rows deleted
```

#### `detectDataGaps(podId, hoursBack = 24)`
```typescript
const gaps = await service.detectDataGaps(podId, 24)

// Returns:
[
  {
    gap_start: "2025-11-10T10:00:00Z",
    gap_end: "2025-11-10T10:15:00Z",
    gap_minutes: 15
  }
]
```

#### `runFullAggregation()`
```typescript
const result = await service.runFullAggregation()

// Returns:
{
  hourly: { hourlyAggregated: 2, ... },
  daily: { dailyAggregated: 1, ... },
  cleanupDeleted: 500,
  totalDuration: 3456
}
```

**Exported Convenience Functions**:
```typescript
import { 
  runHourlyAggregation,
  runDailyAggregation,
  runFullAggregation
} from '@/lib/monitoring/aggregation-service'

// Used by Vercel cron jobs
await runHourlyAggregation(supabase)
await runDailyAggregation(supabase)
await runFullAggregation(supabase)
```

### 2. Vercel Cron Jobs

#### Hourly Aggregation Cron
**File**: `/app/api/cron/aggregate-hourly/route.ts`  
**Schedule**: `5 * * * *` (Every hour at :05 minutes)  
**Endpoint**: `/api/cron/aggregate-hourly`

```typescript
export async function GET(request: Request) {
  // Verify CRON_SECRET
  // Run hourly aggregation
  // Return results
}
```

#### Daily Aggregation Cron
**File**: `/app/api/cron/aggregate-daily/route.ts`  
**Schedule**: `0 2 * * *` (Daily at 2:00 AM UTC)  
**Endpoint**: `/api/cron/aggregate-daily`

#### Full Aggregation Cron
**File**: `/app/api/cron/aggregate-full/route.ts`  
**Schedule**: `0 3 * * 0` (Weekly, Sunday at 3:00 AM UTC)  
**Endpoint**: `/api/cron/aggregate-full`

**Vercel Configuration** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/aggregate-hourly",
      "schedule": "5 * * * *"
    },
    {
      "path": "/api/cron/aggregate-daily",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/aggregate-full",
      "schedule": "0 3 * * 0"
    }
  ]
}
```

---

## Configuration

### Environment Variables

**Required** (add to `.env.local` and Vercel):
```bash
# Cron job security
CRON_SECRET=your-secret-token-here

# Generate with: openssl rand -base64 32
```

**Supabase** (already configured):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

---

## Testing

### Manual SQL Testing

**File**: `/scripts/test-aggregation.sql`

**Steps**:
1. Open Supabase SQL Editor
2. Get a test pod ID: `SELECT id, name FROM pods LIMIT 1;`
3. Replace `YOUR_POD_ID` in test script
4. Run sections sequentially to:
   - Insert partial variable test data
   - Run aggregation functions
   - Verify results
   - Detect gaps
   - Test cleanup

### API Testing

Test cron endpoints locally:
```bash
# Set CRON_SECRET from .env.local
export CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)

# Test hourly aggregation
curl -X GET \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/aggregate-hourly

# Test daily aggregation
curl -X GET \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/aggregate-daily
```

---

## Monitoring & Validation

### Database Queries

**Check aggregation status**:
```sql
-- Hourly aggregates count
SELECT pod_id, COUNT(*) as hours, 
       MIN(hour_start) as earliest, 
       MAX(hour_start) as latest
FROM telemetry_readings_hourly
GROUP BY pod_id;

-- Daily aggregates count
SELECT pod_id, COUNT(*) as days,
       MIN(day_start) as earliest,
       MAX(day_start) as latest
FROM telemetry_readings_daily
GROUP BY pod_id;

-- Raw data cleanup status
SELECT COUNT(*) as raw_rows,
       COUNT(*) FILTER (WHERE aggregated_to_hourly = true) as aggregated,
       MIN(timestamp) as earliest,
       MAX(timestamp) as latest
FROM telemetry_readings;
```

**Check data completeness**:
```sql
SELECT 
  hour_start,
  sample_count,
  expected_samples,
  data_completeness_pct,
  has_gaps
FROM telemetry_readings_hourly
WHERE pod_id = 'your-pod-id'
ORDER BY hour_start DESC
LIMIT 10;
```

### Vercel Dashboard

1. Navigate to Vercel Dashboard → Project
2. Click "Deployments" → Select latest
3. Click "Functions" → Find cron endpoint
4. View execution logs and results

---

## File Inventory

### Database Migrations
- ✅ `/lib/supabase/migrations/20251107_add_merge_upsert_function.sql`
  - Enhanced with variable counting and partial flag
- ✅ `/lib/supabase/migrations/20251110_add_telemetry_aggregation.sql`
  - Hourly aggregation table + indexes
  - Daily aggregation table + indexes
  - Metadata columns (aggregated_to_hourly, is_partial, variable_count)
  - Aggregation functions (hourly, daily, cleanup, detect_gaps)

### Application Code
- ✅ `/lib/monitoring/aggregation-service.ts`
  - TelemetryAggregationService class (380+ lines)
  - Exported convenience functions for cron jobs
- ✅ `/app/api/cron/aggregate-hourly/route.ts`
  - Hourly cron endpoint with auth
- ✅ `/app/api/cron/aggregate-daily/route.ts`
  - Daily cron endpoint with auth
- ✅ `/app/api/cron/aggregate-full/route.ts`
  - Full aggregation endpoint with auth

### Configuration
- ✅ `/vercel.json`
  - Cron job schedules configured
- ✅ `/.env.example`
  - Added CRON_SECRET documentation

### Documentation
- ✅ `/app/api/cron/README.md`
  - Comprehensive cron job documentation
  - Setup instructions
  - Testing guide
  - Monitoring queries
- ✅ `/docs/roadmap/integration-deployment/telemetry-aggregation-implementation.md` (this file)
  - Complete implementation summary

### Testing
- ✅ `/scripts/test-aggregation.sql`
  - SQL-based test suite
  - Can be run in Supabase SQL Editor

---

## Deployment Checklist

### Pre-Deployment
- [x] Database migrations applied to US Supabase
- [x] Aggregation functions deployed
- [x] Tables created with proper indexes
- [ ] Test with sample pod data
- [ ] Verify merge_upsert handles partials correctly

### Vercel Deployment
- [ ] Add CRON_SECRET to Vercel environment variables
- [ ] Verify SUPABASE_SERVICE_ROLE_KEY is set
- [ ] Deploy to production
- [ ] Verify vercel.json cron configuration deployed
- [ ] Check Vercel Dashboard → Cron Jobs are scheduled

### Post-Deployment
- [ ] Monitor first hourly cron execution
- [ ] Check logs for errors
- [ ] Validate hourly_aggregates table populated
- [ ] Run manual aggregation test
- [ ] Verify data completeness tracking
- [ ] Test gap detection function

---

## Performance Considerations

### Database Performance
- **Indexes**: All time-range queries use `(pod_id, timestamp DESC)` indexes
- **Batch Processing**: Aggregation processes 2 hours/days at a time
- **Expected Load**:
  - Hourly cron: ~2 seconds per pod (5 pods = 10s total)
  - Daily cron: ~1 second per pod (runs once per day)
  - Cleanup: ~100ms (deletes already indexed)

### Vercel Function Limits
- **Timeout**: 60 seconds (hourly/daily), 120 seconds (full)
- **Memory**: Default (1024 MB) sufficient
- **Executions**: 
  - Hourly: 720/month (24/day × 30 days)
  - Daily: 30/month
  - Full: 4/month (weekly)

---

## Maintenance

### Regular Checks
1. **Weekly**: Review aggregation completeness
2. **Monthly**: Check raw data cleanup is working
3. **Quarterly**: Validate retention policies

### Database Maintenance
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'telemetry%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Vacuum to reclaim space after cleanup
VACUUM ANALYZE telemetry_readings;
VACUUM ANALYZE telemetry_readings_hourly;
VACUUM ANALYZE telemetry_readings_daily;
```

---

## Troubleshooting

### Issue: Cron not executing
**Solution**:
- Verify `vercel.json` deployed
- Check Vercel Dashboard → Settings → Cron Jobs
- Ensure project on Pro plan (Hobby has limits)

### Issue: Authorization errors
**Solution**:
- Verify CRON_SECRET matches in `.env.local` and Vercel
- Check auth header: `Bearer [token]`

### Issue: Aggregation errors
**Solution**:
- Check Supabase logs for function errors
- Verify SUPABASE_SERVICE_ROLE_KEY has admin access
- Test functions manually in SQL Editor

### Issue: Missing data in aggregates
**Solution**:
- Run `detect_telemetry_gaps()` to identify gaps
- Check `data_completeness_pct` in aggregates
- Verify TagoIO polling is running

---

## Next Steps

### Integration Phase (Phase 5)
1. **Update Historical Polling** (`/lib/tagoio/historical-polling.ts`)
   - Modify to write directly to aggregation tables for older data
   - Use 1-min intervals for 24h (hourly table)
   - Use 15-min intervals for 7d (daily table)

2. **Dashboard Integration**
   - Update monitoring charts to use aggregation tables
   - Add data completeness indicators
   - Show gap alerts

3. **Testing**
   - Run test-aggregation.sql with production pod
   - Validate partial variable merging
   - Monitor first week of automated aggregation

---

## Success Metrics

**System is working correctly when**:
- ✅ No duplicate timestamps in raw data (merge working)
- ✅ Partial readings have `is_partial = true` and `variable_count < 8`
- ✅ Hourly aggregates generated every hour automatically
- ✅ Daily aggregates generated every day automatically
- ✅ Raw data cleaned up after 48 hours
- ✅ Data completeness tracked and reported
- ✅ Gaps detected and logged
- ✅ Cron jobs execute without errors

---

## Conclusion

The telemetry aggregation system is now fully implemented and ready for testing. All database migrations have been applied, service layer created, and cron jobs configured. The system addresses all original issues:

1. ✅ **Partial Variables**: Handled by enhanced merge_upsert with COALESCE
2. ✅ **Duplicates**: Prevented by unique constraint (pod_id, timestamp)
3. ✅ **Database Flooding**: Mitigated by 48-hour raw data retention
4. ✅ **Historical Data**: Managed via 3-tier aggregation (raw → hourly → daily)
5. ✅ **Automation**: Vercel cron jobs for hands-off operation
6. ✅ **Data Quality**: Completeness tracking and gap detection

**Status**: Ready for deployment and testing ✅
