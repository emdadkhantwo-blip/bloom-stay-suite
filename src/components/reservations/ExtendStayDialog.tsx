import { useState, useMemo } from "react";
import { format, addDays, differenceInDays, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUpdateReservation } from "@/hooks/useReservations";
import type { Reservation } from "@/hooks/useReservations";
import { formatCurrency } from "@/lib/currency";

interface ExtendStayDialogProps {
  reservation: Reservation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ExtendStayDialog({
  reservation,
  open,
  onOpenChange,
  onSuccess,
}: ExtendStayDialogProps) {
  const currentCheckOut = parseISO(reservation.check_out_date);
  const checkIn = parseISO(reservation.check_in_date);
  
  const [newCheckOutDate, setNewCheckOutDate] = useState<Date | undefined>(
    addDays(currentCheckOut, 1)
  );
  
  const updateReservation = useUpdateReservation();

  // Calculate room rate from reservation
  const averageRatePerNight = useMemo(() => {
    const currentNights = differenceInDays(currentCheckOut, checkIn);
    if (currentNights <= 0) return 0;
    return reservation.total_amount / currentNights;
  }, [reservation.total_amount, currentCheckOut, checkIn]);

  // Calculate additional nights and cost
  const { additionalNights, additionalCost, newTotal } = useMemo(() => {
    if (!newCheckOutDate) {
      return { additionalNights: 0, additionalCost: 0, newTotal: reservation.total_amount };
    }
    
    const nights = differenceInDays(newCheckOutDate, currentCheckOut);
    const cost = nights * averageRatePerNight;
    
    return {
      additionalNights: nights,
      additionalCost: cost,
      newTotal: reservation.total_amount + cost,
    };
  }, [newCheckOutDate, currentCheckOut, averageRatePerNight, reservation.total_amount]);

  const handleConfirm = async () => {
    if (!newCheckOutDate || additionalNights <= 0) return;

    await updateReservation.mutateAsync({
      reservationId: reservation.id,
      updates: {
        check_out_date: format(newCheckOutDate, "yyyy-MM-dd"),
        total_amount: newTotal,
      },
    });

    onOpenChange(false);
    onSuccess?.();
  };

  const isValid = newCheckOutDate && additionalNights > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extend Stay</DialogTitle>
          <DialogDescription>
            Extend the checkout date for this reservation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Checkout */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
            <span className="text-sm text-muted-foreground">Current Check-Out</span>
            <span className="font-medium">
              {format(currentCheckOut, "EEE, MMM d, yyyy")}
            </span>
          </div>

          {/* New Checkout Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Check-Out Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newCheckOutDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newCheckOutDate ? (
                    format(newCheckOutDate, "EEE, MMM d, yyyy")
                  ) : (
                    <span>Select date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newCheckOutDate}
                  onSelect={setNewCheckOutDate}
                  disabled={(date) => date <= currentCheckOut}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Cost Summary */}
          {isValid && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Additional Nights</span>
                <span className="font-medium">{additionalNights}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rate per Night</span>
                <span>{formatCurrency(averageRatePerNight)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Additional Cost</span>
                <span className="font-medium text-primary">
                  +{formatCurrency(additionalCost)}
                </span>
              </div>
              <div className="border-t pt-2 flex items-center justify-between">
                <span className="font-medium">New Total</span>
                <span className="font-bold">{formatCurrency(newTotal)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || updateReservation.isPending}
          >
            {updateReservation.isPending ? "Extending..." : "Confirm Extension"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
