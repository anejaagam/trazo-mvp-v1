# TRAZO Data Retention Policy

## Overview
TRAZO implements a 7-day rolling data retention policy for telemetry readings to optimize storage costs while maintaining recent operational data.

## Retention Strategy

### Automatic Cleanup
- **Retention Period**: 7 days
- **Cleanup Schedule**: Daily at midnight UTC (00:00)
- **Implementation**: PostgreSQL pg_cron extension
- **Function**: `cleanup_old_telemetry_data()`

### What Gets Deleted
Any telemetry reading with a timestamp older than 7 days from the current date is automatically deleted.

Affected tables:
- `telemetry_readings` - All sensor and equipment status data

### What Gets Preserved
- Data within the last 7 days remains in Supabase
- All metadata (pods, rooms, sites, users) is retained indefinitely
- Historical data beyond 7 days can be fetched on-demand from TagoIO

## Custom Date Range Access

### On-Demand Historical Data
Users can access historical data beyond the 7-day retention period using the custom date range feature in the pod detail monitoring page.

**How it works:**
1. User selects "Custom" time range in the chart
2. Picks start and end dates from calendar picker
3. Clicks "Fetch Data" button
4. Data is retrieved directly from TagoIO API
5. **Important**: Custom range data is NOT stored in Supabase

**Limitations:**
- Requires TagoIO device token to be configured for the pod
- TagoIO API limits: Maximum 10,000 data points per query
- Data availability depends on TagoIO retention policy

### Time Range Options
- **Past Hour**: Last 60 minutes of data from Supabase
- **Past Day**: Last 24 hours of data from Supabase
- **Past Week**: Last 7 days of data from Supabase (full retention window)
- **Custom**: Any date range from TagoIO (on-demand fetch, not stored)

## Technical Implementation

### Database Function
```sql
CREATE OR REPLACE FUNCTION cleanup_old_telemetry_data()
RETURNS void AS $$
BEGIN
  DELETE FROM telemetry_readings
  WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
```

### Cron Job Configuration
```sql
SELECT cron.schedule(
  'cleanup-old-telemetry',
  '0 0 * * *',  -- Daily at midnight UTC
  'SELECT cleanup_old_telemetry_data();'
);
```

### Verification Queries
```sql
-- Check scheduled jobs
SELECT * FROM cron.job WHERE jobname = 'cleanup-old-telemetry';

-- Check data age distribution
SELECT 
  COUNT(*) as total_readings,
  MIN(timestamp) as oldest,
  MAX(timestamp) as newest,
  EXTRACT(day FROM (MAX(timestamp) - MIN(timestamp))) as days_span
FROM telemetry_readings;

-- Count old data (should be 0 after cleanup)
SELECT COUNT(*) FROM telemetry_readings
WHERE timestamp < NOW() - INTERVAL '7 days';
```

## Files Modified

### Core Implementation
1. **Database Schema** (`lib/supabase/schema.sql`)
   - Added `cleanup_old_telemetry_data()` function
   - Enabled pg_cron extension

2. **TagoIO Client** (`lib/tagoio/client.ts`)
   - Added `fetchCustomRangeData()` method for on-demand fetching

3. **Server Actions** (`app/actions/monitoring.ts`)
   - Added `getCustomRangeReadings()` for custom date ranges
   - Fetches from TagoIO, transforms, but does NOT store

4. **Environment Chart** (`components/features/monitoring/environment-chart.tsx`)
   - Time range selector: 1h / 24h / 7d / Custom
   - Date range picker for custom ranges
   - Conditional data source (Supabase vs TagoIO)

5. **Pod Detail Pages**
   - `app/dashboard/monitoring/[podId]/page.tsx` - Fetches device token
   - `components/features/monitoring/pod-detail-dashboard.tsx` - Passes token
   - `components/features/monitoring/pod-detail.tsx` - Provides to chart

## Testing

### Tested Scenarios
✅ Inserted test data with 8, 9, and 10 day old timestamps  
✅ Manually triggered cleanup function  
✅ Verified all old data deleted (3 records removed)  
✅ Confirmed cron job scheduled correctly (active=true, schedule="0 0 * * *")  
✅ TypeScript compilation clean (no type errors)  

### Test Data Cleanup Results
- Before cleanup: 3 old records (8-10 days old)
- After cleanup: 0 old records
- Remaining data: 69 readings, all within last 24 hours
- Date span: 0 days (all recent)

## Monitoring & Maintenance

### Check Cleanup Job Status
```sql
-- View cron job details
SELECT * FROM cron.job WHERE jobname = 'cleanup-old-telemetry';

-- View cleanup job execution history (if logging enabled)
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-old-telemetry')
ORDER BY start_time DESC LIMIT 10;
```

### Manual Cleanup Trigger
```sql
-- Run cleanup manually for testing or maintenance
SELECT cleanup_old_telemetry_data();
```

### Modify Retention Period
To change the 7-day retention period, update both the function and schedule:
```sql
-- Example: Change to 14 days
CREATE OR REPLACE FUNCTION cleanup_old_telemetry_data()
RETURNS void AS $$
BEGIN
  DELETE FROM telemetry_readings
  WHERE timestamp < NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql;
```

## Cost Optimization

### Storage Savings
- **Without retention**: Indefinite growth (~1 reading/minute = ~43,800 readings/month/pod)
- **With 7-day retention**: Fixed size (~10,080 readings/pod maximum)
- **Savings**: ~77% reduction in storage costs over 30 days

### Performance Benefits
- Faster queries due to smaller dataset
- Improved index performance
- Reduced backup size and time

## Compliance & Data Governance

### Regulatory Considerations
- 7-day retention meets typical operational requirements
- Historical compliance data available from TagoIO source
- Metadata (who, what, where) retained indefinitely

### Data Recovery
If historical data is needed:
1. Use custom date range feature in UI
2. Query TagoIO API directly (requires device token)
3. TagoIO retains data per their service agreement

## Future Enhancements

### Potential Improvements
- [ ] Configurable retention period per site/pod
- [ ] Archive to cold storage instead of delete
- [ ] Export feature for compliance reporting
- [ ] Alerting on cleanup job failures
- [ ] Dashboard for data age distribution

---

**Last Updated**: October 30, 2025  
**Version**: 1.0  
**Status**: Production Ready
