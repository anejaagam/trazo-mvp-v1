-- ============================================
-- FIX SIGNUP TRIGGER - Apply this in Supabase SQL Editor
-- ============================================
-- This fixes the handle_new_user trigger to properly create
-- organization and user profile during signup
--
-- Instructions:
-- 1. Go to your Supabase Dashboard (https://srrrfkgbcrgtplpekwji.supabase.co)
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- ============================================

-- Step 1: Create error logging table for debugging (if needed)
CREATE TABLE IF NOT EXISTS public.signup_trigger_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid,
  email text,
  error_message text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Step 2: Fix the audit trigger to handle missing 'name' field
CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  new_json jsonb;
  old_json jsonb;
  entity_name text;
  new_org_id_text text;
  new_entity_id_text text;
  new_org_id uuid;
  new_entity_id uuid;
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') THEN
    new_json := row_to_json(NEW)::jsonb;
  ELSE
    new_json := NULL;
  END IF;
  IF TG_OP IN ('DELETE','UPDATE') THEN
    old_json := row_to_json(OLD)::jsonb;
  ELSE
    old_json := NULL;
  END IF;

  entity_name := COALESCE(
    (new_json ->> 'name'),
    (old_json ->> 'name'),
    (new_json ->> 'title'),
    (old_json ->> 'title'),
    'N/A'
  );

  -- extract organization_id and entity id from json payloads safely
  IF new_json IS NOT NULL THEN
    new_org_id_text := new_json ->> 'organization_id';
    new_entity_id_text := new_json ->> 'id';
  ELSE
    new_org_id_text := old_json ->> 'organization_id';
    new_entity_id_text := old_json ->> 'id';
  END IF;

  BEGIN
    new_org_id := CASE WHEN new_org_id_text IS NOT NULL AND new_org_id_text <> '' THEN new_org_id_text::uuid ELSE NULL END;
  EXCEPTION WHEN OTHERS THEN
    new_org_id := NULL;
  END;

  BEGIN
    new_entity_id := CASE WHEN new_entity_id_text IS NOT NULL AND new_entity_id_text <> '' THEN new_entity_id_text::uuid ELSE NULL END;
  EXCEPTION WHEN OTHERS THEN
    new_entity_id := NULL;
  END;

  INSERT INTO public.audit_log (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    entity_name,
    old_values,
    new_values
  ) VALUES (
    new_org_id,
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    new_entity_id,
    entity_name,
    CASE WHEN TG_OP = 'DELETE' THEN old_json ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN new_json ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Step 3: Fix handle_new_user trigger with proper normalization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id uuid;
  user_metadata jsonb;
  raw_app_meta jsonb;
  normalized_region text;
  normalized_plant_type text;
BEGIN
  user_metadata := NEW.raw_user_meta_data;
  raw_app_meta := NEW.raw_app_meta_data;

  -- Normalize data_region to 'us' or 'canada' (lowercase) to match constraint
  normalized_region := CASE
    WHEN LOWER(COALESCE(user_metadata->>'data_region','')) = 'canada' THEN 'canada'
    WHEN LOWER(COALESCE(user_metadata->>'data_region','')) = 'ca' THEN 'canada'
    ELSE 'us'
  END;

  -- Normalize plant_type to 'cannabis' or 'produce' (lowercase) to match constraint
  normalized_plant_type := CASE
    WHEN LOWER(COALESCE(user_metadata->>'plant_type','')) IN ('cannabis','marijuana','weed') THEN 'cannabis'
    WHEN LOWER(COALESCE(user_metadata->>'plant_type','')) IN ('produce','food','vegetable') THEN 'produce'
    ELSE 'cannabis' -- default to cannabis
  END;

  BEGIN
    -- Create organization
    INSERT INTO public.organizations (
      name, data_region, jurisdiction, plant_type, contact_email, contact_phone, address
    ) VALUES (
      COALESCE(user_metadata->>'company_name', 'Default Organization'),
      normalized_region,
      COALESCE(user_metadata->>'jurisdiction', 'Oregon'),
      normalized_plant_type,
      NEW.email,
      user_metadata->>'phone',
      user_metadata->>'farm_location'
    ) RETURNING id INTO new_org_id;

    -- Create user profile
    INSERT INTO public.users (
      id, email, full_name, phone, organization_id, role,
      emergency_contact_name, emergency_contact_email, emergency_contact_phone,
      status, idp, last_sign_in
    ) VALUES (
      NEW.id,
      NEW.email,
      user_metadata->>'full_name',
      user_metadata->>'phone',
      new_org_id,
      COALESCE(user_metadata->>'role', 'operator'),
      user_metadata->>'emergency_contact_name',
      user_metadata->>'emergency_contact_email',
      user_metadata->>'emergency_contact_phone',
      'active',
      CASE WHEN raw_app_meta->>'provider' IS NOT NULL THEN raw_app_meta->>'provider' ELSE 'local' END,
      NOW()
    );

  EXCEPTION WHEN OTHERS THEN
    -- Log error details for debugging
    INSERT INTO public.signup_trigger_errors (auth_user_id, email, error_message, payload)
    VALUES (NEW.id, NEW.email, SQLERRM, jsonb_build_object('raw_user_meta_data', NEW.raw_user_meta_data, 'raw_app_meta_data', NEW.raw_app_meta_data));
    -- Re-raise the exception so signup fails visibly
    RAISE;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Verify the trigger is active
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- After running this script, test signup again.
-- Then run these queries to verify:

-- 1. Check if your user was created:
-- SELECT * FROM auth.users WHERE email = 'your-email@example.com';

-- 2. Check if organization was created:
-- SELECT * FROM public.organizations WHERE contact_email = 'your-email@example.com';

-- 3. Check if user profile was created:
-- SELECT u.*, o.name as org_name
-- FROM public.users u
-- JOIN public.organizations o ON u.organization_id = o.id
-- WHERE u.email = 'your-email@example.com';

-- 4. Check for any errors:
-- SELECT * FROM public.signup_trigger_errors ORDER BY created_at DESC LIMIT 10;
