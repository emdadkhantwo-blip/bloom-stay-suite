import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecordPayment, PaymentMethod } from "@/hooks/useFolios";

interface RecordPaymentDialogProps {
  folioId: string;
  balance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export function RecordPaymentDialog({ folioId, balance, open, onOpenChange }: RecordPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState(balance.toString());
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const recordPayment = useRecordPayment();

  const handleSubmit = () => {
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) return;

    recordPayment.mutate(
      {
        folioId,
        amount: paymentAmount,
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setAmount("");
          setReferenceNumber("");
          setNotes("");
        },
      }
    );
  };

  const handlePayFull = () => {
    setAmount(balance.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-sm text-muted-foreground">Outstanding Balance</p>
            <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Amount ($)</Label>
              <Button type="button" variant="link" size="sm" onClick={handlePayFull}>
                Pay Full Balance
              </Button>
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {(paymentMethod === "credit_card" || paymentMethod === "debit_card" || paymentMethod === "bank_transfer") && (
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                placeholder="Transaction ID or reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0 || recordPayment.isPending}
          >
            {recordPayment.isPending ? "Recording..." : `Record $${parseFloat(amount || "0").toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
