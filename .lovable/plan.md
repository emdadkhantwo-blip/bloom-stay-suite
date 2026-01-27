

# Fix Multi-Tenant Data Isolation for Room and Room Type Creation

## Problem Summary

Different hotels (tenants) are unable to create rooms with the same room numbers or room types with the same codes. This is happening due to a **cross-tenant data integrity issue** where rooms and room types are being created with mismatched `tenant_id` and `property_id` values.

**Evidence from database:**
- Room 315 in "Grand Pacific Downtown" property has `tenant_id` from "Formzed" instead of "Grand Pacific Hotels"
- Room types "Single Bed" (code: 001) and "Delux Premium" (code: 002) have the same mismatch

This causes:
1. Data appearing in the wrong tenant's view
2. Unique constraint violations when other tenants try to create similar rooms/room types

---

## Root Cause Analysis

### Issue 1: Client-Provided IDs Without Server Validation

The `admin-chat` edge function accepts `tenantId` and `propertyId` directly from the client request without validating them:

```typescript
// supabase/functions/admin-chat/index.ts (line 3228)
const { messages, tenantId, propertyId } = await req.json();
```

The edge function uses the **SERVICE_ROLE_KEY**, which bypasses RLS entirely. It trusts these client-provided values and uses them directly for creating records.

### Issue 2: No Property-Tenant Validation

When creating rooms or room types, the edge function does not verify that the provided `propertyId` actually belongs to the `tenantId`:

```typescript
// Line 2075-2078 - Room creation
.insert({
  tenant_id: tenantId,          // From client request
  property_id: propertyId,      // From client request - NOT validated
  ...
})
```

### Issue 3: Client-Side Hook Takes First Property

The `useAdminChat` hook always uses the first property from the user's properties array:

```typescript
// src/hooks/useAdminChat.tsx (line 144)
const propertyId = properties?.[0]?.id || '';
```

This is a minor issue but could cause unexpected behavior if a user switches properties.

---

## Solution Overview

### Part 1: Server-Side Validation in Edge Function

Add validation to ensure `propertyId` belongs to `tenantId` before any operations:

```typescript
// Validate that property belongs to tenant
const { data: property, error: propError } = await supabase
  .from('properties')
  .select('id, tenant_id')
  .eq('id', propertyId)
  .single();

if (propError || !property) {
  throw new Error('Property not found');
}

if (property.tenant_id !== tenantId) {
  throw new Error('Property does not belong to this tenant');
}
```

### Part 2: Derive tenant_id from Property

Instead of trusting the client's `tenantId`, derive it from the validated property:

```typescript
// Use property's tenant_id, not the client-provided one
const validatedTenantId = property.tenant_id;
```

### Part 3: Add Database Constraint

Add a CHECK constraint or trigger to prevent mismatched `tenant_id` and `property_id`:

```sql
-- Validation trigger for rooms table
CREATE OR REPLACE FUNCTION validate_room_tenant_property()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id != (SELECT tenant_id FROM properties WHERE id = NEW.property_id) THEN
    RAISE EXCEPTION 'Room tenant_id must match property tenant_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_room_tenant_property
BEFORE INSERT OR UPDATE ON rooms
FOR EACH ROW EXECUTE FUNCTION validate_room_tenant_property();
```

### Part 4: Clean Up Existing Corrupted Data

Fix the existing mismatched records by updating their `tenant_id` to match their property's tenant:

```sql
-- Fix rooms with mismatched tenant_id
UPDATE rooms r
SET tenant_id = p.tenant_id
FROM properties p
WHERE r.property_id = p.id
  AND r.tenant_id != p.tenant_id;

-- Fix room_types with mismatched tenant_id
UPDATE room_types rt
SET tenant_id = p.tenant_id
FROM properties p
WHERE rt.property_id = p.id
  AND rt.tenant_id != p.tenant_id;
```

### Part 5: Client-Side Property Selection

Update the `useAdminChat` hook to use the current selected property instead of always the first one:

```typescript
// Use currentProperty from useTenant() instead of properties[0]
const { tenant, currentProperty } = useTenant();
const propertyId = currentProperty?.id || '';
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/admin-chat/index.ts` | Add validation to ensure propertyId belongs to tenantId; derive tenant_id from property |
| `src/hooks/useAdminChat.tsx` | Use `currentProperty` instead of `properties[0]` |

## Database Migration

A migration will be created to:
1. Fix existing corrupted data (rooms and room_types with mismatched tenant_id)
2. Add validation triggers for rooms and room_types tables
3. Optionally add similar triggers for other property-scoped tables

---

## Technical Implementation

### Edge Function Changes

**File: `supabase/functions/admin-chat/index.ts`**

1. After extracting request data (around line 3228), add property validation:

```typescript
const { messages, tenantId, propertyId } = await req.json();

// Validate property exists and belongs to tenant
if (propertyId) {
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, tenant_id')
    .eq('id', propertyId)
    .single();
  
  if (propError || !property) {
    throw new Error('Invalid property ID');
  }
  
  if (property.tenant_id !== tenantId) {
    console.error(`Security: Attempted cross-tenant access. Claimed tenant: ${tenantId}, Property's tenant: ${property.tenant_id}`);
    throw new Error('Property does not belong to specified tenant');
  }
}
```

2. Alternatively, derive `tenantId` from the authenticated user's profile instead of trusting the client:

```typescript
// Get authenticated user's tenant
const { data: profile } = await supabase
  .from('profiles')
  .select('tenant_id')
  .eq('id', userId)
  .single();

const validatedTenantId = profile?.tenant_id;
if (!validatedTenantId) {
  throw new Error('User does not belong to a tenant');
}
```

### Client Hook Changes

**File: `src/hooks/useAdminChat.tsx`**

Update to use `currentProperty`:

```typescript
const { tenant, currentProperty } = useTenant();

// ... in sendMessage function:
const propertyId = currentProperty?.id || '';
```

---

## Security Improvements Summary

1. **Server-side validation**: Never trust client-provided tenant/property IDs without verification
2. **Database constraints**: Triggers prevent data corruption at the database level
3. **Data cleanup**: Fix existing corrupted records to restore proper isolation
4. **Consistent property selection**: Use the current selected property, not arbitrary first property

---

## Expected Outcome

After implementation:
- Hotel A can create room "101" with room type code "STD"
- Hotel B can also create room "101" with room type code "STD"
- Each hotel only sees their own rooms and room types
- The unique constraints work correctly (scoped to property_id)
- No cross-tenant data leakage or corruption

