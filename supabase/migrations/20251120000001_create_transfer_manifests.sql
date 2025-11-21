-- =====================================================
-- TRANSFER MANIFESTS TABLE
-- =====================================================
-- Track outgoing and incoming transfer manifests for cannabis compliance
-- Week 7 - Phase 3.5: Plant Batch Lifecycle Integration

CREATE TABLE IF NOT EXISTS transfer_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Manifest identification
  manifest_number TEXT NOT NULL, -- Auto-generated: MAN-YYYY-MM-XXXXX
  metrc_manifest_number TEXT UNIQUE, -- From Metrc API response

  -- Transfer direction
  transfer_direction TEXT NOT NULL CHECK (transfer_direction IN ('outgoing', 'incoming')),

  -- Shipper info (for outgoing)
  shipper_license_number TEXT,
  shipper_facility_name TEXT,

  -- Recipient info
  recipient_license_number TEXT NOT NULL,
  recipient_facility_name TEXT NOT NULL,

  -- Transfer type (from Metrc types endpoint)
  transfer_type TEXT NOT NULL, -- 'Wholesale', 'Transfer', 'Sale', etc.
  shipment_license_type TEXT, -- 'Cultivator', 'Processor', 'Dispensary', etc.
  shipment_transaction_type TEXT, -- 'Standard', 'Wholesale', etc.

  -- Transport details
  driver_name TEXT,
  driver_license_number TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_license_plate TEXT,
  planned_route TEXT,

  -- Timing
  estimated_departure_datetime TIMESTAMPTZ NOT NULL,
  estimated_arrival_datetime TIMESTAMPTZ NOT NULL,
  actual_departure_datetime TIMESTAMPTZ,
  actual_arrival_datetime TIMESTAMPTZ,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',          -- Being created
    'submitted',      -- Submitted to Metrc
    'in_transit',     -- Departed
    'received',       -- Received by recipient
    'rejected',       -- Rejected by recipient
    'cancelled'       -- Cancelled before departure
  )),

  -- Metrc sync
  metrc_sync_status TEXT DEFAULT 'not_synced' CHECK (metrc_sync_status IN (
    'not_synced',     -- Not yet pushed to Metrc
    'pending',        -- Push in progress
    'synced',         -- Successfully synced
    'failed'          -- Sync failed
  )),
  metrc_sync_error TEXT,
  metrc_synced_at TIMESTAMPTZ,
  sync_retry_count INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_manifest_number_per_org UNIQUE (organization_id, manifest_number)
);

-- =====================================================
-- TRANSFER MANIFEST PACKAGES TABLE
-- =====================================================
-- Link packages to transfer manifests

CREATE TABLE IF NOT EXISTS transfer_manifest_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID NOT NULL REFERENCES transfer_manifests(id) ON DELETE CASCADE,

  -- Package reference
  package_id UUID REFERENCES harvest_packages(id), -- NULL for incoming transfers (not in our system yet)
  package_label TEXT NOT NULL, -- Metrc package tag

  -- Package details (captured at transfer time)
  item_name TEXT NOT NULL,
  quantity DECIMAL(10, 4) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  packaged_date DATE NOT NULL,
  gross_weight DECIMAL(10, 4),
  wholesale_price DECIMAL(10, 2),

  -- Receipt tracking (for incoming)
  received_quantity DECIMAL(10, 4),
  accepted BOOLEAN DEFAULT FALSE,
  rejected BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_transfer_manifests_org ON transfer_manifests(organization_id);
CREATE INDEX idx_transfer_manifests_site ON transfer_manifests(site_id);
CREATE INDEX idx_transfer_manifests_status ON transfer_manifests(status);
CREATE INDEX idx_transfer_manifests_direction ON transfer_manifests(transfer_direction);
CREATE INDEX idx_transfer_manifests_metrc_sync ON transfer_manifests(metrc_sync_status);
CREATE INDEX idx_transfer_manifests_metrc_number ON transfer_manifests(metrc_manifest_number) WHERE metrc_manifest_number IS NOT NULL;
CREATE INDEX idx_transfer_manifests_manifest_number ON transfer_manifests(manifest_number);
CREATE INDEX idx_transfer_manifests_estimated_departure ON transfer_manifests(estimated_departure_datetime);
CREATE INDEX idx_transfer_manifest_packages_manifest ON transfer_manifest_packages(manifest_id);
CREATE INDEX idx_transfer_manifest_packages_package ON transfer_manifest_packages(package_id) WHERE package_id IS NOT NULL;
CREATE INDEX idx_transfer_manifest_packages_label ON transfer_manifest_packages(package_label);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE transfer_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_manifest_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view manifests for their organization"
  ON transfer_manifests FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage manifests for their organization"
  ON transfer_manifests FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view manifest packages for accessible manifests"
  ON transfer_manifest_packages FOR SELECT
  USING (
    manifest_id IN (
      SELECT id FROM transfer_manifests
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage manifest packages for accessible manifests"
  ON transfer_manifest_packages FOR ALL
  USING (
    manifest_id IN (
      SELECT id FROM transfer_manifests
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_transfer_manifests_updated_at
  BEFORE UPDATE ON transfer_manifests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_manifest_packages_updated_at
  BEFORE UPDATE ON transfer_manifest_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR AUTO-NUMBERING
-- =====================================================

-- Generate manifest number: MAN-YYYY-MM-XXXXX
CREATE OR REPLACE FUNCTION generate_manifest_number(
  p_organization_id UUID,
  p_created_date TIMESTAMPTZ
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_sequence INTEGER;
  v_manifest_number TEXT;
BEGIN
  -- Extract year and month
  v_year := TO_CHAR(p_created_date, 'YYYY');
  v_month := TO_CHAR(p_created_date, 'MM');

  -- Get count for this month
  SELECT COUNT(*) + 1 INTO v_sequence
  FROM transfer_manifests
  WHERE organization_id = p_organization_id
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', p_created_date);

  -- Format: MAN-YYYY-MM-XXXXX
  v_manifest_number := 'MAN-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::TEXT, 5, '0');

  RETURN v_manifest_number;
END;
$$;

COMMENT ON FUNCTION generate_manifest_number IS 'Auto-generates transfer manifest number in format MAN-YYYY-MM-XXXXX';

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE transfer_manifests IS 'Cannabis transfer manifests for Metrc compliance';
COMMENT ON TABLE transfer_manifest_packages IS 'Packages included in transfer manifests';
COMMENT ON COLUMN transfer_manifests.manifest_number IS 'Internal manifest number (MAN-YYYY-MM-XXXXX)';
COMMENT ON COLUMN transfer_manifests.metrc_manifest_number IS 'Metrc-assigned manifest number from API response';
COMMENT ON COLUMN transfer_manifests.transfer_direction IS 'Outgoing (we ship) or Incoming (we receive)';
COMMENT ON COLUMN transfer_manifests.status IS 'Current status of the transfer';
COMMENT ON COLUMN transfer_manifest_packages.package_label IS 'Metrc package tag (e.g., 1A4FF0100000022000000123)';
