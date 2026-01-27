
# Fix: Prevent Check-In Without Room Assignment

## Problem Identified

There are multiple code paths where a guest can be checked in without being assigned to a physical room:

1. **Calendar View Check-In Bypass**: In `src/pages/Calendar.tsx`, the `handleCheckIn` function (lines 93-105) filters existing room assignments and passes them directly. If no rooms were pre-assigned during reservation creation, it sends an empty array, and the check-in succeeds without any room.

2. **Hook Allows Empty Assignments**: In `src/hooks/useReservations.tsx`, the `useCheckIn` mutation (lines 151-188) treats `roomAssignments` as optional. If empty or undefined, the status changes to `checked_in` without any room being assigned.

3. **ReservationDetailDrawer Direct Check-In**: The drawer's "Check In" button (line 590) directly calls `onCheckIn` without ensuring rooms are assigned first.

---

## Solution Overview

Enforce room assignment requirement at multiple levels:

1. **Hook-Level Validation**: Add explicit validation in `useCheckIn` to throw an error if no room assignments are provided
2. **Calendar Check-In Flow**: Route Calendar check-ins through the `RoomAssignmentDialog` like Front Desk does
3. **ReservationDetailDrawer**: Show warning if trying to check in without rooms assigned
4. **UI Feedback**: Disable check-in button or show clear message when rooms are not assigned

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useReservations.tsx` | Add validation requiring room assignments for check-in |
| `src/pages/Calendar.tsx` | Add RoomAssignmentDialog flow for check-in |
| `src/components/reservations/ReservationDetailDrawer.tsx` | Add room assignment check before check-in |

---

## Technical Implementation

### 1. useCheckIn Hook - Add Validation

In `src/hooks/useReservations.tsx`, add a validation check at the start of the mutation function:

```typescript
mutationFn: async ({ reservationId, roomAssignments }: { 
  reservationId: string; 
  roomAssignments?: Array<{ reservationRoomId: string; roomId: string }>;
}) => {
  // NEW: Validate that room assignments are provided
  if (!roomAssignments || roomAssignments.length === 0) {
    throw new Error("Cannot check in without assigning a room. Please assign rooms first.");
  }
  
  // ... rest of the function
}
```

Update `onError` to show the validation message:

```typescript
onError: (error) => {
  console.error("Check-in error:", error);
  toast.error(error instanceof Error ? error.message : "Failed to check in guest");
},
```

### 2. Calendar Page - Add Room Assignment Dialog

In `src/pages/Calendar.tsx`, add state and dialog similar to Front Desk:

```typescript
// Add state
const [roomAssignmentOpen, setRoomAssignmentOpen] = useState(false);
const [pendingCheckIn, setPendingCheckIn] = useState<Reservation | null>(null);

// Modify handleCheckIn to open dialog instead of directly checking in
const handleCheckIn = () => {
  if (selectedReservation) {
    // Check if all rooms are already assigned
    const allRoomsAssigned = selectedReservation.reservation_rooms.every(rr => rr.room_id);
    
    if (allRoomsAssigned) {
      // Proceed directly if all rooms already have assignments
      checkIn.mutate({ 
        reservationId: selectedReservation.id,
        roomAssignments: selectedReservation.reservation_rooms.map(rr => ({
          reservationRoomId: rr.id,
          roomId: rr.room_id!
        }))
      });
      setDrawerOpen(false);
    } else {
      // Open room assignment dialog
      setPendingCheckIn(selectedReservation);
      setRoomAssignmentOpen(true);
      setDrawerOpen(false);
    }
  }
};

// Add confirm handler
const confirmCheckIn = (assignments: Array<{ reservationRoomId: string; roomId: string }>) => {
  if (pendingCheckIn) {
    checkIn.mutate(
      { reservationId: pendingCheckIn.id, roomAssignments: assignments },
      {
        onSuccess: () => {
          setRoomAssignmentOpen(false);
          setPendingCheckIn(null);
        },
      }
    );
  }
};
```

Add the `RoomAssignmentDialog` component to the JSX:

```tsx
<RoomAssignmentDialog
  reservation={pendingCheckIn}
  open={roomAssignmentOpen}
  onOpenChange={(open) => {
    setRoomAssignmentOpen(open);
    if (!open) setPendingCheckIn(null);
  }}
  onConfirm={confirmCheckIn}
  isLoading={checkIn.isPending}
/>
```

### 3. ReservationDetailDrawer - Visual Guidance

Add a visual indicator when rooms are not assigned and check-in is attempted. In `src/components/reservations/ReservationDetailDrawer.tsx`:

```typescript
// Calculate if any rooms need assignment
const hasUnassignedRooms = reservation.reservation_rooms.some(rr => !rr.room_id);

// In the Room Assignments card, add emphasis when rooms are missing
{hasUnassignedRooms && canCheckIn && (
  <Alert variant="warning" className="mt-2">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      Rooms must be assigned during check-in
    </AlertDescription>
  </Alert>
)}
```

Update the Check In button to show a more helpful label:

```tsx
{canCheckIn && onCheckIn && (
  <Button className="flex-1" onClick={onCheckIn}>
    {hasUnassignedRooms ? "Check In & Assign Rooms" : "Check In"}
  </Button>
)}
```

---

## User Experience After Fix

### Scenario 1: Check-In from Calendar (No Rooms Assigned)
1. User clicks reservation on calendar
2. Opens detail drawer, clicks "Check In & Assign Rooms"
3. **NEW:** Room Assignment Dialog opens
4. User selects room for each reservation room
5. Clicks "Confirm Check-In"
6. Guest is checked in with room properly assigned

### Scenario 2: Check-In from Calendar (Rooms Pre-Assigned)
1. User clicks reservation with rooms already assigned
2. Clicks "Check In"
3. Check-in proceeds immediately (no dialog needed)

### Scenario 3: Attempted Check-In via API with Empty Assignments
1. If any code path tries to call `useCheckIn` without assignments
2. **NEW:** Error thrown: "Cannot check in without assigning a room"
3. Toast shows the error message
4. Check-in is prevented

---

## Safety Measures

This solution provides **defense in depth**:

1. **UI Layer**: Calendar now routes through RoomAssignmentDialog
2. **UI Feedback**: Drawer shows "Check In & Assign Rooms" when rooms are missing
3. **Business Logic Layer**: `useCheckIn` throws if no rooms assigned (catches any bypass)
4. **Visual Guidance**: Alert in room assignments card warns about missing rooms

---

## Summary

This fix ensures that **no guest can be checked in without a room number** by:

1. Adding validation in the `useCheckIn` hook that throws an error if `roomAssignments` is empty
2. Updating Calendar page to use `RoomAssignmentDialog` for check-ins (matching Front Desk behavior)
3. Improving the ReservationDetailDrawer to show clear guidance when rooms need assignment
4. Providing visual feedback with an updated button label and warning alert
