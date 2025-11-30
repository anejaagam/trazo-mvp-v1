# Type System Documentation

**Version**: 1.0  
**Last Updated**: November 12, 2025

---

## Overview

The Trazo Unified Batch Management System uses **discriminated union types** to provide type-safe, domain-aware functionality across both cannabis and produce operations.

### Key Principles

1. **Discriminated Unions**: Single `domainType` field enables TypeScript type narrowing
2. **Base + Extensions**: Shared interfaces extended with domain-specific properties
3. **Type Guards**: Runtime type checking with compile-time guarantees
4. **Immutability**: Read-only properties where appropriate
5. **Strict Null Checks**: Optional fields explicitly marked with `?`

---

## Core Type Hierarchy

```
IBatch (base interface)
├── ICannabisBatch (cannabis extension)
└── IProduceBatch (produce extension)

DomainBatch = ICannabisBatch | IProduceBatch  (discriminated union)
```

---

## Base Interfaces

### IBatch

Foundation for all batch types across domains.

**Location**: `unified/types/domains/base.ts`

```typescript
export interface IBatch {
  // Identity
  id: string;
  domainType: 'cannabis' | 'produce';  // Discriminator field
  name: string;
  
  // Cultivar (unified term for strain/variety)
  cultivarId: string;
  cultivarName: string;
  
  // Lifecycle
  stage: string;  // Overridden in domain types
  status: BatchStatus;
  startDate: string;  // ISO 8601
  harvestDate?: string;  // ISO 8601
  closeDate?: string;  // ISO 8601
  
  // Quantity
  plantCount: number;
  
  // Location
  locationIds: string[];  // Can span multiple locations
  
  // Quarantine
  quarantineStatus: QuarantineStatus;
  quarantineReason?: string;
  quarantinedAt?: string;  // ISO 8601
  quarantinedBy?: string;
  
  // Grouping
  groupId?: string;
  parentBatchId?: string;  // For splits
  childBatchIds?: string[];  // For merges
  
  // Metadata
  notes?: string;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
  createdBy?: string;
  updatedBy?: string;
}
```

### ILocation

Foundation for all location types (pods, rooms, growing areas).

**Location**: `unified/types/domains/base.ts`

```typescript
export interface ILocation {
  id: string;
  domainType: 'cannabis' | 'produce';
  name: string;
  location: string;  // Physical location (e.g., "Building A")
  
  // Capacity
  capacity: number;  // Plant count limit
  currentPlantCount: number;
  area: number;  // Square footage
  usedArea: number;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt?: string;
}
```

### ICultivar

Foundation for all cultivar types (strains, varieties).

**Location**: `unified/types/domains/base.ts`

```typescript
export interface ICultivar {
  id: string;
  domainType: 'cannabis' | 'produce';
  name: string;
  description?: string;
  
  // Characteristics
  floweringTime?: number;  // Days
  yieldEstimate?: number;  // Per plant/area
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt?: string;
}
```

---

## Cannabis Domain Types

### ICannabisBatch

Cannabis-specific batch extension.

**Location**: `unified/types/domains/cannabis.ts`

```typescript
export interface ICannabisBatch extends IBatch {
  domainType: 'cannabis';  // Literal type for discrimination
  stage: CannabisStage;
  
  // METRC Compliance
  metrcPackageTag?: string;  // e.g., "1A4060300000001000000000"
  metrcPlantTags?: string[];  // Individual plant tags
  
  // Cultivation
  lightingSchedule?: '18/6' | '12/12' | '24/0';  // Light/dark hours
  motherPlantId?: string;  // For clones
  cloneSourceBatchId?: string;  // Original batch if clone
  
  // Testing & Quality
  thcContent?: number;  // Percentage
  cbdContent?: number;  // Percentage
  terpeneProfile?: string;  // JSON or comma-separated
  testResults?: ITestResult[];
  
  // Processing
  dryingStartDate?: string;
  dryingEndDate?: string;
  curingStartDate?: string;
  curingEndDate?: string;
  packagedDate?: string;
}

export type CannabisStage =
  | 'propagation'   // Seeds, clones, mother plants
  | 'vegetative'    // Veg growth
  | 'flowering'     // Flower production
  | 'harvest'       // Harvesting
  | 'drying'        // Drying room
  | 'curing'        // Curing jars/rooms
  | 'testing'       // Lab testing
  | 'packaging'     // Final packaging
  | 'closed';       // Archived/sold
```

### ICannabisLocation

Cannabis-specific location (pod/room) extension.

```typescript
export interface ICannabisLocation extends ILocation {
  domainType: 'cannabis';
  roomType: 'clone' | 'vegetative' | 'flowering' | 'drying' | 'curing' | 'packaging';
  
  // Canopy tracking
  canopyArea: number;  // Regulated in some states
  usedCanopyArea: number;
  
  // Lighting
  lightingWatts?: number;
  lightingType?: string;  // e.g., "LED Full Spectrum"
}
```

### ICannabisCultivar

Cannabis-specific cultivar (strain) extension.

```typescript
export interface ICannabisCultivar extends ICultivar {
  domainType: 'cannabis';
  
  // Genetics
  genetics?: string;  // e.g., "Indica-dominant hybrid"
  breeder?: string;
  thcRange?: { min: number; max: number };  // Percentage
  cbdRange?: { min: number; max: number };  // Percentage
  
  // Terpenes
  dominantTerpenes?: string[];  // e.g., ["Myrcene", "Limonene"]
  
  // Cultivation
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  yieldCategory?: 'low' | 'medium' | 'high';
}
```

---

## Produce Domain Types

### IProduceBatch

Produce-specific batch extension.

**Location**: `unified/types/domains/produce.ts`

```typescript
export interface IProduceBatch extends IBatch {
  domainType: 'produce';
  stage: ProduceStage;
  
  // Seeding
  seedLotNumber?: string;
  seedSupplier?: string;
  seedingDate?: string;
  
  // Grading & Quality
  grade?: ProduceGrade;
  gradedAt?: string;
  gradedBy?: string;
  ripeness?: RipenessLevel;
  
  // Certifications
  gapCertified?: boolean;  // Good Agricultural Practices
  organicCertified?: boolean;
  certifications?: string[];  // Other certs
  
  // Harvest
  harvestWindow?: {
    start: string;  // ISO 8601
    end: string;
  };
  
  // Storage
  storageTemperature?: number;  // Fahrenheit
  storageHumidity?: number;  // Percentage
  shelfLifeDays?: number;
  
  // Packaging
  lotNumber?: string;  // Traceability
  packagingDate?: string;
}

export type ProduceStage =
  | 'seeding'       // Initial seeding
  | 'germination'   // Germination phase
  | 'seedling'      // Seedling growth
  | 'transplant'    // Transplanting
  | 'growing'       // Vegetative growth
  | 'pre_harvest'   // Pre-harvest preparation
  | 'harvest'       // Harvesting
  | 'washing'       // Post-harvest washing
  | 'sorting'       // Sorting/cleaning
  | 'grading'       // Quality grading
  | 'ripening'      // Controlled ripening
  | 'storage'       // Cold storage
  | 'packaging'     // Final packaging
  | 'closed';       // Distributed/sold

export type ProduceGrade = 'grade_a' | 'grade_b' | 'grade_c' | 'premium' | 'processing';
export type RipenessLevel = 'unripe' | 'ripe' | 'overripe';
```

### IProduceLocation

Produce-specific location (growing area) extension.

```typescript
export interface IProduceLocation extends ILocation {
  domainType: 'produce';
  areaType: 'greenhouse' | 'field' | 'hydroponic' | 'vertical' | 'storage';
  
  // Environment
  irrigationType?: 'drip' | 'sprinkler' | 'flood' | 'manual';
  soilType?: string;
  
  // Climate
  temperatureControl?: boolean;
  humidityControl?: boolean;
}
```

### IProduceCultivar

Produce-specific cultivar (variety) extension.

```typescript
export interface IProduceCultivar extends ICultivar {
  domainType: 'produce';
  
  // Classification
  category?: 'leafy_greens' | 'fruits' | 'vegetables' | 'herbs' | 'mushrooms';
  subCategory?: string;  // e.g., "Lettuce", "Tomato"
  
  // Growing
  growingMethod?: 'soil' | 'hydroponic' | 'aeroponic';
  sunRequirement?: 'full' | 'partial' | 'shade';
  waterRequirement?: 'low' | 'medium' | 'high';
  
  // Harvest
  harvestCycleDays?: number;  // Typical days to harvest
  harvestMethod?: 'cut' | 'pick' | 'pull' | 'multiple';
}
```

---

## Discriminated Unions

### DomainBatch

Union type that TypeScript can discriminate based on `domainType`.

```typescript
export type DomainBatch = ICannabisBatch | IProduceBatch;
```

**Usage**:

```typescript
function processBatch(batch: DomainBatch) {
  if (batch.domainType === 'cannabis') {
    // TypeScript knows batch is ICannabisBatch
    console.log(batch.metrcPackageTag);  // ✅ Valid
    console.log(batch.grade);  // ❌ Error: Property 'grade' does not exist
  } else {
    // TypeScript knows batch is IProduceBatch
    console.log(batch.grade);  // ✅ Valid
    console.log(batch.metrcPackageTag);  // ❌ Error
  }
}
```

### DomainLocation

```typescript
export type DomainLocation = ICannabisLocation | IProduceLocation;
```

### DomainCultivar

```typescript
export type DomainCultivar = ICannabisCultivar | IProduceCultivar;
```

---

## Type Guards

### Runtime Type Checking

**Location**: `unified/types/domains/index.ts`

```typescript
export function isCannabisBatch(batch: DomainBatch): batch is ICannabisBatch {
  return batch.domainType === 'cannabis';
}

export function isProduceBatch(batch: DomainBatch): batch is IProduceBatch {
  return batch.domainType === 'produce';
}

export function isCannabisLocation(location: DomainLocation): location is ICannabisLocation {
  return location.domainType === 'cannabis';
}

export function isProduceLocation(location: DomainLocation): location is IProduceLocation {
  return location.domainType === 'produce';
}

export function isCannabisCultivar(cultivar: DomainCultivar): cultivar is ICannabisCultivar {
  return cultivar.domainType === 'cannabis';
}

export function isProduceCultivar(cultivar: DomainCultivar): cultivar is IProduceCultivar {
  return cultivar.domainType === 'produce';
}
```

**Usage**:

```typescript
import { isCannabisBatch, isProduceBatch } from './types/domains';

const batch: DomainBatch = await getBatch('batch-123');

if (isCannabisBatch(batch)) {
  // TypeScript narrows type to ICannabisBatch
  const tag = batch.metrcPackageTag;
  const thc = batch.thcContent;
}

if (isProduceBatch(batch)) {
  // TypeScript narrows type to IProduceBatch
  const grade = batch.grade;
  const ripeness = batch.ripeness;
}
```

---

## Shared Enums & Types

### BatchStatus

```typescript
export type BatchStatus = 
  | 'active'       // Currently in use
  | 'quarantined'  // Quality hold
  | 'completed'    // Finished processing
  | 'closed';      // Archived/sold
```

### QuarantineStatus

```typescript
export type QuarantineStatus =
  | 'none'         // Not quarantined
  | 'quarantined'  // Currently in quarantine
  | 'released';    // Previously quarantined, now released
```

### IBatchGroup

Grouping for related batches.

```typescript
export interface IBatchGroup {
  id: string;
  name: string;
  description?: string;
  batchIds: string[];
  createdAt: string;
  updatedAt?: string;
}
```

### ITimelineEvent

Audit trail for batch history.

```typescript
export interface ITimelineEvent {
  id: string;
  batchId: string;
  eventType: TimelineEventType;
  timestamp: string;  // ISO 8601
  performedBy?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export type TimelineEventType =
  | 'created'
  | 'stage_transition'
  | 'quarantine'
  | 'release'
  | 'split'
  | 'merge'
  | 'transfer'
  | 'waste_recorded'
  | 'testing_completed'
  | 'packaging_completed'
  | 'closed';
```

---

## Domain-Specific Types

### Cannabis

#### ITestResult

```typescript
export interface ITestResult {
  id: string;
  batchId: string;
  testDate: string;
  labName: string;
  
  // Cannabinoids
  thc?: number;  // Percentage
  cbd?: number;
  cbg?: number;
  thcv?: number;
  
  // Terpenes
  terpenes?: Array<{
    name: string;
    percentage: number;
  }>;
  
  // Contaminants
  pesticides?: 'pass' | 'fail';
  heavyMetals?: 'pass' | 'fail';
  microbials?: 'pass' | 'fail';
  
  // Overall
  passed: boolean;
  certificationNumber?: string;
}
```

#### IDryingRecord

```typescript
export interface IDryingRecord {
  id: string;
  batchId: string;
  startDate: string;
  endDate?: string;
  
  // Environment
  temperature: number;  // Fahrenheit
  humidity: number;  // Percentage
  airflow: 'low' | 'medium' | 'high';
  
  // Tracking
  dailyChecks?: Array<{
    date: string;
    temperature: number;
    humidity: number;
    notes?: string;
  }>;
  
  // Completion
  completedBy?: string;
  qualityNotes?: string;
}
```

### Produce

#### IGradeReport

```typescript
export interface IGradeReport {
  id: string;
  batchId: string;
  gradedAt: string;
  gradedBy: string;
  
  // Final grade
  grade: ProduceGrade;
  
  // Factors
  sizeUniformity: number;  // 1-10 scale
  colorConsistency: number;
  defectCount: number;
  brixLevel?: number;  // Sugar content
  
  // Defects
  defects?: Array<{
    type: string;
    severity: 'minor' | 'major' | 'critical';
    count: number;
  }>;
  
  // Notes
  notes?: string;
}
```

#### IRipenessCheck

```typescript
export interface IRipenessCheck {
  id: string;
  batchId: string;
  checkDate: string;
  performedBy: string;
  
  // Assessment
  ripenessLevel: RipenessLevel;
  ripenessScore: number;  // 1-10 scale
  
  // Factors
  colorScore: number;  // 1-10
  firmnessScore: number;  // 1-10
  aromaScore: number;  // 1-10
  
  // Predictions
  estimatedRipeDate?: string;
  estimatedShelfLife?: number;  // Days
  
  // Notes
  observations?: string;
}
```

---

## Validation Types

### QuantityValidationResult

```typescript
export interface QuantityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  min?: number;
  max?: number;
  context?: string;
}
```

### StageTransitionValidationResult

```typescript
export interface StageTransitionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  allowedNextStages: string[];
  requiredFields: string[];
  minimumDuration?: number;  // Days
}
```

### DateValidationResult

```typescript
export interface DateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  daysFromStart?: number;
  typicalRange?: { min: number; max: number };
}
```

---

## Type Utility Functions

### Creating New Batches

```typescript
import { DomainBatch, DomainType } from './types/domains';
import { v4 as uuid } from 'uuid';

export function createEmptyBatch(domain: DomainType): Partial<DomainBatch> {
  const now = new Date().toISOString();
  
  const base = {
    id: uuid(),
    domainType: domain,
    status: 'active' as const,
    quarantineStatus: 'none' as const,
    plantCount: 0,
    locationIds: [],
    createdAt: now,
    updatedAt: now,
  };
  
  if (domain === 'cannabis') {
    return {
      ...base,
      domainType: 'cannabis',
      stage: 'propagation',
    };
  } else {
    return {
      ...base,
      domainType: 'produce',
      stage: 'seeding',
    };
  }
}
```

### Type Conversion

```typescript
// Convert from API response to typed batch
export function parseBatch(data: any): DomainBatch {
  if (data.domainType === 'cannabis') {
    return data as ICannabisBatch;
  } else {
    return data as IProduceBatch;
  }
}

// Validate batch has required fields
export function validateBatchStructure(batch: DomainBatch): boolean {
  const required = ['id', 'domainType', 'name', 'stage', 'status'];
  return required.every(field => field in batch);
}
```

---

## Migration Guide

### From Old Types to New Types

**Old** (cannabis-specific):
```typescript
interface Batch {
  id: string;
  name: string;
  strain: string;  // ❌ Old terminology
  stage: string;
  pod: string;  // ❌ Domain-specific
}
```

**New** (unified):
```typescript
interface IBatch {
  id: string;
  domainType: 'cannabis' | 'produce';  // ✅ Discriminator
  name: string;
  cultivarId: string;  // ✅ Unified terminology
  cultivarName: string;
  stage: string;  // ✅ Overridden in domain types
  locationIds: string[];  // ✅ Supports multiple locations
}
```

### Updating Component Props

**Old**:
```typescript
interface BatchModalProps {
  batch: Batch;  // ❌ Not domain-aware
}
```

**New**:
```typescript
import { DomainBatch } from './types/domains';

interface BatchModalProps {
  batch: DomainBatch;  // ✅ Discriminated union
}

// Component can now use type guards
function BatchModal({ batch }: BatchModalProps) {
  if (isCannabisBatch(batch)) {
    // Cannabis-specific UI
  } else {
    // Produce-specific UI
  }
}
```

---

## Best Practices

### 1. Always Use Type Guards

```typescript
// ❌ BAD - Unsafe type assertion
function getBatchTag(batch: DomainBatch): string {
  return (batch as ICannabisBatch).metrcPackageTag || 'N/A';
}

// ✅ GOOD - Type guard with proper handling
function getBatchTag(batch: DomainBatch): string {
  if (isCannabisBatch(batch)) {
    return batch.metrcPackageTag || 'N/A';
  }
  return 'N/A';
}
```

### 2. Leverage Discriminated Unions

```typescript
// ✅ TypeScript will catch missing cases
function getStageColor(stage: CannabisStage | ProduceStage): string {
  switch (stage) {
    case 'propagation':
    case 'seeding':
      return 'blue';
    // ... handle all cases
    default:
      // TypeScript error if case is missing
      const _exhaustive: never = stage;
      return 'gray';
  }
}
```

### 3. Use Partial for Updates

```typescript
// ✅ Update operations should use Partial
async function updateBatch(
  id: string,
  updates: Partial<DomainBatch>
): Promise<DomainBatch> {
  // Implementation
}

// Usage
await updateBatch('batch-123', {
  stage: 'flowering',
  lightingSchedule: '12/12'
});
```

### 4. Strict Null Checks

```typescript
// ✅ Handle optional fields properly
function getHarvestDate(batch: DomainBatch): string {
  return batch.harvestDate ?? 'Not harvested';
}

// ❌ BAD - Can cause runtime error
function getHarvestDate(batch: DomainBatch): Date {
  return new Date(batch.harvestDate);  // Error if undefined
}
```

### 5. Readonly for Immutable Data

```typescript
// ✅ Prevent accidental mutations
export interface IReadonlyBatch extends Readonly<IBatch> {
  readonly childBatchIds: readonly string[];
}
```

---

## TypeScript Configuration

Ensure `tsconfig.json` has strict settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## Testing Types

```typescript
import { describe, it, expect } from 'vitest';
import { isCannabisBatch, isProduceBatch } from './types/domains';

describe('Type Guards', () => {
  it('should correctly identify cannabis batch', () => {
    const batch: DomainBatch = {
      domainType: 'cannabis',
      // ... other fields
    };
    
    expect(isCannabisBatch(batch)).toBe(true);
    expect(isProduceBatch(batch)).toBe(false);
  });
  
  it('should narrow type correctly', () => {
    const batch: DomainBatch = getCannabi sBatch();
    
    if (isCannabisBatch(batch)) {
      // This should compile without errors
      const tag = batch.metrcPackageTag;
    }
  });
});
```

---

**Questions?** See `unified/types/domains/` for complete type definitions.
