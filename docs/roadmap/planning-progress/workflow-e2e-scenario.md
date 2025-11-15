# Workflow E2E Scenario: Template → Recurrence → Execution

**Updated:** May 2026  
**Primary Actors:** Site Manager (creator), Operator (executor), Compliance Reviewer (approver)

## 1. Template Setup
1. Create or edit a SOP template with:
   - Dual-signoff required for the final step.
   - A conditional branch that jumps to an exception step when a numeric reading exceeds the configured threshold.
2. Publish the template so it is available in the creation form.

## 2. Task Creation with Hierarchy & Dependencies
1. From the dashboard, create a **root task** using the template. Set `schedule_mode = recurring`, choose a weekly cadence (Mon/Wed), and configure blocking dependencies on the sanitation checklist.
2. Add a **child task** underneath the root to represent an inspection sub-procedure. The form enforces hierarchy depth and surfaces duplicate dependency attempts with toasts.
3. Submit the task. On success the UI redirects to the execution page and shows a toast confirming creation.

## 3. Recurring Instance Generation
1. The hourly cron (`/api/cron/generate-recurring-tasks`) runs with service credentials.
2. Any seed task with `schedule_mode = recurring` and a valid `recurring_config` receives the next set of future instances. Each generated row inherits metadata and stores `recurring_config.seedTaskId` so duplicates are skipped.
3. Ops can verify the cron summary in logs or by hitting the endpoint locally with `CRON_SECRET`.

## 4. Hierarchy Visualization & Moves
1. Selecting any task card opens the detail drawer. Operators can expand the TaskHierarchyView to validate ancestry and see outstanding prerequisites.
2. A Site Manager can drag a misplaced node onto its intended parent (or the root drop zone). The API call (`POST /api/workflows/tasks/[id]/reparent`) rejects illegal moves (descendant loops or level > 4) and returns a toast if validation fails.

## 5. Execution with Conditional Branching
1. When the operator starts execution, the timeline immediately logs the visit of step 1.
2. If a reading breaches the threshold, the branch event is logged (with originating step) and the UI auto-navigates to the exception step.
3. Skipped steps require a reason; the skip reason appears in the timeline with a destructive badge for audit review.
4. Evidence uploads are pre-validated (10 MB limit) before compression, providing actionable toast messaging.

## 6. Approval & Dual Sign-off
1. After all steps are complete, the operator initiates task completion. Because the template requires dual sign-off, the dedicated modal captures both signatures.
2. The compliance reviewer receives the task in the "Awaiting Approval" column. DnD or the overflow menu can transition it to `approved` once review is finished.
3. Dependencies unlock downstream tasks automatically when all blocking prerequisites report `done`/`approved`.

## 7. Reporting
- The Execution Timeline + hierarchy tree provide the final audit surface, capturing branches, skips, evidence types, and dependency state at completion.
