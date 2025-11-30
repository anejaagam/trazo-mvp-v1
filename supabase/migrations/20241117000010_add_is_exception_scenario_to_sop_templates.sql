-- Add is_exception_scenario column to sop_templates table
ALTER TABLE sop_templates
ADD COLUMN IF NOT EXISTS is_exception_scenario BOOLEAN DEFAULT false NOT NULL;

-- Add comment
COMMENT ON COLUMN sop_templates.is_exception_scenario IS 'Indicates if this template is for handling exception scenarios';
