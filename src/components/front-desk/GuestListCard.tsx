import { format, differenceInDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LogIn, 
  LogOut, 
  Eye, 
  Crown, 
  Phone, 
  Mail,
  BedDouble,
  User,
} from "lucide-react";
import type { FrontDeskReservation } from "@/hooks/useFrontDesk";
import { cn } from "@/lib/utils";

interface GuestListCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  guests: FrontDeskReservation[];
  isLoading?: boolean;
  emptyMessage: string;
  type: "arrivals" | "departures" | "in-house";
  onCheckIn?: (reservation: FrontDeskReservation) => void;
  onCheckOut?: (reservation: FrontDeskReservation) => void;
  onViewDetails?: (reservation: FrontDeskReservation) => void;
}

function GuestListItem({
  reservation,
  type,
  onCheckIn,
  onCheckOut,
  onViewDetails,
}: {
  reservation: FrontDeskReservation;
  type: "arrivals" | "departures" | "in-house";
  onCheckIn?: (reservation: FrontDeskReservation) => void;
  onCheckOut?: (reservation: FrontDeskReservation) => void;
  onViewDetails?: (reservation: FrontDeskReservation) => void;
}) {
  const guestName = reservation.guest
    ? `${reservation.guest.first_name} ${reservation.guest.last_name}`
    : "Unknown Guest";

  const roomNumbers = reservation.reservation_rooms
    .filter((rr) => rr.room?.room_number)
    .map((rr) => rr.room?.room_number)
    .join(", ");

  const roomTypes = reservation.reservation_rooms
    .map((rr) => rr.room_type?.name)
    .filter(Boolean)
    .join(", ");

  const nights = differenceInDays(
    new Date(reservation.check_out_date),
    new Date(reservation.check_in_date)
  );

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{guestName}</span>
            {reservation.guest?.is_vip && (
              <Crown className="h-3.5 w-3.5 text-warning shrink-0" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" />
              {roomNumbers || roomTypes || "No room assigned"}
            </span>
            <span>
              {nights} night{nights !== 1 ? "s" : ""}
            </span>
            <span className="font-mono text-[10px]">
              {reservation.confirmation_number}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails?.(reservation)}
          className="h-8 px-2"
        >
          <Eye className="h-4 w-4" />
        </Button>

        {type === "arrivals" && onCheckIn && (
          <Button
            size="sm"
            onClick={() => onCheckIn(reservation)}
            className="h-8 gap-1"
          >
            <LogIn className="h-4 w-4" />
            Check In
          </Button>
        )}

        {(type === "departures" || type === "in-house") && onCheckOut && (
          <Button
            variant={type === "departures" ? "default" : "outline"}
            size="sm"
            onClick={() => onCheckOut(reservation)}
            className="h-8 gap-1"
          >
            <LogOut className="h-4 w-4" />
            Check Out
          </Button>
        )}
      </div>
    </div>
  );
}

export function GuestListCard({
  title,
  description,
  icon,
  guests,
  isLoading,
  emptyMessage,
  type,
  onCheckIn,
  onCheckOut,
  onViewDetails,
}: GuestListCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            {isLoading ? "..." : guests.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : guests.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-2">
              {guests.map((reservation) => (
                <GuestListItem
                  key={reservation.id}
                  reservation={reservation}
                  type={type}
                  onCheckIn={onCheckIn}
                  onCheckOut={onCheckOut}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
