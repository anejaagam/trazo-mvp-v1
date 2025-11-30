# Type System Reference

## Table of Contents
1. [Core Types](#core-types)
2. [Batch Types](#batch-types)
3. [Harvest Types](#harvest-types)
4. [Waste Types](#waste-types)
5. [Cultivar Types](#cultivar-types)
6. [Plant Tracking Types](#plant-tracking-types)
7. [Post-Harvest Types](#post-harvest-types)
8. [Tagging Types](#tagging-types)
9. [Compliance Types](#compliance-types)
10. [Utility Types](#utility-types)

## Core Types

### Base Interfaces

```typescript
// Common fields across entities
interface BaseEntity {
  id: string;
  createdAt: string;  // ISO 8601 timestamp
}

interface Timestamped {
  createdAt: string;
  updatedAt?: string;
}

interface Auditable {
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
}
```

---

## Batch Types

**Location:** `/types/batch.ts`

### BatchStage

```typescript
type BatchStage = 
  | 'propagation'      // Seed/cutting stage
  | 'vegetative'       // Growth stage
  | 'flowering'        // Reproductive stage
  | 'harvest'          // Collection stage
  | 'post_harvest';    // Processing stage
```

### QuarantineStatus

```typescript
type QuarantineStatus = 
  | 'none'             // Not quarantined
  | 'quarantined'      // Currently under quarantine
  | 'released';        // Previously quarantined, now released
```

### Batch

```typescript
interface Batch {
  id: string;
  name: string;                      // Display name (e.g., "Tomato-001")
  variety: string;                   // Variety/cultivar name
  varietyId?: string;                // Reference to ProduceVariety.id
  stage: BatchStage;                 // Current lifecycle stage
  startDate: string;                 // ISO 8601 date
  growingAreaIds: string[];          // Assigned room/location IDs
  plantCount: number;                // Current plant count
  createdAt: string;                 // ISO 8601 timestamp
  groupId?: string;                  // Optional batch group assignment
  
  // Quarantine
  quarantineStatus: QuarantineStatus;
  quarantineReason?: string;
  quarantinedAt?: string;
  quarantinedBy?: string;
  
  // Yield tracking
  yieldData?: {
    wetWeight?: number;              // kg
    dryWeight?: number;              // kg
    packagedWeight?: number;         // kg
    wasteWeight?: number;            // kg
  };
  
  // Stage history
  stageHistory?: Array<{
    stage: BatchStage;
    startedAt: string;
    endedAt?: string;
  }>;
}
```

### BatchGroup

```typescript
interface BatchGroup {
  id: string;
  name: string;                      // Group name
  description: string;               // Purpose/notes
  batchIds: string[];                // Member batch IDs
  createdAt: string;
  createdBy?: string;
}
```

### GrowingArea

```typescript
interface GrowingArea {
  id: string;
  name: string;                      // Room/area name
  type: 'greenhouse' | 'indoor' | 'field' | 'nursery';
  capacity: number;                  // Max plant count
  currentOccupancy: number;          // Current plant count
  location?: string;                 // Physical location
  
  // Environmental settings
  environment?: {
    temperature?: number;            // Celsius
    humidity?: number;               // Percentage
    lightSchedule?: string;          // e.g., "18/6"
    co2Level?: number;               // ppm
  };
}
```

### TimelineEvent

```typescript
interface TimelineEvent {
  id: string;
  batchId: string;
  type: 'created' | 'stage_transition' | 'harvest' | 'plant_count' | 
        'location_change' | 'quarantine' | 'release' | 'note' | 'evidence';
  title: string;
  description: string;
  timestamp: string;
  performedBy: string;
  
  // Type-specific data
  data?: {
    fromStage?: BatchStage;
    toStage?: BatchStage;
    fromLocation?: string;
    toLocation?: string;
    plantCount?: number;
    weight?: number;
    reason?: string;
  };
}
```

---

## Harvest Types

**Location:** `/types/harvest.ts`

### PlantStatus

```typescript
type PlantStatus = 
  | 'healthy'          // Growing normally
  | 'flowering'        // In flower stage
  | 'ready_harvest'    // Ready for harvest
  | 'damaged'          // Damaged but alive
  | 'dead'             // Dead/removed
  | 'quarantined';     // Under quarantine
```

### Plant

```typescript
interface Plant {
  id: string;
  batchId: string;                   // Parent batch
  plantNumber: string;               // Individual plant identifier
  status: PlantStatus;
  locationId: string;                // Current growing area
  
  // Physical attributes
  height?: number;                   // cm
  health?: number;                   // 0-100 score
  
  // Tracking
  tagId?: string;                    // Label/RFID tag ID
  transplantedFrom?: string;         // Previous batch/location
  
  // Dates
  germinationDate?: string;
  transplantDate?: string;
  floweringDate?: string;
  harvestDate?: string;
  
  notes?: string;
}
```

### HarvestRecord

```typescript
interface HarvestRecord {
  id: string;
  batchId: string;
  plantIds: string[];                // Plants harvested
  harvestDate: string;
  harvestedBy: string;
  
  // Weight data
  wetWeight: number;                 // kg
  estimatedDryWeight?: number;       // kg (calculated)
  
  // Quality
  qualityGrade?: 'A' | 'B' | 'C';
  notes?: string;
  
  // Traceability
  traceabilityReported: boolean;
  traceabilityReportedAt?: string;
  traceabilityId?: string;           // External system ID
}
```

### DryingRoom

```typescript
interface DryingRoom {
  id: string;
  name: string;
  capacity: number;                  // kg capacity
  currentLoad: number;               // kg currently drying
  
  // Environmental controls
  temperature: number;               // Celsius
  humidity: number;                  // Percentage
  airflow: 'low' | 'medium' | 'high';
  
  status: 'available' | 'in_use' | 'maintenance';
}
```

---

## Waste Types

**Location:** `/types/waste.ts`

### WasteReason

```typescript
type WasteReason = 
  | 'crop_failure'
  | 'pest_infestation'
  | 'disease'
  | 'quality_control'
  | 'end_of_cycle'
  | 'contamination'
  | 'damaged'
  | 'other';
```

### WasteMethod

```typescript
type WasteMethod = 
  | 'compost'
  | 'landfill'
  | 'incineration'
  | 'recycling'
  | 'render_unusable'   // Mix with non-organic material
  | 'other';
```

### WasteType

```typescript
type WasteType = 
  | 'plant_material'
  | 'soil'
  | 'packaging'
  | 'equipment'
  | 'other';
```

### WasteLog

```typescript
interface WasteLog {
  id: string;
  
  // Source
  sourceType: 'batch' | 'facility' | 'general';
  sourceBatchId?: string;            // If from specific batch
  sourceLocation?: string;
  
  // Waste details
  wasteType: WasteType;
  wasteReason: WasteReason;
  quantity: number;                  // kg or units
  unit: 'kg' | 'units';
  disposalMethod: WasteMethod;
  
  // Workflow
  status: 'pending_approval' | 'approved' | 'rejected' | 'reported_to_metrc';
  submittedBy: string;
  submittedAt: string;
  
  // Review
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  
  // Evidence
  photos?: string[];                 // Photo URLs/paths
  notes?: string;
  
  // Traceability
  traceabilityReported?: boolean;
  traceabilityReportedAt?: string;
  
  createdAt: string;
}
```

---

## Cultivar Types

**Location:** `/types/cultivar.ts`

### ProduceType

```typescript
type ProduceType = 
  | 'fruit'
  | 'vegetable'
  | 'herb'
  | 'leafy_green'
  | 'root_vegetable';
```

### ProduceVariety

```typescript
interface ProduceVariety {
  id: string;
  name: string;                      // Variety name (e.g., "Cherry Tomato")
  type: ProduceType;
  
  // Origin
  source: 'seed_bank' | 'nursery' | 'cutting' | 'other';
  sourceDetails?: string;            // Vendor name, lot number
  
  // Characteristics
  characteristics: {
    flavor?: string;                 // Flavor profile
    color?: string;                  // Typical color
    size?: string;                   // Size description
    texture?: string;
    otherTraits?: string[];
  };
  
  // Growing information
  growingNotes?: string;
  averageYield?: number;             // kg per plant
  typicalCycleLength?: number;       // days from seed to harvest
  
  // Environmental preferences
  temperatureRange?: {
    min: number;
    max: number;
    optimal: number;
  };
  lightRequirements?: string;
  
  // Status
  isActive: boolean;                 // Active or archived
  createdAt: string;
  createdBy?: string;
}
```

### GenealogyRecord

```typescript
interface GenealogyRecord {
  id: string;
  batchId: string;                   // Child batch
  sourceType: 'seed' | 'transplant' | 'cutting';
  
  // Parent information (if applicable)
  parentBatchId?: string;
  parentPlantId?: string;
  
  // Source details
  sourceDetails: {
    seedLotNumber?: string;
    seedVendor?: string;
    germinationDate?: string;
    transplantCount?: number;
    cuttingDate?: string;
    cuttingCount?: number;
  };
  
  generation?: number;               // Generation count (for cuttings)
  notes?: string;
  createdAt: string;
}
```

---

## Plant Tracking Types

**Location:** `/types/plant-tracking.ts`

### PlantCountByStage

```typescript
interface PlantCountByStage {
  propagation: number;
  vegetative: number;
  flowering: number;
  harvest: number;
  post_harvest: number;
}
```

### PlantCountSnapshot

```typescript
interface PlantCountSnapshot {
  id: string;
  batchId: string;
  timestamp: string;
  
  // Count data
  totalCount: number;
  countByStatus: {
    healthy: number;
    flowering: number;
    damaged: number;
    quarantined: number;
    dead: number;
  };
  
  // Context
  stage: BatchStage;
  locationId: string;
  countedBy: string;
  
  // Variance detection
  expectedCount?: number;
  variance?: number;                 // Difference from expected
  
  notes?: string;
  verified: boolean;
}
```

---

## Post-Harvest Types

**Location:** `/types/post-harvest.ts`

### DryingRecord

```typescript
interface DryingRecord {
  id: string;
  batchId: string;
  dryingRoomId: string;
  
  // Timing
  startDate: string;
  endDate?: string;
  durationDays?: number;
  
  // Weight tracking
  initialWeight: number;             // kg (wet weight)
  currentWeight?: number;            // kg (during drying)
  finalWeight?: number;              // kg (dry weight)
  moistureLoss?: number;             // Percentage
  
  // Environmental conditions
  conditions: {
    temperature: number;             // Celsius
    humidity: number;                // Percentage
    airflow: 'low' | 'medium' | 'high';
  };
  
  // Readings log
  readings?: Array<{
    timestamp: string;
    temperature: number;
    humidity: number;
    weight?: number;
  }>;
  
  status: 'in_progress' | 'completed' | 'aborted';
  notes?: string;
}
```

### CuringRecord

```typescript
interface CuringRecord {
  id: string;
  batchId: string;
  curingRoomId: string;
  
  // Timing
  startDate: string;
  endDate?: string;
  durationDays?: number;
  
  // Weight
  initialWeight: number;             // kg
  finalWeight?: number;              // kg
  
  // Environmental conditions
  conditions: {
    temperature: number;
    humidity: number;
  };
  
  // Quality checks
  qualityChecks?: Array<{
    date: string;
    moisture?: number;               // Percentage
    aroma?: string;                  // Description
    texture?: string;
    inspector: string;
    notes?: string;
  }>;
  
  status: 'in_progress' | 'completed' | 'failed';
  notes?: string;
}
```

### PackagingRecord

```typescript
interface PackagingRecord {
  id: string;
  batchId: string;
  packagingDate: string;
  packagedBy: string;
  
  // Package details
  packageType: 'bag' | 'box' | 'jar' | 'container' | 'bulk';
  packageSize: string;               // e.g., "5kg", "250g"
  unitCount: number;                 // Number of packages created
  totalWeight: number;               // kg
  weightPerUnit: number;             // kg
  
  // Labeling
  labelIds?: string[];               // Generated label IDs
  lotNumber?: string;
  expirationDate?: string;
  
  // Quality
  qualityGrade?: 'A' | 'B' | 'C';
  qualityNotes?: string;
  
  // Traceability
  traceabilityReported: boolean;
  traceabilityReportedAt?: string;
  traceabilityPackageIds?: string[]; // External system IDs
  
  notes?: string;
}
```

---

## Tagging Types

**Location:** `/types/tagging.ts`

### LabelType

```typescript
type LabelType = 
  | 'barcode'
  | 'rfid'
  | 'qr_code'
  | 'serial_number';
```

### Label

```typescript
interface Label {
  id: string;
  type: LabelType;
  labelNumber: string;               // Human-readable number
  
  // Assignment
  isAssigned: boolean;
  assignedToPlantId?: string;
  assignedToBatchId?: string;
  assignedAt?: string;
  
  // Status
  status: 'available' | 'assigned' | 'damaged' | 'lost';
  
  // Metadata
  printedAt?: string;
  printedBy?: string;
}
```

### TaggingSession

```typescript
interface TaggingSession {
  id: string;
  batchId: string;
  startedAt: string;
  completedAt?: string;
  
  // Scope
  plantsToTag: number;
  plantsTagged: number;
  
  // Labels used
  labelType: LabelType;
  labelStartRange: string;
  labelEndRange: string;
  labelsUsed: string[];              // Label IDs
  
  // Operator
  operatorName: string;
  
  // Status
  status: 'in_progress' | 'completed' | 'paused';
  notes?: string;
}
```

---

## Compliance Types

**Location:** `/types/compliance.ts`

> Note: These types are defined for future compliance engine integration.
> They are not currently used in the main batch management UI.

### WaterTestRecord

```typescript
interface WaterTestRecord {
  id: string;
  testDate: string;
  sampleLocation: string;
  
  // Results
  phLevel: number;
  ecLevel: number;                   // Electrical conductivity
  pathogensDetected: boolean;
  pathogenDetails?: string;
  
  // Testing
  testedBy: string;
  labName?: string;
  
  status: 'pass' | 'fail' | 'pending';
  correctiveActions?: string;
}
```

### ChemicalApplicationRecord

```typescript
interface ChemicalApplicationRecord {
  id: string;
  applicationDate: string;
  batchId?: string;
  locationId?: string;
  
  // Chemical details
  productName: string;
  activeIngredient: string;
  epaRegistrationNumber?: string;
  
  // Application
  applicationRate: string;
  applicationMethod: string;
  targetPest?: string;
  
  // Safety
  preharvestInterval: number;        // Days
  reentryInterval: number;           // Hours
  applicatorName: string;
  applicatorLicense?: string;
  
  // Compliance
  labelFollowed: boolean;
  safetyEquipmentUsed: boolean;
}
```

### WorkerHygieneLog

```typescript
interface WorkerHygieneLog {
  id: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'night';
  
  // Checks
  handwashingCompliant: boolean;
  properAttireWorn: boolean;
  noIllnessReported: boolean;
  trainingCurrent: boolean;
  
  inspectedBy: string;
  notes?: string;
}
```

### SanitationLog

```typescript
interface SanitationLog {
  id: string;
  date: string;
  locationId: string;
  
  // Cleaning
  surfacesCleaned: boolean;
  equipmentSanitized: boolean;
  wasteRemoved: boolean;
  
  // Products used
  sanitizerUsed: string;
  concentration: string;
  contactTime: number;               // Minutes
  
  performedBy: string;
  verifiedBy?: string;
  notes?: string;
}
```

### PestControlLog

```typescript
interface PestControlLog {
  id: string;
  inspectionDate: string;
  locationId: string;
  
  // Findings
  pestsDetected: boolean;
  pestType?: string;
  severity?: 'low' | 'medium' | 'high';
  
  // Actions
  actionTaken: string;
  trapsMaintained: boolean;
  chemicalApplied: boolean;
  
  inspectorName: string;
  followUpRequired: boolean;
  followUpDate?: string;
}
```

### NonConformanceReport

```typescript
interface NonConformanceReport {
  id: string;
  reportDate: string;
  category: 'quality' | 'safety' | 'sanitation' | 'documentation' | 'other';
  
  // Issue
  description: string;
  severity: 'minor' | 'major' | 'critical';
  rootCause?: string;
  
  // Resolution
  correctiveAction: string;
  preventiveAction?: string;
  responsibleParty: string;
  targetResolutionDate: string;
  
  // Status
  status: 'open' | 'in_progress' | 'resolved' | 'verified';
  resolvedDate?: string;
  verifiedBy?: string;
}
```

### TraceabilityTest

```typescript
interface TraceabilityTest {
  id: string;
  testDate: string;
  testType: 'forward' | 'backward';  // Forward: ingredient to product, Backward: product to ingredient
  
  // Test parameters
  targetBatchId: string;
  targetProductCode?: string;
  
  // Results
  traceabilitySuccessful: boolean;
  timeToTrace: number;               // Minutes
  recordsReviewed: string[];
  gapsIdentified?: string;
  
  conductedBy: string;
  verifiedBy?: string;
  notes?: string;
}
```

### InternalAudit

```typescript
interface InternalAudit {
  id: string;
  auditDate: string;
  auditType: 'food_safety' | 'gap' | 'gmp' | 'full_system';
  
  // Scope
  areasAudited: string[];
  auditCriteria: string;
  
  // Findings
  totalFindings: number;
  criticalFindings: number;
  majorFindings: number;
  minorFindings: number;
  
  // Results
  overallScore?: number;             // Percentage
  findings: Array<{
    area: string;
    finding: string;
    severity: 'critical' | 'major' | 'minor';
    correctiveAction: string;
  }>;
  
  // Auditor
  auditorName: string;
  auditFirm?: string;
  
  status: 'scheduled' | 'in_progress' | 'completed' | 'closed_out';
  followUpDate?: string;
}
```

### TrainingRecord

```typescript
interface TrainingRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  
  // Training details
  trainingTopic: string;
  trainingDate: string;
  duration: number;                  // Hours
  
  // Completion
  completed: boolean;
  testScore?: number;                // Percentage
  passingScore: number;              // Minimum required
  
  // Verification
  trainerName: string;
  certificateIssued: boolean;
  expirationDate?: string;
  
  notes?: string;
}
```

---

## Utility Types

### Common Enums and Unions

```typescript
// Date/time utilities
type ISODateString = string;        // "2024-01-15"
type ISOTimestamp = string;         // "2024-01-15T10:30:00Z"

// Weight units
type WeightUnit = 'kg' | 'g' | 'lb' | 'oz';

// Temperature units
type TempUnit = 'celsius' | 'fahrenheit';

// User roles
type UserRole = 
  | 'technician'
  | 'supervisor'
  | 'manager'
  | 'compliance_manager'
  | 'admin';

// Status indicators
type Status = 
  | 'active'
  | 'inactive'
  | 'pending'
  | 'completed'
  | 'failed';
```

### Form Data Types

```typescript
// Used in CreateBatchDialog
type BatchFormData = {
  name: string;
  variety: string;
  varietyId?: string;
  stage: BatchStage;
  startDate: string;
  growingAreaIds: string[];
  plantCount: number;
};

// Used in CultivarManagement
type CultivarFormData = Omit<ProduceVariety, 'id' | 'createdAt'>;

// Used in WasteDisposalWorkflow
type WasteFormData = Omit<WasteLog, 'id' | 'createdAt' | 'status'>;
```

### API Response Types (Future)

```typescript
// For future backend integration
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
```

---

## Type Usage Examples

### Creating a New Batch

```typescript
const newBatch: Batch = {
  id: `batch-${Date.now()}`,
  name: 'Tomato-001',
  variety: 'Cherry Tomato',
  varietyId: 'var-123',
  stage: 'propagation',
  startDate: new Date().toISOString(),
  growingAreaIds: ['greenhouse-1'],
  plantCount: 100,
  createdAt: new Date().toISOString(),
  quarantineStatus: 'none'
};
```

### Recording a Harvest

```typescript
const harvestRecord: HarvestRecord = {
  id: `harvest-${Date.now()}`,
  batchId: 'batch-123',
  plantIds: ['plant-1', 'plant-2', 'plant-3'],
  harvestDate: new Date().toISOString(),
  harvestedBy: 'John Smith',
  wetWeight: 15.5,
  estimatedDryWeight: 3.1,
  qualityGrade: 'A',
  traceabilityReported: true,
  traceabilityReportedAt: new Date().toISOString(),
  notes: 'Excellent quality, no issues'
};
```

### Creating a Waste Log

```typescript
const wasteLog: WasteLog = {
  id: `waste-${Date.now()}`,
  sourceType: 'batch',
  sourceBatchId: 'batch-123',
  wasteType: 'plant_material',
  wasteReason: 'quality_control',
  quantity: 2.5,
  unit: 'kg',
  disposalMethod: 'compost',
  status: 'pending_approval',
  submittedBy: 'Jane Doe',
  submittedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  notes: 'Removed damaged leaves and stems'
};
```

For more examples, see the mock data files in `/lib`.
