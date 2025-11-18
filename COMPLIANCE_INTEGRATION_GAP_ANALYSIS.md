# Compliance Engine Integration Gap Analysis

**Created:** November 17, 2025
**Status:** Phase 3 Complete - Gaps Identified for Batch & Task Integration
**Priority:** HIGH - Critical for complete Metrc compliance

---

## Executive Summary

Phase 3 successfully integrated **inventory lots** with Metrc, but **batches** and **tasks** are not yet integrated. This document identifies the gaps and provides a roadmap for completing full platform integration with the compliance engine.

### Current Integration Status

| System | Integration Status | Priority |
|--------|-------------------|----------|
| **Inventory Lots** | ✅ **COMPLETE** | DONE |
| **Batches (Crops)** | ❌ **NOT INTEGRATED** | **CRITICAL** |
| **Tasks** | ⚠️ **PARTIAL** | HIGH |
| **Waste Logs** | ⚠️ **PARTIAL** | MEDIUM |
| **Transfers** | ❌ **NOT STARTED** | HIGH |

---

## 1. Batch System Integration Gaps

### Current State
- Batches exist in [lib/supabase/queries/batches.ts](lib/supabase/queries/batches.ts:1)
- No Metrc integration hooks
- Cannabis batches → Metrc Plant Batches (missing)
- Batch stage transitions → Metrc growth phase changes (missing)
- Batch harvests → Metrc harvest creation (missing)

### Critical Missing Integrations

#### 1.1 Batch Creation → Metrc Plant Batch

**File to Update:** `lib/supabase/queries/batches.ts`
**Function:** `createBatch()`
**Current Behavior:** Creates batch in TRAZO only
**Required Behavior:**

```typescript
export async function createBatch(batch: InsertBatch, options?: { skipMetrcPush?: boolean }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Create batch in TRAZO
    const { data, error } = await supabase
      .from('batches')
      .insert({ ...batch, created_by: batch.created_by || user.id })
      .select()
      .single()

    if (error) throw error

    // Create initial batch event
    await createBatchEvent(data.id, 'created', user.id, {
      batch_number: data.batch_number,
      domain_type: data.domain_type,
      stage: data.stage,
    })

    // ⚠️ MISSING: Push to Metrc if cannabis jurisdiction
    if (!options?.skipMetrcPush && data) {
      try {
        // Get site to check jurisdiction
        const { data: siteData } = await supabase
          .from('sites')
          .select('id, jurisdiction_id, organization_id')
          .eq('id', data.site_id)
          .single()

        if (siteData?.jurisdiction_id) {
          const jurisdiction = getJurisdictionConfig(siteData.jurisdiction_id)

          // Only push if cannabis jurisdiction with Metrc requirement
          if (jurisdiction?.plant_type === 'cannabis' &&
              jurisdiction?.rules?.batch?.require_metrc_id) {
            // Push to Metrc asynchronously (don't block batch creation)
            pushBatchToMetrc(
              data.id,
              siteData.id,
              siteData.organization_id,
              user.id
            ).catch((metrcError) => {
              console.error('Failed to push batch to Metrc (non-blocking):', metrcError)
            })
          }
        }
      } catch (metrcError) {
        console.error('Metrc integration error (non-blocking):', metrcError)
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in createBatch:', error)
    return { data: null, error }
  }
}
```

**Impact:** Cannabis batches not tracked in Metrc → Compliance violation

#### 1.2 Batch Stage Transition → Metrc Growth Phase Change

**File to Update:** `lib/supabase/queries/batches.ts`
**Function:** `transitionBatchStage()`
**Current Behavior:** Updates batch stage in TRAZO only
**Required Behavior:**

```typescript
export async function transitionBatchStage(
  batchId: string,
  newStage: BatchStage,
  notes?: string,
  options?: { skipMetrcPush?: boolean }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current batch
    const { data: batch } = await supabase
      .from('batches')
      .select('*, site:sites(jurisdiction_id, organization_id)')
      .eq('id', batchId)
      .single()

    if (!batch) throw new Error('Batch not found')

    const oldStage = batch.stage

    // Update batch stage in TRAZO
    const { data, error } = await supabase
      .from('batches')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', batchId)
      .select()
      .single()

    if (error) throw error

    // Create stage history entry
    await supabase.from('batch_stage_history').insert({
      batch_id: batchId,
      stage: newStage,
      started_at: new Date().toISOString(),
      transitioned_by: user.id,
      notes,
    })

    // ⚠️ MISSING: Update Metrc growth phase if applicable
    if (!options?.skipMetrcPush && batch.metrc_batch_id) {
      try {
        const jurisdiction = getJurisdictionConfig(batch.site.jurisdiction_id)

        if (jurisdiction?.plant_type === 'cannabis' &&
            jurisdiction?.rules?.batch?.require_metrc_id) {

          // Map TRAZO stage to Metrc growth phase
          const metrcPhase = mapStageToMetrcPhase(newStage)

          if (metrcPhase) {
            // Push to Metrc asynchronously
            updateMetrcBatchGrowthPhase(
              batch.metrc_batch_id,
              metrcPhase,
              batch.site.id,
              batch.site.organization_id,
              user.id
            ).catch((metrcError) => {
              console.error('Failed to update Metrc growth phase (non-blocking):', metrcError)
            })
          }
        }
      } catch (metrcError) {
        console.error('Metrc integration error (non-blocking):', metrcError)
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in transitionBatchStage:', error)
    return { data: null, error }
  }
}
```

**Impact:** Batch lifecycle not synced with Metrc → Inaccurate compliance reporting

#### 1.3 Batch Harvest → Metrc Harvest Creation

**File to Update:** Create new file `lib/compliance/metrc/sync/batch-harvest-sync.ts`
**Required Functionality:**

```typescript
/**
 * Push batch harvest to Metrc
 * Creates Metrc harvest record and packages from harvest
 */
export async function pushBatchHarvestToMetrc(
  batchId: string,
  harvestData: {
    harvestDate: string
    wetWeight: number
    dryWeight?: number
    wasteWeight?: number
    location: string
  },
  siteId: string,
  organizationId: string,
  userId: string
): Promise<HarvestPushResult> {
  // 1. Get batch with Metrc batch ID
  // 2. Validate harvest data
  // 3. Create Metrc harvest
  // 4. Create Metrc packages from harvest
  // 5. Link packages to TRAZO inventory lots
  // 6. Update batch status
  // 7. Log sync operation
}
```

**Impact:** Harvests not tracked in Metrc → Missing inventory chain of custody

---

## 2. Task System Integration Analysis

### Current State
- Tasks linked to batches via [lib/supabase/queries/batch-tasks.ts](lib/supabase/queries/batch-tasks.ts:1)
- SOP templates auto-create tasks
- No compliance task tracking

### Required Integrations

#### 2.1 Compliance Checklist Tasks

**Scenario:** Metrc regulations require specific tasks at batch stages

**Example:** Clone stage requires:
- Sanitize growing area ✅
- Tag clones with Metrc tags ⚠️ (needs compliance tracking)
- Record clone source ⚠️ (needs Metrc sync)
- Document clone count ⚠️ (needs validation)

**Required:**
- New SOP template type: `compliance_required`
- Task completion triggers Metrc validation
- Task evidence links to Metrc records

#### 2.2 Metrc Tag Assignment Tasks

**File to Create:** `lib/compliance/metrc/sync/tag-assignment-sync.ts`

```typescript
/**
 * Assign Metrc tags to plants in batch
 * Tasks trigger tag assignment workflows
 */
export async function assignMetrcTagsToBatch(
  batchId: string,
  tags: string[],
  siteId: string,
  organizationId: string,
  userId: string
): Promise<TagAssignmentResult> {
  // 1. Validate tags are available in Metrc
  // 2. Assign tags to batch plants
  // 3. Update Metrc plant batch with tags
  // 4. Create task completion record
  // 5. Log assignment for audit
}
```

**Impact:** Manual tag assignment → Error-prone compliance process

---

## 3. Waste Log Integration

### Current State
- Waste logs exist in [lib/supabase/queries/waste.ts](lib/supabase/queries/waste.ts:1)
- Database has `metrc_waste_id` column (Phase 1 migration)
- No push sync implemented

### Required Integration

**File to Create:** `lib/compliance/metrc/sync/waste-push-sync.ts`

```typescript
/**
 * Push waste log to Metrc
 * Tracks destruction/disposal in compliance system
 */
export async function pushWasteLogToMetrc(
  wasteLogId: string,
  siteId: string,
  organizationId: string,
  userId: string
): Promise<WastePushResult> {
  // 1. Get waste log with details
  // 2. Validate waste type and method
  // 3. Push to Metrc as plant/package destruction
  // 4. Link Metrc waste ID back to TRAZO
  // 5. Log sync operation
}
```

**Hook into:** `lib/supabase/queries/waste.ts` → `recordWaste()`

**Impact:** Waste not tracked in Metrc → Compliance violation

---

## 4. Transfer System Integration

### Current State
- Inventory movements exist
- No Metrc transfer manifest creation
- Critical gap for multi-facility operations

### Required Integration

**File to Create:** `lib/compliance/metrc/sync/transfer-manifest-sync.ts`

```typescript
/**
 * Create Metrc transfer manifest
 * Required for moving inventory between licensed facilities
 */
export async function createMetrcTransferManifest(
  movementId: string,
  destinationFacility: {
    licenseNumber: string
    facilityName: string
  },
  packages: string[], // Metrc package labels
  siteId: string,
  organizationId: string,
  userId: string
): Promise<TransferManifestResult> {
  // 1. Get movement details
  // 2. Validate destination facility
  // 3. Create Metrc transfer manifest
  // 4. Link manifest to TRAZO movement
  // 5. Generate printable manifest
  // 6. Log sync operation
}
```

**Impact:** No transfer tracking → Cannot move inventory legally

---

## 5. Missing Batch Sync Service Files

### Files to Create

#### 5.1 Batch Push Sync
**File:** `lib/compliance/metrc/sync/batch-push-sync.ts`

```typescript
export interface BatchPushResult {
  success: boolean
  batchesProcessed: number
  batchesCreated: number
  errors: string[]
  syncLogId?: string
}

export async function pushBatchToMetrc(
  batchId: string,
  siteId: string,
  organizationId: string,
  userId: string
): Promise<BatchPushResult>

export async function pushBatchesToMetrc(
  batchIds: string[],
  siteId: string,
  organizationId: string,
  userId: string
): Promise<BatchPushResult>
```

#### 5.2 Batch Validation Rules
**File:** `lib/compliance/metrc/validation/batch-rules.ts`

```typescript
import type { ValidationResult } from '@/lib/compliance/types'
import type { MetrcPlantBatchCreate } from '../types'

export function validateBatchForMetrc(batch: {
  batch_number: string
  cultivar_id: string
  stage: string
  plant_count: number
  start_date: string
}): ValidationResult {
  // Validate batch meets Metrc requirements
}
```

#### 5.3 Stage to Growth Phase Mapper
**File:** `lib/compliance/metrc/utils/stage-mapper.ts`

```typescript
/**
 * Map TRAZO batch stages to Metrc growth phases
 */
export function mapStageToMetrcPhase(stage: string): 'Vegetative' | 'Flowering' | null {
  const stageMap: Record<string, 'Vegetative' | 'Flowering' | null> = {
    'clone': 'Vegetative',
    'vegetative': 'Vegetative',
    'pre_flower': 'Vegetative',
    'flower': 'Flowering',
    'late_flower': 'Flowering',
    'harvest': null, // Harvest is separate operation
    'drying': null,
    'curing': null,
  }

  return stageMap[stage] || null
}
```

---

## 6. UI Components Needed

### 6.1 Batch Compliance Components

**File:** `components/features/compliance/push-batch-to-metrc-button.tsx`

```tsx
'use client'

/**
 * Push Batch to Metrc Button
 * Similar to PushToMetrcButton but for batches
 */
export function PushBatchToMetrcButton({
  batchId,
  batchNumber,
  variant = 'outline',
  size = 'sm',
  onPushComplete,
}: PushBatchToMetrcButtonProps) {
  // Similar implementation to push-to-metrc-button.tsx
  // Calls /api/compliance/push-batch endpoint
}
```

**File:** `components/features/compliance/batch-metrc-sync-status.tsx`

```tsx
'use client'

/**
 * Batch Metrc Sync Status Badge
 * Shows sync status for batch plant records
 */
export function BatchMetrcSyncStatus({
  metrcBatchId,
  metrcSyncStatus,
  lastSyncedAt,
}: BatchMetrcSyncStatusProps) {
  // Display sync status with appropriate badge colors
}
```

### 6.2 API Routes Needed

**File:** `app/api/compliance/push-batch/route.ts`

```typescript
/**
 * API Route: Push Batch to Metrc
 * Manually push a single batch to Metrc plant batch system
 */
export async function POST(request: NextRequest) {
  // Similar to push-lot/route.ts but for batches
}
```

---

## 7. Database Schema Gaps

### Existing Columns (from Phase 1 migration)

✅ Already exists in `batches` table:
- `metrc_batch_id` - Metrc plant batch ID
- `metrc_plant_labels` - Array of Metrc plant tags
- `metrc_sync_status` - Sync status (pending, synced, error)

✅ Already exists in `waste_logs` table:
- `metrc_waste_id` - Metrc waste destruction ID
- `metrc_sync_status` - Sync status

✅ Already exists in `inventory_movements` table:
- `metrc_transaction_id` - Metrc transfer manifest number
- `metrc_sync_status` - Sync status

**No additional migrations needed!** ✅

---

## 8. Integration Priority Matrix

### Critical (Must Complete for Cannabis Compliance)

| Integration | Impact | Effort | Priority | Target |
|------------|--------|--------|----------|--------|
| Batch Creation → Metrc | **CRITICAL** | Medium | 🔴 **P0** | Week 1 |
| Batch Stage → Growth Phase | **CRITICAL** | Medium | 🔴 **P0** | Week 1 |
| Waste Log → Metrc Destruction | HIGH | Low | 🟡 **P1** | Week 2 |
| Batch Harvest → Metrc Harvest | **CRITICAL** | High | 🔴 **P0** | Week 2 |

### High (Important for Full Compliance)

| Integration | Impact | Effort | Priority | Target |
|------------|--------|--------|----------|--------|
| Transfer → Metrc Manifest | HIGH | High | 🟡 **P1** | Week 3 |
| Task → Tag Assignment | MEDIUM | Medium | 🟢 **P2** | Week 4 |
| Compliance Checklist Tasks | MEDIUM | Low | 🟢 **P2** | Week 4 |

---

## 9. Recommended Implementation Plan

### Week 1: Batch Foundation
1. Create `batch-push-sync.ts` with `pushBatchToMetrc()`
2. Create `batch-rules.ts` validation
3. Update `createBatch()` with Metrc integration hook
4. Create `push-batch-to-metrc-button.tsx` UI component
5. Create `/api/compliance/push-batch` endpoint
6. Write tests for batch push sync

### Week 2: Batch Lifecycle & Waste
1. Create `stage-mapper.ts` utility
2. Update `transitionBatchStage()` with Metrc integration
3. Create `batch-harvest-sync.ts` with harvest push
4. Create `waste-push-sync.ts` for waste tracking
5. Update `recordWaste()` with Metrc integration hook
6. Write tests for lifecycle and waste sync

### Week 3: Transfers & Polish
1. Create `transfer-manifest-sync.ts`
2. Build transfer manifest UI components
3. Update inventory movement queries with hooks
4. Add comprehensive error handling
5. Performance testing with real data

### Week 4: Tasks & Documentation
1. Add compliance task types
2. Create tag assignment workflows
3. Build task-compliance integration
4. Write comprehensive documentation
5. End-to-end testing

---

## 10. Success Metrics

### Technical Completion
- ✅ All batch operations sync to Metrc
- ✅ All waste logs sync to Metrc
- ✅ Transfer manifests generate correctly
- ✅ 95%+ test coverage on new code
- ✅ 0 TypeScript errors

### Business Value
- ✅ 100% cannabis batches tracked in Metrc
- ✅ Automated compliance for batch lifecycle
- ✅ Reduced manual Metrc data entry by 80%+
- ✅ Zero compliance violations from missing data
- ✅ Audit-ready transfer documentation

---

## 11. Immediate Next Steps

### For Next Agent Working on Phase 3.5 (Batch Integration)

1. **Read this document thoroughly**
2. **Start with batch-push-sync.ts** (highest impact)
3. **Follow inventory-lots.ts pattern** (proven architecture)
4. **Use non-blocking async pattern** (resilient)
5. **Test with sandbox Metrc** (safe)
6. **Document as you go** (critical)

### Key Files to Reference
- [inventory-lots.ts](lib/supabase/queries/inventory-lots.ts:1) - Integration pattern
- [batches.ts](lib/supabase/queries/batches.ts:1) - Batch operations
- [inventory-push-sync.ts](lib/compliance/metrc/sync/inventory-push-sync.ts:1) - Push sync pattern
- [package-rules.ts](lib/compliance/metrc/validation/package-rules.ts:1) - Validation pattern

---

## 12. Questions & Blockers

### Questions for Product/Compliance Team
1. Which batch stages map to Metrc growth phases?
2. Should all batch types push to Metrc or only cannabis?
3. What's the harvest workflow (wet weight first, then dry)?
4. Do we need transfer manifests for internal movements?

### Technical Blockers
- None identified (all infrastructure in place)

### Dependencies
- Metrc sandbox access (already have)
- Test facility credentials (already have)
- Jurisdiction configuration (already done)

---

**Status:** Ready to implement batch integration
**Next Agent:** Start with batch-push-sync.ts following this plan
**Questions:** Contact compliance team or refer to Metrc documentation

**Let's complete the compliance engine! 🚀**
