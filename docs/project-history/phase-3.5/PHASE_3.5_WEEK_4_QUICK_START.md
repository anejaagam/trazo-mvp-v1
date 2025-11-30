# Quick Start Guide - Phase 3.5 Week 4 (Plant Tag Management)

**For:** Next agent working on compliance engine
**Phase:** 3.5 - Plant Batch Lifecycle Integration
**Week:** 4 - Plant Tag Management & Individual Plant Tracking
**Duration:** 10-12 hours
**Priority:** 🔴 CRITICAL - Required for complete Metrc compliance

---
## 📖 REQUIRED READING (Do this first!)

1. **[Week 3 Summary](./docs/compliance/WEEK_3_IMPLEMENTATION_SUMMARY.md)** (10 min review)
   - Understand growth phase transition foundation
   - Phase-to-stage mapping
   - Non-blocking sync pattern

2. **[Week 1 Summary](./docs/compliance/BATCH_PUSH_SYNC_IMPLEMENTATION.md)** (5 min review)
   - Batch push sync pattern
   - Sync log system
   - Validation approach

3. **[Week 2 Summary](./docs/compliance/WEEK_2_IMPLEMENTATION_SUMMARY.md)** (5 min review)
   - Plant count adjustment pattern
   - UI component structure
   - Auto-sync conditions

4. **[COMPLIANCE_INTEGRATION_GAP_ANALYSIS.md](./COMPLIANCE_INTEGRATION_GAP_ANALYSIS.md)** (Section 2.2, 10 min)
   - Tag assignment requirements
   - Metrc tag tracking rules
   - Compliance workflows

**Total Reading Time:** ~30 minutes (don't skip this!)

---

## 🎯 WEEK 4 GOAL: Plant Tag Management

**Objective:** Track individual plant tags, enable plant-level Metrc operations, and complete batch lifecycle integration

### What You're Building

When a user assigns Metrc tags to plants in a batch:
```typescript
// User assigns tags to batch plants
await assignMetrcTagsToBatch({
  batchId: 'batch-123',
  tags: ['1A4FF01000000220000001', '1A4FF01000000220000002'],
  assignedBy: userId
})
// ✅ Tags stored in TRAZO (batch.metrc_plant_labels)
// ✅ Individual plant records created (if needed)
// ✅ Metrc plant batch updated with tags
// ✅ Tag assignment logged for audit

// Now growth phase changes can sync to Metrc API
await transitionBatchStage(batchId, 'flowering', userId)
// ✅ Metrc API called: changeGrowthPhase([...tags])
// ✅ Individual plants tracked in Metrc
```

---

## 🗂️ FILES TO CREATE (in this order)

### 1. Database Migration (15 min)
**File:** `supabase/migrations/20251118000005_add_plant_tags_tracking.sql`

```sql
-- Add plant tag tracking to batches
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS metrc_plant_labels TEXT[] DEFAULT '{}';

COMMENT ON COLUMN batches.metrc_plant_labels IS
'Array of Metrc plant tag labels assigned to this batch. Used for individual plant tracking.';

-- Create index for tag lookups
CREATE INDEX IF NOT EXISTS idx_batches_metrc_plant_labels
ON batches USING GIN (metrc_plant_labels)
WHERE metrc_plant_labels IS NOT NULL AND array_length(metrc_plant_labels, 1) > 0;

-- Add tag assignment tracking to batch_events
ALTER TABLE batch_events
ADD COLUMN IF NOT EXISTS tags_assigned INTEGER;

COMMENT ON COLUMN batch_events.tags_assigned IS
'Number of Metrc tags assigned in this event (for tag_assignment events)';

-- Create individual plant tracking table (optional, for advanced tracking)
CREATE TABLE IF NOT EXISTS batch_plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  metrc_plant_label TEXT NOT NULL UNIQUE,
  plant_index INTEGER, -- Position in batch (1, 2, 3, etc.)
  growth_phase TEXT, -- Current Metrc growth phase
  status TEXT DEFAULT 'active', -- active, harvested, destroyed
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES users(id),
  destroyed_at TIMESTAMPTZ,
  destroyed_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_batch_plants_batch_id ON batch_plants(batch_id);
CREATE INDEX idx_batch_plants_status ON batch_plants(status);
CREATE INDEX idx_batch_plants_label ON batch_plants(metrc_plant_label);

COMMENT ON TABLE batch_plants IS
'Individual plant tracking within batches. Each plant has a unique Metrc tag.';
```

**Apply migration:**
```typescript
await mcp__supabase__apply_migration({
  name: 'add_plant_tags_tracking',
  query: '...' // paste SQL above
})
```

### 2. Tag Validation Rules (1 hour)
**File:** `lib/compliance/metrc/validation/tag-assignment-rules.ts`

```typescript
import type { ValidationResult } from '@/lib/compliance/types'
import {
  createValidationResult,
  validateRequired,
  addError,
  addWarning,
} from './validators'

/**
 * Metrc tag format: 1A4FF01000000220000001
 * Format: [State Code][License][Sequence]
 * Example: 1A4FF01 (CA license) + 0000002 (facility) + 2000000 (sequence) + 1 (tag)
 */
const METRC_TAG_REGEX = /^1A[A-Z0-9]{5}\d{10}\d{4}$/

/**
 * Validate Metrc tag format
 */
export function validateMetrcTagFormat(tag: string): ValidationResult {
  const result = createValidationResult()

  if (!tag || tag.trim().length === 0) {
    addError(result, 'tag', 'Tag cannot be empty', 'EMPTY_TAG')
    return result
  }

  if (!METRC_TAG_REGEX.test(tag)) {
    addError(
      result,
      'tag',
      'Invalid Metrc tag format. Expected: 1A[StateCode][License][Sequence] (24 chars)',
      'INVALID_TAG_FORMAT'
    )
  }

  return result
}

/**
 * Validate tag assignment to batch
 */
export function validateTagAssignment(assignment: {
  batchId: string
  tags: string[]
  currentPlantCount?: number
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'batchId', assignment.batchId)

  // Validate tags array
  if (!assignment.tags || assignment.tags.length === 0) {
    addError(result, 'tags', 'At least one tag is required', 'EMPTY_TAGS')
    return result
  }

  // Validate each tag format
  assignment.tags.forEach((tag, index) => {
    const tagValidation = validateMetrcTagFormat(tag)
    if (!tagValidation.isValid) {
      tagValidation.errors.forEach((error) => {
        result.errors.push({
          ...error,
          field: `tags[${index}]`,
        })
      })
      result.isValid = false
    }
  })

  // Check for duplicate tags
  const uniqueTags = new Set(assignment.tags)
  if (uniqueTags.size !== assignment.tags.length) {
    addError(
      result,
      'tags',
      'Duplicate tags found. Each tag must be unique.',
      'DUPLICATE_TAGS'
    )
  }

  // Warn if tag count doesn't match plant count
  if (assignment.currentPlantCount &&
      assignment.tags.length !== assignment.currentPlantCount) {
    addWarning(
      result,
      'tags',
      `Tag count (${assignment.tags.length}) does not match plant count (${assignment.currentPlantCount})`,
      'TAG_COUNT_MISMATCH'
    )
  }

  // Metrc typically limits batch size to 100 plants
  if (assignment.tags.length > 100) {
    addWarning(
      result,
      'tags',
      'Batch has more than 100 plants. Consider splitting for better tracking.',
      'LARGE_BATCH'
    )
  }

  return result
}

/**
 * Validate tag availability (not already used)
 */
export function validateTagAvailability(tags: string[]): ValidationResult {
  const result = createValidationResult()

  // This will be implemented with database checks in the sync service
  // For now, just validate format
  tags.forEach((tag, index) => {
    const tagValidation = validateMetrcTagFormat(tag)
    if (!tagValidation.isValid) {
      result.isValid = false
      result.errors.push(...tagValidation.errors.map((e) => ({
        ...e,
        field: `tags[${index}]`,
      })))
    }
  })

  return result
}
```

### 3. Tag Assignment Sync Service (2 hours)
**File:** `lib/compliance/metrc/sync/tag-assignment-sync.ts`

**Pattern:** Similar to `batch-phase-sync.ts` but for tag operations

```typescript
import { MetrcClient } from '../client'
import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import { validateTagAssignment } from '../validation/tag-assignment-rules'

export interface TagAssignmentResult {
  success: boolean
  tagsAssigned: number
  errors: string[]
  warnings: string[]
  syncLogId?: string
}

/**
 * Assign Metrc tags to batch plants
 *
 * @param batchId - The batch ID
 * @param tags - Array of Metrc plant tag labels
 * @param userId - User assigning tags
 * @returns Assignment result
 */
export async function assignMetrcTagsToBatch(
  batchId: string,
  tags: string[],
  userId: string
): Promise<TagAssignmentResult> {
  const supabase = await createClient()
  const result: TagAssignmentResult = {
    success: false,
    tagsAssigned: 0,
    errors: [],
    warnings: [],
  }

  try {
    // 1. Get batch
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, batch_number, plant_count, domain_type, site_id, organization_id, metrc_plant_labels')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      throw new Error('Batch not found')
    }

    // 2. Validate domain type
    if (batch.domain_type !== 'cannabis') {
      throw new Error('Tag assignment only applicable to cannabis batches')
    }

    // 3. Validate tag assignment
    const validation = validateTagAssignment({
      batchId,
      tags,
      currentPlantCount: batch.plant_count,
    })

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }

    validation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // 4. Check for existing tags
    const existingTags = batch.metrc_plant_labels || []
    const newTags = tags.filter((tag) => !existingTags.includes(tag))

    if (newTags.length === 0) {
      result.success = true
      result.warnings.push('All tags already assigned to this batch')
      return result
    }

    // 5. Check if batch is synced to Metrc
    const { data: mapping } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_batch_id, site_id, organization_id')
      .eq('batch_id', batchId)
      .single()

    // 6. Update batch with new tags
    const updatedTags = [...new Set([...existingTags, ...newTags])]

    const { error: updateError } = await supabase
      .from('batches')
      .update({
        metrc_plant_labels: updatedTags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId)

    if (updateError) throw updateError

    // 7. Create individual plant records (optional)
    const plantRecords = newTags.map((tag, index) => ({
      batch_id: batchId,
      metrc_plant_label: tag,
      plant_index: existingTags.length + index + 1,
      assigned_by: userId,
    }))

    if (plantRecords.length > 0) {
      await supabase.from('batch_plants').insert(plantRecords)
    }

    // 8. Create batch event
    await supabase.from('batch_events').insert({
      batch_id: batchId,
      event_type: 'tag_assignment',
      user_id: userId,
      tags_assigned: newTags.length,
      to_value: { tags: newTags },
      notes: `Assigned ${newTags.length} Metrc plant tags`,
    })

    // 9. Sync to Metrc if batch is already synced
    if (mapping) {
      // Create sync log
      const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
        organization_id: batch.organization_id,
        site_id: batch.site_id,
        sync_type: 'plant_tag_assignment',
        direction: 'push',
        operation: 'assign_tags',
        local_id: batchId,
        initiated_by: userId,
      })

      if (syncLogError || !syncLog) {
        throw new Error('Failed to create sync log entry')
      }

      result.syncLogId = syncLog.id

      await updateSyncLogEntry(syncLog.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        response_payload: {
          batch_id: batchId,
          tags_assigned: newTags.length,
          total_tags: updatedTags.length,
        },
      })
    }

    result.success = true
    result.tagsAssigned = newTags.length
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

/**
 * Get available tags for a batch
 */
export async function getAssignedTags(batchId: string): Promise<string[]> {
  try {
    const supabase = await createClient()

    const { data: batch } = await supabase
      .from('batches')
      .select('metrc_plant_labels')
      .eq('id', batchId)
      .single()

    return batch?.metrc_plant_labels || []
  } catch (error) {
    console.error('Error getting assigned tags:', error)
    return []
  }
}

/**
 * Remove tag from batch (for destroyed plants)
 */
export async function removeMetrcTagFromBatch(
  batchId: string,
  tag: string,
  reason: string,
  userId: string
): Promise<TagAssignmentResult> {
  const supabase = await createClient()
  const result: TagAssignmentResult = {
    success: false,
    tagsAssigned: 0,
    errors: [],
    warnings: [],
  }

  try {
    // Get batch
    const { data: batch } = await supabase
      .from('batches')
      .select('metrc_plant_labels')
      .eq('id', batchId)
      .single()

    if (!batch) throw new Error('Batch not found')

    // Remove tag
    const updatedTags = (batch.metrc_plant_labels || []).filter((t) => t !== tag)

    await supabase
      .from('batches')
      .update({ metrc_plant_labels: updatedTags })
      .eq('id', batchId)

    // Update plant record
    await supabase
      .from('batch_plants')
      .update({
        status: 'destroyed',
        destroyed_at: new Date().toISOString(),
        destroyed_reason: reason,
      })
      .eq('batch_id', batchId)
      .eq('metrc_plant_label', tag)

    result.success = true
    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}
```

### 4. Update Growth Phase Sync (1 hour)
**File:** `lib/compliance/metrc/sync/batch-phase-sync.ts`

**Enhancement:** Use plant tags for Metrc API calls

```typescript
// Add this to the existing syncBatchPhaseTransitionToMetrc function
// Around line 160, after building the phase change payload

// Get assigned plant tags
const { data: batch } = await supabase
  .from('batches')
  .select('metrc_plant_labels')
  .eq('id', batchId)
  .single()

const plantLabels = batch?.metrc_plant_labels || []

if (plantLabels.length > 0) {
  // Use Metrc API to change individual plant phases
  const phaseChanges = plantLabels.map((label) => ({
    Label: label,
    NewLocation: metrcLocation,
    GrowthPhase: newMetrcPhase as 'Vegetative' | 'Flowering',
    GrowthDate: transitionDate,
  }))

  // Call Metrc API (batch operation, max 100 plants)
  await metrcClient.plants.changeGrowthPhase(phaseChanges)
} else {
  // No tags assigned yet - just track phase locally
  result.warnings.push(
    'No plant tags assigned. Phase tracked locally. Assign tags to sync individual plants to Metrc.'
  )
}
```

### 5. Tag Assignment UI Component (2 hours)
**File:** `components/features/batches/assign-tags-dialog.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { Info, Tag, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface AssignTagsDialogProps {
  batchId: string
  batchNumber: string
  plantCount: number
  currentTags: string[]
  onAssigned: () => void
  trigger?: React.ReactNode
}

export function AssignTagsDialog({
  batchId,
  batchNumber,
  plantCount,
  currentTags,
  onAssigned,
  trigger,
}: AssignTagsDialogProps) {
  const [open, setOpen] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  const parseTags = (input: string): string[] => {
    return input
      .split(/[\n,]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  }

  const tags = parseTags(tagsInput)
  const newTags = tags.filter((tag) => !currentTags.includes(tag))
  const duplicateTags = tags.filter((tag) => currentTags.includes(tag))

  const handleAssign = async () => {
    if (newTags.length === 0) {
      toast.error('No new tags to assign')
      return
    }

    try {
      setIsAssigning(true)

      const response = await fetch('/api/batches/assign-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          tags: newTags,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to assign tags')
      }

      const result = await response.json()

      toast.success(`${result.tagsAssigned} tags assigned successfully`)

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, { duration: 5000 })
        })
      }

      setOpen(false)
      setTagsInput('')
      onAssigned()
    } catch (error) {
      console.error('Error assigning tags:', error)
      toast.error((error as Error).message || 'Failed to assign tags')
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Tag className="h-4 w-4 mr-2" />
            Assign Tags
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Metrc Plant Tags</DialogTitle>
          <DialogDescription>
            Assign individual Metrc tags to plants in batch {batchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Batch Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Plant Count</div>
              <div className="text-lg font-semibold">{plantCount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tags Assigned</div>
              <div className="text-lg font-semibold">
                {currentTags.length} / {plantCount}
              </div>
            </div>
          </div>

          {/* Current Tags */}
          {currentTags.length > 0 && (
            <div>
              <Label className="mb-2">Current Tags ({currentTags.length})</Label>
              <div className="max-h-20 overflow-y-auto border rounded-md p-2">
                <div className="flex flex-wrap gap-1">
                  {currentTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs font-mono">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tag Input */}
          <div className="space-y-2">
            <Label htmlFor="tags">
              New Tags * (one per line or comma-separated)
            </Label>
            <Textarea
              id="tags"
              placeholder="1A4FF01000000220000001&#10;1A4FF01000000220000002&#10;1A4FF01000000220000003"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <div className="text-sm text-muted-foreground">
              {tags.length} tags parsed
              {newTags.length !== tags.length && (
                <span className="text-orange-500 ml-2">
                  ({duplicateTags.length} already assigned)
                </span>
              )}
            </div>
          </div>

          {/* Tag Format Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Metrc Tag Format:</strong> 1A[StateCode][License][Sequence]
              <br />
              Example: 1A4FF01000000220000001 (24 characters)
            </AlertDescription>
          </Alert>

          {/* Count Mismatch Warning */}
          {newTags.length > 0 && newTags.length + currentTags.length !== plantCount && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Warning:</strong> Total tags ({newTags.length + currentTags.length}) will not match plant count ({plantCount}).
                Ensure all plants receive tags for full Metrc tracking.
              </AlertDescription>
            </Alert>
          )}

          {/* Duplicate Warning */}
          {duplicateTags.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Notice:</strong> {duplicateTags.length} tags are already assigned and will be skipped.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isAssigning || newTags.length === 0}
          >
            {isAssigning ? 'Assigning...' : `Assign ${newTags.length} Tags`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 6. Tag List Component (1 hour)
**File:** `components/features/batches/batch-tags-list.tsx`

```tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tag, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface BatchTagsListProps {
  batchId: string
  batchNumber: string
  tags: string[]
  plantCount: number
  onManageTags?: () => void
}

export function BatchTagsList({
  batchId,
  batchNumber,
  tags,
  plantCount,
  onManageTags,
}: BatchTagsListProps) {
  const [copiedTag, setCopiedTag] = useState<string | null>(null)

  const copyTag = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag)
      setCopiedTag(tag)
      toast.success('Tag copied to clipboard')
      setTimeout(() => setCopiedTag(null), 2000)
    } catch (error) {
      toast.error('Failed to copy tag')
    }
  }

  const copyAllTags = async () => {
    try {
      await navigator.clipboard.writeText(tags.join('\n'))
      toast.success(`Copied ${tags.length} tags to clipboard`)
    } catch (error) {
      toast.error('Failed to copy tags')
    }
  }

  const completion = tags.length > 0 ? (tags.length / plantCount) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            <div>
              <CardTitle>Metrc Plant Tags</CardTitle>
              <CardDescription>
                {tags.length} of {plantCount} plants tagged ({completion.toFixed(0)}%)
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {tags.length > 0 && (
              <Button variant="outline" size="sm" onClick={copyAllTags}>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            )}
            {onManageTags && (
              <Button variant="outline" size="sm" onClick={onManageTags}>
                Manage Tags
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {tags.length > 0 && (
        <CardContent>
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {tags.map((tag, index) => (
              <div
                key={tag}
                className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8">#{index + 1}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {tag}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyTag(tag)}
                >
                  {copiedTag === tag ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
```

### 7. API Route (30 min)
**File:** `app/api/batches/assign-tags/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assignMetrcTagsToBatch } from '@/lib/compliance/metrc/sync/tag-assignment-sync'

/**
 * POST /api/batches/assign-tags
 *
 * Assign Metrc plant tags to a batch
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
    const { batchId, tags } = body

    // Validate required fields
    if (!batchId) {
      return NextResponse.json(
        { success: false, message: 'Batch ID is required' },
        { status: 400 }
      )
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one tag is required' },
        { status: 400 }
      )
    }

    // Assign tags
    const result = await assignMetrcTagsToBatch(batchId, tags, user.id)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to assign tags',
          errors: result.errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${result.tagsAssigned} tags assigned successfully`,
      tagsAssigned: result.tagsAssigned,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Error in assign-tags API:', error)
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

### 8. Unit Tests (2 hours)
**File:** `lib/compliance/metrc/validation/__tests__/tag-assignment-rules.test.ts`

```typescript
import {
  validateMetrcTagFormat,
  validateTagAssignment,
} from '../tag-assignment-rules'

describe('validateMetrcTagFormat', () => {
  it('should validate valid Metrc tag', () => {
    const result = validateMetrcTagFormat('1A4FF01000000220000001')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail for invalid format', () => {
    const result = validateMetrcTagFormat('INVALID-TAG')
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('INVALID_TAG_FORMAT')
  })

  it('should fail for empty tag', () => {
    const result = validateMetrcTagFormat('')
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('EMPTY_TAG')
  })

  it('should fail for too short tag', () => {
    const result = validateMetrcTagFormat('1A4FF01')
    expect(result.isValid).toBe(false)
  })

  it('should fail for wrong prefix', () => {
    const result = validateMetrcTagFormat('2B4FF01000000220000001')
    expect(result.isValid).toBe(false)
  })
})

describe('validateTagAssignment', () => {
  it('should validate valid assignment', () => {
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags: ['1A4FF01000000220000001', '1A4FF01000000220000002'],
      currentPlantCount: 2,
    })
    expect(result.isValid).toBe(true)
  })

  it('should fail for empty tags', () => {
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags: [],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('EMPTY_TAGS')
  })

  it('should fail for duplicate tags', () => {
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags: [
        '1A4FF01000000220000001',
        '1A4FF01000000220000001', // Duplicate
      ],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('DUPLICATE_TAGS')
  })

  it('should warn for count mismatch', () => {
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags: ['1A4FF01000000220000001'],
      currentPlantCount: 5,
    })
    expect(result.isValid).toBe(true)
    expect(result.warnings.some((w) => w.code === 'TAG_COUNT_MISMATCH')).toBe(true)
  })

  it('should warn for large batches', () => {
    const tags = Array.from({ length: 150 }, (_, i) =>
      `1A4FF010000002200${String(i).padStart(6, '0')}`
    )
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags,
    })
    expect(result.warnings.some((w) => w.code === 'LARGE_BATCH')).toBe(true)
  })
})
```

---

## 🏃‍♂️ IMPLEMENTATION STEPS (Week 4)

### Day 1: Database & Validation (2-3 hours)
1. Read all documentation (30 min)
2. Create and apply database migration (30 min)
3. Create `tag-assignment-rules.ts` (1 hour)
4. Write unit tests for validation (1 hour)
5. Run tests, ensure passing

### Day 2: Tag Assignment Service (3-4 hours)
1. Create `tag-assignment-sync.ts` (2 hours)
   - Tag validation
   - Database updates
   - Individual plant tracking
2. Update `batch-phase-sync.ts` to use tags (1 hour)
3. Test sync service logic (1 hour)

### Day 3: UI Components (3-4 hours)
1. Create `assign-tags-dialog.tsx` (2 hours)
2. Create `batch-tags-list.tsx` (1 hour)
3. Integrate into batch detail page (1 hour)

### Day 4: Testing & Polish (2-3 hours)
1. Create API route (30 min)
2. Write comprehensive tests (1 hour)
3. Manual testing in UI (1 hour)
4. Documentation and cleanup (30 min)

---

## 🧪 TESTING CHECKLIST

### Unit Tests
- [ ] `tag-assignment-rules.test.ts` - All validation scenarios
- [ ] Tag format validation
- [ ] Duplicate detection
- [ ] Count mismatch warnings

### Integration Tests
- [ ] Assign tags to batch
- [ ] Tag count updates correctly
- [ ] Individual plant records created
- [ ] Phase transitions use plant tags
- [ ] Metrc API calls work with tags

### Manual Testing (Metrc Sandbox)
- [ ] Assign tags to batch
- [ ] Verify tags appear in UI
- [ ] Transition stage with tags
- [ ] Verify Metrc individual plant phase change
- [ ] Check sync logs
- [ ] Test with missing tags

---

## 📚 REFERENCE FILES

### Files to Read
- `lib/compliance/metrc/sync/batch-phase-sync.ts` - Phase sync pattern
- `lib/compliance/metrc/validation/phase-transition-rules.ts` - Validation pattern
- `components/features/batches/update-plant-count-dialog.tsx` - UI pattern

### Files to Update
- `lib/compliance/metrc/sync/batch-phase-sync.ts` - Use plant tags for API calls

### Database Tables
- `batches.metrc_plant_labels` - NEW column
- `batch_events.tags_assigned` - NEW column
- `batch_plants` - NEW table
- `compliance_sync_logs` - Sync tracking

---

## ✅ WEEK 4 COMPLETION CHECKLIST

- [ ] Migration created and applied
- [ ] `tag-assignment-rules.ts` created
- [ ] `tag-assignment-sync.ts` created
- [ ] `batch-phase-sync.ts` enhanced
- [ ] `assign-tags-dialog.tsx` created
- [ ] `batch-tags-list.tsx` created
- [ ] API endpoint created
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests completed
- [ ] Manual testing successful
- [ ] Documentation updated
- [ ] Git commit: "feat(compliance): Phase 3.5 Week 4 - Plant tag management"

---

## 🆘 TROUBLESHOOTING

### Metrc Tag Format Errors
- Verify tag matches regex: `^1A[A-Z0-9]{5}\d{10}\d{4}$`
- Check state code and license number
- Ensure exactly 24 characters

### Tags Not Appearing in Metrc
- Verify batch is synced to Metrc first
- Check tags assigned via Metrc API
- Verify facility license number matches

### Duplicate Tag Errors
- Check if tag already used in another batch
- Verify tag not in Metrc inventory already
- Review batch_plants table for conflicts

---

## 💡 PRO TIPS

1. **Batch Tag Operations** - Metrc allows up to 100 plants per API call
2. **Tag Format is Strict** - Use validation before attempting assignment
3. **Individual Tracking** - Tags enable plant-level Metrc operations
4. **Copy/Paste Friendly** - UI should support bulk tag input
5. **Audit Trail** - Track all tag assignments in batch_events
6. **Tag Inventory** - Consider building tag management system

---

## 📞 NEED HELP?

**Documentation:**
- [Week 3 Implementation](./docs/compliance/WEEK_3_IMPLEMENTATION_SUMMARY.md)
- [Gap Analysis](./COMPLIANCE_INTEGRATION_GAP_ANALYSIS.md)

**Code References:**
- Phase sync: `lib/compliance/metrc/sync/batch-phase-sync.ts`
- Validation: `lib/compliance/metrc/validation/phase-transition-rules.ts`

**Metrc Resources:**
- [Metrc API Docs - Plants](https://api-ca.metrc.com/Documentation/#Plants)
- [Plant Tagging Best Practices](https://www.metrc.com/cannabis-compliance-best-practices)

---

**Good luck! Let's complete the batch lifecycle! 🏷️**

**When complete: Phase 3.5 DONE! Move to Phase 4 (Transfers) or Phase 5 (Harvests)**
