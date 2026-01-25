import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useQueryClient } from "@tanstack/react-query";
import type { AppRole } from "@/types/database";

const ALL_ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: "manager", label: "Manager", description: "Full property management" },
  { value: "front_desk", label: "Front Desk", description: "Reservations & check-in/out" },
  { value: "accountant", label: "Accountant", description: "Folios & payments" },
  { value: "housekeeping", label: "Housekeeping", description: "Room cleaning tasks" },
  { value: "maintenance", label: "Maintenance", description: "Maintenance tickets" },
  { value: "kitchen", label: "Kitchen", description: "POS kitchen display" },
  { value: "waiter", label: "Waiter", description: "POS orders" },
  { value: "night_auditor", label: "Night Auditor", description: "Night audit process" },
];

const createStaffSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name must be less than 100 characters"),
  phone: z.string().max(20).optional(),
});

type CreateStaffFormData = z.infer<typeof createStaffSchema>;

interface CreateStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStaffDialog({ open, onOpenChange }: CreateStaffDialogProps) {
  const { toast } = useToast();
  const { tenant, properties, currentProperty } = useTenant();
  const queryClient = useQueryClient();

  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateStaffFormData>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      phone: "",
    },
  });

  // Initialize selectedProperties when dialog opens
  useEffect(() => {
    if (open && currentProperty && selectedProperties.length === 0) {
      setSelectedProperties([currentProperty.id]);
    }
  }, [open, currentProperty]);

  const toggleRole = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleProperty = (propertyId: string) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((p) => p !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleSubmit = async (data: CreateStaffFormData) => {
    if (selectedRoles.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one role.",
        variant: "destructive",
      });
      return;
    }

    if (selectedProperties.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one property.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: result, error } = await supabase.functions.invoke("create-staff", {
        body: {
          username: data.username,
          password: data.password,
          fullName: data.fullName,
          phone: data.phone || undefined,
          roles: selectedRoles,
          propertyIds: selectedProperties,
          mustChangePassword,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to create staff");
      }

      toast({
        title: "Staff Created",
        description: `Staff account for ${data.fullName} has been created. They can log in with username: ${data.username}`,
      });

      queryClient.invalidateQueries({ queryKey: ["staff"] });
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Create staff error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create staff account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedRoles([]);
    setSelectedProperties([]);
    setMustChangePassword(true);
    setShowPassword(false);
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("password", password);
    setShowPassword(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Staff Account</DialogTitle>
          <DialogDescription>
            Create a new staff account with login credentials. Staff can use their username
            and password to access the system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                {...form.register("fullName")}
                placeholder="John Doe"
              />
              {form.formState.errors.fullName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                {...form.register("username")}
                placeholder="johndoe"
              />
              <p className="text-xs text-muted-foreground">
                Letters, numbers, and underscores only
              </p>
              {form.formState.errors.username && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary"
                  onClick={generatePassword}
                >
                  Generate
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...form.register("password")}
                  placeholder="Minimum 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                {...form.register("phone")}
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="mustChangePassword" className="text-sm font-medium">
                  Require Password Change
                </Label>
                <p className="text-xs text-muted-foreground">
                  Staff will be prompted to change password on first login
                </p>
              </div>
              <Switch
                id="mustChangePassword"
                checked={mustChangePassword}
                onCheckedChange={setMustChangePassword}
              />
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-3">
            <Label>Assign Roles *</Label>
            <div className="grid grid-cols-2 gap-2">
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
                  <CardContent className="flex items-start gap-2 p-2">
                    <Checkbox
                      checked={selectedRoles.includes(role.value)}
                      onCheckedChange={() => toggleRole(role.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium">{role.label}</span>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {selectedRoles.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Select at least one role for the staff member
              </p>
            )}
          </div>

          {/* Property Access */}
          <div className="space-y-3">
            <Label>Property Access *</Label>
            <div className="space-y-2">
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
                  <CardContent className="flex items-center gap-2 p-2">
                    <Checkbox
                      checked={selectedProperties.includes(property.id)}
                      onCheckedChange={() => toggleProperty(property.id)}
                    />
                    <div>
                      <span className="text-sm font-medium">{property.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({property.code})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Staff"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
