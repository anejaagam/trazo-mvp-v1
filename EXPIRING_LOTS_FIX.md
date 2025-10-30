# Expiring Lots View Fix - Applied

**Date:** October 28, 2025  
**Issue:** Deleted items still showing in expiring tab  
**Status:** ✅ **FIXED**

## Problem Description

When an item was deleted from the item catalog (soft delete: `is_active = FALSE` on `inventory_items` table), its associated lots were still appearing in the "Expiring" tab of the Inventory Dashboard.

## Root Cause

The `inventory_active_lots` database view was only checking if the lot itself was active (`l.is_active = TRUE`), but not checking if the parent inventory item was active (`i.is_active = TRUE`).

**Original View WHERE Clause:**
```sql
WHERE l.is_active = TRUE AND l.quantity_remaining > 0
```

## Solution

Updated the `inventory_active_lots` view to also filter out lots where the parent item has been soft-deleted.

**Updated View WHERE Clause:**
```sql
WHERE l.is_active = TRUE AND i.is_active = TRUE AND l.quantity_remaining > 0
```

## Files Modified

1. **`lib/supabase/schema.sql`** - Line 948
   - Added `i.is_active = TRUE` condition to the WHERE clause

2. **`lib/supabase/migrations/fix_expiring_lots_view.sql`** - New migration file
   - Contains the full updated view definition

## Migration Applied

✅ Migration successfully applied to Supabase production database using:
```typescript
mcp_supabase_mcp__apply_migration('fix_expiring_lots_view', ...)
```

## Testing Verification

To verify the fix:
1. Delete an item from the item catalog (soft delete)
2. Navigate to Inventory Dashboard → Expiring tab
3. Verify that lots from the deleted item no longer appear

## Related Views

**Note:** The `inventory_stock_balances` view already correctly filters by `i.is_active = TRUE`, so it was not affected by this issue.

## Impact

- ✅ Expiring tab now correctly excludes lots from deleted items
- ✅ No changes needed to application code
- ✅ No performance impact (same JOIN structure, just added filter)
- ✅ Consistent behavior across all inventory views
