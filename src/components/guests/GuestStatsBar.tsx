import { Users, Star, Ban, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GuestStatsBarProps {
  totalGuests: number;
  vipGuests: number;
  blacklistedGuests: number;
  totalRevenue: number;
  isLoading?: boolean;
}

export function GuestStatsBar({
  totalGuests,
  vipGuests,
  blacklistedGuests,
  totalRevenue,
  isLoading,
}: GuestStatsBarProps) {
  const stats = [
    {
      label: "Total Guests",
      value: totalGuests,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "VIP Guests",
      value: vipGuests,
      icon: Star,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Blacklisted",
      value: blacklistedGuests,
      icon: Ban,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
      isRevenue: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-semibold">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
