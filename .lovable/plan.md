

## Problem Analysis

The login is failing with "User not found" because of an email mismatch between the `profiles` table and `auth.users` table:

| Table | Email Value |
|-------|-------------|
| `auth.users` | `arshadcto@formzed.hotel.local` (internal auth email) |
| `profiles` | `shaikarshadrahman02@gmail.com` (public email from application) |

### Current Login Flow (Broken)
1. User enters username `arshadcto`
2. `signIn()` function queries `profiles` table to find email
3. It finds `shaikarshadrahman02@gmail.com` 
4. Tries to authenticate with Supabase using this email
5. **Fails** because Supabase expects `arshadcto@formzed.hotel.local`

### Solution
We need to store the **internal auth email** (used for Supabase authentication) in the profiles table, rather than the public email. The public email can be stored in a separate field if needed for display/contact purposes.

---

## Implementation Plan

### Step 1: Modify the Profile Table Structure
Add a new column `auth_email` to store the internal authentication email separately from the contact email.

```sql
ALTER TABLE profiles ADD COLUMN auth_email TEXT;
```

### Step 2: Update the `approve-application` Edge Function
Modify the profile upsert to store both emails:
- `auth_email`: The internal email used for Supabase auth (e.g., `username@hotel-slug.hotel.local`)
- `email`: The public contact email from the application (e.g., `user@gmail.com`)

### Step 3: Update the `useAuth.tsx` Login Logic
Modify the `signIn` function to:
1. Look up the profile by username
2. Use `auth_email` (if available) or fallback to `email` for authentication
3. This ensures backward compatibility with existing users

---

## Technical Details

### Database Migration
```sql
-- Add auth_email column for internal authentication email
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_email TEXT;

-- Update existing staff profiles to use the email as auth_email where applicable
UPDATE profiles 
SET auth_email = email 
WHERE auth_email IS NULL 
  AND email LIKE '%@%.hotel.local';
```

### Edge Function Changes (`supabase/functions/approve-application/index.ts`)
```typescript
// Update the profile with correct tenant and both emails
const { error: profileError } = await adminClient
  .from("profiles")
  .upsert({
    id: newUserId,
    username: application.username,
    email: application.email,           // Public email for contact
    auth_email: internalEmail,           // NEW: Auth email for login
    full_name: application.full_name,
    phone: application.phone,
    tenant_id: tenant.id,
    is_active: true,
    must_change_password: false,
  }, { onConflict: "id" });
```

### useAuth.tsx Changes
```typescript
const signIn = async (username: string, password: string) => {
  let loginEmail = username;

  // If not already an email, look up the actual auth email from profiles table
  if (!username.includes('@')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, auth_email')  // Select both emails
      .eq('username', username)
      .maybeSingle();

    if (!profile) {
      return { error: new Error('User not found') };
    }

    // Use auth_email if available, otherwise fallback to email
    loginEmail = profile.auth_email || profile.email;
    
    if (!loginEmail) {
      return { error: new Error('User not found') };
    }
  }

  // Continue with authentication...
};
```

---

## Files to Modify

1. **Database Migration** - Add `auth_email` column to profiles table
2. **`supabase/functions/approve-application/index.ts`** - Store internal auth email in `auth_email` field
3. **`src/hooks/useAuth.tsx`** - Use `auth_email` for authentication lookup
4. **`src/integrations/supabase/types.ts`** - Will auto-update after migration

---

## Testing Plan

1. Apply the database migration
2. Update existing approved user (`arshadcto`) to have correct `auth_email`
3. Deploy updated edge function
4. Test login with username `arshadcto` and password `965874213`

