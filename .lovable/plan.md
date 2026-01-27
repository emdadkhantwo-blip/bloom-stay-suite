

# Fix: Chatbot Not Completing Bulk Operations for Formzed Hotel

## Problem Summary

The AI chatbot (BeeChat/Sakhi) is not completing multi-step bulk operations like creating multiple rooms, guests, and reservations. When the user asked to create 15 rooms, 10 guests, and 10 reservations with check-ins, the chatbot:
- Created 2 room types (Single Bed, Double Bed)
- Then stopped and waited for next user input instead of continuing

**Current data in Formzed Hotel:**
- 3 room types (Deluxe suite, Single Bed, Double Bed) - partially done
- 1 room (201) - incomplete
- 1 guest - incomplete
- 1 reservation - incomplete

## Root Causes

1. **Single-Turn Tool Execution**: The edge function executes tools from ONE AI response and returns. For bulk operations requiring multiple tool calls in sequence, this limits what can be done in one turn.

2. **Overly Cautious AI Behavior**: The system prompt instructs the AI to ask for confirmation, causing it to pause after each step rather than continuing autonomously.

3. **No Tool Loop**: After executing tools, the AI doesn't get another chance to call more tools if the task isn't complete.

## Solution

### 1. Add Bulk Operation Tools

Create specialized bulk operation tools that handle multiple items in a single call:

```typescript
// New tools to add
{
  name: "bulk_create_rooms",
  description: "Create multiple rooms at once",
  parameters: {
    rooms: [{
      room_number: string,
      room_type_id: string,
      floor: string
    }]
  }
}

{
  name: "bulk_create_guests",
  description: "Create multiple guest profiles at once",
  parameters: {
    guests: [{
      first_name: string,
      last_name: string,
      email?: string,
      phone?: string
    }]
  }
}

{
  name: "bulk_create_reservations_with_checkin",
  description: "Create reservations and check them in immediately",
  parameters: {
    reservations: [{
      guest_id: string,
      room_id: string,
      room_type_id: string,
      check_in_date: string,
      check_out_date: string,
      adults: number
    }]
  }
}
```

### 2. Add Iterative Tool Execution Loop

Modify the edge function to continue executing tools until the AI indicates the task is complete:

```typescript
// In serve() handler, add loop
let maxIterations = 5;
let iteration = 0;
let currentMessages = [...messages];

while (iteration < maxIterations) {
  const aiResponse = await callAIWithRetry(...);
  
  if (!aiResponse.tool_calls || aiResponse.tool_calls.length === 0) {
    // No more tools to call, return final response
    break;
  }
  
  // Execute tools
  const toolResults = await executeTools(...);
  
  // Add results to message history for next iteration
  currentMessages.push(assistantMessage);
  currentMessages.push(...toolResults);
  
  iteration++;
}
```

### 3. Update System Prompt for Bulk Operations

Add guidance for the AI to handle bulk operations more efficiently:

```text
BULK OPERATIONS:
When a user requests multiple items (e.g., "create 10 rooms"), you should:
1. Create ALL items in ONE response using multiple tool calls
2. Do NOT ask for confirmation for each item
3. Only confirm once at the end with a summary
4. For sequential operations (create rooms → create reservations → check in),
   complete as many steps as possible in each turn
```

### 4. Increase max_tokens for Complex Operations

The current `max_tokens: 4096` may be limiting for responses that need many tool calls. Consider increasing to 8192 for bulk operations.

## Implementation Files

| File | Changes |
|------|---------|
| `supabase/functions/admin-chat/index.ts` | Add bulk tools, iterative loop, update system prompt |

## Technical Details

### New Tool Handler: bulk_create_rooms

```typescript
case "bulk_create_rooms": {
  const results = [];
  for (const room of args.rooms) {
    const { data, error } = await supabase.from('rooms')
      .insert({
        tenant_id: tenantId,
        property_id: propertyId,
        room_number: room.room_number,
        room_type_id: room.room_type_id,
        floor: room.floor || null,
        status: 'vacant'
      })
      .select('*, room_types(name)')
      .single();
    
    if (!error) results.push(data);
  }
  return { success: true, data: results, count: results.length };
}
```

### Iterative Loop Implementation

```typescript
// Maximum iterations to prevent infinite loops
const MAX_TOOL_ITERATIONS = 5;
let messages = [...inputMessages];
let finalResponse = null;
let allToolCalls = [];
let allToolResults = [];

for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
  const aiResponse = await callAI(messages);
  const assistantMessage = aiResponse.choices[0].message;
  
  if (!assistantMessage.tool_calls?.length) {
    finalResponse = assistantMessage.content;
    break;
  }
  
  // Execute all tool calls
  const toolResults = await Promise.all(
    assistantMessage.tool_calls.map(tc => 
      executeTool(tc.function.name, JSON.parse(tc.function.arguments), ...)
    )
  );
  
  allToolCalls.push(...assistantMessage.tool_calls);
  allToolResults.push(...toolResults);
  
  // Add to message history for next iteration
  messages.push(assistantMessage);
  messages.push(...toolResults.map((r, i) => ({
    role: "tool",
    tool_call_id: assistantMessage.tool_calls[i].id,
    content: JSON.stringify(r)
  })));
}
```

### Updated System Prompt Section

```text
BULK OPERATIONS BEHAVIOR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
When the user requests multiple items be created, updated, or deleted:

1. USE BULK TOOLS when available:
   - bulk_create_rooms for creating multiple rooms
   - bulk_create_guests for creating multiple guests
   - bulk_create_reservations_with_checkin for mock data with check-ins

2. FOR SEQUENTIAL TASKS:
   If you need to create guests, then reservations, then check-ins:
   - Call ALL guest creation tools first
   - Then call ALL reservation tools
   - Then call ALL check-in tools
   - Do this in ONE response with multiple tool calls

3. NO PARTIAL EXECUTION:
   - Complete the ENTIRE request in one turn when possible
   - Do NOT ask for confirmation between steps
   - Only summarize at the END after all operations complete

4. MOCK DATA GENERATION:
   When asked to create mock/test/sample data, generate realistic:
   - Bengali names for local hotels
   - +880 phone numbers
   - @gmail.com emails
   - Realistic check-in/out dates starting from today
```

## Testing

After implementation, test with Formzed Hotel:

1. Ask: "Create 5 rooms for each room type"
2. Ask: "Create 10 guest profiles with mock data"
3. Ask: "Create 10 reservations and check them all in"

Expected: Each request should complete fully in one response.

## Timeline

1. Add bulk operation tools to edge function
2. Implement iterative tool execution loop
3. Update system prompt with bulk operation guidance
4. Deploy and test with Formzed Hotel
5. Verify all requested data is created

