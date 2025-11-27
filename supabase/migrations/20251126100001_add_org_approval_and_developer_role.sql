-- Add organization approval status and developer role
-- Migration: 20251126100001_add_org_approval_and_developer_role.sql

-- Add approval_status column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS approval_status TEXT 
CHECK (approval_status IN ('pending', 'approved', 'rejected')) 
DEFAULT 'pending';

-- Add approved_at and approved_by columns for audit trail
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Update existing organizations to 'approved' status (they were created before this system)
UPDATE organizations SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Create index for faster pending organization queries
CREATE INDEX IF NOT EXISTS idx_organizations_approval_status 
ON organizations(approval_status) 
WHERE approval_status = 'pending';

-- Update users table to include 'developer' role
-- First, drop the existing constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with developer role
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN (
  'org_admin', 
  'site_manager', 
  'head_grower', 
  'operator', 
  'compliance_qa', 
  'executive_viewer', 
  'installer_tech', 
  'support',
  'developer'
));

-- Comment for documentation
COMMENT ON COLUMN organizations.approval_status IS 'Organization approval status: pending (awaiting dev approval), approved (can use platform), rejected (denied access)';
COMMENT ON COLUMN organizations.approved_at IS 'Timestamp when organization was approved/rejected';
COMMENT ON COLUMN organizations.approved_by IS 'Developer user ID who approved/rejected the organization';
