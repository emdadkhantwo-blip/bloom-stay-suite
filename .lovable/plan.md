

## Fix: Check-in Time Not Changing on Settings Page

### Problem

When a user tries to change the check-in time on the Settings page (e.g., from "14:00" to "14:03"), the input field immediately reverts back to the original value ("14:00"). The user cannot modify the time field.

### Root Cause

In `SystemDefaultsSettings.tsx`, there is a `useEffect` on lines 66-75 that resets all local state values whenever the `settings` object changes:

```typescript
useEffect(() => {
  setCheckInTime(settings.defaults?.check_in_time || '14:00');
  setCheckOutTime(settings.defaults?.check_out_time || '11:00');
  // ... other setters
}, [settings]);
```

**The Problem Flow:**

1. User types "14:03" in the check-in time input
2. `setCheckInTime("14:03")` updates the local state
3. React re-renders the component
4. The `settings` object reference from `useSettings()` may change on re-render
5. The `useEffect` runs again because `settings` is in its dependency array
6. `setCheckInTime(settings.defaults?.check_in_time || '14:00')` resets the value back to "14:00"

This creates a race condition where user input is immediately overwritten by the effect.

### Solution

Add a flag to track whether the initial data has been loaded, and only sync from `settings` once during initial load. After that, local state should be the source of truth until the user saves.

---

### Implementation Details

**File: `src/components/settings/SystemDefaultsSettings.tsx`**

1. Add a `hasInitialized` ref to track if initial values have been loaded
2. Modify the `useEffect` to only run once when settings are first available
3. Prevent the effect from continuously resetting values during user interaction

```typescript
import { useState, useEffect, useRef } from 'react';

export default function SystemDefaultsSettings() {
  const { settings, updateDefaultSettings, isUpdating } = useSettings();
  const hasInitialized = useRef(false);
  
  // System defaults - initialize with empty strings, will be set by useEffect
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  // ... other state

  // Only sync from settings on initial load
  useEffect(() => {
    // Only initialize once when settings are first loaded
    if (!hasInitialized.current && settings.defaults) {
      setCheckInTime(settings.defaults.check_in_time || '14:00');
      setCheckOutTime(settings.defaults.check_out_time || '11:00');
      setDefaultCurrency(settings.defaults.default_currency || 'BDT');
      setDefaultTimezone(settings.defaults.default_timezone || 'Asia/Dhaka');
      setDateFormat(settings.defaults.date_format || 'DD/MM/YYYY');
      setTimeFormat(settings.defaults.time_format || '12h');
      setCancellationHours(settings.defaults.cancellation_policy_hours?.toString() || '24');
      setNoShowCharge(settings.defaults.no_show_charge_percent?.toString() || '100');
      hasInitialized.current = true;
    }
  }, [settings.defaults]);

  // Reset initialization flag when component unmounts and remounts
  // This ensures fresh data is loaded if navigating away and back
  // (handled automatically by useRef reset on unmount)
  
  // ... rest of component
}
```

---

### Why This Fix Works

| Before | After |
|--------|-------|
| `useEffect` runs on every `settings` change | `useEffect` only runs once during initial load |
| User input is overwritten immediately | User input is preserved until save |
| Values reset to database values on re-render | Local state is the source of truth during editing |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/settings/SystemDefaultsSettings.tsx` | Add `useRef` for initialization tracking, modify `useEffect` to only sync once |

---

### Expected Result

After the fix:
- User can change check-in time from "14:00" to any other time (e.g., "14:03")
- The input field retains the new value until the user clicks "Save Changes"
- After saving, the new value persists in the database
- Navigating away and back loads the saved values correctly

