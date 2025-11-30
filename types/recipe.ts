/**
 * Recipe Management Types
 * 
 * TypeScript interfaces for recipe management system with versioning,
 * multi-stage workflows, environmental setpoints, and control overrides.
 */

// =====================================================
// Enums & Status Types
// =====================================================

export type RecipeStatus = 'draft' | 'published' | 'applied' | 'deprecated' | 'archived'

export type StageType = 
  | 'germination' 
  | 'clone' 
  | 'vegetative' 
  | 'flowering' 
  | 'harvest' 
  | 'drying' 
  | 'curing'

export type SetpointParameterType = 
  | 'temperature' 
  | 'humidity' 
  | 'vpd' 
  | 'co2' 
  | 'light_intensity' 
  | 'photoperiod'
  | 'air_flow' 
  | 'air_pressure' 
  | 'irrigation_frequency' 
  | 'irrigation_duration'

export type RecipeScopeType = 'pod' | 'room' | 'batch' | 'batch_group'

export type OverridePriority = 'emergency' | 'manual' | 'scheduled' | 'recipe' | 'default'

export type OverrideStatus = 'active' | 'expired' | 'cancelled' | 'completed'

export type PlantType = 'cannabis' | 'produce'

export type JurisdictionType = 'oregon_metrc' | 'maryland_metrc' | 'canada_ctls' | 'primus_gfs'

// =====================================================
// Core Recipe Types
// =====================================================

export interface Recipe {
  id: string
  organization_id: string
  site_id?: string | null
  name: string
  description?: string | null
  owner_id: string
  
  // Status workflow
  status: RecipeStatus
  
  // Versioning
  current_version: number
  
  // Template management
  is_template: boolean
  template_category?: string | null
  
  // Jurisdiction compliance
  jurisdiction_types?: JurisdictionType[] | null
  plant_types?: PlantType[] | null
  
  // Metadata
  tags?: string[] | null
  created_at: string
  updated_at: string
  published_at?: string | null
  deprecated_at?: string | null
}

export interface RecipeVersion {
  id: string
  recipe_id: string
  version: number
  
  // Change tracking
  created_by: string
  created_at: string
  notes?: string | null
  diff_summary?: string | null
  
  // Complete snapshot
  version_data: RecipeVersionData
}

export interface RecipeVersionData {
  name: string
  description?: string
  stages: RecipeStageData[]
  metadata?: Record<string, unknown>
}

export interface RecipeStageData {
  name: string
  stage_type?: StageType
  order_index: number
  duration_days: number
  description?: string
  color_code?: string
  setpoints: EnvironmentalSetpointData[]
  nutrient_formula?: NutrientFormulaData
}

// =====================================================
// Recipe Stage Types
// =====================================================

export interface RecipeStage {
  id: string
  recipe_version_id: string
  
  // Stage definition
  name: string
  stage_type?: StageType | null
  order_index: number
  duration_days: number
  
  // Stage metadata
  description?: string | null
  color_code?: string | null
  
  created_at: string
}

export interface RecipeStageWithDetails extends RecipeStage {
  setpoints: EnvironmentalSetpoint[]
  nutrient_formula?: NutrientFormula | null
}

// =====================================================
// Environmental Setpoint Types
// =====================================================

export interface EnvironmentalSetpoint {
  id: string
  recipe_stage_id: string
  
  // Setpoint type
  parameter_type: SetpointParameterType
  
  // Target values
  value?: number | null
  day_value?: number | null
  night_value?: number | null
  unit: string
  
  // Ramp transitions
  ramp_enabled: boolean
  ramp_start_value?: number | null
  ramp_end_value?: number | null
  ramp_duration_minutes?: number | null
  
  // Tolerance and limits
  deadband?: number | null
  min_value?: number | null
  max_value?: number | null
  
  // Priority and control
  priority: number
  enabled: boolean
  
  created_at: string
}

export interface EnvironmentalSetpointData {
  parameter_type: SetpointParameterType
  value?: number
  day_value?: number
  night_value?: number
  unit: string
  ramp_enabled?: boolean
  ramp_start_value?: number
  ramp_end_value?: number
  ramp_duration_minutes?: number
  deadband?: number
  min_value?: number
  max_value?: number
  priority?: number
  enabled?: boolean
}

// =====================================================
// Nutrient Formula Types
// =====================================================

export interface NutrientFormula {
  id: string
  recipe_stage_id: string
  
  // EC and pH targets
  ec_target?: number | null
  ec_min?: number | null
  ec_max?: number | null
  ph_target?: number | null
  ph_min?: number | null
  ph_max?: number | null
  
  // Water quality
  water_temp_c?: number | null
  dissolved_oxygen_ppm?: number | null
  
  // Nutrient details
  npk_ratio?: string | null
  nutrient_details?: Record<string, unknown> | null
  
  notes?: string | null
  created_at: string
}

export interface NutrientFormulaData {
  ec_target?: number
  ec_min?: number
  ec_max?: number
  ph_target?: number
  ph_min?: number
  ph_max?: number
  water_temp_c?: number
  dissolved_oxygen_ppm?: number
  npk_ratio?: string
  nutrient_details?: Record<string, unknown>
  notes?: string
}

// =====================================================
// Recipe Activation Types
// =====================================================

export interface RecipeActivation {
  id: string
  recipe_id: string
  recipe_version_id: string
  
  // Application scope
  scope_type: RecipeScopeType
  scope_id: string
  scope_name?: string | null
  
  // Activation details
  activated_by: string
  activated_at: string
  scheduled_start?: string | null
  scheduled_end?: string | null
  
  // Current state
  current_stage_id?: string | null
  current_stage_day: number
  stage_started_at?: string | null
  
  // Deactivation
  deactivated_at?: string | null
  deactivated_by?: string | null
  deactivation_reason?: string | null
  
  // Status
  is_active: boolean
  is_paused: boolean
  paused_at?: string | null
  paused_by?: string | null
  
  // Metrics
  adherence_score?: number | null
  alerts_triggered: number
}

export interface RecipeActivationWithDetails extends RecipeActivation {
  recipe?: Recipe
  recipe_version?: RecipeVersion
  current_stage?: RecipeStageWithDetails
}

// =====================================================
// Schedule Types
// =====================================================

export interface Schedule {
  id: string
  organization_id: string
  site_id?: string | null
  name: string
  timezone: string
  
  // Day/Night cycle
  day_start_time: string // Format: 'HH:MM:SS'
  day_end_time: string
  
  // Metadata
  created_at: string
  updated_at: string
}

// =====================================================
// Batch Group Types
// =====================================================

export interface BatchGroup {
  id: string
  organization_id: string
  site_id: string
  name: string
  pod_ids?: string[] | null
  active_recipe_activation_id?: string | null
  created_at: string
  updated_at: string
}

// =====================================================
// Control Override Types
// =====================================================

export interface ControlOverride {
  id: string
  organization_id: string
  
  // Scope
  scope_type: RecipeScopeType
  scope_id: string
  
  // Override details
  parameter_type: SetpointParameterType
  override_value: number
  unit: string
  
  // Priority and duration
  priority: OverridePriority
  priority_level: number
  status: OverrideStatus
  
  // Time bounds
  start_time: string
  end_time?: string | null
  ttl_minutes?: number | null
  expires_at?: string | null
  
  // Tracking
  created_by: string
  created_at: string
  cancelled_at?: string | null
  cancelled_by?: string | null
  cancellation_reason?: string | null
  
  // Context
  reason?: string | null
  notes?: string | null
}

export interface ControlOverrideWithDetails extends ControlOverride {
  created_by_user?: { email: string; full_name?: string }
  cancelled_by_user?: { email: string; full_name?: string }
}

// =====================================================
// Control Log Types
// =====================================================

export interface ControlLog {
  id: string
  override_id: string
  event_type: string
  actor_id?: string | null
  event_data?: Record<string, unknown> | null
  created_at: string
}

// =====================================================
// Query Filter Types
// =====================================================

export interface RecipeFilters {
  status?: RecipeStatus | RecipeStatus[]
  plant_type?: PlantType
  jurisdiction_type?: JurisdictionType
  is_template?: boolean
  search?: string
  tags?: string[]
}

export interface RecipeActivationFilters {
  scope_type?: RecipeScopeType
  scope_id?: string
  is_active?: boolean
  recipe_id?: string
}

export interface ControlOverrideFilters {
  scope_type?: RecipeScopeType
  scope_id?: string
  status?: OverrideStatus | OverrideStatus[]
  parameter_type?: SetpointParameterType
  priority?: OverridePriority
  is_active?: boolean
}

// =====================================================
// Insert/Update Types
// =====================================================

export interface InsertRecipe {
  organization_id: string
  site_id?: string
  name: string
  description?: string
  owner_id: string
  status?: RecipeStatus
  is_template?: boolean
  template_category?: string
  jurisdiction_types?: JurisdictionType[]
  plant_types?: PlantType[]
  tags?: string[]
}

export interface UpdateRecipe {
  name?: string
  description?: string
  status?: RecipeStatus
  is_template?: boolean
  template_category?: string
  jurisdiction_types?: JurisdictionType[]
  plant_types?: PlantType[]
  tags?: string[]
  published_at?: string
  deprecated_at?: string
}

export interface InsertRecipeVersion {
  recipe_id: string
  version: number
  created_by: string
  notes?: string
  diff_summary?: string
  version_data: RecipeVersionData
}

export interface InsertControlOverride {
  organization_id: string
  scope_type: RecipeScopeType
  scope_id: string
  parameter_type: SetpointParameterType
  override_value: number
  unit: string
  priority: OverridePriority
  ttl_minutes?: number
  created_by: string
  reason?: string
  notes?: string
}

export interface UpdateControlOverride {
  override_value?: number
  end_time?: string
  ttl_minutes?: number
  reason?: string
  notes?: string
}

// =====================================================
// Response Types
// =====================================================

export interface RecipeWithVersions extends Recipe {
  versions: RecipeVersion[]
  latest_version?: RecipeVersion
  active_activations?: RecipeActivation[]
}

export interface RecipeVersionWithStages extends RecipeVersion {
  stages: RecipeStageWithDetails[]
}

export interface ActiveRecipeDetails {
  activation: RecipeActivationWithDetails
  stages: RecipeStageWithDetails[]
  current_setpoints: EnvironmentalSetpoint[]
  active_overrides: ControlOverride[]
  schedule?: Schedule
}
