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
} from "lucide-react";
import { POSOrder, useUpdatePOSOrderStatus } from "@/hooks/usePOS";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TableManagementProps {
  orders: POSOrder[];
  outletId: string;
  onSelectEmptyTable?: (tableId: string) => void;
}

interface TableInfo {
  tableNumber: string;
  orders: POSOrder[];
  totalCovers: number;
  totalAmount: number;
  primaryStatus: string;
  lastOrderTime: string;
}

const statusConfig: Record<string, { 
  color: string; 
  bgColor: string; 
  borderColor: string;
  gradient: string;
  label: string; 
  icon: React.ReactNode;
}> = {
  pending: { 
    color: "text-amber-700", 
    bgColor: "bg-amber-100", 
    borderColor: "border-amber-300",
    gradient: "from-amber-500 to-orange-600",
    label: "Pending", 
    icon: <Clock className="h-4 w-4" /> 
  },
  preparing: { 
    color: "text-blue-700", 
    bgColor: "bg-blue-100", 
    borderColor: "border-blue-300",
    gradient: "from-blue-500 to-indigo-600",
    label: "Preparing", 
    icon: <ChefHat className="h-4 w-4" /> 
  },
  ready: { 
    color: "text-emerald-700", 
    bgColor: "bg-emerald-100", 
    borderColor: "border-emerald-300",
    gradient: "from-emerald-500 to-teal-600",
    label: "Ready", 
    icon: <CheckCircle className="h-4 w-4" /> 
  },
  served: { 
    color: "text-purple-700", 
    bgColor: "bg-purple-100", 
    borderColor: "border-purple-300",
    gradient: "from-purple-500 to-violet-600",
    label: "Served", 
    icon: <UtensilsCrossed className="h-4 w-4" /> 
  },
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

export function TableManagement({ orders, outletId, onSelectEmptyTable }: TableManagementProps) {
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

  const stats = [
    {
      label: "Occupied Tables",
      value: Object.keys(tableOrders).length,
      icon: UtensilsCrossed,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Pending Orders",
      value: orders.filter(o => o.status === "pending" && o.table_number).length,
      icon: Clock,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      label: "Ready to Serve",
      value: orders.filter(o => o.status === "ready" && o.table_number).length,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Total Covers",
      value: orders.filter(o => !["posted", "cancelled"].includes(o.status) && o.table_number)
        .reduce((sum, o) => sum + (o.covers || 1), 0),
      icon: Users,
      gradient: "from-purple-500 to-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card 
            key={stat.label}
            className={cn(
              "relative overflow-hidden border-none shadow-lg",
              `bg-gradient-to-br ${stat.gradient}`
            )}
          >
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
            <CardContent className="relative z-10 flex items-center gap-4 p-4">
              <div className="rounded-xl bg-white/20 p-3">
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/80">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Grid */}
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UtensilsCrossed className="h-5 w-5 text-blue-600" />
              </div>
              Floor Plan
            </span>
            <div className="flex items-center gap-4 text-sm font-normal">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted border" />
                <span className="text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Preparing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
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
                  onClick={() => {
                    if (tableInfo) {
                      setSelectedTable(tableInfo);
                    } else {
                      onSelectEmptyTable?.(table.id);
                    }
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all duration-200",
                    "min-h-[140px]",
                    isOccupied
                      ? cn(
                          status?.bgColor, 
                          status?.borderColor,
                          "cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
                          tableInfo.primaryStatus === "ready" && "ring-2 ring-emerald-300 animate-pulse"
                        )
                      : "border-dashed border-muted-foreground/30 bg-muted/20 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  )}
                >
                  <span className={cn(
                    "text-2xl font-bold",
                    isOccupied ? status?.color : "text-muted-foreground"
                  )}>
                    {table.id}
                  </span>
                  
                  {isOccupied ? (
                    <>
                      <div className="mt-2 flex items-center gap-1.5 text-sm">
                        <Users className={cn("h-4 w-4", status?.color)} />
                        <span className={status?.color}>{tableInfo.totalCovers} guests</span>
                      </div>
                      <Badge 
                        className={cn(
                          "mt-3 gap-1",
                          status?.bgColor,
                          status?.color,
                          "border",
                          status?.borderColor
                        )}
                      >
                        {status?.icon}
                        <span>{status?.label}</span>
                      </Badge>
                      <p className={cn("mt-2 font-bold", status?.color)}>
                        ৳{tableInfo.totalAmount.toFixed(0)}
                      </p>
                    </>
                  ) : (
                    <span className="mt-2 text-sm text-muted-foreground">
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
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UtensilsCrossed className="h-5 w-5 text-blue-600" />
              </div>
              {selectedTable?.tableNumber} - Table Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-none">
                <CardContent className="p-4 text-center text-white">
                  <Users className="mx-auto h-5 w-5" />
                  <p className="mt-1 text-2xl font-bold">{selectedTable?.totalCovers}</p>
                  <p className="text-xs text-white/80">Guests</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-violet-600 border-none">
                <CardContent className="p-4 text-center text-white">
                  <UtensilsCrossed className="mx-auto h-5 w-5" />
                  <p className="mt-1 text-2xl font-bold">{selectedTable?.orders.length}</p>
                  <p className="text-xs text-white/80">Orders</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-none">
                <CardContent className="p-4 text-center text-white">
                  <span className="text-white/80">৳</span>
                  <p className="mt-1 text-2xl font-bold">{selectedTable?.totalAmount.toFixed(0)}</p>
                  <p className="text-xs text-white/80">Total</p>
                </CardContent>
              </Card>
            </div>

            {/* Orders List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {selectedTable?.orders.map((order) => {
                  const orderStatus = statusConfig[order.status];
                  return (
                    <Card key={order.id} className={cn("border-l-4", orderStatus?.bgColor, orderStatus?.borderColor?.replace("border-", "border-l-"))}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{order.order_number}</span>
                              <Badge className={cn("border gap-1", orderStatus?.bgColor, orderStatus?.color, orderStatus?.borderColor)}>
                                {orderStatus?.icon}
                                <span>{orderStatus?.label}</span>
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
                            <p className="text-lg font-bold">৳{Number(order.total_amount).toFixed(0)}</p>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="mt-3 space-y-1 border-t pt-3">
                          {order.items?.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>
                                <span className="font-medium">{item.quantity}x</span> {item.item_name}
                                {item.notes && (
                                  <span className="ml-1 text-amber-600">({item.notes})</span>
                                )}
                              </span>
                              <span className="font-medium">৳{Number(item.total_price).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex gap-2 border-t pt-3">
                          {order.status === "preparing" && (
                            <Button 
                              size="sm" 
                              className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200"
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
                              className="bg-gradient-to-r from-purple-500 to-violet-600 text-white"
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
