# TRAZO MVP Development Agent Instructions

## 🎯 CORE PRINCIPLES

### 1. **No Hallucination Policy**
- **NEVER** mark tasks as complete without actually implementing them
- **ALWAYS** verify file existence before claiming modifications
- **DOCUMENT** actual work done with specific file paths and line numbers
- **USE** "TODO:" for planned work, "✅" only for completed work with evidence
- **TEST** your implementations before marking complete

### 2. **Documentation Discipline**
- **PRIMARY DOCS**: Always update `NextSteps.md` and `CURRENT.md` instead of creating new files
- **NEW DOCS ONLY WHEN**: Feature-specific guides needed (e.g., `TESTING.md`, `ENV_SETUP.md`)
- **AVOID**: Creating session notes, temporary docs, or redundant summaries
- **CONSOLIDATE**: Information into existing docs rather than fragmenting

### 3. **Professional Development Standards**
- **CODE FIRST**: Implement actual code, don't just describe what you would do
- **TEST DRIVEN**: Write tests alongside features, maintain 90%+ test coverage
- **TYPE SAFETY**: Full TypeScript types for all implementations
- **ERROR HANDLING**: Comprehensive error handling with user feedback
- **ACCESSIBILITY**: ARIA attributes, keyboard navigation, screen reader support

## 📋 PROJECT UNDERSTANDING

### Current State (as of Oct 20, 2025)
```
✅ Phase 1: Foundation - COMPLETE
✅ Phase 2: Core Integration - COMPLETE  
✅ Phase 2.5: Test Suite Development - COMPLETE
🚀 Phase 3: Feature Integration - READY TO BEGIN

Test Coverage: 164/173 passing (94.8%)
Components: 47+ UI components ready
Infrastructure: RBAC, Jurisdictions, Database Schema all complete
```

### Architecture Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + PostgreSQL), Multi-region setup (US/Canada)
- **UI**: shadcn/ui components, Radix UI primitives, CVA for variants
- **Testing**: Jest, React Testing Library, 94.8% coverage

### Project Structure
```
/app/dashboard/         # Protected dashboard routes
/components/ui/         # 47+ shadcn/ui components (source of truth)
/components/features/   # Feature-specific components
/lib/rbac/             # Role-based access control (8 roles, 50+ permissions)
/lib/jurisdiction/     # Compliance rules (Oregon, Maryland, Canada, PrimusGFS)
/lib/supabase/         # Database queries and schema
/hooks/                # React hooks (usePermissions, useJurisdiction)
/types/                # TypeScript type definitions
/Prototypes/           # 11 prototype apps to integrate
```

## 🔄 INTEGRATION WORKFLOW

### Phase 3 Feature Integration Pattern

When integrating a prototype feature (e.g., Inventory, Batch Management):

#### Step 1: Analysis (30 min)
```typescript
// 1. Review prototype structure
cat Prototypes/[FeatureName]Prototype/README.md

// 2. Identify components to migrate
ls Prototypes/[FeatureName]Prototype/components/

// 3. Check existing database tables
grep -A 20 "CREATE TABLE [feature]" lib/supabase/schema.sql

// 4. Verify permissions exist
grep "[feature]:" lib/rbac/permissions.ts
```

#### Step 2: Type Definitions (1 hour)
```typescript
// Create types/[feature].ts
export interface InventoryItem {
  id: string
  organization_id: string
  site_id: string
  item_type: 'co2_tank' | 'filter' | 'nutrient' | 'chemical' | 'packaging'
  name: string
  sku?: string
  current_quantity: number
  minimum_quantity?: number
  // ... complete from schema.sql
}

// Export from types/index.ts
export * from './inventory'
```

#### Step 3: Database Queries (2 hours)
```typescript
// Create lib/supabase/queries/[feature].ts
import { createClient } from '@/lib/supabase/client'
import type { InventoryItem } from '@/types/inventory'

export async function getInventoryItems(siteId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('name')
  
  if (error) {
    console.error('Error fetching inventory:', error)
    throw error
  }
  
  return data as InventoryItem[]
}

// Add CREATE, UPDATE, DELETE functions
```

#### Step 4: Migrate Components (3-4 hours)
```typescript
// FROM: Prototypes/[Feature]Prototype/components/ComponentName.tsx
// TO: components/features/[feature]/component-name.tsx

// MIGRATION CHECKLIST:
// ✓ Copy component file
// ✓ Update imports to new paths
// ✓ Replace mock data with Supabase hooks
// ✓ Add useJurisdiction() for compliance
// ✓ Add usePermissions() for RBAC
// ✓ Update styling to brand colors
// ✓ Add proper TypeScript types
// ✓ Add error boundaries
// ✓ Add loading states
```

#### Step 5: Create Pages (2 hours)
```typescript
// app/dashboard/[feature]/page.tsx
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InventoryDashboard } from '@/components/features/inventory/inventory-dashboard'
import { canPerformAction } from '@/lib/rbac/guards'

export const metadata: Metadata = {
  title: 'Inventory Management | TRAZO',
  description: 'Manage inventory and track stock levels'
}

export default async function InventoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  // Get user's role and check permissions
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!canPerformAction(userData?.role || '', 'inventory:view')) {
    redirect('/dashboard')
  }
  
  return <InventoryDashboard />
}
```

#### Step 6: Add Tests (2 hours)
```typescript
// app/dashboard/[feature]/__tests__/page.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, jest } from '@jest/globals'

describe('Inventory Page', () => {
  it('requires inventory:view permission', async () => {
    // Test permission check
  })
  
  it('renders inventory dashboard', () => {
    // Test component rendering
  })
  
  it('handles loading state', () => {
    // Test loading UI
  })
  
  it('handles errors gracefully', () => {
    // Test error handling
  })
})
```

#### Step 7: Update Seed Data (30 min)
```typescript
// lib/supabase/seed-data.ts
export const sampleInventoryItems = [
  {
    id: 'inv_1',
    organization_id: 'org_1',
    site_id: 'site_1',
    item_type: 'co2_tank',
    name: 'CO2 Tank - 20lb',
    current_quantity: 5,
    minimum_quantity: 2,
    // ...
  }
]
```

## ✅ COMPLETION CHECKLIST

Before marking ANY task complete, verify:

### Code Implementation
- [ ] Actual code files created (not just described)
- [ ] All TypeScript compiles without errors
- [ ] Components render without runtime errors
- [ ] RBAC permissions properly checked
- [ ] Jurisdiction rules applied where relevant
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Accessibility attributes included

### Testing
- [ ] Unit tests written and passing
- [ ] Test coverage maintained above 90%
- [ ] Manual testing completed
- [ ] Edge cases handled

### Documentation
- [ ] `CURRENT.md` updated with completed work
- [ ] `NextSteps.md` updated to reflect progress
- [ ] Inline code comments added
- [ ] TypeScript types documented

## 🚫 COMMON PITFALLS TO AVOID

### 1. **Mock Data Trap**
❌ DON'T: Leave mock data in production code
✅ DO: Replace ALL mock data with Supabase queries

### 2. **Component Duplication**
❌ DON'T: Create new UI components if they exist in /components/ui/
✅ DO: Use the 47+ existing components first

### 3. **Permission Bypassing**
❌ DON'T: Skip RBAC checks for "simplicity"
✅ DO: Always check permissions, even in development

### 4. **Jurisdiction Ignorance**
❌ DON'T: Hardcode compliance rules
✅ DO: Use useJurisdiction() hook for all compliance logic

### 5. **Type Laziness**
❌ DON'T: Use 'any' type or skip type definitions
✅ DO: Define complete TypeScript interfaces

## 📊 PROGRESS TRACKING

### How to Report Progress

#### Good Progress Update:
```markdown
## ✅ Inventory Feature Integration - Session Oct 21, 2025

### Completed:
1. **Type Definitions** ✅
   - Created `/types/inventory.ts` with 12 interfaces
   - Added to `/types/index.ts` exports
   
2. **Database Queries** ✅
   - Created `/lib/supabase/queries/inventory.ts`
   - Implemented: getInventoryItems, createItem, updateItem, deleteItem
   - Added proper error handling and type safety

3. **Components Migrated** (5/8) ⚠️
   - ✅ inventory-dashboard.tsx
   - ✅ inventory-table.tsx
   - ✅ item-form.tsx
   - ✅ movement-log.tsx
   - ✅ stock-alert.tsx
   - TODO: waste-disposal.tsx (consolidating with batch waste)
   - TODO: par-level-settings.tsx
   - TODO: procurement-orders.tsx

### Tests: 8 new tests added
- inventory.test.ts: 5/5 passing
- item-form.test.tsx: 3/3 passing

### Next Steps:
- Complete remaining 3 components
- Add integration tests
- Update seed data
```

#### Bad Progress Update:
```markdown
✅ Inventory feature complete!
✅ All components migrated
✅ Tests written
✅ Documentation updated
```
(No evidence, no specifics, likely not actually done)

## 🎯 CURRENT PRIORITIES

### Immediate: Batch Management Integration
**Why**: Largest prototype (19 components), core business logic

1. Start with `/Prototypes/BatchManagementPrototype/`
2. Follow 7-step integration pattern above
3. Consolidate 7 type files into `/types/batch.ts`
4. Handle Metrc-specific features conditionally
5. Link waste management to inventory system

### Next: Inventory Tracking
**Why**: Foundation for operations, needed by batch system

### Then: Environmental Controls & Monitoring
**Why**: Real-time telemetry critical for operations

## 🔧 DEVELOPMENT COMMANDS

```bash
# Daily workflow
npm run dev                  # Start dev server
npm test                     # Run tests
npm run test:watch          # Watch mode
npm run seed:dev            # Seed database

# Before committing
npm run build               # Verify build works
npm run test:coverage       # Check coverage
npm run type-check          # TypeScript validation

# Database
npm run db:migrate          # Run migrations
npm run db:seed             # Seed data
```

## 📝 FILE UPDATE PROTOCOL

### When to update NextSteps.md:
- Feature integration started/completed
- Phase transitions
- Priority changes
- New blockers discovered

### When to update CURRENT.md:
- Feature completion
- Test coverage changes
- New systems implemented
- Architecture changes

### When to create new docs:
- Feature-specific setup guides (e.g., TAGOIO_SETUP.md)
- Complex integration guides
- Deployment instructions
- Never for session notes or temporary tracking

## 🎨 CODE STYLE STANDARDS

### Component Structure
```typescript
'use client' // If client component

import { useState, useEffect } from 'react'
import { useJurisdiction } from '@/hooks/use-jurisdiction'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { InventoryItem } from '@/types/inventory'

interface InventoryTableProps {
  items: InventoryItem[]
  onEdit: (item: InventoryItem) => void
  className?: string
}

export function InventoryTable({ 
  items, 
  onEdit,
  className 
}: InventoryTableProps) {
  const { jurisdiction } = useJurisdiction()
  const { can } = usePermissions()
  
  if (!can('inventory:view')) {
    return <div>Unauthorized</div>
  }
  
  // Implementation
}
```

### Query Pattern
```typescript
export async function getInventoryItems(
  siteId: string,
  options?: {
    itemType?: string
    includeInactive?: boolean
  }
) {
  try {
    const supabase = createClient()
    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
    
    if (options?.itemType) {
      query = query.eq('item_type', options.itemType)
    }
    
    if (!options?.includeInactive) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query.order('name')
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getInventoryItems:', error)
    return { data: null, error }
  }
}
```

## 🚀 EXECUTION EXCELLENCE

Remember:
1. **Ship working code**, not promises
2. **Test everything** you implement
3. **Document actual work**, not intentions
4. **Use existing systems** (RBAC, Jurisdictions, Components)
5. **Follow patterns** from completed features (Admin)
6. **Update primary docs** (NextSteps.md, CURRENT.md)
7. **Maintain quality** - 90%+ test coverage
8. **Be specific** in progress reporting

Good luck! The foundation is solid, now execute the feature integration professionally. 🎯