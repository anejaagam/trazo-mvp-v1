# Batch Management Prototype Analysis

**Navigation:** [← Back to Integration Deployment](./index.md) | [Schema Mapping →](./batch-schema-mapping.md)

**Date**: November 13, 2025  
**Phase**: 13 - Batch Management Integration  
**Status**: Pre-Integration Research Complete (Step 0.1)  
**Integration Pattern**: Following [7-Phase Approach](./integration-patterns.md)

---

## Executive Summary

The BatchManagementPrototype has an **excellent architectural foundation** with a unified domain-aware system supporting both cannabis and produce operations. The prototype demonstrates sophisticated type safety using discriminated unions and has 25+ well-structured components. However, it has **critical gaps** that must be addressed during integration:

1. **No data initialization** - localStorage empty on first load
2. **Incomplete modal integration** - component routing only logs to console
3. **Missing batch detail view** - needs comprehensive detail page

---

## Component Inventory

### Total Components: 32

#### Core Batch Management (7 components)
- `BatchManagement.tsx` - Main container with domain toggle
- `BatchModal.tsx` - Create/edit batch form (domain-aware)
- `BatchTable.tsx` - Batch list with sortable columns
- `BatchSplitting.tsx` - Split batch workflow
- `BatchMerging.tsx` - Merge batches workflow
- `LocationTransfer.tsx` - Move batches between locations
- `QuarantineManagement.tsx` - Quarantine/release workflows

#### Cultivar Management (3 components)
- `CultivarManagement.tsx` - Cultivar grid view
- `CultivarModal.tsx` - Create/edit cultivar form
- `CultivarSelector.tsx` - Reusable cultivar dropdown

#### Stage & Lifecycle (4 components)
- `StageTransitionModal.tsx` - Transition between stages
- `StageProgressBar.tsx` - Visual stage indicator
- `StageHistoryTimeline.tsx` - Lifecycle history view
- `HarvestWindowPredictions.tsx` - Harvest date predictions

#### Quality & Metrics (2 components)
- `QualityMetricsPanel.tsx` - Quality metrics display
- `QualityHistoryView.tsx` - Quality trends over time

#### Domain-Specific Cannabis (5 components)
- `CannabisWorkflowManager.tsx` - Cannabis stage workflows
- `CannabisFlowDemo.tsx` - Cannabis lifecycle demo
- `DryingCuringTracking.tsx` - Post-harvest tracking
- `CannabisTestingIntegration.tsx` - Lab testing integration (placeholder)
- `MetrcTagManagement.tsx` - METRC compliance (placeholder)

#### Domain-Specific Produce (4 components)
- `ProduceWorkflowManager.tsx` - Produce stage workflows
- `ProduceFlowDemo.tsx` - Produce lifecycle demo
- `GradingSystem.tsx` - Quality grading UI
- `RipenessTracking.tsx` - Ripeness monitoring
- `ProducePackaging.tsx` - Packaging workflows
- `ColdStorageManagement.tsx` - Storage tracking

#### Shared Utilities (4 components)
- `DomainFieldRenderer.tsx` - Conditional field rendering
- `DomainToggle.tsx` - Domain switcher (dev mode)
- `WasteTracking.tsx` - Waste recording
- `ValidationDemo.tsx` - Validation showcase

#### Compliance Placeholders (3 components)
- `CannabisCompliancePlaceholders.tsx` - METRC integration stubs

---

## Data Model Mapping

### Prototype Types → Platform Schema

| Prototype Interface | Platform Table | Status | Notes |
|---------------------|----------------|--------|-------|
| `IBatch` (base) | `batches` | ✅ Exists | Need to add domain_type field |
| `ICannabisBatch` | `batches` | ⚠️ Partial | Missing: lighting_schedule, thc/cbd content, drying/curing dates |
| `IProduceBatch` | `batches` | ❌ Missing | Need: grade, ripeness, brix_level, firmness, color, defect_rate, certifications |
| `ICultivar` (base) | `cultivars` | ✅ Exists | Good match |
| `ICannabisCultivar` | `cultivars` | ✅ Exists | Has strain_type, genetics, THC/CBD ranges |
| `IProduceCultivar` | `cultivars` | ⚠️ Partial | Need: category, flavor_profile, storage_days |
| `BatchEvent` | `batch_events` | ✅ Exists | Good match |
| `PlantTag` | `plant_tags` | ✅ Exists | Good match |
| `BatchPodAssignment` | `batch_pod_assignments` | ✅ Exists | Good match |
| `BatchGenealogy` | - | ❌ Missing | Need new table for parent-child tracking |
| `QualityMetric` | - | ❌ Missing | Need new table for quality history |
| `StageHistory` | `batch_events` | ⚠️ Can use | Event_type = 'stage_change' |
| `HarvestRecord` | - | ❌ Missing | Need new table for harvest workflows |

### New Tables Needed

1. **batch_genealogy** - Track parent-child batch relationships
   - batch_id, parent_batch_id, relationship_type, generation_level

2. **batch_quality_metrics** - Store quality measurements over time
   - batch_id, metric_type, value, unit, measured_at, measured_by

3. **harvest_records** - Detailed harvest workflow tracking
   - batch_id, wet_weight, dry_weight, yield_units, waste_weight, waste_reason, harvest_date, harvested_by

### Schema Enhancements Required

**batches table additions:**
```sql
-- Domain identification
domain_type TEXT CHECK (domain_type IN ('cannabis', 'produce')) DEFAULT 'cannabis'

-- Cannabis-specific
lighting_schedule TEXT -- '18/6', '12/12', '24/0'
mother_plant_id UUID REFERENCES batches(id)
clone_source_batch_id UUID REFERENCES batches(id)
thc_content DECIMAL(5,2)
cbd_content DECIMAL(5,2)
terpene_profile TEXT
drying_start_date DATE
drying_end_date DATE
curing_start_date DATE
curing_end_date DATE
packaged_date DATE

-- Produce-specific
grade TEXT CHECK (grade IN ('A', 'B', 'C', 'Premium', 'Standard', 'Processing', 'Reject'))
ripeness_score INTEGER CHECK (ripeness_score BETWEEN 1 AND 10)
brix_level DECIMAL(5,2)
firmness_score INTEGER CHECK (firmness_score BETWEEN 1 AND 10)
color_score INTEGER CHECK (color_score BETWEEN 1 AND 10)
defect_rate DECIMAL(5,2)
gap_certified BOOLEAN DEFAULT FALSE
organic_certified BOOLEAN DEFAULT FALSE
estimated_harvest_date DATE
```

**cultivars table additions:**
```sql
-- Produce-specific
category TEXT CHECK (category IN ('vegetable', 'fruit', 'herb', 'leafy_green', 'root_vegetable', 'berry', 'citrus'))
flavor_profile TEXT
storage_days INTEGER -- Shelf life
optimal_temp_min DECIMAL(5,2)
optimal_temp_max DECIMAL(5,2)
optimal_humidity_min DECIMAL(5,2)
optimal_humidity_max DECIMAL(5,2)
```

---

## Service Layer Architecture

### Prototype Services (3 files)

1. **BatchService.ts** - Full CRUD with domain filtering
   - Interface: `IBatchService` with 20+ methods
   - Implementation: `LocalStorageBatchService`
   - Features: domain-aware keys, filtering, stage transitions

2. **QualityService.ts** - Quality metrics management
   - Interface: `IQualityService`
   - Implementation: `LocalStorageQualityService`
   - Features: metric recording, history tracking, trends

3. **ComplianceService.ts** - Compliance validation
   - Interface: `IComplianceService`
   - Implementation: Mock implementation
   - Features: METRC validation, PrimusGFS checks (stubs)

### Integration Strategy

**Replace localStorage with Supabase:**
```typescript
// Current (Prototype)
const service = new LocalStorageBatchService();
const batches = await service.getAll('cannabis');

// Target (Production)
const service = new SupabaseBatchService(createClient());
const batches = await service.getAll('cannabis');
```

**Same interface, different implementation** - no component changes needed!

---

## Reusability Assessment

### ✅ Components Ready for Integration (16)

1. `CultivarManagement.tsx` - Minimal changes (swap localStorage)
2. `CultivarModal.tsx` - Needs zod validation + react-hook-form
3. `CultivarSelector.tsx` - Ready (just connect to Supabase)
4. `StageProgressBar.tsx` - Pure UI component (ready)
5. `StageHistoryTimeline.tsx` - Connect to batch_events query
6. `QualityMetricsPanel.tsx` - Connect to quality_metrics query
7. `QualityHistoryView.tsx` - Connect to quality_metrics query
8. `DomainFieldRenderer.tsx` - Ready (pure logic)
9. `DomainToggle.tsx` - Use jurisdiction context instead
10. `WasteTracking.tsx` - Connect to inventory module
11. `LocationTransfer.tsx` - Connect to pod assignments
12. `QuarantineManagement.tsx` - Connect to batch queries
13. `GradingSystem.tsx` - Ready (just connect to data)
14. `RipenessTracking.tsx` - Ready (just connect to data)
15. `HarvestWindowPredictions.tsx` - Use recipe data + environmental
16. `ValidationDemo.tsx` - Reference implementation (don't integrate)

### ⚠️ Components Needing Adaptation (10)

1. `BatchManagement.tsx` - Replace localStorage, add RBAC, use shadcn/ui
2. `BatchModal.tsx` - Use shadcn Form + zod, connect to Supabase
3. `BatchTable.tsx` - Use shadcn Table, add sorting/filtering
4. `StageTransitionModal.tsx` - Add validation logic, connect to DB
5. `CannabisWorkflowManager.tsx` - Integrate with recipe module
6. `ProduceWorkflowManager.tsx` - Integrate with recipe module
7. `DryingCuringTracking.tsx` - Connect to environmental monitoring
8. `ProducePackaging.tsx` - Integrate with inventory module
9. `ColdStorageManagement.tsx` - Integrate with monitoring module
10. `MetrcTagManagement.tsx` - Needs real METRC API (future)

### ❌ Components to Build New (6)

1. **BatchDetailView** - Comprehensive detail page (GAP identified in audit)
2. **BatchDashboard** - Overview stats and quick actions
3. **HarvestWorkflow** - Step-by-step harvest wizard
4. **BatchSplitting** - Refactor for production use
5. **BatchMerging** - Refactor for production use
6. **CannabisTestingIntegration** - Real lab integration (future Phase 15)

---

## shadcn/ui Component Mapping

| Prototype Uses | Replace With (shadcn/ui) | Available? |
|----------------|--------------------------|------------|
| Custom Card | `Card, CardHeader, CardContent` | ✅ Yes |
| Custom Button | `Button` with variants | ✅ Yes |
| Custom Input | `Input, Label` | ✅ Yes |
| Custom Select | `Select, SelectTrigger, SelectContent` | ✅ Yes |
| Custom Modal | `Dialog, DialogContent` | ✅ Yes |
| Custom Table | `Table, TableHeader, TableBody, TableRow` | ✅ Yes |
| Custom Badge | `Badge` with variants | ✅ Yes |
| Custom Form | `Form` (react-hook-form + zod) | ✅ Yes |
| Custom Tabs | `Tabs, TabsList, TabsTrigger` | ✅ Yes |
| Custom Alert | `Alert, AlertDescription` | ✅ Yes |
| Custom Progress | `Progress` | ✅ Yes |
| Custom Checkbox | `Checkbox` | ✅ Yes |
| Custom RadioGroup | `RadioGroup, RadioGroupItem` | ✅ Yes |
| Custom Tooltip | `Tooltip, TooltipTrigger, TooltipContent` | ✅ Yes |
| Custom Popover | `Popover, PopoverTrigger, PopoverContent` | ✅ Yes |

**Result**: All UI components are available - no custom UI components needed!

---

## Integration Gaps Summary

### 🚨 High Priority Gaps

1. **Data Initialization**
   - Prototype: localStorage empty → blank screens
   - Solution: Create seed data in migration 012

2. **Batch Detail View**
   - Prototype: Missing comprehensive detail page
   - Solution: Build new component with all related data

3. **Domain Type Field**
   - Prototype: Has `domainType` in types
   - Platform: Missing `domain_type` in batches table
   - Solution: Add column in migration

### 🟡 Medium Priority Gaps

4. **Modal Integration**
   - Prototype: `handleOpenComponent()` only logs
   - Solution: Implement proper modal routing in App

5. **Quality Metrics Storage**
   - Prototype: localStorage only
   - Platform: No quality_metrics table
   - Solution: Create table in migration

6. **Harvest Records**
   - Prototype: Basic yield tracking
   - Platform: No harvest_records table
   - Solution: Create table in migration

### 🟢 Low Priority Gaps

7. **Testing Integration**
   - Prototype: Placeholder component
   - Solution: Phase 15 - Lab Integration

8. **METRC Real-Time**
   - Prototype: Mock validation
   - Solution: Future - METRC API integration

9. **Genealogy Visualization**
   - Prototype: Has types but no UI
   - Solution: Build genealogy tree component

---

## Recommended Integration Approach

**Following the proven [7-Phase Integration Pattern](./integration-patterns.md)** used successfully for Inventory and Monitoring.

### Phase 1: Database Schema (1-2 days)
1. Create migration 012 with all new tables (batch_genealogy, batch_quality_metrics, harvest_records)
2. Add domain_type and domain-specific fields to batches table
3. Enhance cultivars table for produce domain
4. Create database functions for workflows (transition_batch_stage, quarantine_batch, record_harvest, get_batch_genealogy)
5. Add indexes for performance
6. Configure RLS policies
7. Seed with sample cannabis + produce data

**Deliverable**: `lib/supabase/migrations/012_batch_management_enhancement.sql` (~500 lines)

### Phase 2: Type Definitions (1 day)
1. Create `/types/batch.ts` with discriminated unions (DomainBatch = ICannabisBatch | IProduceBatch)
2. Create `/types/cultivar.ts` with domain-specific cultivar types
3. Create `/types/harvest.ts` for harvest workflows
4. Create `/types/quality.ts` for quality metrics
5. Export all from `/types/index.ts`

**Deliverable**: ~400 lines of TypeScript interfaces, enums, and type guards

### Phase 3: Database Queries (2-3 days)
1. Create `/lib/supabase/queries/batches.ts` (20+ functions following CRUD pattern)
2. Create `/lib/supabase/queries/batches-client.ts` for client-side queries
3. Create `/lib/supabase/queries/cultivars.ts` (8+ functions)
4. Create `/lib/utils/batch-validation.ts` (domain-specific rules)
5. Update `/lib/rbac/permissions.ts` with batch permissions

**Deliverable**: ~1,200 lines with comprehensive CRUD, filtering, and domain-aware operations

### Phase 4: UI Components (3-4 days)
1. Adapt `BatchManagement.tsx` → `/components/features/batches/batch-management.tsx`
2. Adapt `BatchModal.tsx` → `batch-modal.tsx` (with zod + react-hook-form)
3. Adapt `BatchTable.tsx` → `batch-table.tsx` (using shadcn/ui Table)
4. **Build NEW** `BatchDetailView` → `batch-detail.tsx` (comprehensive detail page)
5. Adapt cultivar components (CultivarManagement, CultivarModal, CultivarSelector)
6. Create `StageTransitionDialog` for workflow transitions
7. Create `HarvestWorkflow` component (step-by-step wizard)
8. Add RBAC checks with `usePermissions()` throughout
9. Add jurisdiction awareness with `useJurisdiction()` throughout

**Deliverable**: ~2,500 lines of React components using established patterns

### Phase 5: Dashboard Pages (2-3 days)
1. Create `/app/dashboard/batches/page.tsx` - main batch list with RBAC check
2. Create `/app/dashboard/batches/[id]/page.tsx` - batch detail page
3. Create `/app/dashboard/batches/new/page.tsx` - create batch wizard
4. Create `/app/dashboard/cultivars/page.tsx` - cultivar management
5. Update sidebar navigation

**Deliverable**: ~800 lines following Next.js 15 App Router patterns

### Phase 6: Module Integration (1-2 days)
1. Link batches to inventory (consumption + harvest)
2. Link batches to recipes (activation triggers)
3. Link batches to monitoring (environmental adherence)
4. Create batch health score based on quality metrics
5. Prepare for task integration (future Phase 14)

**Deliverable**: Integration points with existing modules

### Phase 7: Testing & Documentation (2-3 days)
1. Write unit tests for all query functions (95%+ coverage)
2. Write integration tests for workflows
3. Create E2E test scenarios
4. Update `/docs/current/feature-batch-management.md`
5. Update `/docs/roadmap/integration-deployment/integration-checklist.md`
6. Create user guides

**Deliverable**: Maintain 94.8%+ test pass rate, complete documentation

---

## Key Architectural Patterns

### 1. Discriminated Unions (Type Safety)
```typescript
type DomainBatch = ICannabisBatch | IProduceBatch;

function processBatch(batch: DomainBatch) {
  if (batch.domainType === 'cannabis') {
    // TypeScript knows it's ICannabisBatch
    console.log(batch.lightingSchedule); // ✅ Valid
  } else {
    // TypeScript knows it's IProduceBatch
    console.log(batch.grade); // ✅ Valid
  }
}
```

### 2. Domain-Aware Components
```typescript
// Prototype pattern (to preserve)
function BatchModal({ batch }: Props) {
  const { domain } = useDomain();
  
  return (
    <Form>
      <DomainFieldRenderer
        domain={domain}
        cannabisFields={<CannabisFields />}
        produceFields={<ProduceFields />}
      />
    </Form>
  );
}
```

### 3. Service Layer Abstraction
```typescript
// Interface stays the same across implementations
interface IBatchService {
  getAll(domain: DomainType): Promise<DomainBatch[]>;
  create(batch: DomainBatch): Promise<DomainBatch>;
}

// Swap implementations without changing components
const service: IBatchService = 
  process.env.NODE_ENV === 'development'
    ? new LocalStorageBatchService()
    : new SupabaseBatchService(createClient());
```

---

## Documentation References

- **Integration Readiness Audit**: `/Prototypes/BatchManagementPrototype/INTEGRATION_READINESS_AUDIT.md`
- **Agent Instructions**: `/Prototypes/BatchManagementPrototype/AgentInstructions.md`
- **Type System Docs**: `/Prototypes/BatchManagementPrototype/unified/docs/TYPE_SYSTEM.md`
- **Backend Integration**: `/Prototypes/BatchManagementPrototype/unified/docs/BACKEND_INTEGRATION.md`
- **Integration Plan**: `/docs/roadmap/planning-progress/IntegrationPlan.xml` (Phase 1-8)

---

## Next Steps

1. ✅ Complete this analysis document
2. ⏭️ Create schema mapping document (Step 0.2)
3. ⏭️ Begin database enhancement (Step 1.1)

---

**Analysis Complete**: November 12, 2025  
**Ready for**: Step 0.2 - Platform Schema Review
