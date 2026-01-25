import { useState, useMemo } from "react";
import { Plus, Wrench } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import {
  useMaintenanceTickets,
  useMaintenanceStats,
  type MaintenanceTicket,
} from "@/hooks/useMaintenance";
import { MaintenanceStatsBar } from "@/components/maintenance/MaintenanceStatsBar";
import { TicketFilters } from "@/components/maintenance/TicketFilters";
import { TicketCard } from "@/components/maintenance/TicketCard";
import { TicketDetailDrawer } from "@/components/maintenance/TicketDetailDrawer";
import { CreateTicketDialog } from "@/components/maintenance/CreateTicketDialog";
import { AssignTicketDialog } from "@/components/maintenance/AssignTicketDialog";
import { ResolveTicketDialog } from "@/components/maintenance/ResolveTicketDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Maintenance() {
  const { currentProperty } = useTenant();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // UI State
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  // Data hooks
  const { data: tickets = [], isLoading: ticketsLoading } = useMaintenanceTickets({
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? parseInt(priorityFilter) : undefined,
  });
  const { data: stats, isLoading: statsLoading } = useMaintenanceStats();

  // Filter by search query
  const filteredTickets = useMemo(() => {
    if (!searchQuery) return tickets;
    const query = searchQuery.toLowerCase();
    return tickets.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.room?.room_number?.toLowerCase().includes(query)
    );
  }, [tickets, searchQuery]);

  const handleViewTicket = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setDrawerOpen(true);
  };

  const handleAssignTicket = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setAssignDialogOpen(true);
  };

  const handleResolveTicket = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setResolveDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            {currentProperty?.name} — Track and manage maintenance tickets
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Stats Bar */}
      <MaintenanceStatsBar
        openCount={stats?.open ?? 0}
        inProgressCount={stats?.inProgress ?? 0}
        resolvedCount={stats?.resolved ?? 0}
        highPriorityCount={stats?.highPriority ?? 0}
        isLoading={statsLoading}
      />

      {/* Filters */}
      <TicketFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
      />

      {/* Ticket List */}
      <div className="space-y-3">
        {ticketsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No tickets found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                ? "Try adjusting your filters"
                : "Create a new ticket to get started"}
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onView={() => handleViewTicket(ticket)}
              onAssign={() => handleAssignTicket(ticket)}
              onResolve={() => handleResolveTicket(ticket)}
            />
          ))
        )}
      </div>

      {/* Dialogs & Drawers */}
      <TicketDetailDrawer
        ticket={selectedTicket}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onAssign={() => {
          setDrawerOpen(false);
          setAssignDialogOpen(true);
        }}
        onResolve={() => {
          setDrawerOpen(false);
          setResolveDialogOpen(true);
        }}
      />

      <CreateTicketDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <AssignTicketDialog
        ticket={selectedTicket}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />

      <ResolveTicketDialog
        ticket={selectedTicket}
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
      />
    </div>
  );
}
