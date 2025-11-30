# Metrc Compliance Integration - QA Testing Guide

## Overview

This document provides end-to-end testing procedures for the Metrc compliance integration. It covers all features from initial setup through harvest and package creation.

## Prerequisites

### Environment Setup
- [ ] Metrc sandbox credentials configured in `.env`:
  ```
  METRC_API_URL=https://sandbox-api-ca.metrc.com
  METRC_VENDOR_API_KEY=your_vendor_key
  ```
- [ ] Site has Metrc credentials configured (Settings → Compliance → Metrc Configuration)
- [ ] User has `compliance:view` and `compliance:sync` permissions
- [ ] At least one cannabis site created

### Test Data Requirements
- Organization with cannabis license
- At least one active site
- User with admin or compliance role

---

## Test Suite 1: Initial Sync Setup

### 1.1 Sync Strains from Metrc

**Navigation:** Compliance → Metrc Sync Dashboard

**Steps:**
1. Click "Sync Now" button for "Strains" sync type
2. Wait for sync to complete
3. Verify success toast message appears

**Expected Results:**
- [ ] Sync completes without errors
- [ ] Sync history shows successful strains sync entry
- [ ] Strains count displayed in sync result

**Verification Query:**
```sql
SELECT COUNT(*) FROM metrc_strains_cache WHERE site_id = '[your_site_id]';
```

### 1.2 Sync Items from Metrc

**Navigation:** Compliance → Metrc Sync Dashboard

**Steps:**
1. Click "Sync Now" button for "Items" sync type
2. Wait for sync to complete
3. Verify success toast message appears

**Expected Results:**
- [ ] Sync completes without errors
- [ ] Sync history shows successful items sync entry
- [ ] Items count displayed (should include product categories like Flower, Concentrate, etc.)

**Verification Query:**
```sql
SELECT COUNT(*), product_category_name
FROM metrc_items_cache
WHERE site_id = '[your_site_id]'
GROUP BY product_category_name;
```

### 1.3 Sync Locations from Metrc

**Navigation:** Compliance → Metrc Sync Dashboard

**Steps:**
1. Click "Sync Now" button for "Locations" sync type
2. Wait for sync to complete

**Expected Results:**
- [ ] Sync completes without errors
- [ ] Location mappings available for pods

**Verification Query:**
```sql
SELECT * FROM metrc_locations_cache WHERE site_id = '[your_site_id]';
```

---

## Test Suite 2: Cultivar-Strain Linking

### 2.1 View Cached Strains

**Navigation:** Crop Management → Cultivars → Manage Cultivars

**Steps:**
1. Open Cultivar Management dialog
2. Click "Sync Strains from Metrc" button (if strains not loaded)
3. Verify strains appear in dropdown

**Expected Results:**
- [ ] Strains load from cache
- [ ] Strain names display correctly
- [ ] THC/CBD levels shown where available

### 2.2 Link Cultivar to Metrc Strain

**Navigation:** Crop Management → Cultivars → Manage Cultivars

**Steps:**
1. Find an unlinked cultivar (no "Linked" badge)
2. Click on the cultivar card
3. Select a Metrc strain from the dropdown
4. Click "Link" button
5. Verify success toast

**Expected Results:**
- [ ] Cultivar card shows "Linked" badge (green)
- [ ] Metrc strain ID saved to cultivar record
- [ ] Sync status updated to "synced"

**Verification Query:**
```sql
SELECT name, metrc_strain_id, metrc_sync_status
FROM cultivars
WHERE organization_id = '[your_org_id]';
```

### 2.3 Unlink Cultivar from Strain

**Steps:**
1. Find a linked cultivar (has "Linked" badge)
2. Click "Unlink" button
3. Confirm the action
4. Verify badge changes to "Not Linked"

**Expected Results:**
- [ ] Cultivar unlinks successfully
- [ ] Badge changes to amber "Not Linked"
- [ ] metrc_strain_id cleared in database

---

## Test Suite 3: Tag Inventory Management

### 3.1 View Tag Inventory Summary

**Navigation:** Compliance → Tag Inventory

**Steps:**
1. Navigate to Tag Inventory page
2. View Summary tab

**Expected Results:**
- [ ] Plant tags count displays
- [ ] Package tags count displays
- [ ] Status breakdown shows (Available, Assigned, Used)
- [ ] No mock data (values should be 0 if no tags received)

### 3.2 Receive Tags from Metrc

**Steps:**
1. Click "Receive Tags" button
2. Select tag type (Plant or Package)
3. Enter tag numbers (one per line):
   ```
   1A4FF0100000022000001
   1A4FF0100000022000002
   1A4FF0100000022000003
   ```
4. Optionally enter Order Batch Number
5. Click "Receive Tags"

**Expected Results:**
- [ ] Success toast shows count of tags received
- [ ] Tags appear in inventory
- [ ] Summary counts update
- [ ] Tags show status "available"

**Verification Query:**
```sql
SELECT tag_number, tag_type, status
FROM metrc_tag_inventory
WHERE site_id = '[your_site_id]'
ORDER BY created_at DESC
LIMIT 10;
```

### 3.3 View Tag Details

**Steps:**
1. Click "Plant Tags" or "Package Tags" tab
2. View detailed tag list
3. Test search functionality (enter partial tag number)
4. Test status filter (filter by "available")

**Expected Results:**
- [ ] Tags list loads with pagination
- [ ] Search filters results correctly
- [ ] Status filter works
- [ ] Assigned tags show entity reference

---

## Test Suite 4: Batch Compliance Workflow

### 4.1 Create Cannabis Batch with Compliance

**Navigation:** Crop Management → Batches → Create Batch

**Steps:**
1. Create new batch with:
   - Domain: Cannabis
   - Linked cultivar (one linked to Metrc strain)
   - Starting stage: Germination or Clone
   - Assign to pod with Metrc location mapping
2. Save batch

**Expected Results:**
- [ ] Batch created successfully
- [ ] Batch inherits cultivar's Metrc strain link
- [ ] Pod location maps to Metrc location

### 4.2 View Batch Compliance Status

**Navigation:** Crop Management → Batch Details → Compliance Tab

**Steps:**
1. Open batch details
2. Find compliance status panel
3. Review compliance checklist

**Expected Results:**
- [ ] Compliance score displays
- [ ] Cultivar → Strain link status shown
- [ ] Location mapping status shown
- [ ] Plant tags status shown (initially 0/X)

### 4.3 Assign Plant Tags to Batch

**Steps:**
1. From batch details, go to Plants/Tags section
2. Click "Assign Tags"
3. Select available plant tags
4. Confirm assignment

**Expected Results:**
- [ ] Tags assigned to batch
- [ ] Tag status changes from "available" to "assigned"
- [ ] Batch plant_count matches tag count
- [ ] Compliance status updates

**Verification Query:**
```sql
SELECT metrc_plant_labels
FROM batches
WHERE id = '[batch_id]';
```

---

## Test Suite 5: Growth Phase Transitions

### 5.1 Transition to Vegetative Phase

**Navigation:** Crop Management → Batch Details → Stage

**Steps:**
1. Select batch in Germination/Clone stage with tags assigned
2. Click "Advance Stage" or change stage to "Vegetative"
3. Confirm transition

**Expected Results:**
- [ ] Stage transition succeeds
- [ ] Metrc phase sync triggered (check sync log)
- [ ] Sync log shows "plant_growth_phase" entry
- [ ] Metrc batch mapping updated with new phase

**Verification Query:**
```sql
SELECT sync_type, status, response_payload
FROM metrc_sync_log
WHERE local_id = '[batch_id]'
ORDER BY created_at DESC
LIMIT 5;
```

### 5.2 Transition to Flowering Phase

**Steps:**
1. Transition batch from Vegetative to Flowering
2. Verify Metrc sync triggers

**Expected Results:**
- [ ] Phase change synced to Metrc
- [ ] All tagged plants updated
- [ ] Sync log shows success or partial (with retry info)

---

## Test Suite 6: Harvest Workflow

### 6.1 Create Harvest Record

**Navigation:** Crop Management → Batch → Harvest

**Steps:**
1. Select batch in Flowering stage
2. Click "Record Harvest"
3. Enter:
   - Wet weight (grams)
   - Plant count harvested
   - Plant labels being harvested
   - Drying location (must map to Metrc location)
4. Submit harvest

**Expected Results:**
- [ ] Harvest record created
- [ ] Metrc harvest sync triggered
- [ ] Sync log shows "harvest_creation" entry
- [ ] Metrc harvest ID assigned (or PENDING if API fails)

**Verification Query:**
```sql
SELECT h.*, m.metrc_harvest_id, m.metrc_harvest_name
FROM harvest_records h
LEFT JOIN metrc_harvest_mappings m ON h.id = m.harvest_id
WHERE h.batch_id = '[batch_id]';
```

### 6.2 Create Packages from Harvest

**Steps:**
1. From harvest record, click "Create Packages"
2. Enter package details:
   - Package tag (from available tags)
   - Product name (from Metrc items)
   - Quantity and unit of measure
   - Location
3. Submit

**Expected Results:**
- [ ] Package records created
- [ ] Metrc package sync triggered
- [ ] Package tags updated with Metrc reference
- [ ] Package tag status changes to "used"

**Verification Query:**
```sql
SELECT * FROM harvest_packages
WHERE harvest_id = '[harvest_id]';
```

### 6.3 Finish Harvest

**Steps:**
1. After all material packaged
2. Click "Finish Harvest"
3. Enter actual finish date

**Expected Results:**
- [ ] Harvest marked as complete
- [ ] Metrc harvest finish sync triggered
- [ ] Sync log shows "harvest_finish" entry

---

## Test Suite 7: Push Readiness Validation

### 7.1 Check Push Readiness

**Navigation:** Compliance → Metrc Push Readiness

**Steps:**
1. Navigate to Push Readiness component
2. Review all checks

**Expected Results:**
- [ ] Strains Synced: Pass (if strains synced)
- [ ] Items Synced: Pass (if items synced)
- [ ] Locations Synced: Pass/Warning
- [ ] Tags Available: Pass/Warning (shows counts)
- [ ] Cultivars Linked: Pass/Warning (shows linked count)
- [ ] Batches Ready: Pass/Warning (shows tag status)

### 7.2 Resolve Warnings

**Steps:**
1. For each warning, click to expand details
2. Follow remediation steps
3. Click "Re-check" to verify resolution

**Expected Results:**
- [ ] All issues can be resolved
- [ ] Re-check updates status correctly
- [ ] 100% readiness achievable

---

## Test Suite 8: Sync History & Logging

### 8.1 Review Sync History

**Navigation:** Compliance → Metrc Sync Dashboard → History

**Steps:**
1. View sync history table
2. Filter by sync type
3. Review individual sync entries

**Expected Results:**
- [ ] All sync operations logged
- [ ] Status (success/failed/partial) correct
- [ ] Timestamps accurate
- [ ] Error messages captured for failures

### 8.2 Verify Sync Log Details

**Verification Query:**
```sql
SELECT
  sync_type,
  sync_direction,
  status,
  details,
  error_message,
  performed_at,
  performed_by
FROM metrc_sync_log
WHERE organization_id = '[your_org_id]'
ORDER BY performed_at DESC
LIMIT 20;
```

---

## Test Suite 9: Error Handling

### 9.1 Test API Failure Handling

**Steps:**
1. Temporarily invalidate Metrc credentials
2. Attempt a sync operation
3. Verify error handling

**Expected Results:**
- [ ] Clear error message displayed
- [ ] Sync log shows "failed" status
- [ ] Error details captured
- [ ] No data corruption

### 9.2 Test Partial Sync Recovery

**Steps:**
1. Trigger sync with some invalid data
2. Verify partial success handling
3. Check which records succeeded vs failed

**Expected Results:**
- [ ] Partial status logged
- [ ] Valid records processed
- [ ] Invalid records identified
- [ ] Retry mechanism works

---

## Test Suite 10: Data Integrity

### 10.1 Verify Foreign Key Relationships

**Verification Query:**
```sql
-- Check cultivar-strain links
SELECT c.name, c.metrc_strain_id, s.name as strain_name
FROM cultivars c
LEFT JOIN metrc_strains_cache s ON c.metrc_strain_id = s.metrc_strain_id
WHERE c.organization_id = '[your_org_id]';

-- Check batch-mapping relationships
SELECT b.batch_number, m.metrc_batch_id, m.metrc_growth_phase
FROM batches b
LEFT JOIN metrc_batch_mappings m ON b.id = m.batch_id
WHERE b.site_id = '[your_site_id]';
```

### 10.2 Verify Tag Assignment Integrity

**Verification Query:**
```sql
-- Check no duplicate tags
SELECT tag_number, COUNT(*)
FROM metrc_tag_inventory
WHERE site_id = '[your_site_id]'
GROUP BY tag_number
HAVING COUNT(*) > 1;

-- Should return 0 rows
```

---

## Bug Report Template

When reporting issues, include:

```markdown
**Feature:** [e.g., Strain Sync, Tag Assignment]
**Environment:** [Sandbox/Production]
**User Role:** [Admin/Manager/Worker]

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**

**Actual Behavior:**

**Error Messages:**

**Console Logs:**

**Database State:**
[Include relevant query results]

**Screenshots:**
[Attach if applicable]
```

---

## Sign-off Checklist

| Test Suite | Tester | Date | Pass/Fail | Notes |
|------------|--------|------|-----------|-------|
| 1. Initial Sync Setup | | | | |
| 2. Cultivar-Strain Linking | | | | |
| 3. Tag Inventory Management | | | | |
| 4. Batch Compliance Workflow | | | | |
| 5. Growth Phase Transitions | | | | |
| 6. Harvest Workflow | | | | |
| 7. Push Readiness Validation | | | | |
| 8. Sync History & Logging | | | | |
| 9. Error Handling | | | | |
| 10. Data Integrity | | | | |

**QA Approval:** ___________________ Date: ___________

**Notes:**
