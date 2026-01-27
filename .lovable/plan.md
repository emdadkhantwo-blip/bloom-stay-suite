
# Convert All Currency Symbols from "$" to "৳" (BDT)

## Overview
The system is transitioning to Bangladeshi Taka (BDT) as the primary currency. While most components already use `৳`, several files still contain hardcoded `$` signs or use the `DollarSign` icon inappropriately for currency representation.

---

## Files Requiring Changes

### 1. `src/components/guests/GuestStatsBar.tsx`

**Issue**: Uses `$` symbol and `DollarSign` icon for Total Revenue

| Line | Current Code | Fixed Code |
|------|--------------|------------|
| 1 | `import { Users, Star, Ban, DollarSign }` | `import { Users, Star, Ban, Wallet }` |
| 45 | `value: \`$\${totalRevenue.toLocaleString()}\`` | `value: \`৳\${totalRevenue.toLocaleString()}\`` |
| 46 | `icon: DollarSign` | `icon: Wallet` |

**Rationale**: Replace `DollarSign` with `Wallet` icon since there's no Taka-specific icon in lucide-react.

---

### 2. `src/components/reservations/NewReservationDialog.tsx`

**Issue**: Uses `DollarSign` icon for fixed-amount discounts

| Line | Current Code | Fixed Code |
|------|--------------|------------|
| 6 | `import { ..., DollarSign, ... }` | Remove `DollarSign` from imports |
| 643-645 | `<DollarSign className="h-3 w-3" />` | `<span className="h-3 w-3 text-xs font-bold">৳</span>` |

**Rationale**: Replace the DollarSign icon with the actual ৳ symbol as text for discount indication.

---

### 3. `src/components/reports/MetricsCards.tsx`

**Issue**: Uses `DollarSign` icon for ADR and Total Revenue

| Line | Current Code | Fixed Code |
|------|--------------|------------|
| 1 | `import { TrendingUp, DollarSign, Bed, Calendar }` | `import { TrendingUp, Wallet, Bed, Calendar }` |
| 35 | `icon: DollarSign` | `icon: Wallet` |
| 51 | `icon: DollarSign` | `icon: Wallet` |

**Note**: The currency values already use `৳` (lines 33, 40, 49, 50), only the icons need updating.

---

### 4. `src/components/settings/SystemDefaultsSettings.tsx`

**Issue**: Uses `DollarSign` icon for currency section

| Line | Current Code | Fixed Code |
|------|--------------|------------|
| 8 | `import { Clock, DollarSign, Globe, Calendar, Save, Loader2, AlertTriangle }` | `import { Clock, Wallet, Globe, Calendar, Save, Loader2, AlertTriangle }` |

Then find where `DollarSign` is used in the template and replace with `Wallet`.

**Note**: The CURRENCIES array (lines 10-22) correctly lists multiple currencies with their symbols - this is intentional for a settings page and should NOT be changed since it allows users to select different currencies if needed.

---

### 5. `src/components/properties/CreatePropertyDialog.tsx`

**Issue**: Default currency is `"USD"` instead of `"BDT"`

| Line | Current Code | Fixed Code |
|------|--------------|------------|
| 45 | `currency: z.string().default("USD")` | `currency: z.string().default("BDT")` |
| 71 | `const CURRENCIES = ["USD", "EUR", ...]` | `const CURRENCIES = ["BDT", "USD", "EUR", ...]` |

**Rationale**: BDT should be the default and appear first in the list.

---

### 6. `src/components/properties/PropertyDetailDrawer.tsx`

**Issue**: Default state for currency is `"USD"`

| Line | Current Code | Fixed Code |
|------|--------------|------------|
| 80 | `const [currency, setCurrency] = useState("USD")` | `const [currency, setCurrency] = useState("BDT")` |

---

### 7. `src/hooks/useProperties.tsx`

**Issue**: Default fallback currency is `"USD"`

| Line | Current Code | Fixed Code |
|------|--------------|------------|
| 45 | `currency: input.currency \|\| "USD"` | `currency: input.currency \|\| "BDT"` |

---

## Summary of Changes

| File | Icon Changes | Symbol Changes | Default Changes |
|------|--------------|----------------|-----------------|
| GuestStatsBar.tsx | DollarSign → Wallet | $ → ৳ | - |
| NewReservationDialog.tsx | DollarSign → ৳ text | - | - |
| MetricsCards.tsx | DollarSign → Wallet | - | - |
| SystemDefaultsSettings.tsx | DollarSign → Wallet | - | - |
| CreatePropertyDialog.tsx | - | - | USD → BDT |
| PropertyDetailDrawer.tsx | - | - | USD → BDT |
| useProperties.tsx | - | - | USD → BDT |

---

## Technical Notes

1. **Why Wallet instead of DollarSign?**: Lucide-react doesn't have a Taka-specific icon. `Wallet` is currency-agnostic and commonly used for financial displays.

2. **Settings Page Currency List**: The multi-currency list in SystemDefaultsSettings.tsx is intentionally kept as-is since it's a selection feature, not a display feature.

3. **Database Default**: The database migration has `DEFAULT 'USD'` for the currency column. This is a historical default and would require a new migration to change. However, since all new properties will use the application's default (BDT), this doesn't need immediate attention.

4. **Consistency**: After these changes, all user-facing currency displays will show `৳` and all new records will default to BDT.
