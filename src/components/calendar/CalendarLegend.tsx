import { Crown, UserCheck, CalendarClock } from "lucide-react";

export function CalendarLegend() {
  const items = [
    {
      label: "Confirmed",
      color: "bg-blue-500",
      icon: CalendarClock,
    },
    {
      label: "Checked In",
      color: "bg-emerald-500",
      icon: UserCheck,
    },
    {
      label: "VIP Guest",
      color: "bg-amber-400",
      icon: Crown,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <span className="text-muted-foreground font-medium">Legend:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`h-3 w-3 rounded ${item.color}`} />
          <item.icon className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
