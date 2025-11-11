-- Migration: Enhanced Telemetry Data Management with Aggregation Tables
-- Purpose: Implement smart data retention and aggregation for monitoring/telemetry
-- Created: November 10, 2025
-- 
-- This migration creates:
-- 1. Aggregation tables for hourly and daily data
-- 2. Enhanced metadata tracking for data completeness
-- 3. Automatic cleanup and aggregation procedures
-- 4. Gap detection and data quality monitoring

-- ============================================================================
-- PART 1: Aggregation Tables
-- ============================================================================

-- Hourly aggregated telemetry data
-- Retention: 30 days
-- Aggregation interval: 1 hour
CREATE TABLE IF NOT EXISTS telemetry_readings_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  hour_start TIMESTAMPTZ NOT NULL, -- Start of the hour (truncated timestamp)
  
  -- Aggregated environmental readings
  temperature_c_avg DECIMAL(4,1),
  temperature_c_min DECIMAL(4,1),
  temperature_c_max DECIMAL(4,1),
  temperature_c_stddev DECIMAL(4,2),
  
  humidity_pct_avg DECIMAL(4,1),
  humidity_pct_min DECIMAL(4,1),
  humidity_pct_max DECIMAL(4,1),
  humidity_pct_stddev DECIMAL(4,2),
  
  co2_ppm_avg INTEGER,
  co2_ppm_min INTEGER,
  co2_ppm_max INTEGER,
  co2_ppm_stddev DECIMAL(6,2),
  
  vpd_kpa_avg DECIMAL(3,2),
  vpd_kpa_min DECIMAL(3,2),
  vpd_kpa_max DECIMAL(3,2),
  
  light_intensity_pct_avg INTEGER,
  light_intensity_pct_min INTEGER,
  light_intensity_pct_max INTEGER,
  
  -- Equipment runtime statistics (percentage of hour active)
  cooling_runtime_pct DECIMAL(5,2),
  heating_runtime_pct DECIMAL(5,2),
  dehumidifier_runtime_pct DECIMAL(5,2),
  humidifier_runtime_pct DECIMAL(5,2),
  co2_injection_runtime_pct DECIMAL(5,2),
  exhaust_fan_runtime_pct DECIMAL(5,2),
  circulation_fan_runtime_pct DECIMAL(5,2),
  lights_runtime_pct DECIMAL(5,2),
  
  -- Resource consumption totals
  power_consumption_wh DECIMAL(10,2), -- Total watt-hours for the hour
  water_usage_l DECIMAL(8,2),         -- Total liters for the hour
  
  -- Data quality metrics
  sample_count INTEGER NOT NULL DEFAULT 0,       -- Number of raw readings aggregated
  expected_samples INTEGER NOT NULL DEFAULT 12,  -- Expected samples (1 per 5 min = 12/hour)
  data_completeness_pct DECIMAL(5,2),           -- (sample_count / expected_samples) * 100
  has_gaps BOOLEAN DEFAULT FALSE,                -- True if missing expected samples
  
  -- Recipe tracking
  active_recipe_id UUID REFERENCES recipes(id),
  recipe_changes_count INTEGER DEFAULT 0,        -- Number of recipe changes in this hour
  
  -- Metadata
  aggregated_at TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'aggregated' CHECK (data_source IN ('aggregated', 'backfilled')),
  
  -- Unique constraint on pod + hour
  CONSTRAINT telemetry_readings_hourly_unique UNIQUE (pod_id, hour_start)
);

-- Daily aggregated telemetry data
-- Retention: 1 year
-- Aggregation interval: 1 day
CREATE TABLE IF NOT EXISTS telemetry_readings_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  day_start DATE NOT NULL, -- Start of the day
  
  -- Aggregated environmental readings (day averages)
  temperature_c_avg DECIMAL(4,1),
  temperature_c_min DECIMAL(4,1),
  temperature_c_max DECIMAL(4,1),
  temperature_c_stddev DECIMAL(4,2),
  
  humidity_pct_avg DECIMAL(4,1),
  humidity_pct_min DECIMAL(4,1),
  humidity_pct_max DECIMAL(4,1),
  humidity_pct_stddev DECIMAL(4,2),
  
  co2_ppm_avg INTEGER,
  co2_ppm_min INTEGER,
  co2_ppm_max INTEGER,
  co2_ppm_stddev DECIMAL(6,2),
  
  vpd_kpa_avg DECIMAL(3,2),
  vpd_kpa_min DECIMAL(3,2),
  vpd_kpa_max DECIMAL(3,2),
  
  light_intensity_pct_avg INTEGER,
  
  -- Equipment runtime statistics (percentage of day active)
  cooling_runtime_pct DECIMAL(5,2),
  heating_runtime_pct DECIMAL(5,2),
  dehumidifier_runtime_pct DECIMAL(5,2),
  humidifier_runtime_pct DECIMAL(5,2),
  lights_runtime_pct DECIMAL(5,2),
  
  -- Resource consumption totals for the day
  power_consumption_kwh DECIMAL(10,2),  -- Total kilowatt-hours
  water_usage_l DECIMAL(10,2),          -- Total liters
  
  -- Data quality metrics
  sample_count INTEGER NOT NULL DEFAULT 0,        -- Number of hourly aggregates used
  expected_samples INTEGER NOT NULL DEFAULT 24,   -- Expected hourly samples
  data_completeness_pct DECIMAL(5,2),
  has_gaps BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  aggregated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT telemetry_readings_daily_unique UNIQUE (pod_id, day_start)
);

-- ============================================================================
-- PART 2: Indexes for Performance
-- ============================================================================

-- Hourly table indexes
CREATE INDEX IF NOT EXISTS idx_telemetry_hourly_pod_time 
  ON telemetry_readings_hourly(pod_id, hour_start DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_hourly_time 
  ON telemetry_readings_hourly(hour_start DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_hourly_gaps 
  ON telemetry_readings_hourly(pod_id, hour_start) 
  WHERE has_gaps = TRUE;

-- Daily table indexes
CREATE INDEX IF NOT EXISTS idx_telemetry_daily_pod_day 
  ON telemetry_readings_daily(pod_id, day_start DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_daily_day 
  ON telemetry_readings_daily(day_start DESC);

-- ============================================================================
-- PART 3: Add metadata columns to raw telemetry_readings table
-- ============================================================================

-- Add columns to track data completeness and processing status
DO $$ 
BEGIN
  -- Add aggregated flag to prevent re-processing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'telemetry_readings' AND column_name = 'aggregated_to_hourly'
  ) THEN
    ALTER TABLE telemetry_readings ADD COLUMN aggregated_to_hourly BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add flag for partial data (when not all expected variables present)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'telemetry_readings' AND column_name = 'is_partial'
  ) THEN
    ALTER TABLE telemetry_readings ADD COLUMN is_partial BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add variable count for quality tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'telemetry_readings' AND column_name = 'variable_count'
  ) THEN
    ALTER TABLE telemetry_readings ADD COLUMN variable_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create index for aggregation queries
CREATE INDEX IF NOT EXISTS idx_telemetry_raw_for_aggregation 
  ON telemetry_readings(pod_id, timestamp, aggregated_to_hourly) 
  WHERE aggregated_to_hourly = FALSE;

-- ============================================================================
-- PART 4: Aggregation Functions
-- ============================================================================

-- Function to aggregate raw data into hourly statistics
CREATE OR REPLACE FUNCTION aggregate_telemetry_to_hourly(
  p_pod_id UUID,
  p_hour_start TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_sample_count INTEGER;
  v_inserted_count INTEGER := 0;
BEGIN
  -- Aggregate raw readings for the specified hour
  INSERT INTO telemetry_readings_hourly (
    pod_id, hour_start,
    temperature_c_avg, temperature_c_min, temperature_c_max, temperature_c_stddev,
    humidity_pct_avg, humidity_pct_min, humidity_pct_max, humidity_pct_stddev,
    co2_ppm_avg, co2_ppm_min, co2_ppm_max, co2_ppm_stddev,
    vpd_kpa_avg, vpd_kpa_min, vpd_kpa_max,
    light_intensity_pct_avg, light_intensity_pct_min, light_intensity_pct_max,
    cooling_runtime_pct, heating_runtime_pct, dehumidifier_runtime_pct,
    humidifier_runtime_pct, co2_injection_runtime_pct,
    exhaust_fan_runtime_pct, circulation_fan_runtime_pct, lights_runtime_pct,
    power_consumption_wh, water_usage_l,
    sample_count, expected_samples, data_completeness_pct, has_gaps,
    active_recipe_id, recipe_changes_count
  )
  SELECT
    p_pod_id,
    p_hour_start,
    -- Temperature statistics
    AVG(temperature_c), MIN(temperature_c), MAX(temperature_c), STDDEV(temperature_c),
    -- Humidity statistics
    AVG(humidity_pct), MIN(humidity_pct), MAX(humidity_pct), STDDEV(humidity_pct),
    -- CO2 statistics
    AVG(co2_ppm)::INTEGER, MIN(co2_ppm), MAX(co2_ppm), STDDEV(co2_ppm),
    -- VPD statistics
    AVG(vpd_kpa), MIN(vpd_kpa), MAX(vpd_kpa),
    -- Light statistics
    AVG(light_intensity_pct)::INTEGER, MIN(light_intensity_pct), MAX(light_intensity_pct),
    -- Equipment runtime percentages
    (COUNT(*) FILTER (WHERE cooling_active = TRUE)::DECIMAL / GREATEST(COUNT(*), 1)) * 100,
    (COUNT(*) FILTER (WHERE heating_active = TRUE)::DECIMAL / GREATEST(COUNT(*), 1)) * 100,
    (COUNT(*) FILTER (WHERE dehumidifier_active = TRUE)::DECIMAL / GREATEST(COUNT(*), 1)) * 100,
    (COUNT(*) FILTER (WHERE humidifier_active = TRUE)::DECIMAL / GREATEST(COUNT(*), 1)) * 100,
    (COUNT(*) FILTER (WHERE co2_injection_active = TRUE)::DECIMAL / GREATEST(COUNT(*), 1)) * 100,
    (COUNT(*) FILTER (WHERE exhaust_fan_active = TRUE)::DECIMAL / GREATEST(COUNT(*), 1)) * 100,
    (COUNT(*) FILTER (WHERE circulation_fan_active = TRUE)::DECIMAL / GREATEST(COUNT(*), 1)) * 100,
    (COUNT(*) FILTER (WHERE lights_on = TRUE)::DECIMAL / GREATEST(COUNT(*), 1)) * 100,
    -- Resource consumption totals
    SUM(power_consumption_w) / 60.0, -- Convert W to Wh (assuming readings every minute)
    SUM(water_usage_l),
    -- Data quality metrics
    COUNT(*)::INTEGER,
    12, -- Expected samples per hour (one every 5 minutes)
    (COUNT(*)::DECIMAL / 12 * 100),
    COUNT(*) < 10, -- Has gaps if less than 10 samples (allow some tolerance)
    -- Recipe tracking
    MODE() WITHIN GROUP (ORDER BY active_recipe_id),
    COUNT(DISTINCT active_recipe_id) - 1 -- Subtract 1 for the stable recipe
  FROM telemetry_readings
  WHERE pod_id = p_pod_id
    AND timestamp >= p_hour_start
    AND timestamp < p_hour_start + INTERVAL '1 hour'
  HAVING COUNT(*) > 0 -- Only create aggregate if we have data
  ON CONFLICT (pod_id, hour_start) DO UPDATE SET
    -- Update all fields with new aggregation
    temperature_c_avg = EXCLUDED.temperature_c_avg,
    temperature_c_min = EXCLUDED.temperature_c_min,
    temperature_c_max = EXCLUDED.temperature_c_max,
    temperature_c_stddev = EXCLUDED.temperature_c_stddev,
    humidity_pct_avg = EXCLUDED.humidity_pct_avg,
    humidity_pct_min = EXCLUDED.humidity_pct_min,
    humidity_pct_max = EXCLUDED.humidity_pct_max,
    humidity_pct_stddev = EXCLUDED.humidity_pct_stddev,
    co2_ppm_avg = EXCLUDED.co2_ppm_avg,
    co2_ppm_min = EXCLUDED.co2_ppm_min,
    co2_ppm_max = EXCLUDED.co2_ppm_max,
    co2_ppm_stddev = EXCLUDED.co2_ppm_stddev,
    vpd_kpa_avg = EXCLUDED.vpd_kpa_avg,
    vpd_kpa_min = EXCLUDED.vpd_kpa_min,
    vpd_kpa_max = EXCLUDED.vpd_kpa_max,
    light_intensity_pct_avg = EXCLUDED.light_intensity_pct_avg,
    light_intensity_pct_min = EXCLUDED.light_intensity_pct_min,
    light_intensity_pct_max = EXCLUDED.light_intensity_pct_max,
    sample_count = EXCLUDED.sample_count,
    data_completeness_pct = EXCLUDED.data_completeness_pct,
    has_gaps = EXCLUDED.has_gaps,
    aggregated_at = NOW();

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  -- Mark raw readings as aggregated
  UPDATE telemetry_readings
  SET aggregated_to_hourly = TRUE
  WHERE pod_id = p_pod_id
    AND timestamp >= p_hour_start
    AND timestamp < p_hour_start + INTERVAL '1 hour'
    AND aggregated_to_hourly = FALSE;

  RETURN v_inserted_count;
END;
$$;

-- Function to aggregate hourly data into daily statistics
CREATE OR REPLACE FUNCTION aggregate_telemetry_to_daily(
  p_pod_id UUID,
  p_day_start DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_inserted_count INTEGER := 0;
BEGIN
  INSERT INTO telemetry_readings_daily (
    pod_id, day_start,
    temperature_c_avg, temperature_c_min, temperature_c_max, temperature_c_stddev,
    humidity_pct_avg, humidity_pct_min, humidity_pct_max, humidity_pct_stddev,
    co2_ppm_avg, co2_ppm_min, co2_ppm_max, co2_ppm_stddev,
    vpd_kpa_avg, vpd_kpa_min, vpd_kpa_max,
    light_intensity_pct_avg,
    cooling_runtime_pct, heating_runtime_pct, dehumidifier_runtime_pct,
    humidifier_runtime_pct, lights_runtime_pct,
    power_consumption_kwh, water_usage_l,
    sample_count, expected_samples, data_completeness_pct, has_gaps
  )
  SELECT
    p_pod_id,
    p_day_start,
    -- Temperature statistics (from hourly averages)
    AVG(temperature_c_avg), MIN(temperature_c_min), MAX(temperature_c_max), AVG(temperature_c_stddev),
    -- Humidity statistics
    AVG(humidity_pct_avg), MIN(humidity_pct_min), MAX(humidity_pct_max), AVG(humidity_pct_stddev),
    -- CO2 statistics
    AVG(co2_ppm_avg)::INTEGER, MIN(co2_ppm_min), MAX(co2_ppm_max), AVG(co2_ppm_stddev),
    -- VPD statistics
    AVG(vpd_kpa_avg), MIN(vpd_kpa_min), MAX(vpd_kpa_max),
    -- Light
    AVG(light_intensity_pct_avg)::INTEGER,
    -- Equipment runtime (average of hourly percentages)
    AVG(cooling_runtime_pct),
    AVG(heating_runtime_pct),
    AVG(dehumidifier_runtime_pct),
    AVG(humidifier_runtime_pct),
    AVG(lights_runtime_pct),
    -- Resource consumption totals
    SUM(power_consumption_wh) / 1000.0, -- Convert Wh to kWh
    SUM(water_usage_l),
    -- Data quality
    COUNT(*)::INTEGER,
    24, -- Expected hourly samples
    (COUNT(*)::DECIMAL / 24 * 100),
    COUNT(*) < 20 -- Has gaps if less than 20 hourly samples
  FROM telemetry_readings_hourly
  WHERE pod_id = p_pod_id
    AND hour_start >= p_day_start::TIMESTAMPTZ
    AND hour_start < (p_day_start + INTERVAL '1 day')::TIMESTAMPTZ
  HAVING COUNT(*) > 0
  ON CONFLICT (pod_id, day_start) DO UPDATE SET
    temperature_c_avg = EXCLUDED.temperature_c_avg,
    temperature_c_min = EXCLUDED.temperature_c_min,
    temperature_c_max = EXCLUDED.temperature_c_max,
    sample_count = EXCLUDED.sample_count,
    data_completeness_pct = EXCLUDED.data_completeness_pct,
    has_gaps = EXCLUDED.has_gaps,
    aggregated_at = NOW();

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  RETURN v_inserted_count;
END;
$$;

-- ============================================================================
-- PART 5: Data Cleanup Functions
-- ============================================================================

-- Function to clean up old raw telemetry data (older than retention period)
CREATE OR REPLACE FUNCTION cleanup_old_telemetry_raw(
  retention_hours INTEGER DEFAULT 48 -- Keep 48 hours by default (2 days)
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_cutoff_time TIMESTAMPTZ;
BEGIN
  v_cutoff_time := NOW() - (retention_hours || ' hours')::INTERVAL;
  
  -- Only delete data that has been aggregated
  DELETE FROM telemetry_readings
  WHERE timestamp < v_cutoff_time
    AND aggregated_to_hourly = TRUE;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % old telemetry readings older than %', v_deleted_count, v_cutoff_time;
  RETURN v_deleted_count;
END;
$$;

-- Function to clean up old hourly data
CREATE OR REPLACE FUNCTION cleanup_old_telemetry_hourly(
  retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_cutoff_date DATE;
BEGIN
  v_cutoff_date := CURRENT_DATE - retention_days;
  
  DELETE FROM telemetry_readings_hourly
  WHERE hour_start < v_cutoff_date::TIMESTAMPTZ;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % hourly telemetry readings older than %', v_deleted_count, v_cutoff_date;
  RETURN v_deleted_count;
END;
$$;

-- ============================================================================
-- PART 6: Gap Detection Function
-- ============================================================================

-- Function to detect and report data gaps
CREATE OR REPLACE FUNCTION detect_telemetry_gaps(
  p_pod_id UUID,
  p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
  hour_start TIMESTAMPTZ,
  sample_count INTEGER,
  expected_samples INTEGER,
  completeness_pct DECIMAL,
  has_gap BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.hour_start,
    h.sample_count,
    h.expected_samples,
    h.data_completeness_pct,
    h.has_gaps
  FROM telemetry_readings_hourly h
  WHERE h.pod_id = p_pod_id
    AND h.hour_start >= NOW() - (p_hours_back || ' hours')::INTERVAL
    AND h.has_gaps = TRUE
  ORDER BY h.hour_start DESC;
END;
$$;

-- ============================================================================
-- PART 7: Grant Permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON telemetry_readings_hourly TO authenticated;
GRANT SELECT, INSERT, UPDATE ON telemetry_readings_daily TO authenticated;
GRANT SELECT ON telemetry_readings_hourly TO service_role;
GRANT SELECT ON telemetry_readings_daily TO service_role;

GRANT EXECUTE ON FUNCTION aggregate_telemetry_to_hourly(UUID, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION aggregate_telemetry_to_daily(UUID, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_telemetry_raw(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_telemetry_hourly(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION detect_telemetry_gaps(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_telemetry_gaps(UUID, INTEGER) TO service_role;

-- ============================================================================
-- PART 8: Comments
-- ============================================================================

COMMENT ON TABLE telemetry_readings_hourly IS 
'Hourly aggregated telemetry data with statistics. Retention: 30 days. Used for week/month views.';

COMMENT ON TABLE telemetry_readings_daily IS 
'Daily aggregated telemetry data with statistics. Retention: 1 year. Used for long-term trending.';

COMMENT ON FUNCTION aggregate_telemetry_to_hourly(UUID, TIMESTAMPTZ) IS 
'Aggregates raw telemetry readings into hourly statistics with data quality metrics.';

COMMENT ON FUNCTION aggregate_telemetry_to_daily(UUID, DATE) IS 
'Aggregates hourly telemetry data into daily statistics.';

COMMENT ON FUNCTION cleanup_old_telemetry_raw(INTEGER) IS 
'Deletes raw telemetry data older than specified retention period (only aggregated data).';

COMMENT ON FUNCTION detect_telemetry_gaps(UUID, INTEGER) IS 
'Detects hours with incomplete data (gaps in telemetry readings) for a pod.';
