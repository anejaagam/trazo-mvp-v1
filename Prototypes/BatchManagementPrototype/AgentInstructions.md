# Agent Instructions: Batch Management Prototype - Domain Unification

## Mission Statement
Transform the existing cannabis-specific batch management prototype into a unified system supporting both cannabis and produce domains, maintaining functional completeness while preparing clean interfaces for backend integration.

## Core Principles
1. **Domain Parity**: Ensure both cannabis and produce have equal functionality with domain-specific extensions
2. **No Duplication**: Use composition and configuration over separate implementations
3. **Clean Interfaces**: Prepare all service boundaries for future backend integration
4. **Maintain Functionality**: All existing features must continue working throughout refactoring
5. **Documentation First**: Update documentation as you make changes, not after

## Technical Context
- **Framework**: React 18+ with TypeScript
- **State Management**: Local state + React Context (no Redux/Zustand)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library
- **Backend Preparation**: Service interfaces with localStorage implementations

## Domain Model Architecture

### Base Type Structure
```typescript
// Every domain-specific type should extend from base interfaces
IBatch (base) → ICannabisBatch | IProduceBatch
ILocation (base) → ICannabisLocation | IProduceLocation  
ICultivar (base) → ICannabisCultivar | IProduceCultivar
IQualityMetric (base) → Domain-specific metrics
```

### Domain Configuration
```typescript
type DomainType = 'cannabis' | 'produce';
type DomainConfig = {
  domain: DomainType;
  terminology: TerminologyMap;
  stages: StageProgression[];
  qualityMetrics: QualityMetricDefinition[];
  validationRules: ValidationRule[];
};
```

## Step-by-Step Execution Guide

### Phase 1: Foundation Setup
1. **Start with type system**
   - Create `src/types/domains/` directory
   - Define base interfaces first
   - Extend with domain-specific types
   - Use discriminated unions with `domainType` field

2. **Implement Domain Context**
   ```typescript
   // contexts/DomainContext.tsx
   - Create context with domain configuration
   - Add provider that reads from environment/localStorage
   - Export useDomain() hook
   - Add development-only toggle component
   ```

3. **Refactor existing types**
   - Global find/replace: "strain" → "cultivar"
   - Update all interfaces to extend base types
   - Add domainType discriminator to all entities

### Phase 2: Service Layer
1. **Create service interfaces**
   ```typescript
   // services/BatchService.ts
   interface IBatchService {
     create(batch: DomainBatch): Promise<DomainBatch>;
     update(id: string, updates: Partial<DomainBatch>): Promise<DomainBatch>;
     delete(id: string): Promise<void>;
     getByDomain(domain: DomainType): Promise<DomainBatch[]>;
   }
   ```

2. **Implement localStorage adapters**
   - Maintain backward compatibility with existing data
   - Add migration logic for old data structure
   - Use consistent key naming: `trazo_${domain}_${entity}`

### Phase 3: Component Updates

#### Component Refactoring Strategy
```typescript
// BEFORE (Cannabis-specific)
const BatchModal = ({ batch, strainOptions }) => {
  return <input label="Strain" value={batch.strain} />;
};

// AFTER (Domain-aware)
const BatchModal = ({ batch }) => {
  const { domain, config } = useDomain();
  return (
    <DomainField
      field="cultivar"
      label={config.terminology.cultivar}
      value={batch.cultivar}
      domain={domain}
    />
  );
};
```

#### Key Components to Update
1. **BatchManagement.tsx**
   - Add domain filtering to batch list
   - Update create batch to include domainType
   - Adapt filters based on domain

2. **BatchModal.tsx**
   - Create field configuration based on domain
   - Use DomainFieldRenderer for dynamic fields
   - Add domain-specific validation

3. **BatchTable.tsx**
   - Dynamic columns based on domain
   - Domain-specific formatting
   - Adapted action buttons

### Phase 4: Feature Implementation

#### Cannabis Features to Preserve
- Mother/Clone management
- Drying/Curing stages
- THC/CBD/Terpene tracking
- Metrc tag placeholders
- Testing requirements

#### Produce Features to Add
```typescript
// New produce-specific features
interface IProduceFeatures {
  grading: GradeType; // A, B, C or custom
  ripeness: RipenessScale; // 1-10 or stages
  harvestWindow: DateRange;
  storageRequirements: {
    temperature: Range;
    humidity: Range;
    atmosphere?: 'controlled' | 'regular';
  };
  shelfLife: Duration;
}
```

### Phase 5: Workflow Implementation

#### Workflow Validation Rules
```typescript
// Each domain has different stage progression rules
const cannabisRules: ValidationRule[] = [
  { from: 'vegetative', to: ['flowering'], required: ['lightChange'] },
  { from: 'flowering', to: ['harvesting'], required: ['trichomeCheck'] },
  { from: 'drying', to: ['curing'], minDuration: days(7) },
];

const produceRules: ValidationRule[] = [
  { from: 'growing', to: ['harvesting'], required: ['ripenessCheck'] },
  { from: 'harvesting', to: ['grading', 'storage'], required: [] },
  { from: 'storage', to: ['packaging'], maxDuration: days(30) },
];
```

### Phase 6: Testing Strategy

#### Test File Structure
```
tests/
  unit/
    domains/
      cannabis.test.ts
      produce.test.ts
      shared.test.ts
  integration/
    workflows/
      cannabisFlow.test.ts
      produceFlow.test.ts
  fixtures/
    mockCannabis.ts
    mockProduce.ts
```

#### Critical Test Cases
```typescript
describe('Domain Switching', () => {
  test('Cannabis domain shows correct fields');
  test('Produce domain shows correct fields');
  test('Domain persists across page reload');
  test('Mock data matches domain');
});

describe('Batch Operations', () => {
  test('Create batch with domain-specific fields');
  test('Update preserves domain type');
  test('Delete removes from correct domain store');
});
```

### Phase 7: Documentation Requirements

#### README.md Structure
```markdown
# Batch Management Prototype

## Architecture Overview
- Domain model explanation
- Component hierarchy
- Service layer design

## Domain Configuration
- How to set domain
- Available domains and differences
- Configuration options

## API Interfaces
- Service contracts
- Expected backend endpoints
- Data models

## Integration Guide
- Current mock implementations
- Migration to real backend
- Compliance engine hooks

## Development
- Setup instructions
- Testing domains
- Adding new domains
```

## Code Quality Standards

### TypeScript Requirements
- Strict mode enabled
- No `any` types except documented exceptions
- All props interfaces defined
- Discriminated unions for domain types

### Component Standards
```typescript
// Every component should follow this pattern
interface DomainAwareComponentProps {
  // Common props
}

const DomainAwareComponent: FC<Props> = (props) => {
  const { domain, config } = useDomain();
  
  // Domain-specific logic
  const renderContent = () => {
    switch(domain) {
      case 'cannabis':
        return <CannabisSpecific />;
      case 'produce':
        return <ProduceSpecific />;
      default:
        return <SharedContent />;
    }
  };
  
  return renderContent();
};
```

## Common Pitfalls to Avoid

1. **Don't duplicate components** - Use composition and configuration
2. **Don't hardcode domain checks** - Use configuration objects
3. **Don't mix domains in storage** - Keep separate keys/namespaces
4. **Don't assume cannabis defaults** - Make everything explicitly domain-aware
5. **Don't break existing flows** - Test continuously during refactoring

## Validation Checklist

### Before Starting Each Phase
- [ ] Current functionality documented
- [ ] Tests written for existing behavior
- [ ] Branch created for phase work
- [ ] Dependencies identified

### After Completing Each Phase
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Documentation updated
- [ ] Manual testing completed
- [ ] Code reviewed for patterns

### Final Validation
- [ ] Cannabis full workflow works end-to-end
- [ ] Produce full workflow works end-to-end  
- [ ] Domain switching works (dev mode)
- [ ] All CRUD operations functional
- [ ] Service interfaces properly abstracted
- [ ] Documentation complete
- [ ] No console errors/warnings
- [ ] LocalStorage data structure correct

## Handoff Requirements

### For Integration Agent
1. **Service Interfaces Document**
   - All method signatures
   - Expected backend responses
   - Error handling patterns

2. **Data Migration Guide**
   - Current localStorage structure
   - Target database schema
   - Migration scripts needed

3. **Compliance Integration Points**
   - Where compliance checks occur
   - Data needed for compliance
   - Expected compliance service interface

4. **Known Limitations**
   - Features not implemented
   - Temporary workarounds
   - Technical debt items

## Success Metrics

- ✅ Both domains fully functional
- ✅ No regression in cannabis features
- ✅ Produce features at parity
- ✅ Clean service boundaries
- ✅ Comprehensive test coverage
- ✅ Complete documentation
- ✅ Zero TypeScript errors
- ✅ Consistent UI/UX across domains

## Emergency Rollback

If refactoring breaks critical functionality:
1. Git stash current changes
2. Revert to last working commit
3. Create smaller incremental changes
4. Test each change thoroughly
5. Commit working increments frequently

## Questions Decision Tree

```
Domain-specific feature?
├─ Yes → Check domain config first
│   └─ Implement with configuration
└─ No → Implement in base/shared

New field needed?
├─ Cannabis only → Add to ICannabisBatch
├─ Produce only → Add to IProduceBatch
└─ Both → Add to IBatch base

Component needs domain logic?
├─ Minor differences → Use config
├─ Major differences → Use composition
└─ Completely different → Consider separate components
```

## Final Notes

- Prioritize working software over perfect architecture
- Document decisions and TODOs for integration agent
- Keep mock data realistic but simple
- Test with both domains frequently
- When in doubt, choose the more flexible solution