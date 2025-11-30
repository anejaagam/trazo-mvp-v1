-- =====================================================
-- Week 5 Enhancement: Per-Plant Harvest Tracking
-- =====================================================
-- This migration enhances harvest tracking to support:
-- 1. Per-plant harvest data entry (weight, quality metrics)
-- 2. Package-to-plant tag traceability
-- 3. Tag inventory management (available vs assigned)
-- =====================================================

-- =====================================================
-- 1. HARVEST PLANT RECORDS
-- Track individual plant harvests within a batch harvest
-- =====================================================
CREATE TABLE IF NOT EXISTS harvest_plant_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id UUID NOT NULL REFERENCES harvest_records(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Plant identification
  plant_tag TEXT NOT NULL, -- Metrc plant tag (from plant_tags or batch_plants)
  plant_index INTEGER, -- Plant number within batch (1-N)

  -- Harvest metrics per plant
  wet_weight_g NUMERIC NOT NULL CHECK (wet_weight_g >= 0),
  dry_weight_g NUMERIC CHECK (dry_weight_g >= 0),
  waste_weight_g NUMERIC DEFAULT 0 CHECK (waste_weight_g >= 0),

  -- Quality assessment (per plant)
  quality_grade TEXT CHECK (quality_grade IN ('A', 'B', 'C', 'Waste')),
  flower_weight_g NUMERIC DEFAULT 0 CHECK (flower_weight_g >= 0),
  trim_weight_g NUMERIC DEFAULT 0 CHECK (trim_weight_g >= 0),
  shake_weight_g NUMERIC DEFAULT 0 CHECK (shake_weight_g >= 0),

  -- Tracking
  harvested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  harvested_by UUID REFERENCES users(id),

  -- Notes
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_harvest_plant_tag UNIQUE (harvest_id, plant_tag),
  CONSTRAINT positive_weights CHECK (
    wet_weight_g >= 0 AND
    (dry_weight_g IS NULL OR dry_weight_g >= 0) AND
    waste_weight_g >= 0
  )
);

-- Indexes for harvest_plant_records
CREATE INDEX idx_harvest_plant_records_harvest ON harvest_plant_records(harvest_id);
CREATE INDEX idx_harvest_plant_records_batch ON harvest_plant_records(batch_id);
CREATE INDEX idx_harvest_plant_records_plant_tag ON harvest_plant_records(plant_tag);
CREATE INDEX idx_harvest_plant_records_quality ON harvest_plant_records(quality_grade) WHERE quality_grade IS NOT NULL;
CREATE INDEX idx_harvest_plant_records_org ON harvest_plant_records(organization_id);

-- RLS policies
ALTER TABLE harvest_plant_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY harvest_plant_records_org_isolation ON harvest_plant_records
  FOR ALL USING (organization_id = user_organization_id());

-- Comments
COMMENT ON TABLE harvest_plant_records IS 'Individual plant harvest records for detailed per-plant tracking and traceability';
COMMENT ON COLUMN harvest_plant_records.plant_tag IS 'Metrc plant tag from plant_tags or batch_plants table';
COMMENT ON COLUMN harvest_plant_records.quality_grade IS 'Quality assessment: A (premium), B (standard), C (lower), Waste';
COMMENT ON COLUMN harvest_plant_records.flower_weight_g IS 'Premium flower buds weight';
COMMENT ON COLUMN harvest_plant_records.trim_weight_g IS 'Trim/sugar leaves weight';
COMMENT ON COLUMN harvest_plant_records.shake_weight_g IS 'Shake/small pieces weight';

-- =====================================================
-- 2. PACKAGE PLANT SOURCES
-- Link packages to source plant tags for full traceability
-- =====================================================
CREATE TABLE IF NOT EXISTS package_plant_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES harvest_packages(id) ON DELETE CASCADE,
  plant_tag TEXT NOT NULL,

  -- Contribution tracking
  weight_contributed_g NUMERIC NOT NULL CHECK (weight_contributed_g > 0),
  source_type TEXT DEFAULT 'flower' CHECK (source_type IN ('flower', 'trim', 'shake', 'waste')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_package_plant_source UNIQUE (package_id, plant_tag, source_type)
);

-- Indexes
CREATE INDEX idx_package_plant_sources_package ON package_plant_sources(package_id);
CREATE INDEX idx_package_plant_sources_plant_tag ON package_plant_sources(plant_tag);
CREATE INDEX idx_package_plant_sources_source_type ON package_plant_sources(source_type);

-- RLS policies
ALTER TABLE package_plant_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY package_plant_sources_select_policy ON package_plant_sources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM harvest_packages
      WHERE harvest_packages.id = package_plant_sources.package_id
      AND harvest_packages.organization_id = user_organization_id()
    )
  );

CREATE POLICY package_plant_sources_insert_policy ON package_plant_sources
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM harvest_packages
      WHERE harvest_packages.id = package_plant_sources.package_id
      AND harvest_packages.organization_id = user_organization_id()
    )
  );

-- Comments
COMMENT ON TABLE package_plant_sources IS 'Links packages to source plant tags for complete seed-to-sale traceability';
COMMENT ON COLUMN package_plant_sources.weight_contributed_g IS 'Amount of weight this plant contributed to the package';
COMMENT ON COLUMN package_plant_sources.source_type IS 'Type of material: flower (premium buds), trim (sugar leaves), shake (small pieces), waste';

-- =====================================================
-- 3. TAG INVENTORY MANAGEMENT
-- Track available vs assigned Metrc tags
-- =====================================================
CREATE TABLE IF NOT EXISTS metrc_tag_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Tag details
  tag_number TEXT NOT NULL,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('Plant', 'Package', 'Location')),

  -- Status
  status TEXT NOT NULL DEFAULT 'available' CHECK (
    status IN ('available', 'assigned', 'used', 'destroyed', 'lost', 'returned')
  ),

  -- Assignment tracking
  assigned_to_type TEXT CHECK (assigned_to_type IN ('batch', 'plant', 'package', 'location')),
  assigned_to_id UUID, -- Foreign key to batch_id, plant_id, package_id, etc.
  assigned_at TIMESTAMPTZ,
  assigned_by UUID REFERENCES users(id),

  -- Usage tracking
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES users(id),

  -- Deactivation tracking
  deactivated_at TIMESTAMPTZ,
  deactivation_reason TEXT,
  deactivated_by UUID REFERENCES users(id),

  -- Metrc sync
  metrc_tag_id TEXT, -- Metrc's internal ID for this tag
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),

  -- Ordering information
  order_batch_number TEXT,
  received_at TIMESTAMPTZ,
  received_by UUID REFERENCES users(id),

  -- Notes
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_tag_per_site UNIQUE (site_id, tag_number)
);

-- Indexes for metrc_tag_inventory
CREATE INDEX idx_metrc_tag_inventory_org ON metrc_tag_inventory(organization_id);
CREATE INDEX idx_metrc_tag_inventory_site ON metrc_tag_inventory(site_id);
CREATE INDEX idx_metrc_tag_inventory_tag_number ON metrc_tag_inventory(tag_number);
CREATE INDEX idx_metrc_tag_inventory_status ON metrc_tag_inventory(status);
CREATE INDEX idx_metrc_tag_inventory_type ON metrc_tag_inventory(tag_type);
CREATE INDEX idx_metrc_tag_inventory_assigned_to ON metrc_tag_inventory(assigned_to_type, assigned_to_id) WHERE assigned_to_id IS NOT NULL;
CREATE INDEX idx_metrc_tag_inventory_available ON metrc_tag_inventory(site_id, tag_type, status) WHERE status = 'available';

-- RLS policies
ALTER TABLE metrc_tag_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY metrc_tag_inventory_org_isolation ON metrc_tag_inventory
  FOR ALL USING (organization_id = user_organization_id());

-- Comments
COMMENT ON TABLE metrc_tag_inventory IS 'Metrc tag inventory management - tracks available, assigned, and used tags';
COMMENT ON COLUMN metrc_tag_inventory.tag_type IS 'Plant tags for individual plants, Package tags for finished products, Location tags for rooms/areas';
COMMENT ON COLUMN metrc_tag_inventory.status IS 'available: ready to use, assigned: allocated but not used, used: actively in use, destroyed: deactivated, lost: missing, returned: sent back to Metrc';
COMMENT ON COLUMN metrc_tag_inventory.assigned_to_type IS 'What this tag is assigned to: batch (plant batch), plant (individual plant), package (finished product), location (room/area)';

-- =====================================================
-- 4. TAG ASSIGNMENT EVENTS
-- Audit trail for tag lifecycle
-- =====================================================
CREATE TABLE IF NOT EXISTS tag_assignment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES metrc_tag_inventory(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (
    event_type IN ('received', 'assigned', 'used', 'deactivated', 'returned', 'lost', 'found')
  ),

  -- Assignment context
  assigned_to_type TEXT CHECK (assigned_to_type IN ('batch', 'plant', 'package', 'location')),
  assigned_to_id UUID,

  -- Event metadata
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Status change
  from_status TEXT,
  to_status TEXT,

  -- Notes
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tag_assignment_events_tag ON tag_assignment_events(tag_id);
CREATE INDEX idx_tag_assignment_events_org ON tag_assignment_events(organization_id);
CREATE INDEX idx_tag_assignment_events_type ON tag_assignment_events(event_type);
CREATE INDEX idx_tag_assignment_events_time ON tag_assignment_events(performed_at DESC);
CREATE INDEX idx_tag_assignment_events_assigned_to ON tag_assignment_events(assigned_to_type, assigned_to_id) WHERE assigned_to_id IS NOT NULL;

-- RLS policies
ALTER TABLE tag_assignment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tag_assignment_events_org_isolation ON tag_assignment_events
  FOR ALL USING (organization_id = user_organization_id());

-- Comments
COMMENT ON TABLE tag_assignment_events IS 'Audit trail for Metrc tag lifecycle events';
COMMENT ON COLUMN tag_assignment_events.event_type IS 'received: tag arrived, assigned: allocated to entity, used: tag activated, deactivated: tag retired, returned: sent back, lost: missing, found: recovered';

-- =====================================================
-- 5. HELPER VIEWS
-- =====================================================

-- View: Available tags by type and site
CREATE OR REPLACE VIEW available_tags_by_site AS
SELECT
  site_id,
  tag_type,
  COUNT(*) as available_count,
  MIN(received_at) as oldest_tag_date,
  MAX(received_at) as newest_tag_date
FROM metrc_tag_inventory
WHERE status = 'available'
GROUP BY site_id, tag_type;

COMMENT ON VIEW available_tags_by_site IS 'Quick summary of available tags per site and type';

-- View: Tag usage summary
CREATE OR REPLACE VIEW tag_usage_summary AS
SELECT
  organization_id,
  site_id,
  tag_type,
  status,
  COUNT(*) as tag_count
FROM metrc_tag_inventory
GROUP BY organization_id, site_id, tag_type, status;

COMMENT ON VIEW tag_usage_summary IS 'Summary of tag counts by organization, site, type, and status';

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger: Update updated_at on harvest_plant_records
CREATE TRIGGER update_harvest_plant_records_updated_at
  BEFORE UPDATE ON harvest_plant_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on metrc_tag_inventory
CREATE TRIGGER update_metrc_tag_inventory_updated_at
  BEFORE UPDATE ON metrc_tag_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Create tag assignment event on status change
CREATE OR REPLACE FUNCTION log_tag_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO tag_assignment_events (
      tag_id,
      organization_id,
      event_type,
      assigned_to_type,
      assigned_to_id,
      from_status,
      to_status,
      performed_by,
      performed_at
    ) VALUES (
      NEW.id,
      NEW.organization_id,
      CASE
        WHEN NEW.status = 'assigned' THEN 'assigned'
        WHEN NEW.status = 'used' THEN 'used'
        WHEN NEW.status = 'destroyed' THEN 'deactivated'
        WHEN NEW.status = 'returned' THEN 'returned'
        WHEN NEW.status = 'lost' THEN 'lost'
        ELSE 'assigned'
      END,
      NEW.assigned_to_type,
      NEW.assigned_to_id,
      OLD.status,
      NEW.status,
      NEW.assigned_by,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tag_status_change_logger
  AFTER UPDATE ON metrc_tag_inventory
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_tag_status_change();

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function: Get available tag count for a site
CREATE OR REPLACE FUNCTION get_available_tag_count(
  p_site_id UUID,
  p_tag_type TEXT
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM metrc_tag_inventory
    WHERE site_id = p_site_id
    AND tag_type = p_tag_type
    AND status = 'available'
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_available_tag_count IS 'Get count of available tags for a site by tag type';

-- Function: Assign tag to entity
CREATE OR REPLACE FUNCTION assign_tag_to_entity(
  p_tag_id UUID,
  p_assigned_to_type TEXT,
  p_assigned_to_id UUID,
  p_assigned_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE metrc_tag_inventory
  SET
    status = 'assigned',
    assigned_to_type = p_assigned_to_type,
    assigned_to_id = p_assigned_to_id,
    assigned_at = now(),
    assigned_by = p_assigned_by,
    updated_at = now()
  WHERE id = p_tag_id
  AND status = 'available';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION assign_tag_to_entity IS 'Assign an available tag to a batch, plant, package, or location';

-- Function: Mark tag as used
CREATE OR REPLACE FUNCTION mark_tag_as_used(
  p_tag_id UUID,
  p_used_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE metrc_tag_inventory
  SET
    status = 'used',
    used_at = now(),
    used_by = p_used_by,
    updated_at = now()
  WHERE id = p_tag_id
  AND status = 'assigned';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_tag_as_used IS 'Mark an assigned tag as used/active';

-- Function: Deactivate tag
CREATE OR REPLACE FUNCTION deactivate_tag(
  p_tag_id UUID,
  p_reason TEXT,
  p_deactivated_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE metrc_tag_inventory
  SET
    status = 'destroyed',
    deactivated_at = now(),
    deactivation_reason = p_reason,
    deactivated_by = p_deactivated_by,
    updated_at = now()
  WHERE id = p_tag_id
  AND status IN ('assigned', 'used');

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION deactivate_tag IS 'Deactivate/destroy a tag with reason';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
