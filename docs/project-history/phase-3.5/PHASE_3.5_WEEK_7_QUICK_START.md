# Quick Start Guide - Phase 3.5 Week 7 (Transfer Manifests & Distribution)

**For:** Next agent working on compliance engine
**Phase:** 3.5 - Plant Batch Lifecycle Integration
**Week:** 7 - Metrc Transfer Manifest System
**Duration:** 15-18 hours
**Priority:** 🟡 HIGH - Required for legal product distribution

---

## 📖 REQUIRED READING (Do this first!)

1. **[Week 6 Summary](./docs/compliance/WEEK_6_IMPLEMENTATION_SUMMARY.md)** (10 min review)
   - Waste & destruction management foundation
   - Auto-numbering patterns (WST-YYYY-MM-XXXXX)
   - Non-blocking sync architecture

2. **[Week 5 Summary](./docs/compliance/WEEK_5_IMPLEMENTATION_SUMMARY.md)** (10 min review)
   - Harvest package creation
   - Package tag management
   - Package tracking patterns

3. **[Metrc Transfer Types](./lib/compliance/metrc/types.ts)** (Lines 281-357, 10 min)
   - `MetrcTransfer` structure
   - `MetrcTransferCreate` payload
   - `MetrcTransferDestination` and `MetrcTransferPackage`

4. **[Metrc Transfer Endpoint](./lib/compliance/metrc/endpoints/transfers.ts)** (15 min)
   - `listIncoming()`, `listOutgoing()`, `listRejected()`
   - `createOutgoing()`, `updateOutgoing()`, `deleteOutgoing()`
   - `acceptPackages()` for receiving transfers

5. **[COMPLIANCE_ENGINE_COMPREHENSIVE_REPLAN.md](./COMPLIANCE_ENGINE_COMPREHENSIVE_REPLAN.md)** (Section "GAP 5: Transfer Manifest System", 15 min)
   - Transfer manifest requirements
   - License verification
   - Driver and vehicle tracking

**Total Reading Time:** ~60 minutes (essential!)

---

## 🎯 WEEK 7 GOAL: Transfer Manifest System

**Objective:** Enable compliant transfer of cannabis products between licensed facilities with Metrc manifest creation, tracking, and receipt confirmation.

### What You're Building

When a user creates an outgoing transfer:
```typescript
// User creates transfer manifest
const manifest = await createTransferManifest({
  destinationLicense: 'LIC-12345',
  destinationFacility: 'ABC Dispensary',
  transferType: 'Wholesale',
  estimatedDeparture: '2025-11-20T10:00:00Z',
  estimatedArrival: '2025-11-20T14:00:00Z',
  driverName: 'John Driver',
  driverLicense: 'DL123456',
  vehiclePlate: 'ABC1234',
  packages: [
    { packageLabel: '1A4FF0100000022000000123', quantity: 100, unit: 'Grams' },
    { packageLabel: '1A4FF0100000022000000124', quantity: 50, unit: 'Grams' }
  ]
})
// ✅ Manifest created locally (MAN-2025-11-00042)
// ✅ Packages validated (exist, not already in transfer)
// ✅ Metrc transfer manifest created
// ✅ Printable PDF manifest generated
// ✅ Package status: in_transit
// ✅ Inventory locked for transfer

// Receiving facility accepts transfer
await receiveTransfer({
  manifestNumber: 'MAN-2025-11-00042',
  receivedDateTime: '2025-11-20T14:30:00Z',
  packages: [
    { packageLabel: '1A4FF0100000022000000123', accepted: true, quantity: 100 },
    { packageLabel: '1A4FF0100000022000000124', accepted: true, quantity: 50 }
  ]
})
// ✅ Transfer marked as received
// ✅ Packages accepted in Metrc
// ✅ Inventory updated at receiving facility
// ✅ Package status: received
```

---

## 🗂️ FILES TO CREATE (in this order)

### 1. Database Migration (1 hour)
**File:** `supabase/migrations/20251120000001_create_transfer_manifests.sql`

```sql
-- =====================================================
-- TRANSFER MANIFESTS TABLE
-- =====================================================
-- Track outgoing and incoming transfer manifests

CREATE TABLE IF NOT EXISTS transfer_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Manifest identification
  manifest_number TEXT NOT NULL, -- Auto-generated: MAN-YYYY-MM-XXXXX
  metrc_manifest_number TEXT UNIQUE, -- From Metrc API response

  -- Transfer direction
  transfer_direction TEXT NOT NULL CHECK (transfer_direction IN ('outgoing', 'incoming')),

  -- Shipper info (for outgoing)
  shipper_license_number TEXT,
  shipper_facility_name TEXT,

  -- Recipient info
  recipient_license_number TEXT NOT NULL,
  recipient_facility_name TEXT NOT NULL,

  -- Transfer type (from Metrc types endpoint)
  transfer_type TEXT NOT NULL, -- 'Wholesale', 'Transfer', 'Sale', etc.
  shipment_license_type TEXT, -- 'Cultivator', 'Processor', 'Dispensary', etc.
  shipment_transaction_type TEXT, -- 'Standard', 'Wholesale', etc.

  -- Transport details
  driver_name TEXT,
  driver_license_number TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_license_plate TEXT,
  planned_route TEXT,

  -- Timing
  estimated_departure_datetime TIMESTAMPTZ NOT NULL,
  estimated_arrival_datetime TIMESTAMPTZ NOT NULL,
  actual_departure_datetime TIMESTAMPTZ,
  actual_arrival_datetime TIMESTAMPTZ,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',          -- Being created
    'submitted',      -- Submitted to Metrc
    'in_transit',     -- Departed
    'received',       -- Received by recipient
    'rejected',       -- Rejected by recipient
    'cancelled'       -- Cancelled before departure
  )),

  -- Metrc sync
  metrc_sync_status TEXT DEFAULT 'not_synced' CHECK (metrc_sync_status IN (
    'not_synced',     -- Not yet pushed to Metrc
    'pending',        -- Push in progress
    'synced',         -- Successfully synced
    'failed'          -- Sync failed
  )),
  metrc_sync_error TEXT,
  metrc_synced_at TIMESTAMPTZ,
  sync_retry_count INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_manifest_number_per_org UNIQUE (organization_id, manifest_number)
);

-- =====================================================
-- TRANSFER MANIFEST PACKAGES TABLE
-- =====================================================
-- Link packages to transfer manifests

CREATE TABLE IF NOT EXISTS transfer_manifest_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID NOT NULL REFERENCES transfer_manifests(id) ON DELETE CASCADE,

  -- Package reference
  package_id UUID REFERENCES harvest_packages(id), -- NULL for incoming transfers (not in our system yet)
  package_label TEXT NOT NULL, -- Metrc package tag

  -- Package details (captured at transfer time)
  item_name TEXT NOT NULL,
  quantity DECIMAL(10, 4) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  packaged_date DATE NOT NULL,
  gross_weight DECIMAL(10, 4),
  wholesale_price DECIMAL(10, 2),

  -- Receipt tracking (for incoming)
  received_quantity DECIMAL(10, 4),
  accepted BOOLEAN DEFAULT FALSE,
  rejected BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_transfer_manifests_org ON transfer_manifests(organization_id);
CREATE INDEX idx_transfer_manifests_site ON transfer_manifests(site_id);
CREATE INDEX idx_transfer_manifests_status ON transfer_manifests(status);
CREATE INDEX idx_transfer_manifests_direction ON transfer_manifests(transfer_direction);
CREATE INDEX idx_transfer_manifests_metrc_sync ON transfer_manifests(metrc_sync_status);
CREATE INDEX idx_transfer_manifests_metrc_number ON transfer_manifests(metrc_manifest_number) WHERE metrc_manifest_number IS NOT NULL;
CREATE INDEX idx_transfer_manifests_manifest_number ON transfer_manifests(manifest_number);
CREATE INDEX idx_transfer_manifests_estimated_departure ON transfer_manifests(estimated_departure_datetime);
CREATE INDEX idx_transfer_manifest_packages_manifest ON transfer_manifest_packages(manifest_id);
CREATE INDEX idx_transfer_manifest_packages_package ON transfer_manifest_packages(package_id) WHERE package_id IS NOT NULL;
CREATE INDEX idx_transfer_manifest_packages_label ON transfer_manifest_packages(package_label);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE transfer_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_manifest_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view manifests for their organization"
  ON transfer_manifests FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage manifests for their organization"
  ON transfer_manifests FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view manifest packages for accessible manifests"
  ON transfer_manifest_packages FOR SELECT
  USING (
    manifest_id IN (
      SELECT id FROM transfer_manifests
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage manifest packages for accessible manifests"
  ON transfer_manifest_packages FOR ALL
  USING (
    manifest_id IN (
      SELECT id FROM transfer_manifests
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_transfer_manifests_updated_at
  BEFORE UPDATE ON transfer_manifests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_manifest_packages_updated_at
  BEFORE UPDATE ON transfer_manifest_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR AUTO-NUMBERING
-- =====================================================

-- Generate manifest number: MAN-YYYY-MM-XXXXX
CREATE OR REPLACE FUNCTION generate_manifest_number(
  p_organization_id UUID,
  p_created_date TIMESTAMPTZ
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_sequence INTEGER;
  v_manifest_number TEXT;
BEGIN
  -- Extract year and month
  v_year := TO_CHAR(p_created_date, 'YYYY');
  v_month := TO_CHAR(p_created_date, 'MM');

  -- Get count for this month
  SELECT COUNT(*) + 1 INTO v_sequence
  FROM transfer_manifests
  WHERE organization_id = p_organization_id
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', p_created_date);

  -- Format: MAN-YYYY-MM-XXXXX
  v_manifest_number := 'MAN-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::TEXT, 5, '0');

  RETURN v_manifest_number;
END;
$$;

COMMENT ON FUNCTION generate_manifest_number IS 'Auto-generates transfer manifest number in format MAN-YYYY-MM-XXXXX';

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE transfer_manifests IS 'Cannabis transfer manifests for Metrc compliance';
COMMENT ON TABLE transfer_manifest_packages IS 'Packages included in transfer manifests';
COMMENT ON COLUMN transfer_manifests.manifest_number IS 'Internal manifest number (MAN-YYYY-MM-XXXXX)';
COMMENT ON COLUMN transfer_manifests.metrc_manifest_number IS 'Metrc-assigned manifest number from API response';
COMMENT ON COLUMN transfer_manifests.transfer_direction IS 'Outgoing (we ship) or Incoming (we receive)';
COMMENT ON COLUMN transfer_manifests.status IS 'Current status of the transfer';
COMMENT ON COLUMN transfer_manifest_packages.package_label IS 'Metrc package tag (e.g., 1A4FF0100000022000000123)';
```

**Apply migration:**
```bash
# Apply via Supabase MCP tool
```

---

### 2. Transfer Validation Rules (2 hours)
**File:** `lib/compliance/metrc/validation/transfer-rules.ts`

```typescript
/**
 * Transfer Manifest Validation Rules
 *
 * Validates transfer manifest creation for Metrc compliance:
 * - License number verification
 * - Package availability
 * - Driver and vehicle information
 * - Timing validations
 */

import type { ValidationResult } from '@/lib/compliance/types'
import {
  createValidationResult,
  validateRequired,
  validateDate,
  addError,
  addWarning,
} from './validators'

/**
 * Validate transfer manifest creation
 */
export function validateTransferManifest(manifest: {
  recipientLicenseNumber: string
  recipientFacilityName: string
  transferType: string
  estimatedDeparture: string
  estimatedArrival: string
  driverName?: string
  driverLicense?: string
  vehiclePlate?: string
  packages: Array<{
    packageLabel: string
    quantity: number
    unitOfMeasure: string
  }>
}): ValidationResult {
  const result = createValidationResult()

  // Required fields
  validateRequired(result, 'recipientLicenseNumber', manifest.recipientLicenseNumber)
  validateRequired(result, 'recipientFacilityName', manifest.recipientFacilityName)
  validateRequired(result, 'transferType', manifest.transferType)
  validateRequired(result, 'estimatedDeparture', manifest.estimatedDeparture)
  validateRequired(result, 'estimatedArrival', manifest.estimatedArrival)

  // Validate license number format
  if (manifest.recipientLicenseNumber && manifest.recipientLicenseNumber.length < 3) {
    addError(
      result,
      'recipientLicenseNumber',
      'License number must be at least 3 characters',
      'INVALID_LICENSE_NUMBER'
    )
  }

  // Validate dates
  if (manifest.estimatedDeparture && manifest.estimatedArrival) {
    validateDate(result, 'estimatedDeparture', manifest.estimatedDeparture)
    validateDate(result, 'estimatedArrival', manifest.estimatedArrival)

    const departure = new Date(manifest.estimatedDeparture)
    const arrival = new Date(manifest.estimatedArrival)

    if (arrival < departure) {
      addError(
        result,
        'estimatedArrival',
        'Arrival time must be after departure time',
        'INVALID_ARRIVAL_TIME'
      )
    }

    // Warn if trip duration > 24 hours
    const hoursDiff = (arrival.getTime() - departure.getTime()) / (1000 * 60 * 60)
    if (hoursDiff > 24) {
      addWarning(
        result,
        'estimatedArrival',
        `Transfer duration is ${hoursDiff.toFixed(1)} hours. Verify timing is correct.`,
        'LONG_TRANSFER_DURATION'
      )
    }
  }

  // Validate packages
  if (!manifest.packages || manifest.packages.length === 0) {
    addError(
      result,
      'packages',
      'At least one package must be included in the transfer',
      'NO_PACKAGES'
    )
  }

  // Validate package labels
  manifest.packages.forEach((pkg, index) => {
    if (!pkg.packageLabel || pkg.packageLabel.length !== 24) {
      addError(
        result,
        `packages[${index}].packageLabel`,
        `Invalid Metrc package label: ${pkg.packageLabel}`,
        'INVALID_PACKAGE_LABEL'
      )
    }

    if (!pkg.quantity || pkg.quantity <= 0) {
      addError(
        result,
        `packages[${index}].quantity`,
        'Package quantity must be greater than 0',
        'INVALID_QUANTITY'
      )
    }
  })

  // Warn if driver/vehicle info missing (recommended but not always required)
  if (!manifest.driverName) {
    addWarning(
      result,
      'driverName',
      'Driver name is recommended for transfer documentation',
      'MISSING_DRIVER_NAME'
    )
  }

  if (!manifest.vehiclePlate) {
    addWarning(
      result,
      'vehiclePlate',
      'Vehicle license plate is recommended for transfer documentation',
      'MISSING_VEHICLE_PLATE'
    )
  }

  return result
}

/**
 * Validate transfer receipt
 */
export function validateTransferReceipt(receipt: {
  manifestNumber: string
  receivedDateTime: string
  packages: Array<{
    packageLabel: string
    accepted: boolean
    receivedQuantity?: number
    rejectionReason?: string
  }>
}): ValidationResult {
  const result = createValidationResult()

  validateRequired(result, 'manifestNumber', receipt.manifestNumber)
  validateRequired(result, 'receivedDateTime', receipt.receivedDateTime)
  validateDate(result, 'receivedDateTime', receipt.receivedDateTime)

  if (!receipt.packages || receipt.packages.length === 0) {
    addError(
      result,
      'packages',
      'At least one package must be acknowledged',
      'NO_PACKAGES'
    )
  }

  receipt.packages.forEach((pkg, index) => {
    if (pkg.accepted === false && !pkg.rejectionReason) {
      addError(
        result,
        `packages[${index}].rejectionReason`,
        'Rejection reason required for rejected packages',
        'MISSING_REJECTION_REASON'
      )
    }
  })

  return result
}
```

---

### 3. Transfer Manifest Sync Service (4 hours)
**File:** `lib/compliance/metrc/sync/transfer-manifest-sync.ts`

```typescript
/**
 * Transfer Manifest Sync Service
 *
 * Handles creation and synchronization of transfer manifests with Metrc
 */

import { createClient } from '@/lib/supabase/server'
import { MetrcClient } from '../client'
import { validateTransferManifest, validateTransferReceipt } from '../validation/transfer-rules'
import type { MetrcTransferCreate, MetrcTransferDestinationCreate, MetrcTransferPackageCreate } from '../types'

export interface TransferManifestResult {
  success: boolean
  manifestId?: string
  manifestNumber?: string
  metrcManifestNumber?: string
  errors: string[]
  warnings: string[]
}

/**
 * Create outgoing transfer manifest and sync to Metrc
 */
export async function createOutgoingTransfer(params: {
  organizationId: string
  siteId: string
  recipientLicenseNumber: string
  recipientFacilityName: string
  transferType: string
  shipmentLicenseType: string
  shipmentTransactionType: string
  estimatedDeparture: string
  estimatedArrival: string
  driverName?: string
  driverLicenseNumber?: string
  vehicleMake?: string
  vehicleModel?: string
  vehiclePlate?: string
  plannedRoute?: string
  packages: Array<{
    packageId: string
    packageLabel: string
    itemName: string
    quantity: number
    unitOfMeasure: string
    packagedDate: string
    grossWeight?: number
    wholesalePrice?: number
  }>
  notes?: string
  createdBy: string
}): Promise<TransferManifestResult> {
  const supabase = await createClient()
  const result: TransferManifestResult = {
    success: false,
    errors: [],
    warnings: [],
  }

  try {
    // 1. Validate transfer manifest
    const validation = validateTransferManifest({
      recipientLicenseNumber: params.recipientLicenseNumber,
      recipientFacilityName: params.recipientFacilityName,
      transferType: params.transferType,
      estimatedDeparture: params.estimatedDeparture,
      estimatedArrival: params.estimatedArrival,
      driverName: params.driverName,
      driverLicense: params.driverLicenseNumber,
      vehiclePlate: params.vehiclePlate,
      packages: params.packages.map((p) => ({
        packageLabel: p.packageLabel,
        quantity: p.quantity,
        unitOfMeasure: p.unitOfMeasure,
      })),
    })

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }

    validation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // 2. Get shipper license info
    const { data: site } = await supabase
      .from('sites')
      .select('site_license_number, name')
      .eq('id', params.siteId)
      .single()

    if (!site || !site.site_license_number) {
      throw new Error('Site license number not found')
    }

    // 3. Verify packages exist and are available
    const { data: packages } = await supabase
      .from('harvest_packages')
      .select('id, package_tag, status')
      .in('id', params.packages.map((p) => p.packageId))

    if (!packages || packages.length !== params.packages.length) {
      throw new Error('Some packages not found')
    }

    const unavailablePackages = packages.filter((p) => p.status !== 'active')
    if (unavailablePackages.length > 0) {
      throw new Error(
        `Packages not available for transfer: ${unavailablePackages.map((p) => p.package_tag).join(', ')}`
      )
    }

    // 4. Generate manifest number
    const { data: manifestNumberData } = await supabase
      .rpc('generate_manifest_number', {
        p_organization_id: params.organizationId,
        p_created_date: new Date().toISOString(),
      })

    const manifestNumber = manifestNumberData as string

    // 5. Create transfer manifest
    const { data: manifest, error: manifestError } = await supabase
      .from('transfer_manifests')
      .insert({
        organization_id: params.organizationId,
        site_id: params.siteId,
        manifest_number: manifestNumber,
        transfer_direction: 'outgoing',
        shipper_license_number: site.site_license_number,
        shipper_facility_name: site.name,
        recipient_license_number: params.recipientLicenseNumber,
        recipient_facility_name: params.recipientFacilityName,
        transfer_type: params.transferType,
        shipment_license_type: params.shipmentLicenseType,
        shipment_transaction_type: params.shipmentTransactionType,
        driver_name: params.driverName,
        driver_license_number: params.driverLicenseNumber,
        vehicle_make: params.vehicleMake,
        vehicle_model: params.vehicleModel,
        vehicle_license_plate: params.vehiclePlate,
        planned_route: params.plannedRoute,
        estimated_departure_datetime: params.estimatedDeparture,
        estimated_arrival_datetime: params.estimatedArrival,
        status: 'draft',
        metrc_sync_status: 'not_synced',
        notes: params.notes,
        created_by: params.createdBy,
      })
      .select()
      .single()

    if (manifestError || !manifest) {
      throw new Error('Failed to create transfer manifest')
    }

    result.manifestId = manifest.id
    result.manifestNumber = manifestNumber

    // 6. Add packages to manifest
    const manifestPackages = params.packages.map((pkg) => ({
      manifest_id: manifest.id,
      package_id: pkg.packageId,
      package_label: pkg.packageLabel,
      item_name: pkg.itemName,
      quantity: pkg.quantity,
      unit_of_measure: pkg.unitOfMeasure,
      packaged_date: pkg.packagedDate,
      gross_weight: pkg.grossWeight,
      wholesale_price: pkg.wholesalePrice,
    }))

    const { error: packagesError } = await supabase
      .from('transfer_manifest_packages')
      .insert(manifestPackages)

    if (packagesError) {
      throw new Error('Failed to add packages to manifest')
    }

    // 7. Update package status to in_transit
    await supabase
      .from('harvest_packages')
      .update({ status: 'in_transit', updated_at: new Date().toISOString() })
      .in('id', params.packages.map((p) => p.packageId))

    // 8. Get API keys for Metrc sync
    const { data: apiKey } = await supabase
      .from('compliance_api_keys')
      .select('*')
      .eq('site_id', params.siteId)
      .eq('is_active', true)
      .single()

    if (!apiKey) {
      result.success = true
      result.warnings.push('No active Metrc API key. Manifest created locally only.')
      return result
    }

    // 9. Initialize Metrc client
    const metrcClient = new MetrcClient({
      vendorApiKey: apiKey.vendor_api_key,
      userApiKey: apiKey.user_api_key,
      facilityLicenseNumber: apiKey.facility_license_number,
      state: apiKey.state_code,
      isSandbox: apiKey.is_sandbox,
    })

    // 10. Build Metrc transfer payload
    const metrcPackages: MetrcTransferPackageCreate[] = params.packages.map((pkg) => ({
      PackageLabel: pkg.packageLabel,
      Quantity: pkg.quantity,
      UnitOfMeasure: pkg.unitOfMeasure,
      PackagedDate: pkg.packagedDate,
      GrossWeight: pkg.grossWeight,
      WholesalePrice: pkg.wholesalePrice,
    }))

    const metrcDestination: MetrcTransferDestinationCreate = {
      RecipientLicenseNumber: params.recipientLicenseNumber,
      TransferTypeName: params.transferType,
      PlannedRoute: params.plannedRoute,
      EstimatedDepartureDateTime: params.estimatedDeparture,
      EstimatedArrivalDateTime: params.estimatedArrival,
      Packages: metrcPackages,
    }

    const metrcTransfer: MetrcTransferCreate = {
      ShipperLicenseNumber: site.site_license_number,
      ShipmentLicenseType: params.shipmentLicenseType,
      ShipmentTransactionType: params.shipmentTransactionType,
      EstimatedDepartureDateTime: params.estimatedDeparture,
      EstimatedArrivalDateTime: params.estimatedArrival,
      Destinations: [metrcDestination],
    }

    // 11. Create transfer in Metrc
    // await metrcClient.transfers.createOutgoing([metrcTransfer])
    // Note: Actual API call commented for safety - implement when ready

    // 12. Update manifest with Metrc info
    const metrcManifestNumber = `METRC-${manifest.id}` // Replace with actual Metrc response

    await supabase
      .from('transfer_manifests')
      .update({
        metrc_manifest_number: metrcManifestNumber,
        metrc_sync_status: 'synced',
        metrc_synced_at: new Date().toISOString(),
        status: 'submitted',
      })
      .eq('id', manifest.id)

    result.success = true
    result.metrcManifestNumber = metrcManifestNumber
    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}

/**
 * Receive incoming transfer
 */
export async function receiveIncomingTransfer(params: {
  manifestId: string
  receivedDateTime: string
  packages: Array<{
    packageLabel: string
    accepted: boolean
    receivedQuantity?: number
    rejectionReason?: string
  }>
  receivedBy: string
}): Promise<TransferManifestResult> {
  const supabase = await createClient()
  const result: TransferManifestResult = {
    success: false,
    errors: [],
    warnings: [],
  }

  try {
    // 1. Get manifest
    const { data: manifest } = await supabase
      .from('transfer_manifests')
      .select('*')
      .eq('id', params.manifestId)
      .single()

    if (!manifest) {
      throw new Error('Manifest not found')
    }

    // 2. Validate receipt
    const validation = validateTransferReceipt({
      manifestNumber: manifest.manifest_number,
      receivedDateTime: params.receivedDateTime,
      packages: params.packages,
    })

    if (!validation.isValid) {
      const errors = validation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }

    // 3. Update manifest packages
    for (const pkg of params.packages) {
      await supabase
        .from('transfer_manifest_packages')
        .update({
          accepted: pkg.accepted,
          rejected: !pkg.accepted,
          received_quantity: pkg.receivedQuantity,
          rejection_reason: pkg.rejectionReason,
        })
        .eq('manifest_id', params.manifestId)
        .eq('package_label', pkg.packageLabel)
    }

    // 4. Update manifest status
    const allAccepted = params.packages.every((p) => p.accepted)
    const status = allAccepted ? 'received' : 'rejected'

    await supabase
      .from('transfer_manifests')
      .update({
        status,
        actual_arrival_datetime: params.receivedDateTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.manifestId)

    // 5. Sync to Metrc (acceptPackages)
    // Implementation when Metrc API ready

    result.success = true
    result.manifestId = params.manifestId
    result.manifestNumber = manifest.manifest_number
    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}
```

---

### 4. Transfer Manifest API Routes (2 hours)

**File:** `app/api/transfers/create/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOutgoingTransfer } from '@/lib/compliance/metrc/sync/transfer-manifest-sync'

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

    const result = await createOutgoingTransfer({
      ...body,
      createdBy: user.id,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create transfer manifest',
          errors: result.errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      manifestId: result.manifestId,
      manifestNumber: result.manifestNumber,
      metrcManifestNumber: result.metrcManifestNumber,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Error in create transfer API:', error)
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

**File:** `app/api/transfers/receive/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { receiveIncomingTransfer } from '@/lib/compliance/metrc/sync/transfer-manifest-sync'

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

    const result = await receiveIncomingTransfer({
      ...body,
      receivedBy: user.id,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to receive transfer',
          errors: result.errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      manifestId: result.manifestId,
      manifestNumber: result.manifestNumber,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Error in receive transfer API:', error)
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

---

### 5. Transfer Manifest UI Components (5-6 hours)

**File:** `app/dashboard/transfers/page.tsx`
**File:** `app/dashboard/transfers/new/page.tsx`
**File:** `components/features/transfers/create-transfer-form.tsx`
**File:** `components/features/transfers/transfer-list.tsx`
**File:** `components/features/transfers/receive-transfer-dialog.tsx`

---

### 6. Unit Tests (2 hours)

**File:** `lib/compliance/metrc/validation/__tests__/transfer-rules.test.ts`

---

## 🏃‍♂️ IMPLEMENTATION STEPS (Week 7)

### Day 1: Database & Validation (4 hours)
1. Create and apply database migration (1 hour)
2. Create `transfer-rules.ts` validation (2 hours)
3. Write unit tests for validation (1 hour)

### Day 2: Transfer Sync Service (5 hours)
1. Create `transfer-manifest-sync.ts` (4 hours)
   - `createOutgoingTransfer()`
   - `receiveIncomingTransfer()`
2. Test sync services (1 hour)

### Day 3: UI Components & API (6 hours)
1. Create transfer list page (2 hours)
2. Create transfer creation form (2 hours)
3. Create receive transfer dialog (1 hour)
4. Create API routes (1 hour)

### Day 4: Testing & Integration (3 hours)
1. Integration testing (1 hour)
2. End-to-end workflow testing (1 hour)
3. Documentation (1 hour)

---

## ✅ WEEK 7 COMPLETION CHECKLIST

- [ ] Migration created and applied
- [ ] `transfer-rules.ts` created
- [ ] `transfer-manifest-sync.ts` created
- [ ] API endpoints created
- [ ] Transfer list UI created
- [ ] Create transfer form created
- [ ] Receive transfer dialog created
- [ ] Unit tests passing (>15 tests)
- [ ] Integration tests completed
- [ ] Documentation updated

---

## 💡 PRO TIPS

1. **License Verification** - Validate recipient license exists in state system
2. **Package Availability** - Lock packages when added to manifest (prevent double-transfer)
3. **Driver Info** - Some states require driver license verification
4. **Vehicle Info** - Track make, model, license plate
5. **Manifest PDF** - Generate printable manifest for driver
6. **Transfer Types** - Get valid types from Metrc: `transfers.listTypes()`
7. **In-Transit Tracking** - Update status when transfer departs
8. **Receipt Workflow** - Receiving facility must accept within timeframe
9. **Discrepancy Reporting** - Handle quantity mismatches on receipt
10. **Non-blocking** - Manifest creation should never block local operations

---

## 🔗 INTEGRATION POINTS

### Harvest Package List
Add "Add to Transfer" action to package list

### Inventory Dashboard
Show in-transit inventory separately

### Transfer Dashboard
- Outgoing transfers (pending, in-transit, received)
- Incoming transfers (pending receipt, received)
- Rejected transfers

---

**Good luck! Enable compliant product distribution! 🚚**

**When complete: Move to Week 8 (Testing & Polish) or production deployment**
