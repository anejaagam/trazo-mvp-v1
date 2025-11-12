# TRAZO MVP Copilot Instructions

## Architecture Overview
TRAZO is a Next.js 15 (App Router) cultivation facility management system with multi-tenancy, jurisdiction-based compliance, and role-based access control. The app uses Supabase for auth/database with separate US/Canada regions.

## Critical Context
- **Dev Mode**: Set `NEXT_PUBLIC_DEV_MODE=true` to bypass auth (uses mock user: test@trazo.app)
- **Testing**: 164/173 tests passing (94.8%) - maintain this coverage
- **Components**: 47+ shadcn/ui components in `/components/ui/` - use these first, don't recreate
- **Prototypes**: 11 standalone React apps in `/Prototypes/` awaiting integration
- **MCP SERVERS**: You have access to MCP Servers for TAGOIO, Supabase, and Vercel. Default Supabase server to use is US region. Any changes made to Supabase schema or functions must be replicated in both US and Canada projects.

## Project Structure
```
/app/dashboard/         # Protected routes (redirect to /dashboard on auth)
/components/
  /ui/                 # 47+ shadcn/ui components (source of truth)
  /features/           # Feature-specific components (admin, inventory, etc.)
/lib/
  /rbac/              # Role system: 8 roles, 50+ permissions, guard functions
  /jurisdiction/      # Compliance: Oregon/Maryland Metrc, Canada CTLS, PrimusGFS
  /supabase/          # Database queries, schema.sql (20+ tables with RLS)
/hooks/               # usePermissions(), useJurisdiction() - always use these
/types/               # TypeScript interfaces - extend, don't use 'any'
```

## Development Workflow
```bash
npm run dev           # Start with NEXT_PUBLIC_DEV_MODE=true
npm test             # Run tests (maintain 94.8%+ pass rate)
npm run seed:dev     # Seed database with test data
npm run build        # Verify before committing
```

## Key Patterns

### Server Components with RBAC
```typescript
// app/dashboard/[feature]/page.tsx pattern
export default async function FeaturePage() {
  const supabase = createClient()
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

### Client Components with Jurisdiction
```typescript
'use client'
import { useJurisdiction } from '@/hooks/use-jurisdiction'
import { usePermissions } from '@/hooks/use-permissions'

export function Component() {
  const { jurisdiction } = useJurisdiction()  // Oregon, Maryland, Canada, PrimusGFS
  const { can } = usePermissions()
  
  if (!can('inventory:edit')) return <div>Unauthorized</div>
  
  // Jurisdiction-specific logic
  if (jurisdiction?.type === 'METRC') {
    // Oregon/Maryland specific
  }
}
```

### Database Queries
```typescript
// lib/supabase/queries/[feature].ts pattern
export async function getFeatureItems(siteId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getFeatureItems:', error)
    return { data: null, error }
  }
}
```

## Integration Priority (Phase 3)
1. **Inventory** (/Prototypes/InventoryTrackingPrototype/) 
2. **Monitoring** (/Prototypes/MonitoringAndTelemeteryPrototype/)
3. **Recipe Management** (/Prototypes/RecipePrototype/) - WE ARE HERE
4. **Tasks** → **Compliance** → **Batch** (Phase 4)

## Documentation Rules
- Update `/docs/roadmap/` for progress tracking (organized into 4 categories)
  - Main index: `/docs/roadmap/index.md`
  - Getting Started: `/docs/roadmap/getting-started/`
  - Integration & Deployment: `/docs/roadmap/integration-deployment/`
  - Planning & Progress: `/docs/roadmap/planning-progress/`
  - Reference: `/docs/roadmap/reference/`
- Update `/docs/current/` for completed features (split into 6 focused guides)
  - Main index: `/docs/current/index.md`
  - Feature details: `/docs/current/feature-inventory.md`, `feature-monitoring.md`
  - See full list in current index
- Don't create session notes or temporary docs
- Reference `AGENT_INSTRUCTIONS.md` for detailed integration patterns

## Testing Requirements
- Write tests for all new features
- Use existing test patterns from `/app/dashboard/admin/__tests__/`
- Mock Supabase using patterns in `/lib/supabase/queries/__tests__/test-helpers.ts`

## Common Pitfalls to Avoid
- Don't leave mock data in production code
- Don't skip RBAC permission checks
- Don't hardcode jurisdiction rules - use useJurisdiction()
- Don't create UI components if they exist in /components/ui/
- Always mark tasks complete with evidence (file paths, line numbers)