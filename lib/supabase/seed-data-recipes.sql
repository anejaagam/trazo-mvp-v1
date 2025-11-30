-- =================================================================
-- RECIPE MANAGEMENT SEED DATA
-- Sample recipes for testing and development
-- =================================================================

DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
  v_site_id UUID;
  v_pod_id UUID;
  
  -- Recipe IDs
  v_recipe_flower_id UUID;
  v_recipe_veg_id UUID;
  v_recipe_lettuce_id UUID;
  
  -- Recipe Version IDs
  v_version_flower_id UUID;
  v_version_veg_id UUID;
  v_version_lettuce_id UUID;
  
  -- Stage IDs
  v_stage_id UUID;
  
BEGIN
  -- Get first organization and user
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  SELECT id INTO v_user_id FROM users WHERE organization_id = v_org_id LIMIT 1;
  SELECT id INTO v_site_id FROM sites WHERE organization_id = v_org_id LIMIT 1;
  SELECT id INTO v_pod_id FROM pods LIMIT 1;

  RAISE NOTICE 'Using org_id: %, user_id: %, site_id: %', v_org_id, v_user_id, v_site_id;

  -- ============================================================
  -- RECIPE 1: Premium Flower Cycle (Cannabis)
  -- ============================================================
  
  INSERT INTO recipes (
    id, organization_id, site_id, name, description, owner_id,
    status, current_version, is_template, template_category,
    jurisdiction_types, plant_types, tags
  ) VALUES (
    gen_random_uuid(), v_org_id, v_site_id,
    'Premium Flower Cycle',
    'Optimized recipe for high-quality cannabis flower production with precise environmental control',
    v_user_id,
    'published', 1, TRUE, 'cannabis_flower',
    ARRAY['oregon_metrc', 'maryland_metrc'],
    ARRAY['cannabis'],
    ARRAY['cannabis', 'flower', 'premium', 'indoor']
  ) RETURNING id INTO v_recipe_flower_id;

  -- Create version 1
  INSERT INTO recipe_versions (
    id, recipe_id, version, created_by, notes, version_data
  ) VALUES (
    gen_random_uuid(), v_recipe_flower_id, 1, v_user_id,
    'Initial version - tested and optimized for DemeGrow pods',
    jsonb_build_object(
      'total_duration_days', 84,
      'stages', 4,
      'target_yield_g_per_sqft', 40
    )
  ) RETURNING id INTO v_version_flower_id;

  -- Stage 1: Germination (7 days)
  INSERT INTO recipe_stages (
    id, recipe_version_id, name, stage_type, order_index, duration_days, description, color_code
  ) VALUES (
    gen_random_uuid(), v_version_flower_id, 'Germination', 'germination', 1, 7,
    'Initial germination and early seedling development', '#8BC34A'
  ) RETURNING id INTO v_stage_id;

  -- Setpoints for Germination
  INSERT INTO environmental_setpoints (recipe_stage_id, parameter_type, value, day_value, night_value, unit, deadband, min_value, max_value) VALUES
    (v_stage_id, 'temperature', 24, 26, 22, '°C', 1, 20, 28),
    (v_stage_id, 'humidity', 65, 60, 70, '%', 5, 50, 80),
    (v_stage_id, 'co2', 800, NULL, NULL, 'ppm', 50, 400, 1200),
    (v_stage_id, 'light_intensity', 40, NULL, NULL, '%', NULL, 0, 100),
    (v_stage_id, 'photoperiod', 18, NULL, NULL, 'hrs', NULL, 0, 24);

  -- Stage 2: Vegetative (21 days)
  INSERT INTO recipe_stages (
    id, recipe_version_id, name, stage_type, order_index, duration_days, description, color_code
  ) VALUES (
    gen_random_uuid(), v_version_flower_id, 'Vegetative', 'vegetative', 2, 21,
    'Rapid vegetative growth phase', '#4CAF50'
  ) RETURNING id INTO v_stage_id;

  INSERT INTO environmental_setpoints (recipe_stage_id, parameter_type, value, day_value, night_value, unit, deadband, min_value, max_value, ramp_enabled, ramp_start_value, ramp_end_value, ramp_duration_minutes) VALUES
    (v_stage_id, 'temperature', 24, 26, 22, '°C', 1, 20, 28, FALSE, NULL, NULL, NULL),
    (v_stage_id, 'humidity', 60, 55, 65, '%', 5, 45, 75, FALSE, NULL, NULL, NULL),
    (v_stage_id, 'co2', 1200, NULL, NULL, 'ppm', 50, 400, 1500, FALSE, NULL, NULL, NULL),
    (v_stage_id, 'light_intensity', 90, NULL, NULL, '%', NULL, 0, 100, TRUE, 40, 90, 120),
    (v_stage_id, 'photoperiod', 18, NULL, NULL, 'hrs', NULL, 0, 24, FALSE, NULL, NULL, NULL);

  INSERT INTO nutrient_formulas (recipe_stage_id, ec_target, ec_min, ec_max, ph_target, ph_min, ph_max, npk_ratio) VALUES
    (v_stage_id, 1.8, 1.5, 2.2, 5.8, 5.5, 6.2, '3-1-2');

  -- Stage 3: Flowering (56 days)
  INSERT INTO recipe_stages (
    id, recipe_version_id, name, stage_type, order_index, duration_days, description, color_code
  ) VALUES (
    gen_random_uuid(), v_version_flower_id, 'Flowering', 'flowering', 3, 56,
    'Flower development and maturation', '#FF9800'
  ) RETURNING id INTO v_stage_id;

  INSERT INTO environmental_setpoints (recipe_stage_id, parameter_type, value, day_value, night_value, unit, deadband, min_value, max_value) VALUES
    (v_stage_id, 'temperature', 23, 24, 21, '°C', 1, 18, 26),
    (v_stage_id, 'humidity', 50, 45, 55, '%', 5, 40, 60),
    (v_stage_id, 'co2', 1400, NULL, NULL, 'ppm', 50, 400, 1500),
    (v_stage_id, 'light_intensity', 95, NULL, NULL, '%', NULL, 0, 100),
    (v_stage_id, 'photoperiod', 12, NULL, NULL, 'hrs', NULL, 0, 24);

  INSERT INTO nutrient_formulas (recipe_stage_id, ec_target, ec_min, ec_max, ph_target, ph_min, ph_max, npk_ratio) VALUES
    (v_stage_id, 2.2, 1.8, 2.6, 6.0, 5.7, 6.3, '1-3-2');

  -- ============================================================
  -- RECIPE 2: Fast Veg Protocol (Cannabis)
  -- ============================================================
  
  INSERT INTO recipes (
    id, organization_id, site_id, name, description, owner_id,
    status, current_version, is_template, template_category,
    jurisdiction_types, plant_types, tags
  ) VALUES (
    gen_random_uuid(), v_org_id, v_site_id,
    'Fast Veg Protocol',
    'Accelerated vegetative growth for mother plants and clones',
    v_user_id,
    'published', 1, TRUE, 'cannabis_veg',
    ARRAY['oregon_metrc', 'maryland_metrc'],
    ARRAY['cannabis'],
    ARRAY['cannabis', 'veg', 'fast', 'mother']
  ) RETURNING id INTO v_recipe_veg_id;

  INSERT INTO recipe_versions (
    id, recipe_id, version, created_by, notes, version_data
  ) VALUES (
    gen_random_uuid(), v_recipe_veg_id, 1, v_user_id,
    'Optimized for rapid vegetative growth',
    jsonb_build_object('total_duration_days', 14, 'stages', 1)
  ) RETURNING id INTO v_version_veg_id;

  INSERT INTO recipe_stages (
    id, recipe_version_id, name, stage_type, order_index, duration_days, description, color_code
  ) VALUES (
    gen_random_uuid(), v_version_veg_id, 'Rapid Veg', 'vegetative', 1, 14,
    'High-intensity vegetative growth', '#4CAF50'
  ) RETURNING id INTO v_stage_id;

  INSERT INTO environmental_setpoints (recipe_stage_id, parameter_type, value, day_value, night_value, unit, deadband, min_value, max_value) VALUES
    (v_stage_id, 'temperature', 25, 27, 23, '°C', 1, 20, 30),
    (v_stage_id, 'humidity', 65, 60, 70, '%', 5, 50, 75),
    (v_stage_id, 'co2', 1400, NULL, NULL, 'ppm', 50, 400, 1500),
    (v_stage_id, 'light_intensity', 95, NULL, NULL, '%', NULL, 0, 100),
    (v_stage_id, 'photoperiod', 20, NULL, NULL, 'hrs', NULL, 0, 24);

  INSERT INTO nutrient_formulas (recipe_stage_id, ec_target, ec_min, ec_max, ph_target, ph_min, ph_max, npk_ratio) VALUES
    (v_stage_id, 2.0, 1.7, 2.4, 5.9, 5.6, 6.2, '4-1-2');

  -- ============================================================
  -- RECIPE 3: Lettuce Production (Produce - PrimusGFS)
  -- ============================================================
  
  INSERT INTO recipes (
    id, organization_id, site_id, name, description, owner_id,
    status, current_version, is_template, template_category,
    jurisdiction_types, plant_types, tags
  ) VALUES (
    gen_random_uuid(), v_org_id, v_site_id,
    'Premium Lettuce Mix',
    'Optimized recipe for crisp, flavorful lettuce production',
    v_user_id,
    'published', 1, TRUE, 'produce_lettuce',
    ARRAY['primus_gfs'],
    ARRAY['produce'],
    ARRAY['produce', 'lettuce', 'hydroponic', 'food_safety']
  ) RETURNING id INTO v_recipe_lettuce_id;

  INSERT INTO recipe_versions (
    id, recipe_id, version, created_by, notes, version_data
  ) VALUES (
    gen_random_uuid(), v_recipe_lettuce_id, 1, v_user_id,
    'PrimusGFS compliant lettuce production',
    jsonb_build_object('total_duration_days', 35, 'stages', 2, 'target_yield_heads', 16)
  ) RETURNING id INTO v_version_lettuce_id;

  -- Stage 1: Seedling (10 days)
  INSERT INTO recipe_stages (
    id, recipe_version_id, name, stage_type, order_index, duration_days, description, color_code
  ) VALUES (
    gen_random_uuid(), v_version_lettuce_id, 'Seedling', 'germination', 1, 10,
    'Initial seedling establishment', '#8BC34A'
  ) RETURNING id INTO v_stage_id;

  INSERT INTO environmental_setpoints (recipe_stage_id, parameter_type, value, day_value, night_value, unit, deadband, min_value, max_value) VALUES
    (v_stage_id, 'temperature', 20, 22, 18, '°C', 1, 16, 24),
    (v_stage_id, 'humidity', 70, 65, 75, '%', 5, 60, 85),
    (v_stage_id, 'co2', 600, NULL, NULL, 'ppm', 50, 400, 800),
    (v_stage_id, 'light_intensity', 50, NULL, NULL, '%', NULL, 0, 100),
    (v_stage_id, 'photoperiod', 16, NULL, NULL, 'hrs', NULL, 0, 24);

  INSERT INTO nutrient_formulas (recipe_stage_id, ec_target, ec_min, ec_max, ph_target, ph_min, ph_max, npk_ratio) VALUES
    (v_stage_id, 1.0, 0.8, 1.2, 6.0, 5.8, 6.4, '2-1-2');

  -- Stage 2: Maturation (25 days)
  INSERT INTO recipe_stages (
    id, recipe_version_id, name, stage_type, order_index, duration_days, description, color_code
  ) VALUES (
    gen_random_uuid(), v_version_lettuce_id, 'Maturation', 'vegetative', 2, 25,
    'Head formation and maturation to harvest', '#4CAF50'
  ) RETURNING id INTO v_stage_id;

  INSERT INTO environmental_setpoints (recipe_stage_id, parameter_type, value, day_value, night_value, unit, deadband, min_value, max_value) VALUES
    (v_stage_id, 'temperature', 18, 20, 16, '°C', 1, 14, 22),
    (v_stage_id, 'humidity', 60, 55, 65, '%', 5, 50, 75),
    (v_stage_id, 'co2', 800, NULL, NULL, 'ppm', 50, 400, 1000),
    (v_stage_id, 'light_intensity', 75, NULL, NULL, '%', NULL, 0, 100),
    (v_stage_id, 'photoperiod', 14, NULL, NULL, 'hrs', NULL, 0, 24);

  INSERT INTO nutrient_formulas (recipe_stage_id, ec_target, ec_min, ec_max, ph_target, ph_min, ph_max, npk_ratio) VALUES
    (v_stage_id, 1.4, 1.2, 1.6, 6.2, 5.9, 6.5, '2-1-3');

  -- ============================================================
  -- Sample Schedule
  -- ============================================================
  
  IF v_pod_id IS NOT NULL THEN
    INSERT INTO schedules (
      organization_id, scope_type, scope_id, scope_name,
      timezone, day_start_time, night_start_time,
      created_by
    ) VALUES (
      v_org_id, 'pod', v_pod_id, 'Pod 1',
      'America/Los_Angeles', '06:00:00', '18:00:00',
      v_user_id
    );
  END IF;

  RAISE NOTICE 'Seed data inserted successfully!';
  RAISE NOTICE 'Premium Flower Cycle ID: %', v_recipe_flower_id;
  RAISE NOTICE 'Fast Veg Protocol ID: %', v_recipe_veg_id;
  RAISE NOTICE 'Premium Lettuce Mix ID: %', v_recipe_lettuce_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting seed data: %', SQLERRM;
    RAISE NOTICE 'This is normal if organizations/users don''t exist yet';
END $$;
