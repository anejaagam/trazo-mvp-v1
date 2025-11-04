# TRAZO Documentation

**Welcome to the TRAZO MVP documentation!** This directory contains comprehensive guides, references, and archived documentation for the project.

---

## 📋 **Quick Navigation**

### **Essential Documentation (Start Here)**
| Document | Description | Location |
|----------|-------------|----------|
| **README** | Project overview & getting started | `/README.md` |
| **Current Status** | Complete feature status (52KB) | `/docs/CURRENT.md` |
| **Roadmap** | Integration roadmap & deployment | `/docs/ROADMAP.md` |
| **API Reference** | REST API documentation | `/docs/API.md` |
| **Contributing** | Development guidelines | `/CONTRIBUTING.md` |
| **Changelog** | Version history | `/CHANGELOG.md` |

### **Developer Guides**
| Guide | Description | Location |
|-------|-------------|----------|
| **Copilot Instructions** | AI assistant development patterns | `/.github/copilot-instructions.md` |
| **Setup Guides** | Environment, database, testing setup | `/docs/archived_docs/1-setup-guides/` |
| **Integration Patterns** | 7-phase feature integration approach | `/docs/ROADMAP.md` (Proven Pattern) |
| **Testing Guide** | Unit, integration, E2E testing | `/docs/archived_docs/1-setup-guides/TESTING.md` |

### **Reference Documentation**
| Reference | Description | Location |
|-----------|-------------|----------|
| **RBAC Permissions** | 8 roles, 50+ permissions matrix | `/docs/ROADMAP.md` (RBAC section) |
| **Jurisdictions** | Oregon, Maryland, Canada, PrimusGFS | `/.github/copilot-instructions.md` |
| **Database Schema** | 20+ tables, RLS policies, triggers | `/lib/supabase/schema.sql` |
| **UI Components** | 47+ shadcn/ui component inventory | `/docs/archived_docs/6-design-reference/UI_COMPONENT_AUDIT.md` |
| **Design Tokens** | Figma design system (124k+ lines) | `/docs/archived_docs/6-design-reference/figmaTokens.md` |

---

## 🗂️ **Documentation Structure**

```
/docs/
├── README.md                    # This file - navigation hub
├── API.md                       # REST API reference
├── archived_docs/               # Historical documentation (51 files)
│   ├── README.md               # Archived docs navigation
│   ├── 1-setup-guides/         # Setup, config, testing (19 files)
│   ├── 2-feature-integration/  # Integration completion reports (12 files)
│   ├── 3-troubleshooting/      # Bug fixes and patches (11 files)
│   ├── 4-cleanup-reports/      # Repository cleanup analysis (11 files)
│   ├── 5-deployment/           # Deployment guides (6 files)
│   └── 6-design-reference/     # Design tokens, UI audit (2 files)
└── migrations/                  # Database migration fixes (2 files)
```

---

## 🚀 **Getting Started**

### **New Developers**
1. **Read:** `/README.md` - Project overview
2. **Setup:** `/docs/archived_docs/1-setup-guides/ENV_SETUP.md` - Environment configuration
3. **Run:** `npm install && npm run dev` - Start development server
4. **Test:** `npm run typecheck && npm test` - Verify setup
5. **Learn:** `/.github/copilot-instructions.md` - Development patterns

### **Contributing to Features**
1. **Read:** `/CONTRIBUTING.md` - Development workflow
2. **Review:** `/NextSteps.md` - See "7-Phase Approach"
3. **Check:** `/CURRENT.md` - Verify feature status
4. **Test:** `/docs/archived_docs/1-setup-guides/TESTING.md` - Testing requirements
5. **Document:** Update `CURRENT.md` and `NextSteps.md` when complete

### **API Integration**
1. **Read:** `/docs/API.md` - API reference
2. **Auth:** Use Supabase JWT tokens (see API.md Authentication section)
3. **Permissions:** Check RBAC requirements for each endpoint
4. **Multi-region:** US/Canada routing handled automatically

---

## 📚 **Feature Documentation**

### **Completed Features**
| Feature | Status | Documentation | Lines of Code |
|---------|--------|---------------|---------------|
| **Foundation** | ✅ Complete | `/CURRENT.md` (Phase 1) | - |
| **Admin System** | ✅ Complete | `/CURRENT.md` (Phase 3-6) | - |
| **Signup Flow** | ✅ Complete | `/docs/archived_docs/2-feature-integration/SIGNUP_DATABASE_INTEGRATION.md` | - |
| **Inventory** | ✅ Complete | `/docs/archived_docs/2-feature-integration/INVENTORY_*.md` | 315KB (30 files) |
| **Monitoring** | 🔄 86% | `/docs/archived_docs/2-feature-integration/MONITORING_*.md` | 5,824 lines |

### **Integration Guides**
| Guide | Description | Location |
|-------|-------------|----------|
| **Inventory Integration** | Complete 7-phase tracker (635 lines) | `/docs/archived_docs/2-feature-integration/InventoryIntegrationSteps.md` |
| **TagoIO Integration** | API integration, polling service | `/docs/archived_docs/2-feature-integration/TAGOIO_INTEGRATION_PHASE6_COMPLETE.md` |
| **Monitoring Dashboard** | Pages, components, hooks | `/docs/archived_docs/2-feature-integration/MONITORING_*.md` |

---

## 🔧 **Development References**

### **Architecture Patterns**
- **Server Components:** See `.github/copilot-instructions.md` (RBAC pattern)
- **Client Components:** See `.github/copilot-instructions.md` (Jurisdiction pattern)
- **Database Queries:** See `/lib/supabase/queries/` examples
- **API Routes:** See `/app/api/inventory/` for reference implementation

### **Testing Patterns**
- **Unit Tests:** `/lib/supabase/queries/__tests__/` (67 functions tested)
- **Component Tests:** `/app/dashboard/admin/__tests__/` (19 tests)
- **E2E Tests:** `/e2e/` (Playwright - 5 test suites)
- **Test Helpers:** `/lib/supabase/queries/__tests__/test-helpers.ts`

### **Code Quality Standards**
- **TypeScript:** 0 compilation errors (strict mode)
- **Test Coverage:** 94.8% pass rate (164/173 tests)
- **Build:** Production-ready (`npm run build` passes)
- **Linting:** ESLint + Prettier configured

---

## 🗄️ **Archived Documentation**

The `/docs/archived_docs/` directory contains **51 historical documents** organized into **6 categories**:

### **Category Overview**
| Category | Files | Description |
|----------|-------|-------------|
| **1-setup-guides** | 19 | Environment setup, auth flows, testing, security |
| **2-feature-integration** | 12 | Complete integration reports (Inventory, Monitoring, TagoIO) |
| **3-troubleshooting** | 11 | Bug fixes, patches, issue resolutions |
| **4-cleanup-reports** | 11 | Repository cleanup analysis and completion reports |
| **5-deployment** | 6 | Vercel deployment, polling services, integrations |
| **6-design-reference** | 2 | Design tokens (124k+ lines), UI component audit |

**See:** `/docs/archived_docs/README.md` for complete navigation and file index

---

## 🛠️ **Common Tasks**

### **Adding a New Feature**
1. Follow the **7-Phase Approach** in `/NextSteps.md`:
   - Phase 1: Database Schema
   - Phase 2: Type Definitions
   - Phase 3: Database Queries
   - Phase 4: UI Components
   - Phase 5: Dashboard Pages
   - Phase 6: API Routes
   - Phase 7: Testing & Bug Fixes

2. **Update Documentation:**
   - Check off feature in `/NextSteps.md`
   - Update status in `/CURRENT.md`
   - Create `[FEATURE]_COMPLETE.md` in `/docs/archived_docs/2-feature-integration/`
   - Update `/CHANGELOG.md`

### **Running Tests**
```bash
# All checks (use before committing)
npm run typecheck  # TypeScript (must be 0 errors)
npm test           # Unit tests (maintain 94.8%+ pass rate)
npm run build      # Production build

# Specific test suites
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:e2e          # Playwright E2E tests
```

### **Database Changes**
1. Update `/lib/supabase/schema.sql`
2. Apply to both regions (US/Canada Supabase instances)
3. Update TypeScript types in `/types/`
4. Test with `npm run seed:dev`

### **Deployment**
See `/NextSteps.md` "Deployment Checklist" section for complete preflight checks.

---

## 📖 **Additional Resources**

### **External Documentation**
- [Next.js 15 Docs](https://nextjs.org/docs) - App Router, Server Components
- [Supabase Docs](https://supabase.com/docs) - Auth, Database, RLS
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/docs) - Styling framework

### **Project-Specific**
- **Prototypes:** `/Prototypes/README.md` - Analysis of 11 prototype applications
- **Archive:** `/archive/Prototypes/` - Completed prototypes (Identity, Inventory, Signup)
- **Scripts:** `/scripts/` - Database seeding, polling, testing utilities

---

## 🔍 **Finding Documentation**

### **Search by Topic**
| Topic | Search Location |
|-------|-----------------|
| Authentication | `/docs/archived_docs/1-setup-guides/USER_AUTH_*.md` |
| RBAC/Permissions | `/NextSteps.md` (RBAC System section) |
| Inventory | `/docs/archived_docs/2-feature-integration/INVENTORY_*.md` |
| Monitoring | `/docs/archived_docs/2-feature-integration/MONITORING_*.md` |
| Database | `/lib/supabase/schema.sql` + `/docs/archived_docs/1-setup-guides/DATABASE_SETUP.md` |
| Testing | `/docs/archived_docs/1-setup-guides/TESTING.md` |
| Deployment | `/docs/archived_docs/5-deployment/VERCEL_*.md` |
| Bug Fixes | `/docs/archived_docs/3-troubleshooting/` |

### **Search by Feature Status**
- **Completed Features:** `/docs/CURRENT.md` - Full status breakdown
- **In Progress:** `/docs/ROADMAP.md` - Current phase tracking
- **Planned Features:** `/docs/ROADMAP.md` - Roadmap (Phases 10-16)

---

## 📞 **Support**

### **Getting Help**
1. **Architecture Questions:** See `.github/copilot-instructions.md`
2. **Integration Patterns:** See `/docs/ROADMAP.md` (7-Phase Approach)
3. **Feature Status:** See `/docs/CURRENT.md`
4. **API Issues:** See `/docs/API.md`
5. **Contributing:** See `/CONTRIBUTING.md`

### **Reporting Issues**
- **Bugs:** GitHub Issues (include steps to reproduce)
- **Feature Requests:** GitHub Discussions
- **Security:** Email security@trazo.com (do not create public issues)

---

## 📊 **Documentation Statistics**

| Metric | Count |
|--------|-------|
| **Total Documentation Files** | 70+ markdown files |
| **Root Documentation** | 6 files (README, CURRENT, NextSteps, CONTRIBUTING, CHANGELOG, LICENSE) |
| **Archived Documentation** | 51 files (organized in 6 categories) |
| **API Endpoints Documented** | 15+ endpoints |
| **Code Examples** | 50+ examples across docs |
| **Total Documentation Size** | 500KB+ |

---

## 🔄 **Keeping Documentation Updated**

### **When Adding Features**
- [ ] Update `/CURRENT.md` status
- [ ] Check off items in `/NextSteps.md`
- [ ] Create completion report in `/docs/archived_docs/2-feature-integration/`
- [ ] Update `/CHANGELOG.md` with version entry
- [ ] Update `/docs/API.md` if adding endpoints

### **When Fixing Bugs**
- [ ] Create fix documentation in `/docs/archived_docs/3-troubleshooting/`
- [ ] Update `/CHANGELOG.md` (Unreleased section)
- [ ] Update affected feature docs

### **When Refactoring**
- [ ] Update relevant setup guides
- [ ] Update code examples in documentation
- [ ] Archive outdated docs to `/docs/archived_docs/`

---

**Last Updated:** November 4, 2025  
**Documentation Version:** 1.0.0  
**Project Version:** 0.8.0

For the most up-to-date information, always check `/docs/CURRENT.md` and `/docs/ROADMAP.md`.
