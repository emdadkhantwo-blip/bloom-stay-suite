import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";

export interface CreateReservationInput {
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  source: string;
  special_requests?: string;
  internal_notes?: string;
  rooms: Array<{
    room_type_id: string;
    room_id?: string;
    rate_per_night: number;
    adults: number;
    children: number;
  }>;
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();
  const propertyId = currentProperty?.id;
  const tenantId = tenant?.id;

  return useMutation({
    mutationFn: async (input: CreateReservationInput) => {
      if (!propertyId || !tenantId) throw new Error("No property selected");

      // Get property code for confirmation number
      const { data: property, error: propError } = await supabase
        .from("properties")
        .select("code")
        .eq("id", propertyId)
        .single();

      if (propError) throw propError;

      // Generate confirmation number
      const { data: confirmationNumber, error: confError } = await supabase
        .rpc("generate_confirmation_number", { property_code: property.code });

      if (confError) throw confError;

      // Calculate total amount
      const nights = Math.ceil(
        (new Date(input.check_out_date).getTime() - new Date(input.check_in_date).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const totalAmount = input.rooms.reduce((sum, room) => sum + room.rate_per_night * nights, 0);

      // Create reservation
      const { data: reservation, error: resError } = await supabase
        .from("reservations")
        .insert({
          tenant_id: tenantId,
          property_id: propertyId,
          guest_id: input.guest_id,
          confirmation_number: confirmationNumber,
          check_in_date: input.check_in_date,
          check_out_date: input.check_out_date,
          adults: input.adults,
          children: input.children,
          source: input.source as any,
          special_requests: input.special_requests || null,
          internal_notes: input.internal_notes || null,
          total_amount: totalAmount,
          status: "confirmed",
        })
        .select()
        .single();

      if (resError) throw resError;

      // Create reservation rooms
      const reservationRooms = input.rooms.map((room) => ({
        tenant_id: tenantId,
        reservation_id: reservation.id,
        room_type_id: room.room_type_id,
        room_id: room.room_id || null,
        rate_per_night: room.rate_per_night,
        adults: room.adults,
        children: room.children,
      }));

      const { error: rrError } = await supabase
        .from("reservation_rooms")
        .insert(reservationRooms);

      if (rrError) throw rrError;

      // Generate folio number
      const { data: folioNumber, error: folioNumError } = await supabase
        .rpc("generate_folio_number", { property_code: property.code });

      if (folioNumError) throw folioNumError;

      // Create folio
      const { error: folioError } = await supabase
        .from("folios")
        .insert({
          tenant_id: tenantId,
          property_id: propertyId,
          guest_id: input.guest_id,
          reservation_id: reservation.id,
          folio_number: folioNumber,
          total_amount: totalAmount,
          balance: totalAmount,
          status: "open",
        });

      if (folioError) throw folioError;

      return reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["reservation-stats", propertyId] });
      toast.success("Reservation created successfully");
    },
    onError: (error) => {
      console.error("Error creating reservation:", error);
      toast.error("Failed to create reservation");
    },
  });
}
