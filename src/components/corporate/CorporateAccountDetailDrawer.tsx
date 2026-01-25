import { format } from "date-fns";
import {
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Percent,
  CreditCard,
  Calendar,
  Users,
  Edit2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCorporateAccountGuests,
  type CorporateAccount,
} from "@/hooks/useCorporateAccounts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CorporateAccountDetailDrawerProps {
  account: CorporateAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CorporateAccountDetailDrawer({
  account,
  open,
  onOpenChange,
}: CorporateAccountDetailDrawerProps) {
  const { data: guests = [], isLoading: guestsLoading } =
    useCorporateAccountGuests(account?.id);

  if (!account) return null;

  const getPaymentTermsLabel = (terms: string) => {
    switch (terms) {
      case "prepaid":
        return "Prepaid";
      case "net15":
        return "Net 15 Days";
      case "net30":
        return "Net 30 Days";
      case "net60":
        return "Net 60 Days";
      default:
        return terms;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-xl">{account.company_name}</SheetTitle>
              </div>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{account.account_code}</Badge>
                {account.is_active ? (
                  <Badge className="bg-success text-success-foreground">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </SheetDescription>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold">{account.discount_percentage}%</p>
                <p className="text-xs text-muted-foreground">Discount</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold">
                  ${account.credit_limit.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Credit Limit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold">{guests.length}</p>
                <p className="text-xs text-muted-foreground">Guests</p>
              </CardContent>
            </Card>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <Tabs defaultValue="details" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="guests">
              <Users className="h-3 w-3 mr-1" />
              Guests ({guests.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-380px)] mt-4">
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-0">
              {/* Contact Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {account.contact_name && (
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{account.contact_name}</span>
                    </div>
                  )}
                  {account.contact_email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{account.contact_email}</span>
                    </div>
                  )}
                  {account.contact_phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{account.contact_phone}</span>
                    </div>
                  )}
                  {account.billing_address && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="whitespace-pre-wrap">
                        {account.billing_address}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Billing Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Billing Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {account.discount_percentage}% Corporate Discount
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>
                      ${account.credit_limit.toLocaleString()} Credit Limit
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{getPaymentTermsLabel(account.payment_terms)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {account.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {account.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground text-center pt-2 space-y-1">
                <p>Created {format(new Date(account.created_at), "MMMM d, yyyy")}</p>
                <p>
                  Last updated {format(new Date(account.updated_at), "MMMM d, yyyy")}
                </p>
              </div>
            </TabsContent>

            {/* Guests Tab */}
            <TabsContent value="guests" className="space-y-3 mt-0">
              {guestsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : guests.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No guests linked to this account
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Link guests from the Guests page
                    </p>
                  </CardContent>
                </Card>
              ) : (
                guests.map((guest) => {
                  const initials = `${guest.first_name?.[0] || ""}${
                    guest.last_name?.[0] || ""
                  }`.toUpperCase();

                  return (
                    <Card key={guest.id}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {guest.first_name} {guest.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {guest.email || guest.phone || "No contact info"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {guest.total_stays} stays
                          </p>
                          <p className="text-xs text-success">
                            ${guest.total_revenue.toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
