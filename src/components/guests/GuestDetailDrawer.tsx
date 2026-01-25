import { useState } from "react";
import { format } from "date-fns";
import {
  Star,
  Ban,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  Globe,
  FileText,
  Edit2,
  Hotel,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Guest } from "@/hooks/useGuests";
import { useGuestReservations } from "@/hooks/useGuests";

interface GuestDetailDrawerProps {
  guest: Guest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function GuestDetailDrawer({
  guest,
  open,
  onOpenChange,
  onEdit,
}: GuestDetailDrawerProps) {
  const { data: reservations = [], isLoading: reservationsLoading } = useGuestReservations(guest?.id);

  if (!guest) return null;

  const initials = `${guest.first_name?.[0] || ""}${guest.last_name?.[0] || ""}`.toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-xl">
                  {guest.first_name} {guest.last_name}
                </SheetTitle>
              </div>
              <SheetDescription className="flex flex-wrap items-center gap-2 mt-1">
                {guest.is_vip && (
                  <Badge variant="outline" className="border-warning bg-warning/10 text-warning">
                    <Star className="mr-1 h-3 w-3" />
                    VIP
                  </Badge>
                )}
                {guest.is_blacklisted && (
                  <Badge variant="destructive">
                    <Ban className="mr-1 h-3 w-3" />
                    Blacklisted
                  </Badge>
                )}
                {guest.nationality && (
                  <span className="text-muted-foreground">{guest.nationality}</span>
                )}
              </SheetDescription>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{guest.total_stays}</p>
                <p className="text-xs text-muted-foreground">Total Stays</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-success">
                  ${guest.total_revenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </CardContent>
            </Card>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <Tabs defaultValue="details" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">Stay History</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-380px)] mt-4">
            <TabsContent value="details" className="space-y-4 mt-0">
              {/* Contact Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {guest.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{guest.email}</span>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                  {(guest.address || guest.city || guest.country) && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {guest.address && <p>{guest.address}</p>}
                        <p>
                          {[guest.city, guest.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {guest.date_of_birth && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>DOB: {format(new Date(guest.date_of_birth), "MMMM d, yyyy")}</span>
                    </div>
                  )}
                  {guest.nationality && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{guest.nationality}</span>
                    </div>
                  )}
                  {guest.id_type && guest.id_number && (
                    <div className="flex items-center gap-3 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {guest.id_type}: {guest.id_number}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {guest.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{guest.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Blacklist Reason */}
              {guest.is_blacklisted && guest.blacklist_reason && (
                <Card className="border-destructive">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-destructive">
                      Blacklist Reason
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{guest.blacklist_reason}</p>
                  </CardContent>
                </Card>
              )}

              {/* Guest Since */}
              <div className="text-xs text-muted-foreground text-center pt-2">
                Guest since {format(new Date(guest.created_at), "MMMM yyyy")}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-3 mt-0">
              {reservationsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Hotel className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No stay history found</p>
                </div>
              ) : (
                reservations.map((reservation) => (
                  <Card key={reservation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {reservation.confirmation_number}
                            </p>
                            <Badge
                              variant={
                                reservation.status === "checked_out"
                                  ? "secondary"
                                  : reservation.status === "checked_in"
                                  ? "default"
                                  : reservation.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {reservation.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(reservation.check_in_date), "MMM d")} -{" "}
                            {format(new Date(reservation.check_out_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-success">
                            ${reservation.total_amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reservation.adults} adult{reservation.adults !== 1 ? "s" : ""}
                            {reservation.children > 0 &&
                              `, ${reservation.children} child${reservation.children !== 1 ? "ren" : ""}`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
