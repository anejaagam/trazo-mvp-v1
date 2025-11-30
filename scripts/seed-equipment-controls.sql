-- Seed Equipment Controls for Existing Pods
-- Creates default equipment controls for all pods that don't have them yet
-- Run this in Supabase SQL Editor

-- Insert default equipment controls for each pod
INSERT INTO equipment_controls (pod_id, equipment_type, state, mode, override, schedule_enabled, level)
SELECT 
  p.id as pod_id,
  equipment_type,
  0 as state, -- OFF
  0 as mode, -- MANUAL
  false as override,
  false as schedule_enabled,
  0 as level
FROM pods p
CROSS JOIN (
  VALUES 
    ('HVAC'),
    ('Lighting'),
    ('Irrigation'),
    ('CO2'),
    ('Dehumidifier'),
    ('Humidifier'),
    ('Fan'),
    ('Heater')
) AS equipment_types(equipment_type)
WHERE NOT EXISTS (
  SELECT 1 FROM equipment_controls ec
  WHERE ec.pod_id = p.id 
  AND ec.equipment_type = equipment_types.equipment_type
);

-- Verify insertion
SELECT 
  s.name as site_name,
  p.name as pod_name,
  COUNT(ec.id) as equipment_count
FROM pods p
JOIN sites s ON p.site_id = s.id
LEFT JOIN equipment_controls ec ON ec.pod_id = p.id
GROUP BY s.name, p.name
ORDER BY s.name, p.name;
