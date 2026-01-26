import { useState } from "react";
import { useCalendarReservations, type CalendarReservation } from "@/hooks/useCalendarReservations";
import { useCheckIn, useCheckOut, useCancelReservation, useMoveReservationToRoom, useDeleteReservation, useUpdateReservation, type Reservation } from "@/hooks/useReservations";
import { CalendarTimeline } from "@/components/calendar/CalendarTimeline";
import { CalendarControls } from "@/components/calendar/CalendarControls";
import { CalendarStatsBar } from "@/components/calendar/CalendarStatsBar";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { ReservationDetailDrawer } from "@/components/reservations/ReservationDetailDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Calendar() {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(() => new Date());
  const [numDays, setNumDays] = useState(14);
  
  // Drawer state
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoadingReservation, setIsLoadingReservation] = useState(false);

  const { data, isLoading } = useCalendarReservations(startDate, numDays);
  
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const cancelReservation = useCancelReservation();
  const moveReservation = useMoveReservationToRoom();
  const deleteReservation = useDeleteReservation();
  const updateReservation = useUpdateReservation();

  const handleReservationClick = async (calendarRes: CalendarReservation) => {
    setIsLoadingReservation(true);
    
    try {
      // Fetch full reservation details
      const { data, error } = await supabase
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
        .eq("id", calendarRes.id)
        .single();

      if (error) throw error;

      if (data) {
        const formattedRes: Reservation = {
          ...data,
          guest: data.guest as Reservation["guest"],
          reservation_rooms: (data.reservation_rooms || []).map((rr: any) => ({
            id: rr.id,
            room_id: rr.room_id,
            room_type: rr.room_type,
            room: rr.room,
          })),
        };
        setSelectedReservation(formattedRes);
        setDrawerOpen(true);
      }
    } catch (error) {
      console.error("Error fetching reservation:", error);
      toast.error("Failed to load reservation details");
    } finally {
      setIsLoadingReservation(false);
    }
  };

  const handleCheckIn = () => {
    if (selectedReservation) {
      checkIn.mutate({ 
        reservationId: selectedReservation.id,
        roomAssignments: selectedReservation.reservation_rooms
          .filter(rr => rr.room_id)
          .map(rr => ({
            reservationRoomId: rr.id,
            roomId: rr.room_id!
          }))
      });
      setDrawerOpen(false);
    }
  };

  const handleCheckOut = () => {
    if (selectedReservation) {
      checkOut.mutate(selectedReservation.id);
      setDrawerOpen(false);
    }
  };

  const handleCancel = () => {
    if (selectedReservation) {
      cancelReservation.mutate(selectedReservation.id);
      setDrawerOpen(false);
    }
  };

  const handleDelete = () => {
    if (selectedReservation) {
      deleteReservation.mutate(selectedReservation.id);
      setSelectedReservation(null);
    }
  };

  const handleExtendStay = (updatedReservation: Reservation) => {
    // Update the selected reservation with new data
    setSelectedReservation(updatedReservation);
    // Refresh calendar data
    queryClient.invalidateQueries({ 
      predicate: (query) => query.queryKey[0] === "calendar-reservations" 
    });
  };

  const handleReservationMove = (
    reservationId: string,
    reservationRoomId: string,
    newRoomId: string,
    oldRoomId: string | null
  ) => {
    moveReservation.mutate({
      reservationId,
      reservationRoomId,
      newRoomId,
      oldRoomId,
    });
  };

  const handleReservationDateChange = (
    reservationId: string,
    newCheckInDate: string,
    newCheckOutDate: string
  ) => {
    updateReservation.mutate({
      reservationId,
      updates: {
        check_in_date: newCheckInDate,
        check_out_date: newCheckOutDate,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CalendarStatsBar stats={null} isLoading />
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <CalendarStatsBar stats={data?.stats || null} />

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <CalendarControls
          startDate={startDate}
          numDays={numDays}
          onStartDateChange={setStartDate}
          onNumDaysChange={setNumDays}
        />
        <CalendarLegend />
      </div>

      {/* Timeline */}
      <CalendarTimeline
        rooms={data?.rooms || []}
        dateRange={data?.dateRange || []}
        onReservationClick={handleReservationClick}
        onReservationMove={handleReservationMove}
        onReservationDateChange={handleReservationDateChange}
      />

      {/* Reservation Detail Drawer */}
      <ReservationDetailDrawer
        reservation={selectedReservation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onCancel={handleCancel}
        onExtendStay={handleExtendStay}
        onDelete={handleDelete}
      />
    </div>
  );
}
