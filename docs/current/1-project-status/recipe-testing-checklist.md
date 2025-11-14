# Recipe Management - Testing Checklist

**Last Updated:** November 13, 2025  
**Status:** Manual Testing Guide  
**Purpose:** Comprehensive test scenarios for Recipe Management feature

---

## Test Environment Setup

### Prerequisites
- ✅ Dev mode enabled (`NEXT_PUBLIC_DEV_MODE=true`)
- ✅ Database migrations applied (US & Canada)
- ✅ User with appropriate permissions (Admin or Facility Manager)
- ✅ At least one site configured
- ✅ Test pods available in monitoring system

### Test Accounts Needed
1. **Cannabis Account** (Oregon/Maryland)
   - Jurisdiction: Metrc Oregon or Metrc Maryland
   - Plant type: Cannabis
   - Has cultivation sites

2. **Produce Account** (PrimusGFS)
   - Jurisdiction: PrimusGFS
   - Plant type: Produce
   - Has cultivation sites
   - ⚠️ **NOT YET TESTED**

---

## 1. Recipe Library Tests

### 1.1 Navigation & Access
- [ ] Navigate to `/dashboard/recipes` directly (no sidebar link yet)
- [ ] Page loads without errors
- [ ] RBAC check: User without `control:view` permission sees access denied
- [ ] RBAC check: User with `control:view` sees recipe library

### 1.2 Recipe List Display
- [ ] Grid layout renders (3 columns on desktop, 2 on tablet, 1 on mobile)
- [ ] Recipe cards show: name, plant type, stages count, status badge
- [ ] Status badges have correct colors:
  - Draft: gray
  - Published: blue
  - Applied: green
  - Deprecated: yellow
- [ ] Empty state shows when no recipes exist
- [ ] Loading state shows spinner while fetching

### 1.3 Search Functionality
- [ ] Search by recipe name (case-insensitive)
- [ ] Search by description content
- [ ] Search by tags
- [ ] Search updates results in real-time
- [ ] Clear search returns all results

### 1.4 Status Filters
- [ ] "All Statuses" shows all recipes
- [ ] "Draft" filter shows only draft recipes
- [ ] "Published" filter shows only published recipes
- [ ] "Applied" filter shows only applied recipes
- [ ] "Deprecated" filter shows only deprecated recipes
- [ ] Filter combines with search correctly

### 1.5 Plant Type Filters
- [ ] "All Types" shows all recipes
- [ ] "Cannabis" filter shows only cannabis recipes
- [ ] "Produce" filter shows only produce recipes
- [ ] Filter combines with status filter and search
- [ ] ⚠️ **Produce plant type not yet tested in production workflow**

---

## 2. Recipe Detail View Tests

### 2.1 Recipe Header
- [ ] Recipe name displays correctly
- [ ] Status badge shows current status
- [ ] Plant type badge(s) display
- [ ] Jurisdiction tags show (if applicable)
- [ ] Version number displays (e.g., "Version 1.2")
- [ ] Created by name resolves from user ID
- [ ] Created date shows in local timezone
- [ ] Description renders (if present)
- [ ] Notes render (if present)

### 2.2 Action Buttons
- [ ] "Back to Recipes" returns to library
- [ ] "Edit Recipe" visible only with `control:recipe_edit` permission
- [ ] "Clone Recipe" visible with `control:recipe_create` permission
- [ ] "Publish Recipe" visible for draft recipes
- [ ] "Assign to Pod/Batch" visible for published recipes
- [ ] "Deprecate Recipe" visible for published/applied recipes
- [ ] "Restore Recipe" visible for deprecated recipes

### 2.3 Stage Display
- [ ] All stages render in order (1, 2, 3, etc.)
- [ ] Stage type shows correctly (germination, seedling, vegetative, flowering, curing)
- [ ] Duration shows in days
- [ ] Description renders (if present)
- [ ] Collapsible stages work (expand/collapse)

### 2.4 Environmental Setpoints
- [ ] Temperature setpoints show (min/max or day/night)
- [ ] Humidity setpoints show
- [ ] VPD setpoints show (if present)
- [ ] CO2 setpoints show (if present)
- [ ] Light intensity setpoints show
- [ ] Photoperiod shows (hours of light)
- [ ] Light schedule displays (e.g., "06:00 - 22:00 (16 hours)")
- [ ] Units display correctly (°C, %, kPa, ppm)

### 2.5 Nutrient Formula
- [ ] EC target displays (if present)
- [ ] pH target displays (if present)
- [ ] NPK ratio displays (if present)
- [ ] Formula notes display (if present)

### 2.6 Version History
- [ ] Version history card shows if multiple versions exist
- [ ] All versions listed in reverse chronological order
- [ ] Current version highlighted with badge
- [ ] Version creator names resolve
- [ ] Version dates show in local timezone
- [ ] Version notes display (if present)

---

## 3. Recipe Creation Tests (RecipeAuthor)

### 3.1 Basic Info
- [ ] Navigate to `/dashboard/recipes/new`
- [ ] RBAC check: Requires `control:recipe_create` permission
- [ ] Recipe name field required
- [ ] Description field (optional)
- [ ] Notes field (optional)
- [ ] Plant type multi-select works (cannabis, produce, other)
- [ ] Jurisdiction selector works (if applicable)

### 3.2 Stage Management
- [ ] "Add Stage" button creates new stage
- [ ] Stage can be reordered (drag or buttons)
- [ ] Stage type dropdown works (5 types)
- [ ] Duration field accepts days (number)
- [ ] Stage description (optional)
- [ ] "Remove Stage" deletes stage
- [ ] At least one stage required

### 3.3 Setpoint Configuration
- [ ] Temperature: Min/max or day/night entry
- [ ] Humidity: Min/max or day/night entry
- [ ] VPD: Min/max entry (optional)
- [ ] CO2: Min/max entry (optional)
- [ ] Light intensity: Min/max entry
- [ ] Photoperiod: Hours slider or input
- [ ] Light schedule calculated from photoperiod
- [ ] All numeric fields validate (no negative values)

### 3.4 Nutrient Formula
- [ ] EC target entry (optional)
- [ ] pH target entry (optional)
- [ ] NPK ratio entry (optional)
- [ ] Formula notes (optional)

### 3.5 Validation & Save
- [ ] Form validates required fields on submit
- [ ] Shows validation errors inline
- [ ] "Save as Draft" creates recipe with draft status
- [ ] Success toast on save
- [ ] Redirects to recipe detail page after save
- [ ] Database record created correctly

---

## 4. Recipe Edit Tests

### 4.1 Load Existing Recipe
- [ ] Navigate to `/dashboard/recipes/[id]/edit`
- [ ] RBAC check: Requires `control:recipe_edit` permission
- [ ] All recipe data pre-fills correctly
- [ ] Stages load in correct order
- [ ] Setpoints load with correct values
- [ ] Nutrient formulas load

### 4.2 Modify Recipe
- [ ] Change recipe name
- [ ] Update description/notes
- [ ] Add/remove plant types
- [ ] Add new stage
- [ ] Remove existing stage
- [ ] Modify setpoints in stage
- [ ] Update nutrient formula

### 4.3 Version Control
- [ ] Editing creates new version
- [ ] Version notes field available
- [ ] Original version preserved (immutable)
- [ ] Version number increments (1.0 → 1.1)
- [ ] History shows new version after save

---

## 5. Recipe Publishing Tests

### 5.1 Publish Flow
- [ ] "Publish Recipe" button visible on draft recipe
- [ ] Confirmation dialog appears (optional, depends on implementation)
- [ ] Recipe status changes to "published"
- [ ] Success toast shows
- [ ] Recipe now available for assignment
- [ ] Cannot edit published recipe without creating new version

### 5.2 Post-Publish State
- [ ] "Publish" button no longer visible
- [ ] "Assign to Pod/Batch" button now visible
- [ ] Recipe shows in "Published" filter
- [ ] Recipe visible to other users in organization

---

## 6. Recipe Assignment Tests

### 6.1 Assign to Pod
- [ ] Click "Assign to Pod/Batch"
- [ ] Dialog shows list of available pods
- [ ] Filter/search pods by name or location
- [ ] Select pod and confirm
- [ ] Creates `recipe_activation` record
- [ ] Recipe status changes to "applied"
- [ ] Success toast shows
- [ ] Pod monitoring page shows active recipe

### 6.2 Assign to Batch
- [ ] Select batch from list
- [ ] Confirm assignment
- [ ] Creates activation for all pods in batch
- [ ] All pods show recipe in monitoring

### 6.3 Active Recipe Display
- [ ] Navigate to pod monitoring page
- [ ] "Active Recipe" card displays
- [ ] Shows recipe name and version
- [ ] Shows current stage
- [ ] Shows target setpoints
- [ ] Compares actual vs. target readings
- [ ] Color indicators for in-range/out-of-range

---

## 7. Recipe Deprecation Tests

### 7.1 Deprecate Published Recipe
- [ ] Click "Deprecate Recipe"
- [ ] No confirmation needed (no active applications)
- [ ] Status changes to "deprecated"
- [ ] Success toast shows
- [ ] Warning banner appears on recipe detail
- [ ] Cannot assign deprecated recipe to new pods

### 7.2 Deprecate Applied Recipe
- [ ] Click "Deprecate Recipe" on applied recipe
- [ ] Confirmation dialog shows with active count
- [ ] Dialog warns that existing activations continue
- [ ] Confirm deprecation
- [ ] Status changes to "deprecated"
- [ ] Existing pod activations still work
- [ ] Success toast shows count of active applications

### 7.3 Post-Deprecation State
- [ ] Deprecated badge shows
- [ ] Warning banner explains deprecation
- [ ] "Restore Recipe" button visible
- [ ] Cannot assign to new pods
- [ ] Existing activations unaffected
- [ ] Shows in "Deprecated" filter

---

## 8. Recipe Restoration Tests

### 8.1 Restore Deprecated Recipe
- [ ] Click "Restore Recipe" on deprecated recipe
- [ ] Status detection works:
  - Has active applications → "applied"
  - No active applications → "published"
- [ ] Success toast shows
- [ ] Warning banner removed
- [ ] Recipe available for new assignments again

---

## 9. Recipe Cloning Tests

### 9.1 Clone Recipe
- [ ] Click "Clone Recipe"
- [ ] New recipe created with "-copy" suffix
- [ ] All stages duplicated
- [ ] All setpoints duplicated
- [ ] All nutrient formulas duplicated
- [ ] Clone has "draft" status
- [ ] Clone has version 1.0
- [ ] Clone is independent (editing doesn't affect original)
- [ ] Success toast shows
- [ ] Redirects to cloned recipe detail

---

## 10. Timezone & Localization Tests

### 10.1 Date Display
- [ ] Created dates show in local timezone (not UTC)
- [ ] Time format follows locale (12h vs 24h)
- [ ] Dates are readable (e.g., "Nov 13, 2025 2:45 PM")

### 10.2 User Name Resolution
- [ ] Created by names resolve from user IDs
- [ ] Shows "Loading..." while fetching
- [ ] Handles deleted users gracefully
- [ ] Shows user name, not UUID

---

## 11. RBAC Permission Tests

### 11.1 View Permissions
- [ ] User without `control:view` → Denied access to `/dashboard/recipes`
- [ ] User with `control:view` → Can view recipes

### 11.2 Create Permissions
- [ ] User without `control:recipe_create` → No "Create Recipe" button
- [ ] User without `control:recipe_create` → Denied access to `/dashboard/recipes/new`
- [ ] User with `control:recipe_create` → Can create recipes

### 11.3 Edit Permissions
- [ ] User without `control:recipe_edit` → No "Edit" button
- [ ] User without `control:recipe_edit` → Denied access to edit page
- [ ] User with `control:recipe_edit` → Can edit recipes

### 11.4 Apply Permissions
- [ ] User without `control:recipe_apply` → No "Assign" button
- [ ] User with `control:recipe_apply` → Can assign recipes

### 11.5 Delete Permissions
- [ ] User without `control:recipe_delete` → No delete functionality
- [ ] User with `control:recipe_delete` → Can deprecate recipes
- [ ] Note: True deletion not exposed in UI (soft delete via deprecation)

---

## 12. Database & RLS Tests

### 12.1 Organization Isolation
- [ ] User can only see recipes from their organization
- [ ] User cannot access recipes from other organizations (direct ID access)
- [ ] Queries filter by `organization_id` automatically

### 12.2 Data Integrity
- [ ] Creating recipe creates corresponding version
- [ ] Editing recipe creates new version (old version preserved)
- [ ] Deleting recipe soft deletes (sets `is_active = false`)
- [ ] Foreign keys prevent orphaned records
- [ ] Cascading deletes work correctly

### 12.3 RLS Policies
- [ ] All recipe tables have RLS enabled
- [ ] Users can only INSERT/UPDATE/DELETE their org's data
- [ ] Users can only SELECT their org's data
- [ ] Service role bypasses RLS (for admin operations)

---

## 13. Multi-Region Tests

### 13.1 US Region
- [ ] Recipes created in US Supabase persist correctly
- [ ] All queries work against US database
- [ ] RLS enforced in US region

### 13.2 Canada Region
- [ ] Recipes created in Canada Supabase persist correctly
- [ ] Schema matches US region (migrations applied)
- [ ] RLS enforced in Canada region

### 13.3 Region Switching
- [ ] User switches jurisdiction (e.g., Oregon → Canada)
- [ ] Correct Supabase client used
- [ ] Data remains isolated by region

---

## 14. Jurisdiction Compliance Tests

### 14.1 Metrc Oregon
- [ ] Cannabis recipes show "Metrc Oregon" tag
- [ ] Appropriate compliance fields available
- [ ] Recipe adheres to Oregon cultivation rules

### 14.2 Metrc Maryland
- [ ] Cannabis recipes show "Metrc Maryland" tag
- [ ] Maryland-specific requirements met

### 14.3 Canada CTLS
- [ ] Cannabis recipes show "Canada" tag
- [ ] Canadian compliance fields available

### 14.4 PrimusGFS
- [ ] Produce recipes show "PrimusGFS" tag
- [ ] Produce-specific requirements met
- [ ] ⚠️ **NOT YET TESTED WITH PRODUCE ACCOUNT**

---

## 15. Performance Tests

### 15.1 Load Times
- [ ] Recipe library loads in < 2 seconds
- [ ] Recipe detail page loads in < 1 second
- [ ] Search/filter results update in < 500ms
- [ ] Recipe save completes in < 2 seconds

### 15.2 Large Data Sets
- [ ] Library handles 100+ recipes gracefully
- [ ] Pagination works (if implemented)
- [ ] Search performs well with many recipes
- [ ] Version history with 10+ versions renders correctly

---

## 16. UI/UX Tests

### 16.1 Responsive Design
- [ ] Desktop (1920x1080): 3-column grid
- [ ] Tablet (768x1024): 2-column grid
- [ ] Mobile (375x667): 1-column grid
- [ ] All buttons and forms usable on mobile
- [ ] No horizontal scrolling

### 16.2 Dark Mode
- [ ] Recipe library looks correct in dark mode
- [ ] Recipe detail page looks correct in dark mode
- [ ] Forms readable in dark mode
- [ ] All badges/cards have proper contrast

### 16.3 Loading States
- [ ] Spinners show while loading
- [ ] Skeleton loaders for recipe cards (if implemented)
- [ ] No flash of unstyled content
- [ ] Graceful error messages

### 16.4 Error Handling
- [ ] Network errors show user-friendly message
- [ ] Database errors show user-friendly message
- [ ] Validation errors show inline
- [ ] Toast notifications for success/error

---

## 17. Integration Tests

### 17.1 Monitoring Integration
- [ ] Active recipe displays on pod monitoring page
- [ ] Target setpoints show correctly
- [ ] Actual vs. target comparison works
- [ ] Recipe stage progress displays
- [ ] Alarms trigger based on recipe thresholds

### 17.2 Batch Integration
- [ ] Recipes can be assigned to batches (once Batch Management built)
- [ ] Batch-level recipe activations work
- [ ] All pods in batch receive recipe

---

## 18. Edge Cases

### 18.1 Concurrent Editing
- [ ] Two users editing same recipe simultaneously
- [ ] Both create new versions (no overwrite)
- [ ] Version numbers increment correctly

### 18.2 Partial Data
- [ ] Recipe with no description renders correctly
- [ ] Recipe with no notes renders correctly
- [ ] Stage with no nutrient formula renders correctly
- [ ] Recipe with only 1 version hides version history

### 18.3 Invalid Data
- [ ] Negative duration rejected
- [ ] Invalid temperature range rejected
- [ ] Min > Max validation works
- [ ] Required fields enforced

### 18.4 Deprecated Applied Recipe
- [ ] Recipe with 5 active pods
- [ ] Deprecate recipe → existing pods continue
- [ ] Cannot assign to new pods
- [ ] Restore recipe → can assign again

---

## 19. Produce Plant Type Tests ⚠️

**Status:** NOT YET TESTED - HIGH PRIORITY  
**Blocker:** 🚨 Main site/room creation bug in monitoring system

### Known Bug Blocking Produce Testing
- **Issue:** Cannot add rooms to main site in monitoring system
- **Impact:** Cannot create produce test environment with pods
- **Status:** Needs investigation and fix
- **Priority:** High - blocking produce recipe workflow validation

### 19.1 Produce Account Setup (BLOCKED)
- [ ] Create/use test account with PrimusGFS jurisdiction
- [ ] Configure produce cultivation site
- [ ] **BLOCKED:** Add rooms to site (room creation not working)
- [ ] Set plant type preference to "produce"

### 19.2 Produce Recipe Creation
- [ ] Create recipe with plant type "produce"
- [ ] Appropriate stage types available (germination, vegetative, harvest)
- [ ] Setpoints appropriate for produce (not cannabis-specific)
- [ ] PrimusGFS compliance fields available

### 19.3 Produce Recipe Workflow
- [ ] Save produce recipe as draft
- [ ] Publish produce recipe
- [ ] Assign produce recipe to produce pods
- [ ] Monitor produce pod with active recipe
- [ ] Setpoints display correctly for produce

### 19.4 Filter/Search
- [ ] "Produce" filter shows only produce recipes
- [ ] Search works for produce recipes
- [ ] Produce recipes visible in "All Types"

---

## 20. Build & Deploy Tests

### 20.1 TypeScript Build
- [x] `npm run build` passes with 0 errors ✅ (Nov 13, 2025)
- [x] 49 pages generated successfully ✅
- [x] All recipe pages included in build ✅
- [x] No ESLint errors ✅

### 20.2 Production Bundle
- [ ] Recipe pages load in production build
- [ ] No console errors in production
- [ ] Assets load correctly (images, fonts)
- [ ] API calls work in production

### 20.3 Vercel Deployment
- [ ] Deploy to staging environment
- [ ] Test recipe CRUD in staging
- [ ] Test US region connectivity
- [ ] Test Canada region connectivity
- [ ] Test RBAC in production environment

---

## Test Priority Matrix

### P0 - Critical (Must Test Before Production)
1. Recipe CRUD (create, read, update, delete)
2. Recipe publishing workflow
3. Recipe assignment to pods
4. RBAC permission checks
5. Database RLS policies
6. Build passes without errors ✅

### P1 - High Priority (Test ASAP)
1. **Produce plant type full workflow** ⚠️
2. Recipe deprecation/restoration
3. Multi-region functionality
4. Monitoring integration
5. Timezone display

### P2 - Medium Priority
1. Recipe cloning
2. Version history display
3. Search and filters
4. Dark mode
5. Responsive design

### P3 - Low Priority (Nice to Have)
1. Performance with large datasets
2. Concurrent editing
3. Edge cases
4. Version comparison (not yet implemented)

---

## Known Issues

1. **🚨 Main Site/Room Bug** - Cannot add rooms in monitoring system (BLOCKING PRODUCE TESTING)
   - Users see main site but "Add Room" functionality not working
   - Prevents creation of produce test environment
   - High priority fix needed
2. **No Sidebar Navigation** - Must access via direct URL `/dashboard/recipes`
3. **No Automated Tests** - All testing currently manual
4. **Produce Not Tested** - No produce account workflow verification yet (blocked by issue #1)
5. **Mock TagoIO** - Device control not real (console.log only)

---

**Next Steps:**
1. Execute P0 tests immediately
2. Set up produce test account for P1 testing
3. Begin automated test suite development
4. Document any issues found during testing

---

**Test Execution Log:** (Add dates as tests are completed)
- [ ] Cannabis recipe workflow - Tested on: ___________
- [ ] Produce recipe workflow - Tested on: ___________ ⚠️
- [ ] Multi-region - Tested on: ___________
- [ ] RBAC enforcement - Tested on: ___________
- [ ] Production deployment - Tested on: ___________
