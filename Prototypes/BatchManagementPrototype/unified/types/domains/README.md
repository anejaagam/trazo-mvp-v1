# Unified Type System

This directory contains the core type system for the unified batch management prototype.

## Architecture

The type system uses a **base + extension** pattern with discriminated unions for type safety:

```
base.ts (shared interfaces)
  ├─ cannabis.ts (cannabis extensions)
  └─ produce.ts (produce extensions)
```

## Base Types (`base.ts`)

Core interfaces that all domains extend:

- `IBatch` - Base batch interface
- `ILocation` - Base location/growing area interface  
- `ICultivar` - Base cultivar/variety interface
- `IBatchGenealogy` - Genealogy/lineage tracking
- `IBatchGroup` - Batch grouping
- `ITimelineEvent` - Event logging
- `IBatchMetrics` - Environmental metrics
- `IQualityMetric` - Quality measurements
- `IYieldData` - Harvest yield tracking

## Domain-Specific Types

### Cannabis (`cannabis.ts`)

Extends base types with cannabis-specific features:

- `ICannabisBatch` - Adds METRC tags, mother plant tracking, lighting schedules
- `ICannabisLocation` - Adds room types (mother, clone, veg, flower, etc.), canopy area, lighting
- `ICannabisCultivar` - Adds strain types, genetics, THC/CBD ranges, terpenes
- `ICannabisYieldData` - Adds wet/dry weight, potency results, grade breakdown
- Plus: Plant tags, test results, waste records

### Produce (`produce.ts`)

Extends base types with produce-specific features:

- `IProduceBatch` - Adds grading, ripeness, harvest windows, food safety compliance
- `IProduceLocation` - Adds area types (greenhouse, field, etc.), climate control, irrigation
- `IProduceCultivar` - Adds produce categories, flavor profiles, storage life
- `IProduceYieldData` - Adds grade distribution, size distribution
- Plus: Quality inspections, storage conditions, harvest records, food safety events

## Discriminated Unions

All domain types include a `domainType` discriminator field:

```typescript
type DomainBatch = ICannabisBatch | IProduceBatch;
type DomainLocation = ICannabisLocation | IProduceLocation;
type DomainCultivar = ICannabisCultivar | IProduceCultivar;
```

## Type Guards

Use type guards to narrow union types:

```typescript
if (isCannabisBatch(batch)) {
  // TypeScript knows batch is ICannabisBatch
  console.log(batch.metrcPackageTag);
}

if (isProduceBatch(batch)) {
  // TypeScript knows batch is IProduceBatch
  console.log(batch.grade);
}
```

## Usage Examples

### Creating a Cannabis Batch

```typescript
const cannabisBatch: ICannabisBatch = {
  id: '1',
  domainType: 'cannabis',
  name: 'Blue Dream - VEG-001',
  cultivarId: 'strain-1',
  cultivarName: 'Blue Dream',
  stage: 'vegetative',
  status: 'active',
  startDate: '2024-01-01',
  createdAt: '2024-01-01T00:00:00Z',
  podIds: ['pod-veg-1'],
  plantCount: 50,
  quarantineStatus: 'none',
  metrcPackageTag: 'METRC123456'
};
```

### Creating a Produce Batch

```typescript
const produceBatch: IProduceBatch = {
  id: '1',
  domainType: 'produce',
  name: 'Heirloom Tomatoes - GH-001',
  cultivarId: 'variety-1',
  cultivarName: 'Cherokee Purple',
  stage: 'growing',
  status: 'active',
  startDate: '2024-01-01',
  createdAt: '2024-01-01T00:00:00Z',
  growingAreaIds: ['gh-1'],
  plantCount: 200,
  quarantineStatus: 'none',
  grade: 'grade_a',
  ripeness: 'mature'
};
```

### Type-Safe Domain Handling

```typescript
function processBatch(batch: DomainBatch) {
  // Common operations work on all batches
  console.log(`Processing ${batch.name}`);
  
  // Domain-specific logic with type safety
  if (isCannabisBatch(batch)) {
    // Cannabis-specific operations
    if (batch.metrcPackageTag) {
      submitToMetrc(batch.metrcPackageTag);
    }
  } else if (isProduceBatch(batch)) {
    // Produce-specific operations
    if (batch.grade) {
      updateGradeReport(batch.grade);
    }
  }
}
```

## Benefits

1. **Type Safety** - TypeScript ensures you only access valid fields for each domain
2. **Code Reuse** - Shared logic works on base interfaces
3. **Extensibility** - Easy to add new domains or extend existing ones
4. **Documentation** - Types serve as living documentation
5. **Refactoring** - Compiler catches breaking changes

## Adding a New Domain

1. Create `unified/types/domains/newdomain.ts`
2. Define domain-specific stage types
3. Extend base interfaces (IBatch, ILocation, ICultivar)
4. Add `domainType: 'newdomain'` to all interfaces
5. Export from `index.ts`
6. Add type guards and update discriminated unions
7. Update `DomainType` in `base.ts`
