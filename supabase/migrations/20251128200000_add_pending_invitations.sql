-- Add pending_invitations table for storing user invitations before signup
-- This allows org admins to invite users during onboarding before users create accounts

CREATE TABLE IF NOT EXISTS pending_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'org_admin', 'site_manager', 'head_grower', 'operator', 
    'compliance_qa', 'executive_viewer', 'installer_tech', 'support'
  )),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'expired', 'cancelled')),
  invitation_token UUID DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate pending invitations for same email/org
  UNIQUE(email, organization_id)
);

-- Index for looking up invitations by token
CREATE INDEX IF NOT EXISTS idx_pending_invitations_token ON pending_invitations(invitation_token) WHERE status = 'pending';

-- Index for organization lookup
CREATE INDEX IF NOT EXISTS idx_pending_invitations_org ON pending_invitations(organization_id);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_pending_invitations_email ON pending_invitations(email);

-- RLS policies
ALTER TABLE pending_invitations ENABLE ROW LEVEL SECURITY;

-- Org admins can view and manage invitations for their organization
CREATE POLICY "Org admins can manage invitations" ON pending_invitations
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'org_admin'
    )
  );

-- Users can view invitations they sent
CREATE POLICY "Users can view own invitations" ON pending_invitations
  FOR SELECT
  USING (invited_by = auth.uid());

-- Comment
COMMENT ON TABLE pending_invitations IS 'Stores pending user invitations before they sign up and accept';
COMMENT ON COLUMN pending_invitations.invitation_token IS 'Unique token for invitation acceptance link';
COMMENT ON COLUMN pending_invitations.expires_at IS 'When the invitation expires (default 7 days)';
