-- =====================================================
-- RECIPE MANAGEMENT DATABASE FUNCTIONS
-- Phase 11: Recipe Management & Environmental Control
-- =====================================================

-- Function: activate_recipe
-- Activates a recipe for a specific scope (pod, room, batch, batch_group)
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

-- Function: deactivate_recipe
-- Deactivates an active recipe
CREATE OR REPLACE FUNCTION deactivate_recipe(
  p_activation_id UUID,
  p_deactivated_by UUID,
  p_reason TEXT DEFAULT 'Manual deactivation'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function: advance_recipe_stage
-- Advances a recipe activation to the next stage
CREATE OR REPLACE FUNCTION advance_recipe_stage(
  p_activation_id UUID,
  p_advanced_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_version_id UUID;
  v_current_stage_id UUID;
  v_current_order INTEGER;
  v_next_stage_id UUID;
  v_scope_type TEXT;
  v_scope_id UUID;
  v_scope_name TEXT;
BEGIN
  -- Get current activation info
  SELECT recipe_version_id, current_stage_id, scope_type, scope_id, scope_name
  INTO v_current_version_id, v_current_stage_id, v_scope_type, v_scope_id, v_scope_name
  FROM recipe_activations
  WHERE id = p_activation_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get current stage order
  SELECT order_index INTO v_current_order
  FROM recipe_stages
  WHERE id = v_current_stage_id;

  -- Get next stage
  SELECT id INTO v_next_stage_id
  FROM recipe_stages
  WHERE recipe_version_id = v_current_version_id
    AND order_index > v_current_order
  ORDER BY order_index ASC
  LIMIT 1;

  -- If no next stage, we're done
  IF v_next_stage_id IS NULL THEN
    -- Mark as completed
    UPDATE recipe_activations
    SET is_active = FALSE,
        deactivated_at = NOW(),
        deactivation_reason = 'Recipe completed - all stages finished'
    WHERE id = p_activation_id;

    RETURN TRUE;
  END IF;

  -- Advance to next stage
  UPDATE recipe_activations
  SET current_stage_id = v_next_stage_id,
      current_stage_day = 1,
      stage_started_at = NOW()
  WHERE id = p_activation_id;

  -- Log the stage advancement
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
    'stage_advanced',
    v_scope_type,
    v_scope_id,
    v_scope_name,
    p_advanced_by,
    p_activation_id,
    'Automatic stage advancement',
    jsonb_build_object(
      'previous_stage_id', v_current_stage_id,
      'new_stage_id', v_next_stage_id
    )
  );

  RETURN TRUE;
END;
$$;

-- Function: log_control_override
-- Logs a control override event
CREATE OR REPLACE FUNCTION log_control_override(
  p_override_id UUID,
  p_event_type TEXT,
  p_actor_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_override RECORD;
BEGIN
  -- Get override details
  SELECT * INTO v_override
  FROM control_overrides
  WHERE id = p_override_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Control override not found: %', p_override_id;
  END IF;

  -- Log the event
  INSERT INTO control_logs (
    event_type,
    scope_type,
    scope_id,
    scope_name,
    actor_id,
    parameter,
    value_before,
    value_after,
    reason,
    override_id,
    metadata
  ) VALUES (
    p_event_type,
    v_override.scope_type,
    v_override.scope_id,
    v_override.scope_name,
    p_actor_id,
    v_override.parameter,
    v_override.current_value::TEXT,
    v_override.override_value::TEXT,
    COALESCE(p_reason, v_override.reason),
    p_override_id,
    jsonb_build_object(
      'precedence', v_override.precedence,
      'ttl_seconds', v_override.ttl_seconds,
      'expires_at', v_override.expires_at
    )
  );
END;
$$;

-- Function: get_active_recipe_for_scope
-- Gets the currently active recipe for a given scope
CREATE OR REPLACE FUNCTION get_active_recipe_for_scope(
  p_scope_type TEXT,
  p_scope_id UUID
)
RETURNS TABLE (
  activation_id UUID,
  recipe_id UUID,
  recipe_name TEXT,
  version_id UUID,
  version_number INTEGER,
  current_stage_id UUID,
  current_stage_name TEXT,
  current_stage_day INTEGER,
  stage_duration_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ra.id,
    r.id,
    r.name,
    rv.id,
    rv.version,
    rs.id,
    rs.name,
    ra.current_stage_day,
    rs.duration_days
  FROM recipe_activations ra
  JOIN recipes r ON ra.recipe_id = r.id
  JOIN recipe_versions rv ON ra.recipe_version_id = rv.id
  LEFT JOIN recipe_stages rs ON ra.current_stage_id = rs.id
  WHERE ra.scope_type = p_scope_type
    AND ra.scope_id = p_scope_id
    AND ra.is_active = TRUE
  ORDER BY ra.activated_at DESC
  LIMIT 1;
END;
$$;

-- Function: get_current_setpoints_for_activation
-- Gets all environmental setpoints for the current stage of an activation
CREATE OR REPLACE FUNCTION get_current_setpoints_for_activation(
  p_activation_id UUID
)
RETURNS TABLE (
  parameter_type TEXT,
  value DECIMAL,
  day_value DECIMAL,
  night_value DECIMAL,
  unit TEXT,
  deadband DECIMAL,
  min_value DECIMAL,
  max_value DECIMAL,
  priority INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.parameter_type,
    es.value,
    es.day_value,
    es.night_value,
    es.unit,
    es.deadband,
    es.min_value,
    es.max_value,
    es.priority
  FROM recipe_activations ra
  JOIN recipe_stages rs ON ra.current_stage_id = rs.id
  JOIN environmental_setpoints es ON rs.id = es.recipe_stage_id
  WHERE ra.id = p_activation_id
    AND es.enabled = TRUE
  ORDER BY es.priority DESC, es.parameter_type;
END;
$$;

-- Function: auto_expire_overrides
-- Automatically expires overrides that have passed their TTL
-- Should be called periodically (e.g., every minute via cron job)
CREATE OR REPLACE FUNCTION auto_expire_overrides()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function: calculate_adherence_score
-- Calculates how well a batch/pod is adhering to recipe setpoints
-- Based on telemetry data from the last 24 hours
CREATE OR REPLACE FUNCTION calculate_adherence_score(
  p_activation_id UUID
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score DECIMAL := 100.0;
  v_scope_type TEXT;
  v_scope_id UUID;
BEGIN
  -- Get activation scope
  SELECT scope_type, scope_id
  INTO v_scope_type, v_scope_id
  FROM recipe_activations
  WHERE id = p_activation_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- TODO: Implement actual adherence calculation
  -- This would compare telemetry_readings against environmental_setpoints
  -- For now, return a placeholder value

  -- Update the activation with the score
  UPDATE recipe_activations
  SET adherence_score = v_score
  WHERE id = p_activation_id;

  RETURN v_score;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update recipe updated_at timestamp
CREATE OR REPLACE FUNCTION update_recipe_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_timestamp();

CREATE TRIGGER recipe_activations_updated_at
  BEFORE UPDATE ON recipe_activations
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_timestamp();

CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_timestamp();

CREATE TRIGGER batch_groups_updated_at
  BEFORE UPDATE ON batch_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION activate_recipe IS 'Activates a recipe for a specific scope (pod, room, batch, batch_group)';
COMMENT ON FUNCTION deactivate_recipe IS 'Deactivates an active recipe';
COMMENT ON FUNCTION advance_recipe_stage IS 'Advances a recipe activation to the next stage';
COMMENT ON FUNCTION log_control_override IS 'Logs a control override event to the audit trail';
COMMENT ON FUNCTION get_active_recipe_for_scope IS 'Gets the currently active recipe for a given scope';
COMMENT ON FUNCTION get_current_setpoints_for_activation IS 'Gets all environmental setpoints for the current stage';
COMMENT ON FUNCTION auto_expire_overrides IS 'Automatically expires overrides that have passed their TTL';
COMMENT ON FUNCTION calculate_adherence_score IS 'Calculates recipe adherence score based on telemetry data';

-- =====================================================
-- END OF FUNCTIONS
-- =====================================================
