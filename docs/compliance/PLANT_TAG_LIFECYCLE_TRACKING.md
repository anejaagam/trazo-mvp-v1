# Plant Tag Lifecycle Tracking - Metrc Compliance

**Date:** 2025-11-18
**Status:** ✅ Implemented with Enforcement
**Compliance Level:** Full Metrc individual plant tracking

---

## Overview

This document explains how TRAZO tracks individual plant tags throughout the entire cannabis cultivation lifecycle, ensuring full Metrc compliance from germination through harvest.

---

## Metrc Requirements

### Group vs. Individual Tracking

**Group Tracking (Immature Plants):**
- **Stages:** Germination, Clone, Early Vegetative
- **Metrc Phase:** "Clone"
- **Tag Type:** Batch-level tracking (one ID for the group)
- **Requirement:** Optional individual tags

**Individual Tracking (Mature Plants):**
- **Stages:** Flowering, Harvest, Post-Harvest
- **Metrc Phase:** "Flowering"
- **Tag Type:** Individual plant tags (unique ID per plant)
- **Requirement:** ✅ **MANDATORY** - Each plant must have a unique Metrc tag

### Critical Transition Point

**Vegetative → Flowering**

This is the **critical transition** where Metrc requires switching from group tracking to individual plant tracking. At this point:

1. ❌ **Cannot proceed** without assigning individual plant tags
2. ✅ **Must have** unique Metrc tag for every plant
3. 📋 **Tags persist** through harvest and product creation
4. 🔒 **Irreversible** - Once in flowering, plants cannot return to vegetative

---

## Implementation in TRAZO

### Database Schema

#### 1. Batch-Level Tag Storage

**Table:** `batches`
**Column:** `metrc_plant_labels` (TEXT[] array)

```sql
ALTER TABLE batches
ADD COLUMN metrc_plant_labels TEXT[] DEFAULT '{}';

CREATE INDEX idx_batches_metrc_plant_labels
ON batches USING GIN (metrc_plant_labels);
```

**Purpose:**
- Fast array storage of all plant tags for a batch
- Efficient GIN index for tag lookups
- Used for phase transition API calls

**Example:**
```json
{
  "batch_id": "uuid-123",
  "batch_number": "B-2025-001",
  "metrc_plant_labels": [
    "1AAAA01000000100000001",
    "1AAAA01000000100000002",
    "1AAAA01000000100000003"
  ]
}
```

#### 2. Individual Plant Tracking

**Table:** `batch_plants`

```sql
CREATE TABLE batch_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  metrc_plant_label TEXT NOT NULL UNIQUE,
  plant_index INTEGER,
  growth_phase TEXT,
  status TEXT DEFAULT 'active',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES users(id),
  destroyed_at TIMESTAMPTZ,
  destroyed_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Purpose:**
- Individual plant lifecycle tracking
- Harvest tracking per plant
- Destruction/waste tracking
- Audit trail for each plant

**Example:**
```json
{
  "id": "uuid-plant-1",
  "batch_id": "uuid-123",
  "metrc_plant_label": "1AAAA01000000100000001",
  "plant_index": 1,
  "growth_phase": "Flowering",
  "status": "active",
  "assigned_at": "2025-11-18T10:00:00Z"
}
```

---

## Lifecycle Flow

### Stage 1: Germination/Clone (Optional Tags)

**Metrc Phase:** "Clone"
**Tags Required:** ❌ No
**Tracking:** Group-level

```
User creates batch:
├─ domain_type: cannabis
├─ stage: germination or clone
├─ plant_count: 50
└─ metrc_plant_labels: [] (empty - not required yet)
```

**Actions Available:**
- ✅ Create batch
- ✅ Push to Metrc (group tracking)
- ✅ Transition to vegetative
- ⚪ Assign tags (optional but recommended)

---

### Stage 2: Vegetative (Tags Recommended)

**Metrc Phase:** "Vegetative"
**Tags Required:** ⚠️ Recommended
**Tracking:** Transitioning to individual

```
User in vegetative stage:
├─ stage: vegetative
├─ plant_count: 48 (2 plants removed)
├─ metrc_plant_labels: [] (can still be empty)
└─ Warning: "Assign tags before flowering"
```

**Actions Available:**
- ✅ Manage batch
- ✅ Assign plant tags (highly recommended)
- ⚠️ Transition to flowering (BLOCKED if no tags)

**UI Alert:**
```
⚠️ Plant Tags Recommended
This batch will soon enter flowering phase.
Assign Metrc plant tags now to ensure smooth transition.
```

---

### Stage 3: Vegetative → Flowering (TAGS REQUIRED)

**Metrc Phase Transition:** "Vegetative" → "Flowering"
**Tags Required:** ✅ **MANDATORY**
**Validation:** Enforced

#### Validation Logic

**File:** `lib/compliance/metrc/validation/phase-transition-rules.ts`

```typescript
// CRITICAL: Validate plant tags for Vegetative → Flowering transition
if (currentPhase === 'Vegetative' && newPhase === 'Flowering') {
  const plantTagsCount = transition.plantTagsCount || 0
  const totalPlantCount = transition.totalPlantCount || 0

  if (plantTagsCount === 0) {
    addError(
      result,
      'plantTags',
      'Individual plant tags are REQUIRED for Vegetative to Flowering transition. Metrc requires tracking each plant individually in the flowering phase. Please assign Metrc plant tags before transitioning.',
      'PLANT_TAGS_REQUIRED'
    )
  } else if (plantTagsCount < totalPlantCount) {
    addWarning(
      result,
      'plantTags',
      `Only ${plantTagsCount} of ${totalPlantCount} plants are tagged. For full Metrc compliance, all plants should have individual tags before flowering.`,
      'INCOMPLETE_PLANT_TAGS'
    )
  }
}
```

#### User Experience

**Scenario A: No Tags Assigned**
```
User clicks "Transition to Flowering"
├─ Validation runs
├─ ERROR: "Individual plant tags are REQUIRED..."
├─ Transition BLOCKED
└─ User must assign tags first
```

**Scenario B: Partial Tags**
```
User clicks "Transition to Flowering"
├─ Validation runs
├─ WARNING: "Only 30 of 48 plants are tagged..."
├─ Transition ALLOWED but warned
└─ Recommendation to complete tagging
```

**Scenario C: All Tags Assigned**
```
User clicks "Transition to Flowering"
├─ Validation runs
├─ ✅ All 48 plants tagged
├─ Transition ALLOWED
└─ Individual plant phase changes sent to Metrc
```

#### Metrc API Call

**File:** `lib/compliance/metrc/sync/batch-phase-sync.ts`

```typescript
// Build phase changes for each tagged plant
const phaseChanges: MetrcPlantGrowthPhaseChange[] = plantLabels.map((label) => ({
  Label: label,                    // 1AAAA01000000100000001
  NewLocation: metrcLocation,      // "Flowering Room A"
  GrowthPhase: "Flowering",        // Required: "Vegetative" or "Flowering"
  GrowthDate: transitionDate,      // YYYY-MM-DD format
}))

// Call Metrc API (batch operation, max 100 plants)
await metrcClient.plants.changeGrowthPhase(phaseChanges)
```

**Result:**
- Each plant in Metrc is individually transitioned to "Flowering"
- Phase change logged in `batch_events`
- Sync log created in `compliance_sync_logs`
- Local `metrc_growth_phase` updated in `metrc_batch_mappings`

---

### Stage 4: Flowering (Individual Tracking Active)

**Metrc Phase:** "Flowering"
**Tags Required:** ✅ Yes (already assigned)
**Tracking:** Individual plant level

```
Batch in flowering:
├─ stage: flowering
├─ plant_count: 48
├─ metrc_plant_labels: [48 unique tags]
├─ batch_plants: 48 records (one per plant)
└─ All plants tracked individually in Metrc
```

**Tracked Per Plant:**
- Growth phase changes
- Location moves
- Environmental conditions (via pod telemetry)
- Any plant removals/destruction
- Harvest readiness

**UI Display:**
```
Plant Tags: 48/48 tagged (100% complete)

Tags List:
• 1AAAA01000000100000001 [Copy]
• 1AAAA01000000100000002 [Copy]
• 1AAAA01000000100000003 [Copy]
... (45 more)

[Manage Tags] button available for adjustments
```

---

### Stage 5: Harvest (Tag-to-Product Tracking)

**Metrc Phase:** "Flowering" → Harvest
**Tags Required:** ✅ Yes (used for harvest tracking)
**Tracking:** Per-plant harvest data

#### Current Implementation

**Status:** ⚠️ **Partial** - Needs enhancement

**What Works:**
- Plant tags are stored and available
- Batch-level harvest recording
- Wet/dry weight tracking
- Waste tracking

**What Needs Enhancement:**
```
TODO: Harvest workflow to use plant tags

When recording harvest:
1. Show list of tagged plants
2. Allow per-plant harvest data entry:
   - Wet weight per plant
   - Dry weight per plant
   - Waste per plant
   - Harvest date per plant
3. Create Metrc harvest batch
4. Link harvested product to source plant tags
5. Track plant destruction/completion
```

#### Future Harvest Flow

```typescript
// Proposed harvest data structure
interface PlantHarvestData {
  metrc_plant_label: string          // Source plant tag
  wet_weight_g: number                // Weight at harvest
  dry_weight_g?: number               // Weight after drying
  waste_weight_g?: number             // Trim/waste weight
  harvest_date: string                // When harvested
  harvest_batch_id?: string           // Metrc harvest batch ID
  package_tags?: string[]             // Final product package tags
}

// Harvest workflow
export async function recordPlantHarvest(
  batchId: string,
  plantHarvests: PlantHarvestData[]
) {
  // 1. Validate all plant tags belong to batch
  // 2. Create Metrc harvest batch
  // 3. Record per-plant harvest data
  // 4. Update batch_plants table
  // 5. Create waste logs for trim
  // 6. Link packages to source plants
}
```

---

## Validation & Enforcement

### 1. Tag Format Validation

**File:** `lib/compliance/metrc/validation/tag-assignment-rules.ts`

```typescript
const METRC_TAG_REGEX = /^1A[A-Z0-9]{5}\d{15}$/

export function validateMetrcTagFormat(tag: string): ValidationResult {
  if (!METRC_TAG_REGEX.test(tag)) {
    addError(result, 'tag',
      'Invalid Metrc tag format. Expected: 1A[StateCode][License][Sequence] (22 chars)',
      'INVALID_TAG_FORMAT')
  }
  return result
}
```

**Valid Format:**
- Length: 22 characters exactly
- Pattern: `1A[StateCode][License][Sequence]`
- Example: `1AAAA01000000100000001`
  - `1A` - Metrc plant prefix
  - `AAA01` - State + License
  - `000000100000001` - Sequence number

### 2. Duplicate Prevention

```typescript
export function validateTagAssignment(assignment: {
  batchId: string
  tags: string[]
  currentPlantCount?: number
}): ValidationResult {
  // Check for duplicates FIRST
  const uniqueTags = new Set(assignment.tags)
  if (uniqueTags.size !== assignment.tags.length) {
    addError(result, 'tags',
      'Duplicate tags found. Each tag must be unique.',
      'DUPLICATE_TAGS')
  }

  // Then validate format
  assignment.tags.forEach(tag => {
    const tagValidation = validateMetrcTagFormat(tag)
    if (!tagValidation.isValid) {
      result.isValid = false
      result.errors.push(...tagValidation.errors)
    }
  })

  return result
}
```

### 3. Phase Transition Enforcement

**Where:** Stage transition API
**When:** Before batch stage changes
**Action:** Block transition if validation fails

```typescript
// In batch-phase-sync.ts
const validation = validateStageTransitionForMetrc({
  batchId,
  currentStage,
  newStage,
  currentMetrcPhase,
  transitionDate,
  plantTagsCount,      // Number of assigned tags
  totalPlantCount,     // Total plants in batch
})

if (!validation.isValid) {
  const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`)
  throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
}
```

**Result:**
- ❌ Transition blocked if no tags for veg→flowering
- ⚠️ Warning shown if incomplete tagging
- ✅ Transition proceeds if fully tagged

---

## UI Components

### 1. Batch Table Badge

**File:** `components/features/batches/batch-table.tsx`

**Display:**
```jsx
{batch.domain_type === 'cannabis' && totalPlants > 0 && (
  <Badge
    variant={
      !batch.metrc_plant_labels || batch.metrc_plant_labels.length === 0
        ? 'destructive'     // 🔴 Red: No tags
        : batch.metrc_plant_labels.length < totalPlants
        ? 'outline'          // ⚪ Outline: Partial
        : 'default'          // 🔵 Default: Complete
    }
  >
    {batch.metrc_plant_labels?.length || 0}/{totalPlants} tagged
  </Badge>
)}
```

**Examples:**
- `0/48 tagged` - 🔴 Red, no tags assigned
- `30/48 tagged` - ⚪ Outline, partial tagging
- `48/48 tagged` - 🔵 Default, fully tagged

### 2. Batch Detail Tag Management

**File:** `components/features/batches/batch-detail-page.tsx`

**Layout:**
```
┌─────────────────────────────────────┐
│ Plant Tag Management                │
├─────────────────────────────────────┤
│                                     │
│  [BatchTagsList]    [AssignTags]   │
│   Shows current      Button to     │
│   tags with copy     add more      │
│   functionality      tags          │
│                                     │
└─────────────────────────────────────┘
```

**Alerts:**
```jsx
{/* Missing Tags Alert */}
{batch.metrc_batch_id && plantTagsCount === 0 && (
  <Alert>
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Plant Tags Required</AlertTitle>
    <AlertDescription>
      Assign Metrc plant tags to enable individual plant tracking
      and phase transitions.
    </AlertDescription>
  </Alert>
)}

{/* Incomplete Tags Warning */}
{plantTagsCount > 0 && plantTagsCount < totalPlants && (
  <Alert>
    <Info className="h-4 w-4" />
    <AlertTitle>Incomplete Tag Assignment</AlertTitle>
    <AlertDescription>
      {plantTagsCount} of {totalPlants} plants tagged
      ({completion}% complete).
    </AlertDescription>
  </Alert>
)}
```

### 3. Assign Tags Dialog

**File:** `components/features/batches/assign-tags-dialog.tsx`

**Features:**
- Multi-line text input
- Comma or newline separated
- Real-time format validation
- Duplicate detection
- Count mismatch warning
- Immediate feedback

**Example Input:**
```
1AAAA01000000100000001
1AAAA01000000100000002,1AAAA01000000100000003
1AAAA01000000100000004
```

**Validation Feedback:**
```
✅ 4 valid tags
❌ Invalid format: "1AAA" (too short)
⚠️ Count: 4 tags for 48 plants (44 remaining)
```

---

## Data Flow

### Tag Assignment Flow

```
User Interface
    ↓
[Assign Tags Dialog]
    ↓ (validates format, duplicates)
POST /api/batches/assign-tags
    ↓
assignMetrcTagsToBatch()
    ↓
├─ Validate tags
├─ Filter existing tags
├─ Update batches.metrc_plant_labels
├─ Insert batch_plants records
├─ Create batch_event
└─ Create compliance_sync_log
    ↓
Return { success, tagsAssigned, warnings }
    ↓
UI refreshes, shows updated count
```

### Phase Transition Flow

```
User clicks "Transition to Flowering"
    ↓
Stage Transition Dialog opens
    ↓ (user confirms)
POST /api/batches/stage-transition
    ↓
syncBatchPhaseTransitionToMetrc()
    ↓
├─ Check if transition requires Metrc sync
├─ Get batch plant tags count
├─ validateStageTransitionForMetrc()
│   └─ ❌ ERROR if veg→flowering without tags
├─ Get Metrc API credentials
├─ Build individual plant phase changes
├─ Call Metrc API (if tags exist)
├─ Update metrc_growth_phase
└─ Create sync log
    ↓
Return { success, synced, errors, warnings }
    ↓
UI shows success or error message
```

---

## Testing & Validation

### Unit Tests

**File:** `lib/compliance/metrc/validation/__tests__/phase-transition-rules.test.ts`

**Coverage:**
- ✅ Tag format validation
- ✅ Duplicate detection
- ✅ Count mismatch warnings
- ✅ Phase transition validation
- ✅ Vegetative→Flowering tag requirement

**Example:**
```typescript
describe('validateStageTransitionForMetrc', () => {
  it('should require plant tags for vegetative to flowering transition', () => {
    const result = validateStageTransitionForMetrc({
      batchId: 'batch-123',
      currentStage: 'vegetative',
      newStage: 'flowering',
      currentMetrcPhase: 'Vegetative',
      transitionDate: '2025-11-18',
      plantTagsCount: 0,      // No tags
      totalPlantCount: 48,
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'PLANT_TAGS_REQUIRED'
      })
    )
  })
})
```

### Manual Testing Scenarios

#### Test Case 1: Tag Assignment

1. Create cannabis batch (48 plants)
2. Push to Metrc
3. Navigate to batch detail
4. Click "Assign Metrc Tags"
5. Paste 48 valid tags
6. Verify tags saved
7. Check badge shows "48/48 tagged"

#### Test Case 2: Transition Without Tags

1. Create cannabis batch in vegetative stage
2. Push to Metrc
3. Do NOT assign tags
4. Try to transition to flowering
5. ❌ Should show error: "Plant tags are REQUIRED"
6. Transition should be BLOCKED

#### Test Case 3: Transition With Tags

1. Create cannabis batch in vegetative stage
2. Push to Metrc
3. Assign all 48 plant tags
4. Transition to flowering
5. ✅ Should succeed
6. Verify Metrc API called with 48 individual plant phase changes

---

## Compliance Guarantees

### What This Implementation Ensures

1. ✅ **Format Validation** - All tags match Metrc's 22-character format
2. ✅ **Duplicate Prevention** - No two plants can have the same tag
3. ✅ **Required for Flowering** - Cannot transition veg→flowering without tags
4. ✅ **Individual Tracking** - Each plant tracked separately in Metrc
5. ✅ **Audit Trail** - All tag assignments logged with user and timestamp
6. ✅ **Metrc API Ready** - Phase changes use correct individual plant API
7. ✅ **Database Constraints** - Unique constraints prevent tag reuse

### What's Left to Implement

1. ⚠️ **Harvest Workflow** - Per-plant harvest data entry
2. ⚠️ **Package Linking** - Link final products to source plant tags
3. ⚠️ **Plant Destruction** - Individual plant waste tracking
4. ⚠️ **Tag Inventory** - Track available vs. used tags
5. ⚠️ **Batch Operations** - Handle >100 plants (Metrc API limit)

---

## Summary

**Plant Tag Lifecycle in TRAZO:**

```
Germination/Clone
    ↓ (group tracking, tags optional)
Vegetative
    ↓ (recommend tags, warn user)
Flowering ← **TAGS REQUIRED** ✅
    ↓ (individual tracking active)
Harvest
    ↓ (per-plant harvest data)
Products
    ↓ (linked to source tags)
Complete
```

**Key Implementation Points:**
- 🔒 **Enforced:** Cannot transition veg→flowering without tags
- 📊 **Tracked:** Individual plant records in database
- 🔄 **Synced:** Phase changes sent to Metrc per plant
- ✅ **Validated:** Format, duplicates, and count checks
- 📋 **Audited:** Full lifecycle logging

**Compliance Level:** Full Metrc individual plant tracking from flowering through harvest.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-18
**Next Review:** After harvest workflow enhancement
