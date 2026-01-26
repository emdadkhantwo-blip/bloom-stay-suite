
# Fix: Add Charge Not Including Room Cost in Total

## Problem Summary
When adding a charge via the "Add Charge" button, the new total should be **Room Cost + Charges + Tax + VAT**, but currently the charges appear to only show the added service amount without properly reflecting the room cost in the calculation.

## Root Cause Analysis
After thorough investigation, I identified a critical issue in how the folio is initialized:

**The Problem:**
When a reservation is created, the `folios` record is initialized with:
- `total_amount` = room cost
- `balance` = room cost
- **BUT** `subtotal`, `tax_amount`, and `service_charge` are left at 0 (database defaults)

This means when a manual charge is added, the `useAddFolioCharge` mutation calculates:
```
newSubtotal = Number(folio.subtotal) + totalPrice  // 0 + charge = only the charge!
newTotal = newSubtotal + newTaxAmount + newServiceCharge
```

Since `folio.subtotal` starts at 0 instead of the room cost, the new total only reflects the added charge, not the cumulative "Room Cost + Charge + Tax + VAT".

---

## Solution

### File: `src/hooks/useCreateReservation.tsx`

**Update the folio creation to properly initialize all financial fields:**

| Field | Current Value | Fixed Value |
|-------|---------------|-------------|
| `subtotal` | 0 (default) | `totalAmount` (room cost) |
| `tax_amount` | 0 (default) | `totalAmount * taxRate / 100` |
| `service_charge` | 0 (default) | `totalAmount * serviceChargeRate / 100` |
| `total_amount` | `totalAmount` | Recalculated with tax/service |
| `balance` | `totalAmount` | Same as new total |

**Implementation Steps:**
1. Fetch property `tax_rate` and `service_charge_rate` (already fetching property)
2. Calculate tax and service charge on the room cost
3. Calculate the true grand total: `subtotal + taxAmount + serviceCharge`
4. Initialize all folio fields correctly

---

## Technical Details

### Changes to `useCreateReservation.tsx`

**Before (lines 110-121):**
```typescript
const { error: folioError } = await supabase
  .from("folios")
  .insert({
    tenant_id: tenantId,
    property_id: propertyId,
    guest_id: input.guest_id,
    reservation_id: reservation.id,
    folio_number: folioNumber,
    total_amount: totalAmount,
    balance: totalAmount,
    status: "open",
  });
```

**After:**
```typescript
// Fetch property rates for tax and service charge
const { data: propertyRates } = await supabase
  .from("properties")
  .select("tax_rate, service_charge_rate")
  .eq("id", propertyId)
  .single();

const taxRate = propertyRates?.tax_rate || 0;
const serviceChargeRate = propertyRates?.service_charge_rate || 0;

// Calculate folio totals with tax and service charge applied to room cost
const folioSubtotal = totalAmount;  // Room cost after discount
const folioTaxAmount = folioSubtotal * (taxRate / 100);
const folioServiceCharge = folioSubtotal * (serviceChargeRate / 100);
const folioTotalAmount = folioSubtotal + folioTaxAmount + folioServiceCharge;

const { error: folioError } = await supabase
  .from("folios")
  .insert({
    tenant_id: tenantId,
    property_id: propertyId,
    guest_id: input.guest_id,
    reservation_id: reservation.id,
    folio_number: folioNumber,
    subtotal: folioSubtotal,
    tax_amount: folioTaxAmount,
    service_charge: folioServiceCharge,
    total_amount: folioTotalAmount,
    balance: folioTotalAmount,
    status: "open",
  });
```

---

### Night Audit Compatibility

Since you want both Night Audit and direct charge addition to work, the Night Audit logic in `useNightAudit.tsx` needs a small adjustment to avoid double-counting room charges.

The Night Audit currently:
1. Creates `folio_items` entries for room charges
2. **Adds** room rates to the folio totals

Since we're now initializing the folio with the room cost already included in `subtotal`/`total_amount`, the Night Audit should **not** add to the header totals again. Instead, it should only create the itemized `folio_items` entries for record-keeping without modifying the totals.

**Changes to `useNightAudit.tsx` (lines 469-477):**
- Remove the folio total update after posting room charges
- The room charge items are still created for audit trail purposes
- The folio header totals remain accurate since they were correctly initialized

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/hooks/useCreateReservation.tsx` | Initialize folio with proper `subtotal`, `tax_amount`, `service_charge`, and recalculated `total_amount` |
| `src/hooks/useNightAudit.tsx` | Remove folio total update when posting room charges (avoids double-counting) |

---

## Expected Behavior After Fix

**Example:**
- Room cost: 300 taka
- Tax rate: 15%
- Service charge rate: 10%

**On reservation creation:**
- Folio subtotal: 300 taka
- Folio tax: 45 taka
- Folio service charge: 30 taka
- Folio total: 375 taka
- Balance: 375 taka

**When adding a 500 taka charge:**
- New subtotal: 300 + 500 = 800 taka
- New tax: 45 + 75 = 120 taka
- New service charge: 30 + 50 = 80 taka
- New total: 800 + 120 + 80 = 1,000 taka

This ensures the total correctly reflects **Room Cost + Charges + Tax + VAT**.
