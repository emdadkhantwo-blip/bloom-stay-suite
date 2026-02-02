
# Website Builder - Publish/Unpublish & Preview Fix

## Problem Summary

Two issues need to be addressed in the Website Builder:

1. **Missing Unpublish Button**: Only the "Publish" button exists. When a website is published, there's no way to unpublish it.
2. **Preview Not Working**: The preview links to `https://{subdomain}.beehotel.app` which doesn't exist. Users can't see their website.

---

## Solution Overview

### 1. Add Publish/Unpublish Toggle Buttons

Update the Website Builder status card to show:
- **Publish** button when website is in draft (`is_published = false`)
- **Unpublish** button when website is live (`is_published = true`)

### 2. Create In-App Website Preview

Create a public route within the app to render hotel websites:
- Route: `/site/:subdomain` - Public hotel website viewer
- Users can preview their website within the Lovable environment
- No external domain required

---

## Technical Implementation

### File Changes

**1. Update `src/pages/settings/Website.tsx`**

Add the Unpublish button alongside Publish:

```
Current (lines 117-129):
- Preview button always visible
- Publish button only when NOT published
- No unpublish option

Updated:
- Preview button → links to /site/{subdomain} instead of external URL
- Publish button when draft
- Unpublish button when published
```

**2. Create `src/pages/PublicHotelWebsite.tsx`**

New public page that renders the hotel website based on subdomain:
- Fetches website configuration by subdomain
- Renders the selected template with configured sections
- Shows rooms, gallery, contact form from database
- Displays "Not Found" or "Coming Soon" for unpublished sites

**3. Create `src/components/website-templates/` folder**

Template components for rendering the public website:
- `ModernTemplate.tsx` - Modern Minimalist design
- `LuxuryTemplate.tsx` - Luxury Elegance design  
- `ClassicTemplate.tsx` - Classic Heritage design
- `WebsiteHeroSection.tsx` - Hero section component
- `WebsiteRoomsSection.tsx` - Rooms listing
- `WebsiteContactSection.tsx` - Contact form
- `WebsiteGallerySection.tsx` - Image gallery

**4. Update `src/App.tsx`**

Add the public route:
```typescript
<Route path="/site/:subdomain" element={<PublicHotelWebsite />} />
```

This route is public (no authentication required).

---

## UI Changes

### Website Status Card (Published State)

```
+----------------------------------------------------------+
|  [Globe]  Main Property Website        [Published Badge] |
|           main.beehotel.app                              |
|                                                          |
|  [Preview]  [Unpublish]                                  |
+----------------------------------------------------------+
```

### Website Status Card (Draft State)

```
+----------------------------------------------------------+
|  [Globe]  Main Property Website        [Draft Badge]     |
|           main.beehotel.app                              |
|                                                          |
|  [Preview]  [Publish]                                    |
+----------------------------------------------------------+
```

### Preview Button Behavior

- Opens `/site/{subdomain}` in a new tab
- Works within Lovable's preview environment
- Shows actual rendered website with configured template

---

## Public Website Page Features

### Route: `/site/:subdomain`

1. **Published Website**: Shows full website with all enabled sections
2. **Unpublished Website**: Shows "Coming Soon" page
3. **Not Found**: Shows "Website Not Found" if subdomain doesn't exist

### Template Rendering

Based on `template_id` in `website_configurations`:
- `modern` → Clean, image-focused layout
- `luxury` → Elegant with gold accents
- `classic` → Traditional serif fonts

### Sections Rendered (if enabled)

| Section | Content Source |
|---------|----------------|
| Hero | website_configurations.hero_image_url, seo_title |
| About | sections[].content |
| Rooms | room_types table (fetched live) |
| Amenities | sections[].content |
| Gallery | website_gallery table |
| Packages | packages table (if enabled) |
| Contact | Contact form → contact_submissions |

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/settings/Website.tsx` | Modify | Add unpublish button, fix preview link |
| `src/pages/PublicHotelWebsite.tsx` | Create | Public website renderer |
| `src/components/website-templates/ModernTemplate.tsx` | Create | Modern template layout |
| `src/components/website-templates/LuxuryTemplate.tsx` | Create | Luxury template layout |
| `src/components/website-templates/ClassicTemplate.tsx` | Create | Classic template layout |
| `src/components/website-templates/sections/` | Create | Shared section components |
| `src/App.tsx` | Modify | Add public route |

---

## Database Changes

No database changes required - using existing tables:
- `website_configurations`
- `website_gallery`  
- `contact_submissions`
- `room_types`
- `packages`

---

## Security Considerations

- Public website route allows anonymous access (no auth required)
- Contact form submissions include rate limiting
- Only published websites are fully viewable
- Unpublished sites show "Coming Soon" placeholder
