
# Fix Room Availability for Future Reservations

## Problem Analysis

You've identified a critical workflow issue:

**Current Situation:**
- Guest A checks in on Jan 27 for a stay until Jan 29
- Room 101 status changes to "occupied"
- Guest B calls to book Room 101 from Jan 30 onwards
- Room 101 doesn't appear in the Room Assignment dropdown
- You cannot complete the booking

**Root Cause:**
The room availability logic currently filters rooms by their **current physical status** (`vacant` or `dirty`) rather than checking **date-based availability**. This means:
- Rooms marked as `occupied` are excluded entirely from availability queries
- The system doesn't consider that an occupied room *will become* available after the current guest checks out

**Affected Code Locations:**

| File | Line | Current Filter | Problem |
|------|------|----------------|---------|
| `src/hooks/useRoomTypes.tsx` | 148 | `.in("status", ["vacant", "dirty"])` | Excludes occupied rooms from future bookings |
| `src/components/front-desk/RoomAssignmentDialog.tsx` | 60 | `.eq("status", "vacant")` | Only shows vacant rooms for check-in assignment |

---

## Solution Options

### Option A: Date-Based Availability (Recommended)

**Concept:** Change the availability logic to check **reservation date overlaps** instead of room physical status. A room is available for a date range if there are no conflicting reservations, regardless of its current status.

**Benefits:**
- Rooms can be pre-assigned to future reservations even while currently occupied
- Maximizes booking potential
- Industry-standard approach used by major PMS systems

**Trade-off:**
- Room may show as available but still needs housekeeping before new guest arrives

### Option B: Include "Occupied" Rooms for Future Dates

**Concept:** When the reservation check-in date is in the future (not today), include occupied rooms in availability checks.

**Benefits:**
- Simpler change
- Still prevents same-day conflicts

**Trade-off:**
- Doesn't fully solve edge cases

### Option C: Virtual Availability with Housekeeping Status Indicator

**Concept:** Show all date-available rooms but indicate their current status (occupied, dirty, vacant) as visual badges. Let staff make informed decisions.

**Benefits:**
- Complete visibility
- Staff can plan housekeeping accordingly

---

## Recommended Implementation (Option A + C Combined)

### Change 1: Update `useAvailableRooms` Hook

**File:** `src/hooks/useRoomTypes.tsx`

| Current | New |
|---------|-----|
| Filters by status first, then by date overlap | Fetches ALL active rooms, then filters by date overlap only |
| Only returns rooms with vacant/dirty status | Returns all rooms without date conflicts, includes current status |

**Updated Query Logic:**
```typescript
// Step 1: Get ALL active rooms of this type (regardless of status)
const { data: rooms } = await supabase
  .from("rooms")
  .select("id, room_number, floor, status")
  .eq("property_id", propertyId)
  .eq("room_type_id", roomTypeId)
  .eq("is_active", true);  // Remove status filter

// Step 2: Get rooms with conflicting reservations for the requested dates
const { data: bookedRooms } = await supabase
  .from("reservation_rooms")
  .select(`
    room_id,
    reservation:reservations!inner(check_in_date, check_out_date, status)
  `)
  .not("room_id", "is", null)
  .in("reservation.status", ["confirmed", "checked_in"]);

// Step 3: Filter out rooms that have date conflicts
const bookedRoomIds = new Set(
  bookedRooms?.filter(br => {
    const res = br.reservation;
    return res.check_in_date < checkOutStr && res.check_out_date > checkInStr;
  }).map(br => br.room_id)
);

// Return available rooms with their current status (for display)
return rooms?.filter(room => !bookedRoomIds.has(room.id)) || [];
```

### Change 2: Update `RoomAssignmentDialog` for Check-In

**File:** `src/components/front-desk/RoomAssignmentDialog.tsx`

For **same-day check-in**, the room must be physically ready (vacant). Keep the current logic but add an exception:

| Scenario | Room Status Filter |
|----------|-------------------|
| Check-in is TODAY | Only `vacant` rooms |
| Check-in is FUTURE | All rooms without date conflicts |

**Updated Query:**
```typescript
function useAvailableRoomsByType(
  roomTypeId: string | null, 
  propertyId: string | null,
  checkInDate: Date,
  checkOutDate: Date
) {
  const isToday = isSameDay(checkInDate, new Date());
  
  return useQuery({
    queryFn: async () => {
      // Query rooms based on whether check-in is today or future
      let query = supabase
        .from("rooms")
        .select("id, room_number, floor, status")
        .eq("property_id", propertyId)
        .eq("room_type_id", roomTypeId)
        .eq("is_active", true);
      
      // For same-day check-in, only show vacant rooms
      if (isToday) {
        query = query.eq("status", "vacant");
      }
      
      const { data: rooms } = await query;
      
      // Also check for reservation conflicts (for future dates)
      if (!isToday) {
        // ... date overlap filtering logic
      }
      
      return rooms;
    }
  });
}
```

### Change 3: Add Status Badge in Room Selector

**File:** `src/components/front-desk/RoomAssignmentDialog.tsx`

Show the room's current status as a visual indicator:

```tsx
<SelectItem key={room.id} value={room.id}>
  <div className="flex items-center gap-2">
    <span className="font-medium">{room.room_number}</span>
    {room.floor && <span className="text-xs text-muted-foreground">Floor {room.floor}</span>}
    {room.status !== "vacant" && (
      <Badge variant={room.status === "occupied" ? "secondary" : "outline"} className="text-xs">
        {room.status === "occupied" ? "Currently Occupied" : "Needs Cleaning"}
      </Badge>
    )}
  </div>
</SelectItem>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useRoomTypes.tsx` | Update `useAvailableRooms` to remove status filter, use date-based availability only |
| `src/components/front-desk/RoomAssignmentDialog.tsx` | Update `useVacantRoomsByType` to accept reservation dates, apply smart filtering, add status badges |
| `src/components/reservations/NewReservationDialog.tsx` | Ensure room availability uses date-based logic when creating new reservations |

---

## User Flow After Fix

**Your Scenario:**
1. Check in Guest A on Jan 27 for stay until Jan 29
2. Room 101 marked as "occupied"
3. Guest B calls to reserve Room 101 from Jan 30
4. When creating reservation:
   - Room 101 **appears in dropdown** with badge "Currently Occupied"
   - System shows it's available because no date conflict exists
   - You assign Room 101 to Guest B's reservation
5. On Jan 29, Guest A checks out
   - Room 101 changes to "dirty"
   - Housekeeping cleans room
   - Room 101 becomes "vacant"
6. On Jan 30, Guest B arrives
   - Room 101 ready for check-in

---

## Edge Cases Handled

1. **Same room, same day**: If Guest A checks out and Guest B checks in same day, room must be cleaned first (housekeeping workflow ensures this)
2. **Overlapping dates**: System still prevents double-booking with date overlap check
3. **Pre-assigned rooms**: If Room 101 is pre-assigned to future reservation, it won't show for conflicting date ranges
4. **Walk-in guests**: For same-day check-in, only vacant rooms shown (must be physically ready)

---

## Summary

The fix changes the room availability paradigm from:
- "What rooms are **physically ready** right now?"

To:
- "What rooms are **booking-available** for these dates?"

This aligns with how hotel property management systems typically work and solves your scenario where you can't book an occupied room for future dates.
