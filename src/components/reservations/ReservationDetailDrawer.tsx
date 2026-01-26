import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  User,
  Phone,
  Mail,
  Calendar,
  BedDouble,
  Star,
  CreditCard,
  FileText,
  Clock,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import type { Reservation } from "@/hooks/useReservations";
import { ExtendStayDialog } from "./ExtendStayDialog";

interface ReservationDetailDrawerProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  onCancel?: () => void;
  onExtendStay?: () => void;
}

interface FolioSummary {
  id: string;
  folio_number: string;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
}

export function ReservationDetailDrawer({
  reservation,
  open,
  onOpenChange,
  onCheckIn,
  onCheckOut,
  onCancel,
  onExtendStay,
}: ReservationDetailDrawerProps) {
  const [extendStayOpen, setExtendStayOpen] = useState(false);

  // Fetch folio data for this reservation
  const { data: folio, isLoading: isFolioLoading } = useQuery({
    queryKey: ["reservation-folio", reservation?.id],
    queryFn: async (): Promise<FolioSummary | null> => {
      if (!reservation?.id) return null;

      const { data, error } = await supabase
        .from("folios")
        .select("id, folio_number, subtotal, tax_amount, service_charge, total_amount, paid_amount, balance, status")
        .eq("reservation_id", reservation.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!reservation?.id && open,
  });

  if (!reservation) return null;

  const guest = reservation.guest;
  const nights = Math.ceil(
    (new Date(reservation.check_out_date).getTime() - new Date(reservation.check_in_date).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const canCheckIn = reservation.status === "confirmed";
  const canCheckOut = reservation.status === "checked_in";
  const canExtendStay = reservation.status === "confirmed" || reservation.status === "checked_in";
  const canCancel = reservation.status === "confirmed";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Reservation Details</SheetTitle>
            <ReservationStatusBadge status={reservation.status} />
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            {reservation.confirmation_number}
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Guest Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {guest ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      {guest.first_name} {guest.last_name}
                    </span>
                    {guest.is_vip && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        VIP
                      </Badge>
                    )}
                  </div>
                  {guest.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${guest.email}`} className="hover:underline">
                        {guest.email}
                      </a>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${guest.phone}`} className="hover:underline">
                        {guest.phone}
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No guest information available</p>
              )}
            </CardContent>
          </Card>

          {/* Stay Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Stay Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Check-In</p>
                  <p className="font-medium">
                    {format(new Date(reservation.check_in_date), "EEE, MMM d, yyyy")}
                  </p>
                  {reservation.actual_check_in && (
                    <p className="text-xs text-muted-foreground">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {format(new Date(reservation.actual_check_in), "h:mm a")}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Check-Out</p>
                  <p className="font-medium">
                    {format(new Date(reservation.check_out_date), "EEE, MMM d, yyyy")}
                  </p>
                  {reservation.actual_check_out && (
                    <p className="text-xs text-muted-foreground">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {format(new Date(reservation.actual_check_out), "h:mm a")}
                    </p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{nights} night{nights !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Guests</span>
                <span className="font-medium">
                  {reservation.adults} adult{reservation.adults !== 1 ? "s" : ""}
                  {reservation.children > 0 && `, ${reservation.children} child${reservation.children !== 1 ? "ren" : ""}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Source</span>
                <Badge variant="outline" className="capitalize">
                  {reservation.source.replace("_", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Room Assignments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BedDouble className="h-4 w-4" />
                Room Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reservation.reservation_rooms.length > 0 ? (
                <div className="space-y-2">
                  {reservation.reservation_rooms.map((rr) => (
                    <div
                      key={rr.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {rr.room?.room_number ? (
                            <>Room {rr.room.room_number}</>
                          ) : (
                            <span className="text-amber-600">Not assigned</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {rr.room_type?.name || rr.room_type?.code || "Unknown type"}
                        </p>
                      </div>
                      {!rr.room?.room_number && (
                        <Badge variant="outline" className="text-amber-600 border-amber-500/20">
                          Pending
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No rooms assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Folio / Billing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4" />
                Folio Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isFolioLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : folio ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Folio #</span>
                    <span className="font-mono">{folio.folio_number}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>৳{folio.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>৳{folio.tax_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Service Charge</span>
                    <span>৳{folio.service_charge.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Total</span>
                    <span>৳{folio.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="text-green-600">৳{folio.paid_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Balance Due</span>
                    <span className={folio.balance > 0 ? "text-red-600" : "text-green-600"}>
                      ৳{folio.balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  No folio created yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Special Requests & Notes */}
          {(reservation.special_requests || reservation.internal_notes) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Notes & Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reservation.special_requests && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Special Requests
                    </p>
                    <p className="text-sm rounded-lg bg-muted p-3">
                      {reservation.special_requests}
                    </p>
                  </div>
                )}
                {reservation.internal_notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Internal Notes
                    </p>
                    <p className="text-sm rounded-lg bg-amber-500/10 p-3 text-amber-800">
                      {reservation.internal_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4">
            {canCheckIn && onCheckIn && (
              <Button className="flex-1" onClick={onCheckIn}>
                Check In
              </Button>
            )}
            {canCheckOut && onCheckOut && (
              <Button className="flex-1" onClick={onCheckOut}>
                Check Out
              </Button>
            )}
            {canExtendStay && (
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setExtendStayOpen(true)}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Modify Dates
              </Button>
            )}
            {canCancel && onCancel && (
              <Button variant="destructive" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {!canCheckIn && !canCheckOut && !canCancel && !canExtendStay && (
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            )}
          </div>

          {/* Extend Stay Dialog */}
          <ExtendStayDialog
            reservation={reservation}
            open={extendStayOpen}
            onOpenChange={setExtendStayOpen}
            onSuccess={() => {
              onExtendStay?.();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
