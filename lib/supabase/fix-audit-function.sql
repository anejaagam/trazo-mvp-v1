-- Fix audit log function to handle tables without name/title fields
-- Run this in Supabase Dashboard SQL Editor

CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  entity_name_value TEXT;
  org_id_value UUID;
  entity_id_value UUID;
  new_json JSONB;
  old_json JSONB;
BEGIN
  -- Convert records to JSON first
  new_json := to_jsonb(NEW);
  old_json := to_jsonb(OLD);

  -- Try to get entity name from various possible fields
  entity_name_value := CASE
    WHEN TG_OP = 'DELETE' THEN
      COALESCE(
        old_json->>'name',
        old_json->>'full_name',
        old_json->>'title',
        old_json->>'email',
        'N/A'
      )
    ELSE
      COALESCE(
        new_json->>'name',
        new_json->>'full_name',
        new_json->>'title',
        new_json->>'email',
        'N/A'
      )
  END;

  -- Get organization_id
  org_id_value := COALESCE(
    (new_json->>'organization_id')::uuid,
    (old_json->>'organization_id')::uuid
  );

  -- Get entity_id
  entity_id_value := COALESCE(
    (new_json->>'id')::uuid,
    (old_json->>'id')::uuid
  );

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
    org_id_value,
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    entity_id_value,
    entity_name_value,
    CASE WHEN TG_OP = 'DELETE' THEN old_json ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN new_json ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;
