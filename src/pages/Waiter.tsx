import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Utensils, 
  Clock, 
  CheckCircle2, 
  Bell, 
  Plus,
  Timer,
  UtensilsCrossed
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePOSOutlets, useWaiterOrders, useWaiterStats, useUpdatePOSOrderStatus, POSOrder, POSOrderStatus } from "@/hooks/usePOS";
import { useNavigate } from "react-router-dom";

function WaiterStatsBar({ stats }: { stats: ReturnType<typeof useWaiterStats>["data"] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.pending || 0}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
              <Utensils className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.preparing || 0}</p>
              <p className="text-xs text-muted-foreground">Preparing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <Bell className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.ready || 0}</p>
              <p className="text-xs text-muted-foreground">Ready to Serve</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.servedToday || 0}</p>
              <p className="text-xs text-muted-foreground">Served Today</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WaiterOrderCard({ order, onServe }: { order: POSOrder; onServe: (id: string) => void }) {
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: false });
  const isReady = order.status === "ready";

  return (
    <Card className={isReady ? "border-green-500 bg-green-500/5 shadow-lg shadow-green-500/10" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">#{order.order_number.split("-").pop()}</CardTitle>
            <Badge 
              variant={
                order.status === "ready" ? "default" : 
                order.status === "preparing" ? "secondary" : 
                "outline"
              }
              className={order.status === "ready" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {order.status === "ready" && <Bell className="mr-1 h-3 w-3" />}
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
          <Badge variant="outline" className="gap-1">
            <Timer className="h-3 w-3" />
            {timeAgo}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {order.table_number && <span>Table {order.table_number}</span>}
          {order.room?.room_number && <span>Room {order.room.room_number}</span>}
          {order.covers && <span>• {order.covers} covers</span>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className="font-medium">{item.quantity}x</span>
              <span>{item.item_name}</span>
              {item.notes && (
                <span className="text-orange-600 text-xs">({item.notes})</span>
              )}
            </div>
          ))}
        </div>

        {isReady && (
          <Button 
            className="w-full mt-4 bg-green-600 hover:bg-green-700" 
            onClick={() => onServe(order.id)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark as Served
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function Waiter() {
  const navigate = useNavigate();
  const { data: outlets = [], isLoading: outletsLoading } = usePOSOutlets();
  const [selectedOutletId, setSelectedOutletId] = useState<string>("");

  const activeOutletId = selectedOutletId || outlets[0]?.id;
  
  const { data: orders = [], isLoading: ordersLoading } = useWaiterOrders(activeOutletId);
  const { data: stats } = useWaiterStats(activeOutletId);
  const updateStatus = useUpdatePOSOrderStatus();

  const handleServe = (orderId: string) => {
    updateStatus.mutate({ orderId, status: "served" as POSOrderStatus });
  };

  // Group orders by status
  const readyOrders = orders.filter(o => o.status === "ready");
  const preparingOrders = orders.filter(o => o.status === "preparing");
  const pendingOrders = orders.filter(o => o.status === "pending");

  if (outletsLoading) {
    return (
      <DashboardLayout title="Waiter Dashboard">
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (outlets.length === 0) {
    return (
      <DashboardLayout title="Waiter Dashboard">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <Utensils className="mx-auto h-12 w-12 text-muted-foreground/50" />
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
    <DashboardLayout title="Waiter Dashboard">
      <div className="flex h-full flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Utensils className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Waiter Dashboard</h1>
            {readyOrders.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {readyOrders.length} Ready!
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
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
            
            <Button onClick={() => navigate("/pos")}>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </div>
        </div>

        {/* Stats */}
        <WaiterStatsBar stats={stats} />

        {/* Orders Grid */}
        <div className="grid flex-1 grid-cols-3 gap-6 min-h-0">
          {/* Ready Orders - Priority */}
          <div className="flex flex-col">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              <h2 className="font-semibold">Ready to Serve</h2>
              <Badge variant="secondary">{readyOrders.length}</Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-2">
                {readyOrders.map((order) => (
                  <WaiterOrderCard key={order.id} order={order} onServe={handleServe} />
                ))}
                {readyOrders.length === 0 && (
                  <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground text-sm">
                    No orders ready
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Preparing Orders */}
          <div className="flex flex-col">
            <div className="mb-3 flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-orange-600" />
              <h2 className="font-semibold">Preparing</h2>
              <Badge variant="secondary">{preparingOrders.length}</Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-2">
                {preparingOrders.map((order) => (
                  <WaiterOrderCard key={order.id} order={order} onServe={handleServe} />
                ))}
                {preparingOrders.length === 0 && (
                  <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground text-sm">
                    No orders preparing
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Pending Orders */}
          <div className="flex flex-col">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold">Pending</h2>
              <Badge variant="secondary">{pendingOrders.length}</Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-2">
                {pendingOrders.map((order) => (
                  <WaiterOrderCard key={order.id} order={order} onServe={handleServe} />
                ))}
                {pendingOrders.length === 0 && (
                  <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground text-sm">
                    No pending orders
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
