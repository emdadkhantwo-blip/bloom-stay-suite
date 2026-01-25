import { useState, useMemo } from "react";
import { useRooms, useUpdateRoomStatus, useRoomStats } from "@/hooks/useRooms";
import { RoomCard } from "@/components/rooms/RoomCard";
import { RoomListItem } from "@/components/rooms/RoomListItem";
import { RoomFilters } from "@/components/rooms/RoomFilters";
import { RoomStatsBar } from "@/components/rooms/RoomStatsBar";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { RoomStatus } from "@/types/database";

export default function Rooms() {
  const { data: rooms, isLoading } = useRooms();
  const { data: stats, isLoading: isLoadingStats } = useRoomStats();
  const updateStatus = useUpdateRoomStatus();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get unique floors
  const floors = useMemo(() => {
    if (!rooms) return [];
    const uniqueFloors = [...new Set(rooms.map((r) => r.floor).filter(Boolean))] as string[];
    return uniqueFloors.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [rooms]);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    if (!rooms) return [];

    return rooms.filter((room) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesRoom = room.room_number.toLowerCase().includes(query);
        const matchesType = room.room_type?.name.toLowerCase().includes(query);
        const matchesGuest = room.current_guest
          ? `${room.current_guest.first_name} ${room.current_guest.last_name}`
              .toLowerCase()
              .includes(query)
          : false;
        if (!matchesRoom && !matchesType && !matchesGuest) return false;
      }

      // Status filter
      if (statusFilter !== "all" && room.status !== statusFilter) return false;

      // Floor filter
      if (floorFilter !== "all" && room.floor !== floorFilter) return false;

      return true;
    });
  }, [rooms, searchQuery, statusFilter, floorFilter]);

  // Group by floor for grid view
  const roomsByFloor = useMemo(() => {
    const grouped = new Map<string, typeof filteredRooms>();
    
    filteredRooms.forEach((room) => {
      const floor = room.floor || "Unknown";
      if (!grouped.has(floor)) {
        grouped.set(floor, []);
      }
      grouped.get(floor)!.push(room);
    });

    // Sort floors
    return Array.from(grouped.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], undefined, { numeric: true })
    );
  }, [filteredRooms]);

  const handleStatusChange = (roomId: string, newStatus: RoomStatus) => {
    updateStatus.mutate({ roomId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <RoomStatsBar stats={null} isLoading />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <RoomStatsBar stats={stats || null} isLoading={isLoadingStats} />

      {/* Filters */}
      <RoomFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        floorFilter={floorFilter}
        onFloorFilterChange={setFloorFilter}
        floors={floors}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* No Results */}
      {filteredRooms.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-lg border bg-card text-muted-foreground">
          No rooms found matching your filters
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && filteredRooms.length > 0 && (
        <div className="space-y-6">
          {roomsByFloor.map(([floor, floorRooms]) => (
            <div key={floor}>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Floor {floor} ({floorRooms.length} rooms)
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                {floorRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    guestName={
                      room.current_guest
                        ? `${room.current_guest.first_name} ${room.current_guest.last_name}`
                        : null
                    }
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && filteredRooms.length > 0 && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Room</TableHead>
                <TableHead className="w-[80px]">Floor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead className="w-[100px] text-right">Rate</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((room) => (
                <RoomListItem
                  key={room.id}
                  room={room}
                  guestName={
                    room.current_guest
                      ? `${room.current_guest.first_name} ${room.current_guest.last_name}`
                      : null
                  }
                  onStatusChange={handleStatusChange}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
