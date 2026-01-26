import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type ReservationStatus = "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";

export type Reservation = Tables<"reservations"> & {
  guest: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    is_vip: boolean;
  } | null;
  reservation_rooms: Array<{
    id: string;
    room_id: string | null;
    room_type: {
      id: string;
      name: string;
      code: string;
    } | null;
    room: {
      id: string;
      room_number: string;
    } | null;
  }>;
};

export type ReservationStats = {
  total: number;
  arrivals_today: number;
  departures_today: number;
  in_house: number;
  confirmed: number;
  cancelled: number;
};

export function useReservations(dateRange?: { from: Date; to: Date }) {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["reservations", currentPropertyId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async (): Promise<Reservation[]> => {
      if (!currentPropertyId) return [];

      let query = supabase
        .from("reservations")
        .select(`
          *,
          guest:guests(id, first_name, last_name, email, phone, is_vip),
          reservation_rooms(
            id,
            room_id,
            room_type:room_types(id, name, code),
            room:rooms(id, room_number)
          )
        `)
        .eq("property_id", currentPropertyId)
        .order("check_in_date", { ascending: true });

      if (dateRange?.from) {
        query = query.gte("check_in_date", dateRange.from.toISOString().split("T")[0]);
      }
      if (dateRange?.to) {
        query = query.lte("check_in_date", dateRange.to.toISOString().split("T")[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((res) => ({
        ...res,
        guest: res.guest as Reservation["guest"],
        reservation_rooms: (res.reservation_rooms || []).map((rr: any) => ({
          id: rr.id,
          room_id: rr.room_id,
          room_type: rr.room_type,
          room: rr.room,
        })),
      }));
    },
    enabled: !!currentPropertyId,
  });
}

export function useReservationStats() {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["reservation-stats", currentPropertyId],
    queryFn: async (): Promise<ReservationStats> => {
      if (!currentPropertyId) {
        return { total: 0, arrivals_today: 0, departures_today: 0, in_house: 0, confirmed: 0, cancelled: 0 };
      }

      const today = new Date().toISOString().split("T")[0];

      // Get all reservations for stats
      const { data: reservations, error } = await supabase
        .from("reservations")
        .select("status, check_in_date, check_out_date")
        .eq("property_id", currentPropertyId);

      if (error) throw error;

      const stats: ReservationStats = {
        total: reservations.length,
        arrivals_today: 0,
        departures_today: 0,
        in_house: 0,
        confirmed: 0,
        cancelled: 0,
      };

      reservations.forEach((res) => {
        if (res.check_in_date === today && res.status === "confirmed") {
          stats.arrivals_today++;
        }
        if (res.check_out_date === today && res.status === "checked_in") {
          stats.departures_today++;
        }
        if (res.status === "checked_in") {
          stats.in_house++;
        }
        if (res.status === "confirmed") {
          stats.confirmed++;
        }
        if (res.status === "cancelled") {
          stats.cancelled++;
        }
      });

      return stats;
    },
    enabled: !!currentPropertyId,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({ reservationId, roomAssignments }: { 
      reservationId: string; 
      roomAssignments?: Array<{ reservationRoomId: string; roomId: string }>;
    }) => {
      // Update reservation status
      const { error: resError } = await supabase
        .from("reservations")
        .update({ 
          status: "checked_in", 
          actual_check_in: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq("id", reservationId);

      if (resError) throw resError;

      // Update room assignments if provided
      if (roomAssignments && roomAssignments.length > 0) {
        for (const assignment of roomAssignments) {
          // Update reservation_room with the assigned room
          const { error: rrError } = await supabase
            .from("reservation_rooms")
            .update({ room_id: assignment.roomId, updated_at: new Date().toISOString() })
            .eq("id", assignment.reservationRoomId);

          if (rrError) throw rrError;

          // Update room status to occupied
          const { error: roomError } = await supabase
            .from("rooms")
            .update({ status: "occupied", updated_at: new Date().toISOString() })
            .eq("id", assignment.roomId);

          if (roomError) throw roomError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["reservation-stats", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["rooms", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["room-stats", currentPropertyId] });
      toast.success("Guest checked in successfully");
    },
    onError: (error) => {
      console.error("Check-in error:", error);
      toast.error("Failed to check in guest");
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async (reservationId: string) => {
      // Get reservation rooms to update room statuses
      const { data: resRooms, error: fetchError } = await supabase
        .from("reservation_rooms")
        .select("room_id")
        .eq("reservation_id", reservationId);

      if (fetchError) throw fetchError;

      // Update reservation status
      const { error: resError } = await supabase
        .from("reservations")
        .update({ 
          status: "checked_out", 
          actual_check_out: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq("id", reservationId);

      if (resError) throw resError;

      // Update room statuses to dirty
      const roomIds = resRooms?.map((rr) => rr.room_id).filter(Boolean) as string[];
      if (roomIds.length > 0) {
        const { error: roomError } = await supabase
          .from("rooms")
          .update({ status: "dirty", updated_at: new Date().toISOString() })
          .in("id", roomIds);

        if (roomError) throw roomError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["reservation-stats", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["rooms", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["room-stats", currentPropertyId] });
      toast.success("Guest checked out successfully");
    },
    onError: (error) => {
      console.error("Check-out error:", error);
      toast.error("Failed to check out guest");
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from("reservations")
        .update({ 
          status: "cancelled", 
          updated_at: new Date().toISOString() 
        })
        .eq("id", reservationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["reservation-stats", currentPropertyId] });
      toast.success("Reservation cancelled");
    },
    onError: (error) => {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel reservation");
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({ 
      reservationId, 
      updates 
    }: { 
      reservationId: string; 
      updates: { 
        check_out_date?: string; 
        check_in_date?: string;
        total_amount?: number;
      } 
    }) => {
      const { error } = await supabase
        .from("reservations")
        .update({ 
          ...updates,
          updated_at: new Date().toISOString() 
        })
        .eq("id", reservationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["reservation-stats", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["calendar-reservations"] });
      toast.success("Reservation updated successfully");
    },
    onError: (error) => {
      console.error("Update reservation error:", error);
      toast.error("Failed to update reservation");
    },
  });
}
