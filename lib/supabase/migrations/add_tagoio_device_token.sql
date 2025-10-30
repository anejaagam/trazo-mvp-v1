-- Add TagoIO device token column to pods table
-- This stores the device-specific authentication token for TagoIO API calls

ALTER TABLE pods 
ADD COLUMN IF NOT EXISTS tagoio_device_token TEXT;

COMMENT ON COLUMN pods.tagoio_device_token IS 'TagoIO device authentication token (device-specific, not organization-level)';
