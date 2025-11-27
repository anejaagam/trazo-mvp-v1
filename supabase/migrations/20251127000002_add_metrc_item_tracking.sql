-- Migration: Add Metrc Item Tracking to inventory_items
-- Description: Adds columns to track Metrc item linkage and compliance requirements
-- Author: Claude (Anthropic)
-- Date: 2025-11-27

-- =====================================================
-- ADD METRC TRACKING COLUMNS TO INVENTORY_ITEMS
-- =====================================================

DO $$
BEGIN
  -- Add metrc_item_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'metrc_item_id'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN metrc_item_id INTEGER;
  END IF;

  -- Add metrc_item_name column if it doesn't exist (cached for display)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'metrc_item_name'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN metrc_item_name TEXT;
  END IF;

  -- Add metrc_item_category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'metrc_item_category'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN metrc_item_category TEXT;
  END IF;

  -- Add metrc_sync_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'metrc_sync_status'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN metrc_sync_status TEXT DEFAULT 'not_synced';
  END IF;

  -- Add metrc_last_synced_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'metrc_last_synced_at'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN metrc_last_synced_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add requires_metrc_compliance column if it doesn't exist
  -- This flag determines if the item needs Metrc tracking (for cannabis)
  -- or can be skipped (for supplies, equipment, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'requires_metrc_compliance'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN requires_metrc_compliance BOOLEAN DEFAULT false;
  END IF;
END $$;

-- =====================================================
-- CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_inventory_items_metrc_item
  ON inventory_items(metrc_item_id)
  WHERE metrc_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_items_metrc_sync_status
  ON inventory_items(metrc_sync_status)
  WHERE metrc_sync_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_items_requires_compliance
  ON inventory_items(requires_metrc_compliance)
  WHERE requires_metrc_compliance = true;

-- =====================================================
-- SET DEFAULT COMPLIANCE FLAGS FOR EXISTING ITEMS
-- =====================================================

-- Cannabis-related items require Metrc compliance
UPDATE inventory_items
SET requires_metrc_compliance = true
WHERE item_type IN ('seeds', 'clones')
  AND requires_metrc_compliance IS NOT true;

-- Supplies and equipment do NOT require Metrc compliance
UPDATE inventory_items
SET requires_metrc_compliance = false
WHERE item_type IN ('co2_tank', 'filter', 'nutrient', 'chemical',
                    'packaging', 'sanitation', 'equipment', 'growing_medium', 'other')
  AND requires_metrc_compliance IS NULL;

-- =====================================================
-- COMPLIANCE STATUS VIEWS
-- =====================================================

-- View: Cultivar Metrc Linkage Status
CREATE OR REPLACE VIEW cultivar_metrc_status AS
SELECT
  c.id as cultivar_id,
  c.organization_id,
  c.name as cultivar_name,
  c.strain_type,
  c.metrc_strain_id,
  c.metrc_sync_status,
  c.metrc_last_synced_at,
  msc.name as metrc_strain_name,
  msc.testing_status as metrc_testing_status,
  msc.thc_level as metrc_thc_level,
  msc.cbd_level as metrc_cbd_level,
  CASE
    WHEN c.strain_type = 'produce' THEN 'not_required'
    WHEN c.metrc_strain_id IS NULL THEN 'not_linked'
    WHEN msc.id IS NULL THEN 'strain_not_in_cache'
    WHEN c.metrc_sync_status = 'synced' THEN 'compliant'
    ELSE COALESCE(c.metrc_sync_status, 'unknown')
  END as compliance_status
FROM cultivars c
LEFT JOIN metrc_strains_cache msc
  ON msc.metrc_strain_id = c.metrc_strain_id
  AND msc.organization_id = c.organization_id;

-- View: Inventory Item Metrc Status
CREATE OR REPLACE VIEW inventory_item_metrc_status AS
SELECT
  i.id as item_id,
  i.organization_id,
  i.site_id,
  i.name as item_name,
  i.item_type,
  i.sku,
  i.requires_metrc_compliance,
  i.metrc_item_id,
  i.metrc_item_name,
  i.metrc_item_category,
  i.metrc_sync_status,
  i.metrc_last_synced_at,
  mic.name as cached_metrc_name,
  mic.product_category_name as cached_category,
  CASE
    WHEN i.requires_metrc_compliance = false OR i.requires_metrc_compliance IS NULL THEN 'not_required'
    WHEN i.metrc_item_id IS NULL THEN 'not_linked'
    WHEN mic.id IS NULL THEN 'item_not_in_cache'
    WHEN i.metrc_sync_status = 'synced' THEN 'compliant'
    ELSE COALESCE(i.metrc_sync_status, 'pending')
  END as compliance_status
FROM inventory_items i
LEFT JOIN metrc_items_cache mic
  ON mic.metrc_item_id = i.metrc_item_id
  AND mic.site_id = i.site_id;

-- View: Batch Metrc Readiness
CREATE OR REPLACE VIEW batch_metrc_readiness AS
SELECT
  b.id as batch_id,
  b.organization_id,
  b.site_id,
  b.batch_number,
  b.stage,
  b.status,
  b.cultivar_id,
  c.name as cultivar_name,
  c.metrc_strain_id,
  c.metrc_sync_status as cultivar_sync_status,
  mbm.metrc_batch_id,
  mbm.sync_status as batch_sync_status,
  mbm.metrc_batch_name,
  -- Get location from pod assignment or site default
  COALESCE(p.metrc_location_name, s.default_metrc_location) as metrc_location,
  COALESCE(p.metrc_location_id, s.default_metrc_location_id) as metrc_location_id,
  -- Determine readiness
  CASE
    WHEN mbm.sync_status = 'synced' THEN 'synced'
    WHEN b.cultivar_id IS NULL THEN 'missing_cultivar'
    WHEN c.metrc_strain_id IS NULL THEN 'cultivar_not_linked'
    WHEN COALESCE(p.metrc_location_name, s.default_metrc_location) IS NULL THEN 'missing_location'
    WHEN b.domain_type != 'cannabis' THEN 'not_required'
    ELSE 'ready_to_sync'
  END as compliance_readiness,
  -- Detailed check flags
  (b.cultivar_id IS NOT NULL) as has_cultivar,
  (c.metrc_strain_id IS NOT NULL) as cultivar_linked_to_strain,
  (COALESCE(p.metrc_location_name, s.default_metrc_location) IS NOT NULL) as has_metrc_location,
  (mbm.metrc_batch_id IS NOT NULL) as is_synced_to_metrc
FROM batches b
LEFT JOIN cultivars c ON c.id = b.cultivar_id
LEFT JOIN metrc_batch_mappings mbm ON mbm.batch_id = b.id
LEFT JOIN sites s ON s.id = b.site_id
LEFT JOIN batch_pod_assignments bpa ON bpa.batch_id = b.id AND bpa.removed_at IS NULL
LEFT JOIN pods p ON p.id = bpa.pod_id
WHERE b.status NOT IN ('destroyed', 'archived');

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN inventory_items.metrc_item_id IS 'Reference to the Metrc Item ID. Used to validate that this item is an approved Metrc product type.';
COMMENT ON COLUMN inventory_items.metrc_item_name IS 'Cached name of the linked Metrc item for display purposes.';
COMMENT ON COLUMN inventory_items.metrc_item_category IS 'Cached product category from Metrc.';
COMMENT ON COLUMN inventory_items.metrc_sync_status IS 'Status of Metrc sync: not_synced, synced, sync_failed';
COMMENT ON COLUMN inventory_items.metrc_last_synced_at IS 'Timestamp of last successful Metrc sync';
COMMENT ON COLUMN inventory_items.requires_metrc_compliance IS 'True for items that must be tracked in Metrc (cannabis products). False for supplies, equipment, etc. Allows future flexibility for produce/CTLS compliance.';

COMMENT ON VIEW cultivar_metrc_status IS 'Shows compliance status of cultivars with their Metrc strain linkage';
COMMENT ON VIEW inventory_item_metrc_status IS 'Shows compliance status of inventory items with their Metrc item linkage';
COMMENT ON VIEW batch_metrc_readiness IS 'Shows which batches are ready to sync to Metrc and what requirements are missing';
