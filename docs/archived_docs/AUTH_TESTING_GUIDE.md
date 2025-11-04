# Authentication Testing Guide

## Overview
This guide covers testing the complete authentication system with dev mode OFF and real Supabase database connections.

**Date:** October 22, 2025
**Status:** ✅ Dev Mode Disabled - Ready for Testing

---

## Environment Configuration

### Current Settings (`.env.local`)
```bash
# AUTHENTICATION - LIVE MODE
NEXT_PUBLIC_DEV_MODE=false ✅

# SUPABASE US REGION
NEXT_PUBLIC_SUPABASE_URL=https://srrrfkgbcrgtplpekwji.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[configured]
SUPABASE_SERVICE_ROLE_KEY=[configured]

# SUPABASE CANADA REGION
NEXT_PUBLIC_CAN_SUPABASE_URL=https://eilgxbhyoufoforxuyek.supabase.co
NEXT_PUBLIC_CAN_SUPABASE_ANON_KEY=[configured]
CAN_SUPABASE_SERVICE_ROLE_KEY=[configured]

# APP CONFIGURATION
NEXT_PUBLIC_SITE_URL=http://localhost:3000 ✅
NODE_ENV=development ✅
```

---

## Test Scenarios

### 1. Signup Flow Test

**Objective:** Create a new user account and verify database records

**Steps:**
1. Navigate to http://localhost:3000/auth/sign-up
2. Complete Step 1 - Personal Information:
   - Full Name: `Test User`
   - Email: `testuser+[timestamp]@example.com` (use unique email)
   - Phone: `+1234567890`
   - Password: `TestPassword123!`
   - Role: `org_admin` (automatically set)

3. Complete Step 2 - Company Details:
   - Company Name: `Test Company`
   - Company Website: `https://testcompany.com`
   - Farm Location: `123 Farm Road, Portland, OR`
   - Data Region: Select `US` or `Canada`

4. Complete Step 3 - Emergency Contact:
   - Contact Person: `Emergency Contact`
   - Contact Email: `emergency@example.com`
   - Contact Phone: `+0987654321`

5. Complete Step 4 - Farm Details:
   - Number of Containers: `10`
   - Jurisdiction: Select `Oregon (Metrc)`
   - Plant Type: Select `Cannabis`
   - Growing Environment: Select `Indoor`

6. Click "Complete Signup"

**Expected Results:**
- ✅ Redirected to `/auth/verify-email`
- ✅ Email verification sent to user's email
- ✅ Check Supabase Dashboard:

**Database Verification:**
```sql
-- Check auth.users was created
SELECT id, email, created_at, raw_user_meta_data 
FROM auth.users 
WHERE email = 'testuser@example.com';

-- Check organization was created
SELECT id, name, jurisdiction, plant_type, data_region, contact_email
FROM public.organizations
WHERE contact_email = 'testuser@example.com';

-- Check user profile was created
SELECT u.id, u.full_name, u.email, u.role, 
       u.emergency_contact_name, u.emergency_contact_email,
       o.name as organization_name
FROM public.users u
JOIN public.organizations o ON u.organization_id = o.id
WHERE u.email = 'testuser@example.com';
```

**What to Verify:**
1. `auth.users` record exists with all metadata fields
2. `organizations` record created with company_name, jurisdiction, plant_type
3. `users` record created with emergency contact details
4. `users.organization_id` links to correct organization
5. `users.role` is set to `org_admin`

---

### 2. Login Flow Test

**Objective:** Verify existing users can log in successfully

**Prerequisites:** 
- User must have verified email (check Supabase auth.users → email_confirmed_at)
- Or disable email verification in Supabase project settings temporarily

**Steps:**
1. Navigate to http://localhost:3000/auth/login
2. Enter email and password
3. Click "Login"

**Expected Results:**
- ✅ Redirected to `/dashboard`
- ✅ User session established
- ✅ Cookie `user_region` set correctly (US or CA)
- ✅ Dashboard loads with user's organization data

**Login Component Features:**
- Multi-region auto-detection (tries stored region, then fallback)
- Error messages for invalid credentials
- "Forgot Password" link
- "Sign Up" link for new users

---

### 3. Multi-Region Login Test

**Objective:** Test login with US and Canada regions

**Test Case A - US Region User:**
1. Create user with `dataRegion: 'US'` in signup
2. Login at `/auth/login`
3. Verify connects to US Supabase instance
4. Check cookie: `user_region=US`

**Test Case B - Canada Region User:**
1. Create user with `dataRegion: 'CA'` in signup
2. Login at `/auth/login`
3. Verify connects to Canada Supabase instance
4. Check cookie: `user_region=CA`

**Login Logic:**
```typescript
// Login tries stored region first
let region = getStoredRegion(); // From localStorage
let supabase = createClient(region);

// If fails and region is CA, try US
// If fails and region is US, try CA
// Store successful region in localStorage + cookie
```

---

### 4. Protected Route Test

**Objective:** Verify middleware protects dashboard routes

**Steps:**
1. Clear all cookies and localStorage
2. Navigate directly to http://localhost:3000/dashboard
3. Observe redirect behavior

**Expected Results:**
- ✅ Redirected to `/auth/login`
- ✅ Cannot access dashboard without authentication
- ✅ After login, redirected back to dashboard

**Middleware Logic:**
- Checks for valid session via `supabase.auth.getUser()`
- Redirects unauthenticated users to `/auth/login`
- Allows `/auth/*`, `/landing`, and `/` without auth
- Dev mode bypass when `NEXT_PUBLIC_DEV_MODE=true`

---

### 5. Email Verification Flow Test

**Objective:** Test email confirmation process

**Steps:**
1. Complete signup
2. Check email inbox for verification email
3. Click verification link
4. Verify user can now login

**Expected Results:**
- ✅ Verification email received
- ✅ Link redirects to `/auth/callback?next=/dashboard`
- ✅ User's `email_confirmed_at` timestamp set
- ✅ User can now login successfully

**Supabase Email Settings:**
- Email templates configured in: Supabase Dashboard → Authentication → Email Templates
- SMTP settings in: Supabase Dashboard → Project Settings → Auth → SMTP Settings

---

### 6. Password Reset Test

**Objective:** Test forgot password flow

**Steps:**
1. Navigate to `/auth/login`
2. Click "Forgot Password?"
3. Enter email address
4. Submit form
5. Check email for reset link
6. Click reset link
7. Enter new password
8. Submit form
9. Login with new password

**Expected Results:**
- ✅ Password reset email sent
- ✅ Reset link works
- ✅ New password accepted
- ✅ Can login with new password

---

## Common Issues & Troubleshooting

### Issue: "Invalid email or password"
**Possible Causes:**
- Email not verified (check `auth.users.email_confirmed_at`)
- Wrong region (user in CA database, trying US)
- Incorrect password
- User doesn't exist

**Solutions:**
- Verify email in Supabase dashboard
- Check which region user was created in
- Use "Forgot Password" flow
- Create new account

### Issue: Signup completes but no redirect
**Possible Causes:**
- Missing `NEXT_PUBLIC_SITE_URL` in `.env.local`
- Error in `actions.ts`
- Database trigger failed

**Solutions:**
- Add `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- Check browser console for errors
- Check Supabase logs for trigger errors
- Verify trigger function exists: `handle_new_user()`

### Issue: Organization not created
**Possible Causes:**
- Trigger function failed
- Missing metadata fields
- RLS policy blocking insert

**Solutions:**
```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check trigger function definition
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';

-- Disable RLS temporarily for testing
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

### Issue: Cannot access dashboard after login
**Possible Causes:**
- Session not properly set
- Middleware redirecting incorrectly
- Region mismatch

**Solutions:**
- Clear cookies and localStorage, try again
- Check browser console for auth errors
- Verify `user_region` cookie matches user's actual region
- Check middleware logs (add console.log statements)

---

## Testing Checklist

### Pre-Testing
- [ ] `NEXT_PUBLIC_DEV_MODE=false` in `.env.local`
- [ ] `NEXT_PUBLIC_SITE_URL=http://localhost:3000` set
- [ ] Dev server restarted (`npm run dev`)
- [ ] Supabase dashboard accessible
- [ ] Both US and Canada instances configured

### Signup Testing
- [ ] Step 1: Personal info saves to localStorage
- [ ] Step 2: Company details saves to localStorage
- [ ] Step 3: Emergency contact saves to localStorage
- [ ] Step 4: Farm details saves to localStorage
- [ ] Back button preserves all data
- [ ] Submit creates auth.users record
- [ ] Submit creates organizations record
- [ ] Submit creates users record
- [ ] Email verification sent
- [ ] Redirect to /auth/verify-email works

### Login Testing
- [ ] Valid credentials work
- [ ] Invalid credentials show error
- [ ] US region users can login
- [ ] Canada region users can login
- [ ] Auto-region detection works
- [ ] Redirect to /dashboard works
- [ ] Session persists after refresh
- [ ] Logout works correctly

### Security Testing
- [ ] Cannot access /dashboard without auth
- [ ] Cannot access /dashboard/admin without org_admin role
- [ ] Middleware redirects to /auth/login correctly
- [ ] RLS policies enforce organization isolation
- [ ] Password reset requires email verification

---

## Next Steps After Testing

### Phase 8: Post-Testing Enhancements
1. **Email Template Customization**
   - Branded verification emails
   - Welcome email with setup guide
   - Password reset email styling

2. **Onboarding Flow**
   - First-time login wizard
   - Dashboard tour
   - Feature highlights
   - Help documentation links

3. **Security Enhancements**
   - Rate limiting on auth endpoints
   - CAPTCHA for signup
   - Password strength requirements
   - Session timeout configuration

4. **Error Handling**
   - Better error messages
   - Network failure handling
   - Retry logic for failed requests
   - User-friendly error pages

---

## Related Documentation

- `/docs/SIGNUP_DATABASE_INTEGRATION.md` - Database integration details
- `/docs/USER_AUTH_FLOW.md` - Complete auth flow documentation
- `/docs/USER_AUTH_QUICK_REF.md` - Quick reference guide
- `/lib/supabase/schema.sql` - Database schema
- `/lib/rbac/guards.ts` - Permission checks
- `.env.local` - Environment configuration

---

**Last Updated:** October 22, 2025
**Status:** ✅ Ready for Testing (Dev Mode OFF)
**Test Status:** 164/173 passing (94.8%)
