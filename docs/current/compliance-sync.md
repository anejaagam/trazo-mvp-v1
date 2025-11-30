# Compliance Data Sync Guide

**Status:** Phase 2 Complete ✅
**Last Updated:** November 17, 2025

---

## Overview

The TRAZO Compliance Sync system automatically synchronizes data between TRAZO and Metrc (and other compliance systems). This ensures your local inventory, plant, and harvest data stays in sync with state-mandated compliance systems.

---

## How Sync Works

### Pull Sync (Metrc → TRAZO)

Pull sync fetches data from Metrc and updates TRAZO's local database:

1. **Scheduled Sync** - Runs automatically every hour for all active sites
2. **Manual Sync** - Triggered from the Compliance Sync Dashboard
3. **Date-Filtered Sync** - Sync only data modified within a specific date range

### Supported Data Types

- **Packages** ✅ (Phase 2 Complete)
  - Active packages
  - Inactive packages
  - Packages on hold
  - Packages in transit

- **Plants** (Coming in Phase 3)
- **Plant Batches** (Coming in Phase 3)
- **Harvests** (Coming in Phase 3)
- **Transfers** (Coming in Phase 3)
- **Sales** (Coming in Phase 3)

---

## Using the Sync Dashboard

### Accessing the Sync Dashboard

1. Navigate to **Dashboard → Compliance → Sync**
2. Requires `compliance:view` permission (minimum)
3. Manual sync requires `compliance:sync` permission

### Manual Sync

To trigger a manual sync:

1. Select a **Site** from the dropdown
2. Select a **Sync Type** (e.g., Packages)
3. Click **"Sync Now"**
4. Monitor progress in the Sync History section

### Sync History

The Sync History shows:

- Recent sync operations for the selected site
- Sync status (Completed, Failed, In Progress, Partial)
- Direction (Pull, Push, Bidirectional)
- Timestamp and duration
- Error messages (if any)

---

## Sync Statuses

| Status | Description |
|--------|-------------|
| **Pending** | Sync has been queued but not started |
| **In Progress** | Sync is currently running |
| **Completed** | Sync finished successfully with no errors |
| **Partial** | Sync completed but some items had errors |
| **Failed** | Sync failed completely |

---

## Package Sync Details

### What Gets Synced

When you sync packages:

1. **Fetch from Metrc**
   - All active packages for the selected facility
   - Optional date filter for recent changes

2. **Map to TRAZO**
   - Creates new inventory lots for packages not in TRAZO
   - Updates existing inventory lots if mapping exists
   - Links Metrc package to TRAZO inventory lot via `metrc_package_mappings` table

3. **Track Changes**
   - Logs all sync operations in `metrc_sync_log` table
   - Records successes, failures, and partial completions
   - Provides detailed error messages for troubleshooting

### Sync Results

After a sync completes, you'll see:

- **Packages Processed** - Total packages fetched from Metrc
- **Packages Created** - New inventory lots created in TRAZO
- **Packages Updated** - Existing inventory lots updated
- **Errors** - Any issues encountered during sync

---

## Date-Filtered Sync

To sync only recent changes:

```typescript
// Via API (programmatic usage)
POST /api/compliance/sync
{
  "siteId": "site-uuid",
  "syncType": "packages",
  "lastModifiedStart": "2024-11-01",
  "lastModifiedEnd": "2024-11-17"
}
```

**Benefits:**
- Faster sync times
- Reduced API load
- Focus on recent changes

**Default Range:**
- Last 7 days if no date filters provided

---

## Scheduled Sync (Coming Soon)

**Note:** Scheduled sync functionality will be added in a future update using Vercel Cron or a queue system.

**Planned Features:**
- Hourly sync for active facilities
- Configurable sync schedules per site
- Automatic retry for failed syncs
- Email alerts for repeated failures

---

## Troubleshooting

### "No active Metrc API key found"

**Problem:** Site doesn't have valid Metrc credentials configured

**Solution:**
1. Navigate to **Dashboard → Admin → Compliance**
2. Add API keys for the site
3. Validate credentials before saving

### "Sync Failed" with Network Error

**Problem:** Unable to reach Metrc API

**Solution:**
- Check internet connection
- Verify Metrc service status
- Confirm API keys are correct
- Check if using correct environment (sandbox vs production)

### "Partial" Status with Errors

**Problem:** Some packages synced successfully, others failed

**Solution:**
1. Review error messages in sync history
2. Common issues:
   - Invalid product names in Metrc
   - Missing required fields
   - Data type mismatches
3. Fix issues in Metrc and re-sync

### Duplicate Inventory Lots

**Problem:** Multiple inventory lots created for same Metrc package

**Solution:**
- This shouldn't happen due to unique constraints
- If it does, contact support with sync log ID
- May indicate mapping corruption

---

## Data Mapping

### Metrc Package → TRAZO Inventory Lot

| Metrc Field | TRAZO Field | Notes |
|-------------|-------------|-------|
| `Id` | `metrc_package_mappings.metrc_package_id` | Unique Metrc ID |
| `Label` | `compliance_package_uid` | RFID tag label |
| `Item` | `product_name` | Product/strain name |
| `Quantity` | `quantity` | Current quantity |
| `UnitOfMeasure` | `unit_of_measure` | Grams, Ounces, etc. |
| `PackagedDate` | `created_at` | When package was created |
| `IsInTransit` | `status` = 'in_transit' | Package in transfer |
| `IsOnHold` | `status` = 'on_hold' | Package quarantined |

---

## API Reference

### POST /api/compliance/sync

Trigger a manual sync operation.

**Request Body:**
```json
{
  "siteId": "uuid",
  "syncType": "packages",
  "lastModifiedStart": "2024-11-01",  // Optional
  "lastModifiedEnd": "2024-11-17"      // Optional
}
```

**Response:**
```json
{
  "success": true,
  "syncType": "packages",
  "result": {
    "success": true,
    "packagesProcessed": 150,
    "packagesCreated": 10,
    "packagesUpdated": 140,
    "errors": [],
    "syncLogId": "uuid"
  },
  "startedAt": "2024-11-17T10:00:00Z",
  "completedAt": "2024-11-17T10:02:15Z",
  "duration": 135000
}
```

**Required Permissions:**
- `compliance:sync`

---

## Database Tables

### metrc_sync_log

Tracks all sync operations:

- `id` - Unique sync log ID
- `site_id` - Site being synced
- `sync_type` - Type of data (packages, plants, etc.)
- `direction` - pull, push, or bidirectional
- `operation` - create, update, delete, sync
- `status` - pending, in_progress, completed, failed, partial
- `started_at` - When sync started
- `completed_at` - When sync finished
- `error_message` - Error details if failed
- `response_payload` - Sync results (JSONB)

### metrc_package_mappings

Links Metrc packages to TRAZO inventory lots:

- `id` - Unique mapping ID
- `inventory_lot_id` - TRAZO inventory lot reference
- `metrc_package_id` - Metrc package ID
- `metrc_package_label` - Metrc RFID tag label
- `last_synced_at` - Last successful sync time
- `sync_status` - synced, pending, conflict, error

---

## Best Practices

1. **Regular Syncs**
   - Run manual sync at start of day
   - Review sync history for errors
   - Address failures promptly

2. **Monitor Sync Health**
   - Check sync dashboard daily
   - Set up alerts for repeated failures
   - Keep API keys up to date

3. **Data Validation**
   - Verify inventory counts match Metrc
   - Run reconciliation reports weekly
   - Report discrepancies early

4. **Credential Management**
   - Use sandbox for testing
   - Rotate API keys periodically
   - Limit access to admin/compliance roles

---

## Next Steps

After setting up sync:

1. **Phase 3:** Configure push sync (TRAZO → Metrc)
2. **Phase 4:** Generate compliance reports
3. **Phase 5:** Set up reconciliation and evidence vault

---

## Support

For assistance with compliance sync:

- **TRAZO Docs:** [Compliance Setup Guide](./compliance-setup.md)
- **Metrc API:** https://api-or.metrc.com/Documentation (requires login)
- **Troubleshooting:** [Compliance Troubleshooting](./compliance-troubleshooting.md) (coming soon)

---

**Status:** ✅ Phase 2 Complete - Pull Sync Operational
