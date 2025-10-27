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
  actor_user_id UUID;
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

  -- Get organization_id (for tables that include it)
  org_id_value := COALESCE(
    (new_json->>'organization_id')::uuid,
    (old_json->>'organization_id')::uuid
  );

  -- Get entity_id
  entity_id_value := COALESCE(
    (new_json->>'id')::uuid,
    (old_json->>'id')::uuid
  );

  -- Determine actor (user performing the change)
  -- Fall back to common attribution columns when using service role (auth.uid() is NULL)
  actor_user_id := COALESCE(
    auth.uid(),
    (new_json->>'performed_by')::uuid,
    (old_json->>'performed_by')::uuid,
    (new_json->>'created_by')::uuid,
    (old_json->>'created_by')::uuid,
    (new_json->>'assigned_by')::uuid,
    (old_json->>'assigned_by')::uuid,
    (new_json->>'applied_by')::uuid,
    (old_json->>'applied_by')::uuid,
    (new_json->>'uploaded_by')::uuid,
    (old_json->>'uploaded_by')::uuid,
    (new_json->>'approved_by')::uuid,
    (old_json->>'approved_by')::uuid,
    (new_json->>'acknowledged_by')::uuid,
    (old_json->>'acknowledged_by')::uuid
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
    actor_user_id,
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
