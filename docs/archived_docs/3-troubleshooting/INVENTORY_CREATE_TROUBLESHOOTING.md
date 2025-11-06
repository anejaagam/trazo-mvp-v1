# Inventory Item Creation Troubleshooting

## Issue
Users cannot create inventory items in the system.

## Diagnostics Performed

### 1. Permission Check ✅
- Dev Mock User Role: `org_admin`
- Required Permission: `inventory:create`
- **Result**: `org_admin` has `['*']` (all permissions) - PASS

### 2. UI Component Check ✅
- Component: `/components/features/inventory/item-form-dialog.tsx`
- "Add Item" button shows when `can('inventory:create')` is true
- Dialog opens on button click
- **Result**: Implementation is correct - PASS

### 3. Database Schema Check ✅
- Table: `inventory_items`
- Required fields: `organization_id`, `site_id`, `name`, `unit_of_measure`, `item_type`, `created_by`
- **Result**: Schema is correct - PASS

### 4. Client Query Function ✅
- Function: `createInventoryItem` in `/lib/supabase/queries/inventory-client.ts`
- Uses: `supabase.from('inventory_items').insert(item).select().single()`
- **Result**: Implementation is correct - PASS

## Potential Issues

### Issue 1: Dev Mode with Empty Database
**Status**: LIKELY CAUSE

When `NEXT_PUBLIC_DEV_MODE=true`, the system returns empty data:
- Line 112-121 in `inventory-dashboard.tsx`:
```typescript
if (isDevModeActive()) {
  setTotalItems(0)
  setLowStockCount(0)
  // ... returns without database calls
  return
}
```

**Impact**: In dev mode, database isn't seeded and queries might fail silently.

**Solution**: 
1. Ensure database is seeded: `npm run seed:dev`
2. Or disable dev mode and use real auth: Set `NEXT_PUBLIC_DEV_MODE=false`

### Issue 2: Missing Browser Context
**Status**: NEEDS VERIFICATION

Without seeing browser console errors, we can't verify:
- Network errors
- Supabase client initialization
- RLS (Row Level Security) policies blocking inserts

**Solution**: Check browser console for:
```
- Failed to fetch
- RLS policy violation
- Missing required field
- Type conversion errors
```

### Issue 3: RLS Policies
**Status**: NEEDS VERIFICATION

Row Level Security policies might be blocking inserts if:
- User context is not properly passed
- Policies require specific user attributes
- Dev mode user isn't recognized

**Check**: Look in schema.sql for RLS policies on `inventory_items` table

## Recommended Next Steps

1. **Check Browser Console** (PRIORITY 1)
   - Open browser DevTools (F12)
   - Go to Console tab
   - Try to create an inventory item
   - Share any error messages

2. **Verify Database Connection** (PRIORITY 2)
   ```bash
   # Check if Supabase is running
   # Check .env.local for correct Supabase URL and keys
   ```

3. **Seed the Database** (PRIORITY 3)
   ```bash
   npm run seed:dev
   ```

4. **Check RLS Policies** (PRIORITY 4)
   - Look at lines 900+ in schema.sql
   - Verify INSERT policies for `inventory_items`

## Quick Test

Try this in browser console on the inventory page:
```javascript
// Test if Supabase client is working
const supabase = window.__SUPABASE_CLIENT__ // or import from your module

// Try to insert a test item
const testItem = {
  organization_id: 'dev-org-123',
  site_id: 'dev-site-123',
  name: 'Test Item',
  item_type: 'other',
  unit_of_measure: 'each',
  created_by: 'dev-user-123'
}

const { data, error } = await supabase
  .from('inventory_items')
  .insert(testItem)
  .select()

console.log('Result:', { data, error })
```

## Related Files
- `/components/features/inventory/item-form-dialog.tsx` - Form component
- `/components/features/inventory/inventory-dashboard.tsx` - Dashboard with "Add Item" button
- `/lib/supabase/queries/inventory-client.ts` - Database queries
- `/lib/rbac/roles.ts` - Role definitions
- `/lib/supabase/schema.sql` - Database schema
- `/app/dashboard/inventory/page.tsx` - Page component

## Environment
- Dev Mode: `NEXT_PUBLIC_DEV_MODE=true` (from .env.local)
- Mock User: `dev@trazo.ag` (org_admin)
- Database: Supabase (US region)
