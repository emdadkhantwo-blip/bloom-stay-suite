import { Receipt, CreditCard, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FolioStats } from "@/hooks/useFolios";

interface FolioStatsBarProps {
  stats: FolioStats | undefined;
  isLoading: boolean;
}

export function FolioStatsBar({ stats, isLoading }: FolioStatsBarProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: "Open Folios",
      value: stats?.total_open || 0,
      icon: Receipt,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Closed Folios",
      value: stats?.total_closed || 0,
      icon: CreditCard,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Outstanding Balance",
      value: `৳${(stats?.total_balance || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Today's Revenue",
      value: `৳${(stats?.today_revenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`rounded-lg p-3 ${item.bgColor}`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold">{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
