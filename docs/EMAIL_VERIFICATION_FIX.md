# Email Verification Fix

## Problem
Email verification links were redirecting to an error page with "No token hash or code provided" even when the verification was successful.

## Root Causes
1. Missing `NEXT_PUBLIC_SITE_URL` environment variable
2. Supabase dashboard redirect URL configuration may not match app routes
3. Email confirmation route needed better error handling and logging

## Solutions Applied

### 1. Added NEXT_PUBLIC_SITE_URL Environment Variable
**File**: `.env.local` and `.env.example`

```bash
# Required for email verification links to work correctly
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**For Production**: Update this to your production domain (e.g., `https://app.trazo.ag`)

### 2. Updated Email Confirmation Route
**File**: `app/auth/confirm/route.ts`

Changes made:
- Added comprehensive logging to debug email verification URLs
- Added support for older confirmation token formats
- Improved error messages with more helpful context
- Better handling of edge cases

### 3. Required Supabase Dashboard Configuration

You **MUST** configure these settings in your Supabase dashboard for both US and Canada regions:

#### For US Region (https://supabase.com/dashboard/project/srrrfkgbcrgtplpekwji)

1. **Go to Authentication → URL Configuration**
2. **Site URL**: Set to `http://localhost:3000` (development) or your production URL
3. **Redirect URLs**: Add these allowed URLs:
   ```
   http://localhost:3000/auth/confirm**
   http://localhost:3000/auth/callback**
   http://localhost:3000/dashboard**
   ```

#### For Canada Region (https://supabase.com/dashboard/project/eilgxbhyoufoforxuyek)

Repeat the same configuration as above for the Canada region.

#### Email Templates Configuration

1. **Go to Authentication → Email Templates**
2. **Confirm Signup template**:
   - Verify the redirect URL uses: `{{ .SiteURL }}/auth/confirm`
   - The default template should be:
   ```html
   <h2>Confirm your signup</h2>
   <p>Follow this link to confirm your user:</p>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a></p>
   ```

3. **Important**: The template MUST include `token_hash` and `type` parameters!

### 4. Testing the Fix

#### Method 1: Sign up a new user
```bash
# 1. Start the dev server
npm run dev

# 2. Navigate to http://localhost:3000/auth/sign-up
# 3. Fill in the form and submit
# 4. Check your email
# 5. Click the verification link
# 6. You should be redirected to /dashboard
```

#### Method 2: Check the logs
When you click the email link, check your terminal for:
```
Email confirmation params: { token_hash: '...', type: 'signup', next: '/dashboard' }
Using PKCE flow with token_hash
```

If you see an error, it will log:
```
No valid token found. Full URL: http://localhost:3000/auth/confirm?...
```

This will help debug what parameters Supabase is actually sending.

### 5. Common Issues & Solutions

#### Issue: Still getting "No token hash or code provided"
**Solution**: 
1. Clear your browser cache and cookies
2. Verify `NEXT_PUBLIC_SITE_URL` matches your Supabase Site URL setting
3. Check that the email template includes `token_hash={{ .TokenHash }}&type=signup`
4. Restart your dev server after changing environment variables

#### Issue: Email link goes to error page but verification works
**Solution**: This was the original bug - now fixed with updated `/auth/confirm/route.ts`

#### Issue: "Invalid token" error
**Possible causes**:
1. Email link expired (24 hour limit)
2. Wrong region configuration (US vs Canada mismatch)
3. User clicked link multiple times (tokens are single-use)

**Solution**: Have the user request a new verification email

#### Issue: Region mismatch
**Solution**: Ensure the `user_region` cookie matches the Supabase region where the user signed up:
- Check browser cookies for `user_region` value
- Verify signup form sets the correct region
- Confirm `/auth/confirm` uses the same region config

### 6. Environment Variables Checklist

Ensure these are set in `.env.local`:

- [x] `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- [x] `NEXT_PUBLIC_SUPABASE_URL` (US region)
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (US region)
- [x] `NEXT_PUBLIC_CAN_SUPABASE_URL` (Canada region - if used)
- [x] `NEXT_PUBLIC_CAN_SUPABASE_ANON_KEY` (Canada region - if used)

### 7. Deployment Considerations

When deploying to production:

1. **Update Environment Variables**:
   ```bash
   NEXT_PUBLIC_SITE_URL=https://app.trazo.ag
   ```

2. **Update Supabase Dashboard Settings**:
   - Site URL: `https://app.trazo.ag`
   - Add redirect URLs:
     ```
     https://app.trazo.ag/auth/confirm**
     https://app.trazo.ag/auth/callback**
     https://app.trazo.ag/dashboard**
     ```

3. **Test Email Flow in Production**:
   - Sign up with a test account
   - Verify email links work correctly
   - Check production logs for any errors

## Files Modified

1. `app/auth/confirm/route.ts` - Enhanced error handling and logging
2. `.env.local` - Added `NEXT_PUBLIC_SITE_URL`
3. `.env.example` - Added `NEXT_PUBLIC_SITE_URL` template
4. `docs/EMAIL_VERIFICATION_FIX.md` - This documentation

## Next Steps

1. ✅ Code fixes applied
2. ⚠️ **ACTION REQUIRED**: Configure Supabase dashboard URL settings (see section 3)
3. ⚠️ **ACTION REQUIRED**: Verify email templates include correct parameters
4. ✅ Restart dev server to load new environment variables
5. 🧪 Test signup flow with a new email address

## Verification Checklist

- [ ] Supabase Site URL configured in dashboard
- [ ] Redirect URLs added to allowed list
- [ ] Email template includes `token_hash` parameter
- [ ] `NEXT_PUBLIC_SITE_URL` set in `.env.local`
- [ ] Dev server restarted
- [ ] Test signup completed successfully
- [ ] Email verification link works without errors
- [ ] User redirected to dashboard after confirmation

## Support

If issues persist after following this guide:
1. Check browser console for errors
2. Check terminal logs for confirmation route errors
3. Verify Supabase dashboard settings match exactly
4. Try with a different email address (fresh test)
5. Clear all browser cookies and try again
