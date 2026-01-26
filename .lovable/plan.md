

## Problem Identified

The admin cannot login with username because of a **Row-Level Security (RLS) policy issue**.

### What's Happening
1. When the admin enters their username on the login page
2. The app tries to look up the username in the `profiles` table to find the email for authentication
3. But the user is **not logged in yet**, so they have no authentication session
4. The RLS policies on `profiles` require authentication - no policy allows anonymous/public access
5. The query returns empty, causing "User not found" error

### Current RLS Policies on `profiles` Table
| Policy | Requirement |
|--------|-------------|
| Users can view own profile | Must be logged in (`id = auth.uid()`) |
| Owners can view tenant profiles | Must be logged in with owner role |
| Superadmins can manage all profiles | Must be logged in with superadmin role |

**None of these allow an unauthenticated user to look up a profile by username!**

---

## Solution

We need to add a minimal RLS policy that allows **public read access to only the username and auth_email fields** needed for login lookup. Alternatively, we can create a database function with `SECURITY DEFINER` that bypasses RLS.

### Recommended Approach: Security Definer Function

Create a database function that can look up the auth email by username without requiring authentication:

```sql
CREATE OR REPLACE FUNCTION public.get_auth_email_by_username(lookup_username TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth_email, email)
  FROM public.profiles
  WHERE username = lookup_username
    AND is_active = true
  LIMIT 1
$$;
```

This function:
- Uses `SECURITY DEFINER` to bypass RLS
- Only returns the email needed for authentication (no other sensitive data)
- Only returns data for active users
- Can be called via Supabase RPC without authentication

### Code Changes

Update `useAuth.tsx` to use this function instead of a direct table query:

```typescript
const signIn = async (username: string, password: string) => {
  let loginEmail = username;

  if (!username.includes('@')) {
    // Use RPC function that bypasses RLS
    const { data: authEmail, error } = await supabase
      .rpc('get_auth_email_by_username', { lookup_username: username });

    if (error || !authEmail) {
      return { error: new Error('User not found') };
    }

    loginEmail = authEmail;
  }

  // Continue with authentication...
};
```

---

## Files to Modify

1. **Database Migration** - Create the `get_auth_email_by_username` function
2. **`src/hooks/useAuth.tsx`** - Use RPC call instead of direct table query

---

## Why This Is Secure

1. The function only returns the email needed for authentication - no other user data
2. Only works for active users
3. Does not expose any sensitive information (username is already known by the person logging in)
4. This is a common pattern for login lookups in multi-tenant systems

