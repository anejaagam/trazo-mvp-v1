-- Fix inventory_active_lots view to exclude lots from deleted items
-- When an item is soft-deleted (is_active = FALSE), its lots should not appear in the expiring tab

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
WHERE l.is_active = TRUE AND i.is_active = TRUE AND l.quantity_remaining > 0;
