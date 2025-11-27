-- Create dev_audit_logs table for tracking developer actions
-- Migration: 20251126100003_create_dev_audit_logs.sql

-- Create dev_audit_logs table
CREATE TABLE IF NOT EXISTS dev_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_created_at ON dev_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_developer_id ON dev_audit_logs(developer_id);
CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_action ON dev_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_target ON dev_audit_logs(target_type, target_id);

-- Enable Row Level Security
ALTER TABLE dev_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Developers can view all dev audit logs
CREATE POLICY "Developers can view all dev audit logs" ON dev_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'developer'
    )
  );

-- Policy: Developers can insert audit logs
CREATE POLICY "Developers can insert dev audit logs" ON dev_audit_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'developer'
    )
  );

-- Comment for documentation
COMMENT ON TABLE dev_audit_logs IS 'Audit trail for developer actions in the dev dashboard';
COMMENT ON COLUMN dev_audit_logs.action IS 'Action type: org:approved, org:rejected, org:viewed, user:viewed, error:viewed, error:cleared, dashboard:viewed, logs:viewed';
COMMENT ON COLUMN dev_audit_logs.target_type IS 'Type of entity being acted upon: organization, user, error, etc.';
COMMENT ON COLUMN dev_audit_logs.target_id IS 'ID of the entity being acted upon';
