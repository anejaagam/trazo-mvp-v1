-- Batch-Task Integration for Phase 4
-- Add batch_id to tasks, task_steps, and sop_templates for batch-task linking
-- Extend batch_events to store task_id for comprehensive audit trail
-- Part of Phase 4 Batch Management (Nov 14, 2025)

-- ============================================================================
-- PART 1: ADD BATCH_ID TO TASK-RELATED TABLES
-- ============================================================================

-- Add batch_id to tasks table (already exists as a column, so just commenting for clarity)
-- The tasks table already has batch_id UUID REFERENCES batches(id)
-- We just need to ensure it's properly indexed

-- Add batch_id to sop_templates table for batch-specific SOPs
ALTER TABLE sop_templates ADD COLUMN batch_id UUID REFERENCES batches(id) ON DELETE CASCADE;
COMMENT ON COLUMN sop_templates.batch_id IS 'Optional batch reference for batch-specific SOP templates';

-- Add batch_id to task_steps table (for direct batch linkage at step level)
ALTER TABLE task_steps ADD COLUMN batch_id UUID REFERENCES batches(id) ON DELETE CASCADE;
COMMENT ON COLUMN task_steps.batch_id IS 'Optional batch reference for batch-specific task steps';

-- ============================================================================
-- PART 2: EXTEND BATCH_EVENTS TO STORE TASK_ID
-- ============================================================================

-- Add task_id to batch_events for task-related event tracking
ALTER TABLE batch_events ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
COMMENT ON COLUMN batch_events.task_id IS 'Reference to task that triggered or is related to this batch event';

-- Update event_type check constraint to include task-related events
ALTER TABLE batch_events DROP CONSTRAINT IF EXISTS batch_events_event_type_check;
ALTER TABLE batch_events ADD CONSTRAINT batch_events_event_type_check 
  CHECK (event_type IN (
    'created', 'stage_change', 'plant_count_update', 'pod_assignment', 
    'pod_removal', 'quarantine', 'quarantine_release', 'harvest', 
    'destruction', 'note_added', 'recipe_applied',
    'task_linked', 'task_completed', 'task_cancelled', 'sop_template_linked',
    'packet_generated'
  ));

-- ============================================================================
-- PART 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for batch_id on sop_templates
CREATE INDEX IF NOT EXISTS idx_sop_templates_batch_id ON sop_templates(batch_id) WHERE batch_id IS NOT NULL;

-- Index for batch_id on task_steps
CREATE INDEX IF NOT EXISTS idx_task_steps_batch_id ON task_steps(batch_id) WHERE batch_id IS NOT NULL;

-- Index for task_id on batch_events
CREATE INDEX IF NOT EXISTS idx_batch_events_task_id ON batch_events(task_id) WHERE task_id IS NOT NULL;

-- Composite index for batch tasks lookup
CREATE INDEX IF NOT EXISTS idx_tasks_batch_status ON tasks(batch_id, status) WHERE batch_id IS NOT NULL;

-- Composite index for batch events with task tracking
CREATE INDEX IF NOT EXISTS idx_batch_events_batch_task ON batch_events(batch_id, task_id, timestamp DESC) 
  WHERE task_id IS NOT NULL;

-- ============================================================================
-- PART 4: CREATE BATCH-TASK LINKING TABLE (for template associations)
-- ============================================================================

CREATE TABLE batch_sop_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  sop_template_id UUID NOT NULL REFERENCES sop_templates(id) ON DELETE CASCADE,
  stage TEXT, -- Optional: link to specific batch stage
  auto_create BOOLEAN DEFAULT FALSE, -- Auto-create tasks on stage transition
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, sop_template_id)
);

COMMENT ON TABLE batch_sop_links IS 'Links between batches and SOP templates for automated task generation';
COMMENT ON COLUMN batch_sop_links.stage IS 'Optional batch stage that triggers this SOP';
COMMENT ON COLUMN batch_sop_links.auto_create IS 'Whether to auto-create tasks when batch enters specified stage';

CREATE INDEX idx_batch_sop_links_batch ON batch_sop_links(batch_id);
CREATE INDEX idx_batch_sop_links_template ON batch_sop_links(sop_template_id);
CREATE INDEX idx_batch_sop_links_stage ON batch_sop_links(batch_id, stage) WHERE stage IS NOT NULL;

-- ============================================================================
-- PART 5: CREATE BATCH PACKET METADATA TABLE
-- ============================================================================

CREATE TABLE batch_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  packet_type TEXT DEFAULT 'full' CHECK (packet_type IN ('full', 'summary', 'compliance', 'harvest')),
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  generated_by UUID NOT NULL REFERENCES users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  includes_tasks BOOLEAN DEFAULT TRUE,
  includes_recipe BOOLEAN DEFAULT TRUE,
  includes_inventory BOOLEAN DEFAULT TRUE,
  includes_compliance BOOLEAN DEFAULT TRUE,
  metadata JSONB -- Additional packet metadata
);

COMMENT ON TABLE batch_packets IS 'Generated batch packet documents (PDF/HTML) for compliance and reporting';
COMMENT ON COLUMN batch_packets.packet_type IS 'Type of packet: full, summary, compliance, or harvest';
COMMENT ON COLUMN batch_packets.metadata IS 'Additional packet metadata (date ranges, filters, etc.)';

CREATE INDEX idx_batch_packets_batch ON batch_packets(batch_id, generated_at DESC);
CREATE INDEX idx_batch_packets_generated_by ON batch_packets(generated_by);

-- ============================================================================
-- PART 6: UPDATE RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE batch_sop_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_packets ENABLE ROW LEVEL SECURITY;

-- batch_sop_links policies
CREATE POLICY batch_sop_links_select 
  ON batch_sop_links FOR SELECT
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE site_id IN (
        SELECT id FROM sites WHERE organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY batch_sop_links_insert 
  ON batch_sop_links FOR INSERT
  WITH CHECK (
    batch_id IN (
      SELECT id FROM batches WHERE site_id IN (
        SELECT id FROM sites WHERE organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY batch_sop_links_update 
  ON batch_sop_links FOR UPDATE
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE site_id IN (
        SELECT id FROM sites WHERE organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY batch_sop_links_delete 
  ON batch_sop_links FOR DELETE
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE site_id IN (
        SELECT id FROM sites WHERE organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      )
    )
  );

-- batch_packets policies
CREATE POLICY batch_packets_select 
  ON batch_packets FOR SELECT
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE site_id IN (
        SELECT id FROM sites WHERE organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY batch_packets_insert 
  ON batch_packets FOR INSERT
  WITH CHECK (
    batch_id IN (
      SELECT id FROM batches WHERE site_id IN (
        SELECT id FROM sites WHERE organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY batch_packets_delete 
  ON batch_packets FOR DELETE
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE site_id IN (
        SELECT id FROM sites WHERE organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- PART 7: CREATE HELPER FUNCTION FOR AUTO-TASK CREATION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_batch_stage_tasks()
RETURNS TRIGGER AS $$
DECLARE
  link_record RECORD;
  new_task_id UUID;
BEGIN
  -- Only proceed if stage changed
  IF (TG_OP = 'UPDATE' AND NEW.current_stage = OLD.current_stage) THEN
    RETURN NEW;
  END IF;

  -- Find all SOP templates linked to this batch for this stage
  FOR link_record IN
    SELECT bsl.*, st.name, st.description, st.steps, st.estimated_duration_minutes, 
           st.required_role, st.requires_approval
    FROM batch_sop_links bsl
    JOIN sop_templates st ON st.id = bsl.sop_template_id
    WHERE bsl.batch_id = NEW.id
      AND bsl.auto_create = TRUE
      AND (bsl.stage = NEW.current_stage OR bsl.stage IS NULL)
      AND st.is_active = TRUE
  LOOP
    -- Create task from template
    INSERT INTO tasks (
      organization_id,
      site_id,
      batch_id,
      sop_template_id,
      title,
      description,
      status,
      priority,
      related_to_type,
      related_to_id,
      estimated_duration_minutes,
      created_by
    ) VALUES (
      NEW.organization_id,
      NEW.site_id,
      NEW.id,
      link_record.sop_template_id,
      link_record.name || ' - ' || NEW.batch_number,
      link_record.description,
      'to_do',
      'medium',
      'batch',
      NEW.id,
      link_record.estimated_duration_minutes,
      NEW.created_by
    ) RETURNING id INTO new_task_id;

    -- Log event
    INSERT INTO batch_events (
      batch_id,
      event_type,
      task_id,
      user_id,
      notes
    ) VALUES (
      NEW.id,
      'task_linked',
      new_task_id,
      NEW.created_by,
      'Auto-created task from template: ' || link_record.name
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-task creation on stage change
DROP TRIGGER IF EXISTS trigger_batch_stage_tasks ON batches;
CREATE TRIGGER trigger_batch_stage_tasks
  AFTER INSERT OR UPDATE OF current_stage ON batches
  FOR EACH ROW
  EXECUTE FUNCTION create_batch_stage_tasks();

COMMENT ON FUNCTION create_batch_stage_tasks IS 'Automatically creates tasks from linked SOP templates when batch stage changes';
