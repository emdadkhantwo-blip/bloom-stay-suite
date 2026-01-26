

## Automatic Housekeeping Task Creation on Checkout

### Problem

When a guest checks out, the room status correctly changes to "dirty", but no housekeeping task is automatically created. Staff must manually create cleaning tasks, which is inefficient and can lead to rooms being overlooked.

### Solution

Automatically create a pending housekeeping task (with `task_type: 'cleaning'`) for each room when a guest checks out. The task will be unassigned, allowing managers or front desk staff to assign housekeeping personnel later.

---

### Implementation Details

#### Update `useCheckOut` Hook

**File: `src/hooks/useReservations.tsx`**

Add logic to create a housekeeping task for each room after setting the room status to "dirty":

```typescript
export function useCheckOut() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant(); // Add tenant
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async (reservationId: string) => {
      // Get reservation rooms to update room statuses
      const { data: resRooms, error: fetchError } = await supabase
        .from("reservation_rooms")
        .select("room_id")
        .eq("reservation_id", reservationId);

      if (fetchError) throw fetchError;

      // Update reservation status
      const { error: resError } = await supabase
        .from("reservations")
        .update({ 
          status: "checked_out", 
          actual_check_out: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq("id", reservationId);

      if (resError) throw resError;

      // Update room statuses to dirty
      const roomIds = resRooms?.map((rr) => rr.room_id).filter(Boolean) as string[];
      if (roomIds.length > 0) {
        const { error: roomError } = await supabase
          .from("rooms")
          .update({ status: "dirty", updated_at: new Date().toISOString() })
          .in("id", roomIds);

        if (roomError) throw roomError;

        // NEW: Create pending housekeeping tasks for each room
        if (tenant?.id && currentPropertyId) {
          const housekeepingTasks = roomIds.map((roomId) => ({
            tenant_id: tenant.id,
            property_id: currentPropertyId,
            room_id: roomId,
            task_type: 'cleaning',
            priority: 2, // Medium priority for checkout cleaning
            status: 'pending',
            assigned_to: null, // Unassigned - can be assigned later
            notes: 'Post-checkout cleaning',
          }));

          const { error: taskError } = await supabase
            .from('housekeeping_tasks')
            .insert(housekeepingTasks);

          if (taskError) {
            console.error('Failed to create housekeeping tasks:', taskError);
            // Don't throw - checkout succeeded, task creation is secondary
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["reservation-stats", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["rooms", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["room-stats", currentPropertyId] });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === "calendar-reservations" 
      });
      // NEW: Invalidate housekeeping queries
      queryClient.invalidateQueries({ queryKey: ["housekeeping-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["housekeeping-stats"] });
      toast.success("Guest checked out successfully");
    },
    // ... rest unchanged
  });
}
```

---

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `task_type: 'cleaning'` | Standard cleaning after checkout |
| `priority: 2` | Medium priority (not urgent, but important) |
| `assigned_to: null` | Allows managers/front desk to assign staff later |
| `status: 'pending'` | Ready to be assigned and worked on |
| Non-blocking error handling | Checkout should succeed even if task creation fails |
| Invalidate housekeeping queries | Ensures the Housekeeping page shows new tasks immediately |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useReservations.tsx` | Add housekeeping task creation in `useCheckOut`, add `tenant` from useTenant, invalidate housekeeping queries |

---

### Expected Result

After checkout:
1. Room status changes to "dirty" (existing behavior)
2. A new "Pending" cleaning task appears in the Housekeeping section
3. The task is unassigned and ready for a manager to assign to housekeeping staff
4. Task includes "Post-checkout cleaning" note for context

