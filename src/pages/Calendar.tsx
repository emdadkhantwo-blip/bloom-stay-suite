import { useState, useEffect } from "react";
import { format, getWeek, getDayOfYear, addDays, startOfDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CalendarDays, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  BedDouble,
  Crown,
  UserCheck,
  CalendarClock,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

// Current Date Card Component
function CurrentDateCard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const weekNumber = getWeek(currentTime);
  const dayOfYear = getDayOfYear(currentTime);
  const isLeapYear = new Date(currentTime.getFullYear(), 1, 29).getDate() === 29;

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {format(currentTime, "EEEE, MMMM d, yyyy")}
            </p>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-sm font-medium tabular-nums">
                {format(currentTime, "h:mm:ss a")}
              </span>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>Week {weekNumber}</span>
              <span>•</span>
              <span>Day {dayOfYear} of {isLeapYear ? 366 : 365}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Calendar Stats Bar Component
interface CalendarStats {
  arrivals: number;
  departures: number;
  inHouse: number;
  available: number;
}

function CalendarStatsBar({ stats, isLoading }: { stats: CalendarStats | null; isLoading?: boolean }) {
  const items = [
    {
      label: "Today's Arrivals",
      value: stats?.arrivals ?? 0,
      icon: ArrowDownToLine,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Today's Departures",
      value: stats?.departures ?? 0,
      icon: ArrowUpFromLine,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "In-House Guests",
      value: stats?.inHouse ?? 0,
      icon: Users,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Available Rooms",
      value: stats?.available ?? 0,
      icon: BedDouble,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item, idx) => (
          <Card key={idx} className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bgColor}`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-semibold">{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Calendar Controls Component
interface CalendarControlsProps {
  startDate: Date;
  numDays: number;
  onStartDateChange: (date: Date) => void;
  onNumDaysChange: (days: number) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

function CalendarControls({
  startDate,
  numDays,
  onStartDateChange,
  onNumDaysChange,
  onRefresh,
  isRefreshing,
}: CalendarControlsProps) {
  const endDate = addDays(startDate, numDays - 1);

  const goToPrevious = () => {
    onStartDateChange(startOfDay(addDays(startDate, -numDays)));
  };

  const goToNext = () => {
    onStartDateChange(startOfDay(addDays(startDate, numDays)));
  };

  const goToToday = () => {
    onStartDateChange(startOfDay(new Date()));
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Navigation */}
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={goToPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={goToNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Date Range Display */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[200px] justify-start gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>
              {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarPicker
            mode="single"
            selected={startDate}
            onSelect={(date) => date && onStartDateChange(startOfDay(date))}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {/* Days Range Selector */}
      <Select
        value={numDays.toString()}
        onValueChange={(value) => onNumDaysChange(parseInt(value, 10))}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          <SelectItem value="7">7 Days</SelectItem>
          <SelectItem value="14">14 Days</SelectItem>
          <SelectItem value="21">21 Days</SelectItem>
          <SelectItem value="30">30 Days</SelectItem>
        </SelectContent>
      </Select>

      {/* Refresh Button */}
      {onRefresh && (
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </Button>
      )}
    </div>
  );
}

// Calendar Legend Component
function CalendarLegend() {
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
      {/* Checkout indicator legend */}
      <div className="flex items-center gap-1.5">
        <div
          className="h-3 w-3 rounded border border-muted-foreground/30"
          style={{
            background: `repeating-linear-gradient(
              -45deg,
              hsl(var(--muted)),
              hsl(var(--muted)) 1px,
              hsl(var(--muted-foreground) / 0.3) 1px,
              hsl(var(--muted-foreground) / 0.3) 2px
            )`,
          }}
        />
        <LogOut className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">Checkout Day</span>
      </div>
    </div>
  );
}

// Sample room data for demonstration
interface Room {
  id: string;
  room_number: string;
  floor: string;
  room_type?: { name: string };
  reservations: Reservation[];
}

interface Reservation {
  id: string;
  guest_name: string;
  check_in_date: string;
  check_out_date: string;
  status: "confirmed" | "checked_in" | "checked_out" | "cancelled";
  is_vip?: boolean;
}

// Sample data
const SAMPLE_ROOMS: Room[] = [
  {
    id: "1",
    room_number: "101",
    floor: "1",
    room_type: { name: "Standard" },
    reservations: [
      { id: "r1", guest_name: "John Smith", check_in_date: "2026-02-03", check_out_date: "2026-02-06", status: "checked_in", is_vip: false },
    ],
  },
  {
    id: "2",
    room_number: "102",
    floor: "1",
    room_type: { name: "Deluxe" },
    reservations: [
      { id: "r2", guest_name: "Sarah Johnson", check_in_date: "2026-02-05", check_out_date: "2026-02-10", status: "confirmed", is_vip: true },
    ],
  },
  {
    id: "3",
    room_number: "201",
    floor: "2",
    room_type: { name: "Suite" },
    reservations: [],
  },
  {
    id: "4",
    room_number: "202",
    floor: "2",
    room_type: { name: "Standard" },
    reservations: [
      { id: "r3", guest_name: "Michael Brown", check_in_date: "2026-02-04", check_out_date: "2026-02-07", status: "confirmed" },
    ],
  },
];

const CELL_WIDTH = 48;
const ROW_HEIGHT = 48;

// Calendar Timeline Component
function CalendarTimeline({ rooms, dateRange }: { rooms: Room[]; dateRange: Date[] }) {
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  // Group rooms by floor
  const groupedRooms = rooms.reduce((acc, room) => {
    const floor = room.floor || "Other";
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <div className="min-w-max">
        {/* Header Row - Dates */}
        <div className="flex border-b bg-muted/50 sticky top-0 z-20">
          {/* Room label column */}
          <div className="w-32 flex-shrink-0 border-r px-3 py-2 font-medium text-sm">
            Room
          </div>
          {/* Date columns */}
          <div className="flex">
            {dateRange.map((date, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col items-center justify-center border-r px-1 py-1",
                  isToday(date) && "bg-primary/10"
                )}
                style={{ width: `${CELL_WIDTH}px` }}
              >
                <span className="text-[10px] text-muted-foreground uppercase">
                  {format(date, "EEE")}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isToday(date) && "text-primary font-bold"
                  )}
                >
                  {format(date, "d")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Room Rows grouped by floor */}
        {Object.entries(groupedRooms).map(([floor, floorRooms]) => (
          <div key={floor}>
            {/* Floor Header */}
            <div className="flex border-b bg-muted/30">
              <div className="w-32 flex-shrink-0 border-r px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                Floor {floor}
              </div>
              <div className="flex-1" />
            </div>

            {/* Rooms in this floor */}
            {floorRooms.map((room) => (
              <div key={room.id} className="flex border-b hover:bg-muted/20">
                {/* Room label */}
                <div className="w-32 flex-shrink-0 border-r px-3 py-2 flex flex-col justify-center">
                  <span className="font-medium text-sm truncate">
                    {room.room_number}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {room.room_type?.name || "—"}
                  </span>
                </div>

                {/* Timeline grid */}
                <div
                  className="relative"
                  style={{
                    width: `${dateRange.length * CELL_WIDTH}px`,
                    height: `${ROW_HEIGHT}px`,
                  }}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {dateRange.map((date, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "border-r h-full",
                          isToday(date) && "bg-primary/5"
                        )}
                        style={{ width: `${CELL_WIDTH}px` }}
                      />
                    ))}
                  </div>

                  {/* Reservation blocks - simplified for demo */}
                  {room.reservations.map((res) => {
                    const checkIn = new Date(res.check_in_date);
                    const checkOut = new Date(res.check_out_date);
                    const rangeStart = dateRange[0];
                    
                    const startOffset = Math.max(0, Math.floor((checkIn.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)));
                    const duration = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                    
                    const left = startOffset * CELL_WIDTH + 2;
                    const width = Math.max(0, duration * CELL_WIDTH - 4);

                    const statusColors = {
                      confirmed: "bg-blue-500/80 border-blue-600 text-white",
                      checked_in: "bg-emerald-500/80 border-emerald-600 text-white",
                      checked_out: "bg-muted border-border text-muted-foreground",
                      cancelled: "bg-destructive/50 border-destructive text-destructive-foreground",
                    };

                    return (
                      <button
                        key={res.id}
                        className={cn(
                          "absolute top-1 h-10 rounded-md border px-2 flex items-center gap-1 overflow-hidden cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-1 hover:z-10",
                          statusColors[res.status]
                        )}
                        style={{ left: `${left}px`, width: `${width}px` }}
                      >
                        {res.is_vip && <Crown className="h-3 w-3 flex-shrink-0 text-amber-300" />}
                        {res.status === "checked_in" && <UserCheck className="h-3 w-3 flex-shrink-0" />}
                        {res.status === "confirmed" && <CalendarClock className="h-3 w-3 flex-shrink-0" />}
                        <span className="truncate text-xs font-medium">{res.guest_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Calendar Page Component
export default function Calendar() {
  const [startDate, setStartDate] = useState(() => startOfDay(new Date()));
  const [numDays, setNumDays] = useState(14);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate date range
  const dateRange = Array.from({ length: numDays }, (_, i) => addDays(startDate, i));

  // Sample stats
  const stats: CalendarStats = {
    arrivals: 3,
    departures: 2,
    inHouse: 12,
    available: 8,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar with Current Date Card */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <CalendarStatsBar stats={stats} />
        <CurrentDateCard />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <CalendarControls
          startDate={startDate}
          numDays={numDays}
          onStartDateChange={setStartDate}
          onNumDaysChange={setNumDays}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <CalendarLegend />
      </div>

      {/* Timeline */}
      <CalendarTimeline rooms={SAMPLE_ROOMS} dateRange={dateRange} />
    </div>
  );
}
