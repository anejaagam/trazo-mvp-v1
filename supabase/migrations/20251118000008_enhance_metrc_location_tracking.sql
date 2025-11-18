-- =====================================================
-- Metrc Location Tracking Enhancement
-- =====================================================
-- This migration enhances Metrc location tracking for rooms and pods
-- Supports automatic sync of TRAZO locations to Metrc facilities
-- =====================================================

-- =====================================================
-- 1. ADD METRC LOCATION FIELDS TO ROOMS
-- =====================================================

-- Add Metrc location ID to rooms table
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS metrc_location_id INTEGER,
ADD COLUMN IF NOT EXISTS metrc_location_name TEXT,
ADD COLUMN IF NOT EXISTS metrc_location_type_id INTEGER,
ADD COLUMN IF NOT EXISTS metrc_location_type_name TEXT,
ADD COLUMN IF NOT EXISTS metrc_sync_status TEXT DEFAULT 'not_synced' CHECK (
  metrc_sync_status IN ('not_synced', 'syncing', 'synced', 'error')
),
ADD COLUMN IF NOT EXISTS metrc_last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metrc_sync_error TEXT;

-- Comments
COMMENT ON COLUMN rooms.metrc_location_id IS 'Metrc API location ID (returned after creation)';
COMMENT ON COLUMN rooms.metrc_location_name IS 'Metrc location name (must match exactly)';
COMMENT ON COLUMN rooms.metrc_location_type_id IS 'Metrc location type ID selected from /locations/v2/types';
COMMENT ON COLUMN rooms.metrc_location_type_name IS 'Human-readable location type name';
COMMENT ON COLUMN rooms.metrc_sync_status IS 'Sync status: not_synced, syncing, synced, error';
COMMENT ON COLUMN rooms.metrc_last_synced_at IS 'Timestamp of last successful sync to Metrc';
COMMENT ON COLUMN rooms.metrc_sync_error IS 'Error message if sync failed';

-- =====================================================
-- 2. ENHANCE METRC LOCATION FIELDS ON PODS
-- =====================================================

-- Add additional Metrc fields to pods table
ALTER TABLE pods
ADD COLUMN IF NOT EXISTS metrc_location_id INTEGER,
ADD COLUMN IF NOT EXISTS metrc_location_type_id INTEGER,
ADD COLUMN IF NOT EXISTS metrc_location_type_name TEXT,
ADD COLUMN IF NOT EXISTS metrc_sync_status TEXT DEFAULT 'not_synced' CHECK (
  metrc_sync_status IN ('not_synced', 'syncing', 'synced', 'error')
),
ADD COLUMN IF NOT EXISTS metrc_last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metrc_sync_error TEXT;

-- Comments
COMMENT ON COLUMN pods.metrc_location_id IS 'Metrc API location ID (returned after creation)';
COMMENT ON COLUMN pods.metrc_location_type_id IS 'Metrc location type ID selected from /locations/v2/types';
COMMENT ON COLUMN pods.metrc_location_type_name IS 'Human-readable location type name';
COMMENT ON COLUMN pods.metrc_sync_status IS 'Sync status: not_synced, syncing, synced, error';
COMMENT ON COLUMN pods.metrc_last_synced_at IS 'Timestamp of last successful sync to Metrc';
COMMENT ON COLUMN pods.metrc_sync_error IS 'Error message if sync failed';

-- =====================================================
-- 3. CREATE METRC LOCATION MAPPINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS metrc_location_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- TRAZO location reference (either room or pod)
  trazo_location_type TEXT NOT NULL CHECK (trazo_location_type IN ('room', 'pod')),
  trazo_room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  trazo_pod_id UUID REFERENCES pods(id) ON DELETE CASCADE,

  -- Metrc location details
  metrc_location_id INTEGER NOT NULL,
  metrc_location_name TEXT NOT NULL,
  metrc_location_type_id INTEGER NOT NULL,
  metrc_location_type_name TEXT NOT NULL,

  -- Sync metadata
  sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (
    sync_status IN ('synced', 'out_of_sync', 'deleted_in_metrc')
  ),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_direction TEXT DEFAULT 'trazo_to_metrc' CHECK (
    sync_direction IN ('trazo_to_metrc', 'metrc_to_trazo', 'bidirectional')
  ),

  -- Notes and metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_trazo_location CHECK (
    (trazo_location_type = 'room' AND trazo_room_id IS NOT NULL AND trazo_pod_id IS NULL) OR
    (trazo_location_type = 'pod' AND trazo_pod_id IS NOT NULL AND trazo_room_id IS NULL)
  ),
  CONSTRAINT unique_metrc_location_per_site UNIQUE (site_id, metrc_location_id),
  CONSTRAINT unique_room_mapping UNIQUE (trazo_room_id) WHERE trazo_room_id IS NOT NULL,
  CONSTRAINT unique_pod_mapping UNIQUE (trazo_pod_id) WHERE trazo_pod_id IS NOT NULL
);

-- Indexes
CREATE INDEX idx_metrc_location_mappings_org ON metrc_location_mappings(organization_id);
CREATE INDEX idx_metrc_location_mappings_site ON metrc_location_mappings(site_id);
CREATE INDEX idx_metrc_location_mappings_room ON metrc_location_mappings(trazo_room_id) WHERE trazo_room_id IS NOT NULL;
CREATE INDEX idx_metrc_location_mappings_pod ON metrc_location_mappings(trazo_pod_id) WHERE trazo_pod_id IS NOT NULL;
CREATE INDEX idx_metrc_location_mappings_metrc_id ON metrc_location_mappings(metrc_location_id);
CREATE INDEX idx_metrc_location_mappings_sync_status ON metrc_location_mappings(sync_status);

-- RLS policies
ALTER TABLE metrc_location_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY metrc_location_mappings_org_isolation ON metrc_location_mappings
  FOR ALL USING (organization_id = user_organization_id());

-- Comments
COMMENT ON TABLE metrc_location_mappings IS 'Maps TRAZO rooms/pods to Metrc locations for compliance tracking';
COMMENT ON COLUMN metrc_location_mappings.trazo_location_type IS 'Whether this maps a room or pod';
COMMENT ON COLUMN metrc_location_mappings.sync_direction IS 'Which system is the source of truth';

-- =====================================================
-- 4. CREATE LOCATION SYNC EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS metrc_location_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES metrc_location_mappings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (
    event_type IN ('created', 'updated', 'deleted', 'sync_error', 'sync_success')
  ),

  -- Sync details
  sync_direction TEXT NOT NULL CHECK (
    sync_direction IN ('trazo_to_metrc', 'metrc_to_trazo')
  ),

  -- Request/response
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,

  -- Metadata
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_metrc_location_sync_events_mapping ON metrc_location_sync_events(mapping_id);
CREATE INDEX idx_metrc_location_sync_events_org ON metrc_location_sync_events(organization_id);
CREATE INDEX idx_metrc_location_sync_events_type ON metrc_location_sync_events(event_type);
CREATE INDEX idx_metrc_location_sync_events_time ON metrc_location_sync_events(performed_at DESC);

-- RLS policies
ALTER TABLE metrc_location_sync_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY metrc_location_sync_events_org_isolation ON metrc_location_sync_events
  FOR ALL USING (organization_id = user_organization_id());

-- Comments
COMMENT ON TABLE metrc_location_sync_events IS 'Audit trail for Metrc location sync operations';

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for quick lookup of synced rooms
CREATE INDEX IF NOT EXISTS idx_rooms_metrc_synced
ON rooms(metrc_location_id, metrc_sync_status)
WHERE metrc_location_id IS NOT NULL;

-- Index for quick lookup of synced pods
CREATE INDEX IF NOT EXISTS idx_pods_metrc_synced
ON pods(metrc_location_id, metrc_sync_status)
WHERE metrc_location_id IS NOT NULL;

-- =====================================================
-- 6. HELPER VIEWS
-- =====================================================

-- View: All Metrc-synced locations with details
CREATE OR REPLACE VIEW metrc_synced_locations AS
SELECT
  'room' AS location_type,
  r.id AS trazo_id,
  r.name AS trazo_name,
  r.site_id,
  s.name AS site_name,
  s.site_license_number,
  r.metrc_location_id,
  r.metrc_location_name,
  r.metrc_location_type_id,
  r.metrc_location_type_name,
  r.metrc_sync_status,
  r.metrc_last_synced_at,
  r.metrc_sync_error,
  NULL::uuid AS room_id,
  r.room_type,
  r.organization_id
FROM rooms r
INNER JOIN sites s ON s.id = r.site_id
WHERE r.metrc_location_id IS NOT NULL AND r.is_active = true

UNION ALL

SELECT
  'pod' AS location_type,
  p.id AS trazo_id,
  p.name AS trazo_name,
  r.site_id,
  s.name AS site_name,
  s.site_license_number,
  p.metrc_location_id,
  p.metrc_location_name,
  p.metrc_location_type_id,
  p.metrc_location_type_name,
  p.metrc_sync_status,
  p.metrc_last_synced_at,
  p.metrc_sync_error,
  p.room_id,
  r.room_type,
  s.organization_id
FROM pods p
INNER JOIN rooms r ON r.id = p.room_id
INNER JOIN sites s ON s.id = r.site_id
WHERE p.metrc_location_id IS NOT NULL AND p.is_active = true;

COMMENT ON VIEW metrc_synced_locations IS 'All rooms and pods synced to Metrc with their sync status';

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger: Update updated_at on metrc_location_mappings
CREATE TRIGGER update_metrc_location_mappings_updated_at
  BEFORE UPDATE ON metrc_location_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function: Get Metrc location for a batch based on pod assignment
CREATE OR REPLACE FUNCTION get_batch_metrc_location(p_batch_id UUID)
RETURNS TABLE (
  location_name TEXT,
  location_id INTEGER,
  location_type_name TEXT
) AS $$
BEGIN
  -- Try to get location from assigned pod
  RETURN QUERY
  SELECT
    p.metrc_location_name,
    p.metrc_location_id,
    p.metrc_location_type_name
  FROM batch_pod_assignments bpa
  INNER JOIN pods p ON p.id = bpa.pod_id
  WHERE bpa.batch_id = p_batch_id
    AND bpa.removed_at IS NULL
    AND p.metrc_location_name IS NOT NULL
  LIMIT 1;

  -- If no pod assignment, try room via pod
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      r.metrc_location_name,
      r.metrc_location_id,
      r.metrc_location_type_name
    FROM batch_pod_assignments bpa
    INNER JOIN pods p ON p.id = bpa.pod_id
    INNER JOIN rooms r ON r.id = p.room_id
    WHERE bpa.batch_id = p_batch_id
      AND bpa.removed_at IS NULL
      AND r.metrc_location_name IS NOT NULL
    LIMIT 1;
  END IF;

  -- If still not found, use site default
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      s.default_metrc_location,
      NULL::INTEGER,
      NULL::TEXT
    FROM batches b
    INNER JOIN sites s ON s.id = b.site_id
    WHERE b.id = p_batch_id
      AND s.default_metrc_location IS NOT NULL;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_batch_metrc_location IS 'Get Metrc location for a batch based on pod/room assignment or site default';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
