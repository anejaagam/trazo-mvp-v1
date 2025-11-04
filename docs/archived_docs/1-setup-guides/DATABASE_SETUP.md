# Database Schema Setup Guide

This guide explains how to apply the Trazo MVP database schema to your Supabase instance.

## File Overview

The database schema is split into modular files for better maintainability:

1. **`schema.sql`** - Core database structure
   - All table definitions (40+ tables)
   - Foreign key constraints
   - Indexes for performance
   - Triggers for automation (updated_at, audit logging, batch events)
   - Helper functions
   - Comments and documentation

2. **`rls-policies.sql`** - Row Level Security policies
   - Enables RLS on all tables
   - Helper functions for permission checking
   - Comprehensive policies for all tables
   - Role-based access control
   - Organization-scoped data isolation

3. **`seed-data.ts`** - Test data (optional)
   - Sample organizations
   - Test users with all roles
   - Site assignments
   - Audit log samples

## Application Order

**IMPORTANT**: Files must be applied in this specific order:

### Step 1: Apply Core Schema
```sql
-- In Supabase SQL Editor, run:
-- Copy and paste the entire contents of lib/supabase/schema.sql
```

**What this does:**
- Creates all 40+ tables
- Sets up foreign key relationships
- Creates indexes
- Adds triggers for updated_at timestamps
- Adds audit logging triggers
- Creates helper functions

**Expected result:** All tables visible in Supabase Table Editor

### Step 2: Apply RLS Policies
```sql
-- In Supabase SQL Editor, run:
-- Copy and paste the entire contents of lib/supabase/rls-policies.sql
```

**What this does:**
- Enables Row Level Security on all tables
- Creates helper functions in `public` schema: `public.user_organization_id()`, `public.user_role()`, etc.
- Applies organization-scoped access policies
- Applies role-based permissions (org_admin, site_manager, head_grower, etc.)
- Protects audit trails from modification

**Expected result:** RLS enabled on all tables, policies applied

### Step 3: Seed Test Data (Optional)
```bash
# In your terminal, after configuring .env.local:
npm run seed:dev
```

**What this does:**
- Creates 2 test organizations (US + Canada)
- Creates 2 sites (Portland + Vancouver)
- Creates 12 test users across all 8 roles
- Creates site assignments
- Creates sample audit log entries

**Expected result:** Test data ready for integration testing

## Troubleshooting

### Issue: Foreign Key Constraint Errors
**Problem:** Schema references tables that don't exist yet
**Solution:** Ensure you're applying schema.sql first, before rls-policies.sql

### Issue: RLS Policy Creation Fails
**Problem:** Tables don't exist yet
**Solution:** Apply schema.sql completely before applying rls-policies.sql

### Issue: Permission Denied Errors
**Problem:** RLS is enabled but no policies exist
**Solution:** Make sure rls-policies.sql was applied successfully

### Issue: Seed Script Fails
**Problem:** Schema not applied or .env.local not configured
**Solution:** 
1. Verify schema applied in Supabase Table Editor
2. Check .env.local has correct Supabase credentials
3. Verify you're using service_role key (not anon key)

## Verification Steps

After applying schema.sql:
- [ ] Check Supabase Table Editor shows 40+ tables
- [ ] Check "triggers" section shows update triggers
- [ ] Check "functions" section shows helper functions

After applying rls-policies.sql:
- [ ] Check Table Editor shows RLS enabled (shield icon) on all tables
- [ ] Check "Policies" tab on each table shows policies
- [ ] Check "functions" section shows auth helper functions

After running seed script:
- [ ] Check organizations table has 2 rows
- [ ] Check users table has 12 rows
- [ ] Check audit_log table has entries
- [ ] Try logging in with test user (admin@example.com / Password123!)

## Role-Based Access Summary

The RLS policies implement this permission model:

| Role | Can View | Can Create | Can Update | Can Delete |
|------|----------|------------|------------|------------|
| `org_admin` | All org data | Most entities | Most entities | Most entities |
| `site_manager` | All org data | Sites, rooms, pods | Sites, rooms, pods | Sites, rooms |
| `head_grower` | All org data | Batches, cultivars, recipes | Batches, recipes | Batches, cultivars |
| `operator` | All org data | Batch events, inventory movements | Tasks, batches | None |
| `compliance_qa` | All org data | Compliance reports, waste logs | Compliance data | Waste logs |
| `executive_viewer` | All org data (read-only) | None | None | None |
| `installer_tech` | Pods, telemetry | Pods | Pods | Pods |
| `support` | Read-only access | None | None | None |

All roles are scoped to their organization - users can only access data from their own organization.

## Files Location

```
/lib/supabase/
├── schema.sql           # Apply first
├── rls-policies.sql     # Apply second
├── seed-data.ts         # Optional - run npm run seed:dev
└── region.ts            # Multi-region configuration
```

## Next Steps

After successfully applying the schema and RLS policies:

1. Configure `.env.local` with your Supabase credentials
2. Run seed script to populate test data
3. Start the development server: `npm run dev`
4. Navigate to `/auth/sign-up` to create your first user
5. Test admin features at `/dashboard/admin`

## Multi-Region Setup

If setting up multiple regions (US + Canada):
1. Apply schema.sql to BOTH Supabase projects (US and Canada)
2. Apply rls-policies.sql to BOTH projects
3. Configure .env.local with both sets of credentials
4. See MULTI_REGION_SETUP.md for full details

For MVP, starting with US-only is recommended. Canada can be added later.
