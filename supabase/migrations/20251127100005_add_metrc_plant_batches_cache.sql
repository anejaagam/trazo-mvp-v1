-- Migration: Add Metrc Plant Batches Cache Table
-- Description: Creates cache table for Metrc plant batches to store synced data from Metrc
-- Author: Claude (Anthropic)
-- Date: 2025-11-27

-- =====================================================
-- METRC PLANT BATCHES CACHE TABLE
-- =====================================================
-- Caches plant batches from Metrc for lookup and compliance tracking
-- This stores the Metrc-side plant batch data separately from TRAZO batches

CREATE TABLE IF NOT EXISTS metrc_plant_batches_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Metrc plant batch data (from MetrcPlantBatch type)
  metrc_batch_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Seed', 'Clone')),
  count INTEGER NOT NULL DEFAULT 0,
  strain_name TEXT NOT NULL,
  planted_date DATE NOT NULL,

  -- Facility info
  facility_license_number TEXT,
  facility_name TEXT,
  room_name TEXT,

  -- Status tracking
  destroyed_date DATE,
  untracked_count INTEGER DEFAULT 0,
  tracked_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Link to TRAZO batch (if mapped)
  trazo_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,

  -- Sync tracking
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique plant batch per site
  UNIQUE(site_id, metrc_batch_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_metrc_plant_batches_cache_org ON metrc_plant_batches_cache(organization_id);
CREATE INDEX IF NOT EXISTS idx_metrc_plant_batches_cache_site ON metrc_plant_batches_cache(site_id);
CREATE INDEX IF NOT EXISTS idx_metrc_plant_batches_cache_name ON metrc_plant_batches_cache(name);
CREATE INDEX IF NOT EXISTS idx_metrc_plant_batches_cache_metrc_id ON metrc_plant_batches_cache(metrc_batch_id);
CREATE INDEX IF NOT EXISTS idx_metrc_plant_batches_cache_strain ON metrc_plant_batches_cache(strain_name);
CREATE INDEX IF NOT EXISTS idx_metrc_plant_batches_cache_active ON metrc_plant_batches_cache(is_active);
CREATE INDEX IF NOT EXISTS idx_metrc_plant_batches_cache_trazo ON metrc_plant_batches_cache(trazo_batch_id) WHERE trazo_batch_id IS NOT NULL;

-- RLS policies
ALTER TABLE metrc_plant_batches_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plant batches in their organization"
  ON metrc_plant_batches_cache FOR SELECT
  USING (organization_id IN (
    SELECT users.organization_id FROM users WHERE users.id = auth.uid()
  ));

CREATE POLICY "Organization users can manage plant batches cache"
  ON metrc_plant_batches_cache FOR ALL
  USING (organization_id IN (
    SELECT users.organization_id FROM users WHERE users.id = auth.uid()
  ));

-- Apply timestamp trigger
DROP TRIGGER IF EXISTS update_metrc_plant_batches_cache_timestamp ON metrc_plant_batches_cache;
CREATE TRIGGER update_metrc_plant_batches_cache_timestamp
  BEFORE UPDATE ON metrc_plant_batches_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_metrc_cache_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE metrc_plant_batches_cache IS 'Cache of plant batches from Metrc for compliance tracking and lookup';
COMMENT ON COLUMN metrc_plant_batches_cache.metrc_batch_id IS 'The unique Metrc plant batch ID';
COMMENT ON COLUMN metrc_plant_batches_cache.trazo_batch_id IS 'Optional link to the corresponding TRAZO batch';
COMMENT ON COLUMN metrc_plant_batches_cache.is_active IS 'Whether the plant batch is active (not destroyed) in Metrc';
