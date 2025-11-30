# Metrc API Alignment Guide

**Created:** November 17, 2025  
**Purpose:** Map TRAZO data model to Metrc API requirements

---

## Authentication

Metrc uses a 2-tier API key authentication system:

### Vendor API Key (Software Integrator)
- Obtained through Metrc vendor registration process
- Shared across all facilities using your software
- Header: `x-api-key: {vendor_key}`

### User API Key (Facility-Specific)
- Unique per facility/license number
- Obtained by facility operators through Metrc
- Header: `x-user-api-key: {user_key}`

## Sandbox Environment (Recommended)

Metrc provides a sandbox environment for development and testing:

### Benefits
- **Safe Testing:** No risk to live compliance data
- **Faster Development:** Test without regulatory consequences
- **Staff Training:** Safe environment for learning workflows
- **Visual Indicators:** Clear distinctions from production system

### Sandbox Setup

**Endpoint:** `POST /sandbox/v2/integrator/setup?userKey={optional}`

**Parameters:**
- `userKey` (optional): Existing user key to reuse, or omit for new key

**Response Codes:**
- `201`: User queued for creation
- `202`: User creation in process
- `200`: User key sent to email
- `204`: User key not found

**Sandbox Base URLs:**
```typescript
const SANDBOX_URLS = {
  OR: 'https://sandbox-api-or.metrc.com',
  MD: 'https://sandbox-api-md.metrc.com',
  CA: 'https://sandbox-api-ca.metrc.com'
}
```

### Environment Configuration

```bash
# .env.local (Development)
NEXT_PUBLIC_METRC_USE_SANDBOX=true

# .env.production
NEXT_PUBLIC_METRC_USE_SANDBOX=false
```

### State-Specific Base URLs

```typescript
const METRC_BASE_URLS: Record<string, string> = {
  'OR': 'https://api-or.metrc.com',      // Oregon
  'MD': 'https://api-md.metrc.com',      // Maryland
  'CA': 'https://api-ca.metrc.com',      // California
  'CO': 'https://api-co.metrc.com',      // Colorado
  'MI': 'https://api-mi.metrc.com',      // Michigan
  'NV': 'https://api-nv.metrc.com',      // Nevada
  // Add more as needed
}
```

---

## Data Model Mapping

### 1. Packages (Metrc) ↔ Inventory Lots (TRAZO)

**Metrc Package Structure:**
```json
{
  "Id": 12345,
  "Label": "1A4FF0100000022000000123",
  "PackageType": "Product",
  "ItemId": 67890,
  "Item": "Blue Dream - Flower",
  "Quantity": 100.5,
  "UnitOfMeasure": "Grams",
  "FacilityLicenseNumber": "123-ABC",
  "FacilityName": "My Cultivation Site",
  "SourceHarvestNames": "2024-H-001",
  "PackagedDate": "2024-10-15",
  "IsInTransit": false,
  "IsOnHold": false,
  "ArchivedDate": null,
  "FinishedDate": null
}
```

**TRAZO Inventory Lot Mapping:**
```typescript
interface MetrcPackageMapping {
  // TRAZO fields
  inventory_lot_id: string              // → internal ID
  item_id: string                       // → maps to Item
  item_name: string                     // → Item name
  quantity: number                      // → Quantity
  unit: string                          // → UnitOfMeasure
  lot_number: string                    // → internal lot tracking
  
  // Metrc fields (new)
  metrc_package_id: number              // → Id
  metrc_package_label: string           // → Label (tag number)
  metrc_package_type: string            // → PackageType
  metrc_item_id: number                 // → ItemId
  metrc_source_harvest: string          // → SourceHarvestNames
  metrc_packaged_date: string           // → PackagedDate
  metrc_is_in_transit: boolean          // → IsInTransit
  metrc_is_on_hold: boolean             // → IsOnHold
  
  // Sync status
  last_synced_at: timestamp
  sync_status: 'synced' | 'pending' | 'conflict' | 'error'
}
```

**Key Operations:**
- **Create Package:** When creating inventory lot in cannabis jurisdiction
- **Update Package:** On quantity adjustments, location changes
- **Finish Package:** When lot is fully consumed/sold
- **Archive Package:** When lot is destroyed/wasted

---

### 2. Plants (Metrc) ↔ Batch Plants (TRAZO)

**Metrc Plant Structure:**
```json
{
  "Id": 54321,
  "Label": "1A4FF0100000022000000456",
  "PlantBatchId": 98765,
  "PlantBatchName": "2024-B-042",
  "StrainName": "OG Kush",
  "GrowthPhase": "Vegetative",
  "PlantedDate": "2024-09-01",
  "FacilityLicenseNumber": "123-ABC",
  "FacilityName": "My Cultivation Site",
  "RoomName": "Veg Room 1",
  "DestroyedDate": null
}
```

**TRAZO Batch Plant Mapping:**
```typescript
interface MetrcPlantMapping {
  // TRAZO fields
  batch_id: string                      // → internal batch ID
  batch_name: string                    // → PlantBatchName
  strain: string                        // → StrainName
  stage: string                         // → maps to GrowthPhase
  plant_count: number                   // → derived from plant tags
  planted_date: string                  // → PlantedDate
  room_id: string                       // → maps to RoomName
  
  // Metrc fields (new)
  metrc_batch_id: number                // → PlantBatchId
  metrc_plant_labels: string[]          // → array of Label values
  metrc_growth_phase: string            // → GrowthPhase
  
  // Sync status
  last_synced_at: timestamp
  sync_status: 'synced' | 'pending' | 'conflict' | 'error'
}
```

**Growth Phase Mapping:**
```typescript
const GROWTH_PHASE_MAPPING = {
  // TRAZO → Metrc
  'clone': 'Clone',
  'vegetative': 'Vegetative',
  'flowering': 'Flowering',
  'harvest': 'Harvested',  // Plants destroyed after harvest
  'destroyed': 'Destroyed'
}
```

**Key Operations:**
- **Create Plantings:** When batch enters vegetative stage (requires tags)
- **Change Growth Phase:** When stage transitions occur
- **Move Plants:** When moving between rooms
- **Harvest Plants:** When plants are harvested
- **Destroy Plants:** For waste/males/unhealthy plants

---

### 3. Plant Batches (Metrc) ↔ Batches (TRAZO)

**Metrc Plant Batch Structure:**
```json
{
  "Id": 98765,
  "Name": "2024-B-042",
  "Type": "Seed",
  "Count": 100,
  "StrainName": "Blue Dream",
  "PlantedDate": "2024-09-01",
  "FacilityLicenseNumber": "123-ABC",
  "FacilityName": "My Cultivation Site",
  "RoomName": "Clone Room",
  "DestroyedDate": null,
  "UntrackedCount": 0,
  "TrackedCount": 100
}
```

**TRAZO Batch Mapping:**
```typescript
interface MetrcBatchMapping {
  // TRAZO fields
  batch_id: string                      // → internal ID
  batch_name: string                    // → Name
  strain: string                        // → StrainName
  plant_count: number                   // → Count
  current_stage: string                 // → derived from operations
  planted_date: string                  // → PlantedDate
  
  // Metrc fields (new)
  metrc_batch_id: number                // → Id
  metrc_batch_type: string              // → Type (Seed, Clone, etc.)
  metrc_tracked_count: number           // → TrackedCount
  metrc_untracked_count: number         // → UntrackedCount
  
  // Sync status
  last_synced_at: timestamp
  sync_status: 'synced' | 'pending' | 'conflict' | 'error'
}
```

**Batch Type Mapping:**
```typescript
const BATCH_TYPE_MAPPING = {
  // TRAZO → Metrc
  'seed': 'Seed',
  'clone': 'Clone',
  'tissue_culture': 'Clone',  // Use Clone type
}
```

**Key Operations:**
- **Create Plant Batch:** When starting new batch from seeds/clones
- **Split Batch:** When dividing batch into smaller groups
- **Adjust Count:** When plants die or are removed
- **Create Packages:** When creating packages from immature plants
- **Destroy Batch:** For complete batch waste

---

### 4. Harvests (Metrc) ↔ Harvest Records (TRAZO)

**Metrc Harvest Structure:**
```json
{
  "Id": 11111,
  "Name": "2024-H-042",
  "HarvestType": "Product",
  "DryingRoomName": "Dry Room 1",
  "SourceStrainNames": "Blue Dream",
  "PlantCount": 50,
  "HarvestedDate": "2024-10-01",
  "WetWeight": 25000.0,
  "UnitOfWeight": "Grams",
  "FacilityLicenseNumber": "123-ABC",
  "FinishedDate": null,
  "ArchivedDate": null
}
```

**TRAZO Harvest Mapping:**
```typescript
interface MetrcHarvestMapping {
  // TRAZO fields
  batch_id: string                      // → source batch
  harvest_name: string                  // → Name
  harvest_date: string                  // → HarvestedDate
  plant_count: number                   // → PlantCount
  wet_weight: number                    // → WetWeight
  dry_weight: number                    // → calculated after drying
  
  // Metrc fields (new)
  metrc_harvest_id: number              // → Id
  metrc_harvest_type: string            // → HarvestType
  metrc_drying_room: string             // → DryingRoomName
  metrc_unit_of_weight: string          // → UnitOfWeight
  
  // Sync status
  last_synced_at: timestamp
  sync_status: 'synced' | 'pending' | 'conflict' | 'error'
}
```

**Key Operations:**
- **Harvest Plants:** Record harvest from plants
- **Move Harvest:** Move to different drying location
- **Remove Waste:** Record trim/waste from harvest
- **Create Packages:** Create finished packages from harvest
- **Finish Harvest:** Mark harvest as complete

---

### 5. Transfers (Metrc) ↔ Inventory Movements (TRAZO)

**Metrc Transfer Structure:**
```json
{
  "ManifestNumber": "0000000123",
  "ShipperLicenseNumber": "123-ABC",
  "ShipperFacilityName": "My Cultivation",
  "RecipientLicenseNumber": "456-DEF",
  "RecipientFacilityName": "Dispensary XYZ",
  "CreatedDate": "2024-10-15T10:00:00",
  "EstimatedDepartureDateTime": "2024-10-15T14:00:00",
  "EstimatedArrivalDateTime": "2024-10-15T16:00:00",
  "Destinations": [
    {
      "RecipientLicenseNumber": "456-DEF",
      "TransferTypeName": "Transfer",
      "PlannedRoute": "I-5 South",
      "Packages": [
        {
          "PackageLabel": "1A4FF0100000022000000123",
          "Quantity": 100.0,
          "UnitOfMeasure": "Grams",
          "PackagedDate": "2024-10-14",
          "GrossWeight": 105.0
        }
      ]
    }
  ]
}
```

**TRAZO Transfer Mapping:**
```typescript
interface MetrcTransferMapping {
  // TRAZO fields
  movement_id: string                   // → internal ID
  from_site_id: string                  // → ShipperLicenseNumber
  to_site_id: string                    // → RecipientLicenseNumber
  transfer_date: string                 // → CreatedDate
  estimated_departure: string           // → EstimatedDepartureDateTime
  estimated_arrival: string             // → EstimatedArrivalDateTime
  
  // Metrc fields (new)
  metrc_manifest_number: string         // → ManifestNumber
  metrc_transfer_type: string           // → TransferTypeName
  metrc_planned_route: string           // → PlannedRoute
  metrc_packages: MetrcPackageTransfer[] // → Packages array
  
  // Sync status
  last_synced_at: timestamp
  sync_status: 'synced' | 'pending' | 'conflict' | 'error'
}
```

**Key Operations:**
- **Create Outgoing Transfer:** Generate manifest for outgoing transfer
- **Update Transfer:** Update departure/arrival times
- **Receive Transfer:** Accept incoming transfer
- **Reject Transfer:** Reject packages in transfer

---

### 6. Sales (Metrc) ↔ Sales Records (TRAZO)

**Metrc Sales Receipt Structure:**
```json
{
  "Id": 77777,
  "ReceiptNumber": "SALE-2024-1234",
  "SalesDateTime": "2024-10-15T15:30:00",
  "TotalPrice": 150.00,
  "Transactions": [
    {
      "PackageLabel": "1A4FF0100000022000000123",
      "Quantity": 3.5,
      "UnitOfMeasure": "Grams",
      "TotalPrice": 50.00
    }
  ]
}
```

**TRAZO Sales Mapping:**
```typescript
interface MetrcSalesMapping {
  // TRAZO fields
  sale_id: string                       // → internal ID
  receipt_number: string                // → ReceiptNumber
  sale_date: string                     // → SalesDateTime
  total_amount: number                  // → TotalPrice
  
  // Metrc fields (new)
  metrc_receipt_id: number              // → Id
  metrc_transactions: MetrcTransaction[] // → Transactions array
  
  // Sync status
  last_synced_at: timestamp
  sync_status: 'synced' | 'pending' | 'conflict' | 'error'
}
```

**Key Operations:**
- **Record Sale:** Create sales receipt in Metrc
- **Void Sale:** Void previously recorded sale

---

## Jurisdiction-Specific Requirements

### Oregon (OLCC)
- **Tagging:** 24-inch rule - plants must be tagged when reaching 24" height OR entering flowering
- **Reporting:** Monthly compliance reports due 15 days after month end
- **Testing:** Required before packaging for sale
- **Waste:** Requires witness, photo evidence, rendering unusable
- **Retention:** 7-year record retention requirement

### Maryland (MCA)
- **Tagging:** Individual plant tags required in vegetative stage
- **Reporting:** Real-time sync encouraged, monthly reports required
- **Testing:** Comprehensive testing for potency, pesticides, heavy metals, microbials
- **Waste:** Requires witness, specific disposal methods approved by Commission
- **Retention:** 2-year record retention (shorter than Oregon)

### California (BCC/CalCannabis)
- **Tagging:** Real-time Metrc integration required
- **Reporting:** 24-hour sync window for all inventory movements
- **Testing:** Required before retail sale
- **Waste:** Strict rendering requirements
- **Track-and-Trace:** Must use CCTT-Metrc system for all operations

---

## Required Data Transformations

### 1. Unit of Measure Standardization

```typescript
const UOM_MAPPING = {
  // TRAZO → Metrc
  'g': 'Grams',
  'kg': 'Kilograms',
  'oz': 'Ounces',
  'lb': 'Pounds',
  'ea': 'Each',
  'ml': 'Milliliters',
  'l': 'Liters',
}
```

### 2. Date/Time Formatting

```typescript
// Metrc expects ISO 8601 format
const formatForMetrc = (date: Date): string => {
  return date.toISOString() // "2024-10-15T14:30:00.000Z"
}
```

### 3. License Number Validation

```typescript
const validateLicenseNumber = (license: string, state: string): boolean => {
  const patterns: Record<string, RegExp> = {
    'OR': /^\d{3}-[A-Z]{3}$/, // Example: 123-ABC
    'MD': /^[A-Z]{2}\d{5}$/,  // Example: MD12345
    'CA': /^[A-Z0-9\-]+$/,    // Variable format
  }
  return patterns[state]?.test(license) ?? false
}
```

### 4. Tag Number Formatting

```typescript
// Metrc tags follow specific format per state
const formatTagNumber = (prefix: string, sequence: number): string => {
  // Example: 1A4FF0100000022000000123
  // 1A4FF: State prefix
  // 010000002: Facility code
  // 2000000123: Sequence number
  return `${prefix}${sequence.toString().padStart(10, '0')}`
}
```

---

## API Error Handling

### Common Metrc Error Codes

```typescript
enum MetrcErrorCode {
  INVALID_API_KEY = 401,
  INSUFFICIENT_PERMISSIONS = 403,
  RESOURCE_NOT_FOUND = 404,
  VALIDATION_ERROR = 422,
  RATE_LIMIT_EXCEEDED = 429,
  SERVER_ERROR = 500,
}

const handleMetrcError = (error: MetrcApiError): string => {
  switch (error.code) {
    case MetrcErrorCode.INVALID_API_KEY:
      return 'Invalid API credentials. Please check your Metrc API keys.'
    case MetrcErrorCode.VALIDATION_ERROR:
      return `Validation failed: ${error.details}`
    case MetrcErrorCode.RATE_LIMIT_EXCEEDED:
      return 'Rate limit exceeded. Please wait before retrying.'
    default:
      return 'An error occurred communicating with Metrc.'
  }
}
```

### Retry Strategy

```typescript
const retryConfig = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000, // 1 second
  
  // Retry on these status codes
  retryableErrors: [408, 429, 500, 502, 503, 504],
}

async function retryableRequest<T>(
  operation: () => Promise<T>,
  attempt = 1
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (
      attempt < retryConfig.maxRetries &&
      isRetryableError(error)
    ) {
      const delay = retryConfig.initialDelay * 
        Math.pow(retryConfig.backoffMultiplier, attempt - 1)
      await sleep(delay)
      return retryableRequest(operation, attempt + 1)
    }
    throw error
  }
}
```

---

## Sync Strategy

### Pull Sync (Metrc → TRAZO)

**Frequency:** Hourly (configurable per site)

**Process:**
1. Fetch updated packages since last sync
2. Fetch updated plants since last sync
3. Fetch updated harvests since last sync
4. Detect changes (new, updated, deleted)
5. Update TRAZO records
6. Log sync operation
7. Flag conflicts for review

**Conflict Resolution:**
- Metrc is source of truth for synced entities
- TRAZO changes to synced entities are rejected
- Manual override requires approval
- All conflicts logged for audit

### Push Sync (TRAZO → Metrc)

**Triggers:**
- Inventory lot creation (cannabis jurisdictions)
- Batch stage transition
- Harvest recording
- Waste disposal
- Inventory adjustment
- Transfer creation

**Process:**
1. Validate data against Metrc rules
2. Transform TRAZO format → Metrc format
3. POST/PUT to Metrc API
4. Receive Metrc ID
5. Update TRAZO record with Metrc reference
6. Log sync operation
7. Handle errors with retry logic

**Validation Rules:**
- All required fields present
- Valid license numbers
- Correct unit of measure
- Date formats correct
- Quantities within limits
- Tags available and unused

---

## Testing Strategy

### Sandbox Environment

Metrc provides sandbox environments for testing:
- **Sandbox URL Pattern:** `https://sandbox-api-{state}.metrc.com`
- **Test Credentials:** Provided by Metrc support
- **Data Isolation:** Sandbox data doesn't affect production
- **Reset:** Sandbox can be reset periodically

### Test Scenarios

1. **Authentication:**
   - Valid credentials → success
   - Invalid vendor key → 401
   - Invalid user key → 401
   - Expired credentials → 401

2. **Package Operations:**
   - Create package with valid data → success
   - Create package with missing required field → 422
   - Update package quantity → success
   - Delete active package → error (must finish first)
   - Finish package → success

3. **Plant Operations:**
   - Create plantings with valid tags → success
   - Create plantings with invalid tags → 422
   - Change growth phase → success
   - Move plants to different room → success
   - Harvest plants → success

4. **Sync Operations:**
   - Full sync on first run → success
   - Incremental sync → only changes fetched
   - Handle deleted items → mark as archived locally
   - Conflict detection → flagged for review

5. **Error Handling:**
   - Network timeout → retry
   - Rate limit → backoff and retry
   - Validation error → log and alert
   - Server error → retry

---

## Compliance Checklist

### Pre-Integration
- [ ] Obtain Metrc vendor API key
- [ ] Obtain facility license numbers for all sites
- [ ] Obtain user API keys for each facility
- [ ] Verify license numbers in Metrc system
- [ ] Set up sandbox environment
- [ ] Test credentials in sandbox

### Development
- [ ] Implement Metrc API client
- [ ] Build authentication layer
- [ ] Create data transformation layer
- [ ] Implement sync services
- [ ] Build validation rules
- [ ] Add error handling
- [ ] Write comprehensive tests
- [ ] Document all endpoints

### Testing
- [ ] Test all CRUD operations in sandbox
- [ ] Test sync operations (pull & push)
- [ ] Test error handling
- [ ] Test conflict resolution
- [ ] Performance testing (1000+ records)
- [ ] Security testing (key encryption, audit logs)
- [ ] User acceptance testing

### Go-Live
- [ ] Migrate credentials to production
- [ ] Configure production Metrc URLs
- [ ] Set up monitoring and alerting
- [ ] Train users on new workflows
- [ ] Run parallel operations for 2 weeks
- [ ] Daily reconciliation
- [ ] Full cutover after successful parallel run

---

**End of Metrc API Alignment Guide**
