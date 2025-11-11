# Database Seeding Guide

## Overview

The seed data infrastructure provides realistic sample data for development and testing of the admin features. This includes organizations, sites, users across all roles, and audit events showing typical system activity.

## Quick Start

```bash
# Seed the database with sample data
npm run seed:dev

# Clean existing seed data and reseed
npm run seed:clean
```

## Prerequisites

1. **Environment Variables** - Ensure these are set in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Database Schema** - Run the schema migrations first:
   ```sql
   -- Execute lib/supabase/schema.sql in Supabase SQL Editor
   ```

## What Gets Seeded

### Organizations (2)
- **GreenLeaf Cultivation** (US/Oregon)
  - Cannabis cultivation facility
  - METRC compliance jurisdiction
  - 48 pods capacity
  
- **Northern Farms Canada** (Canada/BC)
  - Cannabis cultivation facility
  - Canada CTLS compliance
  - 32 pods capacity

### Sites (2)
- GreenLeaf Main Facility (Portland, OR)
- Northern Farms Cultivation Center (Vancouver, BC)

### Users (12 across all 8 roles)

| Email | Role | Organization | Status |
|-------|------|--------------|--------|
| admin@greenleaf.example | org_admin | GreenLeaf | Active |
| manager@greenleaf.example | site_manager | GreenLeaf | Active |
| grower@greenleaf.example | head_grower | GreenLeaf | Active |
| operator1@greenleaf.example | operator | GreenLeaf | Active |
| operator2@greenleaf.example | operator | GreenLeaf | Active |
| compliance@greenleaf.example | compliance_qa | GreenLeaf | Active |
| executive@greenleaf.example | executive_viewer | GreenLeaf | Active |
| installer@greenleaf.example | installer_tech | GreenLeaf | Active |
| support@trazo.example | support | GreenLeaf | Active |
| suspended@greenleaf.example | operator | GreenLeaf | **Suspended** |
| admin@northernfarms.example | org_admin | Northern Farms | Active |
| grower@northernfarms.example | head_grower | Northern Farms | Active |

### Audit Events (15)
Realistic activity log showing:
- User logins and logouts
- User created/updated/suspended events
- Batch creation and management
- Recipe applications
- Inventory movements
- Waste logging
- Alarm acknowledgments
- Settings updates
- Compliance report generation
- Failed login attempts
- Password changes

## Important Notes

### Auth Users vs User Profiles

⚠️ **The seeding script creates user *profiles* only, not auth users.**

The `users` table profiles are created, but you must create corresponding `auth.users` records separately via:

1. **Manual Signup**: Use the signup flow for each email
2. **Supabase Dashboard**: Create users in Authentication > Users
3. **Auth API**: Use Supabase Auth Admin API (future enhancement)

### User IDs

All seed data uses deterministic UUIDs for consistency:
- Organizations: `11111111-1111-1111-1111-111111111111` pattern
- Users: `user-XXXX-0000-0000-000000000XXX` pattern
- Audit Events: `audit-XXXX-0000-0000-000000000XXX` pattern

This makes it easy to reference specific records in tests.

## Development Workflow

### Initial Setup
```bash
# 1. Apply schema
# Execute lib/supabase/schema.sql in Supabase

# 2. Seed sample data
npm run seed:dev

# 3. Create auth users (manual or via dashboard)
# Use emails from SEED_USERS

# 4. Start development
npm run dev
```

### Testing Workflow
```bash
# Clean and reseed for fresh state
npm run seed:clean

# Run tests
npm run test

# View seeded data in admin UI
# Navigate to http://localhost:3000/dashboard/admin
```

### Resetting Data
```bash
# Full reset (cleans then reseeds)
npm run seed:clean

# Manual cleanup via Supabase SQL Editor:
DELETE FROM user_site_assignments WHERE user_id LIKE 'user-%';
DELETE FROM audit_log WHERE id LIKE 'audit-%';
DELETE FROM users WHERE id LIKE 'user-%';
DELETE FROM sites WHERE id LIKE 'aaaaaaaa%' OR id LIKE 'bbbbbbbb%';
DELETE FROM organizations WHERE id LIKE '11111111%' OR id LIKE '22222222%';
```

## Testing Scenarios

### Admin User Management
- Login as `admin@greenleaf.example` (org_admin)
- View all 10 users in GreenLeaf organization
- Test search/filter functionality
- Invite a new user
- Suspend/reactivate `operator2@greenleaf.example`
- View audit trail of actions

### Role-Based Access Control
- Login as different roles
- Verify permission restrictions
- Test `suspended@greenleaf.example` cannot login

### Audit Log Viewing
- View 15 sample audit events
- Filter by action type (login, created, updated, suspended)
- Search by entity name
- Export to CSV

### Multi-Organization
- Compare GreenLeaf (US) vs Northern Farms (Canada)
- Verify data isolation between organizations
- Test jurisdiction-specific features

## Customizing Seed Data

Edit `lib/supabase/seed-data.ts` to:
- Add more users/roles
- Create additional organizations
- Add custom audit events
- Modify user attributes

Then run:
```bash
npm run seed:clean
```

## Troubleshooting

### "Missing environment variables" error
```bash
# Check your .env.local file has:
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### "Error seeding organizations" 
- Ensure schema is applied first
- Check RLS policies allow service role access

### "Users table seeded but can't login"
- Auth users must be created separately
- Use signup flow or Supabase dashboard

### "Audit events not showing"
- Verify `audit_log` table exists
- Check organization_id matches seeded orgs

## Production Considerations

⚠️ **Never run seed scripts in production!**

These scripts are for **development and testing only**. They use:
- Deterministic IDs
- Service role key (bypasses RLS)
- Fake email addresses
- Sample data only

For production:
- Users created via real signup flow
- Organizations created via onboarding
- Audit events generated by actual activity
- Real email verification required

## Next Steps

After seeding:
1. Navigate to `/dashboard/admin` to view admin UI
2. Test user management features
3. Verify role-based permissions
4. Review audit log functionality
5. Run test suite: `npm run test`

## Files

- `lib/supabase/seed-data.ts` - Sample data definitions
- `scripts/seed-dev-db.ts` - Seeding script
- `scripts/SEED_DATA.md` - This guide
