-- =====================================================
-- RECIPE MANAGEMENT ENHANCEMENT MIGRATION
-- Phase 11: Recipe Management & Environmental Control
-- Date: 2025-11-11
-- =====================================================
--
-- This migration enhances the existing recipe schema to support:
-- - Recipe versioning with full history
-- - Multi-stage recipes with separate setpoints per stage
-- - Advanced setpoint configuration (day/night, ramps, deadbands, min/max)
-- - Schedule management with timezone awareness
-- - Batch group assignments
-- - Enhanced control overrides with precedence and TTL
-- - Comprehensive audit logging
--
-- =====================================================

-- =====================================================
-- STEP 1: Backup existing recipes table as legacy
-- =====================================================

-- Rename old recipes table to preserve existing data
ALTER TABLE IF EXISTS recipes RENAME TO recipes_legacy;
ALTER TABLE IF EXISTS recipe_applications RENAME TO recipe_applications_legacy;
ALTER TABLE IF EXISTS control_overrides RENAME TO control_overrides_legacy;

-- =====================================================
-- STEP 2: Create enhanced recipe schema
-- =====================================================

-- Main recipes table (metadata only)
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE, -- Optional: site-specific recipes
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id),
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'applied', 'deprecated', 'archived')),
  
  -- Versioning
  current_version INTEGER NOT NULL DEFAULT 1,
  
  -- Template management
  is_template BOOLEAN DEFAULT FALSE,
  template_category TEXT, -- 'cannabis_flower', 'cannabis_veg', 'produce_lettuce', etc.
  
  -- Jurisdiction compliance
  jurisdiction_types TEXT[], -- ['oregon_metrc', 'maryland_metrc', 'canada_ctls', 'primus_gfs']
  plant_types TEXT[] CHECK (plant_types <@ ARRAY['cannabis', 'produce']::TEXT[]),
  
  -- Metadata
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  
  CONSTRAINT unique_recipe_name_per_org UNIQUE (organization_id, name)
);

-- Recipe versions (immutable history)
CREATE TABLE recipe_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  
  -- Change tracking
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT, -- Version notes explaining changes
  diff_summary TEXT, -- Human-readable summary of changes from previous version
  
  -- Complete snapshot of recipe at this version
  version_data JSONB NOT NULL, -- Full recipe configuration
  
  CONSTRAINT unique_recipe_version UNIQUE (recipe_id, version)
);

-- Recipe stages (germination, vegetative, flowering, harvest, etc.)
CREATE TABLE recipe_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_version_id UUID NOT NULL REFERENCES recipe_versions(id) ON DELETE CASCADE,
  
  -- Stage definition
  name TEXT NOT NULL, -- 'Germination', 'Vegetative', 'Flowering', 'Harvest', etc.
  stage_type TEXT CHECK (stage_type IN ('germination', 'clone', 'vegetative', 'flowering', 'harvest', 'drying', 'curing')),
  order_index INTEGER NOT NULL, -- Sequence order
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  
  -- Stage metadata
  description TEXT,
  color_code TEXT, -- For UI visualization
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_stage_order UNIQUE (recipe_version_id, order_index)
);

-- Environmental setpoints for each stage
CREATE TABLE environmental_setpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_stage_id UUID NOT NULL REFERENCES recipe_stages(id) ON DELETE CASCADE,
  
  -- Setpoint type
  parameter_type TEXT NOT NULL CHECK (parameter_type IN (
    'temperature', 'humidity', 'vpd', 'co2', 'light_intensity', 'photoperiod',
    'air_flow', 'air_pressure', 'irrigation_frequency', 'irrigation_duration'
  )),
  
  -- Target values
  value DECIMAL(10,2), -- Single value or average
  day_value DECIMAL(10,2), -- Day period value (if different)
  night_value DECIMAL(10,2), -- Night period value (if different)
  unit TEXT NOT NULL, -- '°C', '%', 'kPa', 'ppm', 'hrs', 'L/min', etc.
  
  -- Ramp transitions (gradual changes)
  ramp_enabled BOOLEAN DEFAULT FALSE,
  ramp_start_value DECIMAL(10,2),
  ramp_end_value DECIMAL(10,2),
  ramp_duration_minutes INTEGER,
  
  -- Tolerance and limits
  deadband DECIMAL(10,2), -- Acceptable deviation before correction
  min_value DECIMAL(10,2), -- Safety minimum
  max_value DECIMAL(10,2), -- Safety maximum
  
  -- Priority and control
  priority INTEGER DEFAULT 50, -- Higher priority setpoints take precedence
  enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_setpoint_per_stage UNIQUE (recipe_stage_id, parameter_type)
);

-- Nutrient formulas (EC/pH targets, future expansion for specific nutrients)
CREATE TABLE nutrient_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_stage_id UUID NOT NULL REFERENCES recipe_stages(id) ON DELETE CASCADE,
  
  -- EC and pH targets
  ec_target DECIMAL(4,1), -- Electrical conductivity (mS/cm)
  ec_min DECIMAL(4,1),
  ec_max DECIMAL(4,1),
  ph_target DECIMAL(3,1),
  ph_min DECIMAL(3,1),
  ph_max DECIMAL(3,1),
  
  -- Water quality
  water_temp_c DECIMAL(4,1),
  dissolved_oxygen_ppm DECIMAL(5,1),
  
  -- Future: Detailed nutrient breakdown
  npk_ratio TEXT, -- e.g., "3-1-2"
  nutrient_details JSONB, -- Flexible structure for specific nutrients
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe activations (when recipes are applied to batches/pods)
CREATE TABLE recipe_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  recipe_version_id UUID NOT NULL REFERENCES recipe_versions(id),
  
  -- Application scope
  scope_type TEXT NOT NULL CHECK (scope_type IN ('pod', 'room', 'batch', 'batch_group')),
  scope_id UUID NOT NULL, -- References pods.id, rooms.id, batches.id, or batch_groups.id
  scope_name TEXT, -- Cached name for display
  
  -- Activation details
  activated_by UUID NOT NULL REFERENCES users(id),
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  
  -- Current state
  current_stage_id UUID REFERENCES recipe_stages(id),
  current_stage_day INTEGER DEFAULT 1,
  stage_started_at TIMESTAMPTZ,
  
  -- Deactivation
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES users(id),
  deactivation_reason TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_paused BOOLEAN DEFAULT FALSE,
  paused_at TIMESTAMPTZ,
  paused_by UUID REFERENCES users(id),
  
  -- Metrics
  adherence_score DECIMAL(5,2), -- Percentage adherence to setpoints
  alerts_triggered INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules (timezone-aware day/night cycles)
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Scope (where schedule applies)
  scope_type TEXT NOT NULL CHECK (scope_type IN ('site', 'room', 'pod', 'batch_group')),
  scope_id UUID NOT NULL,
  scope_name TEXT,
  
  -- Timezone
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  
  -- Day/night timing
  day_start_time TIME NOT NULL DEFAULT '06:00:00',
  night_start_time TIME NOT NULL DEFAULT '18:00:00',
  
  -- Blackout windows (no changes allowed)
  blackout_windows JSONB, -- [{ start: "HH:mm", end: "HH:mm", reason: "..." }]
  
  -- Active recipe
  active_recipe_activation_id UUID REFERENCES recipe_activations(id),
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_schedule_per_scope UNIQUE (scope_type, scope_id)
);

-- Batch groups (for managing multiple batches together)
CREATE TABLE batch_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pod assignments
  pod_ids UUID[], -- Array of pod IDs in this group
  
  -- Active recipe
  active_recipe_activation_id UUID REFERENCES recipe_activations(id),
  
  -- Current stage tracking
  current_stage_type TEXT,
  current_stage_day INTEGER,
  stage_started_at TIMESTAMPTZ,
  
  -- Schedule
  scheduled_activation_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_batch_group_name UNIQUE (organization_id, name)
);

-- Enhanced control overrides with precedence and TTL
CREATE TABLE control_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scope
  scope_type TEXT NOT NULL CHECK (scope_type IN ('pod', 'room', 'batch_group', 'site')),
  scope_id UUID NOT NULL,
  scope_name TEXT,
  
  -- Override details
  parameter TEXT NOT NULL, -- 'temperature', 'humidity', 'light_intensity', etc.
  current_value DECIMAL(10,2),
  override_value DECIMAL(10,2),
  unit TEXT NOT NULL,
  
  -- Precedence hierarchy
  precedence TEXT NOT NULL CHECK (precedence IN ('safety', 'e_stop', 'manual_override', 'recipe', 'demand_response')),
  precedence_level INTEGER NOT NULL DEFAULT 50, -- Higher number = higher precedence
  
  -- Status
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'active', 'reverted', 'blocked', 'escalated', 'expired')),
  
  -- TTL (Time To Live) - auto-revert
  ttl_seconds INTEGER, -- Duration before auto-revert
  expires_at TIMESTAMPTZ,
  auto_revert BOOLEAN DEFAULT TRUE,
  
  -- Reason and approval
  reason TEXT NOT NULL,
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- Actor tracking
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  
  -- Reversion
  reverted_at TIMESTAMPTZ,
  reverted_by UUID REFERENCES users(id),
  revert_reason TEXT,
  
  -- Safety
  safety_checked BOOLEAN DEFAULT FALSE,
  safety_checked_by UUID REFERENCES users(id),
  safety_notes TEXT,
  
  -- Recipe override tracking
  overridden_recipe_activation_id UUID REFERENCES recipe_activations(id),
  
  CONSTRAINT check_ttl_with_expires CHECK (
    (ttl_seconds IS NULL AND expires_at IS NULL) OR
    (ttl_seconds IS NOT NULL AND expires_at IS NOT NULL)
  )
);

-- Control override logs (immutable audit trail)
CREATE TABLE control_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Event type
  event_type TEXT NOT NULL CHECK (event_type IN (
    'override_requested', 'override_activated', 'override_reverted', 
    'override_expired', 'override_blocked', 'setpoint_changed', 
    'recipe_activated', 'recipe_deactivated', 'stage_advanced'
  )),
  
  -- Scope
  scope_type TEXT NOT NULL,
  scope_id UUID NOT NULL,
  scope_name TEXT,
  
  -- Actor
  actor_id UUID REFERENCES users(id),
  actor_name TEXT,
  actor_role TEXT,
  
  -- Details
  parameter TEXT,
  value_before TEXT,
  value_after TEXT,
  reason TEXT,
  
  -- Related records
  override_id UUID REFERENCES control_overrides(id),
  recipe_activation_id UUID REFERENCES recipe_activations(id),
  
  -- Metadata
  metadata JSONB,
  ip_address INET,
  user_agent TEXT
);

-- =====================================================
-- STEP 3: Create indexes for performance
-- =====================================================

-- Recipe indexes
CREATE INDEX idx_recipes_org_id ON recipes(organization_id);
CREATE INDEX idx_recipes_status ON recipes(status);
CREATE INDEX idx_recipes_site_id ON recipes(site_id) WHERE site_id IS NOT NULL;
CREATE INDEX idx_recipes_plant_types ON recipes USING GIN(plant_types);

-- Recipe versions indexes
CREATE INDEX idx_recipe_versions_recipe_id ON recipe_versions(recipe_id);
CREATE INDEX idx_recipe_versions_created_at ON recipe_versions(created_at DESC);

-- Recipe stages indexes
CREATE INDEX idx_recipe_stages_version_id ON recipe_stages(recipe_version_id);
CREATE INDEX idx_recipe_stages_order ON recipe_stages(recipe_version_id, order_index);

-- Setpoints indexes
CREATE INDEX idx_setpoints_stage_id ON environmental_setpoints(recipe_stage_id);
CREATE INDEX idx_setpoints_parameter_type ON environmental_setpoints(parameter_type);

-- Activations indexes
CREATE INDEX idx_activations_recipe_id ON recipe_activations(recipe_id);
CREATE INDEX idx_activations_scope ON recipe_activations(scope_type, scope_id);
CREATE INDEX idx_activations_active ON recipe_activations(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_activations_activated_at ON recipe_activations(activated_at DESC);

-- Schedules indexes
CREATE INDEX idx_schedules_org_id ON schedules(organization_id);
CREATE INDEX idx_schedules_scope ON schedules(scope_type, scope_id);

-- Batch groups indexes
CREATE INDEX idx_batch_groups_org_id ON batch_groups(organization_id);
CREATE INDEX idx_batch_groups_site_id ON batch_groups(site_id);
CREATE INDEX idx_batch_groups_pods ON batch_groups USING GIN(pod_ids);

-- Control overrides indexes
CREATE INDEX idx_overrides_scope ON control_overrides(scope_type, scope_id);
CREATE INDEX idx_overrides_status ON control_overrides(status);
CREATE INDEX idx_overrides_active ON control_overrides(status, expires_at) WHERE status = 'active';
CREATE INDEX idx_overrides_created_at ON control_overrides(created_at DESC);

-- Control logs indexes
CREATE INDEX idx_control_logs_timestamp ON control_logs(timestamp DESC);
CREATE INDEX idx_control_logs_scope ON control_logs(scope_type, scope_id);
CREATE INDEX idx_control_logs_event_type ON control_logs(event_type);
CREATE INDEX idx_control_logs_actor ON control_logs(actor_id) WHERE actor_id IS NOT NULL;

-- =====================================================
-- STEP 4: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_setpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_logs ENABLE ROW LEVEL SECURITY;

-- Recipes policies
CREATE POLICY "Users can view recipes in their organization"
  ON recipes FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can create recipes"
  ON recipes FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Recipe owners and admins can update recipes"
  ON recipes FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = recipes.organization_id
      AND role IN ('org_admin', 'site_manager', 'head_grower')
    )
  );

CREATE POLICY "Admins can delete recipes"
  ON recipes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = recipes.organization_id
      AND role IN ('org_admin', 'site_manager')
    )
  );

-- Recipe versions policies (read-only for most users)
CREATE POLICY "Users can view recipe versions in their organization"
  ON recipe_versions FOR SELECT
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Authorized users can create recipe versions"
  ON recipe_versions FOR INSERT
  WITH CHECK (
    recipe_id IN (
      SELECT id FROM recipes WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Recipe stages policies (inherit from recipe_versions)
CREATE POLICY "Users can view recipe stages"
  ON recipe_stages FOR SELECT
  USING (
    recipe_version_id IN (
      SELECT rv.id FROM recipe_versions rv
      JOIN recipes r ON rv.recipe_id = r.id
      WHERE r.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Authorized users can manage recipe stages"
  ON recipe_stages FOR ALL
  USING (
    recipe_version_id IN (
      SELECT rv.id FROM recipe_versions rv
      JOIN recipes r ON rv.recipe_id = r.id
      WHERE r.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Environmental setpoints policies
CREATE POLICY "Users can view setpoints"
  ON environmental_setpoints FOR SELECT
  USING (
    recipe_stage_id IN (
      SELECT rs.id FROM recipe_stages rs
      JOIN recipe_versions rv ON rs.recipe_version_id = rv.id
      JOIN recipes r ON rv.recipe_id = r.id
      WHERE r.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Authorized users can manage setpoints"
  ON environmental_setpoints FOR ALL
  USING (
    recipe_stage_id IN (
      SELECT rs.id FROM recipe_stages rs
      JOIN recipe_versions rv ON rs.recipe_version_id = rv.id
      JOIN recipes r ON rv.recipe_id = r.id
      WHERE r.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Nutrient formulas policies
CREATE POLICY "Users can view nutrient formulas"
  ON nutrient_formulas FOR SELECT
  USING (
    recipe_stage_id IN (
      SELECT rs.id FROM recipe_stages rs
      JOIN recipe_versions rv ON rs.recipe_version_id = rv.id
      JOIN recipes r ON rv.recipe_id = r.id
      WHERE r.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Authorized users can manage nutrient formulas"
  ON nutrient_formulas FOR ALL
  USING (
    recipe_stage_id IN (
      SELECT rs.id FROM recipe_stages rs
      JOIN recipe_versions rv ON rs.recipe_version_id = rv.id
      JOIN recipes r ON rv.recipe_id = r.id
      WHERE r.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Recipe activations policies
CREATE POLICY "Users can view activations in their organization"
  ON recipe_activations FOR SELECT
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Authorized users can create activations"
  ON recipe_activations FOR INSERT
  WITH CHECK (
    recipe_id IN (
      SELECT id FROM recipes WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Authorized users can update activations"
  ON recipe_activations FOR UPDATE
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Schedules policies
CREATE POLICY "Users can view schedules in their organization"
  ON schedules FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can manage schedules"
  ON schedules FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Batch groups policies
CREATE POLICY "Users can view batch groups in their organization"
  ON batch_groups FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can manage batch groups"
  ON batch_groups FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Control overrides policies
CREATE POLICY "Users can view overrides in their organization"
  ON control_overrides FOR SELECT
  USING (
    scope_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Authorized users can create overrides"
  ON control_overrides FOR INSERT
  WITH CHECK (
    scope_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Override creators can update their overrides"
  ON control_overrides FOR UPDATE
  USING (created_by = auth.uid());

-- Control logs policies (read-only)
CREATE POLICY "Users can view control logs in their organization"
  ON control_logs FOR SELECT
  USING (
    scope_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert control logs"
  ON control_logs FOR INSERT
  WITH CHECK (true); -- Allow all inserts (system-generated)

-- =====================================================
-- STEP 5: Add comments for documentation
-- =====================================================

COMMENT ON TABLE recipes IS 'Recipe metadata and versioning container';
COMMENT ON TABLE recipe_versions IS 'Immutable version history for recipes';
COMMENT ON TABLE recipe_stages IS 'Individual stages within a recipe (germination, veg, flower, etc.)';
COMMENT ON TABLE environmental_setpoints IS 'Detailed environmental targets for each stage';
COMMENT ON TABLE nutrient_formulas IS 'EC, pH, and nutrient targets for each stage';
COMMENT ON TABLE recipe_activations IS 'Records of recipes applied to pods, rooms, batches, or batch groups';
COMMENT ON TABLE schedules IS 'Timezone-aware day/night schedules with blackout windows';
COMMENT ON TABLE batch_groups IS 'Logical groupings of batches and pods sharing the same recipe';
COMMENT ON TABLE control_overrides IS 'Manual environmental control overrides with precedence and TTL';
COMMENT ON TABLE control_logs IS 'Immutable audit trail of all environmental control changes';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
