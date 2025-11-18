# Compliance Module - README

**Status:** 🚧 Not Yet Implemented - See Implementation Guide  
**Phase:** 14 (Post Batch & Task Management)  
**Start Here:** [COMPLIANCE_ENGINE_AGENT_PROMPT.md](../COMPLIANCE_ENGINE_AGENT_PROMPT.md)

---

## Overview

This directory will contain the Compliance Engine implementation, integrating TRAZO with state-mandated cannabis tracking systems (Metrc for OR/MD, CTLS for Canada) and food safety standards (PrimusGFS for produce).

---

## 📁 Planned Directory Structure

```
lib/compliance/
├── README.md                      # This file
├── index.ts                       # Public API exports
├── types.ts                       # Shared compliance types
│
├── metrc/                         # Metrc (Oregon/Maryland) integration
│   ├── index.ts                  # Metrc exports
│   ├── client.ts                 # Core Metrc API client
│   ├── auth.ts                   # Authentication & key management
│   ├── config.ts                 # State-specific configuration
│   ├── errors.ts                 # Error classes and handling
│   ├── types.ts                  # Metrc-specific types
│   ├── endpoints/                # Metrc API endpoint implementations
│   │   ├── facilities.ts        # Facility operations
│   │   ├── packages.ts          # Package tracking
│   │   ├── plants.ts            # Plant tracking
│   │   ├── plant-batches.ts     # Plant batch operations
│   │   ├── harvests.ts          # Harvest operations
│   │   ├── sales.ts             # Sales transactions
│   │   └── transfers.ts         # Transfer manifests
│   ├── sync/                     # Data synchronization services
│   │   ├── scheduler.ts         # Sync scheduling
│   │   ├── packages-sync.ts     # Package sync service
│   │   ├── plants-sync.ts       # Plant sync service
│   │   ├── harvests-sync.ts     # Harvest sync service
│   │   └── sync-orchestrator.ts # Coordinates all syncs
│   ├── validation/               # Pre-submission validation
│   │   ├── package-rules.ts     # Package validation
│   │   ├── plant-rules.ts       # Plant validation
│   │   ├── transfer-rules.ts    # Transfer validation
│   │   ├── harvest-rules.ts     # Harvest validation
│   │   └── validators.ts        # Common utilities
│   └── __tests__/                # Metrc tests
│       ├── client.test.ts
│       ├── auth.test.ts
│       ├── endpoints/
│       ├── sync/
│       └── validation/
│
├── ctls/                          # CTLS (Canada) integration (placeholder)
│   ├── index.ts                  # CTLS exports
│   ├── client.ts                 # CTLS API client (stub)
│   └── types.ts                  # CTLS-specific types
│
├── primus-gfs/                    # PrimusGFS (Produce) integration (placeholder)
│   ├── index.ts                  # PrimusGFS exports
│   ├── audit-manager.ts          # Audit preparation (stub)
│   └── types.ts                  # PrimusGFS-specific types
│
└── services/                      # Shared compliance services
    ├── report-generator.ts       # Multi-jurisdiction reporting
    ├── reconciliation.ts         # Inventory reconciliation
    ├── evidence-service.ts       # Evidence vault operations
    ├── audit-trail.ts            # Compliance audit logging
    ├── compliance-orchestrator.ts # Routes to appropriate provider
    └── __tests__/                # Service tests
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
**Create:**
- `metrc/client.ts` - Core API client
- `metrc/auth.ts` - Authentication layer
- Database migration for compliance tables
- Admin UI for API key management

### Phase 2: Read Operations (Week 2)
**Create:**
- `metrc/endpoints/*.ts` - All GET operations
- `metrc/sync/*.ts` - Pull sync services
- Sync status dashboard UI

### Phase 3: Write Operations (Week 3)
**Create:**
- Update `metrc/endpoints/*.ts` - POST/PUT operations
- `metrc/validation/*.ts` - Validation layer
- Integration with inventory system

### Phase 4: Reporting (Week 4)
**Create:**
- `services/report-generator.ts`
- `services/reconciliation.ts`
- `services/evidence-service.ts`
- `services/audit-trail.ts`
- Compliance dashboard UI

### Phase 5: Polish (Week 5)
**Create:**
- `ctls/*` - Placeholder structure
- `primus-gfs/*` - Placeholder structure
- `services/compliance-orchestrator.ts`
- Comprehensive tests (>95% coverage)

---

## 🔑 Key Integrations

### Database Tables (to be created)
- `compliance_api_keys` - Encrypted Metrc credentials
- `metrc_sync_log` - Sync operation history
- `metrc_package_mappings` - Links TRAZO inventory to Metrc packages
- `compliance_webhooks` - Real-time update configurations

### Updates to Existing Tables
- `batches` - Add Metrc tracking fields
- `inventory_lots` - Already has `compliance_package_uid`
- `inventory_movements` - Add Metrc transaction tracking
- `waste_logs` - Add Metrc waste tracking

### RBAC Permissions
```typescript
'compliance:view'           // View compliance reports
'compliance:reports:create' // Generate reports
'compliance:reports:submit' // Submit to authorities
'compliance:sync:trigger'   // Manual sync
'compliance:evidence:upload' // Upload evidence
'compliance:config:manage'  // Manage API keys (admin only)
```

---

## 📊 Data Flow

### Pull Sync (Metrc → TRAZO)
```
Scheduled Job (hourly)
  → MetrcClient.packages.listActive()
  → Transform Metrc format → TRAZO format
  → Update inventory_lots
  → Create metrc_package_mappings
  → Log in metrc_sync_log
```

### Push Sync (TRAZO → Metrc)
```
User creates inventory lot
  → Check jurisdiction (cannabis?)
  → Validate package data
  → MetrcClient.packages.create()
  → Store Metrc package ID
  → Create metrc_package_mapping
  → Log in metrc_sync_log
```

### Reporting
```
User requests monthly report
  → Fetch TRAZO data for period
  → Fetch Metrc data via API
  → Reconcile differences
  → Generate report PDF
  → Store in compliance_reports
  → Link evidence from evidence_vault
```

---

## 🧪 Testing Strategy

### Unit Tests
- Test each endpoint independently
- Mock Metrc API responses
- Test validation rules
- Test data transformations
- Target: >95% coverage

### Integration Tests
- Test full sync workflows
- Test report generation
- Test evidence upload/retrieval
- Test with real Metrc sandbox

### E2E Tests
- Configure API keys
- Trigger sync
- Create package
- Generate report
- Upload evidence

---

## 🔐 Security Considerations

### API Key Storage
- Store encrypted in `compliance_api_keys` table
- Use Supabase Vault for encryption
- Never expose in client-side code
- Rotate keys periodically

### Access Control
- All routes protected by RBAC
- RLS policies on all tables
- Audit all API key access
- Log all compliance operations

### Data Privacy
- Comply with state retention requirements
- Secure file upload validation
- Immutable audit trails
- Export capability for regulators

---

## 📚 Documentation

### User Guides (to be created)
- `/docs/current/compliance-setup.md` - Initial setup
- `/docs/current/compliance-workflows.md` - Daily operations
- `/docs/current/compliance-reporting.md` - Monthly reporting
- `/docs/current/compliance-troubleshooting.md` - Common issues

### Developer Guides (to be created)
- `/docs/current/compliance-architecture.md` - Technical details
- `/docs/current/compliance-api.md` - API reference
- `/docs/current/compliance-testing.md` - Testing guide
- `/docs/current/compliance-extension.md` - Adding providers

---

## 🚦 Getting Started

**Ready to implement?**

1. Read the [Agent Prompt](../COMPLIANCE_ENGINE_AGENT_PROMPT.md) - Complete implementation guide
2. Review the [Implementation Plan](../docs/roadmap/planning-progress/COMPLIANCE_ENGINE_IMPLEMENTATION_PLAN.md) - Technical architecture
3. Check the [Metrc Alignment Guide](../docs/roadmap/reference/METRC_API_ALIGNMENT.md) - API details
4. Start with Phase 1 - Foundation

**Questions?**
- See the [Quickstart Guide](../docs/roadmap/planning-progress/COMPLIANCE_ENGINE_QUICKSTART.md)
- Review existing patterns in `/lib/supabase/queries/`
- Check UI components in `/components/ui/` (47+ ready to use)

---

## ✅ Success Criteria

This implementation is complete when:

- ✅ Metrc API client authenticates and syncs data
- ✅ Pull sync runs hourly, push sync on operations
- ✅ Monthly reports generate correctly
- ✅ Evidence vault stores files securely
- ✅ Test coverage >95%
- ✅ All documentation complete
- ✅ Ready for pilot program

---

**Status:** 🚧 **Not Yet Implemented**  
**Start Implementation:** See [COMPLIANCE_ENGINE_AGENT_PROMPT.md](../COMPLIANCE_ENGINE_AGENT_PROMPT.md)
