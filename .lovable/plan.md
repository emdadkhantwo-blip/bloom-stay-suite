

## Add Price Recalculation When Extending Stay via Calendar Drag

### Problem

When a guest's reservation dates are changed by dragging the reservation block horizontally on the calendar, the price is NOT updated. The current implementation only updates the check-in and check-out dates, leaving the `total_amount` unchanged.

### Current Behavior

**ExtendStayDialog (Modify Dates button)**: Correctly calculates the price difference based on additional/removed nights and updates the total.

**Calendar Drag-and-Drop**: Only updates dates without recalculating the price:
```typescript
handleReservationDateChange = (reservationId, newCheckInDate, newCheckOutDate) => {
  updateReservation.mutate({
    reservationId,
    updates: {
      check_in_date: newCheckInDate,
      check_out_date: newCheckOutDate,
      // total_amount is MISSING!
    },
  });
};
```

### Solution

Add `total_amount` to the calendar reservation data and calculate the new price when dates are changed via drag-and-drop.

---

### Implementation Details

#### 1. Update CalendarReservation Interface

**File: `src/hooks/useCalendarReservations.tsx`**

Add `total_amount` to the `CalendarReservation` interface to carry the pricing data.

```typescript
export interface CalendarReservation {
  id: string;
  confirmation_number: string;
  check_in_date: string;
  check_out_date: string;
  status: "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
  guest: { ... } | null;
  room_id: string | null;
  room_number: string | null;
  room_type_name: string | null;
  reservation_room_id: string;
  total_amount: number; // NEW: for price recalculation
}
```

#### 2. Fetch total_amount in Calendar Query

**File: `src/hooks/useCalendarReservations.tsx`**

Update the Supabase query to include `total_amount` and map it to the calendar reservation objects.

#### 3. Update CalendarTimeline Props and Callback

**File: `src/components/calendar/CalendarTimeline.tsx`**

Modify `onReservationDateChange` callback to include the original dates and total amount, so the parent can calculate the price difference:

```typescript
onReservationDateChange?: (
  reservationId: string,
  originalCheckInDate: string,
  originalCheckOutDate: string,
  newCheckInDate: string,
  newCheckOutDate: string,
  originalTotalAmount: number
) => void;
```

#### 4. Calculate New Price in Calendar.tsx

**File: `src/pages/Calendar.tsx`**

Update `handleReservationDateChange` to:
1. Calculate the original number of nights
2. Calculate the new number of nights
3. Determine the rate per night
4. Calculate the new total amount
5. Include `total_amount` in the update

```typescript
const handleReservationDateChange = (
  reservationId: string,
  originalCheckInDate: string,
  originalCheckOutDate: string,
  newCheckInDate: string,
  newCheckOutDate: string,
  originalTotalAmount: number
) => {
  const originalNights = differenceInDays(
    parseISO(originalCheckOutDate),
    parseISO(originalCheckInDate)
  );
  const newNights = differenceInDays(
    parseISO(newCheckOutDate),
    parseISO(newCheckInDate)
  );

  // Calculate rate per night from original reservation
  const ratePerNight = originalNights > 0 
    ? originalTotalAmount / originalNights 
    : 0;

  // Calculate new total
  const newTotalAmount = ratePerNight * newNights;

  updateReservation.mutate({
    reservationId,
    updates: {
      check_in_date: newCheckInDate,
      check_out_date: newCheckOutDate,
      total_amount: newTotalAmount,
    },
  });
};
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCalendarReservations.tsx` | Add `total_amount` to interface and query |
| `src/components/calendar/CalendarTimeline.tsx` | Update callback signature to pass original dates and amount |
| `src/pages/Calendar.tsx` | Add price calculation logic in `handleReservationDateChange` |

---

### Expected Result

After dragging a reservation horizontally on the calendar:
- If extending from 3 nights to 5 nights at 1000/night, total updates from 3000 to 5000
- If shortening from 5 nights to 3 nights, total updates from 5000 to 3000
- The price change is proportional to the number of nights added or removed

