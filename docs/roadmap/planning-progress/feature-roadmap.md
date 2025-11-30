# Feature Roadmap

**Navigation:** [← Back to Roadmap Index](./index.md)

---

## Overview

This roadmap outlines all planned features for TRAZO MVP, organized by development phases. Features are prioritized based on business value, dependencies, and integration complexity.

---

## Current Status

- ✅ **Phase 1-8:** Foundation + Identity + Inventory - COMPLETE
- ⏳ **Phase 10:** Monitoring & Telemetry - PENDING LIVE DATA TESTING
- ⏳ **Phase 11:** Recipe Management - PENDING PRODUCE TESTING
- ⏳ **Phase 12-16:** Tasks, Batch, Compliance, Alarms, Settings

---

## Phase 10: Monitoring & Telemetry ⏳ PENDING LIVE DATA TESTING

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

## Phase 11: Recipe Management ⏳ PENDING PRODUCE TESTING

**Status:** Pending Produce Account Testing (Build verified: 0 errors, 49 pages generated)

### Completed Deliverables ✅

**Database (10 tables, 2 migrations, 28 indexes, 26 RLS policies):**
- ✅ Recipe management tables with version control
- ✅ Environmental setpoints (day/night values)
- ✅ Nutrient formulas and schedules
- ✅ Recipe activation tracking
- ✅ Control overrides with precedence system
- ✅ Batch groups for multi-pod assignments
- ✅ Complete audit trail (control_logs)
- ✅ Deployed to US & Canada Supabase regions

**Backend (2,163 lines TypeScript):**
- ✅ `/types/recipe.ts` (480 lines, 40+ interfaces)
- ✅ `/lib/supabase/queries/recipes.ts` (973 lines, 20+ functions)
- ✅ `/lib/supabase/queries/environmental-controls.ts` (608 lines, 24+ functions)
- ✅ `/app/actions/recipes.ts` (9 server actions with RBAC)
- ✅ Full CRUD operations with versioning
- ✅ Recipe activation/deactivation
- ✅ Override precedence resolution
- ✅ Stage advancement automation

**Frontend Components:**
- ✅ `recipe-library.tsx` (247 lines) - Browse, search, filter recipes
- ✅ `recipe-viewer.tsx` (854 lines) - View recipe details with deprecation system
- ✅ `recipe-author.tsx` (966 lines) - Create/edit recipes with multi-stage builder
- ✅ `active-recipe-display.tsx` - Show active recipe on monitoring pages
- ✅ `assign-recipe-dialog.tsx` - Assign recipes to pods/batches

**Pages:**
- ✅ `/app/dashboard/recipes/page.tsx` - Recipe library with RBAC
- ✅ `/app/dashboard/recipes/[id]/page.tsx` - Recipe detail view
- ✅ `/app/dashboard/recipes/[id]/edit/page.tsx` - Recipe editing
- ✅ `/app/dashboard/recipes/new/page.tsx` - New recipe creation

**Features:**
- ✅ Multi-stage recipe configurations (germination → flowering → curing)
- ✅ Day/night environmental setpoints (temp, humidity, VPD, CO2, light)
- ✅ Photoperiod scheduling with auto-calculated light cycles
- ✅ Nutrient formula management (EC, pH, NPK ratios)
- ✅ Recipe versioning (immutable version history)
- ✅ Recipe deprecation with active application tracking
- ✅ Recipe cloning for template reuse
- ✅ Status lifecycle: draft → published → applied → deprecated
- ✅ Monitoring integration (shows target setpoints vs actual)
- ✅ Automatic status synchronization via database triggers
- ✅ Plant type support (cannabis, produce)
- ✅ Jurisdiction compliance tags

**Quality Metrics:**
- ✅ TypeScript errors: 0 (17 errors fixed Nov 13)
- ✅ ESLint errors: 0
- ✅ Build: Passing (49 pages generated)
- ✅ RBAC: 7 new permissions integrated
- ✅ RLS: 100% coverage on all tables

### Remaining Work ⏳

**Not Yet Implemented:**
- [ ] Manual overrides UI (backend complete, UI deferred)
- [ ] HVAC automation interface (device control - deferred to end)
- [ ] Sidebar navigation menu item
- [ ] Automated test suite (95%+ coverage target)
- [ ] Produce plant type testing (blocked by room creation bug)

**Deferred to Final Polish (Phase 17):**
- Alarm threshold management
- Advanced analytics
- Version comparison UI (diff view)
- TagoIO real device control (currently mocked)

**Reference:** 
- `/Prototypes/RecipePrototype/` (converted)
- `/docs/roadmap/planning-progress/phase-11-complete.md` (detailed report)
- `/docs/current/2-features/feature-recipes.md` (feature documentation)

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

## Phase 13: Batch Management 🔄 PHASE 3 COMPLETE - Frontend Integration Deployed

**Status:** Phase 0-3 Complete (Nov 14, 2025) - Ready for Phase 4 (Module Integration)  
**Dependencies:** Inventory ✅ | Monitoring ✅ | Recipe ✅  
**Timeline:** 1-2 weeks remaining for Phase 4-7 implementation  
**Documentation:** [Prototype Analysis](../integration-deployment/batch-prototype-analysis.md) | [Schema Mapping](../integration-deployment/batch-schema-mapping.md) | [Integration Checklist](../integration-deployment/integration-checklist.md)

### Current Database Status
**All Tables Deployed (13 Total) ✅:**
- ✅ `batches` - Core batch records with domain_type discriminator
- ✅ `cultivars` - Strain/variety definitions with produce fields
- ✅ `batch_pod_assignments` - Pod → Batch mapping
- ✅ `batch_events` - Audit trail
- ✅ `plant_tags` - METRC compliance
- ✅ `batch_collections` - Batch groupings
- ✅ `growing_areas` - Growing zones
- ✅ `batch_stage_history` - Stage transitions
- ✅ `harvest_records` - Harvest tracking
- ✅ `plant_count_snapshots` - Plant counts
- ✅ `post_harvest_records` - Post-harvest processing
- ✅ `batch_genealogy` - Parent-child relationships (4 types: clone/split/merge/cross)
- ✅ `batch_quality_metrics` - Quality history (THC%, Brix, moisture, etc.)

**Domain Enhancement Complete ✅:**
- ✅ Added `domain_type` discriminator ('cannabis' | 'produce') to batches
- ✅ Added 6 cannabis fields: lighting_schedule, thc_content, cbd_content, drying_date, curing_date, terpene_profile
- ✅ Added 9 produce fields: grade, ripeness, brix_level, firmness, color, defect_rate, certifications, storage_temp_c, storage_humidity_pct
- ✅ Added 7 produce cultivar fields: category, flavor_profile, storage_life_days, optimal temps/humidity ranges

### Phase 0: Pre-Integration Research ✅ COMPLETE
**Completed:** November 13, 2025

**Deliverables:**
- ✅ Comprehensive prototype analysis (32 components, 3 services, 970 lines documentation)
- ✅ Platform schema review (11 existing tables assessed, 2 new tables designed, 5 database functions specified)
- ✅ Component reusability assessment (16 ready, 10 adapt, 6 build new)
- ✅ Integration gaps identified (3 high, 3 medium, 3 low priority)
- ✅ Migration strategy defined (4-part migration, 7-10 hours estimated)
- ✅ Alignment with [7-Phase Integration Pattern](../integration-deployment/integration-patterns.md)

### Phase 1: Database Enhancement ✅ COMPLETE
**Completed:** November 13, 2025

**Deliverables:**
- ✅ Migration created: `20251114010000_batch_domain_enhancement_v2.sql`
- ✅ Domain discriminator deployed: domain_type field added to batches table
- ✅ New tables created: batch_genealogy (8 columns), batch_quality_metrics (10 columns)
- ✅ Cannabis fields added: 6 fields including THC/CBD content, terpene_profile
- ✅ Produce fields added: 9 fields to batches, 7 fields to cultivars
- ✅ Database functions created: 5 functions (get_batch_genealogy, transition_batch_stage, quarantine_batch, release_from_quarantine, calculate_quality_score)
- ✅ RLS policies configured: 6 policies across 2 new tables
- ✅ Indexes created: 7 indexes for performance optimization
- ✅ Deployed to US region: November 13, 2025
- ⏳ Deploy to Canada region: Pending

**Evidence:**
- Migration file: `/supabase/migrations/20251114010000_batch_domain_enhancement_v2.sql`
- Supabase MCP verification: 13 batch tables confirmed deployed

### Remaining Phases (4-7) ⏳ READY TO START

**Phase 2: Backend Implementation ✅ COMPLETE (Nov 13, 2025)**
- [x] Created `/types/batch.ts` with discriminated unions for cannabis/produce (480 lines)
- [x] Created `/lib/supabase/queries/batches.ts` with 20+ query functions (550 lines)
- [x] Created `/lib/supabase/queries/batches-client.ts` for client-side queries (150 lines)
- [x] Created `/lib/utils/batch-validation.ts` for domain-specific rules (420 lines)
- [x] Updated RBAC permissions (batch:*, cultivar:* permissions already configured)
- [x] TypeScript types aligned with Supabase schema

**Phase 3: Frontend Integration ✅ COMPLETE (Nov 14, 2025)**
- [x] Created `/app/dashboard/batches/[id]/page.tsx` - Batch detail page (105 lines)
- [x] Created `/app/dashboard/cultivars/page.tsx` - Cultivar management page (105 lines)
- [x] Created 5 new components (~1,400 lines total):
  - `batch-detail-view.tsx` - Tabbed detail view (465 lines)
  - `cultivar-list.tsx` - Cultivar management (230 lines)
  - `stage-transition-dialog.tsx` - Stage workflows (227 lines)
  - `quality-metrics-panel.tsx` - Quality displays (246 lines)
  - `harvest-workflow.tsx` - Harvest recording (228 lines)
- [x] Updated existing components:
  - `batch-table.tsx` - Navigate to detail page
  - `sidebar.tsx` - Added Cultivars link
- [x] Used shadcn/ui components throughout (no custom UI)
- [x] Added RBAC with `usePermissions()`
- [x] Added dev mode support with mock data
- [x] TypeScript errors resolved

**Phase 4: Task/SOP Integration ✅ COMPLETE (Nov 14, 2025)**
- ✅ Database migration: `20251114020000_batch_task_integration.sql`
- ✅ Added batch_id to sop_templates, task_steps, batch_events.task_id
- ✅ Created batch_sop_links table (template associations)
- ✅ Created batch_packets table (document generation tracking)
- ✅ Auto-task trigger function: create_batch_stage_tasks()
- ✅ Backend queries: `/lib/supabase/queries/batch-tasks.ts` (8 functions, 450+ lines)
- ✅ Server actions: `/app/actions/batch-tasks.ts` (4 actions with RBAC)
- ✅ Packet generator: `/lib/utils/batch-packet-generator.ts` (HTML/PDF generation, 380+ lines)
- ✅ UI components:
  - `batch-tasks-panel.tsx` (Tasks & SOPs tab, 350+ lines)
  - `link-template-dialog.tsx` (Template linking, 250+ lines)
- ✅ Updated batch-detail-dialog.tsx with 6th tab
- ✅ RBAC permissions: batch:tasks_link, batch:packet_generate
- ✅ Unit tests: batch-tasks.test.ts, batch-packet-generator.test.ts
- ✅ E2E tests: batch-task-integration.spec.ts (7 scenarios)
- ✅ Total: 9 new files, 6 modified files, ~2,000 LOC

**Evidence:** `/BATCH_TASK_INTEGRATION_COMPLETE.md`

**Phase 5: Additional Module Integration (1-2 days) ⏳ READY**
- Link to Inventory (seed consumption → harvest addition)
- Link to Recipe (activation triggers)
- Link to Monitoring (environmental adherence scoring)

**Phase 6-7: Advanced Testing & Production Deployment (2-3 days)**
- Integration tests for task workflows
- E2E scenarios (cannabis + produce batches)
- Migration deployment to Canada region
- Production PDF generation (Puppeteer integration)
- Advanced documentation updates

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

## Phase 15: Alarms & Notifications ⏳ DEFERRED TO FINAL POLISH

**Dependencies:** Monitoring & Telemetry ✅

**Note:** Alarm policy configuration, notification routing, and escalation rules will be implemented at the end when all features are working and can display their real-time information in the alarm system.

### Planned Deliverables (End of Development)

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
| 10 | Monitoring & Telemetry | 3 weeks | ⏳ Pending Live Testing |
| 11 | Recipe Management | 2-3 weeks | ⏳ Pending Testing |
| 12 | Task Management & SOPs | 2 weeks | ⏳ Not Started |
| 13 | Batch Management | 2-3 weeks | 🔄 Phase 3 Complete (60% done) |
| 14 | Compliance Engine | 3 weeks | ⏳ Not Started |
| 15 | Alarms & Notifications | 1-2 weeks | ⏳ Not Started |
| 16 | Settings & Integrations | 1 week | ⏳ Not Started |

**Total Estimated Time:** 21-27 weeks

---

**Navigation:** [← Back to Roadmap Index](./index.md) | [← Deployment Guide](./deployment-guide.md) | [Next: Integration Patterns →](./integration-patterns.md)
