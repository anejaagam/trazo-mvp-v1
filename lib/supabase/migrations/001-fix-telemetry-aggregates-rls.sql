-- =====================================================
-- CRITICAL SECURITY FIX: Telemetry Aggregation Tables RLS
-- Migration: 001-fix-telemetry-aggregates-rls
-- Date: 2025-11-12
-- Priority: CRITICAL
-- =====================================================
-- 
-- ISSUE: telemetry_readings_hourly and telemetry_readings_daily 
--        have NO RLS policies, exposing all telemetry data publicly
--
-- IMPACT: Multi-tenancy completely broken - users from one org 
--         can access another org's aggregated sensor data
--
-- FIX: Enable RLS and add org-scoped policies matching the 
--      pattern used for telemetry_readings table
-- =====================================================

-- The tables should already have RLS enabled (check schema.sql line 35)
-- But we'll ensure it here just in case
ALTER TABLE telemetry_readings_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_readings_daily ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TELEMETRY_READINGS_HOURLY POLICIES
-- =====================================================

-- DROP existing policies if any (clean slate)
DROP POLICY IF EXISTS "Users can view hourly telemetry in their org" ON telemetry_readings_hourly;
DROP POLICY IF EXISTS "Service can create hourly telemetry" ON telemetry_readings_hourly;
DROP POLICY IF EXISTS "No hourly telemetry updates" ON telemetry_readings_hourly;
DROP POLICY IF EXISTS "Org admins can delete hourly telemetry" ON telemetry_readings_hourly;

-- Users can view hourly telemetry in their organization
-- Pattern matches telemetry_readings policy from rls-policies.sql
CREATE POLICY "Users can view hourly telemetry in their org"
  ON telemetry_readings_hourly FOR SELECT
  USING (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- Service role can insert hourly aggregates (from aggregation functions)
CREATE POLICY "Service can create hourly telemetry"
  ON telemetry_readings_hourly FOR INSERT
  WITH CHECK (TRUE);

-- No updates on hourly aggregates (time-series data integrity)
CREATE POLICY "No hourly telemetry updates"
  ON telemetry_readings_hourly FOR UPDATE
  USING (FALSE);

-- Only org_admins can delete hourly telemetry (cleanup/maintenance)
CREATE POLICY "Org admins can delete hourly telemetry"
  ON telemetry_readings_hourly FOR DELETE
  USING (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'org_admin'
  );

-- =====================================================
-- TELEMETRY_READINGS_DAILY POLICIES
-- =====================================================

-- DROP existing policies if any (clean slate)
DROP POLICY IF EXISTS "Users can view daily telemetry in their org" ON telemetry_readings_daily;
DROP POLICY IF EXISTS "Service can create daily telemetry" ON telemetry_readings_daily;
DROP POLICY IF EXISTS "No daily telemetry updates" ON telemetry_readings_daily;
DROP POLICY IF EXISTS "Org admins can delete daily telemetry" ON telemetry_readings_daily;

-- Users can view daily telemetry in their organization
CREATE POLICY "Users can view daily telemetry in their org"
  ON telemetry_readings_daily FOR SELECT
  USING (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- Service role can insert daily aggregates
CREATE POLICY "Service can create daily telemetry"
  ON telemetry_readings_daily FOR INSERT
  WITH CHECK (TRUE);

-- No updates on daily aggregates
CREATE POLICY "No daily telemetry updates"
  ON telemetry_readings_daily FOR UPDATE
  USING (FALSE);

-- Only org_admins can delete daily telemetry
CREATE POLICY "Org admins can delete daily telemetry"
  ON telemetry_readings_daily FOR DELETE
  USING (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'org_admin'
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify policies are active:
-- SELECT tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('telemetry_readings_hourly', 'telemetry_readings_daily')
-- ORDER BY tablename, cmd;

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('telemetry_readings_hourly', 'telemetry_readings_daily');
