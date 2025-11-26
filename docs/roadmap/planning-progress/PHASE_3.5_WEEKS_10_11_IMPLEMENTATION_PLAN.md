# Phase 3.5 Weeks 10-11: Production Batches & Polish

**Status:** Active Development
**Timeline:** November 25, 2025 - Implementation Start
**Note:** Week 9 (Lab Testing Part 2) has been skipped to focus on core production functionality

---

## 📋 Week 10: Production Batch Tracking

### Overview
Track the transformation of harvest packages into final products. This is the final major feature needed for full Metrc compliance.

### 🎯 Goals
- Enable package transformation (split, combine, change product types)
- Track production yields and losses
- Support recipe-based production
- Maintain full chain of custody

### 📊 Database Schema

#### New Tables Required

```sql
-- Production batches table
CREATE TABLE production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL, -- Format: PROD-YYYY-MM-XXXXX
  organization_id UUID NOT NULL REFERENCES organizations(id),
  site_id UUID REFERENCES sites(id),

  -- Production details
  production_type TEXT NOT NULL, -- 'processing', 'extraction', 'infusion', 'packaging'
  recipe_id UUID REFERENCES production_recipes(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT NOT NULL DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'cancelled'

  -- Yield tracking
  expected_yield DECIMAL(10,3),
  actual_yield DECIMAL(10,3),
  yield_variance_reason TEXT,

  -- Metrc sync
  metrc_production_batch_id TEXT,
  metrc_sync_status TEXT DEFAULT 'pending',
  metrc_sync_error TEXT,
  metrc_last_sync TIMESTAMP WITH TIME ZONE,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Input packages (what goes into production)
CREATE TABLE production_batch_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES harvest_packages(id),

  -- Quantities
  quantity_used DECIMAL(10,3) NOT NULL,
  unit_of_measure TEXT NOT NULL,

  -- Tracking
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  added_by UUID REFERENCES users(id)
);

-- Output products (what comes out of production)
CREATE TABLE production_batch_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,

  -- New package created
  package_id UUID REFERENCES harvest_packages(id),
  package_tag TEXT,

  -- Product details
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL, -- 'flower', 'concentrate', 'infused_edible', etc.
  quantity DECIMAL(10,3) NOT NULL,
  unit_of_measure TEXT NOT NULL,

  -- Created at completion
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Production recipes (templates for common productions)
CREATE TABLE production_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  name TEXT NOT NULL,
  description TEXT,
  production_type TEXT NOT NULL,

  -- Expected inputs/outputs
  input_product_types TEXT[], -- Array of expected input types
  output_product_type TEXT NOT NULL,
  expected_yield_percentage DECIMAL(5,2), -- e.g., 20% for extraction

  -- Process parameters
  process_parameters JSONB, -- Temperature, time, methods, etc.

  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 🛠️ Implementation Tasks

#### 1. Database Migration
**File:** `/supabase/migrations/20241126000001_create_production_batches.sql`
- Create all production tables
- Add indexes for performance
- Create trigger for auto-generating batch numbers
- Add RLS policies for organization access

#### 2. Validation Layer
**File:** `/lib/compliance/metrc/validation/production-batch-rules.ts`
```typescript
export function validateProductionBatch(data: ProductionBatchData): ValidationResult
export function validatePackageTransformation(input: PackageData, output: ProductData): ValidationResult
export function validateYieldPercentage(actual: number, expected: number, productType: string): ValidationResult
export function canPackageBeUsedInProduction(packageId: string): ValidationResult
```

#### 3. Sync Service
**File:** `/lib/compliance/metrc/sync/production-batch-sync.ts`
```typescript
export async function createProductionBatch(params: CreateProductionBatchParams): Promise<ProductionBatchResult>
export async function addInputPackages(batchId: string, packages: InputPackage[]): Promise<SyncResult>
export async function completeProduction(batchId: string, outputs: OutputProduct[]): Promise<SyncResult>
export async function adjustInventoryForProduction(batchId: string): Promise<InventoryAdjustment>
```

#### 4. UI Components
**Location:** `/components/features/production/`
- `production-batch-form.tsx` - Create new production batch
- `package-selector.tsx` - Select input packages
- `output-products-form.tsx` - Define output products
- `yield-calculator.tsx` - Calculate and display yields
- `production-dashboard.tsx` - List and manage production batches

#### 5. API Routes
**Location:** `/app/api/production/`
- `/create` - Create new production batch
- `/add-inputs` - Add input packages
- `/complete` - Complete production and create outputs
- `/cancel` - Cancel a production batch

#### 6. Page Components
**Location:** `/app/dashboard/production/`
- `/page.tsx` - Production dashboard
- `/new/page.tsx` - New production form
- `/[id]/page.tsx` - Production detail view

---

## 📋 Week 11: Testing & Polish

### Overview
Final week focused on testing, bug fixes, performance optimization, and polish.

### 🎯 Goals
- Fix all known bugs (including 4 failing transfer tests)
- Achieve 100% test coverage for Phase 3.5
- Optimize performance for production use
- Complete all documentation

### 📝 Testing Priorities

#### 1. Integration Testing
```typescript
// Test full workflows
describe('Production Batch Integration', () => {
  it('should transform flower into concentrate', async () => {})
  it('should handle multi-package inputs', async () => {})
  it('should enforce yield limits', async () => {})
  it('should sync with Metrc correctly', async () => {})
})

describe('Full Cultivation Cycle', () => {
  it('should handle seed to sale workflow', async () => {})
  it('should maintain chain of custody', async () => {})
  it('should enforce all compliance rules', async () => {})
})
```

#### 2. Bug Fixes
- [ ] Fix 4 failing transfer tests from Week 7
- [ ] Address any UI glitches from Weeks 1-8
- [ ] Resolve any Metrc sync edge cases
- [ ] Fix any permission/access issues

#### 3. Performance Optimization
- [ ] Add database indexes for common queries
- [ ] Implement query result caching
- [ ] Optimize batch operations
- [ ] Add pagination for large datasets
- [ ] Implement lazy loading for UI components

#### 4. UI/UX Polish
- [ ] Add loading skeletons for all async operations
- [ ] Improve error messages with actionable guidance
- [ ] Add tooltips and help text throughout
- [ ] Ensure mobile responsiveness
- [ ] Add keyboard shortcuts for power users
- [ ] Implement undo/redo for critical operations

#### 5. Documentation Updates
- [ ] Update API documentation
- [ ] Create user guides for each workflow
- [ ] Document all Metrc sync behaviors
- [ ] Add troubleshooting guides
- [ ] Update implementation summaries

### 🔍 Quality Assurance Checklist

#### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] No console.log statements in production
- [ ] Proper error boundaries implemented
- [ ] Memory leaks checked and fixed

#### Security
- [ ] All inputs validated
- [ ] SQL injection prevention verified
- [ ] XSS protection in place
- [ ] CSRF tokens implemented
- [ ] Rate limiting configured

#### Compliance
- [ ] All Metrc rules enforced
- [ ] Audit logs complete
- [ ] Data retention policies met
- [ ] Privacy requirements satisfied

#### Performance
- [ ] Page load times < 2 seconds
- [ ] API response times < 500ms
- [ ] Database queries optimized
- [ ] Bundle size minimized

---

## 🚀 Implementation Strategy

### Day-by-Day Plan

#### Week 10 (Production Batches)
**Day 1-2:** Database & Backend
- Create migration files
- Implement validation rules
- Build sync services
- Create API routes

**Day 3-4:** UI Implementation
- Build production forms
- Create dashboard components
- Implement package selectors
- Add yield calculators

**Day 5:** Integration & Testing
- Connect UI to backend
- Write integration tests
- Test Metrc sync
- Fix immediate issues

#### Week 11 (Polish)
**Day 1:** Bug Fixing
- Fix failing tests
- Address known issues
- Handle edge cases

**Day 2:** Performance
- Add indexes
- Optimize queries
- Implement caching
- Profile and optimize

**Day 3:** UI Polish
- Add loading states
- Improve error messages
- Enhance responsiveness
- Add help text

**Day 4:** Testing
- Complete test coverage
- Run full integration suite
- Performance testing
- Security audit

**Day 5:** Documentation & Deployment Prep
- Update all docs
- Create deployment checklist
- Final review
- Prepare release notes

---

## ✅ Success Criteria

### Week 10 Success Metrics
- [ ] Production batch creation working
- [ ] Package transformation functional
- [ ] Yield tracking accurate
- [ ] Inventory properly adjusted
- [ ] Basic Metrc sync operational

### Week 11 Success Metrics
- [ ] All tests passing (100%)
- [ ] Zero TypeScript errors
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] Production ready

### Overall Phase 3.5 Completion
- [ ] All 8 critical gaps addressed (7 done, 1 in progress)
- [ ] Full Metrc compliance achieved
- [ ] End-to-end workflows tested
- [ ] System ready for production use

---

## 📚 Reference Documents

- [Phase 3.5 Roadmap](./PHASE_3.5_ROADMAP.md)
- [Week 8 Implementation](../../compliance/WEEK_8_LAB_TESTING_COMPLETE.md)
- [Current State](../../compliance/CURRENT_STATE.md)
- [Metrc API Documentation](https://api-ca.metrc.com/Documentation)

---

**Implementation Lead:** Claude (Anthropic)
**Status:** Ready to Begin
**Estimated Completion:** 2 weeks from start