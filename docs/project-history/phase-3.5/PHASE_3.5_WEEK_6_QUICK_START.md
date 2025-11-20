# Quick Start Guide - Phase 3.5 Week 6 (Waste & Destruction Management)

**For:** Next agent working on compliance engine
**Phase:** 3.5 - Plant Batch Lifecycle Integration
**Week:** 6 - Waste & Destruction Reporting
**Duration:** 12-15 hours
**Priority:** 🟡 HIGH - Required for waste disposal compliance

---

## 📖 REQUIRED READING (Do this first!)

1. **[Week 5 Summary](./docs/compliance/WEEK_5_IMPLEMENTATION_SUMMARY.md)** (10 min review)
   - Harvest management foundation
   - Package creation and tracking
   - Harvest waste logging

2. **[Week 4 Summary](./docs/compliance/WEEK_4_IMPLEMENTATION_SUMMARY.md)** (5 min review)
   - Plant tag management
   - Individual plant tracking patterns

3. **[Week 3 Summary](./docs/compliance/WEEK_3_IMPLEMENTATION_SUMMARY.md)** (5 min review)
   - Growth phase transitions
   - Non-blocking sync patterns

4. **[COMPLIANCE_ENGINE_COMPREHENSIVE_REPLAN.md](./COMPLIANCE_ENGINE_COMPREHENSIVE_REPLAN.md)** (Section GAP 4, 15 min)
   - Waste destruction requirements
   - 50:50 rendering method compliance
   - Oregon/Maryland specific rules

5. **[Existing Waste Logs Table](./lib/supabase/queries/)** (5 min)
   - Review current `waste_logs` table structure
   - Existing fields: `metrc_waste_id`, `metrc_sync_status`

**Total Reading Time:** ~40 minutes (essential!)

---

## 🎯 WEEK 6 GOAL: Waste & Destruction Reporting

**Objective:** Enable compliant waste destruction reporting to Metrc with proper 50:50 rendering method validation, photo documentation, and automatic sync for cannabis waste disposal.

### What You're Building

When a user records waste destruction:
```typescript
// User destroys plant batch waste
await destroyPlantBatchWaste({
  batchId: 'batch-123',
  plantCount: 5,
  wasteType: 'plant_material',
  wasteWeight: 2.5, // kg
  renderingMethod: '50_50_sawdust',
  destructionDate: '2025-11-20',
  witnessedBy: userId
})
// ✅ Waste log created in TRAZO
// ✅ Metrc plant batch destruction synced
// ✅ Rendering method validated (50:50 mix)
// ✅ Witness recorded
// ✅ Batch plant count adjusted
// ✅ Optional photo evidence attached

// User destroys package/harvest waste
await destroyPackageWaste({
  packageId: 'pkg-123',
  wasteWeight: 1.2, // kg
  wasteReason: 'failed_quality_inspection',
  renderingMethod: '50_50_kitty_litter',
  destructionDate: '2025-11-20',
  witnessedBy: userId
})
// ✅ Waste log created
// ✅ Metrc package adjustment synced
// ✅ 50:50 rendering validated
// ✅ Package status updated
// ✅ Inventory adjusted
```

---

## 🗂️ FILES TO CREATE (in this order)

### 1. Database Migration (45 min)
**File:** `supabase/migrations/20251120000001_enhance_waste_destruction_tracking.sql`

```sql
-- =====================================================
-- ENHANCE WASTE_LOGS TABLE
-- =====================================================
-- Add new columns to existing waste_logs table
ALTER TABLE waste_logs
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES harvest_packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS harvest_id UUID REFERENCES harvest_records(id) ON DELETE SET NULL,

  -- Destruction details
  ADD COLUMN IF NOT EXISTS destruction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS witnessed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS witness_name TEXT,

  -- Rendering method (50:50 compliance)
  ADD COLUMN IF NOT EXISTS rendering_method TEXT CHECK (rendering_method IN (
    '50_50_sawdust',
    '50_50_kitty_litter',
    '50_50_soil',
    '50_50_other_inert',
    'composting',
    'grinding',
    'other'
  )),
  ADD COLUMN IF NOT EXISTS inert_material_description TEXT,
  ADD COLUMN IF NOT EXISTS inert_material_weight DECIMAL(10, 4),
  ADD COLUMN IF NOT EXISTS inert_material_unit TEXT DEFAULT 'Kilograms',

  -- Waste classification
  ADD COLUMN IF NOT EXISTS waste_category TEXT CHECK (waste_category IN (
    'plant_material',      -- stems, leaves, roots
    'package_waste',       -- failed products
    'harvest_trim',        -- trim waste (already in harvest)
    'spoiled_product',     -- contaminated/expired
    'other'
  )),

  -- Photo evidence
  ADD COLUMN IF NOT EXISTS photo_evidence_urls TEXT[], -- Array of S3 URLs

  -- Enhanced Metrc fields
  ADD COLUMN IF NOT EXISTS metrc_plant_batch_id TEXT, -- For plant batch destruction
  ADD COLUMN IF NOT EXISTS metrc_package_label TEXT,  -- For package destruction
  ADD COLUMN IF NOT EXISTS metrc_waste_type TEXT,     -- Metrc waste type classification

  -- Sync tracking
  ADD COLUMN IF NOT EXISTS sync_attempted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_error_message TEXT,
  ADD COLUMN IF NOT EXISTS sync_retry_count INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_waste_logs_batch ON waste_logs(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waste_logs_package ON waste_logs(package_id) WHERE package_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waste_logs_harvest ON waste_logs(harvest_id) WHERE harvest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waste_logs_destruction_date ON waste_logs(destruction_date);
CREATE INDEX IF NOT EXISTS idx_waste_logs_metrc_sync ON waste_logs(metrc_sync_status);
CREATE INDEX IF NOT EXISTS idx_waste_logs_waste_category ON waste_logs(waste_category);

-- Comments
COMMENT ON COLUMN waste_logs.rendering_method IS '50:50 mix method for OR/MD compliance';
COMMENT ON COLUMN waste_logs.waste_category IS 'Type of waste: plant material, package, trim, etc.';
COMMENT ON COLUMN waste_logs.inert_material_weight IS 'Weight of inert material used for 50:50 mix';
COMMENT ON COLUMN waste_logs.photo_evidence_urls IS 'Array of S3 URLs for destruction photos';

-- =====================================================
-- WASTE DESTRUCTION EVENTS TABLE
-- =====================================================
-- Track individual destruction events with details
CREATE TABLE IF NOT EXISTS waste_destruction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Event identification
  event_number TEXT NOT NULL, -- Auto-generated: WDE-YYYY-MM-XXXXX

  -- Waste reference
  waste_log_id UUID NOT NULL REFERENCES waste_logs(id) ON DELETE CASCADE,

  -- Entity references
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  package_id UUID REFERENCES harvest_packages(id) ON DELETE SET NULL,
  harvest_id UUID REFERENCES harvest_records(id) ON DELETE SET NULL,

  -- Destruction details
  destruction_type TEXT CHECK (destruction_type IN (
    'plant_batch_destruction',
    'package_adjustment',
    'harvest_waste_removal',
    'general_waste'
  )),

  -- Plants destroyed (for plant batch destruction)
  plants_destroyed INTEGER,
  plant_tags_destroyed TEXT[], -- Array of destroyed plant tags

  -- Weight destroyed
  weight_destroyed DECIMAL(10, 4) NOT NULL,
  unit_of_weight TEXT DEFAULT 'Grams',

  -- Metrc sync
  metrc_transaction_id TEXT,
  metrc_sync_status TEXT DEFAULT 'pending' CHECK (metrc_sync_status IN ('pending', 'synced', 'failed')),

  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_event_number UNIQUE (organization_id, event_number)
);

-- Indexes
CREATE INDEX idx_waste_destruction_events_waste_log ON waste_destruction_events(waste_log_id);
CREATE INDEX idx_waste_destruction_events_batch ON waste_destruction_events(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_waste_destruction_events_package ON waste_destruction_events(package_id) WHERE package_id IS NOT NULL;
CREATE INDEX idx_waste_destruction_events_destruction_date ON waste_destruction_events(created_at);
CREATE INDEX idx_waste_destruction_events_metrc_sync ON waste_destruction_events(metrc_sync_status);

-- RLS Policies
ALTER TABLE waste_destruction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view destruction events for their organization"
  ON waste_destruction_events FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage destruction events for their organization"
  ON waste_destruction_events FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE waste_destruction_events IS 'Individual waste destruction events with Metrc sync tracking';
COMMENT ON COLUMN waste_destruction_events.plant_tags_destroyed IS 'Array of individual plant tags destroyed (from batch_plants)';
COMMENT ON COLUMN waste_destruction_events.destruction_type IS 'Type of destruction operation for Metrc API routing';

-- =====================================================
-- RENDERING METHOD VALIDATION VIEW
-- =====================================================
-- View to check rendering method compliance
CREATE OR REPLACE VIEW rendering_method_compliance AS
SELECT
  wl.id AS waste_log_id,
  wl.waste_number,
  wl.rendering_method,
  wl.waste_weight,
  wl.waste_unit,
  wl.inert_material_weight,
  wl.inert_material_unit,
  s.jurisdiction_id,
  j.rules->'waste'->'rendering_method' AS jurisdiction_rules,

  -- Calculate 50:50 ratio compliance
  CASE
    WHEN wl.rendering_method LIKE '50_50%' THEN
      CASE
        WHEN wl.inert_material_weight IS NULL THEN FALSE
        WHEN wl.inert_material_weight < (wl.waste_weight * 0.9) THEN FALSE -- Allow 10% tolerance
        WHEN wl.inert_material_weight > (wl.waste_weight * 1.1) THEN FALSE
        ELSE TRUE
      END
    ELSE TRUE -- Other methods don't require 50:50
  END AS is_ratio_compliant,

  -- Compliance status
  CASE
    WHEN wl.rendering_method IS NULL THEN 'missing_method'
    WHEN wl.rendering_method LIKE '50_50%' AND wl.inert_material_weight IS NULL THEN 'missing_inert_weight'
    WHEN wl.rendering_method LIKE '50_50%' AND
         (wl.inert_material_weight < wl.waste_weight * 0.9 OR
          wl.inert_material_weight > wl.waste_weight * 1.1) THEN 'ratio_noncompliant'
    ELSE 'compliant'
  END AS compliance_status

FROM waste_logs wl
LEFT JOIN sites s ON s.id = wl.site_id
LEFT JOIN jurisdictions j ON j.id = s.jurisdiction_id
WHERE wl.domain_type = 'cannabis';

COMMENT ON VIEW rendering_method_compliance IS 'Validates 50:50 rendering method compliance for waste destruction';

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_waste_destruction_events_updated_at
  BEFORE UPDATE ON waste_destruction_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Apply migration:**
```bash
# Use Supabase MCP tool
mcp__supabase__apply_migration({
  name: 'enhance_waste_destruction_tracking',
  query: '...' # paste SQL above
})
```

### 2. Waste Destruction Validation Rules (2 hours)
**File:** `lib/compliance/metrc/validation/waste-destruction-rules.ts`

```typescript
import type { ValidationResult } from '@/lib/compliance/types'
import {
  createValidationResult,
  validateRequired,
  validatePositiveNumber,
  validateDate,
  validateDateNotInFuture,
  addError,
  addWarning,
} from './validators'

/**
 * Validate waste destruction creation
 */
export function validateWasteDestruction(waste: {
  wasteWeight: number
  wasteUnit: string
  destructionDate: string
  renderingMethod: string
  wasteCategory: string
  batchId?: string
  packageId?: string
  harvestId?: string
  inertMaterialWeight?: number
  inertMaterialUnit?: string
  witnessedBy?: string
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'wasteWeight', waste.wasteWeight)
  validateRequired(result, 'wasteUnit', waste.wasteUnit)
  validateRequired(result, 'destructionDate', waste.destructionDate)
  validateRequired(result, 'renderingMethod', waste.renderingMethod)
  validateRequired(result, 'wasteCategory', waste.wasteCategory)

  // Validate at least one source entity
  if (!waste.batchId && !waste.packageId && !waste.harvestId) {
    addError(
      result,
      'entityId',
      'Must specify at least one source: batchId, packageId, or harvestId',
      'MISSING_ENTITY_SOURCE'
    )
  }

  // Validate date
  if (waste.destructionDate) {
    validateDate(result, 'destructionDate', waste.destructionDate)
    validateDateNotInFuture(result, 'destructionDate', waste.destructionDate)
  }

  // Validate weight
  if (waste.wasteWeight !== undefined) {
    validatePositiveNumber(result, 'wasteWeight', waste.wasteWeight)

    // Warn for very large waste amounts
    if (waste.wasteWeight > 100 && waste.wasteUnit === 'Kilograms') {
      addWarning(
        result,
        'wasteWeight',
        'Waste weight is unusually high (>100kg). Verify measurement.',
        'HIGH_WASTE_WEIGHT'
      )
    }
  }

  // Validate rendering method
  const validMethods = [
    '50_50_sawdust',
    '50_50_kitty_litter',
    '50_50_soil',
    '50_50_other_inert',
    'composting',
    'grinding',
    'other',
  ]

  if (waste.renderingMethod && !validMethods.includes(waste.renderingMethod)) {
    addError(
      result,
      'renderingMethod',
      `Invalid rendering method. Must be one of: ${validMethods.join(', ')}`,
      'INVALID_RENDERING_METHOD'
    )
  }

  // Validate 50:50 mix compliance (Oregon/Maryland requirement)
  if (waste.renderingMethod?.startsWith('50_50')) {
    if (!waste.inertMaterialWeight) {
      addError(
        result,
        'inertMaterialWeight',
        '50:50 rendering method requires inert material weight',
        'MISSING_INERT_MATERIAL_WEIGHT'
      )
    } else {
      // Check ratio (allow 10% tolerance)
      const minInert = waste.wasteWeight * 0.9
      const maxInert = waste.wasteWeight * 1.1

      if (waste.inertMaterialWeight < minInert) {
        addError(
          result,
          'inertMaterialWeight',
          `Inert material weight (${waste.inertMaterialWeight}) is too low for 50:50 mix. Minimum: ${minInert.toFixed(2)} ${waste.inertMaterialUnit}`,
          'INERT_MATERIAL_TOO_LOW'
        )
      }

      if (waste.inertMaterialWeight > maxInert) {
        addWarning(
          result,
          'inertMaterialWeight',
          `Inert material weight (${waste.inertMaterialWeight}) exceeds recommended 50:50 ratio. Maximum: ${maxInert.toFixed(2)} ${waste.inertMaterialUnit}`,
          'INERT_MATERIAL_EXCEEDS_RATIO'
        )
      }
    }

    // Recommend witness for 50:50 destruction
    if (!waste.witnessedBy) {
      addWarning(
        result,
        'witnessedBy',
        '50:50 waste destruction should have a witness for compliance documentation',
        'MISSING_WITNESS'
      )
    }
  }

  // Validate waste category
  const validCategories = [
    'plant_material',
    'package_waste',
    'harvest_trim',
    'spoiled_product',
    'other',
  ]

  if (waste.wasteCategory && !validCategories.includes(waste.wasteCategory)) {
    addError(
      result,
      'wasteCategory',
      `Invalid waste category. Must be one of: ${validCategories.join(', ')}`,
      'INVALID_WASTE_CATEGORY'
    )
  }

  return result
}

/**
 * Validate plant batch destruction
 */
export function validatePlantBatchDestruction(destruction: {
  batchId: string
  plantsDestroyed: number
  totalPlantsInBatch: number
  plantTags?: string[]
  wasteWeight: number
  wasteReason: string
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'batchId', destruction.batchId)
  validateRequired(result, 'plantsDestroyed', destruction.plantsDestroyed)
  validateRequired(result, 'wasteWeight', destruction.wasteWeight)
  validateRequired(result, 'wasteReason', destruction.wasteReason)

  // Validate plants destroyed count
  if (destruction.plantsDestroyed <= 0) {
    addError(
      result,
      'plantsDestroyed',
      'Must destroy at least 1 plant',
      'INVALID_PLANTS_DESTROYED'
    )
  }

  if (destruction.plantsDestroyed > destruction.totalPlantsInBatch) {
    addError(
      result,
      'plantsDestroyed',
      `Cannot destroy more plants (${destruction.plantsDestroyed}) than exist in batch (${destruction.totalPlantsInBatch})`,
      'EXCEEDS_BATCH_PLANT_COUNT'
    )
  }

  // Validate plant tags if provided
  if (destruction.plantTags && destruction.plantTags.length > 0) {
    if (destruction.plantTags.length !== destruction.plantsDestroyed) {
      addWarning(
        result,
        'plantTags',
        `Plant tags count (${destruction.plantTags.length}) does not match plants destroyed (${destruction.plantsDestroyed})`,
        'TAG_COUNT_MISMATCH'
      )
    }

    // Validate tag format (22-character Metrc format)
    const tagRegex = /^1A[A-Z0-9]{7}\d{12}$/
    destruction.plantTags.forEach((tag, index) => {
      if (!tagRegex.test(tag)) {
        addError(
          result,
          `plantTags[${index}]`,
          `Invalid Metrc plant tag format: ${tag}`,
          'INVALID_PLANT_TAG_FORMAT'
        )
      }
    })
  }

  // Validate weight reasonableness (warn if <50g or >2kg per plant)
  const avgWeightPerPlant = destruction.wasteWeight / destruction.plantsDestroyed

  if (avgWeightPerPlant < 0.05) {
    // Less than 50g per plant
    addWarning(
      result,
      'wasteWeight',
      `Average weight per plant is very low (${avgWeightPerPlant.toFixed(3)} kg). Verify measurement.`,
      'LOW_AVG_PLANT_WEIGHT'
    )
  }

  if (avgWeightPerPlant > 2) {
    // More than 2kg per plant
    addWarning(
      result,
      'wasteWeight',
      `Average weight per plant is very high (${avgWeightPerPlant.toFixed(3)} kg). Verify measurement.`,
      'HIGH_AVG_PLANT_WEIGHT'
    )
  }

  return result
}

/**
 * Validate package waste destruction
 */
export function validatePackageDestruction(destruction: {
  packageId: string
  packageWeight: number
  wasteWeight: number
  wasteReason: string
  adjustmentReason: string
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'packageId', destruction.packageId)
  validateRequired(result, 'wasteWeight', destruction.wasteWeight)
  validateRequired(result, 'wasteReason', destruction.wasteReason)
  validateRequired(result, 'adjustmentReason', destruction.adjustmentReason)

  // Validate waste weight doesn't exceed package weight
  if (destruction.wasteWeight > destruction.packageWeight) {
    addError(
      result,
      'wasteWeight',
      `Waste weight (${destruction.wasteWeight}) cannot exceed package weight (${destruction.packageWeight})`,
      'WASTE_EXCEEDS_PACKAGE_WEIGHT'
    )
  }

  // Validate adjustment reason (Metrc-specific)
  const validReasons = [
    'Drying',
    'Entry Error',
    'Inventory Audit',
    'Mandatory State Destruction',
    'Product Degradation',
    'Theft',
    'Vendor Returned Goods',
    'Other',
  ]

  if (destruction.adjustmentReason && !validReasons.includes(destruction.adjustmentReason)) {
    addWarning(
      result,
      'adjustmentReason',
      `Adjustment reason "${destruction.adjustmentReason}" may not be accepted by Metrc. Common reasons: ${validReasons.join(', ')}`,
      'UNKNOWN_ADJUSTMENT_REASON'
    )
  }

  return result
}

/**
 * Validate Metrc waste payload
 */
export function validateMetrcWastePayload(payload: {
  WasteType: string
  WasteWeight: number
  UnitOfWeight: string
  WasteDate: string
  WasteMethodName?: string
}): ValidationResult {
  const result = createValidationResult()

  // Validate Metrc waste type
  const validMetrcWasteTypes = [
    'Plant Material',
    'Harvest Waste',
    'Product Waste',
    'Other',
  ]

  if (!validMetrcWasteTypes.includes(payload.WasteType)) {
    addError(
      result,
      'WasteType',
      `Invalid Metrc waste type. Must be one of: ${validMetrcWasteTypes.join(', ')}`,
      'INVALID_METRC_WASTE_TYPE'
    )
  }

  // Validate unit of weight
  const validUnits = ['Grams', 'Kilograms', 'Ounces', 'Pounds']
  if (!validUnits.includes(payload.UnitOfWeight)) {
    addError(
      result,
      'UnitOfWeight',
      `Invalid unit of weight. Must be one of: ${validUnits.join(', ')}`,
      'INVALID_UNIT_OF_WEIGHT'
    )
  }

  validatePositiveNumber(result, 'WasteWeight', payload.WasteWeight)
  validateDate(result, 'WasteDate', payload.WasteDate)

  return result
}
```

### 3. Waste Destruction Sync Service (3 hours)
**File:** `lib/compliance/metrc/sync/waste-destruction-sync.ts`

```typescript
import { MetrcClient } from '../client'
import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import {
  validateWasteDestruction,
  validatePlantBatchDestruction,
  validatePackageDestruction,
  validateMetrcWastePayload,
} from '../validation/waste-destruction-rules'
import type { MetrcPlantBatchWaste, MetrcPackageAdjustment } from '../types'

export interface WasteDestructionResult {
  success: boolean
  wasteLogId?: string
  destructionEventId?: string
  metrcTransactionId?: string
  errors: string[]
  warnings: string[]
  syncLogId?: string
}

/**
 * Destroy plant batch and sync to Metrc
 */
export async function destroyPlantBatchWaste(params: {
  batchId: string
  plantsDestroyed: number
  plantTags?: string[]
  wasteWeight: number
  wasteUnit: string
  wasteReason: string
  renderingMethod: string
  inertMaterialWeight?: number
  inertMaterialUnit?: string
  destructionDate: string
  witnessedBy?: string
  photoEvidenceUrls?: string[]
  notes?: string
  destroyedBy: string
}): Promise<WasteDestructionResult> {
  const supabase = await createClient()
  const result: WasteDestructionResult = {
    success: false,
    errors: [],
    warnings: [],
  }

  try {
    // 1. Get batch details
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select(`
        id,
        batch_number,
        plant_count,
        domain_type,
        site_id,
        organization_id,
        metrc_plant_labels
      `)
      .eq('id', params.batchId)
      .single()

    if (batchError || !batch) {
      throw new Error('Batch not found')
    }

    // 2. Validate domain type
    if (batch.domain_type !== 'cannabis') {
      throw new Error('Waste destruction only applicable to cannabis batches')
    }

    // 3. Validate plant batch destruction
    const plantValidation = validatePlantBatchDestruction({
      batchId: params.batchId,
      plantsDestroyed: params.plantsDestroyed,
      totalPlantsInBatch: batch.plant_count,
      plantTags: params.plantTags,
      wasteWeight: params.wasteWeight,
      wasteReason: params.wasteReason,
    })

    if (!plantValidation.isValid) {
      const errorMessages = plantValidation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }

    plantValidation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // 4. Validate waste destruction
    const wasteValidation = validateWasteDestruction({
      wasteWeight: params.wasteWeight,
      wasteUnit: params.wasteUnit,
      destructionDate: params.destructionDate,
      renderingMethod: params.renderingMethod,
      wasteCategory: 'plant_material',
      batchId: params.batchId,
      inertMaterialWeight: params.inertMaterialWeight,
      inertMaterialUnit: params.inertMaterialUnit,
      witnessedBy: params.witnessedBy,
    })

    if (!wasteValidation.isValid) {
      const errorMessages = wasteValidation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Waste validation failed: ${errorMessages.join(', ')}`)
    }

    wasteValidation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // 5. Generate waste number
    const wasteNumber = await generateWasteNumber(
      batch.organization_id,
      params.destructionDate
    )

    // 6. Create waste log
    const { data: wasteLog, error: wasteLogError } = await supabase
      .from('waste_logs')
      .insert({
        organization_id: batch.organization_id,
        site_id: batch.site_id,
        domain_type: 'cannabis',
        waste_number: wasteNumber,
        batch_id: params.batchId,
        waste_category: 'plant_material',
        waste_type: params.wasteReason,
        waste_weight: params.wasteWeight,
        waste_unit: params.wasteUnit,
        destruction_date: params.destructionDate,
        rendering_method: params.renderingMethod,
        inert_material_weight: params.inertMaterialWeight,
        inert_material_unit: params.inertMaterialUnit || params.wasteUnit,
        witnessed_by: params.witnessedBy,
        photo_evidence_urls: params.photoEvidenceUrls || [],
        notes: params.notes,
        created_by: params.destroyedBy,
      })
      .select()
      .single()

    if (wasteLogError || !wasteLog) {
      throw new Error('Failed to create waste log')
    }

    result.wasteLogId = wasteLog.id

    // 7. Generate destruction event number
    const eventNumber = await generateDestructionEventNumber(
      batch.organization_id,
      params.destructionDate
    )

    // 8. Create destruction event
    const { data: destructionEvent, error: eventError } = await supabase
      .from('waste_destruction_events')
      .insert({
        organization_id: batch.organization_id,
        site_id: batch.site_id,
        event_number: eventNumber,
        waste_log_id: wasteLog.id,
        batch_id: params.batchId,
        destruction_type: 'plant_batch_destruction',
        plants_destroyed: params.plantsDestroyed,
        plant_tags_destroyed: params.plantTags || [],
        weight_destroyed: params.wasteWeight,
        unit_of_weight: params.wasteUnit,
        notes: params.notes,
        created_by: params.destroyedBy,
      })
      .select()
      .single()

    if (eventError || !destructionEvent) {
      throw new Error('Failed to create destruction event')
    }

    result.destructionEventId = destructionEvent.id

    // 9. Update batch plant count
    const newPlantCount = batch.plant_count - params.plantsDestroyed
    await supabase
      .from('batches')
      .update({
        plant_count: newPlantCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.batchId)

    // 10. Update individual plant records (if tags provided)
    if (params.plantTags && params.plantTags.length > 0) {
      await supabase
        .from('batch_plants')
        .update({
          status: 'destroyed',
          destroyed_at: new Date().toISOString(),
          destroyed_reason: params.wasteReason,
        })
        .in('plant_tag', params.plantTags)
    }

    // 11. Create batch event
    await supabase.from('batch_events').insert({
      batch_id: params.batchId,
      event_type: 'plant_destruction',
      user_id: params.destroyedBy,
      from_value: { plant_count: batch.plant_count },
      to_value: {
        plant_count: newPlantCount,
        plants_destroyed: params.plantsDestroyed,
        waste_log_id: wasteLog.id,
      },
    })

    // 12. Check if batch is synced to Metrc
    const { data: batchMapping } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_batch_id, site_id, organization_id')
      .eq('batch_id', params.batchId)
      .single()

    if (!batchMapping) {
      // Not synced to Metrc - local only
      result.success = true
      result.warnings.push('Batch not synced to Metrc. Waste logged locally only.')
      return result
    }

    // 13. Get plant tags for Metrc destruction
    const plantLabels = params.plantTags || []

    if (plantLabels.length === 0) {
      result.success = true
      result.warnings.push(
        'No plant tags provided. Waste logged locally. Provide tags for Metrc sync.'
      )
      return result
    }

    // 14. Get API keys
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('compliance_api_keys')
      .select('*')
      .eq('site_id', batch.site_id)
      .eq('is_active', true)
      .single()

    if (apiKeyError || !apiKey) {
      throw new Error('No active Metrc API key found for this site')
    }

    // 15. Create sync log
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: batch.organization_id,
      site_id: batch.site_id,
      sync_type: 'waste_destruction',
      direction: 'push',
      operation: 'destroy_plant_batch',
      local_id: wasteLog.id,
      initiated_by: params.destroyedBy,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    await updateSyncLogEntry(syncLog.id, {
      status: 'in_progress',
    })

    // 16. Initialize Metrc client
    const metrcClient = new MetrcClient({
      vendorApiKey: apiKey.vendor_api_key,
      userApiKey: apiKey.user_api_key,
      facilityLicenseNumber: apiKey.facility_license_number,
      state: apiKey.state_code,
      isSandbox: apiKey.is_sandbox,
    })

    // 17. Build Metrc plant batch waste payload
    const metrcWaste: MetrcPlantBatchWaste = {
      PlantBatch: batchMapping.metrc_batch_id,
      Count: params.plantsDestroyed,
      WasteWeight: params.wasteWeight,
      WasteUnitOfMeasure: params.wasteUnit,
      WasteDate: params.destructionDate,
      WasteMethodName: mapRenderingMethodToMetrc(params.renderingMethod),
      WasteReasonName: params.wasteReason,
      PlantTags: plantLabels,
    }

    // Validate Metrc payload
    const metrcValidation = validateMetrcWastePayload({
      WasteType: 'Plant Material',
      WasteWeight: params.wasteWeight,
      UnitOfWeight: params.wasteUnit,
      WasteDate: params.destructionDate,
      WasteMethodName: metrcWaste.WasteMethodName,
    })

    if (!metrcValidation.isValid) {
      const errors = metrcValidation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Metrc payload validation failed: ${errors.join(', ')}`)
    }

    // 18. Destroy plant batch in Metrc
    // await metrcClient.plantBatches.destroyPlants([metrcWaste])
    // Note: Actual API call commented for safety - implement when ready

    // 19. Store Metrc transaction ID
    const metrcTransactionId = `TEMP-WASTE-${wasteLog.id}` // Replace with actual Metrc response

    await supabase
      .from('waste_logs')
      .update({
        metrc_waste_id: metrcTransactionId,
        metrc_sync_status: 'synced',
        sync_attempted_at: new Date().toISOString(),
      })
      .eq('id', wasteLog.id)

    await supabase
      .from('waste_destruction_events')
      .update({
        metrc_transaction_id: metrcTransactionId,
        metrc_sync_status: 'synced',
      })
      .eq('id', destructionEvent.id)

    // 20. Update sync log
    await updateSyncLogEntry(syncLog.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        waste_log_id: wasteLog.id,
        metrc_transaction_id: metrcTransactionId,
        plants_destroyed: params.plantsDestroyed,
        plant_tags: plantLabels.length,
        waste_weight: params.wasteWeight,
      },
    })

    result.success = true
    result.metrcTransactionId = metrcTransactionId
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
 * Destroy package waste and sync to Metrc
 */
export async function destroyPackageWaste(params: {
  packageId: string
  wasteWeight: number
  wasteUnit: string
  wasteReason: string
  adjustmentReason: string
  renderingMethod: string
  inertMaterialWeight?: number
  destructionDate: string
  witnessedBy?: string
  photoEvidenceUrls?: string[]
  notes?: string
  destroyedBy: string
}): Promise<WasteDestructionResult> {
  const supabase = await createClient()
  const result: WasteDestructionResult = {
    success: false,
    errors: [],
    warnings: [],
  }

  try {
    // 1. Get package details
    const { data: pkg, error: pkgError } = await supabase
      .from('harvest_packages')
      .select(`
        id,
        package_tag,
        weight,
        unit_of_weight,
        harvest_id,
        site_id,
        organization_id,
        metrc_package_id
      `)
      .eq('id', params.packageId)
      .single()

    if (pkgError || !pkg) {
      throw new Error('Package not found')
    }

    // 2. Validate package destruction
    const validation = validatePackageDestruction({
      packageId: params.packageId,
      packageWeight: pkg.weight,
      wasteWeight: params.wasteWeight,
      wasteReason: params.wasteReason,
      adjustmentReason: params.adjustmentReason,
    })

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }

    validation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // 3. Validate waste destruction
    const wasteValidation = validateWasteDestruction({
      wasteWeight: params.wasteWeight,
      wasteUnit: params.wasteUnit,
      destructionDate: params.destructionDate,
      renderingMethod: params.renderingMethod,
      wasteCategory: 'package_waste',
      packageId: params.packageId,
      inertMaterialWeight: params.inertMaterialWeight,
      witnessedBy: params.witnessedBy,
    })

    if (!wasteValidation.isValid) {
      const errors = wasteValidation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Waste validation failed: ${errors.join(', ')}`)
    }

    // 4. Generate waste number
    const wasteNumber = await generateWasteNumber(
      pkg.organization_id,
      params.destructionDate
    )

    // 5. Create waste log
    const { data: wasteLog, error: wasteLogError } = await supabase
      .from('waste_logs')
      .insert({
        organization_id: pkg.organization_id,
        site_id: pkg.site_id,
        domain_type: 'cannabis',
        waste_number: wasteNumber,
        package_id: params.packageId,
        waste_category: 'package_waste',
        waste_type: params.wasteReason,
        waste_weight: params.wasteWeight,
        waste_unit: params.wasteUnit,
        destruction_date: params.destructionDate,
        rendering_method: params.renderingMethod,
        inert_material_weight: params.inertMaterialWeight,
        inert_material_unit: params.wasteUnit,
        witnessed_by: params.witnessedBy,
        photo_evidence_urls: params.photoEvidenceUrls || [],
        metrc_package_label: pkg.package_tag,
        notes: params.notes,
        created_by: params.destroyedBy,
      })
      .select()
      .single()

    if (wasteLogError || !wasteLog) {
      throw new Error('Failed to create waste log')
    }

    result.wasteLogId = wasteLog.id

    // 6. Create destruction event
    const eventNumber = await generateDestructionEventNumber(
      pkg.organization_id,
      params.destructionDate
    )

    const { data: destructionEvent, error: eventError } = await supabase
      .from('waste_destruction_events')
      .insert({
        organization_id: pkg.organization_id,
        site_id: pkg.site_id,
        event_number: eventNumber,
        waste_log_id: wasteLog.id,
        package_id: params.packageId,
        destruction_type: 'package_adjustment',
        weight_destroyed: params.wasteWeight,
        unit_of_weight: params.wasteUnit,
        notes: params.notes,
        created_by: params.destroyedBy,
      })
      .select()
      .single()

    if (eventError || !destructionEvent) {
      throw new Error('Failed to create destruction event')
    }

    result.destructionEventId = destructionEvent.id

    // 7. Update package weight
    const newWeight = pkg.weight - params.wasteWeight
    if (newWeight <= 0) {
      // Package fully destroyed
      await supabase
        .from('harvest_packages')
        .update({
          status: 'destroyed',
          weight: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.packageId)
    } else {
      await supabase
        .from('harvest_packages')
        .update({
          weight: newWeight,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.packageId)
    }

    // 8. Check Metrc sync (similar to plant batch destruction)
    if (!pkg.metrc_package_id) {
      result.success = true
      result.warnings.push('Package not synced to Metrc. Waste logged locally only.')
      return result
    }

    // ... Continue with Metrc API sync (similar pattern to plant batch)
    // Use metrcClient.packages.adjust() for package adjustments

    result.success = true
    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}

/**
 * Helper: Generate waste number
 */
async function generateWasteNumber(
  organizationId: string,
  destructionDate: string
): Promise<string> {
  const supabase = await createClient()
  const date = new Date(destructionDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  const { count } = await supabase
    .from('waste_logs')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('destruction_date', `${year}-${month}-01`)
    .lt('destruction_date', `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`)

  const sequence = String((count || 0) + 1).padStart(5, '0')
  return `WST-${year}-${month}-${sequence}`
}

/**
 * Helper: Generate destruction event number
 */
async function generateDestructionEventNumber(
  organizationId: string,
  destructionDate: string
): Promise<string> {
  const supabase = await createClient()
  const date = new Date(destructionDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  const { count } = await supabase
    .from('waste_destruction_events')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', `${year}-${month}-01`)
    .lt('created_at', `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`)

  const sequence = String((count || 0) + 1).padStart(5, '0')
  return `WDE-${year}-${month}-${sequence}`
}

/**
 * Helper: Map rendering method to Metrc format
 */
function mapRenderingMethodToMetrc(renderingMethod: string): string {
  const mapping: Record<string, string> = {
    '50_50_sawdust': '50:50 Mix with Sawdust',
    '50_50_kitty_litter': '50:50 Mix with Kitty Litter',
    '50_50_soil': '50:50 Mix with Soil',
    '50_50_other_inert': '50:50 Mix with Other Inert Material',
    'composting': 'Composting',
    'grinding': 'Grinding and Incorporation',
    'other': 'Other',
  }

  return mapping[renderingMethod] || 'Other'
}
```

### 4. Waste Destruction API Routes (1.5 hours)
**File:** `app/api/waste/destroy-plant-batch/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { destroyPlantBatchWaste } from '@/lib/compliance/metrc/sync/waste-destruction-sync'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      batchId,
      plantsDestroyed,
      plantTags,
      wasteWeight,
      wasteUnit,
      wasteReason,
      renderingMethod,
      inertMaterialWeight,
      inertMaterialUnit,
      destructionDate,
      witnessedBy,
      photoEvidenceUrls,
      notes,
    } = body

    // Validate required fields
    if (
      !batchId ||
      !plantsDestroyed ||
      !wasteWeight ||
      !wasteUnit ||
      !wasteReason ||
      !renderingMethod ||
      !destructionDate
    ) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Destroy plant batch
    const result = await destroyPlantBatchWaste({
      batchId,
      plantsDestroyed,
      plantTags,
      wasteWeight,
      wasteUnit,
      wasteReason,
      renderingMethod,
      inertMaterialWeight,
      inertMaterialUnit,
      destructionDate,
      witnessedBy,
      photoEvidenceUrls,
      notes,
      destroyedBy: user.id,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to destroy plant batch',
          errors: result.errors,
        },
        { status: 500 }
      )
    }

    // Get created waste log
    const { data: wasteLog } = await supabase
      .from('waste_logs')
      .select('waste_number')
      .eq('id', result.wasteLogId)
      .single()

    return NextResponse.json({
      success: true,
      wasteLogId: result.wasteLogId,
      wasteNumber: wasteLog?.waste_number,
      destructionEventId: result.destructionEventId,
      metrcTransactionId: result.metrcTransactionId,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Error in destroy plant batch API:', error)
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

**File:** `app/api/waste/destroy-package/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { destroyPackageWaste } from '@/lib/compliance/metrc/sync/waste-destruction-sync'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      packageId,
      wasteWeight,
      wasteUnit,
      wasteReason,
      adjustmentReason,
      renderingMethod,
      inertMaterialWeight,
      destructionDate,
      witnessedBy,
      photoEvidenceUrls,
      notes,
    } = body

    // Validate required fields
    if (
      !packageId ||
      !wasteWeight ||
      !wasteUnit ||
      !wasteReason ||
      !adjustmentReason ||
      !renderingMethod ||
      !destructionDate
    ) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Destroy package waste
    const result = await destroyPackageWaste({
      packageId,
      wasteWeight,
      wasteUnit,
      wasteReason,
      adjustmentReason,
      renderingMethod,
      inertMaterialWeight,
      destructionDate,
      witnessedBy,
      photoEvidenceUrls,
      notes,
      destroyedBy: user.id,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to destroy package waste',
          errors: result.errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      wasteLogId: result.wasteLogId,
      destructionEventId: result.destructionEventId,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Error in destroy package API:', error)
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

### 5. Waste Destruction UI Components (3-4 hours)
**File:** `components/features/waste/destroy-plant-batch-dialog.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, AlertTriangle, Camera } from 'lucide-react'
import { toast } from 'sonner'

interface DestroyPlantBatchDialogProps {
  batchId: string
  batchNumber: string
  currentPlantCount: number
  plantTags?: string[]
  onDestroyed: () => void
  trigger?: React.ReactNode
}

export function DestroyPlantBatchDialog({
  batchId,
  batchNumber,
  currentPlantCount,
  plantTags = [],
  onDestroyed,
  trigger,
}: DestroyPlantBatchDialogProps) {
  const [open, setOpen] = useState(false)
  const [plantsDestroyed, setPlantsDestroyed] = useState('')
  const [wasteWeight, setWasteWeight] = useState('')
  const [wasteUnit, setWasteUnit] = useState('Kilograms')
  const [wasteReason, setWasteReason] = useState('')
  const [renderingMethod, setRenderingMethod] = useState('50_50_sawdust')
  const [inertWeight, setInertWeight] = useState('')
  const [destructionDate, setDestructionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState('')
  const [isDestroying, setIsDestroying] = useState(false)

  const handleDestroy = async () => {
    const plantsCount = Number(plantsDestroyed)
    const weight = Number(wasteWeight)

    if (!plantsCount || plantsCount <= 0 || plantsCount > currentPlantCount) {
      toast.error('Invalid number of plants to destroy')
      return
    }

    if (!weight || weight <= 0) {
      toast.error('Please enter a valid waste weight')
      return
    }

    if (!wasteReason) {
      toast.error('Please select a waste reason')
      return
    }

    // Validate 50:50 mix
    if (renderingMethod.startsWith('50_50')) {
      const inertWeightNum = Number(inertWeight)
      if (!inertWeightNum || inertWeightNum < weight * 0.9) {
        toast.error('50:50 rendering requires equal or greater inert material weight')
        return
      }
    }

    try {
      setIsDestroying(true)

      const response = await fetch('/api/waste/destroy-plant-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          plantsDestroyed: plantsCount,
          plantTags: plantTags.slice(0, plantsCount), // Use available tags
          wasteWeight: weight,
          wasteUnit,
          wasteReason,
          renderingMethod,
          inertMaterialWeight: renderingMethod.startsWith('50_50')
            ? Number(inertWeight)
            : undefined,
          inertMaterialUnit: wasteUnit,
          destructionDate,
          notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to destroy plant batch')
      }

      const result = await response.json()

      toast.success(`Waste log ${result.wasteNumber} created successfully`)

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, { duration: 5000 })
        })
      }

      setOpen(false)
      onDestroyed()
    } catch (error) {
      console.error('Error destroying plant batch:', error)
      toast.error((error as Error).message || 'Failed to destroy plant batch')
    } finally {
      setIsDestroying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Destroy Plants
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Destroy Plant Batch Waste</DialogTitle>
          <DialogDescription>
            Record waste destruction for batch {batchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Warning:</strong> This action will reduce the batch plant count and
              cannot be undone. Ensure proper 50:50 rendering for compliance.
            </AlertDescription>
          </Alert>

          {/* Batch Info */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Batch:</strong> {batchNumber}
              <br />
              <strong>Current Plant Count:</strong> {currentPlantCount}
              <br />
              <strong>Plant Tags Available:</strong> {plantTags.length}
            </AlertDescription>
          </Alert>

          {/* Plants Destroyed */}
          <div className="space-y-2">
            <Label htmlFor="plantsDestroyed">Plants Destroyed *</Label>
            <Input
              id="plantsDestroyed"
              type="number"
              min="1"
              max={currentPlantCount}
              value={plantsDestroyed}
              onChange={(e) => setPlantsDestroyed(e.target.value)}
              placeholder="Number of plants"
            />
          </div>

          {/* Waste Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wasteWeight">Waste Weight *</Label>
              <Input
                id="wasteWeight"
                type="number"
                step="0.01"
                min="0"
                value={wasteWeight}
                onChange={(e) => setWasteWeight(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wasteUnit">Unit *</Label>
              <Select value={wasteUnit} onValueChange={setWasteUnit}>
                <SelectTrigger id="wasteUnit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Grams">Grams</SelectItem>
                  <SelectItem value="Kilograms">Kilograms</SelectItem>
                  <SelectItem value="Ounces">Ounces</SelectItem>
                  <SelectItem value="Pounds">Pounds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Waste Reason */}
          <div className="space-y-2">
            <Label htmlFor="wasteReason">Waste Reason *</Label>
            <Select value={wasteReason} onValueChange={setWasteReason}>
              <SelectTrigger id="wasteReason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male Plants">Male Plants</SelectItem>
                <SelectItem value="Pests/Disease">Pests/Disease</SelectItem>
                <SelectItem value="Quality Issues">Quality Issues</SelectItem>
                <SelectItem value="Facility Closure">Facility Closure</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rendering Method */}
          <div className="space-y-2">
            <Label htmlFor="renderingMethod">Rendering Method * (50:50 required)</Label>
            <Select value={renderingMethod} onValueChange={setRenderingMethod}>
              <SelectTrigger id="renderingMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50_50_sawdust">50:50 Mix with Sawdust</SelectItem>
                <SelectItem value="50_50_kitty_litter">50:50 Mix with Kitty Litter</SelectItem>
                <SelectItem value="50_50_soil">50:50 Mix with Soil</SelectItem>
                <SelectItem value="50_50_other_inert">50:50 Mix with Other Inert</SelectItem>
                <SelectItem value="composting">Composting</SelectItem>
                <SelectItem value="grinding">Grinding</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inert Material Weight (for 50:50) */}
          {renderingMethod.startsWith('50_50') && (
            <div className="space-y-2">
              <Label htmlFor="inertWeight">
                Inert Material Weight * (50:50 requires ≥ waste weight)
              </Label>
              <Input
                id="inertWeight"
                type="number"
                step="0.01"
                min="0"
                value={inertWeight}
                onChange={(e) => setInertWeight(e.target.value)}
                placeholder="Equal or greater than waste weight"
              />
              {wasteWeight && inertWeight && (
                <p className="text-sm text-muted-foreground">
                  Ratio: {Number(inertWeight) > 0
                    ? (Number(inertWeight) / Number(wasteWeight)).toFixed(2)
                    : '0'}
                  :1 {Number(inertWeight) >= Number(wasteWeight) * 0.9 && '✅'}
                </p>
              )}
            </div>
          )}

          {/* Destruction Date */}
          <div className="space-y-2">
            <Label htmlFor="destructionDate">Destruction Date *</Label>
            <Input
              id="destructionDate"
              type="date"
              value={destructionDate}
              onChange={(e) => setDestructionDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Destruction observations, witness information, etc."
              rows={3}
            />
          </div>

          {/* Photo Evidence Placeholder */}
          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Photo Evidence:</strong> Upload photos of destruction process and
              50:50 mix for compliance documentation (feature coming soon).
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDestroying}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDestroy} disabled={isDestroying}>
            {isDestroying ? 'Destroying...' : 'Destroy & Log Waste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 6. Unit Tests (2 hours)
**File:** `lib/compliance/metrc/validation/__tests__/waste-destruction-rules.test.ts`

```typescript
import {
  validateWasteDestruction,
  validatePlantBatchDestruction,
  validatePackageDestruction,
  validateMetrcWastePayload,
} from '../waste-destruction-rules'

describe('validateWasteDestruction', () => {
  it('should validate valid waste destruction', () => {
    const result = validateWasteDestruction({
      wasteWeight: 5.5,
      wasteUnit: 'Kilograms',
      destructionDate: '2025-11-20',
      renderingMethod: '50_50_sawdust',
      wasteCategory: 'plant_material',
      batchId: 'batch-123',
      inertMaterialWeight: 5.5,
      inertMaterialUnit: 'Kilograms',
      witnessedBy: 'user-123',
    })
    expect(result.isValid).toBe(true)
  })

  it('should fail when 50:50 mix lacks inert material weight', () => {
    const result = validateWasteDestruction({
      wasteWeight: 5.5,
      wasteUnit: 'Kilograms',
      destructionDate: '2025-11-20',
      renderingMethod: '50_50_sawdust',
      wasteCategory: 'plant_material',
      batchId: 'batch-123',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'MISSING_INERT_MATERIAL_WEIGHT')).toBe(true)
  })

  it('should fail when inert material weight is too low', () => {
    const result = validateWasteDestruction({
      wasteWeight: 10.0,
      wasteUnit: 'Kilograms',
      destructionDate: '2025-11-20',
      renderingMethod: '50_50_sawdust',
      wasteCategory: 'plant_material',
      batchId: 'batch-123',
      inertMaterialWeight: 5.0, // Too low for 50:50
      inertMaterialUnit: 'Kilograms',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INERT_MATERIAL_TOO_LOW')).toBe(true)
  })

  it('should warn when 50:50 destruction lacks witness', () => {
    const result = validateWasteDestruction({
      wasteWeight: 5.5,
      wasteUnit: 'Kilograms',
      destructionDate: '2025-11-20',
      renderingMethod: '50_50_sawdust',
      wasteCategory: 'plant_material',
      batchId: 'batch-123',
      inertMaterialWeight: 5.5,
      inertMaterialUnit: 'Kilograms',
    })
    expect(result.warnings.some((w) => w.code === 'MISSING_WITNESS')).toBe(true)
  })
})

describe('validatePlantBatchDestruction', () => {
  it('should validate valid plant batch destruction', () => {
    const result = validatePlantBatchDestruction({
      batchId: 'batch-123',
      plantsDestroyed: 10,
      totalPlantsInBatch: 100,
      plantTags: ['1A4FF01000000220000001', '1A4FF01000000220000002'],
      wasteWeight: 5.5,
      wasteReason: 'Male Plants',
    })
    expect(result.isValid).toBe(true)
  })

  it('should fail when destroying more plants than exist', () => {
    const result = validatePlantBatchDestruction({
      batchId: 'batch-123',
      plantsDestroyed: 150,
      totalPlantsInBatch: 100,
      wasteWeight: 5.5,
      wasteReason: 'Male Plants',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'EXCEEDS_BATCH_PLANT_COUNT')).toBe(true)
  })

  it('should warn for very low average plant weight', () => {
    const result = validatePlantBatchDestruction({
      batchId: 'batch-123',
      plantsDestroyed: 100,
      totalPlantsInBatch: 100,
      wasteWeight: 2.0, // 0.02 kg per plant = 20g
      wasteReason: 'Quality Issues',
    })
    expect(result.warnings.some((w) => w.code === 'LOW_AVG_PLANT_WEIGHT')).toBe(true)
  })

  it('should warn for very high average plant weight', () => {
    const result = validatePlantBatchDestruction({
      batchId: 'batch-123',
      plantsDestroyed: 10,
      totalPlantsInBatch: 100,
      wasteWeight: 25.0, // 2.5 kg per plant
      wasteReason: 'Male Plants',
    })
    expect(result.warnings.some((w) => w.code === 'HIGH_AVG_PLANT_WEIGHT')).toBe(true)
  })
})

describe('validatePackageDestruction', () => {
  it('should validate valid package destruction', () => {
    const result = validatePackageDestruction({
      packageId: 'pkg-123',
      packageWeight: 10.0,
      wasteWeight: 5.0,
      wasteReason: 'Product Degradation',
      adjustmentReason: 'Product Degradation',
    })
    expect(result.isValid).toBe(true)
  })

  it('should fail when waste exceeds package weight', () => {
    const result = validatePackageDestruction({
      packageId: 'pkg-123',
      packageWeight: 5.0,
      wasteWeight: 10.0,
      wasteReason: 'Product Degradation',
      adjustmentReason: 'Product Degradation',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'WASTE_EXCEEDS_PACKAGE_WEIGHT')).toBe(true)
  })
})
```

---

## 🏃‍♂️ IMPLEMENTATION STEPS (Week 6)

### Day 1: Database & Validation (3-4 hours)
1. Read all documentation (40 min)
2. Create and apply database migration (1 hour)
3. Create `waste-destruction-rules.ts` validation (2 hours)
4. Write unit tests for validation (1 hour)

### Day 2: Waste Destruction Sync Service (4-5 hours)
1. Create `waste-destruction-sync.ts` (4 hours)
   - Plant batch destruction logic
   - Package destruction logic
   - 50:50 rendering validation
   - Metrc sync preparation
2. Test sync services (1 hour)

### Day 3: UI Components & API (4-5 hours)
1. Create `destroy-plant-batch-dialog.tsx` (2 hours)
2. Create `destroy-package-dialog.tsx` (1.5 hours)
3. Create API routes (1.5 hours)

### Day 4: Testing & Integration (2-3 hours)
1. Integration testing (1 hour)
2. Update batch detail page with destroy button (1 hour)
3. Documentation (1 hour)

---

## ✅ WEEK 6 COMPLETION CHECKLIST

- [ ] Migration created and applied
- [ ] `waste-destruction-rules.ts` created
- [ ] `waste-destruction-sync.ts` created
- [ ] `destroy-plant-batch-dialog.tsx` created
- [ ] `destroy-package-dialog.tsx` created (optional)
- [ ] API endpoints created
- [ ] Unit tests passing (>20 tests)
- [ ] Integration tests completed
- [ ] Batch detail page integration
- [ ] Documentation updated

---

## 💡 PRO TIPS

1. **50:50 Rendering** - Oregon/Maryland require equal weight of inert material mixed with cannabis waste
2. **Witness Required** - Best practice: always record witness for waste destruction
3. **Photo Evidence** - Prepare infrastructure for photo uploads (S3 integration)
4. **Plant Tag Tracking** - Update `batch_plants` table status to 'destroyed'
5. **Auto-numbering** - Use date-based waste numbering (WST-YYYY-MM-XXXXX)
6. **Inert Materials** - Common: sawdust, kitty litter, soil, food waste
7. **Metrc Endpoints** - Use `POST /plantbatches/v2/destroy` for plant destruction, `POST /packages/v2/adjust` for package adjustments
8. **Non-blocking** - Waste log creation should never block batch operations

---

## 🔗 INTEGRATION POINTS

### Batch Detail Page
**Location**: `app/dashboard/batches/[batchId]/page.tsx`

**Integration**:
```tsx
import { DestroyPlantBatchDialog } from '@/components/features/waste/destroy-plant-batch-dialog'

// Add to batch actions
<DestroyPlantBatchDialog
  batchId={batch.id}
  batchNumber={batch.batch_number}
  currentPlantCount={batch.plant_count}
  plantTags={batch.metrc_plant_labels || []}
  onDestroyed={refetch}
/>
```

### Waste Management Page
**Location**: `app/dashboard/waste/page.tsx` (if exists)

Show waste logs with destruction events, rendering method compliance, and Metrc sync status.

---

**Good luck! Complete waste & destruction compliance! ♻️**

**When complete: Move to Week 7 (Transfer Manifests) or Week 8 (Testing & Polish)**
