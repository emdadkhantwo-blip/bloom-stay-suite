import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, Clock, Flame } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KitchenDisplay } from "@/components/pos/KitchenDisplay";
import { usePOSOutlets, useKitchenOrders } from "@/hooks/usePOS";

function KitchenStatsBar({ outletId }: { outletId?: string }) {
  const { data: orders = [] } = useKitchenOrders(outletId);
  
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const preparingCount = orders.filter(o => o.status === "preparing").length;
  const urgentCount = orders.filter(o => {
    const isUrgent = new Date().getTime() - new Date(o.created_at).getTime() > 15 * 60 * 1000;
    return isUrgent && o.status === "pending";
  }).length;

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Orders</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
              <ChefHat className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{preparingCount}</p>
              <p className="text-xs text-muted-foreground">Preparing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
              <Flame className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{urgentCount}</p>
              <p className="text-xs text-muted-foreground">Urgent (15+ min)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Kitchen() {
  const { data: outlets = [], isLoading: outletsLoading } = usePOSOutlets();
  const [selectedOutletId, setSelectedOutletId] = useState<string>("");

  // Auto-select first outlet
  const activeOutletId = selectedOutletId || outlets[0]?.id;

  if (outletsLoading) {
    return (
      <DashboardLayout title="Kitchen Display">
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (outlets.length === 0) {
    return (
      <DashboardLayout title="Kitchen Display">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <ChefHat className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h2 className="mt-4 text-lg font-medium">No Outlets Available</h2>
            <p className="text-sm text-muted-foreground">
              Contact your manager to set up POS outlets.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Kitchen Display">
      <div className="flex h-full flex-col gap-6 p-6">
        {/* Header with outlet selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Kitchen Display</h1>
            <Badge variant="outline" className="ml-2">
              Live
            </Badge>
          </div>
          
          {outlets.length > 1 && (
            <Select value={activeOutletId} onValueChange={setSelectedOutletId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select outlet" />
              </SelectTrigger>
              <SelectContent>
                {outlets.map((outlet) => (
                  <SelectItem key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Stats */}
        <KitchenStatsBar outletId={activeOutletId} />

        {/* Kitchen Display */}
        <div className="flex-1 min-h-0">
          {activeOutletId && <KitchenDisplay outletId={activeOutletId} />}
        </div>
      </div>
    </DashboardLayout>
  );
}
