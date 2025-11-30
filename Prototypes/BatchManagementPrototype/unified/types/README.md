# Unified Type System

Complete TypeScript type definitions for the unified batch management system.

## Structure

```
unified/types/
├── domains/           # Core domain types
│   ├── base.ts       # Shared base interfaces
│   ├── cannabis.ts   # Cannabis-specific types
│   ├── produce.ts    # Produce-specific types
│   └── index.ts      # Discriminated unions and type guards
├── harvest.ts        # Harvest operation types
├── post-harvest.ts   # Post-harvest processing types
├── waste.ts          # Waste management types
├── tagging.ts        # Plant tagging types (cannabis)
└── index.ts          # Central export
```

## Domain Types (`domains/`)

### Base Types (`base.ts`)

Core interfaces extended by all domains:

- `IBatch` - Base batch with common fields
- `ILocation` - Base location/growing area
- `ICultivar` - Base cultivar/variety
- `IBatchGenealogy` - Lineage tracking
- `IBatchGroup` - Batch grouping
- `ITimelineEvent` - Event logging
- `IBatchMetrics` - Environmental metrics
- `IQualityMetric` - Quality measurements
- `IYieldData` - Harvest yield

All base types include fields like `domainType`, `id`, `name`, `createdAt`, etc.

### Cannabis Types (`cannabis.ts`)

Cannabis-specific extensions:

- `ICannabisBatch` - Adds METRC tags, mother plant tracking, lighting
- `ICannabisLocation` - Room types, canopy area, lighting specs
- `ICannabisCultivar` - Strain types, genetics, THC/CBD ranges, terpenes
- `ICannabisYieldData` - Wet/dry weight, potency, grade breakdown
- `ICannabisPlantTag` - METRC plant tagging
- `ICannabisTestResult` - Lab test results
- `ICannabisWasteRecord` - Waste with METRC reporting

### Produce Types (`produce.ts`)

Produce-specific extensions:

- `IProduceBatch` - Grading, ripeness, harvest windows
- `IProduceLocation` - Area types, climate control, irrigation
- `IProduceCultivar` - Categories, flavor, storage life
- `IProduceYieldData` - Grade/size distribution
- `IProduceQualityInspection` - Brix, firmness, color scoring
- `IProduceStorageConditions` - Cold storage tracking
- `IProduceHarvestRecord` - Ripeness, field temperature
- `IProduceFoodSafetyEvent` - Food safety compliance

### Type Safety (`index.ts`)

Discriminated unions for type-safe domain handling:

```typescript
type DomainBatch = ICannabisBatch | IProduceBatch;
type DomainLocation = ICannabisLocation | IProduceLocation;
type DomainCultivar = ICannabisCultivar | IProduceCultivar;
```

Type guards for narrowing:

```typescript
if (isCannabisBatch(batch)) {
  // TypeScript knows this is ICannabisBatch
  console.log(batch.metrcPackageTag);
}
```

## Workflow Types

### Harvest (`harvest.ts`)

Harvest operation types for both domains:

- `IHarvestRecord` - Base harvest record
- `ICannabisHarvestRecord` - Cannabis harvest with plant IDs, METRC
- `IProduceHarvestRecord` - Produce harvest with method, ripeness
- `IPlant` - Individual plant tracking (cannabis)
- `IPlantLot` - Immature plant lots (cannabis)
- `IDryingRoom` - Drying room management (cannabis)

### Post-Harvest (`post-harvest.ts`)

Processing after harvest:

**Cannabis:**
- `IDryingRecord` - Drying process tracking
- `ICuringRecord` - Curing with burping schedules
- `IPackagingRecord` - Final packaging

**Produce:**
- `IGradingRecord` - Quality grading with distribution
- `IWashingRecord` - Washing/sanitizing
- `ISortingRecord` - Sorting by size/quality

### Waste (`waste.ts`)

Waste management and disposal:

- `IWasteLog` - Base waste log
- `ICannabisWasteLog` - Cannabis waste with mixing ratios, METRC
- `IProduceWasteLog` - Produce waste with composting, donations
- `IWasteMaterial` - Waste material tracking
- `IWasteDisposalMethod` - Disposal method definitions

### Tagging (`tagging.ts`)

Plant tagging (primarily cannabis):

- `IPlantTag` - Individual plant tag
- `ITagAssignment` - Bulk tag assignment
- `ITagBulkOperation` - Tag operations
- `ITagInventory` - Tag inventory management
- `ITagComplianceReport` - Compliance reporting

## Usage Examples

### Creating Domain-Specific Batches

```typescript
import type { ICannabisBatch, IProduceBatch } from '@/unified/types';

const cannabisBatch: ICannabisBatch = {
  domainType: 'cannabis',
  id: '1',
  name: 'Blue Dream Veg 001',
  cultivarId: 'bd-1',
  cultivarName: 'Blue Dream',
  stage: 'vegetative',
  status: 'active',
  podIds: ['pod-veg-1'],
  plantCount: 50,
  // ... cannabis-specific fields
};

const produceBatch: IProduceBatch = {
  domainType: 'produce',
  id: '2',
  name: 'Tomatoes GH-A',
  cultivarId: 'tom-1',
  cultivarName: 'Cherokee Purple',
  stage: 'growing',
  status: 'active',
  growingAreaIds: ['gh-a'],
  plantCount: 200,
  grade: 'grade_a',
  // ... produce-specific fields
};
```

### Type-Safe Processing

```typescript
import type { DomainBatch } from '@/unified/types';
import { isCannabisBatch } from '@/unified/types';

function processBatch(batch: DomainBatch) {
  // Common operations
  console.log(`Processing ${batch.name}`);
  
  // Domain-specific operations
  if (isCannabisBatch(batch)) {
    // TypeScript knows batch is ICannabisBatch
    if (batch.metrcPackageTag) {
      submitToMetrc(batch.metrcPackageTag);
    }
  } else {
    // TypeScript knows batch is IProduceBatch
    if (batch.grade) {
      updateGradeReport(batch.grade);
    }
  }
}
```

### Working with Harvest Records

```typescript
import type { DomainHarvestRecord } from '@/unified/types';
import { isCannabisHarvestRecord } from '@/unified/types';

function recordHarvest(record: DomainHarvestRecord) {
  if (isCannabisHarvestRecord(record)) {
    // Access cannabis-specific fields
    console.log(`Wet weight: ${record.wetWeight}g`);
    console.log(`Drying room: ${record.dryingRoomLocation}`);
  } else {
    // Access produce-specific fields
    console.log(`Harvest method: ${record.harvestMethod}`);
    console.log(`Ripeness: ${record.ripeness}`);
  }
}
```

## Migration from Old Types

### Before (Cannabis)

```typescript
import type { Batch, Pod } from '@/cannabis/types/batch';
import type { Cultivar } from '@/cannabis/types/cultivar';
```

### After (Unified)

```typescript
import type { ICannabisBatch, ICannabisLocation, ICannabisCultivar } from '@/unified/types';
```

### Key Changes

1. **Naming Convention**: All interfaces prefixed with `I`
2. **Domain Discriminator**: All types include `domainType` field
3. **Unified Imports**: Single import path `@/unified/types`
4. **Terminology**: 
   - `strain` → `cultivar`
   - `variety` → `cultivar`
   - `Pod`/`GrowingArea` → `ILocation` (with domain-specific extensions)

## Type Safety Benefits

1. **Compile-Time Checks**: TypeScript ensures correct field access
2. **Discriminated Unions**: Type guards enable safe narrowing
3. **Autocompletion**: Better IDE support with clear types
4. **Refactoring**: Catch breaking changes at compile time
5. **Documentation**: Types serve as living documentation

## Adding New Types

1. Determine if type is domain-specific or shared
2. If shared, add to `domains/base.ts`
3. If domain-specific, add to `domains/cannabis.ts` or `domains/produce.ts`
4. If workflow-specific, create new file or add to existing workflow file
5. Export from `index.ts`
6. Add type guards if using discriminated unions
