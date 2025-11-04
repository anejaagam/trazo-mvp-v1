# Environment Setup for Seeding

## Quick Setup

The seeding script requires environment variables to connect to your Supabase project.

### Step 1: Create `.env.local` file

Create a file named `.env.local` in the root of the project (same directory as `package.json`):

```bash
touch .env.local
```

### Step 2: Add your Supabase credentials

Copy and paste this template into `.env.local`, then replace the placeholder values:

```bash
# ============================================
# US REGION (REQUIRED - trazo-mvp-us)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ============================================
# CANADA REGION (OPTIONAL)
# ============================================
# Only needed if you have a separate Canada Supabase project
# NEXT_PUBLIC_CAN_SUPABASE_URL=https://your-canada-project-id.supabase.co
# NEXT_PUBLIC_CAN_SUPABASE_ANON_KEY=your-canada-anon-key
# CAN_SUPABASE_SERVICE_ROLE_KEY=your-canada-service-role-key
```

### Step 3: Get your Supabase credentials

1. Go to your Supabase project dashboard
2. Navigate to: **Settings > API**
3. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

**Direct link:** `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api`

### Step 4: Run the seeding script

```bash
npm run seed:dev
```

## What the Script Does

The seeding script will:

1. ✅ Create 2 sample organizations (US and Canada)
2. ✅ Create 2 sites (Portland and Vancouver)
3. ✅ Create 12 user profiles across all 8 roles
4. ✅ Create 15 sample audit events
5. ✅ Create user-site assignments

## Important Notes

### Auth Users vs User Profiles

⚠️ **The script only creates user *profiles*, not auth users.**

After seeding, you must create corresponding auth users via:

**Option 1: Signup Flow (Recommended)**
```
1. Run: npm run dev
2. Navigate to: http://localhost:3000/auth/sign-up
3. Sign up with: admin@greenleaf.example
4. Repeat for other users as needed
```

**Option 2: Supabase Dashboard**
```
1. Go to: Authentication > Users
2. Click "Invite user"
3. Use emails from seed data:
   - admin@greenleaf.example
   - manager@greenleaf.example
   - grower@greenleaf.example
   etc.
```

### Sample Users

| Email | Password (you set) | Role | Org |
|-------|-------------------|------|-----|
| admin@greenleaf.example | (set during signup) | org_admin | GreenLeaf |
| manager@greenleaf.example | (set during signup) | site_manager | GreenLeaf |
| grower@greenleaf.example | (set during signup) | head_grower | GreenLeaf |
| operator1@greenleaf.example | (set during signup) | operator | GreenLeaf |
| compliance@greenleaf.example | (set during signup) | compliance_qa | GreenLeaf |

See `/lib/supabase/seed-data.ts` for the complete list of 12 users.

## Verification

After seeding, verify in Supabase dashboard:

1. **Organizations table:** Should have 2 records
2. **Sites table:** Should have 2 records
3. **Users table:** Should have 12 records
4. **Audit_log table:** Should have 15 records
5. **User_site_assignments table:** Should have 5 records

## Troubleshooting

### "Missing required environment variables"

**Problem:** `.env.local` file not found or missing variables

**Solution:**
```bash
# Check if file exists
ls -la .env.local

# If it doesn't exist, create it
touch .env.local

# Edit it and add your Supabase credentials
```

### "Error seeding organizations: relation does not exist"

**Problem:** Database schema not applied

**Solution:**
```sql
-- In Supabase SQL Editor, run:
-- File: lib/supabase/schema.sql
-- This creates all necessary tables
```

### "Error seeding users: violates foreign key constraint"

**Problem:** Organizations not seeded first, or RLS blocking

**Solution:**
```bash
# Clean and reseed
npm run seed:clean
```

### Can't login after seeding

**Problem:** User profiles exist, but auth.users don't

**Solution:**
```bash
# Create auth users via signup flow or Supabase dashboard
# Use the emails from seed data
```

## Clean and Reseed

To start fresh:

```bash
# This will delete seed data and repopulate
npm run seed:clean
```

**Note:** This only cleans the seeded data (specific UUIDs), not all data in your database.

## Security Warning

⚠️ **Never commit `.env.local` to git!**

The `.env.local` file is already in `.gitignore`. It contains sensitive credentials that should never be shared or committed to version control.

## Next Steps

After successful seeding:

1. ✅ Create auth users (via signup or dashboard)
2. ✅ Login with `admin@greenleaf.example`
3. ✅ Navigate to `/dashboard/admin`
4. ✅ Test user management features
5. ✅ View audit log
6. ✅ Test role permissions

## Production Warning

🚨 **Never run seed scripts in production!**

This is for development and testing only. Production data should be created through:
- Real user signups
- Actual organization onboarding
- Genuine system activity
