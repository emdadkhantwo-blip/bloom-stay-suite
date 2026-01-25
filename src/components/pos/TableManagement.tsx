import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Clock,
  UtensilsCrossed,
  ChefHat,
  CheckCircle,
  Eye,
} from "lucide-react";
import { POSOrder, useUpdatePOSOrderStatus } from "@/hooks/usePOS";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TableManagementProps {
  orders: POSOrder[];
  outletId: string;
}

interface TableInfo {
  tableNumber: string;
  orders: POSOrder[];
  totalCovers: number;
  totalAmount: number;
  primaryStatus: string;
  lastOrderTime: string;
}

const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: React.ReactNode }> = {
  pending: { color: "text-yellow-600", bgColor: "bg-yellow-500/20 border-yellow-500/40", label: "Pending", icon: <Clock className="h-4 w-4" /> },
  preparing: { color: "text-orange-600", bgColor: "bg-orange-500/20 border-orange-500/40", label: "Preparing", icon: <ChefHat className="h-4 w-4" /> },
  ready: { color: "text-green-600", bgColor: "bg-green-500/20 border-green-500/40", label: "Ready", icon: <CheckCircle className="h-4 w-4" /> },
  served: { color: "text-blue-600", bgColor: "bg-blue-500/20 border-blue-500/40", label: "Served", icon: <UtensilsCrossed className="h-4 w-4" /> },
};

// Generate table layout (predefined tables)
const tableLayout = [
  { id: "T1", name: "Table 1", seats: 2, x: 0, y: 0 },
  { id: "T2", name: "Table 2", seats: 4, x: 1, y: 0 },
  { id: "T3", name: "Table 3", seats: 4, x: 2, y: 0 },
  { id: "T4", name: "Table 4", seats: 6, x: 3, y: 0 },
  { id: "T5", name: "Table 5", seats: 2, x: 0, y: 1 },
  { id: "T6", name: "Table 6", seats: 4, x: 1, y: 1 },
  { id: "T7", name: "Table 7", seats: 6, x: 2, y: 1 },
  { id: "T8", name: "Table 8", seats: 8, x: 3, y: 1 },
  { id: "B1", name: "Bar 1", seats: 2, x: 0, y: 2 },
  { id: "B2", name: "Bar 2", seats: 2, x: 1, y: 2 },
  { id: "B3", name: "Bar 3", seats: 4, x: 2, y: 2 },
  { id: "B4", name: "Bar 4", seats: 4, x: 3, y: 2 },
];

export function TableManagement({ orders, outletId }: TableManagementProps) {
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const updateOrderStatus = useUpdatePOSOrderStatus();

  // Group orders by table
  const tableOrders = orders.reduce<Record<string, POSOrder[]>>((acc, order) => {
    if (order.table_number && !["posted", "cancelled"].includes(order.status)) {
      const key = order.table_number;
      if (!acc[key]) acc[key] = [];
      acc[key].push(order);
    }
    return acc;
  }, {});

  // Calculate table info
  const getTableInfo = (tableNumber: string): TableInfo | null => {
    const tableOrdersList = tableOrders[tableNumber];
    if (!tableOrdersList || tableOrdersList.length === 0) return null;

    const totalCovers = tableOrdersList.reduce((sum, o) => sum + (o.covers || 1), 0);
    const totalAmount = tableOrdersList.reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    // Get primary status (worst status first: pending > preparing > ready > served)
    const statusPriority = ["pending", "preparing", "ready", "served"];
    const primaryStatus = statusPriority.find(s => 
      tableOrdersList.some(o => o.status === s)
    ) || "served";

    const lastOrderTime = tableOrdersList
      .map(o => o.created_at)
      .sort()
      .reverse()[0];

    return {
      tableNumber,
      orders: tableOrdersList,
      totalCovers,
      totalAmount,
      primaryStatus,
      lastOrderTime,
    };
  };

  const handleMarkServed = async (orderId: string) => {
    await updateOrderStatus.mutateAsync({ orderId, status: "served" });
  };

  const handleMarkReady = async (orderId: string) => {
    await updateOrderStatus.mutateAsync({ orderId, status: "ready" });
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Occupied Tables</p>
              <p className="text-2xl font-bold">{Object.keys(tableOrders).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-yellow-500/10 p-3">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
              <p className="text-2xl font-bold">
                {orders.filter(o => o.status === "pending" && o.table_number).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-green-500/10 p-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ready to Serve</p>
              <p className="text-2xl font-bold">
                {orders.filter(o => o.status === "ready" && o.table_number).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-muted p-3">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Covers</p>
              <p className="text-2xl font-bold">
                {orders.filter(o => !["posted", "cancelled"].includes(o.status) && o.table_number)
                  .reduce((sum, o) => sum + (o.covers || 1), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Floor Plan</span>
            <div className="flex items-center gap-4 text-sm font-normal">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted" />
                <span className="text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-muted-foreground">Preparing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Served</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {tableLayout.map((table) => {
              const tableInfo = getTableInfo(table.id);
              const status = statusConfig[tableInfo?.primaryStatus || ""] || null;
              const isOccupied = !!tableInfo;

              return (
                <button
                  key={table.id}
                  onClick={() => tableInfo && setSelectedTable(tableInfo)}
                  disabled={!isOccupied}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all",
                    "min-h-[120px]",
                    isOccupied
                      ? cn(status?.bgColor, "cursor-pointer hover:shadow-lg")
                      : "border-dashed border-muted-foreground/30 bg-muted/30"
                  )}
                >
                  <span className={cn(
                    "text-lg font-bold",
                    isOccupied ? status?.color : "text-muted-foreground"
                  )}>
                    {table.id}
                  </span>
                  
                  {isOccupied ? (
                    <>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{tableInfo.totalCovers} guests</span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={cn("mt-2", status?.color)}
                      >
                        {status?.icon}
                        <span className="ml-1">{status?.label}</span>
                      </Badge>
                      <p className="mt-1 text-xs font-semibold">
                        ${tableInfo.totalAmount.toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <span className="mt-1 text-xs text-muted-foreground">
                      {table.seats} seats
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Table Detail Dialog */}
      <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              {selectedTable?.tableNumber} - Table Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="mx-auto h-5 w-5 text-muted-foreground" />
                  <p className="mt-1 text-2xl font-bold">{selectedTable?.totalCovers}</p>
                  <p className="text-xs text-muted-foreground">Guests</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <UtensilsCrossed className="mx-auto h-5 w-5 text-muted-foreground" />
                  <p className="mt-1 text-2xl font-bold">{selectedTable?.orders.length}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <span className="text-muted-foreground">$</span>
                  <p className="mt-1 text-2xl font-bold">{selectedTable?.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
            </div>

            {/* Orders List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {selectedTable?.orders.map((order) => {
                  const orderStatus = statusConfig[order.status];
                  return (
                    <Card key={order.id} className={cn("border", orderStatus?.bgColor)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{order.order_number}</span>
                              <Badge variant="outline" className={orderStatus?.color}>
                                {orderStatus?.icon}
                                <span className="ml-1">{orderStatus?.label}</span>
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {format(new Date(order.created_at), "h:mm a")} • {order.covers} covers
                            </p>
                            {order.notes && (
                              <p className="mt-1 text-sm italic text-muted-foreground">
                                "{order.notes}"
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">${Number(order.total_amount).toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="mt-3 space-y-1 border-t pt-3">
                          {order.items?.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>
                                {item.quantity}x {item.item_name}
                                {item.notes && (
                                  <span className="ml-1 text-muted-foreground">({item.notes})</span>
                                )}
                              </span>
                              <span>${Number(item.total_price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex gap-2 border-t pt-3">
                          {order.status === "preparing" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkReady(order.id)}
                              disabled={updateOrderStatus.isPending}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Mark Ready
                            </Button>
                          )}
                          {order.status === "ready" && (
                            <Button 
                              size="sm"
                              onClick={() => handleMarkServed(order.id)}
                              disabled={updateOrderStatus.isPending}
                            >
                              <UtensilsCrossed className="mr-1 h-4 w-4" />
                              Mark Served
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}