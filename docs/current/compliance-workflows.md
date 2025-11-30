# Compliance Workflows - TRAZO

**Last Updated:** November 17, 2025
**Applies To:** Metrc-integrated cannabis operations

This guide covers daily compliance workflows for Metrc integration, including creating packages, managing inventory, and handling transfers.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Automatic Sync Workflows](#automatic-sync-workflows)
4. [Manual Operations](#manual-operations)
5. [Common Scenarios](#common-scenarios)
6. [Troubleshooting](#troubleshooting)

---

## Overview

TRAZO's compliance engine automates most Metrc interactions, but some operations may require manual intervention. This guide explains when automation triggers and how to perform manual operations when needed.

### Automatic vs Manual Operations

**Automatic (Background Sync):**
- Pull data from Metrc (packages, plants, harvests)
- Push new inventory lots to Metrc (cannabis jurisdictions)
- Update package quantities when inventory changes
- Sync status tracking and error handling

**Manual Operations:**
- Push specific lots to Metrc (if auto-push failed)
- Create plant batches
- Record harvests
- Generate transfer manifests
- Adjust package quantities

---

## Prerequisites

Before using compliance features:

1. **Metrc API Keys Configured**
   - Navigate to **Admin > Compliance > API Keys**
   - Add your facility's vendor and user API keys
   - Validate credentials (green checkmark)

2. **Jurisdiction Set Correctly**
   - Site must be set to a cannabis jurisdiction (OR, CA, etc.)
   - Jurisdiction must have `require_metrc_id: true` in rules

3. **Permissions**
   - User role must have `compliance:sync` permission
   - Typically: Admin, Owner, Compliance QA roles

---

## Automatic Sync Workflows

### 1. Inventory Lot Creation → Metrc Package

**Trigger:** When you create a new inventory lot in a cannabis jurisdiction

**What Happens:**
1. Lot is created in TRAZO database
2. System checks jurisdiction rules
3. If cannabis + Metrc required:
   - Validates lot data
   - Creates Metrc package via API
   - Links lot to Metrc package UID
   - Logs sync operation

**Example:**
```typescript
// In your inventory form
await createLot({
  site_id: siteId,
  item_id: itemId,
  lot_number: 'LOT-2024-001',
  quantity_received: 1000,
  unit_of_measure: 'Grams',
  received_date: '2024-11-17',
  compliance_package_uid: null, // Will be auto-filled by Metrc
})
// ✅ Automatically creates Metrc package in background
```

**Validation Before Push:**
- Lot number is unique
- Quantity > 0
- Unit of measure is valid
- Received date is not in future
- Item exists and is active

**What If It Fails?**
- Lot creation still succeeds (non-blocking)
- Error is logged to `metrc_sync_log`
- Manual push button appears in UI
- Notification sent to compliance team

### 2. Inventory Quantity Update → Metrc Adjustment

**Trigger:** When you update lot quantity

**What Happens:**
1. Lot quantity updated in TRAZO
2. System calculates adjustment amount
3. If linked to Metrc package:
   - Creates adjustment record
   - Pushes to Metrc API
   - Updates sync log

**Example:**
```typescript
// Consuming from lot
await updateLot(lotId, {
  quantity_remaining: 750, // Was 1000, consumed 250
})
// ✅ Automatically adjusts Metrc package quantity
```

---

## Manual Operations

### 1. Manual Lot Push to Metrc

**When to Use:**
- Auto-push failed (check sync dashboard)
- Lot created before Metrc integration enabled
- Retroactive compliance sync

**Steps:**
1. Navigate to **Inventory > Lots**
2. Find lot without Metrc package UID
3. Click **Push to Metrc** button
4. System validates and pushes
5. Success: Metrc package UID appears
6. Failure: Error message with guidance

**UI Component:**
```tsx
import { PushToMetrcButton } from '@/components/features/compliance/push-to-metrc-button'

<PushToMetrcButton
  lotId={lot.id}
  lotNumber={lot.lot_number}
  onPushComplete={() => refreshLots()}
/>
```

### 2. Manual Sync Trigger

**When to Use:**
- Fetch latest data from Metrc
- Before generating compliance reports
- After bulk operations in Metrc UI

**Steps:**
1. Navigate to **Compliance > Sync Dashboard**
2. Click **Sync with Metrc** button
3. Select sync types (packages, plants, harvests)
4. Monitor progress in real-time
5. Review sync log for errors

**API Call:**
```typescript
const response = await fetch('/api/compliance/sync', {
  method: 'POST',
  body: JSON.stringify({
    siteId: currentSiteId,
    syncTypes: ['packages', 'plants', 'harvests'],
  }),
})
```

### 3. Create Plant Batch in Metrc

**Workflow:**
1. Create batch in TRAZO (Batches > New Batch)
2. Set strain, count, location
3. If cannabis jurisdiction:
   - Batch creation triggers Metrc plant batch creation
   - Metrc batch ID stored in TRAZO
   - Sync status tracked

**Manual Push (if auto-push failed):**
```tsx
// Coming in future update
<PushBatchToMetrcButton batchId={batch.id} />
```

### 4. Record Harvest

**Workflow:**
1. Navigate to batch detail page
2. Click **Record Harvest**
3. Enter harvest weight, waste weight
4. Select harvest location
5. If cannabis jurisdiction:
   - Harvest created in TRAZO
   - Metrc harvest created automatically
   - Packages generated from harvest

---

## Common Scenarios

### Scenario 1: Receiving New Inventory

**Steps:**
1. **Receive shipment** (outside TRAZO)
2. **Create inventory lot** in TRAZO
   - Enter lot number, quantity, received date
   - Select item and supplier
   - Add any compliance notes
3. **Automatic**: Metrc package created
4. **Verify**: Check Metrc package UID populated
5. **Troubleshoot**: If UID missing, use manual push button

**Validation Checklist:**
- ✅ Lot number unique
- ✅ Quantity > 0
- ✅ Valid unit of measure (Grams, Ounces, etc.)
- ✅ Received date not in future
- ✅ Metrc tag available (if required)

### Scenario 2: Daily Inventory Usage

**Steps:**
1. **Use inventory** in TRAZO (e.g., for production batch)
2. **Automatic**: Lot quantity decremented
3. **Automatic**: Metrc package quantity adjusted
4. **Verify**: Check sync log for success

**No Manual Action Required** ✨

### Scenario 3: Month-End Reconciliation

**Steps:**
1. **Navigate** to Compliance > Sync Dashboard
2. **Trigger sync**: Click "Sync with Metrc"
3. **Wait**: Sync completes (usually <5 min for 1000 packages)
4. **Review**: Check sync log for discrepancies
5. **Reconcile**: Investigate any errors or mismatches
6. **Generate report**: Export for compliance review

### Scenario 4: Transfer to Another Facility

**Steps:**
1. **Create transfer** in TRAZO
2. **Select packages** to transfer
3. **Enter destination** facility details
4. **Automatic**: Metrc transfer manifest created
5. **Print manifest**: For driver/inspector
6. **Track**: Monitor transfer status in Metrc

**Coming in Phase 4:**
- Transfer manifest generation UI
- Real-time transfer tracking
- Automatic acceptance at destination

---

## Troubleshooting

### Error: "Invalid Metrc credentials"

**Cause:** API keys expired or incorrect

**Solution:**
1. Navigate to Admin > Compliance > API Keys
2. Click "Validate" next to your API key
3. If validation fails, re-enter keys
4. Contact Metrc support if issue persists

### Error: "Package tag not available"

**Cause:** Metrc tag not assigned to lot

**Solution:**
1. Obtain Metrc tags from state
2. Update lot with `compliance_package_uid`
3. Retry push to Metrc

### Error: "Quantity exceeds available inventory"

**Cause:** Trying to create package larger than source lot

**Solution:**
1. Check source lot `quantity_remaining`
2. Adjust package quantity
3. Split into multiple packages if needed

### Lot Not Pushing to Metrc

**Troubleshooting Steps:**
1. **Check jurisdiction**: Is it cannabis + Metrc required?
2. **Check API keys**: Are they valid and not expired?
3. **Check sync log**: Any error messages?
4. **Check validation**: Does lot pass all validators?
5. **Manual push**: Try pushing manually via UI button
6. **Contact support**: If issue persists

**Check Sync Log:**
```sql
SELECT * FROM metrc_sync_log
WHERE site_id = 'your-site-id'
ORDER BY started_at DESC
LIMIT 10;
```

### Sync Taking Too Long

**Normal:**
- 100 packages: ~30 seconds
- 1000 packages: ~5 minutes
- 5000 packages: ~20 minutes

**Too Slow:**
1. Check network connection
2. Check Metrc API status (status.metrc.com)
3. Reduce sync batch size (future feature)
4. Contact TRAZO support

---

## Validation Rules

### Package Creation

| Field | Validation |
|-------|-----------|
| Tag | 24 alphanumeric characters |
| Item | Must exist in Metrc |
| Quantity | Positive number |
| Unit of Measure | Valid Metrc unit |
| Packaged Date | YYYY-MM-DD, not future |

### Plant Batch Creation

| Field | Validation |
|-------|-----------|
| Name | Unique per facility |
| Type | "Seed" or "Clone" |
| Count | Positive integer |
| Strain | Must exist in Metrc |
| Location | Valid facility location |
| Planted Date | YYYY-MM-DD, not future |

### Adjustments

| Field | Validation |
|-------|-----------|
| Label | Valid Metrc tag |
| Quantity | Can be negative |
| Adjustment Reason | Required |
| Adjustment Date | YYYY-MM-DD, not future |
| Reason Note | Optional, but recommended |

---

## Best Practices

1. **Sync Daily**: Trigger manual sync once per day minimum
2. **Monitor Errors**: Check sync dashboard for failures
3. **Validate Before Push**: Ensure data is correct before creating lots
4. **Use Lot Numbers**: Consistent naming convention (e.g., LOT-YYYY-MM-NNN)
5. **Document Discrepancies**: Note any Metrc mismatches for audit
6. **Test in Sandbox**: Use sandbox environment before going live
7. **Train Staff**: Ensure compliance team understands workflows

---

## Getting Help

**Documentation:**
- [Compliance Setup](./compliance-setup.md) - Initial configuration
- [Compliance Sync](./compliance-sync.md) - Sync operations
- [Metrc API Alignment](../roadmap/reference/METRC_API_ALIGNMENT.md) - Technical details

**Support:**
- Check sync dashboard for specific error messages
- Review sync log for operation history
- Contact TRAZO support: support@trazo.com
- Metrc support: support@metrc.com (for API issues)

**Compliance Resources:**
- State cannabis regulations
- Metrc user manual
- TRAZO compliance webinars

---

**Next Steps:**
- [Set up API keys](./compliance-setup.md) if not done
- [Configure sync dashboard](./compliance-sync.md) for monitoring
- [Generate first compliance report](./compliance-reporting.md) (Phase 4)
