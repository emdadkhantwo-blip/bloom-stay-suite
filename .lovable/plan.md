
# Add Monthly Attendance Sheet to Attendance Page

## Overview
Add a comprehensive monthly attendance sheet view to the `/hr/attendance` page where users can view all employees' attendance for the entire month in a grid format.

---

## Current State
- Attendance page shows daily view with stats bar, personal clock widget, and today's attendance table
- `useAttendance` hook fetches attendance for a single date only
- `hr_attendance` table stores: profile_id, date, clock_in, clock_out, is_late, worked_hours, etc.

---

## Solution Design

### New Component: MonthlyAttendanceSheet

A grid-based table showing:
- **Rows**: Each staff member (name + position)
- **Columns**: Each day of the selected month (1-31)
- **Cells**: Attendance status indicator (Present/Absent/Late/Leave)

```text
Monthly Attendance - January 2026
┌─────────────────┬─────┬─────┬─────┬─────┬─────┬───┬─────┬─────────┐
│ Staff           │  1  │  2  │  3  │  4  │  5  │...│ 31  │ Summary │
├─────────────────┼─────┼─────┼─────┼─────┼─────┼───┼─────┼─────────┤
│ John (Manager)  │  P  │  P  │  L  │  P  │  A  │...│  P  │ 25/31   │
│ Sarah (F.Desk)  │  P  │  P  │  P  │  P  │  P  │...│  P  │ 28/31   │
│ Mike (Kitchen)  │  A  │  P  │  P  │  P  │  L  │...│  P  │ 22/31   │
└─────────────────┴─────┴─────┴─────┴─────┴─────┴───┴─────┴─────────┘

Legend: P=Present, A=Absent, L=Late, H=Holiday, W=Weekend
```

---

## Implementation Plan

### Phase 1: Create Monthly Attendance Hook

**File: `src/hooks/useMonthlyAttendance.tsx`**

```typescript
interface MonthlyAttendanceData {
  staff: {
    profile_id: string;
    full_name: string;
    avatar_url: string | null;
    position: string;
    attendance: Record<string, AttendanceStatus>; // key: "YYYY-MM-DD"
    summary: {
      present: number;
      absent: number;
      late: number;
      totalDays: number;
    };
  }[];
  month: Date;
  isLoading: boolean;
}
```

Features:
- Accept month/year as parameters
- Fetch all attendance records for the entire month range
- Fetch all staff profiles with roles
- Aggregate attendance by date for each staff member
- Calculate monthly summaries per staff

Query approach:
```typescript
// Fetch attendance for entire month
const { data: attendance } = await supabase
  .from("hr_attendance")
  .select("*")
  .eq("tenant_id", tenantId)
  .gte("date", startOfMonth)
  .lte("date", endOfMonth);
```

---

### Phase 2: Create Monthly Attendance Sheet Component

**File: `src/components/hr/MonthlyAttendanceSheet.tsx`**

Features:

1. **Month Selector**
   - Previous/Next month buttons
   - Month/Year picker dropdown

2. **Scrollable Grid Table**
   - Fixed first column (staff names)
   - Horizontally scrollable date columns
   - Color-coded cells for status

3. **Status Indicators**
   | Status | Color | Symbol |
   |--------|-------|--------|
   | Present | Green | P or checkmark |
   | Absent | Red | A or X |
   | Late | Orange | L |
   | Weekend | Gray | W |
   | Holiday | Purple | H |

4. **Summary Column**
   - Total present days
   - Attendance percentage
   - Total worked hours (optional)

5. **Legend**
   - Visual guide for status colors/symbols

---

### Phase 3: Update Attendance Page

**File: `src/pages/hr/Attendance.tsx`**

Add a tabbed interface:

```text
┌────────────────────────────────────────────────────┐
│ [Today's Attendance] [Monthly Sheet]               │
├────────────────────────────────────────────────────┤
│                                                    │
│  (Content based on selected tab)                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

- **Today's Attendance Tab**: Current daily view (stats bar + clock widget + table)
- **Monthly Sheet Tab**: New monthly grid view

---

## Detailed Component Structure

### MonthlyAttendanceSheet.tsx

```typescript
interface MonthlyAttendanceSheetProps {
  // Optional initial month, defaults to current
  initialMonth?: Date;
}

// Internal state
const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));

// Use monthly attendance hook
const { staffAttendance, isLoading } = useMonthlyAttendance(selectedMonth);
```

### UI Layout:

```text
┌───────────────────────────────────────────────────────────────────┐
│ ◀ Previous  │ January 2026 ▼ │  Next ▶  │  [Export CSV] (future) │
├───────────────────────────────────────────────────────────────────┤
│              │ Days of Month (1-31)                      │Summary│
├──────────────┼────────────────────────────────────────────┼───────┤
│ Staff        │  1   2   3   4   5   6   7  ...  30   31  │  P/T  │
│──────────────┼────────────────────────────────────────────┼───────│
│ [👤] John    │  ✓   ✓   L   ✓   ✓   W   W  ...   ✓    ✓  │ 25/31 │
│ [👤] Sarah   │  ✓   ✓   ✓   ✓   A   W   W  ...   ✓    ✓  │ 28/31 │
│ [👤] Mike    │  A   ✓   ✓   ✓   L   W   W  ...   ✓    ✓  │ 22/31 │
└──────────────┴────────────────────────────────────────────┴───────┘

Legend: ✓ Present  L Late  A Absent  W Weekend
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useMonthlyAttendance.tsx` | Fetch and aggregate monthly attendance data |
| `src/components/hr/MonthlyAttendanceSheet.tsx` | Grid view component for monthly attendance |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/hr/Attendance.tsx` | Add Tabs component with daily/monthly views |

---

## Technical Details

### Date Handling
- Use `date-fns` functions: `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `format`, `isWeekend`
- Generate array of all days in month for column headers
- Weekend detection for visual differentiation

### Data Aggregation
```typescript
// Create a map of attendance by date for each staff
const attendanceMap: Record<string, Record<string, AttendanceRecord>> = {};

// staff_id -> { "2026-01-15": { status: "present", is_late: false }, ... }
```

### Responsive Design
- Mobile: Show only staff name + summary, with option to expand individual days
- Desktop: Full grid with horizontal scroll
- Use ScrollArea component for smooth scrolling

### Status Calculation Logic
```typescript
function getStatus(record: AttendanceRecord | undefined, date: Date): AttendanceStatus {
  if (isWeekend(date)) return "weekend";
  if (!record) return "absent";
  if (record.clock_in) {
    if (record.is_late) return "late";
    return "present";
  }
  return "absent";
}
```

---

## UI Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| Tabs | shadcn/ui | Switch between daily/monthly views |
| ScrollArea | shadcn/ui | Horizontal scroll for date columns |
| Table | shadcn/ui | Grid structure |
| Button | shadcn/ui | Month navigation |
| Select | shadcn/ui | Month/year picker |
| Badge | shadcn/ui | Status indicators |
| Avatar | shadcn/ui | Staff photos |
| Tooltip | shadcn/ui | Hover details (clock times) |

---

## Summary Statistics

At the bottom or side of the sheet:

| Metric | Description |
|--------|-------------|
| Total Present | Count of present days across all staff |
| Average Attendance | (Total Present / Total Expected) * 100% |
| Late Arrivals | Count of late days in month |
| Most Absent | Staff member with most absences |

---

## Future Enhancements (Out of Scope)

- Export to CSV/Excel
- Print-friendly view
- Holiday calendar integration
- Leave request integration
- Edit historical attendance (admin)
