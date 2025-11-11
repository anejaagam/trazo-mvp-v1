# 🧭 Agent Quickstart Guide

**For:** New developers, AI assistants, and contributors  
**Purpose:** Get productive in the TRAZO MVP codebase within minutes

---

## Quick Start Steps

Follow these steps to get productive in minutes:

### 1) Environment Setup
- Ensure `.env.local` exists in project root
- **Dev Mode:** Set `NEXT_PUBLIC_DEV_MODE=true` for fast local iteration (bypasses auth with mock user `test@trazo.app`)
- **Multi-region:** US/CA Supabase keys should be configured per region in env
- **Full variables:** See `ENV_SETUP.md` for complete environment variable list

### 2) Run & Verify
- Start dev server: `npm run dev` (Next.js 15 App Router)
- In VS Code, run the task **"Typecheck and run tests"** to validate type safety and baseline tests
- If your DB is empty, run `npm run seed:dev` to populate basic records
- Expected results:
  - Server starts at `http://localhost:3000`
  - TypeScript: 0 errors
  - Tests: 164/173 passing (94.8%)

### 3) Read Before Editing
Essential documentation to review:
- **`/docs/current/index.md`** - Authoritative current status (what's complete, what's in-progress)
- **`/docs/archived_docs/2-feature-integration/InventoryIntegrationSteps.md`** - Context on what's complete
- **`.github/copilot-instructions.md`** - Architecture patterns (RBAC, jurisdiction, Supabase, shadcn/ui usage)

### 4) Patterns (always use)
Critical patterns to follow in all code:

#### **RBAC & Jurisdiction**
```typescript
// In client components:
import { usePermissions } from '@/hooks/use-permissions'
import { useJurisdiction } from '@/hooks/use-jurisdiction'

const { can } = usePermissions()
const { jurisdiction } = useJurisdiction()

// Check permissions
if (!can('inventory:view')) return <div>Access Denied</div>

// Jurisdiction-specific logic
if (jurisdiction?.type === 'METRC') {
  // Oregon/Maryland specific
}
```

#### **UI Components**
- **Prefer existing components** from `/components/ui/` (47+ shadcn/ui components available)
- Don't recreate UI primitives - check the component library first
- See `/docs/archived_docs/4-cleanup-reports/COMPONENT_IMPORT_ANALYSIS.md` for full inventory

#### **Server Pages**
```typescript
// app/dashboard/[feature]/page.tsx pattern
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canPerformAction } from '@/lib/rbac/guards'

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
```

### 5) What's In-Scope vs Deferred

**✅ COMPLETE for MVP:**
- Inventory feature (full CRUD, lot tracking, FIFO/LIFO, alerts)
- Production endpoints: 4 total (GET/POST `/api/inventory/items`, PATCH/DELETE `/api/inventory/items/[id]`)
- Admin features (user management, roles, permissions, audit logs)
- Signup flow (organization creation, jurisdiction selection)

**⏸️ DEFERRED:**
- Inventory movements & alerts API endpoints (dev-only movements route exists)
- Waste disposal endpoints and shared waste workflow
- Batch management integration (Phase 13)
- Compliance engine (Phase 14)

### 6) Next Focus Preview
- **Current Phase:** Phase 10 - Monitoring & Telemetry (86% complete)
- **Next Up:** Phase 9 - Deployment & Integration Testing
- **Then:** Environmental Controls (Phase 11) → Batch Management → Tasks → Compliance

---

## Development Environment

### File Structure Quick Reference
```
/app/dashboard/[feature]/     # Protected routes with RBAC
/components/ui/               # 47+ shadcn/ui components (use these!)
/components/features/         # Feature-specific components
/lib/supabase/queries/        # Database query functions
/lib/rbac/                    # Role system (8 roles, 50+ permissions)
/lib/jurisdiction/            # Compliance configs (Oregon, Maryland, Canada, PrimusGFS)
/hooks/                       # Custom hooks (usePermissions, useJurisdiction, etc.)
/types/                       # TypeScript interfaces
```

### Key Hooks Available
- `usePermissions()` - Check user permissions: `can('inventory:view')`
- `useJurisdiction()` - Get current jurisdiction config
- `useTelemetry()` - Real-time pod monitoring
- `useHistoricalTelemetry()` - Time-series data for charts
- `useAlarms()` - Alarm management with filtering

---

## Common Development Tasks

### Running Tests
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e
```

### Type Checking
```bash
# Check types without building
npx tsc --noEmit

# Expected: 0 errors
```

### Database Operations
```bash
# Seed test data
npm run seed:dev

# Clean and reseed
npm run seed:clean
```

### Building
```bash
# Production build
npm run build

# Start production server
npm run start

# Dev server with Turbopack (faster)
npm run dev -- --turbopack
```

---

## Dev Mode

**Purpose:** Fast UI development without authentication or database calls

**Enable:**
```bash
# In .env.local
NEXT_PUBLIC_DEV_MODE=true
```

**Features:**
- Bypasses authentication (uses mock user `test@trazo.app`)
- Shows visual dev mode banner
- Uses mock data for all features
- No database queries executed
- Perfect for UI/UX iteration

**Disable for Testing:**
```bash
# In .env.local
NEXT_PUBLIC_DEV_MODE=false
```

---

## Need Help?

**Issue Resolution Priority:**
1. Check `/docs/current/index.md` for latest status
2. Review `/docs/TESTING.md` for test patterns
3. See archived docs in `/docs/archived_docs/2-feature-integration/`
4. Reference existing code in `/app/dashboard/inventory/` (working example)
5. Check `.github/copilot-instructions.md` for AI assistant patterns

**Known Issues:**
- 9 user query tests failing (MockQueryBuilder error handling - deferred, low priority)
- Login page static (dev mode bypasses this - fix when implementing production auth)

---

**Next:** See [Integration Checklist](./integration-checklist.md) for feature development workflow
