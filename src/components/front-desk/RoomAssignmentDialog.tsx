import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BedDouble, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import type { Reservation } from "@/hooks/useReservations";
import { cn } from "@/lib/utils";

interface RoomAssignment {
  reservationRoomId: string;
  roomId: string;
}

interface AvailableRoom {
  id: string;
  room_number: string;
  floor: string | null;
  status: string;
}

interface RoomAssignmentDialogProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (assignments: RoomAssignment[]) => void;
  isLoading?: boolean;
}

function useVacantRoomsByType(roomTypeId: string | null, propertyId: string | null) {
  return useQuery({
    queryKey: ["vacant-rooms", propertyId, roomTypeId],
    queryFn: async (): Promise<AvailableRoom[]> => {
      if (!propertyId || !roomTypeId) return [];

      const { data, error } = await supabase
        .from("rooms")
        .select("id, room_number, floor, status")
        .eq("property_id", propertyId)
        .eq("room_type_id", roomTypeId)
        .eq("is_active", true)
        .eq("status", "vacant")
        .order("room_number");

      if (error) throw error;
      return data || [];
    },
    enabled: !!propertyId && !!roomTypeId,
  });
}

interface RoomSelectorProps {
  reservationRoom: {
    id: string;
    room_id: string | null;
    room_type: { id: string; name: string; code: string } | null;
    room: { id: string; room_number: string } | null;
  };
  propertyId: string;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  usedRoomIds: Set<string>;
}

function RoomSelector({
  reservationRoom,
  propertyId,
  selectedRoomId,
  onSelectRoom,
  usedRoomIds,
}: RoomSelectorProps) {
  const { data: availableRooms, isLoading } = useVacantRoomsByType(
    reservationRoom.room_type?.id ?? null,
    propertyId
  );

  // Filter out rooms already selected for other reservation_rooms
  const filteredRooms = availableRooms?.filter(
    (room) => !usedRoomIds.has(room.id) || room.id === selectedRoomId
  );

  const hasPreAssigned = reservationRoom.room_id && reservationRoom.room;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {reservationRoom.room_type?.name || "Unknown Room Type"}
          </span>
          <Badge variant="outline" className="text-xs">
            {reservationRoom.room_type?.code}
          </Badge>
        </div>
        {hasPreAssigned && (
          <Badge variant="secondary" className="text-xs">
            Pre-assigned: {reservationRoom.room?.room_number}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Select Room {filteredRooms?.length === 0 && "(No vacant rooms available)"}
          </Label>
          <Select
            value={selectedRoomId || ""}
            onValueChange={onSelectRoom}
            disabled={filteredRooms?.length === 0}
          >
            <SelectTrigger
              className={cn(
                selectedRoomId && "border-success",
                !selectedRoomId && filteredRooms && filteredRooms.length > 0 && "border-warning"
              )}
            >
              <SelectValue placeholder="Select a room..." />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {filteredRooms?.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{room.room_number}</span>
                    {room.floor && (
                      <span className="text-xs text-muted-foreground">
                        Floor {room.floor}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export function RoomAssignmentDialog({
  reservation,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: RoomAssignmentDialogProps) {
  const { currentProperty } = useTenant();
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());

  // Initialize assignments from existing room assignments
  useEffect(() => {
    if (reservation && open) {
      const initialAssignments = new Map<string, string>();
      reservation.reservation_rooms.forEach((rr) => {
        if (rr.room_id) {
          initialAssignments.set(rr.id, rr.room_id);
        }
      });
      setAssignments(initialAssignments);
    }
  }, [reservation, open]);

  if (!reservation || !currentProperty) return null;

  const guestName = reservation.guest
    ? `${reservation.guest.first_name} ${reservation.guest.last_name}`
    : "Unknown Guest";

  const handleSelectRoom = (reservationRoomId: string, roomId: string) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      next.set(reservationRoomId, roomId);
      return next;
    });
  };

  const handleConfirm = () => {
    const roomAssignments: RoomAssignment[] = [];
    assignments.forEach((roomId, reservationRoomId) => {
      roomAssignments.push({ reservationRoomId, roomId });
    });
    onConfirm(roomAssignments);
  };

  // Collect all currently selected room IDs to prevent duplicate selection
  const usedRoomIds = new Set(assignments.values());

  const allRoomsAssigned = reservation.reservation_rooms.every((rr) =>
    assignments.has(rr.id)
  );

  const assignedCount = assignments.size;
  const totalRooms = reservation.reservation_rooms.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5" />
            Room Assignment
          </DialogTitle>
          <DialogDescription>
            Assign rooms for <strong>{guestName}</strong>'s check-in.
            <br />
            <span className="text-xs">
              Confirmation: {reservation.confirmation_number}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {reservation.reservation_rooms.map((rr) => (
            <RoomSelector
              key={rr.id}
              reservationRoom={rr}
              propertyId={currentProperty.id}
              selectedRoomId={assignments.get(rr.id) || null}
              onSelectRoom={(roomId) => handleSelectRoom(rr.id, roomId)}
              usedRoomIds={usedRoomIds}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-muted p-2 text-sm">
          {allRoomsAssigned ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-success">
                All {totalRooms} room{totalRooms !== 1 ? "s" : ""} assigned
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-warning">
                {assignedCount} of {totalRooms} room{totalRooms !== 1 ? "s" : ""} assigned
              </span>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!allRoomsAssigned || isLoading}
          >
            {isLoading ? "Checking In..." : "Confirm Check-In"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
