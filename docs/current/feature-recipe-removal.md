# Recipe Removal from Monitoring Dashboard

## Overview
Users with the `control:recipe_apply` permission can now remove active recipes from pods directly from the monitoring dashboard.

## Feature Details

### Location
- **Component**: `components/features/monitoring/pod-detail.tsx`
- **Route**: `/dashboard/monitoring/[podId]`

### UI Components
1. **Remove Recipe Button**
   - Located in the pod detail header, next to the Refresh button
   - Only visible when:
     - An active recipe is assigned to the pod
     - User has `control:recipe_apply` permission
   - Styled as a destructive (red) button with XCircle icon

2. **Confirmation Dialog**
   - AlertDialog component confirms the action
   - Displays:
     - Recipe name being removed
     - Warning about deactivation
     - Note that recipe remains in library
     - Audit trail notification
   - Prevents accidental removal

### Functionality

#### Recipe Deactivation Process
1. User clicks "Remove Recipe" button
2. Confirmation dialog appears
3. Upon confirmation:
   - Calls Supabase RPC `deactivate_recipe` function
   - Passes activation ID, user ID, and reason
   - Recipe activation is marked as inactive
   - Progress tracking stops

#### Audit Logging
- **Action Type**: `monitoring.recipe.removed`
- **Entity Type**: `recipe`
- **Data Captured**:
  - Old Values:
    - Activation ID
    - Scope (pod ID and name)
    - Current stage and stage day
  - New Values:
    - Status: deactivated
    - Reason: "Manual removal from monitoring dashboard"
  - Metadata:
    - Pod ID, name, and room name

#### User Feedback
- Success toast: "Recipe removed from [Pod Name]"
- Error toast on failure
- Automatic page refresh after 1 second
- Loading state prevents duplicate submissions

## Audit Helper

### New Module: `lib/monitoring/audit.ts`

#### Purpose
Centralized audit logging for all monitoring-related actions.

#### Functions

##### `logMonitoringAudit(event: MonitoringAuditEvent)`
- Best-effort logging (never throws errors)
- Parameters:
  ```typescript
  {
    userId: string
    organizationId: string
    action: string
    entityType: 'pod' | 'equipment' | 'recipe' | 'control'
    entityId: string
    entityName?: string | null
    oldValues?: Record<string, unknown> | null
    newValues?: Record<string, unknown> | null
    metadata?: Record<string, unknown> | null
  }
  ```

#### Predefined Actions
```typescript
MONITORING_AUDIT_ACTIONS = {
  RECIPE_REMOVED: 'monitoring.recipe.removed',
  RECIPE_APPLIED: 'monitoring.recipe.applied',
  EQUIPMENT_MANUAL_CONTROL: 'monitoring.equipment.manual',
  EQUIPMENT_AUTO_ENABLED: 'monitoring.equipment.auto',
  EQUIPMENT_OVERRIDE: 'monitoring.equipment.override',
  POD_SETPOINT_CHANGED: 'monitoring.pod.setpoint',
  POD_CALIBRATION: 'monitoring.pod.calibration',
  ALARM_ACKNOWLEDGED: 'monitoring.alarm.acknowledged',
  ALARM_RESOLVED: 'monitoring.alarm.resolved',
}
```

## Admin Audit Log Integration

### Updated: `components/features/admin/audit-log-table.tsx`

#### New Filter Options
Added 9 new monitoring action types to the ACTION_TYPES filter:
- `monitoring.recipe.removed`
- `monitoring.recipe.applied`
- `monitoring.equipment.manual`
- `monitoring.equipment.auto`
- `monitoring.equipment.override`
- `monitoring.pod.setpoint`
- `monitoring.pod.calibration`
- `monitoring.alarm.acknowledged`
- `monitoring.alarm.resolved`

#### Usage
Admins can now filter the audit log to see all monitoring-related actions, including recipe removals.

## Database Schema

### Tables Used
1. **`recipe_activations`**
   - `id` (UUID) - Primary key
   - `recipe_id` (UUID) - Foreign key to recipes
   - `is_active` (BOOLEAN) - Set to false on removal
   - `scope_type` (TEXT) - 'pod', 'room', 'batch'
   - `scope_id` (UUID) - References the pod
   - `current_stage_id` (UUID) - Current recipe stage
   - `current_stage_day` (INTEGER) - Day within stage
   - `deactivated_at` (TIMESTAMPTZ) - Removal timestamp
   - `deactivated_by` (UUID) - User who removed it
   - `deactivation_reason` (TEXT) - "Manual removal from..."

2. **`audit_log`**
   - `id` (UUID) - Primary key
   - `organization_id` (UUID) - Organization reference
   - `user_id` (UUID) - User who performed action
   - `action` (TEXT) - Action type
   - `entity_type` (TEXT) - 'recipe', 'pod', etc.
   - `entity_id` (UUID) - Entity reference
   - `entity_name` (TEXT) - Human-readable name
   - `old_values` (JSONB) - State before change
   - `new_values` (JSONB) - State after change
   - `metadata` (JSONB) - Additional context
   - `timestamp` (TIMESTAMPTZ) - When action occurred

### RPC Function
```sql
CREATE OR REPLACE FUNCTION deactivate_recipe(
  p_activation_id UUID,
  p_deactivated_by UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN
```

## Testing

### Manual Testing Steps
1. **Setup**:
   - Ensure you have an active recipe on a pod
   - Login with a user having `control:recipe_apply` permission

2. **Test Recipe Removal**:
   - Navigate to `/dashboard/monitoring`
   - Click on a pod with an active recipe
   - Verify "Remove Recipe" button appears next to Refresh
   - Click "Remove Recipe"
   - Verify confirmation dialog appears
   - Click "Remove Recipe" in dialog
   - Verify success toast appears
   - Verify recipe badge changes to "No Recipe"
   - Verify page refreshes

3. **Test Audit Log**:
   - Navigate to `/dashboard/admin/audit-log`
   - Filter by action type: `monitoring.recipe.removed`
   - Verify entry exists with:
     - Correct user
     - Recipe name
     - Pod name in old_values
     - Timestamp

4. **Test Permission Check**:
   - Login as a user WITHOUT `control:recipe_apply`
   - Navigate to a pod with active recipe
   - Verify "Remove Recipe" button does NOT appear

### Integration Test Coverage Needed
- Recipe deactivation RPC call
- Audit log insertion
- Permission check enforcement
- Error handling (network failures, missing data)
- State refresh after removal

## Error Handling

### Scenarios Covered
1. **User Not Logged In**: Shows error toast, doesn't attempt deactivation
2. **Missing Activation ID**: Shows error toast early
3. **RPC Failure**: Catches error, shows toast, logs to console
4. **Audit Log Failure**: Logs to console but continues operation (best-effort)
5. **Network Errors**: Caught by try-catch, shows generic error toast

### User Messages
- Success: "Recipe removed from [Pod Name]"
- Auth Error: "You must be logged in to remove a recipe"
- Generic Error: "Failed to remove recipe"
- Missing Data: "Unable to remove recipe"

## Future Enhancements

### Short Term
1. Add bulk recipe removal (multiple pods at once)
2. Add "Resume Recipe" option to reactivate deactivated recipes
3. Show recipe removal events in pod activity timeline
4. Add confirmation with reason field (free text)

### Medium Term
1. Recipe removal scheduling (remove at specific time/date)
2. Notifications to stakeholders when recipes removed
3. Analytics on recipe removal patterns
4. Recipe effectiveness scoring before removal

### Long Term
1. AI suggestions for when to remove/change recipes
2. Automated recipe removal on batch completion
3. Recipe removal approval workflows for compliance
4. Integration with external compliance systems

## Related Documentation
- [Recipe Management](./feature-recipe.md)
- [Monitoring Dashboard](./feature-monitoring.md)
- [Audit Logging](../reference/audit-logging.md)
- [RBAC System](../reference/rbac.md)

## Files Modified
1. `components/features/monitoring/pod-detail.tsx` - Added remove button and dialog
2. `lib/monitoring/audit.ts` - NEW - Audit logging helper
3. `components/features/admin/audit-log-table.tsx` - Added monitoring action filters

## Dependencies
- `sonner` - Toast notifications
- `@/components/ui/alert-dialog` - Confirmation dialog
- `lucide-react` - XCircle icon
- Supabase RPC - `deactivate_recipe` function
- RBAC - `control:recipe_apply` permission
