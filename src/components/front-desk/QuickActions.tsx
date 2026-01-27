import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CalendarPlus, 
  BedDouble, 
  Search,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onNewReservation?: () => void;
  onSearchGuest?: () => void;
}

export function QuickActions({ onNewReservation, onSearchGuest }: QuickActionsProps) {
  const actions = [
    {
      label: "New Reservation",
      icon: CalendarPlus,
      onClick: onNewReservation,
      gradient: "from-indigo-500 to-purple-500",
      shadowColor: "shadow-indigo-500/25",
      isPrimary: true,
    },
    {
      label: "Find Guest",
      icon: Search,
      onClick: onSearchGuest,
      gradient: "from-amber-500 to-orange-500",
      shadowColor: "shadow-amber-500/25",
      isPrimary: false,
    },
    {
      label: "View Rooms",
      icon: BedDouble,
      href: "/rooms",
      gradient: "from-emerald-500 to-teal-500",
      shadowColor: "shadow-emerald-500/25",
      isPrimary: false,
    },
    {
      label: "Reservations",
      icon: ClipboardList,
      href: "/reservations",
      gradient: "from-blue-500 to-cyan-500",
      shadowColor: "shadow-blue-500/25",
      isPrimary: false,
    },
  ];

  return (
    <Card className="overflow-hidden rounded-2xl border-none bg-gradient-to-br from-background to-muted/50 shadow-lg">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 p-2 shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => {
            const ButtonContent = (
              <>
                <div className={cn(
                  "rounded-lg p-1.5 transition-transform group-hover:scale-110",
                  action.isPrimary ? "bg-white/20" : `bg-gradient-to-br ${action.gradient}`
                )}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">{action.label}</span>
              </>
            );

            return action.href ? (
              <Button
                key={action.label}
                size="sm"
                className={cn(
                  "group gap-2 rounded-xl h-10 px-4 transition-all duration-300",
                  "bg-gradient-to-r hover:shadow-lg hover:-translate-y-0.5",
                  action.gradient,
                  action.shadowColor,
                  "text-white border-none"
                )}
                asChild
              >
                <Link to={action.href}>
                  {ButtonContent}
                </Link>
              </Button>
            ) : (
              <Button
                key={action.label}
                size="sm"
                className={cn(
                  "group gap-2 rounded-xl h-10 px-4 transition-all duration-300",
                  "bg-gradient-to-r hover:shadow-lg hover:-translate-y-0.5",
                  action.gradient,
                  action.shadowColor,
                  "text-white border-none"
                )}
                onClick={action.onClick}
              >
                {ButtonContent}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
