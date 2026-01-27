

# Implement Corporate Account Integration for Reservations and Payments

## Overview

This plan implements two connected features:

1. **New Reservation - Corporate Source Display**: When booking source is "Corporate", show the guest's linked corporate account with discount auto-applied
2. **Payment - Corporate Account Payment Option**: Add ability to charge payments to a corporate account, with balance tracking

---

## Current State

- Guests can be linked to corporate accounts via `guests.corporate_account_id`
- Corporate accounts have `credit_limit` and `discount_percentage` fields
- Payments use the `payment_method` enum: `cash`, `credit_card`, `debit_card`, `bank_transfer`, `other`
- There is no balance tracking or corporate payment functionality currently

---

## Database Changes

### Add Corporate Account Balance Tracking

A new column is needed to track the outstanding balance on corporate accounts:

```sql
-- Add current_balance column to track outstanding corporate account balance
ALTER TABLE corporate_accounts 
ADD COLUMN current_balance numeric NOT NULL DEFAULT 0;

-- Add corporate_account_id to payments table to track which payments were charged to corporate
ALTER TABLE payments 
ADD COLUMN corporate_account_id uuid REFERENCES corporate_accounts(id);
```

**Why?**
- `current_balance` tracks how much the corporate account owes (positive = they owe money)
- `corporate_account_id` on payments links the payment to the corporate account for reporting

---

## Feature 1: Corporate Source Display in New Reservation

### File: `src/components/reservations/NewReservationDialog.tsx`

**Changes:**
1. Add state to track the selected guest's corporate account
2. When booking source is "Corporate" and guest has a linked corporate account:
   - Display an info card showing the corporate account details
   - Auto-apply the corporate discount if configured
3. If source is "Corporate" but guest has no corporate account, show a warning

**Implementation Details:**

- Import `useCorporateAccounts` hook
- Add `useEffect` to fetch guest's corporate account when guest is selected
- Conditionally render a corporate account info card when:
  - `source === "corporate"` AND
  - Selected guest has `corporate_account_id`
- The card shows: Company Name, Account Code, Discount %, Credit Limit
- Auto-select the corporate discount reference if the corporate account has a discount

### File: `src/components/reservations/GuestSearchSelect.tsx`

**Changes:**
- Display corporate account badge next to guest name in search results
- Include `corporate_account_id` in the data returned

---

## Feature 2: Corporate Account Payment Option

### File: `src/components/folios/RecordPaymentDialog.tsx`

**Changes:**
1. Accept new props: `guestId` and `guestCorporateAccountId`
2. Add corporate account payment method option when guest is linked to a corporate account
3. When "Corporate Account" is selected:
   - Show the company name and current balance
   - Display credit limit warning if payment would exceed limit
4. Update payment mutation to handle corporate account payments

### File: `src/hooks/useFolios.tsx`

**Changes to `useRecordPayment` mutation:**
1. Accept optional `corporateAccountId` parameter
2. If corporate payment:
   - Insert payment with `corporate_account_id`
   - Update `corporate_accounts.current_balance` (add the payment amount)
3. Include credit limit validation

### File: `src/components/folios/FolioDetailDrawer.tsx`

**Changes:**
- Pass guest info to `RecordPaymentDialog` component

---

## Files to Create

None - all changes are modifications to existing files

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/reservations/NewReservationDialog.tsx` | Add corporate account display when source is "corporate" |
| `src/components/reservations/GuestSearchSelect.tsx` | Show corporate badge on guests |
| `src/components/folios/RecordPaymentDialog.tsx` | Add corporate payment option |
| `src/components/folios/FolioDetailDrawer.tsx` | Pass guest corporate account info to payment dialog |
| `src/hooks/useFolios.tsx` | Update payment mutation for corporate billing |
| `src/hooks/useCorporateAccounts.tsx` | Add hook for updating corporate balance |

---

## Implementation Flow

### New Reservation with Corporate Source

```text
User selects guest
    -> System checks if guest has corporate_account_id
    
User selects "Corporate" as booking source
    -> If guest has corporate account:
       - Display corporate account info card
       - Show company name, account code, discount %
       - Auto-apply discount to reservation total
    -> If guest has no corporate account:
       - Show warning: "Guest is not linked to any corporate account"
```

### Corporate Payment Flow

```text
User opens folio and clicks "Record Payment"
    -> If guest is linked to corporate account:
       - Show "Corporate Account" option in payment methods
    
User selects "Corporate Account"
    -> Display company name and current balance
    -> Check credit limit: balance + new payment <= credit_limit
    -> If over limit: Show warning, allow override or block
    
User confirms payment
    -> Insert payment with corporate_account_id
    -> Update folio balance (reduce balance)
    -> Update corporate_accounts.current_balance (increase balance owed)
```

---

## UI Mockups

### Corporate Source Info Card (New Reservation)

When source = "Corporate" and guest has corporate account:

```text
+--------------------------------------------+
|  Building Icon  Corporate Account          |
+--------------------------------------------+
| Company: ABC Corporation                   |
| Account Code: ABC-001                      |
| Discount: 15%                              |
| Credit Limit: ৳500,000                    |
|                                            |
| [Green Badge] Discount will be auto-applied|
+--------------------------------------------+
```

### Corporate Payment Option (Record Payment Dialog)

```text
Payment Method:
+--------------------------------------------+
| Cash                                       |
| Credit Card                                |
| Debit Card                                 |
| Bank Transfer                              |
| Corporate Account - ABC Corporation    <-- New |
| Other                                      |
+--------------------------------------------+

When "Corporate Account" selected:
+--------------------------------------------+
| [Info Box]                                 |
| Billing to: ABC Corporation                |
| Current Balance: ৳25,000                  |
| Credit Limit: ৳500,000                    |
| After Payment: ৳35,000                    |
+--------------------------------------------+
```

---

## Technical Notes

### Payment Method Handling

The `payment_method` enum currently supports: `cash`, `credit_card`, `debit_card`, `bank_transfer`, `other`

For corporate payments, we will use `other` as the payment method and track the corporate account via the new `corporate_account_id` column. This avoids needing a database migration to modify the enum.

Alternative approach (if preferred): Add `corporate_billing` to the enum via migration.

### Credit Limit Validation

- Soft validation: Show warning but allow override
- Credit limit of 0 means unlimited
- Balance tracking: Positive balance = corporate owes hotel

### Corporate Account Discount

When source is "Corporate":
1. Check if guest has `corporate_account_id`
2. Fetch the corporate account's `discount_percentage`
3. Auto-apply as a discount (similar to reference discount)
4. Can be combined with or replace the reference discount

---

## Summary

| Feature | Impact |
|---------|--------|
| Corporate source display | Shows account info, auto-applies discount |
| Corporate payment option | Allows billing to corporate account with balance tracking |
| Database changes | 2 new columns for balance tracking |
| Files modified | 6 existing files |

---

## Result After Implementation

1. Staff creating reservations with "Corporate" source see the linked corporate account details
2. Corporate discounts are automatically applied to reservations
3. During payment, staff can select "Corporate Account" to bill the company
4. Corporate account balances are tracked for billing and reporting
5. Credit limit warnings prevent overbilling

