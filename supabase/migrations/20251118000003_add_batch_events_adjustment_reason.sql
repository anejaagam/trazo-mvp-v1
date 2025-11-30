-- Migration: Add adjustment_reason to batch_events
-- Created: 2025-11-18
-- Purpose: Support plant count adjustment sync to Metrc (Phase 3.5 Week 2)

-- Add adjustment_reason column to batch_events table
ALTER TABLE batch_events
ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN batch_events.adjustment_reason IS 'Reason for plant count adjustment (for Metrc compliance tracking)';

-- Create index for faster lookups of adjustments
CREATE INDEX IF NOT EXISTS idx_batch_events_adjustment_reason
ON batch_events(adjustment_reason)
WHERE adjustment_reason IS NOT NULL;

-- Add check constraint to ensure valid adjustment reasons (optional - for data integrity)
-- Note: This matches Metrc's valid adjustment reasons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_adjustment_reason'
  ) THEN
    ALTER TABLE batch_events
    ADD CONSTRAINT valid_adjustment_reason
    CHECK (
      adjustment_reason IS NULL OR
      adjustment_reason IN (
        'died',
        'destroyed_voluntary',
        'destroyed_mandatory',
        'contamination',
        'pest_infestation',
        'unhealthy',
        'data_error',
        'other'
      )
    );
  END IF;
END $$;
