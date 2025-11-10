-- Migration: Add merge upsert function for telemetry readings
-- Purpose: Handle partial variable updates from TagoIO without data loss
-- Created: 2025-11-07
-- 
-- This function merges telemetry readings using COALESCE to preserve existing
-- non-null values when new data contains nulls (common with TagoIO partial polling)

-- Drop function if exists (for re-run safety)
DROP FUNCTION IF EXISTS merge_upsert_telemetry_reading(jsonb);

-- Create function to handle merge upserts
CREATE OR REPLACE FUNCTION merge_upsert_telemetry_reading(reading jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO telemetry_readings (
    pod_id, timestamp, temperature_c, humidity_pct, co2_ppm, vpd_kpa,
    light_intensity_pct, lights_on,
    cooling_active, heating_active, dehumidifier_active, humidifier_active,
    co2_injection_active, exhaust_fan_active, circulation_fan_active,
    temp_sensor_fault, humidity_sensor_fault, co2_sensor_fault,
    pressure_sensor_fault, active_recipe_id,
    raw_data, data_source, equipment_states
  ) VALUES (
    (reading->>'pod_id')::uuid,
    (reading->>'timestamp')::timestamptz,
    (reading->>'temperature_c')::numeric,
    (reading->>'humidity_pct')::numeric,
    (reading->>'co2_ppm')::numeric,
    (reading->>'vpd_kpa')::numeric,
    (reading->>'light_intensity_pct')::numeric,
    (reading->>'lights_on')::boolean,
    (reading->>'cooling_active')::boolean,
    (reading->>'heating_active')::boolean,
    (reading->>'dehumidifier_active')::boolean,
    (reading->>'humidifier_active')::boolean,
    (reading->>'co2_injection_active')::boolean,
    (reading->>'exhaust_fan_active')::boolean,
    (reading->>'circulation_fan_active')::boolean,
    (reading->>'temp_sensor_fault')::boolean,
    (reading->>'humidity_sensor_fault')::boolean,
    (reading->>'co2_sensor_fault')::boolean,
    (reading->>'pressure_sensor_fault')::boolean,
    (reading->>'active_recipe_id')::uuid,
    (reading->'raw_data')::jsonb,
    (reading->>'data_source')::text,
    (reading->'equipment_states')::jsonb
  )
  ON CONFLICT (pod_id, timestamp) DO UPDATE SET
    -- Merge variables: use new value if not null, otherwise keep old value
    temperature_c = COALESCE(EXCLUDED.temperature_c, telemetry_readings.temperature_c),
    humidity_pct = COALESCE(EXCLUDED.humidity_pct, telemetry_readings.humidity_pct),
    co2_ppm = COALESCE(EXCLUDED.co2_ppm, telemetry_readings.co2_ppm),
    vpd_kpa = COALESCE(EXCLUDED.vpd_kpa, telemetry_readings.vpd_kpa),
    light_intensity_pct = COALESCE(EXCLUDED.light_intensity_pct, telemetry_readings.light_intensity_pct),
    lights_on = COALESCE(EXCLUDED.lights_on, telemetry_readings.lights_on),
    cooling_active = COALESCE(EXCLUDED.cooling_active, telemetry_readings.cooling_active),
    heating_active = COALESCE(EXCLUDED.heating_active, telemetry_readings.heating_active),
    dehumidifier_active = COALESCE(EXCLUDED.dehumidifier_active, telemetry_readings.dehumidifier_active),
    humidifier_active = COALESCE(EXCLUDED.humidifier_active, telemetry_readings.humidifier_active),
    co2_injection_active = COALESCE(EXCLUDED.co2_injection_active, telemetry_readings.co2_injection_active),
    exhaust_fan_active = COALESCE(EXCLUDED.exhaust_fan_active, telemetry_readings.exhaust_fan_active),
    circulation_fan_active = COALESCE(EXCLUDED.circulation_fan_active, telemetry_readings.circulation_fan_active),
    temp_sensor_fault = COALESCE(EXCLUDED.temp_sensor_fault, telemetry_readings.temp_sensor_fault),
    humidity_sensor_fault = COALESCE(EXCLUDED.humidity_sensor_fault, telemetry_readings.humidity_sensor_fault),
    co2_sensor_fault = COALESCE(EXCLUDED.co2_sensor_fault, telemetry_readings.co2_sensor_fault),
    pressure_sensor_fault = COALESCE(EXCLUDED.pressure_sensor_fault, telemetry_readings.pressure_sensor_fault),
    active_recipe_id = COALESCE(EXCLUDED.active_recipe_id, telemetry_readings.active_recipe_id),
    raw_data = COALESCE(EXCLUDED.raw_data, telemetry_readings.raw_data),
    data_source = COALESCE(EXCLUDED.data_source, telemetry_readings.data_source),
    equipment_states = COALESCE(EXCLUDED.equipment_states, telemetry_readings.equipment_states);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION merge_upsert_telemetry_reading(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION merge_upsert_telemetry_reading(jsonb) TO service_role;

-- Add comment
COMMENT ON FUNCTION merge_upsert_telemetry_reading(jsonb) IS 
'Merge upsert telemetry reading, preserving existing non-null values when new data is null. 
Used for TagoIO partial variable polling where different API calls return different subsets of variables.';
