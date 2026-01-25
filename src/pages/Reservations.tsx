import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import {
  useReservations,
  useReservationStats,
  useCheckIn,
  useCheckOut,
  useCancelReservation,
  type ReservationStatus,
  type Reservation,
} from "@/hooks/useReservations";
import { ReservationStatsBar } from "@/components/reservations/ReservationStatsBar";
import { ReservationFilters } from "@/components/reservations/ReservationFilters";
import { ReservationListItem } from "@/components/reservations/ReservationListItem";
import { ReservationDetailDrawer } from "@/components/reservations/ReservationDetailDrawer";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Reservations() {
  const { data: reservations, isLoading } = useReservations();
  const { data: stats, isLoading: isLoadingStats } = useReservationStats();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const cancelReservation = useCancelReservation();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Detail drawer
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Dialogs
  const [checkInDialog, setCheckInDialog] = useState<string | null>(null);
  const [checkOutDialog, setCheckOutDialog] = useState<string | null>(null);
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);

  // Filter reservations
  const filteredReservations = useMemo(() => {
    if (!reservations) return [];

    return reservations.filter((res) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesConfirmation = res.confirmation_number.toLowerCase().includes(query);
        const matchesGuest = res.guest
          ? `${res.guest.first_name} ${res.guest.last_name}`.toLowerCase().includes(query)
          : false;
        const matchesEmail = res.guest?.email?.toLowerCase().includes(query);
        if (!matchesConfirmation && !matchesGuest && !matchesEmail) return false;
      }

      // Status filter
      if (statusFilter !== "all" && res.status !== statusFilter) return false;

      // Date range filter
      if (dateRange.from) {
        const checkInDate = new Date(res.check_in_date);
        if (checkInDate < dateRange.from) return false;
      }
      if (dateRange.to) {
        const checkInDate = new Date(res.check_in_date);
        if (checkInDate > dateRange.to) return false;
      }

      return true;
    });
  }, [reservations, searchQuery, statusFilter, dateRange]);

  const handleCheckIn = (reservationId: string) => {
    setCheckInDialog(reservationId);
  };

  const confirmCheckIn = () => {
    if (checkInDialog) {
      checkIn.mutate({ reservationId: checkInDialog });
      setCheckInDialog(null);
    }
  };

  const handleCheckOut = (reservationId: string) => {
    setCheckOutDialog(reservationId);
  };

  const confirmCheckOut = () => {
    if (checkOutDialog) {
      checkOut.mutate(checkOutDialog);
      setCheckOutDialog(null);
    }
  };

  const handleCancel = (reservationId: string) => {
    setCancelDialog(reservationId);
  };

  const confirmCancel = () => {
    if (cancelDialog) {
      cancelReservation.mutate(cancelDialog);
      setCancelDialog(null);
    }
  };

  const handleView = (reservationId: string) => {
    const reservation = reservations?.find((r) => r.id === reservationId);
    if (reservation) {
      setSelectedReservation(reservation);
      setDrawerOpen(true);
    }
  };

  const handleDrawerCheckIn = () => {
    if (selectedReservation) {
      setDrawerOpen(false);
      setCheckInDialog(selectedReservation.id);
    }
  };

  const handleDrawerCheckOut = () => {
    if (selectedReservation) {
      setDrawerOpen(false);
      setCheckOutDialog(selectedReservation.id);
    }
  };

  const handleDrawerCancel = () => {
    if (selectedReservation) {
      setDrawerOpen(false);
      setCancelDialog(selectedReservation.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ReservationStatsBar stats={null} isLoading />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <ReservationStatsBar stats={stats || null} isLoading={isLoadingStats} />

      {/* Header with Filters and Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ReservationFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Reservation
        </Button>
      </div>

      {/* No Results */}
      {filteredReservations.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-lg border bg-card text-muted-foreground">
          No reservations found matching your filters
        </div>
      )}

      {/* Reservations List */}
      {filteredReservations.length > 0 && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Confirmation #</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead className="w-[180px]">Dates</TableHead>
                <TableHead className="w-[120px]">Room(s)</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px] text-right">Total</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => (
                <ReservationListItem
                  key={reservation.id}
                  reservation={reservation}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onCancel={handleCancel}
                  onView={handleView}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Check-In Confirmation Dialog */}
      <AlertDialog open={!!checkInDialog} onOpenChange={() => setCheckInDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Check-In</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check in this guest? This will mark the reservation as checked in
              and update the room status to occupied.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCheckIn} disabled={checkIn.isPending}>
              {checkIn.isPending ? "Processing..." : "Check In"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Check-Out Confirmation Dialog */}
      <AlertDialog open={!!checkOutDialog} onOpenChange={() => setCheckOutDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Check-Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check out this guest? This will mark the reservation as checked out
              and update the room status to dirty for housekeeping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCheckOut} disabled={checkOut.isPending}>
              {checkOut.isPending ? "Processing..." : "Check Out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancel} 
              disabled={cancelReservation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelReservation.isPending ? "Cancelling..." : "Cancel Reservation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reservation Detail Drawer */}
      <ReservationDetailDrawer
        reservation={selectedReservation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onCheckIn={handleDrawerCheckIn}
        onCheckOut={handleDrawerCheckOut}
        onCancel={handleDrawerCancel}
      />
    </div>
  );
}
