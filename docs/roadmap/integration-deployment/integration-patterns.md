# Integration Patterns

**Navigation:** [← Back to Roadmap Index](./index.md)

---

## Overview

This guide documents the proven 7-phase integration pattern used for all TRAZO features. Following this pattern ensures consistency, quality, and maintainability across the codebase.

**Proven Success:** Used successfully for Inventory and Monitoring features

**Timeline:** 2-3 weeks per major feature

---

## The 7-Phase Approach

### Phase 1: Database Schema (1-2 days)

Add to `lib/supabase/schema.sql`:

```sql
-- Tables
CREATE TABLE feature_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  -- ... feature-specific columns
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Views
CREATE VIEW feature_summary AS
SELECT ...;

-- Triggers
CREATE TRIGGER update_feature_timestamp
  BEFORE UPDATE ON feature_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Functions
CREATE OR REPLACE FUNCTION calculate_feature_metric(...)
RETURNS ...;

-- Indexes
CREATE INDEX idx_feature_org_site ON feature_items(org_id, site_id);
CREATE INDEX idx_feature_status ON feature_items(status) WHERE is_active = true;

-- RLS Policies
ALTER TABLE feature_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org feature items"
  ON feature_items FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert own org feature items"
  ON feature_items FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));
```

**Checklist:**
- [ ] Tables with proper foreign keys
- [ ] Views for common queries
- [ ] Triggers for `updated_at`
- [ ] Helper functions
- [ ] Performance indexes
- [ ] RLS policies for multi-tenancy
- [ ] Audit logging triggers

---

### Phase 2: Type Definitions (1 day)

Create `types/[feature].ts`:

```typescript
// Core entity
export interface FeatureItem {
  id: string
  org_id: string
  site_id: string
  name: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

// Insert type (no id, timestamps)
export interface FeatureItemInsert {
  org_id: string
  site_id: string
  name: string
  status?: 'active' | 'inactive'
}

// Update type (all optional except id)
export interface FeatureItemUpdate {
  id: string
  name?: string
  status?: 'active' | 'inactive'
}

// View types
export interface FeatureSummary {
  total_items: number
  active_items: number
  // ... other summary fields
}

// Filter types
export interface FeatureFilters {
  status?: 'active' | 'inactive'
  search?: string
  site_id?: string
}

// Form input types
export interface FeatureFormData {
  name: string
  status: 'active' | 'inactive'
  // ... other form fields
}
```

Export from `types/index.ts`:
```typescript
export type * from './feature'
```

**Checklist:**
- [ ] Core entity interfaces
- [ ] Insert/Update types
- [ ] View types
- [ ] Filter types
- [ ] Form input types
- [ ] Exported from index

---

### Phase 3: Database Queries (2-3 days)

Create `lib/supabase/queries/[feature].ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import type { FeatureItem, FeatureItemInsert, FeatureFilters } from '@/types/feature'

// Get all items
export async function getFeatureItems(siteId: string, filters?: FeatureFilters) {
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
    
    const { data, error } = await query
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getFeatureItems:', error)
    return { data: null, error }
  }
}

// Get single item
export async function getFeatureItem(id: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('feature_items')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getFeatureItem:', error)
    return { data: null, error }
  }
}

// Create item
export async function createFeatureItem(item: FeatureItemInsert) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('feature_items')
      .insert(item)
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in createFeatureItem:', error)
    return { data: null, error }
  }
}

// Update item
export async function updateFeatureItem(id: string, updates: Partial<FeatureItem>) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('feature_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in updateFeatureItem:', error)
    return { data: null, error }
  }
}

// Delete item (soft delete)
export async function deleteFeatureItem(id: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('feature_items')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in deleteFeatureItem:', error)
    return { data: null, error }
  }
}
```

Create `lib/supabase/queries/[feature]-client.ts` (if needed for client-side):

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import type { FeatureItem } from '@/types/feature'

export async function getFeatureItemsClient(siteId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('feature_items')
    .select('*')
    .eq('site_id', siteId)
    .eq('is_active', true)
  
  return { data, error }
}
```

**Checklist:**
- [ ] CRUD operations
- [ ] Filtering, sorting, pagination
- [ ] Error handling with try/catch
- [ ] Console logging for debugging
- [ ] Return consistent `{ data, error }` pattern
- [ ] Separate client queries if needed

---

### Phase 4: UI Components (3-4 days)

Create `components/features/[feature]/`:

**Main Dashboard Component:**
```typescript
'use client'

import { usePermissions } from '@/hooks/use-permissions'
import { useJurisdiction } from '@/hooks/use-jurisdiction'
import { isDevModeActive } from '@/lib/dev-mode'

export function FeatureDashboard() {
  const { can } = usePermissions()
  const { jurisdiction } = useJurisdiction()
  const devMode = isDevModeActive()
  
  if (!can('feature:view')) {
    return <div>Access Denied</div>
  }
  
  if (devMode) {
    return <DevModeFeatureDashboard />
  }
  
  return (
    <div>
      {/* Feature dashboard content */}
    </div>
  )
}
```

**Data Table Component:**
```typescript
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'

const columns: ColumnDef<FeatureItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  // ... other columns
]

export function FeatureTable({ data }: { data: FeatureItem[] }) {
  return <DataTable columns={columns} data={data} />
}
```

**Create/Edit Dialog:**
```typescript
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { useForm } from 'react-hook-form'

export function FeatureDialog({ open, onClose, item }: Props) {
  const form = useForm<FeatureFormData>()
  
  const onSubmit = async (data: FeatureFormData) => {
    // Handle submit
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Form fields */}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

**Checklist:**
- [ ] Main dashboard component
- [ ] Data table with sorting/filtering
- [ ] Create/Edit dialogs
- [ ] Detail views
- [ ] RBAC checks (`usePermissions`)
- [ ] Jurisdiction awareness (`useJurisdiction`)
- [ ] Dev mode handling

---

### Phase 5: Dashboard Pages (2-3 days)

Create `app/dashboard/[feature]/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canPerformAction } from '@/lib/rbac/guards'
import { FeatureDashboard } from '@/components/features/feature/feature-dashboard'

export const metadata = {
  title: 'Feature Management | TRAZO',
  description: 'Manage your feature items',
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
  
  return <FeatureDashboard />
}
```

Create `app/dashboard/[feature]/[id]/page.tsx` (detail page):

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { FeatureDetail } from '@/components/features/feature/feature-detail'

export default async function FeatureDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const { data: item } = await supabase
    .from('feature_items')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (!item) {
    notFound()
  }
  
  return <FeatureDetail item={item} />
}
```

**Checklist:**
- [ ] Server-side authentication
- [ ] RBAC permission checks
- [ ] Data fetching in server components
- [ ] Client wrapper for interactivity
- [ ] Proper redirects
- [ ] 404 handling
- [ ] Metadata for SEO

---

### Phase 6: API Routes (2-3 days)

Create `app/api/[feature]/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { NextResponse } from 'next/server'

// GET /api/feature
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: userData } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', user.id)
      .single()
    
    if (!canPerformAction(userData?.role || '', 'feature:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

// POST /api/feature
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: userData } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', user.id)
      .single()
    
    if (!canPerformAction(userData?.role || '', 'feature:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    
    // Validate input
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('feature_items')
      .insert({
        ...body,
        org_id: userData.org_id,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/feature:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

Create `app/api/[feature]/[id]/route.ts`:

```typescript
// PATCH /api/feature/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Similar pattern with update logic
}

// DELETE /api/feature/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Similar pattern with delete logic
}
```

**Checklist:**
- [ ] Authentication checks
- [ ] RBAC permission guards
- [ ] Input validation
- [ ] Error handling
- [ ] Proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- [ ] Consistent response format

---

### Phase 7: Testing & Bug Fixes (2-3 days)

Write tests:

```typescript
// lib/supabase/queries/__tests__/feature.test.ts
describe('Feature Queries', () => {
  it('should get feature items', async () => {
    // Test implementation
  })
  
  it('should create feature item', async () => {
    // Test implementation
  })
})

// components/features/feature/__tests__/feature-dashboard.test.tsx
describe('FeatureDashboard', () => {
  it('should render feature dashboard', () => {
    // Test implementation
  })
})

// app/api/feature/__tests__/route.test.ts
describe('Feature API', () => {
  it('should return 401 if not authenticated', async () => {
    // Test implementation
  })
})
```

Manual testing checklist:
- [ ] Happy paths (create, read, update, delete)
- [ ] Edge cases (empty states, errors)
- [ ] RBAC scenarios (different user roles)
- [ ] Dev mode testing
- [ ] Multi-tenancy (different orgs can't see each other's data)
- [ ] Performance (large datasets)

**Checklist:**
- [ ] Query function unit tests
- [ ] Component tests
- [ ] API route tests
- [ ] Manual testing complete
- [ ] All bugs fixed
- [ ] Documentation updated

---

## Feature Completion Checklist

Use this for every new feature:

### Before Starting
- [ ] Review prototype in `/Prototypes/[Feature]Prototype/`
- [ ] Check database schema in `schema.sql`
- [ ] Verify dependencies are complete
- [ ] Create feature branch: `git checkout -b feature/[name]`

### Phase by Phase
- [ ] Phase 1: Database schema updated
- [ ] Phase 2: Types defined and exported
- [ ] Phase 3: Query functions written and tested
- [ ] Phase 4: Components built with RBAC
- [ ] Phase 5: Pages created with auth
- [ ] Phase 6: API routes implemented
- [ ] Phase 7: Tests written and passing

### Quality Checks
- [ ] TypeScript compiles clean (`npx tsc --noEmit`)
- [ ] Tests passing (>90% pass rate)
- [ ] Build succeeds (`npm run build`)
- [ ] Dev mode works (no crashes)
- [ ] RBAC guards on all routes
- [ ] No console errors in browser
- [ ] Responsive design works
- [ ] Accessibility (ARIA labels, keyboard nav)

### Documentation
- [ ] Update `CURRENT.md` with completed work
- [ ] Update roadmap checklist
- [ ] Create `[FEATURE]_COMPLETE.md` summary
- [ ] Add seed data examples
- [ ] Document new permissions

### Deployment Prep
- [ ] Schema migration prepared
- [ ] Seed data updated
- [ ] Manual test checklist created
- [ ] Breaking changes documented
- [ ] Rollback plan defined

---

**Navigation:** [← Back to Roadmap Index](./index.md) | [← Feature Roadmap](./feature-roadmap.md) | [Next: Development Workflow →](./development-workflow.md)
