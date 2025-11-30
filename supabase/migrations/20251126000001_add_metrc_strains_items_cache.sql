-- Migration: Add Metrc Strains and Items Cache Tables
-- Description: Creates cache tables for Metrc strains and items, adds Metrc tracking columns to cultivars
-- Author: Claude (Anthropic)
-- Date: 2025-11-26

-- =====================================================
-- METRC STRAINS CACHE TABLE
-- =====================================================
-- Caches approved strains from Metrc for validation and lookup

CREATE TABLE IF NOT EXISTS metrc_strains_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Metrc strain data
  metrc_strain_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  testing_status TEXT,
  thc_level DECIMAL(5,2),
  cbd_level DECIMAL(5,2),
  indica_percentage INTEGER CHECK (indica_percentage IS NULL OR (indica_percentage >= 0 AND indica_percentage <= 100)),
  sativa_percentage INTEGER CHECK (sativa_percentage IS NULL OR (sativa_percentage >= 0 AND sativa_percentage <= 100)),
  is_used BOOLEAN DEFAULT false,

  -- Sync tracking
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique strain per site
  UNIQUE(site_id, metrc_strain_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_metrc_strains_cache_org ON metrc_strains_cache(organization_id);
CREATE INDEX IF NOT EXISTS idx_metrc_strains_cache_site ON metrc_strains_cache(site_id);
CREATE INDEX IF NOT EXISTS idx_metrc_strains_cache_name ON metrc_strains_cache(name);
CREATE INDEX IF NOT EXISTS idx_metrc_strains_cache_metrc_id ON metrc_strains_cache(metrc_strain_id);

-- RLS policies
ALTER TABLE metrc_strains_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view strains in their organization"
  ON metrc_strains_cache FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage strains"
  ON metrc_strains_cache FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_users
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- =====================================================
-- METRC ITEMS CACHE TABLE
-- =====================================================
-- Caches approved items (product types) from Metrc for validation and lookup

CREATE TABLE IF NOT EXISTS metrc_items_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Metrc item data
  metrc_item_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  product_category_name TEXT,
  product_category_type TEXT,
  quantity_type TEXT,
  default_lab_testing_state TEXT,
  unit_of_measure TEXT,
  approval_status TEXT,

  -- Strain association
  requires_strain BOOLEAN DEFAULT false,
  strain_id INTEGER,
  strain_name TEXT,

  -- Sync tracking
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique item per site
  UNIQUE(site_id, metrc_item_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_metrc_items_cache_org ON metrc_items_cache(organization_id);
CREATE INDEX IF NOT EXISTS idx_metrc_items_cache_site ON metrc_items_cache(site_id);
CREATE INDEX IF NOT EXISTS idx_metrc_items_cache_name ON metrc_items_cache(name);
CREATE INDEX IF NOT EXISTS idx_metrc_items_cache_metrc_id ON metrc_items_cache(metrc_item_id);
CREATE INDEX IF NOT EXISTS idx_metrc_items_cache_category ON metrc_items_cache(product_category_name);

-- RLS policies
ALTER TABLE metrc_items_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in their organization"
  ON metrc_items_cache FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage items"
  ON metrc_items_cache FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_users
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- =====================================================
-- ADD METRC TRACKING TO CULTIVARS
-- =====================================================
-- Add columns to track Metrc strain ID for each cultivar

DO $$
BEGIN
  -- Add metrc_strain_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cultivars' AND column_name = 'metrc_strain_id'
  ) THEN
    ALTER TABLE cultivars ADD COLUMN metrc_strain_id INTEGER;
  END IF;

  -- Add metrc_sync_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cultivars' AND column_name = 'metrc_sync_status'
  ) THEN
    ALTER TABLE cultivars ADD COLUMN metrc_sync_status TEXT DEFAULT 'not_synced';
  END IF;

  -- Add metrc_last_synced_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cultivars' AND column_name = 'metrc_last_synced_at'
  ) THEN
    ALTER TABLE cultivars ADD COLUMN metrc_last_synced_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Index for Metrc strain lookup
CREATE INDEX IF NOT EXISTS idx_cultivars_metrc_strain ON cultivars(metrc_strain_id) WHERE metrc_strain_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cultivars_metrc_sync_status ON cultivars(metrc_sync_status);

-- =====================================================
-- UPDATE TRIGGER FOR TIMESTAMPS
-- =====================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_metrc_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to strains cache
DROP TRIGGER IF EXISTS update_metrc_strains_cache_timestamp ON metrc_strains_cache;
CREATE TRIGGER update_metrc_strains_cache_timestamp
  BEFORE UPDATE ON metrc_strains_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_metrc_cache_timestamp();

-- Apply trigger to items cache
DROP TRIGGER IF EXISTS update_metrc_items_cache_timestamp ON metrc_items_cache;
CREATE TRIGGER update_metrc_items_cache_timestamp
  BEFORE UPDATE ON metrc_items_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_metrc_cache_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE metrc_strains_cache IS 'Cache of approved strains from Metrc for validation and lookup';
COMMENT ON TABLE metrc_items_cache IS 'Cache of approved items (product types) from Metrc for validation and lookup';
COMMENT ON COLUMN cultivars.metrc_strain_id IS 'Reference to the Metrc strain ID for this cultivar';
COMMENT ON COLUMN cultivars.metrc_sync_status IS 'Status of Metrc sync: not_synced, synced, sync_failed';
COMMENT ON COLUMN cultivars.metrc_last_synced_at IS 'Timestamp of last successful Metrc sync';
