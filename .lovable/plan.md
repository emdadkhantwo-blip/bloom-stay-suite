

## Calendar Page Improvements Plan

### Issues Identified

After analyzing the codebase, I found three main issues:

| Issue | Root Cause |
|-------|-----------|
| **1. Checked-in details not showing** | The calendar query filters `status` to only include `confirmed` and `checked_in`, but the stats calculation looks for departures with status `checked_in` on today's checkout date. The display works correctly, but checked-in reservations without assigned rooms don't show on the calendar timeline. |
| **2. Room block click not showing details** | Currently, clicking a reservation block navigates to `/reservations?highlight={id}`, but the Reservations page doesn't parse this query parameter to auto-open the detail drawer. |
| **3. Cannot extend checkout time** | There's no UI to modify reservation dates. The `ReservationDetailDrawer` only shows dates but doesn't allow editing them. |

---

### Solution Overview

```text
+------------------+     +----------------------+     +------------------------+
|   Calendar Page  | --> | Click Reservation    | --> | Detail Drawer Opens    |
|                  |     | Block                |     | with Edit Capability   |
+------------------+     +----------------------+     +------------------------+
                                                              |
                                                              v
                                                      +------------------------+
                                                      | Extend Stay Dialog     |
                                                      | (Change checkout date) |
                                                      +------------------------+
```

---

### Technical Implementation

#### 1. Fix "Checked-In Details Not Showing"

**File: `src/hooks/useCalendarReservations.tsx`**

The issue is that reservations without room assignments don't appear on the calendar. Update the query to also show unassigned reservations.

Changes:
- Include reservations even if `room_id` is null in `reservation_rooms`
- Create a special "Unassigned" row to display reservations without room assignments
- Alternatively, show a badge or indicator for unassigned checked-in reservations

#### 2. Fix "Room Block Click Not Showing Details"

**Approach A: Open Detail Drawer Directly on Calendar Page (Recommended)**

Instead of navigating to `/reservations?highlight=...`, open a detail drawer directly on the Calendar page.

**Files to modify:**
- `src/pages/Calendar.tsx` - Add state for selected reservation and drawer
- Import and use `ReservationDetailDrawer` directly
- Fetch full reservation details when a block is clicked

**Changes:**
```typescript
// Calendar.tsx - Add drawer state and handlers
const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
const [drawerOpen, setDrawerOpen] = useState(false);

const handleReservationClick = async (calendarRes: CalendarReservation) => {
  // Fetch full reservation details
  const { data } = await supabase
    .from("reservations")
    .select("*, guest:guests(*), reservation_rooms(*, room:rooms(*), room_type:room_types(*))")
    .eq("id", calendarRes.id)
    .single();
  
  if (data) {
    setSelectedReservation(data);
    setDrawerOpen(true);
  }
};
```

#### 3. Add "Extend Stay" / "Modify Dates" Functionality

**New Files:**
- `src/components/reservations/ExtendStayDialog.tsx` - Dialog to modify check-in/check-out dates

**Files to modify:**
- `src/hooks/useReservations.tsx` - Add `useUpdateReservation` mutation
- `src/components/reservations/ReservationDetailDrawer.tsx` - Add "Extend Stay" button

**New hook in `useReservations.tsx`:**
```typescript
export function useUpdateReservation() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();

  return useMutation({
    mutationFn: async ({ 
      reservationId, 
      updates 
    }: { 
      reservationId: string; 
      updates: { check_out_date?: string; check_in_date?: string } 
    }) => {
      const { error } = await supabase
        .from("reservations")
        .update({ 
          ...updates,
          updated_at: new Date().toISOString() 
        })
        .eq("id", reservationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-reservations"] });
      toast.success("Reservation updated successfully");
    },
  });
}
```

**ExtendStayDialog component:**
```typescript
// Shows a date picker to select new check-out date
// Validates that new date is after current date
// Calculates additional nights and cost
// Updates reservation via useUpdateReservation hook
```

#### 4. Fix forwardRef Console Warnings

**File: `src/components/calendar/CalendarTimeline.tsx`**

The `TooltipTrigger` from Radix expects the child to accept refs, but `ReservationBlock` is a regular function component.

**Fix:**
```typescript
const ReservationBlock = forwardRef<HTMLButtonElement, ReservationBlockProps>(
  ({ reservation, startDate, dateRange, onClick }, ref) => {
    // ... component logic
    return (
      <button ref={ref} ...>
        {/* content */}
      </button>
    );
  }
);
ReservationBlock.displayName = "ReservationBlock";
```

Also wrap `CalendarTimeline` with `forwardRef` if needed.

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/reservations/ExtendStayDialog.tsx` | Dialog for changing check-in/check-out dates |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Calendar.tsx` | Add drawer state, fetch full reservation on click, include extend stay functionality |
| `src/components/calendar/CalendarTimeline.tsx` | Fix forwardRef warnings |
| `src/hooks/useReservations.tsx` | Add `useUpdateReservation` mutation |
| `src/hooks/useCalendarReservations.tsx` | Include checked-in reservations without room assignments |
| `src/components/reservations/ReservationDetailDrawer.tsx` | Add "Extend Stay" button and dialog trigger |

---

### UI/UX Changes

#### Calendar Page
When clicking a reservation block:
1. Detail drawer slides in from the right
2. Shows full reservation details (guest info, room assignments, folio, etc.)
3. Has action buttons: Check In, Check Out, Cancel, **Extend Stay** (new)

#### Extend Stay Dialog
```text
┌─────────────────────────────────────────────────────────┐
│ Extend Stay                                         [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Current Check-Out: Tue, Jan 28, 2026                   │
│                                                         │
│ New Check-Out Date:                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Calendar Picker]                               📅  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Additional Nights: 2                                │ │
│ │ Room Rate: ৳3,000/night                             │ │
│ │ Additional Cost: ৳6,000                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│           [Cancel]                    [Confirm Extension]│
└─────────────────────────────────────────────────────────┘
```

---

### Implementation Steps

1. **Fix forwardRef warnings** in `CalendarTimeline.tsx`
2. **Add `useUpdateReservation` hook** to `useReservations.tsx`
3. **Create `ExtendStayDialog` component** for modifying dates
4. **Update `ReservationDetailDrawer`** to include "Extend Stay" button
5. **Update `Calendar.tsx`** to open detail drawer on click instead of navigating
6. **Update `useCalendarReservations`** to show unassigned checked-in reservations

---

### Edge Cases Handled

- Validation that new checkout date is after check-in date
- Validation that new checkout date is after current date
- Room availability check for extended dates (optional)
- Recalculation of total amount for additional nights
- Adding additional room charges to folio for extended stay

