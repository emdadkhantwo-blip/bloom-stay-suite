import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoomStatusBadge } from "./RoomStatusBadge";
import { 
  MoreVertical, 
  User, 
  Wrench, 
  Sparkles, 
  DoorOpen, 
  AlertTriangle,
  BedDouble,
} from "lucide-react";
import type { RoomStatus } from "@/types/database";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  room: {
    id: string;
    room_number: string;
    floor: string | null;
    status: RoomStatus;
    room_type: {
      name: string;
      code: string;
      base_rate: number;
    } | null;
    notes: string | null;
  };
  guestName?: string | null;
  onStatusChange: (roomId: string, newStatus: RoomStatus) => void;
  onClick?: () => void;
}

const statusActions: { status: RoomStatus; label: string; icon: React.ElementType }[] = [
  { status: "vacant", label: "Mark Vacant", icon: DoorOpen },
  { status: "occupied", label: "Mark Occupied", icon: User },
  { status: "dirty", label: "Mark Dirty", icon: Sparkles },
  { status: "maintenance", label: "Mark Maintenance", icon: Wrench },
  { status: "out_of_order", label: "Mark Out of Order", icon: AlertTriangle },
];

const statusStyles: Record<RoomStatus, { border: string; iconBg: string; iconColor: string }> = {
  vacant: { 
    border: "border-l-4 border-l-room-vacant", 
    iconBg: "bg-vibrant-green-light",
    iconColor: "text-vibrant-green"
  },
  occupied: { 
    border: "border-l-4 border-l-room-occupied", 
    iconBg: "bg-vibrant-blue-light",
    iconColor: "text-vibrant-blue"
  },
  dirty: { 
    border: "border-l-4 border-l-room-dirty", 
    iconBg: "bg-vibrant-amber-light",
    iconColor: "text-vibrant-amber"
  },
  maintenance: { 
    border: "border-l-4 border-l-room-maintenance", 
    iconBg: "bg-vibrant-purple-light",
    iconColor: "text-vibrant-purple"
  },
  out_of_order: { 
    border: "border-l-4 border-l-room-out-of-order", 
    iconBg: "bg-vibrant-rose-light",
    iconColor: "text-vibrant-rose"
  },
};

export function RoomCard({ room, guestName, onStatusChange, onClick }: RoomCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const styles = statusStyles[room.status];

  const handleStatusChange = (newStatus: RoomStatus) => {
    onStatusChange(room.id, newStatus);
    setIsMenuOpen(false);
  };

  return (
    <Card
      className={cn(
        "group relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 overflow-hidden",
        styles.border
      )}
      onClick={onClick}
    >
      {/* Decorative background gradient */}
      <div className={cn(
        "absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-30 transition-transform group-hover:scale-150",
        room.status === "vacant" && "bg-gradient-to-br from-emerald-400 to-emerald-600",
        room.status === "occupied" && "bg-gradient-to-br from-blue-400 to-blue-600",
        room.status === "dirty" && "bg-gradient-to-br from-amber-400 to-amber-600",
        room.status === "maintenance" && "bg-gradient-to-br from-purple-400 to-purple-600",
        room.status === "out_of_order" && "bg-gradient-to-br from-rose-400 to-rose-600"
      )} />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", styles.iconBg)}>
            <BedDouble className={cn("h-4 w-4", styles.iconColor)} />
          </div>
          <span className="text-xl font-bold">{room.room_number}</span>
        </div>
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
            {statusActions.map((action) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={action.status}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(action.status);
                  }}
                  disabled={room.status === action.status}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-2">
          <RoomStatusBadge status={room.status} size="sm" />
          
          <div className="space-y-1 text-xs text-muted-foreground">
            {room.room_type && (
              <p className="font-medium text-foreground">{room.room_type.name}</p>
            )}
            {room.floor && <p>Floor {room.floor}</p>}
            {guestName && room.status === "occupied" && (
              <p className="flex items-center gap-1 text-foreground font-medium">
                <User className="h-3 w-3 text-vibrant-blue" />
                {guestName}
              </p>
            )}
          </div>
          
          {room.room_type && (
            <p className="text-sm font-bold text-vibrant-green">
              ${room.room_type.base_rate.toFixed(0)}/night
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
