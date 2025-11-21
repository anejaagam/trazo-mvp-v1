# Compliance Engine - Executive Summary

**Created:** November 17, 2025  
**Status:** Planning Complete - Ready for Implementation  
**Implementation Phase:** Phase 14 (Post Batch & Task Management)

---

## Overview

The Compliance Engine will integrate TRAZO with state-mandated cannabis tracking systems (Metrc for OR/MD, CTLS for Canada) and food safety standards (PrimusGFS for produce). This enables automatic regulatory compliance, real-time sync with state systems, and comprehensive audit trails.

---

## Business Value

### Regulatory Compliance
- **Automated Reporting:** Generate monthly compliance reports automatically
- **Real-Time Sync:** Keep state systems updated with all inventory movements
- **Audit Trail:** Complete, immutable audit logs for regulatory review
- **Reduce Violations:** Validation rules prevent non-compliant operations

### Operational Efficiency
- **Eliminate Manual Entry:** No more dual data entry (TRAZO + Metrc)
- **Reduce Errors:** Automatic validation catches issues before submission
- **Save Time:** 10-20 hours/month saved on compliance reporting
- **Instant Reports:** Generate compliance reports in seconds

### Risk Mitigation
- **License Protection:** Avoid violations that risk license suspension
- **Financial Protection:** Prevent fines from compliance failures
- **Data Integrity:** Cryptographic audit trails ensure data accuracy
- **Evidence Vault:** Secure storage of all compliance documentation

---

## Technical Architecture

### Integration Layers

```
┌─────────────────────────────────────────────────┐
│           TRAZO Compliance Engine              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│
│  │   Metrc     │  │    CTLS     │  │ Primus  ││
│  │ Integration │  │(Placeholder)│  │  GFS    ││
│  │  (OR/MD)    │  │  (Canada)   │  │(Produce)││
│  └─────────────┘  └─────────────┘  └─────────┘│
│                                                 │
├─────────────────────────────────────────────────┤
│            Compliance Services                  │
│  • Report Generator                            │
│  • Data Sync Orchestrator                      │
│  • Evidence Vault Manager                      │
│  • Audit Trail Logger                          │
├─────────────────────────────────────────────────┤
│           TRAZO Core Features                   │
│  • Inventory System                            │
│  • Batch Management                            │
│  • Task Management                             │
│  • Jurisdiction System                         │
└─────────────────────────────────────────────────┘
```

### Key Components

1. **Metrc API Client** (`lib/compliance/metrc/`)
   - State-specific authentication
   - Complete endpoint coverage (packages, plants, harvests, transfers, sales)
   - Automatic retry and error handling
   - Rate limiting and queuing

2. **Sync Engine** (`lib/compliance/metrc/sync/`)
   - Bidirectional sync (TRAZO ↔ Metrc)
   - Scheduled pulls (hourly)
   - Event-driven pushes (on operations)
   - Conflict resolution

3. **Validation Layer** (`lib/compliance/metrc/validation/`)
   - Pre-submission validation
   - Jurisdiction-specific rules
   - Tag availability checking
   - License verification

4. **Compliance Dashboard** (`app/dashboard/compliance/`)
   - Real-time sync status
   - Report generation
   - Evidence vault
   - Audit log viewer

---

## Metrc Integration Details

### Authentication
- **Vendor API Key:** Provided by Metrc to software integrators
- **User API Keys:** Per-facility keys obtained by license holders
- **Storage:** Encrypted in Supabase Vault
- **Validation:** Automatic key validation on setup

### Data Mapping

| TRAZO Entity | Metrc Entity | Sync Direction | Frequency |
|--------------|--------------|----------------|-----------|
| Inventory Lots | Packages | Bidirectional | Hourly + Real-time |
| Batch Plants | Plants | Bidirectional | Hourly + Real-time |
| Batches | Plant Batches | Bidirectional | Hourly + Real-time |
| Harvest Records | Harvests | Bidirectional | Hourly + Real-time |
| Inventory Movements | Transfers | Push only | Real-time |
| Sales Records | Sales Receipts | Push only | Real-time |

### State-Specific Requirements

**Oregon (OLCC):**
- 24-inch plant tagging rule
- Monthly reports due 15 days after month end
- 7-year record retention
- Waste requires witness + photo

**Maryland (MCA):**
- Individual plant tags in vegetative stage
- Real-time sync encouraged
- 2-year record retention
- Comprehensive testing requirements

**California (BCC):**
- Real-time Metrc integration mandatory
- 24-hour sync window
- CCTT-Metrc system required

---

## Database Schema

### New Tables
- `compliance_api_keys` - Encrypted API credentials
- `metrc_sync_log` - Complete sync operation history
- `metrc_package_mappings` - Links TRAZO inventory to Metrc packages
- `compliance_webhooks` - Real-time update configurations

### Enhanced Tables
- `batches` - Add Metrc batch/plant tracking
- `inventory_lots` - Add Metrc package tracking
- `inventory_movements` - Add Metrc transaction tracking
- `waste_logs` - Add Metrc waste tracking

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- Metrc API client with authentication
- API key management system
- Database migrations
- RLS policies

### Phase 2: Read Operations (Week 2)
- GET operations for all Metrc endpoints
- Data pull sync services
- Sync status dashboard
- Scheduled sync jobs

### Phase 3: Write Operations (Week 3)
- POST/PUT operations for Metrc
- Data push sync services
- Validation layer
- Package/plant creation workflows

### Phase 4: Reporting (Week 4)
- Monthly compliance report generation
- Inventory reconciliation
- Evidence vault integration
- Audit log viewer

### Phase 5: Placeholders & Testing (Week 5)
- CTLS placeholder structure
- PrimusGFS placeholder structure
- Comprehensive test suite (95%+ coverage)
- Documentation

**Total Timeline:** 5 weeks

---

## Compliance Workflow Examples

### 1. Creating Inventory Package

**Old Process (Manual):**
1. Create inventory in TRAZO (5 minutes)
2. Log into Metrc website
3. Navigate to packages
4. Manually create package with all details (10 minutes)
5. Record Metrc ID back in TRAZO (2 minutes)
**Total:** ~17 minutes per package

**New Process (Automated):**
1. Create inventory in TRAZO (5 minutes)
2. System automatically creates Metrc package (instant)
3. Metrc ID stored automatically (instant)
**Total:** 5 minutes per package
**Time Saved:** 12 minutes (70% reduction)

### 2. Monthly Compliance Reporting

**Old Process (Manual):**
1. Export data from TRAZO (15 minutes)
2. Export data from Metrc (15 minutes)
3. Reconcile discrepancies (30-60 minutes)
4. Compile report manually (45 minutes)
5. Review and submit (30 minutes)
**Total:** 2.5-3.5 hours per month

**New Process (Automated):**
1. Click "Generate Report" button
2. System compiles all data automatically (30 seconds)
3. Review auto-generated report (15 minutes)
4. Submit with one click
**Total:** 20 minutes per month
**Time Saved:** 2+ hours per month (90% reduction)

### 3. Waste Disposal

**Old Process (Manual):**
1. Record waste in TRAZO (5 minutes)
2. Take compliance photos
3. Get witness signature
4. Log into Metrc
5. Create waste entry (10 minutes)
6. Upload photos to evidence folder
**Total:** ~20 minutes per event

**New Process (Automated):**
1. Record waste in TRAZO with photos & witness (7 minutes)
2. System creates Metrc waste entry automatically (instant)
3. Photos stored in evidence vault automatically (instant)
**Total:** 7 minutes per event
**Time Saved:** 13 minutes (65% reduction)

---

## Security & Compliance

### Data Security
- **Encryption at Rest:** API keys encrypted in Supabase Vault
- **Encryption in Transit:** All API calls use HTTPS/TLS
- **Key Rotation:** Support for periodic key updates
- **Access Control:** RBAC restricts compliance features to authorized users

### Audit Trail
- **Complete Logging:** Every Metrc API call logged
- **Immutable Records:** Audit logs cannot be modified
- **User Attribution:** Track who initiated each operation
- **Timestamp Accuracy:** Millisecond precision timestamps

### Regulatory Requirements
- **Data Retention:** Configurable per jurisdiction (2-7 years)
- **Evidence Storage:** Secure vault for photos, certificates, test results
- **Audit Reports:** Export complete audit trail for regulators
- **Compliance Verification:** Automated validation against jurisdiction rules

---

## User Roles & Permissions

### Admin
- Manage API keys and configuration
- View all compliance data
- Generate and submit reports
- Full audit trail access

### Compliance QA
- View compliance status
- Generate reports (cannot submit)
- Upload evidence
- View audit trail
- Trigger manual syncs

### Grower Manager
- View compliance status (read-only)
- View sync errors affecting their operations
- Upload evidence for their tasks

### Executive Viewer
- View compliance dashboard
- View summary reports
- No edit capabilities

---

## Success Metrics

### Operational
- **Sync Success Rate:** >99.9%
- **Average Sync Time:** <5 minutes for 1000 packages
- **Error Rate:** <0.1% of operations
- **Uptime:** 99.9% availability

### Business
- **Time Savings:** 10-20 hours/month per site
- **Error Reduction:** 90% fewer data entry errors
- **Compliance Rate:** 100% on-time report submissions
- **Violation Reduction:** 0 compliance violations related to reporting

### Technical
- **Test Coverage:** >95%
- **API Response Time:** <2 seconds
- **Database Query Performance:** <100ms for sync queries
- **Code Quality:** 0 TypeScript errors, 0 critical linter warnings

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Metrc API changes | High | Version API client, monitor updates, maintain test suite |
| Credential compromise | High | Encryption, key rotation, audit logging, MFA |
| Data sync conflicts | Medium | Metrc as source of truth, clear UI for conflicts |
| State law changes | Medium | Flexible rule engine, jurisdiction configs |
| System downtime | High | Queue operations, retry logic, offline mode support |

---

## Development & Testing Strategy

### Sandbox Environment (Recommended)

Use Metrc's sandbox environment for all development and testing:

**Setup:**
1. Request sandbox access: `POST /sandbox/v2/integrator/setup`
2. Configure sandbox URLs: `https://sandbox-api-{state}.metrc.com`
3. Toggle via `NEXT_PUBLIC_METRC_USE_SANDBOX=true`

**Benefits:**
- Zero risk to live compliance data
- Faster testing cycles
- Safe staff training
- Production-identical functionality

**Development Workflow:**
1. **Phase 1-3:** All development in sandbox
2. **Phase 4:** Parallel sandbox + limited production testing
3. **Phase 5:** Production rollout with sandbox fallback

## Go-Live Plan

### Pilot Program (Week 1-2)
1. Select pilot sites with experienced operators
2. Configure Metrc credentials in sandbox
3. Run parallel operations (manual + automated)
4. Daily reconciliation and feedback collection
5. Fix bugs and refine workflows

### Soft Launch (All Sites, 1 Month)
1. Roll out to all sites
2. Continue parallel operations
3. Weekly reconciliation
4. Support team on standby
5. Collect metrics and user feedback

### Full Production
1. Disable manual Metrc entry
2. All operations through TRAZO
3. Monitor metrics daily
4. Regular sync health checks
5. Quarterly compliance audits

---

## Future Enhancements

### Phase 2 Capabilities
- **Machine Learning:** Predict compliance issues before they occur
- **Advanced Analytics:** Trend analysis and benchmarking
- **Multi-State Operations:** Cross-state transfer support
- **API Extensions:** Support for additional Metrc endpoints
- **Mobile App:** Compliance tasks on mobile devices

### Additional Integrations
- **BioTrack (WA, NM):** Expand to BioTrack states
- **LEAF (CO, OR):** Support legacy Colorado system
- **Seed-to-Sale Platforms:** Integrate with other tracking systems
- **Laboratory Systems:** Direct integration with testing labs
- **Financial Systems:** Link to QuickBooks, Xero for financial compliance

---

## ROI Analysis

### Investment
- **Development:** 5 weeks (already in Phase 14 roadmap)
- **Testing:** 2 weeks pilot program
- **Training:** 4 hours per site
- **Ongoing:** Minimal (automated)

### Returns
**Per Site (Annual):**
- **Time Savings:** 120-240 hours/year × $30/hour = $3,600-$7,200
- **Error Prevention:** ~3 violations avoided × $2,500 = $7,500
- **Audit Efficiency:** 20 hours saved × $50/hour = $1,000
- **Total:** $12,000-$15,000 per site per year

**10 Sites:** $120,000-$150,000/year in value
**Payback Period:** <3 months

---

## Conclusion

The Compliance Engine represents a critical capability for TRAZO's cannabis customers, eliminating manual dual-entry, reducing compliance risk, and saving significant operational time. With extensible architecture supporting CTLS and PrimusGFS, the system is ready for multi-jurisdiction, multi-crop operations.

**Recommendation:** Proceed with implementation in Phase 14 after Batch and Task Management are complete, as those features provide the operational data that feeds the compliance system.

---

## Documentation Links

- **[Full Implementation Plan](./COMPLIANCE_ENGINE_IMPLEMENTATION_PLAN.md)** - Detailed technical plan
- **[Metrc API Alignment Guide](../reference/METRC_API_ALIGNMENT.md)** - Data mapping and API details
- **[Jurisdiction System Docs](../../current/feature-jurisdiction.md)** - Current jurisdiction implementation

---

**Document Owner:** Development Team  
**Last Updated:** November 17, 2025  
**Next Review:** Upon Phase 14 start
