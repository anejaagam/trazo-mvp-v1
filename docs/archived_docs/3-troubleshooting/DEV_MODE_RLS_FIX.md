# Dev Mode RLS Fix

## Problem Identified ✅

**Root Cause**: Row Level Security (RLS) policies block inventory item creation in dev mode because:

1. Dev mode bypasses authentication at middleware level
2. But Supabase RLS policies still run on database
3. RLS helper functions (`public.user_organization_id()`, `public.user_role()`) depend on `auth.uid()`
4. Without a real auth session, `auth.uid()` returns NULL
5. INSERT fails the RLS policy check

```sql
-- This policy requires auth.uid() to work:
CREATE POLICY "Growers can create inventory items"
  ON inventory_items FOR INSERT
  WITH CHECK (
    organization_id = public.user_organization_id()  -- ❌ Returns NULL in dev mode
    AND public.user_role() IN ('org_admin', ...)     -- ❌ Returns NULL in dev mode
  );
```

## Solution 1: Seed Dev User in Database (RECOMMENDED)

### Step 1: Create a SQL migration to insert dev user

Create file: `/lib/supabase/migrations/dev-user-seed.sql`

```sql
-- Insert dev organization
INSERT INTO organizations (id, name, data_region, jurisdiction, plant_type)
VALUES (
  'dev-org-123',
  'Development Farm',
  'us',
  'maryland_cannabis',
  'cannabis'
)
ON CONFLICT (id) DO NOTHING;

-- Insert dev site
INSERT INTO sites (id, organization_id, name)
VALUES (
  'dev-site-123',
  'dev-org-123',
  'Main Facility'
)
ON CONFLICT (id) DO NOTHING;

-- Insert dev user in auth.users (requires service role access)
-- This needs to be done via Supabase Dashboard or Admin API

-- Insert dev user in public.users
INSERT INTO users (
  id,
  email,
  full_name,
  phone,
  organization_id,
  role,
  status,
  is_active
)
VALUES (
  'dev-user-123',
  'dev@trazo.ag',
  'Dev User',
  '+1234567890',
  'dev-org-123',
  'org_admin',
  'active',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Insert user site assignment
INSERT INTO user_site_assignments (user_id, site_id)
VALUES ('dev-user-123', 'dev-site-123')
ON CONFLICT (user_id, site_id) DO NOTHING;
```

### Step 2: Update dev mode to use real Supabase session

Modify `/lib/supabase/client.ts` to inject a mock session in dev mode:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import { isDevModeActive, DEV_MOCK_USER } from '@/lib/dev-mode'

export function createClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // In dev mode, set a mock session
  if (isDevModeActive() && typeof window !== 'undefined') {
    // This is a hack - in production, create a real test user
    // For now, this documentation shows the pattern
  }

  return supabase
}
```

## Solution 2: Use Service Role Key in Dev Mode (QUICK FIX)

**⚠️ WARNING: Never expose service role key to browser!**

This solution creates a server-side API route that uses the service role key.

### Step 1: Create API route for inventory operations

Create file: `/app/api/dev/inventory/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDevModeActive } from '@/lib/dev-mode'

// Service role client (bypasses RLS)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only!
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function POST(request: NextRequest) {
  // Only allow in dev mode
  if (!isDevModeActive()) {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('inventory_items')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}
```

### Step 2: Update client query to use API in dev mode

Modify `/lib/supabase/queries/inventory-client.ts`:

```typescript
import { isDevModeActive } from '@/lib/dev-mode'

export async function createInventoryItem(item: InsertInventoryItem) {
  try {
    // In dev mode, use service role API to bypass RLS
    if (isDevModeActive()) {
      const response = await fetch('/api/dev/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })
      
      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error)
      }
      
      const { data } = await response.json()
      return { data, error: null }
    }

    // Production mode: use regular client
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(item)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in createInventoryItem:', error)
    return { data: null, error }
  }
}
```

## Solution 3: Modify RLS Policies for Dev Mode (NOT RECOMMENDED)

You could modify the RLS policies to allow inserts when `auth.uid()` is NULL, but this would weaken security in production.

## Recommended Action Plan

1. **Immediate Fix**: Implement Solution 2 (Service Role API) ✅
2. **Long-term**: Create real test users in Supabase Auth (Solution 1)
3. **Update Documentation**: Document dev mode requirements

## Testing After Fix

1. Ensure `NEXT_PUBLIC_DEV_MODE=true` in `.env.local`
2. Start dev server: `npm run dev`
3. Navigate to `/dashboard/inventory`
4. Click "Add Item" button
5. Fill out form and submit
6. Check browser console for success/error
7. Verify item appears in dashboard

## Related Files

- `/lib/supabase/rls-policies.sql` - RLS policy definitions
- `/lib/dev-mode.ts` - Dev mode configuration
- `/lib/supabase/client.ts` - Supabase client creation
- `/lib/supabase/queries/inventory-client.ts` - Inventory database queries
- `/components/features/inventory/item-form-dialog.tsx` - Form component
