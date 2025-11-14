-- Migration: Add audit log entries to recipe stage advancement
-- This updates the advance_recipe_stage function to also log to audit_log table
-- so that stage advancements appear in the admin Audit Log page

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
  v_organization_id UUID;
  v_recipe_name TEXT;
  v_current_stage_name TEXT;
  v_next_stage_name TEXT;
BEGIN
  -- Get current activation info
  SELECT 
    ra.recipe_version_id, 
    ra.current_stage_id, 
    ra.scope_type, 
    ra.scope_id, 
    ra.scope_name,
    r.organization_id,
    r.name
  INTO 
    v_current_version_id, 
    v_current_stage_id, 
    v_scope_type, 
    v_scope_id, 
    v_scope_name,
    v_organization_id,
    v_recipe_name
  FROM recipe_activations ra
  JOIN recipe_versions rv ON ra.recipe_version_id = rv.id
  JOIN recipes r ON rv.recipe_id = r.id
  WHERE ra.id = p_activation_id AND ra.is_active = TRUE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get current stage order and name
  SELECT order_index, name INTO v_current_order, v_current_stage_name
  FROM recipe_stages
  WHERE id = v_current_stage_id;

  -- Get next stage
  SELECT id, name INTO v_next_stage_id, v_next_stage_name
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

  -- Log the stage advancement to control_logs
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

  -- Log to audit_log for visibility in admin panel
  INSERT INTO audit_log (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    entity_name,
    old_values,
    new_values,
    notes
  ) VALUES (
    v_organization_id,
    p_advanced_by,
    'recipe.stage.advanced',
    'recipe',
    p_activation_id,
    v_recipe_name,
    jsonb_build_object(
      'stage', v_current_stage_name,
      'stage_id', v_current_stage_id
    ),
    jsonb_build_object(
      'stage', v_next_stage_name,
      'stage_id', v_next_stage_id
    ),
    'Recipe stage automatically advanced to ' || v_next_stage_name
  );

  RETURN TRUE;
END;
$$;
