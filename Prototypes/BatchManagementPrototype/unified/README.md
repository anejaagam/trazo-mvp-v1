# Trazo Unified Batch Management System

**Version**: 1.0  
**Last Updated**: November 12, 2025  
**Status**: Integration Ready (Backend Required)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Domain Model](#domain-model)
4. [Getting Started](#getting-started)
5. [Component Library](#component-library)
6. [Service Layer](#service-layer)
7. [State Management](#state-management)
8. [Validation System](#validation-system)
9. [Integration Guide](#integration-guide)
10. [Development](#development)

---

## Overview

The Unified Batch Management System is a **domain-agnostic** batch tracking platform that supports both **cannabis cultivation** (METRC compliance) and **produce farming** (food safety) through a single, adaptive codebase.

### Key Features

- ✅ **Dual-Domain Support**: Cannabis and produce with shared core, domain-specific extensions
- ✅ **Type-Safe Architecture**: Full TypeScript with discriminated unions
- ✅ **Service Abstraction**: Clean interfaces ready for backend integration
- ✅ **Comprehensive Workflows**: Complete stage progressions for both domains
- ✅ **Built-in Validation**: Business rule enforcement at every level
- ✅ **localStorage Persistence**: Prototype data layer (replace with API)

### Domain Comparison

| Feature | Cannabis | Produce |
|---------|----------|---------|
| **Terminology** | Strain → Cultivar | Variety → Cultivar |
| **Location** | Pod/Room | Growing Area |
| **Stages** | 9 (propagation → packaging) | 14 (seeding → distribution) |
| **Min Quantity** | 0.1g (METRC precision) | 5g (food safety) |
| **Compliance** | METRC tags, testing | GAP/Organic certs, traceability |
| **Special Features** | Mother plants, clones, curing | Grading, ripeness, cold storage |

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Unified App (App.tsx)                   │
│                   DomainProvider Context                     │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴──────────┐
         ▼                      ▼
┌──────────────────┐    ┌──────────────────┐
│  Cannabis Mode   │    │   Produce Mode   │
│  - 9 stages      │    │   - 14 stages    │
│  - METRC tags    │    │   - Grading      │
│  - Testing       │    │   - Cold storage │
└────────┬─────────┘    └─────────┬────────┘
         │                        │
         └───────────┬────────────┘
                     ▼
         ┌───────────────────────┐
         │   Unified Services    │
         │  - BatchService       │
         │  - QualityService     │
         │  - ComplianceService  │
         └───────────┬───────────┘
                     ▼
         ┌───────────────────────┐
         │  Data Persistence     │
         │  - localStorage (now) │
         │  - API (future)       │
         └───────────────────────┘
```

### Directory Structure

```
unified/
├── App.tsx                      # Main application entry
├── main.tsx                     # React root
├── components/                  # UI Components (32 total)
│   ├── BatchManagement.tsx      # Main batch CRUD interface
│   ├── BatchModal.tsx           # Create/Edit batch
│   ├── BatchTable.tsx           # Batch listing with domain columns
│   ├── DomainToggle.tsx         # Dev tool for switching domains
│   ├── DomainFieldRenderer.tsx  # Dynamic form fields
│   ├── StageTransitionModal.tsx # Workflow stage changes
│   │
│   ├── Cannabis-Specific/
│   │   ├── DryingCuringTracking.tsx
│   │   ├── CannabisTestingIntegration.tsx
│   │   ├── MetrcTagManagement.tsx
│   │   └── CannabisCompliancePlaceholders.tsx
│   │
│   ├── Produce-Specific/
│   │   ├── GradingSystem.tsx
│   │   ├── RipenessTracking.tsx
│   │   ├── HarvestWindowPredictions.tsx
│   │   ├── ColdStorageManagement.tsx
│   │   └── ProducePackaging.tsx
│   │
│   ├── Shared-Features/
│   │   ├── BatchSplitting.tsx
│   │   ├── BatchMerging.tsx
│   │   ├── LocationTransfer.tsx
│   │   ├── WasteTracking.tsx
│   │   └── QuarantineManagement.tsx
│   │
│   └── Workflow-Orchestration/
│       ├── CannabisWorkflowManager.tsx
│       ├── ProduceWorkflowManager.tsx
│       ├── CannabisFlowDemo.tsx
│       ├── ProduceFlowDemo.tsx
│       └── ValidationDemo.tsx
│
├── contexts/
│   └── DomainContext.tsx        # Domain state provider
│
├── hooks/
│   ├── useBatches.ts            # Batch CRUD operations
│   ├── useValidation.ts         # Validation rules access
│   └── index.ts                 # Hook exports
│
├── services/
│   ├── BatchService.ts          # IBatchService + localStorage impl
│   ├── QualityService.ts        # IQualityService interface
│   └── ComplianceService.ts     # IComplianceService interface
│
├── lib/
│   └── validations.ts           # Business rule library
│
├── config/
│   ├── domainConfig.ts          # Domain terminology & features
│   └── stageProgressions.ts    # Workflow stage rules
│
├── types/
│   └── domains/
│       ├── base.ts              # IBatch, ILocation, ICultivar
│       ├── cannabis.ts          # Cannabis-specific extensions
│       ├── produce.ts           # Produce-specific extensions
│       └── index.ts             # Discriminated unions
│
└── data/
    ├── mockData/
    │   ├── cannabis.ts          # Cannabis sample data
    │   ├── produce.ts           # Produce sample data
    │   └── shared.ts            # Common entities
    └── MockDataProvider.ts      # Data access layer
```

---

## Domain Model

### Type System Architecture

The system uses **discriminated unions** with a `domainType` field for type safety:

```typescript
// Base interface (shared)
export interface IBatch {
  id: string;
  domainType: 'cannabis' | 'produce';  // Discriminator
  name: string;
  cultivarId: string;
  cultivarName: string;
  stage: string;
  status: BatchStatus;
  plantCount: number;
  startDate: string;
  locationIds: string[];
  quarantineStatus: QuarantineStatus;
  createdAt: string;
  updatedAt: string;
}

// Cannabis extension
export interface ICannabisBatch extends IBatch {
  domainType: 'cannabis';  // Literal type
  stage: CannabisStage;
  metrcPackageTag?: string;
  lightingSchedule?: string;
  motherPlantId?: string;
  thcContent?: number;
  cbdContent?: number;
  terpeneProfile?: string;
}

// Produce extension
export interface IProduceBatch extends IBatch {
  domainType: 'produce';  // Literal type
  stage: ProduceStage;
  grade?: ProduceGrade;
  ripeness?: RipenessLevel;
  gapCertified?: boolean;
  organicCertified?: boolean;
  harvestWindow?: { start: string; end: string };
}

// Discriminated union
export type DomainBatch = ICannabisBatch | IProduceBatch;
```

### Type Guards

```typescript
export function isCannabisBatch(batch: DomainBatch): batch is ICannabisBatch {
  return batch.domainType === 'cannabis';
}

export function isProduceBatch(batch: DomainBatch): batch is IProduceBatch {
  return batch.domainType === 'produce';
}

// Usage in components:
const MyComponent = ({ batch }: { batch: DomainBatch }) => {
  if (isCannabisBatch(batch)) {
    // TypeScript knows batch is ICannabisBatch
    return <div>{batch.metrcPackageTag}</div>;
  } else {
    // TypeScript knows batch is IProduceBatch
    return <div>{batch.grade}</div>;
  }
};
```

### Stage Progressions

**Cannabis** (9 stages):
```
propagation → vegetative → flowering → harvest → 
drying → curing → testing → packaging → closed
```

**Produce** (14 stages):
```
seeding → germination → seedling → transplant → 
growing → pre_harvest → harvest → washing → 
sorting → grading → ripening → storage → 
packaging → closed
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server (unified app)
npm run dev

# Access app
# → http://localhost:5173/unified.html
```

### Domain Configuration

The domain is set via environment variable or localStorage:

```bash
# Option 1: Environment variable (.env file)
VITE_DOMAIN_TYPE=cannabis  # or 'produce'

# Option 2: Use DomainToggle component (development only)
# Click the toggle in the top-right corner
```

### First Steps

1. **Load the app**: Navigate to `/unified.html`
2. **Create a batch**: Click "Create Batch" button
3. **Select cultivar**: Choose from dropdown (mock data)
4. **View workflows**: Switch to "Workflows" tab
5. **Test transitions**: Move batches through stages
6. **Toggle domains**: Use DomainToggle to switch (dev mode)

---

## Component Library

### Core Components

#### BatchManagement
Main CRUD interface for batches.

```tsx
import { BatchManagement } from './components/BatchManagement';

<BatchManagement />
```

**Features**:
- Create/edit/delete batches
- Filter by status, stage, search
- Stats dashboard (active, quarantined, total)
- Domain-aware table columns

#### BatchModal
Create or edit batch with domain-specific fields.

```tsx
<BatchModal
  isOpen={true}
  onClose={() => setOpen(false)}
  onSave={async (batch) => await createBatch(batch)}
  mode="create"  // or "edit"
  batch={existingBatch}  // for edit mode
/>
```

**Dynamic Fields**:
- Cannabis: METRC tag, lighting schedule, mother plant
- Produce: Grade, ripeness, GAP/Organic certified
- Common: Name, cultivar, plant count, dates

#### StageTransitionModal
Move batch to next stage with validation.

```tsx
<StageTransitionModal
  batch={batch}
  isOpen={true}
  onClose={() => setOpen(false)}
  onTransition={async (newStage) => await updateBatch(batch.id, { stage: newStage })}
/>
```

**Validation**:
- Checks allowed stage transitions
- Enforces minimum durations
- Requires stage-specific fields

### Cannabis Components

#### DryingCuringTracking
Track drying room conditions and curing progress.

```tsx
<DryingCuringTracking
  batch={cannabisBatch}
  onUpdate={(data) => console.log('Drying data', data)}
/>
```

**Tracks**:
- Temperature, humidity, airflow
- Drying duration (7-21 days)
- Curing burp schedule
- Quality observations

#### CannabisTestingIntegration
Record lab test results (THC/CBD/terpenes/contaminants).

```tsx
<CannabisTestingIntegration
  batch={cannabisBatch}
  onSubmit={(results) => console.log('Test results', results)}
/>
```

#### MetrcTagManagement
Manage METRC package tags for compliance.

```tsx
<MetrcTagManagement
  batch={cannabisBatch}
  onAssignTag={(tag) => console.log('Assigned tag', tag)}
/>
```

### Produce Components

#### GradingSystem
Grade produce batches (A/B/C/Premium).

```tsx
<GradingSystem
  batch={produceBatch}
  onGrade={(gradeData) => console.log('Grading', gradeData)}
/>
```

**Grading Factors**:
- Size uniformity
- Color consistency
- Defect inspection
- Brix (sugar content)

#### RipenessTracking
Monitor ripeness progression.

```tsx
<RipenessTracking
  batch={produceBatch}
  onUpdate={(ripeness) => console.log('Ripeness', ripeness)}
/>
```

#### ColdStorageManagement
Track storage conditions and shelf life.

```tsx
<ColdStorageManagement
  batch={produceBatch}
  onUpdate={(storage) => console.log('Storage', storage)}
/>
```

### Shared Components

#### BatchSplitting
Divide batch into multiple smaller batches.

```tsx
<BatchSplitting
  batch={batch}
  onSplitBatch={(splitData) => console.log('Split', splitData)}
/>
```

**Validation**:
- Minimum quantities (0.1g cannabis, 5g produce)
- Total must equal original
- 2-20 splits allowed

#### BatchMerging
Combine multiple batches into one.

```tsx
<BatchMerging
  availableBatches={batches}
  onMergeBatches={(mergeData) => console.log('Merge', mergeData)}
/>
```

**Validation**:
- Same domain, cultivar, stage
- Not quarantined
- 2-50 batches max

#### WasteTracking
Record and track waste disposal (regulatory compliance).

```tsx
<WasteTracking
  batch={batch}
  onRecordWaste={(waste) => console.log('Waste', waste)}
/>
```

#### QuarantineManagement
Quarantine batches for quality issues.

```tsx
<QuarantineManagement
  batch={batch}
  action="quarantine"  // or "release"
  onSubmit={(data) => console.log('Quarantine', data)}
/>
```

### Workflow Components

#### CannabisWorkflowManager
Orchestrates complete cannabis workflows.

```tsx
<CannabisWorkflowManager
  batches={cannabisBatches}
  onStageTransition={(batchId, newStage) => updateBatch(batchId, { stage: newStage })}
  onOpenComponent={(component, batch) => console.log('Open', component)}
/>
```

**Workflows**:
1. Propagation to Flowering (3 stages)
2. Harvest & Processing (5 stages)
3. Post-Harvest Compliance (2 stages)

#### ProduceWorkflowManager
Orchestrates complete produce workflows.

```tsx
<ProduceWorkflowManager
  batches={produceBatches}
  onStageTransition={(batchId, newStage) => updateBatch(batchId, { stage: newStage })}
  onOpenComponent={(component, batch) => console.log('Open', component)}
/>
```

**Workflows**:
1. Cultivation Cycle (4 stages)
2. Post-Harvest Processing (4 stages)
3. Cold Storage & Distribution (4 stages)

---

## Service Layer

### IBatchService

Complete CRUD interface for batch operations.

```typescript
export interface IBatchService {
  getAll(domain: DomainType): Promise<DomainBatch[]>;
  getById(id: string): Promise<DomainBatch | null>;
  create(batch: DomainBatch): Promise<DomainBatch>;
  update(id: string, updates: Partial<DomainBatch>): Promise<DomainBatch>;
  delete(id: string): Promise<void>;
  
  getByStage(domain: DomainType, stage: string): Promise<DomainBatch[]>;
  getByLocation(locationId: string): Promise<DomainBatch[]>;
  getByCultivar(cultivarId: string): Promise<DomainBatch[]>;
  getByGroup(groupId: string): Promise<DomainBatch[]>;
  
  transitionStage(id: string, newStage: string): Promise<DomainBatch>;
  quarantine(id: string, reason: string, by: string): Promise<DomainBatch>;
  releaseFromQuarantine(id: string, by: string): Promise<DomainBatch>;
}
```

**Current Implementation**: `LocalStorageBatchService`  
**Production Target**: `APIBatchService` (see Integration Guide)

### Usage

```typescript
import { createBatchService } from './services/BatchService';

const batchService = createBatchService();

// Get all cannabis batches
const cannabisBatches = await batchService.getAll('cannabis');

// Create new batch
const newBatch = await batchService.create({
  domainType: 'cannabis',
  name: 'Batch-001',
  cultivarId: 'cult-1',
  // ...
});

// Update batch
const updated = await batchService.update('batch-id', {
  stage: 'flowering'
});

// Transition stage
const transitioned = await batchService.transitionStage('batch-id', 'harvest');
```

---

## State Management

### useBatches Hook

Domain-aware batch management with filtering and CRUD.

```typescript
const {
  batches,           // Current domain batches
  loading,          // Loading state
  error,            // Error message
  
  createBatch,      // Create new batch
  updateBatch,      // Update existing batch
  deleteBatch,      // Delete batch
  
  transitionStage,  // Move to next stage
  quarantineBatch,  // Quarantine batch
  releaseFromQuarantine,  // Release from quarantine
  
  applyFilters,     // Filter batches
  clearFilters,     // Clear filters
  refresh,          // Reload data
} = useBatches();
```

**Filtering**:

```typescript
applyFilters({
  status: 'active',
  stage: 'flowering',
  cultivarId: 'cult-1',
  search: 'Batch-001',
});
```

### useDomain Hook

Access current domain configuration.

```typescript
const { domain, config } = useDomain();

// domain: 'cannabis' | 'produce'
// config: {
//   name: 'Cannabis' | 'Produce',
//   terminology: { cultivar: 'Strain' | 'Variety', ... },
//   features: { ... },
//   units: { ... },
// }
```

---

## Validation System

### Business Rules

Comprehensive validation library in `lib/validations.ts`:

```typescript
import {
  validateQuantity,
  validateStageTransition,
  validateHarvestDate,
  validateLocationCapacity,
  validateBatchMergeCompatibility,
} from './lib/validations';

// Quantity validation
const result = validateQuantity(domain, 0.05, 'grams', 'split');
// {
//   isValid: false,
//   errors: ['Minimum quantity for split is 0.1 grams'],
//   warnings: []
// }

// Stage transition validation
const transition = validateStageTransition(
  domain,
  'vegetative',
  'flowering',
  batch
);
// Checks: allowed progression, minimum duration, required fields
```

### React Hooks

```typescript
import { useValidation } from './hooks/useValidation';

const {
  validateQuantity,
  validateStageTransition,
  validateHarvest,
  validatePackaging,
  validateStorage,
  validatePlantCapacity,
  validateArea,
  validateMerge,
  validateSplit,
} = useValidation();
```

**Usage in Forms**:

```typescript
const handleSubmit = () => {
  const validation = validateQuantity(quantity, operation);
  
  if (!validation.isValid) {
    setErrors(validation.errors);
    return;
  }
  
  if (validation.warnings.length > 0) {
    showWarnings(validation.warnings);
  }
  
  // Proceed with submission
};
```

---

## Integration Guide

### Backend Integration Points

#### 1. Replace LocalStorage with API

**Current**:
```typescript
export class LocalStorageBatchService implements IBatchService {
  async getAll(domain: DomainType): Promise<DomainBatch[]> {
    const key = domain === 'cannabis' ? 'trazo_cannabis_batches' : 'trazo_produce_batches';
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
}
```

**Target**:
```typescript
export class APIBatchService implements IBatchService {
  async getAll(domain: DomainType): Promise<DomainBatch[]> {
    const response = await fetch(`/api/v1/batches?domain=${domain}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
  
  async create(batch: DomainBatch): Promise<DomainBatch> {
    const response = await fetch('/api/v1/batches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(batch)
    });
    return response.json();
  }
}
```

**Change Required**: Update `services/BatchService.ts` line 206:
```typescript
// OLD:
export function createBatchService(): IBatchService {
  return new LocalStorageBatchService();
}

// NEW:
export function createBatchService(): IBatchService {
  return new APIBatchService(process.env.VITE_API_URL);
}
```

#### 2. Expected API Endpoints

```
GET    /api/v1/batches?domain={domain}&stage={stage}&status={status}
GET    /api/v1/batches/:id
POST   /api/v1/batches
PUT    /api/v1/batches/:id
DELETE /api/v1/batches/:id

GET    /api/v1/cultivars?domain={domain}
GET    /api/v1/locations?domain={domain}

POST   /api/v1/batches/:id/transition
POST   /api/v1/batches/:id/quarantine
POST   /api/v1/batches/:id/release

GET    /api/v1/quality-reports?batchId={id}
POST   /api/v1/quality-reports

GET    /api/v1/compliance/cannabis/metrc-tags
POST   /api/v1/compliance/cannabis/test-results
POST   /api/v1/compliance/produce/grading
```

#### 3. Data Models

All API responses should match TypeScript interfaces in `types/domains/`:

```typescript
// Example API response for GET /api/v1/batches/:id
{
  "id": "batch-123",
  "domainType": "cannabis",
  "name": "Batch-001",
  "cultivarId": "cult-1",
  "cultivarName": "Blue Dream",
  "stage": "flowering",
  "status": "active",
  "plantCount": 50,
  "startDate": "2025-01-15T00:00:00Z",
  "locationIds": ["pod-1"],
  "quarantineStatus": "none",
  "metrcPackageTag": "1A4060300000001000000000",
  "lightingSchedule": "12/12",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-02-01T14:30:00Z"
}
```

#### 4. Authentication

Add auth context and token management:

```typescript
// contexts/AuthContext.tsx (NEW FILE)
export const AuthProvider: React.FC = ({ children }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );
  
  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Update App.tsx:
export default function App() {
  return (
    <AuthProvider>
      <DomainProvider>
        <UnifiedAppContent />
      </DomainProvider>
    </AuthProvider>
  );
}
```

#### 5. Compliance Integration

**METRC Integration** (Cannabis):
```typescript
// services/ComplianceService.ts
export interface IComplianceService {
  // METRC tag management
  getAvailableTags(): Promise<string[]>;
  assignTag(batchId: string, tag: string): Promise<void>;
  
  // Testing
  submitTestResults(batchId: string, results: TestResults): Promise<void>;
  
  // Reporting
  syncToMetrc(batchId: string): Promise<MetrcSyncResult>;
}
```

**Food Safety** (Produce):
```typescript
export interface IFoodSafetyService {
  // Certifications
  verifyCertification(batchId: string, certType: 'GAP' | 'Organic'): Promise<boolean>;
  
  // Grading
  submitGrading(batchId: string, grade: GradeReport): Promise<void>;
  
  // Traceability
  generateLotNumber(batchId: string): Promise<string>;
}
```

### localStorage Keys

**Current keys** (to be migrated):

```typescript
// Batches
'trazo_cannabis_batches'  // Array<ICannabisBatch>
'trazo_produce_batches'   // Array<IProduceBatch>

// Domain preference
'trazo_domain_preference' // 'cannabis' | 'produce'

// User settings (future)
'trazo_user_settings'     // { theme, locale, etc. }
```

---

## Development

### npm Scripts

```bash
# Development
npm run dev              # Unified app on :5173/unified.html
npm run dev:cannabis     # Cannabis-only on :3002
npm run dev:produce      # Produce-only on :3003

# Build
npm run build            # Production build
npm run build:cannabis   # Cannabis build → dist/cannabis
npm run build:produce    # Produce build → dist/produce

# Testing
npm run test             # Run Vitest
npm run test:watch       # Watch mode
npm run lint             # ESLint check
```

### Environment Variables

Create `.env` file:

```bash
# Domain configuration
VITE_DOMAIN_TYPE=cannabis  # or 'produce'

# API configuration (future)
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=30000

# Feature flags (future)
VITE_ENABLE_COMPLIANCE=true
VITE_ENABLE_ANALYTICS=false
```

### Development Tools

**DomainToggle Component**: Switch domains in real-time (development only)

```tsx
import { DomainToggle } from './components/DomainToggle';

// Already included in unified App.tsx header
<DomainToggle />
```

### Testing Domains

```bash
# Cannabis flow
1. npm run dev
2. Open /unified.html
3. DomainToggle → Cannabis
4. Create batch with strain "Blue Dream"
5. Workflow → Propagation to Flowering
6. Test drying/curing tracking

# Produce flow
1. npm run dev
2. Open /unified.html
3. DomainToggle → Produce
4. Create batch with variety "Romaine"
5. Workflow → Cultivation Cycle
6. Test grading system
```

---

## Production Checklist

Before deploying to production:

### Code
- [ ] Replace LocalStorageBatchService with APIBatchService
- [ ] Add authentication/authorization
- [ ] Implement error boundaries
- [ ] Add loading states to all async operations
- [ ] Remove DomainToggle from production build
- [ ] Add analytics/monitoring

### Data
- [ ] Migrate mock data to database
- [ ] Create seed scripts for demo data
- [ ] Set up database migrations
- [ ] Configure backup strategy

### Security
- [ ] Add CSRF protection
- [ ] Implement rate limiting
- [ ] Validate all user inputs
- [ ] Sanitize outputs
- [ ] Add audit logging

### Performance
- [ ] Optimize bundle size
- [ ] Add code splitting
- [ ] Implement virtual scrolling for large lists
- [ ] Add caching strategy
- [ ] Compress images/assets

### Compliance
- [ ] Integrate METRC API (cannabis)
- [ ] Add food safety reporting (produce)
- [ ] Implement audit trails
- [ ] Add regulatory exports

---

## Support & Resources

### Documentation
- Type System: `docs/TYPE_SYSTEM.md` (see Phase 7.2)
- Components: `docs/COMPONENT_API.md` (see Phase 7.3)
- Integration: `docs/INTEGRATION_GUIDE.md` (see Phase 7.2)

### Code Examples
- See `/unified/components/` for component patterns
- See `/unified/lib/validations.ts` for business rules
- See `/unified/data/mockData/` for data structures

### Architecture Decisions
- Discriminated unions for type safety
- Service interfaces for backend abstraction
- Domain configuration for terminology flexibility
- localStorage as temporary persistence layer

---

**Built with**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI  
**License**: Proprietary  
**Maintainer**: Trazo Development Team
