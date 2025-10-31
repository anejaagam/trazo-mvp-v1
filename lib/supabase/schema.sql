-- =====================================================
-- TRAZO MVP DATABASE SCHEMA
-- Comprehensive schema for all integrated features
-- Version: 1.0
-- Date: October 16, 2025
-- 
-- Change Log:
-- - 2025-10-29: Inventory transfer trigger consolidated and corrected
--   - Transfers are quantity-neutral (delta = 0)
--   - Removed duplicate trigger/function definitions to avoid double updates
--   - Kept a single AFTER INSERT trigger: trigger_update_inventory_quantity
-- =====================================================

-- =====================================================
-- ORGANIZATIONS & SITES
-- =====================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  data_region TEXT NOT NULL CHECK (data_region IN ('us', 'canada')),
  jurisdiction TEXT NOT NULL, -- 'oregon_cannabis', 'maryland_cannabis', 'canada_cannabis', 'primus_gfs'
  plant_type TEXT NOT NULL CHECK (plant_type IN ('cannabis', 'produce')),
  license_number TEXT, -- State/provincial license number
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  max_pods INTEGER DEFAULT 48,
  site_license_number TEXT, -- Site-specific license if required
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity_pods INTEGER DEFAULT 8,
  room_type TEXT CHECK (room_type IN ('veg', 'flower', 'mother', 'clone', 'dry', 'cure', 'mixed', 'processing', 'storage')),
  dimensions_length_ft DECIMAL(8,2),
  dimensions_width_ft DECIMAL(8,2),
  dimensions_height_ft DECIMAL(8,2),
  environmental_zone TEXT, -- For grouping rooms with similar environmental needs
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pod_serial_number TEXT UNIQUE,
  gcu_address INTEGER, -- DemeGrow GCU Modbus address
  tagoio_device_id TEXT, -- TagoIO device identifier
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'offline', 'decommissioned')),
  current_batch_id UUID, -- FK to batches (nullable)
  canopy_area_sqft DECIMAL(8,2) DEFAULT 16.0,
  max_plant_count INTEGER DEFAULT 16,
  installation_date DATE,
  last_calibration DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USERS & RBAC
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN (
    'org_admin', 'site_manager', 'head_grower', 'operator', 
    'compliance_qa', 'executive_viewer', 'installer_tech', 'support'
  )),
  status TEXT DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'deactivated')),
  idp TEXT DEFAULT 'local' CHECK (idp IN ('local', 'google', 'microsoft', 'okta')),
  additional_permissions TEXT[], -- Array of additional permission keys
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_email TEXT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  last_sign_in TIMESTAMPTZ,
  role_assigned_at TIMESTAMPTZ DEFAULT NOW(),
  role_assigned_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-to-Site assignments (for site-scoped roles)
CREATE TABLE user_site_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, site_id)
);

-- Action-level permissions tracking
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL, -- e.g. 'batch:create', 'inventory:delete'
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For time-limited permissions
  reason TEXT, -- Why this permission was granted
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, permission_key)
);

-- =====================================================
-- BATCHES & CULTIVATION
-- =====================================================

CREATE TABLE cultivars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  strain_type TEXT CHECK (strain_type IN ('indica', 'sativa', 'hybrid', 'cbd', 'auto', 'produce')),
  genetics TEXT, -- Parent strains or genetics info
  breeder TEXT,
  thc_range_min DECIMAL(5,2),
  thc_range_max DECIMAL(5,2),
  cbd_range_min DECIMAL(5,2),
  cbd_range_max DECIMAL(5,2),
  flowering_days INTEGER,
  harvest_notes TEXT,
  grow_characteristics TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL UNIQUE,
  cultivar_id UUID REFERENCES cultivars(id),
  stage TEXT NOT NULL CHECK (stage IN (
    'planning', 'germination', 'clone', 'vegetative', 'flowering', 
    'harvest', 'drying', 'curing', 'packaging', 'completed', 'destroyed'
  )),
  plant_count INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  parent_batch_id UUID REFERENCES batches(id), -- For genealogy
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'quarantined', 'completed', 'destroyed')),
  
  -- Jurisdiction-specific fields
  metrc_batch_id TEXT, -- For Oregon/Maryland
  license_number TEXT, -- For compliance
  
  -- Tracking fields
  source_type TEXT CHECK (source_type IN ('seed', 'clone', 'tissue_culture')),
  source_batch_id UUID REFERENCES batches(id),
  
  -- Metrics
  yield_weight_g DECIMAL(10,2),
  yield_units INTEGER,
  waste_weight_g DECIMAL(10,2),
  
  -- Quarantine
  quarantine_reason TEXT,
  quarantined_at TIMESTAMPTZ,
  quarantined_by UUID REFERENCES users(id),
  quarantine_released_at TIMESTAMPTZ,
  quarantine_released_by UUID REFERENCES users(id),
  
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch-to-Pod assignments (for Pods-as-a-Batch)
CREATE TABLE batch_pod_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES users(id),
  plant_count INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(batch_id, pod_id, assigned_at)
);

-- Batch lifecycle events
CREATE TABLE batch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'stage_change', 'plant_count_update', 'pod_assignment', 
    'pod_removal', 'quarantine', 'quarantine_release', 'harvest', 
    'destruction', 'note_added', 'recipe_applied'
  )),
  from_value JSONB,
  to_value JSONB,
  user_id UUID NOT NULL REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  evidence_urls TEXT[] -- Array of photo/document URLs
);

-- Plant tagging (for individual plant tracking in Metrc jurisdictions)
CREATE TABLE plant_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  tag_number TEXT NOT NULL UNIQUE,
  metrc_tag_id TEXT,
  plant_state TEXT CHECK (plant_state IN ('immature', 'vegetative', 'flowering', 'harvested', 'destroyed')),
  location_pod_id UUID REFERENCES pods(id),
  tagged_at TIMESTAMPTZ DEFAULT NOW(),
  tagged_by UUID REFERENCES users(id),
  destroyed_at TIMESTAMPTZ,
  destroyed_by UUID REFERENCES users(id),
  destruction_reason TEXT,
  created_by UUID NOT NULL REFERENCES users(id)
);

-- =====================================================
-- INVENTORY MANAGEMENT
-- =====================================================

CREATE TABLE inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  track_lot_numbers BOOLEAN DEFAULT TRUE,
  track_expiry BOOLEAN DEFAULT TRUE,
  require_coa BOOLEAN DEFAULT FALSE, -- Certificate of Analysis
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  category_id UUID REFERENCES inventory_categories(id),
  item_type TEXT NOT NULL CHECK (item_type IN (
    'co2_tank', 'filter', 'nutrient', 'chemical', 'packaging', 
    'sanitation', 'equipment', 'seeds', 'clones', 'growing_medium', 'other'
  )),
  name TEXT NOT NULL,
  sku TEXT,
  unit_of_measure TEXT NOT NULL, -- 'kg', 'L', 'unit', 'tank', 'each'
  current_quantity DECIMAL(10,2) DEFAULT 0,
  reserved_quantity DECIMAL(10,2) DEFAULT 0, -- Reserved for scheduled tasks
  minimum_quantity DECIMAL(10,2), -- Par level
  maximum_quantity DECIMAL(10,2),
  reorder_point DECIMAL(10,2),
  storage_location TEXT,
  lot_number TEXT,
  expiry_date DATE,
  cost_per_unit DECIMAL(10,2),
  supplier_name TEXT,
  supplier_contact TEXT,
  material_safety_data_sheet_url TEXT,
  certificate_of_analysis_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lot tracking for batch/expiry management
CREATE TABLE inventory_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  lot_code TEXT NOT NULL, -- Lot/batch number from supplier or internal
  quantity_received DECIMAL(10,2) NOT NULL,
  quantity_remaining DECIMAL(10,2) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  
  -- Tracking information
  received_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date DATE,
  manufacture_date DATE,
  
  -- Supplier/Source information
  supplier_name TEXT,
  purchase_order_number TEXT,
  invoice_number TEXT,
  cost_per_unit DECIMAL(10,2),
  
  -- Compliance documentation
  certificate_of_analysis_url TEXT,
  material_safety_data_sheet_url TEXT,
  test_results_url TEXT,
  
  -- Compliance tracking (for jurisdictions requiring package UIDs)
  compliance_package_uid TEXT, -- Metrc UID, CTLS tracking number, etc.
  compliance_package_type TEXT, -- For categorization in compliance systems
  
  storage_location TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE, -- False when lot is fully consumed
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES inventory_lots(id), -- Track which lot was used
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'receive', 'consume', 'transfer', 'adjust', 'dispose', 'return', 'reserve', 'unreserve'
  )),
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2), -- Cost at time of movement
  from_location TEXT,
  to_location TEXT,
  
  -- Attribution
  batch_id UUID REFERENCES batches(id), -- Attribution to batch
  task_id UUID, -- Will reference tasks table when created
  purchase_order_number TEXT,
  invoice_number TEXT,
  
  reason TEXT,
  notes TEXT,
  photo_urls TEXT[],
  performed_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Low stock alerts
CREATE TABLE inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'expiring', 'expired', 'out_of_stock')),
  threshold_value DECIMAL(10,2),
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- WASTE TRACKING
-- =====================================================

CREATE TABLE waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  waste_type TEXT NOT NULL CHECK (waste_type IN (
    'plant_material', 'trim', 'chemical', 'packaging', 'equipment', 
    'growing_medium', 'other'
  )),
  source_type TEXT CHECK (source_type IN ('batch', 'inventory', 'general', 'processing')),
  source_id UUID, -- batch_id or item_id
  quantity DECIMAL(10,2) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  reason TEXT NOT NULL, -- Jurisdiction-specific reasons
  disposal_method TEXT NOT NULL, -- 'compost', 'hazardous_waste', 'landfill', 'recycle'
  
  -- Compliance requirements
  photo_urls TEXT[], -- Array of photo URLs
  witness_name TEXT, -- For compliance
  witness_signature_url TEXT,
  witness_id_verified BOOLEAN DEFAULT FALSE,
  rendered_unusable BOOLEAN DEFAULT FALSE, -- Required for cannabis
  
  -- Metrc integration
  metrc_disposal_id TEXT, -- For Metrc states
  metrc_package_tags TEXT[], -- Package tags being disposed
  
  disposal_location TEXT,
  performed_by UUID NOT NULL REFERENCES users(id),
  witnessed_by UUID REFERENCES users(id),
  disposed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- =====================================================
-- RECIPES & ENVIRONMENTAL CONTROLS
-- =====================================================

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  stage TEXT NOT NULL CHECK (stage IN ('germination', 'clone', 'vegetative', 'flowering', 'drying', 'curing')),
  description TEXT,
  
  -- Environmental targets (day period)
  temp_day_c DECIMAL(4,1),
  humidity_day_pct DECIMAL(4,1),
  vpd_day_kpa DECIMAL(3,2),
  co2_day_ppm INTEGER,
  
  -- Environmental targets (night period)
  temp_night_c DECIMAL(4,1),
  humidity_night_pct DECIMAL(4,1),
  vpd_night_kpa DECIMAL(3,2),
  co2_night_ppm INTEGER,
  
  -- Lighting
  photoperiod_hours DECIMAL(3,1),
  light_intensity_pct INTEGER,
  light_spectrum JSONB, -- Flexible structure for spectrum settings
  
  -- Irrigation (if available)
  irrigation_frequency_per_day INTEGER,
  irrigation_duration_minutes INTEGER,
  ec_target DECIMAL(4,1), -- Electrical conductivity
  ph_target DECIMAL(3,1),
  
  -- Air circulation
  exhaust_fan_speed_pct INTEGER,
  circulation_fan_speed_pct INTEGER,
  
  -- Schedule and timing
  day_start_time TIME DEFAULT '06:00:00',
  night_start_time TIME DEFAULT '18:00:00',
  
  -- Safety limits
  temp_min_c DECIMAL(4,1),
  temp_max_c DECIMAL(4,1),
  humidity_min_pct DECIMAL(4,1),
  humidity_max_pct DECIMAL(4,1),
  
  is_published BOOLEAN DEFAULT FALSE,
  is_template BOOLEAN DEFAULT FALSE, -- System templates vs user recipes
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe applications to pods/batches
CREATE TABLE recipe_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  applied_to_type TEXT NOT NULL CHECK (applied_to_type IN ('pod', 'batch', 'batch_group')),
  applied_to_id UUID NOT NULL, -- pod_id or batch_id
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by UUID NOT NULL REFERENCES users(id),
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  auto_revert_at TIMESTAMPTZ,
  reverted_at TIMESTAMPTZ,
  reverted_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Manual overrides
CREATE TABLE control_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  override_type TEXT NOT NULL CHECK (override_type IN ('manual', 'emergency', 'maintenance', 'safety')),
  parameter TEXT NOT NULL, -- 'temp_setpoint', 'light_intensity', 'co2_enable', etc.
  value_before TEXT,
  value_after TEXT,
  reason TEXT NOT NULL,
  duration_minutes INTEGER,
  auto_revert_at TIMESTAMPTZ,
  safety_checked BOOLEAN DEFAULT FALSE,
  safety_checked_by UUID REFERENCES users(id),
  applied_by UUID NOT NULL REFERENCES users(id),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reverted_at TIMESTAMPTZ,
  reverted_by UUID REFERENCES users(id)
);

-- =====================================================
-- TELEMETRY & MONITORING
-- =====================================================

CREATE TABLE telemetry_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Environmental readings
  temperature_c DECIMAL(4,1),
  humidity_pct DECIMAL(4,1),
  co2_ppm INTEGER,
  vpd_kpa DECIMAL(3,2),
  light_intensity_pct INTEGER,
  
  -- Air quality
  air_pressure_mb DECIMAL(6,1),
  air_flow_cfm DECIMAL(6,1),
  
  -- Equipment states
  cooling_active BOOLEAN,
  heating_active BOOLEAN,
  dehumidifier_active BOOLEAN,
  humidifier_active BOOLEAN,
  co2_injection_active BOOLEAN,
  exhaust_fan_active BOOLEAN,
  circulation_fan_active BOOLEAN,
  lights_on BOOLEAN,
  
  -- System health
  temp_sensor_fault BOOLEAN DEFAULT FALSE,
  humidity_sensor_fault BOOLEAN DEFAULT FALSE,
  co2_sensor_fault BOOLEAN DEFAULT FALSE,
  communication_fault BOOLEAN DEFAULT FALSE,
  
  -- Power and efficiency
  power_consumption_w DECIMAL(8,2),
  water_usage_l DECIMAL(8,2),
  
  -- Recipe tracking
  active_recipe_id UUID REFERENCES recipes(id),
  
  -- Raw data storage
  raw_data JSONB, -- Raw TagoIO or device data for debugging
  data_source TEXT DEFAULT 'tagoio' CHECK (data_source IN ('tagoio', 'manual', 'calculated', 'simulated'))
);

-- Indexes for telemetry performance
CREATE INDEX idx_telemetry_pod_time ON telemetry_readings(pod_id, timestamp DESC);
CREATE INDEX idx_telemetry_timestamp ON telemetry_readings(timestamp DESC);

-- Device status tracking
CREATE TABLE device_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL, -- 'gcu', 'sensor', 'actuator'
  device_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'error', 'maintenance')),
  last_communication TIMESTAMPTZ,
  error_message TEXT,
  firmware_version TEXT,
  hardware_version TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ALARMS & NOTIFICATIONS
-- =====================================================

CREATE TABLE alarm_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  alarm_type TEXT NOT NULL CHECK (alarm_type IN (
    'temperature_high', 'temperature_low', 'humidity_high', 'humidity_low',
    'co2_high', 'co2_low', 'vpd_out_of_range', 'device_offline', 'sensor_fault',
    'power_failure', 'water_leak', 'security_breach', 'door_open'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  threshold_value DECIMAL(10,2),
  threshold_operator TEXT CHECK (threshold_operator IN ('>', '<', '>=', '<=', '=', '!=')),
  time_in_state_seconds INTEGER DEFAULT 300, -- 5 minutes
  applies_to_stage TEXT[], -- Array of batch stages this applies to
  applies_to_pod_types TEXT[], -- Array of pod types/models
  suppression_duration_minutes INTEGER DEFAULT 0, -- Alarm suppression period
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES alarm_policies(id),
  alarm_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  threshold_value DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  duration_seconds INTEGER,
  
  -- Related data
  batch_id UUID REFERENCES batches(id),
  recipe_id UUID REFERENCES recipes(id),
  telemetry_reading_id UUID REFERENCES telemetry_readings(id),
  
  -- Lifecycle
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  escalated_at TIMESTAMPTZ,
  escalated_to_level INTEGER DEFAULT 1,
  
  -- Actions taken
  auto_action_taken TEXT, -- Automatic action taken by system
  override_applied BOOLEAN DEFAULT FALSE,
  
  -- Notes
  ack_note TEXT,
  resolution_note TEXT,
  root_cause TEXT
);

-- Alarm routing (who gets notified)
CREATE TABLE alarm_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES alarm_policies(id),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  notify_role TEXT NOT NULL, -- Role to notify
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  escalation_delay_minutes INTEGER DEFAULT 0, -- Time before escalation
  escalation_level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification delivery tracking
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alarm_id UUID REFERENCES alarms(id),
  user_id UUID REFERENCES users(id),
  channel TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'read'))
);

-- =====================================================
-- TASKS & WORKFLOWS (SOPs)
-- =====================================================

CREATE TABLE sop_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  category TEXT CHECK (category IN (
    'daily', 'weekly', 'monthly', 'harvest', 'maintenance', 'calibration', 
    'cleaning', 'compliance', 'emergency', 'quality_control'
  )), 
  description TEXT,
  steps JSONB NOT NULL, -- Array of step objects with evidence requirements
  estimated_duration_minutes INTEGER,
  required_role TEXT[], -- Roles that can perform this SOP
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_role TEXT, -- Role required to approve completion
  safety_notes TEXT,
  equipment_required TEXT[],
  materials_required JSONB, -- Array of {item_id, quantity} objects
  is_active BOOLEAN DEFAULT TRUE,
  is_template BOOLEAN DEFAULT FALSE, -- System templates vs custom SOPs
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  sop_template_id UUID REFERENCES sop_templates(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'to_do' CHECK (status IN ('to_do', 'in_progress', 'blocked', 'done', 'cancelled', 'approved')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  
  -- Scope (what this task relates to)
  related_to_type TEXT CHECK (related_to_type IN ('pod', 'batch', 'room', 'site', 'inventory_item', 'recipe')),
  related_to_id UUID,
  
  -- Scheduling
  due_date TIMESTAMPTZ,
  scheduled_start TIMESTAMPTZ,
  recurring_pattern TEXT, -- 'daily', 'weekly', 'monthly', 'custom'
  recurring_config JSONB, -- Flexible recurring configuration
  
  -- Completion
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  completion_notes TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  
  -- Evidence (for compliance)
  evidence_photos TEXT[], -- Array of photo URLs
  evidence_documents TEXT[], -- Array of document URLs
  evidence_signatures JSONB, -- Digital signatures
  
  -- Time tracking
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task steps (for SOP execution)
CREATE TABLE task_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  evidence_required BOOLEAN DEFAULT FALSE,
  evidence_type TEXT CHECK (evidence_type IN ('photo', 'signature', 'numeric_reading', 'checkbox', 'text', 'barcode')),
  evidence_value TEXT, -- Flexible storage for evidence
  expected_value TEXT, -- Expected reading or value
  tolerance_range TEXT, -- Acceptable range for readings
  notes TEXT,
  skipped BOOLEAN DEFAULT FALSE,
  skip_reason TEXT
);

-- Task dependencies
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'blocking' CHECK (dependency_type IN ('blocking', 'suggested')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMPLIANCE & EVIDENCE
-- =====================================================

CREATE TABLE compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL, -- 'metrc_monthly', 'ctls_monthly', 'primus_audit', 'internal_audit'
  jurisdiction TEXT NOT NULL, -- jurisdiction this report is for
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'submitted', 'rejected')),
  
  -- Report content
  data_snapshot JSONB, -- Snapshot of relevant data
  report_file_url TEXT, -- Generated PDF/document
  submission_confirmation TEXT, -- Confirmation number from authority
  
  -- Approval workflow
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  
  due_date DATE,
  notes TEXT
);

CREATE TABLE evidence_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('photo', 'video', 'document', 'signature', 'certificate', 'test_result')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  file_hash TEXT, -- SHA-256 hash for integrity verification
  
  -- Context (what this evidence relates to)
  related_to_type TEXT CHECK (related_to_type IN (
    'batch', 'task', 'waste_log', 'inventory_movement', 'compliance_report', 
    'alarm', 'recipe_application', 'control_override'
  )),
  related_to_id UUID,
  
  -- Metadata
  description TEXT,
  tags TEXT[],
  location_taken TEXT, -- GPS coordinates or location description
  device_info TEXT, -- Device/camera used to capture evidence
  
  -- Security and compliance
  is_locked BOOLEAN DEFAULT FALSE, -- For audit protection
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES users(id),
  retention_until DATE, -- When this evidence can be deleted
  
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log (immutable record of all actions)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', etc.
  entity_type TEXT NOT NULL, -- 'batch', 'inventory_item', 'user', 'recipe', etc.
  entity_id UUID,
  entity_name TEXT, -- Human-readable name of the entity
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Organization and site indexes
CREATE INDEX idx_sites_org ON sites(organization_id);
CREATE INDEX idx_rooms_site ON rooms(site_id);
CREATE INDEX idx_pods_room ON pods(room_id);

-- User and RBAC indexes
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);

-- Batch indexes
CREATE INDEX idx_batches_org_site ON batches(organization_id, site_id, stage);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batch_events_batch ON batch_events(batch_id, timestamp DESC);

-- Inventory indexes
CREATE INDEX idx_inventory_org_site ON inventory_items(organization_id, site_id, item_type);
CREATE INDEX idx_inventory_items_expiry ON inventory_items(expiry_date) WHERE expiry_date IS NOT NULL AND is_active = TRUE;
CREATE INDEX idx_inventory_lots_item ON inventory_lots(item_id, is_active);
CREATE INDEX idx_inventory_lots_expiry ON inventory_lots(expiry_date) WHERE expiry_date IS NOT NULL AND is_active = TRUE;
CREATE INDEX idx_inventory_lots_compliance_uid ON inventory_lots(compliance_package_uid) WHERE compliance_package_uid IS NOT NULL;
CREATE INDEX idx_inventory_movements_item ON inventory_movements(item_id, timestamp DESC);
CREATE INDEX idx_inventory_movements_lot ON inventory_movements(lot_id);
CREATE INDEX idx_inventory_movements_batch ON inventory_movements(batch_id);
CREATE INDEX idx_inventory_movements_type_time ON inventory_movements(movement_type, timestamp DESC);
CREATE INDEX idx_inventory_alerts_unack ON inventory_alerts(item_id, alert_type) WHERE is_acknowledged = FALSE;

-- Task indexes
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to, status, due_date);
CREATE INDEX idx_tasks_org_site ON tasks(organization_id, site_id);
CREATE INDEX idx_task_steps_task ON task_steps(task_id, step_number);

-- Alarm indexes
CREATE INDEX idx_alarms_pod_open ON alarms(pod_id, triggered_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_alarms_severity ON alarms(severity, triggered_at DESC);

-- Compliance indexes
CREATE INDEX idx_compliance_reports_org ON compliance_reports(organization_id, report_type);
CREATE INDEX idx_evidence_vault_related ON evidence_vault(related_to_type, related_to_id);

-- Audit log indexes
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id, timestamp DESC);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, timestamp DESC);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);

-- =====================================================
-- VIEWS FOR INVENTORY MANAGEMENT
-- =====================================================

-- View for current stock balances per item
CREATE OR REPLACE VIEW inventory_stock_balances AS
SELECT 
  i.id AS item_id,
  i.organization_id,
  i.site_id,
  i.name AS item_name,
  i.sku,
  i.item_type,
  i.category_id,
  i.unit_of_measure,
  i.current_quantity AS on_hand,
  i.reserved_quantity,
  (i.current_quantity - i.reserved_quantity) AS available,
  i.minimum_quantity AS par_level,
  i.reorder_point,
  CASE 
    WHEN i.current_quantity = 0 THEN 'out_of_stock'
    WHEN i.reorder_point IS NOT NULL AND i.current_quantity <= i.reorder_point THEN 'reorder'
    WHEN i.minimum_quantity IS NOT NULL AND i.current_quantity < i.minimum_quantity THEN 'below_par'
    ELSE 'ok'
  END AS stock_status,
  i.storage_location,
  i.updated_at AS last_updated
FROM inventory_items i
WHERE i.is_active = TRUE;

-- View for lots with remaining quantity
CREATE OR REPLACE VIEW inventory_active_lots AS
SELECT 
  l.id AS lot_id,
  l.item_id,
  i.name AS item_name,
  i.organization_id,
  i.site_id,
  l.lot_code,
  l.quantity_received,
  l.quantity_remaining,
  l.unit_of_measure,
  l.received_date,
  l.expiry_date,
  l.manufacture_date,
  l.supplier_name,
  l.compliance_package_uid,
  l.storage_location,
  CASE 
    WHEN l.expiry_date IS NULL THEN NULL
    WHEN l.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN l.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN l.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring'
    ELSE 'ok'
  END AS expiry_status,
  CASE 
    WHEN l.expiry_date IS NOT NULL THEN (l.expiry_date - CURRENT_DATE)
    ELSE NULL
  END AS days_until_expiry,
  l.created_at,
  l.updated_at
FROM inventory_lots l
JOIN inventory_items i ON l.item_id = i.id
WHERE l.is_active = TRUE AND i.is_active = TRUE AND l.quantity_remaining > 0;

-- View for movement summary by item
CREATE OR REPLACE VIEW inventory_movement_summary AS
SELECT 
  i.id AS item_id,
  i.name AS item_name,
  i.organization_id,
  i.site_id,
  COUNT(m.id) AS total_movements,
  SUM(CASE WHEN m.movement_type = 'receive' THEN m.quantity ELSE 0 END) AS total_received,
  SUM(CASE WHEN m.movement_type = 'consume' THEN m.quantity ELSE 0 END) AS total_consumed,
  SUM(CASE WHEN m.movement_type = 'adjust' THEN m.quantity ELSE 0 END) AS total_adjusted,
  SUM(CASE WHEN m.movement_type = 'dispose' THEN m.quantity ELSE 0 END) AS total_disposed,
  SUM(CASE WHEN m.movement_type = 'transfer' THEN m.quantity ELSE 0 END) AS total_transferred,
  MAX(m.timestamp) AS last_movement_date
FROM inventory_items i
LEFT JOIN inventory_movements m ON i.id = m.item_id
WHERE i.is_active = TRUE
GROUP BY i.id, i.name, i.organization_id, i.site_id;

-- =====================================================
-- HELPER FUNCTIONS FOR INVENTORY
-- =====================================================

-- Function to update item quantity after movement
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  quantity_delta DECIMAL(10,2);
BEGIN
  -- Calculate how much to add or subtract from current_quantity
  quantity_delta := CASE NEW.movement_type
    WHEN 'receive' THEN NEW.quantity
    WHEN 'return' THEN NEW.quantity
    WHEN 'consume' THEN -NEW.quantity
    WHEN 'dispose' THEN -NEW.quantity
    WHEN 'transfer' THEN 0  -- Transfers don't change total quantity, just location
    WHEN 'adjust' THEN NEW.quantity  -- Can be positive or negative
    WHEN 'reserve' THEN 0  -- Doesn't change total, only reserved
    WHEN 'unreserve' THEN 0
    ELSE 0
  END;
  
  -- Update item quantity (on-hand and reserved)
  UPDATE public.inventory_items
  SET 
    current_quantity = current_quantity + quantity_delta,
    reserved_quantity = CASE NEW.movement_type
      WHEN 'reserve' THEN reserved_quantity + NEW.quantity
      WHEN 'unreserve' THEN reserved_quantity - NEW.quantity
      ELSE reserved_quantity
    END,
    updated_at = NOW()
  WHERE id = NEW.item_id;
  
  -- If lot_id is provided, update lot quantity for consume/dispose only
  -- Transfers are quantity-neutral at DB level; location updates handled by API
  IF NEW.lot_id IS NOT NULL AND NEW.movement_type IN ('consume', 'dispose') THEN
    UPDATE public.inventory_lots
    SET 
      quantity_remaining = quantity_remaining - NEW.quantity,
      is_active = CASE WHEN (quantity_remaining - NEW.quantity) <= 0 THEN FALSE ELSE TRUE END,
      updated_at = NOW()
    WHERE id = NEW.lot_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update inventory on movement (single source of truth)
DROP TRIGGER IF EXISTS trigger_update_inventory_quantity ON public.inventory_movements;
CREATE TRIGGER trigger_update_inventory_quantity
AFTER INSERT ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION update_inventory_quantity();

-- Function to check and create inventory alerts
CREATE OR REPLACE FUNCTION check_inventory_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check for low stock
  IF NEW.current_quantity <= NEW.minimum_quantity AND NEW.minimum_quantity IS NOT NULL THEN
    INSERT INTO public.inventory_alerts (item_id, alert_type, threshold_value)
    VALUES (NEW.id, 'low_stock', NEW.minimum_quantity)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Check for out of stock
  IF NEW.current_quantity <= 0 THEN
    INSERT INTO public.inventory_alerts (item_id, alert_type, threshold_value)
    VALUES (NEW.id, 'out_of_stock', 0)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to check alerts on inventory update
CREATE TRIGGER trigger_check_inventory_alerts
AFTER UPDATE OF current_quantity ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION check_inventory_alerts();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- NOTE: Row Level Security policies have been moved to a separate file
-- Apply rls-policies.sql AFTER this schema file has been successfully applied
-- Location: /lib/supabase/rls-policies.sql
--
-- The RLS policies file contains:
-- - ENABLE ROW LEVEL SECURITY for all tables
-- - Helper functions for permission checking
-- - Comprehensive policies for all tables based on roles and organization scope
-- - Policies for audit trail immutability (no updates/deletes on audit tables)

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-create default site for new organizations
CREATE OR REPLACE FUNCTION create_default_site_for_organization()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_default_site
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_site_for_organization();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pods_updated_at BEFORE UPDATE ON pods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultivars_updated_at BEFORE UPDATE ON cultivars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_lots_updated_at BEFORE UPDATE ON inventory_lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sop_templates_updated_at BEFORE UPDATE ON sop_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log all changes to audit_log
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  entity_name_value TEXT;
  org_id_value UUID;
  entity_id_value UUID;
  actor_user_id UUID;
  new_json JSONB;
  old_json JSONB;
BEGIN
  -- Convert records to JSON for flexible extraction
  new_json := to_jsonb(NEW);
  old_json := to_jsonb(OLD);

  -- Determine a human-readable entity name when possible
  entity_name_value := CASE
    WHEN TG_OP = 'DELETE' THEN
      COALESCE(
        old_json->>'name',
        old_json->>'full_name',
        old_json->>'title',
        old_json->>'email',
        'N/A'
      )
    ELSE
      COALESCE(
        new_json->>'name',
        new_json->>'full_name',
        new_json->>'title',
        new_json->>'email',
        'N/A'
      )
  END;

  -- Organization ID handling (inventory_movements does not include org_id directly)
  IF TG_TABLE_NAME = 'inventory_movements' THEN
    IF TG_OP = 'DELETE' THEN
      SELECT organization_id INTO org_id_value
      FROM public.inventory_items
      WHERE id = (old_json->>'item_id')::uuid;
    ELSE
      SELECT organization_id INTO org_id_value
      FROM public.inventory_items
      WHERE id = (new_json->>'item_id')::uuid;
    END IF;
  ELSE
    org_id_value := COALESCE(
      (new_json->>'organization_id')::uuid,
      (old_json->>'organization_id')::uuid
    );
  END IF;

  -- Entity primary key
  entity_id_value := COALESCE(
    (new_json->>'id')::uuid,
    (old_json->>'id')::uuid
  );

  -- Actor attribution: prefer auth.uid(), fall back to common actor columns when using service role
  actor_user_id := COALESCE(
    auth.uid(),
    (new_json->>'performed_by')::uuid,
    (old_json->>'performed_by')::uuid,
    (new_json->>'created_by')::uuid,
    (old_json->>'created_by')::uuid,
    (new_json->>'assigned_by')::uuid,
    (old_json->>'assigned_by')::uuid,
    (new_json->>'applied_by')::uuid,
    (old_json->>'applied_by')::uuid,
    (new_json->>'uploaded_by')::uuid,
    (old_json->>'uploaded_by')::uuid,
    (new_json->>'approved_by')::uuid,
    (old_json->>'approved_by')::uuid,
    (new_json->>'acknowledged_by')::uuid,
    (old_json->>'acknowledged_by')::uuid
  );

  INSERT INTO public.audit_log (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    entity_name,
    old_values,
    new_values
  ) VALUES (
    org_id_value,
    actor_user_id,
    TG_OP,
    TG_TABLE_NAME,
    entity_id_value,
    entity_name_value,
    CASE WHEN TG_OP = 'DELETE' THEN old_json ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN new_json ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit trigger to critical tables
CREATE TRIGGER audit_batches AFTER INSERT OR UPDATE OR DELETE ON batches
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_inventory_items AFTER INSERT OR UPDATE OR DELETE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_inventory_movements AFTER INSERT OR UPDATE OR DELETE ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_waste_logs AFTER INSERT OR UPDATE OR DELETE ON waste_logs
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_recipes AFTER INSERT OR UPDATE OR DELETE ON recipes
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_control_overrides AFTER INSERT OR UPDATE OR DELETE ON control_overrides
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Function to automatically create batch events
CREATE OR REPLACE FUNCTION create_batch_event()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create event for new batches
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.batch_events (batch_id, event_type, to_value, user_id, notes)
    VALUES (NEW.id, 'created', row_to_json(NEW), auth.uid(), 'Batch created');
    RETURN NEW;
  END IF;
  
  -- Create event for stage changes
  IF TG_OP = 'UPDATE' AND OLD.stage != NEW.stage THEN
    INSERT INTO public.batch_events (batch_id, event_type, from_value, to_value, user_id, notes)
    VALUES (NEW.id, 'stage_change', 
           jsonb_build_object('stage', OLD.stage), 
           jsonb_build_object('stage', NEW.stage), 
           auth.uid(), 
           CONCAT('Stage changed from ', OLD.stage, ' to ', NEW.stage));
  END IF;
  
  -- Create event for plant count changes
  IF TG_OP = 'UPDATE' AND OLD.plant_count != NEW.plant_count THEN
    INSERT INTO public.batch_events (batch_id, event_type, from_value, to_value, user_id, notes)
    VALUES (NEW.id, 'plant_count_update',
           jsonb_build_object('plant_count', OLD.plant_count),
           jsonb_build_object('plant_count', NEW.plant_count),
           auth.uid(),
           CONCAT('Plant count changed from ', OLD.plant_count, ' to ', NEW.plant_count));
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER batch_event_trigger 
  AFTER INSERT OR UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION create_batch_event();

-- Function to update inventory quantities after movements
-- Removed duplicate and incorrect inventory update function/trigger definitions
-- (Inventory movement trigger consolidated above; transfers remain quantity-neutral)

-- =====================================================
-- SEED DATA
-- =====================================================

-- NOTE: Seed data has been moved to /lib/supabase/seed-data.ts
-- Run `npm run seed:dev` after schema is applied to populate test data
-- This ensures proper organization IDs and user references

-- =====================================================
-- COMMENTS & DOCUMENTATION
-- =====================================================

COMMENT ON DATABASE postgres IS 'Trazo MVP - Container Farm Operating System Database';

COMMENT ON TABLE organizations IS 'Top-level organizations with jurisdiction and plant type settings';
COMMENT ON TABLE sites IS 'Physical locations within organizations where farming operations occur';
COMMENT ON TABLE rooms IS 'Logical groupings of pods within sites (veg room, flower room, etc.)';
COMMENT ON TABLE pods IS 'Individual growing containers with environmental control systems';

COMMENT ON TABLE users IS 'System users with role-based access control';
COMMENT ON TABLE user_permissions IS 'Additional permissions granted to users beyond their role';

COMMENT ON TABLE batches IS 'Crop batches tracking plant lifecycle from seed to harvest';
COMMENT ON TABLE batch_events IS 'Audit trail of all batch lifecycle events';
COMMENT ON TABLE plant_tags IS 'Individual plant tracking for Metrc compliance jurisdictions';

COMMENT ON TABLE inventory_items IS 'Inventory items including CO2, filters, nutrients, supplies';
COMMENT ON TABLE inventory_movements IS 'All inventory transactions (receive, consume, transfer, etc.)';
COMMENT ON TABLE waste_logs IS 'Waste disposal tracking with jurisdiction-specific compliance';

COMMENT ON TABLE recipes IS 'Environmental control recipes for different growth stages';
COMMENT ON TABLE recipe_applications IS 'History of recipe applications to pods and batches';
COMMENT ON TABLE control_overrides IS 'Manual overrides of environmental controls';

COMMENT ON TABLE telemetry_readings IS 'Time-series environmental data from pods';
COMMENT ON TABLE alarms IS 'Environmental and system alarms with acknowledgment workflow';
COMMENT ON TABLE alarm_policies IS 'Configurable alarm thresholds and rules';

COMMENT ON TABLE tasks IS 'Work tasks including SOPs, maintenance, and compliance activities';
COMMENT ON TABLE sop_templates IS 'Standard Operating Procedure templates';
COMMENT ON TABLE task_steps IS 'Individual steps within SOP tasks with evidence capture';

COMMENT ON TABLE compliance_reports IS 'Regulatory compliance reports by jurisdiction';
COMMENT ON TABLE evidence_vault IS 'Secure storage for compliance evidence (photos, documents)';
COMMENT ON TABLE audit_log IS 'Immutable audit trail of all system actions';

-- =====================================================
-- END OF SCHEMA
-- =====================================================