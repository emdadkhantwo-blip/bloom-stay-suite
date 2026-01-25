import { format } from "date-fns";
import { User, Calendar, Receipt, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Folio } from "@/hooks/useFolios";
import { cn } from "@/lib/utils";

interface FolioCardProps {
  folio: Folio;
  onClick: () => void;
}

export function FolioCard({ folio, onClick }: FolioCardProps) {
  const isOpen = folio.status === "open";
  const hasBalance = Number(folio.balance) > 0;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isOpen && hasBalance && "border-amber-500/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm font-medium">{folio.folio_number}</span>
          </div>
          <Badge variant={isOpen ? "default" : "secondary"}>
            {isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Guest Info */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {folio.guest?.first_name} {folio.guest?.last_name}
          </span>
        </div>

        {/* Reservation Info */}
        {folio.reservation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(folio.reservation.check_in_date), "MMM d")} -{" "}
              {format(new Date(folio.reservation.check_out_date), "MMM d, yyyy")}
            </span>
          </div>
        )}

        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold">${Number(folio.total_amount).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className={cn(
              "font-semibold",
              hasBalance ? "text-amber-600" : "text-emerald-600"
            )}>
              ${Number(folio.balance).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Payments indicator */}
        {folio.payments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CreditCard className="h-3 w-3" />
            <span>{folio.payments.length} payment(s)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
