

# Offline Fallback Page Implementation Plan

## Overview
This plan implements an offline fallback page that automatically displays when users lose their internet connection. The solution uses browser APIs to detect connectivity changes and provides a user-friendly experience while offline.

## What You'll Get
- A visually appealing offline page that matches your app's design
- Automatic detection when the connection is lost or restored
- A retry button to attempt reconnection
- Smooth transitions between online and offline states

---

## Implementation Details

### 1. Create Offline Page Component
**New file: `src/pages/Offline.tsx`**

A dedicated page component that displays:
- Wi-Fi off icon indicating no connection
- Clear "You're Offline" message
- Helpful explanation text
- "Try Again" button to check connection status
- Auto-redirect when connection is restored

The page will use the existing design system with gradient backgrounds and the vibrant color scheme.

### 2. Create Network Status Hook
**New file: `src/hooks/useNetworkStatus.tsx`**

A custom React hook that:
- Monitors `navigator.onLine` for initial status
- Listens to `window` online/offline events
- Provides real-time connectivity status to components
- Handles cleanup of event listeners

### 3. Create Offline Detection Wrapper
**New file: `src/components/OfflineDetector.tsx`**

A wrapper component that:
- Uses the network status hook
- Shows the offline page when disconnected
- Renders normal app content when connected
- Provides smooth transition animations

### 4. Integrate with App Root
**Update: `src/App.tsx`**

Wrap the entire application with the OfflineDetector component so that:
- All routes are protected by offline detection
- Users see the offline page regardless of which route they're on
- The app automatically recovers when connection returns

---

## Technical Details

### Network Detection Flow
```text
+------------------+     Connection Lost     +------------------+
|   Normal App     | ----------------------> |   Offline Page   |
|   (Any Route)    |                         |   (Full Screen)  |
+------------------+                         +------------------+
        ^                                            |
        |            Connection Restored             |
        +--------------------------------------------+
```

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/Offline.tsx` | Offline fallback UI |
| `src/hooks/useNetworkStatus.tsx` | Network monitoring hook |
| `src/components/OfflineDetector.tsx` | Wrapper component |

### Files to Modify
| File | Change |
|------|--------|
| `src/App.tsx` | Wrap app with OfflineDetector |

---

## Design Preview

The offline page will feature:
- Centered content with a gradient background
- Large Wi-Fi off icon
- Bold "You're Offline" heading
- Subtitle explaining the situation
- Primary color "Try Again" button
- Auto-refresh capability when connection returns

The design follows your existing Hotel PMS design system with vibrant colors and modern styling.

