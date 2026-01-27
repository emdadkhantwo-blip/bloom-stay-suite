
# Consolidate Staff to HR Section

## Overview
Move all staff management functionality from `/staff` to `/hr/staff` and remove the standalone `/staff` section. The `/hr/staff` page will become the central staff directory with all existing features.

---

## Changes Required

### 1. Update HR Staff Page (`src/pages/hr/Staff.tsx`)
Replace the current placeholder with the full staff functionality from `src/pages/Staff.tsx`:
- Import existing staff components (StaffCard, StaffFilters, StaffStatsBar, etc.)
- Import existing hooks (useStaff, useStaffStats)
- Include all dialogs (CreateStaffDialog, InviteStaffDialog, BulkAvatarImportDialog, StaffDetailDrawer)
- Include filtering logic (search, role, status filters)

### 2. Remove Standalone Staff Route (`src/App.tsx`)
- Remove the `/staff` route definition (lines 284-293)
- Remove the `Staff` import from `src/pages/Staff` (line 23)
- Keep all HR staff routing unchanged (`/hr/staff`)

### 3. Update Sidebar Navigation (`src/components/layout/AppSidebar.tsx`)
- Remove "Staff" item from `adminItems` array (line 106)
- The "Staff Directory" already exists in `hrItems` pointing to `/hr/staff`

### 4. Delete Standalone Staff Page
- Delete `src/pages/Staff.tsx` (no longer needed after moving functionality to HR)

---

## Technical Details

### Files to Modify

| File | Action | Details |
|------|--------|---------|
| `src/pages/hr/Staff.tsx` | Replace | Use full staff functionality from standalone page |
| `src/App.tsx` | Edit | Remove `/staff` route and import |
| `src/components/layout/AppSidebar.tsx` | Edit | Remove Staff from adminItems |
| `src/pages/Staff.tsx` | Delete | No longer needed |

### Code Changes

**src/pages/hr/Staff.tsx** - Replace with:
```text
- Import useStaff, useStaffStats hooks
- Import all staff components from @/components/staff/
- Include full filtering logic
- Include all action dialogs
- Render StaffStatsBar, StaffFilters, StaffCard grid
- Render StaffDetailDrawer, InviteStaffDialog, CreateStaffDialog, BulkAvatarImportDialog
```

**src/App.tsx** - Remove:
```text
Line 23: import Staff from "./pages/Staff";
Lines 284-293: /staff route definition
```

**src/components/layout/AppSidebar.tsx** - Modify:
```text
Line 106: Remove { title: 'Staff', url: '/staff', icon: UserCircle, color: 'text-vibrant-purple' }
```

---

## Result

After implementation:
- Staff management is accessed only via `/hr/staff` in the HR Management section
- The Admin section no longer shows "Staff" (Properties, References, Settings remain)
- All existing staff features (create, invite, bulk avatar, filters, detail view) work under the new location
- Clean separation of concerns: HR handles all employee/staff-related functions

---

## Component Reuse

The existing staff components in `src/components/staff/` will continue to be used:
- `StaffStatsBar.tsx` - Statistics display
- `StaffFilters.tsx` - Search and filter controls
- `StaffCard.tsx` - Staff member card display
- `StaffDetailDrawer.tsx` - Detailed staff view/edit
- `CreateStaffDialog.tsx` - Create new staff member
- `InviteStaffDialog.tsx` - Send staff invitations
- `BulkAvatarImportDialog.tsx` - Bulk import avatars

No changes needed to these components - they will work with the new page location.
