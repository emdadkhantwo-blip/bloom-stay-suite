

# Enhanced Folio Management Features

## Current State Analysis

The folios section currently supports:
- View open/closed folios with search
- Add charges (multiple item types)
- Record payments (multiple methods)
- Void charges with reason
- Close folio (when balance is zero)
- Basic print button (placeholder, not functional)
- Stats bar with overview metrics

---

## Proposed New Features

### Feature 1: Folio Invoice Print/Export

**Description**: Make the existing print button functional by generating a detailed invoice for any folio.

**Implementation**:
- Create a new `FolioInvoicePrintView` component
- Include itemized charges with dates and types
- Show payment history with methods and dates
- Display tax, service charge, and totals breakdown
- Add hotel branding (logo, name)
- Auto-trigger print or allow PDF download

**Files to modify**:
- `src/components/folios/FolioDetailDrawer.tsx` - Wire up print button
- Create `src/components/folios/FolioInvoicePrintView.tsx` - Invoice template

---

### Feature 2: Void Payment Functionality

**Description**: Allow voiding incorrect payments (similar to voiding charges).

**Implementation**:
- Add a void button next to each payment in the drawer
- Create `VoidPaymentDialog` with reason input
- Add `useVoidPayment` mutation hook
- Update folio balance when payment is voided
- Show voided payments with strikethrough styling

**Files to modify**:
- `src/hooks/useFolios.tsx` - Add `useVoidPayment` hook
- Create `src/components/folios/VoidPaymentDialog.tsx`
- `src/components/folios/FolioDetailDrawer.tsx` - Add void button to payments

---

### Feature 3: Transfer Charges Between Folios

**Description**: Move charges from one guest's folio to another (common for group bookings).

**Implementation**:
- Add "Transfer" button next to each charge
- Create dialog to select target folio
- Show searchable list of open folios
- Update both source and target folio totals
- Log the transfer for audit purposes

**Files to modify**:
- `src/hooks/useFolios.tsx` - Add `useTransferCharge` hook
- Create `src/components/folios/TransferChargeDialog.tsx`
- `src/components/folios/FolioDetailDrawer.tsx` - Add transfer button

---

### Feature 4: Split Folio Functionality

**Description**: Create a new folio from selected charges of an existing folio.

**Implementation**:
- Add "Split Folio" button in drawer actions
- Allow selecting which charges to move
- Create new folio with selected charges
- Update original folio totals
- Link both folios to same guest/reservation

**Files to modify**:
- `src/hooks/useFolios.tsx` - Add `useSplitFolio` hook
- Create `src/components/folios/SplitFolioDialog.tsx`
- `src/components/folios/FolioDetailDrawer.tsx` - Add split button

---

### Feature 5: Date Range Filtering

**Description**: Filter folios by date range (created date, closed date).

**Implementation**:
- Add date picker filters in the folios page header
- Filter by created date or closed date
- Show results count
- Reset filter button

**Files to modify**:
- `src/pages/Folios.tsx` - Add date filter UI
- `src/hooks/useFolios.tsx` - Update query to accept date range

---

### Feature 6: Reopen Closed Folio

**Description**: Allow reopening a closed folio if additional charges need to be added.

**Implementation**:
- Add "Reopen" button for closed folios
- Confirmation dialog with reason
- Update folio status back to "open"
- Log the reopen action

**Files to modify**:
- `src/hooks/useFolios.tsx` - Add `useReopenFolio` hook
- `src/components/folios/FolioDetailDrawer.tsx` - Add reopen button for closed folios

---

### Feature 7: Bulk Payment (Pay Multiple Folios)

**Description**: Record a single payment across multiple folios (useful for corporate accounts).

**Implementation**:
- Add checkbox selection on folio cards
- "Pay Selected" button when folios selected
- Dialog showing selected folios with total
- Allocate payment across folios

**Files to modify**:
- `src/pages/Folios.tsx` - Add selection state and bulk action button
- Create `src/components/folios/BulkPaymentDialog.tsx`
- `src/hooks/useFolios.tsx` - Add `useBulkPayment` hook

---

### Feature 8: Folio Notes/Comments

**Description**: Add internal notes to folios for staff communication.

**Implementation**:
- Add collapsible notes section in drawer
- Create/view/delete notes
- Show note author and timestamp
- Mark notes as important/pinned

**Database changes**:
- Create `folio_notes` table (folio_id, content, author_id, created_at, is_pinned)

**Files to modify**:
- Create `src/components/folios/FolioNotesSection.tsx`
- `src/components/folios/FolioDetailDrawer.tsx` - Add notes section
- `src/hooks/useFolios.tsx` - Add notes hooks

---

### Feature 9: Export Folios to CSV/Excel

**Description**: Export folio list with financial details for accounting purposes.

**Implementation**:
- Add "Export" button in folios page header
- Export visible/filtered folios
- Include all financial columns
- Download as CSV file

**Files to modify**:
- `src/pages/Folios.tsx` - Add export button and logic

---

### Feature 10: Adjustment/Discount Entry

**Description**: Add discount or adjustment entries (positive or negative) to folios.

**Implementation**:
- Add "Add Adjustment" option in charges section
- Allow positive (debit) or negative (credit) amounts
- Require reason for adjustments
- Show adjustments differently in charge list

**Files to modify**:
- Create `src/components/folios/AddAdjustmentDialog.tsx`
- `src/components/folios/FolioDetailDrawer.tsx` - Add adjustment button
- `src/hooks/useFolios.tsx` - Add adjustment mutation (or update AddCharge to handle negative amounts)

---

## Implementation Priority

| Priority | Feature | Effort | Value |
|----------|---------|--------|-------|
| 1 | Folio Invoice Print | Medium | High |
| 2 | Void Payment | Low | High |
| 3 | Reopen Closed Folio | Low | Medium |
| 4 | Date Range Filtering | Low | Medium |
| 5 | Export to CSV | Low | Medium |
| 6 | Adjustment/Discount Entry | Medium | High |
| 7 | Transfer Charges | Medium | High |
| 8 | Folio Notes | Medium | Medium |
| 9 | Split Folio | High | Medium |
| 10 | Bulk Payment | High | Medium |

---

## Technical Notes

1. **Database Changes**: Only Feature 8 (Folio Notes) requires a new table. All other features work with existing schema.

2. **Audit Trail**: All financial operations (void payment, transfer, split, adjustment) should be logged in the audit_logs table.

3. **Balance Recalculation**: Any operation affecting folio totals must recalculate subtotal, tax, service charge, and balance atomically.

4. **RLS Considerations**: New hooks must respect existing tenant isolation patterns. All queries filter by current tenant.

5. **Real-time Updates**: Existing `useFolioNotifications` hook will automatically sync UI when folios or payments are modified.

---

## Summary

These 10 features transform the folio management from basic charge/payment tracking into a comprehensive billing system suitable for professional hotel operations. The priority order focuses on high-value, low-effort features first, ensuring quick wins while building toward more complex functionality.

