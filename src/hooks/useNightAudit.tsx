import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

export interface NightAudit {
  id: string;
  tenant_id: string;
  property_id: string;
  business_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at: string | null;
  completed_at: string | null;
  run_by: string | null;
  rooms_charged: number;
  total_room_revenue: number;
  total_fb_revenue: number;
  total_other_revenue: number;
  total_payments: number;
  occupancy_rate: number;
  adr: number;
  revpar: number;
  report_data: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PreAuditChecklist {
  allReservationsCheckedIn: boolean;
  noShowsMarked: boolean;
  posOrdersPosted: boolean;
  pendingPaymentsRecorded: boolean;
  housekeepingComplete: boolean;
}

interface AuditStatistics {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number;
  roomRevenue: number;
  fbRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  totalPayments: number;
  adr: number;
  revpar: number;
  arrivalsToday: number;
  departuresToday: number;
  stayovers: number;
  noShows: number;
}

export function useNightAudit() {
  const { currentProperty, tenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get today's business date (usually yesterday if running after midnight)
  const getBusinessDate = () => {
    const now = new Date();
    // If before 6 AM, consider it previous day's audit
    if (now.getHours() < 6) {
      return format(subDays(now, 1), 'yyyy-MM-dd');
    }
    return format(now, 'yyyy-MM-dd');
  };

  // Fetch night audit history
  const { data: auditHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['night-audits', currentProperty?.id],
    queryFn: async () => {
      if (!currentProperty?.id) return [];

      const { data, error } = await supabase
        .from('night_audits')
        .select('*')
        .eq('property_id', currentProperty.id)
        .order('business_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as NightAudit[];
    },
    enabled: !!currentProperty?.id,
  });

  // Get current/today's audit
  const { data: currentAudit, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['night-audit-current', currentProperty?.id, getBusinessDate()],
    queryFn: async () => {
      if (!currentProperty?.id) return null;

      const { data, error } = await supabase
        .from('night_audits')
        .select('*')
        .eq('property_id', currentProperty.id)
        .eq('business_date', getBusinessDate())
        .maybeSingle();

      if (error) throw error;
      return data as NightAudit | null;
    },
    enabled: !!currentProperty?.id,
  });

  // Fetch pre-audit checklist data
  const { data: preAuditData, isLoading: isLoadingPreAudit, refetch: refetchPreAudit } = useQuery({
    queryKey: ['pre-audit-checklist', currentProperty?.id, getBusinessDate()],
    queryFn: async (): Promise<PreAuditChecklist> => {
      if (!currentProperty?.id || !tenant?.id) {
        return {
          allReservationsCheckedIn: true,
          noShowsMarked: true,
          posOrdersPosted: true,
          pendingPaymentsRecorded: true,
          housekeepingComplete: true,
        };
      }

      const businessDate = getBusinessDate();

      // Check for reservations that should have checked in today but haven't
      const { data: pendingArrivals } = await supabase
        .from('reservations')
        .select('id')
        .eq('property_id', currentProperty.id)
        .eq('check_in_date', businessDate)
        .eq('status', 'confirmed')
        .limit(1);

      // Check for unposted POS orders
      const { data: unpostedOrders } = await supabase
        .from('pos_orders')
        .select('id, outlet:pos_outlets!inner(property_id)')
        .eq('pos_outlets.property_id', currentProperty.id)
        .in('status', ['pending', 'preparing', 'ready', 'served'])
        .limit(1);

      // Check for incomplete housekeeping tasks
      const { data: pendingTasks } = await supabase
        .from('housekeeping_tasks')
        .select('id')
        .eq('property_id', currentProperty.id)
        .neq('status', 'completed')
        .limit(1);

      return {
        allReservationsCheckedIn: !pendingArrivals?.length,
        noShowsMarked: true, // This would need manual confirmation
        posOrdersPosted: !unpostedOrders?.length,
        pendingPaymentsRecorded: true, // This would need manual confirmation
        housekeepingComplete: !pendingTasks?.length,
      };
    },
    enabled: !!currentProperty?.id && !!tenant?.id,
  });

  // Calculate audit statistics
  const { data: auditStats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['audit-statistics', currentProperty?.id, getBusinessDate()],
    queryFn: async (): Promise<AuditStatistics> => {
      if (!currentProperty?.id || !tenant?.id) {
        return {
          totalRooms: 0,
          occupiedRooms: 0,
          vacantRooms: 0,
          occupancyRate: 0,
          roomRevenue: 0,
          fbRevenue: 0,
          otherRevenue: 0,
          totalRevenue: 0,
          totalPayments: 0,
          adr: 0,
          revpar: 0,
          arrivalsToday: 0,
          departuresToday: 0,
          stayovers: 0,
          noShows: 0,
        };
      }

      const businessDate = getBusinessDate();

      // Get total rooms
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id, status')
        .eq('property_id', currentProperty.id)
        .eq('is_active', true);

      const totalRooms = rooms?.length || 0;
      const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0;
      const vacantRooms = totalRooms - occupiedRooms;

      // Get today's reservations stats
      const { data: arrivals } = await supabase
        .from('reservations')
        .select('id')
        .eq('property_id', currentProperty.id)
        .eq('check_in_date', businessDate)
        .eq('status', 'checked_in');

      const { data: departures } = await supabase
        .from('reservations')
        .select('id')
        .eq('property_id', currentProperty.id)
        .eq('check_out_date', businessDate)
        .eq('status', 'checked_out');

      const { data: noShows } = await supabase
        .from('reservations')
        .select('id')
        .eq('property_id', currentProperty.id)
        .eq('check_in_date', businessDate)
        .eq('status', 'no_show');

      // Get revenue from folios for today
      const { data: folioItems } = await supabase
        .from('folio_items')
        .select(`
          item_type,
          total_price,
          tax_amount,
          service_date,
          folio:folios!inner(property_id)
        `)
        .eq('folios.property_id', currentProperty.id)
        .eq('service_date', businessDate)
        .eq('voided', false);

      let roomRevenue = 0;
      let fbRevenue = 0;
      let otherRevenue = 0;

      folioItems?.forEach(item => {
        const amount = Number(item.total_price) + Number(item.tax_amount);
        if (item.item_type === 'room_charge') {
          roomRevenue += amount;
        } else if (item.item_type === 'food_beverage') {
          fbRevenue += amount;
        } else if (!['tax', 'service_charge', 'discount', 'deposit'].includes(item.item_type)) {
          otherRevenue += amount;
        }
      });

      // Get payments for today
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          amount,
          created_at,
          folio:folios!inner(property_id)
        `)
        .eq('folios.property_id', currentProperty.id)
        .gte('created_at', `${businessDate}T00:00:00`)
        .lt('created_at', `${businessDate}T23:59:59`)
        .eq('voided', false);

      const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
      const totalRevenue = roomRevenue + fbRevenue + otherRevenue;
      const adr = occupiedRooms > 0 ? roomRevenue / occupiedRooms : 0;
      const revpar = totalRooms > 0 ? roomRevenue / totalRooms : 0;

      return {
        totalRooms,
        occupiedRooms,
        vacantRooms,
        occupancyRate,
        roomRevenue,
        fbRevenue,
        otherRevenue,
        totalRevenue,
        totalPayments,
        adr,
        revpar,
        arrivalsToday: arrivals?.length || 0,
        departuresToday: departures?.length || 0,
        stayovers: occupiedRooms - (arrivals?.length || 0),
        noShows: noShows?.length || 0,
      };
    },
    enabled: !!currentProperty?.id && !!tenant?.id,
  });

  // Start night audit
  const startAudit = useMutation({
    mutationFn: async () => {
      if (!currentProperty?.id || !tenant?.id || !user?.id) {
        throw new Error('Missing required data');
      }

      const businessDate = getBusinessDate();

      // Check if audit already exists
      const { data: existing } = await supabase
        .from('night_audits')
        .select('id, status')
        .eq('property_id', currentProperty.id)
        .eq('business_date', businessDate)
        .maybeSingle();

      if (existing?.status === 'completed') {
        throw new Error('Night audit for this date has already been completed');
      }

      if (existing) {
        // Update existing audit
        const { data, error } = await supabase
          .from('night_audits')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
            run_by: user.id,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Create new audit
      const { data, error } = await supabase
        .from('night_audits')
        .insert({
          tenant_id: tenant.id,
          property_id: currentProperty.id,
          business_date: businessDate,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          run_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['night-audit-current'] });
      queryClient.invalidateQueries({ queryKey: ['night-audits'] });
      toast({
        title: 'Night Audit Started',
        description: 'The night audit process has begun.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Post room charges for all occupied rooms
  const postRoomCharges = useMutation({
    mutationFn: async () => {
      if (!currentProperty?.id || !tenant?.id) {
        throw new Error('Missing required data');
      }

      const businessDate = getBusinessDate();

      // Get all checked-in reservations with their room assignments and rates
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select(`
          id,
          guest_id,
          reservation_rooms (
            id,
            room_id,
            rate_per_night,
            room:rooms(room_number)
          )
        `)
        .eq('property_id', currentProperty.id)
        .eq('status', 'checked_in');

      if (resError) throw resError;

      let chargesPosted = 0;
      let totalRevenue = 0;

      // Get tax and service charge rates from property
      const taxRate = currentProperty.tax_rate || 0;
      const serviceChargeRate = currentProperty.service_charge_rate || 0;

      for (const reservation of reservations || []) {
        // Get or create folio for this reservation
        let { data: folio } = await supabase
          .from('folios')
          .select('id, subtotal, tax_amount, total_amount, balance')
          .eq('reservation_id', reservation.id)
          .eq('status', 'open')
          .maybeSingle();

        if (!folio) {
          // Create folio if doesn't exist
          const { data: property } = await supabase
            .from('properties')
            .select('code')
            .eq('id', currentProperty.id)
            .single();

          const { data: newFolio, error: folioError } = await supabase
            .from('folios')
            .insert({
              tenant_id: tenant.id,
              property_id: currentProperty.id,
              guest_id: reservation.guest_id,
              reservation_id: reservation.id,
              folio_number: `F-${property?.code || 'PROP'}-${Date.now()}`,
            })
            .select('id, subtotal, tax_amount, total_amount, balance')
            .single();

          if (folioError) throw folioError;
          folio = newFolio;
        }

        // Post room charges for each room in the reservation
        for (const resRoom of reservation.reservation_rooms || []) {
          const roomRate = Number(resRoom.rate_per_night);
          const taxAmount = roomRate * (taxRate / 100);
          const roomNumber = resRoom.room?.room_number || 'Unknown';

          // Check if charge already posted for this date
          const { data: existingCharge } = await supabase
            .from('folio_items')
            .select('id')
            .eq('folio_id', folio.id)
            .eq('item_type', 'room_charge')
            .eq('service_date', businessDate)
            .eq('reference_id', resRoom.id)
            .maybeSingle();

          if (!existingCharge) {
            const { error: chargeError } = await supabase
              .from('folio_items')
              .insert({
                tenant_id: tenant.id,
                folio_id: folio.id,
                item_type: 'room_charge',
                description: `Room ${roomNumber} - Night of ${businessDate}`,
                unit_price: roomRate,
                quantity: 1,
                total_price: roomRate,
                tax_amount: taxAmount,
                service_date: businessDate,
                reference_id: resRoom.id,
                reference_type: 'reservation_room',
              });

            if (chargeError) throw chargeError;

            chargesPosted++;
            totalRevenue += roomRate + taxAmount;

            // Update folio totals
            await supabase
              .from('folios')
              .update({
                subtotal: folio.subtotal + roomRate,
                tax_amount: folio.tax_amount + taxAmount,
                total_amount: folio.total_amount + roomRate + taxAmount,
                balance: folio.balance + roomRate + taxAmount,
              })
              .eq('id', folio.id);
          }
        }
      }

      return { chargesPosted, totalRevenue };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['folios'] });
      queryClient.invalidateQueries({ queryKey: ['folio-items'] });
      refetchStats();
      toast({
        title: 'Room Charges Posted',
        description: `Posted ${data.chargesPosted} room charges totaling $${data.totalRevenue.toFixed(2)}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Posting Room Charges',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Complete night audit
  const completeAudit = useMutation({
    mutationFn: async (notes?: string) => {
      if (!currentProperty?.id || !tenant?.id || !currentAudit?.id) {
        throw new Error('No active audit to complete');
      }

      const stats = auditStats || {
        totalRooms: 0,
        occupiedRooms: 0,
        occupancyRate: 0,
        roomRevenue: 0,
        fbRevenue: 0,
        otherRevenue: 0,
        totalPayments: 0,
        adr: 0,
        revpar: 0,
        arrivalsToday: 0,
        departuresToday: 0,
        stayovers: 0,
        noShows: 0,
      };

      const { data, error } = await supabase
        .from('night_audits')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          rooms_charged: stats.occupiedRooms,
          total_room_revenue: stats.roomRevenue,
          total_fb_revenue: stats.fbRevenue,
          total_other_revenue: stats.otherRevenue,
          total_payments: stats.totalPayments,
          occupancy_rate: stats.occupancyRate,
          adr: stats.adr,
          revpar: stats.revpar,
          report_data: {
            arrivals: stats.arrivalsToday,
            departures: stats.departuresToday,
            stayovers: stats.stayovers,
            noShows: stats.noShows,
            totalRooms: stats.totalRooms,
            vacantRooms: stats.totalRooms - stats.occupiedRooms,
          },
          notes,
        })
        .eq('id', currentAudit.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['night-audit-current'] });
      queryClient.invalidateQueries({ queryKey: ['night-audits'] });
      toast({
        title: 'Night Audit Completed',
        description: 'The business day has been closed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Completing Audit',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    // Data
    auditHistory,
    currentAudit,
    preAuditData,
    auditStats,
    businessDate: getBusinessDate(),

    // Loading states
    isLoading: isLoadingHistory || isLoadingCurrent || isLoadingPreAudit || isLoadingStats,
    isLoadingHistory,
    isLoadingCurrent,
    isLoadingPreAudit,
    isLoadingStats,

    // Actions
    startAudit,
    postRoomCharges,
    completeAudit,
    refetchPreAudit,
    refetchStats,
  };
}
