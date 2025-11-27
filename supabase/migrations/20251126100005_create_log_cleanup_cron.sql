-- Create cron job for cleaning up old logs (45 days retention)
-- Migration: 20251126100005_create_log_cleanup_cron.sql

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create function to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete error logs older than 45 days
  DELETE FROM error_logs 
  WHERE created_at < now() - interval '45 days';
  
  -- Delete dev audit logs older than 45 days
  DELETE FROM dev_audit_logs 
  WHERE created_at < now() - interval '45 days';
  
  -- Log the cleanup action
  RAISE NOTICE 'Log cleanup completed at %', now();
END;
$$;

-- Schedule the cleanup job to run daily at midnight UTC
SELECT cron.schedule(
  'cleanup-old-logs',           -- job name
  '0 0 * * *',                  -- cron schedule: midnight UTC daily
  'SELECT cleanup_old_logs()'   -- command to run
);

-- Comment for documentation
COMMENT ON FUNCTION cleanup_old_logs() IS 'Cleans up error_logs and dev_audit_logs older than 45 days. Runs daily at midnight UTC.';
