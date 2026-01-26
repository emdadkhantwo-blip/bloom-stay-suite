

# Enhanced Folio Summary Section

## Overview
Enhance the Folio Summary card in the ReservationDetailDrawer to display comprehensive folio information beyond just financial amounts. This will give front desk staff a complete view of the folio at a glance.

## Current State
The Folio Summary section currently shows:
- Folio Number
- Subtotal, Tax, Service Charge
- Total, Paid, Balance Due

## Proposed Enhancements

### Additional Information to Display
1. **Folio Status Badge** - Show if folio is "Open" or "Closed" with color-coded badge
2. **Charges Count** - Number of active charges on the folio
3. **Payments Count** - Number of payments recorded
4. **Last Updated** - When the folio was last modified
5. **Quick Action Buttons** - Add Charge, Record Payment, View Full Folio (for open folios)

### Visual Layout

```text
+------------------------------------------+
| [CreditCard Icon] Folio Summary    [Open]|  <- Status badge
+------------------------------------------+
| Folio #           F-GPB-260126-6561      |
|------------------------------------------|
| 3 Charges         2 Payments             |  <- NEW: Counts row
|------------------------------------------|
| Subtotal                            ৳540 |
| Tax                                   ৳0 |
| Service Charge                        ৳0 |
|------------------------------------------|
| Total                               ৳540 |
| Paid                                  ৳0 |
| Balance Due                         ৳540 |
|------------------------------------------|
| Last Updated: Jan 26, 2026 11:30 PM      |  <- NEW
|------------------------------------------|
| [+ Add Charge] [Record Payment] [View]   |  <- NEW: Action buttons
+------------------------------------------+
```

---

## Implementation Details

### File: `src/components/reservations/ReservationDetailDrawer.tsx`

### Step 1: Expand FolioSummary Interface
Add additional fields to fetch:

```typescript
interface FolioSummary {
  id: string;
  folio_number: string;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  updated_at: string;        // NEW
  created_at: string;        // NEW
  charges_count: number;     // NEW (computed)
  payments_count: number;    // NEW (computed)
}
```

### Step 2: Update Folio Query
Modify the query to include folio_items and payments counts:

```typescript
const { data, error } = await supabase
  .from("folios")
  .select(`
    id, folio_number, subtotal, tax_amount, service_charge, 
    total_amount, paid_amount, balance, status, updated_at, created_at,
    folio_items(id, voided),
    payments(id, voided)
  `)
  .eq("reservation_id", reservation.id)
  .maybeSingle();
```

Then compute counts:
```typescript
return {
  ...data,
  charges_count: data.folio_items?.filter(i => !i.voided).length || 0,
  payments_count: data.payments?.filter(p => !p.voided).length || 0,
};
```

### Step 3: Update Card Header with Status Badge
Add the folio status badge next to the title:

```tsx
<CardHeader className="pb-3">
  <div className="flex items-center justify-between">
    <CardTitle className="flex items-center gap-2 text-sm font-medium">
      <CreditCard className="h-4 w-4" />
      Folio Summary
    </CardTitle>
    <Badge 
      variant={folio.status === 'open' ? 'default' : 'secondary'}
      className={folio.status === 'open' 
        ? 'bg-emerald-500 hover:bg-emerald-600' 
        : ''}
    >
      {folio.status === 'open' ? 'Open' : 'Closed'}
    </Badge>
  </div>
</CardHeader>
```

### Step 4: Add Charges/Payments Count Row
Display counts with icons:

```tsx
<div className="flex items-center justify-between text-sm py-2 px-3 bg-muted/50 rounded-lg">
  <div className="flex items-center gap-2">
    <Receipt className="h-4 w-4 text-muted-foreground" />
    <span>{folio.charges_count} Charge{folio.charges_count !== 1 ? 's' : ''}</span>
  </div>
  <div className="flex items-center gap-2">
    <Banknote className="h-4 w-4 text-muted-foreground" />
    <span>{folio.payments_count} Payment{folio.payments_count !== 1 ? 's' : ''}</span>
  </div>
</div>
```

### Step 5: Add Last Updated Timestamp
Show when folio was last modified:

```tsx
<div className="text-xs text-muted-foreground text-center pt-2">
  Last updated: {format(new Date(folio.updated_at), "MMM d, yyyy 'at' h:mm a")}
</div>
```

### Step 6: Add Action Buttons (for Open Folios)
Add quick action buttons at the bottom:

```tsx
{folio.status === 'open' && (
  <div className="flex gap-2 pt-3">
    <Button 
      size="sm" 
      variant="outline" 
      className="flex-1 text-xs"
      onClick={() => setAddChargeOpen(true)}
    >
      <Plus className="h-3 w-3 mr-1" />
      Add Charge
    </Button>
    <Button 
      size="sm" 
      variant="outline" 
      className="flex-1 text-xs"
      onClick={() => setPaymentOpen(true)}
    >
      <CreditCard className="h-3 w-3 mr-1" />
      Payment
    </Button>
    <Button 
      size="sm" 
      variant="ghost" 
      className="text-xs"
      onClick={() => navigate(`/folios?selected=${folio.id}`)}
    >
      <ExternalLink className="h-3 w-3" />
    </Button>
  </div>
)}
```

### Step 7: Add Dialog States and Import Components
Add state variables and import the charge/payment dialogs:

```typescript
import { AddChargeDialog } from "@/components/folios/AddChargeDialog";
import { RecordPaymentDialog } from "@/components/folios/RecordPaymentDialog";
import { Receipt, Banknote, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

// In component:
const navigate = useNavigate();
const [addChargeOpen, setAddChargeOpen] = useState(false);
const [paymentOpen, setPaymentOpen] = useState(false);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/reservations/ReservationDetailDrawer.tsx` | Expand FolioSummary interface, update query, add status badge, counts, timestamp, and action buttons |

---

## Visual Improvements
- **Status Badge**: Green for "Open", gray for "Closed"
- **Counts Row**: Muted background with icons for visual grouping
- **Action Buttons**: Small, subtle buttons that don't overpower the summary
- **Timestamp**: Small text showing last update time

---

## Benefits
1. **At-a-Glance Information**: Staff can quickly see folio status without opening the full folio
2. **Quick Actions**: Add charges or payments directly from the reservation drawer
3. **Activity Overview**: See how many charges and payments exist
4. **Recency Indicator**: Know when the folio was last updated

