-- Migration: Create Batch Planting Records Table
-- Tracks "Create Planting" operations that convert batch plants to individually tracked plants
-- This is the Metrc "open loop → closed loop" transition record

CREATE TABLE IF NOT EXISTS batch_planting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Source batch being converted
  source_batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,

  -- Planting details
  plant_count INTEGER NOT NULL,
  planted_date DATE NOT NULL,
  location TEXT NOT NULL,

  -- Tags assigned during planting
  plant_tags TEXT[] DEFAULT '{}',

  -- Metrc sync status
  metrc_sync_status TEXT DEFAULT 'pending'
    CHECK (metrc_sync_status IN ('pending', 'synced', 'failed', 'partial')),
  metrc_sync_error TEXT,
  metrc_synced_at TIMESTAMPTZ,

  -- Optional reference to target batch if plants are grouped into new batch
  target_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,

  -- Audit fields
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_batch_planting_records_org_site ON batch_planting_records(organization_id, site_id);
CREATE INDEX IF NOT EXISTS idx_batch_planting_records_source_batch ON batch_planting_records(source_batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_planting_records_sync_status ON batch_planting_records(metrc_sync_status);
CREATE INDEX IF NOT EXISTS idx_batch_planting_records_date ON batch_planting_records(planted_date);

-- Add planting_record_id reference to batch_plants table
ALTER TABLE batch_plants
ADD COLUMN IF NOT EXISTS planting_record_id UUID REFERENCES batch_planting_records(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_batch_plants_planting_record ON batch_plants(planting_record_id)
  WHERE planting_record_id IS NOT NULL;

-- Enable RLS
ALTER TABLE batch_planting_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY batch_planting_records_select_policy ON batch_planting_records
  FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY batch_planting_records_insert_policy ON batch_planting_records
  FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY batch_planting_records_update_policy ON batch_planting_records
  FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY batch_planting_records_delete_policy ON batch_planting_records
  FOR DELETE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_batch_planting_records_updated_at
BEFORE UPDATE ON batch_planting_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE batch_planting_records IS 'Records "Create Planting" operations converting batch plants to individually tagged plants. This is the open loop → closed loop transition in Metrc.';
COMMENT ON COLUMN batch_planting_records.source_batch_id IS 'The batch from which plants are being converted to individual tracking';
COMMENT ON COLUMN batch_planting_records.plant_count IS 'Number of plants being converted (moved from batch count to individual tracking)';
COMMENT ON COLUMN batch_planting_records.planted_date IS 'Date the plants were assigned individual tags';
COMMENT ON COLUMN batch_planting_records.location IS 'Metrc location name where plants are being placed';
COMMENT ON COLUMN batch_planting_records.plant_tags IS 'Array of Metrc plant tags assigned during this planting operation';
COMMENT ON COLUMN batch_planting_records.metrc_sync_status IS 'Status of Metrc API sync for this planting operation';
COMMENT ON COLUMN batch_plants.planting_record_id IS 'Reference to the planting operation that created this individual plant record';
