

# Implementation Plan: Guest ID Upload in New Reservation Form

## Overview
Add a dynamic ID document upload section to the New Reservation form that allows staff to upload identification documents (images/PDFs) for each guest. The number of required uploads adapts based on the total number of adults in the reservation.

## Architecture Decisions

### Storage Approach
- **Use Supabase Storage** with a new dedicated bucket `guest-documents` (private, not public - IDs contain sensitive PII)
- Store file URLs in a new `reservation_guest_ids` table linked to reservations

### Database Design
Create a new table to store guest ID documents linked to reservations:

```text
+------------------------+
| reservation_guest_ids  |
+------------------------+
| id (uuid, PK)          |
| tenant_id (uuid, FK)   |
| reservation_id (uuid)  |
| guest_number (integer) |  -- 1, 2, 3, etc.
| document_url (text)    |
| document_type (text)   |  -- "image" or "pdf"
| file_name (text)       |
| uploaded_by (uuid)     |
| created_at (timestamp) |
+------------------------+
```

---

## Implementation Steps

### Step 1: Database Migration

**Create storage bucket and table:**

1. Create `guest-documents` storage bucket (NOT public for privacy)
2. Create `reservation_guest_ids` table with proper structure
3. Add RLS policies for tenant isolation and role-based access
4. Create storage policies allowing authenticated uploads and authorized reads

**SQL Migration:**
```sql
-- Create storage bucket for guest documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('guest-documents', 'guest-documents', false);

-- Create table for reservation guest IDs
CREATE TABLE public.reservation_guest_ids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  guest_number integer NOT NULL DEFAULT 1,
  document_url text NOT NULL,
  document_type text NOT NULL DEFAULT 'image',
  file_name text,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.reservation_guest_ids ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authorized staff can manage reservation_guest_ids"
  ON public.reservation_guest_ids FOR ALL
  USING (
    tenant_id = current_tenant_id() AND (
      has_role(auth.uid(), 'owner') OR
      has_role(auth.uid(), 'manager') OR
      has_role(auth.uid(), 'front_desk')
    )
  );

CREATE POLICY "Superadmins full access to reservation_guest_ids"
  ON public.reservation_guest_ids FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view reservation_guest_ids"
  ON public.reservation_guest_ids FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Storage policies for guest-documents bucket
CREATE POLICY "Authenticated users can upload guest documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'guest-documents');

CREATE POLICY "Tenant users can view their guest documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'guest-documents');

CREATE POLICY "Authorized staff can delete guest documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'guest-documents');
```

---

### Step 2: Update NewReservationDialog.tsx

**Add ID upload UI section:**

1. Add state to track uploaded files per guest
2. Create dynamic upload slots based on `adults` count
3. Add file validation (image/PDF, max 5MB)
4. Show preview for images, file name for PDFs
5. Allow removal of uploaded files

**UI Design:**
```text
+------------------------------------------+
| Guest ID Documents                       |
| Upload ID for each adult guest           |
+------------------------------------------+
| Guest 1 ID *                             |
| [Upload Button] or [Image Preview + X]   |
+------------------------------------------+
| Guest 2 ID *                             |
| [Upload Button] or [Image Preview + X]   |
+------------------------------------------+
| (dynamically adds more based on adults)  |
+------------------------------------------+
```

**Key code additions:**
- Import `Upload`, `X`, `FileText` icons
- Add `guestIdFiles` state: `Map<number, { file: File; preview: string; type: string }>`
- Create `handleIdUpload(guestNumber, event)` function
- Create `removeIdFile(guestNumber)` function
- Render upload cards dynamically based on form's `adults` value

---

### Step 3: Update useCreateReservation.tsx

**Extend mutation to handle file uploads:**

1. Update `CreateReservationInput` interface to include optional `idFiles`
2. After creating reservation, upload each file to storage
3. Insert records into `reservation_guest_ids` table
4. Handle upload errors gracefully (don't fail entire reservation)

**Updated interface:**
```typescript
export interface CreateReservationInput {
  // ...existing fields...
  idFiles?: Map<number, { file: File; type: string; fileName: string }>;
}
```

**Upload logic in mutationFn:**
```typescript
// After reservation is created
if (input.idFiles && input.idFiles.size > 0) {
  for (const [guestNumber, fileData] of input.idFiles) {
    const filePath = `${tenantId}/${reservation.id}/guest-${guestNumber}-${Date.now()}`;
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('guest-documents')
      .upload(filePath, fileData.file);
    
    if (!uploadError) {
      // Get signed URL (private bucket)
      const { data: urlData } = supabase.storage
        .from('guest-documents')
        .getPublicUrl(filePath);
      
      // Insert record
      await supabase.from('reservation_guest_ids').insert({
        tenant_id: tenantId,
        reservation_id: reservation.id,
        guest_number: guestNumber,
        document_url: urlData.publicUrl,
        document_type: fileData.type,
        file_name: fileData.fileName,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      });
    }
  }
}
```

---

### Step 4: Form Reset and Cleanup

**Update form reset logic:**
- Clear `guestIdFiles` state when dialog closes
- Clear previews when form resets
- Revoke object URLs to prevent memory leaks

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| SQL Migration | New | Create bucket, table, RLS policies |
| `src/components/reservations/NewReservationDialog.tsx` | Modify | Add ID upload UI section |
| `src/hooks/useCreateReservation.tsx` | Modify | Handle file uploads after reservation creation |

---

## Technical Considerations

### Security
- Storage bucket is **private** (guest IDs are PII)
- RLS ensures only tenant staff can access documents
- Files are organized by tenant and reservation ID

### File Validation
- Allowed types: JPEG, PNG, WebP, PDF
- Max file size: 5MB per file
- Client-side validation before upload

### User Experience
- Dynamic upload slots based on adult count
- Image preview for uploaded images
- PDF icon for uploaded PDFs
- Easy removal with X button
- Clear labels: "Guest 1 ID", "Guest 2 ID", etc.
- Upload is optional but visible

### Edge Cases
- Changing adult count after uploads: Keep existing uploads, add/remove slots
- Form submission without all IDs: Allow (optional uploads)
- Large files: Reject with toast message
- Upload failure: Log error, continue with reservation creation

