
## Fix: Calendar Reservation Block Width Not Showing Full Date Range

### Problem

A reservation from January 26 to January 29 (3 nights) only displays as spanning January 26-27 (1 day width) on the calendar timeline.

### Root Cause

In `CalendarTimeline.tsx`, the date parsing uses JavaScript's native `new Date()` constructor on date-only strings:

```typescript
const checkIn = new Date(reservation.check_in_date);  // "2026-01-26"
const checkOut = new Date(reservation.check_out_date); // "2026-01-29"
```

**The Issue**: When `new Date()` parses a date-only string like `"2026-01-29"`, it interprets it as **UTC midnight**. When `differenceInDays()` from date-fns then compares these dates with the `startDate` (which is created as a local date), timezone mismatches cause incorrect day calculations.

For example, in the `Asia/Dhaka` timezone (UTC+6):
- `"2026-01-29"` parsed as UTC midnight becomes `2026-01-29T00:00:00Z`
- But the calendar's `startDate` (from `addDays()`) is a local date
- This timezone mismatch causes `differenceInDays` to calculate incorrectly

### Solution

Replace `new Date()` with `parseISO()` from date-fns, which correctly parses ISO date strings as **local dates** without timezone shifting. This is the same pattern already used elsewhere in the codebase (ExtendStayDialog, GuestHistoryTab, useGuestAnalytics).

### Implementation

**File: `src/components/calendar/CalendarTimeline.tsx`**

1. Add `parseISO` to the date-fns import statement (line 2)
2. Change date parsing from `new Date()` to `parseISO()` (lines 62-63)

```typescript
// Before (line 2):
import { format, differenceInDays, isToday, addDays } from "date-fns";

// After:
import { format, differenceInDays, isToday, addDays, parseISO } from "date-fns";
```

```typescript
// Before (lines 62-63):
const checkIn = new Date(reservation.check_in_date);
const checkOut = new Date(reservation.check_out_date);

// After:
const checkIn = parseISO(reservation.check_in_date);
const checkOut = parseISO(reservation.check_out_date);
```

### Expected Result

After the fix:
- A reservation from Jan 26 to Jan 29 will correctly span 3 day columns (26, 27, 28)
- The block width will be calculated as `3 * CELL_WIDTH - 4` pixels (140px instead of ~44px)
- All reservations will display their full date range regardless of the user's timezone
