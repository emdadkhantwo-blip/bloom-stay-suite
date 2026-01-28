
# Display Multiple Unassigned Reservations in Separate Rows

## Overview
Currently, all unassigned reservations are displayed in a single "Unassigned" row on the calendar. When multiple unassigned reservations exist (especially with overlapping dates), they can visually overlap and become difficult to read. This change will create separate rows for each unassigned reservation.

---

## Current Behavior

```text
+------------------+----+----+----+----+----+----+
| Unassigned       | [Res 1 overlapping Res 2   ]|  <- Both stacked/overlapping
+------------------+----+----+----+----+----+----+
| Floor 1          |                              |
+------------------+----+----+----+----+----+----+
| Room 101         |    [Reservation 3]           |
+------------------+----+----+----+----+----+----+
```

## Proposed Behavior

```text
+------------------+----+----+----+----+----+----+
| Unassigned       |                              |
+------------------+----+----+----+----+----+----+
| Unassigned #1    |    [Reservation 1]           |  <- Separate row
+------------------+----+----+----+----+----+----+
| Unassigned #2    |         [Reservation 2]      |  <- Separate row
+------------------+----+----+----+----+----+----+
| Floor 1          |                              |
+------------------+----+----+----+----+----+----+
| Room 101         |    [Reservation 3]           |
+------------------+----+----+----+----+----+----+
```

---

## Implementation Plan

### Modify: `src/hooks/useCalendarReservations.tsx`

**Changes:**

1. Instead of creating a single "Unassigned" room with all unassigned reservations, create a separate pseudo-room for each unassigned reservation
2. Each unassigned row will show the guest name or room type for identification
3. Use unique IDs like `unassigned-{reservation_id}` to distinguish rows

**Before:**
```typescript
if (unassignedReservations.length > 0) {
  calendarRooms.unshift({
    id: "unassigned",
    room_number: "Unassigned",
    floor: null,
    room_type: null,
    reservations: unassignedReservations,
  });
}
```

**After:**
```typescript
// Create individual rows for each unassigned reservation
unassignedReservations.forEach((res, index) => {
  calendarRooms.unshift({
    id: `unassigned-${res.id}`,
    room_number: `Unassigned`,
    floor: null,
    room_type: { 
      id: "unassigned", 
      name: res.room_type_name || "No Type", 
      code: "UA" 
    },
    reservations: [res],
  });
});
```

---

### Modify: `src/components/calendar/CalendarTimeline.tsx`

**Changes:**

1. Update the room grouping logic to handle multiple unassigned rows under an "Unassigned" floor group
2. Ensure drag constraints still prevent dragging to unassigned rows (check for `id.startsWith("unassigned")`)
3. Display guest name or room type in the row label for identification

**Key Updates:**

| Section | Change |
|---------|--------|
| `isDragEnabled` check | Update from `room.id === "unassigned"` to `room.id.startsWith("unassigned")` |
| Floor grouping | Group all unassigned rooms under "Unassigned" header |
| Row label display | Show guest name or room type for unassigned rows |
| Drag target validation | Prevent dropping on any unassigned row |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCalendarReservations.tsx` | Create separate rows for each unassigned reservation |
| `src/components/calendar/CalendarTimeline.tsx` | Handle multiple unassigned rows, update drag logic |

---

## Edge Cases Handled

1. **No unassigned reservations**: No unassigned section shown (same as current)
2. **Single unassigned reservation**: Shows one row in Unassigned section
3. **Multiple unassigned reservations**: Each gets its own row with guest/type info
4. **Drag-and-drop**: Still prevents dragging TO any unassigned row, but allows dragging FROM them to assigned rooms
5. **Row labels**: Show guest name and room type for easy identification

---

## Visual Design for Unassigned Rows

Each unassigned row will display:
- Row label: Guest name (e.g., "John Doe")
- Subtitle: Room type requested (e.g., "Deluxe Double")
- Visual indicator: Distinctive styling to show it needs assignment

---

## No Database Changes Required

This is purely a UI/display change. The data structure remains the same; we're just changing how unassigned reservations are rendered on the calendar grid.
