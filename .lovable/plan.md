
## Goal
Fix the calendar timeline so a reservation modified to **Check-in: Jan 26** and **Check-out: Jan 28** visually spans the correct dates (not only Jan 26). Keep the existing Refresh button behavior.

## What’s actually causing the bug (in simple terms)
Right now the calendar’s “start date” (the left-most date column) is stored with a **time** (e.g., 11:33 PM), because it’s set using `new Date()` in a few places.

But reservations from the database are “date-only” (midnight). When the code calculates block width using `differenceInDays`, the time portion can make `2 nights` turn into `1 day` visually.

Example:
- Calendar startDate = **Jan 26, 11:30 PM**
- Reservation check-in = **Jan 26, 12:00 AM**
- Reservation check-out = **Jan 28, 12:00 AM**
- Visually computed duration becomes ~1 day (because it’s not a clean multiple of 24 hours)

So the block appears only on the first day.

## Fix strategy (robust)
1) **Normalize calendar startDate to “start of day” (midnight) everywhere**
2) Use **calendar-day** differences (ignore time) for rendering math:
   - Replace `differenceInDays` with `differenceInCalendarDays` for timeline offsets/durations and drag constraints
3) Ensure date-range generation uses normalized dates too
4) (Optional but recommended) Align Reservation Details duration calculation to the same logic for consistency

This makes the UI stable even if timezones or time components slip in.

---

## Files to update
### 1) `src/pages/Calendar.tsx`
**Change**
- Initialize state with `startOfDay(new Date())`
- When setting startDate from controls, ensure it stays normalized (wrap `setStartDate`)

**Why**
- Prevents “11:30 PM start date” from breaking the timeline calculation.

**Implementation detail**
- Import `startOfDay` from `date-fns`
- Replace:
  - `useState(() => new Date())`
  - with `useState(() => startOfDay(new Date()))`
- Add helper:
  - `const setStartDateSafe = (d: Date) => setStartDate(startOfDay(d));`
- Pass `setStartDateSafe` into `CalendarControls`

Also update `handleReservationDateChange` to use `differenceInCalendarDays` to keep pricing math consistent with date-only logic.

---

### 2) `src/components/calendar/CalendarControls.tsx`
**Change**
- Normalize any date emitted via `onStartDateChange`:
  - Today button
  - prev/next navigation
  - date picker selection

**Why**
- Ensures startDate never reintroduces a time component.

**Implementation detail**
- Import `startOfDay`
- Wrap all `onStartDateChange(...)` calls with `startOfDay(...)`.

---

### 3) `src/hooks/useCalendarReservations.tsx`
**Change**
- Build `dateRange` based on a normalized base date
- Compute `endDate` from the normalized base date

**Why**
- Keeps the grid columns aligned to midnight days, matching reservation dates.

**Implementation detail**
- `const base = startOfDay(startDate)`
- `dateRange.push(addDays(base, i))`
- `endDate = addDays(base, numDays - 1)`

---

### 4) `src/components/calendar/CalendarTimeline.tsx`
**Change**
- Use `differenceInCalendarDays` (not `differenceInDays`) in:
  - `DraggableReservationBlock` calculations (`startOffset`, `duration`)
  - the drag constraint calculations (`startOffset`, `duration`) in the map loop around line ~379
- Normalize `rangeStart` internally defensively:
  - `const rangeStart = startOfDay(startDate);`

**Why**
- Removes all sensitivity to time-of-day differences, fixing the “only one day marked” bug.
- Also fixes drag constraints so users can drag across the correct number of days.

**Expected result**
- For check-in Jan 26, check-out Jan 28:
  - Duration = 2 (nights)
  - Block spans **Jan 26 and Jan 27** columns (standard hotel calendar behavior where checkout day is not an occupied night).

**Note on expectations**
If you want the block to also color the **checkout day (Jan 28)** column, that’s a separate display choice (inclusive vs exclusive rendering). Standard hotel “nights” calendars show occupancy up to but not including checkout day. After this fix, the block will correctly cover the nights.

If you prefer “inclusive coloring” (26, 27, and 28), I can implement a visual rule:
- render `displayEnd = addDays(checkOut, 1)` for UI only
- keep billing/availability logic unchanged

---

### 5) (Recommended consistency) `src/components/reservations/ReservationDetailDrawer.tsx`
**Change**
- Replace the nights calculation that uses `new Date(...).getTime()` with:
  - `differenceInCalendarDays(parseISO(check_out_date), parseISO(check_in_date))`
- Replace date formatting from `new Date(reservation.check_in_date)` to `parseISO(...)`

**Why**
- Avoid timezone-related surprises and keep all “nights” calculations consistent across the app.

---

## Testing checklist (what we’ll verify in preview)
1) Go to `/calendar` and set start date to Jan 26.
2) Modify a reservation to:
   - Check-in: Jan 26
   - Check-out: Jan 28
3) Confirm the reservation block spans **2 columns** (26 and 27), not only 26.
4) Verify the tooltip still shows “Jan 26 → Jan 28”.
5) Drag a reservation horizontally and confirm it moves the correct number of days (constraints not broken).
6) Click Refresh and ensure:
   - spinner shows while refetching
   - “Calendar refreshed” toast appears
   - reservations re-render correctly

---

## Risks / edge cases handled
- Different timezones / times in `Date` objects: neutralized by `startOfDay` + `differenceInCalendarDays`
- Date picker returning midnight vs “today button” returning “now”: both normalized
- Drag constraints mismatching block width: fixed by using the same calendar-day math in both places

---

## Deliverable
After implementation, the calendar will reliably show reservation blocks spanning the correct number of days/nights even after date modifications, without requiring manual refresh to “look right.”
