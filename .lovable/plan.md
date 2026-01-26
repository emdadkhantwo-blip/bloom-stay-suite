
# Fix: Folio Charge Calculation Bug

## Problem Summary
When adding VAT, Tax, and extra services to a reservation during checkout, the room cost is being reduced instead of increased. This is due to incorrect total calculations in the folio charge system.

## Root Cause
The `useAddFolioCharge` function in `src/hooks/useFolios.tsx` has multiple calculation errors:

1. **Incorrect Service Charge Calculation**: The service charge is being recalculated on the entire subtotal instead of adding an incremental service charge for the new item
2. **Service Charge Field Not Updated**: The `service_charge` column in the folio is never updated when adding charges
3. **Void Function Missing Service Charge**: The void function doesn't account for service charges in its total calculation

---

## Solution

### File: `src/hooks/useFolios.tsx`

#### Fix 1: Update `useAddFolioCharge` (Lines 165-242)

**Current (Buggy) Calculation:**
```typescript
const newTotal = newSubtotal + newTaxAmount + (serviceChargeRate / 100) * newSubtotal;
```

**Fixed Calculation:**
```typescript
// Calculate incremental service charge for this charge only
const serviceChargeForItem = totalPrice * (serviceChargeRate / 100);
const newServiceCharge = Number(folio.service_charge) + serviceChargeForItem;
const newTotal = newSubtotal + newTaxAmount + newServiceCharge;
```

**Changes Required:**
- Fetch `service_charge` field from the folio (add to select query)
- Calculate incremental service charge for the new item only
- Update `service_charge` field when saving to database
- Use correct formula: `newTotal = newSubtotal + newTaxAmount + newServiceCharge`

#### Fix 2: Update `useVoidFolioItem` (Lines 346-423)

**Current (Buggy) Calculation:**
```typescript
const newTotal = newSubtotal + newTaxAmount;  // Missing service charge!
```

**Fixed Calculation:**
```typescript
// Calculate service charge for the voided item
const serviceChargeForItem = Number(item.total_price) * (serviceChargeRate / 100);
const newServiceCharge = Number(folio.service_charge) - serviceChargeForItem;
const newTotal = newSubtotal + newTaxAmount + newServiceCharge;
```

**Changes Required:**
- Fetch `service_charge` from folio and get property service charge rate
- Calculate the service charge that was applied to the voided item
- Subtract it from the folio's service charge
- Update `service_charge` field in the database update
- Use correct formula that includes service charge

---

## Implementation Steps

1. **Update `useAddFolioCharge` mutation:**
   - Add `service_charge` to the folio select query
   - Calculate incremental service charge for the new charge
   - Add new service charge to existing folio service charge
   - Include `service_charge` in the folio update

2. **Update `useVoidFolioItem` mutation:**
   - Add `service_charge` to the folio select query
   - Calculate the service charge portion of the voided item
   - Subtract from folio service charge
   - Include `service_charge` in the folio update

---

## Technical Details

### Updated `useAddFolioCharge` Logic

| Field | Current Formula | Fixed Formula |
|-------|----------------|---------------|
| `newSubtotal` | `folio.subtotal + totalPrice` | Same |
| `newTaxAmount` | `folio.tax_amount + taxAmount` | Same |
| `newServiceCharge` | Not calculated | `folio.service_charge + (totalPrice * serviceRate / 100)` |
| `newTotal` | `newSubtotal + newTaxAmount + (rate/100 * newSubtotal)` | `newSubtotal + newTaxAmount + newServiceCharge` |

### Database Fields Updated

```sql
UPDATE folios SET
  subtotal = newSubtotal,
  tax_amount = newTaxAmount,
  service_charge = newServiceCharge,  -- NEW: This was missing!
  total_amount = newTotal,
  balance = newBalance
WHERE id = folioId;
```

---

## Testing Checklist
After implementation, verify:
- [ ] Adding a charge increases the total (not decreases)
- [ ] Service charge is correctly calculated on new items
- [ ] Voiding an item correctly reduces the total
- [ ] Balance due calculation remains accurate
- [ ] Multiple charges accumulate correctly
