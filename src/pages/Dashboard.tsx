import { useEffect, useState } from 'react';
import {
  BedDouble,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/hooks/useTenant';
import { supabase } from '@/integrations/supabase/client';
import { ROOM_STATUS_CONFIG, type RoomStatus } from '@/types/database';
import { cn } from '@/lib/utils';

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
}

interface RoomStatusCount {
  status: RoomStatus;
  count: number;
}

export default function Dashboard() {
  const { currentProperty, subscription } = useTenant();
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
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentProperty?.id) return;

    const fetchStats = async () => {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];

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

  const statCards = [
    {
      title: 'Occupancy Rate',
      value: `${occupancyRate}%`,
      description: `${stats.occupiedRooms} of ${stats.totalRooms} rooms`,
      icon: TrendingUp,
      trend: occupancyRate > 70 ? 'up' : 'down',
      color: 'text-info',
    },
    {
      title: 'Available Rooms',
      value: stats.vacantRooms.toString(),
      description: 'Ready for check-in',
      icon: BedDouble,
      color: 'text-success',
    },
    {
      title: 'In-House Guests',
      value: stats.inHouseGuests.toString(),
      description: 'Currently staying',
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Today\'s Arrivals',
      value: stats.todayArrivals.toString(),
      description: 'Expected check-ins',
      icon: Calendar,
      color: 'text-warning',
    },
  ];

  return (
    <DashboardLayout title="Dashboard" subtitle={currentProperty?.name}>
      <div className="space-y-6">
        {/* Plan Info */}
        {subscription && (
          <Card className="border-info/20 bg-info/5">
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-info text-info">
                  {subscription.plan?.name || 'Free'} Plan
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {subscription.plan?.max_properties === 999 ? 'Unlimited' : subscription.plan?.max_properties} properties
                  {' · '}
                  {subscription.plan?.max_rooms === 9999 ? 'Unlimited' : subscription.plan?.max_rooms} rooms
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Status: <span className="text-success">Active</span>
              </span>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  {stat.trend && (
                    stat.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Room Status Overview */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Room Status Overview</CardTitle>
              <CardDescription>Current status of all rooms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {Object.entries(ROOM_STATUS_CONFIG).map(([status, config]) => {
                  const count = status === 'vacant' ? stats.vacantRooms
                    : status === 'occupied' ? stats.occupiedRooms
                    : status === 'dirty' ? stats.dirtyRooms
                    : status === 'maintenance' || status === 'out_of_order' ? stats.maintenanceRooms
                    : 0;

                  return (
                    <div
                      key={status}
                      className="flex flex-col items-center rounded-lg border p-3 text-center"
                    >
                      <div
                        className={cn(
                          'mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold',
                          config.color
                        )}
                      >
                        {status === 'out_of_order' ? stats.maintenanceRooms : count}
                      </div>
                      <span className="text-xs text-muted-foreground">{config.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Activity</CardTitle>
              <CardDescription>Arrivals and departures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Arrivals</p>
                      <p className="text-xs text-muted-foreground">Expected check-ins today</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{stats.todayArrivals}</span>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
                      <ArrowDownRight className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Departures</p>
                      <p className="text-xs text-muted-foreground">Expected check-outs today</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{stats.todayDepartures}</span>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10 text-info">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Pending Reservations</p>
                      <p className="text-xs text-muted-foreground">Future confirmed bookings</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{stats.pendingReservations}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <a
                href="/reservations/new"
                className="flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                New Reservation
              </a>
              <a
                href="/front-desk"
                className="flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                Check-In Guest
              </a>
              <a
                href="/rooms"
                className="flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
              >
                <BedDouble className="h-4 w-4 text-muted-foreground" />
                View Rooms
              </a>
              <a
                href="/housekeeping"
                className="flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
              >
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Housekeeping
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}