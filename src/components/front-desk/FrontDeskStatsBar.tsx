import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn, LogOut, Hotel, BedDouble, AlertCircle } from "lucide-react";

interface FrontDeskStatsBarProps {
  arrivalsCount: number;
  departuresCount: number;
  inHouseCount: number;
  vacantRoomsCount: number;
  dirtyRoomsCount: number;
  isLoading?: boolean;
}

export function FrontDeskStatsBar({
  arrivalsCount,
  departuresCount,
  inHouseCount,
  vacantRoomsCount,
  dirtyRoomsCount,
  isLoading,
}: FrontDeskStatsBarProps) {
  const statItems = [
    {
      label: "Arrivals Today",
      value: arrivalsCount,
      icon: LogIn,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Departures Today",
      value: departuresCount,
      icon: LogOut,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "In House",
      value: inHouseCount,
      icon: Hotel,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Vacant Rooms",
      value: vacantRoomsCount,
      icon: BedDouble,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      label: "Dirty Rooms",
      value: dirtyRoomsCount,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
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
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
