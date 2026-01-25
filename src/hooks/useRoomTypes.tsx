import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import type { Tables } from "@/integrations/supabase/types";

export type RoomType = Tables<"room_types">;

export function useRoomTypes() {
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["room-types", propertyId],
    queryFn: async (): Promise<RoomType[]> => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from("room_types")
        .select("*")
        .eq("property_id", propertyId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!propertyId,
  });
}

export function useAvailableRooms(roomTypeId: string | null, checkIn: Date | null, checkOut: Date | null) {
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["available-rooms", propertyId, roomTypeId, checkIn?.toISOString(), checkOut?.toISOString()],
    queryFn: async () => {
      if (!propertyId || !roomTypeId || !checkIn || !checkOut) return [];

      // Get all rooms of this type
      const { data: rooms, error: roomsError } = await supabase
        .from("rooms")
        .select("id, room_number, floor, status")
        .eq("property_id", propertyId)
        .eq("room_type_id", roomTypeId)
        .eq("is_active", true)
        .in("status", ["vacant", "dirty"]);

      if (roomsError) throw roomsError;

      // Get rooms that are already booked for these dates
      const { data: bookedRooms, error: bookedError } = await supabase
        .from("reservation_rooms")
        .select(`
          room_id,
          reservation:reservations!inner(
            check_in_date,
            check_out_date,
            status
          )
        `)
        .not("room_id", "is", null)
        .in("reservation.status", ["confirmed", "checked_in"]);

      if (bookedError) throw bookedError;

      // Filter out rooms that overlap with the requested dates
      const checkInStr = checkIn.toISOString().split("T")[0];
      const checkOutStr = checkOut.toISOString().split("T")[0];

      const bookedRoomIds = new Set(
        bookedRooms
          ?.filter((br) => {
            const res = br.reservation as any;
            // Check for date overlap
            return res.check_in_date < checkOutStr && res.check_out_date > checkInStr;
          })
          .map((br) => br.room_id)
      );

      return rooms?.filter((room) => !bookedRoomIds.has(room.id)) || [];
    },
    enabled: !!propertyId && !!roomTypeId && !!checkIn && !!checkOut,
  });
}
