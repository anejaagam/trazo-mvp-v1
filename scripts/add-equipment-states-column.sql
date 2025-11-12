-- Add equipment_states JSONB column to telemetry_readings
-- This stores full equipment control metadata including AUTO mode, levels, schedules
-- Replaces simple boolean fields for enhanced equipment control

-- Add column to US database
ALTER TABLE telemetry_readings 
ADD COLUMN IF NOT EXISTS equipment_states JSONB;

-- Add comment for documentation
COMMENT ON COLUMN telemetry_readings.equipment_states IS 'Enhanced equipment control states with AUTO mode support. Maps equipment type to EquipmentControl object with state, mode, override, level, schedule_enabled, and auto_config fields.';

-- Create index for querying equipment states
CREATE INDEX IF NOT EXISTS idx_telemetry_equipment_states ON telemetry_readings USING GIN (equipment_states);
