import { useMemo, forwardRef } from "react";
import { format, differenceInDays, isToday, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown, UserCheck, CalendarClock } from "lucide-react";
import type { CalendarRoom, CalendarReservation } from "@/hooks/useCalendarReservations";

interface CalendarTimelineProps {
  rooms: CalendarRoom[];
  dateRange: Date[];
  onReservationClick?: (reservation: CalendarReservation) => void;
}

const CELL_WIDTH = 48; // pixels per day
const ROW_HEIGHT = 48; // pixels per room row

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-500/80 border-blue-600",
  checked_in: "bg-emerald-500/80 border-emerald-600",
  checked_out: "bg-muted border-border",
  cancelled: "bg-destructive/50 border-destructive",
  no_show: "bg-orange-500/50 border-orange-600",
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  confirmed: "text-white",
  checked_in: "text-white",
  checked_out: "text-muted-foreground",
  cancelled: "text-destructive-foreground",
  no_show: "text-white",
};

interface ReservationBlockProps {
  reservation: CalendarReservation;
  startDate: Date;
  dateRange: Date[];
  onClick?: (reservation: CalendarReservation) => void;
}

const ReservationBlock = forwardRef<HTMLButtonElement, ReservationBlockProps>(
  ({ reservation, startDate, dateRange, onClick }, ref) => {
    const rangeStart = startDate;
    const rangeEnd = addDays(rangeStart, dateRange.length);

    const checkIn = new Date(reservation.check_in_date);
    const checkOut = new Date(reservation.check_out_date);

    // Clamp to visible range
    const visibleStart = checkIn < rangeStart ? rangeStart : checkIn;
    const visibleEnd = checkOut > rangeEnd ? rangeEnd : checkOut;

    const startOffset = differenceInDays(visibleStart, rangeStart);
    const duration = differenceInDays(visibleEnd, visibleStart);

    if (duration <= 0) return null;

    const left = startOffset * CELL_WIDTH;
    const width = duration * CELL_WIDTH - 4; // 4px gap

    const guestName = reservation.guest
      ? `${reservation.guest.first_name} ${reservation.guest.last_name}`
      : "Unknown Guest";

    const isVip = reservation.guest?.is_vip;

    return (
      <button
        ref={ref}
        onClick={() => onClick?.(reservation)}
        className={cn(
          "absolute top-1 h-10 rounded-md border px-2 flex items-center gap-1 overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-ring hover:ring-offset-1 hover:z-10",
          STATUS_COLORS[reservation.status],
          STATUS_TEXT_COLORS[reservation.status]
        )}
        style={{ left: `${left}px`, width: `${width}px` }}
      >
        {isVip && <Crown className="h-3 w-3 flex-shrink-0 text-amber-300" />}
        {reservation.status === "checked_in" && (
          <UserCheck className="h-3 w-3 flex-shrink-0" />
        )}
        {reservation.status === "confirmed" && (
          <CalendarClock className="h-3 w-3 flex-shrink-0" />
        )}
        <span className="truncate text-xs font-medium">{guestName}</span>
      </button>
    );
  }
);
ReservationBlock.displayName = "ReservationBlock";

function ReservationBlockWithTooltip({
  reservation,
  startDate,
  dateRange,
  onClick,
}: ReservationBlockProps) {
  const checkIn = new Date(reservation.check_in_date);
  const checkOut = new Date(reservation.check_out_date);
  const guestName = reservation.guest
    ? `${reservation.guest.first_name} ${reservation.guest.last_name}`
    : "Unknown Guest";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ReservationBlock
          reservation={reservation}
          startDate={startDate}
          dateRange={dateRange}
          onClick={onClick}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <div className="font-semibold">{guestName}</div>
          <div className="text-xs text-muted-foreground">
            {reservation.confirmation_number}
          </div>
          <div className="text-xs">
            {format(checkIn, "MMM d")} → {format(checkOut, "MMM d, yyyy")}
          </div>
          <Badge variant="outline" className="text-xs capitalize">
            {reservation.status.replace("_", " ")}
          </Badge>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function CalendarTimeline({ rooms, dateRange, onReservationClick }: CalendarTimelineProps) {
  const startDate = dateRange[0];

  // Group rooms by floor
  const groupedRooms = useMemo(() => {
    const floors = new Map<string, CalendarRoom[]>();
    rooms.forEach((room) => {
      const floor = room.floor || "Other";
      const existing = floors.get(floor) || [];
      existing.push(room);
      floors.set(floor, existing);
    });
    return floors;
  }, [rooms]);

  if (rooms.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-card text-muted-foreground">
        No rooms configured. Add rooms in the Rooms section to see them here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <div className="min-w-max">
        {/* Header Row - Dates */}
        <div className="flex border-b bg-muted/50 sticky top-0 z-20">
          {/* Room label column */}
          <div className="w-32 flex-shrink-0 border-r px-3 py-2 font-medium text-sm">
            Room
          </div>
          {/* Date columns */}
          <div className="flex">
            {dateRange.map((date, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col items-center justify-center border-r px-1 py-1",
                  isToday(date) && "bg-primary/10"
                )}
                style={{ width: `${CELL_WIDTH}px` }}
              >
                <span className="text-2xs text-muted-foreground uppercase">
                  {format(date, "EEE")}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isToday(date) && "text-primary font-bold"
                  )}
                >
                  {format(date, "d")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Room Rows grouped by floor */}
        {Array.from(groupedRooms.entries()).map(([floor, floorRooms]) => (
          <div key={floor}>
            {/* Floor Header */}
            <div className="flex border-b bg-muted/30">
              <div className="w-32 flex-shrink-0 border-r px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                Floor {floor}
              </div>
              <div className="flex-1" />
            </div>

            {/* Rooms in this floor */}
            {floorRooms.map((room) => (
              <div key={room.id} className="flex border-b hover:bg-muted/20">
                {/* Room label */}
                <div className="w-32 flex-shrink-0 border-r px-3 py-2 flex flex-col justify-center">
                  <span className="font-medium text-sm">{room.room_number}</span>
                  <span className="text-2xs text-muted-foreground">
                    {room.room_type?.name || "—"}
                  </span>
                </div>

                {/* Timeline grid with reservations */}
                <div
                  className="relative"
                  style={{
                    width: `${dateRange.length * CELL_WIDTH}px`,
                    height: `${ROW_HEIGHT}px`,
                  }}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {dateRange.map((date, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "border-r h-full",
                          isToday(date) && "bg-primary/5"
                        )}
                        style={{ width: `${CELL_WIDTH}px` }}
                      />
                    ))}
                  </div>

                  {/* Reservation blocks */}
                  {room.reservations.map((res) => (
                    <ReservationBlockWithTooltip
                      key={res.id}
                      reservation={res}
                      startDate={startDate}
                      dateRange={dateRange}
                      onClick={onReservationClick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
