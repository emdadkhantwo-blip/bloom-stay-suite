
# Post-Checkout Success Modal with Invoice Download

## Overview
After a successful checkout, a modal will appear in the center of the screen showing a success message and a "Download Invoice" button. The invoice will contain: Hotel Name, Logo, Invoice Number, Guest Name, Phone Number, Room Number, Stay Duration, and Total Amount.

---

## Implementation Approach

Since no PDF library is currently installed, we will use a **browser-based print/save as PDF** approach using `window.print()`. This is the most reliable cross-browser solution that doesn't require additional dependencies. The user can then save the printed page as a PDF.

---

## Components to Create

### 1. `CheckoutSuccessModal.tsx` (New Component)
**Location**: `src/components/front-desk/CheckoutSuccessModal.tsx`

A Dialog component that:
- Opens after successful checkout
- Shows a success message with a checkmark animation
- Displays invoice summary (guest name, room, dates, amount)
- Has a "Download Invoice" button that opens the printable invoice
- Has a "Close" button to dismiss the modal

**Props**:
```typescript
interface CheckoutSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutData: {
    guestName: string;
    guestPhone: string | null;
    roomNumbers: string[];
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
    invoiceNumber: string;  // folio_number
    reservationId: string;
  } | null;
}
```

### 2. `InvoicePrintView.tsx` (New Component)
**Location**: `src/components/front-desk/InvoicePrintView.tsx`

A printable invoice component that:
- Opens in a new window when "Download Invoice" is clicked
- Contains hotel logo and name (from tenant)
- Shows invoice details in a professional format
- Auto-triggers print dialog

**Invoice Content**:
| Field | Source |
|-------|--------|
| Hotel Logo | `tenant.logo_url` |
| Hotel Name | `tenant.name` |
| Invoice Number | `folio.folio_number` |
| Guest Name | `guest.first_name + guest.last_name` |
| Guest Phone | `guest.phone` |
| Room Number(s) | From `reservation_rooms` |
| Check-in Date | `reservation.check_in_date` |
| Check-out Date | `reservation.check_out_date` |
| Nights Stayed | Calculated from dates |
| Subtotal | `folio.subtotal` |
| Tax | `folio.tax_amount` |
| Service Charge | `folio.service_charge` |
| Total Amount | `folio.total_amount` |

---

## Data Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│                     User clicks "Check Out"                     │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Confirmation dialog appears (existing)             │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│           User confirms → useCheckOut mutation runs             │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Mutation returns checkout data (guest, room, folio info)       │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│           CheckoutSuccessModal opens with invoice data          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│    User clicks "Download Invoice" → Print view opens            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

### 1. `src/hooks/useReservations.tsx`
**Changes**: Update `useCheckOut` mutation to return all data needed for the invoice

```typescript
// Return type changes to include checkout data
return {
  assignedStaffNames: [...],
  checkoutData: {
    guestName: 'First Last',
    guestPhone: '+880...',
    roomNumbers: ['101', '102'],
    checkInDate: '2024-01-20',
    checkOutDate: '2024-01-25',
    totalAmount: 5000,
    invoiceNumber: 'F-MAIN-240125-1234',
    reservationId: 'uuid'
  }
};
```

**Implementation**:
- Fetch reservation with guest data before checkout
- Fetch folio data for the reservation
- Fetch reservation_rooms with room numbers
- Return all data in mutation result

### 2. `src/pages/FrontDesk.tsx`
**Changes**:
- Add state for checkout success modal
- Add state for checkout data
- Update `confirmCheckOut` to capture returned data
- Render the new CheckoutSuccessModal component

### 3. `src/pages/Reservations.tsx`
**Changes**: Same as FrontDesk - add modal state and render component

### 4. `src/pages/Calendar.tsx`
**Changes**: Same as FrontDesk - add modal state and render component

---

## New Files

### `src/components/front-desk/CheckoutSuccessModal.tsx`
```typescript
// Key features:
// - Centered Dialog with success icon
// - Guest and stay summary
// - "Download Invoice" button
// - "Close" button
// - Uses tenant context for hotel name/logo
```

### `src/components/front-desk/InvoicePrintView.tsx`
```typescript
// Key features:
// - Renders in new window
// - Professional invoice layout
// - Auto-prints on load
// - Includes all required fields
```

---

## Invoice Template Design

```text
┌────────────────────────────────────────────────┐
│  [HOTEL LOGO]       HOTEL NAME                 │
│                     Invoice                    │
├────────────────────────────────────────────────┤
│  Invoice #: F-MAIN-240125-1234                 │
│  Date: January 25, 2024                        │
├────────────────────────────────────────────────┤
│  BILL TO:                                      │
│  Guest Name: John Doe                          │
│  Phone: +880 1234 567890                       │
├────────────────────────────────────────────────┤
│  STAY DETAILS:                                 │
│  Room(s): 101, 102                             │
│  Check-in: January 20, 2024                    │
│  Check-out: January 25, 2024                   │
│  Duration: 5 nights                            │
├────────────────────────────────────────────────┤
│  CHARGES:                                      │
│  Room Charges (Subtotal):         ৳4,000       │
│  Tax (15%):                         ৳600       │
│  Service Charge (10%):              ৳400       │
│  ─────────────────────────────────────────     │
│  TOTAL:                           ৳5,000       │
├────────────────────────────────────────────────┤
│  Thank you for staying with us!                │
│  We hope to see you again soon.                │
└────────────────────────────────────────────────┘
```

---

## Technical Implementation Details

### Fetching Invoice Data in useCheckOut

The mutation will be updated to:
1. Fetch the reservation with guest details before updating status
2. Fetch the folio associated with the reservation
3. Fetch room numbers from reservation_rooms joined with rooms
4. Calculate nights stayed from check-in/check-out dates
5. Return all data alongside the existing assignedStaffNames

### Print Window Implementation

```typescript
const handleDownloadInvoice = () => {
  // Create a new window with invoice content
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  // Write HTML content with styling
  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice - ${invoiceNumber}</title>
        <style>/* Print styles */</style>
      </head>
      <body>
        <!-- Invoice HTML -->
      </body>
    </html>
  `);
  
  // Trigger print dialog
  printWindow.document.close();
  printWindow.print();
};
```

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useReservations.tsx` | Modify | Return checkout data from mutation |
| `src/pages/FrontDesk.tsx` | Modify | Add modal state and component |
| `src/pages/Reservations.tsx` | Modify | Add modal state and component |
| `src/pages/Calendar.tsx` | Modify | Add modal state and component |
| `src/components/front-desk/CheckoutSuccessModal.tsx` | Create | Success modal component |
| `src/components/front-desk/InvoicePrintView.tsx` | Create | Printable invoice utility |
