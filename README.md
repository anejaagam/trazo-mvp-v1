# TRAZO MVP

TRAZO is a Next.js 15 (App Router) cultivation facility management system with multi-tenancy, jurisdiction-based compliance, and role-based access control. The app uses Supabase for auth/database with separate US/Canada regions.

## Project Status

- ✅ **Foundation Complete**: RBAC (8 roles, 50+ permissions), Jurisdiction Engine (4 jurisdictions), Multi-region Auth
- ✅ **Admin System Complete**: User Management, Role Matrix, Audit Logs, Invitations
- ✅ **Inventory System Complete**: Item CRUD, Lot Tracking, FIFO/LIFO/FEFO, Low Stock Alerts
- 🔄 **Monitoring & Telemetry**: 86% complete (6 of 7 phases), TagoIO integration ready
- 📊 **Test Coverage**: 164/173 tests passing (94.8%)
- 🧹 **Repository**: Production-ready documentation structure (Nov 2025)

**Quick Links:**
- 📖 **[Documentation](/docs/README.md)** - Complete docs navigation hub
- 🚀 **[API Reference](/docs/API.md)** - REST API documentation
- 📋 **[Current Status](/docs/current/index.md)** - Detailed feature status
- 🗺️ **[Roadmap](/docs/ROADMAP.md)** - Integration roadmap & deployment guide
- 🤝 **[Contributing](CONTRIBUTING.md)** - Development guidelines
- 📝 **[Changelog](CHANGELOG.md)** - Version history

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js v18+
- npm
- Docker

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd trazo-mvp-v1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file by copying the example file:
   ```bash
   cp .env.example .env.local
   ```
   Populate `.env.local` with your Supabase project credentials for both US and Canada regions.

   Set `NEXT_PUBLIC_DEV_MODE=true` to bypass auth and use a mock user (`test@trazo.app`).

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Testing

This project uses Jest for unit and integration tests and Playwright for end-to-end tests.

- **Run all tests:**
  ```bash
  npm test
  ```

- **Run Playwright E2E tests:**
  ```bash
  npm run test:e2e
  ```

- **Seed the database for testing:**
  ```bash
  npm run seed:dev
  ```

## Project Structure

```
/app/                   # Next.js App Router (protected routes in /dashboard)
/components/
  /ui/                  # 47+ shadcn/ui components
  /features/            # Feature-specific components (admin, inventory, monitoring)
/lib/
  /rbac/                # Role-Based Access Control (8 roles, 50+ permissions)
  /jurisdiction/        # Jurisdiction-specific compliance logic
  /supabase/            # Supabase queries and schema
/hooks/                 # Custom React hooks (usePermissions, useJurisdiction)
/types/                 # TypeScript interfaces
/docs/                  # 📚 Complete documentation
  /API.md               # REST API reference
  /archived_docs/       # Historical documentation
/e2e/                   # Playwright end-to-end tests
```

## Documentation

### Essential Documentation
- **[Getting Started](/docs/README.md)** - Complete documentation hub
- **[API Reference](/docs/API.md)** - REST API endpoints and examples
- **[Contributing](CONTRIBUTING.md)** - Development workflow and code standards
- **[Changelog](CHANGELOG.md)** - Version history and release notes

### Developer Guides
- **[Current Status](/docs/current/index.md)** - Detailed feature implementation status (split into 6 focused guides)
- **[Integration Roadmap](/docs/ROADMAP.md)** - Step-by-step integration guide (57KB)
- **[Copilot Instructions](.github/copilot-instructions.md)** - AI assistant development patterns

### Archived Documentation
- **[Setup Guides](/docs/archived_docs/1-setup-guides/)** - Environment, database, testing (19 files)
- **[Feature Integration](/docs/archived_docs/2-feature-integration/)** - Complete integration reports (12 files)
- **[Troubleshooting](/docs/archived_docs/3-troubleshooting/)** - Bug fixes and patches (13 files)

See **[/docs/README.md](/docs/README.md)** for complete navigation.

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for:
- Development workflow
- Code style standards
- Testing requirements
- Pull request process
- 7-phase feature integration pattern

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
