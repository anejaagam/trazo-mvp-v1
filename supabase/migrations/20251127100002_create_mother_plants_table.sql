-- Migration: Create Mother Plants Table
-- Tracks mother plants used for cloning in closed loop tracking systems

CREATE TABLE IF NOT EXISTS mother_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Source batch (the batch this mother plant came from)
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,

  -- Metrc tracking
  plant_tag TEXT NOT NULL,
  metrc_plant_id TEXT,

  -- Plant details
  name TEXT NOT NULL,
  cultivar_id UUID REFERENCES cultivars(id),

  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'retired', 'destroyed')),

  -- Cloning statistics
  clone_count INTEGER DEFAULT 0,
  last_clone_date DATE,

  -- Retirement/destruction tracking
  retired_at TIMESTAMPTZ,
  retired_by UUID REFERENCES users(id),
  retired_reason TEXT,
  destroyed_at TIMESTAMPTZ,
  destroyed_by UUID REFERENCES users(id),
  destroyed_reason TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mother_plants_org_site ON mother_plants(organization_id, site_id);
CREATE INDEX IF NOT EXISTS idx_mother_plants_plant_tag ON mother_plants(plant_tag);
CREATE INDEX IF NOT EXISTS idx_mother_plants_metrc_id ON mother_plants(metrc_plant_id) WHERE metrc_plant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mother_plants_cultivar ON mother_plants(cultivar_id);
CREATE INDEX IF NOT EXISTS idx_mother_plants_status ON mother_plants(status) WHERE status = 'active';

-- Unique constraint: Plant tag must be unique within organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_mother_plants_org_tag ON mother_plants(organization_id, plant_tag);

-- Add foreign key reference from batches to mother_plants (now that table exists)
ALTER TABLE batches
ADD CONSTRAINT fk_batches_source_mother_plant
FOREIGN KEY (source_mother_plant_id) REFERENCES mother_plants(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE mother_plants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY mother_plants_select_policy ON mother_plants
  FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY mother_plants_insert_policy ON mother_plants
  FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY mother_plants_update_policy ON mother_plants
  FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY mother_plants_delete_policy ON mother_plants
  FOR DELETE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_mother_plants_updated_at
BEFORE UPDATE ON mother_plants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE mother_plants IS 'Mother plants used for cloning in closed loop Metrc tracking. Each mother plant has a unique tag for source traceability.';
COMMENT ON COLUMN mother_plants.plant_tag IS 'Unique Metrc plant tag assigned to this mother plant';
COMMENT ON COLUMN mother_plants.metrc_plant_id IS 'Metrc system ID for this plant (returned after sync)';
COMMENT ON COLUMN mother_plants.clone_count IS 'Total number of clones produced from this mother plant';
COMMENT ON COLUMN mother_plants.status IS 'Current status: active (available for cloning), retired (no longer used), destroyed (disposed)';
