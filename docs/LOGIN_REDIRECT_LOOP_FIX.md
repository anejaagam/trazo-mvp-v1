# Login Redirect Loop Fix

## Problem
After logging in successfully, the dashboard kept redirecting back to the login page in an infinite loop.

## Root Cause
The `users` table doesn't exist in the Supabase database. When the dashboard layout tries to fetch user details:

```typescript
// app/dashboard/layout.tsx
const { data: userDetails, error } = await supabase
  .from('users')  // ❌ Table doesn't exist!
  .select('*')
  .eq('id', user.id)
  .single()

if (error || !userDetails) {
  redirect('/auth/login')  // ← Redirects back to login
}
```

Error in terminal:
```
Error fetching user details: {
  code: 'PGRST205',
  message: "Could not find the table 'public.users' in the schema cache"
}
```

## Solutions

### Solution 1: Enable Dev Mode (Quick Fix) ✅ APPLIED

**Best for**: UI development and testing without database setup

**File**: `lib/dev-mode.ts`

Changed `DEV_MODE_ENABLED` from `false` to `true`:

```typescript
export const DEV_MODE_ENABLED = true
```

**What this does**:
- Bypasses all authentication checks
- Uses mock user data (`dev@trazo.ag` as org_admin)
- Shows yellow banner: "🚧 DEV MODE ACTIVE - Authentication Bypassed"
- Only works in development (NODE_ENV === 'development')
- **Automatically disabled in production builds**

**How to use**:
1. ✅ Dev mode already enabled
2. Restart dev server (already running)
3. Navigate to http://localhost:3000/dashboard
4. You'll see the dashboard with mock user data
5. No login required!

**To disable dev mode later**:
Set `DEV_MODE_ENABLED = false` in `lib/dev-mode.ts`

---

### Solution 2: Set Up Database Schema (Proper Fix)

**Best for**: Production-ready development with real authentication

**Steps**:

#### 1. Access Supabase SQL Editor

**US Region**: https://supabase.com/dashboard/project/srrrfkgbcrgtplpekwji/sql/new

**Canada Region** (optional): https://supabase.com/dashboard/project/eilgxbhyoufoforxuyek/sql/new

#### 2. Apply Database Schema

Copy and paste the **entire contents** of these files in order:

**Step 1**: Apply `lib/supabase/schema.sql`
```sql
-- Creates all 40+ tables including:
-- - organizations, sites, rooms, pods
-- - users (THIS IS THE MISSING TABLE!)
-- - batches, cultivars, recipes
-- - inventory, compliance, tasks
-- - environmental data, telemetry
-- - audit logs
```

**Step 2**: Apply `lib/supabase/rls-policies.sql`
```sql
-- Enables Row Level Security
-- Creates permission helper functions
-- Applies role-based access policies
```

#### 3. Seed Test Data (Optional)

```bash
# In your terminal:
npm run seed:dev
```

This creates:
- 2 test organizations (US + Canada)
- 12 test users across all 8 roles
- 2 sites (Portland + Vancouver)
- Sample data for testing

#### 4. Test Login

**Test Users** (after seeding):
- **Email**: `admin@example.com`
- **Password**: `Password123!`
- **Role**: org_admin

Or create your own user via signup flow.

#### 5. Disable Dev Mode

Once database is set up:

```typescript
// lib/dev-mode.ts
export const DEV_MODE_ENABLED = false
```

---

## Current Status

✅ **Dev Mode Enabled** - You can now access the dashboard without database setup

- Navigate to: http://localhost:3000/dashboard
- No login required
- Yellow dev mode banner will appear
- Mock user: `dev@trazo.ag` (org_admin role)

## Next Steps

### For Immediate UI Development
1. ✅ Dev mode enabled - ready to go!
2. Navigate to `/dashboard`
3. Start building features

### For Production-Ready Development
1. [ ] Apply database schema to Supabase (see Solution 2)
2. [ ] Run seed script to create test data
3. [ ] Test login flow with real authentication
4. [ ] Disable dev mode

## Verification

**Dev Mode Active**:
```bash
# Visit http://localhost:3000/dashboard
# Should see:
# - Yellow banner at top
# - Dashboard loads without login
# - Console shows: "🚧 DEV MODE: Dashboard Layout - Authentication bypassed"
```

**Database Schema Applied**:
```bash
# In Supabase Table Editor:
# - Should see 40+ tables
# - "users" table should exist
# - RLS enabled (shield icon) on all tables
```

**Login Flow Working**:
```bash
# Visit http://localhost:3000/auth/login
# - Login with test credentials
# - Should redirect to /dashboard
# - Should see real user data (not mock)
```

## Troubleshooting

### Issue: Dev mode enabled but still redirects to login
**Solution**: 
- Clear browser cookies/cache
- Restart dev server
- Verify `DEV_MODE_ENABLED = true` in `lib/dev-mode.ts`

### Issue: Want to test login flow with dev mode enabled
**Solution**: 
- Dev mode bypasses login completely
- Temporarily set `DEV_MODE_ENABLED = false`
- Or set up database schema (Solution 2)

### Issue: Database setup but login still loops
**Solution**:
- Verify `users` table exists in Supabase
- Check user was created in `users` table (not just `auth.users`)
- Check RLS policies were applied
- Check terminal for specific error messages

## Files Modified

1. ✅ `lib/dev-mode.ts` - Enabled dev mode
2. ℹ️ `docs/LOGIN_REDIRECT_LOOP_FIX.md` - This documentation

## References

- Full database setup: `DATABASE_SETUP.md`
- Dev mode documentation: `DEV_MODE.md`
- Seed data script: `scripts/seed-dev-db.ts`
