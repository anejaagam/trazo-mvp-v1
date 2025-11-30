-- =====================================================
-- CRITICAL SECURITY FIX: Inventory Views SECURITY DEFINER
-- Migration: 002-fix-inventory-views-security-definer
-- Date: 2025-11-12
-- Priority: CRITICAL
-- =====================================================
--
-- ISSUE: inventory_active_lots and inventory_stock_balances views
--        use SECURITY DEFINER, completely bypassing RLS policies
--
-- IMPACT: Any authenticated user can access ALL inventory data
--         regardless of organization membership - total RBAC bypass
--
-- VIEWS PURPOSE (from codebase analysis):
--   - inventory_stock_balances: Real-time stock levels per item
--   - inventory_active_lots: Lots with remaining quantity + expiry tracking
--
-- FIX STRATEGY: Remove SECURITY DEFINER and add explicit org_id 
--              filtering in view WHERE clause
-- =====================================================

-- =====================================================
-- 1. INVENTORY_STOCK_BALANCES VIEW FIX
-- =====================================================

-- Drop existing view
DROP VIEW IF EXISTS inventory_stock_balances;

-- Recreate WITHOUT security_definer, add org filtering in WHERE clause
CREATE OR REPLACE VIEW inventory_stock_balances AS
SELECT 
  i.id AS item_id,
  i.organization_id,
  i.site_id,
  i.name AS item_name,
  i.sku,
  i.item_type,
  i.category_id,
  i.unit_of_measure,
  i.current_quantity AS on_hand,
  i.reserved_quantity,
  (i.current_quantity - i.reserved_quantity) AS available,
  i.minimum_quantity AS par_level,
  i.reorder_point,
  CASE 
    WHEN i.current_quantity = 0 THEN 'out_of_stock'
    WHEN i.reorder_point IS NOT NULL AND i.current_quantity <= i.reorder_point THEN 'reorder'
    WHEN i.minimum_quantity IS NOT NULL AND i.current_quantity < i.minimum_quantity THEN 'below_par'
    ELSE 'ok'
  END AS stock_status,
  i.storage_location,
  i.updated_at AS last_updated
FROM inventory_items i
WHERE i.is_active = TRUE
  -- CRITICAL: Org-scoped filtering to enforce RLS at view level
  AND i.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid());

-- Grant SELECT to authenticated users (RLS enforced by view WHERE clause)
GRANT SELECT ON inventory_stock_balances TO authenticated;
GRANT SELECT ON inventory_stock_balances TO anon;
GRANT SELECT ON inventory_stock_balances TO service_role;

-- =====================================================
-- 2. INVENTORY_ACTIVE_LOTS VIEW FIX
-- =====================================================

-- Drop existing view
DROP VIEW IF EXISTS inventory_active_lots;

-- Recreate WITHOUT security_definer, add org filtering
CREATE OR REPLACE VIEW inventory_active_lots AS
SELECT 
  l.id AS lot_id,
  l.item_id,
  i.name AS item_name,
  i.organization_id,
  i.site_id,
  l.lot_code,
  l.quantity_received,
  l.quantity_remaining,
  l.unit_of_measure,
  l.received_date,
  l.expiry_date,
  l.manufacture_date,
  l.supplier_name,
  l.compliance_package_uid,
  l.storage_location,
  CASE 
    WHEN l.expiry_date IS NULL THEN NULL
    WHEN l.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN l.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN l.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring'
    ELSE 'ok'
  END AS expiry_status,
  CASE 
    WHEN l.expiry_date IS NOT NULL THEN (l.expiry_date - CURRENT_DATE)
    ELSE NULL
  END AS days_until_expiry,
  l.created_at,
  l.updated_at
FROM inventory_lots l
JOIN inventory_items i ON l.item_id = i.id
WHERE l.is_active = TRUE 
  AND i.is_active = TRUE 
  AND l.quantity_remaining > 0
  -- CRITICAL: Org-scoped filtering to enforce RLS at view level
  AND i.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid());

-- Grant SELECT to authenticated users
GRANT SELECT ON inventory_active_lots TO authenticated;
GRANT SELECT ON inventory_active_lots TO anon;
GRANT SELECT ON inventory_active_lots TO service_role;

-- =====================================================
-- 3. INVENTORY_MOVEMENT_SUMMARY VIEW (also check this)
-- =====================================================

-- Check if this view also has SECURITY DEFINER (not flagged by advisor but good to verify)
DROP VIEW IF EXISTS inventory_movement_summary;

-- Recreate with org-scoping
CREATE OR REPLACE VIEW inventory_movement_summary AS
SELECT 
  i.id AS item_id,
  i.name AS item_name,
  i.organization_id,
  i.site_id,
  COUNT(m.id) AS total_movements,
  SUM(CASE WHEN m.movement_type = 'receive' THEN m.quantity ELSE 0 END) AS total_received,
  SUM(CASE WHEN m.movement_type = 'consume' THEN m.quantity ELSE 0 END) AS total_consumed,
  SUM(CASE WHEN m.movement_type = 'adjust' THEN m.quantity ELSE 0 END) AS total_adjusted,
  SUM(CASE WHEN m.movement_type = 'dispose' THEN m.quantity ELSE 0 END) AS total_disposed,
  SUM(CASE WHEN m.movement_type = 'transfer' THEN m.quantity ELSE 0 END) AS total_transferred,
  MAX(m.timestamp) AS last_movement_date
FROM inventory_items i
LEFT JOIN inventory_movements m ON i.id = m.item_id
WHERE i.is_active = TRUE
  -- Org-scoped filtering
  AND i.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
GROUP BY i.id, i.name, i.organization_id, i.site_id;

GRANT SELECT ON inventory_movement_summary TO authenticated;
GRANT SELECT ON inventory_movement_summary TO anon;
GRANT SELECT ON inventory_movement_summary TO service_role;

-- =====================================================
-- IMPORTANT NOTE FOR SERVICE_ROLE USAGE
-- =====================================================
--
-- Views now enforce org-scoping via auth.uid() in WHERE clause
-- 
-- If service_role needs to access views across orgs (e.g., admin dashboards):
--   1. Use direct table queries instead of views
--   2. Or create separate admin-only views with SECURITY DEFINER
--      that explicitly check for service_role permission
--
-- Current views will return NULL/empty for service_role since 
-- auth.uid() returns NULL for service_role context
-- =====================================================

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test as authenticated user (should only see own org's data):
-- SELECT * FROM inventory_stock_balances LIMIT 5;
-- SELECT * FROM inventory_active_lots LIMIT 5;

-- Verify view definitions don't have SECURITY DEFINER:
-- SELECT viewname, viewowner, definition 
-- FROM pg_views 
-- WHERE schemaname = 'public' 
-- AND viewname IN ('inventory_stock_balances', 'inventory_active_lots', 'inventory_movement_summary');

-- Check grants:
-- SELECT table_name, grantee, privilege_type 
-- FROM information_schema.table_privileges 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('inventory_stock_balances', 'inventory_active_lots')
-- ORDER BY table_name, grantee;
