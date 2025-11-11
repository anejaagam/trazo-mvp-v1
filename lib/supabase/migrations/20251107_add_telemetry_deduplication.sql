-- Migration: Add Unique Constraint for Telemetry Deduplication
-- Created: November 7, 2025
-- Purpose: Prevent duplicate telemetry readings based on pod_id + timestamp
-- This enables UPSERT operations to safely handle historical data imports

-- Add unique constraint to prevent duplicates
-- This constraint ensures only one reading per pod per timestamp
ALTER TABLE telemetry_readings 
ADD CONSTRAINT telemetry_readings_pod_timestamp_unique 
UNIQUE (pod_id, timestamp);

-- Add index for faster lookups on timestamp queries
-- (pod_id already has an index via the existing idx_telemetry_pod_time)
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp_pod 
ON telemetry_readings(timestamp DESC, pod_id);

-- Comment for documentation
COMMENT ON CONSTRAINT telemetry_readings_pod_timestamp_unique ON telemetry_readings IS 
'Ensures only one telemetry reading per pod per timestamp. Enables safe UPSERT operations for historical data imports from TagoIO.';
