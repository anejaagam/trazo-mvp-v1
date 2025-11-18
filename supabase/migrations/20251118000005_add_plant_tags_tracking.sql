-- Add metrc_plant_labels column to batches table for storing array of Metrc plant tags
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS metrc_plant_labels TEXT[] DEFAULT '{}';

-- Create index for efficient tag lookups
CREATE INDEX IF NOT EXISTS idx_batches_metrc_plant_labels
ON batches USING GIN (metrc_plant_labels);

-- Create batch_plants table for individual plant tracking
CREATE TABLE IF NOT EXISTS batch_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  metrc_plant_label TEXT NOT NULL UNIQUE,
  plant_index INTEGER,
  growth_phase TEXT,
  status TEXT DEFAULT 'active',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES users(id),
  destroyed_at TIMESTAMPTZ,
  destroyed_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for batch_plants table
CREATE INDEX IF NOT EXISTS idx_batch_plants_batch_id ON batch_plants(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_plants_metrc_label ON batch_plants(metrc_plant_label);
CREATE INDEX IF NOT EXISTS idx_batch_plants_status ON batch_plants(status);

-- Enable RLS on batch_plants table
ALTER TABLE batch_plants ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can view plants from their organization's batches
CREATE POLICY batch_plants_select_policy ON batch_plants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_plants.batch_id
      AND batches.organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- RLS policy: Users can insert plants for their organization's batches
CREATE POLICY batch_plants_insert_policy ON batch_plants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_plants.batch_id
      AND batches.organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- RLS policy: Users can update plants from their organization's batches
CREATE POLICY batch_plants_update_policy ON batch_plants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_plants.batch_id
      AND batches.organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_plants.batch_id
      AND batches.organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- RLS policy: Users can delete plants from their organization's batches
CREATE POLICY batch_plants_delete_policy ON batch_plants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_plants.batch_id
      AND batches.organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Add comment explaining the metrc_plant_labels column
COMMENT ON COLUMN batches.metrc_plant_labels IS 'Array of Metrc plant tags assigned to this batch. Each tag is a unique 22-character identifier in format 1A[StateCode][License][Sequence]';

-- Add comment on batch_plants table
COMMENT ON TABLE batch_plants IS 'Individual plant tracking for Metrc compliance. Each row represents a single plant with its unique Metrc tag.';
