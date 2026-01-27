
# Add "Close Table" and "Add Table" Features to POS Floor Plan

## Overview
This plan adds two new features to the POS Floor Plan:
1. **Close Table Button** - A quick action to mark all orders for a table as "posted" and clear the table
2. **Add Table Button** - Allows users to add new tables to the floor plan layout during edit mode

---

## Feature 1: Close Table Button

### What It Does
When a table is occupied, staff can click a "Close Table" button in the table details dialog. This will:
- Mark all active orders on that table as "posted" 
- Clear the table so it becomes available for new guests
- Show a confirmation dialog to prevent accidental closures

### Technical Implementation

**File: `src/hooks/usePOS.tsx`**

Add a new hook `useCloseTable` that:
- Accepts a table number and outlet ID
- Fetches all active orders for that table (status not "posted" or "cancelled")
- Updates all matching orders to "posted" status in a single batch operation
- Invalidates the `pos-orders` query cache

```typescript
export function useCloseTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      tableNumber, 
      outletId 
    }: { 
      tableNumber: string; 
      outletId: string 
    }) => {
      // Update all active orders for this table to "posted"
      const { error } = await supabase
        .from("pos_orders")
        .update({ 
          status: "posted",
          posted_at: new Date().toISOString()
        })
        .eq("table_number", tableNumber)
        .eq("outlet_id", outletId)
        .not("status", "in", '("posted","cancelled")');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-orders"] });
      toast.success("Table closed successfully");
    },
  });
}
```

**File: `src/components/pos/TableManagement.tsx`**

| Change | Details |
|--------|---------|
| New import | `AlertDialog` components for confirmation |
| New state | `tableToClose: TableInfo \| null` for confirmation flow |
| New handler | `handleCloseTable()` to execute the close operation |
| UI addition | "Close Table" button in the table details dialog |

The button will appear in the dialog footer, styled with a distinct color (red/destructive gradient) to indicate it's a significant action.

**Confirmation Dialog Content:**
- Title: "Close Table {tableNumber}?"
- Description: "This will mark all {orderCount} orders as posted. The table will become available for new guests."
- Actions: Cancel / Close Table

---

## Feature 2: Add Table Button

### What It Does
During floor plan edit mode, users can click an "Add Table" button to create a new table. A dialog will prompt for:
- Table ID/Name (e.g., "T9", "VIP1", "Patio 1")
- Number of seats (2, 4, 6, 8)

The new table will be placed in the first available grid position and saved to the outlet's settings.

### Technical Implementation

**File: `src/components/pos/TableManagement.tsx`**

| Change | Details |
|--------|---------|
| New state | `showAddTableDialog: boolean` |
| New state | `newTableId: string` for form input |
| New state | `newTableSeats: number` for form input |
| New handler | `handleAddTable()` to validate and add table |
| UI addition | "Add Table" button in edit mode header |
| UI addition | Dialog with form fields for table creation |

**Add Table Logic:**
```typescript
const handleAddTable = () => {
  // Validate unique ID
  if (tableLayout.some(t => t.id === newTableId)) {
    toast.error("Table ID already exists");
    return;
  }
  
  // Find first empty grid position
  const occupiedPositions = new Set(
    tableLayout.map(t => `${t.x},${t.y}`)
  );
  
  let newX = 0, newY = 0;
  outer: for (let y = 0; y <= 3; y++) {
    for (let x = 0; x < 4; x++) {
      if (!occupiedPositions.has(`${x},${y}`)) {
        newX = x;
        newY = y;
        break outer;
      }
    }
  }
  
  // Add to layout
  setTableLayout(prev => [...prev, {
    id: newTableId,
    name: newTableId,
    seats: newTableSeats,
    x: newX,
    y: newY,
  }]);
  
  setShowAddTableDialog(false);
  setNewTableId("");
  setNewTableSeats(4);
};
```

**Delete Table (Bonus):**
During edit mode, each table will show a small "X" button to remove it from the layout. This only removes from the local state; changes are saved when "Save Layout" is clicked.

---

## UI Layout Changes

### Edit Mode Header (Updated)
Current:
```
[Reset] [Cancel] [Save Layout]
```

New:
```
[+ Add Table] [Reset] [Cancel] [Save Layout]
```

### Table Details Dialog Footer (Updated)
Current:
```
[Mark Ready] or [Mark Served] (depending on order status)
```

New (added at bottom of dialog):
```
─────────────────────────────
[Close Table] (red gradient button)
```

---

## Component Structure

### New Add Table Dialog
```text
┌─────────────────────────────────────┐
│  Add New Table                      │
├─────────────────────────────────────┤
│  Table ID/Name *                    │
│  ┌─────────────────────────────┐    │
│  │ T9                          │    │
│  └─────────────────────────────┘    │
│                                     │
│  Number of Seats                    │
│  ┌─────────────────────────────┐    │
│  │ 4                         ▼ │    │
│  └─────────────────────────────┘    │
│                                     │
│           [Cancel]  [Add Table]     │
└─────────────────────────────────────┘
```

### Close Table Confirmation Dialog
```text
┌─────────────────────────────────────┐
│  Close Table T3?                    │
├─────────────────────────────────────┤
│  This will mark all 2 orders as     │
│  posted. The table will become      │
│  available for new guests.          │
│                                     │
│  Total: ৳1,250                      │
│                                     │
│           [Cancel]  [Close Table]   │
└─────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/usePOS.tsx` | Add `useCloseTable` mutation hook |
| `src/components/pos/TableManagement.tsx` | Add Close Table button, Add Table dialog, delete table in edit mode |

---

## User Flow

### Close Table Flow
1. Staff clicks on an occupied table in the floor plan
2. Table details dialog opens showing all orders
3. Staff clicks "Close Table" button at the bottom
4. Confirmation dialog appears with order count and total
5. Staff confirms by clicking "Close Table"
6. All orders are marked as posted
7. Dialog closes, table now shows as available

### Add Table Flow
1. Staff clicks "Edit Layout" to enter edit mode
2. Staff clicks "+ Add Table" button
3. Dialog appears prompting for Table ID and seats
4. Staff enters details (e.g., "T9", 4 seats)
5. New table appears in first available grid position
6. Staff can drag it to desired location
7. Staff clicks "Save Layout" to persist changes

---

## Edge Cases Handled

1. **Duplicate Table ID**: Shows error toast if ID already exists
2. **Grid Full**: Expands grid to add new row if all positions occupied
3. **Empty Table Close**: Button only appears for occupied tables
4. **Delete Table with Orders**: Confirmation warns if table has active orders
5. **Unsaved Changes**: Cancel button reverts to last saved layout
