-- Add Metrc Location Mapping to Pods
-- Created: November 18, 2025
-- Purpose: Enable semi-autonomous batch sync by mapping pods to Metrc locations

-- =====================================================
-- ADD METRC LOCATION COLUMNS
-- =====================================================

-- Add metrc_location_name to pods
-- Each pod (grow container) maps to a Metrc location
ALTER TABLE pods
ADD COLUMN IF NOT EXISTS metrc_location_name TEXT;

COMMENT ON COLUMN pods.metrc_location_name IS 'Metrc API location/room name for this pod. Must match exactly with Metrc facility location names.';

-- Add default_metrc_location to sites
-- Fallback location for batches not assigned to a pod yet
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS default_metrc_location TEXT;

COMMENT ON COLUMN sites.default_metrc_location IS 'Default Metrc location for batches without pod assignment. Used as fallback for early-stage batches.';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for quick lookup of pods with Metrc mappings
CREATE INDEX IF NOT EXISTS idx_pods_metrc_location
ON pods(metrc_location_name)
WHERE metrc_location_name IS NOT NULL;

-- =====================================================
-- HELPER VIEW
-- =====================================================

-- Create a view to easily see Metrc location mappings
CREATE OR REPLACE VIEW metrc_location_mappings AS
SELECT
  s.id AS site_id,
  s.name AS site_name,
  s.default_metrc_location AS site_default_location,
  r.id AS room_id,
  r.name AS room_name,
  r.room_type,
  p.id AS pod_id,
  p.name AS pod_name,
  p.metrc_location_name,
  p.status AS pod_status,
  COUNT(DISTINCT bpa.batch_id) FILTER (WHERE bpa.removed_at IS NULL) AS active_batches
FROM sites s
INNER JOIN rooms r ON r.site_id = s.id
INNER JOIN pods p ON p.room_id = r.id
LEFT JOIN batch_pod_assignments bpa ON bpa.pod_id = p.id AND bpa.removed_at IS NULL
WHERE s.is_active = true AND r.is_active = true AND p.is_active = true
GROUP BY s.id, s.name, s.default_metrc_location, r.id, r.name, r.room_type, p.id, p.name, p.metrc_location_name, p.status
ORDER BY s.name, r.name, p.name;

COMMENT ON VIEW metrc_location_mappings IS 'Shows the mapping between TRAZO pods and Metrc locations for compliance sync';
