# Authentication Flow: Region Selection & Service Selection

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER INTERACTION - Sign-Up Form                                  │
│    File: components/auth/sign-up-form.tsx                           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        User selects region from dropdown: 'US' or 'CA'
        State: const [region, setRegion] = useState<Region>('US')
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. FORM SUBMISSION - handleSignUp()                                 │
│    Line 21-65 in sign-up-form.tsx                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        Step 2a: Store region in localStorage
        → setStoredRegion(region)
        
        Step 2b: Store region in cookie
        → document.cookie = `user_region=${region}; ...`
        
        Step 2c: Create Supabase client for selected region
        → const supabase = createClient(region)
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. CLIENT CREATION - lib/supabase/client.ts                         │
│    createClient(region?: Region)                                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        Input: region = 'US' or 'CA' (from form)
        
        const selectedRegion = region || getStoredRegion()
        ↓ Calls getRegionConfig(selectedRegion)
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. REGION CONFIG - lib/supabase/region.ts                           │
│    getRegionConfig(region: Region)                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────────────┐
        │ IF region === 'US':                             │
        │   ✅ Return US config:                          │
        │      url: NEXT_PUBLIC_SUPABASE_URL              │
        │      anonKey: NEXT_PUBLIC_SUPABASE_ANON_KEY     │
        └─────────────────────────────────────────────────┘
                              OR
        ┌─────────────────────────────────────────────────┐
        │ IF region === 'CA':                             │
        │   Check for Canada env vars:                    │
        │   1. NEXT_PUBLIC_CAN_SUPABASE_URL (browser)     │
        │   2. CAN_NEXT_PUBLIC_CASUPABASE_URL (server)    │
        │                                                 │
        │   ✅ If found: Return Canada config             │
        │   ❌ If NOT found: FALLBACK to US config        │
        └─────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. SUPABASE CLIENT CREATED                                          │
│    createBrowserClient(config.url, config.anonKey)                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        Returns Supabase client connected to:
        - US database: https://srrrfkgbcrgtplpekwji.supabase.co
        OR
        - Canada database: https://eilgxbhyoufoforxuyek.supabase.co
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 6. AUTHENTICATION - supabase.auth.signUp()                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        User account created in the connected database
```

## Current Environment Variables in Your .env.local

```bash
✅ NEXT_PUBLIC_SUPABASE_URL              # US URL (browser accessible)
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY         # US Key (browser accessible)
✅ NEXT_PUBLIC_CAN_SUPABASE_URL          # CA URL (browser accessible) ← NEW!
✅ NEXT_PUBLIC_CAN_SUPABASE_ANON_KEY     # CA Key (browser accessible) ← NEW!
✅ CAN_NEXT_PUBLIC_CASUPABASE_URL        # CA URL (server only)
✅ CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY   # CA Key (server only)
```

## The Problem: Why US Goes to Canada

Based on the code, here's what's happening:

### Line 30 in region.ts:
```typescript
const canUrl = process.env.NEXT_PUBLIC_CAN_SUPABASE_URL || process.env.CAN_NEXT_PUBLIC_CASUPABASE_URL;
```

This line uses the **OR operator** (`||`), which means:
1. First, try `NEXT_PUBLIC_CAN_SUPABASE_URL`
2. If that exists, use it (even if region is 'US'!)
3. If not, try the fallback

### The Bug:

The function `getRegionConfig(region)` is supposed to:
- When `region === 'US'` → Return US config
- When `region === 'CA'` → Return Canada config

But look at lines 19-25 in region.ts:

```typescript
export function getRegionConfig(region: Region): RegionConfig {
  if (region === 'US') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }
  // ... Canada logic
}
```

**This looks correct!** If region is 'US', it should return US config.

## Debugging Steps

Let me check if there's something else going on. Can you:

1. Open browser DevTools (F12)
2. Go to Console
3. Try signing up with **US** region selected
4. Look for these logs:

```
🚀 Starting signup for region: ??
📝 Region stored in localStorage and cookie: ??
🔍 Creating Supabase client: { selectedRegion: ??, url: ??, ... }
```

**Expected for US:**
```
🚀 Starting signup for region: US
🔍 Creating Supabase client: { 
  selectedRegion: 'US', 
  url: 'https://srrrfkgbcrgtplpekwji.supabase.co'
}
```

**If you see:**
```
🔍 Creating Supabase client: { 
  selectedRegion: 'US', 
  url: 'https://eilgxbhyoufoforxuyek.supabase.co'  ← Wrong!
}
```

Then something is wrong with the logic.

## Possible Issues

### Issue 1: Region state not being set correctly
The form might not be updating the `region` state when you select US.

### Issue 2: getStoredRegion() returning 'CA'
If localStorage has 'CA' from a previous test, and you don't explicitly pass region:
```typescript
const selectedRegion = region || getStoredRegion()
```
It might use the stored 'CA' instead of the form's 'US'.

### Issue 3: Browser caching
The browser might be caching the old behavior.

## Next Steps

Before I fix anything, please:
1. Clear localStorage: Open console and run `localStorage.clear()`
2. Clear cookies for localhost
3. Refresh the page
4. Try signing up with US
5. Share the console logs

This will tell us exactly where the problem is!
