-- =====================================================
-- SECURITY FIX: Function search_path Privilege Escalation
-- Migration: 003-fix-function-search-path
-- Date: 2025-11-12
-- Priority: HIGH
-- =====================================================
--
-- ISSUE: 15 functions have mutable search_path allowing attackers
--        to manipulate schema resolution and execute malicious code
--
-- IMPACT: Privilege escalation vulnerability - attackers could create
--         malicious schemas/functions that get executed instead of 
--         intended public schema functions
--
-- AFFECTED FUNCTIONS (from security advisor):
--   1. cleanup_old_telemetry_data
--   2. activate_recipe
--   3. deactivate_recipe  
--   4. merge_upsert_telemetry_reading
--   5. aggregate_telemetry_to_daily
--   6. auto_expire_overrides
--   7. update_recipe_timestamp
--   8. create_default_site_for_organization (ALREADY FIXED in schema.sql)
--   9. aggregate_telemetry_to_hourly
--   10. cleanup_old_telemetry_raw
--   11. cleanup_old_telemetry_hourly
--   12. detect_telemetry_gaps
--   13-15. (3 more - need to identify from schema)
--
-- FIX: Add `SET search_path = public, pg_temp` to all function definitions
-- =====================================================

-- =====================================================
-- HELPER FUNCTION: Update updated_at timestamp
-- (Already has SECURITY DEFINER and empty search_path - verify it's correct)
-- =====================================================

-- This function is already secure (line 1160 in schema.sql):
-- SET search_path = '' which is even more restrictive than public, pg_temp
-- No changes needed, but let's verify it's applied:

-- SELECT proname, prosecdef, proconfig 
-- FROM pg_proc 
-- WHERE proname = 'update_updated_at_column';

-- =====================================================
-- HELPER FUNCTION: Audit trail logging
-- (Already has SECURITY DEFINER and empty search_path)
-- =====================================================

-- This function is already secure (line 1240 in schema.sql)
-- No changes needed

-- =====================================================
-- FIX 1: create_default_site_for_organization
-- =====================================================

-- Already has SECURITY DEFINER but uses default search_path
-- This is actually ALREADY FIXED in schema.sql line 1183 with:
-- LANGUAGE plpgsql SECURITY DEFINER;
-- But it's missing SET search_path, let's add it:

CREATE OR REPLACE FUNCTION create_default_site_for_organization()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO sites (
    id,
    organization_id,
    name,
    address,
    city,
    state_province,
    postal_code,
    country,
    is_active
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    'Main Site',
    '',
    '',
    '',
    '',
    CASE WHEN NEW.data_region = 'us' THEN 'US' ELSE 'CA' END,
    true
  );
  RETURN NEW;
END;
$$;

-- =====================================================
-- FIX 2: create_batch_event
-- =====================================================

CREATE OR REPLACE FUNCTION create_batch_event()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Create event for new batches
  IF TG_OP = 'INSERT' THEN
    INSERT INTO batch_events (batch_id, event_type, to_value, user_id, notes)
    VALUES (NEW.id, 'created', row_to_json(NEW), auth.uid(), 'Batch created');
    RETURN NEW;
  END IF;
  
  -- Create event for stage changes
  IF TG_OP = 'UPDATE' AND OLD.stage != NEW.stage THEN
    INSERT INTO batch_events (batch_id, event_type, from_value, to_value, user_id, notes)
    VALUES (NEW.id, 'stage_change', 
           jsonb_build_object('stage', OLD.stage), 
           jsonb_build_object('stage', NEW.stage), 
           auth.uid(), 
           CONCAT('Stage changed from ', OLD.stage, ' to ', NEW.stage));
  END IF;
  
  -- Create event for plant count changes
  IF TG_OP = 'UPDATE' AND OLD.plant_count != NEW.plant_count THEN
    INSERT INTO batch_events (batch_id, event_type, from_value, to_value, user_id, notes)
    VALUES (NEW.id, 'plant_count_update',
           jsonb_build_object('plant_count', OLD.plant_count),
           jsonb_build_object('plant_count', NEW.plant_count),
           auth.uid(),
           CONCAT('Plant count changed from ', OLD.plant_count, ' to ', NEW.plant_count));
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- FIX 3: calculate_item_quantity_from_lots
-- =====================================================

-- This function already has SECURITY DEFINER and SET search_path (line 994 in schema.sql)
-- Verify it's correct:
-- Already has: SET search_path = 'public'
-- This is acceptable but let's make it more explicit:

CREATE OR REPLACE FUNCTION calculate_item_quantity_from_lots(p_item_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(quantity_remaining), 0)
  INTO v_total
  FROM inventory_lots
  WHERE item_id = p_item_id AND is_active = TRUE;
  
  RETURN v_total;
END;
$$;

-- =====================================================
-- FIX 4: activate_recipe (from recipe-functions.sql)
-- =====================================================

-- Already has SECURITY DEFINER, adding search_path
CREATE OR REPLACE FUNCTION activate_recipe(
  p_recipe_id UUID,
  p_recipe_version_id UUID,
  p_scope_type TEXT,
  p_scope_id UUID,
  p_scope_name TEXT,
  p_activated_by UUID,
  p_scheduled_start TIMESTAMPTZ DEFAULT NULL,
  p_scheduled_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_activation_id UUID;
  v_first_stage_id UUID;
  v_org_id UUID;
BEGIN
  -- Get organization_id from recipe
  SELECT organization_id INTO v_org_id
  FROM recipes
  WHERE id = p_recipe_id;

  -- Get first stage of the recipe version
  SELECT id INTO v_first_stage_id
  FROM recipe_stages
  WHERE recipe_version_id = p_recipe_version_id
  ORDER BY order_index ASC
  LIMIT 1;

  -- Deactivate any existing active recipes for this scope
  UPDATE recipe_activations
  SET is_active = FALSE,
      deactivated_at = NOW(),
      deactivated_by = p_activated_by,
      deactivation_reason = 'Replaced by new recipe activation'
  WHERE scope_type = p_scope_type
    AND scope_id = p_scope_id
    AND is_active = TRUE;

  -- Create new activation
  INSERT INTO recipe_activations (
    recipe_id,
    recipe_version_id,
    scope_type,
    scope_id,
    scope_name,
    activated_by,
    activated_at,
    scheduled_start,
    scheduled_end,
    current_stage_id,
    current_stage_day,
    stage_started_at,
    is_active
  ) VALUES (
    p_recipe_id,
    p_recipe_version_id,
    p_scope_type,
    p_scope_id,
    p_scope_name,
    p_activated_by,
    NOW(),
    COALESCE(p_scheduled_start, NOW()),
    p_scheduled_end,
    v_first_stage_id,
    1,
    COALESCE(p_scheduled_start, NOW()),
    TRUE
  )
  RETURNING id INTO v_activation_id;

  -- Log the activation
  INSERT INTO control_logs (
    event_type,
    scope_type,
    scope_id,
    scope_name,
    actor_id,
    recipe_activation_id,
    reason,
    metadata
  ) VALUES (
    'recipe_activated',
    p_scope_type,
    p_scope_id,
    p_scope_name,
    p_activated_by,
    v_activation_id,
    'Recipe activation',
    jsonb_build_object(
      'recipe_id', p_recipe_id,
      'recipe_version_id', p_recipe_version_id,
      'first_stage_id', v_first_stage_id
    )
  );

  RETURN v_activation_id;
END;
$$;

-- =====================================================
-- FIX 5: deactivate_recipe (from recipe-functions.sql)
-- =====================================================

CREATE OR REPLACE FUNCTION deactivate_recipe(
  p_activation_id UUID,
  p_deactivated_by UUID,
  p_reason TEXT DEFAULT 'Manual deactivation'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_scope_type TEXT;
  v_scope_id UUID;
  v_scope_name TEXT;
BEGIN
  -- Update activation
  UPDATE recipe_activations
  SET is_active = FALSE,
      deactivated_at = NOW(),
      deactivated_by = p_deactivated_by,
      deactivation_reason = p_reason
  WHERE id = p_activation_id
  RETURNING scope_type, scope_id, scope_name
  INTO v_scope_type, v_scope_id, v_scope_name;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Log the deactivation
  INSERT INTO control_logs (
    event_type,
    scope_type,
    scope_id,
    scope_name,
    actor_id,
    recipe_activation_id,
    reason
  ) VALUES (
    'recipe_deactivated',
    v_scope_type,
    v_scope_id,
    v_scope_name,
    p_deactivated_by,
    p_activation_id,
    p_reason
  );

  RETURN TRUE;
END;
$$;

-- =====================================================
-- FIX 6: auto_expire_overrides (from recipe-functions.sql)
-- =====================================================

CREATE OR REPLACE FUNCTION auto_expire_overrides()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_override RECORD;
BEGIN
  -- Find and expire overrides
  FOR v_override IN
    SELECT id, scope_type, scope_id, scope_name, parameter
    FROM control_overrides
    WHERE status = 'active'
      AND auto_revert = TRUE
      AND expires_at IS NOT NULL
      AND expires_at <= NOW()
  LOOP
    -- Update override status
    UPDATE control_overrides
    SET status = 'expired',
        reverted_at = NOW()
    WHERE id = v_override.id;

    -- Log the expiration
    INSERT INTO control_logs (
      event_type,
      scope_type,
      scope_id,
      scope_name,
      parameter,
      override_id,
      reason
    ) VALUES (
      'override_expired',
      v_override.scope_type,
      v_override.scope_id,
      v_override.scope_name,
      v_override.parameter,
      v_override.id,
      'Automatic expiration after TTL'
    );

    v_expired_count := v_expired_count + 1;
  END LOOP;

  RETURN v_expired_count;
END;
$$;

-- =====================================================
-- FIX 7: update_recipe_timestamp (from recipe-functions.sql)
-- =====================================================

-- This is a trigger function, not SECURITY DEFINER, but adding search_path for consistency
CREATE OR REPLACE FUNCTION update_recipe_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- FIX 8: merge_upsert_telemetry_reading (from 20251110_enhance_merge_upsert.sql)
-- =====================================================

-- Not SECURITY DEFINER, but adding search_path for security
CREATE OR REPLACE FUNCTION merge_upsert_telemetry_reading(reading jsonb)
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
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
    equipment_states = COALESCE(EXCLUDED.equipment_states, telemetry_readings.equipment_states),
    variable_count = GREATEST(EXCLUDED.variable_count, telemetry_readings.variable_count),
    is_partial = LEAST(EXCLUDED.is_partial, telemetry_readings.is_partial),
    updated_at = NOW();
END;
$$;

-- =====================================================
-- FIX 9: aggregate_telemetry_to_hourly (from 20251110_add_telemetry_aggregation.sql)
-- =====================================================

-- Not SECURITY DEFINER, but adding search_path for security
ALTER FUNCTION aggregate_telemetry_to_hourly(UUID, TIMESTAMPTZ) SET search_path = public, pg_temp;

-- =====================================================
-- FIX 10: aggregate_telemetry_to_daily (from 20251110_add_telemetry_aggregation.sql)
-- =====================================================

-- Not SECURITY DEFINER, but adding search_path for security
ALTER FUNCTION aggregate_telemetry_to_daily(UUID, DATE) SET search_path = public, pg_temp;

-- =====================================================
-- FIX 11: cleanup_old_telemetry_raw (from 20251110_add_telemetry_aggregation.sql)
-- =====================================================

-- Not SECURITY DEFINER, but adding search_path for security
ALTER FUNCTION cleanup_old_telemetry_raw(INTEGER) SET search_path = public, pg_temp;

-- =====================================================
-- FIX 12: cleanup_old_telemetry_hourly (from 20251110_add_telemetry_aggregation.sql)
-- =====================================================

-- Not SECURITY DEFINER, but adding search_path for security
ALTER FUNCTION cleanup_old_telemetry_hourly(INTEGER) SET search_path = public, pg_temp;

-- =====================================================
-- FIX 13: detect_telemetry_gaps (from 20251110_add_telemetry_aggregation.sql)
-- =====================================================

-- Not SECURITY DEFINER, but adding search_path for security
ALTER FUNCTION detect_telemetry_gaps(UUID, INTEGER) SET search_path = public, pg_temp;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all functions have search_path set:
SELECT 
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  p.proconfig as config_settings,
  CASE 
    WHEN p.proconfig IS NULL THEN 'MISSING'
    WHEN array_to_string(p.proconfig, ',') LIKE '%search_path%' THEN 'OK'
    ELSE 'MISSING'
  END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'activate_recipe',
    'deactivate_recipe',
    'auto_expire_overrides',
    'update_recipe_timestamp',
    'merge_upsert_telemetry_reading',
    'aggregate_telemetry_to_hourly',
    'aggregate_telemetry_to_daily',
    'cleanup_old_telemetry_raw',
    'cleanup_old_telemetry_hourly',
    'detect_telemetry_gaps',
    'create_default_site_for_organization',
    'create_batch_event',
    'log_audit_trail',
    'update_updated_at_column',
    'calculate_item_quantity_from_lots'
  )
ORDER BY 
  CASE WHEN p.prosecdef THEN 0 ELSE 1 END, -- SECURITY DEFINER first
  p.proname;

-- Expected result: All functions should have search_path_status = 'OK'

-- =====================================================
-- REMAINING SECURITY DEFINER FUNCTIONS WITHOUT SEARCH_PATH
-- =====================================================

-- Find any remaining SECURITY DEFINER functions without search_path:
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  p.proconfig as config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true  -- SECURITY DEFINER functions
  AND (
    p.proconfig IS NULL OR 
    NOT array_to_string(p.proconfig, ',') LIKE '%search_path%'
  )
ORDER BY p.proname;

-- Expected result: Empty set (all SECURITY DEFINER functions should have search_path)
