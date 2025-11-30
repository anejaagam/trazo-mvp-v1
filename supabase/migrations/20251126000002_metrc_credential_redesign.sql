-- =====================================================
-- Metrc Credential Redesign Migration
-- =====================================================
-- This migration implements the new Metrc integration architecture:
-- 1. Organization-level credentials (user key only, vendor key from env)
-- 2. Facilities cache from Metrc API
-- 3. Site-to-license linking with compliance status
-- 4. Enhanced room-to-location sync
-- =====================================================

-- =====================================================
-- 1. METRC ORGANIZATION CREDENTIALS
-- Stores user API keys per organization+state
-- Vendor keys are stored in environment variables
-- =====================================================

CREATE TABLE IF NOT EXISTS metrc_org_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  state_code TEXT NOT NULL CHECK (state_code IN ('AK', 'OR', 'CA', 'CO', 'MI', 'NV', 'MA', 'OK', 'MD', 'ME', 'MT', 'NJ', 'OH', 'WV', 'LA', 'MN', 'MO', 'MS', 'DC')),
  user_api_key TEXT NOT NULL,  -- Will be encrypted at application level
  is_sandbox BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  validated_at TIMESTAMPTZ,  -- Last successful validation
  validation_error TEXT,  -- Last validation error if any
  last_facilities_sync TIMESTAMPTZ,  -- Last time facilities were synced
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, state_code)
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_metrc_org_credentials_org
  ON metrc_org_credentials(organization_id);

CREATE INDEX IF NOT EXISTS idx_metrc_org_credentials_state
  ON metrc_org_credentials(organization_id, state_code);

-- RLS Policies
ALTER TABLE metrc_org_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's metrc credentials"
  ON metrc_org_credentials FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage metrc credentials"
  ON metrc_org_credentials FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid() AND role IN ('org_admin', 'site_manager')
  ));

-- =====================================================
-- 2. METRC FACILITIES CACHE
-- Caches facilities/licenses from Metrc API
-- Refreshed when credentials are validated
-- =====================================================

CREATE TABLE IF NOT EXISTS metrc_facilities_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  credential_id UUID NOT NULL REFERENCES metrc_org_credentials(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  facility_name TEXT NOT NULL,
  facility_type TEXT,  -- "Standard Cultivation Facility", "Retail Store", etc.
  state_code TEXT NOT NULL,
  metrc_facility_id INTEGER,  -- Metrc's internal numeric ID
  address JSONB,  -- Full address from Metrc
  is_active BOOLEAN DEFAULT true,  -- Active in Metrc
  is_linked BOOLEAN DEFAULT false,  -- Linked to a Trazo site
  linked_site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB,  -- Full facility data from Metrc for reference
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, license_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_metrc_facilities_cache_org
  ON metrc_facilities_cache(organization_id);

CREATE INDEX IF NOT EXISTS idx_metrc_facilities_cache_license
  ON metrc_facilities_cache(license_number);

CREATE INDEX IF NOT EXISTS idx_metrc_facilities_cache_linked
  ON metrc_facilities_cache(linked_site_id) WHERE linked_site_id IS NOT NULL;

-- RLS Policies
ALTER TABLE metrc_facilities_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's metrc facilities"
  ON metrc_facilities_cache FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage metrc facilities"
  ON metrc_facilities_cache FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid() AND role IN ('org_admin', 'site_manager')
  ));

-- =====================================================
-- 3. ENHANCE SITES TABLE
-- Add Metrc license linking and compliance status
-- =====================================================

-- Add new columns to sites table
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS metrc_license_number TEXT,
  ADD COLUMN IF NOT EXISTS metrc_facility_id INTEGER,
  ADD COLUMN IF NOT EXISTS metrc_credential_id UUID REFERENCES metrc_org_credentials(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS compliance_status TEXT DEFAULT 'pending'
    CHECK (compliance_status IN ('compliant', 'uncompliant', 'pending', 'not_required')),
  ADD COLUMN IF NOT EXISTS compliance_last_checked TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metrc_locations_synced_at TIMESTAMPTZ;

-- Index for compliance filtering
CREATE INDEX IF NOT EXISTS idx_sites_compliance_status
  ON sites(compliance_status) WHERE compliance_status != 'not_required';

CREATE INDEX IF NOT EXISTS idx_sites_metrc_license
  ON sites(metrc_license_number) WHERE metrc_license_number IS NOT NULL;

-- =====================================================
-- 4. ENHANCE ROOMS TABLE
-- Add direct Metrc location sync fields
-- =====================================================

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS metrc_location_id INTEGER,
  ADD COLUMN IF NOT EXISTS metrc_location_name TEXT,
  ADD COLUMN IF NOT EXISTS metrc_location_type_id INTEGER,
  ADD COLUMN IF NOT EXISTS metrc_location_type_name TEXT,
  ADD COLUMN IF NOT EXISTS metrc_sync_status TEXT DEFAULT 'not_synced'
    CHECK (metrc_sync_status IN ('synced', 'pending_sync', 'out_of_sync', 'sync_error', 'not_synced')),
  ADD COLUMN IF NOT EXISTS metrc_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS metrc_last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metrc_created_by_trazo BOOLEAN DEFAULT false;

-- Index for sync status filtering
CREATE INDEX IF NOT EXISTS idx_rooms_metrc_sync_status
  ON rooms(metrc_sync_status) WHERE metrc_sync_status != 'not_synced';

CREATE INDEX IF NOT EXISTS idx_rooms_metrc_location_id
  ON rooms(metrc_location_id) WHERE metrc_location_id IS NOT NULL;

-- =====================================================
-- 5. METRC SYNC LOG
-- Audit trail for all Metrc sync operations
-- =====================================================

CREATE TABLE IF NOT EXISTS metrc_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES metrc_org_credentials(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN (
    'credentials_validation',
    'facilities_sync',
    'locations_sync',
    'location_create',
    'location_update',
    'location_delete',
    'site_link',
    'site_unlink'
  )),
  sync_direction TEXT CHECK (sync_direction IN ('metrc_to_trazo', 'trazo_to_metrc', 'validation')),
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'partial', 'failed')),
  details JSONB,  -- Sync details (counts, items affected, etc.)
  error_message TEXT,
  request_payload JSONB,  -- For debugging
  response_payload JSONB,  -- For debugging
  duration_ms INTEGER,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying sync history
CREATE INDEX IF NOT EXISTS idx_metrc_sync_log_org
  ON metrc_sync_log(organization_id, performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_metrc_sync_log_site
  ON metrc_sync_log(site_id, performed_at DESC) WHERE site_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_metrc_sync_log_type
  ON metrc_sync_log(sync_type, performed_at DESC);

-- RLS Policies
ALTER TABLE metrc_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's sync logs"
  ON metrc_sync_log FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "System can insert sync logs"
  ON metrc_sync_log FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- =====================================================
-- 6. TRIGGER: Update timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_metrc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to new tables
DROP TRIGGER IF EXISTS update_metrc_org_credentials_updated_at ON metrc_org_credentials;
CREATE TRIGGER update_metrc_org_credentials_updated_at
  BEFORE UPDATE ON metrc_org_credentials
  FOR EACH ROW EXECUTE FUNCTION update_metrc_updated_at();

DROP TRIGGER IF EXISTS update_metrc_facilities_cache_updated_at ON metrc_facilities_cache;
CREATE TRIGGER update_metrc_facilities_cache_updated_at
  BEFORE UPDATE ON metrc_facilities_cache
  FOR EACH ROW EXECUTE FUNCTION update_metrc_updated_at();

-- =====================================================
-- 7. TRIGGER: Update facility link status
-- When a site is linked/unlinked to a facility
-- =====================================================

CREATE OR REPLACE FUNCTION sync_facility_link_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If site now has a metrc_license_number, mark facility as linked
  IF NEW.metrc_license_number IS NOT NULL AND
     (OLD.metrc_license_number IS NULL OR OLD.metrc_license_number != NEW.metrc_license_number) THEN
    UPDATE metrc_facilities_cache
    SET is_linked = true,
        linked_site_id = NEW.id,
        updated_at = NOW()
    WHERE license_number = NEW.metrc_license_number
      AND organization_id = NEW.organization_id;

    -- Unlink old facility if license changed
    IF OLD.metrc_license_number IS NOT NULL AND OLD.metrc_license_number != NEW.metrc_license_number THEN
      UPDATE metrc_facilities_cache
      SET is_linked = false,
          linked_site_id = NULL,
          updated_at = NOW()
      WHERE license_number = OLD.metrc_license_number
        AND organization_id = NEW.organization_id;
    END IF;
  END IF;

  -- If site no longer has a metrc_license_number, unlink facility
  IF NEW.metrc_license_number IS NULL AND OLD.metrc_license_number IS NOT NULL THEN
    UPDATE metrc_facilities_cache
    SET is_linked = false,
        linked_site_id = NULL,
        updated_at = NOW()
    WHERE license_number = OLD.metrc_license_number
      AND organization_id = NEW.organization_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_site_facility_link ON sites;
CREATE TRIGGER sync_site_facility_link
  AFTER UPDATE OF metrc_license_number ON sites
  FOR EACH ROW EXECUTE FUNCTION sync_facility_link_status();

-- =====================================================
-- 8. VIEW: Sites with compliance status
-- Useful for dashboards and compliance alerts
-- =====================================================

CREATE OR REPLACE VIEW sites_compliance_view AS
SELECT
  s.id,
  s.name,
  s.organization_id,
  s.metrc_license_number,
  s.metrc_facility_id,
  s.compliance_status,
  s.compliance_last_checked,
  s.metrc_locations_synced_at,
  s.is_active,
  mfc.facility_name AS metrc_facility_name,
  mfc.facility_type AS metrc_facility_type,
  mfc.state_code,
  moc.is_sandbox,
  moc.validated_at AS credentials_validated_at,
  (SELECT COUNT(*) FROM rooms r WHERE r.site_id = s.id AND r.is_active = true) AS total_rooms,
  (SELECT COUNT(*) FROM rooms r WHERE r.site_id = s.id AND r.is_active = true AND r.metrc_sync_status = 'synced') AS synced_rooms,
  CASE
    WHEN s.metrc_license_number IS NULL THEN 'uncompliant'
    WHEN moc.validated_at IS NULL THEN 'pending'
    WHEN mfc.id IS NULL THEN 'uncompliant'
    ELSE s.compliance_status
  END AS computed_compliance_status
FROM sites s
LEFT JOIN metrc_facilities_cache mfc ON mfc.linked_site_id = s.id
LEFT JOIN metrc_org_credentials moc ON moc.id = s.metrc_credential_id
WHERE s.is_active = true;

-- =====================================================
-- 9. FUNCTION: Get unlinked facilities for organization
-- =====================================================

CREATE OR REPLACE FUNCTION get_unlinked_metrc_facilities(p_organization_id UUID)
RETURNS TABLE (
  id UUID,
  license_number TEXT,
  facility_name TEXT,
  facility_type TEXT,
  state_code TEXT,
  last_synced_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mfc.id,
    mfc.license_number,
    mfc.facility_name,
    mfc.facility_type,
    mfc.state_code,
    mfc.last_synced_at
  FROM metrc_facilities_cache mfc
  WHERE mfc.organization_id = p_organization_id
    AND mfc.is_linked = false
    AND mfc.is_active = true
  ORDER BY mfc.facility_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. FUNCTION: Get compliance summary for organization
-- =====================================================

CREATE OR REPLACE FUNCTION get_metrc_compliance_summary(p_organization_id UUID)
RETURNS TABLE (
  total_sites INTEGER,
  compliant_sites INTEGER,
  uncompliant_sites INTEGER,
  pending_sites INTEGER,
  total_facilities INTEGER,
  linked_facilities INTEGER,
  unlinked_facilities INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM sites WHERE organization_id = p_organization_id AND is_active = true),
    (SELECT COUNT(*)::INTEGER FROM sites WHERE organization_id = p_organization_id AND is_active = true AND compliance_status = 'compliant'),
    (SELECT COUNT(*)::INTEGER FROM sites WHERE organization_id = p_organization_id AND is_active = true AND (compliance_status = 'uncompliant' OR metrc_license_number IS NULL)),
    (SELECT COUNT(*)::INTEGER FROM sites WHERE organization_id = p_organization_id AND is_active = true AND compliance_status = 'pending'),
    (SELECT COUNT(*)::INTEGER FROM metrc_facilities_cache WHERE organization_id = p_organization_id AND is_active = true),
    (SELECT COUNT(*)::INTEGER FROM metrc_facilities_cache WHERE organization_id = p_organization_id AND is_active = true AND is_linked = true),
    (SELECT COUNT(*)::INTEGER FROM metrc_facilities_cache WHERE organization_id = p_organization_id AND is_active = true AND is_linked = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. Mark existing compliance_api_keys as deprecated
-- We keep data but add a deprecation note
-- =====================================================

COMMENT ON TABLE compliance_api_keys IS 'DEPRECATED: Use metrc_org_credentials instead. This table is kept for backward compatibility during migration.';

-- =====================================================
-- Done!
-- =====================================================
