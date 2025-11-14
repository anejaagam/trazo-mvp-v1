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

## Phase 13: Batch Management ⏳ NOT STARTED (3-4 weeks)

**Dependencies:** Inventory (for material consumption) ✅ DONE

### Deliverables

1. **Plant Lifecycle Tracking**
   - Stage transitions
   - Growth monitoring

2. **Batch Genealogy**
   - Parent-child relationships
   - Cultivar lineage tracking

3. **Stage Transitions**
   - Automated workflows
   - Validation rules

4. **Harvest Workflow**
   - SOP-002 implementation
   - Yield tracking

5. **Plant Tagging System**
   - SOP-001 for Metrc states
   - Barcode/QR code generation

6. **Waste Disposal**
   - Shared with inventory
   - Jurisdiction-aware forms

7. **Database Tables**
   - `batches`, `plant_tags`, `batch_events` tables usage

**Reference:** `/Prototypes/BatchManagementPrototype/`

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
| 13 | Batch Management | 3-4 weeks | ⏳ Not Started |
| 14 | Compliance Engine | 3 weeks | ⏳ Not Started |
| 15 | Alarms & Notifications | 1-2 weeks | ⏳ Not Started |
| 16 | Settings & Integrations | 1 week | ⏳ Not Started |

**Total Estimated Time:** 21-27 weeks

---

**Navigation:** [← Back to Roadmap Index](./index.md) | [← Deployment Guide](./deployment-guide.md) | [Next: Integration Patterns →](./integration-patterns.md)
