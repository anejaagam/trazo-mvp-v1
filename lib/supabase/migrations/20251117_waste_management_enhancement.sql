-- Waste Management Enhancement Migration
-- Phase 0: Database Enhancement for Waste Management System
-- Created: November 17, 2025
-- Adds missing columns, indexes, RLS policies, triggers, and analytics view

-- ============================================================================
-- 1. ADD MISSING COLUMNS TO waste_logs
-- ============================================================================

-- Rendering method details (Metrc compliance)
ALTER TABLE waste_logs 
ADD COLUMN IF NOT EXISTS rendering_method TEXT 
CHECK (rendering_method IN (
  'fifty_fifty_mix',
  'grinding', 
  'composting',
  'chemical_treatment',
  'incineration',
  'other'
));

ALTER TABLE waste_logs 
ADD COLUMN IF NOT EXISTS waste_material_mixed TEXT; -- e.g., "kitty litter", "sand", "sawdust"

ALTER TABLE waste_logs 
ADD COLUMN IF NOT EXISTS mix_ratio TEXT; -- e.g., "50:50", "60:40"

-- Metrc sync status tracking
ALTER TABLE waste_logs 
ADD COLUMN IF NOT EXISTS metrc_sync_status TEXT 
DEFAULT 'pending'
CHECK (metrc_sync_status IN ('pending', 'synced', 'failed', 'not_applicable'));

ALTER TABLE waste_logs 
ADD COLUMN IF NOT EXISTS metrc_sync_error TEXT;

ALTER TABLE waste_logs 
ADD COLUMN IF NOT EXISTS metrc_synced_at TIMESTAMPTZ;

-- Timestamps (if not already present from schema.sql)
ALTER TABLE waste_logs 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE waste_logs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Batch reference (for better tracking)
ALTER TABLE waste_logs 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL;

-- Inventory item reference
ALTER TABLE waste_logs 
ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL;

-- Lot reference (for inventory lot tracking)
ALTER TABLE waste_logs 
ADD COLUMN IF NOT EXISTS inventory_lot_id UUID REFERENCES inventory_lots(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organization/Site filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_waste_logs_org_site 
ON waste_logs(organization_id, site_id);

-- Date range filtering
CREATE INDEX IF NOT EXISTS idx_waste_logs_disposed_at 
ON waste_logs(disposed_at DESC);

-- Waste type filtering
CREATE INDEX IF NOT EXISTS idx_waste_logs_waste_type 
ON waste_logs(waste_type);

-- Source tracking
CREATE INDEX IF NOT EXISTS idx_waste_logs_source 
ON waste_logs(source_type, source_id) 
WHERE source_id IS NOT NULL;

-- Batch tracking
CREATE INDEX IF NOT EXISTS idx_waste_logs_batch_id 
ON waste_logs(batch_id) 
WHERE batch_id IS NOT NULL;

-- Inventory tracking
CREATE INDEX IF NOT EXISTS idx_waste_logs_inventory_item_id 
ON waste_logs(inventory_item_id) 
WHERE inventory_item_id IS NOT NULL;

-- Metrc sync status (for compliance monitoring)
CREATE INDEX IF NOT EXISTS idx_waste_logs_metrc_sync 
ON waste_logs(metrc_sync_status) 
WHERE metrc_sync_status IN ('pending', 'failed');

-- Compliance monitoring (unrendered or unwitnessed waste)
CREATE INDEX IF NOT EXISTS idx_waste_logs_compliance 
ON waste_logs(rendered_unusable, witnessed_by) 
WHERE rendered_unusable = FALSE OR witnessed_by IS NULL;

-- Performer tracking
CREATE INDEX IF NOT EXISTS idx_waste_logs_performed_by 
ON waste_logs(performed_by);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on waste_logs
ALTER TABLE waste_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS waste_logs_select_policy ON waste_logs;
DROP POLICY IF EXISTS waste_logs_insert_policy ON waste_logs;
DROP POLICY IF EXISTS waste_logs_update_policy ON waste_logs;
DROP POLICY IF EXISTS waste_logs_delete_policy ON waste_logs;

-- SELECT: Users can view waste logs from their organization
CREATE POLICY waste_logs_select_policy ON waste_logs
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- INSERT: Authorized users can create waste logs
CREATE POLICY waste_logs_insert_policy ON waste_logs
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
  )
  AND
  site_id IN (
    SELECT id 
    FROM sites 
    WHERE organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
);

-- UPDATE: Only the creator can update within 24 hours of creation
CREATE POLICY waste_logs_update_policy ON waste_logs
FOR UPDATE
USING (
  performed_by = auth.uid()
  AND
  created_at > NOW() - INTERVAL '24 hours'
)
WITH CHECK (
  performed_by = auth.uid()
  AND
  created_at > NOW() - INTERVAL '24 hours'
);

-- DELETE: No one can delete waste logs (immutable audit trail)
-- Optionally allow org_admin to delete within 1 hour for mistakes
CREATE POLICY waste_logs_delete_policy ON waste_logs
FOR DELETE
USING (
  created_at > NOW() - INTERVAL '1 hour'
  AND
  EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = auth.uid() 
    AND organization_id = waste_logs.organization_id
    AND role = 'org_admin'
  )
);

-- ============================================================================
-- 4. EXTEND batch_events TO SUPPORT WASTE DISPOSAL
-- ============================================================================

-- Add 'waste_disposal' to the batch_events event_type constraint
ALTER TABLE batch_events DROP CONSTRAINT IF EXISTS batch_events_event_type_check;
ALTER TABLE batch_events ADD CONSTRAINT batch_events_event_type_check 
CHECK (event_type IN (
  'created', 'stage_change', 'plant_count_update', 'pod_assignment', 
  'pod_removal', 'quarantine', 'quarantine_release', 'harvest', 
  'destruction', 'note_added', 'recipe_applied', 'waste_disposal'
));

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_waste_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS waste_logs_updated_at_trigger ON waste_logs;
CREATE TRIGGER waste_logs_updated_at_trigger
  BEFORE UPDATE ON waste_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_waste_logs_updated_at();

-- Trigger: Auto-create batch event when waste is from a batch
CREATE OR REPLACE FUNCTION create_batch_waste_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create event if batch_id is present
  IF NEW.batch_id IS NOT NULL THEN
    INSERT INTO batch_events (
      batch_id,
      event_type,
      user_id,
      to_value,
      notes,
      timestamp
    ) VALUES (
      NEW.batch_id,
      'waste_disposal',
      NEW.performed_by,
      jsonb_build_object(
        'waste_log_id', NEW.id,
        'waste_type', NEW.waste_type,
        'quantity', NEW.quantity,
        'unit_of_measure', NEW.unit_of_measure,
        'reason', NEW.reason,
        'disposal_method', NEW.disposal_method,
        'rendered_unusable', NEW.rendered_unusable,
        'witnessed_by', NEW.witnessed_by
      ),
      'Waste disposal recorded',
      NEW.disposed_at
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS batch_waste_event_trigger ON waste_logs;
CREATE TRIGGER batch_waste_event_trigger
  AFTER INSERT ON waste_logs
  FOR EACH ROW
  EXECUTE FUNCTION create_batch_waste_event();

-- ============================================================================
-- 5. ANALYTICS VIEW: waste_summary
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS waste_summary;

-- Create analytics view for waste reporting (simplified to avoid nested aggregates)
CREATE VIEW waste_summary AS
SELECT
  organization_id,
  site_id,
  DATE_TRUNC('month', disposed_at) AS month,
  DATE_TRUNC('week', disposed_at) AS week,
  DATE_TRUNC('day', disposed_at) AS day,
  
  -- Total counts
  COUNT(*) AS total_waste_count,
  
  -- Total weight (assuming kg as standard)
  SUM(
    CASE 
      WHEN unit_of_measure = 'kg' THEN quantity
      WHEN unit_of_measure = 'g' THEN quantity / 1000
      WHEN unit_of_measure = 'lb' THEN quantity * 0.453592
      WHEN unit_of_measure = 'oz' THEN quantity * 0.0283495
      ELSE 0
    END
  ) AS total_weight_kg,
  
  -- Compliance metrics
  COUNT(*) FILTER (WHERE rendered_unusable = TRUE) AS rendered_count,
  COUNT(*) FILTER (WHERE witnessed_by IS NOT NULL) AS witnessed_count,
  COUNT(*) FILTER (WHERE array_length(photo_urls, 1) >= 2) AS photos_sufficient_count,
  
  -- Compliance rate (percentage rendered unusable)
  ROUND(
    (COUNT(*) FILTER (WHERE rendered_unusable = TRUE)::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
    2
  ) AS compliance_rate,
  
  -- Metrc sync status
  COUNT(*) FILTER (WHERE metrc_sync_status = 'synced') AS metrc_synced_count,
  COUNT(*) FILTER (WHERE metrc_sync_status = 'pending') AS metrc_pending_count,
  COUNT(*) FILTER (WHERE metrc_sync_status = 'failed') AS metrc_failed_count,
  
  -- Metrc sync rate
  ROUND(
    (COUNT(*) FILTER (WHERE metrc_sync_status = 'synced')::NUMERIC / 
     NULLIF(COUNT(*) FILTER (WHERE metrc_sync_status IN ('synced', 'pending', 'failed'))::NUMERIC, 0)) * 100,
    2
  ) AS metrc_sync_rate

FROM waste_logs
GROUP BY organization_id, site_id, month, week, day;

-- Grant access to authenticated users
GRANT SELECT ON waste_summary TO authenticated;

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get unrendered waste for compliance monitoring
CREATE OR REPLACE FUNCTION get_unrendered_waste(p_site_id UUID)
RETURNS TABLE (
  id UUID,
  waste_type TEXT,
  quantity DECIMAL,
  unit_of_measure TEXT,
  disposed_at TIMESTAMPTZ,
  performed_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.waste_type,
    w.quantity,
    w.unit_of_measure,
    w.disposed_at,
    w.performed_by
  FROM waste_logs w
  WHERE w.site_id = p_site_id
    AND w.rendered_unusable = FALSE
    AND w.waste_type IN ('plant_material', 'trim') -- Cannabis waste only
  ORDER BY w.disposed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unwitnessed waste for compliance monitoring
CREATE OR REPLACE FUNCTION get_unwitnessed_waste(p_site_id UUID)
RETURNS TABLE (
  id UUID,
  waste_type TEXT,
  quantity DECIMAL,
  unit_of_measure TEXT,
  disposed_at TIMESTAMPTZ,
  performed_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.waste_type,
    w.quantity,
    w.unit_of_measure,
    w.disposed_at,
    w.performed_by
  FROM waste_logs w
  WHERE w.site_id = p_site_id
    AND w.witnessed_by IS NULL
    AND w.waste_type IN ('plant_material', 'trim') -- Cannabis waste only
  ORDER BY w.disposed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unsynced Metrc waste
CREATE OR REPLACE FUNCTION get_unsynced_metrc_waste(p_site_id UUID)
RETURNS TABLE (
  id UUID,
  waste_type TEXT,
  quantity DECIMAL,
  unit_of_measure TEXT,
  disposed_at TIMESTAMPTZ,
  metrc_sync_status TEXT,
  metrc_sync_error TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.waste_type,
    w.quantity,
    w.unit_of_measure,
    w.disposed_at,
    w.metrc_sync_status,
    w.metrc_sync_error
  FROM waste_logs w
  WHERE w.site_id = p_site_id
    AND w.metrc_sync_status IN ('pending', 'failed')
  ORDER BY w.disposed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE waste_logs IS 'Tracks all waste disposal activities with compliance documentation and Metrc integration';
COMMENT ON COLUMN waste_logs.rendering_method IS 'Method used to render waste unusable (Metrc requirement)';
COMMENT ON COLUMN waste_logs.waste_material_mixed IS 'Inert material mixed with waste (e.g., kitty litter, sand)';
COMMENT ON COLUMN waste_logs.mix_ratio IS 'Ratio of waste to inert material (e.g., 50:50 for OR/MD)';
COMMENT ON COLUMN waste_logs.metrc_sync_status IS 'Status of Metrc API sync: pending, synced, failed, not_applicable';
COMMENT ON COLUMN waste_logs.metrc_sync_error IS 'Error message if Metrc sync failed';
COMMENT ON COLUMN waste_logs.batch_id IS 'Reference to batch if waste is from cultivation batch';
COMMENT ON COLUMN waste_logs.inventory_item_id IS 'Reference to inventory item if waste is from inventory';
COMMENT ON COLUMN waste_logs.inventory_lot_id IS 'Reference to inventory lot if waste is from specific lot';

COMMENT ON VIEW waste_summary IS 'Analytics view for waste reporting with compliance metrics';

COMMENT ON FUNCTION get_unrendered_waste IS 'Returns cannabis waste that has not been rendered unusable';
COMMENT ON FUNCTION get_unwitnessed_waste IS 'Returns cannabis waste that lacks witness verification';
COMMENT ON FUNCTION get_unsynced_metrc_waste IS 'Returns waste logs pending Metrc sync or failed sync attempts';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Deploy to US region (Supabase)
-- 2. Deploy to Canada region (Supabase)
-- 3. Verify RLS policies with test queries
-- 4. Test triggers with sample data
-- 5. Verify analytics view returns correct data
