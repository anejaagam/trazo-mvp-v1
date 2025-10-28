# TRAZO MVP - Next Steps & Integration Roadmap

**Last Updated:** January 2025 (Phase 8: Inventory Feature Complete)  
**Document Version:** 3.0  
**Purpose:** Deployment guide for inventory feature and roadmap for remaining features

---

## 🚀 IMMEDIATE ACTION ITEMS

### 1. 🔐 Deploy Inventory Feature to Production (TOP PRIORITY)

**Current Status:** ✅ Code complete, ✅ All tests passing, ⏳ Awaiting database deployment

#### **Deployment Checklist:**

##### A. Database Setup (Both US & CA Supabase Projects)

1. **Apply Schema Updates** (via Supabase SQL Editor)
   ```sql
   -- Run the complete schema file which includes inventory tables
   -- Copy/paste: lib/supabase/schema.sql
   
   -- Includes:
   -- ✅ inventory_items table
   -- ✅ inventory_lots table
   -- ✅ inventory_movements table
   -- ✅ waste_logs table
   -- ✅ 3 materialized views (stock_balances, active_lots, movement_summary)
   -- ✅ Triggers (update quantities, generate alerts)
   -- ✅ Functions (update_inventory_quantity, check_inventory_alerts)
   -- ✅ Indexes (10+ performance indexes)
   -- ✅ RLS policies (all inventory tables)
   ```

2. **Verify Schema Applied**
   ```sql
   -- Check tables created
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'inventory%';
   
   -- Expected: inventory_items, inventory_lots, inventory_movements
   
   -- Check views created
   SELECT table_name 
   FROM information_schema.views 
   WHERE table_schema = 'public'
   AND table_name LIKE 'inventory%';
   
   -- Expected: inventory_stock_balances, inventory_active_lots, inventory_movement_summary
   
   -- Check RLS policies active
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE tablename LIKE 'inventory%';
   ```

##### B. Local Testing

```bash
# 1. Verify environment variables
cat .env.local
# Check: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (both US & CA)

# 2. Seed test data
npm run seed:dev

# 3. Run tests
npm test
# Should show: 164/173 passing (94.8%)

# 4. Build verification
npm run build
# Should complete without errors

# 5. Start dev server
npm run dev
# Navigate to: http://localhost:3000/dashboard/inventory
```

##### C. Manual Testing Checklist

- [ ] **Create Item**: Dashboard → Inventory → Items → Add Item
  - Try: CO2 Tank, Nutrient, Filter
  - Verify: Appears in item list, stock balance = 0
  
- [ ] **Receive Shipment**: Items → Actions → Receive
  - Enter: Quantity, Lot Code, Expiry Date
  - Verify: Lot created, stock balance updated, movement recorded
  
- [ ] **Issue Inventory**: Items → Actions → Issue
  - Test FIFO allocation
  - Verify: Quantity deducted from oldest lot first, movement recorded
  
- [ ] **Adjust Inventory**: Items → Actions → Adjust
  - Manual quantity adjustment with reason
  - Verify: Stock updated, movement shows "adjust" type
  
- [ ] **View Movements**: Dashboard → Inventory → Movements
  - Verify: All transactions appear with correct timestamps
  - Check: Filters work (type, date range, item)
  
- [ ] **Low Stock Alerts**: Dashboard → Inventory → Alerts
  - Create item with quantity below minimum
  - Verify: Alert appears automatically
  
- [ ] **Waste Disposal**: Dashboard → Inventory → Waste
  - Document waste with reason
  - Verify: Waste log entry created
  
- [ ] **Audit Trail**: Dashboard → Admin → Audit Log
  - Verify: All inventory actions logged with correct user
  - Check: Shows actual username (not "System")
  
- [ ] **RBAC Testing**:
  - [ ] org_admin: Full access to all features
  - [ ] head_grower: Can view, create, edit inventory
  - [ ] operator: Can view inventory, limited actions
  - [ ] compliance_qa: View-only access

##### D. Production Deployment

```bash
# 1. Final commit
git add .
git commit -m "feat: Complete inventory feature integration (Phase 8)"
git push origin main

# 2. Deploy to production (Vercel/your hosting)
# Follow standard Next.js deployment process

# 3. Apply schema to production Supabase
# Repeat steps A.1-A.2 for production database

# 4. Verify production
# Test all features in production environment

# 5. Monitor
# Check: Vercel logs, Supabase logs, error tracking
```

---

### 2. 🛡️ Security & Auth Hardening (HIGH PRIORITY)

Apply these settings in **both US & CA Supabase projects**:

#### A. Enable Password Protection

1. Navigate to: **Supabase Dashboard → Authentication → Password**
2. Enable: **"Compromised password protection"**
3. Click **Save**

#### B. Verify Email Templates

1. Go to: **Authentication → Email Templates**
2. Confirm custom templates use correct redirect routes:

   | Template | Redirect Route | Destination |
   |----------|---------------|-------------|
   | Signup Confirmation | `/auth/confirm/signup` | Login page |
   | Invite User | `/auth/confirm/invite` | Update Password → Login |
   | Password Recovery | `/auth/confirm/recovery` | Update Password → Login |

3. Update if necessary

#### C. Domain Configuration

1. Go to: **Authentication → URL Configuration**
2. Set **Site URL**:
   - Development: `http://localhost:3000`
   - Production: Your production domain (e.g., `https://app.trazo.ag`)
3. **Domain Lists**: Leave empty (permit any email domain)
4. **Redirect URLs**: Add allowed redirect URLs for OAuth/SSO (future)

---

### 3. 🔧 Audit Log Attribution Fix (MEDIUM PRIORITY)

**Issue:** Inventory actions created via API show "System" instead of actual user in audit log.

**Root Cause:** Service-role client calls trigger functions where `auth.uid()` is NULL.

**Solution:**

```sql
-- Run in Supabase SQL Editor (both US & CA):

-- Option 1: Apply specific fix only
\i lib/supabase/fix-audit-function.sql

-- Option 2: Re-run full schema (RECOMMENDED - includes all latest updates)
\i lib/supabase/schema.sql
```

**Verification Steps:**

1. Create inventory item via UI
2. Navigate to: **Dashboard → Admin → Audit Log**
3. Find the CREATE action for `inventory_items`
4. Verify **"Performed By"** column shows your username (not "System")
5. Test receive/issue actions
6. Verify movements also show correct user via `performed_by`

**Technical Details:**
- Updated function uses `SECURITY DEFINER` with fixed `search_path`
- Falls back to `created_by`/`performed_by` columns when `auth.uid()` is NULL
- Resolves `organization_id` by joining related tables

---

## 🎯 PROJECT STATUS OVERVIEW

### **Current Development Phase**

| Phase | Status | Completion Date |
|-------|--------|----------------|
| Phase 1: Foundation | ✅ Complete | October 2024 |
| Phase 2: Core Integration | ✅ Complete | October 2024 |
| Phase 7: Signup Integration | ✅ Complete | December 2024 |
| **Phase 8: Inventory Feature** | ✅ **Complete** | **January 2025** ⭐ |
| **Phase 9: Deployment** | 🚀 **Current** | **January 2025** |
| Phase 10: Next Feature | 📋 Queued | TBD |

### **Code Quality Metrics**

- **Test Coverage:** 164/173 tests passing (94.8%)
- **Test Suites:** 10/11 fully passing
- **TypeScript:** 100% type coverage
- **Build Status:** ✅ Passing
- **Linting:** ✅ Passing
- **Known Issues:** 9 low-priority test failures (deferred)

### **Features Delivered**

#### ✅ **Foundation Systems** (Phase 1-2)
- RBAC System (8 roles, 50+ permissions)
- Jurisdiction Engine (Oregon, Maryland, Canada, PrimusGFS)
- Database Schema (25+ tables with RLS)
- Dashboard Layout (responsive, role-based navigation)
- Multi-region Supabase (US & Canada data residency)
- Dev Mode (authentication bypass for development)
- Seed Data System (automated test data generation)

#### ✅ **Admin Management** (Phase 2)
- User Management (CRUD operations)
- Role Assignment (org-level & site-level)
- Audit Logging (complete action trail)
- Site Assignments (user-to-site mapping)
- Permission Matrix (visual permission viewer)
- User Invitations (email-based onboarding)

#### ✅ **Signup & Onboarding** (Phase 7)
- 4-Step Signup Flow
- Auto org_admin Assignment (first user)
- Jurisdiction Selection (conditional on plant type)
- Organization Auto-Creation
- Emergency Contact Storage
- Multi-Region Support

#### ✅ **Inventory Tracking** (Phase 8) ⭐ **NEW**
- **Item Catalog Management**
  - CRUD operations for inventory items
  - 10 item types (CO2 tanks, nutrients, filters, etc.)
  - SKU tracking, supplier info, cost tracking
  - Location management
  
- **Lot Tracking System**
  - Receive shipments (creates lots)
  - Expiry date tracking
  - Batch/purchase order linking
  - Compliance package UIDs (Metrc/CTLS/PrimusGFS)
  
- **Smart Allocation**
  - FIFO (First In, First Out)
  - LIFO (Last In, First Out)
  - FEFO (First Expired, First Out)
  - Manual lot selection
  
- **Movement History**
  - Complete transaction log
  - Receive, Issue, Adjust, Transfer, Dispose
  - Attribution to batches
  - Reason codes and notes
  
- **Alerts & Reporting**
  - Automatic low stock alerts
  - Expiry date warnings
  - Stock balance views
  - Movement summaries
  
- **Waste Management**
  - Disposal documentation
  - Photo upload support
  - Witness signatures
  - Jurisdiction-compliant reasons
  
- **API Routes**
  - 6 RESTful endpoints
  - Full CRUD operations
  - Lot allocation logic
  - Permission-guarded

---

## 📋 FEATURE INTEGRATION ROADMAP

### **Phase 10: Monitoring & Telemetry** (Next Up)

**Priority:** 🔴 High (Essential for daily operations)  
**Estimated Effort:** 2-3 weeks  
**Dependencies:** 
- TagoIO integration (external API)
- Telemetry polling service
- Chart library (already have recharts)

**Deliverables:**

1. **Real-Time Monitoring Dashboard**
   - Pod status overview (all pods at a glance)
   - Environmental metrics (temp, humidity, CO2, VPD)
   - Equipment status indicators
   - Alert indicators

2. **Historical Data Visualization**
   - Time-series charts
   - Configurable date ranges
   - Export to CSV/PDF
   - Comparison views

3. **Pod Detail View**
   - Individual pod metrics
   - Equipment controls status
   - Sensor health
   - Recent alerts

4. **TagoIO Integration**
   - API client setup
   - Polling service (60-second intervals)
   - Data transformation
   - Error handling

5. **Database Integration**
   - `telemetry_readings` table (already in schema)
   - Batch insert optimization
   - Data retention policies
   - Query optimization

**Reference Materials:**
- Prototype: `/Prototypes/MonitoringAndTelemetryPrototype/`
- Database: `telemetry_readings` table in schema.sql
- Types: Define in `/types/telemetry.ts`

**Integration Pattern:**
- Follow inventory feature pattern
- 7-phase approach (Database → Types → Queries → Components → Pages → API → Testing)

---

### **Phase 11: Environmental Controls** (Queued)

**Priority:** 🟠 High  
**Estimated Effort:** 2-3 weeks  
**Dependencies:** Monitoring & Telemetry (must be complete first)

**Deliverables:**
1. Recipe Management (temperature, humidity, CO2, light setpoints)
2. Schedule Builder (automated recipe application)
3. Manual Overrides (emergency/maintenance controls)
4. HVAC Automation Integration
5. Recipe Templates Library

**Reference:** `/Prototypes/EnvironmentalControlsPrototype/`

---

### **Phase 12: Task Management & SOPs** (Queued)

**Priority:** 🟡 Medium  
**Estimated Effort:** 2 weeks  

**Deliverables:**
1. SOP Template Builder
2. Task Assignment & Tracking
3. Evidence Capture (photos, signatures, readings)
4. Workflow Automation
5. Task Completion Validation

**Reference:** `/Prototypes/WorkflowAndTaskManagementPrototype/`

---

### **Phase 13: Compliance Engine** (Queued)

**Priority:** 🟡 Medium  
**Estimated Effort:** 3 weeks  
**Dependencies:** Batch Management (for full compliance reporting)

**Deliverables:**
1. Regulatory Reporting (Metrc, CTLS, PrimusGFS)
2. Evidence Vault (secure document storage)
3. Jurisdiction Templates
4. Audit Trail Export
5. Compliance Dashboard

**Reference:** `/Prototypes/ComplianceEnginePrototype/`

---

### **Phase 14: Batch Management** (Queued)

**Priority:** 🟡 Medium-High  
**Estimated Effort:** 3-4 weeks  
**Dependencies:** Inventory (for material allocation)

**Deliverables:**
1. Plant Lifecycle Tracking
2. Batch Genealogy (parent-child relationships)
3. Stage Transitions (germination → veg → flower → harvest)
4. Harvest Workflow
5. Plant Tagging System
6. Waste Disposal Integration

**Reference:** `/Prototypes/BatchManagementPrototype/`

---

### **Phase 15: Alarms & Notifications** (Queued)

**Priority:** 🟢 Medium-Low  
**Estimated Effort:** 1-2 weeks  
**Dependencies:** Monitoring & Telemetry (for alarm triggers)

**Deliverables:**
1. Alarm Policy Configuration
2. Notification Routing (in-app, email, SMS)
3. Escalation Rules
4. Alarm History
5. Acknowledgment Workflow

**Reference:** `/Prototypes/AlarmsAndNotifSystemPrototype/`

---

### **Phase 16: Settings & Integrations** (Queued)

**Priority:** 🟢 Low  
**Estimated Effort:** 1 week  

**Deliverables:**
1. User Preferences
2. Organization Settings
3. SSO Configuration (future)
4. API Integration Management
5. Theme Customization

---

## 🏗️ INTEGRATION BEST PRACTICES

### **Proven 7-Phase Pattern** (From Inventory Feature)

#### Phase 1: Database Schema (1-2 days)
- Add tables, views, triggers, functions to `schema.sql`
- Define indexes for performance
- Write RLS policies
- Test locally with Supabase

#### Phase 2: Type Definitions (1 day)
- Create `/types/[feature].ts`
- Define interfaces for all entities
- Include insert/update types
- Export from `/types/index.ts`

#### Phase 3: Database Queries (2-3 days)
- Create `/lib/supabase/queries/[feature].ts`
- Implement CRUD operations
- Add filtering, sorting, pagination
- Write query helper functions
- Add client-side query modules if needed

#### Phase 4: UI Components (3-4 days)
- Create `/components/features/[feature]/`
- Build data tables, dialogs, forms
- Implement RBAC checks (`usePermissions`)
- Add jurisdiction awareness (`useJurisdiction`)
- Handle dev mode gracefully

#### Phase 5: Dashboard Pages (2-3 days)
- Create `/app/dashboard/[feature]/` routes
- Use Server Component pattern
- Add permission guards
- Implement data fetching
- Create client wrappers for interactivity

#### Phase 6: API Routes (2-3 days)
- Create `/app/api/[feature]/` endpoints
- Implement authentication checks
- Add RBAC permission guards
- Validate inputs
- Return proper error responses

#### Phase 7: Testing & Bug Fixes (2-3 days)
- Write unit tests for queries
- Test components with React Testing Library
- Manual testing with seed data
- Fix Radix UI issues
- Verify dev mode compatibility

**Total Time per Feature:** 12-16 days (2-3 weeks)

---

## 🛠️ DEVELOPMENT WORKFLOW

### **Daily Development Process**

```bash
# 1. Start development
npm run dev

# 2. Watch tests
npm run test:watch

# 3. Check types
npx tsc --noEmit

# 4. Lint code
npm run lint

# 5. Build verification (before committing)
npm run build
```

### **Feature Completion Checklist**

Before marking a feature complete:

- [ ] Database schema applied and tested
- [ ] Type definitions complete and exported
- [ ] Query functions tested (unit tests)
- [ ] Components built and responsive
- [ ] Pages created with RBAC guards
- [ ] API routes implemented with auth
- [ ] Dev mode compatibility verified
- [ ] Tests written and passing
- [ ] Seed data added
- [ ] Documentation updated (`CURRENT.md`, `NextSteps.md`)
- [ ] Manual testing completed
- [ ] Code review ready
- [ ] Build passing
- [ ] No console errors

---

## 📖 KEY DOCUMENTATION

### **Core Documents**
- `README.md` - Project overview and quickstart
- `CURRENT.md` - Complete project status (updated with each phase)
- `NextSteps.md` - **This file** - Deployment and integration roadmap
- `AGENT_INSTRUCTIONS.md` - AI copilot integration guide

### **Setup Guides**
- `ENV_SETUP.md` - Environment configuration
- `DATABASE_SETUP.md` - Database schema and setup
- `SEED_SETUP.md` - Test data generation
- `DEV_MODE.md` - Development mode guide

### **Testing Documentation**
- `TESTING.md` - Test suite guide
- `docs/AUTH_TESTING_GUIDE.md` - Authentication testing
- `e2e/README.md` - E2E test setup

### **Feature Documentation**
- `InventoryIntegrationSteps.md` - Inventory feature tracker
- `INVENTORY_PHASE6_COMPLETE.md` - Dashboard pages
- `INVENTORY_PHASE7_COMPLETE.md` - API routes
- `docs/SIGNUP_DATABASE_INTEGRATION.md` - Signup flow

### **Reference**
- `UI_COMPONENT_AUDIT.md` - Component inventory
- `Prototypes/README.md` - Prototype analysis
- `figmaTokens.md` - Design tokens

---

## 🔗 QUICK REFERENCE

### **Common Commands**

```bash
# Development
npm run dev              # Start dev server
npm test                 # Run unit tests
npm run test:watch      # Watch mode
npm run build           # Production build

# Database
npm run seed:dev        # Seed test data
npm run seed:clean      # Clean and reseed

# Code Quality
npm run lint            # Run ESLint
npx tsc --noEmit       # Type checking
```

### **Important Paths**

| Component | Path |
|-----------|------|
| Dashboard Pages | `/app/dashboard/[feature]/` |
| API Routes | `/app/api/[feature]/` |
| Feature Components | `/components/features/[feature]/` |
| UI Components | `/components/ui/` |
| Database Queries | `/lib/supabase/queries/` |
| Type Definitions | `/types/` |
| RBAC System | `/lib/rbac/` |
| Jurisdiction Rules | `/lib/jurisdiction/` |

### **Key Hooks**

```typescript
import { usePermissions } from '@/hooks/use-permissions'
import { useJurisdiction } from '@/hooks/use-jurisdiction'

// In components:
const { can } = usePermissions()
const { jurisdiction } = useJurisdiction()

if (!can('inventory:view')) return <div>Access Denied</div>
```

---

## 📞 SUPPORT & RESOURCES

### **Getting Help**

1. Check `CURRENT.md` for latest status
2. Review `TESTING.md` for test patterns
3. See `Prototypes/README.md` for feature analysis
4. Reference existing code in `/app/dashboard/inventory/`
5. Review `AGENT_INSTRUCTIONS.md` for AI integration patterns

### **Known Issues**

1. **9 User Query Tests Failing** (Low Priority)
   - Issue: MockQueryBuilder error handling needs refinement
   - Impact: Success cases work, error paths untested
   - Fix: Update mock to return rejected promises instead of error objects

2. **Login Page Static HTML** (Low Priority)
   - Issue: Login page doesn't use LoginForm component
   - Impact: None (dev mode bypasses auth)
   - Fix: Integrate LoginForm component when implementing real auth

---

**Last Updated:** January 2025  
**Next Review:** After Monitoring & Telemetry feature completion  
**Maintained By:** Development Team
