# Quick Start Guide - Phase 3.5 (Plant Batch Lifecycle)

**For:** Next agent working on compliance engine  
**Phase:** 3.5 - Plant Batch Lifecycle Integration  
**Duration:** 4 weeks (Week 1 starts NOW)  
**Priority:** 🔴 CRITICAL - Required for cannabis compliance

---

## 📖 REQUIRED READING (Do this first!)

1. **[COMPLIANCE_ENGINE_GAP_ANALYSIS_SUMMARY.md](./COMPLIANCE_ENGINE_GAP_ANALYSIS_SUMMARY.md)** (10 min read)
   - Executive summary of all 8 gaps
   - Why batches are critical
   - Business impact if not completed

2. **[COMPLIANCE_ENGINE_COMPREHENSIVE_REPLAN.md](./COMPLIANCE_ENGINE_COMPREHENSIVE_REPLAN.md)** (30 min read)
   - Detailed GAP 1: Plant Batch Lifecycle section
   - Week-by-week deliverables
   - Database schemas
   - File-by-file requirements

3. **[COMPLIANCE_ENGINE_AGENT_PROMPT.md](./COMPLIANCE_ENGINE_AGENT_PROMPT.md#phase-35-plant-batch-lifecycle)** (15 min read)
   - Phase 3.5 section with implementation details
   - Patterns to follow
   - Testing requirements

**Total Reading Time:** ~1 hour (don't skip this!)

---

## 🎯 WEEK 1 GOAL: Batch Push Sync

**Objective:** Make `createBatch()` automatically push batches to Metrc (non-blocking)

### What You're Building

When a user creates a new cannabis batch in TRAZO:
```typescript
// User creates batch in UI
const newBatch = {
  batch_number: "B-2025-001",
  cultivar_id: "cultivar-123",
  stage: "clone",
  plant_count: 50,
  start_date: "2025-01-15"
}

// createBatch() runs
const { data: batch } = await createBatch(newBatch)
// ✅ Batch saved in TRAZO database

// 🔥 NEW: Auto-push to Metrc (non-blocking)
pushBatchToMetrc(batch.id, siteId, orgId, userId)
  .then(() => console.log("Metrc sync successful"))
  .catch(() => console.error("Metrc sync failed - user can retry manually"))
// ✅ Metrc plant batch created
// ✅ batch.metrc_batch_id populated
// ✅ Sync logged in metrc_sync_log
```

### Files to Create (in this order)

#### 1. Validation Rules (30 min)
**File:** `lib/compliance/metrc/validation/batch-rules.ts`

```typescript
import type { ValidationResult } from '@/lib/compliance/types'

export function validateBatchForMetrc(batch: {
  batch_number: string
  cultivar_id: string
  stage: string
  plant_count: number
  start_date: string
}): ValidationResult {
  const errors = []
  const warnings = []

  // Required fields
  if (!batch.batch_number) {
    errors.push({ field: 'batch_number', message: 'Batch number is required', code: 'REQUIRED_FIELD' })
  }

  if (!batch.cultivar_id) {
    errors.push({ field: 'cultivar_id', message: 'Cultivar is required for Metrc tracking', code: 'REQUIRED_FIELD' })
  }

  if (batch.plant_count < 1) {
    errors.push({ field: 'plant_count', message: 'Plant count must be at least 1', code: 'INVALID_VALUE' })
  }

  // Start date validation
  const startDate = new Date(batch.start_date)
  const today = new Date()
  if (startDate > today) {
    errors.push({ field: 'start_date', message: 'Metrc does not accept future start dates', code: 'INVALID_DATE' })
  }

  // Warnings
  if (batch.plant_count > 1000) {
    warnings.push({ field: 'plant_count', message: 'Large batch - consider splitting for better tracking', code: 'LARGE_BATCH' })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}
```

**Test file:** `lib/compliance/metrc/__tests__/batch-rules.test.ts`

#### 2. Batch Push Sync Service (2 hours)
**File:** `lib/compliance/metrc/sync/batch-push-sync.ts`

**Pattern:** Copy `inventory-push-sync.ts` and adapt for batches

**Key Functions:**
```typescript
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

**What it does:**
1. Get batch from database
2. Get site and jurisdiction config
3. Validate batch meets Metrc requirements
4. Get Metrc credentials
5. Create Metrc plant batch via API
6. Update TRAZO batch with `metrc_batch_id`
7. Log sync operation
8. Return result

**Reference:** `lib/compliance/metrc/sync/inventory-push-sync.ts` (lines 1-200)

#### 3. Update Batch Queries (1 hour)
**File:** `lib/supabase/queries/batches.ts`

**Add hook to `createBatch()` function** (around line 160):

```typescript
// After batch created successfully:
if (!options?.skipMetrcPush && data) {
  try {
    const { data: siteData } = await supabase
      .from('sites')
      .select('id, jurisdiction_id, organization_id')
      .eq('id', data.site_id)
      .single()

    if (siteData?.jurisdiction_id) {
      const jurisdiction = getJurisdictionConfig(siteData.jurisdiction_id)

      if (jurisdiction?.plant_type === 'cannabis' &&
          jurisdiction?.rules?.batch?.require_metrc_id) {
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
```

#### 4. Manual Push Button UI (1 hour)
**File:** `components/features/compliance/push-batch-to-metrc-button.tsx`

**Pattern:** Copy `push-to-metrc-button.tsx` and adapt for batches

Shows:
- Push button (if batch not synced)
- Sync status badge (synced, pending, error)
- Loading state during push
- Success/error toasts

#### 5. Sync Status Badge (30 min)
**File:** `components/features/compliance/batch-metrc-sync-status.tsx`

Shows colored badge:
- 🟢 Green: Synced (has metrc_batch_id)
- 🟡 Yellow: Pending (sync in progress)
- 🔴 Red: Error (sync failed)
- ⚪ Gray: Not applicable (non-cannabis jurisdiction)

#### 6. API Route (30 min)
**File:** `app/api/compliance/push-batch/route.ts`

**Pattern:** Copy `push-lot/route.ts` and adapt

Endpoint: `POST /api/compliance/push-batch`
Body: `{ batchId: string }`
Response: `{ success: boolean, message: string }`

#### 7. Tests (2 hours)
**File:** `lib/compliance/metrc/__tests__/batch-push-sync.test.ts`

Test cases:
- ✅ Successfully pushes batch to Metrc
- ✅ Handles missing cultivar
- ✅ Handles future start date error
- ✅ Validates plant count
- ✅ Skips push for non-cannabis jurisdictions
- ✅ Creates sync log entry
- ✅ Updates batch with metrc_batch_id
- ✅ Handles API errors gracefully

---

## 🏃‍♂️ IMPLEMENTATION STEPS (Week 1)

### Day 1: Setup & Validation (2-3 hours)
1. Read all required documentation (1 hour)
2. Review existing batch system code (30 min)
3. Create `batch-rules.ts` validation (30 min)
4. Write validation tests (30 min)
5. Run tests, ensure passing

### Day 2-3: Push Sync Service (4-6 hours)
1. Create `batch-push-sync.ts` (2 hours)
   - Copy inventory-push-sync.ts structure
   - Adapt for plant batch API endpoint
   - Use validation from batch-rules.ts
2. Write comprehensive tests (2 hours)
3. Test with Metrc sandbox (1 hour)
4. Debug and refine (1 hour)

### Day 4: Database Integration (2-3 hours)
1. Update `batches.ts` with hooks (1 hour)
2. Test batch creation flow end-to-end (1 hour)
3. Verify non-blocking behavior (30 min)
4. Test error scenarios (30 min)

### Day 5: UI Components & API (3-4 hours)
1. Create push button component (1 hour)
2. Create sync status badge (30 min)
3. Create API route (30 min)
4. Integrate into batch details page (1 hour)
5. Manual testing in UI (1 hour)

---

## 🧪 TESTING CHECKLIST

### Unit Tests
- [ ] `batch-rules.test.ts` - All validation scenarios
- [ ] `batch-push-sync.test.ts` - Push sync logic
- [ ] API route test

### Integration Tests
- [ ] Create batch → auto-push to Metrc
- [ ] Manual push via button
- [ ] Sync status updates correctly
- [ ] Error recovery (retry works)

### Manual Testing (Metrc Sandbox)
- [ ] Create batch in TRAZO
- [ ] Verify batch appears in Metrc
- [ ] Check metrc_batch_id populated
- [ ] Check sync log entry created
- [ ] Test manual retry on failure
- [ ] Test with non-cannabis jurisdiction (no push)

---

## 📚 REFERENCE FILES

### Files to Read (understand patterns)
- `lib/compliance/metrc/sync/inventory-push-sync.ts` - Push sync pattern
- `lib/compliance/metrc/validation/package-rules.ts` - Validation pattern
- `lib/supabase/queries/inventory-lots.ts` - Integration hook pattern (lines 130-180)
- `components/features/compliance/push-to-metrc-button.tsx` - UI pattern

### Files to Update
- `lib/supabase/queries/batches.ts` - Add Metrc push hook
- `lib/compliance/metrc/sync/index.ts` - Export new functions

### Database Columns (already exist)
- `batches.metrc_batch_id` - Metrc plant batch ID
- `batches.metrc_plant_labels` - Array of plant tags (Week 3)
- `batches.metrc_sync_status` - Sync status enum
- `metrc_sync_log` table - All syncs logged here

---

## ✅ WEEK 1 COMPLETION CHECKLIST

- [ ] All 7 files created
- [ ] All tests passing (>95% coverage)
- [ ] `createBatch()` auto-pushes to Metrc (non-blocking)
- [ ] Manual push button works in UI
- [ ] Sync status visible in batch details
- [ ] Error handling tested
- [ ] Documentation updated:
  - [ ] Update `COMPLIANCE_ENGINE_AGENT_PROMPT.md` with Week 1 complete
  - [ ] Add notes about learnings/gotchas
- [ ] Git commit with message: "feat(compliance): Phase 3.5 Week 1 - Batch push sync complete"

---

## 🆘 TROUBLESHOOTING

### Metrc API Returns 400 Error
- Check validation - likely missing required field
- Review Metrc API docs for plant batch creation
- Verify cultivar strain is registered in Metrc

### Batch Created but Not Pushed
- Check jurisdiction config - might not be cannabis
- Check `require_metrc_id` rule in jurisdiction
- Look for errors in non-blocking catch block

### Tests Failing
- Ensure mock Metrc client returns expected format
- Check TypeScript types match Metrc API response
- Review test helpers in `__tests__/test-helpers.ts`

### Can't Find Batch in Metrc Sandbox
- Verify using correct facility license number
- Check batch is in "Vegetative" or "Flowering" phase
- Search by batch name/number in Metrc UI

---

## 💡 PRO TIPS

1. **Use existing patterns** - Don't reinvent the wheel. Copy inventory-push-sync.ts structure.

2. **Test early and often** - Run tests after each file creation.

3. **Non-blocking is key** - Never let Metrc failures block TRAZO operations.

4. **Log everything** - Sync logs are critical for debugging.

5. **Validate before push** - Catch errors before calling Metrc API.

6. **Manual recovery** - Always provide UI for manual retry.

7. **Sandbox first** - Test with sandbox before touching production.

---

## 📞 NEED HELP?

**Documentation:**
- [COMPLIANCE_ENGINE_COMPREHENSIVE_REPLAN.md](./COMPLIANCE_ENGINE_COMPREHENSIVE_REPLAN.md#gap-1-plant-batch-lifecycle-critical---highest-priority)
- [COMPLIANCE_ENGINE_AGENT_PROMPT.md](./COMPLIANCE_ENGINE_AGENT_PROMPT.md#phase-35-plant-batch-lifecycle)

**Code References:**
- Inventory push sync: `lib/compliance/metrc/sync/inventory-push-sync.ts`
- Batch queries: `lib/supabase/queries/batches.ts`
- Jurisdiction config: `lib/jurisdiction/config.ts`

**Metrc Resources:**
- [Metrc API Docs](https://api-ca.metrc.com/Documentation)
- [Plant Batch Best Practices](https://www.metrc.com/cannabis-compliance-best-practices-for-creating-production-batches-in-metrc/)

---

**Good luck! Let's get batches integrated! 🚀**

**When complete, move to Week 2: Growth Phase Sync**
