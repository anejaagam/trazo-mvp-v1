# Developer Dashboard

The Developer Dashboard is a comprehensive internal tool for managing the TRAZO platform. It provides organization approval workflows, real-time error monitoring, user oversight, and audit logging capabilities.

## Access

- **URL**: `/dev-dashboard/`
- **Login**: `/dev-auth/login`
- **Signup**: `/dev-auth/signup` (controlled by environment variable)

## Features

### 1. Organization Approval Workflow

Organizations signing up for TRAZO must be approved before their users can access the platform.

**Approval States:**
- `pending` - New organizations awaiting review
- `approved` - Organizations with full platform access
- `rejected` - Organizations denied access

**Workflow:**
1. Organization signs up via the main platform
2. Appears in Developer Dashboard under "Approvals" → "Pending"
3. Developer reviews and approves/rejects
4. Approved organizations' users can now log in

### 2. Real-Time Error Monitoring

Errors across the TRAZO platform are captured and streamed to the Developer Dashboard in real-time.

**Severity Levels:**
- `critical` - System failures, triggers instant notifications
- `error` - Application errors requiring attention
- `warning` - Potential issues to monitor
- `info` - Informational logs

**Features:**
- Real-time streaming via Supabase Realtime
- Severity-based filtering
- Color-coded badges (red/orange/yellow/blue)
- Sonner toast notifications for critical errors
- 45-day automatic log retention

### 3. User Management

View all platform users across all organizations.

**Capabilities:**
- Filter by role, organization, or search by name/email
- View user status (active/inactive)
- See organization affiliation and approval status
- Track sign-in history

### 4. Audit Logging

Complete trail of all developer actions on the platform.

**Tracked Actions:**
- Organization approvals/rejections
- Dashboard views
- Error log views
- User list views
- Login/logout sessions

## Configuration

### Environment Variables

```bash
# Enable/disable developer signup
# Set to 'true' to allow new developer registrations
# Default: false (closed)
NEXT_PUBLIC_DEV_SIGNUP_OPEN=false
```

### Database Requirements

The following tables are required (created via migrations):

1. **organizations** - Added `approval_status`, `approved_at`, `approved_by` columns
2. **error_logs** - Stores all platform errors with Realtime enabled
3. **dev_audit_logs** - Tracks all developer actions

### Migrations

Apply migrations to both US and Canada Supabase projects:

```bash
# US Region
supabase db push --db-url $SUPABASE_DB_URL

# Canada Region  
supabase db push --db-url $CAN_SUPABASE_DB_URL
```

## Role Requirements

Only users with the `developer` role can access the Dev Dashboard.

The developer role has full platform access (`'*'` permissions) and is at the top of the role hierarchy.

## File Structure

```
/app
  /dev-auth
    /login/page.tsx      # Developer login
    /signup/page.tsx     # Developer registration
  /dev-dashboard
    /layout.tsx          # Auth guard & sidebar
    /page.tsx            # Overview with metrics
    /approvals/page.tsx  # Organization approval queue
    /errors/page.tsx     # Real-time error viewer
    /users/page.tsx      # Platform user list
    /logs/page.tsx       # Developer audit logs

/components/features/dev
  dev-login-form.tsx     # Login form component
  dev-signup-form.tsx    # Signup form component
  dev-sidebar.tsx        # Navigation sidebar
  severity-badge.tsx     # Error severity indicator
  platform-metrics-cards.tsx  # Stats display
  org-approval-table.tsx # Approval queue table
  error-stream-viewer.tsx # Real-time error feed
  dev-audit-table.tsx    # Audit log display

/lib
  /errors
    types.ts             # Error types & severity colors
    error-logger.ts      # Error logging functions
    error-boundary.tsx   # React error boundary
  /dev-audit
    actions.ts           # Audit action constants
    dev-audit-logger.ts  # Audit logging functions
  /supabase/queries
    organization-approval.ts  # Approval CRUD operations

/hooks
  use-error-stream.ts    # Real-time error subscription
```

## Usage Examples

### Logging Errors

```typescript
import { logError, logCriticalError } from '@/lib/errors'

// Log a standard error
await logError({
  component: 'InventoryPage',
  error: new Error('Failed to load inventory'),
  context: { siteId: '123' }
})

// Log a critical error (triggers notification)
await logCriticalError({
  component: 'AuthService',
  error: new Error('Database connection lost'),
  context: { region: 'us' }
})
```

### Using Error Boundary

```tsx
import { ErrorBoundary } from '@/lib/errors'

// Automatic error catching
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <MyComponent />
</ErrorBoundary>
```

### Subscribing to Error Stream

```tsx
import { useErrorStream } from '@/hooks/use-error-stream'

function ErrorMonitor() {
  const { errors, loading, clearErrors } = useErrorStream({
    autoConnect: true,
    limit: 50
  })
  
  return <ErrorList errors={errors} />
}
```

## Security Considerations

1. **Role Protection**: All dev dashboard routes check for `developer` role
2. **Audit Trail**: Every action is logged with developer ID and timestamp
3. **Signup Control**: Registration can be closed via environment variable
4. **Main Login Protection**: Regular users from pending/rejected orgs cannot log in

## Maintenance

### Log Cleanup

A Supabase cron job automatically cleans up logs older than 45 days:
- Runs daily at midnight UTC
- Deletes from `error_logs` and `dev_audit_logs`
- Configured in migration `20251126100005_create_log_cleanup_cron.sql`

### Creating Developer Accounts

When signup is closed, create developer accounts manually:

```sql
-- Add developer role to existing user
UPDATE users 
SET role = 'developer' 
WHERE email = 'developer@example.com';
```

Or enable signup temporarily:
```bash
NEXT_PUBLIC_DEV_SIGNUP_OPEN=true
```
