-- Phase 4 Module Integration Migration
-- Date: 2025-11-15
-- Purpose:
--   * Ensure inventory movements can reference batches
--   * Add explicit batch_id linkage to tasks for SOP automation
--   * Create supporting indexes for batch attribution lookups

-- -------------------------------------------------------------------
-- Ensure inventory_movements has batch_id column (idempotent)
-- -------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory_movements'
      AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE public.inventory_movements
      ADD COLUMN batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_batch
  ON public.inventory_movements(batch_id);

-- -------------------------------------------------------------------
-- Add batch_id to tasks for stage-driven SOP generation
-- -------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tasks'
      AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE public.tasks
      ADD COLUMN batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_tasks_batch
  ON public.tasks(batch_id);
