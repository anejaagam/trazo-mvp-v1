# Batch Management Feature

**Navigation:** [← Back to Current Status](../index.md)

---

## Overview

Complete batch management system with domain-specific support for cannabis and produce operations, lifecycle stage tracking, quality metrics, genealogy, and compliance integration. Phase 3 frontend integration in progress with core UI components completed.

**Status:** 🟡 Phase 3 IN PROGRESS (70% Complete)  
**Started:** November 2025  
**Expected Completion:** November 2025  
**Total Files:** 15+ files (~50 KB so far)

---

## Architecture

### Database Schema (Phase 1 - ✅ Complete)

**Migration:** `20251114010000_batch_domain_enhancement.sql`

**Tables Enhanced (2):**
- `batches` - Enhanced with domain_type discriminator and domain-specific fields
- `cultivars` - Enhanced with produce-specific fields (category, storage, etc.)

**Tables Created (4):**
- `batch_genealogy` - Parent-child batch relationships (clones, splits, merges)
- `batch_quality_metrics` - Quality tracking history over time
- `batch_stage_history` - Lifecycle stage transitions with audit trail
- `harvest_records` - Harvest data, yields, and waste tracking

**Domain-Specific Fields:**

**Cannabis Fields:**
- `lighting_schedule` - Light cycles (18/6, 12/12, 24/0)
- `thc_content`, `cbd_content` - Cannabinoid percentages
- `terpene_profile` - Terpene analysis (JSON)
- `drying_date`, `curing_date` - Post-harvest processing dates

**Produce Fields:**
- `grade` - Quality grades (A, B, C, culled)
- `ripeness` - Ripeness levels (unripe, turning, ripe, overripe)
- `brix_level` - Sugar content measurement
- `firmness`, `color`, `defect_rate` - Quality metrics
- `certifications` - Organic, GAP, PrimusGFS (JSON)
- `storage_temp_c`, `storage_humidity_pct` - Storage requirements

**Functions Created (5):**
- `transition_batch_stage()` - Validate and record stage changes
- `quarantine_batch()` - Place batches in quarantine
- `release_from_quarantine()` - Release from quarantine
- `get_batch_genealogy()` - Retrieve ancestry tree
- `calculate_quality_score()` - Aggregate quality metrics

**Indexes Created (7):**
- Performance optimization for batch queries
- Domain type, stage, status, cultivar lookups
- Genealogy relationship traversal

**RLS Policies (6):**
- Organization-scoped access
- Site-based filtering
- Role-based permissions

---

### TypeScript Types (Phase 2 - ✅ Complete)

**File:** `/types/batch.ts` (14,016 bytes)

**Core Types:**
- `Batch` - Base batch interface with common fields
- `CannabisBatch` - Cannabis-specific batch extending Batch
- `ProduceBatch` - Produce-specific batch extending Batch
- `DomainBatch` - Discriminated union type (CannabisBatch | ProduceBatch)

**Enums & Unions:**
- `DomainType`: `'cannabis' | 'produce'`
- `BatchStatus`: `'active' | 'quarantined' | 'completed' | 'destroyed'`
- `CannabisStage`: 11 stages (planning → germination → vegetative → flowering → harvest → drying → curing → packaging → completed)
- `ProduceStage`: 13 stages (planning → seeding → growing → harvest_ready → harvesting → washing → grading → packing → storage → shipped → completed)
- `ProduceGrade`: `'A' | 'B' | 'C' | 'culled'`
- `ProduceRipeness`: `'unripe' | 'turning' | 'ripe' | 'overripe'`

**Type Guards:**
- `isCannabisBatch()` - Type-safe cannabis batch check
- `isProduceBatch()` - Type-safe produce batch check
- `isCannabisStage()` - Validate cannabis stages
- `isProduceStage()` - Validate produce stages

**Additional Types:**
- `Cultivar`, `CannabisCultivar`, `ProduceCultivar`
- `BatchGenealogy`, `BatchQualityMetric`, `BatchStageHistory`, `HarvestRecord`
- `BatchFilters` - Comprehensive filtering interface

**Features:**
- 100% type-safe with discriminated unions
- Zero `any` types
- Full domain-specific field coverage
- Matches database schema exactly

---

### Database Queries (Phase 2 - ✅ Complete)

**Server Queries:** `/lib/supabase/queries/batches.ts` (15,552 bytes)  
**Client Queries:** `/lib/supabase/queries/batches-client.ts` (3,491 bytes)

**Batch CRUD Operations:**
- `getBatches(orgId, siteId, filters)` - List batches with advanced filtering
- `getBatchById(id)` - Get single batch with full details
- `createBatch(data)` - Create new batch with domain validation
- `updateBatch(id, updates)` - Partial batch updates
- `deleteBatch(id)` - Soft delete (status → destroyed)

**Lifecycle Management:**
- `transitionBatchStage(batchId, newStage, userId)` - Stage transitions with validation
- `quarantineBatch(batchId, reason, userId)` - Quarantine with reason
- `releaseFromQuarantine(batchId, userId)` - Release from quarantine
- `updatePlantCount(batchId, newCount, userId)` - Update counts

**Harvest & Assignment:**
- `recordHarvest(batchId, harvestData, userId)` - Record harvest yields
- `assignBatchToPod(batchId, podId, plantCount, userId)` - Location assignment

**Genealogy & Quality:**
- `getBatchGenealogy(batchId)` - Ancestry tree
- `getBatchQualityHistory(batchId)` - Quality metrics over time
- `addQualityMetric(batchId, metricData, userId)` - Record quality data

**Filtering & Queries:**
- `getBatchesByStage(stage, orgId, siteId)` - Stage-specific batches
- `getBatchesByCultivar(cultivarId, orgId)` - Cultivar-specific batches
- `getActiveBatches(orgId, siteId)` - Active batches only

**Filtering Support:**
- `domain_type`: cannabis | produce
- `stage`: single or array of stages
- `status`: active, quarantined, completed, destroyed
- `cultivar_id`: UUID or array
- `search`: batch_number, cultivar_name
- `date_range`: start_date filtering

**Cultivar Queries:** `/lib/supabase/queries/cultivars.ts` (7,089 bytes)
- `getCultivars(orgId, domainType, filters)` - List cultivars
- `getCultivarById(id)` - Get single cultivar
- `createCultivar(data)` - Create new cultivar
- `updateCultivar(id, data)` - Update cultivar
- `deleteCultivar(id)` - Delete cultivar
- `getCultivarUsageStats(cultivarId)` - Usage statistics

---

### RBAC Permissions (Phase 2 - ✅ Complete)

**Batch Permissions (8):**
- `batch:view` - View batch information
- `batch:create` - Create new batches
- `batch:update` - Edit batch details
- `batch:delete` - Delete batches
- `batch:stage_change` - Transition between stages
- `batch:quarantine` - Quarantine/release batches
- `batch:harvest` - Record harvest data
- `batch:assign_pod` - Assign to locations

**Cultivar Permissions (4):**
- `cultivar:view` - View cultivars
- `cultivar:create` - Create cultivars
- `cultivar:edit` - Edit cultivars
- `cultivar:delete` - Delete cultivars

**Role Mappings:**
- **Operator:** batch:view, batch:create, cultivar:view
- **Head Grower:** All batch + cultivar permissions
- **Site Manager:** All batch + cultivar permissions
- **Compliance QA:** batch:view, batch:quarantine

---

### Validation Utilities (Phase 2 - ✅ Complete)

**File:** `/lib/utils/batch-validation.ts` (12,318 bytes)

**Validators:**
- `validateBatchCreation(data, domainType)` - Domain-specific batch creation rules
- `validateStageTransition(currentStage, newStage, domainType)` - Valid stage flows
- `validatePlantCount(count, domainType, jurisdiction)` - Jurisdiction-based limits
- `validateHarvestData(harvestData, batch)` - Harvest workflow validation

**Cannabis Validations:**
- Minimum plant counts (jurisdiction-based)
- Valid lighting schedules
- THC/CBD ranges (0-100%)
- METRC field requirements

**Produce Validations:**
- Grade enums (A, B, C, culled)
- Ripeness ranges
- Brix levels (sugar content)
- GAP/Organic certification requirements

---

### Frontend Components (Phase 3 - 🟡 70% Complete)

#### Core Components (4 components - ✅ Complete)

**1. `batch-management.tsx`** (12,117 bytes)
- Main batch management interface
- Stats cards: Total batches, active, plant/unit count, quarantined
- Advanced filtering: Domain, status, stage
- Search by batch number
- RBAC-protected create button
- Real-time data refresh
- Empty state handling

**2. `batch-table.tsx`** (7,549 bytes)
- Domain-aware table with dynamic columns
- Columns: Batch #, Cultivar, Domain, Stage, Count, Started, Status
- Actions dropdown: View, Edit, Delete
- Stage badges with color coding
- Quarantine status indicators
- RBAC-protected actions
- Click-to-view details

**3. `batch-modal.tsx`** (5,378 bytes)
- Create/Edit batch dialog
- Domain selection (cannabis/produce)
- Batch number input
- Plant/unit count
- Initial stage selection
- Form validation
- Error handling

**4. `batch-detail-dialog.tsx`** (10,001 bytes)
- Comprehensive batch view with tabs
- **Overview Tab:**
  - Current status and stage
  - Quarantine alerts
  - Plant/unit count
  - Start date
  - Site information
- **Details Tab:**
  - Domain-specific fields
  - Cannabis: Lighting, THC/CBD
  - Produce: Grade, ripeness, Brix
- **History Tab:**
  - Batch timeline
  - Stage transitions (planned)
  - Quality metrics history (planned)

#### Dashboard Pages (4 pages - ✅ Complete)

**1. `/app/dashboard/batches/page.tsx`**
- Main batch list with RBAC checks
- Renders BatchManagement component
- Dev mode compatible

**2. `/app/dashboard/batches/active/page.tsx`**
- Active batches view
- Same functionality as main page
- Filtered for active status

**3. `/app/dashboard/batches/planning/page.tsx`**
- Placeholder for batch planning
- Coming soon card

**4. `/app/dashboard/batches/harvest/page.tsx`**
- Placeholder for harvest queue
- Coming soon card

#### Advanced Components (4 components - ⏳ Pending)

**Planned Components:**
- `cultivar-management.tsx` - Cultivar grid with cards
- `stage-transition-dialog.tsx` - Stage transition workflow with validation
- `harvest-workflow.tsx` - Multi-step harvest wizard
- `quality-metrics-panel.tsx` - Quality metric entry and visualization

---

### Seed Data (Phase 3 - ✅ Complete)

**File:** `/lib/supabase/seed-batch-data.ts` (9,375 bytes)

**Cultivars (6 total):**

**Cannabis (3):**
- Blue Dream (hybrid, 65 days, 450g yield)
- OG Kush (indica-dominant, 55 days, 400g yield)
- Sour Diesel (sativa-dominant, 70 days, 500g yield)

**Produce (3):**
- Roma Tomato (vegetable, 75 days, 8kg yield)
- Butterhead Lettuce (leafy green, 50 days, 12kg yield)
- Basil Sweet Genovese (herb, 60 days, 5kg yield)

**Batches (9 total):**

**Cannabis (5):**
1. Blue Dream - Flowering stage, 48 plants, week 5
2. OG Kush - Vegetative, 96 plants, 18/6 lighting
3. Sour Diesel - Drying, 60 plants, 27.5kg harvested
4. Blue Dream - Clone stage, 200 clones, rooting
5. OG Kush - Vegetative, QUARANTINED (powdery mildew suspicion)

**Produce (4):**
1. Roma Tomato - Growing, 500 plants, fruit development
2. Butterhead Lettuce - Harvest ready, 1200 plants, Grade A
3. Basil - Growing, 800 plants, aromatic
4. Roma Tomato - Packing, 400 plants, 3200kg harvested, Grade A

**Seed Script Integration:**
- Updated `scripts/seed-dev-db.ts` to include batch seeding
- `seedCultivars()` - Insert 6 cultivars
- `seedBatches()` - Insert 9 batches
- Verification checks for both tables

---

## User Workflows

### Cannabis Workflow
1. **Create Batch** → Select cannabis domain → Choose cultivar → Set initial stage (propagation/clone/vegetative)
2. **Stage Progression** → Clone → Vegetative (18/6) → Flowering (12/12) → Harvest → Drying → Curing → Packaging
3. **Harvest** → Record wet weight → Record yield → Transition to drying
4. **Quality Tracking** → Record THC/CBD → Terpene analysis → Final grade
5. **Compliance** → METRC integration → License tracking → Genealogy records

### Produce Workflow
1. **Create Batch** → Select produce domain → Choose cultivar → Set initial stage (seeding/transplant)
2. **Stage Progression** → Seeding → Growing → Harvest Ready → Harvesting → Washing → Grading → Packing → Storage → Shipped
3. **Harvest** → Record weight → Grade quality → Measure Brix → Assess firmness/color
4. **Quality Tracking** → Ripeness monitoring → Defect rate → Storage conditions
5. **Compliance** → GAP certification → Organic tracking → PrimusGFS

---

## Integration Points

### Module Integrations (Phase 4 - ✅ Inventory & Recipes complete, Monitoring in-progress)

**Inventory Integration:**
- ✅ Batch creation automatically logs seed/clone consumption through `issueInventoryForBatch`.
- ✅ Harvest workflow (`harvest-workflow.tsx`) records finished goods via `/api/inventory/receive`.
- ✅ `getBatchInventoryUsage()` aggregates `inventory_movements` so batch detail inventory tabs show consumption/production with summaries.

**Recipe Integration:**
- ✅ Active recipes hydrate batch detail + monitoring views via `recipe_activations` joins.
- ✅ `ApplyRecipeDialog` lets operators activate recipes on-demand.
- ✅ `syncPodAndBatchRecipes` mirrors recipes between pods and batches during assignments, and `/api/recipes/advance-stage` keeps recipe stages aligned with batch stage transitions.

**Monitoring Integration:**
- ✅ Pod detail pages highlight assigned batch metadata, health score, adherence badges, and stage timelines sourced from `getActiveBatchesForPod`.
- ⏳ Remaining: link batch stages directly to alarm thresholds/RBAC notifications.

**Future Task Integration:**
- Add `batch_id` FK to tasks table
- Auto-generate tasks on stage transitions
- SOP linking for harvest workflows

---

## Testing Status

### Unit Tests (⏳ Pending)
- [ ] Batch query functions
- [ ] Cultivar query functions
- [ ] Validation utilities
- [ ] RBAC permissions
- [ ] Type guards

### Integration Tests (⏳ Pending)
- [ ] Batch creation workflow
- [ ] Stage transition workflow
- [ ] Harvest workflow
- [ ] Quarantine/release workflow
- [ ] Batch-recipe linking
- [ ] Batch-inventory integration

### Manual Testing (⏳ In Progress)
- [ ] Test with seeded data in dev mode
- [ ] Verify cannabis workflow end-to-end
- [ ] Verify produce workflow end-to-end
- [ ] Test RBAC permissions (operator, head grower, compliance)
- [ ] Test domain switching
- [ ] Screenshot batch management UI

---

## Performance Considerations

**Database:**
- Indexes on frequently queried fields (domain_type, stage, status)
- Genealogy relationship indexes for ancestry queries
- Stage history indexed for timeline views

**Frontend:**
- Client-side filtering for responsive UX
- Pagination for large batch lists (planned)
- Lazy loading for batch details
- Cached cultivar lookups

---

## Known Gaps & Future Enhancements

**Current Gaps (from prototype audit):**
1. ✅ **FIXED:** No data initialization - Seed data created
2. ⏳ **Partial:** Modal integration incomplete - Basic modals done, advanced pending
3. ⏳ **Pending:** Batch detail view - Basic view done, needs enhancement
4. ⏳ **Pending:** Validation enforcement - Display working, form blocking needed
5. ⏳ **Pending:** Stage transition history tracking - Database ready, UI pending

**Future Enhancements:**
- Batch splitting/merging workflows
- Mother plant management
- Cannabis testing integration (labs, COAs)
- Produce cold storage management
- Ripeness prediction algorithms
- Batch planning/capacity tools
- Photo evidence uploads
- Advanced quality charts
- Genealogy tree visualization
- Export to METRC/CTLS

---

## Files Summary

### Database (Phase 1)
- `supabase/migrations/20251114010000_batch_domain_enhancement.sql` - Schema migration

### Types (Phase 2)
- `types/batch.ts` (14,016 bytes) - All TypeScript types

### Queries (Phase 2)
- `lib/supabase/queries/batches.ts` (15,552 bytes) - Server-side queries
- `lib/supabase/queries/batches-client.ts` (3,491 bytes) - Client-side queries
- `lib/supabase/queries/cultivars.ts` (7,089 bytes) - Cultivar queries

### Utilities (Phase 2)
- `lib/utils/batch-validation.ts` (12,318 bytes) - Validation functions

### Components (Phase 3)
- `components/features/batches/batch-management.tsx` (12,117 bytes)
- `components/features/batches/batch-table.tsx` (7,549 bytes)
- `components/features/batches/batch-modal.tsx` (5,378 bytes)
- `components/features/batches/batch-detail-dialog.tsx` (10,001 bytes)

### Pages (Phase 3)
- `app/dashboard/batches/page.tsx` (2,216 bytes)
- `app/dashboard/batches/active/page.tsx` (2,230 bytes)
- `app/dashboard/batches/planning/page.tsx` (1,747 bytes)
- `app/dashboard/batches/harvest/page.tsx` (1,771 bytes)

### Seed Data (Phase 3)
- `lib/supabase/seed-batch-data.ts` (9,375 bytes) - Sample data
- `scripts/seed-dev-db.ts` - Updated with batch seeding

**Total:** 15 files, ~108 KB, 5,000+ lines of code

---

## Next Steps

1. **Complete Advanced Components (1-2 days)**
   - Cultivar management UI
   - Stage transition dialog with validation
   - Harvest workflow wizard
   - Quality metrics panel

2. **Module Integration (2-3 days)**
   - Connect batch harvest to inventory
   - Display active recipes in batch detail
   - Show environmental monitoring data
   - Link batch lifecycle to task generation

3. **Testing & Polish (1-2 days)**
   - Write unit tests
   - Manual end-to-end testing
   - Fix bugs and edge cases
   - UI polish and error handling

4. **Documentation & Deployment (1 day)**
   - User guides for workflows
   - API documentation
   - Troubleshooting guide
   - Deploy to staging

**Estimated Completion:** 1 week (November 2025)

---

**Last Updated:** November 14, 2025  
**Status:** Phase 3 - 70% Complete  
**Next Review:** After advanced components completion
