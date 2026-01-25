import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useDeleteProperty } from "@/hooks/useProperties";
import { useTenant } from "@/hooks/useTenant";
import { useState } from "react";

interface Property {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive" | "maintenance";
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  currency: string | null;
  tax_rate: number | null;
  service_charge_rate: number | null;
}

interface PropertyCardProps {
  property: Property;
  onViewDetails: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  inactive: "bg-muted text-muted-foreground",
  maintenance: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export function PropertyCard({ property, onViewDetails }: PropertyCardProps) {
  const { properties, currentProperty } = useTenant();
  const deleteProperty = useDeleteProperty();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isCurrentProperty = currentProperty?.id === property.id;
  const canDelete = properties.length > 1;

  const handleDelete = () => {
    deleteProperty.mutate(property.id);
    setShowDeleteDialog(false);
  };

  const location = [property.city, property.country].filter(Boolean).join(", ");

  return (
    <>
      <Card className={isCurrentProperty ? "border-primary" : ""}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{property.name}</h3>
              <p className="text-sm text-muted-foreground">{property.code}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                View & Edit
              </DropdownMenuItem>
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status & Current Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={STATUS_STYLES[property.status]}>
              {property.status}
            </Badge>
            {isCurrentProperty && (
              <Badge variant="default" className="text-xs">
                Current
              </Badge>
            )}
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-1">
            {property.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{property.phone}</span>
              </div>
            )}
            {property.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{property.email}</span>
              </div>
            )}
          </div>

          {/* Timezone & Currency */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              <span>{property.timezone || "UTC"}</span>
            </div>
            <span>•</span>
            <span>{property.currency || "USD"}</span>
            {property.tax_rate !== null && property.tax_rate > 0 && (
              <>
                <span>•</span>
                <span>Tax: {property.tax_rate}%</span>
              </>
            )}
          </div>

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onViewDetails}
          >
            Manage Property
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{property.name}" and all associated
              data including rooms, reservations, and folios. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Property
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
