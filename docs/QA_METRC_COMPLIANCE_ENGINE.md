# QA Test Plan: Metrc Compliance Engine

**Document Version:** 1.0
**Date:** November 26, 2025
**Module:** Phase 3.5 - Metrc Compliance Engine
**Status:** Ready for Testing

---

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Scope](#test-scope)
4. [Test Cases](#test-cases)
5. [Validation Rules Reference](#validation-rules-reference)
6. [Database Verification Queries](#database-verification-queries)
7. [Known Limitations](#known-limitations)
8. [Defect Reporting](#defect-reporting)

---

## Overview

### Purpose
This document provides comprehensive test cases for the Metrc Compliance Engine integration in TRAZO. The engine enables automatic synchronization of cannabis cultivation data with state-mandated Metrc tracking systems.

### Features Under Test
- Metrc API credential management
- Cultivar-to-Strain synchronization
- Batch lifecycle sync (plant batches, growth phases)
- Harvest workflow sync
- Package creation and tracking
- Lab test result integration
- Production batch management
- Validation rules for compliance data

### API Coverage
| Endpoint Category | Operations | Status |
|-------------------|------------|--------|
| Strains | Create, Update, Read | Implemented |
| Items | Create, Update, Read | Implemented |
| Plant Batches | Create, Change Phase, Destroy | Implemented |
| Plants | Move, Manicure, Harvest | Implemented |
| Harvests | Create, Package | Implemented |
| Packages | Create, Adjust, Transfer | Implemented |
| Lab Tests | Read-Only | Implemented |
| Transfers | Create, Update | Implemented |
| Production Batches | Full CRUD | Implemented |
| Tags | Inventory Management | Implemented |
| Locations | Read, Map | Implemented |

---

## Test Environment Setup

### Prerequisites

1. **User Account Requirements**
   - Admin or Owner role user for API key management
   - Standard user for basic operations
   - Test organization with at least one site configured

2. **Metrc Sandbox Credentials**
   - Vendor API Key (from Metrc)
   - User API Key (from Metrc)
   - Valid license number

3. **Database State**
   Verify migrations are applied by running:
   ```sql
   SELECT
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'production_batches') as production_batches,
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metrc_strains_cache') as strains_cache,
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metrc_items_cache') as items_cache,
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultivars' AND column_name = 'metrc_strain_id') as cultivar_metrc_column;
   ```
   **Expected:** All values should be `true`

### Test Data Requirements

| Data Type | Minimum Required | Notes |
|-----------|------------------|-------|
| Cultivars | 3 | At least 1 synced to Metrc |
| Batches | 2 | Various growth stages |
| Harvest Records | 1 | With packages |
| Plant Tags | 10 | Available in Metrc |
| Package Tags | 5 | Available in Metrc |

---

## Test Scope

### In Scope
- UI workflows for compliance features
- API validation rules
- Database state verification
- Sync status tracking
- Error handling and display

### Out of Scope
- Metrc API performance testing
- Load testing
- Security penetration testing
- Mobile responsiveness

---

## Test Cases

### TC-001: API Key Configuration

| Field | Value |
|-------|-------|
| **ID** | TC-001 |
| **Title** | Configure Metrc API Credentials |
| **Priority** | Critical |
| **Preconditions** | User logged in as Admin/Owner |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/admin/compliance` | Page loads with "Compliance API Keys" header |
| 2 | Click "Add API Key" button | Modal/form appears for credential entry |
| 3 | Enter valid Vendor API Key | Field accepts input |
| 4 | Enter valid User API Key | Field accepts input |
| 5 | Select associated site/license | Dropdown populated with user's sites |
| 6 | Click "Save" | Success toast appears, key saved with masked display |
| 7 | Click "Test Connection" | Success message: "Connection successful" |

**Verification Query:**
```sql
SELECT site_id, created_at, is_active
FROM integration_settings
WHERE integration_type = 'metrc'
ORDER BY created_at DESC LIMIT 1;
```

---

### TC-002: API Connection Failure Handling

| Field | Value |
|-------|-------|
| **ID** | TC-002 |
| **Title** | Handle Invalid API Credentials |
| **Priority** | High |
| **Preconditions** | API key form accessible |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter invalid Vendor API Key | Field accepts input |
| 2 | Enter invalid User API Key | Field accepts input |
| 3 | Click "Save" | Credentials saved |
| 4 | Click "Test Connection" | Error message: "Authentication failed" or similar |
| 5 | Verify error is logged | Sync log entry shows failure |

---

### TC-003: Cultivar-Strain Sync

| Field | Value |
|-------|-------|
| **ID** | TC-003 |
| **Title** | Sync Cultivar to Metrc Strain |
| **Priority** | Critical |
| **Preconditions** | Valid API credentials configured |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/cultivars` | Cultivar list displays |
| 2 | Identify cultivar with `metrc_sync_status = 'not_synced'` | Column shows "Not Synced" |
| 3 | Click cultivar row or "Sync" action | Sync initiated |
| 4 | Wait for sync completion | Status changes to "Synced" |
| 5 | Verify `metrc_strain_id` populated | Non-null integer value |

**Verification Query:**
```sql
SELECT id, name, metrc_strain_id, metrc_sync_status, metrc_last_synced_at
FROM cultivars
WHERE name = '[CULTIVAR_NAME]';
```

---

### TC-004: Strain Validation - Empty Name

| Field | Value |
|-------|-------|
| **ID** | TC-004 |
| **Title** | Validate Strain Name Required |
| **Priority** | High |
| **Type** | Negative Test |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Attempt to create strain with empty name | Validation error appears |
| 2 | Check error message | "Strain name is required" or "Name cannot be empty" |
| 3 | Verify sync does not proceed | No Metrc API call made |

---

### TC-005: Strain Validation - Name Length

| Field | Value |
|-------|-------|
| **ID** | TC-005 |
| **Title** | Validate Strain Name Max Length |
| **Priority** | Medium |
| **Type** | Boundary Test |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create strain with exactly 100 characters | Validation passes |
| 2 | Create strain with 101 characters | Validation error: "NAME_TOO_LONG" |

---

### TC-006: Batch Creation with Synced Cultivar

| Field | Value |
|-------|-------|
| **ID** | TC-006 |
| **Title** | Create Batch with Metrc-Linked Cultivar |
| **Priority** | Critical |
| **Preconditions** | At least one cultivar synced to Metrc |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/batches/new` | New batch form loads |
| 2 | Select cultivar with `metrc_strain_id` | Cultivar selected, no warnings |
| 3 | Enter plant count (e.g., 10) | Field accepts value |
| 4 | Select site and location | Locations load from site |
| 5 | Click "Create Batch" | Batch created successfully |
| 6 | Verify Metrc sync status | `metrc_sync_status = 'pending'` or 'synced' |

**Verification Query:**
```sql
SELECT b.batch_number, b.metrc_plant_batch_id, b.metrc_sync_status,
       c.name as cultivar_name, c.metrc_strain_id
FROM batches b
JOIN cultivars c ON b.cultivar_id = c.id
WHERE b.id = '[BATCH_ID]';
```

---

### TC-007: Batch Creation with Unsynced Cultivar

| Field | Value |
|-------|-------|
| **ID** | TC-007 |
| **Title** | Warning for Unsynced Cultivar |
| **Priority** | High |
| **Type** | Warning Validation |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/batches/new` | New batch form loads |
| 2 | Select cultivar WITHOUT `metrc_strain_id` | Cultivar selected |
| 3 | Observe warnings | Warning: "Cultivar not linked to Metrc strain" |
| 4 | Proceed with batch creation | Batch created (warning only, not blocking) |

---

### TC-008: Growth Phase Transition

| Field | Value |
|-------|-------|
| **ID** | TC-008 |
| **Title** | Sync Growth Phase Changes to Metrc |
| **Priority** | Critical |
| **Preconditions** | Batch exists in Vegetative stage |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/batches/[batchId]` | Batch detail page loads |
| 2 | Click "Advance Stage" or similar | Stage transition modal appears |
| 3 | Select "Flowering" stage | Stage selected |
| 4 | Confirm transition | Stage updated locally |
| 5 | Verify Metrc sync | Phase change synced to Metrc |
| 6 | Check sync log | Entry shows "Growth Phase Changed" |

**Verification Query:**
```sql
SELECT stage, metrc_growth_phase, updated_at
FROM batches WHERE id = '[BATCH_ID]';

SELECT * FROM metrc_sync_log
WHERE entity_type = 'batch' AND entity_id = '[BATCH_ID]'
ORDER BY created_at DESC LIMIT 5;
```

---

### TC-009: Harvest Workflow

| Field | Value |
|-------|-------|
| **ID** | TC-009 |
| **Title** | Complete Harvest with Metrc Sync |
| **Priority** | Critical |
| **Preconditions** | Batch in Flowering stage, ready for harvest |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/batches/harvest` | Harvest page loads |
| 2 | Select batch for harvest | Batch selected |
| 3 | Enter wet weight (e.g., 5000g) | Field accepts value |
| 4 | Enter dry weight (e.g., 1000g) | Field accepts value |
| 5 | Select plants to harvest | Plants selected |
| 6 | Click "Create Harvest" | Harvest record created |
| 7 | Verify Metrc sync | Manicure batch created in Metrc |

**Verification Query:**
```sql
SELECT h.id, h.wet_weight, h.dry_weight, h.metrc_harvest_id, h.metrc_sync_status
FROM harvest_records h
WHERE h.batch_id = '[BATCH_ID]';
```

---

### TC-010: Package Creation from Harvest

| Field | Value |
|-------|-------|
| **ID** | TC-010 |
| **Title** | Create Packages with Validation |
| **Priority** | Critical |
| **Preconditions** | Harvest record exists |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | From harvest detail, click "Create Package" | Package form appears |
| 2 | Enter product name "Blue Dream - Flower" | Field accepts value |
| 3 | Enter quantity (e.g., 500) | Field accepts value |
| 4 | Select unit "Grams" | Unit selected |
| 5 | Enter package tag (valid 24-char) | Tag accepted |
| 6 | Click "Create Package" | Package created |
| 7 | Verify Metrc sync | Package synced to Metrc |

---

### TC-011: Package Validation - Invalid Quantity

| Field | Value |
|-------|-------|
| **ID** | TC-011 |
| **Title** | Validate Package Quantity |
| **Priority** | High |
| **Type** | Negative Test |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create package with quantity = 0 | Validation error: "INVALID_QUANTITY" |
| 2 | Create package with quantity = -5 | Validation error: "INVALID_QUANTITY" |
| 3 | Create package with quantity > 10000 | Warning: "LARGE_QUANTITY" (not blocking) |

---

### TC-012: Package Validation - Invalid Unit

| Field | Value |
|-------|-------|
| **ID** | TC-012 |
| **Title** | Validate Package Unit of Measure |
| **Priority** | Medium |
| **Type** | Negative Test |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create package with unit "InvalidUnit" | Validation error: "INVALID_UNIT" |
| 2 | Create package with unit "Grams" | Validation passes |
| 3 | Create package with unit "Each" | Validation passes |

---

### TC-013: Item Category Strain Requirement

| Field | Value |
|-------|-------|
| **ID** | TC-013 |
| **Title** | Validate Strain Required for Category |
| **Priority** | High |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create item with category "Buds" without strain | Validation error: "STRAIN_REQUIRED" |
| 2 | Create item with category "Buds" with strain | Validation passes |
| 3 | Create item with category "Edibles" with strain | Warning: "STRAIN_NOT_REQUIRED" |

---

### TC-014: Lab Test Results Display

| Field | Value |
|-------|-------|
| **ID** | TC-014 |
| **Title** | View Lab Test Results from Metrc |
| **Priority** | High |
| **Preconditions** | Package with lab test results in Metrc |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/lab-tests` | Lab tests list loads |
| 2 | Click on package with results | Detail page loads |
| 3 | Verify THC percentage displayed | Value matches Metrc |
| 4 | Verify CBD percentage displayed | Value matches Metrc |
| 5 | Verify Pass/Fail status | Status matches Metrc |

---

### TC-015: Compliance Sync Dashboard

| Field | Value |
|-------|-------|
| **ID** | TC-015 |
| **Title** | Review Sync Operations |
| **Priority** | Medium |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/compliance/sync` | Sync dashboard loads |
| 2 | Select "Metrc Sync" tab | Sync log displayed |
| 3 | Verify recent operations listed | Chronological entries |
| 4 | Check failed sync entry | Error details visible |
| 5 | Click "Sync Now" (if available) | Manual sync initiated |

---

### TC-016: Tag Inventory

| Field | Value |
|-------|-------|
| **ID** | TC-016 |
| **Title** | View Available Metrc Tags |
| **Priority** | Medium |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/compliance/sync` | Page loads |
| 2 | Select "Tag Inventory" tab | Tag list displayed |
| 3 | Verify plant tags shown | Tags with status |
| 4 | Verify package tags shown | Tags with status |
| 5 | Check used/available counts | Counts accurate |

---

### TC-017: Production Recipe Creation

| Field | Value |
|-------|-------|
| **ID** | TC-017 |
| **Title** | Create Production Recipe |
| **Priority** | Medium |
| **Note** | UI may require API/database testing |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create recipe via API or SQL | Recipe created |
| 2 | Verify recipe in database | Record exists |
| 3 | Verify production_type constraint | Only valid types accepted |

**Test Query:**
```sql
INSERT INTO production_recipes (
  organization_id, name, production_type, output_product_type
) VALUES (
  '[ORG_ID]', 'CO2 Extraction', 'extraction', 'concentrate'
) RETURNING id, name;
```

---

### TC-018: Production Batch Creation

| Field | Value |
|-------|-------|
| **ID** | TC-018 |
| **Title** | Create Production Batch |
| **Priority** | Medium |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create production batch | Batch created |
| 2 | Verify auto-generated batch_number | Format: PROD-YYYY-MM-XXXXX |
| 3 | Add input packages | Inputs linked |
| 4 | Complete production | Status = 'completed' |

**Test Query:**
```sql
INSERT INTO production_batches (
  organization_id, site_id, production_type, started_at
) VALUES (
  '[ORG_ID]', '[SITE_ID]', 'extraction', NOW()
) RETURNING id, batch_number;
```

---

### TC-019: Batch Strain Validation

| Field | Value |
|-------|-------|
| **ID** | TC-019 |
| **Title** | Validate Batch Strain Requirements |
| **Priority** | High |

**Test Cases:**
| Scenario | Input | Expected |
|----------|-------|----------|
| Missing cultivar | `cultivar_name: ''` | Error: MISSING_STRAIN |
| Unlinked cultivar | `metrc_strain_id: null` | Warning: STRAIN_NOT_LINKED |
| Linked cultivar | `metrc_strain_id: 12345` | Pass, no warnings |

---

### TC-020: Duplicate Strain Detection

| Field | Value |
|-------|-------|
| **ID** | TC-020 |
| **Title** | Detect Duplicate Strain Names in Batch |
| **Priority** | Medium |

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit batch with duplicate strain names | Validation error |
| 2 | Check error code | "DUPLICATE_NAMES" |
| 3 | Check duplicate names listed | Names shown in error message |

---

## Validation Rules Reference

### Strain Validation Rules

| Rule | Code | Severity | Message |
|------|------|----------|---------|
| Name required | EMPTY_NAME | Error | Strain name cannot be empty |
| Name max 100 chars | NAME_TOO_LONG | Error | Strain name must not exceed 100 characters |
| Special characters | SPECIAL_CHARACTERS_IN_NAME | Warning | Name contains special characters |
| THC range 0-100 | INVALID_THC_LEVEL | Error | THC level must be between 0 and 100 |
| CBD range 0-100 | INVALID_CBD_LEVEL | Error | CBD level must be between 0 and 100 |
| Indica/Sativa sum | PERCENTAGE_SUM_MISMATCH | Warning | Indica + Sativa should equal 100% |
| Invalid testing status | INVALID_TESTING_STATUS | Warning | Testing status may not be recognized |

### Item Validation Rules

| Rule | Code | Severity | Message |
|------|------|----------|---------|
| Category required | - | Error | ItemCategory is required |
| Name required | EMPTY_NAME | Error | Name is required |
| Name max 150 chars | NAME_TOO_LONG | Error | Name must not exceed 150 characters |
| Strain required for category | STRAIN_REQUIRED | Error | Strain required for this category |
| Unknown category | UNRECOGNIZED_CATEGORY | Warning | Category may not be recognized |
| Unknown unit | UNRECOGNIZED_UNIT | Warning | Unit of measure may not be recognized |

### Package Validation Rules

| Rule | Code | Severity | Message |
|------|------|----------|---------|
| Product name required | - | Error | Product name is required |
| Quantity > 0 | INVALID_QUANTITY | Error | Quantity must be positive |
| Large quantity | LARGE_QUANTITY | Warning | Unusually large quantity |
| Invalid unit | INVALID_UNIT | Error | Unit of measure not recognized |
| Tag required | - | Error | Package tag is required |
| Short tag | SHORT_TAG | Warning | Tag may be invalid format |

### Batch Validation Rules

| Rule | Code | Severity | Message |
|------|------|----------|---------|
| Empty batch array | EMPTY_ARRAY | Error | At least one item required |
| Batch size > 100 | BATCH_SIZE_EXCEEDED | Error | Batch limited to 100 items |
| Duplicate names | DUPLICATE_NAMES | Error | Duplicate names found |

---

## Database Verification Queries

### Check Overall Sync Status
```sql
SELECT
  'Batches' as entity,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE metrc_sync_status = 'synced') as synced,
  COUNT(*) FILTER (WHERE metrc_sync_status = 'pending') as pending,
  COUNT(*) FILTER (WHERE metrc_sync_status = 'failed') as failed
FROM batches
UNION ALL
SELECT
  'Harvests',
  COUNT(*),
  COUNT(*) FILTER (WHERE metrc_sync_status = 'synced'),
  COUNT(*) FILTER (WHERE metrc_sync_status = 'pending'),
  COUNT(*) FILTER (WHERE metrc_sync_status = 'failed')
FROM harvest_records
UNION ALL
SELECT
  'Packages',
  COUNT(*),
  COUNT(*) FILTER (WHERE metrc_sync_status = 'synced'),
  COUNT(*) FILTER (WHERE metrc_sync_status = 'pending'),
  COUNT(*) FILTER (WHERE metrc_sync_status = 'failed')
FROM harvest_packages;
```

### Check Recent Sync Errors
```sql
SELECT entity_type, entity_id, operation, error_message, created_at
FROM metrc_sync_log
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

### Verify Cultivar-Strain Mapping
```sql
SELECT
  c.name as cultivar_name,
  c.metrc_strain_id,
  c.metrc_sync_status,
  s.name as cached_strain_name
FROM cultivars c
LEFT JOIN metrc_strains_cache s ON c.metrc_strain_id = s.metrc_strain_id
WHERE c.organization_id = '[ORG_ID]';
```

### Check Production Tables
```sql
SELECT
  (SELECT COUNT(*) FROM production_recipes WHERE organization_id = '[ORG_ID]') as recipes,
  (SELECT COUNT(*) FROM production_batches WHERE organization_id = '[ORG_ID]') as batches,
  (SELECT COUNT(*) FROM production_batch_inputs) as inputs,
  (SELECT COUNT(*) FROM production_batch_outputs) as outputs;
```

---

## Known Limitations

1. **Lab Tests Read-Only**: Lab test results are fetched from Metrc but cannot be created/modified through TRAZO.

2. **Tag Assignment**: Plant/package tags must exist in Metrc before assignment in TRAZO.

3. **Production Batches UI**: Full UI for production batch management may be in development. Backend functionality is complete.

4. **Sync Timing**: Background sync operations may have slight delays. Allow 30-60 seconds for sync completion.

5. **Rate Limiting**: Metrc API has rate limits. Bulk operations may be throttled.

---

## Defect Reporting

### Severity Definitions

| Severity | Definition | Example |
|----------|------------|---------|
| Critical | System unusable, data loss | Sync corrupts data |
| High | Major feature broken | Cannot create batches |
| Medium | Feature works with workaround | Validation message unclear |
| Low | Minor issue, cosmetic | Typo in label |

### Required Information

When reporting defects, include:
- Test Case ID (e.g., TC-006)
- Steps to reproduce
- Expected vs. Actual result
- Screenshots (if UI issue)
- Database state (query results)
- Browser/environment details
- Metrc sync log entries (if applicable)

### Defect Template
```
**Test Case:** TC-XXX
**Severity:** High/Medium/Low
**Summary:** Brief description

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:** What should happen

**Actual Result:** What actually happened

**Environment:**
- Browser: Chrome 120
- User Role: Admin
- Site: Test Site 1

**Attachments:**
- screenshot.png
- sync_log.txt
```

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Dev Lead | | | |
| Product Owner | | | |

---

*Document generated for TRAZO Metrc Compliance Engine Phase 3.5*
