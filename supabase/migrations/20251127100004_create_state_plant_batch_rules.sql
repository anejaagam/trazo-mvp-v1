-- Migration: Create State Plant Batch Rules Table
-- Configurable per-state rules for plant batch compliance
-- Supports Oregon, California, Maryland with extensible architecture

CREATE TABLE IF NOT EXISTS state_plant_batch_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code TEXT NOT NULL UNIQUE,
  state_name TEXT NOT NULL,

  -- Tracking mode defaults
  default_tracking_mode TEXT DEFAULT 'open_loop'
    CHECK (default_tracking_mode IN ('open_loop', 'closed_loop', 'hybrid')),
  allow_mode_switch BOOLEAN DEFAULT true,

  -- Tagging triggers (JSONB for flexibility)
  -- Examples:
  -- [{"type":"height","threshold":36}] - Oregon 36" rule
  -- [{"type":"flowering"}] - California flowering trigger
  -- [{"type":"all_plants"}] - Maryland immediate tagging
  tagging_triggers JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Batch limits
  max_plants_per_batch INTEGER DEFAULT 100,
  supports_batch_tagging BOOLEAN DEFAULT false,  -- Oregon June 2024 option

  -- Tag requirements
  tag_technology TEXT DEFAULT 'barcode'
    CHECK (tag_technology IN ('barcode', 'rfid')),
  tag_format_regex TEXT,
  tag_format_example TEXT,

  -- Immature plant rules (nursery)
  allows_immature_packages BOOLEAN DEFAULT true,
  immature_package_min_count INTEGER DEFAULT 1,
  immature_package_max_count INTEGER,

  -- Source traceability requirements
  requires_source_tracking BOOLEAN DEFAULT true,

  -- Growth phase mapping (map TRAZO stages to Metrc phases)
  growth_phase_mapping JSONB DEFAULT '{
    "clone": "Clone",
    "vegetative": "Vegetative",
    "flowering": "Flowering"
  }'::jsonb,

  -- Additional state-specific notes
  compliance_notes TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on state_code for lookups
CREATE INDEX IF NOT EXISTS idx_state_plant_batch_rules_state ON state_plant_batch_rules(state_code);

-- Seed initial state configurations for Oregon, California, and Maryland
INSERT INTO state_plant_batch_rules (
  state_code,
  state_name,
  default_tracking_mode,
  tagging_triggers,
  max_plants_per_batch,
  tag_technology,
  tag_format_regex,
  tag_format_example,
  supports_batch_tagging,
  allows_immature_packages,
  requires_source_tracking,
  compliance_notes
) VALUES
-- Oregon: 36" height or flowering triggers tagging, supports batch tagging (June 2024)
(
  'OR',
  'Oregon',
  'open_loop',
  '[{"type":"height","threshold":36,"unit":"inches"},{"type":"flowering"}]'::jsonb,
  100,
  'barcode',
  '^1A4FF[A-Z0-9]{2}[0-9]{15}$',
  '1A4FFAB000001234567890',
  true,  -- June 2024 batch tagging option
  true,
  true,
  'Oregon allows batch-level tracking until plants reach 36" or enter flowering. June 2024 rule allows single tag for up to 100 plants.'
),
-- California: Flowering triggers tagging, canopy area tracking required
(
  'CA',
  'California',
  'open_loop',
  '[{"type":"flowering"},{"type":"canopy_area"}]'::jsonb,
  100,
  'barcode',
  '^1A406[A-Z0-9]{2}[0-9]{15}$',
  '1A406AB000001234567890',
  false,
  true,
  true,
  'California requires individual tagging when plants enter flowering. Canopy area must be tracked for flowering plants.'
),
-- Maryland: All plants must be tagged immediately (RFID)
(
  'MD',
  'Maryland',
  'closed_loop',
  '[{"type":"all_plants"}]'::jsonb,
  99999,  -- No practical limit
  'rfid',
  '^[A-Z0-9]{24}$',
  'MD123456789012345678901234',
  false,
  true,  -- Check regulations
  true,
  'Maryland requires RFID tagging for all tracked plants from creation. Full seed-to-sale genealogy required.'
)
ON CONFLICT (state_code) DO UPDATE SET
  state_name = EXCLUDED.state_name,
  default_tracking_mode = EXCLUDED.default_tracking_mode,
  tagging_triggers = EXCLUDED.tagging_triggers,
  max_plants_per_batch = EXCLUDED.max_plants_per_batch,
  tag_technology = EXCLUDED.tag_technology,
  tag_format_regex = EXCLUDED.tag_format_regex,
  tag_format_example = EXCLUDED.tag_format_example,
  supports_batch_tagging = EXCLUDED.supports_batch_tagging,
  allows_immature_packages = EXCLUDED.allows_immature_packages,
  requires_source_tracking = EXCLUDED.requires_source_tracking,
  compliance_notes = EXCLUDED.compliance_notes,
  updated_at = now();

-- Trigger for updated_at
CREATE TRIGGER update_state_plant_batch_rules_updated_at
BEFORE UPDATE ON state_plant_batch_rules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE state_plant_batch_rules IS 'State-specific plant batch compliance rules for Metrc integration. Defines tagging triggers, batch limits, and tracking requirements.';
COMMENT ON COLUMN state_plant_batch_rules.tagging_triggers IS 'JSON array of conditions that trigger individual plant tagging. Types: height, flowering, canopy_area, all_plants, stage';
COMMENT ON COLUMN state_plant_batch_rules.default_tracking_mode IS 'Default tracking mode for new batches: open_loop (count), closed_loop (individual tags), hybrid (flexible)';
COMMENT ON COLUMN state_plant_batch_rules.supports_batch_tagging IS 'Oregon June 2024: Can assign single tag to group of ≤100 plants';
COMMENT ON COLUMN state_plant_batch_rules.growth_phase_mapping IS 'Maps TRAZO stage names to Metrc growth phase names';
