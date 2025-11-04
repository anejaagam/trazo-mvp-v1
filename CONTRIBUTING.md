# Contributing to TRAZO MVP

Thank you for your interest in contributing to TRAZO! This document provides guidelines for contributing to the project.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/trazo-mvp-v1.git
   cd trazo-mvp-v1
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase credentials
   - Set `NEXT_PUBLIC_DEV_MODE=true` for local development

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Verify Setup**
   ```bash
   npm run typecheck  # Should pass with 0 errors
   npm test           # Should maintain 94.8%+ pass rate
   ```

## Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `test` - Integration testing branch
- `feature/*` - New features (e.g., `feature/batch-management`)
- `fix/*` - Bug fixes (e.g., `fix/inventory-transfer`)

### Creating a Feature Branch
```bash
git checkout test
git pull origin test
git checkout -b feature/your-feature-name
```

### Commit Message Convention
Follow conventional commits:
```
feat: Add batch genealogy tree view
fix: Correct inventory transfer stock calculation
docs: Update API documentation
test: Add unit tests for telemetry hooks
chore: Update dependencies
```

## Code Style

### TypeScript
- **No `any` types** - Use proper type definitions
- **Extend existing types** - Don't duplicate interfaces
- **Export types** from `/types/index.ts`

### React Components
- **Server Components by default** - Use `'use client'` only when needed
- **RBAC on every route** - Use `usePermissions()` hook
- **Jurisdiction awareness** - Use `useJurisdiction()` hook
- **Dev mode support** - Check `isDevModeActive()`

### File Organization
```typescript
// ✅ Good - Server Component with RBAC
export default async function FeaturePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  
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

// ❌ Bad - No auth check, no RBAC
export default function FeaturePage() {
  return <FeatureComponent />
}
```

### Database Queries
- **Use service client** for RLS bypass in server actions
- **Handle errors gracefully** - Return `{ data, error }` pattern
- **Multi-tenancy** - Always filter by `org_id` or `site_id`

```typescript
// ✅ Good - Error handling, multi-tenant
export async function getItems(siteId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getItems:', error)
    return { data: null, error }
  }
}
```

### UI Components
- **Use existing shadcn/ui components** - 47+ available in `/components/ui/`
- **Don't recreate primitives** - Check component library first
- **Responsive design** - Mobile-first approach
- **Accessibility** - ARIA labels, keyboard navigation

## Testing Requirements

### Before Committing
```bash
npm run typecheck  # Must pass with 0 errors
npm test           # Must maintain 94.8%+ pass rate
npm run build      # Must build successfully
```

### Writing Tests
- **Unit tests** for query functions (`/lib/supabase/queries/__tests__/`)
- **Component tests** for UI components
- **Integration tests** for API routes
- **E2E tests** for critical user flows (Playwright)

### Test Patterns
```typescript
// Use existing test helpers
import { mockSupabaseClient } from '@/lib/supabase/queries/__tests__/test-helpers'

describe('Feature Query', () => {
  it('should fetch items for site', async () => {
    const mockClient = mockSupabaseClient({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{ id: '1', name: 'Test' }],
        error: null
      })
    })
    
    const { data } = await getItems('site-123')
    expect(data).toHaveLength(1)
  })
})
```

## Pull Request Process

### 1. Pre-PR Checklist
- [ ] Code follows style guidelines
- [ ] TypeScript compiles with 0 errors
- [ ] All tests pass (maintain 94.8%+ rate)
- [ ] Build succeeds
- [ ] RBAC guards in place
- [ ] Dev mode compatible
- [ ] No console errors
- [ ] Updated relevant documentation

### 2. Create Pull Request
- **Base branch:** `test` (not `main`)
- **Title:** Follow conventional commit format
- **Description:** Include:
  - What changed
  - Why it changed
  - Testing performed
  - Screenshots (if UI changes)

### 3. PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] E2E tests added (if needed)

## Checklist
- [ ] TypeScript compiles (0 errors)
- [ ] Tests pass (94.8%+ rate)
- [ ] Build succeeds
- [ ] RBAC implemented
- [ ] Documentation updated
```

### 4. Review Process
- At least 1 approval required
- All CI checks must pass
- Resolve all review comments
- Squash commits before merge

## Project Structure

### Key Directories
```
/app/dashboard/         # Protected routes (Server Components)
/components/
  /ui/                  # 47+ shadcn/ui components
  /features/            # Feature-specific components
/lib/
  /rbac/                # Role system (8 roles, 50+ permissions)
  /jurisdiction/        # Compliance (Oregon, Maryland, Canada, PrimusGFS)
  /supabase/            # Database queries, schema
/hooks/                 # Custom hooks (usePermissions, useJurisdiction)
/types/                 # TypeScript interfaces
```

### Adding a New Feature (7-Phase Pattern)
1. **Database Schema** - Add to `lib/supabase/schema.sql`
2. **Type Definitions** - Create `types/[feature].ts`
3. **Database Queries** - Create `lib/supabase/queries/[feature].ts`
4. **UI Components** - Create `components/features/[feature]/`
5. **Dashboard Pages** - Create `app/dashboard/[feature]/page.tsx`
6. **API Routes** - Create `app/api/[feature]/route.ts`
7. **Testing** - Write tests, manual QA

See `/docs/ROADMAP.md` for detailed integration patterns.

## Documentation Standards

### Code Comments
- **Why, not what** - Code should be self-documenting
- **Complex logic** - Explain business rules
- **TODOs** - Include ticket reference

```typescript
// ✅ Good
// FIFO allocation: oldest lots first to prevent expiry waste
const allocatedLots = sortByExpiryDate(lots)

// ❌ Bad
// Sort lots
const allocatedLots = sortByExpiryDate(lots)
```

### Documentation Updates
When adding features, update:
- `/docs/CURRENT.md` - Feature status
- `/docs/ROADMAP.md` - Integration checklist
- `README.md` - If changing setup/usage
- Create `[FEATURE]_COMPLETE.md` summary

## Getting Help

- **Architecture questions:** See `.github/copilot-instructions.md`
- **Integration patterns:** See `/docs/ROADMAP.md` (7-Phase Approach)
- **Feature status:** See `/docs/CURRENT.md`
- **API reference:** See `docs/API.md`
- **Testing guides:** See `docs/archived_docs/1-setup-guides/TESTING.md`

## Code of Conduct

### Our Standards
- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the project
- Show empathy towards others

### Enforcement
Violations can be reported to the project maintainers. All complaints will be reviewed and investigated.

---

**Thank you for contributing to TRAZO!** 🌱
