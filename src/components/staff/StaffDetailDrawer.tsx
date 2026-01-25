import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStaff, type StaffMember } from "@/hooks/useStaff";
import { useTenant } from "@/hooks/useTenant";
import { format } from "date-fns";
import type { AppRole } from "@/types/database";

const ALL_ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: "owner", label: "Owner", description: "Full access to all features" },
  { value: "manager", label: "Manager", description: "Manage operations and staff" },
  { value: "front_desk", label: "Front Desk", description: "Check-in, check-out, reservations" },
  { value: "accountant", label: "Accountant", description: "Billing, folios, reports" },
  { value: "housekeeping", label: "Housekeeping", description: "Room cleaning tasks" },
  { value: "maintenance", label: "Maintenance", description: "Repair and maintenance tickets" },
  { value: "kitchen", label: "Kitchen", description: "Food orders and preparation" },
  { value: "waiter", label: "Waiter", description: "Take and serve orders" },
  { value: "night_auditor", label: "Night Auditor", description: "End-of-day procedures" },
];

interface StaffDetailDrawerProps {
  staff: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StaffDetailDrawer({
  staff,
  open,
  onOpenChange,
}: StaffDetailDrawerProps) {
  const { updateStaff, updateRoles, updatePropertyAccess, isUpdating } = useStaff();
  const { properties } = useTenant();

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  // Reset form when staff changes
  useEffect(() => {
    if (staff) {
      setFullName(staff.full_name || "");
      setPhone(staff.phone || "");
      setSelectedRoles(staff.roles);
      setSelectedProperties(staff.property_access);
    }
  }, [staff]);

  if (!staff) return null;

  const initials =
    staff.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || staff.username[0].toUpperCase();

  const handleSaveProfile = () => {
    updateStaff({
      userId: staff.id,
      updates: {
        full_name: fullName,
        phone: phone || undefined,
      },
    });
  };

  const handleSaveRoles = () => {
    updateRoles({
      userId: staff.id,
      roles: selectedRoles,
    });
  };

  const handleSavePropertyAccess = () => {
    updatePropertyAccess({
      userId: staff.id,
      propertyIds: selectedProperties,
    });
  };

  const toggleRole = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const toggleProperty = (propertyId: string) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((p) => p !== propertyId)
        : [...prev, propertyId]
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={staff.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-left">
                {staff.full_name || staff.username}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">@{staff.username}</p>
              <Badge
                variant={staff.is_active ? "default" : "secondary"}
                className="mt-1"
              >
                {staff.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-6" />

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={staff.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label>Account Created</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(staff.created_at), "PPP")}
                </p>
              </div>

              {staff.last_login_at && (
                <div className="space-y-2">
                  <Label>Last Login</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(staff.last_login_at), "PPP p")}
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? "Saving..." : "Save Profile"}
            </Button>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6 mt-4">
            <p className="text-sm text-muted-foreground">
              Assign roles to determine what this staff member can access and do.
            </p>

            <div className="space-y-3">
              {ALL_ROLES.map((role) => (
                <Card
                  key={role.value}
                  className={`cursor-pointer transition-colors ${
                    selectedRoles.includes(role.value)
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => toggleRole(role.value)}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <Checkbox
                      checked={selectedRoles.includes(role.value)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{role.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {role.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              onClick={handleSaveRoles}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? "Saving..." : "Save Roles"}
            </Button>
          </TabsContent>

          {/* Property Access Tab */}
          <TabsContent value="access" className="space-y-6 mt-4">
            <p className="text-sm text-muted-foreground">
              Select which properties this staff member can access.
            </p>

            {properties.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No properties found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.map((property) => (
                  <Card
                    key={property.id}
                    className={`cursor-pointer transition-colors ${
                      selectedProperties.includes(property.id)
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => toggleProperty(property.id)}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <Checkbox
                        checked={selectedProperties.includes(property.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{property.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {property.code} • {property.city || "No location"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {property.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Button
              onClick={handleSavePropertyAccess}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? "Saving..." : "Save Property Access"}
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
