-- =====================================================
-- EQUIPMENT CONTROLS TABLE MIGRATION
-- =====================================================
-- Creates the equipment_controls table to support 3-state control (OFF/MANUAL/AUTO)
-- for cultivation facility equipment with metadata tracking
--
-- Migration Date: 2025-11-07
-- Part of: AUTO Mode Implementation (Week 2)
-- Related: /types/equipment.ts, /WEEK1_AUTO_MODE_FINDINGS.md
-- =====================================================

-- =====================================================
-- MAIN TABLE: equipment_controls
-- =====================================================

CREATE TABLE IF NOT EXISTS equipment_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Linkage (to pod - pods table has tagoio_device_token)
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  
  -- Equipment identification
  equipment_type TEXT NOT NULL CHECK (equipment_type IN (
    'cooling',
    'heating', 
    'dehumidifier',
    'humidifier',
    'co2_injection',
    'exhaust_fan',
    'circulation_fan',
    'irrigation',
    'lighting',
    'fogger',
    'hepa_filter',
    'uv_sterilization'
  )),
  
  -- Control state (OFF=0, ON=1, AUTO=2)
  state INTEGER NOT NULL DEFAULT 0 CHECK (state IN (0, 1, 2)),
  
  -- Control mode (MANUAL=0, AUTOMATIC=1)
  mode INTEGER NOT NULL DEFAULT 0 CHECK (mode IN (0, 1)),
  
  -- Override flag (manual override when in AUTO mode)
  override BOOLEAN DEFAULT FALSE,
  
  -- Schedule enabled flag (for time-based AUTO control)
  schedule_enabled BOOLEAN DEFAULT FALSE,
  
  -- Power/intensity level (0-100%)
  level INTEGER DEFAULT 100 CHECK (level >= 0 AND level <= 100),
  
  -- AUTO mode configuration (thresholds, schedules, etc.)
  -- Structure: {
  --   thresholds: { min?: number, max?: number, target?: number },
  --   schedule: { on_time?: string, off_time?: string, days?: number[] },
  --   algorithm: string (e.g., 'pid', 'bang-bang', 'scheduled'),
  --   parameters: { ... } (algorithm-specific params)
  -- }
  auto_config JSONB,
  
  -- Metadata tracking
  last_state_change TIMESTAMPTZ DEFAULT NOW(),
  last_mode_change TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES users(id),
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Primary query patterns: get all equipment for a pod, filter by type
CREATE INDEX idx_equipment_controls_pod ON equipment_controls(pod_id);
CREATE INDEX idx_equipment_controls_pod_type ON equipment_controls(pod_id, equipment_type);

-- For monitoring AUTO mode equipment
CREATE INDEX idx_equipment_controls_mode ON equipment_controls(mode) WHERE mode = 1;

-- For finding active equipment
CREATE INDEX idx_equipment_controls_state ON equipment_controls(state) WHERE state != 0;

-- For finding overrides
CREATE INDEX idx_equipment_controls_override ON equipment_controls(override) WHERE override = TRUE;

-- For time-based queries
CREATE INDEX idx_equipment_controls_updated ON equipment_controls(updated_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_equipment_controls_updated_at 
  BEFORE UPDATE ON equipment_controls
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Track state changes
CREATE OR REPLACE FUNCTION track_equipment_state_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update last_state_change when state changes
  IF NEW.state IS DISTINCT FROM OLD.state THEN
    NEW.last_state_change = NOW();
  END IF;
  
  -- Update last_mode_change when mode changes
  IF NEW.mode IS DISTINCT FROM OLD.mode THEN
    NEW.last_mode_change = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_equipment_state_change_trigger
  BEFORE UPDATE ON equipment_controls
  FOR EACH ROW
  EXECUTE FUNCTION track_equipment_state_change();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE equipment_controls ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user can access pod
CREATE OR REPLACE FUNCTION user_can_access_pod(user_id UUID, target_pod_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_org_id UUID;
  pod_org_id UUID;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO user_org_id
  FROM users
  WHERE id = user_id;
  
  -- Get pod's organization (via site)
  SELECT s.organization_id INTO pod_org_id
  FROM pods p
  JOIN sites s ON p.site_id = s.id
  WHERE p.id = target_pod_id;
  
  -- User can access if they're in the same organization
  RETURN user_org_id = pod_org_id;
END;
$$;

-- RLS Policy: Users can view equipment controls for pods in their organization
CREATE POLICY equipment_controls_select_policy
  ON equipment_controls
  FOR SELECT
  USING (user_can_access_pod(auth.uid(), pod_id));

-- RLS Policy: Only operators+ can insert equipment controls
CREATE POLICY equipment_controls_insert_policy
  ON equipment_controls
  FOR INSERT
  WITH CHECK (
    user_can_access_pod(auth.uid(), pod_id)
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('operator', 'grower', 'manager', 'admin')
    )
  );

-- RLS Policy: Only operators+ can update equipment controls
CREATE POLICY equipment_controls_update_policy
  ON equipment_controls
  FOR UPDATE
  USING (
    user_can_access_pod(auth.uid(), pod_id)
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('operator', 'grower', 'manager', 'admin')
    )
  )
  WITH CHECK (
    user_can_access_pod(auth.uid(), pod_id)
  );

-- RLS Policy: Only managers+ can delete equipment controls
CREATE POLICY equipment_controls_delete_policy
  ON equipment_controls
  FOR DELETE
  USING (
    user_can_access_pod(auth.uid(), pod_id)
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE equipment_controls IS 'Tracks equipment control states with support for 3-state control (OFF/MANUAL/AUTO) and automated control configurations';

COMMENT ON COLUMN equipment_controls.state IS 'Equipment state: OFF=0, ON=1, AUTO=2';
COMMENT ON COLUMN equipment_controls.mode IS 'Control mode: MANUAL=0, AUTOMATIC=1';
COMMENT ON COLUMN equipment_controls.override IS 'Manual override flag when in AUTO mode';
COMMENT ON COLUMN equipment_controls.schedule_enabled IS 'Time-based schedule enabled for AUTO mode';
COMMENT ON COLUMN equipment_controls.level IS 'Power/intensity level (0-100%)';
COMMENT ON COLUMN equipment_controls.auto_config IS 'AUTO mode configuration including thresholds, schedules, and algorithm parameters';

-- =====================================================
-- UPDATE telemetry_readings TABLE
-- =====================================================
-- Add equipment_states JSONB column to store enhanced equipment data

ALTER TABLE telemetry_readings 
ADD COLUMN IF NOT EXISTS equipment_states JSONB;

CREATE INDEX IF NOT EXISTS idx_telemetry_equipment_states 
  ON telemetry_readings USING GIN (equipment_states);

COMMENT ON COLUMN telemetry_readings.equipment_states IS 'Enhanced equipment control states with metadata (mode, schedule, override, level) - complements boolean equipment columns';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
