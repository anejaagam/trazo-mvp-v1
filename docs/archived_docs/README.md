# Archived Documentation Index

**Last Updated:** November 4, 2025  
**Organization:** Categorized by document type for easy navigation

This directory contains historical documentation, completed integration guides, troubleshooting reports, and reference materials that are no longer actively maintained but preserved for historical context and reference.

---

## 📂 Directory Structure

### **1. Setup Guides** (`1-setup-guides/`)
Configuration, testing, and initial setup documentation.

| Document | Description | Date |
|----------|-------------|------|
| `APPLY_DATABASE_SCHEMA.md` | Database schema deployment guide | - |
| `DATA_RETENTION_POLICY.md` | Data retention and cleanup policies | - |
| `INTEGRATION_TESTS_SUMMARY.md` | Integration testing results summary | - |
| `MULTI_REGION_VERIFICATION.md` | Multi-region database verification | - |
| `README.e2e.md` | End-to-end testing setup | - |
| `README.md` | General archived docs overview | - |
| `SECURITY_FIXES.md` | Security patches and fixes | - |
| `TEST_RESULTS.md` | Historical test results | - |
| `USER_AUTH_FLOW.md` | User authentication flow documentation | - |
| `USER_AUTH_QUICK_REF.md` | Quick reference for auth implementation | - |

**Use Case:** Reference when setting up new environments, understanding authentication flows, or reviewing security configurations.

---

### **2. Feature Integration** (`2-feature-integration/`)
Complete integration guides for implemented features.

| Document | Description | Status |
|----------|-------------|--------|
| `CANADIAN_INTEGRATION_SETTINGS_MIGRATION.md` | Canada region integration settings | ✅ Complete |
| `INTEGRATION_SETTINGS_DEPLOYMENT.md` | Integration settings deployment guide | ✅ Complete |
| `InventoryIntegrationSteps.md` | Complete inventory feature integration (635 lines) | ✅ Complete (Phase 8) |
| `INVENTORY_PHASE6_COMPLETE.md` | Inventory dashboard pages implementation | ✅ Complete |
| `INVENTORY_PHASE7_COMPLETE.md` | Inventory API routes implementation | ✅ Complete |
| `MONITORING_AGENT_HANDOFF.md` | Monitoring feature agent handoff notes | 🔄 Phase 10 (86%) |
| `MONITORING_DATABASE_ANALYSIS.md` | Monitoring database schema analysis | ✅ Complete |
| `MONITORING_INTEGRATION_SUMMARY.md` | Monitoring feature integration summary | ✅ Complete |
| `MONITORING_QUICK_REFERENCE.md` | Quick reference for monitoring features | ✅ Complete |
| `MONITORING_TELEMETRY_INTEGRATION_PLAN.md` | Telemetry integration planning doc | ✅ Complete |
| `SIGNUP_DATABASE_INTEGRATION.md` | Signup flow database integration | ✅ Complete (Phase 1.5) |
| `TAGOIO_INTEGRATION_PHASE6_COMPLETE.md` | TagoIO API integration (1,743 lines) | ✅ Complete (Oct 29, 2025) |

**Use Case:** Reference when implementing similar features, understanding integration patterns, or troubleshooting existing features.

---

### **3. Troubleshooting** (`3-troubleshooting/`)
Bug fixes, patches, and issue resolutions.

| Document | Issue Type | Fix Date |
|----------|------------|----------|
| `AUTH_FLOW_FIX.md` | Authentication flow issues | - |
| `DEV_MODE_RLS_FIX.md` | Dev mode RLS bypass issues | - |
| `EMAIL_VERIFICATION_FIX.md` | Email verification flow | - |
| `EXPIRING_LOTS_FIX.md` | Inventory lot expiration logic | - |
| `INVENTORY_CREATE_TROUBLESHOOTING.md` | Inventory item creation issues | - |
| `INVENTORY_FIX_APPLIED.md` | General inventory fixes | - |
| `INVENTORY_TRANSFER_FIX.md` | Location transfer stock preservation | Oct 29, 2025 |
| `LOGIN_REDIRECT_LOOP_FIX.md` | Login redirect loop resolution | - |
| `STOCK_STATUS_FIX.md` | Stock status calculation fixes | - |
| `THEME_SWITCHER_FIX.md` | Theme switcher component fix | - |
| `UUID_FIX_APPLIED.md` | UUID generation and validation | - |

**Use Case:** Reference when encountering similar bugs or understanding past issue resolutions.

---

### **4. Cleanup Reports** (`4-cleanup-reports/`)
Repository organization, code cleanup, and analysis reports.

| Document | Phase | Completion Date |
|----------|-------|----------------|
| `CLEANUP_REPORT.md` | Phase 1: Documentation cleanup | Nov 3, 2025 |
| `CLEANUP_TODO.md` | Full cleanup plan (Phases 1-4) | - |
| `COMPONENT_IMPORT_ANALYSIS.md` | Phase 2.2: UI component analysis (400+ lines) | Nov 4, 2025 |
| `component-usage-analysis.csv` | Component usage raw data | Nov 4, 2025 |
| `DOCUMENTATION_CLEANUP.md` | Documentation organization summary | - |
| `DOCUMENTATION_UPDATE_SUMMARY.md` | Documentation update tracking | - |
| `PHASE2_3_MOCK_DATA_ANALYSIS.md` | Phase 2.3: Mock/seed data analysis (300+ lines) | Nov 4, 2025 |
| `PHASE2_PROTOTYPE_ARCHIVAL_COMPLETE.md` | Phase 2.1: Prototype archival report | Nov 4, 2025 |
| `PROTOTYPE_ARCHIVE_ANALYSIS.md` | Prototype archival decision matrix | Nov 4, 2025 |
| `Prototypes_README.md` | Prototype organization guide | - |
| `plan.plan.md` | Planning and roadmap notes | - |

**Use Case:** Reference when performing future cleanup tasks or understanding repository organization decisions.

**Key Reports:**
- **Phase 2.1:** Archived 3 completed prototypes (23% reduction)
- **Phase 2.2:** Analyzed 39 UI components (0 archival needed)
- **Phase 2.3:** Verified mock/seed data centralization (0 consolidation needed)

---

### **5. Deployment** (`5-deployment/`)
Production deployment, infrastructure, and integration documentation.

| Document | Component | Purpose |
|----------|-----------|---------|
| `LOCAL_POLLING_GUIDE.md` | TagoIO polling | Local development/testing guide |
| `MULTI_TENANT_TOKEN_MANAGEMENT.md` | TagoIO tokens | Multi-tenant token storage patterns |
| `README_POLLING.md` | Polling architecture | Polling system overview | - |
| `TAGOIO_API_ANALYSIS.md` | TagoIO API | API structure and endpoints documentation |
| `VERCEL_BUILD_COMPLETE.md` | Vercel deployment | Build completion report |
| `VERCEL_QUICK_REFERENCE.md` | Vercel commands | Quick reference for deployment tasks |

**Use Case:** Reference when deploying to production, configuring cron jobs, or troubleshooting Vercel deployments.

**Key Components:**
- **Vercel Cron:** Automated telemetry polling (60s intervals)
- **TagoIO Integration:** Device data polling and transformation
- **Multi-region Support:** US/Canada database routing

---

### **6. Design Reference** (`6-design-reference/`)
Design tokens, UI components, and visual reference materials.

| Document | Type | Size |
|----------|------|------|
| `figmaTokens.md` | Design tokens | 124,000+ lines |
| `UI_COMPONENT_AUDIT.md` | Component inventory | Complete shadcn/ui audit |

**Use Case:** Reference when building new UI components, maintaining design consistency, or understanding the design system.

**Key Resources:**
- **47+ shadcn/ui components** documented
- **Design tokens:** Colors, spacing, typography, shadows
- **Component usage patterns** and import analysis

---

## 🔍 Quick Navigation

### By Feature:
- **Inventory:** See `2-feature-integration/Inventory*.md` and `3-troubleshooting/INVENTORY_*.md`
- **Monitoring:** See `2-feature-integration/MONITORING_*.md` and `5-deployment/TAGOIO_*.md`
- **Authentication:** See `1-setup-guides/USER_AUTH_*.md` and `3-troubleshooting/AUTH_*.md`
- **Cleanup Progress:** See `4-cleanup-reports/PHASE2_*.md`

### By Date:
- **October 29, 2025:** TagoIO Integration Phase 6 complete
- **November 3, 2025:** Phase 1 Documentation cleanup complete
- **November 4, 2025:** Phase 2.1-2.3 cleanup complete (3 phases)

### By Status:
- **✅ Complete Features:** Inventory (Phase 8), Signup (Phase 1.5), Admin (Phases 3-6)
- **🔄 In Progress:** Monitoring (Phase 10 - 86% complete)
- **⏳ Planned:** Environmental Controls, Batch Management, Tasks, Compliance

---

## 📊 Archive Statistics

- **Total Documents:** 52 files
- **Categorized:** 6 directories
- **Total Size:** ~150+ MB (mostly figmaTokens.md)
- **Coverage:** 2024-2025 development history

---

## 🎯 Best Practices

1. **Don't Delete:** These documents provide historical context and troubleshooting reference
2. **Don't Update:** For active docs, see `/docs/` root directory (README, CURRENT, NextSteps)
3. **Do Reference:** Use when encountering similar issues or implementing similar features
4. **Do Organize:** Keep this structure when archiving new documents

---

## 📌 Active Documentation

For current, actively maintained documentation, see:
- `/README.md` - Project overview
- `/CURRENT.md` - Current feature status
- `/NextSteps.md` - Integration roadmap
- `/.github/copilot-instructions.md` - AI development patterns
- `/docs/` - Active setup and configuration guides

---

**Archive Maintained By:** Development Team  
**Last Reorganization:** November 4, 2025 (Phase 2.3.5)  
**Next Review:** After Phase 11 (Environmental Controls) completion
