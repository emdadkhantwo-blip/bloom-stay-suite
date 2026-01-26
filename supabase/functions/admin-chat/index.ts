import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to generate readable summaries for tool results
function generateToolSummary(toolName: string, args: any, result: any): string {
  if (!result.success) {
    return `❌ Failed: ${result.error}`;
  }

  const data = result.data;
  
  switch (toolName) {
    case "create_reservation":
      return `✅ Created reservation **${data.confirmation_number}** for ${data.guests?.first_name || ''} ${data.guests?.last_name || ''}\n- Check-in: ${args.check_in_date}\n- Check-out: ${args.check_out_date}\n- ${data.nights} nights @ ৳${data.rate_per_night}/night\n- Total: ৳${data.total_amount}`;
    
    case "check_in_guest":
      return `✅ Successfully checked in **${data.guests?.first_name || ''} ${data.guests?.last_name || ''}**\n- Confirmation: ${data.confirmation_number}\n- Folio: ${data.folio_number}`;
    
    case "check_out_guest":
      return `✅ Successfully checked out **${data.guests?.first_name || ''} ${data.guests?.last_name || ''}**\n- Confirmation: ${data.confirmation_number}`;
    
    case "create_guest":
      return `✅ Created guest profile for **${data.first_name} ${data.last_name}**${data.is_vip ? ' ⭐VIP' : ''}\n- ID: ${data.id}`;
    
    case "create_room":
      return `✅ Created room **${data.room_number}** (${data.room_types?.name || 'N/A'})`;
    
    case "update_room_status":
      return `✅ Updated room status to **${data.status}**`;
    
    case "create_room_type":
      return `✅ Created room type **${data.name}** (${data.code})\n- Rate: ৳${data.base_rate}/night\n- Max occupancy: ${data.max_occupancy}`;
    
    case "create_housekeeping_task":
      return `✅ Created ${data.task_type} task for room **${data.rooms?.room_number || 'N/A'}**\n- Priority: ${data.priority}\n- Status: ${data.status}`;
    
    case "create_maintenance_ticket":
      return `✅ Created maintenance ticket: **${data.title}**${data.rooms ? `\n- Room: ${data.rooms.room_number}` : ''}\n- Priority: ${data.priority}`;
    
    case "add_folio_charge":
      return `✅ Added charge to folio\n- ${data.description}: ৳${data.total_price}`;
    
    case "record_payment":
      return `✅ Recorded payment of **৳${data.amount}** via ${data.payment_method.replace('_', ' ')}`;
    
    case "run_night_audit":
      return `✅ Night audit completed for ${data.business_date}\n- Occupancy: ${Math.round(data.occupancy_rate)}%\n- Rooms charged: ${data.rooms_charged}`;
    
    case "create_pos_outlet":
      return `✅ Created POS outlet **${data.name}** (${data.code})\n- Type: ${data.type}`;
    
    case "create_pos_order":
      return `✅ Created order **${data.order_number}**\n- Items: ${data.items?.length || 0}\n- Total: ৳${data.total_amount}`;
    
    case "create_corporate_account":
      return `✅ Created corporate account **${data.company_name}** (${data.account_code})`;
    
    case "get_dashboard_stats":
      return `📊 **Current Status:**\n- Occupancy: ${data.occupancy_rate}% (${data.occupied_rooms}/${data.total_rooms} rooms)\n- Today's arrivals: ${data.todays_arrivals}\n- Today's departures: ${data.todays_departures}\n- In-house guests: ${data.in_house_guests}`;
    
    case "search_guests":
      if (!data || data.length === 0) return "No guests found matching your search.";
      return `Found ${data.length} guest(s):\n${data.slice(0, 5).map((g: any) => `- ${g.first_name} ${g.last_name}${g.is_vip ? ' ⭐' : ''} (${g.email || g.phone || 'No contact'})`).join('\n')}`;
    
    case "get_rooms":
      if (!data || data.length === 0) return "No rooms found.";
      const roomsByStatus = data.reduce((acc: any, r: any) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {});
      return `📊 **${data.length} rooms:**\n${Object.entries(roomsByStatus).map(([s, c]) => `- ${s}: ${c}`).join('\n')}`;
    
    case "get_room_types":
      if (!data || data.length === 0) return "No room types configured.";
      return `Available room types:\n${data.map((rt: any) => `- **${rt.name}** (${rt.code}): ৳${rt.base_rate}/night, max ${rt.max_occupancy} guests`).join('\n')}`;
    
    case "get_todays_arrivals":
      if (!data || data.length === 0) return "No arrivals scheduled for today.";
      return `📥 **${data.length} arrival(s) today:**\n${data.map((r: any) => `- ${r.guests?.first_name} ${r.guests?.last_name}${r.guests?.is_vip ? ' ⭐' : ''} (${r.confirmation_number})`).join('\n')}`;
    
    case "get_todays_departures":
      if (!data || data.length === 0) return "No departures scheduled for today.";
      return `📤 **${data.length} departure(s) today:**\n${data.map((r: any) => `- ${r.guests?.first_name} ${r.guests?.last_name} (${r.confirmation_number})`).join('\n')}`;
    
    case "get_housekeeping_tasks":
      if (!data || data.length === 0) return "No housekeeping tasks found.";
      return `🧹 **${data.length} task(s):**\n${data.slice(0, 5).map((t: any) => `- Room ${t.rooms?.room_number}: ${t.task_type} (${t.status})`).join('\n')}`;
    
    case "get_maintenance_tickets":
      if (!data || data.length === 0) return "No maintenance tickets found.";
      return `🔧 **${data.length} ticket(s):**\n${data.slice(0, 5).map((t: any) => `- ${t.title} (${t.status})${t.rooms ? ` - Room ${t.rooms.room_number}` : ''}`).join('\n')}`;
    
    case "get_staff_list":
      if (!data || data.length === 0) return "No staff members found.";
      return `👥 **${data.length} staff member(s):**\n${data.map((s: any) => `- ${s.full_name} (${s.user_roles?.map((r: any) => r.role).join(', ') || 'No role'})`).join('\n')}`;
    
    case "search_reservations":
      if (!data || data.length === 0) return "No reservations found.";
      return `📋 **${data.length} reservation(s):**\n${data.slice(0, 5).map((r: any) => `- ${r.confirmation_number}: ${r.guests?.first_name} ${r.guests?.last_name} (${r.status})`).join('\n')}`;
    
    case "get_folios":
      if (!data || data.length === 0) return "No folios found.";
      return `💳 **${data.length} folio(s):**\n${data.slice(0, 5).map((f: any) => `- ${f.folio_number}: ${f.guests?.first_name} ${f.guests?.last_name} - ৳${f.balance} balance`).join('\n')}`;
    
    case "get_corporate_accounts":
      if (!data || data.length === 0) return "No corporate accounts found.";
      return `🏢 **${data.length} account(s):**\n${data.map((a: any) => `- ${a.company_name} (${a.account_code}) - ${a.discount_percentage}% discount`).join('\n')}`;
    
    default:
      return `✅ Action completed successfully.`;
  }
}

// Fetch comprehensive hotel context
async function getHotelContext(supabase: any, tenantId: string): Promise<string> {
  try {
    // Fetch all rooms with room types
    const { data: rooms } = await supabase
      .from('rooms')
      .select('room_number, floor, status, room_types(name, code, base_rate)')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('room_number');
    
    // Fetch active staff
    const { data: staff } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, user_roles(role)')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    
    // Fetch recent guests
    const { data: guests } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email, phone, is_vip')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false })
      .limit(100);
    
    // Fetch room types
    const { data: roomTypes } = await supabase
      .from('room_types')
      .select('id, name, code, base_rate, max_occupancy')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    
    // Fetch today's key info
    const today = new Date().toISOString().split('T')[0];
    const { data: arrivals } = await supabase
      .from('reservations')
      .select('confirmation_number, guests(first_name, last_name, is_vip)')
      .eq('tenant_id', tenantId)
      .eq('check_in_date', today)
      .eq('status', 'confirmed');
    
    const { data: departures } = await supabase
      .from('reservations')
      .select('confirmation_number, guests(first_name, last_name)')
      .eq('tenant_id', tenantId)
      .eq('check_out_date', today)
      .eq('status', 'checked_in');
    
    const { data: inHouse } = await supabase
      .from('reservations')
      .select('confirmation_number, guests(first_name, last_name), reservation_rooms(room_id, rooms(room_number))')
      .eq('tenant_id', tenantId)
      .eq('status', 'checked_in');

    // Build context string
    let context = `\n\n=== CURRENT HOTEL KNOWLEDGE ===\n\n`;
    
    context += `📅 TODAY: ${today}\n\n`;
    
    // Room Types
    context += `🏷️ ROOM TYPES (${roomTypes?.length || 0}):\n`;
    if (roomTypes && roomTypes.length > 0) {
      roomTypes.forEach((rt: any) => {
        context += `  - ${rt.name} (${rt.code}): ৳${rt.base_rate}/night, max ${rt.max_occupancy} guests, ID: ${rt.id}\n`;
      });
    } else {
      context += `  No room types configured\n`;
    }
    
    // Rooms
    context += `\n🚪 ROOMS (${rooms?.length || 0}):\n`;
    if (rooms && rooms.length > 0) {
      const roomsByStatus: any = {};
      rooms.forEach((r: any) => {
        roomsByStatus[r.status] = roomsByStatus[r.status] || [];
        roomsByStatus[r.status].push(r);
      });
      
      Object.keys(roomsByStatus).forEach(status => {
        context += `  ${status.toUpperCase()} (${roomsByStatus[status].length}): `;
        context += roomsByStatus[status].map((r: any) => `${r.room_number} (${r.room_types?.name || 'N/A'})`).join(', ');
        context += '\n';
      });
    } else {
      context += `  No rooms configured\n`;
    }
    
    // Staff
    context += `\n👥 STAFF (${staff?.length || 0}):\n`;
    if (staff && staff.length > 0) {
      staff.forEach((s: any) => {
        const roles = s.user_roles?.map((r: any) => r.role).join(', ') || 'No role';
        context += `  - ${s.full_name} [${roles}]: ${s.email || 'No email'}, ID: ${s.id}\n`;
      });
    } else {
      context += `  No staff configured\n`;
    }
    
    // Recent Guests
    context += `\n👤 RECENT GUESTS (showing ${Math.min(guests?.length || 0, 30)}):\n`;
    if (guests && guests.length > 0) {
      guests.slice(0, 30).forEach((g: any) => {
        context += `  - ${g.first_name} ${g.last_name}${g.is_vip ? ' ⭐VIP' : ''}: ${g.email || g.phone || 'No contact'}, ID: ${g.id}\n`;
      });
    } else {
      context += `  No guests in database\n`;
    }
    
    // Today's Activity
    context += `\n📥 TODAY'S ARRIVALS (${arrivals?.length || 0}):\n`;
    if (arrivals && arrivals.length > 0) {
      arrivals.forEach((a: any) => {
        context += `  - ${a.guests?.first_name} ${a.guests?.last_name}${a.guests?.is_vip ? ' ⭐' : ''}: ${a.confirmation_number}\n`;
      });
    } else {
      context += `  No arrivals today\n`;
    }
    
    context += `\n📤 TODAY'S DEPARTURES (${departures?.length || 0}):\n`;
    if (departures && departures.length > 0) {
      departures.forEach((d: any) => {
        context += `  - ${d.guests?.first_name} ${d.guests?.last_name}: ${d.confirmation_number}\n`;
      });
    } else {
      context += `  No departures today\n`;
    }
    
    context += `\n🏨 IN-HOUSE GUESTS (${inHouse?.length || 0}):\n`;
    if (inHouse && inHouse.length > 0) {
      inHouse.forEach((ih: any) => {
        const roomNum = ih.reservation_rooms?.[0]?.rooms?.room_number || 'Unassigned';
        context += `  - ${ih.guests?.first_name} ${ih.guests?.last_name} in Room ${roomNum}: ${ih.confirmation_number}\n`;
      });
    } else {
      context += `  No in-house guests\n`;
    }
    
    context += `\n=== END HOTEL KNOWLEDGE ===\n`;
    
    return context;
  } catch (error) {
    console.error('Error fetching hotel context:', error);
    return '\n\n[Could not fetch hotel context]\n';
  }
}

// System prompt for the chatbot
const baseSystemPrompt = `You are "Sakhi" (সখী), a friendly and efficient hotel management assistant for BloomStay PMS.

PERSONALITY:
- Warm, professional, and helpful
- Use simple, clear language
- Occasionally use Bengali greetings like "নমস্কার" (Nomoshkar), "ধন্যবাদ" (Dhonnobad), "আচ্ছা" (Accha)
- Always confirm actions before executing them when it involves creating/modifying data
- Provide helpful suggestions proactively

═══════════════════════════════════════════════════════════════════════════════
CRITICAL ANTI-HALLUCINATION RULES - YOU MUST FOLLOW THESE EXACTLY:
═══════════════════════════════════════════════════════════════════════════════

1. **NEVER claim to have performed ANY action without ACTUALLY calling a tool**
   - If a user asks you to CREATE something, you MUST call the appropriate tool
   - If a user asks you to UPDATE something, you MUST call the appropriate tool
   - If a user asks you to DELETE something, you MUST call the appropriate tool
   - You CANNOT create, update, or delete ANYTHING without calling a tool
   - Database changes ONLY happen when you call tools - there is NO other way

2. **MANDATORY TOOL CALLS FOR ACTIONS:**
   - "Create a room" → MUST call create_room(room_number, room_type_id)
   - "Create reservation" → MUST call create_reservation(guest_id, check_in_date, check_out_date, room_type_id, adults)
   - "Create guest" → MUST call create_guest(first_name, last_name)
   - "Check in guest" → MUST call check_in_guest(reservation_id)
   - "Check out guest" → MUST call check_out_guest(reservation_id)
   - "Create room type" → MUST call create_room_type(name, code, base_rate, max_occupancy)
   - "Add charge" → MUST call add_folio_charge(folio_id, item_type, description, amount)
   - "Record payment" → MUST call record_payment(folio_id, amount, payment_method)
   - "Create housekeeping task" → MUST call create_housekeeping_task(room_id, task_type)
   - "Create maintenance ticket" → MUST call create_maintenance_ticket(title, description)

3. **BEFORE creating/updating anything:**
   - First, gather ALL required information from the user
   - Ask clarifying questions if any required field is missing
   - For create_room: you need room_number AND room_type_id (get from context or ask)
   - For create_reservation: you need guest_id, check_in_date, check_out_date, room_type_id, adults

4. **AFTER attempting an action:**
   - Only report SUCCESS if the tool returned success: true
   - If tool returned success: false, report the error and suggest alternatives
   - Include specific details from the tool response (confirmation numbers, IDs, amounts)

5. **ABSOLUTELY FORBIDDEN:**
   - Saying "I have created..." without a tool call
   - Fabricating confirmation numbers, IDs, or any data
   - Pretending an action succeeded when no tool was called
   - Making up room numbers, guest names, or any details not from context

═══════════════════════════════════════════════════════════════════════════════

CAPABILITIES - What you CAN do:
- Creating and managing reservations (create_reservation, search_reservations, update_reservation_status)
- Guest management (create_guest, search_guests, check_in_guest, check_out_guest)
- Room management (create_room, get_rooms, update_room_status)
- Room types (create_room_type, get_room_types)
- Corporate accounts (create_corporate_account, get_corporate_accounts)
- Housekeeping tasks (create_housekeeping_task, get_housekeeping_tasks)
- Maintenance tickets (create_maintenance_ticket, get_maintenance_tickets)
- Folios and payments (add_folio_charge, record_payment, get_folios)
- Night audit (run_night_audit, get_night_audit_status)
- POS operations (create_pos_outlet, create_pos_order, get_pos_orders)
- Staff management (get_staff_list)
- Reports and statistics (get_dashboard_stats, get_occupancy_report)

RESPONSE STYLE:
- After executing ANY tool/action, provide a clear summary with specifics
- Use bullet points for multiple items
- Format amounts with ৳ for BDT
- Use markdown formatting for clarity

IMPORTANT RULES:
- Always verify guest/room details before major actions
- Ask for confirmation on destructive operations
- If unsure about any parameter, ASK FIRST before calling any tool
- Never expose sensitive data unnecessarily
- Use the current date for relative dates like "today"

CONTEXT:
- Current date: ${new Date().toISOString().split('T')[0]}
- You are helping hotel administrators manage their properties efficiently`;

// Tool definitions for administrative actions
const tools = [
  {
    type: "function",
    function: {
      name: "get_dashboard_stats",
      description: "Get current dashboard statistics including occupancy, arrivals, departures, and revenue",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_guests",
      description: "Search for guests by name, email, or phone number",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (name, email, or phone)" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_guest",
      description: "Create a new guest profile",
      parameters: {
        type: "object",
        properties: {
          first_name: { type: "string", description: "Guest's first name" },
          last_name: { type: "string", description: "Guest's last name" },
          email: { type: "string", description: "Guest's email address" },
          phone: { type: "string", description: "Guest's phone number" },
          nationality: { type: "string", description: "Guest's nationality" },
          id_type: { type: "string", description: "ID type (passport, nid, driving_license)" },
          id_number: { type: "string", description: "ID number" },
          is_vip: { type: "boolean", description: "Whether the guest is VIP" }
        },
        required: ["first_name", "last_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_room_types",
      description: "Get available room types with their rates and details",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_room_type",
      description: "Create a new room type category",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Room type name (e.g., Deluxe, Suite)" },
          code: { type: "string", description: "Short code (e.g., DLX, STE)" },
          base_rate: { type: "number", description: "Base rate per night in BDT" },
          max_occupancy: { type: "number", description: "Maximum number of guests" },
          description: { type: "string", description: "Room type description" },
          amenities: { type: "array", items: { type: "string" }, description: "List of amenities" }
        },
        required: ["name", "code", "base_rate", "max_occupancy"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_rooms",
      description: "Get list of rooms with their current status",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["vacant", "occupied", "dirty", "maintenance", "out_of_order"], description: "Filter by room status" },
          room_type_id: { type: "string", description: "Filter by room type ID" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_room",
      description: "Create a new room in the property",
      parameters: {
        type: "object",
        properties: {
          room_number: { type: "string", description: "Room number (e.g., 101, 202)" },
          room_type_id: { type: "string", description: "Room type UUID" },
          floor: { type: "string", description: "Floor number or name" },
          notes: { type: "string", description: "Additional notes about the room" }
        },
        required: ["room_number", "room_type_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_room_status",
      description: "Update the status of a room",
      parameters: {
        type: "object",
        properties: {
          room_id: { type: "string", description: "Room UUID" },
          status: { type: "string", enum: ["vacant", "occupied", "dirty", "maintenance", "out_of_order"], description: "New room status" }
        },
        required: ["room_id", "status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_reservations",
      description: "Search for reservations by confirmation number, guest name, or date range",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Confirmation number or guest name" },
          check_in_date: { type: "string", description: "Check-in date (YYYY-MM-DD)" },
          status: { type: "string", enum: ["confirmed", "checked_in", "checked_out", "cancelled", "no_show"], description: "Reservation status filter" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_reservation",
      description: "Create a new hotel reservation",
      parameters: {
        type: "object",
        properties: {
          guest_id: { type: "string", description: "Guest UUID" },
          check_in_date: { type: "string", description: "Check-in date (YYYY-MM-DD)" },
          check_out_date: { type: "string", description: "Check-out date (YYYY-MM-DD)" },
          room_type_id: { type: "string", description: "Room type UUID" },
          adults: { type: "number", description: "Number of adults" },
          children: { type: "number", description: "Number of children" },
          source: { type: "string", enum: ["direct", "phone", "walk_in", "website", "ota_booking", "ota_expedia", "ota_agoda", "corporate", "travel_agent", "other"], description: "Booking source" },
          special_requests: { type: "string", description: "Special requests from guest" },
          rate_per_night: { type: "number", description: "Rate per night (defaults to room type base rate)" }
        },
        required: ["guest_id", "check_in_date", "check_out_date", "room_type_id", "adults"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_in_guest",
      description: "Check in a guest with a confirmed reservation",
      parameters: {
        type: "object",
        properties: {
          reservation_id: { type: "string", description: "Reservation UUID" },
          room_id: { type: "string", description: "Specific room to assign (optional)" }
        },
        required: ["reservation_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_out_guest",
      description: "Check out a guest and process their departure",
      parameters: {
        type: "object",
        properties: {
          reservation_id: { type: "string", description: "Reservation UUID" }
        },
        required: ["reservation_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_todays_arrivals",
      description: "Get list of guests arriving today",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_todays_departures",
      description: "Get list of guests departing today",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_corporate_account",
      description: "Create a new corporate account",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string", description: "Company name" },
          account_code: { type: "string", description: "Unique account code" },
          contact_name: { type: "string", description: "Primary contact name" },
          contact_email: { type: "string", description: "Contact email" },
          contact_phone: { type: "string", description: "Contact phone" },
          discount_percentage: { type: "number", description: "Discount percentage" },
          credit_limit: { type: "number", description: "Credit limit in BDT" },
          payment_terms: { type: "string", description: "Payment terms (e.g., net30)" }
        },
        required: ["company_name", "account_code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_corporate_accounts",
      description: "Get list of corporate accounts",
      parameters: {
        type: "object",
        properties: {
          is_active: { type: "boolean", description: "Filter by active status" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_housekeeping_task",
      description: "Create a housekeeping task for a room",
      parameters: {
        type: "object",
        properties: {
          room_id: { type: "string", description: "Room UUID" },
          task_type: { type: "string", enum: ["cleaning", "turndown", "deep_cleaning", "inspection"], description: "Type of housekeeping task" },
          priority: { type: "number", description: "Priority level (1-5, 1 being highest)" },
          notes: { type: "string", description: "Additional notes" },
          assigned_to: { type: "string", description: "Staff member UUID to assign to" }
        },
        required: ["room_id", "task_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_housekeeping_tasks",
      description: "Get housekeeping tasks list",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "in_progress", "completed"], description: "Filter by status" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_maintenance_ticket",
      description: "Create a maintenance ticket for an issue",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Issue title" },
          description: { type: "string", description: "Detailed description of the issue" },
          room_id: { type: "string", description: "Room UUID (if room-specific)" },
          priority: { type: "number", description: "Priority level (1-5, 1 being highest)" },
          assigned_to: { type: "string", description: "Maintenance staff UUID" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_maintenance_tickets",
      description: "Get maintenance tickets list",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["open", "in_progress", "resolved"], description: "Filter by status" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_folios",
      description: "Get folios list for guests",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["open", "closed"], description: "Filter by status" },
          guest_id: { type: "string", description: "Filter by guest ID" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_folio_charge",
      description: "Add a charge to a guest folio",
      parameters: {
        type: "object",
        properties: {
          folio_id: { type: "string", description: "Folio UUID" },
          item_type: { type: "string", enum: ["room_charge", "food_beverage", "laundry", "minibar", "spa", "parking", "telephone", "internet", "miscellaneous"], description: "Type of charge" },
          description: { type: "string", description: "Charge description" },
          amount: { type: "number", description: "Amount in BDT" },
          quantity: { type: "number", description: "Quantity (default 1)" }
        },
        required: ["folio_id", "item_type", "description", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "record_payment",
      description: "Record a payment on a folio",
      parameters: {
        type: "object",
        properties: {
          folio_id: { type: "string", description: "Folio UUID" },
          amount: { type: "number", description: "Payment amount in BDT" },
          payment_method: { type: "string", enum: ["cash", "credit_card", "debit_card", "bank_transfer", "other"], description: "Payment method" },
          reference_number: { type: "string", description: "Reference/transaction number" },
          notes: { type: "string", description: "Payment notes" }
        },
        required: ["folio_id", "amount", "payment_method"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_night_audit_status",
      description: "Get the status of night audit for today",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_night_audit",
      description: "Start the night audit process",
      parameters: {
        type: "object",
        properties: {
          notes: { type: "string", description: "Notes for the audit" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_pos_outlets",
      description: "Get list of POS outlets (restaurants, bars, etc.)",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_pos_outlet",
      description: "Create a new POS outlet",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Outlet name" },
          code: { type: "string", description: "Short code (e.g., REST, BAR)" },
          type: { type: "string", enum: ["restaurant", "bar", "cafe", "room_service", "pool_bar"], description: "Outlet type" }
        },
        required: ["name", "code", "type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_pos_order",
      description: "Create a new POS order",
      parameters: {
        type: "object",
        properties: {
          outlet_id: { type: "string", description: "Outlet UUID" },
          table_number: { type: "string", description: "Table number" },
          guest_id: { type: "string", description: "Guest UUID (optional for in-house guests)" },
          room_id: { type: "string", description: "Room UUID for room service" },
          items: { 
            type: "array", 
            items: {
              type: "object",
              properties: {
                item_name: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" }
              }
            },
            description: "Order items" 
          },
          notes: { type: "string", description: "Order notes" }
        },
        required: ["outlet_id", "items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_pos_orders",
      description: "Get POS orders",
      parameters: {
        type: "object",
        properties: {
          outlet_id: { type: "string", description: "Filter by outlet" },
          status: { type: "string", enum: ["pending", "preparing", "ready", "served", "cancelled", "posted"], description: "Filter by status" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_staff_list",
      description: "Get list of staff members with their roles",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["owner", "manager", "front_desk", "accountant", "housekeeping", "maintenance", "kitchen", "waiter", "night_auditor"], description: "Filter by role" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_occupancy_report",
      description: "Get occupancy report for a date range",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
          end_date: { type: "string", description: "End date (YYYY-MM-DD)" }
        },
        required: ["start_date", "end_date"]
      }
    }
  }
];

// Tool execution handlers
async function executeTool(toolName: string, args: any, supabase: any, tenantId: string, propertyId: string, userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    switch (toolName) {
      case "get_dashboard_stats": {
        const today = new Date().toISOString().split('T')[0];
        
        // Get rooms stats
        const { data: rooms } = await supabase.from('rooms').select('status').eq('tenant_id', tenantId);
        const totalRooms = rooms?.length || 0;
        const occupiedRooms = rooms?.filter((r: any) => r.status === 'occupied').length || 0;
        const vacantRooms = rooms?.filter((r: any) => r.status === 'vacant').length || 0;
        
        // Get today's arrivals
        const { data: arrivals } = await supabase.from('reservations')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('check_in_date', today)
          .eq('status', 'confirmed');
        
        // Get today's departures
        const { data: departures } = await supabase.from('reservations')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('check_out_date', today)
          .eq('status', 'checked_in');
        
        // Get in-house guests
        const { data: inHouse } = await supabase.from('reservations')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('status', 'checked_in');
        
        return {
          success: true,
          data: {
            total_rooms: totalRooms,
            occupied_rooms: occupiedRooms,
            vacant_rooms: vacantRooms,
            occupancy_rate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
            todays_arrivals: arrivals?.length || 0,
            todays_departures: departures?.length || 0,
            in_house_guests: inHouse?.length || 0
          }
        };
      }

      case "search_guests": {
        const { query } = args;
        const { data, error } = await supabase.from('guests')
          .select('*')
          .eq('tenant_id', tenantId)
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(10);
        
        if (error) throw error;
        return { success: true, data };
      }

      case "create_guest": {
        const { data, error } = await supabase.from('guests')
          .insert({
            tenant_id: tenantId,
            first_name: args.first_name,
            last_name: args.last_name,
            email: args.email || null,
            phone: args.phone || null,
            nationality: args.nationality || null,
            id_type: args.id_type || null,
            id_number: args.id_number || null,
            is_vip: args.is_vip || false
          })
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "get_room_types": {
        const { data, error } = await supabase.from('room_types')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('base_rate');
        
        if (error) throw error;
        return { success: true, data };
      }

      case "create_room_type": {
        const { data, error } = await supabase.from('room_types')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            name: args.name,
            code: args.code.toUpperCase(),
            base_rate: args.base_rate,
            max_occupancy: args.max_occupancy,
            description: args.description || null,
            amenities: args.amenities || []
          })
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "get_rooms": {
        let query = supabase.from('rooms')
          .select('*, room_types(name, code)')
          .eq('tenant_id', tenantId);
        
        if (args.status) query = query.eq('status', args.status);
        if (args.room_type_id) query = query.eq('room_type_id', args.room_type_id);
        
        const { data, error } = await query.order('room_number');
        if (error) throw error;
        return { success: true, data };
      }

      case "create_room": {
        const { data, error } = await supabase.from('rooms')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            room_number: args.room_number,
            room_type_id: args.room_type_id,
            floor: args.floor || null,
            notes: args.notes || null,
            status: 'vacant'
          })
          .select('*, room_types(name)')
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "update_room_status": {
        const { data, error } = await supabase.from('rooms')
          .update({ status: args.status })
          .eq('id', args.room_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "search_reservations": {
        let query = supabase.from('reservations')
          .select('*, guests(first_name, last_name, email, phone)')
          .eq('tenant_id', tenantId);
        
        if (args.query) {
          query = query.or(`confirmation_number.ilike.%${args.query}%`);
        }
        if (args.check_in_date) {
          query = query.eq('check_in_date', args.check_in_date);
        }
        if (args.status) {
          query = query.eq('status', args.status);
        }
        
        const { data, error } = await query.order('check_in_date', { ascending: false }).limit(20);
        if (error) throw error;
        return { success: true, data };
      }

      case "create_reservation": {
        // Get room type for rate
        const { data: roomType } = await supabase.from('room_types')
          .select('base_rate, code')
          .eq('id', args.room_type_id)
          .single();
        
        // Get property code
        const { data: property } = await supabase.from('properties')
          .select('code')
          .eq('id', propertyId)
          .single();
        
        const rate = args.rate_per_night || roomType?.base_rate || 0;
        const checkIn = new Date(args.check_in_date);
        const checkOut = new Date(args.check_out_date);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const totalAmount = rate * nights;
        
        // Generate confirmation number
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const confirmationNumber = `${property?.code || 'RES'}-${dateStr}-${randomNum}`;
        
        const { data: reservation, error: resError } = await supabase.from('reservations')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            guest_id: args.guest_id,
            check_in_date: args.check_in_date,
            check_out_date: args.check_out_date,
            adults: args.adults,
            children: args.children || 0,
            source: args.source || 'direct',
            special_requests: args.special_requests || null,
            total_amount: totalAmount,
            confirmation_number: confirmationNumber,
            created_by: userId
          })
          .select('*, guests(first_name, last_name)')
          .single();
        
        if (resError) throw resError;
        
        // Create reservation room entry
        await supabase.from('reservation_rooms')
          .insert({
            tenant_id: tenantId,
            reservation_id: reservation.id,
            room_type_id: args.room_type_id,
            rate_per_night: rate,
            adults: args.adults,
            children: args.children || 0
          });
        
        return { success: true, data: { ...reservation, nights, rate_per_night: rate } };
      }

      case "check_in_guest": {
        const { data: reservation, error: fetchError } = await supabase.from('reservations')
          .select('*, guests(first_name, last_name)')
          .eq('id', args.reservation_id)
          .single();
        
        if (fetchError) throw fetchError;
        if (reservation.status !== 'confirmed') {
          throw new Error(`Cannot check in: Reservation status is ${reservation.status}`);
        }
        
        // Update reservation status
        const { error: updateError } = await supabase.from('reservations')
          .update({ 
            status: 'checked_in',
            actual_check_in: new Date().toISOString()
          })
          .eq('id', args.reservation_id);
        
        if (updateError) throw updateError;
        
        // If room assigned, update room status
        if (args.room_id) {
          await supabase.from('rooms')
            .update({ status: 'occupied' })
            .eq('id', args.room_id);
          
          await supabase.from('reservation_rooms')
            .update({ room_id: args.room_id })
            .eq('reservation_id', args.reservation_id);
        }
        
        // Create folio
        const folioNumber = `F-${reservation.confirmation_number}`;
        await supabase.from('folios')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            guest_id: reservation.guest_id,
            reservation_id: reservation.id,
            folio_number: folioNumber
          });
        
        return { 
          success: true, 
          data: { 
            ...reservation, 
            status: 'checked_in',
            folio_number: folioNumber
          } 
        };
      }

      case "check_out_guest": {
        const { data: reservation, error: fetchError } = await supabase.from('reservations')
          .select('*, guests(first_name, last_name), reservation_rooms(room_id)')
          .eq('id', args.reservation_id)
          .single();
        
        if (fetchError) throw fetchError;
        if (reservation.status !== 'checked_in') {
          throw new Error(`Cannot check out: Reservation status is ${reservation.status}`);
        }
        
        // Update reservation
        const { error: updateError } = await supabase.from('reservations')
          .update({ 
            status: 'checked_out',
            actual_check_out: new Date().toISOString()
          })
          .eq('id', args.reservation_id);
        
        if (updateError) throw updateError;
        
        // Update room status to dirty
        if (reservation.reservation_rooms?.[0]?.room_id) {
          await supabase.from('rooms')
            .update({ status: 'dirty' })
            .eq('id', reservation.reservation_rooms[0].room_id);
        }
        
        // Close folio
        await supabase.from('folios')
          .update({ status: 'closed', closed_at: new Date().toISOString() })
          .eq('reservation_id', args.reservation_id);
        
        return { success: true, data: { ...reservation, status: 'checked_out' } };
      }

      case "get_todays_arrivals": {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('reservations')
          .select('*, guests(first_name, last_name, email, phone, is_vip)')
          .eq('tenant_id', tenantId)
          .eq('check_in_date', today)
          .eq('status', 'confirmed')
          .order('created_at');
        
        if (error) throw error;
        return { success: true, data };
      }

      case "get_todays_departures": {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('reservations')
          .select('*, guests(first_name, last_name, email, phone)')
          .eq('tenant_id', tenantId)
          .eq('check_out_date', today)
          .eq('status', 'checked_in')
          .order('created_at');
        
        if (error) throw error;
        return { success: true, data };
      }

      case "create_corporate_account": {
        const { data, error } = await supabase.from('corporate_accounts')
          .insert({
            tenant_id: tenantId,
            company_name: args.company_name,
            account_code: args.account_code.toUpperCase(),
            contact_name: args.contact_name || null,
            contact_email: args.contact_email || null,
            contact_phone: args.contact_phone || null,
            discount_percentage: args.discount_percentage || 0,
            credit_limit: args.credit_limit || 0,
            payment_terms: args.payment_terms || 'net30'
          })
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "get_corporate_accounts": {
        let query = supabase.from('corporate_accounts')
          .select('*')
          .eq('tenant_id', tenantId);
        
        if (args.is_active !== undefined) {
          query = query.eq('is_active', args.is_active);
        }
        
        const { data, error } = await query.order('company_name');
        if (error) throw error;
        return { success: true, data };
      }

      case "create_housekeeping_task": {
        const { data, error } = await supabase.from('housekeeping_tasks')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            room_id: args.room_id,
            task_type: args.task_type,
            priority: args.priority || 3,
            notes: args.notes || null,
            assigned_to: args.assigned_to || null,
            status: 'pending'
          })
          .select('*, rooms(room_number)')
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "get_housekeeping_tasks": {
        let query = supabase.from('housekeeping_tasks')
          .select('*, rooms(room_number), profiles:assigned_to(full_name)')
          .eq('tenant_id', tenantId);
        
        if (args.status) {
          query = query.eq('status', args.status);
        }
        
        const { data, error } = await query.order('priority').order('created_at');
        if (error) throw error;
        return { success: true, data };
      }

      case "create_maintenance_ticket": {
        const { data, error } = await supabase.from('maintenance_tickets')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            title: args.title,
            description: args.description || null,
            room_id: args.room_id || null,
            priority: args.priority || 3,
            assigned_to: args.assigned_to || null,
            reported_by: userId,
            status: 'open'
          })
          .select('*, rooms(room_number)')
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "get_maintenance_tickets": {
        let query = supabase.from('maintenance_tickets')
          .select('*, rooms(room_number), profiles:assigned_to(full_name)')
          .eq('tenant_id', tenantId);
        
        if (args.status) {
          query = query.eq('status', args.status);
        }
        
        const { data, error } = await query.order('priority').order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, data };
      }

      case "get_folios": {
        let query = supabase.from('folios')
          .select('*, guests(first_name, last_name)')
          .eq('tenant_id', tenantId);
        
        if (args.status) query = query.eq('status', args.status);
        if (args.guest_id) query = query.eq('guest_id', args.guest_id);
        
        const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
        if (error) throw error;
        return { success: true, data };
      }

      case "add_folio_charge": {
        const { data, error } = await supabase.from('folio_items')
          .insert({
            tenant_id: tenantId,
            folio_id: args.folio_id,
            item_type: args.item_type,
            description: args.description,
            unit_price: args.amount,
            quantity: args.quantity || 1,
            total_price: args.amount * (args.quantity || 1),
            posted_by: userId
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return { success: true, data };
      }

      case "record_payment": {
        const { data, error } = await supabase.from('payments')
          .insert({
            tenant_id: tenantId,
            folio_id: args.folio_id,
            amount: args.amount,
            payment_method: args.payment_method,
            reference_number: args.reference_number || null,
            notes: args.notes || null,
            received_by: userId
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Update folio paid amount
        const { data: folio } = await supabase.from('folios')
          .select('paid_amount')
          .eq('id', args.folio_id)
          .single();
        
        await supabase.from('folios')
          .update({ paid_amount: (folio?.paid_amount || 0) + args.amount })
          .eq('id', args.folio_id);
        
        return { success: true, data };
      }

      case "get_night_audit_status": {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('night_audits')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('business_date', today)
          .maybeSingle();
        
        if (error) throw error;
        return { 
          success: true, 
          data: data || { status: 'not_started', business_date: today }
        };
      }

      case "run_night_audit": {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if already exists
        const { data: existing } = await supabase.from('night_audits')
          .select('id, status')
          .eq('tenant_id', tenantId)
          .eq('business_date', today)
          .maybeSingle();
        
        if (existing?.status === 'completed') {
          throw new Error('Night audit already completed for today');
        }
        
        // Get stats
        const { data: rooms } = await supabase.from('rooms')
          .select('status')
          .eq('tenant_id', tenantId);
        
        const totalRooms = rooms?.length || 0;
        const occupiedRooms = rooms?.filter((r: any) => r.status === 'occupied').length || 0;
        
        const auditData = {
          tenant_id: tenantId,
          property_id: propertyId,
          business_date: today,
          status: 'completed',
          run_by: userId,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          occupancy_rate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
          rooms_charged: occupiedRooms,
          notes: args.notes || null
        };
        
        let result;
        if (existing) {
          const { data, error } = await supabase.from('night_audits')
            .update(auditData)
            .eq('id', existing.id)
            .select()
            .single();
          if (error) throw error;
          result = data;
        } else {
          const { data, error } = await supabase.from('night_audits')
            .insert(auditData)
            .select()
            .single();
          if (error) throw error;
          result = data;
        }
        
        return { success: true, data: result };
      }

      case "get_pos_outlets": {
        const { data, error } = await supabase.from('pos_outlets')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        return { success: true, data };
      }

      case "create_pos_outlet": {
        const { data, error } = await supabase.from('pos_outlets')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            name: args.name,
            code: args.code.toUpperCase(),
            type: args.type
          })
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, data };
      }

      case "create_pos_order": {
        // Generate order number
        const { data: outlet } = await supabase.from('pos_outlets')
          .select('code')
          .eq('id', args.outlet_id)
          .single();
        
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `${outlet?.code || 'ORD'}-${dateStr}-${randomNum}`;
        
        // Calculate totals
        const subtotal = args.items.reduce((sum: number, item: any) => 
          sum + (item.unit_price * item.quantity), 0);
        
        const { data: order, error: orderError } = await supabase.from('pos_orders')
          .insert({
            tenant_id: tenantId,
            outlet_id: args.outlet_id,
            order_number: orderNumber,
            table_number: args.table_number || null,
            guest_id: args.guest_id || null,
            room_id: args.room_id || null,
            subtotal,
            total_amount: subtotal,
            notes: args.notes || null,
            created_by: userId,
            status: 'pending'
          })
          .select()
          .single();
        
        if (orderError) throw orderError;
        
        // Create order items
        const orderItems = args.items.map((item: any) => ({
          tenant_id: tenantId,
          order_id: order.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
          status: 'pending'
        }));
        
        await supabase.from('pos_order_items').insert(orderItems);
        
        return { success: true, data: { ...order, items: args.items } };
      }

      case "get_pos_orders": {
        let query = supabase.from('pos_orders')
          .select('*, pos_outlets(name), pos_order_items(*)')
          .eq('tenant_id', tenantId);
        
        if (args.outlet_id) query = query.eq('outlet_id', args.outlet_id);
        if (args.status) query = query.eq('status', args.status);
        
        const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
        if (error) throw error;
        return { success: true, data };
      }

      case "get_staff_list": {
        let query = supabase.from('profiles')
          .select('id, full_name, email, phone, is_active, user_roles(role)')
          .eq('tenant_id', tenantId);
        
        const { data, error } = await query.order('full_name');
        if (error) throw error;
        
        let staffList = data || [];
        if (args.role) {
          staffList = staffList.filter((s: any) => 
            s.user_roles?.some((r: any) => r.role === args.role)
          );
        }
        
        return { success: true, data: staffList };
      }

      case "get_occupancy_report": {
        const { data: reservations, error } = await supabase.from('reservations')
          .select('check_in_date, check_out_date, status')
          .eq('tenant_id', tenantId)
          .gte('check_in_date', args.start_date)
          .lte('check_out_date', args.end_date)
          .in('status', ['confirmed', 'checked_in', 'checked_out']);
        
        if (error) throw error;
        
        const { data: rooms } = await supabase.from('rooms')
          .select('id')
          .eq('tenant_id', tenantId);
        
        const totalRooms = rooms?.length || 0;
        const totalRoomNights = reservations?.length || 0;
        
        return { 
          success: true, 
          data: {
            start_date: args.start_date,
            end_date: args.end_date,
            total_rooms: totalRooms,
            total_reservations: reservations?.length || 0,
            summary: `${totalRoomNights} room nights booked out of ${totalRooms} available rooms`
          }
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error: any) {
    console.error(`Tool execution error (${toolName}):`, error);
    return { success: false, error: error.message || 'Tool execution failed' };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, tenantId, propertyId } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get auth header for user context
    const authHeader = req.headers.get('Authorization');
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Get user from auth header
    let userId: string = '';
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || '';
    }

    // Fetch comprehensive hotel context
    const hotelContext = await getHotelContext(supabase, tenantId);
    const fullSystemPrompt = baseSystemPrompt + hotelContext;

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages
        ],
        tools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 2048
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices?.[0]?.message;

    if (!assistantMessage) {
      throw new Error("No response from AI");
    }

    // Check if there are tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = [];
      const toolSummaries = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${toolName}`, toolArgs);
        
        const result = await executeTool(
          toolName, 
          toolArgs, 
          supabase, 
          tenantId, 
          propertyId,
          userId
        );
        
        // Generate human-readable summary
        const summary = generateToolSummary(toolName, toolArgs, result);
        toolSummaries.push(summary);
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: JSON.stringify({
            ...result,
            _summary: summary
          })
        });
      }

      // Call AI again with tool results and summaries
      const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: fullSystemPrompt + `\n\nIMPORTANT: The following tool(s) were executed. Use the _summary field from each result to create a detailed, friendly response that explains what was done:\n\n${toolSummaries.join('\n\n')}` },
            ...messages,
            assistantMessage,
            ...toolResults
          ],
          temperature: 0.7,
          max_tokens: 2048
        }),
      });

      if (!followUpResponse.ok) {
        const errorText = await followUpResponse.text();
        console.error("Follow-up AI error:", errorText);
        
        // If follow-up fails, use the generated summaries directly
        return new Response(JSON.stringify({
          message: toolSummaries.join('\n\n'),
          toolCalls: assistantMessage.tool_calls.map((tc: any) => ({
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments)
          })),
          toolResults: toolResults.map(tr => JSON.parse(tr.content))
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const followUpData = await followUpResponse.json();
      const finalMessage = followUpData.choices?.[0]?.message;

      return new Response(JSON.stringify({
        message: finalMessage?.content || toolSummaries.join('\n\n'),
        toolCalls: assistantMessage.tool_calls.map((tc: any) => ({
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments)
        })),
        toolResults: toolResults.map(tr => JSON.parse(tr.content))
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No tool calls - check for hallucination (claiming to have done something without tools)
    const responseContent = (assistantMessage.content || '').toLowerCase();
    const creationPatterns = [
      'i have created', 'i\'ve created', 'created successfully',
      'i have added', 'i\'ve added', 'added successfully',
      'i have made', 'i\'ve made', 'made successfully',
      'room has been created', 'reservation has been created',
      'guest has been created', 'successfully created',
      'তৈরি করেছি', 'সম্পন্ন হয়েছে', 'করা হয়েছে'
    ];
    
    const claimsAction = creationPatterns.some(pattern => responseContent.includes(pattern));
    
    if (claimsAction) {
      console.warn('HALLUCINATION DETECTED: AI claimed action without tool calls. Original response:', assistantMessage.content);
      
      // Override with a corrective response
      return new Response(JSON.stringify({
        message: "I understand you want me to perform an action. However, I need to confirm the details first before I can proceed. Could you please confirm or provide:\n\n1. **What would you like me to create/do?**\n2. **All required details** (e.g., room number, guest name, dates)\n\nOnce you confirm, I'll execute the action for you.",
        warning: "Action requires confirmation",
        toolCalls: [],
        toolResults: []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No tool calls needed, just return the informational message
    return new Response(JSON.stringify({
      message: assistantMessage.content,
      toolCalls: [],
      toolResults: []
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Admin chat error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "An error occurred processing your request" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
