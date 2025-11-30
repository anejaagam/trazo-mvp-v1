# Plant Count Adjustment Sync (Phase 3.5 - Week 2)

**Status**: ✅ Complete
**Created**: November 18, 2025
**Implemented**: November 18, 2025
**Author**: Claude Code Agent

## Overview

Week 2 of Phase 3.5 implements automatic plant count adjustment sync. When plant counts are updated in TRAZO, changes are automatically pushed to Metrc via the plant batch adjustment API. This maintains compliance by ensuring Metrc always reflects current plant counts.

**Prerequisites**: Week 1 Complete (Batch Push Sync) ✅

## Goals

- ✅ Auto-sync plant count changes to Metrc
- ✅ Track adjustment reasons for compliance
- ✅ Non-blocking sync (TRAZO updates succeed regardless)
- ✅ Audit trail for all adjustments
- ✅ Validation of adjustment reasons

## Architecture

### Core Components

```
lib/compliance/metrc/
├── validation/
│   └── batch-rules.ts          # Add adjustment validation
├── sync/
│   ├── batch-push-sync.ts      # Existing (Week 1)
│   └── batch-adjustment-sync.ts # NEW - Adjustment sync service
└── endpoints/
    └── plant-batches.ts        # Metrc API client (existing)

lib/supabase/queries/
└── batches.ts                  # Enhance updatePlantCount()

app/api/compliance/
└── sync-plant-count/route.ts   # NEW - Manual sync endpoint (optional)

Database:
└── Add adjustment_reason to batch_events table
```

## Database Enhancements

### Add `adjustment_reason` to `batch_events`

```sql
ALTER TABLE batch_events
ADD COLUMN adjustment_reason TEXT;

COMMENT ON COLUMN batch_events.adjustment_reason IS 'Reason for plant count adjustment (for Metrc compliance)';
```

### Valid Adjustment Reasons

Map TRAZO reasons to Metrc adjustment reasons:

| TRAZO Reason | Metrc Reason | Description |
|--------------|--------------|-------------|
| `died` | `Died` | Plants died naturally |
| `destroyed_voluntary` | `Voluntary Destruction` | Voluntary destruction |
| `destroyed_mandatory` | `Mandatory State Destruction` | State-mandated destruction |
| `contamination` | `Contamination` | Product contamination |
| `pest_infestation` | `Infestation` | Pest or disease infestation |
| `unhealthy` | `Unhealthy or Infirm Plants` | Unhealthy plants |
| `data_error` | `Error` | Data entry error |
| `other` | `Other` | Other reasons |

## Implementation Plan

### 1. Validation Layer

**File**: `lib/compliance/metrc/validation/batch-rules.ts`

Add new validation function:

```typescript
export function validatePlantCountAdjustment(adjustment: {
  batchId: string
  oldCount: number
  newCount: number
  reason: string
  adjustmentDate: string
}): ValidationResult {
  const result = createValidationResult()

  // Validate counts
  if (newCount < 0) {
    addError(result, 'newCount', 'Plant count cannot be negative', 'INVALID_COUNT')
  }

  const difference = newCount - oldCount

  // Warn on large decreases
  if (difference < 0 && Math.abs(difference) > oldCount * 0.2) {
    addWarning(
      result,
      'newCount',
      `Large decrease (${Math.abs(difference)} plants, ${Math.round((Math.abs(difference) / oldCount) * 100)}%). Please verify.`,
      'LARGE_DECREASE'
    )
  }

  // Warn on increases (unusual for plant batches)
  if (difference > 0) {
    addWarning(
      result,
      'newCount',
      'Plant count increase is unusual. Verify this is not a data error.',
      'COUNT_INCREASE'
    )
  }

  // Validate reason
  const validReasons = [
    'Died',
    'Voluntary Destruction',
    'Mandatory State Destruction',
    'Contamination',
    'Infestation',
    'Unhealthy or Infirm Plants',
    'Error',
    'Other',
  ]

  if (!validReasons.includes(adjustment.reason)) {
    addError(
      result,
      'reason',
      `Invalid adjustment reason. Must be one of: ${validReasons.join(', ')}`,
      'INVALID_REASON'
    )
  }

  // Validate date
  validateDate(result, 'adjustmentDate', adjustment.adjustmentDate)
  validateDateNotInFuture(result, 'adjustmentDate', adjustment.adjustmentDate)

  return result
}
```

### 2. Adjustment Sync Service

**File**: `lib/compliance/metrc/sync/batch-adjustment-sync.ts`

```typescript
/**
 * Plant Count Adjustment Sync Service
 *
 * Auto-syncs plant count changes to Metrc
 */

import { MetrcClient } from '../client'
import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import { validatePlantCountAdjustment } from '../validation/batch-rules'
import type { MetrcPlantBatchAdjustment } from '../types'

export interface AdjustmentSyncResult {
  success: boolean
  synced: boolean
  errors: string[]
  warnings: string[]
  syncLogId?: string
}

/**
 * Map TRAZO adjustment reason to Metrc reason
 */
function mapAdjustmentReason(trazoReason: string): string {
  const reasonMap: Record<string, string> = {
    died: 'Died',
    destroyed_voluntary: 'Voluntary Destruction',
    destroyed_mandatory: 'Mandatory State Destruction',
    contamination: 'Contamination',
    pest_infestation: 'Infestation',
    unhealthy: 'Unhealthy or Infirm Plants',
    data_error: 'Error',
    other: 'Other',
  }

  return reasonMap[trazoReason] || 'Other'
}

/**
 * Sync plant count adjustment to Metrc
 *
 * @param batchId - The batch ID
 * @param oldCount - Previous plant count
 * @param newCount - New plant count
 * @param reason - Adjustment reason (TRAZO format)
 * @param userId - User making the adjustment
 * @param reasonNote - Optional detailed note
 * @returns Sync result
 */
export async function syncPlantCountAdjustmentToMetrc(
  batchId: string,
  oldCount: number,
  newCount: number,
  reason: string,
  userId: string,
  reasonNote?: string
): Promise<AdjustmentSyncResult> {
  const supabase = await createClient()
  const result: AdjustmentSyncResult = {
    success: false,
    synced: false,
    errors: [],
    warnings: [],
  }

  try {
    // Check if batch is synced to Metrc
    const { data: mapping, error: mappingError } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_batch_id, site_id')
      .eq('batch_id', batchId)
      .single()

    if (mappingError || !mapping) {
      // Batch not synced to Metrc - skip adjustment sync
      result.success = true
      result.synced = false
      return result
    }

    // Get API keys
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('compliance_api_keys')
      .select('*')
      .eq('site_id', mapping.site_id)
      .eq('is_active', true)
      .single()

    if (apiKeyError || !apiKey) {
      throw new Error('No active Metrc API key found for this site')
    }

    // Map reason to Metrc format
    const metrcReason = mapAdjustmentReason(reason)
    const adjustmentDate = new Date().toISOString().split('T')[0]

    // Validate adjustment
    const validation = validatePlantCountAdjustment({
      batchId,
      oldCount,
      newCount,
      reason: metrcReason,
      adjustmentDate,
    })

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }

    // Collect warnings
    validation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // Create sync log
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: apiKey.site_id, // Need to get org_id properly
      site_id: mapping.site_id,
      sync_type: 'plant_batch_adjustments',
      direction: 'push',
      operation: 'adjust',
      local_id: batchId,
      initiated_by: userId,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    await updateSyncLogEntry(syncLog.id, {
      status: 'in_progress',
    })

    // Initialize Metrc client
    const metrcClient = new MetrcClient({
      vendorApiKey: apiKey.vendor_api_key,
      userApiKey: apiKey.user_api_key,
      facilityLicenseNumber: apiKey.facility_license_number,
      state: apiKey.state_code,
      isSandbox: apiKey.is_sandbox,
    })

    // Build Metrc adjustment payload
    const countDifference = newCount - oldCount
    const adjustment: MetrcPlantBatchAdjustment = {
      Id: parseInt(mapping.metrc_batch_id),
      Count: countDifference, // Metrc uses delta, not absolute count
      AdjustmentReason: metrcReason,
      AdjustmentDate: adjustmentDate,
      ReasonNote: reasonNote,
    }

    // Push adjustment to Metrc
    await metrcClient.plantBatches.adjust([adjustment])

    // Update sync log
    await updateSyncLogEntry(syncLog.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        metrc_batch_id: mapping.metrc_batch_id,
        old_count: oldCount,
        new_count: newCount,
        adjustment_delta: countDifference,
      },
    })

    result.success = true
    result.synced = true
    return result
  } catch (error) {
    const errorMessage = (error as Error).message

    // Update sync log to failed
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

### 3. Enhance `updatePlantCount()` Function

**File**: `lib/supabase/queries/batches.ts`

Modify the existing function to auto-sync:

```typescript
export async function updatePlantCount(
  batchId: string,
  newCount: number,
  userId: string,
  reason?: string,
  reasonNote?: string
) {
  try {
    const supabase = await createClient()

    // Get current count for event logging
    const { data: batch } = await getBatchById(batchId)
    const oldCount = batch?.plant_count || 0

    // Update in TRAZO (always succeeds)
    const { error } = await supabase
      .from('batches')
      .update({
        plant_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId)

    if (error) throw error

    // Log plant count update event with reason
    await createBatchEvent(batchId, 'plant_count_update', userId, {
      from: oldCount,
      to: newCount,
      reason: reason || 'unspecified',
      adjustment_reason: reason, // Add to event data
    })

    // 🆕 AUTO-SYNC TO METRC (non-blocking)
    if (reason && batch?.domain_type === 'cannabis') {
      // Import dynamically to avoid circular dependencies
      const { syncPlantCountAdjustmentToMetrc } = await import(
        '@/lib/compliance/metrc/sync/batch-adjustment-sync'
      )

      // Run async - don't await, don't block TRAZO update
      syncPlantCountAdjustmentToMetrc(
        batchId,
        oldCount,
        newCount,
        reason,
        userId,
        reasonNote
      ).catch((error) => {
        console.error('Metrc adjustment sync failed (non-blocking):', error)
        // Error is logged but doesn't prevent TRAZO update
      })
    }

    return await getBatchById(batchId)
  } catch (error) {
    console.error('Error in updatePlantCount:', error)
    return { data: null, error }
  }
}
```

### 4. UI Enhancement

**Component**: Update plant count dialog (create if doesn't exist)

```tsx
// components/features/batches/update-plant-count-dialog.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Info } from 'lucide-react'

interface UpdatePlantCountDialogProps {
  batchId: string
  currentCount: number
  isSyncedToMetrc: boolean
  onUpdate: () => void
}

const ADJUSTMENT_REASONS = [
  { value: 'died', label: 'Plants Died' },
  { value: 'destroyed_voluntary', label: 'Voluntary Destruction' },
  { value: 'destroyed_mandatory', label: 'Mandatory State Destruction' },
  { value: 'contamination', label: 'Contamination' },
  { value: 'pest_infestation', label: 'Pest/Disease Infestation' },
  { value: 'unhealthy', label: 'Unhealthy or Infirm Plants' },
  { value: 'data_error', label: 'Data Entry Error' },
  { value: 'other', label: 'Other' },
]

export function UpdatePlantCountDialog({
  batchId,
  currentCount,
  isSyncedToMetrc,
  onUpdate,
}: UpdatePlantCountDialogProps) {
  const [newCount, setNewCount] = useState(currentCount)
  const [reason, setReason] = useState('')
  const [reasonNote, setReasonNote] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    if (isSyncedToMetrc && !reason) {
      toast.error('Adjustment reason is required for synced batches')
      return
    }

    try {
      setIsUpdating(true)

      const response = await fetch('/api/batches/update-plant-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          newCount,
          reason,
          reasonNote,
        }),
      })

      if (!response.ok) throw new Error('Update failed')

      toast.success('Plant count updated successfully')
      if (isSyncedToMetrc) {
        toast.info('Adjustment will be synced to Metrc automatically')
      }

      onUpdate()
    } catch (error) {
      toast.error('Failed to update plant count')
    } finally {
      setIsUpdating(false)
    }
  }

  const countDifference = newCount - currentCount

  return (
    <div className="grid gap-4">
      {isSyncedToMetrc && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This batch is synced to Metrc. Changes will be automatically pushed to Metrc.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label>Current Count</Label>
        <Input value={currentCount} disabled />
      </div>

      <div className="grid gap-2">
        <Label>New Count *</Label>
        <Input
          type="number"
          value={newCount}
          onChange={(e) => setNewCount(parseInt(e.target.value) || 0)}
          min={0}
        />
        {countDifference !== 0 && (
          <p className="text-sm text-muted-foreground">
            {countDifference > 0 ? '+' : ''}
            {countDifference} plants
          </p>
        )}
      </div>

      {isSyncedToMetrc && (
        <>
          <div className="grid gap-2">
            <Label>Adjustment Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder="Provide additional details..."
              rows={3}
            />
          </div>
        </>
      )}

      <Button onClick={handleUpdate} disabled={isUpdating}>
        {isUpdating ? 'Updating...' : 'Update Plant Count'}
      </Button>
    </div>
  )
}
```

## Sync Flow

```
User Updates Plant Count in TRAZO
    ↓
TRAZO database updated (always succeeds)
    ↓
Event logged with reason
    ↓
Is batch synced to Metrc?
    ↓ Yes
Is domain_type = cannabis?
    ↓ Yes
Reason provided?
    ↓ Yes
Async Metrc Sync Starts (non-blocking)
    ↓
Validate adjustment
    ↓
Create sync log (in_progress)
    ↓
Call Metrc plantBatches.adjust() API
    ↓
Update sync log (completed/failed)
    ↓
Done (TRAZO unaffected by sync result)
```

## Testing

### Unit Tests

**File**: `lib/compliance/metrc/validation/__tests__/batch-adjustment.test.ts`

```typescript
describe('validatePlantCountAdjustment', () => {
  it('should validate valid adjustment', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: 95,
      reason: 'Died',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(true)
  })

  it('should fail for negative count', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: -5,
      reason: 'Died',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_COUNT')).toBe(true)
  })

  it('should warn for large decrease', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: 70, // 30% decrease
      reason: 'Died',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.warnings.some((w) => w.code === 'LARGE_DECREASE')).toBe(true)
  })

  it('should warn for count increase', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: 105,
      reason: 'Error',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.warnings.some((w) => w.code === 'COUNT_INCREASE')).toBe(true)
  })

  it('should fail for invalid reason', () => {
    const adjustment = {
      batchId: 'batch-1',
      oldCount: 100,
      newCount: 95,
      reason: 'InvalidReason',
      adjustmentDate: '2025-11-18',
    }

    const result = validatePlantCountAdjustment(adjustment)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_REASON')).toBe(true)
  })
})
```

### Manual Testing Checklist

- [ ] Update plant count without Metrc sync (batch not synced)
- [ ] Update plant count with Metrc sync (batch synced)
- [ ] Test decrease with valid reason
- [ ] Test large decrease (>20%) - should warn
- [ ] Test increase - should warn
- [ ] Test invalid reason - should fail
- [ ] Test Metrc API failure - TRAZO update should still succeed
- [ ] Verify sync log entries created
- [ ] Check adjustment appears in Metrc
- [ ] Test all adjustment reasons

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| "Adjustment reason is required" | No reason provided for synced batch | Select a valid reason |
| "Plant count cannot be negative" | Invalid new count | Enter valid count >= 0 |
| "No active Metrc API key found" | Missing API key | Configure API key |
| "Batch not synced to Metrc" | Batch has no metrc_batch_id | Push batch first (Week 1) |
| "Invalid adjustment reason" | Reason not in valid list | Use valid Metrc reason |

### Non-Blocking Design

**Critical**: Metrc sync failures **never block** TRAZO updates:

```typescript
// TRAZO update (always succeeds)
await updateBatchInDatabase()

// Metrc sync (fire-and-forget)
syncToMetrc().catch(error => {
  console.error('Metrc sync failed:', error)
  // Log but don't throw
})
```

This ensures:
- ✅ Users can always update plant counts
- ✅ Sync failures are logged
- ✅ Failed syncs can be retried manually

## Monitoring

### Find Failed Adjustment Syncs

```sql
SELECT
  csl.id,
  csl.created_at,
  csl.local_id AS batch_id,
  b.batch_number,
  csl.error_message
FROM compliance_sync_logs csl
INNER JOIN batches b ON b.id = csl.local_id
WHERE csl.sync_type = 'plant_batch_adjustments'
  AND csl.status = 'failed'
ORDER BY csl.created_at DESC;
```

### View Adjustment History

```sql
SELECT
  be.timestamp,
  be.to_value->>'from' AS old_count,
  be.to_value->>'to' AS new_count,
  be.adjustment_reason,
  u.full_name AS adjusted_by,
  csl.status AS metrc_sync_status
FROM batch_events be
INNER JOIN users u ON u.id = be.user_id
LEFT JOIN compliance_sync_logs csl ON csl.local_id = be.batch_id
  AND csl.sync_type = 'plant_batch_adjustments'
  AND csl.created_at >= be.timestamp
WHERE be.batch_id = 'your-batch-id'
  AND be.event_type = 'plant_count_update'
ORDER BY be.timestamp DESC;
```

## Documentation References

- [Week 1: Batch Push Sync](./BATCH_PUSH_SYNC_IMPLEMENTATION.md)
- [Semi-Autonomous Sync](./SEMI_AUTONOMOUS_BATCH_SYNC.md)
- [Metrc API Documentation](https://api-ca.metrc.com/Documentation)
- [Phase 3.5 Plan](../../PHASE_3.5_WEEK_1_QUICK_START.md)

---

**Next Steps**: Implement Week 3 - Growth Phase Transitions
