import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Minus, Plus, Trash2, ShoppingCart, Send } from "lucide-react";
import { POSItem, POSOutlet, useCreatePOSOrder, useActiveFolios } from "@/hooks/usePOS";
import { useTenant } from "@/hooks/useTenant";
import { useRooms } from "@/hooks/useRooms";
import { toast } from "sonner";

interface CartItem {
  item: POSItem;
  quantity: number;
  notes?: string;
}

interface POSOrderPanelProps {
  cart: CartItem[];
  outlet: POSOutlet;
  onUpdateItem: (itemId: string, quantity: number, notes?: string) => void;
  onClearCart: () => void;
}

export function POSOrderPanel({ cart, outlet, onUpdateItem, onClearCart }: POSOrderPanelProps) {
  const [tableNumber, setTableNumber] = useState("");
  const [covers, setCovers] = useState("1");
  const [selectedFolioId, setSelectedFolioId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { currentProperty } = useTenant();
  const { data: folios = [] } = useActiveFolios();
  const { data: rooms = [] } = useRooms();
  const createOrder = useCreatePOSOrder();

  const occupiedRooms = rooms.filter((r) => r.status === "occupied");

  const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const taxRate = currentProperty?.tax_rate || 0;
  const serviceChargeRate = currentProperty?.service_charge_rate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const serviceCharge = subtotal * (serviceChargeRate / 100);
  const total = subtotal + taxAmount + serviceCharge;

  const handleSubmitOrder = () => {
    if (cart.length === 0) {
      toast.error("Please add items to the order");
      return;
    }

    const selectedFolio = folios.find((f) => f.id === selectedFolioId);

    createOrder.mutate(
      {
        outlet_id: outlet.id,
        outlet_code: outlet.code,
        folio_id: selectedFolioId || undefined,
        room_id: selectedRoomId || undefined,
        guest_id: selectedFolio?.guest_id || undefined,
        table_number: tableNumber || undefined,
        covers: parseInt(covers) || 1,
        notes: notes || undefined,
        items: cart.map((c) => ({
          item_id: c.item.id,
          item_name: c.item.name,
          quantity: c.quantity,
          unit_price: c.item.price,
          notes: c.notes,
        })),
      },
      {
        onSuccess: () => {
          onClearCart();
          setTableNumber("");
          setCovers("1");
          setSelectedFolioId(null);
          setSelectedRoomId(null);
          setNotes("");
        },
      }
    );
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Current Order
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden pb-0">
        {/* Order Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Table #</Label>
            <Input
              placeholder="e.g., T1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Covers</Label>
            <Input
              type="number"
              min="1"
              value={covers}
              onChange={(e) => setCovers(e.target.value)}
              className="h-8"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Room (for room service)</Label>
          <Select
            value={selectedRoomId || "none"}
            onValueChange={(v) => setSelectedRoomId(v === "none" ? null : v)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No room</SelectItem>
              {occupiedRooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  Room {room.room_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Post to Folio</Label>
          <Select
            value={selectedFolioId || "none"}
            onValueChange={(v) => setSelectedFolioId(v === "none" ? null : v)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select folio (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Pay at counter</SelectItem>
              {folios.map((folio) => (
                <SelectItem key={folio.id} value={folio.id}>
                  {folio.folio_number} - {folio.guest?.first_name} {folio.guest?.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Cart Items */}
        <ScrollArea className="flex-1">
          {cart.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No items in order
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((cartItem) => (
                <div
                  key={cartItem.item.id}
                  className="rounded-lg border bg-card p-3"
                >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{cartItem.item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ৳{Number(cartItem.item.price).toFixed(2)} each
                        </p>
                      </div>
                      <p className="font-semibold">
                        ৳{(cartItem.item.price * cartItem.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        onUpdateItem(cartItem.item.id, cartItem.quantity - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {cartItem.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        onUpdateItem(cartItem.item.id, cartItem.quantity + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-7 w-7 text-destructive"
                      onClick={() => onUpdateItem(cartItem.item.id, 0)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Special instructions..."
                    value={cartItem.notes || ""}
                    onChange={(e) =>
                      onUpdateItem(cartItem.item.id, cartItem.quantity, e.target.value)
                    }
                    className="mt-2 h-7 text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-4">
        {/* Totals */}
        <div className="w-full space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>৳{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax ({taxRate}%)</span>
            <span>৳{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service ({serviceChargeRate}%)</span>
            <span>৳{serviceCharge.toFixed(2)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>৳{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClearCart}
            disabled={cart.length === 0}
          >
            Clear
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmitOrder}
            disabled={cart.length === 0 || createOrder.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            {createOrder.isPending ? "Sending..." : "Send Order"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
