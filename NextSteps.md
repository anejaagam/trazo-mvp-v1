# TRAZO MVP - Next Steps & Integration Roadmap

**Last Updated:** 2024 (Phase 7: Database Integration Complete)
**Document Version:** 2.0
**Purpose:** Guide for integrating remaining features into Trazo MVP

---

## 🎯 CURRENT STATUS

### **Project Phase**
- ✅ **Phase 1: Foundation** - COMPLETE
- ✅ **Phase 2: Core Integration** - COMPLETE
- ✅ **Phase 7: Database Integration** - COMPLETE ⭐ NEW
- 🚀 **Phase 8: Feature Integration** - Ready to begin

### **Test Status**
- 164/173 tests passing (94.8%)
- 10/11 test suites passing
- Production-ready quality

### 🎉 **LATEST UPDATE: Signup Database Integration Complete (Phase 7)**

**Completed Tasks:**
28. **Fixed actions.ts field references** ✅ - jurisdiction/plant_type moved from step2 → step4
29. **Removed duplicate cropType field** ✅ - Only plant_type remains
30. **Enhanced database trigger** ✅ - handle_new_user() now creates organization AND user profile
31. **Organization auto-creation** ✅ - Uses company_name, jurisdiction, plant_type, data_region from signup
32. **User profile creation** ✅ - Includes emergency contacts, role, organization link
33. **Documentation created** ✅ - `/docs/SIGNUP_DATABASE_INTEGRATION.md` with full details

**What Works Now:**
- ✅ User completes 4-step signup form
- ✅ actions.ts sends all data to supabase.auth.signUp()
- ✅ Trigger automatically creates organization from signup data
- ✅ Trigger creates user profile linked to organization
- ✅ Emergency contacts stored in user profile
- ✅ First user gets org_admin role
- ✅ Multi-region support (US/Canada)

**Test Status:** 164/173 passing (94.8%) - Maintained quality ✅

---

## 🔍 **PREVIOUS UPDATE: Code Inspection & Documentation Consolidation (Phase 6)**

**Comprehensive inspection completed across `/app`, `/lib`, `/hooks`, `/components`:**

**Errors Fixed:**
20. **Missing `idp` field in dev mock user** ✅ - Fixed in `admin/users/page.tsx`
21. **Duplicate flex class in tabs.tsx** ✅ - Removed redundant class
22. **Deprecated moduleResolution** ✅ - Updated `scripts/tsconfig.json`
23. **Missing UserStatus import** ✅ - Added to `lib/supabase/queries/users.ts`
24. **Routing inconsistency** ✅ - All auth flows now redirect to `/dashboard` (not `/protected`)

### **What's Complete**

- ✅ RBAC system (8 roles, 50+ permissions)**Documentation Consolidation:**

- ✅ Jurisdiction engine (4 jurisdictions)25. **Created TestingInfo.md** ✅ - Single source of truth for testing, dev mode, seed data

- ✅ Database schema (20+ tables with RLS)26. **Updated CURRENT.md** ✅ - Added inspection results, documentation structure

- ✅ Dashboard layout and navigation27. **Updated NextSteps.md** ✅ - This file - Latest status and next steps

- ✅ Enhanced signup flow

- ✅ UI component library (47+ components)**Identified Issues (Deferred - Low Priority):**

- ✅ Admin management feature- ⚠️ Login page uses static HTML instead of functional LoginForm component (low impact with dev mode)

- ✅ Development tools (dev mode, seed data)- ⚠️ 9 user query tests failing due to MockQueryBuilder error handling (can be deferred)

- ✅ Comprehensive test suite

**Test Status:** 164/173 passing (94.8%) - Production ready

---

---

## 📋 FEATURE INTEGRATION QUEUE

### ✅ **COMPLETED TASKS (Phase 1)**

### **Phase 3: Priority Features**1. **Prototype Analysis** ✅ - Complete analysis in `/Prototypes/README.md`

2. **Project Structure** ✅ - Full directory structure created  

1. **Inventory Tracking & Management** ← **START HERE**3. **RBAC System** ✅ - 8 roles, 50+ permissions, React hooks in `/lib/rbac/`

   - Stock tracking and procurement4. **Jurisdiction System** ✅ - 4 jurisdictions configured in `/lib/jurisdiction/`

   - Container inventory management5. **Database Schema** ✅ - Complete schema with RLS policies in `/lib/supabase/schema.sql`

   - Low stock alerts6. **Dashboard Layout** ✅ - Route group, sidebar, header, breadcrumbs, main page

   - Inventory audit trails

### ✅ **COMPLETED TASKS (Phase 2)**

2. **Monitoring & Telemetry**7. **Enhanced Signup Flow** ✅ - Automatic org_admin role, jurisdiction/plant type selection

   - Real-time sensor data visualization8. **UI Component Consolidation** ✅ - 38 shadcn/ui components migrated from prototypes

   - Historical data charts9. **Comprehensive Testing** ✅ - 19 passing tests for signup flow

   - Environmental metrics10. **Development Tools** ✅ - Dev mode bypass, dashboard routing fix

   - Alert thresholds11. **Identity & Roles (Admin Management)** ✅ - Complete admin feature integration



3. **Environmental Controls**### ✅ **COMPLETED TASKS (Phase 2.5 - Test Suite Development)**

   - Climate control automation12. **Test Infrastructure** ✅ - Jest configuration, mock patterns, test helpers

   - Lighting schedules13. **Test Suite Expansion** ✅ - 39 new tests added (134 → 173 total)

   - Irrigation systems14. **Test Success Rate** ✅ - Improved from 85.6% to 94.8% (+9.2%)

   - HVAC management15. **Jurisdiction Hook Tests** ✅ - 25/25 comprehensive tests created

16. **Authentication Tests** ✅ - 14/14 region-based auth tests passing

4. **Task Management & SOPs**17. **User Query Tests** ✅ - Rewritten with proper mocking (15/24 passing)

   - Standard operating procedures18. **Test Documentation** ✅ - Comprehensive test development summary created

   - Task assignment and tracking19. **Security Implementation** ✅ - RLS policies, environment config, audit trails

   - Workflow automation

   - Task completion validation**Latest Achievement: Test Suite Development (Oct 19-20, 2025)**

- ✅ 164/173 tests passing (94.8% success rate)

### **Phase 4: Compliance & Batch Management**- ✅ 10/11 test suites fully passing

- ✅ 3 test files created/enhanced (39 new tests)

5. **Compliance Engine**- ✅ Test coverage: Auth 100%, Jurisdiction 100%, RBAC 100%

   - Regulatory reporting- ✅ MockQueryBuilder pattern established for Supabase mocking

   - Evidence collection- ✅ Comprehensive documentation in TEST_SUITE_DEVELOPMENT_SUMMARY.md

   - Compliance documentation- ✅ Test best practices established and documented

   - Jurisdiction-specific rules

**Phase 2 Additional Achievements:**

6. **Batch Management System**- ✅ Modified signup Step 1 to automatically assign `org_admin` role to first user

   - Plant lifecycle tracking- ✅ Added jurisdiction selection to Step 2 (Oregon, Maryland, Canada, PrimusGFS)

   - Batch stage progression- ✅ Added plant type selection to Step 2 (Cannabis, Produce)

   - Compliance integration- ✅ Added data region selection to Step 2 (US, Canada)

   - Batch history and audit- ✅ Conditional jurisdiction options based on plant type

- ✅ Migrated 38 essential shadcn/ui components from prototypes

### **Phase 5: Supporting Features**- ✅ Created UI component audit document (`UI_COMPONENT_AUDIT.md`)

- ✅ Built comprehensive test suite with 100% passing rate

7. **Alarms & Notifications**- ✅ Renamed dashboard folder from `(dashboard)` to `dashboard` for proper routing

   - Environmental alerts- ✅ Added dev mode bypass for UI development without authentication

   - System notifications- ✅ Created development workflow documentation (`DEV_MODE.md`)

   - User preferences- ✅ Updated all documentation to reflect Phase 2 completion

   - Notification history

### 🚀 **NEXT UP: OPTIONAL TEST REFINEMENT, THEN INVENTORY**

8. **Settings Pages**

   - User preferences### 📋 **IMMEDIATE OPTIONAL TASKS (Test Suite Refinement)**

   - Organization settings

   - System configuration**Priority: LOW-MEDIUM** - These can be done now or deferred to focus on feature development

   - API integrations

#### 1. Fix Remaining User Query Tests (Optional - 30 minutes)

---**Current Status:** 15/24 passing (62.5%)

**Issue:** MockQueryBuilder returns error objects but functions expect rejected promises

## 🏗️ INTEGRATION PATTERN (PROVEN)

**What to do:**

Based on successful Admin Management integration:```typescript

// In lib/supabase/queries/__tests__/test-helpers.ts

### **Step 1: Planning** (30 minutes)// Update MockQueryBuilder.then() method:

1. Review prototype in `/Prototypes/[FeatureName]/`then(onFulfilled?: any, onRejected?: any) {

2. Identify database tables needed (reference `/lib/supabase/schema.sql`)  if (this.mockError) {

3. List required permissions (reference `/lib/rbac/permissions.ts`)    return Promise.reject(this.mockError).then(onFulfilled, onRejected);

4. Identify jurisdiction-specific rules (reference `/lib/jurisdiction/`)  }

  return Promise.resolve({ data: this.mockData, error: null }).then(onFulfilled);

### **Step 2: Type Definitions** (1 hour)}

Create `/types/[feature].ts`:```

```typescript

// Define all interfaces, types, and enums**Impact:** Would bring test suite to ~98% passing (172/173 tests)

export interface InventoryItem {**Recommended:** Defer until after feature development unless you want comprehensive error testing

  id: string;

  name: string;#### 2. Create Permissions Hook Tests (Optional - 1 hour)

  quantity: number;**Target:** `hooks/__tests__/use-permissions.test.ts`

  // ... etc**Tests to Create:**

}- Permission checking for different roles

```- Organization-level permission validation

- Site-level permission validation

### **Step 3: Database Queries** (2-3 hours)- Feature flag checks

Create `/lib/supabase/queries/[feature].ts`:- Permission caching behavior

```typescript

// CRUD operations for feature**Impact:** Would add ~20-30 tests, bringing total to ~200 tests

export async function getInventoryItems(supabase: SupabaseClient) {**Recommended:** Defer - permission system already tested via RBAC unit tests

  // Implementation

}#### 3. Integration/E2E Testing Setup (Optional - Future)

```**Current Status:** Unit tests at 94.8% coverage

**Future Consideration:**

### **Step 4: Feature Components** (3-4 hours)- Playwright or Cypress for E2E testing

Create `/components/features/[feature]/`:- Test full user flows (signup → login → admin actions)

- Data table component- Database integration tests with real Supabase instance

- Create/edit dialog- Multi-region routing tests

- Detail view

- Action buttons**Impact:** Production confidence, but requires significant setup time

**Recommended:** Defer until after MVP feature completion

### **Step 5: Page Implementation** (2-3 hours)

Create `/app/dashboard/[feature]/page.tsx`:---

```typescript

// Server Component with auth + permissions### 🎯 **PRIMARY FOCUS: INVENTORY TRACKING & MANAGEMENT**

export default async function FeaturePage() {**Remaining Feature Integration Queue (Per ORIGINAL Integration Checklist):**

  // 1. Check permissions1. ~~**Identity & Roles**~~ ✅ **COMPLETE** (Phase 2 Priority 1)

  // 2. Fetch data2. **Inventory Tracking & Management** ← **START HERE** (Phase 2 Priority 1)

  // 3. Render client wrapper3. **Monitoring & Telemetry** (Phase 2 Priority 1)

}4. **Environmental Controls** (Phase 2 Priority 1)

```5. **Workflow and Task Management** (Phase 3 Priority 2)

6. **Compliance Engine** (Phase 3 Priority 2)

### **Step 6: Testing** (2-3 hours)7. **Batch Management** (Phase 3 Priority 2)

Create `__tests__/` files:8. **Alarms and Notifications** (Phase 3 Priority 2)

- Query function tests9. **Settings Pages** (Phase 4)

- Component tests10. **Final Cleanup & Deployment** (Phase 5)

- Integration tests

### Architecture Status: ✅ FULLY ESTABLISHED + PATTERNS PROVEN

### **Step 7: Seed Data** (1 hour)- ✅ **Next.js 15 App Router** - dashboard route group implemented

Add to `/lib/supabase/seed-data.ts`:- ✅ **Supabase backend** - Multi-regional setup with complete schema

- Sample data for feature- ✅ **Multi-regional** - Database configurations ready

- Realistic test scenarios- ✅ **Jurisdiction-aware** - Rules engine implemented and tested

- ✅ **Role-based access** - Action-level permission granularity

**Total Time per Feature: 12-16 hours**- ✅ **UI Component Library** - 47+ components ready for use

- ✅ **Enhanced Signup** - Complete onboarding with role/jurisdiction selection

---- ✅ **Admin Feature Pattern** - Server/Client hybrid proven with Identity & Roles

- ✅ **Seed Data Infrastructure** - Automated seeding for development testing

## 🔑 KEY FILES TO REFERENCE

---

### **Architecture Patterns**

- `/app/dashboard/admin/users/page.tsx` - Server Component pattern## 1A. ADMIN FEATURE INTEGRATION SUMMARY

- `/components/features/admin/user-table.tsx` - Feature component pattern

- `/lib/supabase/queries/users.ts` - Query module pattern**Completed:** October 17, 2025  

**Status:** Production-ready, awaiting Supabase configuration

### **Foundation Systems**

- `/lib/rbac/` - Permission checking### What Was Delivered

- `/lib/jurisdiction/` - Compliance rules

- `/lib/supabase/schema.sql` - Database schema**27 Files Created/Modified:**

- `/components/ui/` - UI component library1. **5 Admin Pages** - `/app/dashboard/admin/` (overview, users, roles, audit, api-tokens)

2. **3 Query Modules** - 40+ database functions in `/lib/supabase/queries/`

### **Testing Examples**3. **4 Feature Components** - Complete UI in `/components/features/admin/`

- `/hooks/__tests__/use-jurisdiction.test.ts` - Hook testing4. **Type System** - 15+ interfaces in `/types/admin.ts`

- `/lib/supabase/queries/__tests__/users.test.ts` - Query testing5. **Seed Infrastructure** - Sample data + automated script in `/lib/supabase/seed-data.ts` + `/scripts/`

- `/app/auth/sign-up/__tests__/signup-flow.test.ts` - Flow testing6. **Documentation** - 6 comprehensive docs including `/ADMIN_FEATURE.md`



---### Architecture Pattern Established



## 🚀 GETTING STARTED WITH NEXT FEATURE```

Server Component (page.tsx)

### **Before You Begin**  ↓ Auth + Permission Guards

1. ✅ Ensure dev mode is configured (`lib/dev-mode.ts`)  ↓ Fetch Data from Supabase

2. ✅ Run seed data (`npm run seed:dev`)  ↓ Pass to Client Wrapper

3. ✅ Start dev server (`npm run dev`)Client Component (*-client.tsx)

4. ✅ Review prototype analysis in `/Prototypes/README.md`  ↓ Dialog/Modal State

  ↓ Mutations + router.refresh()

### **Starting Inventory Feature**  ↓ Pass to Feature Components

Feature Components (user-table.tsx, etc.)

**Step 1: Review Prototype**  ↓ Display + Interactions

```bash```

# Check the inventory prototype

cat Prototypes/InventoryTrackingPrototype/README.md### Key Learnings for Next Features

```

1. **Server Components First** - Use for data fetching and permission checks

**Step 2: Check Database Schema**2. **Client Wrappers** - Create `-client.tsx` wrappers for interactivity

```sql3. **Type Safety** - Define complete type system upfront in `/types/`

-- Tables already exist in schema.sql:4. **Query Modules** - Organize database functions by resource (users, roles, audit)

-- - inventory_items5. **Seed Data** - Create comprehensive sample data for development

-- - inventory_transactions6. **Permission Guards** - Use `canPerformAction(role, permission)` on every route

-- - procurement_orders7. **Documentation** - Create feature-specific `.md` file with architecture summary

```

### Files to Reference for Next Integration

**Step 3: Check Permissions**

```typescript- `/app/dashboard/admin/users/page.tsx` - Server Component pattern

// Permissions already defined in permissions.ts:- `/app/dashboard/admin/users/user-management-client.tsx` - Client wrapper pattern

// - view_inventory- `/components/features/admin/user-table.tsx` - Feature component example

// - create_inventory- `/lib/supabase/queries/users.ts` - Query module structure

// - edit_inventory- `/types/admin.ts` - Type definition organization

// - delete_inventory- `/ADMIN_FEATURE.md` - Complete integration documentation

```

---

**Step 4: Create Type Definitions**

```bash## 2. Current State Analysis

# Create types file

touch types/inventory.ts### 2.1 Main Repository (trazo-mvp-v1)

```

**Framework & Tech Stack:**

**Step 5: Start Implementation**```typescript

Follow the 7-step integration pattern above.// Current Stack

- Next.js 15 (App Router)

---- React 19

- TypeScript

## 📖 DOCUMENTATION STRUCTURE- Tailwind CSS v4.0

- Supabase (Auth + Database)

### **Core Documents** (Keep Updated)- shadcn/ui components

- `README.md` - Project overview```

- `CURRENT.md` - Current state and status

- `NextSteps.md` - **This file** - Integration roadmap**Existing Structure:**

- `TESTING.md` - Testing guide```

trazo-mvp-v1/

### **Reference Documents**├── app/

- `DATABASE_SETUP.md` - Database schema and setup│   ├── globals.css

- `ENV_SETUP.md` - Environment configuration│   ├── layout.tsx

- `SEED_SETUP.md` - Seed data usage│   ├── page.tsx (redirects based on auth)

- `DEV_MODE.md` - Development mode guide│   ├── auth/

- `UI_COMPONENT_AUDIT.md` - Component inventory│   │   ├── login/page.tsx

- `Prototypes/README.md` - Prototype analysis│   │   └── sign-up/

│   │       ├── page.tsx (Step 1: Personal)

---│   │       ├── step-2/page.tsx (Company)

│   │       ├── step-3/page.tsx (Emergency Contact)

## 🔧 DEVELOPMENT WORKFLOW│   │       └── step-4/page.tsx (Farm Details)

│   ├── landing/page.tsx

### **Daily Workflow**│   └── protected/page.tsx (placeholder dashboard)

1. Start dev server: `npm run dev`├── components/

2. Check test status: `npm test`│   ├── header.tsx

3. Review current feature in `/Prototypes/`│   ├── ui/ (shadcn components)

4. Implement following integration pattern│   └── providers/

5. Add tests as you go├── lib/

6. Update seed data│   ├── utils.ts

7. Run full test suite before committing│   ├── supabase/

│   │   ├── client.ts

### **Feature Completion Checklist**│   │   ├── server.ts

- [ ] Type definitions created│   │   ├── middleware.ts

- [ ] Database queries implemented│   │   └── region.ts

- [ ] Feature components built│   └── types/

- [ ] Page routes created└── middleware.ts

- [ ] Permission guards added```

- [ ] Tests written (unit + integration)

- [ ] Seed data added**Design System:**

- [ ] Documentation updated- Custom green palette (dark-green, lighter-green, lightest-green)

- [ ] Manual testing completed- Lato font family

- [ ] Code review ready- Spacing scale (4px base unit)

- 7 button variants implemented

---- Form components (Field, Checkbox, Label)



## ⚡ QUICK WINS**Authentication:**

- Supabase Auth configured

### **Optional Improvements** (Can defer)- Multi-step signup flow (4 steps)

- Fix 9 failing user query tests (error handling)- Login page with validation

- Add E2E tests with Playwright- Middleware for protected routes

- Expand admin feature tests- Multi-regional support (US/Canada database routing)

- Add middleware tests

### 2.2 Prototype Features

### **Known Issues** (Low Priority)

- Login page uses static HTML instead of LoginForm component**Common Pattern Across Prototypes:**

- Some test mocks need error handling refinement```typescript

// Each prototype has:

These can be addressed after MVP features are complete.- React + TypeScript (no Next.js)

- NO routing (uses tabs or conditional rendering)

---- shadcn/ui components in /components/ui/

- lucide-react icons

## 📞 SUPPORT & RESOURCES- Tailwind CSS styling

- Mock data in /lib/

### **Getting Help**- Type definitions in /types/

- Check `CURRENT.md` for project status- Feature components in /components/

- Review `TESTING.md` for test patterns```

- See `Prototypes/README.md` for feature analysis

- Reference existing code in `/app/dashboard/admin/`**Example: Batch Management Structure** (Heaviest prototype)

```

### **Useful Commands**batch-management-prototype/

```bash├── App.tsx (entry point with tabs)

# Development├── components/

npm run dev                    # Start dev server│   ├── BatchDashboard.tsx

npm test                       # Run unit tests│   ├── BatchDetailView.tsx

npm run test:watch            # Watch mode│   ├── BatchGenealogyView.tsx

npm run test:e2e              # E2E tests│   ├── BatchGroupManagement.tsx

│   ├── BatchMetricsPanel.tsx

# Database│   ├── BatchStageTransition.tsx

npm run seed:dev              # Seed database│   ├── BatchTimeline.tsx

npm run seed:clean            # Clean and reseed│   ├── BulkBatchOperations.tsx (Metrc-specific)

│   ├── CreateBatchDialog.tsx

# Build│   ├── CultivarManagement.tsx

npm run build                 # Production build│   ├── EvidenceCapture.tsx

npm run start                 # Start production server│   ├── HarvestWorkflow.tsx

```│   ├── PlantCountTracking.tsx

│   ├── PlantTaggingWorkflow.tsx

---│   ├── PostHarvestProcessing.tsx

│   ├── QuarantineManagement.tsx

**Last Updated:** October 19, 2025  │   ├── RoomCapacityMonitor.tsx

**Next Feature:** Inventory Tracking & Management  │   ├── WasteDisposalWorkflow.tsx

**Status:** Ready to begin feature integration│   └── WasteLogDashboard.tsx

│   └── ui/ (40+ shadcn components)
├── types/
│   ├── batch.ts (29 interfaces total across 7 files)
│   ├── cultivar.ts
│   ├── harvest.ts
│   ├── plant-tracking.ts
│   ├── post-harvest.ts
│   ├── tagging.ts
│   └── waste.ts
└── lib/
    ├── mock-data.ts
    ├── cultivar-mock-data.ts
    ├── harvest-mock-data.ts
    ├── plant-tracking-mock-data.ts
    ├── tagging-mock-data.ts
    └── waste-mock-data.ts
```

**Known Hardcoded Jurisdictions:**
- Batch Management: Oregon and Maryland Metrc rules
- Waste Management: State-specific disposal requirements
- Inventory: Metrc-style tracking
- Compliance: Jurisdiction-specific templates needed

---

## 3. Target Architecture

### 3.1 Final Application Structure

```
trazo-mvp/
├── app/                                    # Next.js 15 App Router
│   ├── globals.css                         # Global styles (KEEP existing)
│   ├── layout.tsx                          # Root layout (KEEP existing)
│   ├── page.tsx                            # Root redirect (KEEP existing)
│   │
│   ├── (auth)/                             # Auth route group (KEEP existing)
│   │   ├── layout.tsx                      # Auth layout with Header
│   │   ├── login/page.tsx                  # Sign in page
│   │   └── sign-up/                        # Multi-step signup
│   │       ├── page.tsx                    # Step 1
│   │       ├── step-2/page.tsx             # Step 2
│   │       ├── step-3/page.tsx             # Step 3
│   │       ├── step-4/page.tsx             # Step 4
│   │       └── success/page.tsx            # Success page
│   │
│   ├── landing/                            # Public landing (KEEP existing)
│   │   └── page.tsx
│   │
│   ├── (dashboard)/                        # NEW: Main app route group
│   │   ├── layout.tsx                      # Dashboard layout with navigation
│   │   ├── page.tsx                        # Dashboard home (Monitoring & Telemetry)
│   │   │
│   │   ├── monitoring/                     # Real-time Environmental Monitoring
│   │   │   ├── page.tsx                    # Main monitoring dashboard
│   │   │   └── [podId]/                    # Pod-specific detail view
│   │   │       └── page.tsx
│   │   │
│   │   ├── controls/                       # Environmental Controls
│   │   │   ├── page.tsx                    # Controls overview
│   │   │   ├── recipes/page.tsx            # Recipe management
│   │   │   ├── schedules/page.tsx          # Schedule management
│   │   │   └── overrides/page.tsx          # Manual overrides
│   │   │
│   │   ├── inventory/                      # Inventory Tracking
│   │   │   ├── page.tsx                    # Inventory dashboard
│   │   │   ├── items/page.tsx              # Item management
│   │   │   ├── movements/page.tsx          # Movement tracking
│   │   │   └── waste/page.tsx              # Waste management
│   │   │
│   │   ├── batches/                        # Batch Management
│   │   │   ├── page.tsx                    # Batch dashboard
│   │   │   ├── [batchId]/page.tsx          # Batch detail
│   │   │   ├── create/page.tsx             # Create batch
│   │   │   ├── cultivars/page.tsx          # Cultivar management
│   │   │   └── genealogy/page.tsx          # Batch genealogy
│   │   │
│   │   ├── tasks/                          # Workflow & Task Management
│   │   │   ├── page.tsx                    # Task dashboard
│   │   │   ├── [taskId]/page.tsx           # Task detail
│   │   │   ├── sops/page.tsx               # SOP templates
│   │   │   └── schedules/page.tsx          # Task scheduling
│   │   │
│   │   ├── compliance/                     # Compliance Engine
│   │   │   ├── page.tsx                    # Compliance dashboard
│   │   │   ├── reports/page.tsx            # Report generation
│   │   │   ├── evidence/page.tsx           # Evidence vault
│   │   │   └── audit-log/page.tsx          # Audit trail
│   │   │
│   │   ├── alarms/                         # Alarms & Notifications
│   │   │   ├── page.tsx                    # Alarm dashboard
│   │   │   ├── active/page.tsx             # Active alarms
│   │   │   ├── history/page.tsx            # Alarm history
│   │   │   └── policies/page.tsx           # Alarm policies
│   │   │
│   │   ├── layout-editor/                  # Farm Layout Editor (Future)
│   │   │   └── page.tsx                    # Drag & drop editor
│   │   │
│   │   ├── admin/                          # Identity, Roles & Permissions
│   │   │   ├── page.tsx                    # Admin dashboard
│   │   │   ├── users/page.tsx              # User management
│   │   │   ├── roles/page.tsx              # Role management
│   │   │   ├── permissions/page.tsx        # Permission matrix
│   │   │   └── audit/page.tsx              # Admin audit log
│   │   │
│   │   └── settings/                       # Settings
│   │       ├── page.tsx                    # General settings
│   │       ├── profile/page.tsx            # User profile
│   │       ├── organization/page.tsx       # Org settings
│   │       ├── notifications/page.tsx      # Notification preferences
│   │       └── integrations/page.tsx       # SSO & integrations
│   │
│   └── api/                                # API Routes (Future)
│       ├── tagoio/                         # TagoIO integration
│       └── webhooks/                       # Webhook handlers
│
├── components/                             # React Components
│   ├── ui/                                 # shadcn/ui components (CONSOLIDATE)
│   │   ├── button.tsx                      # KEEP main repo version
│   │   ├── field.tsx                       # KEEP main repo version
│   │   ├── checkbox.tsx                    # KEEP main repo version
│   │   ├── form-label.tsx                  # KEEP main repo version
│   │   ├── progress-indicator.tsx          # KEEP main repo version
│   │   └── ... (merge unique components from prototypes)
│   │
│   ├── layout/                             # Layout components
│   │   ├── dashboard-layout.tsx            # NEW: Main dashboard layout
│   │   ├── dashboard-nav.tsx               # NEW: Dashboard navigation
│   │   ├── dashboard-header.tsx            # NEW: Dashboard header
│   │   ├── dashboard-sidebar.tsx           # NEW: Sidebar navigation
│   │   └── breadcrumbs.tsx                 # NEW: Breadcrumb navigation
│   │
│   ├── features/                           # Feature-specific components
│   │   ├── monitoring/                     # From monitoring prototype
│   │   │   ├── pod-status-card.tsx
│   │   │   ├── environmental-chart.tsx
│   │   │   ├── telemetry-table.tsx
│   │   │   └── ...
│   │   │
│   │   ├── controls/                       # From controls prototype
│   │   │   ├── recipe-editor.tsx
│   │   │   ├── schedule-builder.tsx
│   │   │   ├── override-panel.tsx
│   │   │   └── ...
│   │   │
│   │   ├── inventory/                      # From inventory prototype
│   │   │   ├── inventory-table.tsx
│   │   │   ├── item-details.tsx
│   │   │   ├── movement-log.tsx
│   │   │   ├── waste-disposal.tsx
│   │   │   └── ...
│   │   │
│   │   ├── batch/                          # From batch prototype
│   │   │   ├── batch-dashboard.tsx
│   │   │   ├── batch-detail-view.tsx
│   │   │   ├── batch-timeline.tsx
│   │   │   ├── create-batch-dialog.tsx
│   │   │   ├── cultivar-management.tsx
│   │   │   ├── genealogy-view.tsx
│   │   │   ├── harvest-workflow.tsx
│   │   │   ├── plant-tagging.tsx
│   │   │   ├── waste-disposal.tsx          # CONSOLIDATE with inventory waste
│   │   │   └── ...
│   │   │
│   │   ├── tasks/                          # From workflow prototype
│   │   │   ├── task-board.tsx
│   │   │   ├── task-card.tsx
│   │   │   ├── sop-template-editor.tsx
│   │   │   ├── evidence-capture.tsx
│   │   │   └── ...
│   │   │
│   │   ├── compliance/                     # From compliance prototype
│   │   │   ├── compliance-dashboard.tsx
│   │   │   ├── report-builder.tsx
│   │   │   ├── evidence-vault.tsx
│   │   │   ├── audit-log-viewer.tsx
│   │   │   └── ...
│   │   │
│   │   ├── alarms/                         # From alarms prototype
│   │   │   ├── alarm-list.tsx
│   │   │   ├── alarm-detail.tsx
│   │   │   ├── alarm-policy-editor.tsx
│   │   │   └── ...
│   │   │
│   │   └── admin/                          # From identity/roles prototype
│   │       ├── user-table.tsx
│   │       ├── role-editor.tsx
│   │       ├── permission-matrix.tsx
│   │       └── ...
│   │
│   ├── shared/                             # Shared across features
│   │   ├── data-table.tsx                  # Reusable data table
│   │   ├── status-badge.tsx                # Status indicators
│   │   ├── metric-card.tsx                 # KPI card
│   │   ├── filter-bar.tsx                  # Filter controls
│   │   ├── search-input.tsx                # Search component
│   │   ├── date-range-picker.tsx           # Date range selector
│   │   ├── file-upload.tsx                 # File upload
│   │   ├── export-button.tsx               # Export functionality
│   │   └── ...
│   │
│   ├── providers/                          # Context providers
│   │   ├── auth-provider.tsx               # Auth context
│   │   ├── jurisdiction-provider.tsx       # NEW: Jurisdiction context
│   │   ├── theme-provider.tsx              # Theme context
│   │   └── toast-provider.tsx              # Toast notifications
│   │
│   └── header.tsx                          # KEEP: Existing header
│
├── lib/                                    # Utilities & Services
│   ├── utils.ts                            # KEEP: Existing utilities
│   │
│   ├── supabase/                           # Supabase integration
│   │   ├── client.ts                       # KEEP: Client-side
│   │   ├── server.ts                       # KEEP: Server-side
│   │   ├── middleware.ts                   # KEEP: Auth middleware
│   │   ├── region.ts                       # KEEP: Multi-regional
│   │   ├── queries/                        # NEW: Database queries
│   │   │   ├── users.ts
│   │   │   ├── organizations.ts
│   │   │   ├── sites.ts
│   │   │   ├── pods.ts
│   │   │   ├── batches.ts
│   │   │   ├── inventory.ts
│   │   │   ├── tasks.ts
│   │   │   ├── alarms.ts
│   │   │   ├── compliance.ts
│   │   │   └── telemetry.ts
│   │   └── schema.sql                      # NEW: Database schema
│   │
│   ├── tagoio/                             # NEW: TagoIO integration
│   │   ├── client.ts                       # TagoIO API client
│   │   ├── polling-service.ts              # Polling service
│   │   ├── transformer.ts                  # Data transformation
│   │   └── types.ts                        # TagoIO types
│   │
│   ├── jurisdiction/                       # NEW: Jurisdiction system
│   │   ├── config.ts                       # Jurisdiction configuration
│   │   ├── rules.ts                        # Rule engine
│   │   ├── cannabis/                       # Cannabis rules
│   │   │   ├── oregon.ts                   # Oregon Metrc rules
│   │   │   ├── maryland.ts                 # Maryland Metrc rules
│   │   │   └── canada.ts                   # Canada rules
│   │   ├── produce/                        # Produce rules
│   │   │   └── primus-gfs.ts               # PrimusGFS rules
│   │   └── types.ts                        # Jurisdiction types
│   │
│   ├── rbac/                               # NEW: RBAC system
│   │   ├── permissions.ts                  # Permission definitions
│   │   ├── roles.ts                        # Role definitions
│   │   ├── guards.ts                       # Permission guards
│   │   ├── hooks.ts                        # RBAC hooks
│   │   └── types.ts                        # RBAC types
│   │
│   ├── validations/                        # NEW: Validation schemas
│   │   ├── batch.ts                        # Batch validation
│   │   ├── inventory.ts                    # Inventory validation
│   │   ├── task.ts                         # Task validation
│   │   └── ...
│   │
│   └── constants/                          # NEW: Constants
│       ├── batch-stages.ts                 # Batch stage definitions
│       ├── inventory-categories.ts         # Inventory categories
│       ├── alarm-types.ts                  # Alarm type definitions
│       └── ...
│
├── types/                                  # TypeScript Types (CONSOLIDATE)
│   ├── index.ts                            # Main type exports
│   ├── database.ts                         # Supabase database types
│   ├── auth.ts                             # Auth types
│   ├── organization.ts                     # Org/site/pod types
│   ├── batch.ts                            # Batch types (from prototype)
│   ├── inventory.ts                        # Inventory types (from prototype)
│   ├── task.ts                             # Task types (from prototype)
│   ├── alarm.ts                            # Alarm types (from prototype)
│   ├── telemetry.ts                        # Telemetry types
│   ├── compliance.ts                       # Compliance types
│   ├── jurisdiction.ts                     # Jurisdiction types
│   └── rbac.ts                             # RBAC types
│
├── hooks/                                  # NEW: Shared React hooks
│   ├── use-auth.ts                         # Auth hook
│   ├── use-jurisdiction.ts                 # Jurisdiction hook
│   ├── use-permissions.ts                  # Permission checking hook
│   ├── use-supabase.ts                     # Supabase hook
│   ├── use-telemetry.ts                    # Telemetry subscription hook
│   ├── use-debounce.ts                     # Debounce hook
│   ├── use-pagination.ts                   # Pagination hook
│   └── use-filters.ts                      # Filter hook
│
├── config/                                 # NEW: Configuration files
│   ├── navigation.ts                       # Navigation structure
│   ├── roles.ts                            # Role configuration
│   └── features.ts                         # Feature flags
│
├── middleware.ts                           # KEEP: Existing middleware
├── tailwind.config.ts                      # KEEP: Existing Tailwind config
├── tsconfig.json                           # KEEP: TypeScript config
├── package.json                            # UPDATE: Add new dependencies
└── .env.local                              # UPDATE: Add new env vars
```

### 3.2 Navigation Structure

```typescript
// config/navigation.ts
export const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['*'], // All authenticated users
  },
  {
    name: 'Monitoring',
    href: '/dashboard/monitoring',
    icon: Activity,
    roles: ['*'],
  },
  {
    name: 'Controls',
    href: '/dashboard/controls',
    icon: Settings,
    roles: ['org_admin', 'site_manager', 'head_grower', 'operator'],
  },
  {
    name: 'Inventory',
    href: '/dashboard/inventory',
    icon: Package,
    roles: ['org_admin', 'site_manager', 'head_grower', 'operator'],
  },
  {
    name: 'Batches',
    href: '/dashboard/batches',
    icon: Layers,
    roles: ['org_admin', 'site_manager', 'head_grower', 'operator'],
  },
  {
    name: 'Tasks',
    href: '/dashboard/tasks',
    icon: CheckSquare,
    roles: ['org_admin', 'site_manager', 'head_grower', 'operator', 'compliance_qa'],
  },
  {
    name: 'Compliance',
    href: '/dashboard/compliance',
    icon: Shield,
    roles: ['org_admin', 'site_manager', 'compliance_qa', 'executive_viewer'],
  },
  {
    name: 'Alarms',
    href: '/dashboard/alarms',
    icon: Bell,
    roles: ['org_admin', 'site_manager', 'head_grower', 'operator'],
  },
  {
    name: 'Admin',
    href: '/dashboard/admin',
    icon: Users,
    roles: ['org_admin', 'site_manager'],
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['*'],
  },
]
```

---

## 4. Database Schema Design

### 4.1 Schema Overview

**Multi-Regional Strategy:**
- **Two Supabase instances:** US database, Canada database
- **Identical schemas:** Both databases have the same table structure
- **User routing:** Based on organization's `data_region` field
- **Connection logic:** Middleware routes to appropriate database

### 4.2 Core Tables

```sql
-- =====================================================
-- ORGANIZATIONS & SITES
-- =====================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  data_region TEXT NOT NULL CHECK (data_region IN ('us', 'canada')),
  jurisdiction TEXT NOT NULL, -- 'oregon', 'maryland', 'canada', 'primus_gfs'
  plant_type TEXT NOT NULL CHECK (plant_type IN ('cannabis', 'produce')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  max_pods INTEGER DEFAULT 48,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity_pods INTEGER DEFAULT 8,
  room_type TEXT CHECK (room_type IN ('veg', 'flower', 'mother', 'clone', 'dry', 'cure', 'mixed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gcu_address INTEGER, -- DemeGrow GCU Modbus address
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'offline', 'decommissioned')),
  current_batch_id UUID, -- FK to batches (nullable)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USERS & RBAC
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'operator',
  -- Role options: 'org_admin', 'site_manager', 'head_grower', 'operator', 
  --               'compliance_qa', 'executive_viewer', 'installer_tech', 'support'
  is_active BOOLEAN DEFAULT TRUE,
  last_sign_in TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-to-Site assignments (for site-scoped roles)
CREATE TABLE user_site_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, site_id)
);

-- Action-level permissions tracking
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL, -- e.g. 'batch:create', 'inventory:delete'
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For time-limited permissions
  UNIQUE(user_id, permission_key)
);

-- =====================================================
-- BATCHES
-- =====================================================

CREATE TABLE cultivars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  strain_type TEXT CHECK (strain_type IN ('indica', 'sativa', 'hybrid', 'cbd', 'produce')),
  genetics TEXT,
  thc_range TEXT,
  cbd_range TEXT,
  flowering_days INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL UNIQUE,
  cultivar_id UUID REFERENCES cultivars(id),
  stage TEXT NOT NULL CHECK (stage IN ('planning', 'germination', 'clone', 'veg', 'flower', 'harvest', 'dry', 'cure', 'packaging', 'completed', 'destroyed')),
  plant_count INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  parent_batch_id UUID REFERENCES batches(id), -- For genealogy
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'quarantined', 'completed', 'destroyed')),
  
  -- Jurisdiction-specific fields
  metrc_batch_id TEXT, -- For Oregon/Maryland
  license_number TEXT, -- For compliance
  
  -- Metrics
  yield_weight_g DECIMAL(10,2),
  yield_units INTEGER,
  
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch-to-Pod assignments (for Pods-as-a-Batch)
CREATE TABLE batch_pod_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  UNIQUE(batch_id, pod_id, assigned_at)
);

-- Batch lifecycle events
CREATE TABLE batch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'stage_change', 'plant_count_update', 'note_added', etc.
  from_value JSONB,
  to_value JSONB,
  user_id UUID NOT NULL REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Plant tagging (for individual plant tracking)
CREATE TABLE plant_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  tag_number TEXT NOT NULL UNIQUE,
  plant_state TEXT CHECK (plant_state IN ('immature', 'vegetative', 'flowering', 'harvested', 'destroyed')),
  location_pod_id UUID REFERENCES pods(id),
  tagged_at TIMESTAMPTZ DEFAULT NOW(),
  destroyed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id)
);

-- =====================================================
-- INVENTORY
-- =====================================================

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('co2_tank', 'filter', 'nutrient', 'chemical', 'packaging', 'sanitation', 'equipment', 'other')),
  name TEXT NOT NULL,
  sku TEXT,
  unit_of_measure TEXT NOT NULL, -- 'kg', 'L', 'unit', 'tank'
  current_quantity DECIMAL(10,2) DEFAULT 0,
  minimum_quantity DECIMAL(10,2), -- Par level
  maximum_quantity DECIMAL(10,2),
  location TEXT, -- Storage location
  lot_number TEXT,
  expiry_date DATE,
  cost_per_unit DECIMAL(10,2),
  supplier TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('receive', 'consume', 'transfer', 'adjust', 'dispose')),
  quantity DECIMAL(10,2) NOT NULL,
  from_location TEXT,
  to_location TEXT,
  batch_id UUID REFERENCES batches(id), -- Attribution to batch
  reason TEXT,
  photo_url TEXT,
  performed_by UUID NOT NULL REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Waste tracking
CREATE TABLE waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  waste_type TEXT NOT NULL CHECK (waste_type IN ('plant_material', 'chemical', 'packaging', 'equipment', 'other')),
  source_type TEXT CHECK (source_type IN ('batch', 'inventory', 'general')),
  source_id UUID, -- batch_id or item_id
  quantity DECIMAL(10,2) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  reason TEXT NOT NULL, -- Jurisdiction-specific reasons
  disposal_method TEXT NOT NULL, -- 'compost', 'hazardous_waste', 'landfill', 'recycle'
  photo_urls TEXT[], -- Array of photo URLs
  witness_name TEXT, -- For compliance
  witness_signature TEXT,
  metrc_disposal_id TEXT, -- For Metrc states
  performed_by UUID NOT NULL REFERENCES users(id),
  disposed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- =====================================================
-- RECIPES & CONTROLS
-- =====================================================

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  stage TEXT NOT NULL CHECK (stage IN ('germination', 'clone', 'veg', 'flower', 'dry', 'cure')),
  
  -- Environmental targets (day)
  temp_day_c DECIMAL(4,1),
  humidity_day_pct DECIMAL(4,1),
  vpd_day_kpa DECIMAL(3,2),
  co2_day_ppm INTEGER,
  
  -- Environmental targets (night)
  temp_night_c DECIMAL(4,1),
  humidity_night_pct DECIMAL(4,1),
  vpd_night_kpa DECIMAL(3,2),
  co2_night_ppm INTEGER,
  
  -- Lighting
  photoperiod_hours DECIMAL(3,1),
  light_intensity_pct INTEGER,
  
  -- Irrigation (if CCS available)
  irrigation_program JSONB, -- Flexible structure for CCS config
  
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe applications to pods/batches
CREATE TABLE recipe_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  applied_to_type TEXT NOT NULL CHECK (applied_to_type IN ('pod', 'batch', 'batch_group')),
  applied_to_id UUID NOT NULL, -- pod_id or batch_id
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by UUID NOT NULL REFERENCES users(id),
  scheduled_start TIMESTAMPTZ,
  auto_revert_at TIMESTAMPTZ,
  reverted_at TIMESTAMPTZ
);

-- Manual overrides
CREATE TABLE control_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  override_type TEXT NOT NULL, -- 'manual', 'emergency', 'maintenance'
  parameter TEXT NOT NULL, -- 'temp_setpoint', 'light_intensity', 'co2_enable', etc.
  value_before TEXT,
  value_after TEXT,
  reason TEXT NOT NULL,
  duration_minutes INTEGER,
  auto_revert_at TIMESTAMPTZ,
  applied_by UUID NOT NULL REFERENCES users(id),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reverted_at TIMESTAMPTZ
);

-- =====================================================
-- TELEMETRY (from TagoIO → Supabase)
-- =====================================================

CREATE TABLE telemetry_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Environmental readings
  temperature_c DECIMAL(4,1),
  humidity_pct DECIMAL(4,1),
  co2_ppm INTEGER,
  vpd_kpa DECIMAL(3,2),
  
  -- Equipment states
  light_intensity_pct INTEGER,
  cooling_active BOOLEAN,
  heating_active BOOLEAN,
  dehumidifier_active BOOLEAN,
  humidifier_active BOOLEAN,
  co2_injection_active BOOLEAN,
  exhaust_fan_active BOOLEAN,
  
  -- Quality flags
  temp_sensor_fault BOOLEAN DEFAULT FALSE,
  humidity_sensor_fault BOOLEAN DEFAULT FALSE,
  co2_sensor_fault BOOLEAN DEFAULT FALSE,
  
  -- Raw TagoIO data (for debugging)
  raw_data JSONB
);

-- Index for fast time-series queries
CREATE INDEX idx_telemetry_pod_time ON telemetry_readings(pod_id, timestamp DESC);

-- =====================================================
-- ALARMS
-- =====================================================

CREATE TABLE alarm_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  alarm_type TEXT NOT NULL CHECK (alarm_type IN ('temperature_high', 'temperature_low', 'humidity_high', 'humidity_low', 'co2_high', 'co2_low', 'vpd_out_of_range', 'device_offline', 'sensor_fault')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  threshold_value DECIMAL(10,2),
  time_in_state_seconds INTEGER DEFAULT 300, -- 5 minutes
  applies_to_stage TEXT[], -- Array of batch stages this applies to
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES alarm_policies(id),
  alarm_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  threshold DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  duration_seconds INTEGER,
  
  -- Lifecycle
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  escalated_at TIMESTAMPTZ,
  
  -- Notes
  ack_note TEXT,
  resolution_note TEXT
);

-- Alarm routing (who gets notified)
CREATE TABLE alarm_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  notify_role TEXT NOT NULL, -- Role to notify
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  escalation_delay_minutes INTEGER, -- Time before escalation
  is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- TASKS & WORKFLOWS
-- =====================================================

CREATE TABLE sop_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- 'daily', 'weekly', 'harvest', 'maintenance', 'calibration', 'cleaning'
  description TEXT,
  steps JSONB NOT NULL, -- Array of step objects with evidence requirements
  estimated_duration_minutes INTEGER,
  required_role TEXT[], -- Roles that can perform this SOP
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  sop_template_id UUID REFERENCES sop_templates(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'to_do' CHECK (status IN ('to_do', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  
  -- Scope (what this task relates to)
  related_to_type TEXT CHECK (related_to_type IN ('pod', 'batch', 'room', 'site', 'inventory_item')),
  related_to_id UUID,
  
  -- Scheduling
  due_date TIMESTAMPTZ,
  scheduled_start TIMESTAMPTZ,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  completion_notes TEXT,
  
  -- Evidence (for compliance)
  evidence_photos TEXT[], -- Array of photo URLs
  evidence_documents TEXT[], -- Array of document URLs
  evidence_signatures JSONB, -- Digital signatures
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task steps (for SOP execution)
CREATE TABLE task_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  evidence_required BOOLEAN DEFAULT FALSE,
  evidence_type TEXT CHECK (evidence_type IN ('photo', 'signature', 'numeric_reading', 'checkbox', 'text')),
  evidence_value TEXT, -- Flexible storage for evidence
  notes TEXT
);

-- =====================================================
-- COMPLIANCE
-- =====================================================

CREATE TABLE compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL, -- 'metrc_monthly', 'ctls_monthly', 'primus_audit', 'internal_audit'
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'submitted', 'rejected')),
  
  -- Report content
  data_snapshot JSONB, -- Snapshot of relevant data
  report_file_url TEXT, -- Generated PDF
  
  -- Approval workflow
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  
  notes TEXT
);

CREATE TABLE evidence_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('photo', 'video', 'document', 'signature', 'certificate')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  
  -- Context (what this evidence relates to)
  related_to_type TEXT, -- 'batch', 'task', 'waste_log', 'inventory_movement', 'compliance_report'
  related_to_id UUID,
  
  -- Metadata
  description TEXT,
  tags TEXT[],
  is_locked BOOLEAN DEFAULT FALSE, -- For audit protection
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES users(id),
  
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log (immutable record of all actions)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', etc.
  entity_type TEXT NOT NULL, -- 'batch', 'inventory_item', 'user', 'recipe', etc.
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast audit queries
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id, timestamp DESC);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, timestamp DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (similar for other tables)

-- Users can only see data from their own organization
CREATE POLICY "Users can view their org's data"
  ON batches FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Only org_admin and site_manager can create batches
CREATE POLICY "Admin and managers can create batches"
  ON batches FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('org_admin', 'site_manager', 'head_grower')
    )
  );

-- Similar policies for UPDATE and DELETE with role checks

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
-- (Repeat for other tables: sites, rooms, pods, batches, etc.)

-- Function to log all changes to audit_log
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply audit trigger to critical tables
CREATE TRIGGER audit_batches AFTER INSERT OR UPDATE OR DELETE ON batches
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
  
-- (Repeat for: inventory_items, recipes, control_overrides, waste_logs, etc.)
```

### 4.3 Supabase Setup Instructions

```sql
-- Run this in BOTH US and Canada Supabase instances

-- 1. Execute all table creation statements from section 4.2
-- 2. Enable RLS on all tables
-- 3. Create RLS policies for each table based on roles
-- 4. Set up triggers for updated_at and audit logging
-- 5. Create indexes for performance

-- Additional indexes for common queries:
CREATE INDEX idx_batches_org_site ON batches(organization_id, site_id, stage);
CREATE INDEX idx_inventory_org_site ON inventory_items(organization_id, site_id, item_type);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to, status, due_date);
CREATE INDEX idx_alarms_pod_open ON alarms(pod_id, triggered_at) WHERE resolved_at IS NULL;
```

---

## 5. Component Consolidation Strategy

### 5.1 shadcn/ui Component Deduplication

**Priority:** KEEP the main repository's shadcn/ui components as the source of truth since they align with the Figma design system.

**Process:**
1. **Audit all prototypes:** List all `components/ui/` components from each prototype
2. **Compare with main repo:** Identify duplicates and unique components
3. **Merge strategy:**
   - **Existing in main repo:** KEEP main repo version (button, field, checkbox, form-label, progress-indicator)
   - **Only in prototypes:** MIGRATE unique components and ensure they follow main repo styling patterns
   - **Conflicts:** Manually review and take best implementation

**Example Consolidation:**

```typescript
// Main repo has: button, field, checkbox, form-label, progress-indicator
// Batch prototype has: ~40 shadcn components including table, dialog, card, tabs, select

// ACTION PLAN:
// 1. Keep main repo's button.tsx (7 variants, matches Figma)
// 2. Migrate unique components from prototypes:
//    - table.tsx (needed for data tables)
//    - dialog.tsx (needed for modals)
//    - card.tsx (needed for panels)
//    - tabs.tsx (needed for navigation)
//    - select.tsx (needed for dropdowns)
//    - ... (continue for all unique components)
// 3. Update Tailwind classes to use main repo's custom color tokens
```

### 5.2 Shared Component Creation

**Identify Common Patterns:**
Many prototypes have similar data display needs that can be abstracted into shared components.

**Create these in `components/shared/`:**

```typescript
// components/shared/data-table.tsx
// Generic data table with sorting, filtering, pagination
export function DataTable<TData>({ 
  columns, 
  data, 
  searchable, 
  filterable 
}: DataTableProps<TData>) {
  // Implementation using table.tsx from ui
}

// components/shared/status-badge.tsx
// Consistent status indicators across features
export function StatusBadge({ 
  status, 
  variant 
}: StatusBadgeProps) {
  // Uses badge.tsx with custom color mapping
}

// components/shared/metric-card.tsx
// KPI card used in dashboards
export function MetricCard({ 
  title, 
  value, 
  change, 
  icon 
}: MetricCardProps) {
  // Uses card.tsx with consistent styling
}

// components/shared/filter-bar.tsx
// Reusable filter controls for lists
export function FilterBar({ 
  filters, 
  onFilterChange 
}: FilterBarProps) {
  // Composite of select, input, button components
}

// components/shared/export-button.tsx
// Consistent export functionality
export function ExportButton({ 
  data, 
  filename, 
  format 
}: ExportButtonProps) {
  // CSV/PDF export logic
}
```

### 5.3 Feature Component Migration

**For each feature, migrate components following this pattern:**

```typescript
// Example: Batch Management
// FROM: batch-prototype/components/BatchDashboard.tsx
// TO: trazo-mvp/components/features/batch/batch-dashboard.tsx

// MIGRATION STEPS:
// 1. Copy component file
// 2. Update imports (adjust paths for new location)
// 3. Replace mock data with Supabase queries
// 4. Add jurisdiction-aware logic
// 5. Add RBAC permission checks
// 6. Update styling to use main repo tokens
// 7. Add proper TypeScript types from consolidated types
```

**Example Migration:**

```typescript
// BEFORE (in prototype):
import { Badge } from '@/components/ui/badge'
import { mockBatches } from '@/lib/mock-data'

export function BatchDashboard() {
  const [batches, setBatches] = useState(mockBatches)
  
  return (
    <div>
      {batches.map(batch => (
        <Badge>{batch.stage}</Badge>
      ))}
    </div>
  )
}

// AFTER (in main repo):
'use client'

import { Badge } from '@/components/ui/badge'
import { useBatches } from '@/hooks/use-batches'
import { useJurisdiction } from '@/hooks/use-jurisdiction'
import { usePermissions } from '@/hooks/use-permissions'
import type { Batch } from '@/types/batch'

export function BatchDashboard() {
  const { batches, isLoading } = useBatches()
  const { jurisdiction } = useJurisdiction()
  const { can } = usePermissions()
  
  // Filter batches based on jurisdiction rules
  const filteredBatches = batches.filter(batch => {
    // Apply jurisdiction-specific filtering logic
    return jurisdiction.isValidStage(batch.stage)
  })
  
  if (!can('batch:view')) {
    return <div>Access denied</div>
  }
  
  if (isLoading) {
    return <div>Loading...</div>
  }
  
  return (
    <div>
      {filteredBatches.map(batch => (
        <Badge key={batch.id}>{batch.stage}</Badge>
      ))}
    </div>
  )
}
```

---

## 6. Migration Plan by Feature

### 6.1 Priority 1: Foundation Features

#### **A. Identity, Roles & Permissions Management**

**Goal:** Establish RBAC system that all other features depend on.

**Steps:**

1. **Create RBAC Infrastructure**
   ```typescript
   // lib/rbac/roles.ts
   export const ROLES = {
     org_admin: {
       name: 'Organization Admin',
       permissions: ['*'], // All permissions
     },
     site_manager: {
       name: 'Site Manager',
       permissions: [
         'user:view', 'user:create', 'user:update',
         'batch:*', 'inventory:*', 'task:*', 'recipe:*',
         'compliance:view', 'compliance:export',
         'alarm:*', 'control:*'
       ],
     },
     head_grower: {
       name: 'Head Grower',
       permissions: [
         'batch:*', 'recipe:*', 'control:*',
         'task:view', 'task:create', 'inventory:view',
         'alarm:view', 'alarm:ack'
       ],
     },
     operator: {
       name: 'Operator',
       permissions: [
         'batch:view', 'inventory:view', 'task:*',
         'control:override', 'alarm:view', 'alarm:ack'
       ],
     },
     compliance_qa: {
       name: 'Compliance/QA Manager',
       permissions: [
         'compliance:*', 'evidence:*', 'audit:view',
         'batch:view', 'inventory:view', 'task:view'
       ],
     },
     executive_viewer: {
       name: 'Executive Viewer',
       permissions: [
         'batch:view', 'inventory:view', 'compliance:view',
         'alarm:view', 'task:view', 'monitoring:view'
       ],
     },
     installer_tech: {
       name: 'Installer/Technician',
       permissions: [
         'pod:configure', 'device:diagnose', 'system:test'
       ],
       time_limited: true, // Special flag for temporary access
     },
     support: {
       name: 'Support (Read-Only)',
       permissions: [
         'batch:view', 'inventory:view', 'task:view',
         'alarm:view', 'monitoring:view'
       ],
       time_limited: true,
     },
   } as const
   
   // lib/rbac/permissions.ts
   export const PERMISSIONS = {
     // Batch permissions
     'batch:view': 'View batches',
     'batch:create': 'Create new batches',
     'batch:update': 'Update batch details',
     'batch:delete': 'Delete batches',
     'batch:stage_change': 'Change batch stages',
     
     // Inventory permissions
     'inventory:view': 'View inventory',
     'inventory:create': 'Create inventory items',
     'inventory:update': 'Update inventory',
     'inventory:delete': 'Delete inventory items',
     'inventory:consume': 'Record consumption',
     'inventory:waste': 'Record waste disposal',
     
     // Task permissions
     'task:view': 'View tasks',
     'task:create': 'Create tasks',
     'task:update': 'Update tasks',
     'task:assign': 'Assign tasks to users',
     'task:complete': 'Mark tasks complete',
     
     // Control permissions
     'control:view': 'View controls',
     'control:override': 'Manual overrides',
     'control:recipe': 'Manage recipes',
     'control:schedule': 'Manage schedules',
     
     // Alarm permissions
     'alarm:view': 'View alarms',
     'alarm:ack': 'Acknowledge alarms',
     'alarm:configure': 'Configure alarm policies',
     
     // Compliance permissions
     'compliance:view': 'View compliance data',
     'compliance:export': 'Export compliance reports',
     'compliance:submit': 'Submit compliance reports',
     'evidence:upload': 'Upload evidence',
     'evidence:lock': 'Lock evidence for audit',
     'audit:view': 'View audit logs',
     
     // User/Admin permissions
     'user:view': 'View users',
     'user:create': 'Create users',
     'user:update': 'Update users',
     'user:delete': 'Delete users',
     
     // System permissions
     'pod:configure': 'Configure pods',
     'device:diagnose': 'Device diagnostics',
     'system:test': 'System testing',
     'monitoring:view': 'View monitoring data',
     
     // Wildcard
     '*': 'All permissions',
   } as const
   
   // lib/rbac/guards.ts
   export function canPerformAction(
     userRole: string,
     permission: string,
     additionalPermissions: string[] = []
   ): boolean {
     const role = ROLES[userRole as keyof typeof ROLES]
     if (!role) return false
     
     // Check if role has wildcard permission
     if (role.permissions.includes('*')) return true
     
     // Check if role has specific permission
     if (role.permissions.includes(permission)) return true
     
     // Check additional user-specific permissions
     if (additionalPermissions.includes(permission)) return true
     
     // Check wildcard pattern (e.g., 'batch:*' matches 'batch:view')
     const [resource] = permission.split(':')
     if (role.permissions.includes(`${resource}:*`)) return true
     
     return false
   }
   
   // hooks/use-permissions.ts
   'use client'
   
   import { useAuth } from '@/hooks/use-auth'
   import { canPerformAction } from '@/lib/rbac/guards'
   
   export function usePermissions() {
     const { user } = useAuth()
     
     const can = (permission: string): boolean => {
       if (!user) return false
       return canPerformAction(
         user.role,
         permission,
         user.additional_permissions || []
       )
     }
     
     const cannot = (permission: string): boolean => {
       return !can(permission)
     }
     
     return { can, cannot }
   }
   ```

2. **Migrate Identity/Roles Components**
   ```
   FROM prototype: identity-prototype/components/
   TO: components/features/admin/
   
   FILES TO MIGRATE:
   - UserTable.tsx → user-table.tsx
   - UserForm.tsx → user-form.tsx
   - RoleEditor.tsx → role-editor.tsx
   - PermissionMatrix.tsx → permission-matrix.tsx
   - AuditLogViewer.tsx → audit-log-viewer.tsx
   ```

3. **Create Admin Pages**
   ```typescript
   // app/(dashboard)/admin/page.tsx
   import { UserTable } from '@/components/features/admin/user-table'
   import { usePermissions } from '@/hooks/use-permissions'
   
   export default function AdminPage() {
     const { can } = usePermissions()
     
     if (!can('user:view')) {
       redirect('/dashboard')
     }
     
     return (
       <div>
         <h1>User Management</h1>
         <UserTable />
       </div>
     )
   }
   
   // app/(dashboard)/admin/users/page.tsx
   // User management interface
   
   // app/(dashboard)/admin/roles/page.tsx
   // Role management interface
   
   // app/(dashboard)/admin/permissions/page.tsx
   // Permission matrix
   
   // app/(dashboard)/admin/audit/page.tsx
   // Audit log viewer
   ```

4. **Update Signup Flow**
   ```typescript
   // Modify existing signup to capture role during onboarding
   // app/auth/sign-up/step-4/page.tsx
   
   // Add role selection dropdown (defaults to 'operator')
   // Only show advanced roles if user is first in organization
   ```

---

#### **B. Inventory Tracking**

**Goal:** Establish inventory system for tracking CO₂ tanks, filters, nutrients, consumables.

**Steps:**

1. **Migrate Inventory Components**
   ```
   FROM prototype: inventory-prototype/components/
   TO: components/features/inventory/
   
   FILES TO MIGRATE:
   - InventoryDashboard.tsx → inventory-dashboard.tsx
   - InventoryTable.tsx → inventory-table.tsx
   - ItemDetails.tsx → item-details.tsx
   - ItemForm.tsx → item-form.tsx
   - MovementLog.tsx → movement-log.tsx
   - WasteDisposalForm.tsx → waste-disposal-form.tsx
   - LowStockAlert.tsx → low-stock-alert.tsx
   - ParLevelSettings.tsx → par-level-settings.tsx
   ```

2. **Consolidate Waste Management**
   ```typescript
   // CHALLENGE: Waste appears in both Inventory and Batch prototypes
   
   // DECISION: Primary waste management in Inventory feature
   //           Batch feature links to waste records for compliance
   
   // Implementation:
   // 1. Use inventory-prototype's WasteDisposalForm as base
   // 2. Enhance with batch attribution (source_type='batch', source_id)
   // 3. Add jurisdiction-specific reason codes
   // 4. Ensure photos and witness signatures required
   
   // components/features/inventory/waste-disposal-form.tsx
   'use client'
   
   import { useJurisdiction } from '@/hooks/use-jurisdiction'
   import { usePermissions } from '@/hooks/use-permissions'
   
   export function WasteDisposalForm({ sourceType, sourceId }) {
     const { jurisdiction } = useJurisdiction()
     const { can } = usePermissions()
     
     if (!can('inventory:waste')) {
       return <div>Access denied</div>
     }
     
     // Get jurisdiction-specific waste reasons
     const wasteReasons = jurisdiction.getWasteReasons()
     
     // Form implementation with:
     // - Waste type selection
     // - Quantity input
     // - Reason dropdown (jurisdiction-specific)
     // - Disposal method
     // - Photo upload (required)
     // - Witness name/signature (required for cannabis)
     // - Batch attribution (if from batch)
   }
   ```

3. **Create Inventory Pages**
   ```typescript
   // app/(dashboard)/inventory/page.tsx
   // Main inventory dashboard with summary cards
   
   // app/(dashboard)/inventory/items/page.tsx
   // Full inventory table with search/filter
   
   // app/(dashboard)/inventory/movements/page.tsx
   // Movement history log
   
   // app/(dashboard)/inventory/waste/page.tsx
   // Waste disposal log with jurisdiction compliance
   ```

4. **Add Inventory Queries**
   ```typescript
   // lib/supabase/queries/inventory.ts
   
   export async function getInventoryItems(siteId: string) {
     const { data, error } = await supabase
       .from('inventory_items')
       .select('*')
       .eq('site_id', siteId)
       .eq('is_active', true)
       .order('name')
     
     if (error) throw error
     return data
   }
   
   export async function recordMovement(movement: InsertInventoryMovement) {
     // 1. Insert movement record
     // 2. Update item quantity
     // 3. Check par levels and trigger low stock alert if needed
     // 4. Log to audit trail
   }
   
   export async function recordWaste(wasteLog: InsertWasteLog) {
     // 1. Validate jurisdiction rules
     // 2. Insert waste log
     // 3. Update inventory quantity (if from inventory)
     // 4. Link to batch (if from batch)
     // 5. Store photo URLs
     // 6. Log to audit trail
   }
   ```

---

#### **C. Real-time Environmental Monitoring & Telemetry**

**Goal:** Dashboard showing real-time pod status, charts, and environmental data.

**Steps:**

1. **Migrate Monitoring Components**
   ```
   FROM prototype: monitoring-prototype/components/
   TO: components/features/monitoring/
   
   FILES TO MIGRATE:
   - MonitoringDashboard.tsx → monitoring-dashboard.tsx
   - PodStatusCard.tsx → pod-status-card.tsx
   - EnvironmentalChart.tsx → environmental-chart.tsx
   - TelemetryTable.tsx → telemetry-table.tsx
   - PodGridView.tsx → pod-grid-view.tsx
   - SensorHealthIndicator.tsx → sensor-health-indicator.tsx
   ```

2. **Set Up TagoIO Integration Structure**
   ```typescript
   // lib/tagoio/client.ts
   // TagoIO API client (to be implemented after migration)
   
   export class TagoIOClient {
     constructor(private token: string) {}
     
     async getDeviceData(deviceId: string) {
       // Poll TagoIO for device data
     }
     
     async getHistoricalData(deviceId: string, startDate: Date, endDate: Date) {
       // Fetch historical telemetry
     }
   }
   
   // lib/tagoio/polling-service.ts
   // Background polling service
   
   export class TelemetryPollingService {
     private interval: NodeJS.Timeout | null = null
     
     start(deviceIds: string[], pollIntervalMs: number = 10000) {
       // Start polling TagoIO every 10 seconds
       // Transform data
       // Store in Supabase telemetry_readings table
     }
     
     stop() {
       if (this.interval) clearInterval(this.interval)
     }
   }
   
   // lib/tagoio/transformer.ts
   // Transform TagoIO data to Trazo format
   
   export function transformTagoIOReading(tagoData: any) {
     return {
       pod_id: mapDeviceIdToPodId(tagoData.device),
       timestamp: tagoData.time,
       temperature_c: tagoData.variables.temperature,
       humidity_pct: tagoData.variables.humidity,
       co2_ppm: tagoData.variables.co2,
       // ... map other fields
       raw_data: tagoData, // Store raw for debugging
     }
   }
   ```

3. **Use Supabase Realtime for UI Updates**
   ```typescript
   // hooks/use-telemetry.ts
   'use client'
   
   import { useEffect, useState } from 'react'
   import { supabase } from '@/lib/supabase/client'
   
   export function useTelemetry(podId: string) {
     const [reading, setReading] = useState(null)
     
     useEffect(() => {
       // Subscribe to real-time updates from Supabase
       const channel = supabase
         .channel(`telemetry:${podId}`)
         .on(
           'postgres_changes',
           {
             event: 'INSERT',
             schema: 'public',
             table: 'telemetry_readings',
             filter: `pod_id=eq.${podId}`,
           },
           (payload) => {
             setReading(payload.new)
           }
         )
         .subscribe()
       
       return () => {
         supabase.removeChannel(channel)
       }
     }, [podId])
     
     return { reading, isLoading: !reading }
   }
   ```

4. **Create Monitoring Pages**
   ```typescript
   // app/(dashboard)/page.tsx
   // Main dashboard = Monitoring overview with all pods
   
   // app/(dashboard)/monitoring/page.tsx
   // Detailed monitoring page
   
   // app/(dashboard)/monitoring/[podId]/page.tsx
   // Single pod detail view with charts
   ```

5. **For MVP: Use Mock Data**
   ```typescript
   // Since TagoIO integration comes after migration, use mock data initially
   
   // lib/mock/telemetry-mock-data.ts
   export const mockTelemetryReadings = [
     {
       pod_id: '...',
       timestamp: new Date().toISOString(),
       temperature_c: 23.5,
       humidity_pct: 65.2,
       co2_ppm: 850,
       vpd_kpa: 1.2,
       light_intensity_pct: 90,
       cooling_active: true,
       // ...
     },
   ]
   
   // After migration complete, replace with actual TagoIO polling
   ```

---

#### **D. Environmental Controls**

**Goal:** Recipe management, schedules, manual overrides.

**Steps:**

1. **Migrate Control Components**
   ```
   FROM prototype: controls-prototype/components/
   TO: components/features/controls/
   
   FILES TO MIGRATE:
   - ControlsDashboard.tsx → controls-dashboard.tsx
   - RecipeEditor.tsx → recipe-editor.tsx
   - RecipeLibrary.tsx → recipe-library.tsx
   - ScheduleBuilder.tsx → schedule-builder.tsx
   - OverridePanel.tsx → override-panel.tsx
   - SetpointAdjuster.tsx → setpoint-adjuster.tsx
   - SafetyInterlock.tsx → safety-interlock.tsx
   ```

2. **Implement Recipe System**
   ```typescript
   // lib/supabase/queries/recipes.ts
   
   export async function getRecipes(orgId: string, stage?: string) {
     let query = supabase
       .from('recipes')
       .select('*')
       .eq('organization_id', orgId)
       .eq('is_published', true)
     
     if (stage) query = query.eq('stage', stage)
     
     const { data, error } = await query.order('name')
     if (error) throw error
     return data
   }
   
   export async function applyRecipe(
     recipeId: string,
     targetType: 'pod' | 'batch' | 'batch_group',
     targetId: string,
     userId: string
   ) {
     // 1. Validate user has permission
     // 2. Insert recipe_application record
     // 3. If targeting pod, send setpoints to Edge/GCU (future)
     // 4. Log to audit trail
   }
   
   export async function createOverride(override: InsertControlOverride) {
     // 1. Validate safety bounds
     // 2. Check for conflicts with active recipes
     // 3. Insert override record
     // 4. Apply override to pod (future: send to Edge)
     // 5. Set auto-revert timer if specified
     // 6. Log to audit trail
   }
   ```

3. **Add Safety Interlock Validation**
   ```typescript
   // lib/controls/safety-interlocks.ts
   
   export function validateSetpoint(
     parameter: string,
     value: number,
     stage: string
   ): ValidationResult {
     // Check absolute bounds
     const bounds = SAFETY_BOUNDS[parameter][stage]
     if (value < bounds.min || value > bounds.max) {
       return {
         valid: false,
         error: `${parameter} must be between ${bounds.min} and ${bounds.max}`,
       }
     }
     
     return { valid: true }
   }
   
   export function checkConflicts(
     activeOverrides: ControlOverride[]
   ): ConflictResult {
     // Check for mutual exclusions:
     // - Heating + Cooling
     // - Humidify + Dehumidify
     // - etc.
   }
   ```

4. **Create Controls Pages**
   ```typescript
   // app/(dashboard)/controls/page.tsx
   // Controls overview with active recipes and overrides
   
   // app/(dashboard)/controls/recipes/page.tsx
   // Recipe library and editor
   
   // app/(dashboard)/controls/schedules/page.tsx
   // Schedule management
   
   // app/(dashboard)/controls/overrides/page.tsx
   // Active overrides and manual control
   ```

---

### 6.2 Priority 2: Operational Features

#### **E. Workflow & Task Management**

**Steps:**

1. **Migrate Task Components**
   ```
   FROM prototype: workflow-prototype/components/
   TO: components/features/tasks/
   
   FILES TO MIGRATE:
   - TaskBoard.tsx → task-board.tsx
   - TaskCard.tsx → task-card.tsx
   - TaskDetail.tsx → task-detail.tsx
   - SOPTemplateEditor.tsx → sop-template-editor.tsx
   - TaskAssignment.tsx → task-assignment.tsx
   - EvidenceCapture.tsx → evidence-capture.tsx
   ```

2. **Implement SOP System**
   ```typescript
   // lib/supabase/queries/tasks.ts
   
   export async function createTaskFromSOP(
     sopTemplateId: string,
     assignment: {
       assignedTo: string
       siteId: string
       relatedToType?: string
       relatedToId?: string
       dueDate?: Date
     }
   ) {
     // 1. Fetch SOP template
     // 2. Create task with steps from template
     // 3. Assign to user
     // 4. Create task_steps entries
     // 5. Send notification to assignee
   }
   
   export async function completeTaskStep(
     taskStepId: string,
     evidence: {
       type: string
       value: string
       photo?: File
       signature?: string
     }
   ) {
     // 1. Validate evidence matches requirement
     // 2. Upload photo if provided
     // 3. Mark step complete
     // 4. Check if all steps complete → mark task done
     // 5. Store evidence in evidence_vault
   }
   ```

3. **Create Task Pages**
   ```typescript
   // app/(dashboard)/tasks/page.tsx
   // Task board (kanban or list view)
   
   // app/(dashboard)/tasks/[taskId]/page.tsx
   // Task detail with step-by-step completion
   
   // app/(dashboard)/tasks/sops/page.tsx
   // SOP template library
   
   // app/(dashboard)/tasks/schedules/page.tsx
   // Recurring task schedules
   ```

---

#### **F. Compliance Engine**

**Steps:**

1. **Migrate Compliance Components**
   ```
   FROM prototype: compliance-prototype/components/
   TO: components/features/compliance/
   
   FILES TO MIGRATE:
   - ComplianceDashboard.tsx → compliance-dashboard.tsx
   - ReportBuilder.tsx → report-builder.tsx
   - EvidenceVault.tsx → evidence-vault.tsx
   - AuditLogViewer.tsx → audit-log-viewer.tsx
   - JurisdictionTemplates.tsx → jurisdiction-templates.tsx
   ```

2. **Implement Compliance Reporting**
   ```typescript
   // lib/compliance/report-generator.ts
   
   export async function generateComplianceReport(
     organizationId: string,
     reportType: string,
     startDate: Date,
     endDate: Date
   ) {
     // 1. Fetch all relevant data for period
     // 2. Apply jurisdiction template
     // 3. Generate PDF/CSV based on template
     // 4. Store in compliance_reports table
     // 5. Return download link
   }
   
   // lib/compliance/metrc-mapper.ts (for Oregon/Maryland)
   
   export function mapBatchToMetrc(batch: Batch) {
     // Map Trazo batch data to Metrc format
   }
   
   // lib/compliance/canada-ctls.ts
   
   export function generateCTLSReport(batches: Batch[], period: DateRange) {
     // Generate Canada CTLS monthly report
   }
   
   // lib/compliance/primus-gfs.ts
   
   export function generatePrimusGFSReport(data: any) {
     // Generate PrimusGFS compliance report for produce
   }
   ```

3. **Create Compliance Pages**
   ```typescript
   // app/(dashboard)/compliance/page.tsx
   // Compliance dashboard with report status
   
   // app/(dashboard)/compliance/reports/page.tsx
   // Report generation and history
   
   // app/(dashboard)/compliance/evidence/page.tsx
   // Evidence vault browser
   
   // app/(dashboard)/compliance/audit-log/page.tsx
   // Audit trail viewer
   ```

---

#### **G. Batch Management**

**Steps:**

1. **Migrate Batch Components** (Largest migration)
   ```
   FROM prototype: batch-prototype/components/
   TO: components/features/batch/
   
   FILES TO MIGRATE (19 files):
   - BatchDashboard.tsx → batch-dashboard.tsx
   - BatchDetailView.tsx → batch-detail-view.tsx
   - BatchGenealogyView.tsx → batch-genealogy-view.tsx
   - BatchGroupManagement.tsx → batch-group-management.tsx
   - BatchMetricsPanel.tsx → batch-metrics-panel.tsx
   - BatchStageTransition.tsx → batch-stage-transition.tsx
   - BatchTimeline.tsx → batch-timeline.tsx
   - BulkBatchOperations.tsx → bulk-batch-operations.tsx
   - CreateBatchDialog.tsx → create-batch-dialog.tsx
   - CultivarManagement.tsx → cultivar-management.tsx
   - EvidenceCapture.tsx → evidence-capture.tsx (CONSOLIDATE with tasks)
   - HarvestWorkflow.tsx → harvest-workflow.tsx
   - PlantCountTracking.tsx → plant-count-tracking.tsx
   - PlantTaggingWorkflow.tsx → plant-tagging-workflow.tsx
   - PostHarvestProcessing.tsx → post-harvest-processing.tsx
   - QuarantineManagement.tsx → quarantine-management.tsx
   - RoomCapacityMonitor.tsx → room-capacity-monitor.tsx
   - WasteDisposalWorkflow.tsx (CONSOLIDATE with inventory waste)
   - WasteLogDashboard.tsx (CONSOLIDATE with inventory waste)
   ```

2. **Consolidate Type Definitions**
   ```typescript
   // types/batch.ts (consolidate from prototype's 7 type files)
   
   export interface Batch {
     id: string
     organization_id: string
     site_id: string
     batch_number: string
     cultivar_id: string
     stage: BatchStage
     plant_count: number
     start_date: string
     expected_harvest_date: string
     actual_harvest_date?: string
     parent_batch_id?: string
     status: BatchStatus
     metrc_batch_id?: string
     license_number?: string
     yield_weight_g?: number
     yield_units?: number
     notes?: string
     created_by: string
     created_at: string
     updated_at: string
   }
   
   export type BatchStage = 
     | 'planning'
     | 'germination'
     | 'clone'
     | 'veg'
     | 'flower'
     | 'harvest'
     | 'dry'
     | 'cure'
     | 'packaging'
     | 'completed'
     | 'destroyed'
   
   export type BatchStatus = 'active' | 'quarantined' | 'completed' | 'destroyed'
   
   // ... (continue consolidating from all batch-related type files)
   ```

3. **Implement Batch Queries**
   ```typescript
   // lib/supabase/queries/batches.ts
   
   export async function createBatch(batch: InsertBatch) {
     // 1. Validate jurisdiction rules (plant counts, naming, etc.)
     // 2. Generate batch_number if not provided
     // 3. Insert batch record
     // 4. Create initial batch_event
     // 5. If Metrc jurisdiction, prepare for tag assignment
     // 6. Log to audit trail
   }
   
   export async function transitionBatchStage(
     batchId: string,
     newStage: BatchStage,
     userId: string,
     notes?: string
   ) {
     // 1. Validate stage transition is allowed
     // 2. Apply jurisdiction-specific rules
     // 3. Update batch stage
     // 4. Create batch_event
     // 5. Trigger stage-specific tasks (e.g., harvest SOP)
     // 6. Log to audit trail
   }
   
   export async function assignBatchToPods(
     batchId: string,
     podIds: string[]
   ) {
     // 1. Check pod availability
     // 2. Check room capacity
     // 3. Create batch_pod_assignments
     // 4. Update pods' current_batch_id
     // 5. Apply batch's recipe to pods (if exists)
   }
   ```

4. **Create Batch Pages**
   ```typescript
   // app/(dashboard)/batches/page.tsx
   // Batch dashboard with filtering and search
   
   // app/(dashboard)/batches/[batchId]/page.tsx
   // Batch detail view with timeline and metrics
   
   // app/(dashboard)/batches/create/page.tsx
   // Create batch wizard
   
   // app/(dashboard)/batches/cultivars/page.tsx
   // Cultivar management
   
   // app/(dashboard)/batches/genealogy/page.tsx
   // Batch genealogy tree view
   ```

---

#### **H. Alarms & Notifications**

**Steps:**

1. **Migrate Alarm Components**
   ```
   FROM prototype: alarms-prototype/components/
   TO: components/features/alarms/
   
   FILES TO MIGRATE:
   - AlarmDashboard.tsx → alarm-dashboard.tsx
   - AlarmList.tsx → alarm-list.tsx
   - AlarmDetail.tsx → alarm-detail.tsx
   - AlarmPolicyEditor.tsx → alarm-policy-editor.tsx
   - AlarmHistoryChart.tsx → alarm-history-chart.tsx
   - AcknowledgeDialog.tsx → acknowledge-dialog.tsx
   ```

2. **Implement Alarm System**
   ```typescript
   // lib/alarms/alarm-engine.ts
   
   export class AlarmEngine {
     async evaluatePolicies(podId: string, reading: TelemetryReading) {
       // 1. Fetch active alarm policies for pod/org
       // 2. Evaluate each policy against reading
       // 3. If threshold breached:
       //    - Check time-in-state requirement
       //    - Check if alarm already exists
       //    - If new, create alarm record
       //    - Trigger notifications via routing rules
     }
     
     async acknowledgeAlarm(alarmId: string, userId: string, note: string) {
       // 1. Update alarm record
       // 2. Stop escalation
       // 3. Log to audit trail
     }
     
     async resolveAlarm(alarmId: string, userId: string, note: string) {
       // 1. Update alarm record
       // 2. Mark resolved
       // 3. Log to audit trail
     }
   }
   
   // lib/alarms/notifications.ts
   
   export async function sendAlarmNotification(
     alarm: Alarm,
     routes: AlarmRoute[]
   ) {
     for (const route of routes) {
       if (route.channel === 'email') {
         // Send email
       } else if (route.channel === 'sms') {
         // Send SMS via Twilio
       } else if (route.channel === 'push') {
         // Send push notification
       }
     }
   }
   ```

3. **Create Alarm Pages**
   ```typescript
   // app/(dashboard)/alarms/page.tsx
   // Alarm dashboard with active alarms
   
   // app/(dashboard)/alarms/active/page.tsx
   // Active alarms list
   
   // app/(dashboard)/alarms/history/page.tsx
   // Alarm history with charts
   
   // app/(dashboard)/alarms/policies/page.tsx
   // Alarm policy configuration
   ```

---

### 6.3 Future Features (Structure Only)

#### **I. Drag & Drop Farm Layout Editor**

**For MVP:** Create page structure and placeholder, but don't fully implement drag-and-drop.

```typescript
// app/(dashboard)/layout-editor/page.tsx
export default function LayoutEditorPage() {
  return (
    <div>
      <h1>Farm Layout Editor</h1>
      <p>Coming soon: Drag and drop interface for designing farm layouts</p>
      {/* TODO: Implement in post-MVP */}
    </div>
  )
}

// components/features/layout/
// - farm-layout-canvas.tsx (placeholder)
// - room-node.tsx (placeholder)
// - pod-node.tsx (placeholder)
```

---

#### **J. Notifications & SSO Settings**

**This is part of Settings, not a standalone feature.**

```typescript
// app/(dashboard)/settings/notifications/page.tsx
// Notification preferences (email, SMS, push)

// app/(dashboard)/settings/integrations/page.tsx
// SSO configuration (for org admins)
```

---

## 7. Jurisdiction Configuration System

### 7.1 Jurisdiction Structure

```typescript
// lib/jurisdiction/types.ts

export interface JurisdictionConfig {
  id: string
  name: string
  country: 'us' | 'canada'
  state?: string // For US states
  plant_type: 'cannabis' | 'produce'
  rules: JurisdictionRules
}

export interface JurisdictionRules {
  // Batch rules
  batch: {
    require_license_number: boolean
    require_metrc_id: boolean
    allowed_stages: string[]
    min_plant_count?: number
    max_plant_count?: number
    require_plant_tags: boolean
    tag_format?: string // e.g., '1A4FF...'
  }
  
  // Waste rules
  waste: {
    allowed_reasons: string[] // Jurisdiction-specific waste reasons
    require_witness: boolean
    require_photo: boolean
    require_signature: boolean
    disposal_methods: string[]
  }
  
  // Inventory rules
  inventory: {
    track_lot_numbers: boolean
    track_expiry: boolean
    require_supplier_info: boolean
  }
  
  // Compliance reporting
  compliance: {
    report_types: string[]
    report_frequency: 'monthly' | 'quarterly' | 'annual'
    required_fields: string[]
  }
}
```

### 7.2 Jurisdiction Configurations

```typescript
// lib/jurisdiction/cannabis/oregon.ts

export const OREGON_CANNABIS: JurisdictionConfig = {
  id: 'oregon_cannabis',
  name: 'Oregon Cannabis (Metrc)',
  country: 'us',
  state: 'oregon',
  plant_type: 'cannabis',
  rules: {
    batch: {
      require_license_number: true,
      require_metrc_id: true,
      allowed_stages: [
        'planning', 'clone', 'veg', 'flower', 'harvest',
        'dry', 'cure', 'packaging', 'completed', 'destroyed'
      ],
      require_plant_tags: true,
      tag_format: '1A4FF', // Oregon Metrc tag format
    },
    waste: {
      allowed_reasons: [
        'Failed quality assurance',
        'Unhealthy or diseased plants',
        'Male plants',
        'Excess trim or plant waste',
        'Contamination',
        'Failed testing',
        'Other (specify)',
      ],
      require_witness: true,
      require_photo: true,
      require_signature: true,
      disposal_methods: [
        'Rendered unusable and compostable',
        'Rendered unusable and disposed in landfill',
        'Hazardous waste disposal',
      ],
    },
    inventory: {
      track_lot_numbers: true,
      track_expiry: true,
      require_supplier_info: true,
    },
    compliance: {
      report_types: ['metrc_monthly', 'metrc_inventory', 'metrc_sales'],
      report_frequency: 'monthly',
      required_fields: [
        'license_number',
        'metrc_batch_id',
        'plant_tags',
        'waste_logs',
        'inventory_movements',
      ],
    },
  },
}

// lib/jurisdiction/cannabis/maryland.ts
export const MARYLAND_CANNABIS: JurisdictionConfig = {
  // Similar structure to Oregon but with Maryland-specific rules
}

// lib/jurisdiction/cannabis/canada.ts
export const CANADA_CANNABIS: JurisdictionConfig = {
  id: 'canada_cannabis',
  name: 'Canada Cannabis',
  country: 'canada',
  plant_type: 'cannabis',
  rules: {
    batch: {
      require_license_number: true,
      require_metrc_id: false, // Canada uses CTLS, not Metrc
      allowed_stages: [
        'planning', 'germination', 'veg', 'flower', 'harvest',
        'dry', 'cure', 'packaging', 'completed', 'destroyed'
      ],
      require_plant_tags: false, // Canada tracks by batch, not individual plants
    },
    waste: {
      allowed_reasons: [
        'Quality control failure',
        'Contamination',
        'Overgrowth',
        'Expired product',
        'Production errors',
        'Other (specify)',
      ],
      require_witness: true,
      require_photo: true,
      require_signature: true,
      disposal_methods: [
        'Composted with non-cannabis waste',
        'Municipal landfill',
        'Incineration',
      ],
    },
    inventory: {
      track_lot_numbers: true,
      track_expiry: true,
      require_supplier_info: true,
    },
    compliance: {
      report_types: ['ctls_monthly'],
      report_frequency: 'monthly',
      required_fields: [
        'license_number',
        'batch_number',
        'environmental_logs',
        'waste_logs',
        'security_logs',
      ],
    },
  },
}

// lib/jurisdiction/produce/primus-gfs.ts
export const PRIMUS_GFS: JurisdictionConfig = {
  id: 'primus_gfs',
  name: 'PrimusGFS (Produce)',
  country: 'us', // Can be US or Canada
  plant_type: 'produce',
  rules: {
    batch: {
      require_license_number: false,
      require_metrc_id: false,
      allowed_stages: [
        'planning', 'germination', 'veg', 'harvest',
        'packaging', 'completed', 'destroyed'
      ],
      require_plant_tags: false,
    },
    waste: {
      allowed_reasons: [
        'Pest infestation',
        'Disease',
        'Quality control failure',
        'Overproduction',
        'Damage',
        'Other (specify)',
      ],
      require_witness: false,
      require_photo: true,
      require_signature: false,
      disposal_methods: [
        'Composted',
        'Landfill',
        'Animal feed',
      ],
    },
    inventory: {
      track_lot_numbers: true,
      track_expiry: true,
      require_supplier_info: true,
    },
    compliance: {
      report_types: ['primus_gfs_audit'],
      report_frequency: 'annual',
      required_fields: [
        'food_safety_plan',
        'water_testing_logs',
        'sanitation_logs',
        'pest_control_logs',
        'harvest_logs',
      ],
    },
  },
}
```

### 7.3 Jurisdiction Provider

```typescript
// components/providers/jurisdiction-provider.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getJurisdictionConfig } from '@/lib/jurisdiction/config'
import type { JurisdictionConfig } from '@/lib/jurisdiction/types'

interface JurisdictionContextType {
  jurisdiction: JurisdictionConfig | null
  isLoading: boolean
}

const JurisdictionContext = createContext<JurisdictionContextType>({
  jurisdiction: null,
  isLoading: true,
})

export function JurisdictionProvider({ children }: { children: React.ReactNode }) {
  const { user, organization } = useAuth()
  const [jurisdiction, setJurisdiction] = useState<JurisdictionConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (organization) {
      const config = getJurisdictionConfig(
        organization.jurisdiction,
        organization.plant_type
      )
      setJurisdiction(config)
      setIsLoading(false)
    }
  }, [organization])
  
  return (
    <JurisdictionContext.Provider value={{ jurisdiction, isLoading }}>
      {children}
    </JurisdictionContext.Provider>
  )
}

export function useJurisdiction() {
  const context = useContext(JurisdictionContext)
  if (!context) {
    throw new Error('useJurisdiction must be used within JurisdictionProvider')
  }
  return context
}

// lib/jurisdiction/config.ts

import { OREGON_CANNABIS } from './cannabis/oregon'
import { MARYLAND_CANNABIS } from './cannabis/maryland'
import { CANADA_CANNABIS } from './cannabis/canada'
import { PRIMUS_GFS } from './produce/primus-gfs'

const JURISDICTIONS = {
  oregon_cannabis: OREGON_CANNABIS,
  maryland_cannabis: MARYLAND_CANNABIS,
  canada_cannabis: CANADA_CANNABIS,
  primus_gfs: PRIMUS_GFS,
}

export function getJurisdictionConfig(
  jurisdiction: string,
  plantType: string
): JurisdictionConfig | null {
  const key = `${jurisdiction}_${plantType}` as keyof typeof JURISDICTIONS
  return JURISDICTIONS[key] || null
}
```

### 7.4 Usage in Components

```typescript
// Example: Waste disposal form with jurisdiction-aware reasons

'use client'

import { useJurisdiction } from '@/hooks/use-jurisdiction'

export function WasteDisposalForm() {
  const { jurisdiction } = useJurisdiction()
  
  if (!jurisdiction) return <div>Loading...</div>
  
  const wasteReasons = jurisdiction.rules.waste.allowed_reasons
  const requireWitness = jurisdiction.rules.waste.require_witness
  const requirePhoto = jurisdiction.rules.waste.require_photo
  
  return (
    <form>
      <select name="reason" required>
        {wasteReasons.map(reason => (
          <option key={reason} value={reason}>{reason}</option>
        ))}
      </select>
      
      {requireWitness && (
        <input name="witness_name" required placeholder="Witness Name" />
      )}
      
      {requirePhoto && (
        <input type="file" name="photo" accept="image/*" required />
      )}
      
      {/* ... rest of form */}
    </form>
  )
}
```

---

## 8. Integration Checklist

### Phase 1: Foundation Setup ✅ COMPLETE

- [x] **Project Structure**
  - [x] Create folder structure as defined in section 3.1
  - [x] Set up `/components/ui/`, `/components/features/`, `/components/shared/`
  - [x] Create `/lib/supabase/queries/` directory
  - [x] Create `/lib/jurisdiction/` directory
  - [x] Create `/lib/rbac/` directory
  - [x] Create `/hooks/` directory
  - [x] Create `/types/` directory with consolidated types
  - [x] Create `/config/` directory

- [x] **Database Setup** (Schema ready for deployment)
  - [x] Create complete schema.sql with all tables
  - [x] Define RLS policies for all tables
  - [x] Define RLS policies for org-scoped data access
  - [x] Define triggers for updated_at and audit logging
  - [x] Define indexes for performance
  - [ ] Deploy schema to US Supabase instance (pending)
  - [ ] Deploy schema to Canada Supabase instance (pending)

- [x] **RBAC System**
  - [x] Define roles in `/lib/rbac/roles.ts` (8 roles)
  - [x] Define permissions in `/lib/rbac/permissions.ts` (50+ permissions)
  - [x] Create permission guard functions in `/lib/rbac/guards.ts`
  - [x] Create `usePermissions()` hook
  - [x] Update signup flow to assign default role (org_admin)
  - [x] Add automatic role assignment for first org user

- [x] **Jurisdiction System**
  - [x] Create jurisdiction configs (Oregon, Maryland, Canada, PrimusGFS)
  - [x] Create `JurisdictionProvider` context
  - [x] Create `useJurisdiction()` hook
  - [x] Update signup flow to capture jurisdiction + plant type

- [x] **Dashboard Layout**
  - [x] Create `dashboard/` route (renamed from `(dashboard)`)
  - [x] Create dashboard layout with navigation
  - [x] Create dashboard sidebar component
  - [x] Create dashboard header component
  - [x] Implement navigation based on user role
  - [x] Add breadcrumbs component
  - [x] Add dev mode bypass for UI development

### Phase 1.5: Signup Enhancement & UI Consolidation ✅ COMPLETE
*(Completed work added to checklist - does not change original phase priorities)*

#### Enhanced Signup Flow ✅
- [x] Modify Step 1 to automatically assign `org_admin` role to first user
- [x] Remove role dropdown from Step 1
- [x] Add informational panel explaining org_admin privileges
- [x] Add plant type selection to Step 2 (Cannabis/Produce)
- [x] Add jurisdiction selection to Step 2 (Oregon, Maryland, Canada, PrimusGFS)
- [x] Add data region selection to Step 2 (US/Canada)
- [x] Implement conditional jurisdiction options based on plant type
- [x] Update form validation for new fields
- [x] Test signup flow with localStorage persistence

#### UI Component Consolidation ✅
- [x] **Audit all shadcn/ui components** across 11 prototypes
- [x] **Create UI component inventory** (UI_COMPONENT_AUDIT.md)
- [x] **Migrate 38 essential components** from BatchManagementPrototype
- [x] **Update all imports** to reference consolidated components
- [x] **Document component library** in CURRENT.md
- [x] Verify no duplicate components
- [x] Total available components: 47+ (11 original + 38 migrated - 2 duplicates)

#### Testing & Documentation ✅
- [x] Create comprehensive test suite for signup flow
- [x] Write 19 tests covering validation, role assignment, jurisdiction logic
- [x] Achieve 100% test pass rate
- [x] Create PHASE_2_SUMMARY.md
- [x] Update CURRENT.md
- [x] Update NextSteps.md
- [x] Create DEV_MODE.md for development workflow

#### Development Tools ✅
- [x] Add dev mode bypass for dashboard access without authentication
- [x] Rename dashboard folder from `(dashboard)` to `dashboard` for proper routing
- [x] Create mock user data for development
- [x] Add visual dev mode indicator banner

### Phase 2: Priority 1 Features ← START HERE (ORIGINAL CHECKLIST PRIORITIES)

#### Identity & Roles ✅ COMPLETE
- [x] Migrate admin components to `/components/features/admin/`
- [x] Create `/app/dashboard/admin/` pages
- [x] Implement user table with CRUD operations
- [x] Implement role management interface
- [x] Implement permission matrix view
- [x] Create audit log viewer
- [x] Add permission checks to all admin pages

#### Inventory ⏳ IN PROGRESS (See InventoryIntegrationSteps.md for detailed progress)
- [ ] Enhance database schema (add `inventory_lots` table)
- [ ] Create type definitions in `/types/inventory.ts`
- [ ] Migrate inventory components to `/components/features/inventory/`
- [ ] Create `/app/dashboard/inventory/` pages
- [ ] Implement inventory queries in `/lib/supabase/queries/inventory.ts`
- [ ] Create inventory dashboard with summary cards
- [ ] Implement item creation/editing with par levels
- [ ] Implement lot tracking (FIFO/LIFO)
- [ ] Implement movement tracking (receive, issue, adjust, dispose)
- [ ] **Consolidate waste management** (create shared components for batch + inventory)
- [ ] Add jurisdiction-aware waste disposal form (uses `useJurisdiction()`)
- [ ] Implement low stock alerts
- [ ] Implement expiry alerts
- [ ] Add inventory exports (CSV/PDF)
- [ ] **NOTE**: Comprehensive compliance features (Metrc packages, CTLS integration, PrimusGFS audit prep, transfer manifests, label generation) deferred to Phase 3: Compliance Engine

#### Monitoring & Telemetry
- [ ] Migrate monitoring components to `/components/features/monitoring/`
- [ ] Create `/app/dashboard/monitoring/` pages
- [ ] Set up `useTelemetry()` hook with Supabase Realtime
- [ ] Create pod status cards
- [ ] Create environmental charts (temp, humidity, CO2, VPD)
- [ ] Implement telemetry table with filtering
- [ ] Add data export functionality
- [ ] **For MVP:** Use mock telemetry data (TagoIO integration post-migration)
- [ ] Create structure for TagoIO integration (`/lib/tagoio/`)

#### Environmental Controls
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

### Phase 3: Priority 2 Features

#### Workflow & Tasks
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

### Phase 3: Priority 2 Features

#### Workflow & Tasks
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

#### Compliance Engine
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

#### Batch Management
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

#### Alarms & Notifications
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

### Phase 4: Settings & Future Structure

#### Settings Pages
- [ ] Create `/app/dashboard/settings/` pages
- [ ] Implement profile settings
- [ ] Create organization settings (org admin only)
- [ ] Add notification preferences page
- [ ] Create integrations page (SSO configuration)

#### Future Features (Structure Only)
- [ ] Create `/app/dashboard/layout-editor/` with placeholder
- [ ] Add layout editor components to `/components/features/layout/` (empty)

### Phase 5: Final Integration & Deployment

#### Component Consolidation (ALREADY COMPLETE ✅)
- [x] **Audit all shadcn/ui components** across prototypes
- [x] **Merge unique components** into main repo's `/components/ui/`
- [x] **Update all imports** to reference consolidated components
- [x] **Remove duplicate components**

#### Cleanup & Organization
- [ ] Remove all mock data files (or move to `/lib/mock/` for testing)
- [ ] Delete old prototype directories
- [ ] Organize utility functions in `/lib/utils.ts`
- [ ] Create shared hooks in `/hooks/`
- [ ] Consolidate validation schemas in `/lib/validations/`
- [ ] Define constants in `/lib/constants/`

#### Type System
- [ ] Consolidate all TypeScript types into `/types/`
- [ ] Generate Supabase types from database schema
- [ ] Ensure no type conflicts or duplicates
- [ ] Export types from `/types/index.ts`

#### Testing
- [x] Test signup flow (19 tests passing ✅)
- [ ] Test RBAC permissions across all features
- [ ] Test jurisdiction-specific flows (waste, batch creation, etc.)
- [ ] Test multi-regional database routing
- [ ] Test all CRUD operations
- [ ] Test form validations
- [ ] Test error handling

#### Database Deployment
- [ ] Deploy schema.sql to US Supabase instance
- [ ] Deploy schema.sql to Canada Supabase instance
- [ ] Verify RLS policies are active
- [ ] Test multi-regional data access
- [ ] Seed initial data (jurisdictions, default roles)

#### Documentation
- [x] Update README with new structure
- [x] Document RBAC permission system (in NextSteps.md)
- [x] Document jurisdiction configuration system (in NextSteps.md)
- [x] Document database schema (in schema.sql comments)
- [ ] Create component usage guide
- [ ] Document API patterns and conventions
- [ ] Create deployment guide

---

## 9. Testing Strategy

### 9.1 Unit Testing
- **Component tests:** Use Jest + React Testing Library
- **Hook tests:** Test custom hooks in isolation
- **Utility tests:** Test jurisdiction config, RBAC guards, validators

### 9.2 Integration Testing
- **RBAC flows:** Test permission checks across features
- **Jurisdiction flows:** Test jurisdiction-specific behavior (waste disposal, batch creation)
- **Database operations:** Test Supabase queries with test data

### 9.3 End-to-End Testing
- **User journeys:** Test complete workflows (create batch → assign to pod → add task → complete task)
- **Multi-role testing:** Test same feature with different roles
- **Cross-feature testing:** Test data flow between features (batch → inventory → compliance)

---

## 10. Post-Integration Tasks

### 10.1 TagoIO Integration
After migration is complete, implement TagoIO polling service:
1. Set up TagoIO API client
2. Create polling service to fetch telemetry every 10 seconds
3. Transform TagoIO data to Trazo format
4. Store in `telemetry_readings` table
5. Enable Supabase Realtime subscriptions for UI updates

### 10.2 Performance Optimization
1. Implement data caching where appropriate
2. Optimize Supabase queries with proper indexes
3. Add pagination to large datasets
4. Lazy load heavy components

### 10.3 User Feedback & Iteration
1. Conduct user testing with beta users
2. Collect feedback on jurisdiction-specific flows
3. Refine RBAC permissions based on real-world usage
4. Iterate on UI/UX based on feedback

---

## 📊 CURRENT IMPLEMENTATION STATUS

### ✅ **PHASE 1: FOUNDATION - COMPLETE (October 16, 2025)**

#### **Completed Tasks:**

1. **✅ Prototype Analysis** 
   - File: `/Prototypes/README.md` (comprehensive 11-prototype analysis)
   - Status: All prototypes analyzed with component inventories and integration priorities

2. **✅ Project Structure Setup**
   - Dashboard route: `/app/dashboard/` (renamed from `(dashboard)` for proper routing)
   - Feature directories: Created for all major areas
   - Component organization: Established proper structure
   - Development tools: Dev mode bypass added for UI testing without auth

3. **✅ RBAC System Implementation**
   - Location: `/lib/rbac/`
   - Files: `types.ts`, `permissions.ts`, `roles.ts`, `guards.ts`
   - React Hook: `/hooks/use-permissions.ts`
   - Coverage: 8 roles, 50+ permissions, complete guard system
   - Integration: Automatic org_admin assignment in signup

4. **✅ Jurisdiction Configuration Engine**
   - Location: `/lib/jurisdiction/`
   - Jurisdictions: Oregon (Metrc), Maryland (Metrc), Canada (CTLS), PrimusGFS
   - Files: Individual config files + central registry
   - React Hook: `/hooks/use-jurisdiction.ts`
   - Integration: Jurisdiction selection in signup Step 2

5. **✅ Complete Database Schema**
   - File: `/lib/supabase/schema.sql`
   - Tables: 20+ tables covering all features
   - Security: RLS policies, triggers, audit trails
   - Performance: Indexes and optimizations
   - Status: Ready for deployment (not yet deployed)

6. **✅ Dashboard Layout Infrastructure**
   - Layout: `/app/dashboard/layout.tsx` with auth protection
   - Components: Sidebar, header, breadcrumbs, main dashboard
   - Navigation: Role-based menu system
   - Responsive: Mobile-friendly design
   - Dev Mode: Bypass authentication for UI development

### ✅ **PHASE 2: SIGNUP ENHANCEMENT & UI CONSOLIDATION - COMPLETE (October 17, 2025)**

#### **Completed Tasks:**

1. **✅ Enhanced Signup Flow**
   - **Step 1 Modified:** Automatic org_admin role assignment
   - **Role Dropdown Removed:** First user always gets highest privileges
   - **Info Panel Added:** Explains org_admin role and permissions
   - **Step 2 Enhanced:** Added plant type selection (Cannabis/Produce)
   - **Jurisdiction Selection:** Oregon, Maryland, Canada, PrimusGFS
   - **Data Region Selection:** US or Canada for data residency
   - **Conditional Logic:** Jurisdiction options filter based on plant type
   - **Validation Updated:** All new fields properly validated

2. **✅ UI Component Consolidation**
   - **Audit Complete:** All 11 prototypes analyzed for UI components
   - **Inventory Created:** `UI_COMPONENT_AUDIT.md` with 45 components catalogued
   - **Migration Complete:** 38 essential components migrated from BatchManagementPrototype
   - **Total Available:** 47+ components (11 original + 38 new - 2 duplicates)
   - **Components Include:** dialog, form, alert, select, table, tabs, calendar, sheet, popover, command, accordion, tooltip, and more
   - **Status:** Main repo `/components/ui/` is now source of truth

3. **✅ Comprehensive Testing**
   - **Test Suite Created:** `/app/auth/sign-up/__tests__/signup-flow.test.ts`
   - **Test Coverage:** 19 tests covering all signup scenarios
   - **Test Areas:** Role assignment, field validation, jurisdiction logic, localStorage
   - **Pass Rate:** 100% (19/19 tests passing)
   - **Quality:** Proper mocking, boolean coercion, clean test code

4. **✅ Documentation Updates**
   - **CURRENT.md:** Updated to reflect Phase 2 completion
   - **NextSteps.md:** Updated to v1.2 with Phase 3 guidance
   - **PHASE_2_SUMMARY.md:** Complete session summary created
   - **UI_COMPONENT_AUDIT.md:** Component inventory and migration plan
   - **DEV_MODE.md:** Development workflow guide created

5. **✅ Development Tools**
   - **Dev Mode Bypass:** Access dashboard without authentication
   - **Mock User Data:** Realistic development user with org_admin role
   - **Visual Indicator:** Yellow banner shows when dev mode is active
   - **Production Safe:** Only works in NODE_ENV=development
   - **Folder Rename:** Dashboard route corrected from `(dashboard)` to `dashboard`

### ⏳ **PHASE 3: BATCH MANAGEMENT & INVENTORY - READY TO BEGIN**

**All foundation systems AND Phase 2 core integration are complete. Feature integration can begin immediately.**

#### **Next Immediate Priority: Batch Management System** ← **START HERE**

**Why Batch Management First:**
- Largest and most complex prototype (19 components)
- Core business logic for container farming operations
- Foundation for inventory, compliance, and task management
- Most requested feature by stakeholders

**Integration Approach:**
1. **Read the Batch Management section** in this document (Section 6)
2. **Review prototype analysis** in `/Prototypes/README.md`
3. **Start with Batch Dashboard** - Migrate to `/app/dashboard/batches/page.tsx`
4. **Follow the migration pattern** documented below
5. **Test incrementally** - Add tests for each new component/page
6. **Document progress** - Update CURRENT.md as you complete tasks

**Migration Tasks for Batch Management:**
- [ ] Migrate 19 batch components to `/components/features/batch/`
- [ ] Consolidate type definitions into `/types/batch.ts`
- [ ] Create `/app/dashboard/batches/` pages
- [ ] Implement Supabase queries in `/lib/supabase/queries/batches.ts`
- [ ] Create batch dashboard with filtering
- [ ] Implement jurisdiction-aware batch creation wizard
- [ ] Add RBAC permission checks to all operations
- [ ] Create comprehensive test suite
- [ ] Update documentation

#### **Second Priority: Inventory Tracking & Management**

After Batch Management is complete, proceed with Inventory:
- [ ] Migrate inventory components to `/components/features/inventory/`
- [ ] Create `/app/dashboard/inventory/` pages
- [ ] Implement inventory queries
- [ ] Consolidate waste management (merge batch + inventory prototypes)
- [ ] Add jurisdiction-aware waste disposal
- [ ] Implement stock alerts and par levels

### ⏳ **FUTURE PHASES**

#### **Phase 4: Environmental Controls & Monitoring** (Priority 2)
- Environmental recipe management
- Real-time telemetry visualization
- Pod status monitoring
- TagoIO integration structure

#### **Phase 5: Tasks, Compliance, Alarms** (Priority 3)
- SOP workflow automation
- Regulatory reporting
- Alarm policies and notifications

#### **Phase 6: Settings & Administration**
- User profile settings
- Organization configuration
- SSO integration

#### **Phase 7: Final Deployment**
- Database deployment to Supabase
- Comprehensive testing
- Production optimization
- Final documentation

---

## 🎯 SUMMARY FOR NEW LLM SESSIONS

### **What's Complete:**
**Phases 1 and 2 are fully complete. All infrastructure ready for feature integration.**
- ✅ Complete RBAC system with 8 roles and comprehensive permissions
- ✅ Jurisdiction engine supporting 4 compliance frameworks
- ✅ Full database schema with 20+ tables and security policies
- ✅ Dashboard layout with responsive navigation and user management
- ✅ Comprehensive prototype analysis documenting all integration requirements
- ✅ **Enhanced signup flow with automatic org_admin role assignment**
- ✅ **Jurisdiction and plant type selection in signup**
- ✅ **47+ UI components migrated from prototypes**
- ✅ **Comprehensive test suite (19 passing tests)**
- ✅ **UI component audit documentation**

### **What's Next:**
**Phase 3: Feature Integration - Start with Batch Management**

The next agent should:
1. **Read the Batch Management section** in this document (Section 6)
2. **Review prototype analysis** in `/Prototypes/README.md` - Batch Management is the largest prototype
3. **Start with Batch Dashboard** - Migrate `BatchDashboard.tsx` to `/app/(dashboard)/batches/page.tsx`
4. **Follow the migration pattern:**
   - Copy component from prototype
   - Update imports for new location
   - Replace mock data with Supabase queries
   - Add jurisdiction-aware logic using `useJurisdiction()` hook
   - Add RBAC permission checks using `usePermissions()` hook
   - Update styling to use main repo color tokens
   - Add proper TypeScript types from consolidated types
5. **Test incrementally** - Add tests for each new component/page
6. **Document progress** - Update CURRENT.md and NextSteps.md

### **Key Files for Continuation:**
- `/Prototypes/README.md` - Complete prototype analysis and integration guide
- `/Prototypes/BatchManagementPrototype/` - **START HERE for Phase 3**
- `/lib/rbac/` - Role and permission system (ready to use)
- `/lib/jurisdiction/` - Compliance rules engine (ready to use)
- `/lib/supabase/schema.sql` - Complete database schema (ready to deploy)
- `/app/(dashboard)/` - Dashboard infrastructure (ready for features)
- `/components/ui/` - 47+ UI components ready to use
- `/NextSteps.md` - This comprehensive integration guide
- `/CURRENT.md` - Current implementation status and architecture
- `/UI_COMPONENT_AUDIT.md` - UI component consolidation reference

### **Execution Order:**
1. ✅ ~~Set up project structure and database schema (Phase 1)~~
2. ✅ ~~Implement RBAC and jurisdiction systems (Phase 1)~~  
3. ✅ ~~Enhanced signup flow and component consolidation (Phase 2)~~
4. 🚀 **Migrate Batch Management System (Phase 3 - Priority 1)** ← **YOU ARE HERE**
5. ⏳ Migrate Inventory Tracking (Phase 3 - Priority 1)
6. ⏳ Migrate Environmental Controls and Monitoring (Phase 3 - Priority 2)
7. ⏳ Migrate Tasks, Compliance, Alarms (Phase 3 - Priority 3)
8. ⏳ Create Settings pages and future feature structure
9. ⏳ Final consolidation, cleanup, and optimization

### **Phase 3 Implementation Pattern:**

For each feature (e.g., Batch Management):

**Step 1: Create Page Structure**
```typescript
// app/(dashboard)/batches/page.tsx
'use client'

import { BatchDashboard } from '@/components/features/batch/batch-dashboard'
import { usePermissions } from '@/hooks/use-permissions'
import { redirect } from 'next/navigation'

export default function BatchesPage() {
  const { can } = usePermissions()
  
  if (!can('batch:view')) {
    redirect('/dashboard')
  }
  
  return <BatchDashboard />
}
```

**Step 2: Migrate Feature Component**
```typescript
// components/features/batch/batch-dashboard.tsx
'use client'

import { useJurisdiction } from '@/hooks/use-jurisdiction'
import { useBatches } from '@/hooks/use-batches' // Create this hook
import { Table } from '@/components/ui/table' // Use migrated component

export function BatchDashboard() {
  const { jurisdiction } = useJurisdiction()
  const { batches, isLoading } = useBatches()
  
  // Filter batches based on jurisdiction rules
  const validStages = jurisdiction?.rules?.batch?.allowed_stages || []
  
  return (
    <div>
      <h1>Batch Management</h1>
      <Table data={batches} /* ... */ />
    </div>
  )
}
```

**Step 3: Create Data Hook**
```typescript
// hooks/use-batches.ts
'use client'

import { useEffect, useState } from 'react'
import { getBatches } from '@/lib/supabase/queries/batches'

export function useBatches() {
  const [batches, setBatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function fetchBatches() {
      const data = await getBatches()
      setBatches(data)
      setIsLoading(false)
    }
    fetchBatches()
  }, [])
  
  return { batches, isLoading }
}
```

**Step 4: Create Supabase Query**
```typescript
// lib/supabase/queries/batches.ts
import { createClient } from '@/lib/supabase/client'

export async function getBatches() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}
```

**Step 5: Add Tests**
```typescript
// app/(dashboard)/batches/__tests__/page.test.ts
import { describe, it, expect } from '@jest/globals'

describe('Batches Page', () => {
  it('should require batch:view permission', () => {
    // Test permission check
  })
  
  it('should display batch list', () => {
    // Test rendering
  })
})
```

**Key Principles:**
- **KEEP** main repository's design system and shadcn/ui components
- **CONSOLIDATE** overlapping functionality (waste management, evidence capture)
- **ADD** jurisdiction-awareness to all relevant features
- **ADD** RBAC permission checks to all features
- **REPLACE** mock data with Supabase queries
- **FOLLOW** Next.js 15 App Router patterns
- **USE** Server Components where appropriate
- **MAINTAIN** multi-regional database architecture
- **TEST** each component as you build it

**Critical Consolidations:**
1. **Waste Management:** Primary implementation in Inventory, link from Batch
2. **Evidence Capture:** Shared component in `/components/shared/`, used by Tasks and Batch
3. **shadcn/ui Components:** Main repo as source of truth, merge unique components

**Jurisdiction System:**
- Oregon Cannabis (Metrc) - Use `jurisdiction.rules.batch.*`
- Maryland Cannabis (Metrc) - Use `jurisdiction.rules.batch.*`
- Canada Cannabis (CTLS) - Use `jurisdiction.rules.batch.*`
- Produce (PrimusGFS) - Use `jurisdiction.rules.batch.*`

**Roles with Batch Access:**
- `org_admin` - Full access (all permissions)
- `site_manager` - Full batch management
- `head_grower` - Create, update, stage changes
- `operator` - View only
- Others - Check specific permissions in `/lib/rbac/roles.ts`

**Available UI Components (47+):**
Use these instead of creating new ones:
- dialog, alert-dialog, alert, form, select, separator
- table, tabs, avatar, calendar, switch, textarea
- sheet, popover, command, accordion, tooltip, sonner
- breadcrumb, context-menu, hover-card, navigation-menu
- pagination, progress, radio-group, scroll-area, skeleton, slider
- And more in `/components/ui/`

**Good luck with Phase 3! Start with Batch Management and follow the patterns above.** 🚀
