-- Migration: Add default_site_id to users table
-- This enables org_admins to assign a default site when creating/inviting users

-- Add default_site_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_site_id UUID REFERENCES sites(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_default_site ON users(default_site_id) WHERE default_site_id IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN users.default_site_id IS 'The default site assigned by org_admin when user logs in. Must be one of their assigned sites.';

-- Data migration: Set default_site_id to first assignment for existing users who don't have one
UPDATE users u
SET default_site_id = (
  SELECT usa.site_id
  FROM user_site_assignments usa
  WHERE usa.user_id = u.id AND usa.is_active = true
  ORDER BY usa.assigned_at ASC
  LIMIT 1
)
WHERE u.default_site_id IS NULL
  AND u.status = 'active'
  AND EXISTS (
    SELECT 1 FROM user_site_assignments usa
    WHERE usa.user_id = u.id AND usa.is_active = true
  );
