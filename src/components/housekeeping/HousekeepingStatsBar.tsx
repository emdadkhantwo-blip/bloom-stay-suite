import { ClipboardList, Clock, CheckCircle2, Home, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface HousekeepingStatsBarProps {
  stats: {
    pending: number;
    inProgress: number;
    completed: number;
    totalRooms: number;
    dirtyRooms: number;
  } | undefined;
  isLoading: boolean;
}

export function HousekeepingStatsBar({ stats, isLoading }: HousekeepingStatsBarProps) {
  const statItems = [
    {
      label: 'Pending Tasks',
      value: stats?.pending || 0,
      icon: ClipboardList,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'In Progress',
      value: stats?.inProgress || 0,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Completed Today',
      value: stats?.completed || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Dirty Rooms',
      value: stats?.dirtyRooms || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Total Rooms',
      value: stats?.totalRooms || 0,
      icon: Home,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {statItems.map((item) => (
        <Card key={item.label} className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`rounded-lg p-2 ${item.bgColor}`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
