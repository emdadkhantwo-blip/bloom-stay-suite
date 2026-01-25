import { Star, Ban, Mail, Phone, MapPin, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Guest } from "@/hooks/useGuests";

interface GuestCardProps {
  guest: Guest;
  onClick?: () => void;
}

export function GuestCard({ guest, onClick }: GuestCardProps) {
  const initials = `${guest.first_name?.[0] || ""}${guest.last_name?.[0] || ""}`.toUpperCase();

  return (
    <Card 
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Guest Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">
                    {guest.first_name} {guest.last_name}
                  </h3>
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
                </div>
                {guest.nationality && (
                  <p className="text-sm text-muted-foreground">{guest.nationality}</p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {guest.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[180px]">{guest.email}</span>
                </div>
              )}
              {guest.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{guest.phone}</span>
                </div>
              )}
              {(guest.city || guest.country) && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {[guest.city, guest.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{guest.total_stays}</span>
                <span className="text-muted-foreground">stays</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <DollarSign className="h-3 w-3 text-success" />
                <span className="font-medium text-success">
                  ${guest.total_revenue.toLocaleString()}
                </span>
                <span className="text-muted-foreground">revenue</span>
              </div>
              {guest.date_of_birth && (
                <div className="text-xs text-muted-foreground">
                  DOB: {format(new Date(guest.date_of_birth), "MMM d, yyyy")}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
