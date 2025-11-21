# Week 6 Quick Start Overview - Waste & Destruction Management

**Created**: November 18, 2025
**Status**: 📋 Ready for Implementation
**Phase**: 3.5 - Plant Batch Lifecycle Integration

---

## What Week 6 Accomplishes

Week 6 implements **compliant waste destruction reporting** for cannabis operations, enabling proper 50:50 rendering method compliance (required in Oregon and Maryland), witness documentation, photo evidence tracking, and automatic Metrc sync for all waste disposal operations.

### Key Features

1. **Plant Batch Destruction**
   - Destroy individual plants or entire batches
   - Track plant tags destroyed
   - Update batch plant count automatically
   - Sync to Metrc plant batch destruction API

2. **Package Waste Destruction**
   - Adjust package weights for waste removal
   - Mark packages as destroyed
   - Track waste reasons and adjustment reasons
   - Sync to Metrc package adjustment API

3. **50:50 Rendering Compliance**
   - Validate inert material weight (equal or greater than waste weight)
   - Support multiple inert materials (sawdust, kitty litter, soil, other)
   - Compliance view to monitor rendering method adherence
   - Oregon/Maryland specific validation

4. **Witness & Documentation**
   - Record witness for destruction events
   - Photo evidence URL tracking (S3 integration ready)
   - Destruction event audit trail
   - Compliance reporting

5. **Metrc Integration**
   - Automatic sync for cannabis waste destruction
   - Plant batch destruction: `POST /plantbatches/v2/destroy`
   - Package adjustments: `POST /packages/v2/adjust`
   - Non-blocking sync with retry tracking

---

## Files Created (8 new files)

### Database Layer
1. **Migration**: `supabase/migrations/20251120000001_enhance_waste_destruction_tracking.sql`
   - Enhances `waste_logs` table with 15+ new columns
   - Creates `waste_destruction_events` table for audit trail
   - Creates `rendering_method_compliance` view
   - Adds indexes for performance

### Validation Layer
2. **Validation Rules**: `lib/compliance/metrc/validation/waste-destruction-rules.ts`
   - `validateWasteDestruction()` - Main waste validation
   - `validatePlantBatchDestruction()` - Plant-specific validation
   - `validatePackageDestruction()` - Package-specific validation
   - `validateMetrcWastePayload()` - Metrc API validation
   - 50:50 ratio compliance checks
   - Weight reasonableness validation

### Sync Layer
3. **Sync Service**: `lib/compliance/metrc/sync/waste-destruction-sync.ts`
   - `destroyPlantBatchWaste()` - Main plant destruction function
   - `destroyPackageWaste()` - Package destruction function
   - Auto-numbering: WST-YYYY-MM-XXXXX, WDE-YYYY-MM-XXXXX
   - Metrc API preparation
   - Sync log tracking

### API Layer
4. **Plant Batch API**: `app/api/waste/destroy-plant-batch/route.ts`
5. **Package API**: `app/api/waste/destroy-package/route.ts`

### UI Layer
6. **Plant Destruction Dialog**: `components/features/waste/destroy-plant-batch-dialog.tsx`
   - User-friendly form for waste destruction
   - 50:50 rendering method selection
   - Inert material weight validation with real-time ratio display
   - Photo evidence placeholder
   - Witness recording

### Testing
7. **Unit Tests**: `lib/compliance/metrc/validation/__tests__/waste-destruction-rules.test.ts`
   - 20+ test cases
   - 50:50 ratio validation tests
   - Plant count validation tests
   - Weight validation tests
   - Edge case coverage

### Documentation
8. **Quick Start Guide**: `PHASE_3.5_WEEK_6_QUICK_START.md` (this guide)

---

## Database Schema Highlights

### Enhanced `waste_logs` Table
```sql
-- New columns added
batch_id UUID                     -- Link to batch
package_id UUID                   -- Link to package
harvest_id UUID                   -- Link to harvest
destruction_date DATE             -- When destroyed
witnessed_by UUID                 -- Witness user ID
rendering_method TEXT             -- 50:50 method
inert_material_weight DECIMAL     -- Inert material weight
waste_category TEXT               -- plant_material, package_waste, etc.
photo_evidence_urls TEXT[]        -- S3 URLs array
metrc_plant_batch_id TEXT         -- Metrc batch ID
metrc_package_label TEXT          -- Metrc package label
sync_retry_count INTEGER          -- Retry tracking
```

### New `waste_destruction_events` Table
```sql
CREATE TABLE waste_destruction_events (
  id UUID PRIMARY KEY,
  event_number TEXT,              -- WDE-YYYY-MM-XXXXX
  waste_log_id UUID,              -- Link to waste log
  batch_id UUID,                  -- Source batch
  package_id UUID,                -- Source package
  destruction_type TEXT,          -- plant_batch_destruction, package_adjustment
  plants_destroyed INTEGER,       -- Plant count
  plant_tags_destroyed TEXT[],    -- Individual tags
  weight_destroyed DECIMAL,       -- Weight amount
  metrc_transaction_id TEXT,      -- Metrc response ID
  metrc_sync_status TEXT,         -- pending, synced, failed
  -- ... timestamps, user tracking
);
```

### `rendering_method_compliance` View
```sql
-- Auto-calculates 50:50 ratio compliance
CREATE VIEW rendering_method_compliance AS
SELECT
  waste_log_id,
  waste_number,
  rendering_method,
  waste_weight,
  inert_material_weight,
  -- Calculate ratio compliance (allow 10% tolerance)
  CASE
    WHEN rendering_method LIKE '50_50%' THEN
      (inert_material_weight >= waste_weight * 0.9 AND
       inert_material_weight <= waste_weight * 1.1)
    ELSE TRUE
  END AS is_ratio_compliant,
  -- Compliance status
  CASE
    WHEN rendering_method IS NULL THEN 'missing_method'
    WHEN inert_material_weight IS NULL THEN 'missing_inert_weight'
    WHEN ratio out of range THEN 'ratio_noncompliant'
    ELSE 'compliant'
  END AS compliance_status
FROM waste_logs
WHERE domain_type = 'cannabis';
```

---

## Validation Logic

### 50:50 Rendering Validation
```typescript
// Example: Validate 50:50 mix
if (waste.renderingMethod?.startsWith('50_50')) {
  if (!waste.inertMaterialWeight) {
    addError(result, 'inertMaterialWeight',
      '50:50 rendering method requires inert material weight',
      'MISSING_INERT_MATERIAL_WEIGHT')
  } else {
    // Check ratio (allow 10% tolerance)
    const minInert = waste.wasteWeight * 0.9
    const maxInert = waste.wasteWeight * 1.1

    if (waste.inertMaterialWeight < minInert) {
      addError(result, 'inertMaterialWeight',
        `Inert material weight too low. Minimum: ${minInert} kg`,
        'INERT_MATERIAL_TOO_LOW')
    }
  }

  // Recommend witness
  if (!waste.witnessedBy) {
    addWarning(result, 'witnessedBy',
      '50:50 destruction should have a witness',
      'MISSING_WITNESS')
  }
}
```

### Plant Weight Reasonableness
```typescript
// Warn for unusual plant weights
const avgWeightPerPlant = destruction.wasteWeight / destruction.plantsDestroyed

if (avgWeightPerPlant < 0.05) {  // Less than 50g per plant
  addWarning(result, 'wasteWeight',
    `Average weight per plant is very low (${avgWeightPerPlant} kg)`,
    'LOW_AVG_PLANT_WEIGHT')
}

if (avgWeightPerPlant > 2) {  // More than 2kg per plant
  addWarning(result, 'wasteWeight',
    `Average weight per plant is very high (${avgWeightPerPlant} kg)`,
    'HIGH_AVG_PLANT_WEIGHT')
}
```

---

## Workflow Example

### Plant Batch Destruction Flow
```
User Opens "Destroy Plants" Dialog
    ↓
User Enters:
  - Plants to destroy: 10
  - Waste weight: 5.5 kg
  - Rendering method: 50:50 with sawdust
  - Inert material weight: 5.5 kg
  - Destruction date: 2025-11-20
  - Notes: "Male plants removed during flowering"
    ↓
UI: Validate 50:50 ratio (5.5 / 5.5 = 1.0 ✅)
    ↓
User Submits
    ↓
API: Authenticate user
    ↓
API: Validate batch exists and is cannabis
    ↓
API: Validate plant count (10 ≤ 100 ✅)
    ↓
API: Validate waste destruction (50:50 compliance ✅)
    ↓
TRAZO: Generate waste number (WST-2025-11-00042)
    ↓
TRAZO: Create waste log
    ↓
TRAZO: Generate event number (WDE-2025-11-00018)
    ↓
TRAZO: Create destruction event
    ↓
TRAZO: Update batch plant count (100 → 90)
    ↓
TRAZO: Update batch_plants status to 'destroyed'
    ↓
TRAZO: Create batch_event
    ↓
Check: Is batch synced to Metrc? → No → Done
    ↓ Yes
ASYNC: Get API keys
    ↓
ASYNC: Create sync log
    ↓
ASYNC: Build Metrc payload
    {
      PlantBatch: "1A4FF01000000220000001",
      Count: 10,
      WasteWeight: 5.5,
      WasteUnitOfMeasure: "Kilograms",
      WasteDate: "2025-11-20",
      WasteMethodName: "50:50 Mix with Sawdust",
      WasteReasonName: "Male Plants",
      PlantTags: ["1A4FF01...001", "1A4FF01...002", ...]
    }
    ↓
ASYNC: Call Metrc API
    POST /plantbatches/v2/destroy
    ↓
ASYNC: Update waste log with metrc_waste_id
    ↓
ASYNC: Update destruction event with metrc_transaction_id
    ↓
ASYNC: Update sync log (completed)
    ↓
Done ✅
```

---

## Integration Points

### 1. Batch Detail Page
**File**: `app/dashboard/batches/[batchId]/page.tsx`

Add destroy plants button:
```tsx
import { DestroyPlantBatchDialog } from '@/components/features/waste/destroy-plant-batch-dialog'

<DestroyPlantBatchDialog
  batchId={batch.id}
  batchNumber={batch.batch_number}
  currentPlantCount={batch.plant_count}
  plantTags={batch.metrc_plant_labels || []}
  onDestroyed={() => {
    refetchBatch()
    toast.success('Plants destroyed successfully')
  }}
/>
```

### 2. Waste Management Dashboard
**File**: `app/dashboard/waste/page.tsx` (create if doesn't exist)

Show:
- Recent waste logs
- Rendering method compliance status
- 50:50 ratio compliance view
- Metrc sync status
- Destruction events timeline

### 3. Compliance Dashboard
**File**: `app/dashboard/compliance/page.tsx`

Add waste destruction metrics:
- Total waste destroyed this month
- 50:50 compliance percentage
- Pending Metrc syncs
- Failed destruction syncs

---

## Testing Strategy

### Unit Tests (20+ tests)
```bash
npm test -- waste-destruction-rules.test.ts
```

**Coverage**:
- ✅ Valid waste destruction
- ✅ 50:50 ratio validation
- ✅ Missing inert material weight
- ✅ Inert material too low
- ✅ Inert material exceeds ratio (warning)
- ✅ Missing witness (warning)
- ✅ Plant count validation
- ✅ Exceeds batch plant count
- ✅ Low average plant weight (warning)
- ✅ High average plant weight (warning)
- ✅ Package weight validation
- ✅ Waste exceeds package weight
- ✅ Metrc payload validation
- ✅ Date validation
- ✅ Invalid rendering method

### Integration Tests
1. Create waste log locally (no Metrc)
2. Destroy plants with valid tags (Metrc sync)
3. Destroy plants without tags (local only)
4. Update batch plant count
5. Update batch_plants status
6. Verify rendering method compliance view

### Manual Testing Checklist
- [ ] Destroy 5 plants from 100-plant batch
- [ ] Verify batch plant count updated to 95
- [ ] Verify batch_plants records marked 'destroyed'
- [ ] Verify waste log created with WST number
- [ ] Verify destruction event created with WDE number
- [ ] Test 50:50 validation (reject low inert material)
- [ ] Test 50:50 validation (accept equal inert material)
- [ ] Test without witness (warning displayed)
- [ ] Test package destruction
- [ ] Verify Metrc sync log created
- [ ] View rendering method compliance report

---

## Metrc API Endpoints

### Plant Batch Destruction
```
POST https://api-ca.metrc.com/plantbatches/v2/destroy?licenseNumber={license}

Body:
[
  {
    "PlantBatch": "1A4FF01000000220000001",
    "Count": 10,
    "WasteWeight": 5.5,
    "WasteUnitOfMeasure": "Kilograms",
    "WasteDate": "2025-11-20",
    "WasteMethodName": "50:50 Mix with Sawdust",
    "WasteReasonName": "Male Plants",
    "PlantTags": [
      "1A4FF01000000220000001",
      "1A4FF01000000220000002"
    ]
  }
]
```

### Package Adjustment (Waste)
```
POST https://api-ca.metrc.com/packages/v2/adjust?licenseNumber={license}

Body:
[
  {
    "Label": "1A4FF02000000220000001",
    "Quantity": -5.0,
    "UnitOfMeasure": "Grams",
    "AdjustmentReason": "Product Degradation",
    "AdjustmentDate": "2025-11-20",
    "ReasonNote": "Failed quality inspection - mold detected"
  }
]
```

---

## Next Steps After Week 6

### Week 7: Transfer Manifests
- Outgoing transfer manifest creation
- Incoming transfer receipt
- Driver/vehicle tracking
- Package label verification
- Transfer status tracking

### Week 8: Testing & Polish
- End-to-end compliance testing
- Metrc sandbox integration
- Error handling improvements
- Performance optimization
- User documentation

---

## Common Issues & Solutions

### Issue: Inert material weight validation too strict
**Solution**: Validation allows 10% tolerance (0.9x to 1.1x waste weight)

### Issue: User forgets to record witness
**Solution**: Warning displayed, not error. Witness recommended but not required.

### Issue: Plant tags not available
**Solution**: Waste logged locally. Warning: "Provide tags for Metrc sync"

### Issue: Metrc API rejection
**Solution**: Sync log tracks error. Retry mechanism available.

### Issue: 50:50 method not clear to users
**Solution**: UI shows real-time ratio calculation and compliance status

---

## Success Metrics

- ✅ Waste destruction logged with proper 50:50 rendering
- ✅ Plant batch count updated automatically
- ✅ Individual plant records marked destroyed
- ✅ Destruction events tracked with auto-numbering
- ✅ Metrc sync prepared (API calls ready)
- ✅ Rendering method compliance monitored
- ✅ Witness and photo evidence tracked
- ✅ 20+ unit tests passing
- ✅ Integration with batch detail page

---

**Week 6 Implementation: Waste & Destruction Management**
**Estimated Time**: 12-15 hours
**Priority**: 🟡 HIGH - Required for waste disposal compliance
**Status**: 📋 Ready to Start

See [PHASE_3.5_WEEK_6_QUICK_START.md](./PHASE_3.5_WEEK_6_QUICK_START.md) for detailed implementation guide.
