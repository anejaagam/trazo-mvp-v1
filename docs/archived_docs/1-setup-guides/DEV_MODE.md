# Development Mode Guide

## 🚧 Global Development Bypass

For rapid UI development and testing, you can bypass authentication **globally** across all protected routes without going through the signup/login flow.

## Quick Start

### Enable Dev Mode (One Line Change)

In `lib/dev-mode.ts`, set the master switch to `true`:

```typescript
// 🚨 MASTER DEV MODE SWITCH - Set to true to bypass authentication globally
export const DEV_MODE_ENABLED = true
```

That's it! All protected routes (`/dashboard/*`, `/protected/*`, etc.) will now bypass authentication.

## Features

### ✅ Centralized Configuration
- **Single source of truth**: One file controls dev mode for entire app
- **Automatic safety**: Only works in `NODE_ENV === 'development'`
- **Global bypass**: Affects all protected routes by default
- **Selective bypass**: Optional route-specific configuration

### 🧑‍💻 Mock User Data
When dev mode is active, you get a fully-featured mock user:

```typescript
{
  id: 'dev-user-123',
  email: 'dev@trazo.ag',
  full_name: 'Dev User',
  role: 'org_admin',           // Highest privileges
  organization: {
    name: 'Development Farm',
    jurisdiction: 'maryland_cannabis',
    plant_type: 'cannabis',
    data_region: 'us'
  }
}
```

### 🎨 Visual Indicators
- **Yellow banner** at top of dashboard: "🚧 DEV MODE ACTIVE - Authentication Bypassed"
- **DEV MODE badge** in protected routes
- **Console logs** showing which routes bypass auth

## Usage

### 1. Start Your Dev Server
```bash
npm run dev
```

### 2. Access Any Protected Route
Navigate directly to any protected route without logging in:

```
http://localhost:3000/dashboard
http://localhost:3000/dashboard/batches
http://localhost:3000/dashboard/inventory
http://localhost:3000/dashboard/compliance
http://localhost:3000/protected
```

### 3. Customize Mock User (Optional)
To test different roles or jurisdictions, edit `lib/dev-mode.ts`:

```typescript
export const DEV_MOCK_USER = {
  // Change role to test different permissions
  role: 'site_manager',  // Try: org_admin, site_manager, compliance_qa, etc.
  
  organization: {
    // Change jurisdiction to test different compliance rules
    jurisdiction: 'oregon_cannabis',  // Try: maryland_cannabis, canada_cannabis, primus_gfs
    plant_type: 'cannabis',           // Try: cannabis, produce
    data_region: 'us'                 // Try: us, ca
  }
}
```

## Production Safety

### ✅ Multiple Safety Layers
1. **Environment check**: Only works when `NODE_ENV === 'development'`
2. **Build-time exclusion**: Production builds automatically disable dev mode
3. **Explicit flag**: Must be manually enabled via `DEV_MODE_ENABLED = true`
4. **No environment variables**: No .env config needed (prevents accidental production leaks)

### 🔒 What Happens in Production
```typescript
isDevModeActive() // Always returns false in production
// Result: All authentication checks run normally
```

## Use Cases

### ✅ Perfect For
- **UI Development**: Build components without auth friction
- **Layout Testing**: Test responsive designs across routes
- **Rapid Prototyping**: Quickly iterate on features
- **Visual Testing**: Screenshot testing without auth setup
- **Component Development**: Focus on UI, not auth state

### ⚠️ Not Recommended For
- **Auth Flow Testing**: Use real signup/login for testing auth
- **Permission Testing**: Test real RBAC with actual users
- **E2E Testing**: Use real authentication in E2E suites
- **Database Testing**: Dev mode doesn't affect database operations

## Technical Details

### Files Modified
- ✅ `lib/dev-mode.ts` - Centralized configuration
- ✅ `lib/supabase/middleware.ts` - Bypass middleware auth checks
- ✅ `app/dashboard/layout.tsx` - Dashboard dev mode integration
- ✅ `app/protected/layout.tsx` - Protected routes dev mode integration
- ✅ `components/dev-mode-banner.tsx` - Reusable banner component

### How It Works
1. **Middleware**: Checks `isDevModeActive()` and bypasses auth if true
2. **Layouts**: Use `DEV_MOCK_USER` instead of fetching real user
3. **Guards**: Permission checks use mock user role
4. **Banner**: Visual indicator shown when active

### Console Output
When dev mode is active, you'll see logs like:
```
🚧 DEV MODE: Middleware - /dashboard - Authentication bypassed
🚧 DEV MODE: Dashboard Layout - Authentication bypassed
```

## Disabling Dev Mode

Set the flag to `false` in `lib/dev-mode.ts`:

```typescript
export const DEV_MODE_ENABLED = false  // ⬅️ Disable dev mode
```

All routes will now require proper authentication.

## FAQ

**Q: Do I need to restart the dev server after changing DEV_MODE_ENABLED?**  
A: Yes, changes to `lib/dev-mode.ts` require a server restart.

**Q: Can I use dev mode with a real database?**  
A: Yes! Dev mode only bypasses authentication. Database operations work normally with the mock user's ID.

**Q: Will dev mode work in production?**  
A: No, it's impossible. Multiple safety checks prevent it from working outside development.

**Q: Can I test different user roles?**  
A: Yes! Edit `DEV_MOCK_USER` in `lib/dev-mode.ts` to change roles, jurisdictions, etc.

**Q: Does this affect tests?**  
A: No, test environments use their own mocking strategies. This only affects the dev server.

---

**Last Updated**: October 20, 2025  
**Version**: 2.0 (Centralized Configuration)
```

### Disabling Dev Mode

Before committing production-ready code or testing real authentication:

```typescript
const DEV_MODE_BYPASS_AUTH = false  // ⬅️ Set to false
```

Then test the full authentication flow:
1. Visit `http://localhost:3000`
2. Click "Get Started" or "Sign In"
3. Complete signup or login
4. Verify redirect to dashboard works

---

**Last Updated:** Phase 2 - Component Consolidation Complete
**Next Steps:** Phase 3 - Feature Integration
