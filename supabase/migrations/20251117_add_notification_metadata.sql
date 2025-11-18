-- Add category, urgency, and metadata columns to notifications table
-- This allows us to categorize notifications (task, alarm, inventory, etc.)

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('alarm', 'task', 'inventory', 'batch', 'system')),
ADD COLUMN IF NOT EXISTS urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_category ON notifications(user_id, category);
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING gin(metadata);

-- Update existing alarm notifications to have category
UPDATE notifications SET category = 'alarm' WHERE alarm_id IS NOT NULL AND category IS NULL;
