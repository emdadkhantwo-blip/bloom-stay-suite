
# Implement Guest Linking for Corporate Accounts

## Overview

Currently, the Corporate Accounts section displays a "Linked Guests" tab that shows which guests are associated with a corporate account. However, there is no functional way to link or unlink guests. The UI message says "Link guests from the Guests page" but that feature does not exist.

This plan will implement full guest linking functionality in two places:
1. **Corporate Account Detail Drawer** - Add a dialog to search and link guests directly
2. **Edit Guest Dialog** - Add a corporate account selector to link/unlink guests

---

## Changes

### 1. Create Link Guest Dialog Component

**New File:** `src/components/corporate/LinkGuestDialog.tsx`

A new dialog that allows searching and selecting guests to link to a corporate account:
- Search input to filter guests by name, email, or phone
- List of available guests (excluding already linked ones)
- Select multiple guests at once
- Link button to associate selected guests

### 2. Update Corporate Account Detail Drawer

**File:** `src/components/corporate/CorporateAccountDetailDrawer.tsx`

Add functionality to the Guests tab:
- Add "Link Guest" button in the Guests tab header
- Add "Unlink" button on each linked guest card
- Wire up the new LinkGuestDialog component
- Update currency symbol from `$` to `৳` on line 268

### 3. Update Edit Guest Dialog

**File:** `src/components/guests/EditGuestDialog.tsx`

Add a corporate account selector:
- Add corporate account dropdown field
- Allow selecting or clearing the corporate account link
- Include the `corporate_account_id` in the update mutation

### 4. Update useGuests Hook

**File:** `src/hooks/useGuests.tsx`

Update the `GuestUpdate` type to include `corporate_account_id`:
- Add `corporate_account_id?: string | null` to the type definition
- Ensure the update mutation passes this field correctly

---

## Technical Details

### Link Guest Dialog Flow

```text
User clicks "Link Guest" button
    -> Opens LinkGuestDialog
    -> User searches for guests
    -> User selects one or more guests
    -> User clicks "Link"
    -> useLinkGuestToCorporateAccount mutation called for each guest
    -> Dialog closes, list refreshes
```

### Unlink Guest Flow

```text
User clicks "Unlink" on a guest card
    -> Confirmation prompt
    -> useLinkGuestToCorporateAccount mutation called with accountId = null
    -> List refreshes
```

### Edit Guest Dialog Flow

```text
User opens Edit Guest dialog
    -> Corporate Account dropdown shows all active accounts
    -> User selects or clears account
    -> On save, corporate_account_id is included in update
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/corporate/LinkGuestDialog.tsx` | Dialog for searching and linking guests |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/corporate/CorporateAccountDetailDrawer.tsx` | Add Link/Unlink functionality, fix currency |
| `src/components/guests/EditGuestDialog.tsx` | Add corporate account selector |
| `src/hooks/useGuests.tsx` | Update GuestUpdate type |

---

## UI Preview

### Corporate Account Detail - Guests Tab

The Guests tab will show:
- Header with "Linked Guests" title and "Link Guest" button
- List of linked guests with name, contact, stays, and an "Unlink" button
- Empty state when no guests are linked

### Edit Guest Dialog

A new section will appear:
- "Corporate Account" dropdown
- Options: "None" + list of active corporate accounts
- Shows company name and account code

---

## Result

After implementation:
1. Users can link guests to corporate accounts from the Corporate Accounts page
2. Users can unlink guests from corporate accounts
3. Users can assign/change corporate accounts when editing a guest
4. All linked guest counts will update automatically
