# Recipe Prototype Component Mapping

## Analysis Date: 2025-11-11
## Status: Complete ✅

## Component Inventory

### Main Components (To Integrate)

| Prototype Component | Target Location | shadcn/ui Mapping | Priority |
|-------------------|----------------|-------------------|----------|
| `RecipeLibrary.tsx` | `/components/features/recipes/recipe-list.tsx` | Card, Button, Badge, Input, Search | High |
| `RecipeAuthor.tsx` | `/components/features/recipes/recipe-form.tsx` | Form, Tabs, Input, Textarea, Label | High |
| `RecipeViewer.tsx` | `/components/features/recipes/recipe-viewer.tsx` | Card, Badge, Tabs, Collapsible | High |
| `OverrideControl.tsx` | `/components/features/monitoring/control-override.tsx` | Dialog, Progress, Badge, Button | High |
| `ScheduleManager.tsx` | `/components/features/recipes/schedule-manager.tsx` | Card, Tabs, Calendar, Select | Medium |
| `BatchGroupManager.tsx` | `/components/features/recipes/batch-group-manager.tsx` | Card, Checkbox, Select | Medium |
| `AuditLog.tsx` | `/components/features/recipes/audit-log.tsx` | Table, Badge, ScrollArea | Low |

### UI Components (Already Available)

All shadcn/ui components from prototype exist in `/components/ui/`:
- ✅ Card, Button, Badge, Input, Textarea
- ✅ Dialog, Tabs, Label, Select, Checkbox
- ✅ Alert, Progress, Separator, Skeleton
- ✅ Table, ScrollArea, Collapsible, Toggle

## Data Structure Mapping

### Types to Implement

```typescript
// From Prototypes/RecipePrototype/types/index.ts
// Map to: /types/recipes.ts

export type RecipeStatus = 'Draft' | 'Published' | 'Applied' | 'Deprecated' | 'Archived'
export type StageType = 'Germination' | 'Vegetative' | 'Flowering' | 'Harvest'
export type SetpointType = 'Temperature' | 'RH' | 'VPD' | 'CO2' | 'LightIntensity' | 'Photoperiod'
export type OverrideStatus = 'Requested' | 'Active' | 'Reverted' | 'Blocked' | 'Escalated'

// Key Interfaces:
- Recipe (with versioning)
- RecipeVersion
- Stage
- SetpointTarget (with ramp, deadband, min/max)
- Schedule (timezone-aware, blackout windows)
- Override (precedence hierarchy)
- BatchGroup
- AuditEvent
- IrrigationProgram
```

### Database Tables Needed

1. **recipes** - Core recipe metadata
2. **recipe_versions** - Versioning system
3. **recipe_stages** - Stage definitions
4. **environmental_setpoints** - Temperature, RH, VPD, CO2, Light, Photoperiod
5. **nutrient_formulas** - EC/pH targets (future)
6. **recipe_activations** - Track when recipes are applied
7. **control_overrides** - Manual overrides with TTL
8. **control_logs** - Audit trail

## Business Logic to Preserve

### Validation Rules
- Recipe name required
- At least one stage required
- Stage duration > 0
- Setpoint values within min/max bounds
- Conflicting setpoint detection
- VPD calculation validation

### Environmental Control Logic
- Precedence hierarchy: Safety > E-stop > Manual Override > Recipe > DR
- Auto-revert with TTL (Time To Live)
- Day/Night value switching based on schedule
- Ramp transitions between values
- Deadband tolerance ranges

### Recipe Activation Workflow
1. Select recipe and target (room/pod/batch group)
2. Set timezone and schedule (day/night start times)
3. Configure blackout windows
4. Activate → Creates control setpoints
5. Monitor adherence → Generate alerts

## Components to Discard/Replace

❌ **Mock Data Files** - Replace with Supabase queries
- `/lib/mockData.ts` → Use for seed data structure only

❌ **UI Component Copies** - Use existing shadcn/ui
- `/components/ui/*` in prototype → Already in main app

❌ **Standalone Navigation** - Integrate with app layout
- App.tsx routing → Use Next.js App Router

## Integration Patterns

### RBAC Integration
```typescript
// Add to each component
import { usePermissions } from '@/hooks/use-permissions'

const { can } = usePermissions()
if (!can('recipes:view')) return <Unauthorized />
```

### Jurisdiction Integration
```typescript
// Add jurisdiction-specific logic
import { useJurisdiction } from '@/hooks/use-jurisdiction'

const { jurisdiction } = useJurisdiction()
// Filter recipes by compliance type (METRC, CTLS, PrimusGFS)
```

### Server Component Pattern
```typescript
// app/dashboard/recipes/page.tsx
export default async function RecipesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  
  // Check permissions server-side
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!canPerformAction(userData?.role || '', 'recipes:view')) {
    redirect('/dashboard')
  }
  
  return <RecipeList />
}
```

## Mock Data Analysis

### Sample Recipe Structure
```typescript
{
  name: 'Premium Flower Cycle',
  status: 'Published',
  currentVersion: 3,
  stages: [
    {
      name: 'Germination',
      duration: 7, // days
      setpoints: [
        { type: 'Temperature', dayValue: 26, nightValue: 22, unit: '°C', deadband: 1 },
        { type: 'RH', dayValue: 60, nightValue: 70, unit: '%', deadband: 5 },
        { type: 'CO2', value: 1200, unit: 'ppm', deadband: 50 },
        { type: 'LightIntensity', value: 85, unit: '%', ramp: { start: 0, end: 85, duration: 30 } },
        { type: 'Photoperiod', value: 18, unit: 'hrs' }
      ]
    },
    // ... more stages
  ]
}
```

### Override Control Structure
```typescript
{
  scopeId: 'room-1',
  parameter: 'Temperature',
  currentValue: 24,
  overrideValue: 20,
  ttl: 3600, // seconds
  reason: 'Heat stress mitigation',
  precedence: 'Manual Override',
  status: 'Active',
  expiresAt: '2025-11-11T18:00:00Z'
}
```

## Key Features to Implement

### Phase 1: Core Recipe Management ✅
- [x] Recipe CRUD operations
- [x] Version management
- [x] Stage configuration
- [x] Setpoint definition (with day/night, ramp, deadband)

### Phase 2: Environmental Control 🔄
- [x] Control override interface
- [x] Precedence hierarchy enforcement
- [x] Auto-revert timers
- [x] Control history logging

### Phase 3: Schedule & Activation 🔄
- [x] Timezone-aware scheduling
- [x] Day/night transitions
- [x] Blackout windows
- [x] Batch group assignment

### Phase 4: Monitoring Integration 🔄
- [x] Display recipe targets in monitoring dashboard
- [x] Compare actual vs. target values
- [x] Alert on deviation from setpoints
- [x] Recipe adherence metrics

## Dependencies

### Required for Integration
1. ✅ Monitoring Module (Phase 10) - Complete
2. ✅ Inventory Module (Phase 9) - Complete
3. ✅ RBAC System - Active
4. ✅ Jurisdiction System - Active
5. ⏳ Batch Management - Future (Phase 4)

### Third-Party Libraries
- `react-hook-form` - Form management (already in use)
- `zod` - Validation schemas (already in use)
- `date-fns` - Date manipulation (already in use)
- `recharts` - Charts (already in use)
- `sonner` - Toast notifications (already in use)

## Notes

### Irrigation Program
The prototype includes `IrrigationProgram` interface. This is **out of scope** for Phase 11. Will be addressed in future irrigation/fertigation module.

### TagoIO Integration
Control commands should **NOT** actually be sent to TagoIO devices. Use `console.log()` for now and add TODO comments for actual implementation.

### Multi-Region Considerations
All database schema changes must be replicated to both:
- Supabase US region (primary)
- Supabase Canada region (replica)

## Success Criteria

✅ All prototype features catalogued
✅ Component mapping to shadcn/ui complete
✅ Data structures documented
✅ Business logic identified
✅ Integration patterns defined
✅ Mock data structure preserved for seeding

## Next Steps

1. Proceed to Step 2.1: Database Schema Setup
2. Create recipe tables with RLS policies
3. Implement database functions
4. Seed development data using mock structures
