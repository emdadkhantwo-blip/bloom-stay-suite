
# HR Management Module Implementation Plan

## Overview
This plan implements a comprehensive HR Management system with 10 distinct sections covering employee management, attendance tracking, scheduling, payroll, and compliance features.

---

## Phase 1: Database Schema Design

### 1.1 New Tables Required

**1. `hr_departments`** - Department classification
- id, tenant_id, name, code, manager_id (FK profiles), created_at, updated_at

**2. `hr_staff_profiles`** - Extended staff information (linked to profiles)
- id, tenant_id, profile_id (FK profiles), staff_id (employee number), department_id, employment_type (full_time/part_time/contract), join_date, salary_amount, salary_currency, bank_account, bank_name, emergency_contact_name, emergency_contact_phone, notes, created_at, updated_at

**3. `hr_permissions`** - Permission definitions
- id, code, name, description, category, created_at

**4. `hr_role_permissions`** - Custom role-permission mapping
- id, tenant_id, role (app_role), permission_id, created_at

**5. `hr_attendance`** - Clock in/out records
- id, tenant_id, profile_id, date, clock_in, clock_out, break_start, break_end, is_late, is_early_departure, worked_hours, ip_address, notes, created_at

**6. `hr_shifts`** - Shift templates
- id, tenant_id, property_id, name, start_time, end_time, break_minutes, color, is_active, created_at

**7. `hr_shift_assignments`** - Staff-to-shift scheduling
- id, tenant_id, profile_id, shift_id, date, status (scheduled/completed/absent), notes, created_at

**8. `hr_leave_types`** - Leave category definitions
- id, tenant_id, name, code, days_per_year, is_paid, color, is_active, created_at

**9. `hr_leave_balances`** - Employee leave quotas
- id, tenant_id, profile_id, leave_type_id, year, total_days, used_days, remaining_days, created_at

**10. `hr_leave_requests`** - Leave applications
- id, tenant_id, profile_id, leave_type_id, start_date, end_date, days, reason, status (pending/approved/rejected), reviewed_by, reviewed_at, notes, created_at

**11. `hr_payroll_periods`** - Monthly payroll cycles
- id, tenant_id, property_id, year, month, start_date, end_date, status (draft/finalized), finalized_by, finalized_at, created_at

**12. `hr_payroll_entries`** - Individual payroll records
- id, tenant_id, profile_id, period_id, basic_salary, allowances (JSONB), deductions (JSONB), overtime_pay, gross_pay, net_pay, attendance_days, created_at

**13. `hr_overtime_entries`** - Extra hours tracking
- id, tenant_id, profile_id, date, hours, rate_multiplier (1.5/2.0), status (pending/approved/rejected), approved_by, approved_at, payroll_entry_id, created_at

**14. `hr_performance_notes`** - Manager feedback/reviews
- id, tenant_id, profile_id, author_id, note_type (feedback/warning/reward/kpi), content, rating (1-5), created_at

**15. `hr_documents`** - Employee file storage
- id, tenant_id, profile_id, document_type, name, file_url, expiry_date, uploaded_by, notes, created_at

---

## Phase 2: Page Structure & Components

### 2.1 HR Staff Directory (`/hr/staff`)
**Enhanced Staff Page with additional fields**

Components:
- `HRStaffStatsBar.tsx` - Stats with department breakdown
- `HRStaffCard.tsx` - Enhanced card with salary (admin only), department
- `HRStaffDetailDrawer.tsx` - Full profile management
- `HRStaffFilters.tsx` - Filter by department, employment type

Features:
- Full employee database with extended fields
- Department assignment
- Employment type tracking
- Salary info (visible to owner/manager only)
- Actions: Add, Edit, Deactivate, Reset Password, Assign Role, Assign Shifts

### 2.2 Roles & Permissions (`/hr/roles`)
**Permission matrix management**

Components:
- `RolesList.tsx` - List of system roles
- `PermissionMatrix.tsx` - Checkbox grid for role-permission mapping
- `CreateCustomRoleDialog.tsx` - Add custom roles

Features:
- Display all roles with assigned permissions
- Editable permission checkboxes
- Permission categories (Reservations, Payments, Reports, etc.)
- Assign users to roles

### 2.3 Attendance (`/hr/attendance`)
**Time tracking system**

Components:
- `AttendanceClockWidget.tsx` - Clock in/out buttons
- `AttendanceTodayView.tsx` - Today's attendance list
- `AttendanceTimesheetView.tsx` - Monthly calendar view
- `AttendanceStatsBar.tsx` - Present/Absent/Late counts
- `MissingPunchesTable.tsx` - Records needing correction

Features:
- Clock-in/out with timestamp
- Break tracking
- Late/early flags (configurable thresholds)
- IP tracking (optional)
- Daily hours auto-calculation
- Monthly timesheet view
- Missing punch alerts

### 2.4 Shift Scheduling (`/hr/shifts`)
**Roster management**

Components:
- `ShiftCalendar.tsx` - Weekly drag-and-drop calendar
- `ShiftTemplates.tsx` - Morning/Evening/Night presets
- `CreateShiftDialog.tsx` - Define shift times
- `AssignShiftDialog.tsx` - Assign staff to shifts
- `ShiftConflictAlert.tsx` - Overlap warnings

Features:
- Weekly calendar view
- Drag-and-drop scheduling
- Shift templates (Morning 6AM-2PM, Evening 2PM-10PM, Night 10PM-6AM)
- Overtime alerts (>8 hours)
- Conflict detection
- Publish schedule notification

### 2.5 Leave Management (`/hr/leave`)
**Leave/holiday tracking**

Components:
- `LeaveRequestForm.tsx` - Apply for leave
- `LeaveApprovalQueue.tsx` - Pending requests for managers
- `LeaveCalendarView.tsx` - Team leave calendar
- `LeaveBalanceCard.tsx` - Individual balance display
- `LeaveTypesSettings.tsx` - Configure leave types

Features:
- Apply for leave (date range, type, reason)
- Leave types (Casual, Sick, Annual, Unpaid)
- Approve/Reject workflow
- Balance tracking per year
- Auto-deduction on approval
- Calendar view of team leaves

### 2.6 Payroll (`/hr/payroll`)
**Salary management (simplified)**

Components:
- `PayrollPeriodSelector.tsx` - Month/Year picker
- `PayrollSummaryTable.tsx` - All staff payroll overview
- `PayrollEntryCard.tsx` - Individual breakdown
- `GeneratePayslipButton.tsx` - PDF export
- `PayrollStatsBar.tsx` - Total costs summary

Features:
- Basic salary from hr_staff_profiles
- Allowances (Housing, Transport, etc.)
- Deductions (Tax, Insurance, Advances)
- Overtime pay (from approved hr_overtime_entries)
- Attendance-based calculation
- Generate payslip PDF
- Monthly payroll summary

### 2.7 Overtime (`/hr/overtime`)
**Extra hours tracking**

Components:
- `OvertimeRequestsTable.tsx` - List of overtime entries
- `OvertimeApprovalQueue.tsx` - Pending for manager
- `OvertimeSummaryStats.tsx` - Monthly hours/cost
- `OvertimeRateConfig.tsx` - Configure multipliers

Features:
- Auto-calculate from attendance (hours > shift duration)
- Rate multipliers (1.5x weekday, 2.0x weekend/holiday)
- Manager approval workflow
- Link to payroll entry
- Monthly summary by employee

### 2.8 Performance (`/hr/performance`)
**Employee feedback & reviews**

Components:
- `PerformanceNotesTimeline.tsx` - History of notes
- `AddPerformanceNoteDialog.tsx` - Create new entry
- `PerformanceStaffList.tsx` - Staff with ratings
- `KPIRatingWidget.tsx` - Star rating input

Features:
- Add performance notes (Feedback, Warning, Reward)
- KPI rating (1-5 stars)
- Note history per employee
- Filter by note type
- Manager-only access

### 2.9 Documents (`/hr/documents`)
**Employee file management**

Components:
- `DocumentUploadDialog.tsx` - Upload files
- `DocumentsTable.tsx` - File listing with expiry
- `DocumentExpiryAlerts.tsx` - Expiring soon warnings
- `DocumentTypeFilter.tsx` - Filter by category

Document Types:
- NID/Passport
- Employment Contract
- Certificates
- Offer Letter
- Other

Features:
- Upload to Supabase storage (`hr-documents` bucket)
- Document type categorization
- Expiry date tracking
- Expiry alerts (30 days before)
- Download/View actions

### 2.10 Activity Logs (`/hr/activity`)
**Audit trail for HR actions**

Components:
- `HRActivityLogTable.tsx` - Paginated log viewer
- `HRActivityFilters.tsx` - Filter by user/date/action
- `HRActivityStatsBar.tsx` - Action counts

Features:
- Log all HR-related actions
- Filter by user, date range, action type
- Action categories: Login, Attendance, Role Changes, Payroll Edits, Leave Approvals
- Read-only for audit purposes

---

## Phase 3: Routing & Navigation

### 3.1 Route Definitions (App.tsx)
Add routes for each HR page:
```text
/hr/staff - HR Staff Directory
/hr/roles - Roles & Permissions  
/hr/attendance - Attendance
/hr/shifts - Shift Scheduling
/hr/leave - Leave Management
/hr/payroll - Payroll
/hr/overtime - Overtime
/hr/performance - Performance
/hr/documents - Documents
/hr/activity - Activity Logs
```

### 3.2 Role Access Control
- Owner/Manager: Full access to all HR sections
- Other roles: No access (HR is admin-only)

---

## Phase 4: Storage Bucket

Create `hr-documents` storage bucket for employee files:
- Private bucket (requires authentication)
- RLS policies for owner/manager access

---

## Phase 5: Implementation Order

**Iteration 1 - Foundation:**
1. Database migrations for all tables
2. Create `hr-documents` storage bucket
3. Basic routing setup with placeholder pages

**Iteration 2 - Staff Directory:**
4. Enhanced Staff Directory page
5. Extended staff profile management

**Iteration 3 - Roles & Permissions:**
6. Permission definitions seeding
7. Permission matrix UI

**Iteration 4 - Attendance:**
8. Clock in/out functionality
9. Attendance views (today, timesheet)

**Iteration 5 - Scheduling & Leave:**
10. Shift scheduling calendar
11. Leave management system

**Iteration 6 - Payroll & Overtime:**
12. Overtime tracking
13. Payroll calculations & payslip

**Iteration 7 - Performance & Documents:**
14. Performance notes system
15. Document upload/management

**Iteration 8 - Activity Logs:**
16. HR activity logging
17. Activity log viewer

---

## Technical Notes

### Security Considerations
- All tables have tenant_id with RLS policies
- Salary information restricted to owner/manager roles
- Document access limited to HR administrators
- Activity logs are immutable (INSERT only)

### UI Patterns
- Follow existing vibrant UI design system
- Gradient stat cards matching current theme
- Color-coded status badges
- Drawer-based detail views

### Hooks Pattern
Each section will have a dedicated hook:
- `useHRStaffProfiles.tsx`
- `useHRAttendance.tsx`
- `useHRShifts.tsx`
- `useHRLeave.tsx`
- `useHRPayroll.tsx`
- `useHROvertime.tsx`
- `useHRPerformance.tsx`
- `useHRDocuments.tsx`
- `useHRActivityLogs.tsx`

---

## File Structure

```text
src/
  pages/
    hr/
      Staff.tsx
      Roles.tsx
      Attendance.tsx
      Shifts.tsx
      Leave.tsx
      Payroll.tsx
      Overtime.tsx
      Performance.tsx
      Documents.tsx
      Activity.tsx
  components/
    hr/
      staff/
      roles/
      attendance/
      shifts/
      leave/
      payroll/
      overtime/
      performance/
      documents/
      activity/
  hooks/
    hr/
      useHRStaffProfiles.tsx
      useHRAttendance.tsx
      useHRShifts.tsx
      useHRLeave.tsx
      useHRPayroll.tsx
      useHROvertime.tsx
      useHRPerformance.tsx
      useHRDocuments.tsx
      useHRActivityLogs.tsx
```

---

## Summary

This implementation creates a full-featured HR Management module with:
- 15 new database tables
- 10 new pages
- 40+ new components
- Comprehensive hooks for data management
- Proper RLS security
- Integration with existing staff/tenant system

The module follows existing codebase patterns and maintains the vibrant UI theme throughout.
