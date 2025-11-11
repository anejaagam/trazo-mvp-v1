# Deployment Checklist

**Navigation:** [← Back to Roadmap Index](./index.md)

---

## Overview

This guide walks through the complete deployment process for the TRAZO MVP, including database verification, local testing, security hardening, and production deployment.

**Current Status:**
- ✅ Database Schema Deployed (US & Canada regions)
- ✅ Live Data Present (US: 6 items, 18 lots, 8 movements, 2 alerts)
- ✅ 164/173 Tests Passing (94.8%)
- ⏳ Ready for manual testing and production deployment

---

## Step 1: Verify Database Schema ✅ ALREADY DEPLOYED

**Status:** Schema is already applied to both US and Canada Supabase projects!

### Confirmed via MCP:

**✅ US Project (srrrfkgbcrgtplpekwji):** All tables exist with live data
- `inventory_items`: 6 rows
- `inventory_lots`: 18 rows
- `inventory_movements`: 8 rows
- `inventory_alerts`: 2 rows
- `inventory_categories`: Ready
- `waste_logs`: Ready

**✅ Canada Project (eilgxbhyoufoforxuyek):** All tables exist and ready

### Optional: Verify Schema Yourself

Run this in Supabase SQL Editor to double-check:

```sql
-- Check tables exist
SELECT table_name, 
       (SELECT count(*) FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name LIKE 'inventory%'
ORDER BY table_name;

-- Expected Output:
-- inventory_alerts (7 columns)
-- inventory_categories (8 columns)
-- inventory_items (25 columns)
-- inventory_lots (24 columns)
-- inventory_movements (17 columns)

-- Check for live data (US project should show counts)
SELECT 
  'inventory_items' as table_name, count(*) as row_count 
FROM inventory_items
UNION ALL
SELECT 'inventory_lots', count(*) FROM inventory_lots
UNION ALL
SELECT 'inventory_movements', count(*) FROM inventory_movements
UNION ALL
SELECT 'inventory_alerts', count(*) FROM inventory_alerts;
```

---

## Step 2: Local Environment Testing

```bash
# 1. Ensure you're in project directory
cd d:\TrazoMVP\trazo-mvp-v1

# 2. Verify environment variables
cat .env.local

# Must have (example values):
# NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# NEXT_PUBLIC_SUPABASE_URL_CA=https://[ca-project].supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY_CA=eyJ...
# NEXT_PUBLIC_DEV_MODE=false  # IMPORTANT: Set to false for real testing

# 3. Install dependencies (if needed)
npm install

# 4. Run type checking
npx tsc --noEmit

# Expected: No errors

# 5. Run test suite
npm test

# Expected: 164/173 passing (94.8%)

# 6. Build verification
npm run build

# Expected: Build completes successfully with no errors

# 7. Seed test data
npm run seed:dev

# This will create:
# - 2 organizations (US and Canada)
# - 12 sample users with various roles
# - 2 sites
# - Sample batches (optional for inventory testing)

# 8. Start development server
npm run dev

# Should start at http://localhost:3000
```

---

## Step 3: Manual Integration Testing

**Login as:** agam@trazo.ag (org_admin) - or your seeded user

### Test 1: Create Inventory Item ✅ DONE

1. Navigate to: Dashboard → Inventory → Items
2. Click "Add Item"
3. Fill out form:
   - Name: "CO2 Tank - 50lb"
   - SKU: "CO2-50LB-001"
   - Type: "CO2 Tank"
   - Unit: "tank"
   - Min Quantity: 2
   - Max Quantity: 10
   - Storage Location: "Main Storage"
   - Cost per Unit: 45.00
   - Supplier: "AirGas"
4. Click "Create Item"
5. ✅ Verify: Item appears in catalog
6. ✅ Verify: Current stock shows 0

### Test 2: Receive Shipment (Create Lot) ✅ DONE

1. In item catalog, find "CO2 Tank - 50lb"
2. Click Actions → "Receive"
3. Fill out receive form:
   - Quantity Received: 5
   - Received Date: [today]
   - Enable "Create Lot": ✓
   - Lot Code: "LOT-2025-001"
   - Expiry Date: [1 year from now]
   - Manufacture Date: [1 month ago]
   - Supplier Lot #: "AG-12345"
   - Cost This Shipment: 225.00 (5 x $45)
4. Click "Receive Inventory"
5. ✅ Verify: Stock balance updated to 5
6. ✅ Verify: Lot appears in item details
7. ✅ Verify: Movement log shows "RECEIVE" transaction

### Test 3: Issue Inventory (FIFO) ✅ DONE

1. Click Actions → "Issue"
2. Select item: "CO2 Tank - 50lb"
3. Quantity to Issue: 2
4. Strategy: FIFO
5. Destination Type: "Batch" (select any batch)
6. Notes: "Allocated to Batch XYZ"
7. ✅ Verify: "Planned Consumption" shows LOT-2025-001: 2 tanks
8. Click "Issue Inventory"
9. ✅ Verify: Stock reduced to 3
10. ✅ Verify: Lot quantity_remaining = 3
11. ✅ Verify: Movement log shows "ISSUE" transaction

### Test 4: Adjust Inventory ✅ DONE

1. Click Actions → "Adjust"
2. Select item: "CO2 Tank - 50lb"
3. Current Stock: Should show 3
4. Adjustment Type: Decrease
5. Quantity: 1
6. Reason: "Damaged"
7. Notes: "Tank valve damaged during handling"
8. ✅ Verify: Preview shows 3 → 2
9. Click "Adjust Inventory"
10. ✅ Verify: Stock updated to 2
11. ✅ Verify: Movement log shows "ADJUST" with reason

### Test 5: Low Stock Alert

1. Current stock: 2 (below minimum of 2)
2. Navigate to: Dashboard → Inventory → Alerts
3. ✅ Verify: Alert appears for "CO2 Tank - 50lb"
4. ✅ Verify: Alert type shows "Low Stock"
5. ✅ Verify: Current vs Minimum displayed correctly
6. Click "Acknowledge"
7. ✅ Verify: Alert marked as acknowledged

### Test 6: Movements Log

1. Navigate to: Dashboard → Inventory → Movements
2. ✅ Verify all 3 transactions appear:
   - RECEIVE: +5 tanks
   - ISSUE: -2 tanks
   - ADJUST: -1 tank
3. Test filters:
   - Filter by Type: "RECEIVE" → Shows only receive transaction
   - Filter by Item: "CO2 Tank" → Shows all CO2 tank movements
   - Clear filters → All movements shown
4. Test sorting:
   - Click "Date & Time" header → Sorts by newest/oldest
5. Test export:
   - Click "Export CSV"
   - ✅ Verify: CSV downloads with all movement data

### Test 7: RBAC Permissions

1. Logout
2. Login as: head_grower user (from seed data)
3. ✅ Verify: Can view inventory
4. ✅ Verify: Can create items
5. ✅ Verify: Can receive/issue
6. Logout
7. Login as: operator user
8. ✅ Verify: Can view inventory
9. ✅ Verify: Can issue (consume)
10. ⛔ Verify: Cannot create new items (permission denied)

### Test 8: Multi-Lot FIFO/LIFO

1. Login as org_admin
2. Receive 2nd shipment:
   - Item: "CO2 Tank - 50lb"
   - Quantity: 3
   - Lot Code: "LOT-2025-002"
   - Received Date: [today]
3. Current lots:
   - LOT-2025-001: 2 remaining (older)
   - LOT-2025-002: 3 remaining (newer)
4. Issue with FIFO:
   - Quantity: 4
   - Strategy: FIFO
5. ✅ Verify planned consumption:
   - LOT-2025-001: 2 (depleted)
   - LOT-2025-002: 2 (remaining: 1)
6. Click "Issue Inventory"
7. ✅ Verify: LOT-2025-001 is_active = false
8. ✅ Verify: LOT-2025-002 quantity_remaining = 1
9. ✅ Verify: 2 movement records created

### Test 9: Audit Trail

1. Navigate to: Dashboard → Admin → Audit Log
2. Filter by entity_type: "inventory_items"
3. ✅ Verify: CREATE action shows actual username (not "System")
4. ✅ Verify: All inventory actions logged with correct user
5. ✅ Verify: old_values and new_values populated correctly

### Test 10: Dev Mode Bypass

1. Edit .env.local
2. Set: NEXT_PUBLIC_DEV_MODE=true
3. Restart server: npm run dev
4. Navigate to: Dashboard → Inventory
5. ✅ Verify: Dev mode banner visible
6. ✅ Verify: Empty states shown (no database calls)
7. ✅ Verify: No console errors
8. Set NEXT_PUBLIC_DEV_MODE=false
9. Restart server

---

## Step 4: Security Hardening

### A. Enable Password Protection (Both US & CA)

1. Supabase Dashboard → Authentication → Password
2. Enable: "Compromised password protection"
3. Save changes

### B. Verify Email Templates

1. Authentication → Email Templates
2. Check these routes exist in templates:
   - Signup: /auth/confirm/signup
   - Invite: /auth/confirm/invite
   - Recovery: /auth/confirm/recovery
3. Update if needed

### C. Apply Audit Log Fix (RECOMMENDED)

```sql
-- Run in Supabase SQL Editor (both US & CA):

-- This fixes "System" appearing instead of actual user in audit log
\i lib/supabase/fix-audit-function.sql

-- Or re-run full schema (includes fix):
\i lib/supabase/schema.sql
```

**Verification:**
1. Create new inventory item
2. Go to: Admin → Audit Log
3. Find CREATE action for inventory_items
4. ✅ Verify: "Performed By" shows your username (not "System")

---

## Step 5: Production Deployment

### Option A: Vercel Deployment

```bash
# 1. Commit all changes
git add .
git commit -m "feat: Inventory feature complete - Phase 8"
git push origin cleanup

# 2. Merge to main (if on feature branch)
git checkout main
git merge cleanup
git push origin main

# 3. Vercel auto-deploys from main branch

# 4. Verify environment variables in Vercel Dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEXT_PUBLIC_SUPABASE_URL_CA
# - NEXT_PUBLIC_SUPABASE_ANON_KEY_CA
# - NEXT_PUBLIC_DEV_MODE=false
```

### Option B: Manual Deployment

```bash
# 1. Build for production
npm run build

# 2. Test production build locally
npm run start

# 3. Deploy build/ directory to your hosting
# (depends on your hosting provider)
```

### Post-Deployment Verification

1. Visit production URL
2. Login with real account
3. Repeat Tests 1-6 from manual testing
4. Check production logs for errors
5. Monitor Supabase dashboard for:
   - API request count
   - Error rates
   - RLS policy blocks

---

## Quality Gates

### How to Run

**Typecheck + Unit tests:** Use the VS Code task "Typecheck and run tests"

**Expected baseline:** 164/173 tests passing (94.8%)

Some user query tests are intentionally deferred (MockQueryBuilder error handling).

### Optional Quick Fix

To raise pass rate later: Update `lib/supabase/queries/__tests__/test-helpers.ts` so MockQueryBuilder rejects when `mockError` is set (convert returned error objects to rejected Promises). This is optional and can wait until after deployment.

---

**Navigation:** [← Back to Roadmap Index](./index.md) | [← Integration Checklist](./integration-checklist.md) | [Next: Feature Roadmap →](./feature-roadmap.md)
