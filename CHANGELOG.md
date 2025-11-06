# Changelog

All notable changes to TRAZO MVP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🔄 In Progress
- **Monitoring & Telemetry Integration** (86% complete)
  - TagoIO API integration complete
  - Vercel cron polling service deployed
  - Device mapping pending
  - End-to-end testing pending

## [0.8.0] - 2025-11-04

### 🧹 Repository Cleanup
- Organized 51 archived documents into 6 logical categories
- Created comprehensive documentation navigation system
- Reduced active prototypes by 23% (13 → 10 items)
- Analyzed and consolidated mock/seed data structure
- Improved documentation discoverability

### 📚 Documentation
- Added `LICENSE` (MIT)
- Added `CONTRIBUTING.md` with development guidelines
- Added comprehensive API documentation
- Created `/docs/README.md` navigation hub
- Reorganized `/docs/archived_docs/` with category structure

## [0.7.0] - 2025-10-30

### ✨ Monitoring & Telemetry (Phase 6)
- Integrated TagoIO API for real-time device data
- Implemented automated polling service (60s intervals)
- Created Vercel cron endpoint for production deployment
- Added token validation and storage
- Built comprehensive monitoring dashboard
- Added 7 custom React hooks for telemetry data

### 🏗️ Infrastructure
- Multi-region Supabase configuration (US/Canada)
- Automated environment setup scripts
- Production-ready cron authentication
- Error handling and retry logic

## [0.6.0] - 2025-10-29

### ✨ Monitoring Dashboard (Phase 5)
- Created fleet monitoring dashboard with grid/table views
- Built pod detail pages with dynamic routing
- Added real-time telemetry visualization
- Implemented historical data charts (1h, 6h, 24h, 7d)
- Created demo data seeding system
- Added server-side RBAC enforcement

### 🐛 Bug Fixes
- Fixed inventory transfer location updates (critical)
- Corrected schema alignment for telemetry tables
- Fixed RLS policies for multi-tenant data access
- Resolved dev mode organization/site alignment

## [0.5.0] - 2025-10-27

### ✨ Inventory System Complete (Phase 8)
- Full CRUD operations for inventory items
- Lot tracking with FIFO/LIFO/FEFO strategies
- Multi-lot consumption support
- Low stock and expiry alerts
- Movement history tracking
- Waste disposal documentation
- CSV export functionality
- Multi-jurisdiction compliance (Metrc, CTLS, PrimusGFS)

### 📦 Deliverables
- 30 files created/modified
- 4 API endpoints (GET/POST items, PATCH/DELETE items)
- 67 database query functions
- 11 UI components
- 5 dashboard pages
- Complete audit trail

### 🎯 Testing
- 164/173 tests passing (94.8% success rate)
- Zero TypeScript compilation errors
- Production build verified

## [0.4.0] - 2025-10-15

### ✨ Admin System Complete (Phase 3-6)
- User management with CRUD operations
- Role matrix management (8 roles, 50+ permissions)
- Permission-based access control
- Audit log viewer with filtering
- User invitation system
- Multi-tenant organization support

### 🔒 Security
- Row-Level Security (RLS) policies deployed
- Multi-tenant data isolation
- Audit trail for all admin actions
- Permission guards on all routes

## [0.3.0] - 2025-09-20

### ✨ Enhanced Signup Flow (Phase 1.5)
- Automatic `org_admin` role assignment for first user
- Plant type selection (Cannabis/Produce)
- Jurisdiction selection (Oregon, Maryland, Canada, PrimusGFS)
- Data region selection (US/Canada)
- Conditional jurisdiction options
- LocalStorage persistence for multi-step form

### 🧪 Testing
- 19 signup flow tests (100% pass rate)
- Comprehensive validation testing
- Role assignment verification
- Jurisdiction logic validation

### 🎨 UI Components
- Consolidated 47+ shadcn/ui components
- Migrated 38 components from prototypes
- Removed duplicate components
- Created component usage documentation

## [0.2.0] - 2025-09-10

### ✨ Foundation Complete (Phase 1)
- RBAC system (8 roles, 50+ permissions)
- Jurisdiction engine (4 jurisdictions)
- Multi-region authentication (US/Canada)
- Dashboard layout with navigation
- Dev mode for rapid development

### 🗄️ Database
- Complete schema with 20+ tables
- RLS policies for all tables
- Audit logging triggers
- Performance indexes
- Multi-region deployment (US/Canada Supabase instances)

### 🎯 Project Structure
- Next.js 15 App Router architecture
- TypeScript with strict mode
- Tailwind CSS + shadcn/ui
- Custom hooks for RBAC and jurisdiction
- Server/Client component patterns

## [0.1.0] - 2025-08-01

### 🎉 Initial Release
- Project setup and configuration
- Next.js 15 App Router foundation
- Supabase integration
- Basic authentication flow
- Landing page
- Development environment setup

---

## Version History Summary

| Version | Date | Milestone |
|---------|------|-----------|
| 0.8.0 | 2025-11-04 | Repository Cleanup & Documentation |
| 0.7.0 | 2025-10-30 | Monitoring Integration (TagoIO) |
| 0.6.0 | 2025-10-29 | Monitoring Dashboard |
| 0.5.0 | 2025-10-27 | Inventory System Complete |
| 0.4.0 | 2025-10-15 | Admin System Complete |
| 0.3.0 | 2025-09-20 | Enhanced Signup + UI Components |
| 0.2.0 | 2025-09-10 | Foundation Complete |
| 0.1.0 | 2025-08-01 | Initial Release |

---

## Upcoming Features

### Phase 10: Monitoring & Telemetry (86% complete)
- Device mapping (30 min)
- End-to-end testing (2 hours)
- Unit & integration tests (4 hours)

### Phase 11: Environmental Controls (Planned)
- Recipe management
- HVAC automation
- Photoperiod scheduling
- Manual overrides

### Phase 12: Batch Management (Planned)
- Plant lifecycle tracking
- Batch genealogy
- Stage transitions
- Harvest workflow

### Phase 13: Compliance Engine (Planned)
- Metrc reporting
- CTLS reporting
- Evidence vault
- Audit exports

See `NextSteps.md` for complete roadmap.
