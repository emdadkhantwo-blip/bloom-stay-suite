

# Implementation Plan: Calendar Refresh Button and Date Display Fix

## Overview
This plan addresses two issues:
1. Add a **Refresh button** to the `/calendar` page to manually reload calendar data
2. Fix the **reservation block width display** issue where a 3-night stay appears shorter than expected

---

## Issue Analysis

### Current State
From the database, the reservation "Amdur Reza" has:
- **Check-In Date**: January 27, 2026 (Tuesday)
- **Check-Out Date**: January 30, 2026 (Friday)  
- **Duration**: 3 nights (27th, 28th, 29th)

The Stay Details panel correctly shows "3 nights", but the calendar block appears to only span about 1-2 days instead of 3 days.

### Root Cause Investigation
Looking at the `CalendarTimeline.tsx` calculation:

```typescript
const left = startOffset * CELL_WIDTH;
const width = duration * CELL_WIDTH - 4;
```

The issue is that the reservation block is subtracting 4px from the width for a "gap", but the visual positioning may not be aligning correctly with the actual dates. The block should:
- Start at column for Jan 27 (startOffset = 1 from Jan 26)
- Span 3 columns (Jan 27, 28, 29) ending at Jan 30 checkout

---

## Implementation Steps

### Step 1: Add Refresh Button to CalendarControls

**File**: `src/components/calendar/CalendarControls.tsx`

Add a new prop for refresh functionality and a Refresh button:

**Changes**:
1. Add `onRefresh` callback prop to the component interface
2. Add `isRefreshing` boolean prop to show loading state
3. Add a Refresh button with `RefreshCw` icon from lucide-react
4. Position it alongside existing navigation controls

```text
+------------------------------------------+
| [<] [Today] [>]  |  [Date Picker]  |  [Days Select]  |  [Refresh] |
+------------------------------------------+
```

### Step 2: Update Calendar Page to Handle Refresh

**File**: `src/pages/Calendar.tsx`

Add refresh functionality using React Query's refetch:

**Changes**:
1. Destructure `refetch` and `isRefetching` from `useCalendarReservations` hook
2. Create `handleRefresh` function that calls `refetch()`
3. Pass `onRefresh` and `isRefreshing` props to `CalendarControls`
4. Show toast on successful refresh

### Step 3: Fix Reservation Block Width Calculation

**File**: `src/components/calendar/CalendarTimeline.tsx`

The current width calculation appears correct mathematically, but there may be an edge case with how visible dates are clamped. Review and verify the calculation:

**Current logic**:
```typescript
const visibleStart = checkIn < rangeStart ? rangeStart : checkIn;
const visibleEnd = checkOut > rangeEnd ? rangeEnd : checkOut;

const startOffset = differenceInDays(visibleStart, rangeStart);
const duration = differenceInDays(visibleEnd, visibleStart);

const width = duration * CELL_WIDTH - 4;
```

**Potential fix**: 
Ensure that `rangeEnd` is correctly calculated as the last visible date PLUS one day (since checkOut is exclusive - guest leaves on checkout day). The current `rangeEnd = addDays(rangeStart, dateRange.length)` should be correct, but verify the comparison logic.

If needed, add console logging temporarily to debug the actual values during rendering.

### Step 4: Verify Date Parsing is Using Local Time

The project memory indicates that `parseISO` from date-fns should be used for all date parsing to ensure local timezone interpretation. Verify all date operations in CalendarTimeline use this consistently.

---

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/calendar/CalendarControls.tsx` | Modify | Add Refresh button and props |
| `src/pages/Calendar.tsx` | Modify | Add refresh handler and pass to CalendarControls |
| `src/components/calendar/CalendarTimeline.tsx` | Modify | Review and fix block width calculation if needed |

---

## UI Preview

### CalendarControls After Changes
```text
+----------------------------------------------------------------------+
| [<] [Today] [>]  [Jan 26 - Feb 8, 2026]  [14 Days v]  [Refresh ↻]   |
+----------------------------------------------------------------------+
```

### Refresh Button Behavior
- Shows spinning animation when refreshing
- Displays "Refreshing..." or changes icon state while loading
- Shows success toast: "Calendar refreshed"

---

## Technical Details

### Refresh Button Implementation

```typescript
// CalendarControls.tsx
interface CalendarControlsProps {
  startDate: Date;
  numDays: number;
  onStartDateChange: (date: Date) => void;
  onNumDaysChange: (days: number) => void;
  onRefresh?: () => void;      // NEW
  isRefreshing?: boolean;       // NEW
}

// Add button in the controls JSX:
<Button 
  variant="outline" 
  size="icon" 
  onClick={onRefresh}
  disabled={isRefreshing}
>
  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
</Button>
```

### Calendar Page Refresh Handler

```typescript
// Calendar.tsx
const { data, isLoading, refetch, isRefetching } = useCalendarReservations(startDate, numDays);

const handleRefresh = async () => {
  await refetch();
  toast.success("Calendar refreshed");
};

// Pass to CalendarControls:
<CalendarControls
  // ...existing props
  onRefresh={handleRefresh}
  isRefreshing={isRefetching}
/>
```

### Block Width Fix Investigation

The block width for a 3-night stay (Jan 27 - Jan 30) should be:
- `duration = 3` (differenceInDays between Jan 30 and Jan 27)
- `width = 3 * 48 - 4 = 140px`

If the visual shows less than 3 columns, potential issues:
1. The startDate/rangeEnd clamping logic may be cutting off the block
2. There could be a CSS positioning issue with the left offset
3. The parent container width may be constraining the block

Debug approach: Add temporary console.log in the component to verify calculated values match expected values.

---

## Testing Checklist

1. Click Refresh button - calendar data reloads with spinning icon
2. Create a 3-night reservation (e.g., Jan 27-30) and verify block spans 3 columns
3. Verify existing drag-and-drop functionality still works
4. Verify Today button and navigation arrows still work
5. Verify date picker still works for selecting start date

