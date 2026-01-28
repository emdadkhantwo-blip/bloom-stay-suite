
# Single Calendar with Date Range Selection for New Reservation

## Overview
Replace the two separate check-in and check-out date pickers with a single calendar popup that allows you to select your stay dates by clicking directly on the calendar. Click the start date, then click the end date - the selected range will be highlighted visually.

---

## What Changes

### Before (Current)
Two separate buttons, each opening their own calendar:
- "Check-in Date" button opens calendar to pick start
- "Check-out Date" button opens calendar to pick end

### After (New)
One button labeled "Stay Dates" opens a single calendar where you:
1. Click your arrival date (first click)
2. Click your departure date (second click)
3. See the entire range highlighted between both dates

---

## Implementation Details

### File to Modify: `src/components/reservations/NewReservationDialog.tsx`

**Changes:**

1. **Add DateRange type import** from react-day-picker for type safety

2. **Replace two form fields with one combined field** that uses range selection:
   - Single popover trigger showing "Jan 28 - Jan 30" format
   - Calendar opens in `mode="range"` instead of `mode="single"`
   - User clicks start date, then end date on same calendar
   - Both dates stored and synced to form fields

3. **Update Calendar component usage**:
   - Change from `mode="single"` to `mode="range"`
   - Use `selected={{ from: checkInDate, to: checkOutDate }}` for the range
   - Handle range selection with `onSelect` that updates both dates

4. **Show 2 months side by side** for easier range selection:
   - Add `numberOfMonths={2}` prop to show current and next month together
   - Makes selecting ranges that span months much easier

---

## Technical Implementation

### Key Code Changes

```typescript
// Import DateRange type
import { DateRange } from "react-day-picker";

// Combined date range state derived from form
const dateRange: DateRange | undefined = useMemo(() => {
  if (checkInDate && checkOutDate) {
    return { from: checkInDate, to: checkOutDate };
  }
  if (checkInDate) {
    return { from: checkInDate, to: undefined };
  }
  return undefined;
}, [checkInDate, checkOutDate]);

// Handle range selection
const handleDateRangeSelect = (range: DateRange | undefined) => {
  form.setValue("check_in_date", range?.from);
  form.setValue("check_out_date", range?.to);
};
```

### UI Layout

| Component | Change |
|-----------|--------|
| Grid layout | Change from 2-column to single full-width |
| Trigger button | Shows range (e.g., "Jan 28 - Jan 30, 2025") or "Select stay dates" |
| Calendar | `mode="range"` with `numberOfMonths={2}` |
| Display | Both dates shown on single button, nights count below |

---

## Visual Behavior

1. **Initial state**: Button shows "Select stay dates" placeholder
2. **First click**: Selected date becomes start, button shows "Jan 28 - Select end date"
3. **Hover dates after first click**: Shows preview highlight between start and hovered date
4. **Second click**: Completes range, button shows "Jan 28 - Jan 30, 2025"
5. **Click again**: Resets and starts new selection

---

## Validation

- Cannot select check-in date in the past (dates before today are disabled)
- Range automatically ensures check-out is after check-in
- Visual feedback shows the full selected range highlighted on calendar

---

## No Database Changes Required

This is purely a UI/UX improvement to the date selection experience. Form data structure remains the same.
