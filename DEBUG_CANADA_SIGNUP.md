# Debugging Canada Sign-Up Issue

## Current Status

✅ Environment variables are correctly loaded (verified in server logs)
✅ Canada Supabase URL: `https://eilgxbhyoufoforxuyek.supabase.co`
✅ US Supabase URL: `https://srrrfkgbcrgtplpekwji.supabase.co`

## Test Steps

### 1. Sign Up with Canada Region

1. Open your browser to http://localhost:3000
2. Go to Sign Up page
3. **Select Canada region** from the dropdown
4. Enter test email and password
5. Click Sign Up

### 2. Check Browser Console

Open browser DevTools (F12 or Cmd+Option+I) and look for these logs:

```
🚀 Starting signup for region: CA
📝 Region stored in localStorage and cookie: CA
🔍 Creating Supabase client: { selectedRegion: 'CA', url: 'https://eilgxbhyoufoforxuyek.supabase.co', ... }
🔐 Calling signUp with region metadata: CA
```

### 3. Verify Account Creation Location

After signing up, verify which database the account was created in:

**Check US Database:**
1. Go to https://supabase.com/dashboard
2. Open your US project (srrrfkgbcrgtplpekwji)
3. Go to Authentication → Users
4. Look for your test email

**Check Canada Database:**
1. Open your Canada project (eilgxbhyoufoforxuyek)
2. Go to Authentication → Users
3. Look for your test email

### 4. Try to Log In

1. Go to Login page
2. Enter the email/password you just used
3. Check if login succeeds

## Expected Behavior

- ✅ Browser console shows "Creating Supabase client" with Canada URL
- ✅ Account created in Canada database (eilgxbhyoufoforxuyek)
- ✅ Login succeeds using the same Canada region
- ❌ Account should NOT be in US database (srrrfkgbcrgtplpekwji)

## Potential Issues

### Issue 1: Browser Cache

If you previously signed up with US region, clear:
```javascript
// In browser console:
localStorage.clear();
// Then delete all cookies for localhost:3000
```

### Issue 2: Email Verification Link

The email verification link might be using the wrong Supabase client. Check:
1. Click the verification link in email
2. Check server logs for which database it queries
3. Look for: "🇨🇦 Canada config check" or fallback warning

### Issue 3: Middleware Region Detection

The middleware might not be reading the cookie correctly:
1. Check browser cookies (DevTools → Application → Cookies → localhost)
2. Look for `user_region` cookie
3. Value should be `CA` (not `US`)

## Debug Logs to Watch For

### ✅ Good Signs:
```
🚀 Starting signup for region: CA
🇨🇦 Canada config check: { hasUrl: true, hasAnonKey: true, ... }
✅ Using Canada Supabase configuration
🔍 Creating Supabase client: { selectedRegion: 'CA', url: 'https://eilgxbhyoufoforxuyek...' }
```

### ⚠️ Warning Signs:
```
⚠️ Canada region config not found, falling back to US config
```
(This means env vars aren't being read - but we know they ARE loaded on server)

### ❌ Bad Signs:
```
🔍 Creating Supabase client: { selectedRegion: 'CA', url: 'https://srrrfkgbcrgtplpekwji...' }
```
(This means it's using US URL despite selecting CA)

## Next Steps

Please try the signup flow again and share:
1. Screenshot of browser console logs
2. Which database (US or Canada) the account was created in
3. Any errors you see

This will help us identify exactly where the issue is occurring.
