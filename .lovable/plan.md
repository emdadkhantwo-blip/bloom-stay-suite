

# Add NID Number, Documents, and Banking Fields to Create Staff

## Overview
Enhance the Create Staff dialog to include NID Number, document uploads, and banking information fields. Most of the database structure already exists - only a new column for NID is needed.

---

## Current State Analysis

### Already Available in Database:
| Field | Table/Column | Status |
|-------|--------------|--------|
| Bank Account Number | `hr_staff_profiles.bank_account` | ✅ Exists |
| Bank Account Name | `hr_staff_profiles.bank_name` | ✅ Exists |
| Documents | `hr_documents` table + `hr-documents` bucket | ✅ Exists |

### Missing in Database:
| Field | Required Action |
|-------|-----------------|
| NID Number | Add `nid_number` column to `hr_staff_profiles` |

---

## Phase 1: Database Migration

Add a new column to `hr_staff_profiles` table:

```sql
ALTER TABLE hr_staff_profiles 
ADD COLUMN nid_number TEXT;
```

---

## Phase 2: Update Create Staff Dialog

**File: `src/components/staff/CreateStaffDialog.tsx`**

### Add New Form Fields

1. **Identity Documents Section** (new section)
   - NID Number input field
   - Documents upload area (multiple file upload)

2. **Banking Information Section** (new section)  
   - Bank Account Number input
   - Bank Account Name input

### Form Layout Addition:
```text
┌─────────────────────────────────────────────┐
│ Identity Documents                           │
├─────────────────────────────────────────────┤
│ NID Number: _________________________       │
│                                             │
│ Documents: [+ Upload Documents]             │
│ ┌─────────────────────────────────────────┐ │
│ │ • NID_Front.jpg              [Remove]   │ │
│ │ • NID_Back.jpg               [Remove]   │ │
│ │ • Contract.pdf               [Remove]   │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Banking Information                          │
├─────────────────────────────────────────────┤
│ Bank Account Number: ___________________    │
│ Bank Account Name: _____________________    │
└─────────────────────────────────────────────┘
```

### New State Variables:
```typescript
const [nidNumber, setNidNumber] = useState<string>("");
const [bankAccountNumber, setBankAccountNumber] = useState<string>("");
const [bankAccountName, setBankAccountName] = useState<string>("");
const [documentFiles, setDocumentFiles] = useState<File[]>([]);
```

---

## Phase 3: Update Edge Function

**File: `supabase/functions/create-staff/index.ts`**

### Extend Request Interface:
```typescript
interface CreateStaffRequest {
  // ... existing fields
  nidNumber?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}
```

### Update HR Profile Insert:
Add the new fields to the `hr_staff_profiles` insert:
```typescript
{
  // ... existing fields
  nid_number: nidNumber || null,
  bank_account: bankAccountNumber || null,
  bank_name: bankAccountName || null,
}
```

---

## Phase 4: Document Upload Logic

Documents will be uploaded to the `hr-documents` storage bucket after staff creation.

### Upload Process:
1. Staff creation via edge function (returns new user ID)
2. Upload each document file to storage: `hr-documents/{profile_id}/{filename}`
3. Create `hr_documents` record for each uploaded file

### Document Types:
- NID/Passport
- Employment Contract
- Certificates
- Other

---

## Implementation Details

### Files to Modify:

| File | Changes |
|------|---------|
| `src/components/staff/CreateStaffDialog.tsx` | Add NID, banking, and documents fields |
| `supabase/functions/create-staff/index.ts` | Handle new fields in request |

### Database Migration:

| Table | Column | Type | Details |
|-------|--------|------|---------|
| `hr_staff_profiles` | `nid_number` | TEXT | Nullable, stores NID |

---

## Form Validation

### NID Number:
- Optional field
- Max 20 characters
- Alphanumeric only

### Bank Account:
- Optional fields
- Account Number: Max 30 characters
- Account Name: Max 100 characters

### Documents:
- Optional
- Allowed types: PDF, JPG, PNG, WEBP
- Max 5MB per file
- Max 10 files per staff creation

---

## Security Considerations

1. **Banking Information**: Only visible to `owner` and `manager` roles (same as salary)
2. **NID Number**: Sensitive data - only visible to authorized HR roles
3. **Documents**: Stored in private `hr-documents` bucket with RLS

---

## UI/UX Flow

1. User fills out existing staff creation fields
2. New **Identity Documents** section appears with:
   - NID Number text input
   - Multi-file upload with drag-and-drop
   - Preview of selected files with remove option
3. New **Banking Information** section appears with:
   - Bank Account Number input
   - Bank Account Name input
4. On submit:
   - Edge function creates staff account
   - Avatar uploaded (if provided)
   - Documents uploaded to storage
   - Document records created in `hr_documents`

---

## Summary

| Component | Action |
|-----------|--------|
| Database | Add `nid_number` column to `hr_staff_profiles` |
| CreateStaffDialog | Add NID, banking, and document upload sections |
| Edge Function | Accept and store new fields |
| Document Storage | Use existing `hr-documents` bucket |

