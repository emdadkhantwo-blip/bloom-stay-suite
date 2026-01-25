import { formatDistanceToNow, format } from "date-fns";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Wrench,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MaintenanceTicket } from "@/hooks/useMaintenance";

interface TicketCardProps {
  ticket: MaintenanceTicket;
  onAssign?: () => void;
  onResolve?: () => void;
  onView?: () => void;
  onDelete?: () => void;
  canAssign?: boolean;
  canDelete?: boolean;
  id?: string;
}

const STATUS_CONFIG = {
  open: {
    label: "Open",
    icon: AlertCircle,
    variant: "outline" as const,
    className: "border-warning text-warning",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    variant: "default" as const,
    className: "bg-primary",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle,
    variant: "secondary" as const,
    className: "bg-success/20 text-success border-success",
  },
};

const PRIORITY_CONFIG = {
  1: { label: "Normal", className: "bg-muted text-muted-foreground" },
  2: { label: "High", className: "bg-warning/20 text-warning" },
  3: { label: "Critical", className: "bg-destructive/20 text-destructive" },
};

export function TicketCard({ ticket, onAssign, onResolve, onView, onDelete, canAssign = true, canDelete = true, id }: TicketCardProps) {
  const statusConfig = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
  const priorityConfig = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[1];
  const StatusIcon = statusConfig.icon;

  return (
    <Card id={id} className="cursor-pointer transition-colors hover:bg-accent/50" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate">{ticket.title}</h3>
                <Badge className={priorityConfig.className}>{priorityConfig.label}</Badge>
              </div>
              {ticket.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {ticket.description}
                </p>
              )}
            </div>
            <Badge variant={statusConfig.variant} className={statusConfig.className}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Details Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {ticket.room && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>
                  Room {ticket.room.room_number}
                  {ticket.room.floor && ` (Floor ${ticket.room.floor})`}
                </span>
              </div>
            )}
            {ticket.assigned_profile && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{ticket.assigned_profile.full_name || ticket.assigned_profile.username}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
            </div>
          </div>

          {/* Resolution Notes (if resolved) */}
          {ticket.status === "resolved" && ticket.resolution_notes && (
            <div className="rounded-md bg-success/10 p-2 text-sm">
              <p className="font-medium text-success">Resolution:</p>
              <p className="text-muted-foreground line-clamp-2">{ticket.resolution_notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {ticket.status !== "resolved" && (
              <>
                {canAssign && !ticket.assigned_to && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssign?.();
                    }}
                  >
                    <User className="mr-1 h-3 w-3" />
                    Assign
                  </Button>
                )}
                {ticket.status === "in_progress" && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolve?.();
                    }}
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Resolve
                  </Button>
                )}
              </>
            )}
            {canDelete && onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
