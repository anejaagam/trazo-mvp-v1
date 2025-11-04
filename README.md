# TRAZO MVP

TRAZO is a Next.js 15 (App Router) cultivation facility management system with multi-tenancy, jurisdiction-based compliance, and role-based access control. The app uses Supabase for auth/database with separate US/Canada regions.

## Project Status

- ✅ **Foundation Complete**: RBAC (8 roles, 50+ permissions), Jurisdiction Engine (4 jurisdictions), Multi-region Auth
- ✅ **Admin System Complete**: User Management, Role Matrix, Audit Logs, Invitations
- ✅ **Inventory System Complete**: Item CRUD, Lot Tracking, FIFO/LIFO/FEFO, Low Stock Alerts
- 🔄 **Monitoring & Telemetry**: 86% complete (5 of 7 phases), TagoIO integration ready
- 📊 **Test Coverage**: 164/173 tests passing (94.8%)
- 🧹 **Repository**: Documentation cleanup complete (Nov 2025)

**See:** `CURRENT.md` for detailed feature status | `NextSteps.md` for integration roadmap

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
  /ui/                  # shadcn/ui components
  /features/            # Feature-specific components
/lib/
  /rbac/                # Role-Based Access Control system
  /jurisdiction/        # Jurisdiction-specific compliance logic
  /supabase/            # Supabase queries and schema
/hooks/                 # Custom React hooks (usePermissions, useJurisdiction)
/types/                 # TypeScript interfaces
/e2e/                   # Playwright end-to-end tests
```
