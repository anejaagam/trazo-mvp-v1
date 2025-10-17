# Data Structures Documentation

## Overview
This document describes all TypeScript interfaces and types used in the Crop Batch Management System.

---

## `/types/batch.ts`

### Core Batch Management

```typescript
export type BatchStage = 
  | 'propagation' 
  | 'vegetative' 
  | 'flowering' 
  | 'harvest' 
  | 'drying' 
  | 'curing' 
  | 'closed';

export interface Batch {
  id: string;
  name: string;
  cultivar: string;
  cultivarId?: string;
  stage: BatchStage;
  startDate: string;
  groupId?: string;
  podIds: string[];
  plantCount: number;
  createdAt: string;
  harvestDate?: string;
  closedDate?: string;
  quarantineStatus?: 'none' | 'quarantined' | 'released';
  quarantineReason?: string;
  quarantinedAt?: string;
  quarantinedBy?: string;
  yieldData?: {
    wetWeight?: number;
    dryWeight?: number;
    waste?: number;
  };
}

export interface Pod {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentPlantCount?: number;
  canopyArea?: number; // sq ft
  usedCanopyArea?: number; // sq ft
}

export interface BatchGroup {
  id: string;
  name: string;
  description: string;
  batchIds: string[];
  createdAt: string;
}

export type EventType = 'stage_change' | 'alarm' | 'override' | 'note' | 'qa_check';

export interface TimelineEvent {
  id: string;
  batchId: string;
  type: EventType;
  timestamp: string;
  description: string;
  data?: Record<string, any>;
  userId?: string;
  evidenceUrls?: string[];
}

export interface BatchMetrics {
  temperature: { min: number; avg: number; max: number };
  humidity: { min: number; avg: number; max: number };
  vpd: { min: number; avg: number; max: number };
}
```

**Purpose:** Core batch tracking, lifecycle management, quarantine status, and grouping functionality.

---

## `/types/cultivar.ts`

### Cultivar & Genetics Management

```typescript
export interface Cultivar {
  id: string;
  name: string;
  type: 'seed' | 'clone';
  genetics: string;
  description?: string;
  thcRange?: { min: number; max: number };
  cbdRange?: { min: number; max: number };
  floweringTime?: number; // days
  expectedYield?: number; // kg per plant
  createdAt: string;
  isActive: boolean;
}

export interface BatchGenealogy {
  batchId: string;
  source: 'seed' | 'clone' | 'mother_plant';
  parentBatchId?: string;
  seedVendor?: string;
  seedLotNumber?: string;
  motherPlantId?: string;
  generationNumber?: number;
  notes?: string;
}
```

**Purpose:** Strain/cultivar library management and batch lineage tracking for compliance.

---

## `/types/harvest.ts`

### Harvest Operations (SOP-002)

```typescript
export interface Plant {
  id: string;
  tagId: string;
  batchId: string;
  location: string;
  status: 'immature' | 'vegetative' | 'flowering' | 'harvested';
  plantedDate: string;
  strainName: string;
}

export interface HarvestRecord {
  id: string;
  batchId: string;
  plantIds: string[];
  wetWeight: number;
  dryingRoomLocation: string;
  harvestedBy: string;
  harvestDate: string;
  metrcReported: boolean;
  metrcReportedAt?: string;
}

export interface DryingRoom {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentLoad: number;
  temperature: number;
  humidity: number;
}
```

**Purpose:** Plant tracking and harvest documentation with Metrc integration.

---

## `/types/tagging.ts`

### Plant Tagging (SOP-001)

```typescript
export interface PlantTag {
  id: string;
  tagNumber: string;
  metrcUid: string;
  status: 'available' | 'assigned' | 'destroyed';
  assignedPlantId?: string;
  assignedAt?: string;
  assignedBy?: string;
}

export interface TaggedPlant {
  id: string;
  batchId: string;
  tagId: string;
  tagNumber: string;
  metrcUid: string;
  physicallyAttached: boolean;
  attachedBy?: string;
  attachedAt?: string;
  location: string;
  strainName: string;
  plantedDate: string;
}

export interface TaggingSession {
  id: string;
  batchId: string;
  batchName: string;
  startedBy: string;
  startedAt: string;
  completedAt?: string;
  plantsToTag: number;
  plantsTagged: number;
  taggedPlants: TaggedPlant[];
}
```

**Purpose:** Metrc UID tag assignment and tracking compliance.

---

## `/types/plant-tracking.ts`

### Plant Count Management

```typescript
export interface PlantLot {
  id: string;
  batchId: string;
  lotNumber: string;
  plantCount: number;
  stage: 'immature' | 'vegetative' | 'flowering';
  location: string;
  createdAt: string;
  notes?: string;
}

export interface IndividualPlant {
  id: string;
  batchId: string;
  tagNumber: string;
  stage: 'flowering' | 'harvest' | 'destroyed';
  location: string;
  health: 'healthy' | 'stressed' | 'diseased';
  plantedDate: string;
  harvestedDate?: string;
  wetWeight?: number;
  dryWeight?: number;
  notes?: string;
}

export interface PlantCountSnapshot {
  id: string;
  batchId: string;
  timestamp: string;
  immatureLots: { lotId: string; count: number }[];
  individualFloweringCount: number;
  totalCount: number;
  recordedBy: string;
}
```

**Purpose:** Track immature lots (up to 100 plants) and individual flowering plants for compliance.

---

## `/types/post-harvest.ts`

### Post-Harvest Processing

```typescript
export type ProcessingStage = 'drying' | 'curing' | 'packaging' | 'completed';

export interface DryingRecord {
  id: string;
  batchId: string;
  roomId: string;
  roomName: string;
  startDate: string;
  endDate?: string;
  startWeight: number;
  endWeight?: number;
  targetHumidity: number;
  targetTemperature: number;
  actualHumidity?: { min: number; avg: number; max: number };
  actualTemperature?: { min: number; avg: number; max: number };
  qualityNotes?: string;
  completedBy?: string;
}

export interface CuringRecord {
  id: string;
  batchId: string;
  containerType: 'jar' | 'bin' | 'bag';
  containerCount: number;
  startDate: string;
  endDate?: string;
  targetDuration: number; // days
  startWeight: number;
  endWeight?: number;
  burpingSchedule?: string;
  qualityNotes?: string;
  completedBy?: string;
}

export interface PackagingRecord {
  id: string;
  batchId: string;
  packageDate: string;
  packageType: string;
  packageCount: number;
  totalWeight: number;
  packagesCreated: {
    packageId: string;
    weight: number;
    label: string;
  }[];
  packagedBy: string;
  qualityCheck: boolean;
  metrcReported: boolean;
  metrcReportedAt?: string;
}
```

**Purpose:** Complete post-harvest workflow from drying through packaging with quality tracking.

---

## `/types/waste.ts`

### Waste Disposal (SOP-003)

```typescript
export type WasteReason = 
  | 'normal_plant_debris'
  | 'failed_qa'
  | 'pest_infestation'
  | 'mold_contamination'
  | 'trim_waste'
  | 'stem_waste'
  | 'damaged_product'
  | 'expired_product'
  | 'other';

export type WasteStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'reported_to_metrc';

export interface WasteLog {
  id: string;
  batchId?: string;
  wasteType: WasteReason;
  wasteTypeOther?: string;
  plantMaterialWeight: number;
  nonPlantMaterialWeight: number;
  totalWeight: number;
  mixingRatio: number;
  createdBy: string;
  createdAt: string;
  evidenceUrls: string[];
  notes?: string;
  status: WasteStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  metrcReportedAt?: string;
}

export interface WasteMaterial {
  id: string;
  name: string;
  category: 'plant_material' | 'non_plant_material';
  weight: number;
  unit: 'kg' | 'g';
}
```

**Purpose:** Waste tracking with 50% mixing ratio compliance and dual-approval workflow.

---

## Data Relationship Map

```
Cultivar (1) ──> (*) Batch
    │
    └──> BatchGenealogy (seed/clone lineage)

Batch (1) ──> (*) Plant
    │
    ├──> (*) PlantCountSnapshot
    ├──> (*) TimelineEvent
    ├──> (1) HarvestRecord
    ├──> (1) DryingRecord
    ├──> (1) CuringRecord
    ├──> (*) PackagingRecord
    ├──> (*) WasteLog
    └──> (*) TaggingSession
              │
              └──> (*) TaggedPlant

BatchGroup (1) ──> (*) Batch

Pod (1) ──> (*) Batch (through podIds array)
```

---

## Key Design Patterns

### 1. **Audit Trail**
All records include:
- `createdAt` / `timestamp`
- `createdBy` / `recordedBy` / `authorizedBy`
- Optional `completedBy` for workflow completion

### 2. **Metrc Integration**
Records that sync to Metrc include:
- `metrcReported: boolean`
- `metrcReportedAt?: string`

### 3. **Workflow States**
Many entities use status enums:
- `BatchStage` - lifecycle progression
- `WasteStatus` - approval workflow
- `ProcessingStage` - post-harvest steps
- Tag `status` - availability tracking

### 4. **Compliance Fields**
- `quarantineStatus` - regulatory holds
- `plantCount` - max 100 per batch
- `mixingRatio` - 50% requirement for waste
- `evidenceUrls` - photo/video documentation

### 5. **Flexible Relations**
- Optional fields with `?` allow incremental data capture
- Array fields (`podIds[]`, `batchIds[]`) enable many-to-many relationships
- Nested objects (`yieldData`, `actualHumidity`) group related metrics

---

## Mock Data Files

Each type has corresponding mock data in `/lib`:
- `mock-data.ts` - Batches, Pods, Groups, Events
- `cultivar-mock-data.ts` - Cultivars, Genealogy
- `harvest-mock-data.ts` - Plants, Drying Rooms
- `tagging-mock-data.ts` - Available Tags
- `plant-tracking-mock-data.ts` - Count Snapshots
- `waste-mock-data.ts` - Waste Logs

---

## Total Interface Count

- **7 Type Definition Files**
- **29 Interfaces**
- **8 Type Aliases/Enums**
- **Full type safety across the application**
