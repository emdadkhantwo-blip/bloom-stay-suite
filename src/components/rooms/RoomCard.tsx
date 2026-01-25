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

export function RoomCard({ room, guestName, onStatusChange, onClick }: RoomCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleStatusChange = (newStatus: RoomStatus) => {
    onStatusChange(room.id, newStatus);
    setIsMenuOpen(false);
  };

  return (
    <Card
      className={cn(
        "group relative cursor-pointer transition-all hover:shadow-md",
        room.status === "occupied" && "border-l-4 border-l-room-occupied",
        room.status === "vacant" && "border-l-4 border-l-room-vacant",
        room.status === "dirty" && "border-l-4 border-l-room-dirty",
        room.status === "maintenance" && "border-l-4 border-l-room-maintenance",
        room.status === "out_of_order" && "border-l-4 border-l-room-out-of-order"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-muted-foreground" />
          <span className="text-lg font-bold">{room.room_number}</span>
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
              <p className="flex items-center gap-1 text-foreground">
                <User className="h-3 w-3" />
                {guestName}
              </p>
            )}
          </div>
          
          {room.room_type && (
            <p className="text-sm font-semibold text-primary">
              ${room.room_type.base_rate.toFixed(0)}/night
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
