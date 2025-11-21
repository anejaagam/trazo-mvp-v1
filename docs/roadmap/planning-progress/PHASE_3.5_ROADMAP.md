# Phase 3.5 Roadmap: Cultivation Lifecycle Integration

**Current Date:** November 20, 2024
**Phase 3.5 Progress:** 70% Complete (7 of 10 weeks implemented)
**Current Focus:** [Week 8 - Lab Testing](./PHASE_3.5_WEEK_8_LAB_TESTING.md)

---

## 🎯 Phase 3.5 Implementation Status

### ✅ Completed Weeks (1-7)
*Archived in `docs/project-history/phase-3.5/`*

| Week | Feature | Status |
|------|---------|--------|
| **Week 1** | Batch Push Sync | ✅ Complete |
| **Week 2** | Plant Count Adjustment | ✅ Complete |
| **Week 3** | Growth Phase Transition | ✅ Complete |
| **Week 4** | Plant Tag Management | ✅ Complete |
| **Week 5** | Harvest Management | ✅ Complete |
| **Week 6** | Waste & Destruction | ✅ Complete |
| **Week 7** | Transfer Manifests | ✅ Complete |

### 🔜 Remaining Weeks (8-11)

| Week | Feature | Documentation |
|------|---------|---------------|
| **Week 8** | Lab Testing (COA) | [Active Plan](./PHASE_3.5_WEEK_8_LAB_TESTING.md) |
| **Week 9** | Lab Testing Pt 2 | *Pending* |
| **Week 10** | Production Batch Tracking | *Pending* |
| **Week 11** | Testing & Polish | *Pending* |

---

## 📋 Week 8: Lab Testing Integration - COA Management

### Context from User
> "The users will be sending their products to other labs to be tested, we just upload the reports? COA?"

This means we're building a **document management system** for test results, not a lab testing workflow.

### Requirements

#### 1. COA Document Upload
- **File Types**: PDF, PNG, JPG, JPEG
- **Storage**: Supabase Storage bucket for COAs
- **Metadata**: Test date, lab name, test types
- **Association**: Link to packages and batches

#### 2. Test Result Extraction
- **Status**: Pass/Fail/Pending
- **Test Types**:
  - Potency (THC, CBD, other cannabinoids)
  - Pesticides
  - Heavy Metals
  - Microbials
  - Mycotoxins
  - Foreign Matter
- **Values**: Store numeric results when available

#### 3. Package Association
- Link COA to multiple packages
- Track test status per package
- Batch-level test inheritance

#### 4. Compliance Integration
- Block package sales without passing tests
- Metrc test result sync (when required)
- Audit trail for all test documents

### Database Schema

```sql
-- Lab test results table
CREATE TABLE lab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_number TEXT NOT NULL, -- LAB-YYYY-MM-XXXXX
  organization_id UUID NOT NULL REFERENCES organizations(id),
  site_id UUID NOT NULL REFERENCES sites(id),

  -- Test information
  lab_name TEXT NOT NULL,
  lab_license_number TEXT,
  test_date DATE NOT NULL,
  received_date DATE NOT NULL,

  -- COA document
  coa_file_url TEXT NOT NULL,
  coa_file_name TEXT NOT NULL,
  coa_uploaded_by UUID REFERENCES auth.users(id),

  -- Overall status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'conditional')),

  -- Test types and results (JSONB for flexibility)
  test_results JSONB,
  /*
  Example structure:
  {
    "potency": {
      "tested": true,
      "passed": true,
      "thc_percent": 24.5,
      "cbd_percent": 0.3,
      "total_cannabinoids": 28.2
    },
    "pesticides": {
      "tested": true,
      "passed": true,
      "detected": []
    },
    "heavy_metals": {
      "tested": true,
      "passed": true,
      "values": {...}
    },
    "microbials": {
      "tested": true,
      "passed": false,
      "e_coli": "detected",
      "salmonella": "not_detected"
    }
  }
  */

  -- Metrc sync
  metrc_test_id TEXT,
  metrc_sync_status TEXT DEFAULT 'pending',
  metrc_sync_error TEXT,
  metrc_last_sync TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Package test associations
CREATE TABLE package_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES harvest_packages(id),
  test_result_id UUID NOT NULL REFERENCES lab_test_results(id),

  -- Package-specific status
  package_test_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (package_test_status IN ('pending', 'passed', 'failed', 'retesting')),

  -- Sample information
  sample_quantity DECIMAL(10, 3),
  sample_unit_of_measure TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(package_id, test_result_id)
);

-- Indexes
CREATE INDEX idx_lab_test_results_org_site ON lab_test_results(organization_id, site_id);
CREATE INDEX idx_lab_test_results_status ON lab_test_results(status);
CREATE INDEX idx_lab_test_results_test_date ON lab_test_results(test_date DESC);
CREATE INDEX idx_package_test_results_package ON package_test_results(package_id);
CREATE INDEX idx_package_test_results_test ON package_test_results(test_result_id);
CREATE INDEX idx_package_test_status ON package_test_results(package_test_status);
```

### Implementation Architecture

Following the established pattern from Weeks 1-7:

```
1. Database Layer (Supabase)
   └── Tables, indexes, RLS policies

2. Validation Layer (/lib/compliance/metrc/validation/)
   └── lab-test-rules.ts

3. Service Layer (/lib/compliance/metrc/sync/)
   └── lab-test-sync.ts

4. API Layer (/app/api/lab-tests/)
   ├── upload/route.ts
   ├── update/route.ts
   └── link-packages/route.ts

5. UI Components (/components/features/lab-tests/)
   ├── coa-upload-form.tsx
   ├── test-results-viewer.tsx
   └── package-test-status.tsx

6. Integration Points
   ├── Batch Detail Page - Show test status
   ├── Package List - Block untested sales
   └── Harvest Queue - Test requirement warnings
```

### Key Features to Implement

#### 1. COA Upload Component
```typescript
// components/features/lab-tests/coa-upload-form.tsx
interface COAUploadFormProps {
  organizationId: string
  siteId: string
  packages?: HarvestPackage[] // Pre-select packages
  onUploadComplete: (testId: string) => void
}

// Features:
- Drag & drop file upload
- PDF/Image preview
- Lab information form
- Test type selection
- Package association
- Auto-extract test date from filename
```

#### 2. Test Results Viewer
```typescript
// components/features/lab-tests/test-results-viewer.tsx
interface TestResultsViewerProps {
  testId: string
  showDetails?: boolean
  onStatusChange?: (status: string) => void
}

// Features:
- COA document viewer (PDF/Image)
- Test results summary
- Pass/Fail indicators
- Package associations
- Download original COA
```

#### 3. Package Test Status
```typescript
// components/features/lab-tests/package-test-status.tsx
interface PackageTestStatusProps {
  packageId: string
  blockSalesIfFailed?: boolean
}

// Features:
- Test status badge
- Latest test results
- Retest options
- Sales blocking indicator
```

### Validation Rules

```typescript
// lib/compliance/metrc/validation/lab-test-rules.ts

export function validateLabTestUpload(data: {
  labName: string
  labLicenseNumber?: string
  testDate: string
  coaFile: File
  packages: string[]
}): ValidationResult {
  // Required fields
  // File type validation (PDF, PNG, JPG)
  // Test date not in future
  // At least one package selected
  // File size limits (10MB)
}

export function validateTestResults(results: {
  potency?: { thc: number; cbd: number }
  pesticides?: { passed: boolean }
  heavyMetals?: { passed: boolean }
  microbials?: { passed: boolean }
}): ValidationResult {
  // THC limits (if applicable)
  // Required test types based on product type
  // Value ranges
}
```

### API Endpoints

#### POST /api/lab-tests/upload
- Upload COA document to Supabase Storage
- Create lab_test_results record
- Link to packages
- Return test ID and upload URL

#### POST /api/lab-tests/update
- Update test results
- Change status (pass/fail)
- Add/remove package associations

#### GET /api/lab-tests/package/:packageId
- Get all tests for a package
- Include latest status
- Check if package can be sold

### Integration with Existing Features

#### 1. Harvest Packages
- Add `test_status` computed field
- Block "Ready for Sale" status without passing tests
- Show test status in package list

#### 2. Transfer Manifests
- Warn if transferring untested packages
- Include test status in manifest details
- Option to require tests before transfer

#### 3. Batch Management
- Show overall batch test status
- List all associated test results
- Test completion percentage

### Metrc Integration (Prepared but Commented)

```typescript
// lib/compliance/metrc/sync/lab-test-sync.ts

export async function syncLabTestToMetrc(testId: string) {
  // POST /labtests/v2/results
  // Map our test results to Metrc format
  // Update metrc_test_id on success
}

export async function getMetrcTestStatus(metrcTestId: string) {
  // GET /labtests/v2/results/{id}
  // Update local status based on Metrc
}
```

---

## 📋 Week 9: Lab Testing Part 2 - Results & Blocking

### Additional Features
1. **Automated Result Parsing**
   - OCR for common lab report formats
   - Extract values from PDFs
   - Auto-populate test results

2. **Retest Workflow**
   - Flag packages for retesting
   - Track retest history
   - Compare results over time

3. **Compliance Rules Engine**
   - State-specific test requirements
   - Product-type based rules
   - Automatic sales blocking

4. **Reporting**
   - Test pass/fail rates
   - Lab performance metrics
   - Time to test completion

---

## 📋 Week 10: Production Batch Tracking

### Overview
Track the transformation of harvest packages into final products.

### Key Features
1. **Production Batches**
   - Input packages (ingredients)
   - Output products
   - Yield tracking
   - Recipe management

2. **Package Transformation**
   - Split packages
   - Combine packages
   - Change product types
   - Track conversions

3. **Inventory Adjustments**
   - Weight loss from processing
   - Moisture loss tracking
   - Trim to flower ratios

---

## 📋 Week 11: Testing & Polish

### Testing Priorities
1. **Integration Testing**
   - Full workflow tests
   - Metrc sync verification
   - Data consistency checks

2. **Performance Optimization**
   - Query optimization
   - Index tuning
   - Batch operation improvements

3. **UI/UX Polish**
   - Loading states
   - Error messages
   - Tooltips and help text
   - Mobile responsiveness

4. **Bug Fixes**
   - Fix 4 failing transfer tests
   - Address any issues from Weeks 1-10
   - Edge case handling

---

## 🏗️ Implementation Patterns (Established)

Based on Weeks 1-7, follow these consistent patterns:

### 1. Database Migration Naming
```
YYYYMMDD000001_create_[feature_name].sql
```

### 2. Validation Pattern
```typescript
import { ValidationResult, createValidationResult, validateRequired, addError, addWarning } from './validators'

export function validate[Feature](data: {...}): ValidationResult {
  const result = createValidationResult()
  // Validations
  return result
}
```

### 3. Service Pattern
```typescript
export async function create[Feature](params: {...}): Promise<[Feature]Result> {
  // 1. Validate
  // 2. Database transaction
  // 3. Update related records
  // 4. Queue Metrc sync (non-blocking)
  // 5. Return result
}
```

### 4. API Pattern
```typescript
export async function POST(request: Request) {
  // 1. Auth check
  // 2. Parse body
  // 3. Call service
  // 4. Return response
}
```

### 5. Component Pattern
```typescript
interface [Feature]Props {
  organizationId: string
  siteId?: string
  on[Action]: (id: string) => void
}

export function [Feature]({ ...props }: [Feature]Props) {
  // 1. State management
  // 2. API calls
  // 3. Validation
  // 4. UI rendering
}
```

### 6. Testing Pattern
```typescript
describe('validate[Feature]', () => {
  it('should validate valid [feature]', () => {})
  it('should fail when required fields missing', () => {})
  it('should warn for non-critical issues', () => {})
})
```

---

## 📊 Code Quality Standards

Maintain these standards from Weeks 1-7:

1. **TypeScript**
   - Strict mode enabled
   - No `any` types
   - Proper interface definitions

2. **Error Handling**
   - Try-catch blocks
   - User-friendly error messages
   - Proper logging

3. **Performance**
   - Indexes on foreign keys
   - Pagination for lists
   - Debounced searches

4. **Security**
   - RLS policies
   - Input validation
   - SQL injection prevention

5. **Documentation**
   - Inline comments for complex logic
   - API documentation
   - Implementation summaries

---

## 🚀 Quick Start for Next Developer

### Week 8 Implementation Steps

1. **Database Setup**
```bash
# Create migration
supabase migration new create_lab_tests

# Apply migration
supabase db reset
```

2. **Create Validation Rules**
```bash
# Create validation file
touch lib/compliance/metrc/validation/lab-test-rules.ts
touch lib/compliance/metrc/validation/__tests__/lab-test-rules.test.ts
```

3. **Create Service Layer**
```bash
# Create service
touch lib/compliance/metrc/sync/lab-test-sync.ts
```

4. **Create API Routes**
```bash
# Create API directory
mkdir -p app/api/lab-tests/upload
touch app/api/lab-tests/upload/route.ts
```

5. **Create UI Components**
```bash
# Create components
mkdir -p components/features/lab-tests
touch components/features/lab-tests/coa-upload-form.tsx
touch components/features/lab-tests/test-results-viewer.tsx
```

6. **Run Tests**
```bash
npm test lab-test-rules
```

---

## 📝 Important Notes

### From Previous Implementations

1. **Metrc API Safety**
   - All Metrc API calls are commented out
   - Uncomment only when ready for production
   - Test in sandbox first

2. **Non-Blocking Sync**
   - Never block user operations for Metrc sync
   - Queue sync operations
   - Show sync status in UI

3. **Validation Warnings vs Errors**
   - Errors block operations
   - Warnings allow continuation
   - User can override warnings

4. **Auto-Generated Numbers**
   - Use format: PREFIX-YYYY-MM-XXXXX
   - LAB-2024-11-00001 for lab tests
   - Implement via database function

5. **File Structure**
   - Keep consistent with Weeks 1-7
   - Separate validation, sync, API, UI
   - Comprehensive tests for validation

### User Requirements Clarification

Per user: **"The users will be sending their products to other labs to be tested, we just upload the reports"**

This means:
- ❌ We DON'T manage lab workflows
- ❌ We DON'T schedule tests
- ❌ We DON'T track samples being sent
- ✅ We DO upload COA documents
- ✅ We DO extract/enter test results
- ✅ We DO block sales of failed products
- ✅ We DO maintain test history

---

## 🎯 Success Criteria

### Week 8 (Lab Testing Part 1)
- [ ] Database schema created
- [ ] COA upload working
- [ ] Test results stored
- [ ] Package associations created
- [ ] Basic UI integrated
- [ ] 80% test coverage

### Week 9 (Lab Testing Part 2)
- [ ] Sales blocking implemented
- [ ] Result parsing working
- [ ] Retest workflow complete
- [ ] Compliance rules active
- [ ] Reports generated

### Week 10 (Production)
- [ ] Production batches tracked
- [ ] Package transformations working
- [ ] Inventory adjustments accurate
- [ ] Recipe management complete

### Week 11 (Polish)
- [ ] All tests passing (100%)
- [ ] Performance optimized
- [ ] UI/UX polished
- [ ] Documentation complete
- [ ] Production ready

---

## 🔗 Reference Documents

### Completed Week Summaries
- [Week 2 Implementation](docs/compliance/WEEK_2_IMPLEMENTATION_SUMMARY.md)
- [Week 3 Implementation](docs/compliance/WEEK_3_IMPLEMENTATION_SUMMARY.md)
- [Week 4 Implementation](docs/compliance/WEEK_4_IMPLEMENTATION_SUMMARY.md)
- [Week 5 Implementation](docs/compliance/WEEK_5_IMPLEMENTATION_SUMMARY.md)
- [Week 6 Implementation](docs/compliance/WEEK_6_IMPLEMENTATION_SUMMARY.md)
- [Week 7 Implementation](docs/compliance/WEEK_7_IMPLEMENTATION_SUMMARY.md)

### Key Patterns Established
- Non-blocking Metrc sync (Week 1)
- Validation layer architecture (Week 2)
- RLS policies (Week 4)
- Package lifecycle (Week 5)
- Document management (Week 6 - for destruction photos)
- Bi-directional operations (Week 7)

---

## 💡 Tips for Implementation

1. **Start with the database** - Get the schema right first
2. **Write tests early** - TDD helps catch issues
3. **Follow established patterns** - Consistency is key
4. **Document as you go** - Don't leave it for the end
5. **Test with real scenarios** - Use actual lab report PDFs
6. **Consider state regulations** - Requirements vary by state
7. **Keep UI simple** - Focus on functionality first

---

**Ready for Week 8 Implementation!** 🚀

The foundation from Weeks 1-7 provides a solid base. Lab testing (COA management) follows the same patterns but focuses on document upload and test result tracking rather than complex workflows.

**Estimated Timeline:**
- Week 8: 2-3 days
- Week 9: 2-3 days
- Week 10: 1-2 days
- Week 11: 2-3 days

**Total to Complete Phase 3.5:** ~8-10 days

---

*Generated on November 20, 2024*
*For: Next Implementation Phase*
*Phase 3.5 - Plant Batch Lifecycle Integration*