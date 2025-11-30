# Telemetry Aggregation Cron Jobs

This directory contains Vercel cron job endpoints for automated telemetry data aggregation.

## Overview

The system implements a three-tier data retention strategy:
- **Raw data**: 5-second intervals, 48-hour retention
- **Hourly aggregates**: 1-hour intervals, 30-day retention
- **Daily aggregates**: 1-day intervals, 1-year retention

## Cron Jobs

### 1. Hourly Aggregation (`aggregate-hourly/`)
- **Schedule**: Every hour at :05 minutes (`5 * * * *`)
- **Purpose**: Aggregate raw telemetry data into hourly statistics
- **Process**:
  - Aggregates last 2 hours of raw data
  - Calculates min/max/avg/stddev for all sensors
  - Tracks data completeness and gaps
  - Marks raw data as aggregated

### 2. Daily Aggregation (`aggregate-daily/`)
- **Schedule**: Daily at 2:00 AM UTC (`0 2 * * *`)
- **Purpose**: Aggregate hourly data into daily statistics
- **Process**:
  - Aggregates last 2 days of hourly data
  - Calculates day-level statistics
  - Provides weekly/monthly views

### 3. Full Aggregation (`aggregate-full/`)
- **Schedule**: Weekly on Sunday at 3:00 AM UTC (`0 3 * * 0`)
- **Purpose**: Run complete aggregation + cleanup
- **Process**:
  - Runs hourly aggregation
  - Runs daily aggregation
  - Cleans up old raw data (>48 hours)
  - Comprehensive process for weekly maintenance

### 4. Recipe Stage Advancement (`advance-recipes/`)
- **Schedule**: Hourly at :10 minutes (`10 * * * *`)
- **Purpose**: Increment recipe stage day counters and auto-advance completed stages
- **Process**:
  - Updates `recipe_activations.current_stage_day` based on `stage_started_at`
  - Calls `advance_recipe_stage` for activations whose duration has elapsed
  - Logs audit events for stage transitions and completions

## Setup

### 1. Environment Variables

Add to `.env.local`:
```bash
CRON_SECRET=your-secret-token-here
```

Generate secret:
```bash
openssl rand -base64 32
```

### 2. Vercel Configuration

Cron jobs are configured in `vercel.json`:
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
    },
    {
      "path": "/api/cron/advance-recipes",
      "schedule": "10 * * * *"
    }
  ]
}
```

### 3. Vercel Environment Variables

Set in Vercel Dashboard → Project → Settings → Environment Variables:
- `CRON_SECRET`: Same value as local
- `SUPABASE_URL`: Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (admin access)

## Testing Locally

Test cron endpoints using curl:

```bash
# Set your local CRON_SECRET
export CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)

# Test hourly aggregation
curl -X GET \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/aggregate-hourly

# Test daily aggregation
curl -X GET \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/aggregate-daily

# Test full aggregation
curl -X GET \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/aggregate-full

# Test recipe stage advancement
curl -X GET \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/advance-recipes
```

## Response Format

Success response:
```json
{
  "success": true,
  "timestamp": "2025-11-10T12:05:00.000Z",
  "hourlyAggregated": 2,
  "podsProcessed": 5,
  "duration": 1234,
  "errors": []
}
```

Recipe stage advancement success response:

```json
{
  "success": true,
  "timestamp": "2025-11-13T10:10:00.000Z",
  "processed": 4,
  "dayIncrements": 3,
  "stagesAdvanced": 1,
  "activationsCompleted": 0,
  "errors": []
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-11-10T12:05:00.000Z"
}
```

## Monitoring

### Vercel Dashboard
View cron execution logs:
1. Go to Vercel Dashboard → Project
2. Click "Deployments" → Select deployment
3. Click "Functions" → Find cron endpoint
4. View execution logs and results

### Database Queries

Check aggregation status:
```sql
-- Check hourly aggregations
SELECT 
  pod_id,
  COUNT(*) as hours_aggregated,
  MIN(hour_start) as earliest,
  MAX(hour_start) as latest
FROM telemetry_readings_hourly
GROUP BY pod_id;

-- Check daily aggregations
SELECT 
  pod_id,
  COUNT(*) as days_aggregated,
  MIN(day_start) as earliest,
  MAX(day_start) as latest
FROM telemetry_readings_daily
GROUP BY pod_id;

-- Check raw data cleanup
SELECT 
  COUNT(*) as raw_rows,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM telemetry_readings
WHERE aggregated_to_hourly = false;
```

## Troubleshooting

### Cron not executing
- Verify `vercel.json` is deployed
- Check Vercel Dashboard → Settings → Cron Jobs
- Ensure project is on Pro plan (Hobby has limits)

### Authorization errors
- Verify `CRON_SECRET` matches in `.env.local` and Vercel
- Check authorization header format: `Bearer [token]`

### Aggregation errors
- Check Supabase logs for function errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` has admin access
- Test database functions manually via Supabase SQL Editor

### Performance issues
- Reduce `hoursToProcess` or `daysToProcess` parameters
- Increase Vercel function timeout (maxDuration)
- Consider running aggregations less frequently

## Architecture

```
┌─────────────────┐
│  Raw Telemetry  │ ← TagoIO polling (every 60s)
│   5s intervals  │
│  48h retention  │
└────────┬────────┘
         │
         │ Hourly Cron (every hour)
         ↓
┌─────────────────┐
│Hourly Aggregates│ ← Min/Max/Avg/Stddev
│   1h intervals  │
│  30d retention  │
└────────┬────────┘
         │
         │ Daily Cron (once per day)
         ↓
┌─────────────────┐
│ Daily Aggregates│ ← Day-level statistics
│   1d intervals  │
│   1y retention  │
└─────────────────┘
```

## Related Files
- `/lib/monitoring/aggregation-service.ts` - Service implementation
- `/lib/supabase/migrations/20251110_add_telemetry_aggregation.sql` - Database schema
- `/vercel.json` - Cron configuration
