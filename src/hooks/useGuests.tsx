import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Guest = Tables<"guests">;

export type GuestInsert = {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  id_type?: string;
  id_number?: string;
  nationality?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
};

export function useGuests(searchQuery?: string) {
  const { currentProperty, tenant } = useTenant();
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ["guests", tenantId, searchQuery],
    queryFn: async (): Promise<Guest[]> => {
      if (!tenantId) return [];

      let query = supabase
        .from("guests")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("last_name", { ascending: true });

      if (searchQuery && searchQuery.length > 0) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useMutation({
    mutationFn: async (guest: GuestInsert): Promise<Guest> => {
      if (!tenantId) throw new Error("No tenant selected");

      const { data, error } = await supabase
        .from("guests")
        .insert({
          ...guest,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", tenantId] });
      toast.success("Guest created successfully");
    },
    onError: (error) => {
      console.error("Error creating guest:", error);
      toast.error("Failed to create guest");
    },
  });
}
