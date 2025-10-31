-- =====================================================
-- INTEGRATION SETTINGS TABLE
-- Stores API keys and configuration for third-party integrations
-- =====================================================

CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('tagoio', 'metrc', 'ctls', 'demegrow')),
  
  -- Encrypted credentials
  api_token TEXT, -- Encrypted API token/key
  api_secret TEXT, -- Encrypted API secret (if needed)
  
  -- Configuration
  config JSONB DEFAULT '{}', -- Additional config like base URL, region, etc.
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_valid BOOLEAN DEFAULT FALSE, -- Whether credentials have been validated
  last_validated_at TIMESTAMPTZ,
  validation_error TEXT,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one active integration per org per type
  UNIQUE(organization_id, integration_type)
);

-- Index for quick lookups
CREATE INDEX idx_integration_settings_org_type ON integration_settings(organization_id, integration_type);
CREATE INDEX idx_integration_settings_active ON integration_settings(is_active) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

-- Users can view integrations for their organization
CREATE POLICY "Users can view org integrations"
  ON integration_settings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Only org_admin and site_manager can modify integrations
CREATE POLICY "Admins can modify integrations"
  ON integration_settings
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('org_admin', 'site_manager')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('org_admin', 'site_manager')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_integration_settings_updated_at
  BEFORE UPDATE ON integration_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE integration_settings IS 'API credentials and configuration for third-party integrations';
COMMENT ON COLUMN integration_settings.api_token IS 'Encrypted API token (use pgcrypto for encryption in production)';
COMMENT ON COLUMN integration_settings.is_valid IS 'Whether credentials have been successfully validated against the API';
