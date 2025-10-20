# Quick Reference: User Authentication & Management

## Sign-Up a New User

### Via Web UI
1. Navigate to `/auth/sign-up`
2. Fill out form (email, password, name, company, region)
3. User profile is **automatically created** by database trigger
4. User receives email confirmation
5. After confirming email, user can log in

### Via API (for testing)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, anonKey);

const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  options: {
    data: {
      full_name: 'John Doe',
      region: 'US',
      company_name: 'Acme Farms',
    },
  },
});

// Profile is automatically created in public.users by trigger
```

## Invite a User

### Via Admin UI
1. Navigate to `/dashboard/admin/users`
2. Click "Invite User"
3. Fill out form (email, name, role, organization, sites)
4. System sends invitation email
5. User receives email with confirmation link
6. User sets password and completes sign-up

### Via API
```typescript
import { inviteUser } from '@/lib/supabase/queries/users';

const user = await inviteUser({
  email: 'newuser@example.com',
  full_name: 'Jane Smith',
  role: 'head_grower',
  organization_id: 'org-uuid',
  site_ids: ['site-1-uuid', 'site-2-uuid'], // Optional
});

// Returns user profile with status='invited'
```

### Via API Route
```bash
curl -X POST http://localhost:3000/api/admin/users/invite \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "full_name": "Jane Smith",
    "role": "head_grower",
    "organization_id": "org-uuid"
  }'
```

## Login

### Via Web UI
1. Navigate to `/auth/login`
2. Enter email and password
3. System tries stored region first
4. Falls back to other region if login fails
5. Redirects to `/dashboard` on success

### Programmatically
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient('US'); // or 'CA'

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

## Manage Users

### Get All Users
```typescript
import { getUsers } from '@/lib/supabase/queries/users';

const users = await getUsers(
  {
    status: 'active', // Filter by status
    role: 'head_grower', // Filter by role
    organization_id: 'org-uuid', // Filter by org
    search: 'john', // Search by name or email
  },
  {
    page: 1,
    per_page: 20,
  }
);
```

### Get User by ID
```typescript
import { getUserById } from '@/lib/supabase/queries/users';

const user = await getUserById('user-uuid');
```

### Update User Status
```typescript
import { updateUserStatus } from '@/lib/supabase/queries/users';

// Suspend user
await updateUserStatus('user-uuid', 'suspended');

// Reactivate user
await updateUserStatus('user-uuid', 'active');

// Deactivate user (soft delete)
await updateUserStatus('user-uuid', 'deactivated');
```

### Update User Role
```typescript
import { updateUserRole } from '@/lib/supabase/queries/users';

await updateUserRole('user-uuid', 'org_admin');
```

### Update User Details
```typescript
import { updateUser } from '@/lib/supabase/queries/users';

await updateUser('user-uuid', {
  full_name: 'John Updated',
  phone: '+1-555-0123',
  emergency_contact_name: 'Jane Doe',
});
```

## Manage Site Assignments

### Get User's Sites
```typescript
import { getUserSiteAssignments } from '@/lib/supabase/queries/users';

const assignments = await getUserSiteAssignments('user-uuid');
```

### Add Site Assignment
```typescript
import { addUserSiteAssignment } from '@/lib/supabase/queries/users';

await addUserSiteAssignment('user-uuid', 'site-uuid');
```

### Remove Site Assignment
```typescript
import { removeUserSiteAssignment } from '@/lib/supabase/queries/users';

await removeUserSiteAssignment('user-uuid', 'site-uuid');
```

## Resend Invitation

### Via Function
```typescript
import { resendInvitation } from '@/lib/supabase/queries/users';

await resendInvitation('user-uuid'); // Only works for users with status='invited'
```

### Via API Route
```bash
curl -X POST http://localhost:3000/api/admin/users/{user-id}/resend-invitation
```

## Check User Status

```typescript
import { getUserById } from '@/lib/supabase/queries/users';

const user = await getUserById('user-uuid');

switch (user.status) {
  case 'invited':
    console.log('User invited but not yet active');
    break;
  case 'active':
    console.log('User is active and can log in');
    break;
  case 'suspended':
    console.log('User is suspended');
    break;
  case 'deactivated':
    console.log('User is deactivated');
    break;
}
```

## Available User Roles

```typescript
type RoleKey = 
  | 'org_admin'       // Full organization access
  | 'site_manager'    // Manage assigned sites
  | 'head_grower'     // Cultivation management
  | 'operator'        // Day-to-day operations
  | 'compliance_qa'   // Compliance and QA
  | 'executive_viewer' // Read-only executive view
  | 'installer_tech'  // Technical installation
  | 'support';        // Support access
```

## User Statuses

```typescript
type UserStatus = 
  | 'invited'      // Invited but not yet accepted
  | 'active'       // Active and can log in
  | 'suspended'    // Temporarily suspended
  | 'deactivated'; // Soft deleted
```

## Identity Providers

```typescript
type IDP = 
  | 'local'      // Email/password
  | 'google'     // Google OAuth
  | 'microsoft'  // Microsoft OAuth
  | 'okta';      // Okta SSO
```

## Testing

### Run All User Flow Tests
```bash
npm run test:user-flow
```

### Manual Testing Checklist

- [ ] Sign up new user via web form
- [ ] Verify profile auto-created in database
- [ ] Log in with new user
- [ ] Test multi-region login fallback
- [ ] Invite user via admin UI
- [ ] Check invitation email sent
- [ ] Accept invitation and set password
- [ ] Suspend and reactivate user
- [ ] Add and remove site assignments
- [ ] Update user role
- [ ] Deactivate user
- [ ] Resend invitation

## Common Queries

### Get all active users in an organization
```sql
SELECT * FROM public.users 
WHERE organization_id = 'org-uuid' 
  AND status = 'active' 
  AND is_active = true;
```

### Get all invited users
```sql
SELECT * FROM public.users 
WHERE status = 'invited'
ORDER BY created_at DESC;
```

### Get users with specific role
```sql
SELECT * FROM public.users 
WHERE role = 'head_grower' 
  AND status = 'active';
```

### Get user count by status
```sql
SELECT status, COUNT(*) as count 
FROM public.users 
GROUP BY status;
```

## Troubleshooting

### User profile not created after sign-up
1. Check trigger is enabled:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Check auth.users record was created
3. Check for errors in database logs

### Invitation email not sent
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
2. Check Supabase Auth settings in dashboard
3. Verify email templates are configured
4. Check Supabase Auth logs

### Login fails in both regions
1. Verify user exists in auth.users
2. Check password is correct
3. Verify both Supabase URLs are correct
4. Check user status is 'active'

### Permission denied errors
1. Verify user role has required permissions
2. Check RLS policies are applied
3. Verify user is in correct organization
4. Check user is assigned to required site
