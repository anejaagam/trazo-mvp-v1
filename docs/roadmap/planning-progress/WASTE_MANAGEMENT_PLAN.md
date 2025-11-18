# Waste Management Implementation Plan

**Last Updated:** November 17, 2025  
**Status:** 🎯 Ready to Build  
**Priority:** Phase 13 - Post Batch/Inventory/Tasks  
**Estimated Duration:** 8-10 days

---

## 🎯 Executive Summary

**Objective:** Build a comprehensive waste management system that tracks, documents, and reports waste disposal activities with full Metrc compliance for cannabis operations.

**Key Features:**
- Multi-source waste tracking (batches, inventory, general operations)
- Metrc compliance enforcement (rendering unusable, witness requirements, 50% mix rule)
- Photo evidence and digital signatures
- Integration with existing batch and inventory systems
- Jurisdiction-specific compliance rules (Oregon, Maryland, Canada CTLS, PrimusGFS)
- Complete audit trail with compliance packet generation

**Foundation Built:**
- ✅ `waste_logs` table exists in schema with Metrc fields
- ✅ `inventory:waste` permission already defined
- ✅ `inventory_movements.movement_type` includes 'dispose'
- ✅ Batch schema includes waste tracking fields

---

## 📚 Background Research

### Metrc Waste Requirements

From web research and Metrc documentation:

1. **Rendering Unusable** - All cannabis waste must be rendered "unrecognizable and unusable"
   - 50:50 mix rule: Cannabis material mixed with inert material (sand, kitty litter, etc.)
   - Alternative methods: Grinding, composting with approved materials
   - Must be documented with specific method used

2. **Witness Requirements**
   - All waste disposal must have a licensed employee witness
   - Witness name and ID verification required
   - Digital signature recommended

3. **Photo Evidence**
   - Before disposal photos required
   - After rendering unusable photos required
   - Mixed waste photos showing 50:50 ratio

4. **Metrc API Endpoints**
   - `POST /plants/v2/waste` - Destroy plants/plant batches
   - `POST /harvests/v1/removewaste` - Remove waste from harvest
   - `POST /packages/v2/adjust` - Adjust packages for waste
   - All require waste method, reason, and material mixed

5. **Package Tags**
   - Waste packages need Metrc package tags
   - Tags must be recorded and associated with disposal

6. **Disposal Methods (State-Configured)**
   - Compost (with approved materials)
   - Landfill (after rendering)
   - Hazardous waste (chemicals, pesticides)
   - Incineration (if state-approved)

---

## 🗄️ Current State Analysis

### Existing Database Schema

**`waste_logs` table** (from `/lib/supabase/schema.sql` lines 457-489):
```sql
CREATE TABLE waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  site_id UUID NOT NULL,
  waste_type TEXT NOT NULL CHECK (waste_type IN (
    'plant_material', 'trim', 'chemical', 'packaging', 'equipment', 
    'growing_medium', 'other'
  )),
  source_type TEXT CHECK (source_type IN ('batch', 'inventory', 'general', 'processing')),
  source_id UUID,
  quantity DECIMAL(10,2) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  reason TEXT NOT NULL,
  disposal_method TEXT NOT NULL,
  
  -- Compliance requirements
  photo_urls TEXT[],
  witness_name TEXT,
  witness_signature_url TEXT,
  witness_id_verified BOOLEAN DEFAULT FALSE,
  rendered_unusable BOOLEAN DEFAULT FALSE,
  
  -- Metrc integration
  metrc_disposal_id TEXT,
  metrc_package_tags TEXT[],
  
  disposal_location TEXT,
  performed_by UUID NOT NULL REFERENCES users(id),
  witnessed_by UUID REFERENCES users(id),
  disposed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);
```

**Indexes:**
```sql
CREATE INDEX idx_waste_logs_org_site ON waste_logs(organization_id, site_id);
CREATE INDEX idx_waste_logs_source ON waste_logs(source_type, source_id) WHERE source_id IS NOT NULL;
```

### Existing RBAC

**Permission:** `inventory:waste` (from `/lib/rbac/permissions.ts`)
```typescript
'inventory:waste': {
  key: 'inventory:waste',
  name: 'Record Waste Disposal',
  description: 'Record waste disposal with compliance documentation',
  resource: 'inventory',
  action: 'waste'
}
```

**Roles with Permission:**
- `org_admin` - Full access (wildcard)
- `site_manager` - Full access
- `head_grower` - Full access
- `compliance_qa` - Full access
- `grower` - Has permission

### Inventory Integration

**Movement Type:** `dispose` in `inventory_movements.movement_type`
- Already supports waste disposal tracking
- Links to lots and items
- Can attribute to batches/tasks

---

## 🏗️ Architecture Design

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    WASTE MANAGEMENT SYSTEM                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Batch      │  │  Inventory   │  │   General    │      │
│  │   Waste      │  │    Waste     │  │    Waste     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            ▼                                 │
│              ┌─────────────────────────┐                     │
│              │  Waste Recording Form   │                     │
│              │  - Compliance checks    │                     │
│              │  - Photo upload         │                     │
│              │  - Witness signature    │                     │
│              │  - Rendering method     │                     │
│              └────────────┬────────────┘                     │
│                           ▼                                  │
│              ┌─────────────────────────┐                     │
│              │   Waste Log Created     │                     │
│              │   + Inventory Updated   │                     │
│              │   + Batch Event Logged  │                     │
│              └────────────┬────────────┘                     │
│                           ▼                                  │
│              ┌─────────────────────────┐                     │
│              │  Metrc Sync (Oregon/MD) │                     │
│              │  CTLS Sync (Canada)     │                     │
│              │  Evidence Archive       │                     │
│              └─────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Plan

### Phase 0: Database Enhancement ✅ (ALREADY COMPLETE)

**Status:** Waste table already exists with all required fields

**Enhancements Needed:**
- Add RLS policies for waste_logs table
- Add trigger to create batch_events on waste creation
- Add view for waste summary/analytics

**Migration:** `20251117000000_waste_management_enhancement.sql`

### Phase 1: Type Definitions (2-3 hours)

**File:** `/types/waste.ts` (estimated 400-500 lines)

**Types to Define:**
```typescript
// Core waste types
export type WasteType = 'plant_material' | 'trim' | 'chemical' | 'packaging' | 
  'equipment' | 'growing_medium' | 'other';

export type SourceType = 'batch' | 'inventory' | 'general' | 'processing';

export type DisposalMethod = 'compost' | 'hazardous_waste' | 'landfill' | 
  'recycle' | 'incineration' | 'grinding_mixing';

export type RenderingMethod = 'fifty_fifty_mix' | 'grinding' | 'composting' | 
  'chemical_treatment' | 'other';

// Jurisdiction-specific waste reasons
export type MetrcWasteReason = 
  | 'Male plants'
  | 'Unhealthy or contaminated plants'
  | 'Trim waste'
  | 'Harvest waste'
  | 'Quality control failure'
  | 'Overproduction'
  | 'Damaged in transit'
  | 'Expired product'
  | 'Other';

export type CTLSWasteReason = 
  | 'Contaminated'
  | 'Defective'
  | 'Destroyed for compliance'
  | 'Expired'
  | 'Other';

// Main waste log interface
export interface WasteLog {
  id: string;
  organization_id: string;
  site_id: string;
  waste_type: WasteType;
  source_type: SourceType | null;
  source_id: string | null;
  quantity: number;
  unit_of_measure: string;
  reason: string;
  disposal_method: DisposalMethod;
  
  // Rendering details
  rendering_method?: RenderingMethod;
  waste_material_mixed?: string; // e.g., "kitty litter", "sand"
  mix_ratio?: string; // e.g., "50:50"
  
  // Compliance
  photo_urls: string[];
  witness_name?: string;
  witness_signature_url?: string;
  witness_id_verified: boolean;
  rendered_unusable: boolean;
  
  // Metrc integration
  metrc_disposal_id?: string;
  metrc_package_tags?: string[];
  metrc_sync_status?: 'pending' | 'synced' | 'failed';
  metrc_sync_error?: string;
  
  disposal_location?: string;
  performed_by: string;
  witnessed_by?: string;
  disposed_at: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Form types
export interface CreateWasteLogInput {
  waste_type: WasteType;
  source_type?: SourceType;
  source_id?: string;
  quantity: number;
  unit_of_measure: string;
  reason: string;
  disposal_method: DisposalMethod;
  rendering_method?: RenderingMethod;
  waste_material_mixed?: string;
  mix_ratio?: string;
  disposal_location?: string;
  witnessed_by?: string;
  notes?: string;
}

// With relationships
export interface WasteLogWithRelations extends WasteLog {
  performer?: { id: string; name: string; email: string };
  witness?: { id: string; name: string; email: string };
  batch?: { id: string; batch_number: string; strain_name?: string };
  inventory_item?: { id: string; name: string; sku?: string };
}

// Analytics
export interface WasteSummary {
  total_waste_count: number;
  total_weight_kg: number;
  by_type: Record<WasteType, number>;
  by_source: Record<SourceType, number>;
  by_disposal_method: Record<DisposalMethod, number>;
  compliance_rate: number; // % with rendered_unusable = true
  metrc_sync_rate: number; // % synced to Metrc
}

// Filters
export interface WasteLogFilters {
  waste_type?: WasteType[];
  source_type?: SourceType;
  disposal_method?: DisposalMethod[];
  date_range?: { start: string; end: string };
  performed_by?: string;
  witnessed_by?: string;
  metrc_synced?: boolean;
  rendered_unusable?: boolean;
}
```

### Phase 2: Database Migration (1-2 hours)

**File:** `/supabase/migrations/20251117000000_waste_management_enhancement.sql`

```sql
-- Add missing fields to waste_logs
ALTER TABLE waste_logs ADD COLUMN IF NOT EXISTS rendering_method TEXT 
  CHECK (rendering_method IN ('fifty_fifty_mix', 'grinding', 'composting', 'chemical_treatment', 'other'));
ALTER TABLE waste_logs ADD COLUMN IF NOT EXISTS waste_material_mixed TEXT;
ALTER TABLE waste_logs ADD COLUMN IF NOT EXISTS mix_ratio TEXT;
ALTER TABLE waste_logs ADD COLUMN IF NOT EXISTS metrc_sync_status TEXT 
  CHECK (metrc_sync_status IN ('pending', 'synced', 'failed'));
ALTER TABLE waste_logs ADD COLUMN IF NOT EXISTS metrc_sync_error TEXT;
ALTER TABLE waste_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE waste_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_waste_logs_waste_type ON waste_logs(waste_type);
CREATE INDEX IF NOT EXISTS idx_waste_logs_disposal_method ON waste_logs(disposal_method);
CREATE INDEX IF NOT EXISTS idx_waste_logs_disposed_at ON waste_logs(disposed_at DESC);
CREATE INDEX IF NOT EXISTS idx_waste_logs_performed_by ON waste_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_waste_logs_metrc_sync ON waste_logs(metrc_sync_status) 
  WHERE metrc_sync_status IS NOT NULL;

-- RLS Policies
ALTER TABLE waste_logs ENABLE ROW LEVEL SECURITY;

-- View: Users can view waste logs from their organization/sites
CREATE POLICY "Users can view waste logs from their org"
  ON waste_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Insert: Users with inventory:waste permission can create
CREATE POLICY "Authorized users can create waste logs"
  ON waste_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Update: Only creator or org_admin can update (for corrections within 24h)
CREATE POLICY "Creator can update waste logs within 24h"
  ON waste_logs FOR UPDATE
  TO authenticated
  USING (
    performed_by = auth.uid() AND
    disposed_at > NOW() - INTERVAL '24 hours'
  );

-- Trigger: Create batch event when waste from batch
CREATE OR REPLACE FUNCTION create_batch_waste_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source_type = 'batch' AND NEW.source_id IS NOT NULL THEN
    INSERT INTO batch_events (
      batch_id,
      event_type,
      from_value,
      to_value,
      user_id,
      notes
    ) VALUES (
      NEW.source_id::uuid,
      'waste_recorded',
      NULL,
      jsonb_build_object(
        'waste_log_id', NEW.id,
        'quantity', NEW.quantity,
        'unit', NEW.unit_of_measure,
        'waste_type', NEW.waste_type,
        'reason', NEW.reason
      ),
      NEW.performed_by,
      NEW.notes
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_waste_log_insert
  AFTER INSERT ON waste_logs
  FOR EACH ROW
  EXECUTE FUNCTION create_batch_waste_event();

-- Trigger: Update timestamp
CREATE TRIGGER update_waste_logs_timestamp
  BEFORE UPDATE ON waste_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Analytics view
CREATE OR REPLACE VIEW waste_summary AS
SELECT 
  organization_id,
  site_id,
  DATE_TRUNC('month', disposed_at) as month,
  waste_type,
  source_type,
  disposal_method,
  COUNT(*) as waste_count,
  SUM(quantity) as total_quantity,
  SUM(CASE WHEN rendered_unusable THEN 1 ELSE 0 END)::float / COUNT(*) as compliance_rate,
  SUM(CASE WHEN metrc_sync_status = 'synced' THEN 1 ELSE 0 END)::float / COUNT(*) as sync_rate
FROM waste_logs
GROUP BY organization_id, site_id, DATE_TRUNC('month', disposed_at), 
  waste_type, source_type, disposal_method;

COMMENT ON VIEW waste_summary IS 'Monthly waste analytics by type, source, and disposal method';
```

### Phase 3: Backend Queries (4-5 hours)

**File:** `/lib/supabase/queries/waste.ts` (estimated 800-1000 lines)

**Query Functions:**
```typescript
// Core CRUD
export async function getWasteLogs(filters: WasteLogFilters): Promise<QueryResult<WasteLogWithRelations[]>>
export async function getWasteLogById(id: string): Promise<QueryResult<WasteLogWithRelations>>
export async function createWasteLog(input: CreateWasteLogInput): Promise<QueryResult<WasteLog>>
export async function updateWasteLog(id: string, updates: Partial<WasteLog>): Promise<QueryResult<WasteLog>>

// Batch-specific
export async function createBatchWaste(batchId: string, input: CreateWasteLogInput): Promise<QueryResult<WasteLog>>
export async function getBatchWasteLogs(batchId: string): Promise<QueryResult<WasteLog[]>>

// Inventory-specific
export async function createInventoryWaste(itemId: string, input: CreateWasteLogInput): Promise<QueryResult<WasteLog>>
export async function getInventoryWasteLogs(itemId: string): Promise<QueryResult<WasteLog[]>>

// Analytics
export async function getWasteSummary(siteId: string, dateRange?: DateRange): Promise<QueryResult<WasteSummary>>
export async function getWasteByMonth(siteId: string, year: number): Promise<QueryResult<MonthlyWaste[]>>

// Compliance
export async function getUnrenderedWaste(siteId: string): Promise<QueryResult<WasteLog[]>>
export async function getUnwitnessedWaste(siteId: string): Promise<QueryResult<WasteLog[]>>
export async function getUnsyncedMetrcWaste(siteId: string): Promise<QueryResult<WasteLog[]>>

// Metrc sync
export async function markWasteAsSynced(id: string, metrcDisposalId: string): Promise<QueryResult<void>>
export async function markWasteSyncFailed(id: string, error: string): Promise<QueryResult<void>>
```

**File:** `/lib/supabase/queries/waste-client.ts` (estimated 400-500 lines)
- Client-safe versions using `createBrowserClient()`
- Real-time subscriptions for waste log updates

### Phase 4: RBAC Enhancement (1 hour)

**File:** `/lib/rbac/permissions.ts`

Add waste-specific permissions:
```typescript
'waste:view': {
  key: 'waste:view',
  name: 'View Waste Logs',
  description: 'View waste disposal records',
  resource: 'waste',
  action: 'view'
},
'waste:create': {
  key: 'waste:create',
  name: 'Record Waste',
  description: 'Create waste disposal records',
  resource: 'waste',
  action: 'create'
},
'waste:update': {
  key: 'waste:update',
  name: 'Update Waste Logs',
  description: 'Edit waste records (within 24h)',
  resource: 'waste',
  action: 'update'
},
'waste:witness': {
  key: 'waste:witness',
  name: 'Witness Waste Disposal',
  description: 'Act as witness for waste disposal',
  resource: 'waste',
  action: 'witness'
},
'waste:export': {
  key: 'waste:export',
  name: 'Export Waste Reports',
  description: 'Export waste data for compliance',
  resource: 'waste',
  action: 'export'
},
```

**Update roles to include waste permissions**

### Phase 5: UI Components (8-10 hours)

#### Core Components (4 components)

**`/components/features/waste/waste-recording-form.tsx`** (400-500 lines)
- Multi-step form wizard
- Step 1: Source selection (batch, inventory, general)
- Step 2: Waste details (type, quantity, reason)
- Step 3: Rendering method (50:50 mix, grinding, etc.)
- Step 4: Compliance (photos, witness, signature)
- Step 5: Review and submit
- Jurisdiction-aware (show/hide Metrc fields)
- Photo upload with camera support
- Digital signature canvas
- Real-time validation

**`/components/features/waste/waste-logs-table.tsx`** (350-400 lines)
- Sortable, filterable table
- Columns: Date, Type, Source, Quantity, Method, Witness, Status
- Filters: Date range, waste type, source type, compliance status
- Row actions: View details, export, Metrc sync
- Batch operations: Export selected, mark as synced
- Empty states for no waste logs

**`/components/features/waste/waste-detail-dialog.tsx`** (250-300 lines)
- Full waste log details
- Photo gallery view
- Witness signature display
- Metrc sync status
- Timeline of events
- Edit button (if within 24h)
- Export to PDF

**`/components/features/waste/waste-analytics-dashboard.tsx`** (300-350 lines)
- Summary cards: Total waste, compliance rate, Metrc sync rate
- Charts: Waste by type, waste by month, waste by source
- Trends: Month-over-month comparison
- Compliance alerts: Unrendered, unwitnessed, unsynced

#### Supporting Components (6 components)

**`/components/features/waste/rendering-method-selector.tsx`** (150-200 lines)
- Radio group for rendering methods
- Conditional fields based on method
- 50:50 mix calculator
- Material suggestions (sand, kitty litter, etc.)

**`/components/features/waste/witness-signature-pad.tsx`** (100-150 lines)
- Canvas for digital signature
- Clear and redo buttons
- Save signature as image
- Witness name input

**`/components/features/waste/photo-evidence-uploader.tsx`** (200-250 lines)
- Multi-photo upload
- Camera integration (mobile)
- Before/after photo labeling
- Image preview and removal

**`/components/features/waste/waste-summary-card.tsx`** (80-100 lines)
- Small summary widget for dashboard
- Total waste count and weight
- Compliance status indicator
- Link to full waste management page

**`/components/features/waste/metrc-sync-status-badge.tsx`** (50-60 lines)
- Visual indicator: Pending, Synced, Failed
- Tooltip with sync details
- Retry button for failed syncs

**`/components/features/waste/waste-export-button.tsx`** (150-180 lines)
- Export to CSV/PDF
- Date range selector
- Filter options
- Compliance packet generation

### Phase 6: Page Implementation (3-4 hours)

**`/app/dashboard/waste/page.tsx`** (150-200 lines)
- Server component with RBAC guard
- Fetch initial waste logs
- Render waste analytics dashboard
- Render waste logs table
- "Record Waste" button (opens form dialog)

**`/app/dashboard/waste/[id]/page.tsx`** (100-120 lines)
- Detailed waste log view
- Breadcrumb navigation
- Server-side data fetch
- Edit capability (if within 24h)

**`/app/dashboard/batch/[id]/waste/page.tsx`** (80-100 lines)
- Batch-specific waste logs
- Quick waste recording from batch
- Pre-filled batch context

**`/app/actions/waste.ts`** (200-250 lines)
- Server actions for waste operations
- `createWasteLog(formData)`
- `updateWasteLog(id, formData)`
- `exportWasteLogs(filters)`
- `syncToMetrc(wasteLogId)`

### Phase 7: Jurisdiction Integration (4-5 hours)

**`/lib/jurisdiction/waste-compliance.ts`** (300-400 lines)

```typescript
// Metrc-specific waste compliance
export function validateMetrcWaste(wasteLog: WasteLog, jurisdiction: Jurisdiction): ValidationResult {
  const errors: string[] = [];
  
  // Rendering requirement
  if (!wasteLog.rendered_unusable) {
    errors.push('Cannabis waste must be rendered unusable');
  }
  
  // Witness requirement
  if (!wasteLog.witnessed_by) {
    errors.push('Waste disposal requires a witness');
  }
  
  // Photo evidence
  if (wasteLog.photo_urls.length < 2) {
    errors.push('Minimum 2 photos required (before/after)');
  }
  
  // 50:50 mix for Oregon/Maryland
  if (jurisdiction.state === 'OR' || jurisdiction.state === 'MD') {
    if (wasteLog.rendering_method === 'fifty_fifty_mix' && 
        wasteLog.mix_ratio !== '50:50') {
      errors.push('Oregon/Maryland require 50:50 waste mix ratio');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// CTLS-specific (Canada)
export function validateCTLSWaste(wasteLog: WasteLog): ValidationResult {
  // Canada requirements (less strict than Metrc)
  const errors: string[] = [];
  
  if (wasteLog.photo_urls.length === 0) {
    errors.push('At least 1 photo required for documentation');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// PrimusGFS (Produce) - minimal waste tracking
export function validateProduceWaste(wasteLog: WasteLog): ValidationResult {
  return { isValid: true, errors: [] }; // Basic tracking only
}
```

**Integration with forms:**
- Use `useJurisdiction()` hook to determine active jurisdiction
- Show/hide Metrc-specific fields
- Run jurisdiction-specific validation
- Display jurisdiction-specific help text

### Phase 8: Metrc Integration Preparation (2-3 hours)

**`/lib/compliance/metrc/waste-sync.ts`** (placeholder for future Metrc integration)

```typescript
// Placeholder functions - will be implemented in Compliance Engine phase
export async function syncWasteToMetrc(wasteLog: WasteLog): Promise<MetrcSyncResult> {
  // TODO: Implement Metrc API integration
  // POST /plants/v2/waste or /packages/v2/adjust
  throw new Error('Metrc integration pending - Phase 14');
}

export async function fetchMetrcWasteMethods(): Promise<string[]> {
  // TODO: GET /plants/v2/waste/methods/all
  throw new Error('Metrc integration pending - Phase 14');
}

export async function fetchMetrcWasteReasons(): Promise<string[]> {
  // TODO: GET /plants/v2/waste/reasons
  throw new Error('Metrc integration pending - Phase 14');
}
```

### Phase 9: Testing (4-5 hours)

**Unit Tests:**
- `/lib/supabase/queries/__tests__/waste.test.ts` (200+ lines)
- `/lib/jurisdiction/__tests__/waste-compliance.test.ts` (150+ lines)

**Integration Tests:**
- `/app/dashboard/waste/__tests__/waste-recording.test.tsx` (200+ lines)
- `/app/dashboard/waste/__tests__/waste-table.test.tsx` (150+ lines)

**E2E Tests:**
- `/e2e/waste-management.spec.ts` (300+ lines)
  - Record batch waste with full compliance
  - Record inventory waste
  - Filter and search waste logs
  - Export waste report
  - Witness signature flow

### Phase 10: Documentation (2 hours)

**`/docs/current/2-features/feature-waste-management.md`**
- Feature overview
- User guide
- Metrc compliance checklist
- Troubleshooting

**Update:**
- `/docs/roadmap/index.md` - Add Phase 13 completion
- `/docs/current/index.md` - Update current status
- `/CHANGELOG.md` - Document waste feature

---

## 📊 Estimated Effort

### Total Duration: 8-10 days

| Phase | Duration | Lines of Code |
|-------|----------|---------------|
| Phase 0: Database Enhancement | 1-2 hours | ~150 lines SQL |
| Phase 1: Type Definitions | 2-3 hours | ~500 lines TS |
| Phase 2: Database Migration | 1-2 hours | ~200 lines SQL |
| Phase 3: Backend Queries | 4-5 hours | ~1,400 lines TS |
| Phase 4: RBAC Enhancement | 1 hour | ~50 lines TS |
| Phase 5: UI Components | 8-10 hours | ~2,000 lines TSX |
| Phase 6: Page Implementation | 3-4 hours | ~650 lines TSX |
| Phase 7: Jurisdiction Integration | 4-5 hours | ~400 lines TS |
| Phase 8: Metrc Prep | 2-3 hours | ~200 lines TS |
| Phase 9: Testing | 4-5 hours | ~1,000 lines TS |
| Phase 10: Documentation | 2 hours | N/A |

**Total Estimated Lines:** ~6,500 lines (code + tests + SQL)

---

## 🔗 Dependencies

### Prerequisites (Must be Complete)
- ✅ Batch Management (Phase 12) - Waste from batches
- ✅ Inventory System (Phase 8) - Waste from inventory
- ✅ RBAC System (Phase 2) - Permission enforcement

### Future Integration
- ⏳ Compliance Engine (Phase 14) - Metrc API sync
- ⏳ Task Management (Phase 13) - Waste from task execution
- ⏳ Notifications (Phase 15) - Waste approval workflows

---

## 🎯 Success Criteria

### Functional Requirements
- [ ] Users can record waste from batches with full compliance data
- [ ] Users can record waste from inventory items
- [ ] Users can record general facility waste
- [ ] System enforces jurisdiction-specific rules (Metrc, CTLS, PrimusGFS)
- [ ] Photo evidence uploads work (camera + file upload)
- [ ] Digital witness signatures captured and stored
- [ ] Waste logs filterable and searchable
- [ ] Analytics dashboard shows waste trends
- [ ] Export to CSV/PDF for compliance audits
- [ ] Batch events created automatically when waste recorded

### Compliance Requirements
- [ ] Metrc states: Rendering unusable enforced
- [ ] Metrc states: Witness requirement enforced
- [ ] Metrc states: 2+ photos required
- [ ] 50:50 mix calculator for Oregon/Maryland
- [ ] Waste methods align with state regulations
- [ ] All waste logs have audit trail
- [ ] Cannot modify waste logs after 24 hours

### Technical Requirements
- [ ] 95%+ test coverage
- [ ] TypeScript compilation with 0 errors
- [ ] All components use shadcn/ui patterns
- [ ] RLS policies enforced on waste_logs table
- [ ] Real-time updates via Supabase subscriptions
- [ ] Responsive design (mobile-friendly)
- [ ] Accessibility (WCAG 2.1 AA)

---

## 🚨 Known Challenges

### 1. Metrc API Integration
**Issue:** Full Metrc sync requires Compliance Engine (Phase 14)  
**Mitigation:** Build all UI/database now, add placeholder sync functions  
**Timeline:** Implement full sync in Phase 14

### 2. Photo Storage
**Issue:** Large photo files impact storage costs  
**Mitigation:** 
- Compress photos before upload (max 2MB per photo)
- Use Supabase Storage with CDN
- Implement photo expiration policy (keep 3 years)

### 3. Digital Signatures
**Issue:** Signature pad UX on mobile vs desktop  
**Mitigation:** 
- Use responsive canvas library (react-signature-canvas)
- Touch optimization for mobile
- Allow signature re-capture

### 4. Jurisdiction Complexity
**Issue:** Different rules for OR, MD, Canada, Produce  
**Mitigation:** 
- Use `useJurisdiction()` hook consistently
- Separate validation functions per jurisdiction
- Clear help text for each jurisdiction

---

## 📝 Post-Implementation Tasks

### Phase 14: Compliance Engine Integration
- Implement actual Metrc API calls
- Replace placeholder sync functions
- Add automatic sync on waste creation
- Handle Metrc API errors gracefully
- Implement retry logic for failed syncs

### Phase 15: Enhanced Features
- Waste approval workflows (multi-signature)
- Scheduled waste disposal tasks
- Waste method templates per site
- Waste location management (disposal areas)
- Integration with external waste haulers

### Phase 16: Analytics & Reporting
- Advanced waste analytics (cost analysis)
- Waste reduction recommendations
- Compliance scoring per site
- Metrc sync health monitoring
- Automated compliance packets

---

## 🔄 Integration Points

### Batch System
```typescript
// In batch detail page
<WasteRecordingButton batchId={batch.id} prefillData={{
  source_type: 'batch',
  source_id: batch.id,
  waste_type: 'plant_material',
  unit_of_measure: batch.yield_unit || 'kg'
}} />
```

### Inventory System
```typescript
// In inventory movements
if (movement.movement_type === 'dispose') {
  // Link to waste log
  const wasteLog = await getWasteLogBySourceId('inventory', movement.item_id);
}
```

### Compliance Engine (Future)
```typescript
// Automatic Metrc sync
const wasteLog = await createWasteLog(input);
if (jurisdiction.type === 'METRC') {
  await syncWasteToMetrc(wasteLog); // Phase 14
}
```

---

## 📚 Reference Documents

- [Metrc API Documentation](https://api-or.metrc.com/Documentation)
- [Metrc Waste Disposal Guidelines](https://www.metrc.com/wp-content/uploads/2024/04/MS_IB_0020_Plant-Waste-Disposal-Process.pdf)
- [TRAZO Batch Management](./BATCH_TASK_INTEGRATION_COMPLETE.md)
- [TRAZO Inventory System](../../docs/current/2-features/feature-inventory.md)
- [TRAZO Jurisdiction System](../../lib/jurisdiction/README.md)
- [Metrc API Alignment](../reference/METRC_API_ALIGNMENT.md)

---

**Last Updated:** November 17, 2025  
**Next Review:** After Phase 12 (Batch Management) completion  
**Status:** 🎯 Ready to Build
