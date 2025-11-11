-- Fix stock status logic in inventory_stock_balances view
-- Issue: Items with 0 stock were showing as 'below_par' instead of 'out_of_stock'
-- Root cause: CASE statement checked minimum_quantity before checking for 0 stock

-- Drop and recreate the view with corrected logic
DROP VIEW IF EXISTS inventory_stock_balances;

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
WHERE i.is_active = TRUE;

-- Grant permissions (adjust as needed for your RLS policies)
GRANT SELECT ON inventory_stock_balances TO authenticated;
