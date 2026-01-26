

## Calendar Improvements - Complete Implementation Plan

### Issues Analysis

After reviewing the code, I identified the root causes:

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| **Amount not updating after modify dates** | The `ExtendStayDialog` calls `onSuccess?.()` with no data. The drawer still shows stale `reservation` prop data. | Pass the updated reservation back through `onSuccess` callback to update drawer state |
| **Calendar not updating after modify dates** | Query invalidation works, but the drawer's local `selectedReservation` state isn't updated. The drawer closes before refetch happens. | Update `selectedReservation` state with new data after successful modification |
| **Room availability validation needed** | No validation exists before updating dates | Add `checkRoomAvailability` function that queries for conflicting reservations |
| **Drag and drop not implemented** | Feature doesn't exist | Use `framer-motion` for draggable blocks with vertical offset detection |

---

### Implementation Details

#### 1. Fix Data Synchronization

**ExtendStayDialog.tsx Changes:**
- Update `onSuccess` callback signature to return the updated reservation object
- After successful mutation, construct and return the updated reservation

```typescript
// Change interface
interface ExtendStayDialogProps {
  reservation: Reservation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updatedReservation: Reservation) => void; // NEW: pass updated data
}

// In handleConfirm, after mutateAsync:
const updatedReservation: Reservation = {
  ...reservation,
  check_in_date: format(newCheckInDate, "yyyy-MM-dd"),
  check_out_date: format(newCheckOutDate, "yyyy-MM-dd"),
  total_amount: newTotal,
};
onSuccess?.(updatedReservation);
```

**ReservationDetailDrawer.tsx Changes:**
- Update `onExtendStay` prop type to accept the updated reservation
- Forward the updated reservation from ExtendStayDialog to parent

```typescript
interface ReservationDetailDrawerProps {
  ...
  onExtendStay?: (updatedReservation: Reservation) => void; // Updated type
}
```

**Calendar.tsx Changes:**
- Update `handleExtendStay` to receive and set the updated reservation
- This ensures the drawer shows updated data immediately

```typescript
const handleExtendStay = (updatedReservation: Reservation) => {
  setSelectedReservation(updatedReservation); // Update drawer state
  queryClient.invalidateQueries({ 
    predicate: (query) => query.queryKey[0] === "calendar-reservations" 
  });
};
```

#### 2. Fix Query Invalidation Pattern

**useReservations.tsx - useUpdateReservation Changes:**
- Use predicate-based invalidation to match all calendar-reservations queries regardless of date/numDays parameters

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ 
    predicate: (query) => 
      query.queryKey[0] === "calendar-reservations" ||
      query.queryKey[0] === "reservations" ||
      query.queryKey[0] === "reservation-stats"
  });
  toast.success("Reservation updated successfully");
},
```

#### 3. Add Room Availability Validation

**ExtendStayDialog.tsx - New Validation Function:**

```typescript
const [isChecking, setIsChecking] = useState(false);
const [conflictError, setConflictError] = useState<string | null>(null);

const checkRoomAvailability = async (): Promise<{
  available: boolean;
  conflicts: string[];
}> => {
  if (!newCheckInDate || !newCheckOutDate) {
    return { available: false, conflicts: [] };
  }

  // Get the room_id from reservation_rooms
  const roomId = reservation.reservation_rooms?.[0]?.room_id;
  if (!roomId) {
    // No room assigned, no conflict possible
    return { available: true, conflicts: [] };
  }

  const newCheckIn = format(newCheckInDate, "yyyy-MM-dd");
  const newCheckOut = format(newCheckOutDate, "yyyy-MM-dd");

  // Query for overlapping reservations (excluding current)
  const { data: conflicts, error } = await supabase
    .from("reservations")
    .select(`
      id,
      confirmation_number,
      check_in_date,
      check_out_date,
      reservation_rooms!inner(room_id)
    `)
    .neq("id", reservation.id)
    .eq("reservation_rooms.room_id", roomId)
    .in("status", ["confirmed", "checked_in"])
    .lte("check_in_date", newCheckOut)
    .gt("check_out_date", newCheckIn);

  if (error) {
    console.error("Availability check error:", error);
    return { available: true, conflicts: [] }; // Fail open
  }

  return {
    available: conflicts.length === 0,
    conflicts: conflicts.map((c) => c.confirmation_number),
  };
};
```

**Updated handleConfirm:**
```typescript
const handleConfirm = async () => {
  if (!newCheckInDate || !newCheckOutDate || newNights <= 0) return;

  setIsChecking(true);
  setConflictError(null);

  // Check availability first
  const { available, conflicts } = await checkRoomAvailability();

  if (!available) {
    setConflictError(`Room not available. Conflicts with: ${conflicts.join(", ")}`);
    setIsChecking(false);
    return;
  }

  // Proceed with update...
};
```

**UI for Conflict Error:**
```typescript
{conflictError && (
  <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
    <AlertCircle className="h-4 w-4 flex-shrink-0" />
    {conflictError}
  </div>
)}
```

#### 4. Add Drag and Drop Room Assignment

**useReservations.tsx - New Hook:**

```typescript
export function useMoveReservationToRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reservationId,
      reservationRoomId,
      newRoomId,
      oldRoomId,
    }: {
      reservationId: string;
      reservationRoomId: string;
      newRoomId: string;
      oldRoomId: string | null;
    }) => {
      // Update reservation_rooms with new room_id
      const { error } = await supabase
        .from("reservation_rooms")
        .update({ room_id: newRoomId, updated_at: new Date().toISOString() })
        .eq("id", reservationRoomId);

      if (error) throw error;

      // If old room was occupied, mark it as dirty
      if (oldRoomId) {
        await supabase
          .from("rooms")
          .update({ status: "dirty", updated_at: new Date().toISOString() })
          .eq("id", oldRoomId);
      }

      // Mark new room as occupied
      await supabase
        .from("rooms")
        .update({ status: "occupied", updated_at: new Date().toISOString() })
        .eq("id", newRoomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "calendar-reservations" ||
          query.queryKey[0] === "rooms",
      });
      toast.success("Reservation moved to new room");
    },
    onError: (error) => {
      console.error("Move reservation error:", error);
      toast.error("Failed to move reservation");
    },
  });
}
```

**CalendarTimeline.tsx - Draggable Blocks:**

Add new props and state:
```typescript
interface CalendarTimelineProps {
  rooms: CalendarRoom[];
  dateRange: Date[];
  onReservationClick?: (reservation: CalendarReservation) => void;
  onReservationMove?: (
    reservationId: string,
    reservationRoomId: string,
    newRoomId: string,
    oldRoomId: string | null
  ) => void; // NEW
}
```

Create DraggableReservationBlock using framer-motion:
```typescript
import { motion, PanInfo } from "framer-motion";

const DraggableReservationBlock = forwardRef<HTMLButtonElement, DraggableBlockProps>(
  ({ reservation, startDate, dateRange, onClick, onDragEnd, roomIndex, rooms }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    
    // ... existing position calculations ...

    return (
      <motion.button
        ref={ref}
        drag="y"
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{ top: -roomIndex * ROW_HEIGHT, bottom: (rooms.length - roomIndex - 1) * ROW_HEIGHT }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(event, info) => {
          setIsDragging(false);
          onDragEnd?.(info);
        }}
        onClick={() => !isDragging && onClick?.(reservation)}
        className={cn(
          "absolute top-1 h-10 rounded-md border px-2 flex items-center gap-1 overflow-hidden transition-all",
          isDragging ? "cursor-grabbing z-50 shadow-lg ring-2 ring-primary" : "cursor-grab",
          STATUS_COLORS[reservation.status],
          STATUS_TEXT_COLORS[reservation.status]
        )}
        style={{ left: `${left}px`, width: `${width}px` }}
        whileDrag={{ scale: 1.05, opacity: 0.9 }}
      >
        {/* content */}
      </motion.button>
    );
  }
);
```

Handle drag end to calculate target room:
```typescript
const handleDragEnd = (
  reservation: CalendarReservation,
  currentRoomId: string,
  roomIndex: number,
  info: PanInfo
) => {
  const deltaY = info.offset.y;
  const rowsMoved = Math.round(deltaY / ROW_HEIGHT);

  if (rowsMoved === 0) return; // No room change

  const targetRoomIndex = roomIndex + rowsMoved;
  if (targetRoomIndex < 0 || targetRoomIndex >= rooms.length) return;

  const targetRoom = rooms[targetRoomIndex];
  if (targetRoom.id === "unassigned") return; // Can't move to unassigned row

  onReservationMove?.(
    reservation.id,
    reservation.reservation_room_id, // Need to add this field
    targetRoom.id,
    currentRoomId === "unassigned" ? null : currentRoomId
  );
};
```

**Calendar.tsx - Add Move Handler:**
```typescript
const moveReservation = useMoveReservationToRoom();

const handleReservationMove = (
  reservationId: string,
  reservationRoomId: string,
  newRoomId: string,
  oldRoomId: string | null
) => {
  moveReservation.mutate({
    reservationId,
    reservationRoomId,
    newRoomId,
    oldRoomId,
  });
};

// In CalendarTimeline:
<CalendarTimeline
  rooms={data?.rooms || []}
  dateRange={data?.dateRange || []}
  onReservationClick={handleReservationClick}
  onReservationMove={handleReservationMove}
/>
```

**useCalendarReservations.tsx - Add reservation_room_id:**
Update the CalendarReservation interface and data mapping to include the reservation_room_id needed for the move operation.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/reservations/ExtendStayDialog.tsx` | Add availability validation, return updated reservation on success, add conflict error UI |
| `src/components/reservations/ReservationDetailDrawer.tsx` | Update onExtendStay callback type |
| `src/pages/Calendar.tsx` | Handle updated reservation, add move handler |
| `src/hooks/useReservations.tsx` | Fix query invalidation, add `useMoveReservationToRoom` hook |
| `src/hooks/useCalendarReservations.tsx` | Add reservation_room_id to CalendarReservation |
| `src/components/calendar/CalendarTimeline.tsx` | Add drag-and-drop with framer-motion |

---

### User Experience Flow

**Modifying Dates:**
1. Click reservation block on calendar
2. Drawer opens with reservation details
3. Click "Modify Dates" button
4. Select new check-in/check-out dates
5. System validates room availability
6. If conflict found: Show error with conflicting reservation numbers
7. If available: Update reservation, drawer shows new dates/amount immediately, calendar refreshes

**Drag and Drop:**
1. Grab a reservation block on the calendar
2. Drag vertically to a different room row
3. Visual feedback: Block scales up, shadow appears
4. Release on target room row
5. System updates room assignment
6. Calendar refreshes with block in new position

