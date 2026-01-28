
# Implement Full HR Module Functionality

## Overview
Complete the implementation of 6 HR module sections that currently show placeholder UI. Each section needs data hooks, real database integration, and functional UI components with CRUD operations.

---

## Sections to Implement

| Section | Database Tables | Key Features |
|---------|-----------------|--------------|
| Leave Management | hr_leave_types, hr_leave_requests, hr_leave_balances | Apply for leave, approve/reject, view calendar |
| Payroll | hr_payroll_periods, hr_payroll_entries | Generate monthly payroll, view pay breakdown |
| Overtime | hr_overtime_entries | Log overtime, approve entries, calculate costs |
| Performance | hr_performance_notes | Add feedback/warnings/rewards, track ratings |
| Documents | hr_documents (already working) | Already implemented - needs minor fixes only |
| Activity Logs | audit_logs | View HR-related activities for auditing |

---

## Implementation Plan

### 1. Leave Management (`/hr/leave`)

**New Hook: `src/hooks/useLeaveManagement.tsx`**
- Fetch leave types with days_per_year
- Fetch leave requests with staff info
- Fetch leave balances per staff member
- Submit leave request mutation
- Approve/reject leave request mutations
- Calculate stats (pending, approved, rejected, on leave today)

**New Components:**
- `ApplyLeaveDialog.tsx` - Form to submit leave request (date range, leave type, reason)
- `LeaveRequestCard.tsx` - Display leave request with approve/reject actions
- `CreateLeaveTypeDialog.tsx` - For managers to add new leave types

**Page Updates (`Leave.tsx`):**
- Connect to useLeaveManagement hook
- Display real leave types from database
- Show leave requests table with status badges
- Add leave calendar showing approved leaves
- Stats bar shows real counts

---

### 2. Payroll (`/hr/payroll`)

**New Hook: `src/hooks/usePayroll.tsx`**
- Fetch payroll periods (month/year based)
- Fetch payroll entries with staff salary data
- Generate payroll mutation (creates entries for all staff)
- Calculate totals (gross, net, overtime, deductions)
- Finalize payroll period mutation

**New Components:**
- `GeneratePayrollDialog.tsx` - Confirm dialog before generating
- `PayrollEntryRow.tsx` - Individual staff payroll line
- `PayrollSummaryCard.tsx` - Totals and breakdown

**Page Updates (`Payroll.tsx`):**
- Connect to usePayroll hook
- Generate payroll button creates entries from hr_staff_profiles salary
- Display payroll table with basic, allowances, deductions, overtime, net
- Export functionality (CSV download)
- Status indicator (Draft, Processing, Finalized)

---

### 3. Overtime (`/hr/overtime`)

**New Hook: `src/hooks/useOvertime.tsx`**
- Fetch overtime entries with staff info
- Add overtime entry mutation
- Approve/reject overtime mutation
- Calculate total hours and costs
- Link approved overtime to payroll

**New Components:**
- `AddOvertimeDialog.tsx` - Log new overtime (staff, date, hours, rate multiplier)
- `OvertimeEntryCard.tsx` - Display with approve/reject actions

**Page Updates (`Overtime.tsx`):**
- Connect to useOvertime hook
- Real stats from database
- Add Entry button opens dialog
- Table of overtime entries with status
- Filter by status (pending, approved, rejected)

---

### 4. Performance (`/hr/performance`)

**New Hook: `src/hooks/usePerformance.tsx`**
- Fetch performance notes with author and staff info
- Add performance note mutation
- Filter by note type (feedback, warning, reward, kpi)
- Calculate average ratings

**New Components:**
- `AddPerformanceNoteDialog.tsx` - Add new note (select staff, type, content, rating)
- `PerformanceNoteCard.tsx` - Display note with type badge and rating stars
- `StaffPerformanceList.tsx` - Staff list with average ratings

**Page Updates (`Performance.tsx`):**
- Connect to usePerformance hook
- Staff list shows real employees with their ratings
- Notes list shows actual performance notes
- Filter tabs work with real data
- Add Note button opens dialog

---

### 5. Documents (Already Mostly Working)

The Documents page is already implemented with `useHRDocuments` hook. Minor enhancements:
- Add "Upload Document" button for adding documents to existing staff
- Delete document functionality

---

### 6. Activity Logs (`/hr/activity`)

**New Hook: `src/hooks/useHRActivityLogs.tsx`**
- Fetch audit_logs filtered to HR-related actions
- Filter by action category
- Include user names via profile lookup
- Calculate stats (total, today, role changes, logins)

**Page Updates (`Activity.tsx`):**
- Connect to useHRActivityLogs hook
- Display real audit logs in table
- Filter by action category works
- Search by user name works
- Stats show real counts

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useLeaveManagement.tsx` | Leave requests and balances |
| `src/hooks/usePayroll.tsx` | Payroll periods and entries |
| `src/hooks/useOvertime.tsx` | Overtime entries |
| `src/hooks/usePerformance.tsx` | Performance notes |
| `src/hooks/useHRActivityLogs.tsx` | HR activity audit logs |
| `src/components/hr/ApplyLeaveDialog.tsx` | Leave request form |
| `src/components/hr/LeaveRequestCard.tsx` | Leave request display |
| `src/components/hr/CreateLeaveTypeDialog.tsx` | Add leave type |
| `src/components/hr/GeneratePayrollDialog.tsx` | Payroll generation |
| `src/components/hr/PayrollTable.tsx` | Payroll entries table |
| `src/components/hr/AddOvertimeDialog.tsx` | Log overtime |
| `src/components/hr/OvertimeTable.tsx` | Overtime entries table |
| `src/components/hr/AddPerformanceNoteDialog.tsx` | Add performance note |
| `src/components/hr/PerformanceNoteCard.tsx` | Note display |
| `src/components/hr/StaffPerformanceList.tsx` | Staff ratings list |
| `src/components/hr/ActivityLogTable.tsx` | Activity log display |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/hr/Leave.tsx` | Full implementation with hooks and dialogs |
| `src/pages/hr/Payroll.tsx` | Full implementation with payroll generation |
| `src/pages/hr/Overtime.tsx` | Full implementation with overtime tracking |
| `src/pages/hr/Performance.tsx` | Full implementation with notes |
| `src/pages/hr/Documents.tsx` | Add upload/delete functionality |
| `src/pages/hr/Activity.tsx` | Full implementation with audit logs |

---

## Database Status

All required tables already exist:
- `hr_leave_types` - Leave type definitions
- `hr_leave_requests` - Leave applications
- `hr_leave_balances` - Per-employee leave balances
- `hr_payroll_periods` - Monthly payroll periods
- `hr_payroll_entries` - Individual payroll records
- `hr_overtime_entries` - Overtime logs
- `hr_performance_notes` - Performance feedback
- `audit_logs` - Activity tracking

No database migrations needed - only frontend implementation.

---

## Key Features Per Section

### Leave Management
- Staff can apply for leave via dialog
- Managers see pending requests and can approve/reject
- Leave calendar shows who's on leave
- Balance tracking per leave type

### Payroll
- Select month/year period
- Generate payroll pulls salary from hr_staff_profiles
- View breakdown per employee
- Finalize to lock changes
- Export to CSV

### Overtime
- Log extra hours worked
- Different rate multipliers (1.5x weekday, 2x weekend, 2.5x holiday)
- Approval workflow
- Automatically added to payroll

### Performance
- Four note types: Feedback, Warning, Reward, KPI Review
- Optional 1-5 star rating
- Filter by type
- Staff summary with average rating

### Activity Logs
- Filter by category (Login, Attendance, Role Changes, Payroll, Leave, Documents)
- Search functionality
- Shows user, action, timestamp
- Today's activity count
