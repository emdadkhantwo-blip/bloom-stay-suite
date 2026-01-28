
# Fix HR Attendance and Shifts Sections

## Problem Analysis

### Current Issues:
1. **Attendance Page (`/hr/attendance`)**: Currently shows only a basic clock-in widget for the current user with no real functionality. Does not show all employees, their positions, or allow managers to give attendance.

2. **Shifts Page (`/hr/shifts`)**: Shows only static shift templates but doesn't fetch real data from `hr_shifts` table. The weekly schedule is not connected to the database.

---

## Solution Overview

### Phase 1: Create useAttendance Hook

Create a new hook to manage attendance data and actions:

**File: `src/hooks/useAttendance.tsx`**

Features:
- Fetch all attendance records for the current date
- Fetch all staff members with their roles/positions
- Clock in/out functionality (for self and admin override)
- Start/end break functionality
- Calculate attendance statistics (present, absent, late, on break)

```text
Interface StaffAttendance:
- profile_id
- full_name
- avatar_url
- role (position)
- clock_in
- clock_out
- break_start
- break_end
- is_late
- worked_hours
- status (not_clocked_in | clocked_in | on_break | clocked_out)
```

---

### Phase 2: Update Attendance Page

**File: `src/pages/hr/Attendance.tsx`**

New Features:

1. **Stats Bar** (connected to real data):
   - Present Today: Staff who clocked in
   - Absent: Staff who haven't clocked in
   - Late Arrivals: Staff marked as late
   - On Break: Staff currently on break

2. **Self Clock Widget** (existing - enhanced):
   - Shows current user's attendance status
   - Clock In/Out buttons
   - Break Start/End buttons
   - Persists to database

3. **Staff Attendance Table** (new):
   - List all employees
   - Show avatar, name, and position/role
   - Show clock-in time, clock-out time
   - Show status badge (Present/Absent/On Break/Late)
   - Admin override: Clock in/out on behalf of staff

```text
┌────────────────────────────────────────────────────────────────┐
│ Today's Attendance                                              │
├────────────────────────────────────────────────────────────────┤
│ Staff             │ Position      │ Clock In │ Clock Out │ Status │
├───────────────────┼───────────────┼──────────┼───────────┼────────┤
│ [Avatar] John     │ Manager       │ 08:05    │ --:--     │ Present│
│ [Avatar] Sarah    │ Front Desk    │ 08:12    │ --:--     │ Late   │
│ [Avatar] Mike     │ Kitchen       │ --:--    │ --:--     │ Absent │
│ [Avatar] James    │ Housekeeping  │ 07:55    │ --:--     │ Present│
│ [Avatar] Maria    │ Housekeeping  │ 08:00    │ 15:00     │ Left   │
└────────────────────────────────────────────────────────────────┘
```

4. **Admin Actions** (for owners/managers):
   - "Mark Present" button for absent staff
   - Quick clock-in timestamp override

---

### Phase 3: Enhanced Shifts Page

**File: `src/pages/hr/Shifts.tsx`**

New Features:

1. **Create Shift Template Dialog** (new):
   - Name
   - Start time
   - End time
   - Break minutes
   - Color picker

2. **Connect Shift Templates to Database**:
   - Fetch from `hr_shifts` table
   - Create, edit, delete shifts
   - Show real data instead of hardcoded templates

3. **Weekly Schedule Grid**:
   - Show all staff in rows
   - Days of the week as columns
   - Display assigned shifts from `hr_shift_assignments`
   - Click to assign/unassign shifts

```text
Weekly Schedule:
┌────────────────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Staff          │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │
├────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ John (Manager) │ Day │ Day │ Day │ Off │ Day │ Off │ Off │
│ Sarah (F.Desk) │ Day │ Eve │ Day │ Day │ Off │ Day │ Day │
│ Mike (Kitchen) │ Eve │ Eve │ Eve │ Eve │ Eve │ Off │ Off │
└────────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

4. **Real Statistics**:
   - Shifts This Week (actual count)
   - Staff Assigned (unique staff with shifts)
   - Overtime Alerts (future: calculate based on hours)

---

## Implementation Plan

### Files to Create:

| File | Purpose |
|------|---------|
| `src/hooks/useAttendance.tsx` | Attendance data management |
| `src/components/hr/AttendanceTable.tsx` | Staff attendance list component |
| `src/components/hr/CreateShiftDialog.tsx` | Create new shift template |

### Files to Modify:

| File | Changes |
|------|---------|
| `src/pages/hr/Attendance.tsx` | Complete rewrite with real data |
| `src/pages/hr/Shifts.tsx` | Connect to database, add create dialog |
| `src/hooks/useShifts.tsx` | Add CRUD mutations for shifts |

---

## Database Integration

### Tables Used:
- `hr_attendance` - Clock in/out records
- `hr_shifts` - Shift templates
- `hr_shift_assignments` - Staff-shift mappings
- `profiles` - Staff info
- `user_roles` - Staff positions/roles

### RLS Policies (already in place):
- Owners/managers can manage all attendance
- Users can view their own attendance
- Users can clock in/out for themselves

---

## Role-to-Position Mapping

Staff positions displayed based on their primary role:

| Role | Display Position |
|------|------------------|
| owner | Owner |
| manager | Manager |
| front_desk | Front Desk |
| accountant | Accountant |
| housekeeping | Housekeeping |
| maintenance | Maintenance |
| kitchen | Kitchen Staff |
| waiter | Waiter/Server |
| night_auditor | Night Auditor |

---

## Feature Summary

### Attendance Page:
1. Real-time stats from database
2. Personal clock in/out with persistence
3. Full staff attendance table with positions
4. Admin override capabilities
5. Late/on-time indicators

### Shifts Page:
1. Create shift templates in database
2. View/edit/delete shifts
3. Weekly schedule grid with all staff
4. Assign shifts from the grid
5. Real statistics from database

---

## Security Considerations

1. **Clock-in Self**: Any authenticated user can clock in/out for themselves
2. **Clock-in Others**: Only `owner` and `manager` can mark attendance for others
3. **Manage Shifts**: Only `owner` and `manager` can create/edit shifts
4. **Assign Shifts**: Only `owner`, `manager`, and `front_desk` can assign shifts
