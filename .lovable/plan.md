

# Implement Corporate Checkout Payment in Front Desk

## Overview

This plan enhances the Front Desk checkout flow to include payment method selection before completing checkout. When a guest is linked to a corporate account, staff can select "Corporate Account" as the payment method to bill the full balance to the company.

---

## Current Behavior

The current checkout flow on the Front Desk page is:
1. Staff clicks "Check Out" on a guest
2. A simple confirmation dialog appears asking to confirm
3. Upon confirmation, the checkout happens immediately
4. A success modal shows with invoice download option

**Problem**: There is no opportunity to record payment or select a corporate billing option during checkout.

---

## Proposed Flow

The new checkout flow will be:

```text
Staff clicks "Check Out"
    -> New Checkout Dialog opens
    -> Shows folio summary (balance, charges, payments)
    -> If balance > 0:
       - Show payment method selection
       - If guest has corporate account, include "Corporate Account" option
       - When "Corporate Account" selected:
         * Show company info and credit limit
         * Full balance billed to corporate account
    -> Staff confirms payment + checkout
    -> Payment recorded (if selected)
    -> Checkout completed
    -> Success modal with invoice
```

---

## Changes Required

### 1. Update Front Desk Hook to Include Guest Corporate Info

**File:** `src/hooks/useFrontDesk.tsx`

Add `corporate_account_id` to the guest select query so we know if a guest is linked to a corporate account.

```text
guest:guests(id, first_name, last_name, email, phone, is_vip, corporate_account_id)
```

### 2. Create New Checkout Dialog Component

**New File:** `src/components/front-desk/CheckoutDialog.tsx`

A comprehensive checkout dialog that:
- Fetches the reservation's folio data
- Shows folio summary (balance, total, paid)
- If balance > 0:
  - Payment method dropdown (including "Corporate Account" if applicable)
  - Corporate account info display when selected
  - Credit limit validation
- "Pay & Check Out" button that:
  - Records payment (using existing `useRecordPayment`)
  - Completes checkout (using existing `useCheckOut`)
- If balance = 0, just shows confirmation with "Check Out" button

### 3. Update Front Desk Page

**File:** `src/pages/FrontDesk.tsx`

Replace the simple `AlertDialog` confirmation with the new `CheckoutDialog` component:
- Pass the pending reservation to the dialog
- Handle success callback to show the checkout success modal

---

## Technical Details

### CheckoutDialog Component

**Props:**
```typescript
interface CheckoutDialogProps {
  reservation: FrontDeskReservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (checkoutData: CheckoutData) => void;
}
```

**Internal Logic:**
1. Fetch folio by reservation ID using a new hook `useFolioByReservationId`
2. Fetch corporate account if guest has `corporate_account_id`
3. Display payment form if balance > 0
4. On submit:
   - If payment needed and corporate selected, call `useRecordPayment` with `corporateAccountId`
   - Then call `useCheckOut` mutation
   - On success, trigger `onSuccess` callback with checkout data

### New Hook: useFolioByReservationId

**File:** `src/hooks/useFolios.tsx`

Add a hook to fetch folio by reservation ID (the checkout dialog needs this since we have reservation, not folio ID):

```typescript
export function useFolioByReservationId(reservationId: string | null)
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/front-desk/CheckoutDialog.tsx` | Checkout dialog with payment selection |

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useFrontDesk.tsx` | Add corporate_account_id to guest query |
| `src/hooks/useFolios.tsx` | Add useFolioByReservationId hook |
| `src/pages/FrontDesk.tsx` | Replace AlertDialog with CheckoutDialog |

---

## UI Design

### Checkout Dialog (with balance)

```text
+------------------------------------------+
|  Checkout: John Smith                    |
+------------------------------------------+
|                                          |
|  Room: 101, 102                          |
|  Check-in: Jan 25 → Check-out: Jan 27    |
|                                          |
|  +------------------------------------+  |
|  |          Folio Summary             |  |
|  +------------------------------------+  |
|  | Total Amount    |     ৳15,000     |  |
|  | Paid Amount     |     ৳5,000      |  |
|  | Balance         |     ৳10,000     |  |
|  +------------------------------------+  |
|                                          |
|  Payment Method:                         |
|  [v] Corporate Account - ABC Corp    [ ] |
|                                          |
|  +------------------------------------+  |
|  | Billing to: ABC Corporation        |  |
|  | Current Balance: ৳25,000           |  |
|  | Credit Limit: ৳500,000             |  |
|  | After Payment: ৳35,000             |  |
|  +------------------------------------+  |
|                                          |
|  [Cancel]            [Pay ৳10,000 & Checkout]|
+------------------------------------------+
```

### Checkout Dialog (zero balance)

```text
+------------------------------------------+
|  Checkout: John Smith                    |
+------------------------------------------+
|                                          |
|  Room: 101                               |
|  Check-in: Jan 25 → Check-out: Jan 27    |
|                                          |
|  +------------------------------------+  |
|  |          Folio Summary             |  |
|  +------------------------------------+  |
|  | Total Amount    |     ৳15,000     |  |
|  | Paid Amount     |     ৳15,000     |  |
|  | Balance         |     ৳0    PAID  |  |
|  +------------------------------------+  |
|                                          |
|  [green check] All charges settled       |
|                                          |
|  [Cancel]                   [Check Out]  |
+------------------------------------------+
```

---

## Summary

| Change | Impact |
|--------|--------|
| New CheckoutDialog | Comprehensive checkout with payment selection |
| Corporate payment option | Staff can bill to company during checkout |
| Balance tracking | Corporate account debt increases automatically |
| Seamless flow | Payment and checkout in single action |

---

## Result After Implementation

1. Staff clicking "Check Out" see a comprehensive dialog
2. If the guest has an outstanding balance, payment options appear
3. Corporate guests show the "Corporate Account" payment option
4. Selecting corporate bills the full balance to the company
5. The guest checks out with zero balance
6. The corporate account's debt increases by the billed amount
7. Success modal shows with invoice download as before

