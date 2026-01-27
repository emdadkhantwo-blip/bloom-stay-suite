
# Fix: User Guidance When Rooms Are Not Configured

## Problem Summary

Users cannot create reservations or perform check-ins when the hotel has no room types or rooms configured. The current UI silently fails or shows empty dropdowns without explaining the prerequisite setup steps.

**Dependency chain that must exist:**
```
Room Types → Rooms → Reservations → Check-In
```

---

## Solution Overview

Add clear, helpful guidance throughout the reservation workflow when room infrastructure is missing. Instead of showing empty dropdowns and confusing users, guide them to set up their hotel properly first.

---

## Changes to Implement

### 1. NewReservationDialog - Empty State for Room Types

When opening the new reservation dialog and no room types exist, show a helpful message:

```
+--------------------------------------------+
|  Room Setup Required                        |
|                                            |
|  Before creating reservations, you need    |
|  to set up your room types and rooms.      |
|                                            |
|  [Go to Rooms Setup]  [Dismiss]            |
+--------------------------------------------+
```

**Files to modify:** `src/components/reservations/NewReservationDialog.tsx`

**Changes:**
- Check if `roomTypes` array is empty after loading
- If empty, show an `Alert` component explaining the setup requirement
- Add a button to navigate to the Rooms page
- Disable the room selection section with a clear message

### 2. Enhanced Room Type Select with Warning

When selecting a room type in the reservation form:
- If the selected room type has no rooms created, show an inline warning
- Allow the reservation to be created (room assignment at check-in)
- But warn that no physical rooms exist for assignment yet

**Additional query needed:** Check if rooms exist for selected room type

**Changes:**
- Add a query to count rooms per room type
- Show amber warning badge: "No rooms configured for this type yet"

### 3. RoomAssignmentDialog - Better Empty State

When opening room assignment and no rooms are available:

```
+--------------------------------------------+
|  No Rooms Available                         |
|                                            |
|  There are no vacant rooms of type         |
|  "Deluxe Suite" available for check-in.    |
|                                            |
|  This could be because:                     |
|  • No rooms have been created for this type|
|  • All rooms are currently occupied        |
|  • All rooms are under maintenance         |
|                                            |
|  [Go to Rooms Page]  [Cancel]              |
+--------------------------------------------+
```

**Files to modify:** `src/components/front-desk/RoomAssignmentDialog.tsx`

### 4. Reservations Page - Setup Reminder Banner

When the reservations page loads and room infrastructure is missing, show a banner:

```
+--------------------------------------------+
|  Complete Your Hotel Setup                  |
|                                            |
|  To start accepting reservations, you need:|
|  ✓ Room types (e.g., Deluxe, Standard)     |
|  ✗ Physical rooms (e.g., Room 101, 102)    |
|                                            |
|  [Set Up Rooms]                            |
+--------------------------------------------+
```

**Files to modify:** `src/pages/Reservations.tsx`

**Changes:**
- Add queries for room type count and room count
- If either is zero, show a setup reminder banner
- Include navigation to Rooms page

---

## Implementation Details

### New Hook: useRoomSetupStatus

Create a simple hook to check if room infrastructure is configured:

```typescript
// src/hooks/useRoomSetupStatus.tsx
export function useRoomSetupStatus() {
  const { data: roomTypes } = useRoomTypes();
  const { data: rooms } = useRooms();
  
  return {
    hasRoomTypes: (roomTypes?.length || 0) > 0,
    hasRooms: (rooms?.length || 0) > 0,
    isReady: (roomTypes?.length || 0) > 0 && (rooms?.length || 0) > 0,
    roomTypesCount: roomTypes?.length || 0,
    roomsCount: rooms?.length || 0,
  };
}
```

### NewReservationDialog Changes

```typescript
// At the top of the component
const { hasRoomTypes, hasRooms, isReady } = useRoomSetupStatus();

// In the JSX, before room selection
{!hasRoomTypes && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Room Types Required</AlertTitle>
    <AlertDescription>
      You need to create room types before making reservations.
      <Button 
        variant="link" 
        onClick={() => navigate('/rooms')}
        className="p-0 h-auto ml-2"
      >
        Go to Rooms →
      </Button>
    </AlertDescription>
  </Alert>
)}

{hasRoomTypes && !hasRooms && (
  <Alert>
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>No Rooms Created</AlertTitle>
    <AlertDescription>
      Room types exist, but no physical rooms have been added yet.
      Reservations can be made, but check-in will require rooms.
    </AlertDescription>
  </Alert>
)}
```

### Reservations Page Banner

```typescript
// src/pages/Reservations.tsx
const { hasRoomTypes, hasRooms, isReady } = useRoomSetupStatus();

// Before the stats bar
{!isReady && (
  <Card className="border-warning bg-warning/10">
    <CardContent className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <div>
          <h4 className="font-medium">Complete Your Hotel Setup</h4>
          <p className="text-sm text-muted-foreground">
            {!hasRoomTypes && "Create room types "}
            {!hasRoomTypes && !hasRooms && "and "}
            {!hasRooms && "add rooms "}
            to start accepting reservations.
          </p>
        </div>
      </div>
      <Button onClick={() => navigate('/rooms')}>
        Set Up Rooms
      </Button>
    </CardContent>
  </Card>
)}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useRoomSetupStatus.tsx` | Hook to check room infrastructure status |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Reservations.tsx` | Add setup reminder banner |
| `src/components/reservations/NewReservationDialog.tsx` | Add room types empty state alert |
| `src/components/front-desk/RoomAssignmentDialog.tsx` | Improve empty state messaging |

---

## User Experience Flow After Fix

### Scenario: New Hotel with No Rooms

1. User opens Reservations page
2. **NEW:** Banner shows "Complete Your Hotel Setup" with button to Rooms page
3. User clicks "Set Up Rooms" → navigates to Rooms page
4. User creates room types and rooms
5. User returns to Reservations → banner is gone
6. User can now create reservations normally

### Scenario: Room Type Exists but No Rooms

1. User opens New Reservation dialog
2. User selects a room type from dropdown
3. **NEW:** Warning shows "No rooms configured for this type yet"
4. User can still create reservation (room assigned later)
5. At check-in time, if still no rooms, clear message explains why

---

## Summary

This fix adds **proactive guidance** throughout the reservation workflow:

1. **Page-level banner** when setup is incomplete
2. **Dialog-level alerts** when room types are missing
3. **Inline warnings** when selected room type has no rooms
4. **Improved empty states** in room assignment dialog

Users will never be confused about why they can't create reservations or check-in guests - they'll always have clear guidance on what's needed.
