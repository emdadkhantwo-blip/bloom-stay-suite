

# Enhanced Staff Management - Create Staff & Actions

## Overview
Enhance the Create Staff Account dialog to include all requested fields and add full action functionality (Add/Edit/Deactivate, Reset Password, Assign Role, Assign Shifts) to the staff management system.

---

## Current State Analysis

### Existing Fields in CreateStaffDialog:
- Full name ✓
- Username ✓
- Password ✓
- Phone ✓
- Roles ✓
- Property access ✓
- Require password change ✓

### Missing Fields (to add):
- Photo upload
- Staff ID (auto-generated or manual)
- Department selection
- Email (currently auto-generated, make editable or show)
- Join date
- Employment type (Full-time / Part-time / Contract)
- Salary info (amount, currency)
- Notes

### Existing Actions:
- Add (Create Staff) ✓
- Edit (via StaffDetailDrawer) ✓
- Deactivate ✓
- Delete ✓

### Missing Actions:
- Reset Password
- Assign Shifts (quick dialog)

---

## Implementation Plan

### Phase 1: Enhanced Create Staff Dialog

**File: `src/components/staff/CreateStaffDialog.tsx`**

Expand the dialog to include:

1. **Personal Information Section**
   - Full name (existing)
   - Photo upload (new - optional during creation)
   - Staff ID (new - auto-generate or manual entry)
   - Email (new - optional, auto-generates if blank)

2. **Account Credentials Section**
   - Username (existing)
   - Password (existing)
   - Require password change (existing)

3. **Employment Details Section**
   - Department (new - dropdown from hr_departments)
   - Join date (new - date picker, default today)
   - Employment type (new - dropdown: Full-time/Part-time/Contract)
   - Property/branch (existing)

4. **Contact Information Section**
   - Phone (existing)
   - Notes (new - textarea)

5. **Salary Information Section** (Admin only)
   - Salary amount (new)
   - Salary currency (new - dropdown: BDT, USD, etc.)

6. **Roles Section**
   - Role selection cards (existing)

### Phase 2: Update Edge Function

**File: `supabase/functions/create-staff/index.ts`**

Extend the request interface to accept new fields:
```text
- staffId (optional, auto-generate if blank)
- departmentId (optional)
- joinDate (optional, default to today)
- employmentType (required: full_time/part_time/contract)
- salaryAmount (optional)
- salaryCurrency (optional, default BDT)
- notes (optional)
```

After creating the profile, also create an `hr_staff_profiles` record with the extended fields.

### Phase 3: Enhanced Staff Detail Drawer

**File: `src/components/staff/StaffDetailDrawer.tsx`**

Add new tabs/sections:

1. **HR Details Tab** (new)
   - Staff ID
   - Department
   - Join date
   - Employment type
   - Salary info (visible to owner/manager only)
   - Notes

2. **Profile Tab** (enhanced)
   - Keep existing fields
   - Add editable email field

3. **New Action Buttons:**

   **Reset Password Button:**
   - Opens a dialog to set new password
   - Calls edge function to update auth user password
   
   **Assign Shifts Button:**
   - Opens a dialog with shift calendar for the next 7 days
   - Shows available shifts from hr_shifts
   - Allows quick assignment to hr_shift_assignments

### Phase 4: Reset Password Dialog

**File: `src/components/staff/ResetPasswordDialog.tsx`** (new)

Features:
- New password input
- Confirm password input
- Toggle "require change on login"
- Generate random password button
- Calls edge function: `reset-staff-password`

### Phase 5: Reset Password Edge Function

**File: `supabase/functions/reset-staff-password/index.ts`** (new)

- Accepts: userId, newPassword, mustChangePassword
- Verifies caller is owner/manager
- Uses admin client to update password
- Updates profiles.must_change_password flag

### Phase 6: Assign Shifts Dialog

**File: `src/components/staff/AssignShiftsDialog.tsx`** (new)

Features:
- 7-day calendar view
- Shows available shifts per day
- Toggle shifts for the staff member
- Saves to hr_shift_assignments table

### Phase 7: Staff Card Enhancements

**File: `src/components/staff/StaffCard.tsx`**

Add to dropdown menu:
- Reset Password (opens dialog)
- Assign Shifts (opens dialog)
- View HR Details (scrolls to HR tab in drawer)

### Phase 8: Hook Updates

**File: `src/hooks/useStaff.tsx`**

Extend StaffMember interface to include:
```text
- staff_id
- department_id
- department_name
- join_date
- employment_type
- salary_amount (only for authorized roles)
- salary_currency
- notes
```

Join with hr_staff_profiles to get extended data.

---

## Database Considerations

### Existing Tables Used:
- `profiles` - Core user data
- `hr_staff_profiles` - Extended HR data
- `hr_departments` - Department list
- `hr_shifts` - Shift definitions
- `hr_shift_assignments` - Staff-shift mappings
- `user_roles` - Role assignments
- `property_access` - Property permissions

### Auto-generate Staff ID Logic:
Format: `{DEPT_CODE}-{YEAR}-{SEQUENCE}`
Example: `FD-2026-001` (Front Desk, 2026, first employee)

---

## UI/UX Improvements

### Create Staff Dialog Layout:
- Multi-step wizard OR
- Scrollable single form with collapsible sections
- Photo upload with preview
- Department dropdown with "Add New" option

### Staff Card Enhancements:
- Show department badge
- Show employment type indicator
- Quick action icons on hover

### Staff Detail Drawer:
- 4 tabs: Profile | HR Details | Roles | Access
- Action bar with: Reset Password, Assign Shifts
- Salary section hidden from non-admin roles

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/staff/CreateStaffDialog.tsx` | Modify | Add new fields |
| `src/components/staff/StaffDetailDrawer.tsx` | Modify | Add HR tab, actions |
| `src/components/staff/StaffCard.tsx` | Modify | Add menu items |
| `src/components/staff/ResetPasswordDialog.tsx` | Create | Password reset UI |
| `src/components/staff/AssignShiftsDialog.tsx` | Create | Quick shift assignment |
| `src/hooks/useStaff.tsx` | Modify | Include HR data |
| `src/hooks/useDepartments.tsx` | Create | Department fetching |
| `src/hooks/useShifts.tsx` | Create | Shift management |
| `supabase/functions/create-staff/index.ts` | Modify | Handle new fields |
| `supabase/functions/reset-staff-password/index.ts` | Create | Password reset API |

---

## Security Considerations

1. **Salary Information**: Only visible/editable by `owner` and `manager` roles
2. **Reset Password**: Only `owner` can reset passwords (not even managers)
3. **Shift Assignment**: `owner`, `manager`, and `front_desk` can assign shifts
4. **RLS Policies**: Already in place for hr_staff_profiles, hr_shifts, hr_shift_assignments

---

## Implementation Order

1. Create `useDepartments` hook
2. Enhance `CreateStaffDialog` with new fields
3. Update `create-staff` edge function to handle extended fields
4. Update `useStaff` hook to fetch hr_staff_profiles data
5. Create `ResetPasswordDialog` component
6. Create `reset-staff-password` edge function
7. Create `AssignShiftsDialog` component
8. Create `useShifts` hook
9. Enhance `StaffDetailDrawer` with HR Details tab and actions
10. Update `StaffCard` with new menu options

---

## Form Fields Summary

### CreateStaffDialog New Fields:
```text
┌─────────────────────────────────────────────┐
│ Personal Information                         │
├─────────────────────────────────────────────┤
│ [Photo Upload]        Full Name: _________  │
│                       Staff ID: _________   │
│                       Email: _________      │
├─────────────────────────────────────────────┤
│ Account Credentials                          │
├─────────────────────────────────────────────┤
│ Username: _________   Password: _________   │
│ [x] Require password change on first login  │
├─────────────────────────────────────────────┤
│ Employment Details                           │
├─────────────────────────────────────────────┤
│ Department: [dropdown]                       │
│ Employment Type: [Full-time ▼]              │
│ Join Date: [date picker]                    │
│ Property/Branch: [multi-select]             │
├─────────────────────────────────────────────┤
│ Contact & Notes                              │
├─────────────────────────────────────────────┤
│ Phone: _________                            │
│ Notes: [textarea]                           │
├─────────────────────────────────────────────┤
│ Salary (Admin Only)                          │
├─────────────────────────────────────────────┤
│ Amount: _________   Currency: [BDT ▼]       │
├─────────────────────────────────────────────┤
│ Assign Roles                                 │
├─────────────────────────────────────────────┤
│ [Role cards grid - existing]                │
└─────────────────────────────────────────────┘
```

