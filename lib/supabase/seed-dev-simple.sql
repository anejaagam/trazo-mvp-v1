-- Simple dev seed for TRAZO MVP
-- Run this in Supabase Dashboard > SQL Editor
-- Uses service role to bypass RLS and insert test data

-- 1. Insert into auth.users (required first)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'test@trazo.app',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Dev Test User"}',
  false,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 2. Create organization
INSERT INTO public.organizations (
  id,
  name,
  slug,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  'Dev Test Organization',
  'dev-test-org',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 3. Create site
INSERT INTO public.sites (
  id,
  organization_id,
  site_name,
  site_type,
  address,
  city,
  state,
  postal_code,
  country,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000010',
  'Dev Test Site',
  'INDOOR',
  '123 Test St',
  'Portland',
  'OR',
  '97201',
  'US',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 4. Create user record
INSERT INTO public.users (
  id,
  email,
  organization_id,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@trazo.app',
  '00000000-0000-0000-0000-000000000010',
  'SUPER_ADMIN',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 5. Create site assignment
INSERT INTO public.site_assignments (
  user_id,
  site_id,
  is_primary,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000020',
  true,
  now()
) ON CONFLICT (user_id, site_id) DO NOTHING;

-- Verify the data
SELECT 'Auth User' as table_name, id, email FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Organization' as table_name, id, name::text FROM organizations WHERE id = '00000000-0000-0000-0000-000000000010'
UNION ALL
SELECT 'Site' as table_name, id, site_name::text FROM sites WHERE id = '00000000-0000-0000-0000-000000000020'
UNION ALL
SELECT 'User' as table_name, id, email::text FROM users WHERE id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Site Assignment' as table_name, user_id::text, site_id::text FROM site_assignments WHERE user_id = '00000000-0000-0000-0000-000000000001';
