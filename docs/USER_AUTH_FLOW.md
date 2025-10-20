# User Authentication & Management Flow

## Overview

This document describes the complete user authentication and management system for Trazo MVP, including sign-up, login, invitation, and user management operations.

## Database Changes

### 1. Added User Status & Identity Provider Columns

**Migration:** `add_user_status_and_idp_columns`

Added two new columns to the `public.users` table:

```sql
ALTER TABLE public.users 
ADD COLUMN status TEXT DEFAULT 'active' 
  CHECK (status IN ('invited', 'active', 'suspended', 'deactivated')),
ADD COLUMN idp TEXT DEFAULT 'local' 
  CHECK (idp IN ('local', 'google', 'microsoft', 'okta'));
```

- **status**: Tracks user account state
  - `invited`: User has been invited but hasn't accepted yet
  - `active`: User is active and can log in
  - `suspended`: User is temporarily suspended
  - `deactivated`: User account is deactivated (soft delete)

- **idp** (Identity Provider): Tracks how the user authenticated
  - `local`: Email/password authentication
  - `google`: Google OAuth
  - `microsoft`: Microsoft OAuth
  - `okta`: Okta SSO

### 2. Auto Profile Creation Trigger

**Migration:** `create_handle_new_user_trigger`

Created a database trigger that automatically creates a user profile in `public.users` when a new user signs up via `auth.users`:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get or create a default organization for new signups
  SELECT id INTO default_org_id
  FROM public.organizations
  WHERE name = 'Default Organization'
  LIMIT 1;

  -- If no default org exists, create one
  IF default_org_id IS NULL THEN
    INSERT INTO public.organizations (...)
    RETURNING id INTO default_org_id;
  END IF;

  -- Create user profile in public.users
  INSERT INTO public.users (
    id, email, full_name, organization_id, role, status, idp, last_sign_in
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'organization_id')::UUID, default_org_id),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator'),
    'active',
    CASE 
      WHEN NEW.raw_app_meta_data->>'provider' = 'email' THEN 'local'
      WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN 'google'
      WHEN NEW.raw_app_meta_data->>'provider' = 'microsoft' THEN 'microsoft'
      ELSE 'local'
    END,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**What it does:**
- Automatically runs when a new user signs up
- Extracts user data from `raw_user_meta_data` (full_name, organization_id, role, region)
- Creates a matching profile in `public.users`
- Assigns user to default organization if none specified
- Sets appropriate IDP based on auth provider

## Application Changes

### 1. Sign-Up Flow (`components/auth/sign-up-form.tsx`)

The sign-up form collects:
- Email
- Password
- Full Name
- Company Name
- Region (US/CA)

**Process:**
1. User fills out sign-up form
2. Region is stored in localStorage and cookie
3. Calls `supabase.auth.signUp()` with user metadata:
   ```typescript
   await supabase.auth.signUp({
     email,
     password,
     options: {
       data: {
         region,
         full_name: fullName,
         company_name: companyName,
       },
       emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
     },
   });
   ```
4. Database trigger automatically creates user profile
5. User redirected to email verification page

### 2. Login Flow (`components/auth/login-form.tsx`)

The login form supports multi-region fallback:

**Process:**
1. User enters email and password
2. Attempts login with stored region (or US by default)
3. If login fails and region is CA, tries US
4. If login fails and region is US, tries CA
5. On success:
   - Stores user's region from metadata
   - Sets region cookie
   - Redirects to dashboard

```typescript
let region = getStoredRegion(); // Try stored region first
let supabase = createClient(region);
let { data, error } = await supabase.auth.signInWithPassword({ email, password });

// Fallback logic
if (error && region === 'CA') {
  region = 'US';
  // Retry...
}
```

### 3. User Invitation (`lib/supabase/queries/users.ts`)

**Function:** `inviteUser(invite: UserInvite)`

Updated to use Supabase Auth Admin API:

```typescript
export async function inviteUser(invite: UserInvite): Promise<User> {
  const supabase = await createClient();

  // Check if user already exists
  const existingProfile = await getUserByEmail(invite.email);
  if (existingProfile) {
    throw new Error('A user with this email already exists');
  }

  // Invite user via Supabase Auth - sends email invitation
  const { data: authData, error: inviteError } = 
    await supabase.auth.admin.inviteUserByEmail(
      invite.email,
      {
        data: {
          full_name: invite.full_name,
          role: invite.role,
          organization_id: invite.organization_id,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
      }
    );

  // Update auto-created profile with invited status
  await supabase
    .from('users')
    .update({ status: 'invited', role: invite.role, organization_id: invite.organization_id })
    .eq('id', authData.user.id);

  // Create site assignments if provided
  if (invite.site_ids?.length > 0) {
    // ... assignment logic
  }

  return user;
}
```

**What it does:**
1. Checks if user already exists
2. Calls `supabase.auth.admin.inviteUserByEmail()` which:
   - Creates an auth.users record
   - Sends invitation email
   - Trigger automatically creates user profile
3. Updates profile status to 'invited'
4. Creates site assignments if specified
5. Returns user profile

### 4. Resend Invitation

**Function:** `resendInvitation(userId: string)`

```typescript
export async function resendInvitation(userId: string): Promise<void> {
  const supabase = await createClient();
  const user = await getUserById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  if (user.status !== 'invited') {
    throw new Error('Can only resend invitations to users with invited status');
  }

  // Resend invitation email via Supabase Auth
  const { error } = await supabase.auth.admin.inviteUserByEmail(
    user.email,
    {
      data: {
        full_name: user.full_name,
        role: user.role,
        organization_id: user.organization_id,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
    }
  );

  if (error) {
    throw new Error(`Failed to resend invitation: ${error.message}`);
  }
}
```

### 5. User Management Operations

All user management operations are in `lib/supabase/queries/users.ts`:

#### Get Users (with filtering and pagination)
```typescript
export async function getUsers(
  filters: UserFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResponse<UserWithOrg>>
```

#### Get User by ID
```typescript
export async function getUserById(userId: string): Promise<UserWithOrg | null>
```

#### Update User Status
```typescript
export async function updateUserStatus(
  userId: string,
  status: UserStatus // 'invited' | 'active' | 'suspended' | 'deactivated'
): Promise<User>
```

#### Update User Details
```typescript
export async function updateUser(
  userId: string,
  updates: UserUpdate
): Promise<User>
```

#### Update User Role
```typescript
export async function updateUserRole(
  userId: string,
  role: RoleKey
): Promise<User>
```

#### Site Assignments
```typescript
// Get user's site assignments
export async function getUserSiteAssignments(userId: string): Promise<UserSiteAssignment[]>

// Add site assignment
export async function addUserSiteAssignment(
  userId: string,
  siteId: string
): Promise<UserSiteAssignment>

// Remove site assignment
export async function removeUserSiteAssignment(
  userId: string,
  siteId: string
): Promise<void>
```

#### Delete User (Soft Delete)
```typescript
export async function deleteUser(userId: string): Promise<void> {
  await updateUserStatus(userId, 'deactivated');
}
```

## API Routes

All admin user management is handled through protected API routes in `app/api/admin/users/`:

### POST `/api/admin/users/invite`
Invite a new user to the organization

**Request Body:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "head_grower",
  "organization_id": "uuid",
  "site_ids": ["site-uuid-1", "site-uuid-2"]
}
```

### POST `/api/admin/users/[id]/status`
Update user status (activate, suspend, deactivate)

**Request Body:**
```json
{
  "status": "suspended"
}
```

### POST `/api/admin/users/[id]/resend-invitation`
Resend invitation email to a user with 'invited' status

## Environment Variables

Required environment variables:

```bash
# Supabase Configuration (US Region - Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Canada Region
NEXT_PUBLIC_CAN_SUPABASE_URL=https://your-canada-project.supabase.co
NEXT_PUBLIC_CAN_SUPABASE_ANON_KEY=your-canada-anon-key
CAN_SUPABASE_SERVICE_ROLE_KEY=your-canada-service-role-key

# Application URL (for email redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Testing

### Manual Testing via Supabase Dashboard

1. **Test Sign-Up:**
   ```
   1. Navigate to http://localhost:3000/auth/sign-up
   2. Fill out the form
   3. Submit
   4. Check auth.users and public.users in Supabase dashboard
   5. Verify profile was created automatically
   ```

2. **Test Invitation:**
   ```
   1. Navigate to http://localhost:3000/dashboard/admin/users
   2. Click "Invite User"
   3. Fill out invitation form
   4. Check email (or Supabase Auth logs)
   5. Verify user created with status='invited'
   ```

3. **Test User Management:**
   ```
   1. Go to admin users page
   2. Test suspend/activate user
   3. Test site assignment add/remove
   4. Test resend invitation
   ```

### Automated Testing

Run the comprehensive user flow test:

```bash
npm run test:user-flow
```

This tests:
- Trigger-based profile creation
- User invitation via Auth API
- Status updates (suspend/activate)
- Site assignment add/remove

## Security Considerations

1. **Row Level Security (RLS):** All user operations respect RLS policies
2. **Permission Checks:** API routes verify user has `user:create`, `user:update`, etc. permissions
3. **Organization Isolation:** Users can only invite/manage users within their organization
4. **Secure Triggers:** The `handle_new_user` function uses `SECURITY DEFINER` to bypass RLS for profile creation
5. **Admin API:** User invitations use Supabase Auth Admin API (requires service role key)

## Common Issues

### Issue: User profile not created after sign-up
**Solution:** Check that the trigger `on_auth_user_created` is enabled:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Issue: Schema cache error in tests
**Solution:** This is a Supabase client cache issue. Either:
- Restart your application
- Clear the Supabase connection pool
- Use raw SQL queries for testing

### Issue: Invitation email not sent
**Solution:** 
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase Auth logs for errors
- Ensure email templates are configured in Supabase dashboard

### Issue: Multi-region login not working
**Solution:**
- Verify both region configurations in `.env.local`
- Check that region is properly stored in localStorage
- Ensure region cookie is set on login

## Next Steps

1. ✅ Schema migrations applied (status, idp columns)
2. ✅ Trigger for auto profile creation
3. ✅ User invitation via Auth Admin API
4. ✅ Resend invitation functionality
5. ⏳ Comprehensive E2E testing
6. ⏳ Email template customization
7. ⏳ SSO integration (Google, Microsoft, Okta)

## Files Modified

- `lib/supabase/schema.sql` - Added status and idp columns to users table
- `lib/supabase/queries/users.ts` - Updated inviteUser and resendInvitation functions
- `components/auth/sign-up-form.tsx` - Sign-up form with metadata
- `components/auth/login-form.tsx` - Login with multi-region fallback
- `app/api/admin/users/invite/route.ts` - User invitation API
- `app/api/admin/users/[id]/resend-invitation/route.ts` - Resend invitation API
- `app/api/admin/users/[id]/status/route.ts` - User status update API
- `package.json` - Added test:user-flow script
- `scripts/test-user-flow.ts` - Comprehensive user flow test

## Database Migrations Applied

1. **add_user_status_and_idp_columns** - Added status and idp columns
2. **create_handle_new_user_trigger** - Created auto profile creation trigger
