import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  Wrench,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenant } from '@/hooks/useTenant';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { ROOM_STATUS_CONFIG, type RoomStatus } from '@/types/database';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AdminChatbot } from '@/components/admin/AdminChatbot';

interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  dirtyRooms: number;
  maintenanceRooms: number;
  todayArrivals: number;
  todayDepartures: number;
  inHouseGuests: number;
  pendingReservations: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingHousekeepingTasks: number;
  inProgressHousekeepingTasks: number;
  openMaintenanceTickets: number;
  criticalMaintenanceTickets: number;
}

export default function Dashboard() {
  const { currentProperty, subscription, tenant } = useTenant();
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    dirtyRooms: 0,
    maintenanceRooms: 0,
    todayArrivals: 0,
    todayDepartures: 0,
    inHouseGuests: 0,
    pendingReservations: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    pendingHousekeepingTasks: 0,
    inProgressHousekeepingTasks: 0,
    openMaintenanceTickets: 0,
    criticalMaintenanceTickets: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentProperty?.id) return;

    const fetchStats = async () => {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      try {
        // Fetch room counts by status
        const { data: rooms } = await supabase
          .from('rooms')
          .select('status')
          .eq('property_id', currentProperty.id)
          .eq('is_active', true);

        const roomCounts = (rooms || []).reduce((acc, room) => {
          acc[room.status as RoomStatus] = (acc[room.status as RoomStatus] || 0) + 1;
          return acc;
        }, {} as Record<RoomStatus, number>);

        // Fetch today's arrivals
        const { count: arrivals } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .eq('check_in_date', today)
          .eq('status', 'confirmed');

        // Fetch today's departures
        const { count: departures } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .eq('check_out_date', today)
          .eq('status', 'checked_in');

        // Fetch in-house guests
        const { count: inHouse } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .eq('status', 'checked_in');

        // Fetch pending reservations
        const { count: pending } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .eq('status', 'confirmed')
          .gte('check_in_date', today);

        // Fetch today's payments for revenue
        const { data: todayPayments } = await supabase
          .from('payments')
          .select('amount, created_at')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`)
          .eq('voided', false);

        const todayRevenue = (todayPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

        // Fetch month's payments for revenue
        const { data: monthPayments } = await supabase
          .from('payments')
          .select('amount')
          .gte('created_at', `${monthStart}T00:00:00`)
          .eq('voided', false);

        const monthRevenue = (monthPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

        // Fetch pending housekeeping tasks
        const { count: pendingTasks } = await supabase
          .from('housekeeping_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .eq('status', 'pending');

        // Fetch in-progress housekeeping tasks
        const { count: inProgressTasks } = await supabase
          .from('housekeeping_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .eq('status', 'in_progress');

        // Fetch open maintenance tickets
        const { count: openTickets } = await supabase
          .from('maintenance_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .in('status', ['open', 'in_progress']);

        // Fetch critical maintenance tickets (priority 3)
        const { count: criticalTickets } = await supabase
          .from('maintenance_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', currentProperty.id)
          .in('status', ['open', 'in_progress'])
          .eq('priority', 3);

        setStats({
          totalRooms: rooms?.length || 0,
          occupiedRooms: roomCounts.occupied || 0,
          vacantRooms: roomCounts.vacant || 0,
          dirtyRooms: roomCounts.dirty || 0,
          maintenanceRooms: (roomCounts.maintenance || 0) + (roomCounts.out_of_order || 0),
          todayArrivals: arrivals || 0,
          todayDepartures: departures || 0,
          inHouseGuests: inHouse || 0,
          pendingReservations: pending || 0,
          todayRevenue,
          monthRevenue,
          pendingHousekeepingTasks: pendingTasks || 0,
          inProgressHousekeepingTasks: inProgressTasks || 0,
          openMaintenanceTickets: openTickets || 0,
          criticalMaintenanceTickets: criticalTickets || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [currentProperty?.id]);

  const occupancyRate = stats.totalRooms > 0
    ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100)
    : 0;

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  if (!currentProperty) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No property selected. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with logo, name, date and property info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Hotel Logo */}
          {tenant?.logo_url && (
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarImage src={tenant.logo_url} alt={tenant.name} className="object-cover" />
              <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                {tenant.name?.substring(0, 2).toUpperCase() || 'HT'}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {tenant?.name ? `${tenant.name} Dashboard` : 'Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} • {currentProperty?.name}
            </p>
          </div>
        </div>
        {subscription && (
          <Badge variant="outline" className="w-fit border-primary/30 text-primary">
            {subscription.plan?.name || 'Free'} Plan
          </Badge>
        )}
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Occupancy Rate */}
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-4 rounded-full bg-primary/10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Occupancy Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{occupancyRate}%</span>
                  {occupancyRate > 70 ? (
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-warning" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.occupiedRooms} of {stats.totalRooms} rooms occupied
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Today's Revenue */}
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-4 rounded-full bg-success/10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-3xl font-bold">{formatCurrency(stats.todayRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.monthRevenue)} this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-4 rounded-full bg-warning/10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Housekeeping Tasks
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stats.pendingHousekeepingTasks}</span>
                  <span className="text-sm text-muted-foreground">pending</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.inProgressHousekeepingTasks} in progress
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Tickets */}
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-4 rounded-full bg-destructive/10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maintenance Tickets
            </CardTitle>
            <Wrench className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stats.openMaintenanceTickets}</span>
                  <span className="text-sm text-muted-foreground">open</span>
                </div>
                {stats.criticalMaintenanceTickets > 0 && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    {stats.criticalMaintenanceTickets} critical
                  </p>
                )}
                {stats.criticalMaintenanceTickets === 0 && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    No critical issues
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Room Status Overview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Room Status</CardTitle>
                <CardDescription>Current status of all rooms</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/rooms">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {Object.entries(ROOM_STATUS_CONFIG).map(([status, config]) => {
                  const count = status === 'vacant' ? stats.vacantRooms
                    : status === 'occupied' ? stats.occupiedRooms
                    : status === 'dirty' ? stats.dirtyRooms
                    : status === 'maintenance' ? stats.maintenanceRooms
                    : status === 'out_of_order' ? 0
                    : 0;

                  return (
                    <div
                      key={status}
                      className="flex flex-col items-center rounded-lg border p-3 text-center transition-colors hover:bg-muted/50"
                    >
                      <div
                        className={cn(
                          'mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold',
                          config.color
                        )}
                      >
                        {count}
                      </div>
                      <span className="text-xs text-muted-foreground">{config.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Today's Activity</CardTitle>
                <CardDescription>Arrivals, departures & reservations</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/front-desk">Front Desk</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Arrivals</p>
                    <p className="text-xs text-muted-foreground">Expected check-ins</p>
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <span className="text-2xl font-bold">{stats.todayArrivals}</span>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
                    <ArrowDownRight className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Departures</p>
                    <p className="text-xs text-muted-foreground">Expected check-outs</p>
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <span className="text-2xl font-bold">{stats.todayDepartures}</span>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">In-House Guests</p>
                    <p className="text-xs text-muted-foreground">Currently staying</p>
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <span className="text-2xl font-bold">{stats.inHouseGuests}</span>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10 text-info">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pending Reservations</p>
                    <p className="text-xs text-muted-foreground">Upcoming confirmed</p>
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <span className="text-2xl font-bold">{stats.pendingReservations}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto justify-start gap-3 p-4" asChild>
              <Link to="/reservations">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">New Reservation</p>
                  <p className="text-xs text-muted-foreground">Create booking</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto justify-start gap-3 p-4" asChild>
              <Link to="/front-desk">
                <Users className="h-5 w-5 text-success" />
                <div className="text-left">
                  <p className="font-medium">Check-In Guest</p>
                  <p className="text-xs text-muted-foreground">Process arrival</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto justify-start gap-3 p-4" asChild>
              <Link to="/housekeeping">
                <ClipboardList className="h-5 w-5 text-warning" />
                <div className="text-left">
                  <p className="font-medium">Housekeeping</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingHousekeepingTasks} tasks pending
                  </p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto justify-start gap-3 p-4" asChild>
              <Link to="/maintenance">
                <Wrench className="h-5 w-5 text-destructive" />
                <div className="text-left">
                  <p className="font-medium">Maintenance</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.openMaintenanceTickets} tickets open
                  </p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Chatbot */}
      <AdminChatbot />
    </div>
  );
}