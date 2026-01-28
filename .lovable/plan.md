
# Add Facilities Button to Create Room Dialog

## Overview
Add a "Facilities" button to the Create Room dialog that displays the amenities/facilities associated with the selected room type. This helps users understand what features each room type offers when creating a new room.

---

## Current Behavior
- CreateRoomDialog has fields: Room Number, Floor, Room Type (dropdown), Notes
- Room types are selected from a dropdown showing name and price
- Facilities (amenities) data already exists in `room_types.amenities` as a JSON array

## Proposed Change
When a user selects a room type, show a "View Facilities" button that opens a popover/dialog displaying the amenities list for that room type.

---

## UI Design

```text
+------------------------------------------+
|  Add New Room                            |
|------------------------------------------|
|  Room Number *                           |
|  [101               ]                    |
|                                          |
|  Floor                                   |
|  [1                 ]                    |
|                                          |
|  Room Type *                             |
|  [Deluxe Double ($150/night)      v]     |
|                                          |
|  [View Facilities]  <- NEW BUTTON        |
|  +--------------------------------------+|
|  | Facilities for Deluxe Double:       ||
|  | - WiFi                              ||
|  | - TV                                ||
|  | - Mini Bar                          ||
|  | - Coffee Maker                      ||
|  | - Bathrobe                          ||
|  +--------------------------------------+|
|                                          |
|  Notes                                   |
|  [Any special notes...              ]    |
|                                          |
|          [Cancel]  [Create Room]         |
+------------------------------------------+
```

---

## Implementation Plan

### Modify: `src/components/rooms/CreateRoomDialog.tsx`

**Changes:**

1. Track selected room type and its amenities
2. Add "View Facilities" button that appears when a room type is selected
3. Show facilities in a Popover or inline section

**Technical Details:**

```typescript
// Watch the selected room type
const selectedRoomTypeId = form.watch("room_type_id");

// Find the selected room type to get amenities
const selectedRoomType = roomTypes.find(rt => rt.id === selectedRoomTypeId);
const amenities = (selectedRoomType?.amenities as string[]) || [];
```

**UI Component:**
- Use Popover component for a clean, non-intrusive display
- Show button only when a room type is selected
- Display amenities as a list with icons
- Handle empty amenities gracefully (show "No facilities listed")

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/rooms/CreateRoomDialog.tsx` | Add facilities button and popover |

---

## No Database Changes Required

The `amenities` field already exists on `room_types` table and contains the facilities data. We just need to display it.

---

## Edge Cases Handled

1. **No room type selected**: Hide facilities button
2. **Room type with no amenities**: Show "No facilities listed for this room type"
3. **Room type with amenities**: Display as a list with appropriate icons

---

## Component Additions

Add these imports to CreateRoomDialog:
- Popover from `@/components/ui/popover`
- Icons: Wifi, Tv, Coffee, Wine, Sparkles, etc. for matching amenity types
- Badge component for displaying amenities
