
# Add Browser Biometric Fingerprint System to HR Attendance

## Overview
Implement a fingerprint-based clock in/out system using the browser's Web Authentication API (WebAuthn). This allows staff to use their device's built-in fingerprint sensor (on phones, laptops, or tablets with biometric readers) to authenticate their attendance actions.

---

## How It Works

1. **One-time Setup**: Each staff member registers their fingerprint/biometric on their device
2. **Daily Use**: Staff tap "Clock In with Fingerprint" and verify using their device's fingerprint sensor
3. **Secure**: The fingerprint data never leaves the device - only a cryptographic signature is verified

---

## Solution Architecture

```text
+-------------------+       +-------------------+       +-------------------+
|   Staff Device    |       |   Frontend App    |       |   Database        |
|   (Fingerprint)   |       |   (WebAuthn API)  |       |   (Supabase)      |
+-------------------+       +-------------------+       +-------------------+
        |                           |                           |
        |  1. Touch Sensor          |                           |
        |-------------------------->|                           |
        |                           |  2. Create Credential     |
        |                           |  (Registration)           |
        |                           |-------------------------->|
        |                           |                           |
        |  3. Verify on Clock-In    |                           |
        |-------------------------->|                           |
        |                           |  4. Record Attendance     |
        |                           |-------------------------->|
        +---------------------------+---------------------------+
```

---

## Database Changes

### New Table: `biometric_credentials`

Stores the WebAuthn credential information for each staff member.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tenant_id | uuid | Tenant reference |
| profile_id | uuid | Staff member reference |
| credential_id | text | WebAuthn credential ID (base64 encoded) |
| public_key | text | Public key for verification (base64 encoded) |
| device_name | text | Friendly name (e.g., "iPhone 15", "MacBook Pro") |
| created_at | timestamp | Registration date |

**RLS Policies:**
- Users can view their own credentials
- Users can create credentials for themselves
- Users can delete their own credentials
- Owners/managers can view all tenant credentials

---

## Implementation Plan

### Phase 1: Database Migration

Create the `biometric_credentials` table with proper RLS policies:

```sql
CREATE TABLE public.biometric_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, credential_id)
);

ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own credentials"
  ON public.biometric_credentials FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY "Owners/managers can view all tenant credentials"
  ON public.biometric_credentials FOR SELECT
  USING (tenant_id = current_tenant_id() AND 
         (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager')));
```

---

### Phase 2: Create Biometric Hook

**File: `src/hooks/useBiometricAuth.tsx`**

Features:
- Check if WebAuthn is supported on the device
- Register a new biometric credential
- Authenticate using stored credential
- Manage credential list (view/delete)

```typescript
interface BiometricCredential {
  id: string;
  credential_id: string;
  device_name: string;
  created_at: string;
}

interface UseBiometricAuthReturn {
  isSupported: boolean;
  isRegistered: boolean;
  credentials: BiometricCredential[];
  registerBiometric: (deviceName?: string) => Promise<void>;
  authenticateBiometric: () => Promise<boolean>;
  removeCredential: (credentialId: string) => Promise<void>;
  isLoading: boolean;
}
```

Key Implementation Details:

1. **Check Browser Support**
```typescript
const isSupported = typeof window !== 'undefined' && 
  window.PublicKeyCredential !== undefined &&
  typeof navigator.credentials !== 'undefined';
```

2. **Registration Flow**
- Generate a random challenge on the client
- Create credential using `navigator.credentials.create()`
- Store credential ID and public key in database

3. **Authentication Flow**
- Retrieve stored credential IDs from database
- Challenge user with `navigator.credentials.get()`
- On success, proceed with clock in/out

---

### Phase 3: Create Fingerprint UI Components

**File: `src/components/hr/BiometricClockWidget.tsx`**

A dedicated widget that replaces or augments the current clock in/out buttons with fingerprint options.

UI Layout:
```text
+-------------------------------------------------------+
|  Your Attendance                              10:45:32|
|  Tuesday, January 28, 2026                            |
+-------------------------------------------------------+
|                                                       |
|  +-------------------+    +-------------------+       |
|  |                   |    |                   |       |
|  |    [Fingerprint]  |    |  [Manual Clock]   |       |
|  |    Clock In       |    |  Clock In         |       |
|  |                   |    |                   |       |
|  +-------------------+    +-------------------+       |
|                                                       |
|  [Register Your Fingerprint]  (if not registered)    |
+-------------------------------------------------------+
```

**File: `src/components/hr/FingerprintSetupDialog.tsx`**

Dialog for registering biometric credentials:
- Shows device compatibility status
- Allows naming the device
- Guides user through fingerprint registration
- Shows success/error states

**File: `src/components/hr/BiometricCredentialsList.tsx`**

Shows list of registered devices with option to remove:
- Device name
- Registration date
- Delete button

---

### Phase 4: Update Attendance Page

**Modify: `src/pages/hr/Attendance.tsx`**

Changes:
1. Import biometric components and hook
2. Add "Fingerprint Settings" section in the clock widget
3. Integrate fingerprint clock in/out as primary option (with manual fallback)
4. Show registration prompt for unregistered users

Updated Clock Widget Layout:
```text
+-------------------------------------------------------+
|  Clock Widget                                         |
|-------------------------------------------------------|
|  Current Time: 10:45:32                               |
|  Tuesday, January 28, 2026                            |
|-------------------------------------------------------|
|                                                       |
|  [If Fingerprint Registered:]                         |
|    +------------------------+  +------------------+   |
|    | [Fingerprint Icon]     |  | Clock In         |   |
|    | Tap to Clock In        |  | (Manual)         |   |
|    +------------------------+  +------------------+   |
|                                                       |
|  [If Not Registered:]                                 |
|    +--------------------------------------------------+
|    | Enable fingerprint for faster clock in          |
|    | [Setup Fingerprint]                             |
|    +--------------------------------------------------+
|                                                       |
|  Status: Clocked In at 09:15                          |
+-------------------------------------------------------+
```

---

### Phase 5: Integrate with useAttendance Hook

**Modify: `src/hooks/useAttendance.tsx`**

Add biometric-aware clock functions:
- `clockInWithBiometric`: Combines biometric auth + clock in
- `clockOutWithBiometric`: Combines biometric auth + clock out

Flow:
```typescript
const clockInWithBiometric = async () => {
  // 1. Authenticate using fingerprint
  const authenticated = await authenticateBiometric();
  if (!authenticated) {
    toast({ title: "Authentication Failed", variant: "destructive" });
    return;
  }
  
  // 2. Proceed with normal clock in
  clockIn(user.id);
};
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useBiometricAuth.tsx` | WebAuthn API integration and credential management |
| `src/components/hr/BiometricClockWidget.tsx` | Fingerprint clock in/out UI |
| `src/components/hr/FingerprintSetupDialog.tsx` | Registration dialog |
| `src/components/hr/BiometricCredentialsList.tsx` | Manage registered devices |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/hr/Attendance.tsx` | Add fingerprint options to clock widget |

---

## User Experience Flow

### First-Time Setup
1. Staff opens Attendance page
2. Sees "Enable Fingerprint Clock-In" prompt
3. Clicks "Setup Fingerprint"
4. Dialog opens with instructions
5. Staff touches their device's fingerprint sensor
6. Success message shows - fingerprint registered

### Daily Clock In
1. Staff opens Attendance page
2. Clicks "Clock In with Fingerprint" button
3. Device prompts for fingerprint
4. Staff touches sensor
5. Clock in recorded - success toast shown

### Fallback Option
- Manual "Clock In" button always available
- Works even if fingerprint fails or device doesn't support it

---

## Browser Compatibility Note

WebAuthn is supported in:
- Chrome 67+
- Firefox 60+
- Safari 13+
- Edge 18+
- Mobile browsers on iOS 14.5+ and Android 7+

For unsupported browsers, the fingerprint option will be hidden and users will use the existing manual clock in/out buttons.

---

## Security Considerations

1. **No Fingerprint Data Stored**: Only cryptographic public keys are stored in the database
2. **Device-Bound**: Credentials are tied to the specific device
3. **Challenge-Response**: Each authentication uses a fresh challenge
4. **RLS Protected**: Credentials table secured with row-level security
5. **Tenant Isolation**: Credentials scoped to tenant
