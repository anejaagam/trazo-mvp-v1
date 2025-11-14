# Batch Management Prototype Component Mapping

## Analysis Date: 2025-11-13
## Status: Phase 0 Documentation Alignment ✅

---

## Overview

This document provides a comprehensive mapping of the BatchManagementPrototype (Produce variant) to the TRAZO MVP integration structure. It follows the proven 7-phase integration pattern and aligns with TRAZO's architecture patterns.

**Prototype Location:** `/Prototypes/BatchManagementPrototype/produce/`  
**Total Components:** 20 main components (6,080 lines)  
**Total Types:** 8 type files (680 lines)  
**Integration Target:** Phase 12 (Batch Management)

---

## Component Inventory

### Tier 1: Core Batch Management (Priority: HIGH)

| Prototype Component | Lines | Target Location | shadcn/ui Components | Phase |
|-------------------|-------|----------------|---------------------|-------|
| `BatchDashboard.tsx` | 139 | `/components/features/batch/batch-list.tsx` | Card, Badge, Input, Button | 4 |
| `BatchDetailView.tsx` | 279 | `/components/features/batch/batch-detail.tsx` | Card, Tabs, Badge, Button | 4 |
| `CreateBatchDialog.tsx` | 170 | `/components/features/batch/batch-form.tsx` | Dialog, Form, Input, Select | 4 |
| `BatchMetricsPanel.tsx` | 125 | `/components/features/batch/batch-metrics.tsx` | Card, Badge | 4 |
| `BatchTimeline.tsx` | 95 | `/components/features/batch/batch-timeline.tsx` | Card, ScrollArea, Badge | 4 |

**Total Lines:** 808 lines

### Tier 2: Workflow Components (Priority: HIGH)

| Prototype Component | Lines | Target Location | shadcn/ui Components | Phase |
|-------------------|-------|----------------|---------------------|-------|
| `BatchStageTransition.tsx` | 261 | `/components/features/batch/stage-transition.tsx` | Dialog, Select, Textarea, Button | 4 |
| `HarvestWorkflow.tsx` | 490 | `/components/features/batch/harvest-workflow.tsx` | Card, Checkbox, Input, Button | 4 |
| `PlantTaggingWorkflow.tsx` | 512 | `/components/features/batch/plant-tagging.tsx` | Card, Input, Badge, Button | 4 |
| `PostHarvestProcessing.tsx` | 568 | `/components/features/batch/post-harvest.tsx` | Tabs, Card, Input, Select | 4 |
| `WasteDisposalWorkflow.tsx` | 522 | `/components/features/batch/waste-disposal.tsx` | Card, Select, Input, Textarea | 4 |

**Total Lines:** 2,353 lines

### Tier 3: Management Components (Priority: MEDIUM)

| Prototype Component | Lines | Target Location | shadcn/ui Components | Phase |
|-------------------|-------|----------------|---------------------|-------|
| `CultivarManagement.tsx` | 443 | `/components/features/batch/cultivar-manager.tsx` | Card, Dialog, Form, Table | 4 |
| `BatchCollectionManagement.tsx` | 202 | `/components/features/batch/batch-collections.tsx` | Card, Checkbox, Badge | 4 |
| `BulkBatchOperations.tsx` | 286 | `/components/features/batch/bulk-operations.tsx` | Card, Checkbox, Select | 4 |
| `QuarantineManagement.tsx` | 225 | `/components/features/batch/quarantine.tsx` | Card, Dialog, Textarea | 4 |
| `RoomCapacityMonitor.tsx` | 204 | `/components/features/batch/room-capacity.tsx` | Card, Progress, Badge | 4 |

**Total Lines:** 1,360 lines

### Tier 4: Supporting Components (Priority: MEDIUM)

| Prototype Component | Lines | Target Location | shadcn/ui Components | Phase |
|-------------------|-------|----------------|---------------------|-------|
| `BatchGenealogyView.tsx` | 111 | `/components/features/batch/genealogy-view.tsx` | Card, Badge | 4 |
| `PlantCountTracking.tsx` | 219 | `/components/features/batch/plant-count.tsx` | Card, Input, Table | 4 |
| `EvidenceCapture.tsx` | 159 | `/components/features/batch/evidence-capture.tsx` | Card, Input, Button | 4 |
| `WasteLogDashboard.tsx` | 392 | `/components/features/batch/waste-logs.tsx` | Card, Table, Badge, Button | 4 |

**Total Lines:** 881 lines

### Tier 5: Compliance (Priority: LOW - Future)

| Prototype Component | Lines | Target Location | Notes | Phase |
|-------------------|-------|----------------|-------|-------|
| `ComplianceDashboard.tsx` | 678 | `/components/features/compliance/primusgfs-dashboard.tsx` | PrimusGFS-specific, defer to Phase 14 | 14 |

**Total Lines:** 678 lines

---

## Type System Mapping

### Type Files Analysis

| Prototype Type File | Lines | Target Location | Description |
|-------------------|-------|----------------|-------------|
| `batch.ts` | 72 | `/types/batch.ts` | Core batch types (merge with existing) |
| `harvest.ts` | 35 | `/types/batch.ts` | Harvest record types |
| `waste.ts` | 43 | `/types/batch.ts` | Waste disposal types |
| `cultivar.ts` | 27 | `/types/batch.ts` | Variety/genealogy types |
| `plant-tracking.ts` | 37 | `/types/batch.ts` | Plant count snapshot types |
| `post-harvest.ts` | 69 | `/types/batch.ts` | Drying/curing/packaging types |
| `tagging.ts` | 39 | `/types/batch.ts` | Plant labeling types |
| `compliance.ts` | 358 | `/types/compliance.ts` | PrimusGFS types (Phase 14) |

**Strategy:** Consolidate all non-compliance types into single `/types/batch.ts` file (~322 lines). Keep `compliance.ts` separate for future Phase 14.

### Key Type Definitions to Implement

```typescript
// Core Batch Types
export type BatchStage = 'propagation' | 'vegetative' | 'flowering' | 'harvest' | 'post_harvest'
export type QuarantineStatus = 'none' | 'quarantined' | 'released'

export interface Batch {
  id: string
  name: string
  variety: string
  varietyId?: string
  stage: BatchStage
  startDate: string
  growingAreaIds: string[]
  plantCount: number
  quarantineStatus: QuarantineStatus
  quarantineReason?: string
  yieldData?: YieldData
  stageHistory?: StageHistoryEntry[]
  // Multi-tenancy fields
  org_id: string
  site_id: string
  created_at: string
  updated_at: string
  is_active: boolean
}

// Harvest Types
export interface HarvestRecord {
  id: string
  batchId: string
  plantIds: string[]
  wetWeight: number
  timestamp: string
  harvestedBy: string
  // ... more fields
}

// Waste Types
export interface WasteLog {
  id: string
  batchId?: string
  wasteType: 'plant' | 'flower' | 'trim' | 'other'
  quantity: number
  reason: WasteReason
  method: WasteMethod
  status: 'pending_approval' | 'approved' | 'rejected'
  // ... more fields
}

// Cultivar Types
export interface ProduceVariety {
  id: string
  name: string
  type: string
  description?: string
  genealogy?: GenealogyRecord
  // ... more fields
}
```

---

## Database Schema Requirements

### Phase 1: Database Schema

#### Core Tables

**1. batches** (extends existing structure)
```sql
CREATE TABLE batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variety TEXT NOT NULL,
  variety_id UUID REFERENCES cultivars(id),
  stage TEXT NOT NULL CHECK (stage IN ('propagation', 'vegetative', 'flowering', 'harvest', 'post_harvest')),
  start_date DATE NOT NULL,
  plant_count INTEGER NOT NULL DEFAULT 0,
  quarantine_status TEXT NOT NULL DEFAULT 'none' CHECK (quarantine_status IN ('none', 'quarantined', 'released')),
  quarantine_reason TEXT,
  quarantined_at TIMESTAMPTZ,
  quarantined_by UUID REFERENCES users(id),
  collection_id UUID REFERENCES batch_collections(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);
```

**2. cultivars** (produce varieties)
```sql
CREATE TABLE cultivars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES cultivars(id),
  source TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**3. batch_collections** (for organizing batches; note: batch_groups exists for recipe pod grouping)
```sql
CREATE TABLE batch_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);
```

**4. growing_areas**
```sql
CREATE TABLE growing_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('greenhouse', 'indoor', 'field', 'nursery')),
  capacity INTEGER NOT NULL,
  current_occupancy INTEGER DEFAULT 0,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**5. batch_stage_history**
```sql
CREATE TABLE batch_stage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  transitioned_by UUID REFERENCES users(id),
  notes TEXT
);
```

**6. harvest_records**
```sql
CREATE TABLE harvest_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wet_weight DECIMAL(10, 2) NOT NULL,
  plant_count INTEGER NOT NULL,
  harvested_at TIMESTAMPTZ NOT NULL,
  harvested_by UUID REFERENCES users(id),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**7. plant_count_snapshots**
```sql
CREATE TABLE plant_count_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  plant_count INTEGER NOT NULL,
  stage TEXT NOT NULL,
  counted_at TIMESTAMPTZ NOT NULL,
  counted_by UUID REFERENCES users(id),
  notes TEXT
);
```

**8. waste_logs** (extends existing structure)
```sql
CREATE TABLE waste_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id),
  waste_type TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  reason TEXT NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected')),
  submitted_by UUID REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  disposed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**9. post_harvest_records**
```sql
CREATE TABLE post_harvest_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  process_type TEXT NOT NULL CHECK (process_type IN ('drying', 'curing', 'packaging')),
  start_weight DECIMAL(10, 2),
  end_weight DECIMAL(10, 2),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  location TEXT,
  performed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**10. plant_tags** (for Metrc compliance)
```sql
CREATE TABLE plant_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tag_number TEXT NOT NULL UNIQUE,
  plant_id TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'destroyed')),
  assigned_at TIMESTAMPTZ,
  assigned_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Indexes for Performance

```sql
CREATE INDEX idx_batches_org_site ON batches(org_id, site_id) WHERE is_active = true;
CREATE INDEX idx_batches_stage ON batches(stage) WHERE is_active = true;
CREATE INDEX idx_batches_quarantine ON batches(quarantine_status) WHERE quarantine_status != 'none';
CREATE INDEX idx_batches_group ON batches(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_harvest_records_batch ON harvest_records(batch_id);
CREATE INDEX idx_waste_logs_status ON waste_logs(status) WHERE status = 'pending_approval';
CREATE INDEX idx_plant_tags_batch ON plant_tags(batch_id) WHERE status = 'assigned';
```

#### RLS Policies

```sql
-- batches
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org batches"
  ON batches FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org batches"
  ON batches FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- Similar policies for all other tables...
```

---

## Business Logic to Preserve

### Batch Lifecycle Management

1. **Stage Progression Rules**
   - Propagation → Vegetative → Flowering → Harvest → Post-Harvest
   - Stage transitions require authorization (cultivation_tech or higher)
   - Stage history tracked for audit
   - Plant count must be positive for transition

2. **Quarantine Workflow**
   - Only compliance_manager can quarantine/release batches
   - Quarantined batches cannot transition stages
   - Quarantine requires reason and authorization
   - Release requires manager approval and notes

3. **Plant Count Tracking**
   - Manual snapshots at key events (transplant, cull, harvest)
   - Automatic snapshot on stage transition
   - Plant count cannot increase (except propagation stage)
   - Alert if count decreases >10% without waste log

### Harvest Workflow (SOP-002)

1. **Pre-Harvest Checks**
   - Batch must be in 'harvest' stage
   - Plant count > 0
   - Growing area capacity verified

2. **Harvest Recording**
   - Select plants to harvest (individual or bulk)
   - Record wet weight
   - Capture harvest date/time
   - Assign to drying room
   - Update plant count
   - Create harvest record

3. **Post-Harvest Transition**
   - Batch moves to 'post_harvest' stage
   - Drying process begins
   - Track weight loss during drying
   - Record final dry weight
   - Move to curing (optional)
   - Final packaging

### Waste Disposal Workflow

1. **Waste Log Creation**
   - Technician creates waste log
   - Select waste type (plant, flower, trim, other)
   - Enter quantity and unit
   - Select reason (culling, disease, quality, etc.)
   - Select disposal method (composting, trash, etc.)
   - Status: 'pending_approval'

2. **Approval Process**
   - Compliance manager reviews log
   - Can approve or reject with notes
   - Approved logs reported to traceability system
   - Rejected logs require correction and resubmission

### Plant Tagging Workflow (SOP-001) - Metrc Only

1. **Tag Assignment**
   - Required for Oregon/Maryland (Metrc jurisdictions)
   - Not required for Canada or PrimusGFS
   - Assign tags during vegetative stage
   - Track tag lifecycle (available → assigned → destroyed)
   - One tag per plant (for individual tracking)

2. **Tag Validation**
   - Tag number format validation
   - Duplicate detection
   - Tag inventory management
   - Lost/damaged tag reporting

---

## RBAC Integration

### Required Permissions

```typescript
// Add to /lib/rbac/permissions.ts
export const BATCH_PERMISSIONS = {
  // Batch management
  'batch:view': ['org_admin', 'facility_manager', 'cultivation_tech', 'compliance_manager'],
  'batch:create': ['org_admin', 'facility_manager', 'cultivation_tech'],
  'batch:edit': ['org_admin', 'facility_manager', 'cultivation_tech'],
  'batch:delete': ['org_admin', 'facility_manager'],
  'batch:transition': ['org_admin', 'facility_manager', 'cultivation_tech'],
  
  // Quarantine (compliance only)
  'batch:quarantine': ['org_admin', 'compliance_manager'],
  'batch:release': ['org_admin', 'compliance_manager'],
  
  // Harvest operations
  'harvest:record': ['org_admin', 'facility_manager', 'cultivation_tech'],
  'harvest:view': ['org_admin', 'facility_manager', 'cultivation_tech', 'compliance_manager'],
  
  // Waste management
  'waste:create': ['org_admin', 'facility_manager', 'cultivation_tech'],
  'waste:approve': ['org_admin', 'compliance_manager'],
  'waste:view': ['org_admin', 'facility_manager', 'cultivation_tech', 'compliance_manager'],
  
  // Cultivar management
  'cultivar:view': ['org_admin', 'facility_manager', 'cultivation_tech'],
  'cultivar:manage': ['org_admin', 'facility_manager'],
}
```

### Component-Level Guards

```typescript
// Example: BatchDashboard.tsx
import { usePermissions } from '@/hooks/use-permissions'

export function BatchDashboard() {
  const { can } = usePermissions()
  
  if (!can('batch:view')) {
    return <UnauthorizedMessage />
  }
  
  return (
    <div>
      {/* Dashboard content */}
      {can('batch:create') && (
        <Button onClick={onCreateBatch}>Create Batch</Button>
      )}
    </div>
  )
}
```

---

## Jurisdiction Integration

### Jurisdiction-Specific Features

```typescript
import { useJurisdiction } from '@/hooks/use-jurisdiction'

export function CreateBatchForm() {
  const { jurisdiction } = useJurisdiction()
  
  // Plant tagging only for Metrc jurisdictions
  const requiresPlantTagging = ['Oregon', 'Maryland'].includes(jurisdiction?.name || '')
  
  // PrimusGFS compliance fields
  const requiresPrimusGFS = jurisdiction?.type === 'PrimusGFS'
  
  return (
    <Form>
      {/* Standard fields */}
      
      {requiresPlantTagging && (
        <TaggingConfigSection />
      )}
      
      {requiresPrimusGFS && (
        <ComplianceSection />
      )}
    </Form>
  )
}
```

### Jurisdiction Matrix

| Feature | Oregon (Metrc) | Maryland (Metrc) | Canada (CTLS) | PrimusGFS |
|---------|---------------|------------------|---------------|-----------|
| Plant Tagging | Required | Required | Optional | Not Required |
| Waste Approval | Required | Required | Required | Recommended |
| Batch Genealogy | Required | Required | Optional | Optional |
| Quarantine | Required | Required | Required | Required |
| Post-Harvest | Optional | Optional | Optional | Required |
| Compliance Dashboard | Metrc | Metrc | CTLS | PrimusGFS |

---

## Integration Patterns

### Server Component Pattern

```typescript
// app/dashboard/batches/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canPerformAction } from '@/lib/rbac/guards'
import { BatchList } from '@/components/features/batch/batch-list'

export const metadata = {
  title: 'Batch Management | TRAZO',
  description: 'Manage your cultivation batches',
}

export default async function BatchesPage() {
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
  
  if (!canPerformAction(userData?.role || '', 'batch:view')) {
    redirect('/dashboard')
  }
  
  return <BatchList />
}
```

### Client Component with Hooks

```typescript
// components/features/batch/batch-list.tsx
'use client'

import { usePermissions } from '@/hooks/use-permissions'
import { useJurisdiction } from '@/hooks/use-jurisdiction'
import { isDevModeActive } from '@/lib/dev-mode'

export function BatchList() {
  const { can } = usePermissions()
  const { jurisdiction } = useJurisdiction()
  const devMode = isDevModeActive()
  
  // Load data from Supabase or mock data in dev mode
  const batches = devMode ? MOCK_BATCHES : useBatches()
  
  return (
    <div>
      {/* Batch list content */}
    </div>
  )
}
```

### Database Query Pattern

```typescript
// lib/supabase/queries/batches.ts
import { createClient } from '@/lib/supabase/server'
import type { Batch, BatchFilters } from '@/types/batch'

export async function getBatches(siteId: string, filters?: BatchFilters) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('batches')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
    
    if (filters?.stage) {
      query = query.eq('stage', filters.stage)
    }
    
    if (filters?.quarantined) {
      query = query.eq('quarantine_status', 'quarantined')
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getBatches:', error)
    return { data: null, error }
  }
}
```

---

## Mock Data Structure

### Sample Batch

```typescript
{
  id: 'batch-001',
  name: 'Tomato-001',
  variety: 'Cherry Tomato',
  varietyId: 'cultivar-001',
  stage: 'flowering',
  startDate: '2025-11-01',
  growingAreaIds: ['room-001'],
  plantCount: 50,
  quarantineStatus: 'none',
  org_id: 'org-001',
  site_id: 'site-001',
  created_at: '2025-11-01T08:00:00Z',
  stageHistory: [
    {
      stage: 'propagation',
      startedAt: '2025-11-01T08:00:00Z',
      endedAt: '2025-11-08T10:00:00Z',
    },
    {
      stage: 'vegetative',
      startedAt: '2025-11-08T10:00:00Z',
      endedAt: '2025-11-22T14:00:00Z',
    },
    {
      stage: 'flowering',
      startedAt: '2025-11-22T14:00:00Z',
      endedAt: null,
    }
  ]
}
```

---

## Components to Discard/Replace

### ❌ Do Not Integrate

1. **Mock Data Files** - Replace with Supabase queries
   - All files in `/lib/*-mock-data.ts`
   - Use for seed data structure reference only

2. **UI Component Copies** - Use existing shadcn/ui
   - All `/components/ui/*` in prototype
   - Already available in main app (47+ components)

3. **Standalone App.tsx** - Use Next.js App Router
   - Prototype routing logic → App Router pages

4. **ComplianceDashboard.tsx** - Defer to Phase 14
   - PrimusGFS-specific functionality
   - Integrate during Compliance Engine phase

---

## 7-Phase Integration Roadmap

### Phase 1: Database Schema (2-3 days)
- [ ] Add 10 batch-related tables to schema.sql
- [ ] Create indexes for performance
- [ ] Define RLS policies for multi-tenancy
- [ ] Create triggers for updated_at
- [ ] Add audit logging for batch operations
- [ ] Deploy to US and Canada regions

### Phase 2: Type Definitions (1 day)
- [ ] Consolidate 7 type files into `/types/batch.ts` (~322 lines)
- [ ] Create insert/update type variants
- [ ] Add filter and form input types
- [ ] Export from `/types/index.ts`

### Phase 3: Database Queries (2-3 days)
- [ ] Create `/lib/supabase/queries/batches.ts`
- [ ] Implement CRUD operations (getBatches, createBatch, etc.)
- [ ] Create harvest record queries
- [ ] Create waste log queries
- [ ] Create cultivar queries
- [ ] Add client-side query variants if needed
- [ ] Error handling and logging

### Phase 4: UI Components (4-5 days)
**Tier 1 Components (2 days):**
- [ ] BatchList (BatchDashboard → batch-list.tsx)
- [ ] BatchDetail (BatchDetailView → batch-detail.tsx)
- [ ] BatchForm (CreateBatchDialog → batch-form.tsx)
- [ ] BatchMetrics (BatchMetricsPanel → batch-metrics.tsx)
- [ ] BatchTimeline (BatchTimeline → batch-timeline.tsx)

**Tier 2 Components (2 days):**
- [ ] StageTransition (BatchStageTransition → stage-transition.tsx)
- [ ] HarvestWorkflow (HarvestWorkflow → harvest-workflow.tsx)
- [ ] PlantTagging (PlantTaggingWorkflow → plant-tagging.tsx)
- [ ] PostHarvest (PostHarvestProcessing → post-harvest.tsx)
- [ ] WasteDisposal (WasteDisposalWorkflow → waste-disposal.tsx)

**Tier 3 Components (1 day):**
- [ ] CultivarManager, BatchCollections, BulkOperations, Quarantine, RoomCapacity

**Tier 4 Components (1 day):**
- [ ] GenealogyView, PlantCount, EvidenceCapture, WasteLogs

### Phase 5: Dashboard Pages (2-3 days)
- [ ] Create `/app/dashboard/batches/page.tsx` (list view)
- [ ] Create `/app/dashboard/batches/[id]/page.tsx` (detail view)
- [ ] Create `/app/dashboard/batches/create/page.tsx` (create form)
- [ ] Create `/app/dashboard/cultivars/page.tsx`
- [ ] Add RBAC guards to all pages
- [ ] Implement jurisdiction-aware rendering

### Phase 6: API Routes (2-3 days)
- [ ] Create `/app/api/batches/route.ts` (GET, POST)
- [ ] Create `/app/api/batches/[id]/route.ts` (GET, PATCH, DELETE)
- [ ] Create `/app/api/batches/[id]/harvest/route.ts`
- [ ] Create `/app/api/batches/[id]/waste/route.ts`
- [ ] Create `/app/api/cultivars/route.ts`
- [ ] Add authentication and RBAC checks
- [ ] Input validation

### Phase 7: Testing & Bug Fixes (2-3 days)
- [ ] Write query function unit tests
- [ ] Write component tests
- [ ] Write API route tests
- [ ] Manual testing (all workflows)
- [ ] Test RBAC scenarios
- [ ] Test jurisdiction-specific features
- [ ] Test dev mode compatibility
- [ ] Fix bugs and edge cases
- [ ] Update documentation

---

## Estimated Timeline

**Total Estimated Time:** 15-20 days

**Phase Breakdown:**
- Phase 1 (Schema): 2-3 days
- Phase 2 (Types): 1 day
- Phase 3 (Queries): 2-3 days
- Phase 4 (Components): 4-5 days
- Phase 5 (Pages): 2-3 days
- Phase 6 (API): 2-3 days
- Phase 7 (Testing): 2-3 days

**Dependencies:**
- Recipe Management must be complete (Phase 11)
- Monitoring system must be complete (Phase 10) ✅
- Inventory system must be complete (Phase 8) ✅

---

## Success Criteria

### Functional Requirements
- [ ] Create, view, edit, delete batches
- [ ] Track batch lifecycle through all stages
- [ ] Record harvest events with weight tracking
- [ ] Manage waste disposal with approval workflow
- [ ] Track plant counts and snapshots
- [ ] Manage cultivar library
- [ ] Quarantine workflow for quality control
- [ ] Post-harvest processing (dry, cure, package)
- [ ] Plant tagging for Metrc jurisdictions
- [ ] Room capacity monitoring

### Quality Requirements
- [ ] TypeScript compiles (0 errors)
- [ ] Tests pass (95%+ coverage for new code)
- [ ] Build succeeds
- [ ] No console errors
- [ ] RBAC guards on all routes
- [ ] Jurisdiction-aware rendering
- [ ] Dev mode compatible
- [ ] Responsive design
- [ ] Accessibility (ARIA labels, keyboard nav)

### Documentation Requirements
- [ ] Update `/docs/current/feature-batch.md`
- [ ] Update `/docs/roadmap/integration-deployment/integration-checklist.md`
- [ ] Create `BATCH_INTEGRATION_COMPLETE.md` summary
- [ ] Document new RBAC permissions
- [ ] Add seed data examples
- [ ] API documentation in `/docs/API.md`

---

## Navigation

**← Back:** [Integration Patterns](./integration-patterns.md)  
**Next →:** [Feature Roadmap](../planning-progress/feature-roadmap.md)  
**Roadmap Index:** [Integration Roadmap](../index.md)

---

**Last Updated:** November 13, 2025  
**Document Status:** Phase 0 Complete - Ready for User Approval  
**Next Action:** User review and approval to proceed to Phase 1
