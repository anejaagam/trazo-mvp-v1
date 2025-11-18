-- Add Metrc Batch Mappings Table
-- Created: November 18, 2025
-- Purpose: Map TRAZO batches to Metrc plant batches for sync tracking

-- =====================================================
-- METRC BATCH MAPPINGS
-- =====================================================
-- Maps TRAZO batches to Metrc plant batches
CREATE TABLE IF NOT EXISTS metrc_batch_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- TRAZO batch reference
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,

  -- Metrc plant batch details
  metrc_batch_id TEXT NOT NULL,
  metrc_batch_name TEXT NOT NULL,
  metrc_batch_type TEXT CHECK (metrc_batch_type IN ('Seed', 'Clone')),

  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  sync_error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_batch_mapping UNIQUE (batch_id),
  CONSTRAINT unique_metrc_batch UNIQUE (site_id, metrc_batch_id)
);

-- Indexes for metrc_batch_mappings
CREATE INDEX idx_metrc_batch_mappings_batch ON metrc_batch_mappings(batch_id);
CREATE INDEX idx_metrc_batch_mappings_metrc_id ON metrc_batch_mappings(metrc_batch_id);
CREATE INDEX idx_metrc_batch_mappings_site ON metrc_batch_mappings(site_id);
CREATE INDEX idx_metrc_batch_mappings_org ON metrc_batch_mappings(organization_id);
CREATE INDEX idx_metrc_batch_mappings_sync_status ON metrc_batch_mappings(sync_status);

-- RLS Policies for metrc_batch_mappings
ALTER TABLE metrc_batch_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view batch mappings for their organization"
  ON metrc_batch_mappings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage batch mappings for their organization"
  ON metrc_batch_mappings FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_metrc_batch_mappings_updated_at
  BEFORE UPDATE ON metrc_batch_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE metrc_batch_mappings IS 'Maps TRAZO batches to Metrc plant batches';
COMMENT ON COLUMN metrc_batch_mappings.batch_id IS 'Reference to TRAZO batch';
COMMENT ON COLUMN metrc_batch_mappings.metrc_batch_id IS 'Metrc plant batch ID';
COMMENT ON COLUMN metrc_batch_mappings.metrc_batch_name IS 'Metrc plant batch name';
COMMENT ON COLUMN metrc_batch_mappings.sync_status IS 'Current sync status (synced, pending, error)';
