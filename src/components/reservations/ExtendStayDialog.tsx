import { useState, useMemo } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
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
  const originalCheckIn = parseISO(reservation.check_in_date);
  const originalCheckOut = parseISO(reservation.check_out_date);
  
  const [newCheckInDate, setNewCheckInDate] = useState<Date | undefined>(originalCheckIn);
  const [newCheckOutDate, setNewCheckOutDate] = useState<Date | undefined>(originalCheckOut);
  
  const updateReservation = useUpdateReservation();

  // Calculate room rate from reservation
  const averageRatePerNight = useMemo(() => {
    const originalNights = differenceInDays(originalCheckOut, originalCheckIn);
    if (originalNights <= 0) return 0;
    return reservation.total_amount / originalNights;
  }, [reservation.total_amount, originalCheckOut, originalCheckIn]);

  // Calculate new nights and cost difference
  const { originalNights, newNights, nightsDifference, costDifference, newTotal } = useMemo(() => {
    const origNights = differenceInDays(originalCheckOut, originalCheckIn);
    
    if (!newCheckInDate || !newCheckOutDate) {
      return { 
        originalNights: origNights, 
        newNights: origNights, 
        nightsDifference: 0, 
        costDifference: 0, 
        newTotal: reservation.total_amount 
      };
    }
    
    const calcNewNights = differenceInDays(newCheckOutDate, newCheckInDate);
    const diff = calcNewNights - origNights;
    const cost = diff * averageRatePerNight;
    
    return {
      originalNights: origNights,
      newNights: calcNewNights,
      nightsDifference: diff,
      costDifference: cost,
      newTotal: reservation.total_amount + cost,
    };
  }, [newCheckInDate, newCheckOutDate, originalCheckIn, originalCheckOut, averageRatePerNight, reservation.total_amount]);

  const handleConfirm = async () => {
    if (!newCheckInDate || !newCheckOutDate || newNights <= 0) return;

    await updateReservation.mutateAsync({
      reservationId: reservation.id,
      updates: {
        check_in_date: format(newCheckInDate, "yyyy-MM-dd"),
        check_out_date: format(newCheckOutDate, "yyyy-MM-dd"),
        total_amount: newTotal,
      },
    });

    onOpenChange(false);
    onSuccess?.();
  };

  // Reset dates when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setNewCheckInDate(originalCheckIn);
      setNewCheckOutDate(originalCheckOut);
    }
    onOpenChange(isOpen);
  };

  const hasChanges = newCheckInDate && newCheckOutDate && (
    format(newCheckInDate, "yyyy-MM-dd") !== reservation.check_in_date ||
    format(newCheckOutDate, "yyyy-MM-dd") !== reservation.check_out_date
  );

  const isValid = newCheckInDate && newCheckOutDate && newNights > 0 && hasChanges;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modify Stay Dates</DialogTitle>
          <DialogDescription>
            Change the check-in and/or check-out dates for this reservation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original Dates Summary */}
          <div className="rounded-lg border p-3 bg-muted/50 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Original Check-In</span>
              <span className="font-medium">
                {format(originalCheckIn, "EEE, MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Original Check-Out</span>
              <span className="font-medium">
                {format(originalCheckOut, "EEE, MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Original Nights</span>
              <span className="font-medium">{originalNights}</span>
            </div>
          </div>

          {/* New Check-In Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Check-In Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newCheckInDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newCheckInDate ? (
                    format(newCheckInDate, "EEE, MMM d, yyyy")
                  ) : (
                    <span>Select check-in date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newCheckInDate}
                  onSelect={(date) => {
                    setNewCheckInDate(date);
                    // Ensure check-out is after check-in
                    if (date && newCheckOutDate && date >= newCheckOutDate) {
                      setNewCheckOutDate(undefined);
                    }
                  }}
                  disabled={(date) => 
                    (newCheckOutDate ? date >= newCheckOutDate : false)
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* New Check-Out Date Picker */}
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
                    <span>Select check-out date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newCheckOutDate}
                  onSelect={setNewCheckOutDate}
                  disabled={(date) => 
                    (newCheckInDate ? date <= newCheckInDate : false)
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Cost Summary */}
          {hasChanges && newNights > 0 && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">New Duration</span>
                <span className="font-medium">{newNights} night{newNights !== 1 ? 's' : ''}</span>
              </div>
              {nightsDifference !== 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rate per Night</span>
                    <span>{formatCurrency(averageRatePerNight)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {nightsDifference > 0 ? 'Additional' : 'Reduced'} Nights
                    </span>
                    <span className={cn(
                      "font-medium",
                      nightsDifference > 0 ? "text-primary" : "text-destructive"
                    )}>
                      {nightsDifference > 0 ? '+' : ''}{nightsDifference}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost Adjustment</span>
                    <span className={cn(
                      "font-medium",
                      costDifference > 0 ? "text-primary" : "text-destructive"
                    )}>
                      {costDifference >= 0 ? '+' : ''}{formatCurrency(costDifference)}
                    </span>
                  </div>
                </>
              )}
              <div className="border-t pt-2 flex items-center justify-between">
                <span className="font-medium">New Total</span>
                <span className="font-bold">{formatCurrency(newTotal)}</span>
              </div>
            </div>
          )}

          {/* Validation message */}
          {newCheckInDate && newCheckOutDate && newNights <= 0 && (
            <p className="text-sm text-destructive">
              Check-out date must be after check-in date
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || updateReservation.isPending}
          >
            {updateReservation.isPending ? "Updating..." : "Confirm Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
