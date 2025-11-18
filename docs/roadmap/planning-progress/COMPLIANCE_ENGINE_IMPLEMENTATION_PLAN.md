# Compliance Engine Implementation Plan

**Created:** November 17, 2025  
**Status:** Planning Phase  
**Priority:** Phase 14 (After Batch Management & Task Management)

---

## Executive Summary

This document outlines the implementation plan for integrating TRAZO's Compliance Engine with Metrc (Oregon/Maryland cannabis tracking), with extensible architecture for CTLS (Canada Cannabis) and PrimusGFS (Produce Safety). The implementation follows TRAZO's existing patterns and leverages the current jurisdiction system.

---

## 1. Architecture Overview

### 1.1 Current State Analysis

**Existing Infrastructure:**
- ✅ Jurisdiction system with Oregon/Maryland/Canada configs (`lib/jurisdiction/`)
- ✅ Compliance tables in database (`compliance_reports`, `evidence_vault`)
- ✅ RBAC with `compliance_qa` role and permissions
- ✅ Prototype compliance engine in `/Prototypes/ComplianceEnginePrototype/`
- ✅ 47+ shadcn/ui components ready for reuse

**Metrc API Requirements (from web research):**
- **Authentication:** 2-tier system (Vendor API Key + User API Key)
- **Base URL:** State-specific (e.g., `api-or.metrc.com`, `api-md.metrc.com`)
- **Key Endpoints:**
  - `/facilities/v2/` - Facility management
  - `/packages/v2/` - Package tracking (inventory)
  - `/plantbatches/v2/` - Plant batch management
  - `/plants/v2/` - Individual plant tracking
  - `/harvests/v1/` - Harvest operations
  - `/sales/v1/` - Sales transactions
  - `/transfers/v1/` - Transfer manifests
- **Pagination:** Supported on collection endpoints
- **Real-time Sync:** Required for California, 24-hour window for Oregon/Maryland
- **License Requirements:** State license number + Facility API key per site

### 1.2 Proposed Architecture

```
lib/compliance/
├── metrc/
│   ├── client.ts              # Core Metrc API client
│   ├── auth.ts                # Authentication handler
│   ├── endpoints/
│   │   ├── facilities.ts      # Facility operations
│   │   ├── packages.ts        # Package tracking
│   │   ├── plants.ts          # Plant tracking
│   │   ├── harvests.ts        # Harvest operations
│   │   ├── sales.ts           # Sales transactions
│   │   └── transfers.ts       # Transfer manifests
│   ├── sync/
│   │   ├── packages-sync.ts   # Package sync service
│   │   ├── plants-sync.ts     # Plant sync service
│   │   ├── harvests-sync.ts   # Harvest sync service
│   │   └── scheduler.ts       # Sync scheduling
│   ├── validation/
│   │   ├── package-rules.ts   # Package validation rules
│   │   ├── plant-rules.ts     # Plant validation rules
│   │   └── transfer-rules.ts  # Transfer validation rules
│   └── types.ts               # Metrc-specific types
├── ctls/
│   ├── client.ts              # CTLS API client (placeholder)
│   └── types.ts               # CTLS-specific types
├── primus-gfs/
│   ├── audit-manager.ts       # PrimusGFS audit (placeholder)
│   └── types.ts               # PrimusGFS-specific types
├── services/
│   ├── report-generator.ts    # Multi-jurisdiction report generation
│   ├── evidence-service.ts    # Evidence vault operations
│   ├── audit-trail.ts         # Compliance audit logging
│   └── sync-orchestrator.ts   # Coordinates all sync operations
└── types.ts                   # Shared compliance types

app/dashboard/compliance/
├── page.tsx                   # Compliance dashboard (RBAC protected)
├── layout.tsx                 # Compliance section layout
├── reports/
│   ├── page.tsx               # Report list
│   └── [id]/page.tsx          # Report detail
├── sync/
│   └── page.tsx               # Sync status & logs
└── evidence/
    ├── page.tsx               # Evidence vault
    └── [id]/page.tsx          # Evidence detail

components/features/compliance/
├── metrc-sync-status.tsx      # Real-time Metrc sync status
├── report-generator-form.tsx  # Report creation interface
├── evidence-upload.tsx        # Evidence file upload
├── compliance-dashboard.tsx   # Overview dashboard
└── audit-log-viewer.tsx       # Audit trail viewer
```

---

## 2. Database Schema Extensions

### 2.1 New Tables

```sql
```sql
CREATE TABLE compliance_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
  vendor_api_key TEXT NOT NULL,
  user_api_key TEXT NOT NULL,
  facility_license_number TEXT NOT NULL,
  state_code TEXT NOT NULL,
  is_sandbox BOOLEAN DEFAULT false, -- Sandbox vs Production
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrc Sync Operations Log
CREATE TABLE metrc_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Sync Details
  sync_type TEXT NOT NULL CHECK (sync_type IN (
    'packages', 'plants', 'plant_batches', 'harvests', 'sales', 'transfers'
  )),
  direction TEXT NOT NULL CHECK (direction IN ('push', 'pull', 'bidirectional')),
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'sync')),
  
  -- Metrc Reference
  metrc_id TEXT, -- Metrc's ID for the entity
  metrc_label TEXT, -- Metrc's tag/label for the entity
  local_id UUID, -- Our internal ID (references inventory_lots, batches, etc.)
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'failed', 'partial'
  )),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Data
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  error_code TEXT,
  
  -- Audit
  initiated_by UUID REFERENCES users(id),
  retry_count INTEGER DEFAULT 0,
  parent_sync_id UUID REFERENCES metrc_sync_log(id) -- For retry chains
);

-- Metrc Package Mapping (links our inventory to Metrc packages)
CREATE TABLE metrc_package_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Internal Reference
  inventory_lot_id UUID NOT NULL REFERENCES inventory_lots(id) ON DELETE CASCADE,
  
  -- Metrc Reference
  metrc_package_id TEXT NOT NULL,
  metrc_package_label TEXT NOT NULL, -- Tag number
  metrc_package_type TEXT,
  
  -- Sync Status
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT CHECK (sync_status IN ('synced', 'pending', 'conflict', 'error')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(metrc_package_id, site_id),
  UNIQUE(inventory_lot_id)
);

-- Compliance Webhooks (for real-time updates from Metrc)
CREATE TABLE compliance_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Webhook Config
  webhook_type TEXT NOT NULL CHECK (webhook_type IN ('metrc', 'ctls', 'other')),
  endpoint_url TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  
  -- Events to listen for
  subscribed_events TEXT[] NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Schema Updates to Existing Tables

```sql
-- Add Metrc tracking to batches table
ALTER TABLE batches ADD COLUMN IF NOT EXISTS metrc_batch_id TEXT;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS metrc_source_package_labels TEXT[];
ALTER TABLE batches ADD COLUMN IF NOT EXISTS metrc_plant_labels TEXT[];
ALTER TABLE batches ADD COLUMN IF NOT EXISTS metrc_sync_status TEXT 
  CHECK (metrc_sync_status IN ('not_synced', 'synced', 'pending', 'error'));

-- Add Metrc tracking to inventory_movements table
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS metrc_transaction_id TEXT;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS metrc_sync_status TEXT
  CHECK (metrc_sync_status IN ('not_synced', 'synced', 'pending', 'error'));

-- Add Metrc tracking to waste_logs table  
ALTER TABLE waste_logs ADD COLUMN IF NOT EXISTS metrc_waste_id TEXT;
ALTER TABLE waste_logs ADD COLUMN IF NOT EXISTS metrc_sync_status TEXT
  CHECK (metrc_sync_status IN ('not_synced', 'synced', 'pending', 'error'));

-- Indexes for performance
CREATE INDEX idx_metrc_sync_log_site_type ON metrc_sync_log(site_id, sync_type, status);
CREATE INDEX idx_metrc_sync_log_status ON metrc_sync_log(status) WHERE status IN ('pending', 'failed');
CREATE INDEX idx_metrc_package_mappings_lot ON metrc_package_mappings(inventory_lot_id);
CREATE INDEX idx_metrc_package_mappings_label ON metrc_package_mappings(metrc_package_label);
CREATE INDEX idx_batches_metrc_id ON batches(metrc_batch_id) WHERE metrc_batch_id IS NOT NULL;
```

---

## 3. Implementation Phases

### Phase 1: Foundation & Authentication (Week 1)

**Tasks:**
1. Create compliance module structure
2. Implement Metrc API client with authentication
3. Build credential management system
4. Add database migrations for new tables
5. Create RLS policies for compliance tables

**Deliverables:**
- `lib/compliance/metrc/client.ts` - Authenticated API client
- `lib/compliance/metrc/auth.ts` - Key management & validation
- Database migration for compliance tables
- Admin UI for API key management (`app/dashboard/admin/compliance/keys/`)

**Acceptance Criteria:**
- Successfully authenticate with Metrc API
- Store encrypted API keys in database
- Validate keys and retrieve facility info
- Admin can add/update/remove API keys per site

---

### Phase 2: Read Operations & Data Pull (Week 2)

**Tasks:**
1. Implement Metrc endpoint wrappers (GET operations)
2. Build data transformation layer (Metrc → TRAZO format)
3. Create sync services for packages, plants, harvests
4. Implement sync scheduling system
5. Build sync status dashboard

**Deliverables:**
- `lib/compliance/metrc/endpoints/` - All GET operations
- `lib/compliance/metrc/sync/` - Sync services
- `app/dashboard/compliance/sync/` - Sync status UI
- Background job for scheduled syncs

**Acceptance Criteria:**
- Pull package data from Metrc
- Pull plant data from Metrc
- Display sync status in dashboard
- Handle pagination correctly
- Log all sync operations

---

### Phase 3: Write Operations & Data Push (Week 3)

**Tasks:**
1. Implement POST/PUT operations for Metrc
2. Build validation layer for outbound data
3. Create package creation workflow
4. Implement plant tracking workflow
5. Build transfer manifest generation

**Deliverables:**
- POST/PUT operations for packages, plants, transfers
- Data validation matching Metrc requirements
- UI for creating Metrc packages
- UI for plant tag assignment

**Acceptance Criteria:**
- Create packages in Metrc from TRAZO inventory
- Update package status in Metrc
- Create plant tags in Metrc
- Generate transfer manifests
- All operations logged in audit trail

---

### Phase 4: Reporting & Compliance (Week 4)

**Tasks:**
1. Build report generator for monthly Metrc reports
2. Implement inventory reconciliation
3. Create compliance dashboard
4. Build evidence vault integration
5. Implement audit trail viewer

**Deliverables:**
- `lib/compliance/services/report-generator.ts`
- `components/features/compliance/compliance-dashboard.tsx`
- Report generation UI
- Evidence vault UI

**Acceptance Criteria:**
- Generate monthly Metrc compliance reports
- Reconcile TRAZO inventory with Metrc
- Display compliance status per jurisdiction
- Link evidence to compliance reports
- Export reports in required formats

---

### Phase 5: CTLS & PrimusGFS Placeholders (Week 5)

**Tasks:**
1. Create CTLS module structure (placeholder)
2. Create PrimusGFS module structure (placeholder)
3. Build unified compliance interface
4. Update jurisdiction configs
5. Comprehensive testing

**Deliverables:**
- `lib/compliance/ctls/` - Placeholder structure
- `lib/compliance/primus-gfs/` - Placeholder structure
- Unified compliance service layer
- Full test suite (95%+ coverage)

**Acceptance Criteria:**
- Compliance system supports multiple providers
- Easy to add new compliance systems
- All tests passing
- Documentation complete

---

## 4. Key Technical Decisions

### 4.1 Metrc API Client Design

```typescript
// lib/compliance/metrc/client.ts
export class MetrcClient {
  private baseUrl: string
  private vendorApiKey: string
  private userApiKey: string
  
  constructor(config: MetrcConfig) {
    this.baseUrl = this.getStateBaseUrl(config.state)
    this.vendorApiKey = config.vendorApiKey
    this.userApiKey = config.userApiKey
  }
  
  private getStateBaseUrl(state: string): string {
    const stateUrls: Record<string, string> = {
      'OR': 'https://api-or.metrc.com',
      'MD': 'https://api-md.metrc.com',
      'CA': 'https://api-ca.metrc.com',
      // Add more states as needed
    }
    return stateUrls[state] || ''
  }
  
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.vendorApiKey,
        'x-user-api-key': this.userApiKey,
        ...options.headers,
      },
    })
    
    if (!response.ok) {
      throw new MetrcApiError(
        response.status, 
        await response.text()
      )
    }
    
    return response.json()
  }
  
  // Endpoint methods
  packages = new PackagesEndpoint(this)
  plants = new PlantsEndpoint(this)
  harvests = new HarvestsEndpoint(this)
  sales = new SalesEndpoint(this)
  transfers = new TransfersEndpoint(this)
}
```

### 4.2 Data Synchronization Strategy

**Approach:** Bidirectional sync with conflict resolution

1. **Pull Sync (Metrc → TRAZO):**
   - Scheduled hourly for active facilities
   - Pull new packages, plants, harvests
   - Update local records with Metrc changes
   - Log all changes in `metrc_sync_log`

2. **Push Sync (TRAZO → Metrc):**
   - Triggered on relevant operations (batch creation, waste disposal, etc.)
   - Validate data before push
   - Retry on failure (exponential backoff)
   - Maintain sync status per entity

3. **Conflict Resolution:**
   - Metrc is source of truth for synced entities
   - Flag conflicts in UI for manual review
   - Prevent local edits to synced entities
   - Allow override with approval workflow

### 4.3 Security Considerations

1. **API Key Storage:**
   - Encrypt keys at rest using Supabase Vault
   - Never expose keys in client-side code
   - Rotate keys periodically
   - Audit all key access

2. **Data Privacy:**
   - RLS policies on all compliance tables
   - Role-based access (only `compliance_qa` and `admin`)
   - Log all compliance data access
   - Comply with data retention requirements

3. **Audit Trail:**
   - Log all Metrc API calls
   - Track who initiated each sync
   - Immutable audit logs
   - Export capability for regulatory review

---

## 5. Integration with Existing Features

### 5.1 Batch Management Integration

When batch management is implemented:
- Create Metrc plant batch on batch creation (if jurisdiction requires)
- Assign Metrc plant tags during vegetative stage
- Track plant movements and growth phase changes
- Sync harvest operations to Metrc

### 5.2 Inventory Integration

Current inventory system already has:
- `compliance_package_uid` field ready for Metrc IDs
- Lot tracking compatible with package tracking
- FIFO/LIFO compatible with Metrc requirements

Integration points:
- Create Metrc package when creating inventory lot (cannabis jurisdictions)
- Update package location on transfers
- Track package adjustments
- Log waste disposal to Metrc

### 5.3 Task Management Integration

When tasks are implemented:
- Create compliance checklist tasks
- Schedule report generation tasks
- Alert on sync failures
- Remind about submission deadlines

---

## 6. Testing Strategy

### 6.1 Unit Tests

```typescript
// __tests__/lib/compliance/metrc/client.test.ts
describe('MetrcClient', () => {
  it('should authenticate with valid credentials', async () => {
    const client = new MetrcClient(mockConfig)
    const facilities = await client.facilities.list()
    expect(facilities).toBeDefined()
  })
  
  it('should handle authentication errors', async () => {
    const client = new MetrcClient(invalidConfig)
    await expect(client.facilities.list()).rejects.toThrow(MetrcApiError)
  })
  
  it('should paginate large result sets', async () => {
    const client = new MetrcClient(mockConfig)
    const packages = await client.packages.listActive({ limit: 100 })
    expect(packages.length).toBeLessThanOrEqual(100)
  })
})
```

### 6.2 Integration Tests

- Test full sync workflow (pull + push)
- Test conflict resolution
- Test error handling and retry logic
- Test report generation
- Test jurisdiction-specific rules

### 6.3 E2E Tests

```typescript
// e2e/compliance-metrc-sync.spec.ts
test('should sync packages from Metrc', async ({ page }) => {
  await page.goto('/dashboard/compliance/sync')
  await page.click('text=Sync Packages')
  await expect(page.locator('text=Sync Complete')).toBeVisible()
  await expect(page.locator('[data-testid=package-count]')).toContainText('10')
})
```

---

## 7. Placeholder Implementation for CTLS & PrimusGFS

### 7.1 CTLS (Cannabis Tracking and Licensing System - Canada)

```typescript
// lib/compliance/ctls/client.ts
export class CTLSClient {
  // Placeholder structure matching Metrc pattern
  constructor(config: CTLSConfig) {
    // TODO: Implement CTLS authentication
    throw new Error('CTLS integration not yet implemented')
  }
  
  // Placeholder methods
  async submitMonthlyReport(report: CTLSMonthlyReport): Promise<void> {
    throw new Error('Not implemented')
  }
  
  async getProductionData(period: string): Promise<CTLSProductionData> {
    throw new Error('Not implemented')
  }
}

// lib/compliance/ctls/types.ts
export interface CTLSConfig {
  licenseNumber: string
  apiKey: string
  // Add CTLS-specific config as requirements are defined
}

export interface CTLSMonthlyReport {
  reportingPeriod: string
  productionData: unknown
  destructionData: unknown
  inventorySnapshot: unknown
  salesData: unknown
}
```

### 7.2 PrimusGFS (Produce Safety)

```typescript
// lib/compliance/primus-gfs/audit-manager.ts
export class PrimusGFSAuditManager {
  constructor(config: PrimusGFSConfig) {
    // TODO: Implement PrimusGFS audit preparation
    throw new Error('PrimusGFS integration not yet implemented')
  }
  
  // Placeholder methods
  async prepareAuditPackage(): Promise<AuditPackage> {
    throw new Error('Not implemented')
  }
  
  async trackGAPCompliance(): Promise<GAPComplianceStatus> {
    throw new Error('Not implemented')
  }
}

// lib/compliance/primus-gfs/types.ts
export interface PrimusGFSConfig {
  certificationBody: string
  auditSchedule: 'annual' | 'semi-annual'
  // Add PrimusGFS-specific config
}

export interface AuditPackage {
  auditType: 'PrimusGFS' | 'GlobalGAP'
  readinessPercentage: number
  requiredDocuments: string[]
  evidenceLinks: string[]
}
```

### 7.3 Unified Compliance Service

```typescript
// lib/compliance/services/compliance-orchestrator.ts
export class ComplianceOrchestrator {
  private metrcClient?: MetrcClient
  private ctlsClient?: CTLSClient
  private primusGFSManager?: PrimusGFSAuditManager
  
  constructor(jurisdiction: JurisdictionConfig) {
    // Initialize appropriate client based on jurisdiction
    if (jurisdiction.plant_type === 'cannabis') {
      if (jurisdiction.country === 'us') {
        this.metrcClient = new MetrcClient(/* config */)
      } else if (jurisdiction.country === 'canada') {
        this.ctlsClient = new CTLSClient(/* config */)
      }
    } else if (jurisdiction.plant_type === 'produce') {
      this.primusGFSManager = new PrimusGFSAuditManager(/* config */)
    }
  }
  
  async generateComplianceReport(type: string): Promise<ComplianceReport> {
    if (this.metrcClient) {
      return this.generateMetrcReport(type)
    } else if (this.ctlsClient) {
      return this.generateCTLSReport(type)
    } else if (this.primusGFSManager) {
      return this.generatePrimusReport(type)
    }
    throw new Error('No compliance provider configured')
  }
  
  private async generateMetrcReport(type: string): Promise<ComplianceReport> {
    // Metrc-specific report generation
  }
  
  private async generateCTLSReport(type: string): Promise<ComplianceReport> {
    // CTLS-specific report generation (placeholder)
    throw new Error('CTLS reports not yet implemented')
  }
  
  private async generatePrimusReport(type: string): Promise<ComplianceReport> {
    // PrimusGFS-specific report generation (placeholder)
    throw new Error('PrimusGFS reports not yet implemented')
  }
}
```

---

## 8. Documentation Requirements

### 8.1 API Setup Guide

Create `/docs/current/compliance-metrc-setup.md`:
- How to obtain Metrc API keys
- How to configure keys in TRAZO
- State-specific requirements
- Testing in sandbox vs production

### 8.2 User Guide

Create `/docs/current/compliance-workflows.md`:
- Daily sync workflow
- Monthly reporting workflow
- Transfer manifest creation
- Waste disposal reporting
- Troubleshooting common issues

### 8.3 Developer Guide

Create `/docs/current/compliance-architecture.md`:
- System architecture
- Adding new compliance providers
- Extending Metrc endpoints
- Testing compliance integrations

---

## 9. Success Metrics

1. **Functional Completeness:**
   - ✅ Authenticate with Metrc API
   - ✅ Pull package/plant/harvest data
   - ✅ Push inventory movements
   - ✅ Generate compliance reports
   - ✅ Track sync status

2. **Performance:**
   - Sync 1000 packages in < 5 minutes
   - API response time < 2 seconds
   - Report generation < 30 seconds

3. **Reliability:**
   - 99.9% sync success rate
   - Automatic retry on transient failures
   - Zero data loss

4. **User Experience:**
   - One-click sync
   - Clear sync status indicators
   - Helpful error messages
   - Intuitive report generation

5. **Compliance:**
   - 100% audit trail coverage
   - Meet all jurisdiction-specific requirements
   - Regulatory approval for integration

---

## 10. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Metrc API changes | High | Medium | Version API client, monitor Metrc updates, maintain test suite |
| API rate limiting | Medium | High | Implement queuing, backoff, caching |
| Data sync conflicts | High | Medium | Clear conflict resolution UI, Metrc as source of truth |
| Credential compromise | High | Low | Encryption at rest, key rotation, audit logging |
| Jurisdiction rule changes | Medium | Medium | Flexible rule engine, easy config updates |
| Integration complexity | Medium | High | Phased rollout, extensive testing, pilot program |

---

## 11. Go-Live Checklist

### Pre-Launch
- [ ] All unit tests passing (95%+ coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Security audit complete
- [ ] Performance testing complete
- [ ] Documentation complete
- [ ] Admin training complete
- [ ] User training materials ready

### Pilot Phase
- [ ] Select 2-3 pilot sites
- [ ] Configure Metrc credentials
- [ ] Run parallel operations (TRAZO + Metrc manual) for 1 month
- [ ] Daily reconciliation
- [ ] Collect feedback
- [ ] Fix bugs and refine workflows

### Full Rollout
- [ ] Pilot successful (>99% accuracy)
- [ ] All pilot feedback addressed
- [ ] Rollout plan approved
- [ ] Support team trained
- [ ] Monitoring and alerting configured
- [ ] Rollback plan ready

---

## 12. Future Enhancements

1. **Machine Learning:**
   - Predict sync failures
   - Anomaly detection in inventory
   - Smart waste categorization

2. **Advanced Analytics:**
   - Compliance trend analysis
   - Benchmark against industry
   - Predictive compliance scoring

3. **Automation:**
   - Auto-remediate common sync errors
   - AI-powered report generation
   - Smart transfer manifest creation

4. **Multi-State Operations:**
   - Cross-state transfer support
   - Consolidated reporting
   - Multi-jurisdiction dashboards

---

## Appendix A: Metrc Endpoint Reference

Based on web search results, key Metrc v2 endpoints:

### Packages
- `GET /packages/v2/{id}` - Get package by ID
- `GET /packages/v2/{label}` - Get package by label
- `GET /packages/v2/active` - List active packages
- `GET /packages/v2/inactive` - List inactive packages
- `POST /packages/v2/` - Create packages
- `PUT /packages/v2/adjust` - Adjust package quantity
- `DELETE /packages/v2/{id}` - Delete package

### Plants
- `GET /plants/v2/{id}` - Get plant by ID
- `GET /plants/v2/vegetative` - List vegetative plants
- `GET /plants/v2/flowering` - List flowering plants
- `POST /plants/v2/plantings` - Create plantings
- `PUT /plants/v2/growthphase` - Change growth phase
- `PUT /plants/v2/location` - Move plants

### Plant Batches
- `GET /plantbatches/v2/{id}` - Get batch by ID
- `GET /plantbatches/v2/active` - List active batches
- `POST /plantbatches/v2/packages` - Create packages from batch
- `POST /plantbatches/v2/split` - Split batch

### Harvests
- `GET /harvests/v1/{id}` - Get harvest by ID
- `GET /harvests/v1/active` - List active harvests
- `POST /harvests/v1/create/packages` - Create packages from harvest
- `POST /harvests/v1/finish` - Finish harvest

### Sales
- `POST /sales/v1/receipts` - Record sale receipt

### Transfers
- `GET /transfers/v1/incoming` - List incoming transfers
- `GET /transfers/v1/outgoing` - List outgoing transfers
- `POST /transfers/v1/external/incoming` - Create incoming transfer

---

## Appendix B: RBAC Integration

### Required Permissions

```typescript
// Add to lib/rbac/permissions.ts
export const COMPLIANCE_PERMISSIONS = {
  // Compliance viewing
  'compliance:view': 'View compliance reports and status',
  'compliance:reports:view': 'View compliance reports',
  'compliance:sync:view': 'View sync status',
  'compliance:evidence:view': 'View evidence vault',
  
  // Compliance management
  'compliance:reports:create': 'Generate compliance reports',
  'compliance:reports:submit': 'Submit reports to authorities',
  'compliance:sync:trigger': 'Manually trigger sync operations',
  'compliance:evidence:upload': 'Upload evidence files',
  
  // Administrative
  'compliance:config:manage': 'Manage API keys and configuration',
  'compliance:audit:view': 'View full audit trail',
} as const
```

### Role Assignments

- **Admin:** All compliance permissions
- **Compliance QA:** All except `compliance:config:manage`
- **Grower Manager:** View permissions only
- **Executive Viewer:** View reports and dashboard only

---

**End of Implementation Plan**
