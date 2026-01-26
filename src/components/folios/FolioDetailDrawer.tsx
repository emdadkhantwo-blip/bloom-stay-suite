import { useState } from "react";
import { format } from "date-fns";
import { X, Plus, CreditCard, Receipt, Ban, Check, Printer } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCloseFolio, useFolioById } from "@/hooks/useFolios";
import { AddChargeDialog } from "./AddChargeDialog";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { VoidItemDialog } from "./VoidItemDialog";
import type { Folio, FolioItem } from "@/hooks/useFolios";
import { cn } from "@/lib/utils";

interface FolioDetailDrawerProps {
  folio: Folio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FolioDetailDrawer({ folio: initialFolio, open, onOpenChange }: FolioDetailDrawerProps) {
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [voidItemOpen, setVoidItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FolioItem | null>(null);

  const { data: folio } = useFolioById(initialFolio?.id || null);
  const closeFolio = useCloseFolio();

  const displayFolio = folio || initialFolio;
  if (!displayFolio) return null;

  const isOpen = displayFolio.status === "open";
  const hasBalance = Number(displayFolio.balance) > 0;
  const activeItems = displayFolio.folio_items.filter((item) => !item.voided);
  const voidedItems = displayFolio.folio_items.filter((item) => item.voided);

  const handleVoidItem = (item: FolioItem) => {
    setSelectedItem(item);
    setVoidItemOpen(true);
  };

  const handleCloseFolio = () => {
    if (hasBalance) return;
    closeFolio.mutate(displayFolio.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const formatItemType = (type: string) => {
    return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  {displayFolio.folio_number}
                </SheetTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {displayFolio.guest?.first_name} {displayFolio.guest?.last_name}
                </p>
              </div>
              <Badge variant={isOpen ? "default" : "secondary"}>
                {isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-6 pr-4">
              {/* Reservation Info */}
              {displayFolio.reservation && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm font-medium">Reservation</p>
                  <p className="text-sm text-muted-foreground">
                    {displayFolio.reservation.confirmation_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(displayFolio.reservation.check_in_date), "MMM d, yyyy")} -{" "}
                    {format(new Date(displayFolio.reservation.check_out_date), "MMM d, yyyy")}
                  </p>
                </div>
              )}

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                  <p className="text-lg font-semibold">৳{Number(displayFolio.subtotal).toLocaleString()}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Tax</p>
                  <p className="text-lg font-semibold">৳{Number(displayFolio.tax_amount).toLocaleString()}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">৳{Number(displayFolio.total_amount).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-emerald-500/10">
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    ৳{Number(displayFolio.paid_amount).toLocaleString()}
                  </p>
                </div>
                <div className={cn(
                  "text-center p-3 rounded-lg",
                  hasBalance ? "bg-amber-500/10" : "bg-emerald-500/10"
                )}>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className={cn(
                    "text-lg font-semibold",
                    hasBalance ? "text-amber-600" : "text-emerald-600"
                  )}>
                    ৳{Number(displayFolio.balance).toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Charges */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Charges</h3>
                  {isOpen && (
                    <Button size="sm" variant="outline" onClick={() => setAddChargeOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Charge
                    </Button>
                  )}
                </div>

                {activeItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No charges</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        {isOpen && <TableHead className="w-10"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatItemType(item.item_type)} • {format(new Date(item.service_date), "MMM d")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            ৳{Number(item.total_price).toLocaleString()}
                          </TableCell>
                          {isOpen && (
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleVoidItem(item)}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {voidedItems.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Voided Items</p>
                    {voidedItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 text-sm text-muted-foreground line-through">
                        <span>{item.description}</span>
                        <span>৳{Number(item.total_price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Payments */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Payments</h3>
                  {isOpen && (
                    <Button size="sm" variant="outline" onClick={() => setPaymentOpen(true)}>
                      <CreditCard className="h-4 w-4 mr-1" />
                      Record Payment
                    </Button>
                  )}
                </div>

                {displayFolio.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No payments</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayFolio.payments.filter((p) => !p.voided).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="capitalize">
                            {payment.payment_method.replace("_", " ")}
                          </TableCell>
                          <TableCell>
                            {format(new Date(payment.created_at), "MMM d, HH:mm")}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600">
                            ৳{Number(payment.amount).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Actions */}
          {isOpen && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                className="flex-1"
                variant="outline"
                disabled={hasBalance}
                onClick={handleCloseFolio}
              >
                <Check className="h-4 w-4 mr-2" />
                Close Folio
              </Button>
              <Button variant="outline" size="icon">
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <AddChargeDialog
        folioId={displayFolio.id}
        open={addChargeOpen}
        onOpenChange={setAddChargeOpen}
      />
      <RecordPaymentDialog
        folioId={displayFolio.id}
        balance={Number(displayFolio.balance)}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      />
      {selectedItem && (
        <VoidItemDialog
          item={selectedItem}
          folioId={displayFolio.id}
          open={voidItemOpen}
          onOpenChange={setVoidItemOpen}
        />
      )}
    </>
  );
}
