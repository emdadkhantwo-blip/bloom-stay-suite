import { format } from "date-fns";
import { MoreHorizontal, LogIn, LogOut, XCircle, Eye, Star } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import type { Reservation } from "@/hooks/useReservations";

interface ReservationListItemProps {
  reservation: Reservation;
  onCheckIn: (reservationId: string) => void;
  onCheckOut: (reservationId: string) => void;
  onCancel: (reservationId: string) => void;
  onView: (reservationId: string) => void;
}

export function ReservationListItem({
  reservation,
  onCheckIn,
  onCheckOut,
  onCancel,
  onView,
}: ReservationListItemProps) {
  const guestName = reservation.guest
    ? `${reservation.guest.first_name} ${reservation.guest.last_name}`
    : "Unknown Guest";

  const roomInfo = reservation.reservation_rooms
    .map((rr) => rr.room?.room_number || rr.room_type?.code || "TBA")
    .join(", ");

  const nights = Math.ceil(
    (new Date(reservation.check_out_date).getTime() - new Date(reservation.check_in_date).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const canCheckIn = reservation.status === "confirmed";
  const canCheckOut = reservation.status === "checked_in";
  const canCancel = reservation.status === "confirmed";

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-mono text-sm">
        {reservation.confirmation_number}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{guestName}</span>
          {reservation.guest?.is_vip && (
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          )}
        </div>
        {reservation.guest?.email && (
          <p className="text-xs text-muted-foreground">{reservation.guest.email}</p>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {format(new Date(reservation.check_in_date), "MMM d")} -{" "}
          {format(new Date(reservation.check_out_date), "MMM d, yyyy")}
        </div>
        <p className="text-xs text-muted-foreground">{nights} night{nights !== 1 ? "s" : ""}</p>
      </TableCell>
      <TableCell>
        <span className="text-sm">{roomInfo || "Not assigned"}</span>
      </TableCell>
      <TableCell>
        <ReservationStatusBadge status={reservation.status} />
      </TableCell>
      <TableCell className="text-right font-medium">
        ${reservation.total_amount.toLocaleString()}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onView(reservation.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canCheckIn && (
              <DropdownMenuItem onClick={() => onCheckIn(reservation.id)}>
                <LogIn className="mr-2 h-4 w-4" />
                Check In
              </DropdownMenuItem>
            )}
            {canCheckOut && (
              <DropdownMenuItem onClick={() => onCheckOut(reservation.id)}>
                <LogOut className="mr-2 h-4 w-4" />
                Check Out
              </DropdownMenuItem>
            )}
            {canCancel && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onCancel(reservation.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Reservation
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
