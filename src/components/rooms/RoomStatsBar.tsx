import { cn } from "@/lib/utils";

interface RoomStatsBarProps {
  stats: {
    total: number;
    vacant: number;
    occupied: number;
    dirty: number;
    maintenance: number;
    out_of_order: number;
  } | null;
  isLoading?: boolean;
}

export function RoomStatsBar({ stats, isLoading }: RoomStatsBarProps) {
  if (isLoading || !stats) {
    return (
      <div className="flex items-center gap-4 rounded-lg border bg-card p-3">
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const occupancyRate = stats.total > 0 
    ? Math.round((stats.occupied / stats.total) * 100) 
    : 0;

  const statItems = [
    { label: "Total", value: stats.total, className: "text-foreground" },
    { label: "Vacant", value: stats.vacant, className: "text-room-vacant" },
    { label: "Occupied", value: stats.occupied, className: "text-room-occupied" },
    { label: "Dirty", value: stats.dirty, className: "text-room-dirty" },
    { label: "Maintenance", value: stats.maintenance, className: "text-room-maintenance" },
    { label: "OOO", value: stats.out_of_order, className: "text-room-out-of-order" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card px-4 py-3">
      {statItems.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={cn("text-lg font-bold tabular-nums", item.className)}>
            {item.value}
          </span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
      
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Occupancy</span>
        <span className="text-lg font-bold text-primary">{occupancyRate}%</span>
      </div>
    </div>
  );
}
