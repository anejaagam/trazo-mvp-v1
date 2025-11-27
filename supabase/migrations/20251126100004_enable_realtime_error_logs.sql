-- Enable Supabase Realtime on error_logs table
-- Migration: 20251126100004_enable_realtime_error_logs.sql

-- Enable realtime for error_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE error_logs;

-- Comment for documentation
COMMENT ON TABLE error_logs IS 'Centralized error logging for real-time platform monitoring by developers. Realtime enabled for live streaming.';
