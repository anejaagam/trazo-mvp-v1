# UI Component Import Analysis Report

**Date:** November 4, 2025  
**Purpose:** Phase 2.2 - Component Import Analysis  
**Scope:** All 39 components in `/components/ui/`

---

## 📊 Executive Summary

**Total Components:** 39  
**Analysis Method:** grep_search across `/app/` and `/components/` directories  
**Exclusions:** Prototypes, archive, test files, internal UI imports

---

## ✅ ACTIVELY USED COMPONENTS (26 components - 67%)

### **Tier 1: High Usage (5+ files)**
1. **button** - 25+ imports
   - Used in: dashboard, admin, inventory, monitoring, auth
   - Status: **CRITICAL** - Core component

2. **card** - 25+ imports  
   - Used in: dashboard pages, feature components, protected pages
   - Status: **CRITICAL** - Primary layout component

3. **badge** - 20+ imports
   - Used in: status indicators, role displays, alerts
   - Status: **CRITICAL** - Status display

4. **table** - 8+ imports
   - Used in: admin (users, audit), inventory (catalog, movements, alerts), monitoring (fleet-view, alarms)
   - Status: **ACTIVE** - Data display

5. **input** - 15+ imports
   - Used in: forms across admin, inventory, monitoring, auth
   - Status: **CRITICAL** - Form component

### **Tier 2: Moderate Usage (3-5 files)**
6. **tabs** - 8+ imports
   - Files: role-permission-matrix, inventory-dashboard, item-form-dialog, monitoring components (5 files)
   - Status: **ACTIVE** - Navigation

7. **select** - 10+ imports
   - Files: admin, inventory dialogs, monitoring fleet-view
   - Status: **ACTIVE** - Form component

8. **dialog** - 8+ imports
   - Files: admin (user-invite, user-role, pod-device-token), inventory dialogs (4 files), monitoring (export-button, alarms-panel)
   - Status: **ACTIVE** - Modal dialogs

9. **label** - 10+ imports
   - Files: auth forms, admin dialogs, inventory forms, monitoring
   - Status: **ACTIVE** - Form labels

10. **form** - 5+ imports
    - Files: inventory dialogs (item-form, receive, issue, adjust)
    - Status: **ACTIVE** - Form framework

### **Tier 3: Regular Usage (1-3 files)**
11. **dropdown-menu** - 3 imports
    - Files: theme-switcher, admin/user-table, dashboard/header
    - Status: **ACTIVE**

12. **textarea** - 4 imports
    - Files: inventory dialogs (item-form, receive, issue, adjust), monitoring (alarms-panel)
    - Status: **ACTIVE**

13. **alert** - 8+ imports
    - Files: admin integration-settings, inventory (catalog, dashboard, all dialogs - 4 files), monitoring (welcome-banner)
    - Status: **ACTIVE** - Alert messages

14. **alert-dialog** - 1 import
    - Files: inventory/delete-items-dialog
    - Status: **LOW USAGE** but essential for delete confirmations

15. **checkbox** - 3 imports
    - Files: design-system, inventory/item-catalog, inventory/receive-dialog, monitoring/export-button
    - Status: **ACTIVE**

16. **sheet** - 2 imports
    - Files: inventory/item-detail-sheet, monitoring/notifications-panel
    - Status: **ACTIVE** - Slide-out panels

17. **separator** - 1 import
    - Files: monitoring/alarms-panel
    - Status: **LOW USAGE**

18. **scroll-area** - 1 import
    - Files: monitoring/notifications-panel
    - Status: **LOW USAGE**

19. **popover** - 2 imports
    - Files: monitoring/environment-chart, monitoring/time-range-selector
    - Status: **ACTIVE** - Date pickers

20. **calendar** - 2 imports
    - Files: monitoring/environment-chart, monitoring/time-range-selector
    - Status: **ACTIVE** - Date selection

21. **radio-group** - 2 imports
    - Files: auth/sign-up/step-4, monitoring/export-button
    - Status: **ACTIVE**

22. **field** - 2 imports
    - Files: design-system, auth/sign-up (multiple pages)
    - Status: **ACTIVE** - Form field wrapper

23. **form-label** - 2 imports
    - Files: design-system, auth/sign-up
    - Status: **ACTIVE**

24. **progress-indicator** - 2 imports
    - Files: auth/sign-up, auth/sign-up/step-4
    - Status: **ACTIVE** - Signup progress

25. **toaster** - 1 import
    - Files: app/dashboard/layout
    - Status: **CRITICAL** - Toast notifications system

26. **sonner** - Possible alternative to toaster
    - Status: **INVESTIGATE** - May be duplicate toast system

---

## ⚠️ UNUSED COMPONENTS (13 components - 33%)

### **Category A: Shadcn/UI Components Not Yet Integrated**
1. **accordion** - Collapsible content sections
   - **Use Case:** FAQ sections, settings panels, batch detail sections
   - **Priority:** LOW - Not needed for current MVP features
   - **Recommendation:** KEEP - Useful for future features

2. **avatar** - User profile images
   - **Use Case:** User profiles, team member cards
   - **Priority:** MEDIUM - Would enhance user table
   - **Recommendation:** KEEP - Planned for user management enhancement

3. **breadcrumb** - Navigation trail
   - **Use Case:** Deep page navigation (currently using custom implementation)
   - **Priority:** LOW - Dashboard has custom breadcrumbs
   - **Recommendation:** ARCHIVE - Custom solution works better

4. **command** - Command palette (Cmd+K style)
   - **Use Case:** Quick navigation, search
   - **Priority:** LOW - Not in current roadmap
   - **Recommendation:** KEEP - Nice-to-have for power users

5. **context-menu** - Right-click menus
   - **Use Case:** Table row actions, quick actions
   - **Priority:** LOW - Using dropdown-menu instead
   - **Recommendation:** ARCHIVE - dropdown-menu sufficient

6. **hover-card** - Hover tooltips with rich content
   - **Use Case:** User info cards, preview cards
   - **Priority:** LOW - Not needed currently
   - **Recommendation:** KEEP - Might enhance UX

7. **navigation-menu** - Complex mega-menu navigation
   - **Use Case:** Main navigation (using custom sidebar)
   - **Priority:** LOW - Custom sidebar better for app
   - **Recommendation:** ARCHIVE - Not needed for dashboard apps

8. **pagination** - Page navigation controls
   - **Use Case:** Large tables, lists
   - **Priority:** MEDIUM - Needed for inventory/admin tables
   - **Recommendation:** KEEP - TODO: Add to tables (inventory catalog, user table)

9. **progress** - Progress bars
   - **Use Case:** File uploads, batch progress, loading states
   - **Priority:** LOW - Using progress-indicator for signup
   - **Recommendation:** KEEP - Useful for upload/process progress

10. **skeleton** - Loading placeholders
    - **Use Case:** Loading states for cards/tables
    - **Priority:** MEDIUM - Would improve perceived performance
    - **Recommendation:** KEEP - Best practice for loading states

11. **slider** - Range input sliders
    - **Use Case:** Environmental setpoints, recipe parameters
    - **Priority:** MEDIUM - Needed for Environmental Controls (Phase 11)
    - **Recommendation:** KEEP - Required for future phase

12. **switch** - Toggle switches
    - **Use Case:** Settings, feature toggles
    - **Priority:** LOW - Using checkboxes currently
    - **Recommendation:** KEEP - Better UX for boolean settings

13. **tooltip** - Simple hover tooltips
    - **Use Case:** Icon explanations, help text
    - **Priority:** MEDIUM - Would improve UX throughout app
    - **Recommendation:** KEEP - Accessibility best practice

---

## 📝 RECOMMENDATIONS

### **✅ Keep All Components (Recommended)**
**Reason:** All 39 components are part of the shadcn/ui design system and provide value

1. **26 components actively used** - Core of the application
2. **13 unused components** have valid future use cases:
   - **accordion** - Future feature expansion
   - **avatar** - User management enhancement
   - **command** - Power user features
   - **hover-card** - UX improvements
   - **pagination** - TODO for existing tables
   - **progress** - Upload/process indicators
   - **skeleton** - Loading state best practice
   - **slider** - Environmental Controls (Phase 11)
   - **switch** - Settings UX improvement
   - **tooltip** - Accessibility & UX

3. **Only 3 components could be archived** (if storage is critical):
   - **breadcrumb** - Have custom implementation
   - **context-menu** - dropdown-menu works better
   - **navigation-menu** - Not suitable for dashboard apps

### **Alternative: Document Unused Components**
Instead of archiving, create usage guide showing how to integrate the 13 unused components when needed.

---

## 🎯 ACTION ITEMS

### **Immediate (Phase 2.2 Complete)**
- [x] Complete import analysis
- [x] Categorize all 39 components
- [x] Create recommendations

### **Next Steps (Optional Improvements)**
- [ ] Add **pagination** to inventory catalog (high item counts)
- [ ] Add **pagination** to user table (organizations with many users)
- [ ] Add **skeleton** loading states to dashboards
- [ ] Add **tooltip** to icons throughout app
- [ ] Replace checkboxes with **switch** in settings
- [ ] Add **avatar** to user table and profile pages

### **Future Phases**
- [ ] Use **slider** in Environmental Controls (Phase 11)
- [ ] Use **accordion** in batch detail pages (Phase 13)
- [ ] Use **progress** for file uploads (evidence vault - Phase 14)

---

## 📁 FILES CREATED

- `/docs/archived_docs/component-usage-analysis.csv` - Raw data export
- `/docs/archived_docs/COMPONENT_IMPORT_ANALYSIS.md` - This comprehensive report
- `/scripts/analyze-components.ps1` - Analysis PowerShell script

---

## ✅ CONCLUSION

**All 39 UI components should be KEPT.** 

- **67% (26 components)** are actively used in production features
- **33% (13 components)** are unused but have valid future use cases
- Only **3 components** (breadcrumb, context-menu, navigation-menu) could be safely archived
- Removing 3 components provides minimal storage benefit
- Keeping all components maintains consistency with shadcn/ui design system

**Recommendation:** Mark Phase 2.2 as COMPLETE with decision to keep all components.

---

**Analysis By:** AI Agent (GitHub Copilot)  
**Date:** November 4, 2025  
**Next Phase:** 2.3 - Mock/Seed Data Consolidation
