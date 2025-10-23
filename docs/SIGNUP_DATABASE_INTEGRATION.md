# Signup Database Integration - Complete

## Overview
Successfully connected the 4-step signup form to Supabase database with automatic organization and user profile creation.

## Changes Made

### 1. Fixed `actions.ts` Field References
**File:** `/app/auth/sign-up/actions.ts`

**Changes:**
- ✅ Moved `jurisdiction` from `step2Data` → `step4Data`
- ✅ Moved `plant_type` from `step2Data` → `step4Data`
- ✅ Removed `crop_type` field (was duplicate of plant_type)

**Metadata Structure:**
```typescript
data: {
  // Personal info (Step 1)
  full_name: step1Data.name,
  phone: step1Data.phoneNumber,
  role: step1Data.role, // 'org_admin' for first user
  
  // Company info (Step 2)
  company_name: step2Data.companyName,
  company_website: step2Data.companyWebsite,
  farm_location: step2Data.farmLocation,
  data_region: step2Data.dataRegion,
  
  // Emergency contact (Step 3)
  emergency_contact_name: step3Data.emergencyContactPerson,
  emergency_contact_email: step3Data.emergencyContactEmail,
  emergency_contact_phone: step3Data.emergencyContactNumber,
  
  // Farm details (Step 4)
  number_of_containers: step4Data.numberOfContainers,
  jurisdiction: step4Data.jurisdiction, // FIXED
  plant_type: step4Data.plantType, // FIXED
  growing_environment: step4Data.growingEnvironment,
}
```

### 2. Enhanced Database Trigger
**Function:** `handle_new_user()`

**What it does:**
1. **Creates Organization** from signup metadata:
   - name → company_name
   - data_region → US/Canada selection
   - jurisdiction → Oregon/Maryland/Canada/PrimusGFS
   - plant_type → Cannabis/Hemp/Food Crops/etc.
   - contact_email → user's email
   - contact_phone → user's phone
   - address → farm_location

2. **Creates User Profile** with:
   - Personal info (full_name, email, phone)
   - Organization link (organization_id)
   - Role (org_admin for first user)
   - Emergency contacts
   - Status (active)
   - Identity provider (local/oauth)

**Trigger:** `on_auth_user_created`
- **Event:** AFTER INSERT on auth.users
- **Action:** Executes handle_new_user()
- **Security:** SECURITY DEFINER (runs with elevated privileges)

## Data Flow

```
User completes signup form
    ↓
Step 1: Personal Info (name, email, password, phone, role)
    ↓
Step 2: Company Info (company name, website, location, region)
    ↓
Step 3: Emergency Contacts (name, email, phone)
    ↓
Step 4: Farm Details (containers, jurisdiction, plant type, environment)
    ↓
actions.ts: completeSignup()
    ↓
supabase.auth.signUp() with metadata
    ↓
auth.users table (INSERT)
    ↓
TRIGGER: on_auth_user_created fires
    ↓
handle_new_user() function executes
    ↓
1. INSERT into organizations table
    ↓
2. INSERT into users table (with org_id)
    ↓
Email verification sent
    ↓
Redirect to /auth/verify-email
```

## Database Schema

### organizations Table
```sql
- id (uuid, PK)
- name (text) ← company_name
- data_region (text) ← US/Canada
- jurisdiction (text) ← Oregon/Maryland/Canada/PrimusGFS
- plant_type (text) ← Cannabis/Hemp/Food/etc.
- contact_email (text) ← user email
- contact_phone (text) ← user phone
- address (text) ← farm_location
- license_number (text, optional)
- timezone (text, default: America/Los_Angeles)
- is_active (boolean, default: true)
- created_at, updated_at (timestamps)
```

### users Table
```sql
- id (uuid, PK, FK to auth.users)
- email (text)
- full_name (text)
- phone (text)
- organization_id (uuid, FK to organizations)
- role (text, default: 'operator')
- emergency_contact_name (text)
- emergency_contact_email (text)
- emergency_contact_phone (text)
- additional_permissions (text[])
- hire_date (date)
- is_active (boolean, default: true)
- last_sign_in (timestamp)
- status (text, default: 'active')
- idp (text, default: 'local')
- created_at, updated_at (timestamps)
- role_assigned_at, role_assigned_by (audit fields)
```

## Testing

### Manual Test Steps
1. Set `NEXT_PUBLIC_DEV_MODE=true` in `.env.local`
2. Run `npm run dev`
3. Navigate to `/auth/sign-up`
4. Complete all 4 steps:
   - Step 1: Enter name, email, password, phone
   - Step 2: Enter company name, website, location, select region
   - Step 3: Enter emergency contact details
   - Step 4: Enter farm details (containers, jurisdiction, plant type, environment)
5. Submit form
6. Check Supabase dashboard:
   - auth.users → verify user created with metadata
   - public.organizations → verify organization created
   - public.users → verify user profile created with emergency contacts

### Verification Queries
```sql
-- Check user was created
SELECT * FROM auth.users WHERE email = 'test@example.com';

-- Check organization was created
SELECT * FROM public.organizations WHERE contact_email = 'test@example.com';

-- Check user profile was created
SELECT u.*, o.name as org_name 
FROM public.users u
JOIN public.organizations o ON u.organization_id = o.id
WHERE u.email = 'test@example.com';
```

## Multi-Region Support

### Environment Variables Required
```bash
# US Region (Primary)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Canada Region
CAN_SUPABASE_URL=https://your-canada-project.supabase.co
CAN_SUPABASE_ANON_KEY=your-canada-anon-key
CAN_SUPABASE_SERVICE_ROLE_KEY=your-canada-service-role-key
```

### Region Selection Logic
- User selects data_region in Step 2 (US or Canada)
- Stored in organization.data_region field
- Used to determine which Supabase instance to use
- Future: Route API calls to correct region based on user's organization

## Next Steps

### Phase 8: Post-Signup Flow
- [ ] Email verification page improvements
- [ ] Welcome email with setup instructions
- [ ] First-time login onboarding flow
- [ ] Dashboard customization based on jurisdiction
- [ ] Site creation wizard for new organizations

### Phase 9: Testing & Validation
- [ ] Unit tests for actions.ts
- [ ] Integration tests for signup flow
- [ ] E2E tests with Playwright
- [ ] Test multi-region signup
- [ ] Test error handling (duplicate email, invalid data, etc.)

### Phase 10: Security Enhancements
- [ ] Rate limiting on signup endpoint
- [ ] Email verification enforcement
- [ ] Password strength requirements
- [ ] CAPTCHA integration
- [ ] Suspicious activity monitoring

## Files Modified

1. `/app/auth/sign-up/actions.ts` - Fixed field references
2. Database trigger: `handle_new_user()` - Enhanced to store all signup data
3. `/docs/SIGNUP_DATABASE_INTEGRATION.md` - This documentation

## Related Documentation

- `/docs/USER_AUTH_FLOW.md` - Complete auth flow documentation
- `/docs/USER_AUTH_QUICK_REF.md` - Quick reference guide
- `/.env.local` - Environment configuration
- `/lib/supabase/schema.sql` - Database schema
- `/lib/rbac/guards.ts` - Permission system
- `/lib/jurisdiction/types.ts` - Jurisdiction definitions

---

**Status:** ✅ COMPLETE
**Date:** 2024
**Phase:** Phase 7 - Database Integration
**Pass Rate:** Maintain 94.8%+ test coverage
