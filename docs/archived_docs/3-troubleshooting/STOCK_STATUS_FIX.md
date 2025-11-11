# Stock Status Logic Fix

## Issue
Items with 0 stock were showing as "Below Par" instead of "Out of Stock" on the Low Stock Alerts page.

## Root Cause
In the `inventory_stock_balances` database view, the CASE statement that determines `stock_status` was checking conditions in the wrong order:

**Before (incorrect):**
```sql
CASE 
  WHEN i.minimum_quantity IS NOT NULL AND i.current_quantity < i.minimum_quantity THEN 'below_par'
  WHEN i.reorder_point IS NOT NULL AND i.current_quantity <= i.reorder_point THEN 'reorder'
  WHEN i.current_quantity = 0 THEN 'out_of_stock'  -- This was checked LAST
  ELSE 'ok'
END AS stock_status
```

Problem: If an item had 0 stock AND a `minimum_quantity` set (e.g., par level = 1 case), it would match the first condition (`0 < 1`) and return 'below_par' before ever reaching the 'out_of_stock' check.

## Solution
Reordered the CASE statement to check for out-of-stock condition FIRST:

**After (correct):**
```sql
CASE 
  WHEN i.current_quantity = 0 THEN 'out_of_stock'  -- Now checked FIRST
  WHEN i.reorder_point IS NOT NULL AND i.current_quantity <= i.reorder_point THEN 'reorder'
  WHEN i.minimum_quantity IS NOT NULL AND i.current_quantity < i.minimum_quantity THEN 'below_par'
  ELSE 'ok'
END AS stock_status
```

## Priority Logic (from highest to lowest):
1. **Out of Stock**: `current_quantity = 0` (most critical)
2. **Reorder**: `current_quantity <= reorder_point` (urgent - needs ordering)
3. **Below Par**: `current_quantity < minimum_quantity` (warning - below optimal)
4. **OK**: Everything else

## Files Changed
- `lib/supabase/schema.sql` - Updated view definition (lines 913-920)
- `scripts/fix-stock-status-logic.sql` - Migration script to apply fix

## How to Apply
Run the migration script in your Supabase SQL Editor:
```bash
psql -h <your-supabase-host> -U postgres -d postgres -f scripts/fix-stock-status-logic.sql
```

Or via Supabase dashboard:
1. Go to SQL Editor
2. Paste contents of `scripts/fix-stock-status-logic.sql`
3. Run

## Testing
After applying the fix, items with:
- 0 stock → should show "Out of Stock" badge (red/destructive)
- 1-2 stock (if reorder point = 2) → should show "Reorder" badge (orange)
- 3-4 stock (if par level = 5) → should show "Below Par" badge (gray/secondary)

## Impact
- **Low Stock Alerts page** (`/dashboard/inventory/alerts`): Now correctly categorizes items
- **Item Catalog**: Stock status badges will be more accurate
- **Dashboard**: Summary counts for out-of-stock items will be correct

## Date
October 29, 2025
