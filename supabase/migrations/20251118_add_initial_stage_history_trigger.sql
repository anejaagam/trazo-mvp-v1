-- Migration: Add trigger to create initial stage history entry when batch is created
-- This ensures batches always have a starting stage history record

-- Function to create initial stage history
CREATE OR REPLACE FUNCTION create_initial_batch_stage_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial stage history entry
  INSERT INTO batch_stage_history (
    batch_id,
    stage,
    started_at,
    transitioned_by,
    notes
  ) VALUES (
    NEW.id,
    NEW.stage,
    NEW.created_at,
    NEW.created_by,
    'Initial stage'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after batch insert
DROP TRIGGER IF EXISTS trigger_create_initial_stage_history ON batches;
CREATE TRIGGER trigger_create_initial_stage_history
  AFTER INSERT ON batches
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_batch_stage_history();

COMMENT ON FUNCTION create_initial_batch_stage_history() IS 'Automatically creates initial stage history entry when a new batch is created';
COMMENT ON TRIGGER trigger_create_initial_stage_history ON batches IS 'Ensures every batch has an initial stage history record';
