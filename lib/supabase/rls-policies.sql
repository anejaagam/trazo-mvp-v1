-- =====================================================
-- TRAZO MVP ROW LEVEL SECURITY (RLS) POLICIES
-- Comprehensive security policies for all tables
-- Version: 1.0
-- Date: October 18, 2025
-- =====================================================

-- NOTE: Apply this file AFTER schema.sql has been successfully applied
-- This file contains all Row Level Security policies for the Trazo MVP database

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_site_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivars ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_pod_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE growing_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_count_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarm_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarm_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to get the current user's organization_id
CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to get the current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user is active
CREATE OR REPLACE FUNCTION public.user_is_active()
RETURNS BOOLEAN AS $$
  SELECT is_active FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(permission_key TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions up
    WHERE up.user_id = auth.uid()
    AND up.permission_key = $1
    AND up.is_active = TRUE
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user is assigned to a site
CREATE OR REPLACE FUNCTION public.is_assigned_to_site(check_site_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_site_assignments sa
    WHERE sa.user_id = auth.uid()
    AND sa.site_id = $1
    AND sa.is_active = TRUE
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================================================
-- ORGANIZATIONS TABLE POLICIES
-- =====================================================

-- Users can view their own organization
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = public.user_organization_id());

-- Only org_admins can update organization details
CREATE POLICY "Org admins can update organization"
  ON organizations FOR UPDATE
  USING (
    id = public.user_organization_id() 
    AND public.user_role() = 'org_admin'
  );

-- No direct insert/delete on organizations (handled by admin setup)
CREATE POLICY "No direct organization creation"
  ON organizations FOR INSERT
  WITH CHECK (FALSE);

CREATE POLICY "No organization deletion"
  ON organizations FOR DELETE
  USING (FALSE);

-- =====================================================
-- SITES TABLE POLICIES
-- =====================================================

-- Users can view sites in their organization
CREATE POLICY "Users can view sites in their org"
  ON sites FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Org admins and site managers can create sites
CREATE POLICY "Admins can create sites"
  ON sites FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager')
  );

-- Org admins and site managers can update sites
CREATE POLICY "Admins can update sites"
  ON sites FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager')
  );

-- Only org admins can delete sites
CREATE POLICY "Org admins can delete sites"
  ON sites FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() = 'org_admin'
  );

-- =====================================================
-- ROOMS TABLE POLICIES
-- =====================================================

-- Users can view rooms in their organization's sites
CREATE POLICY "Users can view rooms in their org"
  ON rooms FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE organization_id = public.user_organization_id()
    )
  );

-- Site managers and above can create rooms
CREATE POLICY "Site managers can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT id FROM sites WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Site managers and above can update rooms
CREATE POLICY "Site managers can update rooms"
  ON rooms FOR UPDATE
  USING (
    site_id IN (
      SELECT id FROM sites WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Site managers and above can delete rooms
CREATE POLICY "Site managers can delete rooms"
  ON rooms FOR DELETE
  USING (
    site_id IN (
      SELECT id FROM sites WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- =====================================================
-- PODS TABLE POLICIES
-- =====================================================

-- Users can view pods in their organization
CREATE POLICY "Users can view pods in their org"
  ON pods FOR SELECT
  USING (
    room_id IN (
      SELECT r.id FROM rooms r
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
  );

-- Growers and above can create pods
CREATE POLICY "Growers can create pods"
  ON pods FOR INSERT
  WITH CHECK (
    room_id IN (
      SELECT r.id FROM rooms r
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'installer_tech')
  );

-- Growers and above can update pods
CREATE POLICY "Growers can update pods"
  ON pods FOR UPDATE
  USING (
    room_id IN (
      SELECT r.id FROM rooms r
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator', 'installer_tech')
  );

-- Only admins and installers can delete pods
CREATE POLICY "Admins can delete pods"
  ON pods FOR DELETE
  USING (
    room_id IN (
      SELECT r.id FROM rooms r
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'installer_tech')
  );

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view other users in their organization
CREATE POLICY "Users can view users in their org"
  ON users FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Only org_admins can create users
CREATE POLICY "Org admins can create users"
  ON users FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() = 'org_admin'
  );

-- Org admins and the user themselves can update user data
CREATE POLICY "Admins and self can update users"
  ON users FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND (public.user_role() = 'org_admin' OR id = auth.uid())
  );

-- Only org_admins can delete users
CREATE POLICY "Org admins can delete users"
  ON users FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() = 'org_admin'
  );

-- =====================================================
-- USER PERMISSIONS TABLE POLICIES
-- =====================================================

-- Users can view permissions in their organization
CREATE POLICY "Users can view permissions in their org"
  ON user_permissions FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE organization_id = public.user_organization_id()
    )
  );

-- Only org_admins can manage permissions
CREATE POLICY "Org admins can manage permissions"
  ON user_permissions FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() = 'org_admin'
  );

-- =====================================================
-- USER SITE ASSIGNMENTS TABLE POLICIES
-- =====================================================

-- Users can view site assignments in their organization
CREATE POLICY "Users can view site assignments in their org"
  ON user_site_assignments FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE organization_id = public.user_organization_id()
    )
  );

-- Org admins and site managers can manage site assignments
CREATE POLICY "Admins can manage site assignments"
  ON user_site_assignments FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager')
  );

-- =====================================================
-- CULTIVARS TABLE POLICIES
-- =====================================================

-- Users can view cultivars in their organization
CREATE POLICY "Users can view cultivars in their org"
  ON cultivars FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Growers and above can create cultivars
CREATE POLICY "Growers can create cultivars"
  ON cultivars FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Growers and above can update cultivars
CREATE POLICY "Growers can update cultivars"
  ON cultivars FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Growers and above can delete cultivars
CREATE POLICY "Growers can delete cultivars"
  ON cultivars FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- =====================================================
-- BATCHES TABLE POLICIES
-- =====================================================

-- Users can view batches in their organization
CREATE POLICY "Users can view batches in their org"
  ON batches FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Growers and above can create batches
CREATE POLICY "Growers can create batches"
  ON batches FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Growers and operators can update batches
CREATE POLICY "Growers and operators can update batches"
  ON batches FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- Only growers and above can delete batches
CREATE POLICY "Growers can delete batches"
  ON batches FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- =====================================================
-- BATCH EVENTS TABLE POLICIES
-- =====================================================

-- Users can view batch events in their organization
CREATE POLICY "Users can view batch events in their org"
  ON batch_events FOR SELECT
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
  );

-- Growers and operators can create batch events
CREATE POLICY "Growers can create batch events"
  ON batch_events FOR INSERT
  WITH CHECK (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- No updates or deletes on batch events (audit trail)
CREATE POLICY "No batch event updates"
  ON batch_events FOR UPDATE
  USING (FALSE);

CREATE POLICY "No batch event deletes"
  ON batch_events FOR DELETE
  USING (FALSE);

-- =====================================================
-- BATCH POD ASSIGNMENTS TABLE POLICIES
-- =====================================================

-- Users can view batch pod assignments in their organization
CREATE POLICY "Users can view batch pod assignments in their org"
  ON batch_pod_assignments FOR SELECT
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
  );

-- Growers and above can create batch pod assignments
CREATE POLICY "Growers can create batch pod assignments"
  ON batch_pod_assignments FOR INSERT
  WITH CHECK (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Growers and above can update batch pod assignments
CREATE POLICY "Growers can update batch pod assignments"
  ON batch_pod_assignments FOR UPDATE
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Growers and above can delete batch pod assignments
CREATE POLICY "Growers can delete batch pod assignments"
  ON batch_pod_assignments FOR DELETE
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- =====================================================
-- PLANT TAGS TABLE POLICIES
-- =====================================================

-- Users can view plant tags in their organization
CREATE POLICY "Users can view plant tags in their org"
  ON plant_tags FOR SELECT
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
  );

-- Growers and operators can create plant tags
CREATE POLICY "Growers can create plant tags"
  ON plant_tags FOR INSERT
  WITH CHECK (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator', 'compliance_qa')
  );

-- Growers and operators can update plant tags
CREATE POLICY "Growers can update plant tags"
  ON plant_tags FOR UPDATE
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator', 'compliance_qa')
  );

-- Only compliance and growers can delete plant tags
CREATE POLICY "Growers can delete plant tags"
  ON plant_tags FOR DELETE
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'compliance_qa')
  );

-- =====================================================
-- BATCH GROUPS TABLE POLICIES
-- =====================================================

-- Users can view batch groups in their organization
CREATE POLICY "Users can view batch groups in their org"
  ON batch_groups FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Growers and above can create batch groups
CREATE POLICY "Growers can create batch groups"
  ON batch_groups FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Growers and above can update batch groups
CREATE POLICY "Growers can update batch groups"
  ON batch_groups FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Only admins and managers can delete batch groups
CREATE POLICY "Admins can delete batch groups"
  ON batch_groups FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager')
  );

-- =====================================================
-- GROWING AREAS TABLE POLICIES
-- =====================================================

-- Users can view growing areas in their organization
CREATE POLICY "Users can view growing areas in their org"
  ON growing_areas FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Growers and above can create growing areas
CREATE POLICY "Growers can create growing areas"
  ON growing_areas FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Growers and above can update growing areas
CREATE POLICY "Growers can update growing areas"
  ON growing_areas FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Only admins and managers can delete growing areas
CREATE POLICY "Admins can delete growing areas"
  ON growing_areas FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager')
  );

-- =====================================================
-- BATCH STAGE HISTORY TABLE POLICIES
-- =====================================================

-- Users can view batch stage history in their organization
CREATE POLICY "Users can view batch stage history in their org"
  ON batch_stage_history FOR SELECT
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
  );

-- Growers and operators can create batch stage history
CREATE POLICY "Growers can create batch stage history"
  ON batch_stage_history FOR INSERT
  WITH CHECK (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- No updates or deletes on stage history (audit trail)
CREATE POLICY "No batch stage history updates"
  ON batch_stage_history FOR UPDATE
  USING (FALSE);

CREATE POLICY "No batch stage history deletes"
  ON batch_stage_history FOR DELETE
  USING (FALSE);

-- =====================================================
-- HARVEST RECORDS TABLE POLICIES
-- =====================================================

-- Users can view harvest records in their organization
CREATE POLICY "Users can view harvest records in their org"
  ON harvest_records FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Growers and operators can create harvest records
CREATE POLICY "Growers can create harvest records"
  ON harvest_records FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- No updates or deletes on harvest records (audit trail)
CREATE POLICY "No harvest record updates"
  ON harvest_records FOR UPDATE
  USING (FALSE);

CREATE POLICY "No harvest record deletes"
  ON harvest_records FOR DELETE
  USING (FALSE);

-- =====================================================
-- PLANT COUNT SNAPSHOTS TABLE POLICIES
-- =====================================================

-- Users can view plant count snapshots in their organization
CREATE POLICY "Users can view plant count snapshots in their org"
  ON plant_count_snapshots FOR SELECT
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
  );

-- Growers and operators can create plant count snapshots
CREATE POLICY "Growers can create plant count snapshots"
  ON plant_count_snapshots FOR INSERT
  WITH CHECK (
    batch_id IN (
      SELECT id FROM batches WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- No updates or deletes on plant count snapshots (audit trail)
CREATE POLICY "No plant count snapshot updates"
  ON plant_count_snapshots FOR UPDATE
  USING (FALSE);

CREATE POLICY "No plant count snapshot deletes"
  ON plant_count_snapshots FOR DELETE
  USING (FALSE);

-- =====================================================
-- POST HARVEST RECORDS TABLE POLICIES
-- =====================================================

-- Users can view post harvest records in their organization
CREATE POLICY "Users can view post harvest records in their org"
  ON post_harvest_records FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Growers and operators can create post harvest records
CREATE POLICY "Growers can create post harvest records"
  ON post_harvest_records FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- Growers and operators can update post harvest records
CREATE POLICY "Growers can update post harvest records"
  ON post_harvest_records FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- Only growers and above can delete post harvest records
CREATE POLICY "Growers can delete post harvest records"
  ON post_harvest_records FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- =====================================================
-- INVENTORY CATEGORIES TABLE POLICIES
-- =====================================================

-- Users can view inventory categories in their organization
CREATE POLICY "Users can view inventory categories in their org"
  ON inventory_categories FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Admins and managers can create categories
CREATE POLICY "Admins can create inventory categories"
  ON inventory_categories FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager')
  );

-- Admins and managers can update categories
CREATE POLICY "Admins can update inventory categories"
  ON inventory_categories FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager')
  );

-- Only org_admins can delete categories
CREATE POLICY "Org admins can delete inventory categories"
  ON inventory_categories FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() = 'org_admin'
  );

-- =====================================================
-- INVENTORY ITEMS TABLE POLICIES
-- =====================================================

-- Users can view inventory items in their organization
CREATE POLICY "Users can view inventory in their org"
  ON inventory_items FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Growers and above can create inventory items
CREATE POLICY "Growers can create inventory items"
  ON inventory_items FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- Growers and operators can update inventory items
CREATE POLICY "Growers can update inventory items"
  ON inventory_items FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- Only admins can delete inventory items
CREATE POLICY "Admins can delete inventory items"
  ON inventory_items FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager')
  );

-- =====================================================
-- INVENTORY MOVEMENTS TABLE POLICIES
-- =====================================================

-- Users can view inventory movements in their organization
CREATE POLICY "Users can view inventory movements in their org"
  ON inventory_movements FOR SELECT
  USING (
    item_id IN (
      SELECT id FROM inventory_items WHERE organization_id = public.user_organization_id()
    )
  );

-- Operators and above can create inventory movements
CREATE POLICY "Operators can create inventory movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (
    item_id IN (
      SELECT id FROM inventory_items WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- No updates or deletes on inventory movements (audit trail)
CREATE POLICY "No inventory movement updates"
  ON inventory_movements FOR UPDATE
  USING (FALSE);

CREATE POLICY "No inventory movement deletes"
  ON inventory_movements FOR DELETE
  USING (FALSE);

-- =====================================================
-- INVENTORY ALERTS TABLE POLICIES
-- =====================================================

-- Users can view inventory alerts in their organization
CREATE POLICY "Users can view inventory alerts in their org"
  ON inventory_alerts FOR SELECT
  USING (
    item_id IN (
      SELECT id FROM inventory_items WHERE organization_id = public.user_organization_id()
    )
  );

-- System creates alerts (INSERT allowed)
CREATE POLICY "System can create inventory alerts"
  ON inventory_alerts FOR INSERT
  WITH CHECK (TRUE);

-- Users can acknowledge alerts
CREATE POLICY "Users can acknowledge inventory alerts"
  ON inventory_alerts FOR UPDATE
  USING (
    item_id IN (
      SELECT id FROM inventory_items WHERE organization_id = public.user_organization_id()
    )
  );

-- =====================================================
-- WASTE LOGS TABLE POLICIES
-- =====================================================

-- Users can view waste logs in their organization
CREATE POLICY "Users can view waste logs in their org"
  ON waste_logs FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Operators and above can create waste logs
CREATE POLICY "Operators can create waste logs"
  ON waste_logs FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator', 'compliance_qa')
  );

-- Compliance and growers can update waste logs
CREATE POLICY "Compliance can update waste logs"
  ON waste_logs FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'compliance_qa')
  );

-- Only compliance can delete waste logs
CREATE POLICY "Compliance can delete waste logs"
  ON waste_logs FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'compliance_qa')
  );

-- =====================================================
-- RECIPES TABLE POLICIES
-- =====================================================

-- Users can view recipes in their organization
CREATE POLICY "Users can view recipes in their org"
  ON recipes FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Growers and above can create recipes
CREATE POLICY "Growers can create recipes"
  ON recipes FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Growers and above can update recipes
CREATE POLICY "Growers can update recipes"
  ON recipes FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Growers and above can delete recipes
CREATE POLICY "Growers can delete recipes"
  ON recipes FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- =====================================================
-- RECIPE APPLICATIONS TABLE POLICIES
-- =====================================================

-- Users can view recipe applications in their organization
CREATE POLICY "Users can view recipe applications in their org"
  ON recipe_applications FOR SELECT
  USING (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
  );

-- Growers and operators can create recipe applications
CREATE POLICY "Growers can create recipe applications"
  ON recipe_applications FOR INSERT
  WITH CHECK (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- No updates or deletes on recipe applications (audit trail)
CREATE POLICY "No recipe application updates"
  ON recipe_applications FOR UPDATE
  USING (FALSE);

CREATE POLICY "No recipe application deletes"
  ON recipe_applications FOR DELETE
  USING (FALSE);

-- =====================================================
-- CONTROL OVERRIDES TABLE POLICIES
-- =====================================================

-- Users can view control overrides in their organization
CREATE POLICY "Users can view control overrides in their org"
  ON control_overrides FOR SELECT
  USING (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
  );

-- Growers and operators can create control overrides
CREATE POLICY "Growers can create control overrides"
  ON control_overrides FOR INSERT
  WITH CHECK (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- Growers can update control overrides (to end them)
CREATE POLICY "Growers can update control overrides"
  ON control_overrides FOR UPDATE
  USING (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator')
  );

-- =====================================================
-- TELEMETRY READINGS TABLE POLICIES
-- =====================================================

-- Users can view telemetry in their organization
CREATE POLICY "Users can view telemetry in their org"
  ON telemetry_readings FOR SELECT
  USING (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
  );

-- System creates telemetry readings (service role)
CREATE POLICY "Service can create telemetry readings"
  ON telemetry_readings FOR INSERT
  WITH CHECK (TRUE);

-- No updates or deletes on telemetry (time-series data)
CREATE POLICY "No telemetry updates"
  ON telemetry_readings FOR UPDATE
  USING (FALSE);

-- Only org_admins can delete telemetry
CREATE POLICY "Org admins can delete telemetry"
  ON telemetry_readings FOR DELETE
  USING (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
    AND public.user_role() = 'org_admin'
  );

-- =====================================================
-- DEVICE STATUS TABLE POLICIES
-- =====================================================

-- Users can view device status in their organization
CREATE POLICY "Users can view device status in their org"
  ON device_status FOR SELECT
  USING (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
  );

-- System and installer techs can update device status
CREATE POLICY "Service can update device status"
  ON device_status FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Service can modify device status"
  ON device_status FOR UPDATE
  USING (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
    AND (
      public.user_role() IN ('org_admin', 'site_manager', 'installer_tech', 'support')
      OR auth.uid() IS NULL -- Allow service role
    )
  );

-- =====================================================
-- ALARMS TABLE POLICIES
-- =====================================================

-- Users can view alarms in their organization
CREATE POLICY "Users can view alarms in their org"
  ON alarms FOR SELECT
  USING (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
  );

-- System creates alarms
CREATE POLICY "Service can create alarms"
  ON alarms FOR INSERT
  WITH CHECK (TRUE);

-- Users can acknowledge alarms
CREATE POLICY "Users can acknowledge alarms"
  ON alarms FOR UPDATE
  USING (
    pod_id IN (
      SELECT p.id FROM pods p
      JOIN rooms r ON p.room_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE s.organization_id = public.user_organization_id()
    )
  );

-- =====================================================
-- ALARM POLICIES TABLE POLICIES
-- =====================================================

-- Users can view alarm policies in their organization
CREATE POLICY "Users can view alarm policies in their org"
  ON alarm_policies FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Growers and above can create alarm policies
CREATE POLICY "Growers can create alarm policies"
  ON alarm_policies FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Growers and above can update alarm policies
CREATE POLICY "Growers can update alarm policies"
  ON alarm_policies FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Only org_admins can delete alarm policies
CREATE POLICY "Org admins can delete alarm policies"
  ON alarm_policies FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() = 'org_admin'
  );

-- =====================================================
-- ALARM ROUTES TABLE POLICIES
-- =====================================================

-- Users can view alarm routes in their organization
CREATE POLICY "Users can view alarm routes in their org"
  ON alarm_routes FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Growers and above can create alarm routes
CREATE POLICY "Growers can create alarm routes"
  ON alarm_routes FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Growers and above can update alarm routes
CREATE POLICY "Growers can update alarm routes"
  ON alarm_routes FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Only org_admins can delete alarm routes
CREATE POLICY "Org admins can delete alarm routes"
  ON alarm_routes FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() = 'org_admin'
  );

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- System can create notifications
CREATE POLICY "Service can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- No deletes on notifications (audit trail)
CREATE POLICY "No notification deletes"
  ON notifications FOR DELETE
  USING (FALSE);

-- =====================================================
-- TASKS TABLE POLICIES
-- =====================================================

-- Users can view tasks in their organization
CREATE POLICY "Users can view tasks in their org"
  ON tasks FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Managers and above can create tasks
CREATE POLICY "Managers can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Assigned users and managers can update tasks
CREATE POLICY "Assigned users can update tasks"
  ON tasks FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND (
      assigned_to = auth.uid() 
      OR public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
    )
  );

-- Only managers can delete tasks
CREATE POLICY "Managers can delete tasks"
  ON tasks FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- =====================================================
-- SOP TEMPLATES TABLE POLICIES
-- =====================================================

-- Users can view SOP templates in their organization
CREATE POLICY "Users can view SOP templates in their org"
  ON sop_templates FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Managers and compliance can create SOP templates
CREATE POLICY "Managers can create SOP templates"
  ON sop_templates FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'compliance_qa')
  );

-- Managers and compliance can update SOP templates
CREATE POLICY "Managers can update SOP templates"
  ON sop_templates FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'compliance_qa')
  );

-- Only admins can delete SOP templates
CREATE POLICY "Admins can delete SOP templates"
  ON sop_templates FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() = 'org_admin'
  );

-- =====================================================
-- TASK STEPS TABLE POLICIES
-- =====================================================

-- Users can view task steps for tasks in their organization
CREATE POLICY "Users can view task steps in their org"
  ON task_steps FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE organization_id = public.user_organization_id()
    )
  );

-- Managers can create task steps
CREATE POLICY "Managers can create task steps"
  ON task_steps FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'compliance_qa')
  );

-- Assigned users and managers can update task steps
CREATE POLICY "Assigned users can update task steps"
  ON task_steps FOR UPDATE
  USING (
    task_id IN (
      SELECT t.id FROM tasks t
      WHERE t.organization_id = public.user_organization_id()
      AND (t.assigned_to = auth.uid() OR public.user_role() IN ('org_admin', 'site_manager', 'head_grower'))
    )
  );

-- =====================================================
-- TASK DEPENDENCIES TABLE POLICIES
-- =====================================================

-- Users can view task dependencies in their organization
CREATE POLICY "Users can view task dependencies in their org"
  ON task_dependencies FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE organization_id = public.user_organization_id()
    )
  );

-- Managers can create task dependencies
CREATE POLICY "Managers can create task dependencies"
  ON task_dependencies FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Managers can update task dependencies
CREATE POLICY "Managers can update task dependencies"
  ON task_dependencies FOR UPDATE
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- Managers can delete task dependencies
CREATE POLICY "Managers can delete task dependencies"
  ON task_dependencies FOR DELETE
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE organization_id = public.user_organization_id()
    )
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower')
  );

-- =====================================================
-- COMPLIANCE REPORTS TABLE POLICIES
-- =====================================================

-- Users can view compliance reports in their organization
CREATE POLICY "Users can view compliance reports in their org"
  ON compliance_reports FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Compliance and admins can create compliance reports
CREATE POLICY "Compliance can create reports"
  ON compliance_reports FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'compliance_qa')
  );

-- Compliance and admins can update compliance reports
CREATE POLICY "Compliance can update reports"
  ON compliance_reports FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'compliance_qa')
  );

-- Only org_admins can delete compliance reports
CREATE POLICY "Org admins can delete reports"
  ON compliance_reports FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() = 'org_admin'
  );

-- =====================================================
-- EVIDENCE VAULT TABLE POLICIES
-- =====================================================

-- Users can view evidence in their organization
CREATE POLICY "Users can view evidence in their org"
  ON evidence_vault FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Operators and above can create evidence
CREATE POLICY "Operators can create evidence"
  ON evidence_vault FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()
    AND public.user_role() IN ('org_admin', 'site_manager', 'head_grower', 'operator', 'compliance_qa')
  );

-- No updates on evidence (immutable)
CREATE POLICY "No evidence updates"
  ON evidence_vault FOR UPDATE
  USING (FALSE);

-- Only org_admins can delete evidence
CREATE POLICY "Org admins can delete evidence"
  ON evidence_vault FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND public.user_role() = 'org_admin'
  );

-- =====================================================
-- AUDIT LOG TABLE POLICIES
-- =====================================================

-- Users can view audit logs in their organization
CREATE POLICY "Users can view audit logs in their org"
  ON audit_log FOR SELECT
  USING (organization_id = public.user_organization_id());

-- System creates audit log entries
CREATE POLICY "Service can create audit logs"
  ON audit_log FOR INSERT
  WITH CHECK (TRUE);

-- No updates or deletes on audit log (immutable)
CREATE POLICY "No audit log updates"
  ON audit_log FOR UPDATE
  USING (FALSE);

CREATE POLICY "No audit log deletes"
  ON audit_log FOR DELETE
  USING (FALSE);

-- =====================================================
-- COMMENTS & DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.user_organization_id() IS 'Helper function to get current user organization ID';
COMMENT ON FUNCTION public.user_role() IS 'Helper function to get current user role';
COMMENT ON FUNCTION public.user_is_active() IS 'Helper function to check if current user is active';
COMMENT ON FUNCTION public.has_permission(TEXT) IS 'Check if current user has specific permission';
COMMENT ON FUNCTION public.is_assigned_to_site(UUID) IS 'Check if current user is assigned to specific site';

-- =====================================================
-- END OF RLS POLICIES
-- =====================================================
