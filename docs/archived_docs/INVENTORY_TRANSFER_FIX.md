# Inventory Transfer Fix - Location Transfers Now Preserve Stock

## Problem
When issuing inventory to a location (storage transfer), the system was incorrectly:
1. ❌ Reducing stock quantities from lots
2. ❌ Reducing item current_quantity 
3. ❌ Marking lots as inactive when quantity reached 0
4. ❌ Treating location transfers the same as consumption

This meant transferring 2 items from "Storage A" to "Storage B" would remove them from inventory entirely, showing only 2 remaining instead of the correct amount.

## Root Cause
The system was using `movement_type: 'consume'` for ALL issue operations (batch, task, AND location), causing the database trigger `update_inventory_quantity()` to reduce stock for transfers.

## Solution

### 1. API Route Update (`/app/api/inventory/issue/route.ts`)
**Changes:**
- Added logic to detect location transfers: `isLocationTransfer = !!body.to_location && !body.batch_id && !body.task_id`
- Set movement type correctly: `movementType = isLocationTransfer ? 'transfer' : 'consume'`
- For location transfers:
  - ✅ Update lot `storage_location` (not quantity)
  - ✅ Preserve `quantity_remaining` and `is_active` status
  - ✅ Capture `from_location` in movement record
- For consume operations (batch/task):
  - ✅ Reduce lot `quantity_remaining`
  - ✅ Mark lot inactive when quantity reaches 0

### 2. Database Trigger Update (`lib/supabase/schema.sql`)
**Changes in `update_inventory_quantity()` function:**
- Changed transfer quantity delta: `WHEN 'transfer' THEN 0` (was `-NEW.quantity`)
- Removed `'transfer'` from lot quantity reduction: `IN ('consume', 'dispose')` (was `IN ('consume', 'dispose', 'transfer')`)
- Added comment: "Transfers are handled in the API to update storage_location"

### 3. UI Improvements (`components/features/inventory/issue-inventory-dialog.tsx`)
**Changes:**
- Updated dialog description to clarify: "Issue to batch/task (consumes stock), or transfer to location (preserves stock)"
- Added helpful alert when "Location" is selected explaining stock is preserved
- Updated destination type description with clarification

## Migration
Apply the database change:
```sql
-- Run this in Supabase SQL Editor
\i lib/supabase/migrations/fix_transfer_movement_trigger.sql
```

Or copy/paste from: `z:\TrazoMVP\trazo-mvp-v1\lib\supabase\migrations\fix_transfer_movement_trigger.sql`

## Expected Behavior After Fix

### Before (Broken):
1. User has 10 units in "Storage A"
2. User transfers 2 units to "Storage B"
3. ❌ Stock shows 8 units total (2 units lost!)
4. ❌ Lot in "Storage A" shows 8 remaining
5. ❌ No lot in "Storage B"

### After (Fixed):
1. User has 10 units in "Storage A" 
2. User transfers 2 units to "Storage B"
3. ✅ Stock shows 10 units total (preserved!)
4. ✅ Lot shows updated `storage_location: "Storage B"`
5. ✅ Lot shows same `quantity_remaining: 10` (for single-lot transfers)
6. ✅ Movement record shows: `movement_type: 'transfer', from_location: 'Storage A', to_location: 'Storage B'`
7. ✅ Lot remains in "Active Lots" list

## Testing Checklist
- [ ] Apply database migration
- [ ] Test location transfer with single lot
- [ ] Verify stock quantity unchanged in item catalog
- [ ] Verify lot remains in "Active Lots" 
- [ ] Verify lot `storage_location` updated
- [ ] Verify movement log shows `transfer` type with from/to locations
- [ ] Test batch issue (should still reduce quantity)
- [ ] Test task issue (should still reduce quantity)

## Files Modified
1. `app/api/inventory/issue/route.ts` - Movement type logic and lot updates ✅
2. `lib/supabase/schema.sql` - Database trigger function ✅
3. `components/features/inventory/issue-inventory-dialog.tsx` - UI clarity ✅
4. `components/features/inventory/item-detail-sheet.tsx` - Storage locations display ✅ NEW
5. `lib/supabase/migrations/fix_transfer_movement_trigger.sql` - Migration file ✅

## UI Enhancements (Oct 29, 2025)

### Item Detail Sheet - Multi-Location Display
The item detail panel now shows **where** your inventory is stored across multiple locations!

**Item Information Section:**
- When lots exist, displays "Storage Locations" breakdown
- Aggregates quantities by location from all active lots
- Example display:
  ```
  Storage Locations
  ├─ Main Storage: 5 units
  ├─ Secondary Storage: 3 units
  └─ Vault A: 2 units
  ```

**Lots by Location Section:**
- Title changed from "Lots" to "Lots by Location"
- Each lot prominently displays its storage location in a highlighted box
- Shows:
  - Lot code with expiry badge
  - **Storage location** (highlighted with primary color)
  - Received date
  - Large quantity display with "of X received" context

**Why This Matters:**
- You can now see at a glance where all your inventory is stored
- Each lot clearly shows its current location after transfers
- No more confusion about which storage area has which items
- Makes multi-location inventory management much clearer

## Notes
- This fix only affects **location transfers** (destination_type = 'location')
- **Batch and task issues** still correctly consume inventory (reduce quantities)
- Migration is backwards compatible (existing transfer movements are historical)
- **UI now shows multi-location inventory breakdown** for better visibility
- Consider adding a dedicated "Transfer" dialog in the future for better UX separation
