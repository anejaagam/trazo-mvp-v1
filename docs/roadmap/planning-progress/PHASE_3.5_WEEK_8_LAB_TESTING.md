# Phase 3.5 Week 8: Lab Testing (COA Management)

**Status:** Active
**Goal:** Implement document management for test results (COAs) and compliance blocking.

---

## 📋 Context
Users send products to external labs. We need to:
1.  **Upload** the COA (Certificate of Analysis) PDF/Image.
2.  **Record** the high-level results (Pass/Fail, Test Date).
3.  **Link** the results to specific Harvest Packages.
4.  **Block** sales of packages that haven't passed testing.

**Note:** We do *not* manage the lab's internal workflow. We are a repository for the results.

---

## 🛠️ Implementation Plan

### 1. Database Schema
New tables in `supabase/migrations/20241120000001_create_lab_tests.sql`:
-   `lab_test_results`: Stores the COA document URL, lab info, and overall status.
-   `package_test_results`: Join table linking a test to a package.

### 2. Validation Layer
File: `lib/compliance/metrc/validation/lab-test-rules.ts`
-   `validateLabTestUpload`: Checks file type (PDF/Image), size, and required metadata (Lab Name, Test Date).
-   `validateTestResults`: Checks that required fields (e.g., THC %) are present if applicable.

### 3. Service Layer
File: `lib/compliance/metrc/sync/lab-test-sync.ts`
-   `createLabTest`: Uploads file to Supabase Storage, creates DB record.
-   `linkPackageToTest`: Associates a package with a test.

### 4. UI Components
-   `components/features/lab-tests/coa-upload-form.tsx`: Drag-and-drop upload + metadata form.
-   `components/features/lab-tests/test-results-viewer.tsx`: Displays the COA and status.

---

## ✅ Success Criteria
-   [ ] User can upload a PDF COA.
-   [ ] User can select which packages the COA applies to.
-   [ ] "Ready for Sale" status is blocked if no passing test exists.
-   [ ] Test results are visible on the Package Detail page.
