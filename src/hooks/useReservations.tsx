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
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === "calendar-reservations" 
      });
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
  const { currentProperty, tenant } = useTenant();
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

        // Create pending housekeeping tasks for each room
        if (tenant?.id && currentPropertyId) {
          const housekeepingTasks = roomIds.map((roomId) => ({
            tenant_id: tenant.id,
            property_id: currentPropertyId,
            room_id: roomId,
            task_type: 'cleaning',
            priority: 2, // Medium priority for checkout cleaning
            status: 'pending',
            assigned_to: null, // Unassigned - can be assigned later
            notes: 'Post-checkout cleaning',
          }));

          const { error: taskError } = await supabase
            .from('housekeeping_tasks')
            .insert(housekeepingTasks);

          if (taskError) {
            console.error('Failed to create housekeeping tasks:', taskError);
            // Don't throw - checkout succeeded, task creation is secondary
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["reservation-stats", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["rooms", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["room-stats", currentPropertyId] });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === "calendar-reservations" 
      });
      // Invalidate housekeeping queries so new tasks appear immediately
      queryClient.invalidateQueries({ queryKey: ["housekeeping-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["housekeeping-stats"] });
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
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === "calendar-reservations" 
      });
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
      // Update reservation
      const { error } = await supabase
        .from("reservations")
        .update({ 
          ...updates,
          updated_at: new Date().toISOString() 
        })
        .eq("id", reservationId);

      if (error) throw error;

      // If total_amount is being updated, also update the associated folio
      if (updates.total_amount !== undefined) {
        // Get the folio for this reservation
        const { data: folio, error: folioFetchError } = await supabase
          .from("folios")
          .select("id, paid_amount")
          .eq("reservation_id", reservationId)
          .maybeSingle();

        if (folioFetchError) {
          console.error("Error fetching folio:", folioFetchError);
        }

        if (folio) {
          // Update folio total and recalculate balance
          const newBalance = updates.total_amount - (folio.paid_amount || 0);
          const { error: folioUpdateError } = await supabase
            .from("folios")
            .update({
              total_amount: updates.total_amount,
              balance: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("id", folio.id);

          if (folioUpdateError) {
            console.error("Error updating folio:", folioUpdateError);
          }
        }
      }
    },
    onSuccess: () => {
      // Use predicate to invalidate all matching queries regardless of params
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === "calendar-reservations" ||
          query.queryKey[0] === "reservations" ||
          query.queryKey[0] === "reservation-stats" ||
          query.queryKey[0] === "folios" ||
          query.queryKey[0] === "folio"
      });
      toast.success("Reservation updated successfully");
    },
    onError: (error) => {
      console.error("Update reservation error:", error);
      toast.error("Failed to update reservation");
    },
  });
}

export function useMoveReservationToRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reservationId,
      reservationRoomId,
      newRoomId,
      oldRoomId,
    }: {
      reservationId: string;
      reservationRoomId: string;
      newRoomId: string;
      oldRoomId: string | null;
    }) => {
      // Update reservation_rooms with new room_id
      const { error } = await supabase
        .from("reservation_rooms")
        .update({ room_id: newRoomId, updated_at: new Date().toISOString() })
        .eq("id", reservationRoomId);

      if (error) throw error;

      // If old room was occupied (checked in), mark it as dirty
      if (oldRoomId) {
        await supabase
          .from("rooms")
          .update({ status: "dirty", updated_at: new Date().toISOString() })
          .eq("id", oldRoomId);
      }

      // Check if the reservation is checked in to update new room status
      const { data: reservation } = await supabase
        .from("reservations")
        .select("status")
        .eq("id", reservationId)
        .single();

      // Only mark new room as occupied if reservation is checked in
      if (reservation?.status === "checked_in") {
        await supabase
          .from("rooms")
          .update({ status: "occupied", updated_at: new Date().toISOString() })
          .eq("id", newRoomId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "calendar-reservations" ||
          query.queryKey[0] === "rooms" ||
          query.queryKey[0] === "reservations",
      });
      toast.success("Reservation moved to new room");
    },
    onError: (error) => {
      console.error("Move reservation error:", error);
      toast.error("Failed to move reservation");
    },
  });
}

export function useDeleteReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      // First, get reservation rooms to release any assigned rooms
      const { data: resRooms } = await supabase
        .from("reservation_rooms")
        .select("room_id")
        .eq("reservation_id", reservationId);

      // Get folio IDs first
      const { data: folios } = await supabase
        .from("folios")
        .select("id")
        .eq("reservation_id", reservationId);

      const folioIds = folios?.map((f) => f.id) || [];

      // Delete folio items if any folios exist
      if (folioIds.length > 0) {
        await supabase
          .from("folio_items")
          .delete()
          .in("folio_id", folioIds);

        // Delete payments
        await supabase
          .from("payments")
          .delete()
          .in("folio_id", folioIds);

        // Delete folios
        await supabase
          .from("folios")
          .delete()
          .in("id", folioIds);
      }

      // Delete reservation_rooms (foreign key constraint)
      const { error: rrError } = await supabase
        .from("reservation_rooms")
        .delete()
        .eq("reservation_id", reservationId);

      if (rrError) throw rrError;

      // Delete the reservation
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservationId);

      if (error) throw error;

      // Release any occupied rooms back to vacant
      const roomIds = resRooms?.map((rr) => rr.room_id).filter(Boolean) as string[];
      if (roomIds.length > 0) {
        await supabase
          .from("rooms")
          .update({ status: "vacant", updated_at: new Date().toISOString() })
          .in("id", roomIds);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "calendar-reservations" ||
          query.queryKey[0] === "reservations" ||
          query.queryKey[0] === "reservation-stats" ||
          query.queryKey[0] === "rooms" ||
          query.queryKey[0] === "room-stats",
      });
      toast.success("Reservation deleted successfully");
    },
    onError: (error) => {
      console.error("Delete reservation error:", error);
      toast.error("Failed to delete reservation");
    },
  });
}
