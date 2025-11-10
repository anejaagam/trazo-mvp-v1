# User Status Management Fix

## Problem
Users who were invited through the admin panel remained in "invited" status even after accepting their invitation, setting their password, and logging in.

## Root Cause
The user status workflow was incomplete:
1. Admin invites user → status set to 'invited' ✅
2. User accepts invitation and sets password → status remained 'invited' ❌
3. User logs in → status remained 'invited' ❌

## Solution

### 1. Update Password Flow
**File:** `components/auth/update-password-form.tsx`

When an invited user sets their password (during the invitation acceptance flow), their status is now automatically updated from 'invited' to 'active'.

```typescript
// After successful password update
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  await supabase
    .from('users')
    .update({ status: 'active' })
    .eq('id', user.id)
    .eq('status', 'invited'); // Only update if currently invited
}
```

### 2. Login Flow
**File:** `components/auth/login-form.tsx`

When any user logs in, if their status is 'invited', it's automatically changed to 'active'. This catches any edge cases and ensures users are activated on their first login.

```typescript
// During login, check status and activate if needed
const { data: userData } = await supabase
  .from('users')
  .select('status')
  .eq('id', data.user.id)
  .single();

await supabase
  .from('users')
  .update({ 
    last_sign_in: new Date().toISOString(),
    ...(userData?.status === 'invited' ? { status: 'active' } : {})
  })
  .eq('id', data.user.id);
```

### 3. Fix Already Onboarded Users ✅ APPLIED
**File:** `scripts/activate-onboarded-users.sql`

For users who were already onboarded before this fix, this SQL migration has been **APPLIED to both US and CA databases** via Supabase MCP:

```sql
UPDATE public.users
SET 
  status = 'active',
  updated_at = NOW()
WHERE 
  status = 'invited'
  AND last_sign_in IS NOT NULL;
```

**Results:**
- **US Database:** 3 users activated (info@trazo.ag, aman@trazo.ag, timmybungu90@gmail.com)
- **CA Database:** 0 users needed activation (no affected users)
- **Status:** All previously onboarded users are now active ✅

## Testing

1. **New Invitation Flow:**
   - Admin invites user via user management
   - User receives email and clicks link
   - User sets password → Status changes to 'active' ✅
   - User logs in → Status remains 'active' ✅

2. **Self-Signup Flow (unchanged):**
   - User signs up directly → Status is 'active' immediately ✅
   - User confirms email and logs in → Status remains 'active' ✅

3. **Already Onboarded Users:**
   - Run SQL migration script
   - All users with login history are now 'active' ✅

## Files Modified

1. `/components/auth/update-password-form.tsx` - Added status update after password set
2. `/components/auth/login-form.tsx` - Added status check/update on login
3. `/scripts/activate-onboarded-users.sql` - SQL script to fix existing users

## Notes

- The fix is backward compatible and non-breaking
- Users in 'invited' status who haven't logged in yet will remain 'invited' (correct behavior)
- The login flow fix provides redundancy in case the password update flow doesn't trigger
