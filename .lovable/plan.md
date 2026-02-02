
# BeeHotel Feature Implementation Plan - Phase 1: Core Business Modules

## Overview

This plan covers the initial implementation phase focusing on **Core Business modules** as requested, with a roadmap for the remaining 8 modules in subsequent phases.

---

## Phase 1 Modules (This Implementation)

### Module 3: Rate & Package Management
### Module 9: VAT/Tax & SD Module (Generic/Configurable)
### Module 4: Website Builder for Hotels

---

## Implementation Priority for Phase 1

| Priority | Module | Complexity | Estimated Time |
|----------|--------|------------|----------------|
| 1 | Rate & Package Management | High | Major |
| 2 | VAT/Tax Module | Medium | Medium |
| 3 | Website Builder | High | Major |

---

## Module 3: Rate & Package Management

### Features

**Dynamic Rate Management:**
- Base rates per room type (already exists in `room_types.base_rate`)
- Weekend rates (Fri-Sat-Sun configurable)
- Seasonal pricing with date ranges
- Special event pricing (holidays, conferences)
- Daily price calendar view (visual grid showing rates per day)
- Last-minute discounts (% off within X days of arrival)

**Package Management:**
- Create packages (Room + Breakfast, Honeymoon, etc.)
- Package inclusions (meals, spa, airport transfer)
- Package pricing (flat or % add-on)
- Package availability dates

### Database Schema

```text
NEW TABLES:

rate_periods
├── id (uuid)
├── tenant_id (uuid)
├── property_id (uuid)
├── room_type_id (uuid)
├── name (text) - "Weekend Rate", "Peak Season"
├── rate_type (enum) - 'weekend', 'seasonal', 'event', 'last_minute'
├── amount (numeric) - new rate or adjustment amount
├── adjustment_type (enum) - 'fixed', 'percentage', 'override'
├── start_date (date, nullable for weekend)
├── end_date (date, nullable for weekend)
├── days_of_week (int[], nullable) - [5,6] for Fri-Sat
├── priority (int) - higher wins conflicts
├── is_active (boolean)
├── created_at, updated_at

packages
├── id (uuid)
├── tenant_id (uuid)
├── property_id (uuid)
├── name (text)
├── description (text)
├── code (text)
├── price_adjustment (numeric)
├── adjustment_type (enum) - 'fixed', 'percentage'
├── valid_from (date)
├── valid_until (date)
├── min_nights (int)
├── is_active (boolean)
├── inclusions (jsonb) - [{name, description, icon}]
├── applicable_room_types (uuid[])
├── created_at, updated_at

daily_rates (for price calendar view)
├── id (uuid)
├── tenant_id (uuid)
├── property_id (uuid)
├── room_type_id (uuid)
├── date (date)
├── calculated_rate (numeric)
├── rate_period_id (uuid, nullable)
├── is_manual_override (boolean)
├── created_at
```

### UI Components

**Pages:**
- `/settings/rates` - Rate Management Dashboard
- `/settings/packages` - Package Management

**Components:**
- `RatePeriodsList.tsx` - List/manage rate periods
- `CreateRatePeriodDialog.tsx` - Create rate rules
- `DailyRateCalendar.tsx` - Visual calendar showing rates per day per room type
- `PackagesList.tsx` - List/manage packages
- `CreatePackageDialog.tsx` - Package creation form
- `RateCalculator.tsx` - Preview calculated rates for date range

### Rate Calculation Logic

```text
1. Start with base_rate from room_types
2. Check for active rate_periods matching the date
3. Apply adjustments based on priority (highest wins)
4. Weekend rates: Check if date.dayOfWeek matches days_of_week
5. Store calculated result in daily_rates for performance
```

---

## Module 9: VAT/Tax & SD Module (Configurable)

### Features

**Tax Configuration:**
- Multiple tax types (VAT, SD, Service Charge, Tourism Tax)
- Configurable rates per tax type
- Tax applicability rules (rooms only, food only, all)
- Compound vs. non-compound taxes
- Tax exemptions for corporate accounts

**Tax Calculation:**
- Automatic calculation on all charges
- Tax breakdown on invoices
- Tax reports by period
- Export for tax filing

### Database Schema

```text
NEW TABLES:

tax_configurations
├── id (uuid)
├── tenant_id (uuid)
├── property_id (uuid)
├── name (text) - "VAT", "SD", "Tourism Tax"
├── code (text) - "VAT15", "SD5"
├── rate (numeric) - 15.00 for 15%
├── is_compound (boolean) - applied after other taxes
├── applies_to (enum[]) - ['room', 'food', 'service', 'other']
├── is_inclusive (boolean) - price includes tax
├── is_active (boolean)
├── calculation_order (int) - order of calculation
├── created_at, updated_at

tax_exemptions
├── id (uuid)
├── tenant_id (uuid)
├── tax_configuration_id (uuid)
├── entity_type (enum) - 'corporate_account', 'guest'
├── entity_id (uuid)
├── exemption_type (enum) - 'full', 'partial'
├── exemption_rate (numeric) - % exempted
├── valid_from, valid_until
├── notes (text)
├── created_at
```

### Changes to Existing Tables

```text
MODIFY folio_items:
├── ADD tax_breakdown (jsonb) - {"VAT": 150, "SD": 50}

MODIFY properties:
├── KEEP tax_rate (legacy, for backward compatibility)
├── ADD use_advanced_tax (boolean) - switch to new system
```

### UI Components

**Pages:**
- `/settings/taxes` - Tax Configuration

**Components:**
- `TaxConfigurationList.tsx` - Manage tax types
- `CreateTaxDialog.tsx` - Add new tax
- `TaxExemptionManager.tsx` - Manage exemptions
- `TaxReportGenerator.tsx` - Generate tax reports

### Tax Calculation Service

```text
calculateTaxes(amount, chargeType, guestId?, corporateId?):
1. Get active tax configurations for property
2. Filter by applies_to matching chargeType
3. Check for exemptions
4. Apply non-compound taxes first
5. Apply compound taxes on (amount + non-compound taxes)
6. Return breakdown object
```

---

## Module 4: Website Builder for Hotels

### Features

**Template System:**
- Pre-designed hotel website templates (3-5 themes)
- Customizable sections (Hero, Rooms, Amenities, Gallery, Contact)
- Color scheme customization
- Logo and branding integration

**Content Management:**
- Room listings pulled from PMS data
- Gallery image management
- Contact form submissions
- Amenities showcase
- Special offers/packages display

**Booking Integration:**
- Embedded booking widget
- Real-time availability check
- Direct reservation creation

### Database Schema

```text
NEW TABLES:

website_configurations
├── id (uuid)
├── tenant_id (uuid)
├── property_id (uuid)
├── template_id (text) - 'luxury', 'modern', 'classic'
├── subdomain (text, unique) - 'grandhotel' -> grandhotel.beehotel.app
├── custom_domain (text, nullable)
├── is_published (boolean)
├── primary_color (text)
├── secondary_color (text)
├── font_family (text)
├── sections (jsonb) - [{type, enabled, order, content}]
├── seo_title (text)
├── seo_description (text)
├── social_links (jsonb)
├── created_at, updated_at

website_pages
├── id (uuid)
├── website_id (uuid)
├── slug (text)
├── title (text)
├── content (jsonb) - structured content blocks
├── is_published (boolean)
├── created_at, updated_at

website_gallery
├── id (uuid)
├── website_id (uuid)
├── image_url (text)
├── caption (text)
├── category (text) - 'rooms', 'dining', 'amenities', 'exterior'
├── sort_order (int)
├── created_at

contact_submissions
├── id (uuid)
├── website_id (uuid)
├── name (text)
├── email (text)
├── phone (text)
├── message (text)
├── status (enum) - 'new', 'read', 'replied'
├── created_at
```

### UI Components

**Pages:**
- `/settings/website` - Website Builder Dashboard
- `/settings/website/editor` - Visual Editor
- `/settings/website/gallery` - Gallery Management
- `/settings/website/inquiries` - Contact Form Submissions

**Components:**
- `WebsiteTemplateSelector.tsx` - Choose template
- `WebsiteSectionEditor.tsx` - Edit sections
- `WebsitePreview.tsx` - Live preview
- `GalleryUploader.tsx` - Manage images
- `BookingWidgetSettings.tsx` - Configure booking widget

### Public Website Rendering

The hotel websites will be served via a separate route/subdomain pattern:
- Access via `{subdomain}.beehotel.app` or custom domain
- Server-side rendering of configured template
- Real-time room availability from PMS

---

## Phase 2 Roadmap (Future Implementations)

| Module | Description | Dependencies |
|--------|-------------|--------------|
| 1. User Role & Permission | Functional permission matrix | Existing hr_permissions tables |
| 2. Audit + Activity Logs | Enhanced logging with more detail | Existing audit_logs table |
| 5. Maintenance Enhancement | Invoice per task, monthly PDF | Existing maintenance_tickets |
| 6. POS Room Posting | Post food charges to guest folios | Existing POS + folios |
| 7. Inventory Management | Stock tracking, waste, statements | New module |
| 8. Purchase/Supplier | Supplier profiles, purchase orders | Depends on Module 7 |
| 10. Corporate Billing Enhancement | Already mostly implemented | Minor enhancements |
| 11. Staff Management Enhancement | Advance, agreements, custom salary | Existing hr_staff_profiles |

---

## Implementation Order for Phase 1

```text
Step 1: Database Migrations
├── Create rate_periods, packages, daily_rates tables
├── Create tax_configurations, tax_exemptions tables
├── Create website_configurations, website_pages tables
├── Add RLS policies for multi-tenant security

Step 2: Rate & Package Management
├── Create hooks (useRatePeriods, usePackages, useDailyRates)
├── Build UI components for rate management
├── Implement rate calculation service
├── Integrate with reservation creation
├── Add price calendar view

Step 3: VAT/Tax Module
├── Create hooks (useTaxConfigurations, useTaxExemptions)
├── Build tax configuration UI
├── Update folio charge logic to use new tax system
├── Add tax breakdown to invoices
├── Create tax reports

Step 4: Website Builder
├── Create website configuration hooks
├── Design 3 template themes
├── Build visual editor components
├── Create public website routes
├── Integrate booking widget
├── Add gallery management
```

---

## Navigation Updates

**Settings Section (Admin Menu):**
```text
Admin
├── Properties
├── References
├── Rates & Packages (NEW)
├── Tax Configuration (NEW)
├── Website Builder (NEW)
├── Settings
```

---

## Files to Create

### Hooks
- `src/hooks/useRatePeriods.tsx`
- `src/hooks/usePackages.tsx`
- `src/hooks/useDailyRates.tsx`
- `src/hooks/useTaxConfigurations.tsx`
- `src/hooks/useWebsiteBuilder.tsx`

### Pages
- `src/pages/settings/Rates.tsx`
- `src/pages/settings/Packages.tsx`
- `src/pages/settings/Taxes.tsx`
- `src/pages/settings/Website.tsx`

### Components
- `src/components/rates/*` (5-6 components)
- `src/components/taxes/*` (4-5 components)
- `src/components/website-builder/*` (8-10 components)

---

## Technical Considerations

**Rate Calculation Performance:**
- Pre-calculate daily rates when rate periods are created/updated
- Background job to refresh daily_rates table
- Cache calculated rates for common date ranges

**Tax Calculation:**
- Calculate taxes at charge time, not invoice time
- Store breakdown in folio_items for audit trail
- Support both tax-inclusive and tax-exclusive pricing

**Website Security:**
- Public websites have separate auth context
- Booking widget uses anonymous auth with CAPTCHA
- Rate limiting on contact form submissions

