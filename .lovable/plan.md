
## References Feature Implementation Plan

### Overview
This feature adds a "References" management system to the admin section, allowing owners/managers to create references (e.g., agents, travel partners, marketing channels) with associated discount percentages. These references can then be selected during reservation creation to automatically apply discounts.

---

### Database Schema

#### New Table: `references`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | Foreign key to tenants (required) |
| `property_id` | UUID | Foreign key to properties (optional - null means all properties) |
| `name` | TEXT | Reference name (e.g., "Agent Karim", "Local Travel", "Facebook Campaign") |
| `code` | TEXT | Short unique code (e.g., "AGT-K", "LOC-T") |
| `discount_percentage` | NUMERIC | Discount percentage (0-100) |
| `discount_type` | TEXT | Either 'percentage' or 'fixed' (default: 'percentage') |
| `fixed_discount` | NUMERIC | Fixed discount amount in BDT (when discount_type = 'fixed') |
| `is_active` | BOOLEAN | Whether the reference is active |
| `notes` | TEXT | Optional notes |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### Reservations Table Changes
Add a new column to link reservations to references:
- `reference_id` (UUID, nullable) - Foreign key to references table
- `discount_amount` (NUMERIC, default 0) - Stores the calculated discount

---

### Technical Implementation

#### 1. Database Migration
```sql
CREATE TABLE public.references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  discount_percentage NUMERIC DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  fixed_discount NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, code)
);

-- RLS Policies (following existing patterns)
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;

-- Add reference_id and discount_amount to reservations
ALTER TABLE public.reservations 
  ADD COLUMN reference_id UUID REFERENCES public.references(id),
  ADD COLUMN discount_amount NUMERIC DEFAULT 0;
```

#### 2. New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/References.tsx` | References management page |
| `src/hooks/useReferences.tsx` | Hook for CRUD operations on references |
| `src/components/references/CreateReferenceDialog.tsx` | Dialog for creating new references |
| `src/components/references/ReferenceCard.tsx` | Card component for displaying a reference |
| `src/components/references/ReferenceDetailDrawer.tsx` | Drawer for viewing/editing reference details |

#### 3. Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/AppSidebar.tsx` | Add "References" nav item under Admin section |
| `src/App.tsx` | Add route for `/references` page |
| `src/components/reservations/NewReservationDialog.tsx` | Add reference selector with discount preview |
| `src/hooks/useCreateReservation.tsx` | Update to accept `reference_id` and calculate/store discount |

---

### UI/UX Design

#### References Page (`/references`)
- Header with "References" title and "Add Reference" button
- Stats bar showing: Total References, Active, Average Discount
- Grid/list of reference cards with:
  - Name and code
  - Discount percentage or fixed amount
  - Active/inactive status toggle
  - Edit/Delete actions

#### Reference in Reservation Form
Add a new section after "Booking Source":
```
┌─────────────────────────────────────────────────────────┐
│ Reference (Optional)                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Select Reference...                              ▼  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ✓ Apply 10% discount: -৳500                            │
└─────────────────────────────────────────────────────────┘
```

#### Updated Total Section
When a reference with discount is selected:
```
┌─────────────────────────────────────────────────────────┐
│ Estimated Total                                         │
│ 2 rooms x 3 nights                                      │
│                                                         │
│ Subtotal                              ৳15,000          │
│ Reference Discount (Agent Karim 10%)  -৳1,500          │
│ ─────────────────────────────────────────────────────  │
│ Total                                 ৳13,500          │
└─────────────────────────────────────────────────────────┘
```

---

### Sidebar Navigation Update

Add to `adminItems` array in `AppSidebar.tsx`:
```typescript
{ title: 'References', url: '/references', icon: Tags, color: 'text-vibrant-amber' }
```

---

### Security & Access Control

- **RLS Policies**:
  - Owners/Managers: Full CRUD access to references in their tenant
  - Front Desk: Read-only access to active references (for reservation form)
  - Superadmins: Full access to all references

- **Role-based access** for the References page:
  - Only `owner` and `manager` roles can access `/references`
  - `front_desk` can see the reference selector in reservation form

---

### Implementation Steps

1. **Create database migration** for `references` table and update `reservations` table
2. **Create `useReferences` hook** with fetch, create, update, delete operations
3. **Create References page** with CRUD UI
4. **Update sidebar** to include References link
5. **Update App.tsx** routing
6. **Modify NewReservationDialog** to include reference selector
7. **Update useCreateReservation** to handle reference_id and discount calculation
8. **Update ReservationDetailDrawer** to show reference and discount info

---

### Validation Rules

- Reference name: Required, max 100 characters
- Reference code: Required, unique per tenant, uppercase, max 20 characters
- Discount percentage: 0-100 range
- Fixed discount: Non-negative number
- Only one discount type can be active at a time
