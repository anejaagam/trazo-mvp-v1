-- Migration: Auto-create default site for new organizations
-- Created: 2025-01-30
-- Purpose: Automatically create a "Main Site" when a new organization is created
--          This eliminates the need for getOrCreateDefaultSite() calls

-- Function to create default site for new organization
CREATE OR REPLACE FUNCTION create_default_site_for_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a default site for the new organization
  INSERT INTO sites (
    id,
    organization_id,
    name,
    address,
    city,
    state_province,
    postal_code,
    country,
    is_active
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    'Main Site',
    '',  -- Empty address, can be filled in later
    '',
    '',
    '',
    CASE WHEN NEW.data_region = 'us' THEN 'US' ELSE 'CA' END,  -- Map data_region to country
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run after organization insert
DROP TRIGGER IF EXISTS trigger_create_default_site ON organizations;
CREATE TRIGGER trigger_create_default_site
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_site_for_organization();

-- Comment
COMMENT ON FUNCTION create_default_site_for_organization() IS 
  'Automatically creates a default "Main Site" when a new organization is created. This ensures every organization has at least one site for pods, rooms, etc.';
