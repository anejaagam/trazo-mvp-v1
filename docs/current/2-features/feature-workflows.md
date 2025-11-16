# Workflow Management Feature Guide

Last updated: May 2026  
Owners: Workflow & Compliance squad

This guide summarizes the workflow-focused UX that shipped with Phase 7.

## Dashboard Enhancements
- **Hierarchy aware selection** – Board and list views now share a selection state. Selecting a card opens a detail drawer with assignment info, dependency lists, and a live hierarchy tree.
- **Drag-and-drop moves** – Operators with `task:update` permission can drag cards across status columns. Illegal drops (e.g., blocked states or missing permission) show toasts instead of failing silently.
- **Blocked task indicators** – Tasks whose blocking dependencies are incomplete show a red badge with the outstanding prerequisites in a tooltip. The cues are available on both board and list layouts.

## Task Hierarchy View
- **TaskHierarchyView component** renders the `get_task_hierarchy` RPC tree with expand/collapse controls, blocker icons, and status badges.
- **Reparent actions** – Dragging a node onto another node (or the root dropzone) calls `POST /api/workflows/tasks/[id]/reparent`. The API enforces descendant checks and `MAX_TASK_HIERARCHY_LEVEL`.
- **Auto refresh** – The tree polls every 30 seconds and also includes a manual refresh action for instant updates after mutations.

## Dependency Surfacing
- The detail drawer shows three lists: blocking prerequisites, suggested dependencies, and downstream dependents. Each entry links back to the workflow task page and can be inspected inline.
- Toasts now surface validation or backend errors when dependency creation fails (duplicate or circular attempts).

## Task Execution Timeline
- `TaskExecutor` now records a timeline entry every time a step is visited, branched, or skipped. The panel displays icons, relative timestamps, and skip reasons to make audits easier.
- Evidence capture enforces a 10 MB pre-compression limit with descriptive toasts when operators try to upload oversized files.

## Recurring Operations
- The `/api/cron/generate-recurring-tasks` endpoint instantiates future tasks using `recurring_pattern` + `recurring_config`. Each instance inherits metadata, tags the originating seed via `recurring_config.seedTaskId`, and skips duplicates automatically.
- Config validation errors and generation summaries are logged in the cron response so ops teams can monitor drift.

## Validation & Messaging
- `task-create-form` now emits toasts for missing approval roles, invalid recurrence configs, and duplicate dependencies.
- Backend failures in task creation or dependency application show a destructive toast alongside the inline alert for at-a-glance troubleshooting.

## Testing & Coverage
- Component tests were added for the hierarchy view, drag/drop board interactions, and execution timeline updates.
- Utility tests cover dependency cycle detection, hierarchy tree building, and recurrence generation helpers to guard against regressions.
