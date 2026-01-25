import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield } from "lucide-react";

interface StaffStatsBarProps {
  stats: {
    totalStaff: number;
    activeStaff: number;
    inactiveStaff: number;
    roleBreakdown: Record<string, number>;
  };
}

export function StaffStatsBar({ stats }: StaffStatsBarProps) {
  const topRoles = Object.entries(stats.roleBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Staff</p>
            <p className="text-2xl font-bold">{stats.totalStaff}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-full bg-green-500/10 p-3">
            <UserCheck className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold">{stats.activeStaff}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-full bg-destructive/10 p-3">
            <UserX className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold">{stats.inactiveStaff}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-full bg-blue-500/10 p-3">
            <Shield className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Top Roles</p>
            <p className="text-sm font-medium">
              {topRoles.length > 0
                ? topRoles.map(([role, count]) => `${role}: ${count}`).join(", ")
                : "No roles assigned"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
