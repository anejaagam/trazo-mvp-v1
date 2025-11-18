-- Add requires_dual_signoff column to sop_templates table
ALTER TABLE sop_templates
ADD COLUMN IF NOT EXISTS requires_dual_signoff BOOLEAN DEFAULT false NOT NULL;

-- Add comment
COMMENT ON COLUMN sop_templates.requires_dual_signoff IS 'Indicates if this template requires dual sign-off for completion';
