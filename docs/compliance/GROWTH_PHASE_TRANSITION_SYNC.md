# Growth Phase Transition Sync (Phase 3.5 - Week 3)

**Status**: 📋 Specification Ready (Not Yet Implemented)
**Created**: November 18, 2025
**Author**: Claude Code Agent

## Overview

Week 3 of Phase 3.5 implements automatic growth phase transition sync. When batch stages change in TRAZO (e.g., clone → vegetative → flowering), the changes are automatically pushed to Metrc via the plant batch growth phase API. This maintains compliance by ensuring Metrc always reflects the current growth phase of plant batches.

## Business Context

### Why This Matters

Cannabis regulations require accurate tracking of plant growth phases for:
- **Cultivation Monitoring**: State agencies track plant development stages
- **Inventory Valuation**: Different growth phases have different values
- **Compliance Reporting**: Weekly/monthly reports require accurate stage data
- **Harvest Planning**: Flowering stage tracking determines harvest readiness

### Regulatory Requirements

Metrc tracks plant batches through these growth phases:
1. **Clone** - Clones/cuttings from mother plants
2. **Seed** - Plants started from seed
3. **Vegetative** - Active vegetative growth
4. **Flowering** - Flowering/budding stage

### TRAZO Stage Mapping

| TRAZO Stage | Metrc Growth Phase | Valid Transition |
|-------------|-------------------|------------------|
| `germination` | Not tracked (pre-Metrc) | → clone, vegetative |
| `clone` | Clone | → vegetative |
| `vegetative` | Vegetative | → flowering |
| `flowering` | Flowering | → harvest |
| `harvest` | Destroyed (harvested) | Terminal |
| `drying` | Destroyed (harvested) | Terminal |
| `curing` | Not applicable | Terminal |

## Architecture

### Core Components

```
lib/compliance/metrc/
├── validation/
│   └── phase-transition-rules.ts    # NEW: Validation for phase transitions
├── sync/
│   └── batch-phase-sync.ts          # NEW: Phase transition sync service
└── endpoints/
    └── plant-batches.ts              # Uses existing changeGrowthPhase() method

lib/supabase/queries/
└── batches.ts                        # Enhance transitionBatchStage()

components/features/batches/
└── transition-stage-dialog.tsx       # NEW: Stage transition UI

app/api/batches/
└── transition-stage/route.ts         # NEW: API endpoint

supabase/migrations/
└── 20251118000004_add_batch_metrc_growth_phase.sql  # NEW: Track Metrc phase
```

## Database Schema

### New Column: `metrc_batch_mappings.metrc_growth_phase`

Track the current Metrc growth phase for synced batches:

```sql
ALTER TABLE metrc_batch_mappings
ADD COLUMN metrc_growth_phase TEXT;

-- Valid values: 'Clone', 'Seed', 'Vegetative', 'Flowering'
ALTER TABLE metrc_batch_mappings
ADD CONSTRAINT valid_metrc_growth_phase
CHECK (
  metrc_growth_phase IS NULL OR
  metrc_growth_phase IN ('Clone', 'Seed', 'Vegetative', 'Flowering')
);
```

### Enhanced: `batch_stage_history`

Already exists, will be used to track stage transitions:

```sql
-- Existing table structure
CREATE TABLE batch_stage_history (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL,
  stage TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  transitioned_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Validation Rules

### Phase Transition Validation

**Function**: `validatePhaseTransition()`

```typescript
export function validatePhaseTransition(transition: {
  batchId: string
  currentStage: string
  newStage: string
  currentMetrcPhase?: string
  transitionDate: string
}): ValidationResult
```

**Validation Checks**:

1. **Valid TRAZO Stages**: Both current and new stages must be valid batch stages
2. **Valid Metrc Phases**: Must map to valid Metrc growth phases
3. **Valid Transitions**: Only allow valid stage progressions
4. **Date Validation**: Transition date cannot be in the future
5. **Metrc Sync Compatibility**: New stage must map to a Metrc-trackable phase

**Valid TRAZO Stage Transitions**:

```typescript
const VALID_TRANSITIONS = {
  germination: ['clone', 'vegetative'],
  clone: ['vegetative', 'flowering'],
  vegetative: ['flowering', 'harvest'],
  flowering: ['harvest', 'drying'],
  harvest: ['drying'],
  drying: ['curing'],
  curing: [], // Terminal stage
}
```

**Valid Metrc Phase Transitions**:

```typescript
const VALID_METRC_TRANSITIONS = {
  Clone: ['Vegetative', 'Flowering'],
  Vegetative: ['Flowering'],
  Flowering: [], // Must be harvested/destroyed, not transitioned
}
```

**Warnings**:

- ⚠️ **Skip Stages**: Warn if transition skips an intermediate stage (e.g., clone → flowering)
- ⚠️ **Fast Transition**: Warn if transition happens too quickly (e.g., < 7 days in vegetative)
- ⚠️ **Reverse Transition**: Error if attempting to go backwards (e.g., flowering → vegetative)

## Metrc API Integration

### Growth Phase Change Endpoint

**Metrc Endpoint**: `POST /plantbatches/v2/changegrowthphase`

**Payload**:

```json
[
  {
    "Id": 12345,
    "Label": "1A4FF0100000022000000123",
    "NewGrowthPhase": "Vegetative",
    "NewGrowthDate": "2025-11-18",
    "GrowthPhaseStartDate": "2025-11-01"
  }
]
```

**Field Mapping**:

| Field | Source | Notes |
|-------|--------|-------|
| `Id` | `metrc_batch_mappings.metrc_batch_id` | Numeric ID |
| `Label` | First plant tag from batch (optional) | For individual tracking |
| `NewGrowthPhase` | Mapped from new TRAZO stage | Clone/Vegetative/Flowering |
| `NewGrowthDate` | Transition date | Date of phase change |
| `GrowthPhaseStartDate` | Previous phase start date | From batch_stage_history |

## Sync Flow

### Auto-Sync Conditions

The system will automatically sync phase transitions when:

1. ✅ Batch is synced to Metrc (`metrc_batch_id` exists)
2. ✅ Domain type is `cannabis`
3. ✅ New stage maps to a valid Metrc growth phase
4. ✅ Transition is valid (not backward, not skipping)
5. ✅ User has valid Metrc API credentials

### Sync Process

```
1. User transitions batch stage in TRAZO
   ↓
2. TRAZO: Update batch.stage (always succeeds)
   ↓
3. TRAZO: Create batch_stage_history entry
   ↓
4. TRAZO: Create batch_event (stage_transition)
   ↓
5. Check auto-sync conditions → No → Done
   ↓ Yes
6. ASYNC: Map TRAZO stage to Metrc growth phase
   ↓
7. ASYNC: Validate phase transition
   ↓
8. ASYNC: Get previous phase start date
   ↓
9. ASYNC: Create sync log (in_progress)
   ↓
10. ASYNC: Call Metrc changeGrowthPhase() API
   ↓
11. ASYNC: Update metrc_batch_mappings.metrc_growth_phase
   ↓
12. ASYNC: Update sync log (completed/failed)
   ↓
13. Done (TRAZO unaffected by sync result)
```

### Non-Blocking Design

Just like Week 1 and Week 2:
- **TRAZO operations always succeed** - Never blocked by Metrc issues
- **Fire-and-forget async** - Sync happens in background
- **Graceful error handling** - Failures logged, not thrown
- **Manual retry available** - UI button for failed syncs

## Implementation Files

### 1. Validation Rules (1 hour)

**File**: `lib/compliance/metrc/validation/phase-transition-rules.ts`

```typescript
import type { ValidationResult } from '@/lib/compliance/types'

export function validatePhaseTransition(transition: {
  batchId: string
  currentStage: string
  newStage: string
  currentMetrcPhase?: string
  transitionDate: string
}): ValidationResult {
  const result = createValidationResult()

  // Validate TRAZO stage transition
  const validTransitions = getValidTransitions(transition.currentStage)
  if (!validTransitions.includes(transition.newStage)) {
    addError(
      result,
      'newStage',
      `Cannot transition from ${transition.currentStage} to ${transition.newStage}`,
      'INVALID_STAGE_TRANSITION'
    )
  }

  // Validate Metrc phase transition
  if (transition.currentMetrcPhase) {
    const newMetrcPhase = mapStageToMetrcPhase(transition.newStage)
    if (newMetrcPhase) {
      const validMetrcTransitions = getValidMetrcTransitions(transition.currentMetrcPhase)
      if (!validMetrcTransitions.includes(newMetrcPhase)) {
        addError(
          result,
          'newStage',
          `Cannot transition Metrc phase from ${transition.currentMetrcPhase} to ${newMetrcPhase}`,
          'INVALID_METRC_PHASE_TRANSITION'
        )
      }
    }
  }

  // Validate transition date
  validateDate(result, 'transitionDate', transition.transitionDate)
  validateDateNotInFuture(result, 'transitionDate', transition.transitionDate)

  return result
}

export function mapStageToMetrcPhase(stage: string): string | null {
  const mapping = {
    germination: null, // Not tracked in Metrc
    clone: 'Clone',
    vegetative: 'Vegetative',
    flowering: 'Flowering',
    harvest: null, // Terminal - handled by destruction
    drying: null,
    curing: null,
  }
  return mapping[stage] || null
}
```

### 2. Phase Sync Service (2 hours)

**File**: `lib/compliance/metrc/sync/batch-phase-sync.ts`

```typescript
import { MetrcClient } from '../client'
import { createClient } from '@/lib/supabase/server'
import { validatePhaseTransition, mapStageToMetrcPhase } from '../validation/phase-transition-rules'

export async function syncPhaseTransitionToMetrc(
  batchId: string,
  oldStage: string,
  newStage: string,
  userId: string,
  transitionDate: string
): Promise<PhaseSyncResult> {
  // 1. Check if batch is synced to Metrc
  // 2. Validate phase transition
  // 3. Map to Metrc growth phase
  // 4. Get previous phase start date
  // 5. Create sync log
  // 6. Call Metrc API
  // 7. Update metrc_growth_phase
  // 8. Complete sync log
}
```

### 3. Enhanced Batch Queries (1 hour)

**File**: `lib/supabase/queries/batches.ts`

Update `transitionBatchStage()`:

```typescript
export async function transitionBatchStage(
  batchId: string,
  newStage: BatchStage,
  userId: string,
  notes?: string
) {
  // ... existing code ...

  // 🆕 AUTO-SYNC TO METRC (non-blocking)
  if (batch?.domain_type === 'cannabis') {
    const { syncPhaseTransitionToMetrc } = await import(
      '@/lib/compliance/metrc/sync/batch-phase-sync'
    )

    syncPhaseTransitionToMetrc(
      batchId,
      currentStage,
      newStage,
      userId,
      new Date().toISOString()
    ).catch((error) => {
      console.error('Metrc phase sync failed (non-blocking):', error)
    })
  }
}
```

### 4. Stage Transition Dialog (1.5 hours)

**File**: `components/features/batches/transition-stage-dialog.tsx`

```tsx
export function TransitionStageDialog({
  batchId,
  currentStage,
  isSyncedToMetrc,
  domainType,
  onTransition,
}: Props) {
  // Similar to UpdatePlantCountDialog
  // - Dropdown for new stage (only valid transitions)
  // - Optional notes field
  // - Shows Metrc sync alert if applicable
  // - Validates transition before submission
}
```

### 5. API Endpoint (30 min)

**File**: `app/api/batches/transition-stage/route.ts`

```typescript
export async function POST(request: Request) {
  const { batchId, newStage, notes } = await request.json()

  const { data, error } = await transitionBatchStage(
    batchId,
    newStage,
    user.id,
    notes
  )

  return NextResponse.json({ success: !error, data })
}
```

### 6. Unit Tests (2 hours)

**File**: `lib/compliance/metrc/validation/__tests__/phase-transition.test.ts`

Test cases:
- ✅ Valid stage transitions (clone → vegetative)
- ✅ Invalid transitions (flowering → vegetative)
- ✅ Valid Metrc phase transitions
- ✅ Invalid Metrc phase transitions
- ✅ Stage mapping to Metrc phases
- ✅ Terminal stages (harvest, curing)
- ✅ Future date validation
- ✅ Skipped stage warnings

## Usage Examples

### API Call

```typescript
const response = await fetch('/api/batches/transition-stage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    batchId: 'batch-123',
    newStage: 'flowering',
    notes: 'Plants showing pre-flowers, transitioning to flower stage'
  })
})
```

### UI Component

```tsx
<TransitionStageDialog
  batchId={batch.id}
  currentStage={batch.stage}
  isSyncedToMetrc={!!batch.metrc_batch_id}
  domainType={batch.domain_type}
  onTransition={() => refetchBatch()}
/>
```

### Programmatic Usage

```typescript
import { syncPhaseTransitionToMetrc } from '@/lib/compliance/metrc/sync/batch-phase-sync'

const result = await syncPhaseTransitionToMetrc(
  batchId,
  'vegetative',
  'flowering',
  userId,
  '2025-11-18'
)

if (result.success) {
  console.log('Phase synced to Metrc')
} else {
  console.error('Sync failed:', result.errors)
}
```

## Testing Strategy

### Unit Tests

```bash
npm test -- lib/compliance/metrc/validation/__tests__/phase-transition.test.ts
```

**Coverage Goals**:
- All valid transitions tested
- All invalid transitions tested
- Stage mapping logic
- Metrc phase compatibility
- Edge cases (terminal stages, skip stages)

### Integration Tests

1. **Happy Path**: Clone → Vegetative → Flowering
2. **Invalid Path**: Flowering → Vegetative (should fail)
3. **Non-Cannabis**: Produce batch (no sync)
4. **Not Synced**: Batch without metrc_batch_id (no sync)
5. **API Failure**: Metrc down (TRAZO succeeds, sync fails)

### Manual Testing

Using batch details page:
1. Create batch in clone stage
2. Sync to Metrc
3. Transition to vegetative (verify Metrc updated)
4. Transition to flowering (verify Metrc updated)
5. Check sync logs for success

## Monitoring & Observability

### Find Failed Phase Syncs

```sql
SELECT
  csl.id,
  csl.created_at,
  b.batch_number,
  b.stage AS current_stage,
  csl.request_payload->>'newStage' AS attempted_stage,
  csl.error_message
FROM compliance_sync_logs csl
INNER JOIN batches b ON b.id = csl.local_id
WHERE csl.sync_type = 'plant_batch_phase_transitions'
  AND csl.status = 'failed'
ORDER BY csl.created_at DESC;
```

### View Stage Transition History

```sql
SELECT
  bsh.started_at,
  bsh.stage,
  u.full_name AS transitioned_by,
  mbm.metrc_growth_phase,
  csl.status AS metrc_sync_status,
  bsh.notes
FROM batch_stage_history bsh
INNER JOIN users u ON u.id = bsh.transitioned_by
LEFT JOIN metrc_batch_mappings mbm ON mbm.batch_id = bsh.batch_id
LEFT JOIN compliance_sync_logs csl
  ON csl.local_id = bsh.batch_id
  AND csl.sync_type = 'plant_batch_phase_transitions'
  AND csl.created_at >= bsh.started_at
WHERE bsh.batch_id = 'your-batch-id'
ORDER BY bsh.started_at DESC;
```

### Metrc Phase Drift Detection

```sql
-- Find batches where TRAZO stage doesn't match Metrc phase
SELECT
  b.id,
  b.batch_number,
  b.stage AS trazo_stage,
  mbm.metrc_growth_phase,
  mbm.last_synced_at
FROM batches b
INNER JOIN metrc_batch_mappings mbm ON mbm.batch_id = b.id
WHERE b.domain_type = 'cannabis'
  AND mbm.sync_status = 'synced'
  AND (
    (b.stage = 'clone' AND mbm.metrc_growth_phase != 'Clone') OR
    (b.stage = 'vegetative' AND mbm.metrc_growth_phase != 'Vegetative') OR
    (b.stage = 'flowering' AND mbm.metrc_growth_phase != 'Flowering')
  );
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| "Invalid stage transition" | Attempting backward/invalid transition | Only allow valid progressions |
| "Cannot transition Metrc phase from X to Y" | Invalid Metrc phase change | Check Metrc phase compatibility |
| "Batch not synced to Metrc" | No metrc_batch_id | Push batch to Metrc first (Week 1) |
| "Invalid growth phase for Metrc" | Trying to sync terminal stage | Harvest stages don't sync |
| "Future date not allowed" | Transition date in future | Use current or past date |

### Manual Retry Process

If auto-sync fails:

1. User sees "Metrc sync failed" indicator in UI
2. User clicks "Retry Sync" button
3. System validates transition is still valid
4. System retries Metrc API call
5. Success updates status badge

## Performance Metrics

- **TRAZO Stage Transition**: <200ms
- **Validation**: <50ms
- **Metrc Sync**: 1-3 seconds (async, non-blocking)
- **Total User Wait Time**: <200ms

## Security & Compliance

- ✅ RLS policies enforced
- ✅ User authentication required
- ✅ Audit trail via batch_stage_history
- ✅ Sync logs track all Metrc operations
- ✅ Non-blocking ensures data availability

## Week 3 Completion Checklist

- [ ] Database migration applied
- [ ] `phase-transition-rules.ts` created with validation
- [ ] `batch-phase-sync.ts` sync service created
- [ ] `transitionBatchStage()` enhanced with auto-sync
- [ ] `TransitionStageDialog` UI component created
- [ ] API endpoint `/api/batches/transition-stage` created
- [ ] Unit tests written and passing (>90% coverage)
- [ ] Integration tests completed
- [ ] Manual testing in Metrc sandbox
- [ ] Documentation updated
- [ ] Git commit: "feat(compliance): Phase 3.5 Week 3 - Growth phase transition sync"

## Known Limitations

1. **One-Way Transitions**: Cannot reverse stage transitions (by design)
2. **Terminal Stages**: Harvest/drying/curing don't sync to Metrc (they're handled by destruction)
3. **No Manual Override**: Cannot force invalid transitions (safety feature)
4. **Phase Drift**: If Metrc is manually updated, TRAZO won't know (consider Week 4 pull sync)

## Future Enhancements (Week 4+)

### Week 4: Plant Tag Management
- Individual plant tagging
- Tag assignment to batches
- Plant destruction tracking

### Week 5+: Bidirectional Sync
- Pull Metrc changes → TRAZO
- Detect phase drift
- Reconciliation workflows
- Conflict resolution

---

## Related Documentation

- [Week 1: Batch Push Sync](./BATCH_PUSH_SYNC_IMPLEMENTATION.md)
- [Week 2: Plant Count Adjustments](./PLANT_COUNT_ADJUSTMENT_SYNC.md)
- [Phase 3.5 Plan](../../PHASE_3.5_WEEK_1_QUICK_START.md)
- [Metrc API - Plant Batches](https://api-ca.metrc.com/Documentation/#PlantBatches)

---

**Ready for Implementation** 🚀
**Estimated Time**: 8-10 hours
**Priority**: High (Required for compliance)
