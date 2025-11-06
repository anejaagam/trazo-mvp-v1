# Project Overview & Architecture

**Navigation:** [← Back to Current Status](../index.md)

---

## Project Description

**TRAZO** is an edge-native container farm operating system with multi-regional data residency. The application enables farmers and agricultural companies to manage their container infrastructure while ensuring data stays within their preferred region (US or Canada).

---

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **React Version:** React 19
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.x
- **UI Components:** shadcn/ui (47+ components)
- **Primitives:** Radix UI
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod validation

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime subscriptions
- **Storage:** Supabase Storage (for file uploads)
- **Multi-region:** Separate US and Canada instances

### Security
- **Row-Level Security (RLS):** Database-level access control
- **RBAC:** 8 roles, 50+ permissions
- **Multi-tenancy:** Organization and site-based isolation
- **Audit Trails:** Complete change history

### Testing
- **Unit Tests:** Jest
- **Component Tests:** React Testing Library
- **E2E Tests:** Playwright
- **Coverage:** 94.8% pass rate (164/173 tests)

### DevOps
- **Hosting:** Vercel
- **CI/CD:** Vercel deployment pipeline
- **Cron Jobs:** Vercel Cron (TagoIO polling)
- **Environment:** .env.local for development

---

## Architecture Patterns

### Server Components
- Data fetching at the server level
- Authentication checks before rendering
- RBAC permission validation
- Props passed to client components
- SEO-friendly metadata generation

### Client Components
- Interactive UI with React hooks
- Real-time subscriptions (Supabase)
- Form handling and validation
- State management (useState, useReducer)
- Browser-only operations

### API Routes
- RESTful endpoints for external integrations
- Authentication middleware
- RBAC permission checks
- Proper HTTP status codes
- Error handling and logging

### Server Actions
- Form submission handling
- RLS bypass with service client
- Type-safe request/response
- Error handling with try/catch
- Used by client components

### Multi-Regional Routing
- Region selection during signup (US, Canada)
- Environment variables for Supabase URLs
- Separate database instances
- Cross-region authentication support

---

## Project Structure

```
trazo-mvp-v1/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles and CSS variables
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Homepage with auth redirects
│   ├── actions/                 # Server actions
│   │   ├── inventory.ts         # Inventory form actions
│   │   └── monitoring.ts        # Monitoring RLS bypass
│   ├── api/                     # API routes
│   │   ├── admin/               # Admin endpoints
│   │   ├── auth/                # Auth callbacks
│   │   ├── cron/                # Vercel Cron jobs
│   │   ├── inventory/           # Inventory REST API
│   │   └── validate-tagoio/     # TagoIO validation
│   ├── auth/                    # Authentication pages
│   │   ├── login/page.tsx       # Sign in page
│   │   ├── sign-up/             # Multi-step signup flow
│   │   │   ├── page.tsx         # Step 1: Personal info
│   │   │   ├── step-2/page.tsx  # Step 2: Company info
│   │   │   ├── step-3/page.tsx  # Step 3: Emergency contact
│   │   │   └── step-4/page.tsx  # Step 4: Farm details
│   │   └── sign-up-success/     # Registration success
│   ├── dashboard/               # Protected dashboard
│   │   ├── layout.tsx           # Dashboard layout
│   │   ├── page.tsx             # Dashboard home
│   │   ├── admin/               # Admin pages (5 pages)
│   │   ├── inventory/           # Inventory pages (5 pages)
│   │   └── monitoring/          # Monitoring pages (2 pages)
│   └── landing/page.tsx         # Landing page
├── components/                   # Reusable components
│   ├── ui/                      # UI component library (47+ components)
│   │   ├── button.tsx           # Button with variants
│   │   ├── card.tsx             # Card layouts
│   │   ├── dialog.tsx           # Modal dialogs
│   │   ├── table.tsx            # Data tables
│   │   └── [38 more...]         # Complete shadcn/ui set
│   ├── features/                # Feature-specific components
│   │   ├── admin/               # Admin UI (4 components)
│   │   ├── inventory/           # Inventory UI (11 components)
│   │   └── monitoring/          # Monitoring UI (13 components)
│   ├── dashboard/               # Dashboard components
│   │   ├── fleet-monitoring-dashboard.tsx
│   │   ├── pod-detail-dashboard.tsx
│   │   └── [more dashboards]
│   └── providers/               # Context providers
│       └── theme-provider.tsx   # Dark mode
├── hooks/                       # Custom React hooks
│   ├── use-permissions.ts       # RBAC hook
│   ├── use-jurisdiction.ts      # Compliance hook
│   ├── use-telemetry.ts         # Telemetry hooks (4)
│   ├── use-alarms.ts            # Alarm hooks (3)
│   └── use-notifications.ts     # Notification hook
├── lib/                         # Utility libraries
│   ├── utils.ts                 # Utility functions (cn, etc.)
│   ├── rbac/                    # RBAC system
│   │   ├── roles.ts             # Role definitions
│   │   ├── permissions.ts       # Permission definitions
│   │   └── guards.ts            # Permission guards
│   ├── jurisdiction/            # Compliance engine
│   │   ├── types.ts             # Jurisdiction types
│   │   └── rules.ts             # Compliance rules
│   ├── supabase/                # Supabase configuration
│   │   ├── client.ts            # Client-side Supabase
│   │   ├── server.ts            # Server-side Supabase
│   │   ├── service.ts           # Service client (RLS bypass)
│   │   ├── middleware.ts        # Auth middleware
│   │   ├── region.ts            # Multi-regional config
│   │   ├── schema.sql           # Database schema
│   │   └── queries/             # Query functions
│   │       ├── inventory.ts     # Inventory queries (67 functions)
│   │       ├── telemetry.ts     # Telemetry queries (15 functions)
│   │       ├── telemetry-client.ts # Client queries (10 functions)
│   │       └── alarms.ts        # Alarm queries (20 functions)
│   ├── tagoio/                  # TagoIO integration
│   │   ├── client.ts            # API client
│   │   ├── transformer.ts       # Data transformer
│   │   └── polling-service.ts   # Polling orchestration
│   ├── types/                   # TypeScript types
│   │   ├── inventory.ts         # Inventory types
│   │   └── telemetry.ts         # Telemetry types
│   └── constants/               # Application constants
│       └── inventory.ts         # Inventory enums
├── types/                       # Global types
│   ├── index.ts                 # Shared types
│   ├── admin.ts                 # Admin types
│   ├── inventory.ts             # Re-export
│   └── telemetry.ts             # Re-export
├── scripts/                     # Utility scripts
│   ├── seed-dev-db.ts           # Seed development data
│   ├── seed-monitoring.ts       # Seed monitoring data
│   └── test-tagoio-api.ts       # TagoIO API testing
├── docs/                        # Documentation
│   ├── README.md                # Documentation hub
│   ├── API.md                   # API reference
│   ├── roadmap/                 # Integration roadmap (9 files)
│   ├── current/                 # Current status (6 files)
│   └── archived_docs/           # Historical docs
├── Prototypes/                  # Feature prototypes (11 apps)
│   ├── InventoryTrackingPrototype/ (integrated)
│   ├── MonitoringAndTelemeteryPrototype/ (integrated)
│   └── [9 more prototypes...]   # Awaiting integration
├── middleware.ts                # Next.js middleware
├── tailwind.config.ts           # Tailwind configuration
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

---

## Component Inventory

### shadcn/ui Components (47 total)
Complete design system with Radix UI primitives:
- Layout: Card, Separator, Scroll Area, Sheet
- Forms: Input, Textarea, Select, Checkbox, Radio, Switch, Slider, Label
- Data: Table, DataTable, Pagination, Tabs, Accordion
- Feedback: Alert, Toast, Dialog, Popover, Tooltip, Badge, Progress, Skeleton
- Navigation: Navigation Menu, Breadcrumb, Pagination, Tabs
- Buttons: Button (7 variants), Toggle, Toggle Group
- Advanced: Command, Context Menu, Dropdown Menu, Hover Card, Menubar

**See:** `docs/archived_docs/4-cleanup-reports/COMPONENT_IMPORT_ANALYSIS.md`

### Feature Components
- **Admin:** 4 components (UserTable, RoleMatrix, AuditLog, InviteDialog)
- **Inventory:** 11 components (195 KB) - Full CRUD interface
- **Monitoring:** 13 components (2,815 lines) - Dashboard + charts

---

## Database Schema

### Core Tables (25+)
- **Auth & Users:** users, user_site_assignments, emergency_contacts
- **Organizations:** organizations, sites, rooms, pods
- **Inventory:** inventory_items, inventory_lots, inventory_movements, inventory_alerts
- **Monitoring:** telemetry_readings, device_status, alarms, alarm_policies, notifications
- **Admin:** audit_logs, invitations, integration_settings

### Security
- Row-Level Security (RLS) on all tables
- Organization-scoped access
- Site-level permissions
- User-site assignments

### Audit System
- Trigger functions on critical tables
- Complete change history
- User attribution
- Timestamp tracking

**Schema File:** `lib/supabase/schema.sql`

---

## Integrations

### Supabase
- Authentication with social providers
- PostgreSQL database
- Real-time subscriptions
- Storage for file uploads
- Multi-regional instances (US, Canada)
- Row-Level Security (RLS)

### TagoIO
- IoT device integration
- Environmental sensor data
- Real-time polling (60s interval)
- Device-Token authentication
- Data transformation pipeline
- Vercel Cron job orchestration

### Figma (Design)
- Design token extraction
- Component matching
- Brand consistency
- Design system implementation

---

## Development Workflow

### Local Development
```bash
npm run dev           # Start dev server (localhost:3000)
npm test             # Run Jest tests
npm run build        # Production build
npm run seed:dev     # Seed test data
npx tsc --noEmit     # Type check
```

### Environment Variables
```env
# Supabase (US Region)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Supabase (CA Region)
NEXT_PUBLIC_SUPABASE_URL_CA=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY_CA=...
SUPABASE_SERVICE_ROLE_KEY_CA=...

# Dev Mode
NEXT_PUBLIC_DEV_MODE=true  # Bypass auth

# TagoIO
TAGOIO_DEVICE_TOKEN=...

# Vercel Cron
CRON_SECRET=...
```

### Branch Strategy
- `main` - Production branch
- `develop` - Integration branch
- `feature/*` - Feature branches
- `hotfix/*` - Critical fixes

### Deployment
- Automatic deployment on push to `main` (Vercel)
- Preview deployments for PRs
- Environment variable management in Vercel
- Database migrations applied manually

---

**Navigation:** [← Back to Current Status](../index.md) | [Next: Health Metrics →](./health-metrics.md)
