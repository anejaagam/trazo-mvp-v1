# COMPLIANCE ENGINE COMPREHENSIVE RE-PLAN

**Created:** November 18, 2025  
**Status:** CRITICAL - Deep Gap Analysis Complete  
**Priority:** P0 - Required for Cannabis Compliance  
**Estimated Duration:** 8-10 weeks (can be parallelized)

---

## 🚨 EXECUTIVE SUMMARY

After thorough analysis of the current compliance engine implementation and comprehensive research into Metrc requirements, **8 critical gaps** have been identified that prevent full cannabis compliance. While Phases 1-3 successfully built foundation, endpoints, and inventory lot integration, **the core cultivation lifecycle is not integrated with Metrc**.

### Current State vs. Required State

| System Component | Current State | Required State | Gap Severity |
|-----------------|---------------|----------------|--------------|
| **Inventory Lots** | ✅ Full Metrc Integration | ✅ Complete | NONE |
| **Plant Batches** | ❌ No Metrc Integration | ✅ Full Lifecycle Tracking | 🔴 CRITICAL |
| **Plant Tags** | ❌ Not Tracked | ✅ RFID Tag Management | 🔴 CRITICAL |
| **Growth Phases** | ❌ Not Synced | ✅ Vegetative/Flowering Sync | 🔴 CRITICAL |
| **Harvests** | ❌ No Metrc Link | ✅ Wet/Dry Weight Tracking | 🔴 CRITICAL |
| **Waste Destruction** | ⚠️ DB Ready, No Push | ✅ 50:50 Mix Reporting | 🟡 HIGH |
| **Transfer Manifests** | ❌ Not Implemented | ✅ Required for Transfers | 🟡 HIGH |
| **Lab Testing** | ❌ Not Integrated | ✅ COA Upload & Tracking | 🟡 HIGH |
| **Production Batches** | ❌ Not Implemented | ✅ Product Transformation | 🟢 MEDIUM |

---

## 📊 DETAILED GAP ANALYSIS

### GAP 1: Plant Batch Lifecycle (CRITICAL - Highest Priority)

**Current Implementation:**
- TRAZO has `batches` table with stages (clone, vegetative, flower, harvest, etc.)
- Database has `metrc_batch_id`, `metrc_plant_labels`, `metrc_sync_status` columns
- No push/pull sync implemented
- No Metrc plant batch creation on batch creation
- No growth phase sync on stage transitions

**Metrc Requirements:**
1. **Plant Batch Creation**
   - Must create Metrc plant batch when TRAZO batch is created
   - Required fields: Strain, Planting Date, Count, Room/Location
   - Returns: Metrc Plant Batch ID
   - Metrc Endpoint: `POST /plantbatches/v2/createplantings`

2. **Growth Phase Tracking**
   - Metrc tracks: Vegetative vs. Flowering
   - TRAZO has 8 stages: clone → vegetative → pre_flower → flower → late_flower → harvest → drying → curing
   - Must map TRAZO stages to Metrc phases
   - Metrc Endpoint: `POST /plants/v2/changegrowthphases`

3. **Plant Count Changes**
   - Track plant deaths, culling, splits
   - Metrc requires adjustment reporting
   - Metrc Endpoint: `POST /plantbatches/v2/adjust`

**Required Files:**
```
lib/compliance/metrc/sync/
├── batch-push-sync.ts          # Push batches to Metrc
├── batch-pull-sync.ts          # Pull plant batches from Metrc
├── growth-phase-sync.ts        # Sync stage transitions
└── plant-count-sync.ts         # Sync plant count adjustments

lib/compliance/metrc/validation/
├── batch-rules.ts              # Validate batch before Metrc push
└── growth-phase-mapper.ts      # Map TRAZO stages → Metrc phases

lib/compliance/metrc/utils/
└── stage-to-phase-mapper.ts    # Centralized stage mapping logic

lib/supabase/queries/
└── batches.ts                  # UPDATE: Add Metrc hooks
```

**Database Changes:**
- ✅ Columns already exist (from Phase 1 migration)
- No additional migrations needed

**UI Components:**
```
components/features/compliance/
├── push-batch-to-metrc-button.tsx      # Manual batch push
├── batch-metrc-sync-status.tsx         # Sync status badge
└── batch-growth-phase-history.tsx      # Metrc phase history

app/api/compliance/
└── push-batch/route.ts                 # API endpoint for manual push
```

**Implementation Priority:** 🔴 **P0 - Week 1-2**

**Acceptance Criteria:**
- ✅ Batch creation auto-pushes to Metrc (non-blocking)
- ✅ Stage transitions update Metrc growth phase
- ✅ Plant count changes sync to Metrc
- ✅ Manual batch push UI for failed syncs
- ✅ Batch sync status visible in batch details

---

### GAP 2: Plant Tag Management (CRITICAL)

**Current Implementation:**
- TRAZO has `metrc_plant_labels` array column on batches
- No tag ordering system
- No tag assignment workflows
- No tag validation

**Metrc Requirements:**
1. **Tag Ordering**
   - Must order tags from Metrc: `POST /plants/v2/create`
   - Track tag inventory (available vs. assigned)
   - Metrc charges $0.25 per package tag

2. **Tag Assignment**
   - Assign tags to individual plants when transitioning to flowering
   - Track which tags are on which plants
   - Tags are permanent (non-transferable)
   - Metrc Endpoint: Tag assignment happens during plant creation/movement

3. **Tag Types**
   - Plant tags (RFID straps): Blue (adult use), Yellow (medical), Pink (hemp)
   - Package tags: For final products
   - Each state may have different colors

**Required Files:**
```
lib/compliance/metrc/sync/
├── tag-order-sync.ts           # Order tags from Metrc
├── tag-assignment-sync.ts      # Assign tags to plants
└── tag-inventory-sync.ts       # Track tag inventory

lib/supabase/queries/
└── metrc-tags.ts               # Tag CRUD operations

types/
└── metrc-tags.ts               # Tag type definitions
```

**Database Changes:**
```sql
-- New table for tag inventory
CREATE TABLE metrc_plant_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) NOT NULL,
  tag_label TEXT NOT NULL UNIQUE,
  tag_type TEXT NOT NULL, -- 'plant' | 'package'
  tag_category TEXT, -- 'adult_use' | 'medical' | 'hemp'
  status TEXT NOT NULL CHECK (status IN ('available', 'assigned', 'retired', 'lost')),
  assigned_to_batch_id UUID REFERENCES batches(id),
  assigned_to_plant_id UUID, -- If individual plant tracking
  assigned_at TIMESTAMPTZ,
  metrc_tag_id TEXT,
  ordered_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrc_tags_site ON metrc_plant_tags(site_id);
CREATE INDEX idx_metrc_tags_status ON metrc_plant_tags(status);
CREATE INDEX idx_metrc_tags_batch ON metrc_plant_tags(assigned_to_batch_id);
```

**UI Components:**
```
app/dashboard/compliance/tags/
└── page.tsx                    # Tag inventory management

components/features/compliance/
├── tag-order-form.tsx          # Order new tags
├── tag-assignment-dialog.tsx   # Assign tags to batch
└── tag-inventory-table.tsx     # View all tags
```

**Implementation Priority:** 🔴 **P0 - Week 2-3**

**Acceptance Criteria:**
- ✅ Can order tags from Metrc via API
- ✅ Tag inventory tracked in database
- ✅ Tags assigned to batches during flowering transition
- ✅ Tag status visible (available, assigned, retired)
- ✅ Validation prevents duplicate tag assignment

---

### GAP 3: Harvest Tracking & Package Creation (CRITICAL)

**Current Implementation:**
- Batches have `expected_harvest_date` field
- No harvest event tracking in Metrc
- Inventory lots exist but not linked to harvests
- No wet/dry weight differentiation

**Metrc Requirements:**
1. **Harvest Creation**
   - Create Metrc harvest from flowering plants
   - Required: Harvest name, Harvest date, Drying room
   - Track wet weight initially
   - Metrc Endpoint: `POST /harvests/v1/create`

2. **Harvest Drying**
   - Update harvest with dry weight when drying complete
   - Metrc Endpoint: `PUT /harvests/v1/finish`

3. **Package Creation from Harvest**
   - Create packages (inventory lots) from harvest
   - Link packages to harvest batch
   - Required: Package tag, Item name, Quantity, UOM
   - Metrc Endpoint: `POST /harvests/v1/createpackages`

4. **Waste Tracking from Harvest**
   - Report trim waste, stems, damaged material
   - Metrc Endpoint: `POST /harvests/v1/removewaste`

**Required Files:**
```
lib/compliance/metrc/sync/
├── harvest-push-sync.ts        # Create Metrc harvests
├── harvest-finish-sync.ts      # Update harvest with dry weight
└── harvest-package-sync.ts     # Create packages from harvest

lib/compliance/metrc/validation/
└── harvest-rules.ts            # Validate harvest data

lib/supabase/queries/
└── harvests.ts                 # NEW: Harvest operations
```

**Database Changes:**
```sql
-- New table for harvest tracking
CREATE TABLE harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) NOT NULL,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  batch_id UUID REFERENCES batches(id) NOT NULL,
  harvest_name TEXT NOT NULL,
  harvest_date DATE NOT NULL,
  drying_location TEXT,
  wet_weight DECIMAL(10,2),
  wet_weight_unit TEXT,
  dry_weight DECIMAL(10,2),
  dry_weight_unit TEXT,
  waste_weight DECIMAL(10,2),
  waste_weight_unit TEXT,
  drying_started_at TIMESTAMPTZ,
  drying_completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('wet', 'drying', 'dry', 'packaged')),
  metrc_harvest_id TEXT UNIQUE,
  metrc_sync_status TEXT CHECK (metrc_sync_status IN ('not_synced', 'synced', 'pending', 'error')),
  metrc_last_synced_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_harvests_site ON harvests(site_id);
CREATE INDEX idx_harvests_batch ON harvests(batch_id);
CREATE INDEX idx_harvests_status ON harvests(status);
CREATE INDEX idx_harvests_metrc_id ON harvests(metrc_harvest_id);

-- Link inventory lots to harvests
ALTER TABLE inventory_lots 
  ADD COLUMN IF NOT EXISTS harvest_id UUID REFERENCES harvests(id);

CREATE INDEX idx_inventory_lots_harvest ON inventory_lots(harvest_id);
```

**UI Components:**
```
app/dashboard/batches/[id]/harvest/
└── page.tsx                    # Harvest creation page

components/features/batches/
├── harvest-form.tsx            # Create harvest
├── harvest-weight-tracker.tsx  # Track wet/dry weights
└── harvest-package-creator.tsx # Create lots from harvest
```

**Implementation Priority:** 🔴 **P0 - Week 3-4**

**Acceptance Criteria:**
- ✅ Create harvest from batch (wet weight)
- ✅ Update harvest with dry weight
- ✅ Create inventory lots from harvest
- ✅ Track harvest waste
- ✅ All harvest operations sync to Metrc

---

### GAP 4: Waste Destruction Reporting (HIGH Priority)

**Current Implementation:**
- `waste_logs` table exists with full fields
- Database has `metrc_waste_id` and `metrc_sync_status` columns
- No push sync to Metrc implemented
- 50:50 rendering method tracked but not validated

**Metrc Requirements:**
1. **Waste Destruction**
   - Report all cannabis waste destruction
   - Required: Weight, Method (50:50 mix in OR/MD), Destruction date
   - Photo documentation recommended
   - Metrc Endpoint: `POST /plantbatches/v2/destroy` or `POST /packages/v2/adjust`

2. **Rendering Unusable**
   - Oregon/Maryland: 50:50 mix with inert material (sawdust, kitty litter)
   - Must render unrecognizable and unusable
   - Witness required for destruction
   - Method documented in notes

3. **Waste Categories**
   - Plant material waste (stems, leaves, roots)
   - Package waste (failed products)
   - Trim waste (already tracked in harvests)

**Required Files:**
```
lib/compliance/metrc/sync/
├── waste-push-sync.ts          # Push waste logs to Metrc
└── waste-validation.ts         # Validate rendering methods

lib/compliance/metrc/validation/
└── waste-rules.ts              # Waste-specific validation
```

**Database Changes:**
- ✅ All columns exist (from waste management migration)
- No changes needed

**UI Components:**
```
components/features/compliance/
├── push-waste-to-metrc-button.tsx      # Manual waste push
└── waste-metrc-sync-status.tsx         # Sync status badge
```

**Implementation Priority:** 🟡 **P1 - Week 4-5**

**Acceptance Criteria:**
- ✅ Waste log creation auto-pushes to Metrc
- ✅ Validates 50:50 rendering for OR/MD jurisdictions
- ✅ Manual waste push for failed syncs
- ✅ Waste sync status visible in waste logs

---

### GAP 5: Transfer Manifest System (HIGH Priority)

**Current Implementation:**
- `inventory_movements` table exists
- Database has `metrc_transaction_id` and `metrc_sync_status` columns
- No transfer manifest creation
- No license verification

**Metrc Requirements:**
1. **Outgoing Transfer Manifest**
   - Required for ALL cannabis transfers between facilities
   - Required fields:
     - Destination facility license number
     - Destination facility name
     - Estimated departure/arrival times
     - Driver name, driver license, vehicle info
     - Package labels being transferred
   - Metrc Endpoint: `POST /transfers/v2/external/incoming`

2. **Incoming Transfer Receipt**
   - Receiving facility must accept transfer
   - Verify package labels match manifest
   - Report discrepancies
   - Metrc Endpoint: `POST /transfers/v2/external/incoming`

3. **Transfer Tracking**
   - Track transfer in-transit status
   - Record actual delivery time
   - Handle rejected/returned transfers

**Required Files:**
```
lib/compliance/metrc/sync/
├── transfer-manifest-sync.ts   # Create/update manifests
├── transfer-receive-sync.ts    # Receive incoming transfers
└── transfer-tracking-sync.ts   # Track in-transit status

lib/compliance/metrc/validation/
└── transfer-rules.ts           # Validate transfer data

lib/supabase/queries/
└── transfers.ts                # NEW: Transfer operations
```

**Database Changes:**
```sql
-- New table for transfer manifests
CREATE TABLE transfer_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) NOT NULL,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  manifest_number TEXT UNIQUE,
  transfer_type TEXT NOT NULL CHECK (transfer_type IN ('outgoing', 'incoming')),
  
  -- Destination/Source info
  destination_license_number TEXT,
  destination_facility_name TEXT,
  source_license_number TEXT,
  source_facility_name TEXT,
  
  -- Transport info
  driver_name TEXT,
  driver_license TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_license_plate TEXT,
  
  -- Timing
  estimated_departure TIMESTAMPTZ,
  estimated_arrival TIMESTAMPTZ,
  actual_departure TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('draft', 'in_transit', 'received', 'rejected')),
  
  -- Metrc sync
  metrc_manifest_id TEXT UNIQUE,
  metrc_sync_status TEXT CHECK (metrc_sync_status IN ('not_synced', 'synced', 'pending', 'error')),
  metrc_last_synced_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link packages to manifests
CREATE TABLE transfer_manifest_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID REFERENCES transfer_manifests(id) ON DELETE CASCADE NOT NULL,
  inventory_lot_id UUID REFERENCES inventory_lots(id) NOT NULL,
  package_label TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_manifests_site ON transfer_manifests(site_id);
CREATE INDEX idx_manifests_status ON transfer_manifests(status);
CREATE INDEX idx_manifests_metrc_id ON transfer_manifests(metrc_manifest_id);
CREATE INDEX idx_manifest_packages_manifest ON transfer_manifest_packages(manifest_id);
```

**UI Components:**
```
app/dashboard/transfers/
├── page.tsx                    # Transfer list
├── [id]/page.tsx              # Transfer details
└── new/page.tsx               # Create transfer

components/features/transfers/
├── transfer-manifest-form.tsx  # Create manifest
├── transfer-package-selector.tsx # Select packages
└── transfer-receive-dialog.tsx # Receive transfer
```

**Implementation Priority:** 🟡 **P1 - Week 5-6**

**Acceptance Criteria:**
- ✅ Create transfer manifest for outgoing transfers
- ✅ Generate printable manifest
- ✅ Receive incoming transfers
- ✅ Verify packages on receipt
- ✅ All transfers sync to Metrc

---

### GAP 6: Lab Testing Integration (HIGH Priority)

**Current Implementation:**
- No lab testing workflow
- No COA (Certificate of Analysis) storage
- No test result tracking
- Inventory lots have no test status

**Metrc Requirements:**
1. **Test Sample Creation**
   - Create test sample from package
   - Submit sample to licensed lab
   - Metrc Endpoint: `POST /packages/v2/create/testing`

2. **Test Result Entry**
   - Labs upload COA to Metrc
   - Results include: THC%, CBD%, terpenes, contaminants
   - Package status changes based on results
   - Metrc Endpoint: (Labs only) - TRAZO receives via pull

3. **Test Status Tracking**
   - Not Submitted
   - Submitted for Testing
   - Passed
   - Failed
   - Packages can't be sold until passed

**Required Files:**
```
lib/compliance/metrc/sync/
├── test-sample-sync.ts         # Create test samples
└── test-result-pull.ts         # Pull test results

lib/supabase/queries/
└── lab-tests.ts                # NEW: Lab test operations
```

**Database Changes:**
```sql
-- New table for lab tests
CREATE TABLE lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) NOT NULL,
  inventory_lot_id UUID REFERENCES inventory_lots(id) NOT NULL,
  test_type TEXT NOT NULL, -- 'potency' | 'pesticide' | 'microbial' | 'heavy_metal' | 'mycotoxin'
  lab_name TEXT NOT NULL,
  lab_license_number TEXT,
  sample_date DATE NOT NULL,
  test_date DATE,
  result_date DATE,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'testing', 'passed', 'failed')),
  
  -- Test results (JSON for flexibility)
  test_results JSONB,
  
  -- COA storage
  coa_url TEXT,
  coa_uploaded_at TIMESTAMPTZ,
  
  -- Metrc sync
  metrc_test_id TEXT UNIQUE,
  metrc_sync_status TEXT CHECK (metrc_sync_status IN ('not_synced', 'synced', 'pending', 'error')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_tests_lot ON lab_tests(inventory_lot_id);
CREATE INDEX idx_lab_tests_status ON lab_tests(status);

-- Add test status to inventory lots
ALTER TABLE inventory_lots 
  ADD COLUMN IF NOT EXISTS test_status TEXT CHECK (test_status IN ('not_submitted', 'submitted', 'testing', 'passed', 'failed'));
```

**UI Components:**
```
app/dashboard/inventory/lots/[id]/testing/
└── page.tsx                    # Lab testing page

components/features/inventory/
├── test-sample-form.tsx        # Submit for testing
└── test-results-display.tsx    # Display COA results
```

**Implementation Priority:** 🟡 **P1 - Week 6-7**

**Acceptance Criteria:**
- ✅ Submit package for lab testing
- ✅ Track test status
- ✅ Pull test results from Metrc
- ✅ Store COA documents
- ✅ Prevent sale of untested products

---

### GAP 7: Production Batch Tracking (MEDIUM Priority)

**Current Implementation:**
- No production batch concept
- No product transformation tracking
- Recipes exist but not linked to compliance

**Metrc Requirements:**
1. **Production Batches**
   - Track when products are transformed (flower → concentrate)
   - Track when products are combined (concentrate + terpenes → vape)
   - Required when:
     - Product changes form
     - Product changes category
     - Non-cannabis ingredients added
   - Metrc Endpoint: `POST /packages/v2/create` with production batch flag

2. **Source Package Tracking**
   - Track all source packages used
   - Calculate yield percentage
   - Report waste from production

**Required Files:**
```
lib/compliance/metrc/sync/
└── production-batch-sync.ts    # Production batch operations

lib/supabase/queries/
└── production-batches.ts       # NEW: Production batch operations
```

**Database Changes:**
```sql
-- New table for production batches
CREATE TABLE production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) NOT NULL,
  batch_number TEXT NOT NULL,
  production_type TEXT NOT NULL, -- 'extraction' | 'infusion' | 'packaging'
  source_packages TEXT[], -- Array of package labels
  output_package_label TEXT,
  yield_percentage DECIMAL(5,2),
  waste_weight DECIMAL(10,2),
  production_date DATE NOT NULL,
  
  metrc_production_batch_id TEXT UNIQUE,
  metrc_sync_status TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation Priority:** 🟢 **P2 - Week 8**

---

### GAP 8: Compliance Task Integration (MEDIUM Priority)

**Current Implementation:**
- Task system exists with SOP templates
- Batch-task linking exists
- No compliance-specific task types

**Metrc Requirements:**
- Not directly required by Metrc
- Best practice for ensuring compliance steps

**Required Enhancements:**
1. **Compliance Task Types**
   - Tag assignment tasks (before flowering)
   - Test sample submission (before sale)
   - Waste destruction witness (before disposal)
   - Transfer manifest creation (before transport)

2. **Task Evidence**
   - Link tasks to Metrc sync operations
   - Store evidence (photos, signatures)
   - Prevent action until task complete

**Implementation Priority:** 🟢 **P2 - Week 9**

---

## 🗺️ REVISED IMPLEMENTATION ROADMAP

### Phase 3.5: Plant Batch Lifecycle (CRITICAL - Week 1-4)

**Duration:** 4 weeks  
**Blockers:** None - can start immediately  
**Priority:** 🔴 P0

**Week 1: Batch Push Sync**
- [ ] Create `batch-push-sync.ts`
- [ ] Create `batch-rules.ts` validation
- [ ] Update `batches.ts` with Metrc hooks
- [ ] Create UI components (push button, sync status)
- [ ] Write comprehensive tests

**Week 2: Growth Phase Sync**
- [ ] Create `growth-phase-sync.ts`
- [ ] Create `stage-to-phase-mapper.ts`
- [ ] Update `transitionBatchStage()` with Metrc hooks
- [ ] Create growth phase history UI
- [ ] Write tests

**Week 3: Plant Tag System**
- [ ] Create tag database tables
- [ ] Create `tag-order-sync.ts`
- [ ] Create `tag-assignment-sync.ts`
- [ ] Build tag management UI
- [ ] Write tests

**Week 4: Plant Count Adjustments**
- [ ] Create `plant-count-sync.ts`
- [ ] Handle plant deaths/culling
- [ ] Update batch UI with tag assignment
- [ ] Integration testing
- [ ] Documentation

**Deliverables:**
- ✅ Full batch lifecycle integrated with Metrc
- ✅ Automated growth phase syncing
- ✅ Tag inventory management system
- ✅ 95%+ test coverage

---

### Phase 3.6: Harvest & Package Creation (CRITICAL - Week 5-7)

**Duration:** 3 weeks  
**Blockers:** Requires Phase 3.5 complete (batch integration)  
**Priority:** 🔴 P0

**Week 5: Harvest Foundation**
- [ ] Create `harvests` database table
- [ ] Create `harvest-push-sync.ts`
- [ ] Create harvest CRUD queries
- [ ] Build harvest creation UI
- [ ] Write tests

**Week 6: Harvest Processing**
- [ ] Create `harvest-finish-sync.ts` (dry weight)
- [ ] Create `harvest-package-sync.ts`
- [ ] Link inventory lots to harvests
- [ ] Build harvest weight tracker UI
- [ ] Write tests

**Week 7: Harvest Waste & Integration**
- [ ] Integrate harvest waste with waste logs
- [ ] Create harvest-to-lot workflow
- [ ] Build package creation UI
- [ ] End-to-end testing
- [ ] Documentation

**Deliverables:**
- ✅ Complete harvest workflow
- ✅ Wet/dry weight tracking
- ✅ Harvest → inventory lot chain
- ✅ Metrc harvest sync operational

---

### Phase 3.7: Waste & Transfer Systems (HIGH - Week 8-10)

**Duration:** 3 weeks  
**Blockers:** None - can start in parallel with Phase 3.6  
**Priority:** 🟡 P1

**Week 8: Waste Push Sync**
- [ ] Create `waste-push-sync.ts`
- [ ] Create `waste-rules.ts` validation
- [ ] Update `waste.ts` with Metrc hooks
- [ ] Build waste push UI
- [ ] Write tests

**Week 9: Transfer Manifest Foundation**
- [ ] Create transfer manifest tables
- [ ] Create `transfer-manifest-sync.ts`
- [ ] Create transfer CRUD queries
- [ ] Build manifest creation UI
- [ ] Write tests

**Week 10: Transfer Completion**
- [ ] Create `transfer-receive-sync.ts`
- [ ] Build transfer receiving UI
- [ ] Create printable manifest
- [ ] Integration testing
- [ ] Documentation

**Deliverables:**
- ✅ Waste destruction reporting to Metrc
- ✅ Transfer manifest system
- ✅ Incoming transfer receipt
- ✅ Full chain of custody tracking

---

### Phase 3.8: Lab Testing Integration (HIGH - Week 11-12)

**Duration:** 2 weeks  
**Blockers:** Requires Phase 3.6 complete (harvest/packages)  
**Priority:** 🟡 P1

**Week 11: Test Sample System**
- [ ] Create lab_tests database table
- [ ] Create `test-sample-sync.ts`
- [ ] Create test CRUD queries
- [ ] Build test submission UI
- [ ] Write tests

**Week 12: Test Results & COA**
- [ ] Create `test-result-pull.ts`
- [ ] Build COA display UI
- [ ] Add test status to inventory lots
- [ ] Prevent sale of untested products
- [ ] Documentation

**Deliverables:**
- ✅ Lab test sample submission
- ✅ Test result tracking
- ✅ COA storage and display
- ✅ Test status gating for sales

---

### Phase 3.9: Production Batches & Polish (MEDIUM - Week 13-14)

**Duration:** 2 weeks  
**Blockers:** None  
**Priority:** 🟢 P2

**Week 13: Production Batches**
- [ ] Create production batch tables
- [ ] Create `production-batch-sync.ts`
- [ ] Build production batch UI
- [ ] Write tests

**Week 14: Final Polish**
- [ ] Compliance task enhancements
- [ ] Error handling improvements
- [ ] Performance optimization
- [ ] Comprehensive documentation
- [ ] User training materials

**Deliverables:**
- ✅ Production batch tracking
- ✅ Task-compliance integration
- ✅ Production-ready system
- ✅ Complete documentation

---

## 📋 CRITICAL SUCCESS METRICS

### Technical Completion
- ✅ 100% of cannabis batches tracked in Metrc
- ✅ 100% of harvests reported to Metrc
- ✅ 100% of waste destruction synced
- ✅ 100% of transfers have valid manifests
- ✅ 95%+ test coverage on all new code
- ✅ 0 TypeScript errors
- ✅ <2s Metrc API response times

### Business Value
- ✅ Zero compliance violations from missing data
- ✅ Automated compliance reduces manual entry by 80%+
- ✅ Audit-ready documentation for all operations
- ✅ Real-time compliance status visibility
- ✅ Proactive alerts for compliance issues

### Operational Metrics
- ✅ <5% sync failure rate
- ✅ <1 hour retry time for failed syncs
- ✅ 100% of failures have manual recovery option
- ✅ <10 minutes average time to resolve sync errors

---

## 🚧 KNOWN RISKS & MITIGATION

### Risk 1: Metrc API Rate Limits
**Impact:** HIGH  
**Mitigation:**
- Implement exponential backoff (already in client)
- Batch operations where possible
- Queue system for high-volume syncs
- Monitor rate limit headers

### Risk 2: Complex Stage-to-Phase Mapping
**Impact:** MEDIUM  
**Mitigation:**
- Configurable mapping per jurisdiction
- Default mapping documented
- Manual override in UI
- Audit log of all phase changes

### Risk 3: Tag Inventory Tracking
**Impact:** MEDIUM  
**Mitigation:**
- Automated low-inventory alerts
- Tag order workflow
- Manual tag entry fallback
- Tag reconciliation reports

### Risk 4: Historical Data Migration
**Impact:** LOW  
**Mitigation:**
- Focus on new data first
- Historical migration is optional
- Manual historical entry if needed
- Clear cut-over date

---

## 📚 REFERENCES & RESOURCES

### Metrc Documentation
- [Metrc API Documentation](https://api-ca.metrc.com/Documentation)
- [Metrc Plant Tracking Guide](https://www.metrc.com/understanding-the-essentials-of-seed-to-sale-cannabis-tracking/)
- [Production Batch Best Practices](https://www.metrc.com/cannabis-compliance-best-practices-for-creating-production-batches-in-metrc/)
- [Waste Disposal Requirements](https://www.metrc.com/wp-content/uploads/2024/04/MS_IB_0020_Plant-Waste-Disposal-Process.pdf)

### State-Specific Regulations
- **Oregon:** OAR 845-025 (OLCC Cannabis Tracking)
- **Maryland:** COMAR 14.16 (Cannabis Tracking Requirements)

### Internal Documentation
- [COMPLIANCE_INTEGRATION_GAP_ANALYSIS.md](./COMPLIANCE_INTEGRATION_GAP_ANALYSIS.md)
- [COMPLIANCE_ENGINE_AGENT_PROMPT.md](./COMPLIANCE_ENGINE_AGENT_PROMPT.md)
- [Metrc API Alignment Guide](./docs/roadmap/reference/METRC_API_ALIGNMENT.md)

---

## 🎯 NEXT IMMEDIATE ACTIONS

### For Agent Starting Phase 3.5 (Week 1)

1. **Read this document completely**
2. **Review Phase 3 completion** in COMPLIANCE_ENGINE_AGENT_PROMPT.md
3. **Start with `batch-push-sync.ts`**
   - Follow `inventory-push-sync.ts` pattern
   - Non-blocking async pattern
   - Comprehensive error handling
4. **Reference existing code**
   - `lib/compliance/metrc/sync/inventory-push-sync.ts`
   - `lib/compliance/metrc/validation/package-rules.ts`
   - `lib/supabase/queries/batches.ts`
5. **Test with sandbox Metrc credentials**

### File Creation Order (Week 1)
1. `lib/compliance/metrc/validation/batch-rules.ts`
2. `lib/compliance/metrc/sync/batch-push-sync.ts`
3. Update `lib/supabase/queries/batches.ts` (add hooks)
4. `components/features/compliance/push-batch-to-metrc-button.tsx`
5. `app/api/compliance/push-batch/route.ts`
6. Tests: `lib/compliance/metrc/__tests__/batch-push-sync.test.ts`

---

## 🔄 CONTINUOUS IMPROVEMENT

### After Each Phase
- [ ] Update this document with learnings
- [ ] Document any Metrc API quirks discovered
- [ ] Update test coverage metrics
- [ ] Review and refine next phase plan

### Weekly Reviews
- [ ] Check sync success rates
- [ ] Review error logs
- [ ] Gather user feedback
- [ ] Adjust priorities as needed

---

**Document Owner:** Compliance Engine Team  
**Last Updated:** November 18, 2025  
**Next Review:** After Phase 3.5 completion

**Questions?** See [COMPLIANCE_ENGINE_AGENT_PROMPT.md](./COMPLIANCE_ENGINE_AGENT_PROMPT.md) for detailed phase instructions.

---

## ✅ COMPLETION CHECKLIST

Use this to track overall progress:

### Phase 3.5: Plant Batch Lifecycle
- [ ] Week 1: Batch push sync complete
- [ ] Week 2: Growth phase sync complete
- [ ] Week 3: Plant tag system complete
- [ ] Week 4: Plant count adjustments complete

### Phase 3.6: Harvest & Package Creation
- [ ] Week 5: Harvest foundation complete
- [ ] Week 6: Harvest processing complete
- [ ] Week 7: Harvest integration complete

### Phase 3.7: Waste & Transfer Systems
- [ ] Week 8: Waste push sync complete
- [ ] Week 9: Transfer manifest foundation complete
- [ ] Week 10: Transfer completion complete

### Phase 3.8: Lab Testing Integration
- [ ] Week 11: Test sample system complete
- [ ] Week 12: Test results & COA complete

### Phase 3.9: Production Batches & Polish
- [ ] Week 13: Production batches complete
- [ ] Week 14: Final polish complete

---

**LET'S ACHIEVE FULL METRC COMPLIANCE! 🚀**
