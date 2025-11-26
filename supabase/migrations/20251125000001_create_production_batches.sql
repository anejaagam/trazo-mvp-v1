-- Production Batches Tables
-- Phase 3.5 Week 10 Implementation
-- Tracks transformation of harvest packages into final products (oils, concentrates, edibles, pre-rolls)

-- Production recipes table (templates for common production processes)
CREATE TABLE IF NOT EXISTS production_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  production_type TEXT NOT NULL CHECK (production_type IN ('processing', 'extraction', 'infusion', 'packaging', 'preroll', 'other')),

  -- Expected inputs/outputs
  input_product_types TEXT[], -- Array of expected input types (e.g., ['flower', 'trim'])
  output_product_type TEXT NOT NULL, -- Expected output type (e.g., 'concentrate', 'edible')
  expected_yield_percentage DECIMAL(5,2), -- e.g., 20.00 for 20% yield in extraction

  -- Process parameters (flexible JSON structure)
  process_parameters JSONB DEFAULT '{}',
  /*
  Example structure:
  {
    "temperature_c": 85,
    "pressure_psi": 2000,
    "duration_hours": 4,
    "solvent": "CO2",
    "method": "supercritical_extraction"
  }
  */

  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT unique_recipe_name_per_org UNIQUE(organization_id, name)
);

-- Production batches table (main production tracking)
CREATE TABLE IF NOT EXISTS production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL, -- Format: PROD-YYYY-MM-XXXXX
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Production details
  production_type TEXT NOT NULL CHECK (production_type IN ('processing', 'extraction', 'infusion', 'packaging', 'preroll', 'other')),
  recipe_id UUID REFERENCES production_recipes(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),

  -- Yield tracking
  expected_yield DECIMAL(10,3),
  expected_yield_unit TEXT DEFAULT 'Grams',
  actual_yield DECIMAL(10,3),
  actual_yield_unit TEXT DEFAULT 'Grams',
  yield_variance_reason TEXT,

  -- Link to source harvest (for traceability)
  source_harvest_id UUID REFERENCES harvest_records(id),

  -- Metrc sync fields
  metrc_production_batch_id TEXT,
  metrc_sync_status TEXT DEFAULT 'pending' CHECK (metrc_sync_status IN ('pending', 'synced', 'failed', 'not_required')),
  metrc_sync_error TEXT,
  metrc_last_sync TIMESTAMP WITH TIME ZONE,

  -- Notes
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  CONSTRAINT unique_batch_number_per_org UNIQUE(organization_id, batch_number)
);

-- Production batch inputs (packages consumed in production)
CREATE TABLE IF NOT EXISTS production_batch_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES harvest_packages(id),

  -- Quantities used
  quantity_used DECIMAL(10,3) NOT NULL,
  unit_of_measure TEXT NOT NULL,

  -- Original package info at time of input (for audit trail)
  original_package_quantity DECIMAL(10,3),

  -- Tracking
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),

  -- Each package can only be added once per production batch
  CONSTRAINT unique_package_per_production UNIQUE(production_batch_id, package_id)
);

-- Production batch outputs (new packages/products created)
CREATE TABLE IF NOT EXISTS production_batch_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,

  -- Link to created package (populated after package is created)
  package_id UUID REFERENCES harvest_packages(id),
  package_tag TEXT, -- Metrc package tag

  -- Product details
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL, -- 'flower', 'concentrate', 'oil', 'edible', 'topical', 'tincture', 'preroll', 'capsule', 'vape_cartridge'
  quantity DECIMAL(10,3) NOT NULL,
  unit_of_measure TEXT NOT NULL,

  -- Metrc sync
  metrc_package_id TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_production_recipes_org ON production_recipes(organization_id);
CREATE INDEX idx_production_recipes_active ON production_recipes(active) WHERE active = true;
CREATE INDEX idx_production_recipes_type ON production_recipes(production_type);

CREATE INDEX idx_production_batches_org_site ON production_batches(organization_id, site_id);
CREATE INDEX idx_production_batches_status ON production_batches(status);
CREATE INDEX idx_production_batches_started_at ON production_batches(started_at DESC);
CREATE INDEX idx_production_batches_batch_number ON production_batches(batch_number);
CREATE INDEX idx_production_batches_created_at ON production_batches(created_at DESC);
CREATE INDEX idx_production_batches_source_harvest ON production_batches(source_harvest_id);
CREATE INDEX idx_production_batches_type ON production_batches(production_type);

CREATE INDEX idx_production_batch_inputs_batch ON production_batch_inputs(production_batch_id);
CREATE INDEX idx_production_batch_inputs_package ON production_batch_inputs(package_id);

CREATE INDEX idx_production_batch_outputs_batch ON production_batch_outputs(production_batch_id);
CREATE INDEX idx_production_batch_outputs_package ON production_batch_outputs(package_id);

-- Create function to generate production batch numbers
CREATE OR REPLACE FUNCTION generate_production_batch_number()
RETURNS TEXT AS $$
DECLARE
  v_date TEXT;
  v_sequence INTEGER;
  v_batch_number TEXT;
BEGIN
  -- Get current date in YYYY-MM format
  v_date := TO_CHAR(CURRENT_DATE, 'YYYY-MM');

  -- Get the next sequence number for this month
  SELECT COALESCE(MAX(CAST(SUBSTRING(batch_number FROM 12) AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM production_batches
  WHERE batch_number LIKE 'PROD-' || v_date || '-%';

  -- Format the batch number
  v_batch_number := 'PROD-' || v_date || '-' || LPAD(v_sequence::TEXT, 5, '0');

  RETURN v_batch_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate batch numbers
CREATE OR REPLACE FUNCTION set_production_batch_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_number IS NULL OR NEW.batch_number = '' THEN
    NEW.batch_number := generate_production_batch_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_production_batch_number
  BEFORE INSERT ON production_batches
  FOR EACH ROW
  EXECUTE FUNCTION set_production_batch_number();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER trigger_update_production_batch_timestamp
  BEFORE UPDATE ON production_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_production_recipe_timestamp
  BEFORE UPDATE ON production_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for packages with production status
CREATE OR REPLACE VIEW packages_with_production_status AS
SELECT
  hp.*,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM production_batch_inputs pbi
      JOIN production_batches pb ON pb.id = pbi.production_batch_id
      WHERE pbi.package_id = hp.id AND pb.status = 'in_progress'
    ) THEN 'in_production'
    WHEN EXISTS (
      SELECT 1 FROM production_batch_inputs pbi
      JOIN production_batches pb ON pb.id = pbi.production_batch_id
      WHERE pbi.package_id = hp.id AND pb.status = 'completed'
    ) THEN 'processed'
    ELSE 'available'
  END AS production_status,
  (
    SELECT pb.batch_number
    FROM production_batch_inputs pbi
    JOIN production_batches pb ON pb.id = pbi.production_batch_id
    WHERE pbi.package_id = hp.id
    ORDER BY pb.created_at DESC
    LIMIT 1
  ) AS latest_production_batch_number,
  (
    SELECT pb.id
    FROM production_batch_inputs pbi
    JOIN production_batches pb ON pb.id = pbi.production_batch_id
    WHERE pbi.package_id = hp.id
    ORDER BY pb.created_at DESC
    LIMIT 1
  ) AS latest_production_batch_id
FROM harvest_packages hp;

-- Create view for harvests with production status
CREATE OR REPLACE VIEW harvests_with_production_status AS
SELECT
  hr.*,
  (
    SELECT COUNT(DISTINCT pb.id)
    FROM production_batches pb
    WHERE pb.source_harvest_id = hr.id
  ) AS total_production_batches,
  (
    SELECT COUNT(DISTINCT pb.id)
    FROM production_batches pb
    WHERE pb.source_harvest_id = hr.id AND pb.status = 'in_progress'
  ) AS production_batches_in_progress,
  (
    SELECT COUNT(DISTINCT pb.id)
    FROM production_batches pb
    WHERE pb.source_harvest_id = hr.id AND pb.status = 'completed'
  ) AS production_batches_completed,
  EXISTS (
    SELECT 1 FROM production_batches pb
    WHERE pb.source_harvest_id = hr.id AND pb.status = 'in_progress'
  ) AS has_active_production
FROM harvest_records hr;

-- RLS Policies
ALTER TABLE production_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batch_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batch_outputs ENABLE ROW LEVEL SECURITY;

-- Production recipes policies
CREATE POLICY "Users can view production recipes for their organization"
  ON production_recipes
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create production recipes for their organization"
  ON production_recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update production recipes for their organization"
  ON production_recipes
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete production recipes for their organization"
  ON production_recipes
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Production batches policies
CREATE POLICY "Users can view production batches for their organization"
  ON production_batches
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create production batches for their organization"
  ON production_batches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update production batches for their organization"
  ON production_batches
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete production batches for their organization"
  ON production_batches
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Production batch inputs policies (inherit from production_batches org check)
CREATE POLICY "Users can view production batch inputs"
  ON production_batch_inputs
  FOR SELECT
  TO authenticated
  USING (
    production_batch_id IN (
      SELECT id FROM production_batches
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage production batch inputs"
  ON production_batch_inputs
  FOR ALL
  TO authenticated
  USING (
    production_batch_id IN (
      SELECT id FROM production_batches
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    production_batch_id IN (
      SELECT id FROM production_batches
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Production batch outputs policies (similar pattern)
CREATE POLICY "Users can view production batch outputs"
  ON production_batch_outputs
  FOR SELECT
  TO authenticated
  USING (
    production_batch_id IN (
      SELECT id FROM production_batches
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage production batch outputs"
  ON production_batch_outputs
  FOR ALL
  TO authenticated
  USING (
    production_batch_id IN (
      SELECT id FROM production_batches
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    production_batch_id IN (
      SELECT id FROM production_batches
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Add comments for documentation
COMMENT ON TABLE production_recipes IS 'Templates for common production processes (extraction, infusion, pre-rolls, etc.)';
COMMENT ON TABLE production_batches IS 'Tracks transformation of harvest packages into final products';
COMMENT ON TABLE production_batch_inputs IS 'Input packages consumed during production';
COMMENT ON TABLE production_batch_outputs IS 'Output products/packages created from production';
COMMENT ON COLUMN production_batches.batch_number IS 'Auto-generated batch number in format PROD-YYYY-MM-XXXXX';
COMMENT ON COLUMN production_batches.production_type IS 'Type of production: processing, extraction, infusion, packaging, preroll, other';
COMMENT ON COLUMN production_batches.status IS 'Production status: planned, in_progress, completed, cancelled';
COMMENT ON COLUMN production_recipes.expected_yield_percentage IS 'Expected output as percentage of input (e.g., 20 for 20% yield in extraction)';
