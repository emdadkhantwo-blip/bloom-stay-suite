import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, ChefHat, CheckCircle, Timer, Volume2, VolumeX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useKitchenOrders, useUpdatePOSOrderStatus, POSOrderStatus } from "@/hooks/usePOS";
import { useKitchenNotifications } from "@/hooks/useKitchenNotifications";

interface KitchenDisplayProps {
  outletId: string;
}

export function KitchenDisplay({ outletId }: KitchenDisplayProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { data: orders = [], isLoading } = useKitchenOrders(outletId);
  const updateStatus = useUpdatePOSOrderStatus();
  
  // Real-time notifications with sound
  useKitchenNotifications({ outletId, enabled: soundEnabled });

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");

  const handleStatusChange = (orderId: string, status: POSOrderStatus) => {
    updateStatus.mutate({ orderId, status });
  };

  const OrderCard = ({ order, isPreparing = false }: { order: typeof orders[0]; isPreparing?: boolean }) => {
    const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: false });
    const isUrgent = new Date().getTime() - new Date(order.created_at).getTime() > 15 * 60 * 1000; // 15 mins

    return (
      <Card className={`${isUrgent && !isPreparing ? "border-destructive bg-destructive/5" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">#{order.order_number.split("-").pop()}</CardTitle>
            <Badge variant={isPreparing ? "default" : "secondary"} className="gap-1">
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
          <div className="space-y-2">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border bg-card p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  {item.quantity}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.item_name}</p>
                  {item.notes && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      ⚠️ {item.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="mt-3 rounded-lg bg-yellow-500/10 p-2 text-sm text-yellow-700 dark:text-yellow-300">
              📝 {order.notes}
            </div>
          )}

          <div className="mt-4">
            {!isPreparing ? (
              <Button
                className="w-full"
                onClick={() => handleStatusChange(order.id, "preparing")}
                disabled={updateStatus.isPending}
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Start Preparing
              </Button>
            ) : (
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => handleStatusChange(order.id, "ready")}
                disabled={updateStatus.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Ready
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading kitchen display...</div>
      </div>
    );
  }

  return (
    <div className="relative grid h-full grid-cols-2 gap-6">
      {/* Sound Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="absolute right-0 top-0 z-10"
        onClick={() => setSoundEnabled(!soundEnabled)}
      >
        {soundEnabled ? (
          <>
            <Volume2 className="mr-2 h-4 w-4" />
            Sound On
          </>
        ) : (
          <>
            <VolumeX className="mr-2 h-4 w-4" />
            Sound Off
          </>
        )}
      </Button>
      {/* Pending Orders */}
      <div className="flex flex-col">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-600" />
          <h2 className="text-xl font-bold">Pending</h2>
          <Badge variant="secondary">{pendingOrders.length}</Badge>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {pendingOrders.length === 0 && (
              <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                No pending orders
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Preparing Orders */}
      <div className="flex flex-col">
        <div className="mb-4 flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-orange-600" />
          <h2 className="text-xl font-bold">Preparing</h2>
          <Badge variant="secondary">{preparingOrders.length}</Badge>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {preparingOrders.map((order) => (
              <OrderCard key={order.id} order={order} isPreparing />
            ))}
            {preparingOrders.length === 0 && (
              <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                No orders being prepared
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
