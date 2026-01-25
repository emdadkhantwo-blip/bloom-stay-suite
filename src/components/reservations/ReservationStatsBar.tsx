import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, CalendarX, Hotel, Users, XCircle, Calendar } from "lucide-react";
import type { ReservationStats } from "@/hooks/useReservations";

interface ReservationStatsBarProps {
  stats: ReservationStats | null;
  isLoading?: boolean;
}

export function ReservationStatsBar({ stats, isLoading }: ReservationStatsBarProps) {
  const statItems = [
    {
      label: "Arrivals Today",
      value: stats?.arrivals_today ?? 0,
      icon: CalendarCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Departures Today",
      value: stats?.departures_today ?? 0,
      icon: CalendarX,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "In House",
      value: stats?.in_house ?? 0,
      icon: Hotel,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Confirmed",
      value: stats?.confirmed ?? 0,
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-500/10",
    },
    {
      label: "Cancelled",
      value: stats?.cancelled ?? 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
    },
    {
      label: "Total",
      value: stats?.total ?? 0,
      icon: Users,
      color: "text-slate-600",
      bgColor: "bg-slate-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {statItems.map((item) => (
        <Card key={item.label} className="border-none shadow-sm">
          <CardContent className="flex items-center gap-3 p-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bgColor}`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-semibold">{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
