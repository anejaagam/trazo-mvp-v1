# Quick Reference

**Navigation:** [← Back to Roadmap Index](./index.md)

---

## File Locations

| Component | Path |
|-----------|------|
| Dashboard Pages | `/app/dashboard/[feature]/page.tsx` |
| API Routes | `/app/api/[feature]/route.ts` |
| Feature Components | `/components/features/[feature]/` |
| UI Components | `/components/ui/` (47+ components) |
| Server Queries | `/lib/supabase/queries/[feature].ts` |
| Client Queries | `/lib/supabase/queries/[feature]-client.ts` |
| Types | `/types/[feature].ts` |
| Server Actions | `/app/actions/[feature].ts` |
| Constants | `/lib/constants/[feature].ts` |
| Hooks | `/hooks/use-[feature].ts` |

---

## Hooks Usage

```typescript
// In client components:
import { usePermissions } from '@/hooks/use-permissions'
import { useJurisdiction } from '@/hooks/use-jurisdiction'
import { isDevModeActive } from '@/lib/dev-mode'

const { can } = usePermissions()
const { jurisdiction } = useJurisdiction()
const devMode = isDevModeActive()

// Permission check
if (!can('inventory:view')) {
  return <div>Access Denied</div>
}

// Jurisdiction-specific logic
if (jurisdiction?.type === 'METRC') {
  // Oregon/Maryland specific
} else if (jurisdiction?.type === 'CTLS') {
  // Canada specific
}

// Dev mode bypass
if (devMode) {
  return <DevModeComponent />
}
```

---

## Server Component Pattern

```typescript
// app/dashboard/[feature]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canPerformAction } from '@/lib/rbac/guards'

export const metadata = {
  title: 'Feature | TRAZO',
  description: 'Feature description',
}

export default async function FeaturePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!canPerformAction(userData?.role || '', 'feature:view')) {
    redirect('/dashboard')
  }
  
  return <FeatureComponent />
}
```

---

## Client Component Pattern

```typescript
'use client'

import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import { isDevModeActive } from '@/lib/dev-mode'

export function FeatureComponent() {
  const { can } = usePermissions()
  const [data, setData] = useState([])
  
  useEffect(() => {
    if (isDevModeActive()) {
      setData(mockData)
    } else {
      fetchData()
    }
  }, [])
  
  if (!can('feature:view')) {
    return <div>Access Denied</div>
  }
  
  return (
    <div>
      {/* Component content */}
    </div>
  )
}
```

---

## API Route Pattern

```typescript
// app/api/[feature]/route.ts
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { data: userData } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', user.id)
      .single()
    
    if (!canPerformAction(userData?.role || '', 'feature:view')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    const { data, error } = await supabase
      .from('feature_items')
      .select('*')
      .eq('org_id', userData.org_id)
    
    if (error) throw error
    
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/feature:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  // Similar pattern for POST
}
```

---

## Database Query Pattern

```typescript
// lib/supabase/queries/[feature].ts
import { createClient } from '@/lib/supabase/server'
import type { FeatureItem, FeatureFilters } from '@/types/feature'

export async function getFeatureItems(
  siteId: string,
  filters?: FeatureFilters
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('feature_items')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getFeatureItems:', error)
    return { data: null, error }
  }
}
```

---

## Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run dev -- --turbopack     # Use Turbopack (faster)

# Testing
npm test                       # Run all tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report

# Build
npm run build                 # Production build
npm run start                 # Start production server

# Database
npm run seed:dev              # Seed test data
npm run seed:clean            # Clean and reseed

# Type Checking
npx tsc --noEmit              # Check TypeScript errors

# Linting
npm run lint                  # Run ESLint
npm run lint -- --fix         # Fix lint errors
```

---

## Environment Variables

```bash
# US Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Canada Supabase
NEXT_PUBLIC_SUPABASE_URL_CA=https://[ca-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_CA=eyJ...
CAN_SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Dev Mode
NEXT_PUBLIC_DEV_MODE=false  # Set to true for dev mode

# Site URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Cron Secret
CRON_SECRET=your-secure-random-token
```

---

## RBAC Permissions

### View Permissions
- `inventory:view` - View inventory items
- `monitoring:view` - View monitoring dashboards
- `admin:view` - View admin panels
- `batch:view` - View batches
- `compliance:view` - View compliance reports

### Create Permissions
- `inventory:create` - Create inventory items
- `batch:create` - Create batches
- `task:create` - Create tasks

### Update Permissions
- `inventory:update` - Edit inventory items
- `batch:update` - Edit batches
- `user:update` - Edit users

### Delete Permissions
- `inventory:delete` - Delete inventory items
- `batch:delete` - Delete batches

### Special Permissions
- `inventory:consume` - Issue inventory to batches
- `inventory:dispose` - Waste disposal
- `inventory:export` - Export data
- `admin:all` - Full admin access
- `org:manage` - Manage organization

---

## Roles

| Role | Permissions | Description |
|------|-------------|-------------|
| `super_admin` | All permissions | Platform administrator |
| `org_admin` | All org permissions | Organization owner |
| `compliance_officer` | Compliance + view all | Regulatory compliance |
| `head_grower` | Batch + inventory + tasks | Senior cultivation |
| `grower` | Batch + tasks (limited) | Cultivation staff |
| `operator` | Inventory consume + tasks | Operations staff |
| `viewer` | View only | Read-only access |
| `guest` | Minimal view | Limited guest access |

---

## Jurisdictions

| Jurisdiction | Type | Applies To |
|--------------|------|------------|
| Oregon | METRC | Cannabis (US) |
| Maryland | METRC | Cannabis (US) |
| Canada | CTLS | Cannabis (Canada) |
| PrimusGFS | Food Safety | Produce |

---

## Getting Help

### Documentation Priority
1. Check `/docs/CURRENT.md` for latest status
2. Review `/docs/roadmap/` for specific guides
3. See feature integration tracker (if exists)
4. Reference existing code in `/app/dashboard/[feature]/`
5. Check `.github/copilot-instructions.md` for AI patterns

### Common Issues

**Authentication not working:**
```bash
# Check environment variables
cat .env.local | grep SUPABASE
```

**RLS policy blocking query:**
```sql
-- Check RLS policies in Supabase SQL Editor
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

**Build fails:**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

**Tests failing:**
```bash
# Run with verbose output
npm test -- --verbose

# Clear test cache
npm test -- --clearCache
```

---

## Project Metrics

### Test Coverage
- **Pass Rate:** 94.8% (164/173 tests)
- **Expected Baseline:** 164/173 passing
- **Known Failures:** 9 (MockQueryBuilder error handling - deferred)

### Code Stats
- **Total Files:** 30+ per feature
- **Components:** 47+ UI components
- **Query Functions:** 67+ per feature
- **API Endpoints:** 4-6 per feature
- **Type Definitions:** 50+ per feature

### Feature Completion
- **Phase 1-8:** ✅ Foundation + Identity + Inventory (100%)
- **Phase 10:** 🔄 Monitoring & Telemetry (90%)
- **Phase 11-16:** ⏳ Pending integrations

---

**Navigation:** [← Back to Roadmap Index](./index.md) | [← Cleanup Tracking](./cleanup-tracking.md)
