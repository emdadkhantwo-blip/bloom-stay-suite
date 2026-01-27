
# Real-time Room Updates & Smart Duplicate Handling for Chatbot

## Overview
This plan implements two key features:
1. **Real-time data synchronization** - The Rooms page will automatically update when the chatbot creates/modifies rooms
2. **Smart duplicate handling** - When the chatbot tries to create a room that already exists, it will automatically generate a new unique room number

---

## Part 1: Enable Real-time Updates for Rooms

### Database Migration
Enable real-time subscriptions for the `rooms` and `room_types` tables so changes made via the chatbot are reflected immediately in the UI.

**New Migration SQL:**
```sql
-- Enable realtime for rooms management
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_types;
```

### New Hook: `useRoomNotifications.tsx`
**Location**: `src/hooks/useRoomNotifications.tsx`

A hook that subscribes to real-time changes on the `rooms` table and automatically invalidates React Query cache when changes occur.

**Key Features**:
- Subscribes to INSERT, UPDATE, DELETE events on `rooms` table
- Filters by `property_id` to only receive relevant updates
- Invalidates `rooms` and `room-stats` query keys when changes occur
- Shows toast notifications for chatbot-triggered changes

**Implementation Pattern** (following existing kitchen notifications):
```typescript
const channel = supabase
  .channel(`rooms-${propertyId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'rooms',
    filter: `property_id=eq.${propertyId}`
  }, (payload) => {
    queryClient.invalidateQueries({ queryKey: ["rooms", propertyId] });
    queryClient.invalidateQueries({ queryKey: ["room-stats", propertyId] });
    
    // Show notification for new rooms
    if (payload.eventType === 'INSERT') {
      toast.info(`Room ${payload.new.room_number} added`);
    }
  })
  .subscribe();
```

### Modify: `src/pages/Rooms.tsx`
Add the `useRoomNotifications` hook to enable real-time subscriptions when viewing the Rooms page.

```typescript
// Add import
import { useRoomNotifications } from "@/hooks/useRoomNotifications";

// Add hook call inside component
useRoomNotifications();
```

---

## Part 2: Smart Duplicate Handling in Chatbot

### Modify: `supabase/functions/admin-chat/index.ts`

Update the `create_room` case to check for existing rooms and auto-generate unique room numbers when duplicates are detected.

**Current Behavior** (lines 1989-2005):
```typescript
case "create_room": {
  const { data, error } = await supabase.from('rooms').insert({...});
  if (error) throw error;  // Fails with duplicate key error
  return { success: true, data };
}
```

**New Behavior**:
```typescript
case "create_room": {
  // Check if room number already exists
  const { data: existingRoom } = await supabase.from('rooms')
    .select('room_number')
    .eq('property_id', propertyId)
    .eq('room_number', args.room_number)
    .eq('is_active', true)
    .maybeSingle();
  
  let finalRoomNumber = args.room_number;
  
  if (existingRoom) {
    // Generate a unique room number by appending a suffix
    // Try: 101A, 101B, 101C, etc.
    const suffixes = ['A', 'B', 'C', 'D', 'E', 'F'];
    let found = false;
    
    for (const suffix of suffixes) {
      const candidate = `${args.room_number}${suffix}`;
      const { data: check } = await supabase.from('rooms')
        .select('room_number')
        .eq('property_id', propertyId)
        .eq('room_number', candidate)
        .eq('is_active', true)
        .maybeSingle();
      
      if (!check) {
        finalRoomNumber = candidate;
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Fallback: add timestamp suffix
      finalRoomNumber = `${args.room_number}-${Date.now().toString().slice(-4)}`;
    }
  }
  
  const { data, error } = await supabase.from('rooms').insert({
    tenant_id: tenantId,
    property_id: propertyId,
    room_number: finalRoomNumber,
    room_type_id: args.room_type_id,
    floor: args.floor || null,
    notes: args.notes || null,
    status: 'vacant'
  })
  .select('*, room_types(name)')
  .single();
  
  if (error) throw error;
  
  // Include info about whether room number was modified
  return { 
    success: true, 
    data,
    renamed: existingRoom ? `Room ${args.room_number} already existed, created as ${finalRoomNumber}` : null
  };
}
```

### Update Tool Summary for create_room

Update the `generateToolSummary` function to show when a room was renamed due to duplicate:

```typescript
case "create_room":
  let msg = `Created room **${data.room_number}** (${data.room_types?.name || 'N/A'})`;
  if (result.renamed) {
    msg += `\n⚠️ ${result.renamed}`;
  }
  return msg;
```

### Apply Same Logic to create_room_type

Update the `create_room_type` case to handle duplicate codes:

```typescript
case "create_room_type": {
  // Check if code already exists
  const { data: existingType } = await supabase.from('room_types')
    .select('code')
    .eq('property_id', propertyId)
    .eq('code', args.code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();
  
  let finalCode = args.code.toUpperCase();
  
  if (existingType) {
    // Generate unique code by adding number suffix
    for (let i = 2; i <= 9; i++) {
      const candidate = `${args.code.toUpperCase()}${i}`;
      const { data: check } = await supabase.from('room_types')
        .select('code')
        .eq('property_id', propertyId)
        .eq('code', candidate)
        .eq('is_active', true)
        .maybeSingle();
      
      if (!check) {
        finalCode = candidate;
        break;
      }
    }
  }
  
  const { data, error } = await supabase.from('room_types').insert({
    tenant_id: tenantId,
    property_id: propertyId,
    name: args.name,
    code: finalCode,
    base_rate: args.base_rate,
    max_occupancy: args.max_occupancy,
    description: args.description || null,
    amenities: args.amenities || []
  })
  .select()
  .single();
  
  if (error) throw error;
  return { 
    success: true, 
    data,
    renamed: existingType ? `Code ${args.code} existed, used ${finalCode}` : null
  };
}
```

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/[new].sql` | Create | Enable realtime for rooms and room_types tables |
| `src/hooks/useRoomNotifications.tsx` | Create | Hook for real-time room update subscriptions |
| `src/pages/Rooms.tsx` | Modify | Add useRoomNotifications hook |
| `supabase/functions/admin-chat/index.ts` | Modify | Smart duplicate handling for create_room and create_room_type |

---

## Data Flow After Implementation

```text
┌─────────────────────────────────────────────────────────────────┐
│              User asks chatbot: "Create room 101"               │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│           Edge function checks if room 101 exists               │
└─────────────────────────────────────────────────────────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│   Room 101 NOT exists   │           │    Room 101 EXISTS      │
│   Create as "101"       │           │   Create as "101A"      │
└─────────────────────────┘           └─────────────────────────┘
              │                                     │
              └──────────────────┬──────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│          Room inserted → Supabase Realtime triggers             │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│    useRoomNotifications receives event → invalidates cache      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│           Rooms page auto-refreshes with new room               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

1. **Real-time Filter**: The subscription filters by `property_id` to ensure users only receive updates for their own property's rooms.

2. **Duplicate Detection**: Uses `.maybeSingle()` to safely check for existing records without throwing errors.

3. **Room Number Suffix Logic**: 
   - First tries letter suffixes (A-F): 101 → 101A → 101B
   - Falls back to timestamp suffix if all letters are taken

4. **Room Type Code Logic**:
   - Appends numbers (2-9): DLX → DLX2 → DLX3

5. **Backward Compatibility**: The chatbot response structure remains the same, with an optional `renamed` field added for transparency.

6. **Toast Notifications**: The UI shows a subtle toast when rooms are added via chatbot, keeping users informed of background changes.
