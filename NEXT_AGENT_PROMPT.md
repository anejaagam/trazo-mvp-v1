### Agentic Implementation Plan: Alarms & Notifications v2

**Objective:** Refactor the existing notification and alarm system to create a clear distinction between general notifications (for inventory, batches, tasks) and critical alarms (for environmental monitoring, overdue tasks).

**Core Principles:**
*   **Notifications:** Informational updates. They can have varying urgency and may link to specific items.
*   **Alarms:** Critical, time-sensitive events that require immediate attention. They are generated from monitoring thresholds, overdue tasks, or escalated high-urgency notifications.

Follow the project's established patterns for database migrations, RBAC, and client-side state management as defined in your instructions.

---

### Phase 1: Backend & Data Model Refinement

**Goal:** Evolve the database schema and server-side logic to support categorized notifications and new alarm triggers.

**Step 1.1: Enhance the `notifications` Table and Type**
*   **Task:** Modify the `notifications` table to store more contextual information.
*   **File to Modify:** schema.sql
*   **Instructions:**
    1.  Locate the `CREATE TABLE public.notifications` statement.
    2.  Add the following columns:
        *   `category TEXT NOT NULL`: To classify the notification source. Add a `CHECK` constraint to limit values to `'inventory'`, `'batch'`, `'task'`, or `'system'`.
        *   `urgency TEXT NOT NULL DEFAULT 'low'`: To define the notification's importance. Add a `CHECK` constraint for `'low'`, `'medium'`, `'high'`.
        *   `link_url TEXT`: An optional URL to navigate the user directly to the relevant resource (e.g., `/dashboard/batches/batch-123`).
    3.  Remember to apply these schema changes to both the US and Canada Supabase projects.
*   **File to Update:** telemetry.ts
*   **Instructions:**
    1.  Find the `Notification` interface.
    2.  Add the corresponding properties (`category`, `urgency`, `link_url`) with the correct TypeScript types to match the database schema.

**Step 1.2: Create Database Functions for Notification Generation**
*   **Task:** Create reusable SQL functions to standardize how notifications are created.
*   **File to Modify:** schema.sql
*   **Instructions:**
    1.  Define a new PL/pgSQL function `create_notification(user_id_param UUID, org_id_param UUID, message_param TEXT, category_param TEXT, urgency_param TEXT, link_url_param TEXT)`.
    2.  This function should perform an `INSERT` into the `public.notifications` table using the provided parameters.
    3.  Ensure the function respects row-level security (RLS) by running with the privileges of the caller.
    4.  This function will be called from server-side code in the next step.

**Step 1.3: Integrate Notification Triggers into Business Logic**
*   **Task:** Call the `create_notification` function from existing server-side logic when key events occur.
*   **Files to Investigate & Modify:**
    *   inventory.ts (or similar files for inventory management)
    *   batches.ts (or similar for batch status changes)
    *   `/lib/supabase/queries/tasks.ts` (or similar for task assignments)
*   **Instructions:**
    1.  Identify functions that handle state changes (e.g., updating inventory stock, changing a batch's phase, assigning a task).
    2.  Within these functions, after a successful database operation, call the `create_notification` RPC function.
    3.  Construct the `message`, `category`, `urgency`, and `link_url` dynamically based on the event. For example, when inventory is low, set `category` to `'inventory'` and `urgency` to `'medium'`.

**Step 1.4: Implement New Alarm Generation Logic**
*   **Task:** Create server-side logic to generate alarms based on new criteria.
*   **Instructions:**
    1.  **Task-based Alarms:**
        *   Create a new Supabase Edge Function or a scheduled Postgres function (using `pg_cron`) that runs periodically (e.g., hourly).
        *   This function should query the `tasks` table for items that are past their `due_date` and not yet `completed`.
        *   For each overdue task, it should call the existing `createAlarm` function (from alarms.ts) with a relevant message, setting the alarm `type` to `'task_overdue'`.
    2.  **Recipe-driven Monitoring Alarms:**
        *   Locate the existing monitoring evaluation logic (likely related to the `MonitoringAndTelemeteryPrototype`).
        *   Modify this logic so that before evaluating sensor data, it first fetches the active `recipe` for the pod/batch.
        *   Use the `thresholds` defined within the recipe data to check against sensor readings.
        *   If a threshold is breached, call `createAlarm` with details from the recipe and sensor.

---

### Phase 2: Client-Side Hook Refinement

**Goal:** Update the client-side hooks to consume and manage the new data structures.

**Step 2.1: Refactor `useNotifications` Hook**
*   **Task:** Adapt the notification hook to fetch, filter, and subscribe to the enhanced notification data.
*   **File to Modify:** use-alarms.ts (or a new use-notifications.ts if you choose to separate them).
*   **Instructions:**
    1.  Update the `refresh` logic within the hook to fetch from the `notifications` table.
    2.  Implement client-side or server-side filtering so the hook can accept a `category` option.
    3.  Ensure the real-time subscription handler correctly processes the new `Notification` type with its added properties.

**Step 2.2: Update `useAlarms` Hook**
*   **Task:** Add filtering capabilities to the alarms hook.
*   **File to Modify:** use-alarms.ts
*   **Instructions:**
    1.  Modify the `UseAlarmsOptions` type to accept an optional `type` filter (e.g., `'monitoring'`, `'task_overdue'`).
    2.  Pass this filter down to the `getAlarmsClient` query to fetch only specific types of alarms when needed. This will be useful for the UI in the next phase.

---


### Phase 3: User Interface Integration

**Goal:** Create a unified dashboard to present both critical alarms and informational notifications to the user in an intuitive, consolidated view.

**Step 3.1: Enhance the Alarms Dashboard to be a Unified Notification Center**
*   **Task:** Modify the primary alarms display component to incorporate all notifications and alarms.
*   **File to Modify:** The component currently responsible for displaying alarms (e.g., `AlarmsDashboard`, `AlarmsPanel`).
*   **Instructions:**
    1.  In the component, use both the `useAlarms` hook to fetch critical alarms and the `useNotifications` hook to fetch informational updates.
    2.  Combine the data from both hooks into a single list, sorted chronologically by default, with alarms appearing first.
    3.  **Visually distinguish between item types.** Alarms must have the highest visual prominence (e.g., a red accent color, a critical icon). Notifications should be styled based on their `urgency` property (`high`, `medium`, `low`).
    4.  Use a `Tabs` component (from `/components/ui/tabs`) to allow users to filter the unified list. The tabs should be: "All", "Alarms", "Inventory", "Batches", and "Tasks".
        *   The "Alarms" tab will show only data from `useAlarms`.
        *   The other tabs will filter the data from `useNotifications` by its `category` property.
    5.  For items with a `link_url` property (primarily notifications), ensure the list item is a clickable link that navigates the user to the specified URL.
    6.  Ensure the message for each item clearly states its source and context (e.g., "Task 'Sanitize Grow Room' is overdue" or "Inventory for 'Cherry Tomato' is low").

**Step 3.2: Enhance the Alarms Display**
*   **Task:** Update the primary alarms view to differentiate between alarm types.
*   **File to Modify:** The component currently responsible for displaying alarms (e.g., `AlarmsDashboard`, `AlarmsPanel`).
*   **Instructions:**
    1.  Use the `useAlarms` hook to fetch alarms.
    2.  Modify the UI to visually distinguish between alarm types. You could use colored icons, badges, or separate sections.
    3.  For example, display a thermometer icon for `monitoring` alarms and a calendar icon for `task_overdue` alarms.
    4.  Ensure the alarm message clearly states the source and context (e.g., "Task 'Sanitize Grow Room' is overdue" or "Pod A4: Temperature is 2.5°C above recipe threshold").