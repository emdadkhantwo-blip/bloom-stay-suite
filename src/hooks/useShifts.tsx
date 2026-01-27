import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfDay } from "date-fns";

export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number | null;
  color: string | null;
  is_active: boolean;
  property_id: string | null;
}

export interface ShiftAssignment {
  id: string;
  profile_id: string;
  shift_id: string;
  date: string;
  status: string;
  notes: string | null;
  shift?: Shift;
}

export function useShifts(propertyId?: string) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const shiftsQuery = useQuery({
    queryKey: ["shifts", tenant?.id, propertyId],
    queryFn: async () => {
      if (!tenant?.id) return [];

      let query = supabase
        .from("hr_shifts")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("start_time");

      if (propertyId) {
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Shift[];
    },
    enabled: !!tenant?.id,
  });

  return {
    shifts: shiftsQuery.data || [],
    isLoading: shiftsQuery.isLoading,
  };
}

export function useStaffShiftAssignments(staffId: string, days: number = 7) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = startOfDay(new Date());
  const endDate = addDays(today, days);

  const assignmentsQuery = useQuery({
    queryKey: ["shift-assignments", staffId, days],
    queryFn: async () => {
      if (!tenant?.id || !staffId) return [];

      const { data, error } = await supabase
        .from("hr_shift_assignments")
        .select(`
          *,
          shift:hr_shifts(*)
        `)
        .eq("tenant_id", tenant.id)
        .eq("profile_id", staffId)
        .gte("date", format(today, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"))
        .order("date");

      if (error) throw error;
      return data as ShiftAssignment[];
    },
    enabled: !!tenant?.id && !!staffId,
  });

  const assignShiftMutation = useMutation({
    mutationFn: async ({
      shiftId,
      date,
    }: {
      shiftId: string;
      date: string;
    }) => {
      if (!tenant?.id) throw new Error("No tenant");

      const { data, error } = await supabase
        .from("hr_shift_assignments")
        .insert({
          tenant_id: tenant.id,
          profile_id: staffId,
          shift_id: shiftId,
          date,
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-assignments", staffId] });
      toast({
        title: "Shift Assigned",
        description: "Shift has been assigned successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeShiftMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("hr_shift_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-assignments", staffId] });
      toast({
        title: "Shift Removed",
        description: "Shift assignment has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    assignments: assignmentsQuery.data || [],
    isLoading: assignmentsQuery.isLoading,
    assignShift: assignShiftMutation.mutate,
    removeShift: removeShiftMutation.mutate,
    isAssigning: assignShiftMutation.isPending,
    isRemoving: removeShiftMutation.isPending,
  };
}
