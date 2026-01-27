
# Enhanced Night Audit Section with CSV/PDF Export

## Overview

This plan enhances the Night Audit section with comprehensive reporting features, more granular data breakdowns, and export capabilities in both CSV and PDF formats.

---

## Current State Analysis

The existing Night Audit module includes:
- Pre-audit checklist (pending arrivals, POS orders, housekeeping)
- Basic statistics (occupancy, revenue, ADR, RevPAR)
- Room charge posting automation
- Audit history table with 30-day records

**What's Missing:**
- Detailed revenue breakdown by payment method
- Room-level detail reports
- Guest list for the business date
- Cash/credit reconciliation
- Cancellation and early departure tracking
- Export functionality (CSV and PDF)
- Visual charts and trends

---

## New Features to Implement

### 1. Enhanced Statistics with More Specific Data

**Extended AuditStatistics Interface:**
```typescript
interface ExtendedAuditStatistics {
  // Existing fields...
  
  // Revenue breakdown by payment method
  paymentsByMethod: {
    cash: number;
    card: number;
    bank_transfer: number;
    mobile_payment: number;
    other: number;
  };
  
  // Guest statistics
  totalGuests: number;
  newGuests: number;
  returningGuests: number;
  vipGuests: number;
  
  // Reservation statistics
  cancellations: number;
  earlyDepartures: number;
  lateCheckouts: number;
  walkins: number;
  
  // Room breakdown
  roomsByType: { name: string; occupied: number; total: number; revenue: number }[];
  
  // Outstanding balances
  totalOutstanding: number;
  overdueCount: number;
}
```

### 2. New Night Audit Detail Component

Create `NightAuditDetailTabs.tsx` with tabs for:
- **Room Status**: List of all rooms with status, guest name, rate, and balance
- **Guest List**: All checked-in guests for the business date with contact info
- **Revenue Detail**: Itemized revenue by category with payment method breakdown
- **Outstanding Folios**: List of folios with unpaid balances
- **Activity Log**: Arrivals, departures, cancellations, and no-shows with timestamps

### 3. Export Functionality

**CSV Export (`NightAuditExport.tsx`):**
- Export audit history as CSV
- Export current day's detailed report as CSV
- Include all statistics, room list, and guest list

**PDF Export (`NightAuditReportView.tsx`):**
- Professional manager's report format
- Hotel branding with logo
- Executive summary with KPIs
- Detailed breakdowns by section
- Browser-based print using `window.print()` pattern

---

## Implementation Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/night-audit/NightAuditDetailTabs.tsx` | Tabbed interface for detailed data views |
| `src/components/night-audit/NightAuditRevenueBreakdown.tsx` | Payment method and revenue category breakdown |
| `src/components/night-audit/NightAuditRoomList.tsx` | Detailed room status with guest info |
| `src/components/night-audit/NightAuditGuestList.tsx` | Guest list for business date |
| `src/components/night-audit/NightAuditOutstandingFolios.tsx` | List of folios with balances |
| `src/components/night-audit/NightAuditReportView.tsx` | PDF/Print report generator |
| `src/components/night-audit/NightAuditExportButtons.tsx` | CSV and PDF export buttons |
| `src/components/night-audit/NightAuditTrendCharts.tsx` | Visual charts comparing to previous periods |

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useNightAudit.tsx` | Add extended statistics queries, detail data fetching, export logic |
| `src/pages/NightAudit.tsx` | Integrate new components and tabs |
| `src/components/night-audit/NightAuditHistory.tsx` | Add export button for history data |
| `src/components/night-audit/NightAuditStats.tsx` | Enhance with payment method breakdown |

---

## UI Layout Changes

### Enhanced Page Structure

```text
+------------------------------------------+
|  Night Audit Header                      |
|  Business Date: Jan 27, 2026    [Status] |
|  +----------------+ +------------------+ |
|  | Export CSV     | | Export PDF       | |
|  +----------------+ +------------------+ |
+------------------------------------------+

+------------------------------------------+
| Tabs: [Run Audit] [Details] [History]    |
+------------------------------------------+

[Run Audit Tab - Existing]
  - Pre-Audit Checklist | Daily Statistics
  - Audit Actions

[Details Tab - NEW]
  +--------------------------------------+
  | Sub-tabs:                            |
  | [Rooms] [Guests] [Revenue] [Folios]  |
  +--------------------------------------+
  | Content based on selected sub-tab    |
  +--------------------------------------+

[History Tab - Enhanced]
  - Existing table with export button
  - Trend charts for occupancy/revenue
```

### Revenue Breakdown Card (Enhanced Stats)

```text
+----------------------------------+
| Revenue Breakdown                |
+----------------------------------+
| Room Revenue     ৳150,000  (65%) |
| F&B Revenue      ৳ 50,000  (22%) |
| Other Revenue    ৳ 30,000  (13%) |
|                           -------|
| Total Revenue    ৳230,000        |
+----------------------------------+
| Payments by Method               |
+----------------------------------+
| Cash             ৳120,000  (52%) |
| Card             ৳ 80,000  (35%) |
| Bank Transfer    ৳ 20,000  ( 9%) |
| Mobile           ৳ 10,000  ( 4%) |
+----------------------------------+
```

---

## Technical Implementation

### Extended Hook Queries

Add new queries in `useNightAudit.tsx`:

1. **Payments by Method Query:**
```typescript
const { data: payments } = await supabase
  .from('payments')
  .select('amount, payment_method, folio:folios!inner(property_id)')
  .eq('folios.property_id', currentProperty.id)
  .gte('created_at', `${businessDate}T00:00:00`)
  .lt('created_at', `${businessDate}T23:59:59`)
  .eq('voided', false);
```

2. **Room Status Detail Query:**
```typescript
const { data: roomDetails } = await supabase
  .from('rooms')
  .select(`
    id, room_number, floor, status,
    room_type:room_types(name, base_rate),
    reservation_rooms!inner(
      rate_per_night,
      reservation:reservations!inner(
        guest:guests(first_name, last_name, phone),
        status, check_in_date, check_out_date
      )
    )
  `)
  .eq('property_id', currentProperty.id);
```

3. **Outstanding Folios Query:**
```typescript
const { data: outstandingFolios } = await supabase
  .from('folios')
  .select(`
    id, folio_number, total_amount, paid_amount, balance,
    guest:guests(first_name, last_name),
    reservation:reservations(confirmation_number)
  `)
  .eq('property_id', currentProperty.id)
  .eq('status', 'open')
  .gt('balance', 0);
```

### CSV Export Implementation

```typescript
const handleExportCSV = (type: 'history' | 'daily') => {
  if (type === 'history') {
    const headers = ["Date", "Status", "Occupancy %", "Room Revenue", "F&B Revenue", 
                     "Other Revenue", "Total Revenue", "ADR", "RevPAR", "Arrivals", 
                     "Departures", "No-Shows"];
    const rows = auditHistory.map(a => [
      format(new Date(a.business_date), 'yyyy-MM-dd'),
      a.status,
      a.occupancy_rate.toFixed(1),
      a.total_room_revenue.toFixed(2),
      // ... more fields
    ]);
    downloadCSV(`night-audit-history-${format(new Date(), 'yyyy-MM-dd')}.csv`, headers, rows);
  } else {
    // Daily detailed export with room list, guest list, revenue breakdown
  }
};
```

### PDF Report Implementation

Using the existing `window.print()` pattern from `FolioInvoicePrintView.tsx`:

```typescript
export function openNightAuditReportView(data: NightAuditReportData) {
  const printWindow = window.open("", "_blank", "width=900,height=1100");
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Night Audit Report - ${data.businessDate}</title>
      <style>/* Professional report styling */</style>
    </head>
    <body>
      <div class="header">
        ${data.hotelLogo ? `<img src="${data.hotelLogo}" />` : ''}
        <h1>${data.hotelName}</h1>
        <h2>Night Audit Report</h2>
        <p>Business Date: ${format(new Date(data.businessDate), 'MMMM d, yyyy')}</p>
      </div>
      
      <div class="section">
        <h3>Executive Summary</h3>
        <!-- KPI cards: Occupancy, ADR, RevPAR, Total Revenue -->
      </div>
      
      <div class="section">
        <h3>Occupancy Statistics</h3>
        <!-- Room breakdown table -->
      </div>
      
      <div class="section">
        <h3>Revenue Breakdown</h3>
        <!-- Revenue by category and payment method -->
      </div>
      
      <div class="section">
        <h3>Guest Movement</h3>
        <!-- Arrivals, departures, no-shows tables -->
      </div>
      
      <script>window.onload = () => window.print();</script>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
```

---

## Visual Enhancements

### Trend Charts in History Tab

Add mini charts showing:
- 7-day occupancy trend line
- 7-day revenue comparison bar chart
- Week-over-week percentage change indicators

Using existing `recharts` library already in the project.

---

## Database Considerations

No database schema changes are required. All new features use existing tables:
- `night_audits` - Audit records with report_data JSON
- `payments` - Payment method breakdown
- `folios` / `folio_items` - Revenue details
- `rooms` / `reservations` - Occupancy details
- `guests` - Guest information

---

## Implementation Steps

1. **Extend the hook** (`useNightAudit.tsx`):
   - Add new queries for detailed data
   - Create export utility functions
   - Add payment method aggregation

2. **Create export components**:
   - `NightAuditExportButtons.tsx` - UI buttons for CSV/PDF
   - `NightAuditReportView.tsx` - PDF print template

3. **Create detail view components**:
   - `NightAuditDetailTabs.tsx` - Container with sub-tabs
   - `NightAuditRoomList.tsx` - Room status table
   - `NightAuditGuestList.tsx` - Guest list table
   - `NightAuditRevenueBreakdown.tsx` - Enhanced revenue card
   - `NightAuditOutstandingFolios.tsx` - Unpaid balances table

4. **Enhance existing components**:
   - Update `NightAuditStats.tsx` with payment breakdown
   - Add trend charts to `NightAuditHistory.tsx`

5. **Update the main page**:
   - Add "Details" tab to `NightAudit.tsx`
   - Add export buttons to header

---

## Expected Outcome

After implementation:
- Users can view comprehensive daily statistics with payment method breakdown
- Detailed room-by-room status with guest information
- List of all guests checked in on the business date
- Outstanding folio tracking for cash management
- One-click CSV export for spreadsheet analysis
- Professional PDF reports for management review
- Visual trend charts for performance tracking
