

# Multi-Select Individual Dates for Reservation Calendar

## Overview
Change the calendar from range selection to multi-select mode, allowing you to click on each individual date you want to reserve. Each date you click gets selected/highlighted, and clicking again deselects it.

---

## What Changes

### Before (Current - Range Mode)
- Click start date, click end date
- All dates between are automatically included
- Example: Click Jan 1, click Jan 8 = selects Jan 1-8 (8 nights)

### After (Multi-Select Mode)
- Click each date you want individually
- Only clicked dates are selected
- Example: Click Jan 1, Jan 2, Jan 7, Jan 8 = selects only those 4 dates (3 nights)

---

## Implementation Details

### File to Modify: `src/components/reservations/NewReservationDialog.tsx`

**Changes:**

1. **Update imports** - Remove DateRange, add standard Date array type

2. **Add local state for selected dates**
```typescript
const [selectedDates, setSelectedDates] = useState<Date[]>([]);
```

3. **Change Calendar mode from "range" to "multiple"**
```typescript
<Calendar
  mode="multiple"
  selected={selectedDates}
  onSelect={(dates: Date[] | undefined) => {
    const sortedDates = (dates || []).sort((a, b) => a.getTime() - b.getTime());
    setSelectedDates(sortedDates);
    
    // Auto-set check_in as first date, check_out as last date
    if (sortedDates.length > 0) {
      form.setValue("check_in_date", sortedDates[0]);
      form.setValue("check_out_date", sortedDates[sortedDates.length - 1]);
    } else {
      form.setValue("check_in_date", undefined);
      form.setValue("check_out_date", undefined);
    }
  }}
  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
  numberOfMonths={2}
  initialFocus
  className="pointer-events-auto"
/>
```

4. **Update nights calculation** to count selected nights (dates - 1)
```typescript
const nights = useMemo(() => {
  if (selectedDates.length < 2) return 0;
  return selectedDates.length - 1; // Number of nights = number of dates - 1
}, [selectedDates]);
```

5. **Update trigger button display** to show selected dates summary
```typescript
{selectedDates.length > 0 ? (
  <span>
    {selectedDates.length} date{selectedDates.length !== 1 ? "s" : ""} selected
    {selectedDates.length >= 2 && (
      <span className="text-muted-foreground ml-1">
        ({format(selectedDates[0], "MMM d")} - {format(selectedDates[selectedDates.length - 1], "MMM d")})
      </span>
    )}
  </span>
) : (
  <span>Select stay dates</span>
)}
```

6. **Add visual feedback below button** showing all selected dates
```typescript
{selectedDates.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {selectedDates.map((date) => (
      <Badge key={date.toISOString()} variant="secondary" className="text-xs">
        {format(date, "MMM d")}
      </Badge>
    ))}
  </div>
)}
```

7. **Reset selectedDates** when dialog closes or form resets

---

## Visual Behavior

| Step | Action | Result |
|------|--------|--------|
| 1 | Open calendar | Empty, "Select stay dates" shown |
| 2 | Click Jan 1 | Jan 1 highlighted, button shows "1 date selected" |
| 3 | Click Jan 2 | Both Jan 1 & 2 highlighted, "2 dates selected (Jan 1 - Jan 2)" |
| 4 | Click Jan 7 | Jan 1, 2, 7 highlighted (3 dates) |
| 5 | Click Jan 8 | Jan 1, 2, 7, 8 highlighted, "4 dates selected (Jan 1 - Jan 8)" |
| 6 | Click Jan 2 again | Jan 2 deselected, now 3 dates remain |

---

## Data Handling

- `check_in_date` = First (earliest) selected date
- `check_out_date` = Last (latest) selected date
- These are auto-computed from the selected dates array
- The database stores only check-in and check-out (existing schema preserved)
- The actual individual dates selected are represented by the booking

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/reservations/NewReservationDialog.tsx` | Change calendar mode, add selectedDates state, update display logic |

---

## No Database Changes Required

The database schema remains unchanged - it still stores `check_in_date` and `check_out_date`. The multi-select is purely a UI enhancement for selecting the date range boundaries by clicking individual dates.

---

## Important Note

With this approach:
- The **first date** you select becomes check-in
- The **last date** you select becomes check-out
- The dates in between that you select are for visual confirmation
- The reservation still covers from check-in to check-out in the system

If you need the system to only charge for specific non-contiguous nights (e.g., only Jan 1-2 and Jan 7-8, not Jan 3-6), that would require database schema changes to store individual booked dates.

