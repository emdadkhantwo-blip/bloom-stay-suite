import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Mail, Phone, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStaff, type StaffMember } from "@/hooks/useStaff";
import { useTenant } from "@/hooks/useTenant";
import { formatDistanceToNow } from "date-fns";

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  manager: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  front_desk: "bg-green-500/10 text-green-500 border-green-500/20",
  accountant: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  housekeeping: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  maintenance: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  kitchen: "bg-red-500/10 text-red-500 border-red-500/20",
  waiter: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  night_auditor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  front_desk: "Front Desk",
  accountant: "Accountant",
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  kitchen: "Kitchen",
  waiter: "Waiter",
  night_auditor: "Night Auditor",
};

interface StaffCardProps {
  member: StaffMember;
  onViewDetails: () => void;
}

export function StaffCard({ member, onViewDetails }: StaffCardProps) {
  const { toggleActiveStatus } = useStaff();
  const { properties } = useTenant();

  const initials =
    member.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || member.username[0].toUpperCase();

  const accessibleProperties = properties.filter((p) =>
    member.property_access.includes(p.id)
  );

  return (
    <Card className={!member.is_active ? "opacity-60" : ""}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">
              {member.full_name || member.username}
            </h3>
            <p className="text-sm text-muted-foreground">@{member.username}</p>
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
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                toggleActiveStatus({
                  userId: member.id,
                  isActive: !member.is_active,
                })
              }
            >
              {member.is_active ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Badge */}
        <Badge
          variant={member.is_active ? "default" : "secondary"}
          className="text-xs"
        >
          {member.is_active ? "Active" : "Inactive"}
        </Badge>

        {/* Contact Info */}
        <div className="space-y-1 text-sm">
          {member.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{member.email}</span>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{member.phone}</span>
            </div>
          )}
        </div>

        {/* Roles */}
        <div className="flex flex-wrap gap-1">
          {member.roles.length > 0 ? (
            member.roles.map((role) => (
              <Badge
                key={role}
                variant="outline"
                className={`text-xs ${ROLE_COLORS[role] || ""}`}
              >
                {ROLE_LABELS[role] || role}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No roles assigned</span>
          )}
        </div>

        {/* Property Access */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span>
            {accessibleProperties.length === 0
              ? "No property access"
              : accessibleProperties.length === 1
              ? accessibleProperties[0].name
              : `${accessibleProperties.length} properties`}
          </span>
        </div>

        {/* Last Login */}
        {member.last_login_at && (
          <p className="text-xs text-muted-foreground">
            Last login:{" "}
            {formatDistanceToNow(new Date(member.last_login_at), {
              addSuffix: true,
            })}
          </p>
        )}

        {/* View Details Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onViewDetails}
        >
          Manage Staff
        </Button>
      </CardContent>
    </Card>
  );
}
