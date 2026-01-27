import { useState, useEffect } from "react";
import { format } from "date-fns";
import { LogIn, LogOut, Hotel, Clock } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { useTodayArrivals, useTodayDepartures, useInHouseGuests } from "@/hooks/useFrontDesk";
import { useCheckIn, useCheckOut, type CheckoutResult } from "@/hooks/useReservations";
import { useRoomStats } from "@/hooks/useRooms";
import { useReservationNotifications } from "@/hooks/useReservationNotifications";
import { useHousekeepingNotifications } from "@/hooks/useHousekeepingNotifications";
import { FrontDeskStatsBar } from "@/components/front-desk/FrontDeskStatsBar";
import { GuestListCard } from "@/components/front-desk/GuestListCard";
import { QuickActions } from "@/components/front-desk/QuickActions";
import { RoomAssignmentDialog } from "@/components/front-desk/RoomAssignmentDialog";
import { GuestSearchDialog } from "@/components/front-desk/GuestSearchDialog";
import { ReservationDetailDrawer } from "@/components/reservations/ReservationDetailDrawer";
import { NewReservationDialog } from "@/components/reservations/NewReservationDialog";
import { CheckoutSuccessModal, type CheckoutData } from "@/components/front-desk/CheckoutSuccessModal";
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
import type { FrontDeskReservation } from "@/hooks/useFrontDesk";
import type { Reservation } from "@/hooks/useReservations";
import { useNavigate } from "react-router-dom";

export default function FrontDesk() {
  // Enable real-time notifications for reservations and housekeeping
  useReservationNotifications();
  useHousekeepingNotifications();

  const navigate = useNavigate();
  const { currentProperty } = useTenant();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Data hooks
  const { data: arrivals = [], isLoading: arrivalsLoading } = useTodayArrivals();
  const { data: departures = [], isLoading: departuresLoading } = useTodayDepartures();
  const { data: inHouse = [], isLoading: inHouseLoading } = useInHouseGuests();
  const { data: roomStats, isLoading: roomStatsLoading } = useRoomStats();

  // Mutations
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  // UI State
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newReservationOpen, setNewReservationOpen] = useState(false);
  const [roomAssignmentOpen, setRoomAssignmentOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [guestSearchOpen, setGuestSearchOpen] = useState(false);
  const [pendingCheckIn, setPendingCheckIn] = useState<FrontDeskReservation | null>(null);
  const [pendingCheckOut, setPendingCheckOut] = useState<FrontDeskReservation | null>(null);
  const [checkoutSuccessOpen, setCheckoutSuccessOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleViewDetails = (reservation: FrontDeskReservation) => {
    setSelectedReservation(reservation);
    setDrawerOpen(true);
  };

  const handleCheckInClick = (reservation: FrontDeskReservation) => {
    setPendingCheckIn(reservation);
    setRoomAssignmentOpen(true);
  };

  const handleCheckOutClick = (reservation: FrontDeskReservation) => {
    setPendingCheckOut(reservation);
    setCheckOutDialogOpen(true);
  };

  const confirmCheckIn = (assignments: Array<{ reservationRoomId: string; roomId: string }>) => {
    if (pendingCheckIn) {
      checkInMutation.mutate(
        { reservationId: pendingCheckIn.id, roomAssignments: assignments },
        {
          onSuccess: () => {
            setRoomAssignmentOpen(false);
            setPendingCheckIn(null);
          },
        }
      );
    }
  };

  const confirmCheckOut = () => {
    if (pendingCheckOut) {
      checkOutMutation.mutate(pendingCheckOut.id, {
        onSuccess: (data: CheckoutResult) => {
          setCheckOutDialogOpen(false);
          setPendingCheckOut(null);
          if (data.checkoutData) {
            setCheckoutData(data.checkoutData);
            setCheckoutSuccessOpen(true);
          }
        },
      });
    }
  };

  const handleGuestSelect = (guestId: string) => {
    navigate(`/guests?selected=${guestId}`);
  };

  const handleReservationSelect = (reservationId: string) => {
    navigate(`/reservations?selected=${reservationId}`);
  };

  const isLoading = arrivalsLoading || departuresLoading || inHouseLoading || roomStatsLoading;

  return (
    <div className="space-y-6">
      {/* Header with time - Enhanced */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
        {/* Decorative background elements */}
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute top-1/2 right-1/4 h-24 w-24 rounded-full bg-white/5 blur-lg" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Front Desk</h1>
            <p className="text-white/80 text-sm">
              {currentProperty?.name} — {format(currentTime, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
            <Clock className="h-5 w-5 text-white/90" />
            <span className="text-2xl font-bold tabular-nums tracking-wide">
              {format(currentTime, "HH:mm")}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <FrontDeskStatsBar
        arrivalsCount={arrivals.length}
        departuresCount={departures.length}
        inHouseCount={inHouse.length}
        vacantRoomsCount={roomStats?.vacant ?? 0}
        dirtyRoomsCount={roomStats?.dirty ?? 0}
        isLoading={isLoading}
      />

      {/* Quick Actions */}
      <QuickActions
        onNewReservation={() => setNewReservationOpen(true)}
        onSearchGuest={() => setGuestSearchOpen(true)}
      />

      {/* Guest Lists Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Arrivals */}
        <GuestListCard
          title="Today's Arrivals"
          description="Guests expected to check in"
          icon={<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10"><LogIn className="h-4 w-4 text-success" /></div>}
          guests={arrivals}
          isLoading={arrivalsLoading}
          emptyMessage="No arrivals scheduled for today"
          type="arrivals"
          onCheckIn={handleCheckInClick}
          onViewDetails={handleViewDetails}
        />

        {/* Departures */}
        <GuestListCard
          title="Today's Departures"
          description="Guests expected to check out"
          icon={<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10"><LogOut className="h-4 w-4 text-warning" /></div>}
          guests={departures}
          isLoading={departuresLoading}
          emptyMessage="No departures scheduled for today"
          type="departures"
          onCheckOut={handleCheckOutClick}
          onViewDetails={handleViewDetails}
        />

        {/* In House */}
        <GuestListCard
          title="In House Guests"
          description="Currently staying guests"
          icon={<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Hotel className="h-4 w-4 text-primary" /></div>}
          guests={inHouse}
          isLoading={inHouseLoading}
          emptyMessage="No guests currently in house"
          type="in-house"
          onCheckOut={handleCheckOutClick}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Reservation Detail Drawer */}
      <ReservationDetailDrawer
        reservation={selectedReservation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onCheckIn={() => {
          if (selectedReservation) {
            setDrawerOpen(false);
            handleCheckInClick(selectedReservation);
          }
        }}
        onCheckOut={() => {
          if (selectedReservation) {
            setDrawerOpen(false);
            handleCheckOutClick(selectedReservation);
          }
        }}
        onCancel={() => {
          // Not needed for front desk
        }}
      />

      {/* New Reservation Dialog */}
      <NewReservationDialog
        open={newReservationOpen}
        onOpenChange={setNewReservationOpen}
      />

      {/* Room Assignment Dialog for Check-In */}
      <RoomAssignmentDialog
        reservation={pendingCheckIn}
        open={roomAssignmentOpen}
        onOpenChange={(open) => {
          setRoomAssignmentOpen(open);
          if (!open) setPendingCheckIn(null);
        }}
        onConfirm={confirmCheckIn}
        isLoading={checkInMutation.isPending}
      />

      {/* Guest Search Dialog */}
      <GuestSearchDialog
        open={guestSearchOpen}
        onOpenChange={setGuestSearchOpen}
        onSelectGuest={handleGuestSelect}
        onSelectReservation={handleReservationSelect}
      />

      {/* Check-Out Confirmation Dialog */}
      <AlertDialog open={checkOutDialogOpen} onOpenChange={setCheckOutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Check-Out</AlertDialogTitle>
            <AlertDialogDescription>
              Check out{" "}
              <strong>
                {pendingCheckOut?.guest?.first_name} {pendingCheckOut?.guest?.last_name}
              </strong>
              ? This will mark the reservation as checked out and set rooms to dirty for housekeeping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCheckOut}>
              Check Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Checkout Success Modal with Invoice */}
      <CheckoutSuccessModal
        open={checkoutSuccessOpen}
        onOpenChange={setCheckoutSuccessOpen}
        checkoutData={checkoutData}
      />
    </div>
  );
}
