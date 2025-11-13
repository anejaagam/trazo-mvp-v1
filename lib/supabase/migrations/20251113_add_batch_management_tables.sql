-- Migration: Batch Management Tables and Policies
-- Purpose: Add comprehensive batch management system with cultivation tracking
-- Created: November 13, 2025
-- 
-- This migration creates:
-- 1. Six new batch-related tables (batch_groups, growing_areas, batch_stage_history, harvest_records, plant_count_snapshots, post_harvest_records)
-- 2. Performance indexes for all new tables
-- 3. Row-level security (RLS) policies for multi-tenancy and RBAC
-- 4. Triggers for automatic timestamp updates
--
-- Note: waste_logs table already exists with comprehensive fields, so not recreated

-- ============================================================================
-- PART 1: New Tables
-- ============================================================================

-- Batch groups (for organizing batches)
CREATE TABLE IF NOT EXISTS batch_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Growing areas (rooms/locations for batch cultivation)
CREATE TABLE IF NOT EXISTS growing_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('greenhouse', 'indoor', 'field', 'nursery')),
  capacity INTEGER NOT NULL,
  current_occupancy INTEGER DEFAULT 0,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch stage history (audit trail for stage transitions)
CREATE TABLE IF NOT EXISTS batch_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  transitioned_by UUID REFERENCES users(id),
  notes TEXT
);

-- Harvest records (tracking harvest events)
CREATE TABLE IF NOT EXISTS harvest_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wet_weight DECIMAL(10, 2) NOT NULL,
  plant_count INTEGER NOT NULL,
  harvested_at TIMESTAMPTZ NOT NULL,
  harvested_by UUID REFERENCES users(id),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plant count snapshots (tracking plant counts at specific points in time)
CREATE TABLE IF NOT EXISTS plant_count_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  plant_count INTEGER NOT NULL,
  stage TEXT NOT NULL,
  counted_at TIMESTAMPTZ NOT NULL,
  counted_by UUID REFERENCES users(id),
  notes TEXT
);

-- Post-harvest processing records (drying, curing, packaging)
CREATE TABLE IF NOT EXISTS post_harvest_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  process_type TEXT NOT NULL CHECK (process_type IN ('drying', 'curing', 'packaging')),
  start_weight DECIMAL(10, 2),
  end_weight DECIMAL(10, 2),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  location TEXT,
  performed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 2: Performance Indexes
-- ============================================================================

-- Batch groups indexes
CREATE INDEX IF NOT EXISTS idx_batch_groups_org_site ON batch_groups(organization_id, site_id) WHERE is_active = TRUE;

-- Growing areas indexes
CREATE INDEX IF NOT EXISTS idx_growing_areas_org_site ON growing_areas(organization_id, site_id) WHERE is_active = TRUE;

-- Batch stage history indexes
CREATE INDEX IF NOT EXISTS idx_batch_stage_history_batch ON batch_stage_history(batch_id, started_at DESC);

-- Harvest records indexes
CREATE INDEX IF NOT EXISTS idx_harvest_records_batch ON harvest_records(batch_id, harvested_at DESC);

-- Plant count snapshots indexes
CREATE INDEX IF NOT EXISTS idx_plant_count_snapshots_batch ON plant_count_snapshots(batch_id, counted_at DESC);

-- Waste logs indexes (for existing table)
CREATE INDEX IF NOT EXISTS idx_waste_logs_org_site ON waste_logs(organization_id, site_id, status);
CREATE INDEX IF NOT EXISTS idx_waste_logs_status_pending ON waste_logs(status) WHERE status = 'pending_approval';
CREATE INDEX IF NOT EXISTS idx_waste_logs_batch ON waste_logs(batch_id) WHERE batch_id IS NOT NULL;

-- Post-harvest records indexes
CREATE INDEX IF NOT EXISTS idx_post_harvest_records_batch ON post_harvest_records(batch_id, process_type);

-- Plant tags indexes (for existing table)
CREATE INDEX IF NOT EXISTS idx_plant_tags_batch ON plant_tags(batch_id, plant_state);

-- ============================================================================
-- PART 3: Triggers for Timestamp Updates
-- ============================================================================

-- Trigger for growing_areas updated_at
CREATE TRIGGER update_growing_areas_updated_at 
  BEFORE UPDATE ON growing_areas
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 4: Enable Row-Level Security
-- ============================================================================

ALTER TABLE batch_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE growing_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_count_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_harvest_records ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: RLS Policies - Batch Groups
-- ============================================================================

-- Users can view batch groups in their organization
CREATE POLICY "Users can view batch groups in their org"
  ON batch_groups FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Growers and above can create batch groups
CREATE POLICY "Growers can create batch groups"
  ON batch_groups FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Growers and above can update batch groups
CREATE POLICY "Growers can update batch groups"
  ON batch_groups FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Only admins and managers can delete batch groups
CREATE POLICY "Admins can delete batch groups"
  ON batch_groups FOR DELETE
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'site_manager')
  );

-- ============================================================================
-- PART 6: RLS Policies - Growing Areas
-- ============================================================================

-- Users can view growing areas in their organization
CREATE POLICY "Users can view growing areas in their org"
  ON growing_areas FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Growers and above can create growing areas
CREATE POLICY "Growers can create growing areas"
  ON growing_areas FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Growers and above can update growing areas
CREATE POLICY "Growers can update growing areas"
  ON growing_areas FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Only admins and managers can delete growing areas
CREATE POLICY "Admins can delete growing areas"
  ON growing_areas FOR DELETE
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'site_manager')
  );

-- ============================================================================
-- PART 7: RLS Policies - Batch Stage History
-- ============================================================================

-- Users can view batch stage history in their organization
CREATE POLICY "Users can view batch stage history in their org"
  ON batch_stage_history FOR SELECT
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- Growers and operators can create batch stage history
CREATE POLICY "Growers can create batch stage history"
  ON batch_stage_history FOR INSERT
  WITH CHECK (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- No updates or deletes on stage history (audit trail)
CREATE POLICY "No batch stage history updates"
  ON batch_stage_history FOR UPDATE
  USING (FALSE);

CREATE POLICY "No batch stage history deletes"
  ON batch_stage_history FOR DELETE
  USING (FALSE);

-- ============================================================================
-- PART 8: RLS Policies - Harvest Records
-- ============================================================================

-- Users can view harvest records in their organization
CREATE POLICY "Users can view harvest records in their org"
  ON harvest_records FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Growers and operators can create harvest records
CREATE POLICY "Growers can create harvest records"
  ON harvest_records FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- No updates or deletes on harvest records (audit trail)
CREATE POLICY "No harvest record updates"
  ON harvest_records FOR UPDATE
  USING (FALSE);

CREATE POLICY "No harvest record deletes"
  ON harvest_records FOR DELETE
  USING (FALSE);

-- ============================================================================
-- PART 9: RLS Policies - Plant Count Snapshots
-- ============================================================================

-- Users can view plant count snapshots in their organization
CREATE POLICY "Users can view plant count snapshots in their org"
  ON plant_count_snapshots FOR SELECT
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- Growers and operators can create plant count snapshots
CREATE POLICY "Growers can create plant count snapshots"
  ON plant_count_snapshots FOR INSERT
  WITH CHECK (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- No updates or deletes on plant count snapshots (audit trail)
CREATE POLICY "No plant count snapshot updates"
  ON plant_count_snapshots FOR UPDATE
  USING (FALSE);

CREATE POLICY "No plant count snapshot deletes"
  ON plant_count_snapshots FOR DELETE
  USING (FALSE);

-- ============================================================================
-- PART 10: RLS Policies - Post Harvest Records
-- ============================================================================

-- Users can view post harvest records in their organization
CREATE POLICY "Users can view post harvest records in their org"
  ON post_harvest_records FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Growers and operators can create post harvest records
CREATE POLICY "Growers can create post harvest records"
  ON post_harvest_records FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- Growers and operators can update post harvest records
CREATE POLICY "Growers can update post harvest records"
  ON post_harvest_records FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- Only growers and above can delete post harvest records
CREATE POLICY "Growers can delete post harvest records"
  ON post_harvest_records FOR DELETE
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'site_manager', 'head_grower')
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- This migration adds comprehensive batch management tables with:
-- - 6 new tables for batch operations
-- - 11 performance indexes
-- - Complete RLS policies for multi-tenancy and RBAC
-- - Audit trail protection for immutable records
-- ============================================================================
