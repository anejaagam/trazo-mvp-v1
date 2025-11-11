-- ============================================================================
-- Test Aggregation System (SQL)
-- ============================================================================
-- This script tests the telemetry aggregation pipeline directly in SQL.
-- Run this in Supabase SQL Editor after deploying the aggregation migration.
--
-- Tests:
-- 1. Insert partial variable test data
-- 2. Run aggregation functions
-- 3. Verify results
-- ============================================================================

-- Step 1: Get a test pod ID
SELECT id, name FROM pods LIMIT 1;
-- Copy the pod ID and replace 'YOUR_POD_ID' below

-- Step 2: Insert test data with partial variables (simulating TagoIO)
DO $$
DECLARE
  v_pod_id uuid := 'YOUR_POD_ID'; -- Replace with actual pod ID
  v_timestamp timestamp;
  v_hour interval;
BEGIN
  -- Generate 24 hours of test data
  FOR h IN 0..23 LOOP
    v_hour := (h || ' hours')::interval;
    
    -- 12 readings per hour (5-minute intervals)
    FOR i IN 0..11 LOOP
      v_timestamp := NOW() - v_hour - (i || ' minutes')::interval * 5;
      
      -- First reading: temperature and humidity only (partial)
      PERFORM merge_upsert_telemetry_reading(jsonb_build_object(
        'pod_id', v_pod_id,
        'timestamp', v_timestamp,
        'temperature_c', 22 + random() * 3,
        'humidity_pct', 60 + random() * 10
      ));
      
      -- Second reading 100ms later: CO2, VPD, light (rest of variables)
      PERFORM merge_upsert_telemetry_reading(jsonb_build_object(
        'pod_id', v_pod_id,
        'timestamp', v_timestamp + interval '100 milliseconds',
        'vpd_kpa', 1.2 + random() * 0.3,
        'co2_ppm', 800 + random() * 200,
        'light_intensity_par', 400 + random() * 100,
        'water_temp_c', 20 + random() * 2,
        'ph', 6.0 + random() * 0.5,
        'ec_ms_cm', 1.5 + random() * 0.3
      ));
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Test data inserted successfully';
END $$;

-- Step 3: Check raw data
SELECT 
  COUNT(*) as total_readings,
  COUNT(*) FILTER (WHERE is_partial = true) as partial_readings,
  COUNT(*) FILTER (WHERE variable_count < 8) as incomplete_readings,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM telemetry_readings
WHERE pod_id = 'YOUR_POD_ID'; -- Replace with actual pod ID

-- Step 4: View sample raw readings
SELECT 
  timestamp,
  variable_count,
  is_partial,
  aggregated_to_hourly,
  temperature_c,
  humidity_pct,
  co2_ppm,
  vpd_kpa
FROM telemetry_readings
WHERE pod_id = 'YOUR_POD_ID' -- Replace with actual pod ID
ORDER BY timestamp DESC
LIMIT 10;

-- Step 5: Run hourly aggregation for last 24 hours
DO $$
DECLARE
  v_pod_id uuid := 'YOUR_POD_ID'; -- Replace with actual pod ID
  v_hour_start timestamp;
BEGIN
  FOR h IN 0..23 LOOP
    v_hour_start := date_trunc('hour', NOW() - (h || ' hours')::interval);
    
    PERFORM aggregate_telemetry_to_hourly(v_pod_id, v_hour_start);
    
    IF h % 6 = 0 THEN
      RAISE NOTICE 'Aggregated hour %', h;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Hourly aggregation complete';
END $$;

-- Step 6: Check hourly aggregates
SELECT 
  hour_start,
  sample_count,
  expected_samples,
  data_completeness_pct,
  has_gaps,
  ROUND(avg_temperature_c::numeric, 1) as avg_temp,
  ROUND(avg_humidity_pct::numeric, 1) as avg_humidity,
  ROUND(avg_co2_ppm::numeric, 0) as avg_co2,
  ROUND(avg_vpd_kpa::numeric, 2) as avg_vpd
FROM telemetry_readings_hourly
WHERE pod_id = 'YOUR_POD_ID' -- Replace with actual pod ID
ORDER BY hour_start DESC
LIMIT 10;

-- Step 7: Run daily aggregation
DO $$
DECLARE
  v_pod_id uuid := 'YOUR_POD_ID'; -- Replace with actual pod ID
  v_day_start timestamp;
BEGIN
  FOR d IN 0..1 LOOP
    v_day_start := date_trunc('day', NOW() - (d || ' days')::interval);
    
    PERFORM aggregate_telemetry_to_daily(v_pod_id, v_day_start);
    
    RAISE NOTICE 'Aggregated day %', d;
  END LOOP;
  
  RAISE NOTICE 'Daily aggregation complete';
END $$;

-- Step 8: Check daily aggregates
SELECT 
  day_start,
  sample_count,
  expected_samples,
  data_completeness_pct,
  has_gaps,
  ROUND(avg_temperature_c::numeric, 1) as avg_temp,
  ROUND(avg_humidity_pct::numeric, 1) as avg_humidity,
  ROUND(avg_co2_ppm::numeric, 0) as avg_co2,
  ROUND(avg_vpd_kpa::numeric, 2) as avg_vpd
FROM telemetry_readings_daily
WHERE pod_id = 'YOUR_POD_ID' -- Replace with actual pod ID
ORDER BY day_start DESC
LIMIT 5;

-- Step 9: Detect data gaps
SELECT * FROM detect_telemetry_gaps('YOUR_POD_ID', 24); -- Replace with actual pod ID

-- Step 10: Test cleanup (check what would be deleted)
SELECT 
  COUNT(*) as rows_to_cleanup,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM telemetry_readings
WHERE pod_id = 'YOUR_POD_ID' -- Replace with actual pod ID
  AND aggregated_to_hourly = true
  AND timestamp < NOW() - interval '48 hours';

-- Step 11: Verify aggregation summary
SELECT 
  'Raw Readings' as table_name,
  COUNT(*) as count,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM telemetry_readings
WHERE pod_id = 'YOUR_POD_ID' -- Replace with actual pod ID

UNION ALL

SELECT 
  'Hourly Aggregates',
  COUNT(*),
  MIN(hour_start),
  MAX(hour_start)
FROM telemetry_readings_hourly
WHERE pod_id = 'YOUR_POD_ID' -- Replace with actual pod ID

UNION ALL

SELECT 
  'Daily Aggregates',
  COUNT(*),
  MIN(day_start),
  MAX(day_start)
FROM telemetry_readings_daily
WHERE pod_id = 'YOUR_POD_ID'; -- Replace with actual pod ID

-- ============================================================================
-- Cleanup Test Data (optional - run after testing)
-- ============================================================================
-- DELETE FROM telemetry_readings WHERE pod_id = 'YOUR_POD_ID';
-- DELETE FROM telemetry_readings_hourly WHERE pod_id = 'YOUR_POD_ID';
-- DELETE FROM telemetry_readings_daily WHERE pod_id = 'YOUR_POD_ID';
