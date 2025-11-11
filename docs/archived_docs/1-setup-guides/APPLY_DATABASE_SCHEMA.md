# Database Schema Setup - Step by Step Guide

## Overview

This guide will help you set up the complete database schema in your Supabase project so you can use real authentication instead of dev mode.

**Time Required:** ~15 minutes  
**Difficulty:** Easy (copy & paste)

---

## Prerequisites

- [x] Supabase account created
- [x] Supabase US project exists (ID: srrrfkgbcrgtplpekwji)
- [x] `.env.local` file configured with Supabase credentials

---

## Step 1: Access Supabase SQL Editor

### For US Region (Primary)

1. Open this link in your browser:
   **https://supabase.com/dashboard/project/srrrfkgbcrgtplpekwji/sql/new**

2. You should see the SQL Editor with a blank query

---

## Step 2: Apply Core Schema (Creates All Tables)

### What this does:
- Creates 40+ tables including the critical `users` table
- Sets up all relationships and constraints
- Adds indexes for performance
- Creates triggers for automation

### How to apply:

1. **Open the schema file** in VS Code:
   - File: `lib/supabase/schema.sql`

2. **Select ALL content** (Ctrl+A or Cmd+A)

3. **Copy** (Ctrl+C or Cmd+C)

4. **Go to Supabase SQL Editor** (the link from Step 1)

5. **Paste** the entire schema (Ctrl+V or Cmd+V)

6. **Click "Run"** (or press Ctrl+Enter)

7. **Wait for completion** (~30-60 seconds)

### Expected Result:

✅ You should see: "Success. No rows returned"  
✅ In the Table Editor, you should now see 40+ tables

### Verify:

1. Go to **Table Editor** (left sidebar)
2. Look for these key tables:
   - ✅ `organizations`
   - ✅ `sites`
   - ✅ `users` ← **This is the one we need!**
   - ✅ `batches`
   - ✅ `inventory_items`
   - ✅ `compliance_reports`
   - ✅ `audit_log`

---

## Step 3: Apply Row Level Security (RLS) Policies

### What this does:
- Enables security on all tables
- Creates helper functions for permissions
- Applies role-based access policies
- Ensures data isolation by organization

### How to apply:

1. **Open the RLS policies file** in VS Code:
   - File: `lib/supabase/rls-policies.sql`

2. **Select ALL content** (Ctrl+A or Cmd+A)

3. **Copy** (Ctrl+C or Cmd+C)

4. **Go to Supabase SQL Editor** (create a new query if needed)

5. **Paste** the entire RLS policies (Ctrl+V or Cmd+V)

6. **Click "Run"** (or press Ctrl+Enter)

7. **Wait for completion** (~20-30 seconds)

### Expected Result:

✅ You should see: "Success. No rows returned"  
✅ RLS is now enabled on all tables

### Verify:

1. Go to **Table Editor** → select `users` table
2. Look for **shield icon** 🛡️ next to table name (RLS enabled)
3. Click **Policies** tab
4. Should see multiple policies like:
   - ✅ "Users can view their own organization's users"
   - ✅ "Org admins can insert users"
   - etc.

---

## Step 4: Seed Test Data (Optional but Recommended)

### What this does:
- Creates 2 sample organizations (US + Canada)
- Creates 12 user profiles across all 8 roles
- Creates 2 sites (Portland + Vancouver)
- Creates sample audit log entries

### How to apply:

1. **Open terminal** in VS Code (Ctrl+` or Cmd+`)

2. **Run the seed command**:
   ```bash
   npm run seed:dev
   ```

3. **Wait for completion** (~5 seconds)

### Expected Output:

```
🌱 Seeding development database...
✅ Organizations seeded
✅ Sites seeded
✅ Users seeded
✅ Site assignments seeded
✅ Audit log seeded
🎉 Database seeded successfully!
```

### Verify:

1. Go to **Table Editor** → `organizations`
2. Should see 2 rows:
   - GreenLeaf Organics (US)
   - Northern Farms (Canada)

3. Go to **Table Editor** → `users`
4. Should see 12 rows with various roles

---

## Step 5: Create Auth Users

### Important Note:

The seed script creates **user profiles** but NOT **auth users** (the accounts you log in with).

You need to create auth users separately:

### Option A: Via Signup Flow (Recommended)

1. **Keep dev server running** (`npm run dev`)

2. **Navigate to**: http://localhost:3000/auth/sign-up

3. **Sign up** with one of the seeded emails:
   - Email: `admin@greenleaf.example`
   - Password: Create a password (e.g., `Password123!`)
   - Other details: Fill in as needed

4. **Verify email** (check your email inbox)

5. **Repeat** for other users as needed:
   - `manager@greenleaf.example`
   - `grower@greenleaf.example`
   - `operator1@greenleaf.example`
   - etc.

### Option B: Via Supabase Dashboard

1. Go to **Authentication > Users** in Supabase
   https://supabase.com/dashboard/project/srrrfkgbcrgtplpekwji/auth/users

2. Click **"Add user"** → **"Create new user"**

3. Enter:
   - Email: `admin@greenleaf.example`
   - Password: `Password123!`
   - Auto Confirm: ✅ Yes (for testing)

4. Click **"Create user"**

5. **Repeat** for other users

### Important: Match UUIDs

If you create auth users via dashboard, you need to ensure the auth.users.id matches the users.id from seed data. It's **easier to use the signup flow** which handles this automatically.

---

## Step 6: Disable Dev Mode

Now that the database is set up, you can use real authentication:

1. **Open**: `lib/dev-mode.ts`

2. **Change**:
   ```typescript
   // From:
   export const DEV_MODE_ENABLED = true

   // To:
   export const DEV_MODE_ENABLED = false
   ```

3. **Save** the file

4. **Refresh** your browser

---

## Step 7: Test Login Flow

1. **Navigate to**: http://localhost:3000/auth/login

2. **Login** with:
   - Email: `admin@greenleaf.example` (or the email you signed up with)
   - Password: The password you set during signup

3. **Should redirect to**: `/dashboard`

4. **Should see**: Real user data (not mock dev user)

5. **Should NOT see**: Yellow dev mode banner

---

## Verification Checklist

After completing all steps, verify:

- [ ] ✅ Schema applied: `users` table exists in Supabase
- [ ] ✅ RLS enabled: Shield icon on all tables
- [ ] ✅ Policies applied: Policies visible on `users` table
- [ ] ✅ Seed data created: 2 organizations, 12 users
- [ ] ✅ Auth user created: Can see in Authentication > Users
- [ ] ✅ Dev mode disabled: `DEV_MODE_ENABLED = false`
- [ ] ✅ Login works: Successfully redirects to dashboard
- [ ] ✅ No errors: Terminal shows no "users table not found" errors

---

## Troubleshooting

### Issue: "relation 'users' does not exist"
**Solution**: Schema not applied. Go back to Step 2 and apply `schema.sql`

### Issue: "permission denied for table users"
**Solution**: RLS policies not applied. Go back to Step 3 and apply `rls-policies.sql`

### Issue: "Foreign key violation" during seeding
**Solution**: 
```bash
# Clean and reseed
npm run seed:clean
npm run seed:dev
```

### Issue: Can't login - "Invalid email or password"
**Solution**: Auth user not created. Complete Step 5.

### Issue: Login successful but still redirects to login
**Solution**: User profile doesn't exist in `users` table. Check:
```sql
-- In Supabase SQL Editor:
SELECT * FROM users WHERE email = 'admin@greenleaf.example';
```
If empty, the user profile wasn't created. Run seed script or manually insert.

### Issue: "Could not find the table 'public.users' in the schema cache"
**Solution**: 
1. Schema not applied, OR
2. Browser cache issue - hard refresh (Ctrl+Shift+R)

---

## What's Next?

After successful setup:

✅ **Test Features**:
- Navigate to `/dashboard/admin`
- View user management
- Check audit logs
- Test permissions

✅ **Integrate Prototypes**:
- Start with Inventory Tracking
- Follow `AGENT_INSTRUCTIONS.md`

✅ **Add More Users**:
- Use signup flow for team members
- Assign roles appropriately

---

## File Locations

```
📁 Database Files:
├── lib/supabase/schema.sql          ← Step 2
├── lib/supabase/rls-policies.sql    ← Step 3
└── scripts/seed-dev-db.ts           ← Step 4 (npm run seed:dev)

📁 Configuration:
├── .env.local                       ← Supabase credentials
└── lib/dev-mode.ts                  ← Step 6 (disable dev mode)
```

---

## Quick Commands Reference

```bash
# Seed database
npm run seed:dev

# Clean and reseed
npm run seed:clean

# Start dev server
npm run dev

# Run tests
npm test
```

---

## Need Help?

If you encounter issues:

1. Check terminal logs for specific error messages
2. Check Supabase logs: https://supabase.com/dashboard/project/srrrfkgbcrgtplpekwji/logs/explorer
3. Verify `.env.local` has correct credentials
4. Ensure schema was applied successfully
5. Check that RLS policies were applied

---

## Summary

You've completed:

1. ✅ Applied database schema (40+ tables)
2. ✅ Applied RLS security policies
3. ✅ Seeded test data
4. ✅ Created auth users
5. ✅ Disabled dev mode
6. ✅ Tested login flow

**Your TRAZO MVP is now running with real authentication!** 🎉
