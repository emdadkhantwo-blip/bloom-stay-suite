import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle, XCircle, Wrench } from "lucide-react";

interface PropertyStatsBarProps {
  stats: {
    totalProperties: number;
    activeProperties: number;
    inactiveProperties: number;
    maintenanceProperties: number;
  };
}

export function PropertyStatsBar({ stats }: PropertyStatsBarProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Properties</p>
            <p className="text-2xl font-bold">{stats.totalProperties}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-full bg-green-500/10 p-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold">{stats.activeProperties}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-full bg-muted p-3">
            <XCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold">{stats.inactiveProperties}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-full bg-amber-500/10 p-3">
            <Wrench className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Maintenance</p>
            <p className="text-2xl font-bold">{stats.maintenanceProperties}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
