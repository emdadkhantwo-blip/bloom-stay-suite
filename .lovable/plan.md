

# Rebrand Chatbot from "সখী (Sakhi)" to "BeeChat"

## Overview
This plan rebrands the AI chatbot assistant with the new "BeeChat" identity, including the new logo, updated name display, and revised Bengali welcome message (without using "নমস্কার").

---

## Changes Required

### 1. Add BeeChat Logo to Assets
**Action**: Copy the uploaded "B" speech bubble logo to the project assets folder.

**File**: `src/assets/beechat-logo.png`

The logo will be imported and used in both the FAB button and the chat header.

---

### 2. Update Chat Header (AdminChatbot.tsx)
**File**: `src/components/admin/AdminChatbot.tsx`

**Changes**:

| Location | Current | New |
|----------|---------|-----|
| Line 116 | `সখী (Sakhi)` | `BeeChat` |
| Line 117 | `Hotel Management Assistant` | `Hotel Management Assistant` (keep same) |
| Lines 112-113 | `<MessageCircle />` icon in header | Replace with `<img src={beechatLogo} />` |
| Line 76-78 | FAB button uses `<MessageCircle />` | Replace with `<img src={beechatLogo} />` |
| Header gradient | Purple to indigo gradient | Change to blue gradient (`from-blue-500 to-blue-600`) to match BeeChat branding |

**Updated Code Structure**:
```tsx
// Add import
import beechatLogo from '@/assets/beechat-logo.png';

// Header section
<div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
    <img src={beechatLogo} alt="BeeChat" className="w-8 h-8 object-contain" />
  </div>
  <div>
    <h3 className="font-semibold">BeeChat</h3>
    <p className="text-xs text-white/80">Hotel Management Assistant</p>
  </div>
</div>
```

**FAB Button Update**:
```tsx
<Button
  onClick={() => setIsOpen(true)}
  size="lg"
  className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 p-0 overflow-hidden"
>
  <img src={beechatLogo} alt="BeeChat" className="w-10 h-10 object-contain" />
</Button>
```

---

### 3. Update Chat Message Avatar (ChatMessage.tsx)
**File**: `src/components/admin/ChatMessage.tsx`

**Changes**:
- Import the BeeChat logo
- Replace the `<Bot />` icon in assistant messages with the BeeChat logo
- Update avatar gradient to blue theme

**Updated Code**:
```tsx
// Add import
import beechatLogo from '@/assets/beechat-logo.png';

// Avatar section for assistant messages
<div className={cn(
  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden",
  isUser 
    ? "bg-primary text-primary-foreground" 
    : "bg-gradient-to-br from-blue-400 to-blue-600"
)}>
  {isUser ? <User className="h-4 w-4" /> : (
    <img src={beechatLogo} alt="BeeChat" className="w-6 h-6 object-contain" />
  )}
</div>
```

---

### 4. Update Welcome Message (useAdminChat.tsx)
**File**: `src/hooks/useAdminChat.tsx`

**Changes**:
- Update session key from `sakhi_chat_session` to `beechat_session`
- Update welcome message to use new Bengali greeting (no "নমস্কার")

**Line 28**: Change session key
```tsx
const SESSION_KEY = 'beechat_session';
```

**Lines 281-294**: Updated welcome message
```tsx
content: `Hello Sir! 👋 আমি **BeeChat**, আপনার হোটেল ম্যানেজমেন্ট সহকারী।

আমি আপনার হোটেলের সব তথ্য জানি - রুম, গেস্ট, স্টাফ, রিজার্ভেশন সব!

আমি আপনাকে সাহায্য করতে পারি:
- 📅 **রিজার্ভেশন** তৈরি ও পরিচালনা
- 🛎️ **চেক-ইন/আউট** প্রক্রিয়াকরণ
- 🛏️ **রুম ম্যানেজমেন্ট** ও হাউসকিপিং
- 👥 **গেস্ট প্রোফাইল** তৈরি
- 💳 **ফোলিও ও পেমেন্ট** পরিচালনা
- 📊 **রিপোর্ট ও পরিসংখ্যান** দেখা

**আজ আপনাকে কীভাবে সাহায্য করতে পারি?**`
```

---

### 5. Update Color Theme
The BeeChat logo uses a blue color scheme, so update the gradients accordingly:

| Component | Current | New |
|-----------|---------|-----|
| Header background | `from-purple-600 to-indigo-600` | `from-blue-500 to-blue-600` |
| Header hover | `from-purple-700 to-indigo-700` | `from-blue-600 to-blue-700` |
| FAB button | `from-purple-600 to-indigo-600` | `from-blue-500 to-blue-600` |
| Send button | `from-purple-600 to-indigo-600` | `from-blue-500 to-blue-600` |
| Message avatar | `from-purple-500 to-indigo-600` | `from-blue-400 to-blue-600` |

---

### 6. Update ChatInput Send Button (ChatInput.tsx)
**File**: `src/components/admin/ChatInput.tsx`

**Line 71-72**: Update send button gradient
```tsx
className="h-[44px] w-[44px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
```

---

## Summary of File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/assets/beechat-logo.png` | Copy | Add BeeChat "B" logo from uploads |
| `src/components/admin/AdminChatbot.tsx` | Modify | Update name to "BeeChat", logo, blue theme |
| `src/components/admin/ChatMessage.tsx` | Modify | Replace Bot icon with BeeChat logo, blue theme |
| `src/components/admin/ChatInput.tsx` | Modify | Update send button to blue gradient |
| `src/hooks/useAdminChat.tsx` | Modify | Update session key & welcome message |

---

## Visual Preview

**Before**:
```text
┌────────────────────────────────────────┐
│  [🗨️] সখী (Sakhi)             [icons] │
│       Hotel Management Assistant       │
│  ─────────────────────────────────────│
│  🤖 নমস্কার! 👋 আমি সখী...            │
└────────────────────────────────────────┘
```

**After**:
```text
┌────────────────────────────────────────┐
│  [B] BeeChat                   [icons] │
│       Hotel Management Assistant       │
│  ─────────────────────────────────────│
│  [B] Hello Sir! 👋 আমি BeeChat...     │
└────────────────────────────────────────┘
```

---

## Technical Notes

1. **Session Key Change**: Existing users will start with a fresh session after the update since the key changes from `sakhi_chat_session` to `beechat_session`. This is intentional for a clean rebrand.

2. **Logo Sizing**: The logo will be sized appropriately:
   - FAB button: `w-10 h-10`
   - Header: `w-8 h-8`
   - Message avatar: `w-6 h-6`

3. **Blue Theme Consistency**: All purple/indigo gradients will be updated to blue (`from-blue-500 to-blue-600`) to match the BeeChat logo color scheme.

