-- Compliance Engine Database Migration
-- Created: November 17, 2025
-- Purpose: Add tables and columns for Metrc compliance integration

-- =====================================================
-- COMPLIANCE API KEYS
-- =====================================================
-- Store encrypted Metrc API credentials per site
CREATE TABLE IF NOT EXISTS compliance_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- API Keys (should be encrypted in production)
  vendor_api_key TEXT NOT NULL,
  user_api_key TEXT NOT NULL,
  facility_license_number TEXT NOT NULL,
  state_code TEXT NOT NULL CHECK (LENGTH(state_code) = 2),

  -- Environment Configuration
  is_sandbox BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partial unique index for active credentials
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_api_keys_active_site
  ON compliance_api_keys(site_id)
  WHERE is_active = true;

-- RLS Policies for compliance_api_keys
ALTER TABLE compliance_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view API keys for their organization's sites"
  ON compliance_api_keys FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      INNER JOIN users u ON u.organization_id = s.organization_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage API keys"
  ON compliance_api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'owner')
      AND users.organization_id IN (
        SELECT organization_id FROM sites WHERE sites.id = compliance_api_keys.site_id
      )
    )
  );

-- =====================================================
-- METRC SYNC LOG
-- =====================================================
-- Track all sync operations with Metrc
CREATE TABLE IF NOT EXISTS metrc_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Sync Details
  sync_type TEXT NOT NULL CHECK (sync_type IN (
    'packages', 'plants', 'plant_batches', 'harvests', 'sales', 'transfers', 'waste'
  )),
  direction TEXT NOT NULL CHECK (direction IN ('push', 'pull', 'bidirectional')),
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'sync')),

  -- Metrc Reference
  metrc_id TEXT,
  metrc_label TEXT,
  local_id UUID,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'failed', 'partial'
  )),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Data
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  error_code TEXT,

  -- Audit
  initiated_by UUID REFERENCES users(id),
  retry_count INTEGER DEFAULT 0,
  parent_sync_id UUID REFERENCES metrc_sync_log(id)
);

-- Indexes for metrc_sync_log
CREATE INDEX idx_metrc_sync_log_site_type ON metrc_sync_log(site_id, sync_type, status);
CREATE INDEX idx_metrc_sync_log_status ON metrc_sync_log(status) WHERE status IN ('pending', 'failed');
CREATE INDEX idx_metrc_sync_log_completed ON metrc_sync_log(completed_at DESC);

-- RLS Policies for metrc_sync_log
ALTER TABLE metrc_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync logs for their organization"
  ON metrc_sync_log FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert sync logs"
  ON metrc_sync_log FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- =====================================================
-- METRC PACKAGE MAPPINGS
-- =====================================================
-- Link TRAZO inventory lots to Metrc packages
CREATE TABLE IF NOT EXISTS metrc_package_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Internal Reference
  inventory_lot_id UUID NOT NULL REFERENCES inventory_lots(id) ON DELETE CASCADE,

  -- Metrc Reference
  metrc_package_id TEXT NOT NULL,
  metrc_package_label TEXT NOT NULL,
  metrc_package_type TEXT,

  -- Sync Status
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT CHECK (sync_status IN ('synced', 'pending', 'conflict', 'error')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique mapping
  UNIQUE(metrc_package_id, site_id),
  UNIQUE(inventory_lot_id)
);

-- Indexes for metrc_package_mappings
CREATE INDEX idx_metrc_package_mappings_lot ON metrc_package_mappings(inventory_lot_id);
CREATE INDEX idx_metrc_package_mappings_label ON metrc_package_mappings(metrc_package_label);

-- RLS Policies for metrc_package_mappings
ALTER TABLE metrc_package_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view package mappings for their organization"
  ON metrc_package_mappings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can manage package mappings"
  ON metrc_package_mappings FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- =====================================================
-- COMPLIANCE WEBHOOKS
-- =====================================================
-- Configure webhooks for real-time compliance updates
CREATE TABLE IF NOT EXISTS compliance_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Webhook Config
  webhook_type TEXT NOT NULL CHECK (webhook_type IN ('metrc', 'ctls', 'other')),
  endpoint_url TEXT NOT NULL,
  secret_key TEXT NOT NULL,

  -- Events to listen for
  subscribed_events TEXT[] NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for compliance_webhooks
ALTER TABLE compliance_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhooks"
  ON compliance_webhooks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'owner')
      AND users.organization_id = compliance_webhooks.organization_id
    )
  );

-- =====================================================
-- EXTEND EXISTING TABLES
-- =====================================================

-- Add Metrc tracking to batches table (if exists and not already added)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'batches') THEN
    ALTER TABLE batches ADD COLUMN IF NOT EXISTS metrc_batch_id TEXT;
    ALTER TABLE batches ADD COLUMN IF NOT EXISTS metrc_source_package_labels TEXT[];
    ALTER TABLE batches ADD COLUMN IF NOT EXISTS metrc_plant_labels TEXT[];
    ALTER TABLE batches ADD COLUMN IF NOT EXISTS metrc_sync_status TEXT
      CHECK (metrc_sync_status IN ('not_synced', 'synced', 'pending', 'error'));

    -- Create index if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_batches_metrc_id') THEN
      CREATE INDEX idx_batches_metrc_id ON batches(metrc_batch_id)
        WHERE metrc_batch_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Add Metrc tracking to inventory_movements table
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS metrc_transaction_id TEXT;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS metrc_sync_status TEXT
  CHECK (metrc_sync_status IN ('not_synced', 'synced', 'pending', 'error'));

-- Add Metrc waste ID to waste_logs (if not already added by other migration)
ALTER TABLE waste_logs ADD COLUMN IF NOT EXISTS metrc_waste_id TEXT;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_compliance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_compliance_api_keys_updated_at
  BEFORE UPDATE ON compliance_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_updated_at();

CREATE TRIGGER update_metrc_package_mappings_updated_at
  BEFORE UPDATE ON metrc_package_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE compliance_api_keys IS 'Stores Metrc API credentials per site';
COMMENT ON TABLE metrc_sync_log IS 'Tracks all Metrc sync operations';
COMMENT ON TABLE metrc_package_mappings IS 'Maps TRAZO inventory lots to Metrc packages';
COMMENT ON TABLE compliance_webhooks IS 'Configures webhooks for real-time compliance updates';

COMMENT ON COLUMN compliance_api_keys.is_sandbox IS 'True if these are sandbox/testing credentials';
COMMENT ON COLUMN metrc_sync_log.direction IS 'push = TRAZO to Metrc, pull = Metrc to TRAZO';
COMMENT ON COLUMN metrc_sync_log.retry_count IS 'Number of retry attempts for failed syncs';
