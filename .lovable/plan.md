
# Replace Dollar Sign ($) with Taka Symbol (৳) Throughout the Codebase

## Overview

The project has been migrating from USD ($) to Bangladeshi Taka (BDT/৳) as the primary currency. While most places have been updated, there are still several files containing the `$` dollar sign that need to be replaced with `৳`.

This plan identifies all remaining instances and outlines the changes needed.

---

## Files Requiring Changes

### 1. Guest Analytics Tab
**File:** `src/components/guests/GuestAnalyticsTab.tsx`

**Changes:**
- Line 5: Remove unused `DollarSign` import from lucide-react
- Line 82: Change `${analytics.averageSpendPerStay.toFixed(0)}` to `৳${analytics.averageSpendPerStay.toFixed(0)}`
- Line 197: Change `$${month.revenue.toLocaleString()}` to `৳${month.revenue.toLocaleString()}`
- Line 200: Change `$${month.revenue.toLocaleString()}` to `৳${month.revenue.toLocaleString()}`

### 2. Guest History Tab
**File:** `src/components/guests/GuestHistoryTab.tsx`

**Changes:**
- Line 2: Remove unused `DollarSign` import from lucide-react

### 3. References Page
**File:** `src/pages/References.tsx`

**Changes:**
- Line 2: Remove unused `DollarSign` import from lucide-react

### 4. Reports - Room Type Performance Chart
**File:** `src/components/reports/RoomTypePerformanceChart.tsx`

**Changes:**
- Line 45: Change `$${value.toLocaleString()}` to `৳${value.toLocaleString()}`
- Line 63: Change `$${value.toLocaleString()}` to `৳${value.toLocaleString()}`
- Line 88: Change `${rt.revenue.toLocaleString()}` to `৳${rt.revenue.toLocaleString()}`
- Line 89: Change `${rt.adr}` to `৳${rt.adr}`

### 5. Reports - Booking Source Chart
**File:** `src/components/reports/BookingSourceChart.tsx`

**Changes:**
- Line 97: Change `$${source.revenue.toLocaleString()}` to `৳${source.revenue.toLocaleString()}`
- Line 106: Change `$${totalRevenue.toLocaleString()}` to `৳${totalRevenue.toLocaleString()}`

### 6. POS - Transfer Items Dialog
**File:** `src/components/pos/TransferItemsDialog.tsx`

**Changes:**
- Line 146: Change `$${Number(item.total_price).toFixed(2)}` to `৳${Number(item.total_price).toFixed(2)}`
- Line 157: Change `$${selectedTotal.toFixed(2)}` to `৳${selectedTotal.toFixed(2)}`
- Line 196: Change `$${Number(order.total_amount).toFixed(2)}` to `৳${Number(order.total_amount).toFixed(2)}`
- Line 221: Change `$${Number(destinationOrder.total_amount).toFixed(2)}` to `৳${Number(destinationOrder.total_amount).toFixed(2)}`
- Line 227: Change `$${(Number(destinationOrder.total_amount) + selectedTotal).toFixed(2)}` to `৳${(Number(destinationOrder.total_amount) + selectedTotal).toFixed(2)}`

### 7. Folios - Add Charge Dialog
**File:** `src/components/folios/AddChargeDialog.tsx`

**Changes:**
- Line 118: Change `$${total.toFixed(2)}` to `৳${total.toFixed(2)}`

### 8. Folios - Record Payment Dialog
**File:** `src/components/folios/RecordPaymentDialog.tsx`

**Changes:**
- Line 70: Change `$${balance.toFixed(2)}` to `৳${balance.toFixed(2)}`
- Line 91: Change `Amount ($)` label to `Amount (৳)`
- Line 136: Change `Record $${parseFloat(amount || "0").toFixed(2)}` to `Record ৳${parseFloat(amount || "0").toFixed(2)}`

### 9. Night Audit Hook
**File:** `src/hooks/useNightAudit.tsx`

**Changes:**
- Line 779: Change `$${data.totalRevenue.toFixed(2)}` to `৳${data.totalRevenue.toFixed(2)}`

### 10. Landing Page - Hero Section
**File:** `src/components/landing/HeroSection.tsx`

**Changes:**
- Line 151: Change `$12.4K` to `৳12.4K` (demo/sample data display)

### 11. Property Card (Default Currency Fallback)
**File:** `src/components/properties/PropertyCard.tsx`

**Changes:**
- Line 184: Change fallback from `"USD"` to `"BDT"` for `{property.currency || "BDT"}`

---

## Summary Table

| File | Changes Count |
|------|---------------|
| `src/components/guests/GuestAnalyticsTab.tsx` | 4 |
| `src/components/guests/GuestHistoryTab.tsx` | 1 (import cleanup) |
| `src/pages/References.tsx` | 1 (import cleanup) |
| `src/components/reports/RoomTypePerformanceChart.tsx` | 4 |
| `src/components/reports/BookingSourceChart.tsx` | 2 |
| `src/components/pos/TransferItemsDialog.tsx` | 5 |
| `src/components/folios/AddChargeDialog.tsx` | 1 |
| `src/components/folios/RecordPaymentDialog.tsx` | 3 |
| `src/hooks/useNightAudit.tsx` | 1 |
| `src/components/landing/HeroSection.tsx` | 1 |
| `src/components/properties/PropertyCard.tsx` | 1 |

**Total: 11 files, ~24 changes**

---

## Technical Notes

### What Will NOT Change
- **Settings Currency List**: The `CURRENCIES` array in `src/components/settings/SystemDefaultsSettings.tsx` intentionally includes USD, EUR, and other currencies as selectable options - these should remain as they are for multi-currency support
- **Template Literal Syntax**: Uses of `${}` for JavaScript template literals are not currency symbols and will not be changed
- **Regex Patterns**: Uses of `$` in regular expressions are not currency symbols

### Currency Utility
The project already has a `formatCurrency` utility in `src/lib/currency.ts` that correctly uses the `৳` symbol. Some of the updated files could optionally be refactored to use this utility for consistency, but direct symbol replacement is the minimal change approach.

---

## Result After Implementation

All currency displays throughout the application will consistently show the Bangladeshi Taka symbol (৳) instead of the US Dollar symbol ($), completing the localization effort for the Bangladesh market.
