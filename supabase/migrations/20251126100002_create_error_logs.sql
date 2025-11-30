-- Create error_logs table for real-time error tracking
-- Migration: 20251126100002_create_error_logs.sql

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  stack TEXT,
  user_id UUID REFERENCES auth.users(id),
  route TEXT,
  component TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'error', 'warning', 'info')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_route ON error_logs(route);

-- Composite index for filtering by severity and time
CREATE INDEX IF NOT EXISTS idx_error_logs_severity_created 
ON error_logs(severity, created_at DESC);

-- Enable Row Level Security
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Developers can view all error logs
CREATE POLICY "Developers can view all error logs" ON error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'developer'
    )
  );

-- Policy: Any authenticated user can insert error logs (for client-side error capture)
CREATE POLICY "Authenticated users can insert error logs" ON error_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Developers can delete error logs (for clearing)
CREATE POLICY "Developers can delete error logs" ON error_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'developer'
    )
  );

-- Comment for documentation
COMMENT ON TABLE error_logs IS 'Centralized error logging for real-time platform monitoring by developers';
COMMENT ON COLUMN error_logs.severity IS 'Error severity: critical, error, warning, info';
COMMENT ON COLUMN error_logs.metadata IS 'Additional context such as browser info, request details, etc.';
