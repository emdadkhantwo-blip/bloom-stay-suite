import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCalendarReservations, type CalendarReservation } from "@/hooks/useCalendarReservations";
import { CalendarTimeline } from "@/components/calendar/CalendarTimeline";
import { CalendarControls } from "@/components/calendar/CalendarControls";
import { CalendarStatsBar } from "@/components/calendar/CalendarStatsBar";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { Skeleton } from "@/components/ui/skeleton";

export default function Calendar() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(() => new Date());
  const [numDays, setNumDays] = useState(14);

  const { data, isLoading } = useCalendarReservations(startDate, numDays);

  const handleReservationClick = (reservation: CalendarReservation) => {
    // Navigate to reservations page - could also open a modal
    navigate(`/reservations?highlight=${reservation.id}`);
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
      />
    </div>
  );
}
