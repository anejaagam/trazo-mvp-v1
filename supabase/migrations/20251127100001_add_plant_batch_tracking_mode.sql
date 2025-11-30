-- Migration: Add Plant Batch Tracking Mode & Source Traceability
-- Implements Open Loop vs Closed Loop tracking and source package/mother plant linkage

-- Add tracking_mode column to batches table
-- open_loop: Batch-level tracking by count (immature plants)
-- closed_loop: Individual plant tracking with unique tags
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS tracking_mode TEXT DEFAULT 'open_loop'
  CHECK (tracking_mode IN ('open_loop', 'closed_loop'));

-- Add source package reference for batches created from packages (seeds/clones from inventory)
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS source_package_id UUID REFERENCES inventory_lots(id),
ADD COLUMN IF NOT EXISTS source_package_tag TEXT;

-- Add source mother plant reference for batches created from cloning mother plants
-- References mother_plants table (created in next migration)
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS source_mother_plant_id UUID,
ADD COLUMN IF NOT EXISTS source_mother_plant_tag TEXT;

-- Add measurement tracking for state compliance triggers
-- e.g., Oregon requires tagging when plants reach 36" height
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS max_plant_height_inches DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS canopy_area_sq_ft DECIMAL(8,2);

-- Oregon June 2024 batch tagging option: Can tag groups of ≤100 plants with single tag
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS uses_batch_tagging BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS batch_tag_label TEXT;

-- Add indexes for source lookups
CREATE INDEX IF NOT EXISTS idx_batches_source_package ON batches(source_package_id) WHERE source_package_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_batches_source_package_tag ON batches(source_package_tag) WHERE source_package_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_batches_tracking_mode ON batches(tracking_mode);

-- Extend batch_plants table with phase tracking and location
ALTER TABLE batch_plants
ADD COLUMN IF NOT EXISTS phase_changed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_location TEXT,
ADD COLUMN IF NOT EXISTS metrc_sync_status TEXT DEFAULT 'pending'
  CHECK (metrc_sync_status IN ('pending', 'synced', 'failed', 'not_required'));

-- Add comments for documentation
COMMENT ON COLUMN batches.tracking_mode IS 'Tracking mode: open_loop (batch by count) or closed_loop (individual plant tags). Changes to closed_loop when tags are assigned.';
COMMENT ON COLUMN batches.source_package_id IS 'Reference to inventory_lots for batches created from seed/clone packages';
COMMENT ON COLUMN batches.source_package_tag IS 'Metrc package tag/UID from source package for compliance traceability';
COMMENT ON COLUMN batches.source_mother_plant_id IS 'Reference to mother_plants table for batches created via cloning';
COMMENT ON COLUMN batches.source_mother_plant_tag IS 'Metrc plant tag of the mother plant used for cloning';
COMMENT ON COLUMN batches.max_plant_height_inches IS 'Maximum recorded plant height in inches (for state tagging trigger compliance)';
COMMENT ON COLUMN batches.canopy_area_sq_ft IS 'Total canopy area in square feet (California flowering requirement)';
COMMENT ON COLUMN batches.uses_batch_tagging IS 'Oregon June 2024: Whether batch uses single tag for ≤100 plants';
COMMENT ON COLUMN batches.batch_tag_label IS 'Single Metrc tag for batch (Oregon batch tagging option)';
COMMENT ON COLUMN batch_plants.phase_changed_at IS 'Timestamp of last growth phase change';
COMMENT ON COLUMN batch_plants.current_location IS 'Current Metrc location name for individual plant';
COMMENT ON COLUMN batch_plants.metrc_sync_status IS 'Sync status for individual plant in Metrc';
