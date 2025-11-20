# Week 6 Testing Guide - Waste & Destruction Management

**Created**: November 18, 2025
**Purpose**: Manual testing checklist for Week 6 implementation

---

## 🧪 Pre-Testing Setup

### 1. Run Unit Tests
```bash
npm test -- waste-destruction-rules.test.ts
```
**Expected Result**: All 20+ tests pass ✅

### 2. Verify Database Migration
```bash
# Check if waste_logs table has new columns
# Check if waste_destruction_events table exists
# Check if rendering_method_compliance view exists
```

### 3. Ensure Test Data
You need:
- At least one cannabis batch with plant_count > 0
- At least one batch synced to Metrc (optional, for full testing)
- At least one batch with plant tags assigned (optional)

---

## 📋 Manual Testing Checklist

### Test 1: Access Destroy Plants Button
**Steps**:
1. Navigate to a cannabis batch detail page
2. Verify "Destroy Plants" button appears in action buttons row
3. Button should only appear if:
   - `domain_type === 'cannabis'`
   - `plant_count > 0`

**Expected**:
- ✅ Button visible for cannabis batches with plants
- ✅ Button NOT visible for produce batches
- ✅ Button NOT visible for batches with 0 plants

---

### Test 2: Basic Plant Destruction (Valid Input)
**Steps**:
1. Click "Destroy Plants" button
2. Dialog opens showing:
   - Batch number
   - Current plant count
   - Plant tags available count
3. Fill in form:
   - Plants Destroyed: `5`
   - Waste Weight: `2.5`
   - Unit: `Kilograms`
   - Waste Reason: `Male Plants`
   - Rendering Method: `50:50 Mix with Sawdust`
   - Inert Material Weight: `2.5`
   - Destruction Date: Today's date
   - Notes: "Test destruction"
4. Click "Destroy & Log Waste"

**Expected Results**:
- ✅ Success toast: "Waste log WST-2025-11-XXXXX created successfully"
- ✅ Dialog closes
- ✅ Batch plant count decreased by 5
- ✅ Batch detail page refreshes
- ✅ New waste log exists in database
- ✅ New destruction event exists in database
- ✅ Batch event created

**Database Verification**:
```sql
-- Check waste log created
SELECT waste_number, waste_category, rendering_method, quantity
FROM waste_logs
WHERE batch_id = 'your-batch-id'
ORDER BY created_at DESC LIMIT 1;

-- Check destruction event created
SELECT event_number, plants_destroyed, weight_destroyed
FROM waste_destruction_events
WHERE batch_id = 'your-batch-id'
ORDER BY created_at DESC LIMIT 1;

-- Check batch plant count updated
SELECT plant_count FROM batches WHERE id = 'your-batch-id';
```

---

### Test 3: 50:50 Ratio Validation (Too Low)
**Steps**:
1. Open "Destroy Plants" dialog
2. Fill in:
   - Plants Destroyed: `3`
   - Waste Weight: `10.0`
   - Rendering Method: `50:50 Mix with Kitty Litter`
   - Inert Material Weight: `5.0` (too low!)
3. Attempt to submit

**Expected Results**:
- ✅ Error toast: "50:50 rendering requires equal or greater inert material weight"
- ✅ Form does not submit
- ✅ No database changes

---

### Test 4: 50:50 Ratio Validation (Valid)
**Steps**:
1. Open "Destroy Plants" dialog
2. Fill in:
   - Plants Destroyed: `3`
   - Waste Weight: `10.0`
   - Rendering Method: `50:50 Mix with Soil`
   - Inert Material Weight: `10.0`
3. Verify ratio display shows: `1.00:1 ✅`
4. Submit

**Expected Results**:
- ✅ Ratio calculator shows green checkmark
- ✅ Submission succeeds
- ✅ Waste log created with correct inert_material_weight

---

### Test 5: Plant Count Validation (Exceeds Batch)
**Steps**:
1. Open dialog for batch with 10 plants
2. Enter:
   - Plants Destroyed: `15` (exceeds batch count!)
3. Attempt to submit

**Expected Results**:
- ✅ Error toast: "Invalid number of plants to destroy"
- ✅ Form does not submit

---

### Test 6: Missing Witness Warning
**Steps**:
1. Open dialog
2. Fill in all fields EXCEPT witness
3. Use 50:50 rendering method
4. Submit

**Expected Results**:
- ✅ Submission succeeds (witness not required, just recommended)
- ✅ Warning toast: "50:50 waste destruction should have a witness for compliance documentation"

---

### Test 7: Weight Reasonableness - Low Warning
**Steps**:
1. Destroy 100 plants with only 2.0 kg total weight (20g per plant)
2. Submit

**Expected Results**:
- ✅ Submission succeeds
- ✅ Warning toast: "Average weight per plant is very low (0.020 kg). Verify measurement."

---

### Test 8: Weight Reasonableness - High Warning
**Steps**:
1. Destroy 10 plants with 25.0 kg total weight (2.5 kg per plant)
2. Submit

**Expected Results**:
- ✅ Submission succeeds
- ✅ Warning toast: "Average weight per plant is very high (2.500 kg). Verify measurement."

---

### Test 9: Auto-Numbering Sequence
**Steps**:
1. Destroy plants from batch (creates WST-2025-11-00001)
2. Destroy plants from different batch (creates WST-2025-11-00002)
3. Destroy plants from first batch again (creates WST-2025-11-00003)

**Expected Results**:
- ✅ Waste numbers increment sequentially within month
- ✅ Format: `WST-YYYY-MM-XXXXX`
- ✅ Destruction event numbers also increment: `WDE-YYYY-MM-XXXXX`

---

### Test 10: Batch Not Synced to Metrc
**Steps**:
1. Use a batch that has NOT been pushed to Metrc
2. Destroy plants
3. Check response

**Expected Results**:
- ✅ Waste logged locally
- ✅ Warning toast: "Batch not synced to Metrc. Waste logged locally only."
- ✅ `metrc_sync_status` = `pending`
- ✅ No Metrc transaction ID

---

### Test 11: Batch With Plant Tags
**Steps**:
1. Use a batch that has Metrc plant tags assigned
2. Destroy 5 plants
3. Check if tags are included

**Expected Results**:
- ✅ First 5 plant tags used for destruction
- ✅ Tags stored in `plant_tags_destroyed` array
- ✅ Individual plant records marked as `destroyed` in `batch_plants` table

**Database Verification**:
```sql
SELECT plant_tag, status, destroyed_at, destroyed_reason
FROM batch_plants
WHERE plant_tag IN (SELECT unnest(plant_tags_destroyed) FROM waste_destruction_events WHERE id = 'event-id');
```

---

### Test 12: Rendering Method Options
**Steps**:
1. Open dialog
2. Check all rendering method options are available:
   - 50:50 Mix with Sawdust
   - 50:50 Mix with Kitty Litter
   - 50:50 Mix with Soil
   - 50:50 Mix with Other Inert
   - Composting
   - Grinding
   - Other

**Expected Results**:
- ✅ All 7 options available
- ✅ Inert weight field only shows for 50:50 methods
- ✅ Field hides when selecting non-50:50 methods

---

### Test 13: Date Validation
**Steps**:
1. Try to set destruction date in the future
2. Browser should prevent this (HTML5 date input with `max` attribute)

**Expected Results**:
- ✅ Cannot select future dates in date picker
- ✅ Max date is today

---

### Test 14: Compliance View
**Steps**:
```sql
SELECT * FROM rendering_method_compliance
WHERE waste_log_id IN (
  SELECT id FROM waste_logs WHERE batch_id = 'your-batch-id'
)
ORDER BY destruction_date DESC;
```

**Expected Results**:
- ✅ View shows compliance status
- ✅ `is_ratio_compliant` = TRUE for valid 50:50
- ✅ `compliance_status` = 'compliant' for valid destruction
- ✅ `has_witness`, `is_rendered`, `has_sufficient_photos` calculated correctly

---

### Test 15: Package Destruction API (Optional)
**Steps**:
```bash
curl -X POST http://localhost:3000/api/waste/destroy-package \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "pkg-uuid",
    "wasteWeight": 2.5,
    "wasteUnit": "Kilograms",
    "wasteReason": "Product Degradation",
    "adjustmentReason": "Product Degradation",
    "renderingMethod": "50_50_sawdust",
    "inertMaterialWeight": 2.5,
    "destructionDate": "2025-11-20"
  }'
```

**Expected Results**:
- ✅ 200 OK response
- ✅ Waste log created for package
- ✅ Package weight adjusted
- ✅ Package status updated to 'destroyed' if weight becomes 0

---

## 🐛 Common Issues & Solutions

### Issue 1: Migration Fails
**Solution**: The migration includes `IF NOT EXISTS` clauses. If columns already exist partially, manually verify:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'waste_logs'
AND column_name IN ('batch_id', 'waste_number', 'rendering_method');
```

### Issue 2: Auto-Numbering Function Not Found
**Solution**: Verify functions exist:
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('generate_waste_number', 'generate_destruction_event_number');
```

### Issue 3: Button Not Appearing
**Check**:
- Is batch domain_type = 'cannabis'?
- Is batch plant_count > 0?
- Are you on the batch detail page?
- Did the import get added correctly?

---

## ✅ Sign-Off Checklist

After completing all tests:

- [ ] All 20+ unit tests pass
- [ ] Basic destruction workflow works end-to-end
- [ ] 50:50 validation enforced correctly
- [ ] Auto-numbering works (WST and WDE)
- [ ] Batch plant count updates correctly
- [ ] Warnings display appropriately
- [ ] Database records created correctly
- [ ] Compliance view shows correct data
- [ ] UI renders without errors
- [ ] No console errors in browser

---

## 📊 Test Results Log

| Test # | Test Name | Status | Date | Notes |
|--------|-----------|--------|------|-------|
| 1 | Access Button | ⬜ | | |
| 2 | Basic Destruction | ⬜ | | |
| 3 | Ratio Too Low | ⬜ | | |
| 4 | Ratio Valid | ⬜ | | |
| 5 | Exceeds Count | ⬜ | | |
| 6 | Missing Witness | ⬜ | | |
| 7 | Weight Low | ⬜ | | |
| 8 | Weight High | ⬜ | | |
| 9 | Auto-Numbering | ⬜ | | |
| 10 | Not Synced | ⬜ | | |
| 11 | With Tags | ⬜ | | |
| 12 | Rendering Options | ⬜ | | |
| 13 | Date Validation | ⬜ | | |
| 14 | Compliance View | ⬜ | | |
| 15 | Package API | ⬜ | | |

---

**Testing Status**: Ready for manual testing
**Estimated Testing Time**: 1-2 hours for complete checklist
**Next Step**: Run through checklist and mark items complete ✅
