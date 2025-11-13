# Feature Roadmap

**Navigation:** [← Back to Roadmap Index](./index.md)

---

## Overview

This roadmap outlines all planned features for TRAZO MVP, organized by development phases. Features are prioritized based on business value, dependencies, and integration complexity.

---

## Current Status

- ✅ **Phase 1-8:** Foundation + Identity + Inventory - COMPLETE
- 🔄 **Phase 10:** Monitoring & Telemetry - 90% complete (device mapping + testing remaining)
- ⏳ **Phase 11-16:** Recipe Management, Tasks, Batch, Compliance, Alarms, Settings

---

## Phase 10: Monitoring & Telemetry 🔄 IN PROGRESS (90% Complete)

**Goal:** Real-time environmental monitoring and historical data visualization

**Status:** Phase 6 Complete (TagoIO Integration - October 29, 2025)

### Completed Deliverables ✅

#### Phase 1: Type Definitions (755 lines, 50+ types)
- Complete telemetry and alarm type system
- Device status interfaces
- Notification types

#### Phase 2: Database Queries (2,054 lines, 45+ functions)
- `/lib/supabase/queries/telemetry.ts` (847 lines)
- `/lib/supabase/queries/telemetry-client.ts` (470 lines)
- `/lib/supabase/queries/alarms.ts` (737 lines)

#### Phase 3: Custom React Hooks (1,100 lines, 7 hooks)
**`/hooks/use-telemetry.ts` (428 lines, 4 hooks):**
- `useTelemetry()` - Single pod real-time monitoring
- `useHistoricalTelemetry()` - Time-series data for charts
- `usePodSnapshots()` - Fleet monitoring
- `useDeviceStatus()` - Hardware health tracking

**`/hooks/use-alarms.ts` (410 lines, 3 hooks):**
- `useAlarms()` - Alarm management with filtering
- `useAlarmSummary()` - Dashboard summary widget

**`/hooks/use-notifications.ts` (267 lines, 1 hook):**
- `useNotifications()` - User notifications

#### Phase 4: Component Migration (2,815 lines, 13 components)
**Tier 1 - Core Monitoring (4 components):**
- `pod-card.tsx` (324 lines) - Individual pod status card
- `fleet-view.tsx` (375 lines) - Grid/table view of all pods
- `environment-chart.tsx` (285 lines) - Time-series visualization with "All Metrics" view
- `pod-detail.tsx` (365 lines) - Comprehensive single-pod view

**Tier 2 - Alarm System (3 components):**
- `alarms-panel.tsx` (408 lines) - Tabbed alarm list
- `alarm-summary-widget.tsx` (132 lines) - Dashboard widget
- `notifications-panel.tsx` (242 lines) - Notification inbox

**Tier 3 - Supporting (6 components):**
- `sensor-card.tsx` (185 lines) - Individual sensor display
- `trend-indicator.tsx` (90 lines) - Metric change arrows
- `real-time-badge.tsx` (36 lines) - Live data indicator
- `stats-grid.tsx` (75 lines) - Summary statistics layout
- `export-button.tsx` (191 lines) - CSV/PDF export
- `time-range-selector.tsx` (162 lines) - Time window picker

#### Phase 5: Dashboard Pages (1,169 lines, 8 files)
**Pages (2 files, 208 lines):**
- `/app/dashboard/monitoring/page.tsx` (94 lines) - Fleet monitoring with RBAC
- `/app/dashboard/monitoring/[podId]/page.tsx` (114 lines) - Pod detail with dynamic routing

**Client Dashboards (2 files, 254 lines):**
- `fleet-monitoring-dashboard.tsx` (209 lines) - Fleet dashboard with grid/table toggle
- `pod-detail-dashboard.tsx` (45 lines) - Pod detail wrapper with navigation

**Supporting Components (1 file, 127 lines):**
- `fleet-grid-view.tsx` (127 lines) - Card-based grid view alternative

**Server Actions (1 file, 133 lines):**
- `/app/actions/monitoring.ts` (133 lines) - 4 server actions with RLS bypass

**Seed System (2 files, 441 lines):**
- `/scripts/seed-monitoring.ts` (171 lines) - Demo data seeding script
- `/lib/supabase/seed-monitoring-data.ts` (270 lines) - Seed data definitions

**Demo Data Created:**
- 3 pods (Alpha-1, Alpha-2, Beta-1) at GreenLeaf Main Facility
- 858 telemetry readings (24-hour simulation with day/night cycles)
- 2 rooms (Flower Room A, Veg Room B)
- 3 device status records

#### Phase 6: TagoIO Integration ✅ COMPLETE (1,743 lines)
- ✅ Test TagoIO API endpoints - `scripts/test-tagoio-api.ts` (217 lines)
- ✅ Create TagoIO client library - `/lib/tagoio/client.ts` (436 lines)
- ✅ Create data transformer - `/lib/tagoio/transformer.ts` (496 lines)
- ✅ Create polling service - `/lib/tagoio/polling-service.ts` (374 lines)
- ✅ Create Vercel Cron endpoint - `/app/api/cron/telemetry-poll/route.ts` (120 lines)
- ✅ Create token validation - `/app/api/validate-tagoio/route.ts` (67 lines)
- ✅ Configure Vercel Cron schedule - `vercel.json` (8 lines)
- ✅ Document API structure - `TAGOIO_API_ANALYSIS.md`
- ✅ Integration settings: Token storage & validation in database
- ✅ Fixed table name mismatches: alarm_notifications → notifications

#### Phase 6.5: Vercel Production Deployment ✅ COMPLETE
**Goal:** Deploy polling architecture to Vercel with automated cron jobs

**Completed Deliverables:**
- ✅ Vercel cron configuration (`vercel.json` - every minute schedule)
- ✅ Production CRON_SECRET generation (64-char secure token)
- ✅ Environment setup automation script (`scripts/setup-vercel-env.sh`)
- ✅ Cron endpoint testing script (`scripts/test-vercel-cron.sh`)
- ✅ Comprehensive deployment guide (`VERCEL_POLLING_DEPLOYMENT.md`)
- ✅ Quick reference guide (`VERCEL_QUICK_REFERENCE.md`)
- ✅ Multi-region Supabase configuration (US/Canada)
- ✅ Cron endpoint security (Bearer token authentication)

**Architecture Deployed:**
```
Vercel Cron (every minute)
  ↓ GET /api/cron/telemetry-poll
TagoIO Polling Service
  ↓ pollDevices()
Supabase Database (US/CA regions)
  ↓ telemetry_readings table
Dashboard Auto-Refresh (30s)
  ↓ /dashboard/monitoring
```

### Remaining Deliverables ⏳

**Phase 7: Testing & Validation (8 hours)**
- [ ] **Update pods with TagoIO device IDs** (30 minutes)
- [ ] **Test end-to-end data flow with live device** (2 hours)
- [ ] Unit tests for TagoIO client (2 hours)
- [ ] Unit tests for data transformer (2 hours)
- [ ] Integration test for polling service (1 hour)
- [ ] Documentation updates (30 minutes)

**Future Enhancements:**
- [ ] Alarm threshold management
- [ ] Advanced analytics and reporting

**Progress:** 70/78 hours (90%), 8 hours remaining

**Achievement:** 2,912 lines of production code (Phases 5+6)

**Database:** `telemetry_readings`, `alarms`, `notifications`, `integration_settings` tables deployed

**Reference:** `/Prototypes/MonitoringAndTelemetryPrototype/`

**See:** `TAGOIO_INTEGRATION_PHASE6_COMPLETE.md` for full details

---

## Phase 11: Recipe Management ⏳ NOT STARTED (2-3 weeks)

**Dependencies:** Monitoring & Telemetry must be complete first

### Deliverables

1. **Recipe Management**
   - Temperature/humidity/CO2 setpoints
   - Multi-stage configurations
   - Recipe templates library

2. **Photoperiod Scheduling**
   - Light cycle automation
   - Sunrise/sunset simulation

3. **Schedule Builder**
   - Automated recipe application
   - Calendar-based planning

4. **Manual Overrides**
   - Emergency controls
   - Maintenance mode
   - Safety interlocks

5. **HVAC Automation Interface**
   - Equipment control
   - Conflict detection

6. **Database Tables**
   - `recipes` and `recipe_applications` tables usage

**Reference:** `/Prototypes/RecipePrototype/` (formerly EnvironmentalControlsPrototype)

---

## Phase 12: Task Management & SOPs ⏳ NOT STARTED (2 weeks)

### Deliverables

1. **SOP Template Builder**
   - Step-by-step instructions
   - Version control

2. **Task Assignment and Tracking**
   - User assignment
   - Due dates and priorities

3. **Evidence Capture**
   - Photos
   - Signatures
   - Sensor readings

4. **Workflow Automation**
   - Recurring tasks
   - Conditional triggers

5. **Task Completion Validation**
   - Required evidence checks
   - Approval workflows

6. **Database Tables**
   - `tasks`, `task_steps`, `sop_templates` tables usage

**Reference:** `/Prototypes/WorkflowAndTaskManagementPrototype/`

---

## Phase 13: Batch Management 🔄 PHASE 0 COMPLETE (Research)

**Status:** Pre-Integration Research Complete (Nov 13, 2025)  
**Dependencies:** Inventory ✅ | Monitoring ✅ | Recipe 🔄  
**Timeline:** 2-3 weeks (Phase 1-7)  
**Documentation:** [Prototype Analysis](../integration-deployment/batch-prototype-analysis.md) | [Schema Mapping](../integration-deployment/batch-schema-mapping.md)

### Phase 0: Pre-Integration Research ✅ COMPLETE
**Completed:** November 13, 2025 (Steps 0.1-0.2)

**Deliverables:**
- ✅ Comprehensive prototype analysis (32 components, 3 services, 970 lines documentation)
- ✅ Platform schema review (5 existing tables, 3 new tables, 4 database functions)
- ✅ Component reusability assessment (16 ready, 10 adapt, 6 build new)
- ✅ Integration gaps identified (3 high, 3 medium, 3 low priority)
- ✅ Migration strategy defined (4-part migration, 7-10 hours)
- ✅ Alignment with [7-Phase Integration Pattern](../integration-deployment/integration-patterns.md)

### Remaining Phases (1-7) ⏳ NOT STARTED

**Phase 1: Database Enhancement (1-2 days)**
- Add domain_type field (discriminator for cannabis/produce)
- Create 3 new tables: batch_genealogy, batch_quality_metrics, harvest_records
- Add cannabis fields: lighting_schedule, THC/CBD content, drying/curing dates
- Add produce fields: grade, ripeness, brix, certifications
- Create 8 database functions for workflows
- Deploy to US & Canada regions

**Phase 2: Backend Implementation (2-3 days)**
- Create `/types/batch.ts` with discriminated unions (~400 lines)
- Create `/lib/supabase/queries/batches.ts` with 20+ query functions (~800 lines)
- Create `/lib/utils/batch-validation.ts` for domain-specific rules
- Update RBAC permissions (8 new batch permissions)

**Phase 3: Frontend Integration (3-4 days)**
- Adapt 10 components from prototype (~2,500 lines)
- Build 6 new components (including critical BatchDetailView)
- Use shadcn/ui components (all available)
- Add RBAC with `usePermissions()`
- Add jurisdiction awareness with `useJurisdiction()`

**Phase 4: Module Integration (1-2 days)**
- Link to Inventory (seed consumption → harvest addition)
- Link to Recipe (activation triggers)
- Link to Monitoring (environmental adherence scoring)

**Phase 5-7: Testing, Documentation, Deployment (3-4 days)**
- Unit tests (95%+ coverage, maintain 94.8% pass rate)
- Integration tests for workflows
- E2E scenarios (cannabis + produce)
- Update documentation
- Deploy to production

### Core Features

1. **Dual-Domain Support** (Cannabis + Produce)
   - Single codebase with discriminated union types
   - Domain-specific workflows and validations
   - Jurisdiction-aware compliance rules

2. **Batch Lifecycle Tracking**
   - Cannabis stages: propagation → vegetative → flowering → harvest → drying → curing → testing → packaging
   - Produce stages: seeding → transplant → growing → harvest → washing → grading → packaging → storage
   - Stage transition validation and audit trail

3. **Batch Genealogy**
   - Parent-child relationships (clones, splits, merges)
   - Multi-generation tracking
   - Cultivar lineage for genetics research

4. **Quality Management**
   - Cannabis: THC%, CBD%, terpenes, moisture, density
   - Produce: Brix, firmness, color, grade, ripeness
   - Historical trending and performance analytics

5. **Harvest Workflows**
   - Step-by-step harvest wizard
   - Wet/dry weight tracking (cannabis)
   - Waste recording by reason
   - Automatic inventory integration

6. **Cultivar Management**
   - Cannabis: Strain type, genetics, cannabinoid ranges
   - Produce: Category, flavor profile, storage life
   - Optimal growing conditions

7. **Compliance Integration**
   - METRC plant tagging (Oregon/Maryland)
   - Batch number generation
   - Audit trail via batch_events table

### Database Schema

**New Tables:**
- `batch_genealogy` - Parent-child relationships
- `batch_quality_metrics` - Quality measurements over time
- `harvest_records` - Detailed harvest tracking

**Enhanced Tables:**
- `batches` - Add domain_type + cannabis/produce fields
- `cultivars` - Add produce category + optimal conditions

**Database Functions:**
- `transition_batch_stage()` - Validate and log stage changes
- `quarantine_batch()` / `release_from_quarantine()`
- `record_harvest()` - Harvest workflow with inventory integration
- `get_batch_genealogy()` - Recursive ancestry tree

### Prototype Components (32 total)

**Ready for Integration (16):**
- CultivarManagement, CultivarSelector, StageProgressBar
- StageHistoryTimeline, QualityMetricsPanel, DomainFieldRenderer
- WasteTracking, LocationTransfer, QuarantineManagement
- GradingSystem, RipenessTracking, HarvestWindowPredictions
- (See [Prototype Analysis](../integration-deployment/batch-prototype-analysis.md) for full list)

**Need Adaptation (10):**
- BatchManagement (replace localStorage, add RBAC)
- BatchModal (use shadcn Form + zod)
- BatchTable (use shadcn Table)
- StageTransitionModal, CannabisWorkflowManager, ProduceWorkflowManager
- (Full list in documentation)

**Build New (6):**
- **BatchDetailView** - Critical gap identified in audit
- BatchDashboard, HarvestWorkflow
- BatchSplitting, BatchMerging (refactor for production)
- CannabisTestingIntegration (future Phase 15)

**Reference:** `/Prototypes/BatchManagementPrototype/unified/`

---

## Phase 14: Compliance Engine ⏳ NOT STARTED (3 weeks)

**Dependencies:** Batch Management

### Deliverables

1. **Metrc Monthly Reporting**
   - Oregon compliance
   - Maryland compliance

2. **CTLS Reporting**
   - Canada compliance

3. **PrimusGFS Audit Preparation**
   - Produce operations

4. **Evidence Vault**
   - Secure document storage
   - Access control

5. **Audit Trail Export**
   - Filtered exports
   - PDF/CSV formats

6. **Compliance Dashboard**
   - Status overview
   - Upcoming deadlines

7. **Database Tables**
   - `compliance_reports`, `evidence_vault` tables usage

**Reference:** `/Prototypes/ComplianceEnginePrototype/`

---

## Phase 15: Alarms & Notifications ⏳ NOT STARTED (1-2 weeks)

**Dependencies:** Monitoring & Telemetry

### Deliverables

1. **Alarm Policy Configuration**
   - Threshold settings
   - Hysteresis rules

2. **Notification Routing**
   - In-app notifications
   - Email alerts
   - SMS (future)

3. **Escalation Rules**
   - Multi-level escalation
   - Time-based triggers

4. **Alarm History**
   - Historical charts
   - Pattern analysis

5. **Acknowledgment Workflow**
   - User acknowledgment
   - Resolution tracking

6. **Database Tables**
   - `alarms`, `alarm_policies`, `alarm_routes` tables usage

**Reference:** `/Prototypes/AlarmsAndNotifSystemPrototype/`

---

## Phase 16: Settings & Integrations ⏳ NOT STARTED (1 week)

### Deliverables

1. **User Preferences**
   - Notification settings
   - Theme customization

2. **Organization Settings**
   - Org admin only
   - Multi-site configuration

3. **SSO Configuration**
   - Future integration

4. **API Integration Management**
   - Third-party connections
   - Webhook configuration

5. **Theme Customization**
   - Light/dark mode
   - Brand colors

---

## Integration Timeline

| Phase | Feature | Duration | Status |
|-------|---------|----------|--------|
| 1-8 | Foundation + Identity + Inventory | 6 weeks | ✅ Complete |
| 10 | Monitoring & Telemetry | 3 weeks | 🔄 90% Complete |
| 11 | Recipe Management | 2-3 weeks | ⏳ Not Started |
| 12 | Task Management & SOPs | 2 weeks | ⏳ Not Started |
| 13 | Batch Management | 3-4 weeks | ⏳ Not Started |
| 14 | Compliance Engine | 3 weeks | ⏳ Not Started |
| 15 | Alarms & Notifications | 1-2 weeks | ⏳ Not Started |
| 16 | Settings & Integrations | 1 week | ⏳ Not Started |

**Total Estimated Time:** 21-27 weeks

---

**Navigation:** [← Back to Roadmap Index](./index.md) | [← Deployment Guide](./deployment-guide.md) | [Next: Integration Patterns →](./integration-patterns.md)
