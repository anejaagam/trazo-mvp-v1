# Multi-Tenant Token Management Implementation

**Date:** December 2024  
**Status:** ✅ Complete - Ready for Database Migration  
**Feature:** User-Configurable TagoIO Integration Settings

---

## Overview

Replaced hardcoded `TAGOIO_DEVICE_TOKEN` environment variable with database-stored, organization-scoped integration settings. Users can now configure their own TagoIO credentials through the admin UI.

**Key Benefits:**
- ✅ Multi-tenant support (each organization manages own tokens)
- ✅ Secure token storage with Row-Level Security (RLS)
- ✅ Token validation before saving (API connection test)
- ✅ Admin UI for token management
- ✅ Extensible for future integrations (Metrc, CTLS, DemeGrow)

---

## Architecture Changes

### Before (Single-Tenant)
```
Environment Variable (TAGOIO_DEVICE_TOKEN)
  ↓
Cron Job → pollDevices(token)
  ↓
All pods use same token
```

### After (Multi-Tenant)
```
Database (integration_settings table)
  ↓
Cron Job → pollDevices()
  ↓
Fetch pods with organization IDs
  ↓
Get token per organization
  ↓
Each pod uses its organization's token
```

---

## Implementation Details

### 1. Database Schema

**File:** `/lib/supabase/migrations/add_integration_settings.sql` (73 lines)

**Table Structure:**
```sql
CREATE TABLE integration_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_type integration_type_enum NOT NULL,
  api_token TEXT,
  api_secret TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_valid BOOLEAN DEFAULT false,
  last_validated_at TIMESTAMPTZ,
  validation_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, integration_type)
);
```

**Integration Types:**
```sql
CREATE TYPE integration_type_enum AS ENUM (
  'tagoio',    -- Environmental telemetry
  'metrc',     -- Compliance tracking (Oregon/Maryland)
  'ctls',      -- Compliance tracking (Canada)
  'demegrow'   -- Environmental controls
);
```

**Security:**
- Row-Level Security (RLS) enabled
- Users can view integrations for their organization
- Only `org_admin` and `site_manager` can modify settings
- Prepared for pgcrypto encryption

**Deployment Status:** ⏳ **Ready to deploy** (US & CA regions)

---

### 2. Query Functions

**File:** `/lib/supabase/queries/integration-settings.ts` (338 lines)

**Key Functions:**
```typescript
// Fetch integrations for organization
getIntegrationSettings(organizationId, type?)

// Fetch specific integration
getIntegrationSetting(organizationId, type)

// Get TagoIO token (used by polling service)
getTagoIOToken(organizationId)

// Create or update integration
upsertIntegrationSetting(settings)

// Mark integration as validated
updateIntegrationValidation(id, isValid, error?)

// Validate TagoIO credentials (API test)
validateTagoIOCredentials(token)
```

**Validation Logic:**
1. Call TagoIO API `/info` endpoint with token
2. If successful, extract device name
3. Return `{ valid: true, deviceName: string }`
4. If failed, return `{ valid: false, error: string }`

**Status:** ✅ Complete, 0 TypeScript errors

---

### 3. Polling Service Refactor

**File:** `/lib/tagoio/polling-service.ts` (442 lines)

**Major Changes:**

**Before:**
```typescript
class TagoIOPollingService {
  private deviceToken: string
  
  constructor(deviceToken: string) {
    this.deviceToken = deviceToken
  }
  
  async pollSingleDevice(pod: PodConfig) {
    const data = await this.fetchDeviceData(pod.tagoio_device_id)
    // ...
  }
}

// Usage
const service = new TagoIOPollingService(env.TAGOIO_DEVICE_TOKEN)
```

**After:**
```typescript
class TagoIOPollingService {
  // No deviceToken property
  
  async getActivePodsWithTokens(siteId?: string) {
    // Complex join: pods → rooms → sites → organizations
    const pods = await supabase
      .from('pods')
      .select(`
        id, name, tagoio_device_id, site_id,
        room:rooms!inner(
          site:sites!inner(organization_id)
        )
      `)
    
    // Extract unique organization IDs
    const orgIds = [...new Set(pods.map(p => p.room.site.organization_id))]
    
    // Fetch tokens for each organization
    const tokens = new Map<string, string>()
    for (const orgId of orgIds) {
      const { data } = await getTagoIOToken(orgId)
      if (data) tokens.set(orgId, data.api_token)
    }
    
    // Match pods to tokens
    return pods
      .map(pod => ({
        pod,
        token: tokens.get(pod.room.site.organization_id)
      }))
      .filter(item => item.token)
  }
  
  async pollSingleDevice(pod: PodConfig, token: string) {
    const data = await this.fetchDeviceData(pod.tagoio_device_id, token)
    // ...
  }
}

// Usage
const service = new TagoIOPollingService()
const podsWithTokens = await service.getActivePodsWithTokens()
for (const { pod, token } of podsWithTokens) {
  await service.pollSingleDevice(pod, token)
}
```

**Key Features:**
- ✅ Fetches appropriate token per organization
- ✅ Warns if organization missing token (skips those pods)
- ✅ Multi-tenant support (different tokens for different orgs)
- ✅ Factory functions no longer require token parameter

**Status:** ✅ Complete, 0 TypeScript errors

---

### 4. Cron Endpoint Update

**File:** `/app/api/cron/telemetry-poll/route.ts`

**Changes:**
```typescript
// BEFORE
const deviceToken = process.env.TAGOIO_DEVICE_TOKEN
if (!deviceToken) {
  throw new Error('TAGOIO_DEVICE_TOKEN not configured')
}
const result = await pollDevices(deviceToken)

// AFTER
const result = await pollDevices() // Tokens fetched from database
```

**Status:** ✅ Complete, 0 TypeScript errors

---

### 5. Admin UI

**Files Created:**
1. `/app/dashboard/admin/integrations/page.tsx` (48 lines)
2. `/components/features/admin/integration-settings-form.tsx` (340 lines)

**Features:**
- ✅ Server-side auth check (redirect if not logged in)
- ✅ Role-based access (only `org_admin` and `site_manager`)
- ✅ Token input field with show/hide toggle
- ✅ "Test Connection" button (validates credentials)
- ✅ "Save Configuration" button (saves to database)
- ✅ Real-time validation status display
- ✅ Device name shown when connected
- ✅ Instructions for finding TagoIO token
- ✅ Current configuration status card

**User Flow:**
1. Admin navigates to `/dashboard/admin/integrations`
2. Enters TagoIO device token
3. Clicks "Test Connection" → Validates API access
4. If valid, device name shown
5. Clicks "Save Configuration" → Stores in database
6. Cron job uses saved token for polling

**Status:** ✅ Complete, 0 TypeScript errors

---

## Testing Checklist

### Database Migration
- [ ] Deploy `add_integration_settings.sql` to US Supabase instance
- [ ] Deploy `add_integration_settings.sql` to CA Supabase instance
- [ ] Verify table created with correct schema
- [ ] Test RLS policies (users can view org integrations)
- [ ] Test RLS policies (only admins can modify)

### UI Testing
- [ ] Navigate to `/dashboard/admin/integrations` as `org_admin`
- [ ] Verify page loads without errors
- [ ] Enter valid TagoIO token
- [ ] Click "Test Connection" → Should show device name
- [ ] Click "Save Configuration" → Should show success message
- [ ] Reload page → Token should show as `••••••••••••••••`
- [ ] Status card should show "Valid" with green checkmark

### API Testing
- [ ] Create integration setting via UI
- [ ] Verify record exists in `integration_settings` table
- [ ] Check `is_valid = true` and `validation_error IS NULL`
- [ ] Verify `config` JSONB contains device name

### Polling Service Testing
- [ ] Trigger cron job: `curl -X POST http://localhost:3000/api/cron/telemetry-poll`
- [ ] Check logs: Should show "Fetching tokens from database"
- [ ] Verify pods polled using organization's token
- [ ] Check `telemetry_readings` table for new data
- [ ] Test with multiple organizations (different tokens)

### Error Handling
- [ ] Test invalid token → Should show validation error
- [ ] Test missing token → Pods should be skipped with warning
- [ ] Test network error during validation
- [ ] Test database connection issues

---

## Environment Variables

### Before (Required)
```bash
# Required for all organizations
TAGOIO_DEVICE_TOKEN=ed51659f-6870-454f-8755-52815755c5bb
```

### After (Optional)
```bash
# Optional - only for testing/development
# Production: Configure via /dashboard/admin/integrations UI
# TAGOIO_DEVICE_TOKEN=ed51659f-6870-454f-8755-52815755c5bb
```

**Note:** Environment variable is no longer required. Users configure tokens through admin UI.

---

## Security Considerations

1. **Row-Level Security (RLS)**
   - Organizations can only see their own integration settings
   - Only `org_admin` and `site_manager` can modify settings

2. **Token Storage**
   - Stored in `api_token` TEXT column (prepared for encryption)
   - Future: Migrate to pgcrypto for encrypted storage

3. **Validation**
   - Tokens validated before saving (API connection test)
   - Invalid tokens cannot be saved
   - Validation errors stored for troubleshooting

4. **Audit Trail**
   - `created_at`, `updated_at`, `last_validated_at` timestamps
   - Track when credentials last validated

---

## Migration Path

### For Existing Deployments

1. **Deploy Database Migration**
   ```bash
   # US Region
   psql $SUPABASE_US_URL -f lib/supabase/migrations/add_integration_settings.sql
   
   # CA Region
   psql $SUPABASE_CA_URL -f lib/supabase/migrations/add_integration_settings.sql
   ```

2. **Migrate Existing Token**
   - If using `TAGOIO_DEVICE_TOKEN` env var, add to database:
   ```sql
   INSERT INTO integration_settings (
     organization_id,
     integration_type,
     api_token,
     is_active,
     is_valid
   ) VALUES (
     '<your-org-id>',
     'tagoio',
     '<token-from-env>',
     true,
     true
   );
   ```

3. **Remove Environment Variable**
   - After confirming database tokens work, remove from `.env.local`
   - Remove from Vercel environment variables

4. **Test Polling**
   - Trigger cron job manually
   - Verify telemetry data inserted
   - Check logs for database token usage

---

## Future Enhancements

### Short-Term
- [ ] Add navigation link to admin sidebar
- [ ] Support for Metrc integration (Oregon/Maryland)
- [ ] Support for CTLS integration (Canada)
- [ ] Support for DemeGrow integration

### Long-Term
- [ ] Encrypt tokens using pgcrypto
- [ ] Token rotation workflow
- [ ] Integration health monitoring
- [ ] Automatic token validation (daily cron)
- [ ] Email notifications for invalid tokens
- [ ] Integration activity logs

---

## File Summary

**New Files:**
- `/lib/supabase/migrations/add_integration_settings.sql` (73 lines)
- `/lib/supabase/queries/integration-settings.ts` (338 lines)
- `/app/dashboard/admin/integrations/page.tsx` (48 lines)
- `/components/features/admin/integration-settings-form.tsx` (340 lines)

**Modified Files:**
- `/lib/tagoio/polling-service.ts` (refactored for multi-tenant)
- `/app/api/cron/telemetry-poll/route.ts` (removed env var dependency)

**Total Lines Added:** ~800 lines  
**TypeScript Errors:** 0  
**Status:** ✅ Ready for deployment

---

## Support

**Documentation:**
- Architecture: `.github/copilot-instructions.md`
- Database Schema: `/lib/supabase/migrations/add_integration_settings.sql`
- Query Functions: `/lib/supabase/queries/integration-settings.ts`
- Polling Service: `/lib/tagoio/polling-service.ts`

**Contact:**
For issues or questions about this feature, reference this document and the implementation files listed above.
