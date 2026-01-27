import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn, LogOut, Hotel, BedDouble, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      shadowColor: "shadow-emerald-500/25",
      ringColor: "ring-emerald-400/30",
    },
    {
      label: "Departures Today",
      value: departuresCount,
      icon: LogOut,
      gradient: "from-amber-500 via-orange-500 to-red-500",
      shadowColor: "shadow-orange-500/25",
      ringColor: "ring-orange-400/30",
    },
    {
      label: "In House",
      value: inHouseCount,
      icon: Hotel,
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      shadowColor: "shadow-blue-500/25",
      ringColor: "ring-blue-400/30",
    },
    {
      label: "Vacant Rooms",
      value: vacantRoomsCount,
      icon: BedDouble,
      gradient: "from-cyan-500 via-sky-500 to-blue-500",
      shadowColor: "shadow-cyan-500/25",
      ringColor: "ring-cyan-400/30",
    },
    {
      label: "Dirty Rooms",
      value: dirtyRoomsCount,
      icon: Sparkles,
      gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
      shadowColor: "shadow-rose-500/25",
      ringColor: "ring-rose-400/30",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {statItems.map((item) => (
        <Card 
          key={item.label} 
          className={cn(
            "group relative overflow-hidden border-none rounded-2xl transition-all duration-500",
            "hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]",
            `bg-gradient-to-br ${item.gradient}`,
            item.shadowColor,
            "shadow-xl ring-1",
            item.ringColor
          )}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          {/* Decorative elements */}
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10 blur-lg" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full bg-white/5" />
          
          <CardContent className="relative z-10 flex items-center gap-4 p-5">
            <div className="relative">
              <div className="rounded-2xl bg-white/20 backdrop-blur-sm p-3 ring-1 ring-white/30 shadow-lg">
                <item.icon className="h-6 w-6 text-white drop-shadow-sm" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div className="space-y-0.5">
              <p className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">
                {item.value}
              </p>
              <p className="text-xs text-white/90 font-medium tracking-wide uppercase">
                {item.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
