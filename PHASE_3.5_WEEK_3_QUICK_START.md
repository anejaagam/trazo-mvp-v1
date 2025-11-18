# Quick Start Guide - Phase 3.5 Week 3 (Growth Phase Transitions)

**For:** Next agent working on compliance engine
**Phase:** 3.5 - Plant Batch Lifecycle Integration
**Week:** 3 - Growth Phase Transition Sync
**Duration:** 8-10 hours
**Priority:** 🟡 IMPORTANT - Required for compliance accuracy

---

## 📖 REQUIRED READING (Do this first!)

1. **[GROWTH_PHASE_TRANSITION_SYNC.md](./docs/compliance/GROWTH_PHASE_TRANSITION_SYNC.md)** (20 min read)
   - Full specification
   - Stage mapping rules
   - Validation requirements
   - Metrc API integration

2. **[Week 1 Summary](./docs/compliance/BATCH_PUSH_SYNC_IMPLEMENTATION.md)** (5 min review)
   - Understand non-blocking pattern
   - Sync log system
   - Error handling approach

3. **[Week 2 Summary](./docs/compliance/WEEK_2_IMPLEMENTATION_SUMMARY.md)** (5 min review)
   - Validation pattern
   - Auto-sync conditions
   - UI component structure

**Total Reading Time:** ~30 minutes (don't skip this!)

---

## 🎯 WEEK 3 GOAL: Growth Phase Transition Sync

**Objective:** Automatically sync batch stage transitions to Metrc growth phases

### What You're Building

When a user transitions a batch stage in TRAZO:
```typescript
// User transitions batch from clone to vegetative
await transitionBatchStage(batchId, 'vegetative', userId)
// ✅ TRAZO batch.stage updated to 'vegetative'

// 🔥 NEW: Auto-sync to Metrc (non-blocking)
syncPhaseTransitionToMetrc(batchId, 'clone', 'vegetative', userId, date)
  .then(() => console.log("Metrc phase updated to 'Vegetative'"))
  .catch(() => console.error("Metrc sync failed - user can retry"))
// ✅ Metrc growth phase changed to 'Vegetative'
// ✅ metrc_batch_mappings.metrc_growth_phase updated
// ✅ Sync logged in compliance_sync_logs
```

---

## 🗂️ FILES TO CREATE (in this order)

### 1. Database Migration (15 min)
**File:** `supabase/migrations/20251118000004_add_batch_metrc_growth_phase.sql`

```sql
-- Add Metrc growth phase tracking
ALTER TABLE metrc_batch_mappings
ADD COLUMN IF NOT EXISTS metrc_growth_phase TEXT;

-- Add check constraint for valid phases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_metrc_growth_phase'
  ) THEN
    ALTER TABLE metrc_batch_mappings
    ADD CONSTRAINT valid_metrc_growth_phase
    CHECK (
      metrc_growth_phase IS NULL OR
      metrc_growth_phase IN ('Clone', 'Seed', 'Vegetative', 'Flowering')
    );
  END IF;
END $$;

-- Add index for phase lookups
CREATE INDEX IF NOT EXISTS idx_metrc_batch_mappings_growth_phase
ON metrc_batch_mappings(metrc_growth_phase)
WHERE metrc_growth_phase IS NOT NULL;

-- Add comment
COMMENT ON COLUMN metrc_batch_mappings.metrc_growth_phase IS 'Current Metrc growth phase (Clone, Seed, Vegetative, Flowering)';
```

**Apply migration:**
```typescript
// Use MCP server to apply migration
await mcp__supabase__apply_migration({
  name: 'add_batch_metrc_growth_phase',
  query: '...' // paste SQL above
})
```

### 2. Validation Rules (1 hour)
**File:** `lib/compliance/metrc/validation/phase-transition-rules.ts`

```typescript
import type { ValidationResult } from '@/lib/compliance/types'
import {
  createValidationResult,
  validateRequired,
  validateDate,
  validateDateNotInFuture,
  addError,
  addWarning,
} from './validators'

/**
 * Map TRAZO stage to Metrc growth phase
 */
export function mapStageToMetrcPhase(stage: string): string | null {
  const mapping: Record<string, string | null> = {
    germination: null, // Pre-Metrc stage
    clone: 'Clone',
    vegetative: 'Vegetative',
    flowering: 'Flowering',
    harvest: null, // Terminal - handled by destruction
    drying: null,
    curing: null,
  }
  return mapping[stage] || null
}

/**
 * Get valid stage transitions for a given current stage
 */
export function getValidStageTransitions(currentStage: string): string[] {
  const transitions: Record<string, string[]> = {
    germination: ['clone', 'vegetative'],
    clone: ['vegetative', 'flowering'],
    vegetative: ['flowering', 'harvest'],
    flowering: ['harvest', 'drying'],
    harvest: ['drying'],
    drying: ['curing'],
    curing: [], // Terminal
  }
  return transitions[currentStage] || []
}

/**
 * Get valid Metrc phase transitions
 */
export function getValidMetrcPhaseTransitions(currentPhase: string): string[] {
  const transitions: Record<string, string[]> = {
    Clone: ['Vegetative', 'Flowering'],
    Seed: ['Vegetative', 'Flowering'],
    Vegetative: ['Flowering'],
    Flowering: [], // Must be harvested/destroyed
  }
  return transitions[currentPhase] || []
}

/**
 * Validate phase transition
 */
export function validatePhaseTransition(transition: {
  batchId: string
  currentStage: string
  newStage: string
  currentMetrcPhase?: string
  transitionDate: string
}): ValidationResult {
  const result = createValidationResult()

  // Validate required fields
  validateRequired(result, 'batchId', transition.batchId)
  validateRequired(result, 'currentStage', transition.currentStage)
  validateRequired(result, 'newStage', transition.newStage)

  // Validate TRAZO stage transition
  const validTransitions = getValidStageTransitions(transition.currentStage)
  if (validTransitions.length === 0 && transition.currentStage !== transition.newStage) {
    addError(
      result,
      'currentStage',
      `Stage "${transition.currentStage}" is terminal and cannot be transitioned`,
      'TERMINAL_STAGE'
    )
  } else if (!validTransitions.includes(transition.newStage)) {
    addError(
      result,
      'newStage',
      `Cannot transition from "${transition.currentStage}" to "${transition.newStage}". Valid transitions: ${validTransitions.join(', ')}`,
      'INVALID_STAGE_TRANSITION'
    )
  }

  // Validate Metrc phase transition (if batch is synced)
  if (transition.currentMetrcPhase) {
    const newMetrcPhase = mapStageToMetrcPhase(transition.newStage)

    if (newMetrcPhase) {
      const validMetrcTransitions = getValidMetrcPhaseTransitions(transition.currentMetrcPhase)

      if (validMetrcTransitions.length === 0) {
        addWarning(
          result,
          'newStage',
          `Current Metrc phase "${transition.currentMetrcPhase}" is terminal. This transition will not sync to Metrc.`,
          'METRC_TERMINAL_PHASE'
        )
      } else if (!validMetrcTransitions.includes(newMetrcPhase)) {
        addError(
          result,
          'newStage',
          `Cannot transition Metrc phase from "${transition.currentMetrcPhase}" to "${newMetrcPhase}". Valid transitions: ${validMetrcTransitions.join(', ')}`,
          'INVALID_METRC_PHASE_TRANSITION'
        )
      }
    } else {
      addWarning(
        result,
        'newStage',
        `Stage "${transition.newStage}" does not map to a Metrc growth phase. This transition will not sync to Metrc.`,
        'NO_METRC_PHASE_MAPPING'
      )
    }
  }

  // Validate transition date
  if (transition.transitionDate) {
    validateDate(result, 'transitionDate', transition.transitionDate)
    validateDateNotInFuture(result, 'transitionDate', transition.transitionDate)
  }

  return result
}
```

**Test file:** `lib/compliance/metrc/validation/__tests__/phase-transition.test.ts`

### 3. Phase Sync Service (2 hours)
**File:** `lib/compliance/metrc/sync/batch-phase-sync.ts`

**Pattern:** Copy structure from `batch-adjustment-sync.ts`

```typescript
import { MetrcClient } from '../client'
import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import {
  validatePhaseTransition,
  mapStageToMetrcPhase,
} from '../validation/phase-transition-rules'

export interface PhaseSyncResult {
  success: boolean
  synced: boolean
  errors: string[]
  warnings: string[]
  syncLogId?: string
}

/**
 * Sync growth phase transition to Metrc
 */
export async function syncPhaseTransitionToMetrc(
  batchId: string,
  oldStage: string,
  newStage: string,
  userId: string,
  transitionDate: string
): Promise<PhaseSyncResult> {
  const supabase = await createClient()
  const result: PhaseSyncResult = {
    success: false,
    synced: false,
    errors: [],
    warnings: [],
  }

  try {
    // 1. Check if batch is synced to Metrc
    const { data: mapping, error: mappingError } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_batch_id, metrc_growth_phase, site_id, organization_id')
      .eq('batch_id', batchId)
      .single()

    if (mappingError || !mapping) {
      result.success = true
      result.synced = false
      return result
    }

    // 2. Map to Metrc growth phase
    const newMetrcPhase = mapStageToMetrcPhase(newStage)
    if (!newMetrcPhase) {
      result.success = true
      result.synced = false
      result.warnings.push(`Stage "${newStage}" does not map to Metrc phase`)
      return result
    }

    // 3. Validate phase transition
    const validation = validatePhaseTransition({
      batchId,
      currentStage: oldStage,
      newStage,
      currentMetrcPhase: mapping.metrc_growth_phase,
      transitionDate,
    })

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }

    validation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // 4. Get API keys
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('compliance_api_keys')
      .select('*')
      .eq('site_id', mapping.site_id)
      .eq('is_active', true)
      .single()

    if (apiKeyError || !apiKey) {
      throw new Error('No active Metrc API key found for this site')
    }

    // 5. Get previous phase start date from batch_stage_history
    const { data: previousHistory } = await supabase
      .from('batch_stage_history')
      .select('started_at')
      .eq('batch_id', batchId)
      .eq('stage', oldStage)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    const growthPhaseStartDate = previousHistory?.started_at
      ? new Date(previousHistory.started_at).toISOString().split('T')[0]
      : new Date(transitionDate).toISOString().split('T')[0]

    // 6. Create sync log
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: mapping.organization_id,
      site_id: mapping.site_id,
      sync_type: 'plant_batch_phase_transitions',
      direction: 'push',
      operation: 'change_phase',
      local_id: batchId,
      initiated_by: userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    await updateSyncLogEntry(syncLog.id, { status: 'in_progress' })

    // 7. Initialize Metrc client
    const metrcClient = new MetrcClient({
      vendorApiKey: apiKey.vendor_api_key,
      userApiKey: apiKey.user_api_key,
      facilityLicenseNumber: apiKey.facility_license_number,
      state: apiKey.state_code,
      isSandbox: apiKey.is_sandbox,
    })

    // 8. Build Metrc payload
    const phaseChange = {
      Id: parseInt(mapping.metrc_batch_id),
      NewGrowthPhase: newMetrcPhase,
      NewGrowthDate: new Date(transitionDate).toISOString().split('T')[0],
      GrowthPhaseStartDate: growthPhaseStartDate,
    }

    // 9. Call Metrc API
    await metrcClient.plantBatches.changeGrowthPhase([phaseChange])

    // 10. Update mapping with new phase
    await supabase
      .from('metrc_batch_mappings')
      .update({
        metrc_growth_phase: newMetrcPhase,
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
      })
      .eq('batch_id', batchId)

    // 11. Complete sync log
    await updateSyncLogEntry(syncLog.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        metrc_batch_id: mapping.metrc_batch_id,
        old_stage: oldStage,
        new_stage: newStage,
        old_phase: mapping.metrc_growth_phase,
        new_phase: newMetrcPhase,
      },
    })

    result.success = true
    result.synced = true
    return result
  } catch (error) {
    const errorMessage = (error as Error).message

    if (result.syncLogId) {
      await updateSyncLogEntry(result.syncLogId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
    }

    result.errors.push(errorMessage)
    result.success = false
    return result
  }
}
```

### 4. Update Batch Queries (1 hour)
**File:** `lib/supabase/queries/batches.ts`

Find the `transitionBatchStage()` function and add auto-sync hook:

```typescript
export async function transitionBatchStage(
  batchId: string,
  newStage: BatchStage,
  userId: string,
  notes?: string
) {
  try {
    const supabase = await createClient()

    // Get current stage for comparison
    const { data: batch } = await getBatchById(batchId)
    const currentStage = batch?.stage

    // Use the database function for proper validation and event logging
    const { error } = await supabase.rpc('transition_batch_stage', {
      p_batch_id: batchId,
      p_new_stage: newStage,
      p_user_id: userId,
      p_notes: notes,
    })

    if (error) throw error

    await advanceRecipeStageForBatch({
      supabase,
      batchId,
      userId,
    })

    // 🆕 AUTO-SYNC TO METRC (non-blocking)
    if (batch?.domain_type === 'cannabis' && currentStage && currentStage !== newStage) {
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

    // Get updated batch
    return await getBatchById(batchId)
  } catch (error) {
    console.error('Error in transitionBatchStage:', error)
    return { data: null, error }
  }
}
```

### 5. UI Component (1.5 hours)
**File:** `components/features/batches/transition-stage-dialog.tsx`

**Pattern:** Copy from `update-plant-count-dialog.tsx` and adapt

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Info } from 'lucide-react'
import { toast } from 'sonner'

interface TransitionStageDialogProps {
  batchId: string
  batchNumber: string
  currentStage: string
  isSyncedToMetrc: boolean
  domainType: 'cannabis' | 'produce'
  onTransition: () => void
  trigger?: React.ReactNode
}

// Map stages to valid next stages
const STAGE_TRANSITIONS: Record<string, { value: string; label: string }[]> = {
  germination: [
    { value: 'clone', label: 'Clone' },
    { value: 'vegetative', label: 'Vegetative' },
  ],
  clone: [
    { value: 'vegetative', label: 'Vegetative' },
    { value: 'flowering', label: 'Flowering' },
  ],
  vegetative: [
    { value: 'flowering', label: 'Flowering' },
    { value: 'harvest', label: 'Harvest' },
  ],
  flowering: [
    { value: 'harvest', label: 'Harvest' },
    { value: 'drying', label: 'Drying' },
  ],
  harvest: [{ value: 'drying', label: 'Drying' }],
  drying: [{ value: 'curing', label: 'Curing' }],
  curing: [], // Terminal
}

export function TransitionStageDialog({
  batchId,
  batchNumber,
  currentStage,
  isSyncedToMetrc,
  domainType,
  onTransition,
  trigger,
}: TransitionStageDialogProps) {
  const [open, setOpen] = useState(false)
  const [newStage, setNewStage] = useState('')
  const [notes, setNotes] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const validTransitions = STAGE_TRANSITIONS[currentStage] || []

  const handleTransition = async () => {
    if (!newStage) {
      toast.error('Please select a new stage')
      return
    }

    try {
      setIsTransitioning(true)

      const response = await fetch('/api/batches/transition-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          newStage,
          notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Transition failed')
      }

      toast.success(`Batch transitioned to ${newStage}`)

      if (isSyncedToMetrc && domainType === 'cannabis') {
        toast.info('Phase change will be synced to Metrc automatically')
      }

      setOpen(false)
      onTransition()
    } catch (error) {
      console.error('Failed to transition stage:', error)
      toast.error((error as Error).message || 'Failed to transition stage')
    } finally {
      setIsTransitioning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Transition Stage</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transition Batch Stage</DialogTitle>
          <DialogDescription>
            Change the growth stage for batch {batchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isSyncedToMetrc && domainType === 'cannabis' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This batch is synced to Metrc. Stage changes will be automatically pushed to
                Metrc.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label>Current Stage</Label>
            <div className="text-sm font-medium capitalize">{currentStage}</div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="newStage">New Stage *</Label>
            {validTransitions.length > 0 ? (
              <Select value={newStage} onValueChange={setNewStage}>
                <SelectTrigger id="newStage">
                  <SelectValue placeholder="Select new stage" />
                </SelectTrigger>
                <SelectContent>
                  {validTransitions.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground">
                This stage is terminal. No further transitions available.
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this stage transition..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isTransitioning}>
            Cancel
          </Button>
          <Button
            onClick={handleTransition}
            disabled={isTransitioning || !newStage || validTransitions.length === 0}
          >
            {isTransitioning ? 'Transitioning...' : 'Transition Stage'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 6. API Route (30 min)
**File:** `app/api/batches/transition-stage/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { transitionBatchStage } from '@/lib/supabase/queries/batches'

/**
 * POST /api/batches/transition-stage
 *
 * Transitions a batch to a new growth stage
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { batchId, newStage, notes } = body

    // Validate required fields
    if (!batchId) {
      return NextResponse.json(
        { success: false, message: 'Batch ID is required' },
        { status: 400 }
      )
    }

    if (!newStage) {
      return NextResponse.json(
        { success: false, message: 'New stage is required' },
        { status: 400 }
      )
    }

    // Transition stage
    const { data, error } = await transitionBatchStage(batchId, newStage, user.id, notes)

    if (error) {
      console.error('Error transitioning stage:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to transition stage', error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Stage transitioned successfully',
      data,
    })
  } catch (error) {
    console.error('Error in transition-stage API:', error)
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
```

### 7. Unit Tests (2 hours)
**File:** `lib/compliance/metrc/validation/__tests__/phase-transition.test.ts`

```typescript
import {
  validatePhaseTransition,
  mapStageToMetrcPhase,
  getValidStageTransitions,
  getValidMetrcPhaseTransitions,
} from '../phase-transition-rules'

describe('mapStageToMetrcPhase', () => {
  it('should map TRAZO stages to Metrc phases', () => {
    expect(mapStageToMetrcPhase('clone')).toBe('Clone')
    expect(mapStageToMetrcPhase('vegetative')).toBe('Vegetative')
    expect(mapStageToMetrcPhase('flowering')).toBe('Flowering')
  })

  it('should return null for non-Metrc stages', () => {
    expect(mapStageToMetrcPhase('germination')).toBeNull()
    expect(mapStageToMetrcPhase('harvest')).toBeNull()
    expect(mapStageToMetrcPhase('drying')).toBeNull()
    expect(mapStageToMetrcPhase('curing')).toBeNull()
  })
})

describe('getValidStageTransitions', () => {
  it('should return valid transitions for each stage', () => {
    expect(getValidStageTransitions('clone')).toEqual(['vegetative', 'flowering'])
    expect(getValidStageTransitions('vegetative')).toEqual(['flowering', 'harvest'])
    expect(getValidStageTransitions('flowering')).toEqual(['harvest', 'drying'])
  })

  it('should return empty array for terminal stages', () => {
    expect(getValidStageTransitions('curing')).toEqual([])
  })
})

describe('validatePhaseTransition', () => {
  it('should validate valid transition', () => {
    const result = validatePhaseTransition({
      batchId: 'batch-1',
      currentStage: 'clone',
      newStage: 'vegetative',
      transitionDate: '2025-11-18',
    })
    expect(result.isValid).toBe(true)
  })

  it('should fail for invalid transition', () => {
    const result = validatePhaseTransition({
      batchId: 'batch-1',
      currentStage: 'flowering',
      newStage: 'vegetative', // Backward transition
      transitionDate: '2025-11-18',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_STAGE_TRANSITION')).toBe(true)
  })

  it('should validate Metrc phase transition when synced', () => {
    const result = validatePhaseTransition({
      batchId: 'batch-1',
      currentStage: 'clone',
      newStage: 'vegetative',
      currentMetrcPhase: 'Clone',
      transitionDate: '2025-11-18',
    })
    expect(result.isValid).toBe(true)
  })

  it('should fail for invalid Metrc phase transition', () => {
    const result = validatePhaseTransition({
      batchId: 'batch-1',
      currentStage: 'vegetative',
      newStage: 'clone', // Invalid Metrc transition
      currentMetrcPhase: 'Vegetative',
      transitionDate: '2025-11-18',
    })
    expect(result.isValid).toBe(false)
  })

  it('should warn for terminal Metrc phase', () => {
    const result = validatePhaseTransition({
      batchId: 'batch-1',
      currentStage: 'flowering',
      newStage: 'harvest',
      currentMetrcPhase: 'Flowering',
      transitionDate: '2025-11-18',
    })
    // Flowering is terminal in Metrc, so transitioning to harvest won't sync
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('should warn for non-Metrc stages', () => {
    const result = validatePhaseTransition({
      batchId: 'batch-1',
      currentStage: 'flowering',
      newStage: 'drying',
      currentMetrcPhase: 'Flowering',
      transitionDate: '2025-11-18',
    })
    expect(result.warnings.some((w) => w.code === 'NO_METRC_PHASE_MAPPING')).toBe(true)
  })

  it('should fail for terminal stage transitions', () => {
    const result = validatePhaseTransition({
      batchId: 'batch-1',
      currentStage: 'curing',
      newStage: 'flowering',
      transitionDate: '2025-11-18',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'TERMINAL_STAGE')).toBe(true)
  })

  it('should fail for future dates', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    const futureDateStr = futureDate.toISOString()

    const result = validatePhaseTransition({
      batchId: 'batch-1',
      currentStage: 'clone',
      newStage: 'vegetative',
      transitionDate: futureDateStr,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'FUTURE_DATE')).toBe(true)
  })
})
```

---

## 🏃‍♂️ IMPLEMENTATION STEPS (Week 3)

### Day 1: Setup & Validation (2-3 hours)
1. Read all documentation (30 min)
2. Create and apply database migration (15 min)
3. Create `phase-transition-rules.ts` (1 hour)
4. Write unit tests for validation (1 hour)
5. Run tests, ensure passing

### Day 2: Sync Service (2-3 hours)
1. Create `batch-phase-sync.ts` (2 hours)
   - Copy structure from batch-adjustment-sync.ts
   - Adapt for growth phase API
   - Use validation from phase-transition-rules.ts
2. Test sync service logic (1 hour)

### Day 3: Integration (2-3 hours)
1. Update `transitionBatchStage()` with auto-sync (1 hour)
2. Test end-to-end flow (1 hour)
3. Verify non-blocking behavior (30 min)
4. Test error scenarios (30 min)

### Day 4: UI & API (2-3 hours)
1. Create `TransitionStageDialog` component (1.5 hours)
2. Create API route (30 min)
3. Manual testing in UI (1 hour)

---

## 🧪 TESTING CHECKLIST

### Unit Tests
- [ ] `phase-transition.test.ts` - All validation scenarios
- [ ] Stage mapping logic tested
- [ ] Metrc phase transitions tested
- [ ] Terminal stage handling

### Integration Tests
- [ ] Transition clone → vegetative → flowering
- [ ] Metrc phase updates correctly
- [ ] Sync status updates
- [ ] Non-blocking on Metrc failure

### Manual Testing (Metrc Sandbox)
- [ ] Create batch in clone stage
- [ ] Push to Metrc
- [ ] Transition to vegetative (verify Metrc updated)
- [ ] Transition to flowering (verify Metrc updated)
- [ ] Check sync logs
- [ ] Test with non-cannabis (no sync)

---

## 📚 REFERENCE FILES

### Files to Read
- `lib/compliance/metrc/sync/batch-adjustment-sync.ts` - Sync pattern
- `lib/compliance/metrc/validation/batch-rules.ts` - Validation pattern
- `components/features/batches/update-plant-count-dialog.tsx` - UI pattern

### Files to Update
- `lib/supabase/queries/batches.ts` - Add auto-sync hook

### Database Tables
- `metrc_batch_mappings.metrc_growth_phase` - NEW column
- `batch_stage_history` - Existing, used for tracking
- `compliance_sync_logs` - Sync tracking

---

## ✅ WEEK 3 COMPLETION CHECKLIST

- [ ] Migration created and applied
- [ ] `phase-transition-rules.ts` created
- [ ] `batch-phase-sync.ts` created
- [ ] `transitionBatchStage()` enhanced
- [ ] `TransitionStageDialog` component created
- [ ] API endpoint created
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests completed
- [ ] Manual testing successful
- [ ] Documentation updated
- [ ] Git commit: "feat(compliance): Phase 3.5 Week 3 - Growth phase transition sync"

---

## 🆘 TROUBLESHOOTING

### Metrc API Returns 400 Error
- Check phase transition is valid
- Verify growth phase start date is correct
- Review Metrc API docs for growth phase changes

### Stage Transitioned but Not Synced
- Check batch is synced to Metrc
- Verify stage maps to Metrc phase
- Look for errors in sync logs

### Invalid Metrc Phase Transition
- Verify current Metrc phase in database matches reality
- Check Metrc allows the transition
- Ensure not trying to transition terminal phase

---

## 💡 PRO TIPS

1. **Use existing patterns** - Week 1 and 2 established the patterns to follow
2. **Test early** - Run validation tests before building sync service
3. **Non-blocking is key** - Never let Metrc failures block TRAZO operations
4. **Terminal stages matter** - Harvest/drying/curing don't sync to Metrc
5. **Stage history is golden** - Use it to get previous phase start dates
6. **Manual retry always** - Provide UI for manual sync retry

---

## 📞 NEED HELP?

**Documentation:**
- [Growth Phase Transition Spec](./docs/compliance/GROWTH_PHASE_TRANSITION_SYNC.md)
- [Week 1 Implementation](./docs/compliance/BATCH_PUSH_SYNC_IMPLEMENTATION.md)
- [Week 2 Implementation](./docs/compliance/WEEK_2_IMPLEMENTATION_SUMMARY.md)

**Code References:**
- Sync service: `lib/compliance/metrc/sync/batch-adjustment-sync.ts`
- Batch queries: `lib/supabase/queries/batches.ts`
- Stage history: `batch_stage_history` table

**Metrc Resources:**
- [Metrc API Docs - Growth Phases](https://api-ca.metrc.com/Documentation/#PlantBatches.get_plantbatches_v2_changegrowthphase)

---

**Good luck! Let's get growth phases syncing! 🌱**

**When complete, move to Week 4: Plant Tag Management**
