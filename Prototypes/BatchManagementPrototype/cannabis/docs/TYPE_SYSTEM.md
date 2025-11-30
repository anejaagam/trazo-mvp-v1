# Cannabis Batch Management System - Type System Reference

## Table of Contents
1. [Core Types](#core-types)
2. [Batch Types](#batch-types)
3. [Cultivar Types](#cultivar-types)
4. [Harvest Types](#harvest-types)
5. [Waste Types](#waste-types)
6. [Tagging Types](#tagging-types)
7. [Plant Tracking Types](#plant-tracking-types)
8. [Post-Harvest Types](#post-harvest-types)
9. [Type Relationships](#type-relationships)

---

## Core Types

### BatchStage
**File:** `/types/batch.ts`  
**Type:** Union type

Represents the lifecycle stage of a cannabis batch.

```typescript
export type BatchStage = 
  | 'propagation'   // Seeds germinating or clones rooting (1-2 weeks)
  | 'vegetative'    // Immature plants building structure (3-8 weeks)
  | 'flowering'     // Plants producing cannabis flower (8-10 weeks)
  | 'harvest'       // Plants cut and wet trimmed (1 day)
  | 'drying'        // Flower drying in controlled environment (7-14 days)
  | 'curing'        // Final quality improvement (2-8+ weeks)
  | 'closed';       // Batch archived, product packaged for sale
```

**Stage Progression:**
```
propagation → vegetative → flowering → harvest → drying → curing → closed
```

---

### EventType
**File:** `/types/batch.ts`  
**Type:** Union type

Categories for timeline events logged during batch lifecycle.

```typescript
export type EventType = 
  | 'stage_change'  // Batch moved to new stage
  | 'alarm'         // Environmental or system alert
  | 'override'      // Manual intervention by staff
  | 'note'          // General documentation
  | 'qa_check';     // Quality assurance inspection
```

**Event Type Colors (UI):**
- `stage_change` - Blue
- `alarm` - Red
- `override` - Orange
- `note` - Gray
- `qa_check` - Green

---

### RoomType
**File:** `/types/batch.ts`  
**Type:** Union type

Physical room types in a cannabis cultivation facility.

```typescript
export type RoomType = 
  | 'mother'       // Houses mother plants for cloning
  | 'clone'        // Propagation area for rooting clones
  | 'vegetative'   // Vegetative growth (18+ hours light)
  | 'flowering'    // Flowering stage (12/12 light cycle)
  | 'drying'       // Post-harvest drying (60°F/60% RH)
  | 'curing'       // Final curing and quality control
  | 'processing';  // Trim, packaging, and product prep
```

**Capacity Rules:**
- Mother/Clone/Veg: Track as immature lots (up to 100 plants per lot)
- Flowering: MUST track individual plants with Metrc tags
- Drying/Curing: Track by weight (grams) instead of plant count

---

## Batch Types

### Batch
**File:** `/types/batch.ts`  
**Type:** Interface

Core entity representing a group of cannabis plants tracked together.

```typescript
export interface Batch {
  id: string;                    // Unique identifier (e.g., "batch-1699564234")
  name: string;                  // Display name (e.g., "Blue Dream - Week 42")
  cultivar: string;              // Strain name (e.g., "Blue Dream")
  cultivarId?: string;           // Reference to Cultivar entity
  stage: BatchStage;             // Current lifecycle stage
  startDate: string;             // ISO 8601 date (e.g., "2024-10-15")
  groupId?: string;              // Optional BatchGroup assignment
  podIds: string[];              // Array of Pod IDs where batch is located
  plantCount: number;            // Current number of plants in batch
  createdAt: string;             // ISO 8601 timestamp
  harvestDate?: string;          // Date batch was harvested (ISO 8601)
  closedDate?: string;           // Date batch was closed/archived (ISO 8601)
  
  // Quarantine Management
  quarantineStatus?: 'none' | 'quarantined' | 'released';
  quarantineReason?: string;     // Reason for quarantine
  quarantinedAt?: string;        // ISO 8601 timestamp
  quarantinedBy?: string;        // User who authorized quarantine
  
  // Yield Data
  yieldData?: {
    wetWeight?: number;          // Grams at harvest
    dryWeight?: number;          // Grams after drying (20-30% of wet)
    waste?: number;              // Grams disposed during processing
    totalTHC?: number;           // Percentage (e.g., 22.5)
    totalCBD?: number;           // Percentage (e.g., 0.3)
  };
  
  // Metrc Integration
  metrcPackageTag?: string;      // Metrc package ID after packaging
  metrcSourcePackageTags?: string[];  // Parent package tags
}
```

**Example:**
```typescript
{
  id: "batch-001",
  name: "Blue Dream - Fall 2024",
  cultivar: "Blue Dream",
  cultivarId: "cult-bd-001",
  stage: "flowering",
  startDate: "2024-09-15",
  podIds: ["pod-flower-2"],
  plantCount: 48,
  createdAt: "2024-09-15T08:00:00Z",
  quarantineStatus: "none",
  yieldData: undefined,
  metrcPackageTag: undefined
}
```

---

### Pod
**File:** `/types/batch.ts`  
**Type:** Interface

Physical growing area/room within cultivation facility.

```typescript
export interface Pod {
  id: string;                    // Unique identifier
  name: string;                  // Display name (e.g., "Flower Room 2")
  roomType: RoomType;            // Type of room
  location: string;              // Physical location (e.g., "Building A, 2nd Floor")
  capacity: number;              // Maximum plant count (license limit)
  currentPlantCount?: number;    // Current occupancy (calculated)
  canopyArea?: number;           // Square footage available
  usedCanopyArea?: number;       // Square footage in use (calculated)
  lightingWatts?: number;        // Total lighting power (e.g., 12000)
  lightingType?: string;         // Type of lighting (e.g., "LED", "HPS")
}
```

**Capacity Calculation:**
```typescript
// Calculated in RoomCapacityMonitor component
currentPlantCount = batches
  .filter(b => b.podIds.includes(pod.id))
  .reduce((sum, b) => sum + b.plantCount, 0);

utilizationPercentage = (currentPlantCount / capacity) * 100;
```

---

### BatchGroup
**File:** `/types/batch.ts`  
**Type:** Interface

Logical grouping of multiple batches for organization.

```typescript
export interface BatchGroup {
  id: string;                    // Unique identifier
  name: string;                  // Display name (e.g., "Fall 2024 Grow Cycle")
  description: string;           // Purpose/details
  batchIds: string[];            // Array of Batch IDs in this group
  createdAt: string;             // ISO 8601 timestamp
}
```

**Use Cases:**
- Group all batches in a specific grow cycle
- Track batches from same seed lot
- Organize by customer/contract
- Coordinate harvests for workflow efficiency

---

### TimelineEvent
**File:** `/types/batch.ts`  
**Type:** Interface

Logged event in batch lifecycle for audit trail.

```typescript
export interface TimelineEvent {
  id: string;                    // Unique identifier
  batchId: string;               // Reference to Batch
  type: EventType;               // Event category
  timestamp: string;             // ISO 8601 timestamp
  description: string;           // Human-readable description
  data?: Record<string, any>;    // Additional structured data
  userId?: string;               // User who triggered event
  evidenceUrls?: string[];       // Photo/document URLs
}
```

**Example:**
```typescript
{
  id: "event-001",
  batchId: "batch-001",
  type: "stage_change",
  timestamp: "2024-11-08T14:30:00Z",
  description: "Batch transitioned from vegetative to flowering stage",
  data: {
    oldStage: "vegetative",
    newStage: "flowering",
    plantsTagged: 48
  },
  userId: "user-john",
  evidenceUrls: []
}
```

---

### BatchMetrics
**File:** `/types/batch.ts`  
**Type:** Interface

Environmental monitoring data for batch performance.

```typescript
export interface BatchMetrics {
  temperature: {
    min: number;                 // Minimum °F
    avg: number;                 // Average °F
    max: number;                 // Maximum °F
  };
  humidity: {
    min: number;                 // Minimum %
    avg: number;                 // Average %
    max: number;                 // Maximum %
  };
  vpd: {                         // Vapor Pressure Deficit
    min: number;                 // Minimum kPa
    avg: number;                 // Average kPa
    max: number;                 // Maximum kPa
  };
}
```

**Ideal Ranges by Stage:**
- **Vegetative:** 75-80°F, 50-70% RH, VPD 0.8-1.2 kPa
- **Flowering:** 68-75°F, 40-50% RH, VPD 1.0-1.5 kPa
- **Drying:** 60°F, 60% RH (constant)

---

## Cultivar Types

### StrainType
**File:** `/types/cultivar.ts`  
**Type:** Union type

Cannabis strain classification by genetic dominance.

```typescript
export type StrainType = 
  | 'indica'           // Pure Indica genetics (relaxing, sedative)
  | 'sativa'           // Pure Sativa genetics (energizing, cerebral)
  | 'hybrid'           // Balanced Indica/Sativa mix
  | 'indica-dominant'  // Mostly Indica (60-80%)
  | 'sativa-dominant'; // Mostly Sativa (60-80%)
```

**Effects by Type:**
- **Indica:** Body high, relaxation, pain relief, sleep aid
- **Sativa:** Mental high, creativity, energy, focus
- **Hybrid:** Balanced effects from both parents

---

### Cultivar
**File:** `/types/cultivar.ts`  
**Type:** Interface

Cannabis strain with genetic and growth characteristics.

```typescript
export interface Cultivar {
  id: string;                    // Unique identifier
  name: string;                  // Strain name (e.g., "Blue Dream")
  type: 'seed' | 'clone';        // Propagation method
  strainType: StrainType;        // Genetic classification
  genetics: string;              // Parent strains (e.g., "Blueberry x Haze")
  description?: string;          // Detailed description
  
  // Cannabinoid Profile
  thcRange?: {
    min: number;                 // Minimum THC % (e.g., 18)
    max: number;                 // Maximum THC % (e.g., 24)
  };
  cbdRange?: {
    min: number;                 // Minimum CBD % (e.g., 0.1)
    max: number;                 // Maximum CBD % (e.g., 0.5)
  };
  
  // Terpene Profile
  terpeneProfile?: string[];     // Dominant terpenes (e.g., ["Myrcene", "Caryophyllene"])
  
  // Growth Characteristics
  floweringTime?: number;        // Days to harvest (e.g., 63)
  expectedYield?: number;        // Grams per plant (e.g., 50)
  growthCharacteristics?: string; // Notes (e.g., "Moderate stretch, bushy")
  
  createdAt: string;             // ISO 8601 timestamp
  isActive: boolean;             // Active or archived
}
```

**Common Terpenes:**
- **Myrcene** - Earthy, musky (most common)
- **Limonene** - Citrus, lemon
- **Caryophyllene** - Spicy, peppery
- **Pinene** - Pine, herbal
- **Linalool** - Floral, lavender
- **Humulene** - Hoppy, woody

---

### BatchGenealogy
**File:** `/types/cultivar.ts`  
**Type:** Interface

Tracks parent/child relationships between batches.

```typescript
export interface BatchGenealogy {
  batchId: string;               // Child batch ID
  source: 'seed' | 'clone' | 'mother_plant'; // Origin type
  parentBatchId?: string;        // Parent batch (if cloned)
  seedVendor?: string;           // Seed supplier (if from seed)
  seedLotNumber?: string;        // Seed lot identifier
  motherPlantId?: string;        // Specific plant used for cloning
  generationNumber?: number;     // F1, F2, F3, etc.
  notes?: string;                // Additional details
}
```

**Use Cases:**
- Track genetic stability across generations
- Identify superior mother plants for cloning
- Maintain seed lot traceability
- Document breeding projects

---

## Harvest Types

### Plant
**File:** `/types/harvest.ts`  
**Type:** Interface

Individual cannabis plant with Metrc tag (flowering stage only).

```typescript
export interface Plant {
  id: string;                    // Unique identifier
  batchId: string;               // Reference to Batch
  metrcTagId: string;            // Metrc RFID tag number
  podId: string;                 // Current location
  plantedDate: string;           // ISO 8601 date
  status: 'vegetative' | 'flowering' | 'harvested' | 'destroyed';
  healthStatus?: 'healthy' | 'stressed' | 'diseased';
  notes?: string;
}
```

**Metrc Compliance:**
- Each flowering plant MUST have unique RFID tag
- Tag number reported to Metrc before flowering
- Tag must remain with plant through harvest
- Tag returned to Metrc after harvest/destruction

---

### HarvestRecord
**File:** `/types/harvest.ts`  
**Type:** Interface

Documents harvest operation for Metrc reporting (SOP-002).

```typescript
export interface HarvestRecord {
  id: string;                    // Unique identifier
  batchId: string;               // Reference to Batch
  plantIds: string[];            // Array of Plant IDs harvested
  harvestDate: string;           // ISO 8601 date
  wetWeight: number;             // Total grams at harvest
  harvestedBy: string;           // User who performed harvest
  dryingRoomId?: string;         // Destination Pod ID
  notes?: string;
  metrcReported: boolean;        // Synced to Metrc flag
  metrcReportedAt?: string;      // ISO 8601 timestamp
}
```

**Harvest Workflow:**
1. Select plants ready for harvest
2. Cut and wet trim plants
3. Weigh fresh flower material (grams)
4. Record in system
5. Report to Metrc API
6. Move to drying room
7. Update plant status to "harvested"

---

## Waste Types

### WasteReason
**File:** `/types/waste.ts`  
**Type:** Union type

Cannabis-specific reasons for waste disposal.

```typescript
export type WasteReason =
  // Disease & Contamination
  | 'powdery_mildew'             // PM infection
  | 'bud_rot'                    // Botrytis
  | 'root_rot'                   // Root disease
  
  // Plant Issues
  | 'hermaphrodite'              // Male flowers on female plant
  | 'nutrient_burn'              // Over-fertilization damage
  | 'light_stress'               // Light burn or photoperiod issues
  
  // Pest Infestation
  | 'spider_mites'
  | 'aphids'
  | 'thrips'
  | 'fungus_gnats'
  
  // Failed Testing
  | 'failed_pesticide_test'
  | 'failed_microbial_test'      // Mold, bacteria, yeast
  | 'failed_heavy_metals_test'   // Lead, arsenic, cadmium, mercury
  
  // Processing Waste
  | 'trim_waste'                 // Stems, fan leaves, sugar leaves
  | 'other';
```

---

### WasteLog
**File:** `/types/waste.ts`  
**Type:** Interface

Documents cannabis waste disposal for compliance (SOP-003).

```typescript
export interface WasteLog {
  id: string;                    // Unique identifier
  batchId?: string;              // Optional reference to Batch
  wasteType: 'plant_material' | 'trim' | 'other';
  weight: number;                // Grams
  reason: WasteReason;           // Why disposed
  disposalMethod: string;        // How disposed (e.g., "Mixed with soil")
  createdBy: string;             // Technician who created log
  createdAt: string;             // ISO 8601 timestamp
  
  // Approval Workflow
  status: 'pending_approval' | 'reported_to_metrc' | 'rejected';
  reviewedBy?: string;           // Compliance manager
  reviewedAt?: string;           // ISO 8601 timestamp
  reviewNotes?: string;          // Approval/rejection reason
  
  // Metrc Integration
  metrcReportedAt?: string;      // ISO 8601 timestamp
  
  notes?: string;
  evidenceUrls?: string[];       // Photos of waste disposal
}
```

**Waste Disposal Requirements:**
1. Weigh cannabis waste accurately
2. Document reason for disposal
3. Submit for compliance manager approval
4. Mix with non-cannabis waste (50%+ ratio required)
5. Photograph disposal process
6. Report to Metrc
7. Dispose per local regulations

---

## Tagging Types

### TaggingSession
**File:** `/types/tagging.ts`  
**Type:** Interface

Records RFID tagging session before flowering transition (SOP-001).

```typescript
export interface TaggingSession {
  id: string;                    // Unique identifier
  batchId: string;               // Reference to Batch
  plantsToTag: number;           // Total plants requiring tags
  plantsTagged: number;          // Successfully tagged plants
  tagsUsed: string[];            // Array of Metrc tag numbers used
  startedAt: string;             // ISO 8601 timestamp
  completedAt?: string;          // ISO 8601 timestamp (if complete)
  taggedBy: string;              // User performing tagging
  metrcSynced: boolean;          // Reported to Metrc flag
  notes?: string;
}
```

**Tagging Process:**
1. Count plants ready for flowering (plantsToTag)
2. Verify sufficient tags available
3. Physically attach RFID tags to plants
4. Scan each tag into system (tagsUsed array)
5. Increment plantsTagged counter
6. When complete, sync to Metrc
7. Transition batch to flowering stage

---

### TagInventory
**File:** `/types/tagging.ts`  
**Type:** Interface

Tracks available Metrc RFID tags.

```typescript
export interface TagInventory {
  id: string;                    // Unique identifier
  tagNumber: string;             // Metrc tag number (e.g., "1A4060300000001")
  status: 'available' | 'assigned' | 'used' | 'damaged';
  assignedToBatchId?: string;    // If assigned
  assignedToPlantId?: string;    // If used
  assignedAt?: string;           // ISO 8601 timestamp
  notes?: string;
}
```

**Tag Lifecycle:**
1. `available` - In inventory, ready to use
2. `assigned` - Reserved for specific batch
3. `used` - Attached to flowering plant
4. `damaged` - Broken/unusable, must return to Metrc

---

## Plant Tracking Types

### PlantCountSnapshot
**File:** `/types/plant-tracking.ts`  
**Type:** Interface

Daily plant count record for regulatory compliance.

```typescript
export interface PlantCountSnapshot {
  id: string;                    // Unique identifier
  batchId: string;               // Reference to Batch
  timestamp: string;             // ISO 8601 timestamp
  
  // Count Categories
  immatureLotCount?: number;     // Untagged plants (clones, veg)
  individualTaggedCount?: number; // Tagged flowering plants
  motherPlantCount?: number;     // Mother plants for cloning
  
  recordedBy: string;            // User who recorded count
  notes?: string;
  discrepancyReason?: string;    // If count doesn't match expected
}
```

**Regulatory Importance:**
- Most states require daily or weekly plant counts
- Physical count must match Metrc inventory
- Discrepancies trigger investigations
- Failure to maintain accurate counts risks license suspension

**Tracking Rules:**
- **Immature Lots:** Up to 100 plants tracked as group (clones, seedlings, veg)
- **Individual Tagged:** Each flowering plant counted separately
- **Mother Plants:** Tracked individually, never enter flowering

---

## Post-Harvest Types

### DryingRecord
**File:** `/types/post-harvest.ts`  
**Type:** Interface

Tracks drying process post-harvest (7-14 days typical).

```typescript
export interface DryingRecord {
  id: string;                    // Unique identifier
  batchId: string;               // Reference to Batch
  dryingRoomId: string;          // Pod ID for drying room
  startDate: string;             // ISO 8601 date
  endDate?: string;              // ISO 8601 date (when complete)
  
  // Weight Tracking
  wetWeight: number;             // Grams from harvest
  dryWeight?: number;            // Grams after drying (20-30% of wet)
  
  // Environmental Monitoring
  targetTemperature: number;     // °F (60 ideal)
  targetHumidity: number;        // % (60 ideal)
  finalTemperature?: number;     // °F at completion
  finalHumidity?: number;        // % at completion
  
  notes?: string;
}
```

**Ideal Drying Conditions:**
- Temperature: 60°F (constant)
- Humidity: 60% RH (constant)
- Duration: 7-14 days
- Airflow: Gentle, not direct
- Darkness: No light exposure

**Completion Criteria:**
- Stems snap instead of bend
- 70-80% weight loss from wet to dry
- Exterior feels dry to touch
- Interior still slightly moist (for curing)

---

### CuringRecord
**File:** `/types/post-harvest.ts`  
**Type:** Interface

Tracks curing process for quality improvement (2-8+ weeks).

```typescript
export interface CuringRecord {
  id: string;                    // Unique identifier
  batchId: string;               // Reference to Batch
  startDate: string;             // ISO 8601 date
  endDate?: string;              // ISO 8601 date (when complete)
  
  // Weight Tracking
  initialWeight: number;         // Grams from drying
  finalWeight?: number;          // Grams after curing (minimal loss)
  
  // Container Details
  jarType?: string;              // Glass jar, turkey bag, etc.
  targetDuration: number;        // Days (14-56 typical)
  
  // Quality Notes
  qualityNotes?: string;         // Aroma, appearance, moisture level
  notes?: string;
}
```

**Curing Process:**
1. Place dried flower in airtight containers
2. Store in cool, dark location (60-65°F)
3. "Burp" containers daily for first week (open to exchange air)
4. Burp every few days for weeks 2-4
5. Monitor for mold development
6. Cure minimum 2 weeks, optimal 4-8 weeks

**Benefits of Curing:**
- Improves flavor and aroma (terpene preservation)
- Smooths harshness (chlorophyll breakdown)
- Increases potency perception
- Extends shelf life

---

### PackagingRecord
**File:** `/types/post-harvest.ts`  
**Type:** Interface

Final packaging for retail sale or transfer.

```typescript
export interface PackagingRecord {
  id: string;                    // Unique identifier
  batchId: string;               // Reference to Batch
  packageDate: string;           // ISO 8601 date
  
  // Product Details
  finalWeight: number;           // Grams in package
  packageType: string;           // Jar, mylar bag, container type
  lotNumber: string;             // Internal lot identifier
  
  // Metrc Integration
  metrcPackageTag: string;       // Metrc package ID (required)
  metrcReported: boolean;        // Synced to Metrc flag
  metrcReportedAt?: string;      // ISO 8601 timestamp
  
  packager: string;              // User who packaged
  notes?: string;
}
```

**Packaging Requirements:**
- Unique Metrc package tag (barcode/RFID)
- Child-resistant packaging (required by law)
- Compliant labeling with warnings
- Lab testing results (THC/CBD percentages)
- Batch/lot number for traceability
- Package weight recorded in Metrc

---

## Type Relationships

### Entity Relationship Diagram

```
Cultivar (Strain Library)
    ↓ 1:N
  Batch (Group of Plants)
    ↓ 1:N
TimelineEvent (Audit Log)
    
Batch
    ↓ M:N
  Pod (Physical Location)
    
Batch
    ↓ 1:1 (optional)
BatchGenealogy (Parent Batch)
    
Batch
    ↓ 1:N
  Plant (Individual Flowering Plant)
    ↓ 1:1
HarvestRecord (Harvest Operation)
    
Batch
    ↓ 1:N
PlantCountSnapshot (Daily Counts)
    
Batch
    ↓ 1:N (optional)
  WasteLog (Waste Disposal)
    
Batch
    ↓ 1:1 (optional)
TaggingSession (RFID Tagging)
    
Batch
    ↓ 1:N (sequential)
DryingRecord → CuringRecord → PackagingRecord
```

### Reference Fields

**Foreign Keys:**
- `Batch.cultivarId` → `Cultivar.id`
- `Batch.groupId` → `BatchGroup.id`
- `Batch.podIds[]` → `Pod.id[]`
- `TimelineEvent.batchId` → `Batch.id`
- `Plant.batchId` → `Batch.id`
- `HarvestRecord.batchId` → `Batch.id`
- `WasteLog.batchId` → `Batch.id`
- `BatchGenealogy.batchId` → `Batch.id`
- `BatchGenealogy.parentBatchId` → `Batch.id`

**Cascade Deletes (Future Implementation):**
- Delete Batch → Delete all TimelineEvents
- Delete Batch → Delete all PlantCountSnapshots
- Delete Batch → Nullify WasteLog.batchId (keep logs for audit)
- Delete BatchGroup → Nullify Batch.groupId (keep batches)

---

## TypeScript Utility Types

### Omit Pattern
Used extensively in callback props to exclude auto-generated fields:

```typescript
// Create new harvest record (id, date, and metrc flags auto-generated)
onCompleteHarvest: (
  record: Omit<HarvestRecord, 'id' | 'harvestDate' | 'metrcReported' | 'metrcReportedAt'>
) => void;

// Create new waste log (id, timestamp, and status auto-generated)
onSubmitWasteLog: (
  log: Omit<WasteLog, 'id' | 'createdAt' | 'status'>
) => void;
```

### Partial Pattern
Used for update operations where not all fields are required:

```typescript
// Update some fields of a cultivar
onUpdateCultivar: (id: string, data: Partial<Cultivar>) => void;

// Can pass only changed fields:
onUpdateCultivar('cult-001', { isActive: false }); // Archive cultivar
```

---

## Type Safety Benefits

### Compile-Time Validation
TypeScript catches errors before runtime:

```typescript
// ✅ Correct
const batch: Batch = {
  id: "batch-001",
  stage: "flowering",  // Valid BatchStage
  // ...all required fields
};

// ❌ Compile error: Type '"harvesting"' is not assignable to type 'BatchStage'
const badBatch: Batch = {
  stage: "harvesting",  // Typo: should be "harvest"
};
```

### IntelliSense Support
IDE autocomplete for all types:
- Field name suggestions
- Field type hints
- Documentation tooltips
- Refactoring support

### Refactoring Safety
Changing a type updates everywhere:
1. Add new field to `Batch` interface
2. TypeScript shows all locations that need updating
3. Update components one by one
4. No runtime surprises

---

For architecture overview, see **PLATFORM_OVERVIEW.md**.  
For component documentation, see **COMPONENTS_GUIDE.md**.  
For data flow patterns, see **DATA_FLOW.md**.
