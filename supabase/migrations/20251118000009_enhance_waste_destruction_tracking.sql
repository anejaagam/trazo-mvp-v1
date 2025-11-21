-- =====================================================
-- ENHANCE WASTE_LOGS TABLE FOR WEEK 6
-- =====================================================
-- Add new columns to existing waste_logs table for cannabis destruction compliance

ALTER TABLE waste_logs
  -- Entity references (link to specific source entities)
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES harvest_packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS harvest_id UUID REFERENCES harvest_records(id) ON DELETE SET NULL,

  -- Destruction details
  ADD COLUMN IF NOT EXISTS destruction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS witnessed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS witness_name TEXT,

  -- Rendering method (50:50 compliance for OR/MD)
  ADD COLUMN IF NOT EXISTS rendering_method TEXT CHECK (rendering_method IN (
    '50_50_sawdust',
    '50_50_kitty_litter',
    '50_50_soil',
    '50_50_other_inert',
    'composting',
    'grinding',
    'incineration',
    'other'
  )),
  ADD COLUMN IF NOT EXISTS inert_material_description TEXT,
  ADD COLUMN IF NOT EXISTS inert_material_weight DECIMAL(10, 4),
  ADD COLUMN IF NOT EXISTS inert_material_unit TEXT DEFAULT 'Kilograms',

  -- Waste classification (enhanced)
  ADD COLUMN IF NOT EXISTS waste_category TEXT CHECK (waste_category IN (
    'plant_material',      -- stems, leaves, roots
    'package_waste',       -- failed products
    'harvest_trim',        -- trim waste (from harvest)
    'spoiled_product',     -- contaminated/expired
    'batch_destruction',   -- full batch destruction
    'other'
  )),
  ADD COLUMN IF NOT EXISTS waste_number TEXT,  -- Auto-generated: WST-YYYY-MM-XXXXX

  -- Photo evidence (enhanced)
  ADD COLUMN IF NOT EXISTS photo_evidence_urls TEXT[], -- Array of S3 URLs

  -- Enhanced Metrc fields
  ADD COLUMN IF NOT EXISTS metrc_plant_batch_id TEXT, -- For plant batch destruction
  ADD COLUMN IF NOT EXISTS metrc_package_label TEXT,  -- For package destruction
  ADD COLUMN IF NOT EXISTS metrc_waste_type TEXT,     -- Metrc waste type classification
  ADD COLUMN IF NOT EXISTS metrc_waste_method TEXT,   -- Metrc disposal method name

  -- Sync tracking (enhanced)
  ADD COLUMN IF NOT EXISTS sync_attempted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_error_message TEXT,
  ADD COLUMN IF NOT EXISTS sync_retry_count INTEGER DEFAULT 0,

  -- Domain type (cannabis, produce, etc.)
  ADD COLUMN IF NOT EXISTS domain_type TEXT DEFAULT 'cannabis' CHECK (domain_type IN ('cannabis', 'produce'));

-- Add unique constraint for waste number per organization
ALTER TABLE waste_logs
  ADD CONSTRAINT unique_waste_number_per_org UNIQUE (organization_id, waste_number);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_waste_logs_batch ON waste_logs(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waste_logs_package ON waste_logs(package_id) WHERE package_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waste_logs_harvest ON waste_logs(harvest_id) WHERE harvest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waste_logs_destruction_date ON waste_logs(destruction_date);
CREATE INDEX IF NOT EXISTS idx_waste_logs_metrc_sync ON waste_logs(metrc_sync_status);
CREATE INDEX IF NOT EXISTS idx_waste_logs_waste_category ON waste_logs(waste_category);
CREATE INDEX IF NOT EXISTS idx_waste_logs_waste_number ON waste_logs(waste_number) WHERE waste_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waste_logs_domain_type ON waste_logs(domain_type);

-- Comments
COMMENT ON COLUMN waste_logs.rendering_method IS '50:50 mix method for OR/MD compliance';
COMMENT ON COLUMN waste_logs.waste_category IS 'Type of waste: plant material, package, trim, etc.';
COMMENT ON COLUMN waste_logs.inert_material_weight IS 'Weight of inert material used for 50:50 mix';
COMMENT ON COLUMN waste_logs.photo_evidence_urls IS 'Array of S3 URLs for destruction photos';
COMMENT ON COLUMN waste_logs.waste_number IS 'Auto-generated waste log number: WST-YYYY-MM-XXXXX';
COMMENT ON COLUMN waste_logs.domain_type IS 'Domain classification: cannabis or produce';

-- =====================================================
-- WASTE DESTRUCTION EVENTS TABLE
-- =====================================================
-- Track individual destruction events with details and Metrc sync

CREATE TABLE IF NOT EXISTS waste_destruction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Event identification
  event_number TEXT NOT NULL, -- Auto-generated: WDE-YYYY-MM-XXXXX

  -- Waste reference
  waste_log_id UUID NOT NULL REFERENCES waste_logs(id) ON DELETE CASCADE,

  -- Entity references
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  package_id UUID REFERENCES harvest_packages(id) ON DELETE SET NULL,
  harvest_id UUID REFERENCES harvest_records(id) ON DELETE SET NULL,

  -- Destruction details
  destruction_type TEXT CHECK (destruction_type IN (
    'plant_batch_destruction',
    'package_adjustment',
    'harvest_waste_removal',
    'general_waste'
  )),

  -- Plants destroyed (for plant batch destruction)
  plants_destroyed INTEGER,
  plant_tags_destroyed TEXT[], -- Array of destroyed plant tags

  -- Weight destroyed
  weight_destroyed DECIMAL(10, 4) NOT NULL,
  unit_of_weight TEXT DEFAULT 'Grams',

  -- Metrc sync
  metrc_transaction_id TEXT,
  metrc_sync_status TEXT DEFAULT 'pending' CHECK (metrc_sync_status IN ('pending', 'synced', 'failed')),
  metrc_sync_error TEXT,
  metrc_synced_at TIMESTAMPTZ,

  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_event_number UNIQUE (organization_id, event_number),
  CONSTRAINT check_plants_for_batch_destruction CHECK (
    (destruction_type = 'plant_batch_destruction' AND plants_destroyed IS NOT NULL)
    OR destruction_type != 'plant_batch_destruction'
  )
);

-- Indexes
CREATE INDEX idx_waste_destruction_events_waste_log ON waste_destruction_events(waste_log_id);
CREATE INDEX idx_waste_destruction_events_batch ON waste_destruction_events(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_waste_destruction_events_package ON waste_destruction_events(package_id) WHERE package_id IS NOT NULL;
CREATE INDEX idx_waste_destruction_events_created_at ON waste_destruction_events(created_at);
CREATE INDEX idx_waste_destruction_events_metrc_sync ON waste_destruction_events(metrc_sync_status);
CREATE INDEX idx_waste_destruction_events_event_number ON waste_destruction_events(event_number);

-- RLS Policies
ALTER TABLE waste_destruction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view destruction events for their organization"
  ON waste_destruction_events FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage destruction events for their organization"
  ON waste_destruction_events FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE waste_destruction_events IS 'Individual waste destruction events with Metrc sync tracking';
COMMENT ON COLUMN waste_destruction_events.plant_tags_destroyed IS 'Array of individual plant tags destroyed (from batch_plants)';
COMMENT ON COLUMN waste_destruction_events.destruction_type IS 'Type of destruction operation for Metrc API routing';
COMMENT ON COLUMN waste_destruction_events.event_number IS 'Auto-generated destruction event number';

-- =====================================================
-- RENDERING METHOD COMPLIANCE VIEW
-- =====================================================
-- View to check rendering method compliance for cannabis waste

CREATE OR REPLACE VIEW rendering_method_compliance AS
SELECT
  wl.id AS waste_log_id,
  wl.waste_number,
  wl.rendering_method,
  wl.waste_type AS waste_category,
  wl.quantity AS waste_weight,
  wl.unit_of_measure AS waste_unit,
  wl.inert_material_weight,
  wl.inert_material_unit,
  wl.inert_material_description,
  wl.domain_type,
  wl.site_id,
  s.name AS site_name,
  wl.organization_id,

  -- Calculate 50:50 ratio compliance (allow 10% tolerance)
  CASE
    WHEN wl.rendering_method LIKE '50_50%' THEN
      CASE
        WHEN wl.inert_material_weight IS NULL THEN FALSE
        -- Convert to same unit and check ratio
        WHEN wl.unit_of_measure = wl.inert_material_unit THEN
          CASE
            WHEN wl.inert_material_weight < (wl.quantity * 0.9) THEN FALSE
            WHEN wl.inert_material_weight > (wl.quantity * 1.1) THEN FALSE
            ELSE TRUE
          END
        ELSE TRUE -- Different units, assume compliance (validation happens elsewhere)
      END
    ELSE TRUE -- Other methods don't require 50:50
  END AS is_ratio_compliant,

  -- Compliance status
  CASE
    WHEN wl.rendering_method IS NULL AND wl.domain_type = 'cannabis' THEN 'missing_method'
    WHEN wl.rendering_method LIKE '50_50%' AND wl.inert_material_weight IS NULL THEN 'missing_inert_weight'
    WHEN wl.rendering_method LIKE '50_50%' AND wl.unit_of_measure = wl.inert_material_unit AND
         (wl.inert_material_weight < wl.quantity * 0.9 OR wl.inert_material_weight > wl.quantity * 1.1) THEN 'ratio_noncompliant'
    WHEN wl.witnessed_by IS NULL AND wl.domain_type = 'cannabis' THEN 'missing_witness'
    WHEN wl.rendered_unusable = FALSE AND wl.domain_type = 'cannabis' THEN 'not_rendered'
    ELSE 'compliant'
  END AS compliance_status,

  -- Additional compliance checks
  wl.witnessed_by IS NOT NULL AS has_witness,
  wl.rendered_unusable AS is_rendered,
  COALESCE(array_length(wl.photo_evidence_urls, 1), 0) >= 2 AS has_sufficient_photos,

  wl.created_at,
  wl.destruction_date

FROM waste_logs wl
INNER JOIN sites s ON s.id = wl.site_id
WHERE wl.domain_type = 'cannabis'
ORDER BY wl.destruction_date DESC;

COMMENT ON VIEW rendering_method_compliance IS 'Validates 50:50 rendering method compliance for cannabis waste destruction';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at trigger for waste_destruction_events
CREATE TRIGGER update_waste_destruction_events_updated_at
  BEFORE UPDATE ON waste_destruction_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR AUTO-NUMBERING
-- =====================================================

-- Function to generate next waste number for an organization
CREATE OR REPLACE FUNCTION generate_waste_number(p_organization_id UUID, p_destruction_date DATE)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_sequence INTEGER;
  v_waste_number TEXT;
BEGIN
  -- Extract year and month
  v_year := TO_CHAR(p_destruction_date, 'YYYY');
  v_month := TO_CHAR(p_destruction_date, 'MM');

  -- Get count for this month
  SELECT COUNT(*) + 1 INTO v_sequence
  FROM waste_logs
  WHERE organization_id = p_organization_id
    AND DATE_TRUNC('month', destruction_date) = DATE_TRUNC('month', p_destruction_date);

  -- Format: WST-YYYY-MM-XXXXX
  v_waste_number := 'WST-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::TEXT, 5, '0');

  RETURN v_waste_number;
END;
$$;

-- Function to generate next destruction event number
CREATE OR REPLACE FUNCTION generate_destruction_event_number(p_organization_id UUID, p_event_date TIMESTAMPTZ)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_sequence INTEGER;
  v_event_number TEXT;
BEGIN
  -- Extract year and month
  v_year := TO_CHAR(p_event_date, 'YYYY');
  v_month := TO_CHAR(p_event_date, 'MM');

  -- Get count for this month
  SELECT COUNT(*) + 1 INTO v_sequence
  FROM waste_destruction_events
  WHERE organization_id = p_organization_id
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', p_event_date);

  -- Format: WDE-YYYY-MM-XXXXX
  v_event_number := 'WDE-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::TEXT, 5, '0');

  RETURN v_event_number;
END;
$$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comments on functions
COMMENT ON FUNCTION generate_waste_number IS 'Auto-generates waste log number in format WST-YYYY-MM-XXXXX';
COMMENT ON FUNCTION generate_destruction_event_number IS 'Auto-generates destruction event number in format WDE-YYYY-MM-XXXXX';
