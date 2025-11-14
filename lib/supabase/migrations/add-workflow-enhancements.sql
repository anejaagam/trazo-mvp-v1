-- =====================================================
-- WORKFLOW & TASK MANAGEMENT ENHANCEMENTS
-- Migration: Add support for task hierarchy, template states, 
-- visual test builder, and evidence compression
-- Created: 2025-01-13
-- =====================================================

-- Add template state management (draft/published)
ALTER TABLE sop_templates
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' 
    CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS parent_template_id UUID REFERENCES sop_templates(id),
  ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT TRUE;

-- Add visual test builder configuration to SOP steps
-- The steps JSONB field will now support:
-- {
--   "id": "step-uuid",
--   "order": 1,
--   "title": "Step title",
--   "description": "Step description",
--   "evidenceRequired": true,
--   "evidenceType": "photo|numeric|checkbox|signature|qr_scan|text|dual_signature",
--   "evidenceConfig": {
--     "minValue": 0,
--     "maxValue": 100,
--     "unit": "°F",
--     "options": ["Option 1", "Option 2"],
--     "dualSignature": {
--       "role1": "operator",
--       "role2": "supervisor",
--       "description": "Critical step requiring dual approval"
--     }
--   },
--   "conditionalLogic": [{
--     "condition": "equals|not_equals|greater_than|less_than|contains",
--     "value": "expected_value",
--     "nextStepId": "step-to-jump-to"
--   }],
--   "isConditional": false,
--   "isHighRisk": false,
--   "requiresApproval": false,
--   "approvalRoles": ["qa_manager"]
-- }

COMMENT ON COLUMN sop_templates.steps IS 'Array of step objects with visual test builder configuration including evidence types, conditional logic, and approval requirements';

-- Add task hierarchy support (5 levels max)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER DEFAULT 0 
    CHECK (hierarchy_level >= 0 AND hierarchy_level <= 4),
  ADD COLUMN IF NOT EXISTS sequence_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_prerequisite_of UUID[], -- Array of task IDs that depend on this one
  ADD COLUMN IF NOT EXISTS prerequisite_completed BOOLEAN DEFAULT FALSE;

-- Add evidence compression support
ALTER TABLE task_steps
  ADD COLUMN IF NOT EXISTS evidence_compressed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS evidence_compression_type TEXT 
    CHECK (evidence_compression_type IN ('gzip', 'brotli', 'image', 'none')),
  ADD COLUMN IF NOT EXISTS original_evidence_size INTEGER,
  ADD COLUMN IF NOT EXISTS compressed_evidence_size INTEGER;

-- Add compression to main tasks table for bulk evidence
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS evidence_compressed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS evidence_metadata JSONB DEFAULT '{}'::jsonb; -- Store compression metadata

-- Create index for task hierarchy queries
CREATE INDEX IF NOT EXISTS idx_tasks_hierarchy 
  ON tasks(parent_task_id, hierarchy_level);

CREATE INDEX IF NOT EXISTS idx_tasks_sequence 
  ON tasks(parent_task_id, sequence_order);

-- Create index for template versioning
CREATE INDEX IF NOT EXISTS idx_sop_templates_parent 
  ON sop_templates(parent_template_id);

CREATE INDEX IF NOT EXISTS idx_sop_templates_status 
  ON sop_templates(status, is_latest_version);

-- Function to validate task hierarchy depth
CREATE OR REPLACE FUNCTION validate_task_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  current_level INTEGER;
  parent_level INTEGER;
BEGIN
  -- If no parent, level must be 0
  IF NEW.parent_task_id IS NULL THEN
    NEW.hierarchy_level := 0;
    RETURN NEW;
  END IF;

  -- Get parent's hierarchy level
  SELECT hierarchy_level INTO parent_level
  FROM tasks
  WHERE id = NEW.parent_task_id;

  -- Check if parent exists
  IF parent_level IS NULL THEN
    RAISE EXCEPTION 'Parent task does not exist';
  END IF;

  -- Calculate current level
  current_level := parent_level + 1;

  -- Enforce maximum depth of 5 levels (0-4)
  IF current_level > 4 THEN
    RAISE EXCEPTION 'Task hierarchy cannot exceed 5 levels (0-4). Parent is at level %, child would be at level %', 
      parent_level, current_level;
  END IF;

  NEW.hierarchy_level := current_level;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task hierarchy validation
DROP TRIGGER IF EXISTS enforce_task_hierarchy ON tasks;
CREATE TRIGGER enforce_task_hierarchy
  BEFORE INSERT OR UPDATE OF parent_task_id ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_task_hierarchy();

-- Function to get task hierarchy tree
CREATE OR REPLACE FUNCTION get_task_hierarchy(root_task_id UUID)
RETURNS TABLE (
  task_id UUID,
  parent_id UUID,
  title TEXT,
  status TEXT,
  hierarchy_level INTEGER,
  sequence_order INTEGER,
  path TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE task_tree AS (
    -- Base case: root task
    SELECT 
      t.id,
      t.parent_task_id,
      t.title,
      t.status,
      t.hierarchy_level,
      t.sequence_order,
      ARRAY[t.title] as path
    FROM tasks t
    WHERE t.id = root_task_id
    
    UNION ALL
    
    -- Recursive case: child tasks
    SELECT 
      t.id,
      t.parent_task_id,
      t.title,
      t.status,
      t.hierarchy_level,
      t.sequence_order,
      tt.path || t.title
    FROM tasks t
    INNER JOIN task_tree tt ON t.parent_task_id = tt.id
  )
  SELECT * FROM task_tree
  ORDER BY hierarchy_level, sequence_order;
END;
$$ LANGUAGE plpgsql;

-- Function to check task prerequisites
CREATE OR REPLACE FUNCTION check_task_prerequisites(check_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  prereq_id UUID;
  prereq_status TEXT;
  all_completed BOOLEAN := TRUE;
BEGIN
  -- Check all task dependencies
  FOR prereq_id IN 
    SELECT depends_on_task_id 
    FROM task_dependencies 
    WHERE task_id = check_task_id 
      AND dependency_type = 'blocking'
  LOOP
    SELECT status INTO prereq_status
    FROM tasks
    WHERE id = prereq_id;
    
    IF prereq_status != 'done' AND prereq_status != 'approved' THEN
      all_completed := FALSE;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN all_completed;
END;
$$ LANGUAGE plpgsql;

-- Function to publish a template (creates new version)
CREATE OR REPLACE FUNCTION publish_template(
  template_id UUID,
  published_by_user UUID
)
RETURNS UUID AS $$
DECLARE
  new_version TEXT;
  current_version TEXT;
  version_num INTEGER;
  new_template_id UUID;
BEGIN
  -- Get current version
  SELECT version INTO current_version
  FROM sop_templates
  WHERE id = template_id;
  
  -- Calculate next version
  version_num := (regexp_match(current_version, '^(\d+)\.(\d+)$'))[2]::INTEGER + 1;
  new_version := (regexp_match(current_version, '^(\d+)\.(\d+)$'))[1] || '.' || version_num;
  
  -- Mark all previous versions as not latest
  UPDATE sop_templates
  SET is_latest_version = FALSE
  WHERE parent_template_id = template_id 
    OR id = template_id;
  
  -- Create new published version
  INSERT INTO sop_templates (
    organization_id, name, version, category, description, steps,
    estimated_duration_minutes, required_role, requires_approval,
    approval_role, safety_notes, equipment_required, materials_required,
    is_active, is_template, created_by, status, published_at, published_by,
    parent_template_id, is_latest_version
  )
  SELECT 
    organization_id, name, new_version, category, description, steps,
    estimated_duration_minutes, required_role, requires_approval,
    approval_role, safety_notes, equipment_required, materials_required,
    is_active, is_template, published_by_user, 'published', NOW(), published_by_user,
    template_id, TRUE
  FROM sop_templates
  WHERE id = template_id
  RETURNING id INTO new_template_id;
  
  -- Update version history
  UPDATE sop_templates
  SET version_history = version_history || jsonb_build_object(
    'version', new_version,
    'publishedAt', NOW(),
    'publishedBy', published_by_user,
    'status', 'published'
  )
  WHERE id = new_template_id;
  
  RETURN new_template_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for new columns
-- (Assuming RLS is already enabled on these tables)

-- Policy for template status
DROP POLICY IF EXISTS "Users can view published templates" ON sop_templates;
CREATE POLICY "Users can view published templates" ON sop_templates
  FOR SELECT
  USING (
    status = 'published' 
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'manager', 'supervisor')
    )
  );

-- Policy for task hierarchy
DROP POLICY IF EXISTS "Users can manage tasks in their org" ON tasks;
CREATE POLICY "Users can manage tasks in their org" ON tasks
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Create helper view for task hierarchy visualization
CREATE OR REPLACE VIEW task_hierarchy_view AS
WITH RECURSIVE task_tree AS (
  -- Root tasks (level 0)
  SELECT 
    id,
    parent_task_id,
    title,
    status,
    hierarchy_level,
    sequence_order,
    ARRAY[id] as path,
    title as full_path
  FROM tasks
  WHERE parent_task_id IS NULL
  
  UNION ALL
  
  -- Child tasks
  SELECT 
    t.id,
    t.parent_task_id,
    t.title,
    t.status,
    t.hierarchy_level,
    t.sequence_order,
    tt.path || t.id,
    tt.full_path || ' > ' || t.title
  FROM tasks t
  INNER JOIN task_tree tt ON t.parent_task_id = tt.id
)
SELECT * FROM task_tree;

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_task_hierarchy() TO authenticated;
GRANT EXECUTE ON FUNCTION get_task_hierarchy(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_task_prerequisites(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION publish_template(UUID, UUID) TO authenticated;
GRANT SELECT ON task_hierarchy_view TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN tasks.parent_task_id IS 'Reference to parent task for hierarchical task structures (max 5 levels)';
COMMENT ON COLUMN tasks.hierarchy_level IS 'Current level in task hierarchy (0-4, enforced by trigger)';
COMMENT ON COLUMN tasks.sequence_order IS 'Order of this task among siblings at the same hierarchy level';
COMMENT ON COLUMN tasks.is_prerequisite_of IS 'Array of task IDs that have this task as a prerequisite';
COMMENT ON COLUMN sop_templates.status IS 'Template lifecycle state: draft (editable), published (read-only), archived';
COMMENT ON COLUMN sop_templates.version_history IS 'Array of version objects tracking publish history';
COMMENT ON FUNCTION get_task_hierarchy(UUID) IS 'Returns complete hierarchy tree for a given root task';
COMMENT ON FUNCTION check_task_prerequisites(UUID) IS 'Validates all blocking prerequisites are completed';
COMMENT ON FUNCTION publish_template(UUID, UUID) IS 'Creates new published version of template, maintaining version history';

-- TODO: Phase 14 - Notification System
-- When implementing notifications in Phase 14, add:
-- - Notification triggers for task assignments
-- - Notification triggers for prerequisite completion
-- - Notification triggers for approval requests
-- - Escalation rules for overdue tasks
-- - In-app and email notification routing
