-- Add metrc_growth_phase to metrc_batch_mappings
-- This tracks the current Metrc growth phase to detect when TRAZO stage changes require Metrc phase sync

ALTER TABLE metrc_batch_mappings
ADD COLUMN metrc_growth_phase TEXT;

COMMENT ON COLUMN metrc_batch_mappings.metrc_growth_phase IS
'Current Metrc growth phase: Clone, Vegetative, or Flowering. Used to track when stage transitions require Metrc phase change sync.';

-- Add check constraint to ensure valid Metrc growth phases
ALTER TABLE metrc_batch_mappings
ADD CONSTRAINT metrc_batch_mappings_growth_phase_check
CHECK (metrc_growth_phase IN ('Clone', 'Vegetative', 'Flowering') OR metrc_growth_phase IS NULL);
