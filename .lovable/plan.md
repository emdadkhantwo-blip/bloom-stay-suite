
# Fix Floor Plan Table Selection Functionality

## Problem Analysis
Currently, in the Floor Plan section of the POS page, tables are **disabled** when they don't have active orders. This means clicking on available/empty tables does nothing, which breaks the expected workflow where staff should be able to click a table to start a new order for that table.

## Solution Overview
Make all tables clickable and implement the following behavior:
- **Empty table clicked**: Switch to "New Order" tab and pre-fill the table number
- **Occupied table clicked**: Show the existing table details dialog (already working)

---

## Implementation Steps

### Step 1: Update POS.tsx - Add Table Selection State
Add a callback function to handle table selection from the TableManagement component.

**Changes to `src/pages/POS.tsx`:**

| Item | Details |
|------|---------|
| New state | None needed (use existing `setActiveTab`) |
| New callback | `handleSelectTable(tableId: string)` |
| Behavior | Switches to "order" tab and updates table number in order panel |

```tsx
// Add new state for pre-selected table number
const [preSelectedTable, setPreSelectedTable] = useState<string>("");

// Handler for table selection
const handleSelectTable = (tableId: string) => {
  setPreSelectedTable(tableId);
  setActiveTab("order");
};
```

### Step 2: Update TableManagement Component Props
Add a callback prop for when an empty table is selected.

**Changes to `src/components/pos/TableManagement.tsx`:**

| Item | Current | New |
|------|---------|-----|
| Interface | `{ orders, outletId }` | `{ orders, outletId, onSelectEmptyTable? }` |
| Button disabled | `disabled={!isOccupied}` | Remove `disabled` entirely |
| onClick behavior | Only opens dialog for occupied tables | Also calls `onSelectEmptyTable` for empty tables |

```tsx
interface TableManagementProps {
  orders: POSOrder[];
  outletId: string;
  onSelectEmptyTable?: (tableId: string) => void;
}

// In button click handler:
onClick={() => {
  if (tableInfo) {
    setSelectedTable(tableInfo);
  } else {
    onSelectEmptyTable?.(table.id);
  }
}}
// Remove: disabled={!isOccupied}
```

### Step 3: Update POSOrderPanel to Accept Pre-Selected Table
Allow the table number to be controlled from parent.

**Changes to `src/components/pos/POSOrderPanel.tsx`:**

| Item | Current | New |
|------|---------|-----|
| Props interface | No table prop | Add `initialTableNumber?: string` |
| State initialization | `useState("")` | `useState(initialTableNumber \|\| "")` |
| Effect | None | Add useEffect to sync when `initialTableNumber` changes |

```tsx
interface POSOrderPanelProps {
  cart: CartItem[];
  outlet: POSOutlet;
  onUpdateItem: (itemId: string, quantity: number, notes?: string) => void;
  onClearCart: () => void;
  initialTableNumber?: string;
  onTableNumberChange?: (table: string) => void;
}

// Add effect to sync table number
useEffect(() => {
  if (initialTableNumber) {
    setTableNumber(initialTableNumber);
  }
}, [initialTableNumber]);
```

### Step 4: Wire Everything Together in POS.tsx
Pass the callbacks and props through.

```tsx
// In POS.tsx render:
<TabsContent value="tables" className="mt-4 flex-1">
  <TableManagement 
    orders={orders} 
    outletId={selectedOutletId!}
    onSelectEmptyTable={handleSelectTable}
  />
</TabsContent>

// POSOrderPanel with table prop:
<POSOrderPanel
  cart={cart}
  outlet={selectedOutlet!}
  onUpdateItem={handleUpdateCartItem}
  onClearCart={handleClearCart}
  initialTableNumber={preSelectedTable}
  onTableNumberChange={setPreSelectedTable}
/>
```

### Step 5: Visual Enhancement for Empty Tables
Make empty tables look clickable with hover effects.

**Update table button styling in TableManagement.tsx:**

```tsx
// Current empty table style:
"border-dashed border-muted-foreground/30 bg-muted/20"

// New style (add cursor and hover):
"border-dashed border-muted-foreground/30 bg-muted/20 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
```

---

## Summary of File Changes

| File | Changes |
|------|---------|
| `src/pages/POS.tsx` | Add `preSelectedTable` state, `handleSelectTable` callback, pass props to components |
| `src/components/pos/TableManagement.tsx` | Add `onSelectEmptyTable` prop, make all tables clickable, add hover styles |
| `src/components/pos/POSOrderPanel.tsx` | Add `initialTableNumber` prop with useEffect sync |

---

## User Flow After Fix

```text
1. User navigates to POS > Tables tab
2. User sees Floor Plan with available tables (T1, T2, etc.)
3. User clicks on empty table "T3"
   → Tab switches to "New Order"
   → Table # field auto-fills with "T3"
4. User adds menu items and submits order
5. User returns to Tables tab
   → T3 now shows as occupied with order status
```

---

## Technical Notes

1. **State Synchronization**: The `preSelectedTable` state needs to be cleared after an order is submitted to avoid stale pre-selection on the next table click.

2. **Controlled vs Uncontrolled**: The table number input will become semi-controlled - it syncs from parent when a table is clicked but can still be manually edited by the user.

3. **No Database Changes**: This is purely a frontend UX fix with no backend modifications required.
