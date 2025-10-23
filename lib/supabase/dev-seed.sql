-- =====================================================
-- DEV MODE SEED DATA
-- Seeds the database with dev mode mock records
-- Run this ONCE when setting up dev environment
-- =====================================================

-- Note: This uses the UUIDs from /lib/dev-mode.ts

-- IMPORTANT: This script requires SUPERUSER/SERVICE ROLE access
-- Run via Supabase Dashboard SQL Editor (has admin privileges)

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Temporarily disable audit triggers to avoid field mismatch issues
-- Note: These may fail if triggers don't exist yet, but that's okay
DO $$ 
BEGIN
  ALTER TABLE users DISABLE TRIGGER audit_users;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE organizations DISABLE TRIGGER audit_organizations;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE sites DISABLE TRIGGER audit_sites;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE inventory_items DISABLE TRIGGER audit_inventory_items;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

-- Step 1: Create auth.users record (requires service role)
-- Insert into auth schema directly
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000', -- default instance
  'authenticated',
  'authenticated',
  'dev@trazo.ag',
  crypt('devpassword123', gen_salt('bf')), -- Password: devpassword123
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dev User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Step 2: Insert dev organization
INSERT INTO organizations (
  id,
  name,
  data_region,
  jurisdiction,
  plant_type,
  contact_email,
  timezone,
  is_active
)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'Development Farm',
  'us',
  'maryland_cannabis',
  'cannabis',
  'dev@trazo.ag',
  'America/Los_Angeles',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  data_region = EXCLUDED.data_region,
  jurisdiction = EXCLUDED.jurisdiction,
  plant_type = EXCLUDED.plant_type,
  updated_at = NOW();

-- Insert dev site
INSERT INTO sites (
  id,
  organization_id,
  name,
  timezone,
  is_active
)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000010',
  'Main Facility',
  'America/Los_Angeles',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  organization_id = EXCLUDED.organization_id,
  updated_at = NOW();

-- Step 3: Insert dev user in public.users table
-- This links to the auth.users record created above
INSERT INTO users (
  id,
  email,
  full_name,
  phone,
  organization_id,
  role,
  status,
  is_active
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dev@trazo.ag',
  'Dev User',
  '+1234567890',
  '00000000-0000-0000-0000-000000000010',
  'org_admin',
  'active',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  organization_id = EXCLUDED.organization_id,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 4: Insert user site assignment
INSERT INTO user_site_assignments (
  user_id,
  site_id,
  is_active
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000020',
  true
)
ON CONFLICT (user_id, site_id) DO UPDATE SET
  is_active = EXCLUDED.is_active;

-- Re-enable audit triggers
DO $$ 
BEGIN
  ALTER TABLE users ENABLE TRIGGER audit_users;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE organizations ENABLE TRIGGER audit_organizations;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE sites ENABLE TRIGGER audit_sites;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE inventory_items ENABLE TRIGGER audit_inventory_items;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

-- Step 5: Verify the data was inserted correctly
SELECT 'Dev Organization:' as type, id, name FROM organizations WHERE id = '00000000-0000-0000-0000-000000000010'
UNION ALL
SELECT 'Dev Site:', id, name FROM sites WHERE id = '00000000-0000-0000-0000-000000000020'
UNION ALL
SELECT 'Dev User:', id, full_name FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
