-- Add sla_hours column to sop_templates table
ALTER TABLE sop_templates
ADD COLUMN IF NOT EXISTS sla_hours INTEGER DEFAULT 24 NOT NULL;

-- Add comment
COMMENT ON COLUMN sop_templates.sla_hours IS 'Service level agreement in hours for completing tasks from this template';
