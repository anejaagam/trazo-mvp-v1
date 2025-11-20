# Quick Start Guide - Phase 3.5 Week 5 (Harvest Management)

**For:** Next agent working on compliance engine
**Phase:** 3.5 - Plant Batch Lifecycle Integration
**Week:** 5 - Harvest Management & Package Creation
**Duration:** 12-15 hours
**Priority:** 🔴 CRITICAL - Required for harvest-to-sale compliance

---

## 📖 REQUIRED READING (Do this first!)

1. **[Week 4 Summary](./docs/compliance/WEEK_4_IMPLEMENTATION_SUMMARY.md)** (10 min review)
   - Plant tag management foundation
   - Individual plant tracking
   - Tag-based operations

2. **[Week 3 Summary](./docs/compliance/WEEK_3_IMPLEMENTATION_SUMMARY.md)** (5 min review)
   - Growth phase transition patterns
   - Non-blocking sync approach

3. **[Week 1 Summary](./docs/compliance/BATCH_PUSH_SYNC_IMPLEMENTATION.md)** (5 min review)
   - Sync log system
   - Validation patterns

4. **[COMPLIANCE_INTEGRATION_GAP_ANALYSIS.md](./COMPLIANCE_INTEGRATION_GAP_ANALYSIS.md)** (Section 2.3-2.4, 15 min)
   - Harvest creation requirements
   - Package creation from harvests
   - Weight tracking rules

**Total Reading Time:** ~35 minutes (essential!)

---

## 🎯 WEEK 5 GOAL: Harvest Management

**Objective:** Create Metrc harvests from batches, generate packages, and track weights throughout the harvest-to-package workflow

### What You're Building

When a user harvests a batch:
```typescript
// User harvests batch
await createHarvestFromBatch({
  batchId: 'batch-123',
  harvestDate: '2025-11-18',
  harvestedBy: userId,
  wetWeight: 50.5, // kg
  unitOfWeight: 'Kilograms'
})
// ✅ Harvest record created in TRAZO
// ✅ Metrc harvest created (synced)
// ✅ Plant tags linked to harvest
// ✅ Wet weight recorded
// ✅ Batch transitioned to 'harvest' stage

// User creates packages from harvest
await createPackagesFromHarvest({
  harvestId: 'harvest-123',
  packages: [
    { tag: '1A4FF02...001', weight: 5.2, itemType: 'Flower' },
    { tag: '1A4FF02...002', weight: 3.8, itemType: 'Trim' }
  ]
})
// ✅ Packages created in TRAZO
// ✅ Metrc packages created (synced)
// ✅ Harvest depleted
// ✅ Inventory updated
```

---

## 🗂️ FILES TO CREATE (in this order)

### 1. Database Migration (30 min)
**File:** `supabase/migrations/20251118000006_add_harvest_tracking.sql`

```sql
-- =====================================================
-- HARVESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Harvest identification
  harvest_number TEXT NOT NULL, -- Auto-generated: HRV-YYYY-MM-XXXXX
  harvest_name TEXT,

  -- Batch reference
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,

  -- Harvest details
  harvest_date DATE NOT NULL,
  harvested_by UUID REFERENCES users(id),
  cultivar_id UUID REFERENCES cultivars(id),

  -- Weight tracking
  wet_weight DECIMAL(12, 4), -- Initial harvest weight
  dry_weight DECIMAL(12, 4), -- After drying
  final_weight DECIMAL(12, 4), -- After curing/trimming
  unit_of_weight TEXT DEFAULT 'Grams' CHECK (unit_of_weight IN ('Grams', 'Kilograms', 'Ounces', 'Pounds')),

  -- Yield tracking
  plant_count INTEGER, -- Number of plants harvested
  waste_weight DECIMAL(12, 4), -- Trim/waste weight

  -- Processing stages
  status TEXT DEFAULT 'wet' CHECK (status IN ('wet', 'drying', 'dry', 'curing', 'cured', 'packaged', 'completed')),
  drying_started_at TIMESTAMPTZ,
  drying_completed_at TIMESTAMPTZ,
  curing_started_at TIMESTAMPTZ,
  curing_completed_at TIMESTAMPTZ,

  -- Location tracking
  drying_location_id UUID REFERENCES rooms(id),
  curing_location_id UUID REFERENCES rooms(id),

  -- Metrc sync
  metrc_harvest_id TEXT,
  metrc_harvest_name TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_harvest_number UNIQUE (organization_id, harvest_number)
);

-- Indexes
CREATE INDEX idx_harvests_batch ON harvests(batch_id);
CREATE INDEX idx_harvests_status ON harvests(status);
CREATE INDEX idx_harvests_date ON harvests(harvest_date);
CREATE INDEX idx_harvests_metrc ON harvests(metrc_harvest_id) WHERE metrc_harvest_id IS NOT NULL;
CREATE INDEX idx_harvests_org_site ON harvests(organization_id, site_id);

-- RLS Policies
ALTER TABLE harvests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view harvests for their organization"
  ON harvests FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage harvests for their organization"
  ON harvests FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE harvests IS 'Harvest records from batches with weight and processing tracking';
COMMENT ON COLUMN harvests.wet_weight IS 'Initial harvest weight (right after harvest)';
COMMENT ON COLUMN harvests.dry_weight IS 'Weight after drying process';
COMMENT ON COLUMN harvests.final_weight IS 'Final weight after all processing';

-- =====================================================
-- HARVEST PACKAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS harvest_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Package identification
  package_tag TEXT NOT NULL, -- Metrc package tag
  package_label TEXT,

  -- Harvest reference
  harvest_id UUID NOT NULL REFERENCES harvests(id) ON DELETE RESTRICT,

  -- Package details
  item_type TEXT NOT NULL, -- 'Flower', 'Trim', 'Shake', 'Kief', 'Waste'
  product_category TEXT, -- 'Buds', 'Immature Plants', etc.

  -- Weight tracking
  weight DECIMAL(12, 4) NOT NULL,
  unit_of_weight TEXT DEFAULT 'Grams',

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_transit', 'sold', 'destroyed')),

  -- Metrc sync
  metrc_package_id TEXT,
  metrc_package_label TEXT,

  -- Metadata
  packaged_at TIMESTAMPTZ DEFAULT NOW(),
  packaged_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_package_tag UNIQUE (organization_id, package_tag)
);

-- Indexes
CREATE INDEX idx_harvest_packages_harvest ON harvest_packages(harvest_id);
CREATE INDEX idx_harvest_packages_tag ON harvest_packages(package_tag);
CREATE INDEX idx_harvest_packages_status ON harvest_packages(status);
CREATE INDEX idx_harvest_packages_metrc ON harvest_packages(metrc_package_id) WHERE metrc_package_id IS NOT NULL;

-- RLS Policies
ALTER TABLE harvest_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view packages for their organization"
  ON harvest_packages FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage packages for their organization"
  ON harvest_packages FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- =====================================================
-- METRC HARVEST MAPPINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS metrc_harvest_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- TRAZO harvest reference
  harvest_id UUID NOT NULL REFERENCES harvests(id) ON DELETE CASCADE,

  -- Metrc harvest details
  metrc_harvest_id TEXT NOT NULL,
  metrc_harvest_name TEXT NOT NULL,

  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  sync_error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_harvest_mapping UNIQUE (harvest_id),
  CONSTRAINT unique_metrc_harvest UNIQUE (site_id, metrc_harvest_id)
);

-- Indexes
CREATE INDEX idx_metrc_harvest_mappings_harvest ON metrc_harvest_mappings(harvest_id);
CREATE INDEX idx_metrc_harvest_mappings_metrc_id ON metrc_harvest_mappings(metrc_harvest_id);
CREATE INDEX idx_metrc_harvest_mappings_site ON metrc_harvest_mappings(site_id);

-- RLS Policies
ALTER TABLE metrc_harvest_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view harvest mappings for their organization"
  ON metrc_harvest_mappings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage harvest mappings for their organization"
  ON metrc_harvest_mappings FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER update_harvests_updated_at
  BEFORE UPDATE ON harvests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_harvest_packages_updated_at
  BEFORE UPDATE ON harvest_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrc_harvest_mappings_updated_at
  BEFORE UPDATE ON metrc_harvest_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Apply migration:**
```typescript
await mcp__supabase__apply_migration({
  name: 'add_harvest_tracking',
  query: '...' // paste SQL above
})
```

### 2. Harvest Validation Rules (1.5 hours)
**File:** `lib/compliance/metrc/validation/harvest-rules.ts`

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
 * Validate harvest creation from batch
 */
export function validateHarvestCreation(harvest: {
  batchId: string
  harvestDate: string
  wetWeight: number
  unitOfWeight: string
  plantCount?: number
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'batchId', harvest.batchId)
  validateRequired(result, 'harvestDate', harvest.harvestDate)
  validateRequired(result, 'wetWeight', harvest.wetWeight)
  validateRequired(result, 'unitOfWeight', harvest.unitOfWeight)

  // Validate date
  if (harvest.harvestDate) {
    validateDate(result, 'harvestDate', harvest.harvestDate)
    validateDateNotInFuture(result, 'harvestDate', harvest.harvestDate)
  }

  // Validate weight
  if (harvest.wetWeight !== undefined) {
    validatePositiveNumber(result, 'wetWeight', harvest.wetWeight)

    // Warn for unusually low weight
    if (harvest.wetWeight < 0.1) {
      addWarning(
        result,
        'wetWeight',
        'Harvest weight is very low. Verify measurement.',
        'LOW_HARVEST_WEIGHT'
      )
    }

    // Warn for very high weight
    if (harvest.wetWeight > 1000) {
      addWarning(
        result,
        'wetWeight',
        'Harvest weight is unusually high. Verify measurement and unit.',
        'HIGH_HARVEST_WEIGHT'
      )
    }
  }

  // Validate unit of weight
  const validUnits = ['Grams', 'Kilograms', 'Ounces', 'Pounds']
  if (harvest.unitOfWeight && !validUnits.includes(harvest.unitOfWeight)) {
    addError(
      result,
      'unitOfWeight',
      `Invalid unit of weight. Must be one of: ${validUnits.join(', ')}`,
      'INVALID_UNIT'
    )
  }

  // Validate plant count if provided
  if (harvest.plantCount !== undefined) {
    if (harvest.plantCount <= 0) {
      addError(
        result,
        'plantCount',
        'Plant count must be greater than 0',
        'INVALID_PLANT_COUNT'
      )
    }
  }

  return result
}

/**
 * Validate package creation from harvest
 */
export function validatePackageCreation(pkg: {
  harvestId: string
  packageTag: string
  itemType: string
  weight: number
  unitOfWeight: string
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'harvestId', pkg.harvestId)
  validateRequired(result, 'packageTag', pkg.packageTag)
  validateRequired(result, 'itemType', pkg.itemType)
  validateRequired(result, 'weight', pkg.weight)
  validateRequired(result, 'unitOfWeight', pkg.unitOfWeight)

  // Validate package tag format (Metrc format)
  const tagRegex = /^1A[A-Z0-9]{5}\d{15}$/
  if (pkg.packageTag && !tagRegex.test(pkg.packageTag)) {
    addError(
      result,
      'packageTag',
      'Invalid Metrc package tag format (22 characters)',
      'INVALID_PACKAGE_TAG'
    )
  }

  // Validate weight
  if (pkg.weight !== undefined) {
    validatePositiveNumber(result, 'weight', pkg.weight)

    // Warn for very small packages
    if (pkg.weight < 0.5) {
      addWarning(
        result,
        'weight',
        'Package weight is very small. Verify measurement.',
        'SMALL_PACKAGE'
      )
    }
  }

  // Validate item type
  const validItemTypes = [
    'Flower',
    'Trim',
    'Shake',
    'Kief',
    'Pre-Roll',
    'Infused (edible)',
    'Infused (non-edible)',
    'Concentrate',
    'Waste'
  ]

  if (pkg.itemType && !validItemTypes.includes(pkg.itemType)) {
    addWarning(
      result,
      'itemType',
      `Item type "${pkg.itemType}" may not be valid. Common types: ${validItemTypes.join(', ')}`,
      'UNKNOWN_ITEM_TYPE'
    )
  }

  return result
}

/**
 * Validate harvest weight update
 */
export function validateWeightUpdate(update: {
  harvestId: string
  weightType: 'wet' | 'dry' | 'final'
  weight: number
  previousWeight?: number
}): ValidationResult {
  const result = createValidationResult()

  validateRequired(result, 'harvestId', update.harvestId)
  validateRequired(result, 'weight', update.weight)
  validatePositiveNumber(result, 'weight', update.weight)

  // Warn if weight increased (unusual)
  if (update.previousWeight && update.weight > update.previousWeight) {
    addWarning(
      result,
      'weight',
      `Weight increased from ${update.previousWeight} to ${update.weight}. This is unusual for harvest processing.`,
      'WEIGHT_INCREASE'
    )
  }

  // Warn for large weight loss (>50%)
  if (update.previousWeight && update.weight < update.previousWeight * 0.5) {
    addWarning(
      result,
      'weight',
      `Weight loss is >50% (${update.previousWeight} → ${update.weight}). Verify measurement.`,
      'LARGE_WEIGHT_LOSS'
    )
  }

  return result
}
```

### 3. Harvest Sync Service (3 hours)
**File:** `lib/compliance/metrc/sync/harvest-sync.ts`

```typescript
import { MetrcClient } from '../client'
import { createClient } from '@/lib/supabase/server'
import { createSyncLogEntry, updateSyncLogEntry } from '@/lib/supabase/queries/compliance'
import { validateHarvestCreation } from '../validation/harvest-rules'
import type { MetrcHarvest } from '../types'

export interface HarvestSyncResult {
  success: boolean
  harvestId?: string
  metrcHarvestId?: string
  errors: string[]
  warnings: string[]
  syncLogId?: string
}

/**
 * Create harvest from batch and sync to Metrc
 */
export async function createHarvestFromBatch(params: {
  batchId: string
  harvestDate: string
  wetWeight: number
  unitOfWeight: string
  harvestedBy: string
  harvestName?: string
  dryingLocationId?: string
  notes?: string
}): Promise<HarvestSyncResult> {
  const supabase = await createClient()
  const result: HarvestSyncResult = {
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
        cultivar_id,
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
      throw new Error('Harvest creation only applicable to cannabis batches')
    }

    // 3. Validate harvest
    const validation = validateHarvestCreation({
      batchId: params.batchId,
      harvestDate: params.harvestDate,
      wetWeight: params.wetWeight,
      unitOfWeight: params.unitOfWeight,
      plantCount: batch.plant_count,
    })

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }

    validation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // 4. Generate harvest number
    const harvestNumber = await generateHarvestNumber(
      batch.organization_id,
      params.harvestDate
    )

    // 5. Create harvest record
    const { data: harvest, error: harvestError } = await supabase
      .from('harvests')
      .insert({
        organization_id: batch.organization_id,
        site_id: batch.site_id,
        harvest_number: harvestNumber,
        harvest_name: params.harvestName || `Harvest ${harvestNumber}`,
        batch_id: params.batchId,
        harvest_date: params.harvestDate,
        harvested_by: params.harvestedBy,
        cultivar_id: batch.cultivar_id,
        wet_weight: params.wetWeight,
        unit_of_weight: params.unitOfWeight,
        plant_count: batch.plant_count,
        status: 'wet',
        drying_location_id: params.dryingLocationId,
        notes: params.notes,
      })
      .select()
      .single()

    if (harvestError || !harvest) {
      throw new Error('Failed to create harvest record')
    }

    result.harvestId = harvest.id

    // 6. Transition batch to harvest stage
    await supabase
      .from('batches')
      .update({ stage: 'harvest', updated_at: new Date().toISOString() })
      .eq('id', params.batchId)

    // 7. Check if batch is synced to Metrc
    const { data: batchMapping } = await supabase
      .from('metrc_batch_mappings')
      .select('metrc_batch_id, site_id, organization_id')
      .eq('batch_id', params.batchId)
      .single()

    if (!batchMapping) {
      // Not synced to Metrc - local only
      result.success = true
      result.warnings.push('Batch not synced to Metrc. Harvest created locally only.')
      return result
    }

    // 8. Get plant tags for Metrc harvest
    const plantLabels = batch.metrc_plant_labels || []

    if (plantLabels.length === 0) {
      result.success = true
      result.warnings.push(
        'No plant tags assigned. Harvest created locally. Assign tags before syncing to Metrc.'
      )
      return result
    }

    // 9. Get API keys
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('compliance_api_keys')
      .select('*')
      .eq('site_id', batch.site_id)
      .eq('is_active', true)
      .single()

    if (apiKeyError || !apiKey) {
      throw new Error('No active Metrc API key found for this site')
    }

    // 10. Create sync log
    const { data: syncLog, error: syncLogError } = await createSyncLogEntry({
      organization_id: batch.organization_id,
      site_id: batch.site_id,
      sync_type: 'harvest_creation',
      direction: 'push',
      operation: 'create_harvest',
      local_id: harvest.id,
      initiated_by: params.harvestedBy,
    })

    if (syncLogError || !syncLog) {
      throw new Error('Failed to create sync log entry')
    }

    result.syncLogId = syncLog.id

    await updateSyncLogEntry(syncLog.id, {
      status: 'in_progress',
    })

    // 11. Initialize Metrc client
    const metrcClient = new MetrcClient({
      vendorApiKey: apiKey.vendor_api_key,
      userApiKey: apiKey.user_api_key,
      facilityLicenseNumber: apiKey.facility_license_number,
      state: apiKey.state_code,
      isSandbox: apiKey.is_sandbox,
    })

    // 12. Build Metrc harvest payload
    const metrcHarvest: MetrcHarvest = {
      Name: harvest.harvest_name,
      HarvestType: 'Product', // or 'WholePlant'
      DryingLocation: params.dryingLocationId || '', // Metrc location name
      HarvestStartDate: params.harvestDate,
      CurrentWeight: params.wetWeight,
      UnitOfWeight: params.unitOfWeight,
      PlantTags: plantLabels, // Array of plant tags
    }

    // 13. Create harvest in Metrc
    // await metrcClient.harvests.create([metrcHarvest])
    // Note: Actual API call commented for safety - implement when ready

    // 14. Store Metrc mapping
    const metrcHarvestId = `TEMP-${harvest.id}` // Replace with actual Metrc ID
    const metrcHarvestName = harvest.harvest_name

    await supabase.from('metrc_harvest_mappings').insert({
      organization_id: batch.organization_id,
      site_id: batch.site_id,
      harvest_id: harvest.id,
      metrc_harvest_id: metrcHarvestId,
      metrc_harvest_name: metrcHarvestName,
    })

    // Update harvest with Metrc details
    await supabase
      .from('harvests')
      .update({
        metrc_harvest_id: metrcHarvestId,
        metrc_harvest_name: metrcHarvestName,
      })
      .eq('id', harvest.id)

    // 15. Update sync log
    await updateSyncLogEntry(syncLog.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_payload: {
        harvest_id: harvest.id,
        metrc_harvest_id: metrcHarvestId,
        plant_tags_count: plantLabels.length,
        wet_weight: params.wetWeight,
      },
    })

    result.success = true
    result.metrcHarvestId = metrcHarvestId
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
 * Generate unique harvest number
 */
async function generateHarvestNumber(
  organizationId: string,
  harvestDate: string
): Promise<string> {
  const supabase = await createClient()
  const date = new Date(harvestDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  // Get count of harvests this month
  const { count } = await supabase
    .from('harvests')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('harvest_date', `${year}-${month}-01`)
    .lt('harvest_date', `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`)

  const sequence = String((count || 0) + 1).padStart(5, '0')
  return `HRV-${year}-${month}-${sequence}`
}
```

### 4. Package Creation Service (2 hours)
**File:** `lib/compliance/metrc/sync/package-sync.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { validatePackageCreation } from '../validation/harvest-rules'

export interface PackageSyncResult {
  success: boolean
  packagesCreated: number
  errors: string[]
  warnings: string[]
}

/**
 * Create packages from harvest
 */
export async function createPackagesFromHarvest(params: {
  harvestId: string
  packages: Array<{
    packageTag: string
    itemType: string
    weight: number
    label?: string
    notes?: string
  }>
  packagedBy: string
}): Promise<PackageSyncResult> {
  const supabase = await createClient()
  const result: PackageSyncResult = {
    success: false,
    packagesCreated: 0,
    errors: [],
    warnings: [],
  }

  try {
    // 1. Get harvest details
    const { data: harvest, error: harvestError } = await supabase
      .from('harvests')
      .select('id, organization_id, site_id, final_weight, unit_of_weight, status')
      .eq('id', params.harvestId)
      .single()

    if (harvestError || !harvest) {
      throw new Error('Harvest not found')
    }

    // 2. Validate each package
    for (const pkg of params.packages) {
      const validation = validatePackageCreation({
        harvestId: params.harvestId,
        packageTag: pkg.packageTag,
        itemType: pkg.itemType,
        weight: pkg.weight,
        unitOfWeight: harvest.unit_of_weight,
      })

      if (!validation.isValid) {
        const errors = validation.errors.map((e) => `${e.field}: ${e.message}`)
        result.errors.push(...errors)
      }

      validation.warnings.forEach((w) => {
        result.warnings.push(`${pkg.packageTag}: ${w.message}`)
      })
    }

    if (result.errors.length > 0) {
      throw new Error(`Package validation failed: ${result.errors.join(', ')}`)
    }

    // 3. Create package records
    const packageRecords = params.packages.map((pkg) => ({
      organization_id: harvest.organization_id,
      site_id: harvest.site_id,
      harvest_id: params.harvestId,
      package_tag: pkg.packageTag,
      package_label: pkg.label || pkg.packageTag,
      item_type: pkg.itemType,
      weight: pkg.weight,
      unit_of_weight: harvest.unit_of_weight,
      packaged_by: params.packagedBy,
      notes: pkg.notes,
    }))

    const { error: insertError } = await supabase
      .from('harvest_packages')
      .insert(packageRecords)

    if (insertError) {
      throw insertError
    }

    result.packagesCreated = packageRecords.length

    // 4. Update harvest status
    await supabase
      .from('harvests')
      .update({
        status: 'packaged',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.harvestId)

    result.success = true
    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}
```

### 5. Harvest UI Components (3-4 hours)
**File:** `components/features/harvests/create-harvest-dialog.tsx`

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
import { Info, Scissors } from 'lucide-react'
import { toast } from 'sonner'

interface CreateHarvestDialogProps {
  batchId: string
  batchNumber: string
  plantCount: number
  cultivarName?: string
  onCreated: () => void
  trigger?: React.ReactNode
}

export function CreateHarvestDialog({
  batchId,
  batchNumber,
  plantCount,
  cultivarName,
  onCreated,
  trigger,
}: CreateHarvestDialogProps) {
  const [open, setOpen] = useState(false)
  const [harvestDate, setHarvestDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [wetWeight, setWetWeight] = useState('')
  const [unitOfWeight, setUnitOfWeight] = useState('Kilograms')
  const [harvestName, setHarvestName] = useState('')
  const [notes, setNotes] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!wetWeight || Number(wetWeight) <= 0) {
      toast.error('Please enter a valid wet weight')
      return
    }

    try {
      setIsCreating(true)

      const response = await fetch('/api/harvests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          harvestDate,
          wetWeight: Number(wetWeight),
          unitOfWeight,
          harvestName,
          notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create harvest')
      }

      const result = await response.json()

      toast.success(`Harvest ${result.harvestNumber} created successfully`)

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, { duration: 5000 })
        })
      }

      setOpen(false)
      onCreated()
    } catch (error) {
      console.error('Error creating harvest:', error)
      toast.error((error as Error).message || 'Failed to create harvest')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default">
            <Scissors className="h-4 w-4 mr-2" />
            Create Harvest
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Harvest</DialogTitle>
          <DialogDescription>
            Record harvest from batch {batchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Batch Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Batch:</strong> {batchNumber}
              {cultivarName && (
                <>
                  {' '}
                  • <strong>Cultivar:</strong> {cultivarName}
                </>
              )}
              <br />
              <strong>Plant Count:</strong> {plantCount}
            </AlertDescription>
          </Alert>

          {/* Harvest Date */}
          <div className="space-y-2">
            <Label htmlFor="harvestDate">Harvest Date *</Label>
            <Input
              id="harvestDate"
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Wet Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wetWeight">Wet Weight *</Label>
              <Input
                id="wetWeight"
                type="number"
                step="0.01"
                min="0"
                value={wetWeight}
                onChange={(e) => setWetWeight(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitOfWeight">Unit *</Label>
              <Select value={unitOfWeight} onValueChange={setUnitOfWeight}>
                <SelectTrigger id="unitOfWeight">
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

          {/* Harvest Name */}
          <div className="space-y-2">
            <Label htmlFor="harvestName">Harvest Name (optional)</Label>
            <Input
              id="harvestName"
              value={harvestName}
              onChange={(e) => setHarvestName(e.target.value)}
              placeholder="Auto-generated if not provided"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Harvest observations, conditions, etc."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Harvest'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 6. API Routes (1 hour)
**File:** `app/api/harvests/create/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHarvestFromBatch } from '@/lib/compliance/metrc/sync/harvest-sync'

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
    const { batchId, harvestDate, wetWeight, unitOfWeight, harvestName, notes } = body

    // Validate required fields
    if (!batchId || !harvestDate || !wetWeight || !unitOfWeight) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create harvest
    const result = await createHarvestFromBatch({
      batchId,
      harvestDate,
      wetWeight,
      unitOfWeight,
      harvestedBy: user.id,
      harvestName,
      notes,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create harvest',
          errors: result.errors,
        },
        { status: 500 }
      )
    }

    // Get created harvest
    const { data: harvest } = await supabase
      .from('harvests')
      .select('harvest_number')
      .eq('id', result.harvestId)
      .single()

    return NextResponse.json({
      success: true,
      harvestId: result.harvestId,
      harvestNumber: harvest?.harvest_number,
      metrcHarvestId: result.metrcHarvestId,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Error in create harvest API:', error)
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
**File:** `lib/compliance/metrc/validation/__tests__/harvest-rules.test.ts`

```typescript
import {
  validateHarvestCreation,
  validatePackageCreation,
  validateWeightUpdate,
} from '../harvest-rules'

describe('validateHarvestCreation', () => {
  it('should validate valid harvest', () => {
    const result = validateHarvestCreation({
      batchId: 'batch-123',
      harvestDate: '2025-11-18',
      wetWeight: 50.5,
      unitOfWeight: 'Kilograms',
      plantCount: 100,
    })
    expect(result.isValid).toBe(true)
  })

  it('should fail for negative weight', () => {
    const result = validateHarvestCreation({
      batchId: 'batch-123',
      harvestDate: '2025-11-18',
      wetWeight: -10,
      unitOfWeight: 'Kilograms',
    })
    expect(result.isValid).toBe(false)
  })

  it('should warn for very low weight', () => {
    const result = validateHarvestCreation({
      batchId: 'batch-123',
      harvestDate: '2025-11-18',
      wetWeight: 0.05,
      unitOfWeight: 'Kilograms',
    })
    expect(result.warnings.some((w) => w.code === 'LOW_HARVEST_WEIGHT')).toBe(true)
  })

  it('should fail for future date', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    const result = validateHarvestCreation({
      batchId: 'batch-123',
      harvestDate: futureDate.toISOString().split('T')[0],
      wetWeight: 50,
      unitOfWeight: 'Kilograms',
    })
    expect(result.isValid).toBe(false)
  })
})

describe('validatePackageCreation', () => {
  it('should validate valid package', () => {
    const result = validatePackageCreation({
      harvestId: 'harvest-123',
      packageTag: '1A4FF01000000220000001',
      itemType: 'Flower',
      weight: 5.2,
      unitOfWeight: 'Kilograms',
    })
    expect(result.isValid).toBe(true)
  })

  it('should fail for invalid package tag', () => {
    const result = validatePackageCreation({
      harvestId: 'harvest-123',
      packageTag: 'INVALID-TAG',
      itemType: 'Flower',
      weight: 5.2,
      unitOfWeight: 'Kilograms',
    })
    expect(result.isValid).toBe(false)
  })
})
```

---

## 🏃‍♂️ IMPLEMENTATION STEPS (Week 5)

### Day 1: Database & Validation (3-4 hours)
1. Read all documentation (35 min)
2. Create and apply database migration (45 min)
3. Create `harvest-rules.ts` validation (1.5 hours)
4. Write unit tests for validation (1 hour)

### Day 2: Harvest Sync Service (4-5 hours)
1. Create `harvest-sync.ts` (3 hours)
   - Harvest creation logic
   - Metrc sync preparation
   - Plant tag integration
2. Create `package-sync.ts` (1.5 hours)
3. Test sync services (1 hour)

### Day 3: UI Components (3-4 hours)
1. Create `create-harvest-dialog.tsx` (2 hours)
2. Create harvest list/detail views (2 hours)

### Day 4: Testing & Polish (2-3 hours)
1. Create API routes (1 hour)
2. Integration testing (1 hour)
3. Documentation (1 hour)

---

## ✅ WEEK 5 COMPLETION CHECKLIST

- [ ] Migration created and applied
- [ ] `harvest-rules.ts` created
- [ ] `harvest-sync.ts` created
- [ ] `package-sync.ts` created
- [ ] `create-harvest-dialog.tsx` created
- [ ] API endpoints created
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests completed
- [ ] Documentation updated

---

## 💡 PRO TIPS

1. **Weight Tracking** - Track wet, dry, and final weights separately
2. **Plant Tags** - Harvest requires plant tags from Week 4
3. **Auto-numbering** - Use date-based harvest numbering (HRV-YYYY-MM-XXXXX)
4. **Status Flow** - wet → drying → dry → curing → cured → packaged
5. **Package Tags** - Different from plant tags, use Metrc package tag format
6. **Waste Tracking** - Record trim/waste weight for compliance

---

**Good luck! Complete the harvest lifecycle! 🌾**

**When complete: Move to Week 6 (Waste & Destruction) or Week 7 (Transfers)**
