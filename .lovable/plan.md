

# Remove Send Mail Button from Corporate Statements

## Overview
Remove the "Send Mail" button and all related email functionality from the Corporate Statements page since the Resend email service requires a verified domain to send emails to external recipients.

## Changes Required

### File: `src/pages/CorporateStatements.tsx`

**1. Remove unused imports (lines 13-14)**
- Remove `Mail` icon import
- Remove `Loader2` icon import (only used for email loading state)

**2. Remove email-related state (line 65)**
- Remove `isSendingMail` state variable

**3. Remove the Supabase import (line 17)**
- Remove `supabase` import (only used for the email function call)

**4. Remove the `handleSendMail` function (lines 289-326)**
- Remove the entire email sending handler function

**5. Remove the Send Mail button (lines 516-528)**
- Remove the button from the action buttons section

---

## Technical Details

### Items to Remove

| Item | Location | Purpose |
|------|----------|---------|
| `Mail` import | Line 13 | Icon for button |
| `Loader2` import | Line 14 | Loading spinner |
| `supabase` import | Line 17 | API client for edge function |
| `isSendingMail` state | Line 65 | Loading state |
| `handleSendMail` function | Lines 289-326 | Email sending logic |
| Send Mail `<Button>` | Lines 516-528 | UI button |

### Edge Function Note
The edge function `supabase/functions/send-corporate-statement-email/index.ts` will remain in the codebase but won't be called. You can optionally delete it later if you don't plan to set up a verified domain for email sending.

