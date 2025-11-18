# Metrc Location Mapping UI Implementation

**Status**: ✅ Complete
**Date**: November 18, 2025

## Overview

Added user-friendly UI for configuring Metrc location mappings at both site and pod levels, eliminating the need for SQL commands. Users can now configure semi-autonomous batch sync through the existing organization settings interface.

## Implementation Details

### 1. Site-Level Configuration

**File**: `components/features/admin/site-form-dialog.tsx`

**Changes**:
- Added `default_metrc_location` field to site creation/edit form
- Field appears below site license number with helpful context text
- Optional field with placeholder examples
- Automatically saved when creating or updating sites

**UI Location**: `/dashboard/admin/organization` → Click site → Edit

**Features**:
- Input field with example text: "e.g., Propagation Area, Germination Room"
- Helper text explains it's used as fallback for early-stage batches
- Validates that location must match Metrc facility names exactly

### 2. Pod-Level Configuration

**File**: `components/features/admin/pod-edit-dialog.tsx` (NEW)

**Features**:
- New dialog component for editing pod details
- Includes `metrc_location_name` field with helper text
- Updates pod name, status, serial number, and Metrc location
- Validates pod name is required

**UI Access**:
1. Navigate to `/dashboard/admin/organization`
2. Expand a site to see rooms
3. Click room to see pods
4. Click "Edit" button next to any pod
5. Edit Metrc location field and save

**Pod Display**:
- Metrc location shown as badge next to pod name (📍 icon)
- "Edit" button added for each pod
- Existing "Reassign" button still available

### 3. API Updates

**Sites API** (`/api/admin/organizations/sites/route.ts`):
- GET: Returns `default_metrc_location` for each site
- POST: Saves `default_metrc_location` when creating site
- PATCH: Updates `default_metrc_location` when editing site

**Pods API** (`/api/pods/[podId]/route.ts`):
- PATCH: Saves `metrc_location_name` when updating pod
- Includes field in response data

**Room Pods API** (`/api/admin/organizations/rooms/[roomId]/pods/route.ts`):
- GET: Returns `metrc_location_name` for each pod in room

### 4. UI Integration

**File**: `app/dashboard/admin/organization/site-management-client.tsx`

**Changes**:
- Added `PodEditDialog` import and state management
- Added `handleEditPod` and `handlePodEditSuccess` handlers
- Updated pod display to show Metrc location as badge
- Added "Edit" button to each pod row
- Pod interface updated to include `metrc_location_name` field

## User Workflow

### Configure Site Default Location

1. Go to `/dashboard/admin/organization`
2. Click "Edit" (pencil icon) next to a site
3. Scroll to "Default Metrc Location" field
4. Enter location name (e.g., "Propagation Area")
5. Click "Update Site"

### Configure Pod Metrc Locations

1. Go to `/dashboard/admin/organization`
2. Click arrow to expand a site
3. Click arrow to expand a room
4. Click "Edit" button next to a pod
5. Enter Metrc location (e.g., "Vegetative Room 1")
6. Click "Update Pod"

### View Metrc Mappings

**In UI**:
- Site level: Shows in edit dialog
- Pod level: Badge appears next to pod name with 📍 icon

**Via Database**:
```sql
SELECT * FROM metrc_location_mappings
WHERE site_id = 'your-site-id'
ORDER BY room_name, pod_name;
```

## Testing Checklist

- [x] Site form includes default_metrc_location field
- [x] Site API saves and retrieves default_metrc_location
- [x] Pod edit dialog created with metrc_location_name field
- [x] Pod API saves and retrieves metrc_location_name
- [x] Pods display Metrc location badges in UI
- [x] Edit button opens pod edit dialog
- [x] No TypeScript errors in updated files

## Benefits

✅ **No SQL Required**: Users configure through familiar UI
✅ **Visual Feedback**: Metrc locations shown as badges
✅ **Integrated**: Uses existing organization settings page
✅ **Validation**: Form validation prevents empty names
✅ **User-Friendly**: Clear labels and helper text

## Files Modified

1. `components/features/admin/site-form-dialog.tsx` - Added Metrc field
2. `components/features/admin/pod-edit-dialog.tsx` - NEW component
3. `app/api/admin/organizations/sites/route.ts` - API support
4. `app/api/pods/[podId]/route.ts` - API support
5. `app/api/admin/organizations/rooms/[roomId]/pods/route.ts` - API support
6. `app/dashboard/admin/organization/site-management-client.tsx` - UI integration

## Next Steps

Users can now:
1. Configure site-level Metrc defaults through UI
2. Map individual pods to Metrc locations through UI
3. View Metrc location mappings in organization settings
4. Benefit from semi-autonomous batch sync with auto-resolved locations

No SQL knowledge required! 🎉
