-- Migration: Add awaiting_approval and rejected statuses to tasks table
-- This allows tasks with requires_approval=true to go through an approval workflow

-- Drop the existing check constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Add new check constraint with additional statuses
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('to_do', 'in_progress', 'blocked', 'done', 'cancelled', 'approved', 'awaiting_approval', 'rejected'));

-- Add comment explaining the statuses
COMMENT ON COLUMN tasks.status IS 'Task status: to_do (not started), in_progress (being worked on), blocked (waiting on something), done (completed, no approval needed), awaiting_approval (completed, needs approval), approved (completed and approved), rejected (approval denied), cancelled (task abandoned)';
