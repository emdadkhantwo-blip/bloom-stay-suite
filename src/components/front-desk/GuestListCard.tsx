import { differenceInDays } from "date-fns";
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
  BedDouble,
  User,
  Calendar,
  Sparkles,
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

  const getAvatarGradient = () => {
    if (reservation.guest?.is_vip) return "from-amber-400 via-yellow-500 to-orange-500";
    if (type === "arrivals") return "from-emerald-400 via-green-500 to-teal-500";
    if (type === "departures") return "from-orange-400 via-red-500 to-rose-500";
    return "from-blue-400 via-indigo-500 to-purple-500";
  };

  const getBorderColor = () => {
    if (reservation.guest?.is_vip) return "border-l-amber-400";
    if (type === "arrivals") return "border-l-emerald-400";
    if (type === "departures") return "border-l-orange-400";
    return "border-l-blue-400";
  };

  return (
    <div className={cn(
      "group flex items-center justify-between gap-4 rounded-xl border border-l-4 p-4",
      "bg-card/80 backdrop-blur-sm transition-all duration-300",
      "hover:shadow-lg hover:-translate-y-0.5 hover:bg-card",
      getBorderColor()
    )}>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Avatar with gradient */}
        <div className="relative">
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg ring-2 ring-white/50",
            "bg-gradient-to-br",
            getAvatarGradient()
          )}>
            <User className="h-6 w-6 text-white drop-shadow-sm" />
          </div>
          {reservation.guest?.is_vip && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-1 shadow-lg ring-2 ring-white">
              <Crown className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate">{guestName}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px] font-medium gap-1 bg-muted/80">
              <BedDouble className="h-3 w-3" />
              {roomNumbers || roomTypes || "No room"}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium gap-1 bg-muted/80">
              <Calendar className="h-3 w-3" />
              {nights} night{nights !== 1 ? "s" : ""}
            </Badge>
            <span className="font-mono text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
              #{reservation.confirmation_number}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewDetails?.(reservation)}
          className="h-9 w-9 rounded-lg hover:bg-muted/80"
        >
          <Eye className="h-4 w-4" />
        </Button>

        {type === "arrivals" && onCheckIn && (
          <Button
            size="sm"
            onClick={() => onCheckIn(reservation)}
            className="h-9 gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-none shadow-lg shadow-emerald-500/25 font-medium"
          >
            <LogIn className="h-4 w-4" />
            Check In
          </Button>
        )}

        {(type === "departures" || type === "in-house") && onCheckOut && (
          <Button
            size="sm"
            onClick={() => onCheckOut(reservation)}
            className={cn(
              "h-9 gap-1.5 rounded-lg font-medium",
              type === "departures" 
                ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/25"
                : "bg-muted hover:bg-muted/80"
            )}
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
  const getHeaderGradient = () => {
    if (type === "arrivals") return "from-emerald-500 via-green-500 to-teal-500";
    if (type === "departures") return "from-orange-500 via-red-500 to-rose-500";
    return "from-blue-500 via-indigo-500 to-purple-500";
  };

  const getShadowColor = () => {
    if (type === "arrivals") return "shadow-emerald-500/20";
    if (type === "departures") return "shadow-orange-500/20";
    return "shadow-blue-500/20";
  };

  return (
    <Card className={cn(
      "flex flex-col overflow-hidden rounded-2xl border-none shadow-xl transition-all duration-300 hover:shadow-2xl",
      getShadowColor()
    )}>
      <CardHeader className={cn(
        "relative pb-4 text-white bg-gradient-to-r overflow-hidden",
        getHeaderGradient()
      )}>
        {/* Decorative elements */}
        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10 blur-lg" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 backdrop-blur-sm p-2.5 ring-1 ring-white/30 shadow-lg">
              {type === "arrivals" && <LogIn className="h-5 w-5 text-white" />}
              {type === "departures" && <LogOut className="h-5 w-5 text-white" />}
              {type === "in-house" && <Sparkles className="h-5 w-5 text-white" />}
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white tracking-tight">{title}</CardTitle>
              <CardDescription className="text-xs text-white/80 font-medium">{description}</CardDescription>
            </div>
          </div>
          <Badge className="bg-white/20 backdrop-blur-sm text-white border-none shadow-lg ring-1 ring-white/30 text-lg font-bold px-3 py-1">
            {isLoading ? "..." : guests.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 bg-gradient-to-b from-muted/30 to-transparent">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border p-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className={cn(
              "mb-3 rounded-2xl p-4 bg-gradient-to-br opacity-30",
              getHeaderGradient()
            )}>
              {type === "arrivals" && <LogIn className="h-8 w-8 text-white" />}
              {type === "departures" && <LogOut className="h-8 w-8 text-white" />}
              {type === "in-house" && <Sparkles className="h-8 w-8 text-white" />}
            </div>
            <p className="text-sm text-muted-foreground font-medium">{emptyMessage}</p>
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-2">
            <div className="space-y-3">
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
