-- Migration: Enhance merge_upsert_telemetry_reading with variable counting
-- Purpose: Calculate variable_count and is_partial flag to track data completeness
-- Created: November 10, 2025

-- Drop old function
DROP FUNCTION IF EXISTS merge_upsert_telemetry_reading(jsonb);

-- Create enhanced function with variable counting
CREATE OR REPLACE FUNCTION merge_upsert_telemetry_reading(reading jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_variable_count INTEGER := 0;
  v_is_partial BOOLEAN := FALSE;
  v_temp NUMERIC;
  v_humidity NUMERIC;
  v_co2 NUMERIC;
  v_vpd NUMERIC;
  v_light NUMERIC;
  v_water_temp NUMERIC;
  v_ph NUMERIC;
  v_ec NUMERIC;
BEGIN
  -- Extract values
  v_temp := (reading->>'temperature_c')::numeric;
  v_humidity := (reading->>'humidity_pct')::numeric;
  v_co2 := (reading->>'co2_ppm')::numeric;
  v_vpd := (reading->>'vpd_kpa')::numeric;
  v_light := (reading->>'light_intensity_pct')::numeric;
  v_water_temp := (reading->>'water_temp_c')::numeric;
  v_ph := (reading->>'ph')::numeric;
  v_ec := (reading->>'ec_ms_cm')::numeric;
  
  -- Count non-null core variables (8 total)
  v_variable_count := 0;
  IF v_temp IS NOT NULL THEN v_variable_count := v_variable_count + 1; END IF;
  IF v_humidity IS NOT NULL THEN v_variable_count := v_variable_count + 1; END IF;
  IF v_co2 IS NOT NULL THEN v_variable_count := v_variable_count + 1; END IF;
  IF v_vpd IS NOT NULL THEN v_variable_count := v_variable_count + 1; END IF;
  IF v_light IS NOT NULL THEN v_variable_count := v_variable_count + 1; END IF;
  IF v_water_temp IS NOT NULL THEN v_variable_count := v_variable_count + 1; END IF;
  IF v_ph IS NOT NULL THEN v_variable_count := v_variable_count + 1; END IF;
  IF v_ec IS NOT NULL THEN v_variable_count := v_variable_count + 1; END IF;
  
  -- Mark as partial if not all variables present
  v_is_partial := (v_variable_count < 8);

  INSERT INTO telemetry_readings (
    pod_id, timestamp, temperature_c, humidity_pct, co2_ppm, vpd_kpa,
    light_intensity_pct, water_temp_c, ph, ec_ms_cm,
    lights_on,
    cooling_active, heating_active, dehumidifier_active, humidifier_active,
    co2_injection_active, exhaust_fan_active, circulation_fan_active,
    temp_sensor_fault, humidity_sensor_fault, co2_sensor_fault,
    pressure_sensor_fault, active_recipe_id,
    raw_data, data_source, equipment_states,
    variable_count, is_partial
  ) VALUES (
    (reading->>'pod_id')::uuid,
    (reading->>'timestamp')::timestamptz,
    v_temp,
    v_humidity,
    v_co2,
    v_vpd,
    v_light,
    v_water_temp,
    v_ph,
    v_ec,
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
    (reading->'equipment_states')::jsonb,
    v_variable_count,
    v_is_partial
  )
  ON CONFLICT (pod_id, timestamp) DO UPDATE SET
    -- Merge variables: use new value if not null, otherwise keep old value
    temperature_c = COALESCE(EXCLUDED.temperature_c, telemetry_readings.temperature_c),
    humidity_pct = COALESCE(EXCLUDED.humidity_pct, telemetry_readings.humidity_pct),
    co2_ppm = COALESCE(EXCLUDED.co2_ppm, telemetry_readings.co2_ppm),
    vpd_kpa = COALESCE(EXCLUDED.vpd_kpa, telemetry_readings.vpd_kpa),
    light_intensity_pct = COALESCE(EXCLUDED.light_intensity_pct, telemetry_readings.light_intensity_pct),
    water_temp_c = COALESCE(EXCLUDED.water_temp_c, telemetry_readings.water_temp_c),
    ph = COALESCE(EXCLUDED.ph, telemetry_readings.ph),
    ec_ms_cm = COALESCE(EXCLUDED.ec_ms_cm, telemetry_readings.ec_ms_cm),
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
    equipment_states = COALESCE(EXCLUDED.equipment_states, telemetry_readings.equipment_states),
    -- Recalculate variable count and partial flag on merge
    variable_count = (
      (CASE WHEN COALESCE(EXCLUDED.temperature_c, telemetry_readings.temperature_c) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.humidity_pct, telemetry_readings.humidity_pct) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.co2_ppm, telemetry_readings.co2_ppm) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.vpd_kpa, telemetry_readings.vpd_kpa) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.light_intensity_pct, telemetry_readings.light_intensity_pct) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.water_temp_c, telemetry_readings.water_temp_c) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.ph, telemetry_readings.ph) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.ec_ms_cm, telemetry_readings.ec_ms_cm) IS NOT NULL THEN 1 ELSE 0 END)
    ),
    is_partial = (
      (CASE WHEN COALESCE(EXCLUDED.temperature_c, telemetry_readings.temperature_c) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.humidity_pct, telemetry_readings.humidity_pct) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.co2_ppm, telemetry_readings.co2_ppm) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.vpd_kpa, telemetry_readings.vpd_kpa) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.light_intensity_pct, telemetry_readings.light_intensity_pct) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.water_temp_c, telemetry_readings.water_temp_c) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.ph, telemetry_readings.ph) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(EXCLUDED.ec_ms_cm, telemetry_readings.ec_ms_cm) IS NOT NULL THEN 1 ELSE 0 END)
    ) < 8;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION merge_upsert_telemetry_reading(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION merge_upsert_telemetry_reading(jsonb) TO service_role;

-- Add comment
COMMENT ON FUNCTION merge_upsert_telemetry_reading(jsonb) IS 
'Enhanced merge upsert telemetry reading with variable counting and partial flag tracking.
Preserves existing non-null values when new data is null.
Calculates variable_count (0-8) and sets is_partial flag for data completeness tracking.
Used for TagoIO partial variable polling where different API calls return different subsets of variables.';
