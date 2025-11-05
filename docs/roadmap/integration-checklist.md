# Integration Checklist

**Navigation:** [← Back to Roadmap Index](./index.md)

---

## Overview

This checklist tracks all feature integrations from prototypes to the main MVP. Features are organized by priority phases, with detailed sub-tasks for each component migration.

**Current Status:**
- ✅ Phase 1: Foundation Setup - COMPLETE
- ✅ Phase 1.5: Signup Enhancement & UI Consolidation - COMPLETE
- 🔄 Phase 2: Priority 1 Features (Identity, Inventory, Monitoring) - 86% complete
- ⏳ Phase 3: Priority 2 Features (Workflow, Tasks, Compliance, Batch, Alarms)
- ⏳ Phase 4: Settings & Future Structure
- ⏳ Phase 5: Final Integration & Deployment

---

## Phase 1: Foundation Setup ✅ COMPLETE

### Project Structure ✅
- [x] Create folder structure as defined in section 3.1
- [x] Set up `/components/ui/`, `/components/features/`, `/components/shared/`
- [x] Create `/lib/supabase/queries/` directory
- [x] Create `/lib/jurisdiction/` directory
- [x] Create `/lib/rbac/` directory
- [x] Create `/hooks/` directory
- [x] Create `/types/` directory with consolidated types
- [x] Create `/config/` directory

### Database Setup ✅
**Schema deployed to both regions**
- [x] Create complete schema.sql with all tables
- [x] Define RLS policies for all tables
- [x] Define RLS policies for org-scoped data access
- [x] Define triggers for updated_at and audit logging
- [x] Define indexes for performance
- [x] Deploy schema to US Supabase instance (deployed)
- [x] Deploy schema to Canada Supabase instance (deployed)

### RBAC System ✅
- [x] Define roles in `/lib/rbac/roles.ts` (8 roles)
- [x] Define permissions in `/lib/rbac/permissions.ts` (50+ permissions)
- [x] Create permission guard functions in `/lib/rbac/guards.ts`
- [x] Create `usePermissions()` hook
- [x] Update signup flow to assign default role (org_admin)
- [x] Add automatic role assignment for first org user

### Jurisdiction System ✅
- [x] Create jurisdiction configs (Oregon, Maryland, Canada, PrimusGFS)
- [x] Create `JurisdictionProvider` context
- [x] Create `useJurisdiction()` hook
- [x] Update signup flow to capture jurisdiction + plant type

### Dashboard Layout ✅
- [x] Create `dashboard/` route (renamed from `(dashboard)`)
- [x] Create dashboard layout with navigation
- [x] Create dashboard sidebar component
- [x] Create dashboard header component
- [x] Implement navigation based on user role
- [x] Add breadcrumbs component
- [x] Add dev mode bypass for UI development

---

## Phase 1.5: Signup Enhancement & UI Consolidation ✅ COMPLETE

### Enhanced Signup Flow ✅
- [x] Modify Step 1 to automatically assign `org_admin` role to first user
- [x] Remove role dropdown from Step 1
- [x] Add informational panel explaining org_admin privileges
- [x] Add plant type selection to Step 2 (Cannabis/Produce)
- [x] Add jurisdiction selection to Step 2 (Oregon, Maryland, Canada, PrimusGFS)
- [x] Add data region selection to Step 2 (US/Canada)
- [x] Implement conditional jurisdiction options based on plant type
- [x] Update form validation for new fields
- [x] Test signup flow with localStorage persistence

### UI Component Consolidation ✅
- [x] **Audit all shadcn/ui components** across 11 prototypes
- [x] **Create UI component inventory** (UI_COMPONENT_AUDIT.md)
- [x] **Migrate 38 essential components** from BatchManagementPrototype
- [x] **Update all imports** to reference consolidated components
- [x] **Document component library** in CURRENT.md
- [x] Verify no duplicate components
- [x] Total available components: 47+ (11 original + 38 migrated - 2 duplicates)

### Testing & Documentation ✅
- [x] Create comprehensive test suite for signup flow
- [x] Write 19 tests covering validation, role assignment, jurisdiction logic
- [x] Achieve 100% test pass rate
- [x] Create PHASE_2_SUMMARY.md
- [x] Update CURRENT.md
- [x] Update NextSteps.md
- [x] Create DEV_MODE.md for development workflow

### Development Tools ✅
- [x] Add dev mode bypass for dashboard access without authentication
- [x] Rename dashboard folder from `(dashboard)` to `dashboard` for proper routing
- [x] Create mock user data for development
- [x] Add visual dev mode indicator banner

---

## Phase 2: Priority 1 Features 🔄 IN PROGRESS

### Identity & Roles ✅ COMPLETE
- [x] Migrate admin components to `/components/features/admin/`
- [x] Create `/app/dashboard/admin/` pages
- [x] Implement user table with CRUD operations
- [x] Implement role management interface
- [x] Implement permission matrix view
- [x] Create audit log viewer
- [x] Add permission checks to all admin pages

### Inventory ✅ COMPLETE
See [CURRENT.md - Inventory Feature](../CURRENT.md#inventory-feature) for full details

- [x] Enhance database schema (add `inventory_lots` table, views, functions)
- [x] Create type definitions in `/types/inventory.ts`
- [x] Migrate inventory components to `/components/features/inventory/`
- [x] Create `/app/dashboard/inventory/` pages (5 pages)
- [x] Implement inventory queries in `/lib/supabase/queries/`
- [x] Create inventory dashboard with summary cards
- [x] Implement item creation/editing with par levels
- [x] Implement lot tracking (FIFO/LIFO/FEFO)
- [x] Implement movement tracking (receive, issue, adjust)
- [ ] Implement waste disposal (dispose) — **Deferred to shared waste feature**
- [ ] **Consolidate waste management** (create shared components for batch + inventory) — **Deferred**
- [ ] Add jurisdiction-aware waste disposal form (uses `useJurisdiction()`) — **Deferred**
- [x] Implement low stock alerts
- [x] Implement expiry alerts
- [x] Add inventory exports (CSV)

**API Status:**
- ℹ️ API endpoints available (4): GET/POST `/api/inventory/items`, PATCH/DELETE `/api/inventory/items/[id]`
- ℹ️ Movements and Alerts endpoints deferred (dev movements route exists)
- ℹ️ Live data present in US region as of Oct 27, 2025 (6 items, 18 lots, 8 movements, 2 alerts)

### Deployment Preflight (Phase 9 Preview)
- [ ] Confirm typecheck/tests pass locally (use the VS Code task)
- [ ] Verify US/CA environment variables are present and correct (no secrets in repo)
- [ ] Validate the 4 production Inventory endpoints in a local run (items list/create/update/delete)
- [ ] Confirm dev-only movements route isn't exposed in production config
- [ ] Sanity-check RLS for key tables (inventory_items, inventory_lots, inventory_movements)
- [ ] Confirm login works in non-dev mode (multi-region sign-in via LoginForm)
- [ ] Update CURRENT.md "Deployment" notes with any observed issues

### Monitoring & Telemetry ✅ PHASE 5 COMPLETE + ✅ PHASE 6 COMPLETE (86% OVERALL)

#### Phase 5: Dashboard Pages ✅ COMPLETE (Oct 29, 2025)
**8 files, 1,169 lines**
- [x] Migrate monitoring components to `/components/features/monitoring/`
- [x] Create `/app/dashboard/monitoring/` pages
- [x] Set up `useTelemetry()` hook with Supabase Realtime
- [x] Create pod status cards
- [x] Create environmental charts (temp, humidity, CO2, VPD)
- [x] Implement telemetry table with filtering
- [x] Add data export functionality
- [x] Use demo data for testing (real data via TagoIO Phase 6)

#### Phase 6: TagoIO Integration ✅ COMPLETE (Oct 29, 2025)
**7 files, 1,743 lines**
- [x] Test TagoIO API endpoints - `scripts/test-tagoio-api.ts` (217 lines)
- [x] Create TagoIO client library - `/lib/tagoio/client.ts` (436 lines)
- [x] Create data transformer - `/lib/tagoio/transformer.ts` (496 lines)
- [x] Create polling service - `/lib/tagoio/polling-service.ts` (374 lines)
- [x] Create Vercel Cron endpoint - `/app/api/cron/telemetry-poll/route.ts` (120 lines)
- [x] Create token validation - `/app/api/validate-tagoio/route.ts` (67 lines)
- [x] Configure Vercel Cron schedule - `vercel.json` (8 lines)
- [x] Document API structure - `TAGOIO_API_ANALYSIS.md`
- [x] Integration settings: Token storage & validation in database
- [x] Fixed table name mismatches: alarm_notifications → notifications

**Pending:**
- [ ] **Update pods with TagoIO device IDs** (30 minutes)
- [ ] **Test end-to-end data flow with live device** (2 hours)

#### Phase 7: Testing & Validation ⏳ IN PROGRESS (6 hours)
- [ ] Unit tests for TagoIO client
- [ ] Unit tests for data transformer
- [ ] Integration test for polling service
- [ ] End-to-end test with live device
- [ ] Documentation updates

**Achievement:** 2,912 lines of production code (Phases 5+6)
**See:** `TAGOIO_INTEGRATION_PHASE6_COMPLETE.md` for full details

### Environmental Controls ⏳ NOT STARTED
- [ ] Migrate control components to `/components/features/controls/`
- [ ] Create `/app/dashboard/controls/` pages
- [ ] Implement recipe queries in `/lib/supabase/queries/recipes.ts`
- [ ] Create recipe editor with stage-based targets
- [ ] Implement recipe library and versioning
- [ ] Create schedule builder
- [ ] Implement manual override panel with safety checks
- [ ] Add safety interlock validation
- [ ] Create conflict detection for simultaneous operations
- [ ] Add recipe application to pods/batches

---

## Phase 3: Priority 2 Features ⏳ NOT STARTED

### Workflow & Tasks
- [ ] Migrate task components to `/components/features/tasks/`
- [ ] Create `/app/dashboard/tasks/` pages
- [ ] Implement task queries in `/lib/supabase/queries/tasks.ts`
- [ ] Create task board (kanban or list view)
- [ ] Implement SOP template editor
- [ ] Create task assignment interface
- [ ] Implement task step completion with evidence capture
- [ ] **Consolidate evidence capture** (merge with batch prototype)
- [ ] Add photo upload to evidence vault
- [ ] Create recurring task scheduler

### Compliance Engine
- [ ] Migrate compliance components to `/components/features/compliance/`
- [ ] Create `/app/dashboard/compliance/` pages
- [ ] Implement compliance queries in `/lib/supabase/queries/compliance.ts`
- [ ] Create compliance dashboard
- [ ] Implement report builder with jurisdiction templates
- [ ] Create evidence vault browser
- [ ] Implement audit log viewer
- [ ] Add report generation (PDF/CSV)
- [ ] Implement record locking for audit protection
- [ ] Create Metrc mapper (Oregon/Maryland)
- [ ] Create CTLS report generator (Canada)
- [ ] Create PrimusGFS report generator (Produce)

### Batch Management
- [ ] Migrate all 19 batch components to `/components/features/batch/`
- [ ] **Consolidate type definitions** from 7 files into `/types/batch.ts`
- [ ] Create `/app/dashboard/batches/` pages
- [ ] Implement batch queries in `/lib/supabase/queries/batches.ts`
- [ ] Create batch dashboard with filtering
- [ ] Implement create batch wizard (jurisdiction-aware)
- [ ] Create batch detail view with timeline
- [ ] Implement cultivar management
- [ ] Create batch genealogy tree view
- [ ] Implement stage transition workflow
- [ ] Add batch metrics panel
- [ ] Create harvest workflow (SOP-002)
- [ ] Implement plant tagging workflow (SOP-001) (for Metrc states)
- [ ] Create plant count tracking
- [ ] Implement post-harvest processing (dry, cure, packaging)
- [ ] Add quarantine management
- [ ] Create room capacity monitor
- [ ] **Consolidate waste disposal** (link to inventory waste)
- [ ] Add batch-to-pod assignments (Pods-as-a-Batch)
- [ ] Implement bulk operations for Metrc compliance

### Alarms & Notifications
- [ ] Migrate alarm components to `/components/features/alarms/`
- [ ] Create `/app/dashboard/alarms/` pages
- [ ] Implement alarm queries in `/lib/supabase/queries/alarms.ts`
- [ ] Create alarm dashboard
- [ ] Implement alarm policy editor
- [ ] Create alarm evaluation engine
- [ ] Implement notification routing (email, SMS, push)
- [ ] Add alarm acknowledgment workflow
- [ ] Create alarm history charts
- [ ] Implement escalation policies
- [ ] Add alarm routing configuration

---

## Phase 4: Settings & Future Structure ⏳ NOT STARTED

### Settings Pages
- [ ] Create `/app/dashboard/settings/` pages
- [ ] Implement profile settings
- [ ] Create organization settings (org admin only)
- [ ] Add notification preferences page
- [ ] Create integrations page (SSO configuration)

### Future Features (Structure Only)
- [ ] Create `/app/dashboard/layout-editor/` with placeholder
- [ ] Add layout editor components to `/components/features/layout/` (empty)

---

## Phase 5: Final Integration & Deployment ⏳ NOT STARTED

### Component Consolidation ✅ ALREADY COMPLETE
- [x] **Audit all shadcn/ui components** across prototypes
- [x] **Merge unique components** into main repo's `/components/ui/`
- [x] **Update all imports** to reference consolidated components
- [x] **Remove duplicate components**

### Cleanup & Organization
- [ ] Remove all mock data files (or move to `/lib/mock/` for testing)
- [ ] Delete old prototype directories
- [ ] Organize utility functions in `/lib/utils.ts`
- [ ] Create shared hooks in `/hooks/`
- [ ] Consolidate validation schemas in `/lib/validations/`
- [ ] Define constants in `/lib/constants/`

### Type System
- [ ] Consolidate all TypeScript types into `/types/`
- [ ] Generate Supabase types from database schema
- [ ] Ensure no type conflicts or duplicates
- [ ] Export types from `/types/index.ts`

### Testing
- [x] Test signup flow (19 tests passing ✅)
- [ ] Test RBAC permissions across all features
- [ ] Test jurisdiction-specific flows (waste, batch creation, etc.)
- [ ] Test multi-regional database routing
- [ ] Test all CRUD operations
- [ ] Test form validations
- [ ] Test error handling

### Database Deployment
- [x] Deploy schema.sql to US Supabase instance
- [x] Deploy schema.sql to Canada Supabase instance
- [x] Verify RLS policies are active
- [x] Test multi-regional data access
- [x] Seed initial data (jurisdictions, default roles)

### Documentation
- [x] Update README with new structure
- [x] Document RBAC permission system (in NextSteps.md)
- [x] Document jurisdiction configuration system (in NextSteps.md)
- [x] Document database schema (in schema.sql comments)
- [ ] Create component usage guide
- [ ] Document API patterns and conventions
- [ ] Create deployment guide

---

**Navigation:** [← Back to Roadmap Index](./index.md) | [Next: Deployment Guide →](./deployment-guide.md)
